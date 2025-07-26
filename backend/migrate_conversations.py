from models.conversation import ConversationManager

def setup_conversation_schema():
    """Setup conversation schema in MongoDB"""
    manager = ConversationManager()
    
    print("Setting up conversation schema...")
    
    # The indexes are created in the ConversationManager constructor
    print("✅ Conversation collections and indexes created")
    
    # Create some sample data for testing
    print("\nCreating sample conversation data...")
    
    # Create a test user conversation
    test_user_id = "test_user_123"
    
    # Create conversation
    conv = manager.create_conversation(test_user_id, "Sample E-commerce Support Chat")
    conv_id = conv["_id"]
    
    # Add sample messages
    manager.add_message(conv_id, "user", "What are the top 5 most sold products?")
    manager.add_message(conv_id, "assistant", "Here are the top 5 most sold products:\n1. Classic T-Shirt...", {
        "response_type": "top_products"
    })
    
    manager.add_message(conv_id, "user", "Show me the status of order ID 12345")
    manager.add_message(conv_id, "assistant", "Order 12345 status: Delivered", {
        "response_type": "order_status"
    })
    
    print(f"✅ Created sample conversation with ID: {conv_id}")
    
    # Print schema information
    print("\n📊 Database Schema Information:")
    print("\nConversations Collection Schema:")
    print({
        "_id": "ObjectId",
        "user_id": "string",
        "title": "string",
        "created_at": "datetime",
        "last_activity": "datetime",
        "message_count": "number",
        "status": "string"
    })
    
    print("\nMessages Collection Schema:")
    print({
        "_id": "ObjectId",
        "conversation_id": "ObjectId",
        "type": "string (user|assistant)",
        "content": "string",
        "timestamp": "datetime",
        "metadata": "object"
    })
    
    print("\n✅ Conversation schema setup complete!")

if __name__ == "__main__":
    setup_conversation_schema()