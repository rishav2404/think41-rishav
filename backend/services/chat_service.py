import os
import json
import re
from groq import Groq
from datetime import datetime
from pymongo import MongoClient


class ChatbotService:
    def __init__(self, collections, conversation_manager):
        self.collections = collections
        self.conversation_manager = conversation_manager
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
    def process_query(self, query, conversation_id=None):
        """Process user query with LLM and database integration"""
        
        # Get conversation context if available
        context = self._get_conversation_context(conversation_id) if conversation_id else ""
        
        # First, let the LLM understand the query and determine what data is needed
        analysis_response = self._analyze_query_with_llm(query, context)
        
        # Based on LLM analysis, gather relevant data
        data_context = self._gather_relevant_data(analysis_response, query)
        
        # Generate final response with data context
        final_response = self._generate_response_with_data(query, data_context, context)
        
        return final_response
    
    def _get_conversation_context(self, conversation_id):
        """Get recent conversation history for context"""
        if not conversation_id:
            return ""
            
        try:
            messages = self.conversation_manager.get_conversation_messages(conversation_id, limit=6)
            context = "Previous conversation:\n"
            for msg in messages[-6:]:  # Last 6 messages for context
                role = "User" if msg["type"] == "user" else "Assistant"
                context += f"{role}: {msg['content']}\n"
            return context
        except:
            return ""
    
    def _analyze_query_with_llm(self, query, context=""):
        """Use LLM to analyze what the user is asking for"""
        system_prompt = """You are an e-commerce customer support analyst. Analyze the user's query and determine:
1. What type of information they need (product info, order status, stock levels, categories, etc.)
2. What specific data should be retrieved from the database
3. If the query is unclear, what clarifying questions to ask

Respond in JSON format with these fields:
- "query_type": type of query (product_search, stock_check, order_status, category_browse, top_products, unclear)
- "data_needed": specific data to retrieve
- "clarifying_questions": list of questions if query is unclear
- "search_terms": relevant search terms extracted from the query

E-commerce database contains: products, orders, inventory_items, users, distribution_centers"""

        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context: {context}\n\nUser Query: {query}"}
                ],
                model="llama3-8b-8192",
                temperature=0.1,
                max_tokens=500
            )
            
            # Try to parse JSON response
            try:
                return json.loads(response.choices[0].message.content)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "query_type": "unclear",
                    "data_needed": "general_help",
                    "clarifying_questions": ["Could you please clarify what specific information you're looking for?"],
                    "search_terms": []
                }
                
        except Exception as e:
            print(f"LLM Analysis Error: {e}")
            return {
                "query_type": "unclear", 
                "data_needed": "error",
                "clarifying_questions": ["I'm having trouble understanding your request. Could you please rephrase?"],
                "search_terms": []
            }
    
    def _gather_relevant_data(self, analysis, query):
        """Gather relevant data based on LLM analysis"""
        query_type = analysis.get("query_type", "unclear")
        search_terms = analysis.get("search_terms", [])
        
        if query_type == "product_search":
            return self._get_product_data(query, search_terms)
        elif query_type == "stock_check":
            return self._get_stock_data(query, search_terms)
        elif query_type == "order_status":
            return self._get_order_data(query)
        elif query_type == "top_products":
            return self._get_top_products_data()
        elif query_type == "category_browse":
            return self._get_category_data(query, search_terms)
        else:
            return {"type": "no_data", "content": "No specific data retrieved"}
    
    def _get_product_data(self, query, search_terms):
        """Get product information"""
        # Use search terms from LLM or fallback to original logic
        search_query = " ".join(search_terms) if search_terms else query
        
        pipeline = [
            {"$match": {"product_name": {"$regex": search_query, "$options": "i"}}},
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
        
        products = list(self.collections["inventory_items"].aggregate(pipeline))
        return {"type": "products", "content": products}
    
    def _get_stock_data(self, query, search_terms):
        """Get stock information"""
        # Extract product name from search terms or query
        product_name = " ".join(search_terms) if search_terms else self._extract_product_name_from_stock_query(query)
        
        pipeline = [
            {
                "$match": {
                    "product_name": {"$regex": product_name, "$options": "i"},
                    "sold_at": {"$exists": False},
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
            {"$limit": 3},
        ]
        
        stock_data = list(self.collections["inventory_items"].aggregate(pipeline))
        return {"type": "stock", "content": stock_data, "search_term": product_name}
    
    def _get_order_data(self, query):
        """Get order information"""
        order_id_match = re.search(r"(\d+)", query)
        
        if order_id_match:
            order_id = order_id_match.group(1)
            order = self.collections["orders"].find_one({"order_id": order_id})
            return {"type": "order", "content": order, "order_id": order_id}
        
        return {"type": "order", "content": None, "order_id": None}
    
    def _get_top_products_data(self):
        """Get top selling products"""
        pipeline = [
            {"$match": {"sold_at": {"$exists": True, "$ne": None}}},
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
        
        top_products = list(self.collections["inventory_items"].aggregate(pipeline))
        return {"type": "top_products", "content": top_products}
    
    def _get_category_data(self, query, search_terms):
        """Get category information"""
        category = " ".join(search_terms) if search_terms else self._extract_category_from_query(query)
        
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
        return {"type": "category", "content": products, "category": category}
    
    def _generate_response_with_data(self, query, data_context, conversation_context=""):
        """Generate final response using LLM with retrieved data"""
        
        # Prepare data context for LLM
        data_summary = self._format_data_for_llm(data_context)
        
        system_prompt = """You are a helpful e-commerce customer support chatbot. Use the provided data to answer the user's question accurately and helpfully.

Guidelines:
- Be friendly and professional
- Use the data provided to give specific, accurate answers
- If data is not available, politely explain what you couldn't find
- Suggest alternatives when possible
- Keep responses concise but informative
- Include relevant details like prices, stock levels, etc.

Format responses clearly with bullet points or numbered lists when showing multiple items."""

        user_message = f"""
User Query: {query}

Available Data: {data_summary}

{f"Conversation Context: {conversation_context}" if conversation_context else ""}

Please provide a helpful response based on the available data."""

        try:
            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                model="llama3-8b-8192",
                temperature=0.3,
                max_tokens=800
            )
            
            return {
                "response": response.choices[0].message.content,
                "type": data_context.get("type", "general"),
                "data": data_context.get("content") if data_context.get("type") != "no_data" else None
            }
            
        except Exception as e:
            print(f"LLM Response Generation Error: {e}")
            return {
                "response": "I apologize, but I'm having trouble processing your request right now. Please try again or contact support if the problem persists.",
                "type": "error"
            }
    
    def _format_data_for_llm(self, data_context):
        """Format retrieved data for LLM consumption"""
        data_type = data_context.get("type")
        content = data_context.get("content")
        
        if data_type == "products" and content:
            formatted = "Product Information:\n"
            for item in content:
                product = item["_id"]
                formatted += f"- {product['product_name']} by {product['product_brand']}: ${product['product_retail_price']:.2f} (Available: {item['available_stock']})\n"
            return formatted
            
        elif data_type == "stock" and content:
            formatted = f"Stock Information for '{data_context.get('search_term', 'searched product')}':\n"
            for item in content:
                product = item["_id"]
                formatted += f"- {product['product_name']} by {product['product_brand']}: {item['stock_count']} units in stock at ${product['product_retail_price']:.2f}\n"
            return formatted
            
        elif data_type == "order" and content:
            order = content
            formatted = f"Order Information for Order #{data_context.get('order_id')}:\n"
            formatted += f"- Status: {order['status']}\n"
            formatted += f"- Items: {order['num_of_item']}\n"
            formatted += f"- Created: {order['created_at']}\n"
            if order.get('shipped_at'):
                formatted += f"- Shipped: {order['shipped_at']}\n"
            if order.get('delivered_at'):
                formatted += f"- Delivered: {order['delivered_at']}\n"
            return formatted
            
        elif data_type == "top_products" and content:
            formatted = "Top Selling Products:\n"
            for i, item in enumerate(content, 1):
                product = item["_id"]
                formatted += f"{i}. {product['product_name']} by {product['product_brand']}: ${product['product_retail_price']:.2f} (Sold: {item['sold_count']} units)\n"
            return formatted
            
        elif data_type == "category" and content:
            formatted = f"Products in {data_context.get('category', 'selected')} category:\n"
            for item in content:
                product = item["_id"]
                formatted += f"- {product['product_name']} by {product['product_brand']}: ${product['product_retail_price']:.2f} (Available: {item['available_stock']})\n"
            return formatted
            
        elif data_type == "order" and not content:
            return f"No order found for Order ID: {data_context.get('order_id', 'N/A')}"
            
        else:
            return "No relevant data found for this query."
    
    # Helper methods for backward compatibility
    def _extract_product_name_from_stock_query(self, query):
        words = query.split()
        for i, word in enumerate(words):
            if word.lower() in ["stock", "left", "quantity"] and i > 0:
                return " ".join(words[:i])
        return query
    
    def _extract_category_from_query(self, query):
        category_match = re.search(
            r"(?:in|for|show)\s+(?:the\s+)?(\w+(?:\s+\w+)*?)(?:\s+category|department|products)",
            query,
            re.IGNORECASE,
        )
        return category_match.group(1) if category_match else query