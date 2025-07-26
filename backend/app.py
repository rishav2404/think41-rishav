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
from bson import ObjectId, json_util

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize conversation manager
conversation_manager = ConversationManager()


# MongoDB Connection
def get_mongodb_client():
    """Get MongoDB client connection"""
    # Use MongoDB Atlas or local MongoDB
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


# Chatbot Logic
class ChatbotService:
    def __init__(self):
        self.collections = get_collections()

    def process_query(self, query):
        query_lower = query.lower()

        # Handle product stock queries
        if "stock" in query_lower or "left" in query_lower:
            return self.handle_stock_query(query)

        # Handle order status queries
        elif "order" in query_lower and "status" in query_lower:
            return self.handle_order_status_query(query)

        # Handle top products queries
        elif "top" in query_lower and (
            "product" in query_lower or "sold" in query_lower
        ):
            return self.handle_top_products_query(query)

        # Handle general product queries
        elif "product" in query_lower:
            return self.handle_product_query(query)

        # Handle category queries
        elif "category" in query_lower or "department" in query_lower:
            return self.handle_category_query(query)

        else:
            return {
                "response": "I can help you with product information, order status, stock queries, and category searches. Please ask me about products, orders, stock levels, or categories.",
                "type": "general",
            }

    def handle_stock_query(self, query):
        # Extract product name from query
        words = query.split()
        product_name = None

        for i, word in enumerate(words):
            if word.lower() in ["stock", "left", "quantity"] and i > 0:
                product_name = " ".join(words[:i])
                break

        if not product_name:
            return {
                "response": "Please specify which product you'd like to check stock for.",
                "type": "stock_query",
            }

        # Search for product in inventory (available stock)
        pipeline = [
            {
                "$match": {
                    "product_name": {"$regex": product_name, "$options": "i"},
                    "sold_at": {"$exists": False},  # Not sold = in stock
                }
            },
            {
                "$group": {
                    "_id": {
                        "product_name": "$product_name",
                        "product_brand": "$product_brand",
                        "product_retail_price": "$product_retail_price",
                    },
                    "stock_count": {"$sum": 1},
                }
            },
            {"$limit": 1},
        ]

        result = list(self.collections["inventory_items"].aggregate(pipeline))

        if result:
            product_data = result[0]["_id"]
            stock_count = result[0]["stock_count"]

            return {
                "response": f"{product_data['product_name']} ({product_data['product_brand']}) has {stock_count} units left in stock at ${product_data['product_retail_price']:.2f} each.",
                "type": "stock_response",
                "product": {
                    "name": product_data["product_name"],
                    "brand": product_data["product_brand"],
                    "stock": stock_count,
                    "price": product_data["product_retail_price"],
                },
            }
        else:
            return {
                "response": f"I couldn't find any stock for products matching '{product_name}'. Please check the product name and try again.",
                "type": "stock_response",
            }

    def handle_order_status_query(self, query):
        # Extract order ID from query
        order_id_match = re.search(r"order\s+(?:id\s+)?(\d+)", query, re.IGNORECASE)

        if order_id_match:
            order_id = order_id_match.group(1)
            order = self.collections["orders"].find_one({"order_id": order_id})

            if order:
                return {
                    "response": f"Order {order_id} status: {order['status']}. Items: {order['num_of_item']}, Created: {order['created_at']}",
                    "type": "order_status",
                    "order": {
                        "id": order["order_id"],
                        "status": order["status"],
                        "num_of_item": order["num_of_item"],
                        "created_at": order["created_at"],
                        "shipped_at": order.get("shipped_at"),
                        "delivered_at": order.get("delivered_at"),
                    },
                }
            else:
                return {
                    "response": f"Order {order_id} not found. Please check the order ID and try again.",
                    "type": "order_status",
                }
        else:
            return {
                "response": "Please provide an order ID to check the status.",
                "type": "order_status",
            }

    def handle_top_products_query(self, query):
        # Get top products by sales (completed orders)
        pipeline = [
            {"$match": {"sold_at": {"$exists": True, "$ne": None}}},  # Only sold items
            {
                "$group": {
                    "_id": {
                        "product_name": "$product_name",
                        "product_brand": "$product_brand",
                        "product_retail_price": "$product_retail_price",
                    },
                    "sold_count": {"$sum": 1},
                }
            },
            {"$sort": {"sold_count": -1}},
            {"$limit": 5},
        ]

        sold_products = list(self.collections["inventory_items"].aggregate(pipeline))

        if sold_products:
            response = "Top 5 most sold products:\n"
            for i, product in enumerate(sold_products, 1):
                product_data = product["_id"]
                response += f"{i}. {product_data['product_name']} ({product_data['product_brand']}) - ${product_data['product_retail_price']:.2f} (Sold: {product['sold_count']})\n"

            return {
                "response": response,
                "type": "top_products",
                "products": [
                    {
                        "name": p["_id"]["product_name"],
                        "brand": p["_id"]["product_brand"],
                        "price": p["_id"]["product_retail_price"],
                        "sold_count": p["sold_count"],
                    }
                    for p in sold_products
                ],
            }
        else:
            return {
                "response": "No sales data found in the database.",
                "type": "top_products",
            }

    def handle_product_query(self, query):
        # Search for products in inventory
        pipeline = [
            {"$match": {"product_name": {"$regex": query, "$options": "i"}}},
            {
                "$group": {
                    "_id": {
                        "product_name": "$product_name",
                        "product_brand": "$product_brand",
                        "product_retail_price": "$product_retail_price",
                        "product_category": "$product_category",
                    },
                    "total_items": {"$sum": 1},
                    "available_stock": {
                        "$sum": {"$cond": [{"$eq": ["$sold_at", None]}, 1, 0]}
                    },
                }
            },
            {"$limit": 5},
        ]

        inventory_items = list(self.collections["inventory_items"].aggregate(pipeline))

        if inventory_items:
            response = f"Found {len(inventory_items)} product(s):\n"
            for item in inventory_items:
                product_data = item["_id"]
                response += f"- {product_data['product_name']} ({product_data['product_brand']}): ${product_data['product_retail_price']:.2f} (Available: {item['available_stock']})\n"

            return {
                "response": response,
                "type": "product_search",
                "products": [
                    {
                        "name": item["_id"]["product_name"],
                        "brand": item["_id"]["product_brand"],
                        "price": item["_id"]["product_retail_price"],
                        "category": item["_id"]["product_category"],
                    }
                    for item in inventory_items
                ],
            }
        else:
            return {
                "response": f"No products found matching '{query}'.",
                "type": "product_search",
            }

    def handle_category_query(self, query):
        # Extract category from query
        category_match = re.search(
            r"(?:in|for|show)\s+(?:the\s+)?(\w+(?:\s+\w+)*?)(?:\s+category|department|products)",
            query,
            re.IGNORECASE,
        )

        if category_match:
            category = category_match.group(1)

            pipeline = [
                {"$match": {"product_category": {"$regex": category, "$options": "i"}}},
                {
                    "$group": {
                        "_id": {
                            "product_name": "$product_name",
                            "product_brand": "$product_brand",
                            "product_retail_price": "$product_retail_price",
                        },
                        "available_stock": {
                            "$sum": {"$cond": [{"$eq": ["$sold_at", None]}, 1, 0]}
                        },
                    }
                },
                {"$limit": 10},
            ]

            products = list(self.collections["inventory_items"].aggregate(pipeline))

            if products:
                response = f"Products in {category} category:\n"
                for product in products:
                    product_data = product["_id"]
                    response += f"- {product_data['product_name']} ({product_data['product_brand']}): ${product_data['product_retail_price']:.2f} (Available: {product['available_stock']})\n"

                return {
                    "response": response,
                    "type": "category_search",
                    "products": [
                        {
                            "name": p["_id"]["product_name"],
                            "brand": p["_id"]["product_brand"],
                            "price": p["_id"]["product_retail_price"],
                        }
                        for p in products
                    ],
                }
            else:
                return {
                    "response": f"No products found in the {category} category.",
                    "type": "category_search",
                }
        else:
            return {
                "response": "Please specify which category you'd like to browse.",
                "type": "category_search",
            }


# API Routes

@app.route("/api/chat", methods=["POST"])
def chat():
    """Main chat endpoint with conversation management"""
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
        
        # Get chatbot response
        chatbot = ChatbotService()
        response = chatbot.process_query(query)
        
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