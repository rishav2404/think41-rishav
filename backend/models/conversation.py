from datetime import datetime
from pymongo import MongoClient, ASCENDING
from bson import ObjectId
import os


class ConversationManager:
    def __init__(self):
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
        self.client = MongoClient(mongodb_uri)
        self.db = self.client["ecommerce"]
        self._setup_collections()

    def _setup_collections(self):
        """Setup conversation collections with indexes"""
        # Conversations collection
        if "conversations" not in self.db.list_collection_names():
            self.db.create_collection("conversations")

        # Messages collection
        if "messages" not in self.db.list_collection_names():
            self.db.create_collection("messages")

        # Create indexes for better performance
        self.db.conversations.create_index([("user_id", ASCENDING)])
        self.db.conversations.create_index([("created_at", ASCENDING)])
        self.db.conversations.create_index([("last_activity", ASCENDING)])

        self.db.messages.create_index([("conversation_id", ASCENDING)])
        self.db.messages.create_index([("timestamp", ASCENDING)])
        self.db.messages.create_index(
            [("conversation_id", ASCENDING), ("timestamp", ASCENDING)]
        )

    def create_conversation(self, user_id, title=None):
        """Create a new conversation session"""
        conversation = {
            "user_id": str(user_id),
            "title": title
            or f"Conversation {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "message_count": 0,
            "status": "active",
        }

        result = self.db.conversations.insert_one(conversation)
        conversation["_id"] = result.inserted_id
        return conversation

    def add_message(self, conversation_id, message_type, content, metadata=None):
        """Add a message to a conversation"""
        message = {
            "conversation_id": (
                ObjectId(conversation_id)
                if isinstance(conversation_id, str)
                else conversation_id
            ),
            "type": message_type,  # 'user' or 'assistant'
            "content": content,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {},
        }

        # Insert message
        result = self.db.messages.insert_one(message)

        # Update conversation last activity and message count
        self.db.conversations.update_one(
            {
                "_id": (
                    ObjectId(conversation_id)
                    if isinstance(conversation_id, str)
                    else conversation_id
                )
            },
            {
                "$set": {"last_activity": datetime.utcnow()},
                "$inc": {"message_count": 1},
            },
        )

        message["_id"] = result.inserted_id
        return message

    def get_conversation(self, conversation_id):
        """Get a single conversation"""
        return self.db.conversations.find_one(
            {
                "_id": (
                    ObjectId(conversation_id)
                    if isinstance(conversation_id, str)
                    else conversation_id
                )
            }
        )

    def get_user_conversations(self, user_id, limit=20, skip=0):
        """Get all conversations for a user"""
        conversations = list(
            self.db.conversations.find({"user_id": str(user_id)})
            .sort("last_activity", -1)
            .skip(skip)
            .limit(limit)
        )

        # Add message preview for each conversation
        for conv in conversations:
            # Get last message
            last_message = self.db.messages.find_one(
                {"conversation_id": conv["_id"]}, sort=[("timestamp", -1)]
            )
            if last_message:
                conv["last_message"] = {
                    "type": last_message["type"],
                    "content": (
                        last_message["content"][:100] + "..."
                        if len(last_message["content"]) > 100
                        else last_message["content"]
                    ),
                    "timestamp": last_message["timestamp"],
                }

        return conversations

    def get_conversation_messages(self, conversation_id, limit=50, skip=0):
        """Get messages for a conversation"""
        messages = list(
            self.db.messages.find(
                {
                    "conversation_id": (
                        ObjectId(conversation_id)
                        if isinstance(conversation_id, str)
                        else conversation_id
                    )
                }
            )
            .sort("timestamp", 1)
            .skip(skip)
            .limit(limit)
        )
        return messages

    def delete_conversation(self, conversation_id):
        """Delete a conversation and all its messages"""
        conv_id = (
            ObjectId(conversation_id)
            if isinstance(conversation_id, str)
            else conversation_id
        )

        # Delete all messages
        self.db.messages.delete_many({"conversation_id": conv_id})

        # Delete conversation
        result = self.db.conversations.delete_one({"_id": conv_id})
        return result.deleted_count > 0

    def get_conversation_statistics(self, user_id):
        """Get statistics for a user's conversations"""
        pipeline = [
            {"$match": {"user_id": str(user_id)}},
            {
                "$group": {
                    "_id": None,
                    "total_conversations": {"$sum": 1},
                    "total_messages": {"$sum": "$message_count"},
                    "avg_messages_per_conversation": {"$avg": "$message_count"},
                    "first_conversation": {"$min": "$created_at"},
                    "last_conversation": {"$max": "$created_at"},
                }
            },
        ]

        result = list(self.db.conversations.aggregate(pipeline))
        return (
            result[0]
            if result
            else {
                "total_conversations": 0,
                "total_messages": 0,
                "avg_messages_per_conversation": 0,
            }
        )
