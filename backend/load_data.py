import pandas as pd
import os
from pymongo import MongoClient
from datetime import datetime
import json


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


def load_data_to_mongodb():
    """Load real e-commerce data from CSV files into MongoDB"""

    db = get_database()
    data_dir = "data"

    print("🗄️ Loading data into MongoDB...")

    # Check if data directory exists
    if not os.path.exists(data_dir):
        print(f"❌ Data directory '{data_dir}' not found!")
        print("💡 Please ensure CSV files are in the 'backend/data/' directory")
        return False

    # Clear existing collections
    collections = [
        "products",
        "orders",
        "order_items",
        "users",
        "inventory_items",
        "distribution_centers",
    ]
    for collection_name in collections:
        db[collection_name].drop()
        print(f"🗑️ Cleared {collection_name} collection")

    # Load products
    print("📦 Loading products...")
    products_df = pd.read_csv(os.path.join(data_dir, "products.csv"))
    products_data = products_df.to_dict("records")

    # Convert to MongoDB format
    for product in products_data:
        product["_id"] = product["id"]  # Use original ID as MongoDB _id
        product["product_id"] = str(product["id"])

    db.products.insert_many(products_data)
    print(f"✅ Loaded {len(products_data)} products")

    # Load orders
    print("📋 Loading orders...")
    orders_df = pd.read_csv(os.path.join(data_dir, "orders.csv"))
    orders_data = orders_df.to_dict("records")

    for order in orders_data:
        order["_id"] = order["order_id"]  # Use order_id as MongoDB _id

    db.orders.insert_many(orders_data)
    print(f"✅ Loaded {len(orders_data)} orders")

    # Load order items
    print("📦 Loading order items...")
    order_items_df = pd.read_csv(os.path.join(data_dir, "order_items.csv"))
    order_items_data = order_items_df.to_dict("records")

    for item in order_items_data:
        item["_id"] = item["id"]  # Use original ID as MongoDB _id

    db.order_items.insert_many(order_items_data)
    print(f"✅ Loaded {len(order_items_data)} order items")

    # Load users
    print("👥 Loading users...")
    users_df = pd.read_csv(os.path.join(data_dir, "users.csv"))
    users_data = users_df.to_dict("records")

    for user in users_data:
        user["_id"] = user["id"]  # Use original ID as MongoDB _id
        user["user_id"] = str(user["id"])

    db.users.insert_many(users_data)
    print(f"✅ Loaded {len(users_data)} users")

    # Load distribution centers
    print("🏢 Loading distribution centers...")
    centers_df = pd.read_csv(os.path.join(data_dir, "distribution_centers.csv"))
    centers_data = centers_df.to_dict("records")

    for center in centers_data:
        center["_id"] = center["id"]  # Use original ID as MongoDB _id
        center["center_id"] = str(center["id"])

    db.distribution_centers.insert_many(centers_data)
    print(f"✅ Loaded {len(centers_data)} distribution centers")

    # Load inventory items (sample for performance)
    print("📦 Loading inventory items (sampling for performance)...")
    inventory_df = pd.read_csv(os.path.join(data_dir, "inventory_items.csv"))
    # Sample 10% of inventory items for performance
    inventory_sample = inventory_df.sample(frac=0.1, random_state=42)
    inventory_data = inventory_sample.to_dict("records")

    for item in inventory_data:
        item["_id"] = item["id"]  # Use original ID as MongoDB _id
        item["inventory_id"] = str(item["id"])
        item["product_id"] = str(item["product_id"])
        item["product_distribution_center_id"] = int(
            item["product_distribution_center_id"]
        )

    db.inventory_items.insert_many(inventory_data)
    print(f"✅ Loaded {len(inventory_data)} inventory items (sampled)")

    # Create indexes for better performance
    print("🔍 Creating indexes...")

    # Indexes for inventory items
    db.inventory_items.create_index("product_name")
    db.inventory_items.create_index("product_category")
    db.inventory_items.create_index("sold_at")
    db.inventory_items.create_index([("product_name", 1), ("sold_at", 1)])

    # Indexes for orders
    db.orders.create_index("order_id")
    db.orders.create_index("status")

    # Indexes for products
    db.products.create_index("product_id")
    db.products.create_index("category")

    # Indexes for users
    db.users.create_index("user_id")

    print("✅ Indexes created successfully!")

    # Print database statistics
    print("\n📊 Database Statistics:")
    print(f"Products: {db.products.count_documents({}):,}")
    print(f"Orders: {db.orders.count_documents({}):,}")
    print(f"Order Items: {db.order_items.count_documents({}):,}")
    print(f"Users: {db.users.count_documents({}):,}")
    print(f"Inventory Items: {db.inventory_items.count_documents({}):,}")
    print(f"Distribution Centers: {db.distribution_centers.count_documents({}):,}")

    print("\n🎉 MongoDB data loading completed successfully!")
    print("💡 You can now start the application with: python app.py")
    return True


if __name__ == "__main__":
    try:
        # Test MongoDB connection first
        client = get_mongodb_client()
        client.admin.command("ping")
        client.close()
        print("✅ MongoDB connection successful!")

        # Load data
        success = load_data_to_mongodb()

        if success:
            print("\n🚀 Data loading completed successfully!")
        else:
            print("\n❌ Data loading failed!")

    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Make sure MongoDB is running and accessible.")
        print("💡 You can set MONGODB_URI environment variable for custom connection.")
