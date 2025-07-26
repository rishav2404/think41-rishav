from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import pandas as pd
import json
from pymongo import MongoClient
from datetime import datetime
import re
from models.conversation import ConversationManager
from services.chat_service import ChatbotService
from bson import ObjectId, json_util

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize conversation manager
conversation_manager = ConversationManager()


# MongoDB Connection
def get_mongodb_client():
    """Get MongoDB client connection"""
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    client = MongoClient(mongodb_uri)
    return client


def get_database():
    """Get ecommerce database"""
    client = get_mongodb_client()
    return client["ecommerce"]


# Database Collections
def get_collections():
    """Get all database collections"""
    db = get_database()
    return {
        "products": db.products,
        "orders": db.orders,
        "order_items": db.order_items,
        "users": db.users,
        "inventory_items": db.inventory_items,
        "distribution_centers": db.distribution_centers,
    }


# API Routes

@app.route("/api/chat", methods=["POST"])
def chat():
    """Main chat endpoint with LLM conversation management"""
    data = request.get_json()
    query = data.get("message", "")
    user_id = data.get("user_id", "anonymous")
    conversation_id = data.get("conversation_id")
    
    if not query:
        return jsonify({"error": "No message provided"}), 400
    
    try:
        # Create new conversation if not provided
        if not conversation_id:
            conversation = conversation_manager.create_conversation(user_id)
            conversation_id = str(conversation["_id"])
        
        # Save user message
        conversation_manager.add_message(
            conversation_id,
            "user",
            query,
            {"ip": request.remote_addr}
        )
        
        # Get LLM-powered chatbot response
        collections = get_collections()
        chatbot = ChatbotService(collections, conversation_manager)
        response = chatbot.process_query(query, conversation_id)
        
        # Save assistant response
        conversation_manager.add_message(
            conversation_id,
            "assistant",
            response["response"],
            {"response_type": response.get("type", "general")}
        )
        
        # Add conversation_id to response
        response["conversation_id"] = conversation_id
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": f"Chat processing failed: {str(e)}"}), 500


@app.route("/api/products", methods=["GET"])
def get_products():
    """Get available products from inventory"""
    try:
        # Get unique products from inventory
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "product_name": "$product_name",
                        "product_brand": "$product_brand",
                        "product_category": "$product_category",
                        "product_retail_price": "$product_retail_price",
                    },
                    "total_items": {"$sum": 1},
                    "available_stock": {
                        "$sum": {"$cond": [{"$eq": ["$sold_at", None]}, 1, 0]}
                    },
                }
            },
            {"$limit": 50},
        ]

        products = list(get_collections()["inventory_items"].aggregate(pipeline))

        return jsonify(
            [
                {
                    "name": p["_id"]["product_name"],
                    "brand": p["_id"]["product_brand"],
                    "category": p["_id"]["product_category"],
                    "price": p["_id"]["product_retail_price"],
                    "total_items": p["total_items"],
                    "available_stock": p["available_stock"],
                }
                for p in products
            ]
        )
    except Exception as e:
        return jsonify({"error": f"Failed to fetch products: {str(e)}"}), 500


@app.route("/api/orders", methods=["GET"])
def get_orders():
    """Get recent orders"""
    try:
        orders = list(get_collections()["orders"].find().limit(50))

        return jsonify(
            [
                {
                    "id": o["order_id"],
                    "user_id": o["user_id"],
                    "status": o["status"],
                    "gender": o["gender"],
                    "num_of_item": o["num_of_item"],
                    "created_at": o["created_at"],
                    "shipped_at": o.get("shipped_at"),
                    "delivered_at": o.get("delivered_at"),
                }
                for o in orders
            ]
        )
    except Exception as e:
        return jsonify({"error": f"Failed to fetch orders: {str(e)}"}), 500


# Conversation Management Endpoints

@app.route("/api/conversations", methods=["POST"])
def create_conversation():
    """Create a new conversation"""
    try:
        data = request.get_json()
        user_id = data.get("user_id", "anonymous")
        title = data.get("title")
        
        conversation = conversation_manager.create_conversation(user_id, title)
        
        # Convert ObjectId to string for JSON serialization
        conversation["_id"] = str(conversation["_id"])
        
        return jsonify(conversation)
    except Exception as e:
        return jsonify({"error": f"Failed to create conversation: {str(e)}"}), 500


@app.route("/api/conversations/<user_id>", methods=["GET"])
def get_user_conversations(user_id):
    """Get all conversations for a user"""
    try:
        limit = request.args.get("limit", 20, type=int)
        skip = request.args.get("skip", 0, type=int)
        
        conversations = conversation_manager.get_user_conversations(user_id, limit, skip)
        
        # Convert ObjectIds to strings
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
            if "last_message" in conv:
                conv["last_message"]["timestamp"] = conv["last_message"]["timestamp"].isoformat()
        
        return jsonify(conversations)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch conversations: {str(e)}"}), 500


@app.route("/api/conversations/<conversation_id>/messages", methods=["GET"])
def get_conversation_messages(conversation_id):
    """Get messages for a specific conversation"""
    try:
        limit = request.args.get("limit", 50, type=int)
        skip = request.args.get("skip", 0, type=int)
        
        # Get conversation details
        conversation = conversation_manager.get_conversation(conversation_id)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Get messages
        messages = conversation_manager.get_conversation_messages(conversation_id, limit, skip)
        
        # Convert ObjectIds to strings and format timestamps
        for msg in messages:
            msg["_id"] = str(msg["_id"])
            msg["conversation_id"] = str(msg["conversation_id"])
            msg["timestamp"] = msg["timestamp"].isoformat()
        
        conversation["_id"] = str(conversation["_id"])
        
        return jsonify({
            "conversation": conversation,
            "messages": messages
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch messages: {str(e)}"}), 500


@app.route("/api/conversations/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """Delete a conversation"""
    try:
        success = conversation_manager.delete_conversation(conversation_id)
        
        if success:
            return jsonify({"message": "Conversation deleted successfully"})
        else:
            return jsonify({"error": "Conversation not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to delete conversation: {str(e)}"}), 500


@app.route("/api/users/<user_id>/statistics", methods=["GET"])
def get_user_statistics(user_id):
    """Get conversation statistics for a user"""
    try:
        stats = conversation_manager.get_conversation_statistics(user_id)
        
        # Format dates
        if "first_conversation" in stats and stats["first_conversation"]:
            stats["first_conversation"] = stats["first_conversation"].isoformat()
        if "last_conversation" in stats and stats["last_conversation"]:
            stats["last_conversation"] = stats["last_conversation"].isoformat()
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch statistics: {str(e)}"}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        client = get_mongodb_client()
        client.admin.command("ping")
        return jsonify(
            {
                "status": "healthy",
                "message": "Chatbot API is running with MongoDB",
                "database": "MongoDB",
            }
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "message": f"MongoDB connection failed: {str(e)}",
                    "database": "MongoDB",
                }
            ),
            500,
        )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)