import React from 'react';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const WelcomeScreen = () => {
  const { sendMessage, isLoading } = useChatContext();

  const exampleQuestions = [
    "What are the top 5 most sold products?",
    "How many Classic T-Shirts are left in stock?",
    "Show me the status of order ID 12345",
    "What products are available in the electronics category?"
  ];

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bot className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to E-commerce Assistant
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          I'm here to help you with product information, order status, stock levels, and more!
        </p>

        {/* Quick Start Options */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Product Search</h3>
            <p className="text-sm text-gray-600">Find products, check availability, and get details</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Sparkles className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Order Status</h3>
            <p className="text-sm text-gray-600">Track your orders and get shipping updates</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Bot className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Smart Assistance</h3>
            <p className="text-sm text-gray-600">Get personalized recommendations and help</p>
          </div>
        </div>

        {/* Example Questions */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Try asking me:</h3>
          <div className="space-y-2">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => sendMessage(question)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-md hover:bg-gray-50 border border-gray-200 transition-colors"
                disabled={isLoading}
              >
                "{question}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;