import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, ShoppingBag, Package, TrendingUp } from 'lucide-react';

function App() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm your e-commerce customer support assistant. I can help you with:\n\n• Product information and stock levels\n• Order status and tracking\n• Top selling products\n\nHow can I assist you today?",
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/chat', {
                message: inputMessage
            });

            const botMessage = {
                id: Date.now() + 1,
                text: response.data.response,
                sender: 'bot',
                timestamp: new Date(),
                data: response.data
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "I'm sorry, I'm having trouble connecting to the server. Please try again later.",
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const suggestedQuestions = [
        "What are the top 5 most sold products?",
        "Show me the status of order ID 12345",
        "How many Classic T-Shirts are left in stock?",
        "What products do you have in stock?",
        "Tell me about your products"
    ];

    const handleSuggestedQuestion = (question) => {
        setInputMessage(question);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-t-2xl shadow-lg border-b border-gray-200 p-6">
                        <div className="flex items-center space-x-3">
                            <div className="bg-primary-500 p-3 rounded-full">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">E-commerce Support Chatbot</h1>
                                <p className="text-gray-600">Your AI-powered customer service assistant</p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Container */}
                    <div className="bg-white shadow-lg rounded-b-2xl overflow-hidden">
                        {/* Messages Area */}
                        <div className="h-96 overflow-y-auto p-6 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.sender === 'user'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-start space-x-2">
                                            {message.sender === 'bot' && (
                                                <Bot className="h-5 w-5 text-primary-500 mt-1 flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <p className="whitespace-pre-wrap">{message.text}</p>
                                                {message.data && message.data.products && (
                                                    <div className="mt-3 space-y-2">
                                                        {message.data.products.map((product, index) => (
                                                            <div key={index} className="bg-white p-3 rounded-lg border">
                                                                <div className="flex items-center space-x-2">
                                                                    <ShoppingBag className="h-4 w-4 text-primary-500" />
                                                                    <span className="font-medium">{product.name}</span>
                                                                </div>
                                                                <div className="text-sm text-gray-600 mt-1">
                                                                    ${product.price} • Stock: {product.stock}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {message.data && message.data.order && (
                                                    <div className="mt-3 bg-white p-3 rounded-lg border">
                                                        <div className="flex items-center space-x-2">
                                                            <Package className="h-4 w-4 text-primary-500" />
                                                            <span className="font-medium">Order {message.data.order.id}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            Status: {message.data.order.status} • Total: ${message.data.order.total}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {message.sender === 'user' && (
                                                <User className="h-5 w-5 text-white mt-1 flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                            {message.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl">
                                        <div className="flex items-center space-x-2">
                                            <Bot className="h-5 w-5 text-primary-500" />
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggested Questions */}
                        <div className="border-t border-gray-200 p-4">
                            <div className="flex flex-wrap gap-2">
                                {suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestedQuestion(question)}
                                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-gray-200 p-4">
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <textarea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type your message here..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                        rows="1"
                                        style={{ minHeight: '48px', maxHeight: '120px' }}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || isLoading}
                                    className="px-6 py-3 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center text-gray-500 text-sm">
                        <p>Powered by AI • E-commerce Customer Support</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App; 