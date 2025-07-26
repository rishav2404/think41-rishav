// import React, { useState, useEffect, useRef } from 'react';
// import { chatApi } from './services/api';
// import Header from './components/Header';
// import Sidebar from './components/Sidebar';
// import Message from './components/Message';
// import ChatInput from './components/ChatInput';
// import Loading from './components/Loading';
// import ErrorBoundary from './components/ErrorBoundary';
// import { AlertCircle, Bot, MessageCircle, Sparkles } from 'lucide-react';

// function App() {
//   const [messages, setMessages] = useState([]);
//   const [conversations, setConversations] = useState([]);
//   const [activeConversationId, setActiveConversationId] = useState(undefined);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [isConnected, setIsConnected] = useState(true);
//   const [error, setError] = useState(null);
//   const messagesEndRef = useRef(null);
//   const userId = 'user'; // In a real app, this would come from authentication

//   // Scroll to bottom when new messages arrive
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Load conversations on mount
//   useEffect(() => {
//     loadConversations();
//     checkConnection();
//   }, []);

//   const checkConnection = async () => {
//     try {
//       await chatApi.healthCheck();
//       setIsConnected(true);
//     } catch (error) {
//       setIsConnected(false);
//       console.error('Connection check failed:', error);
//     }
//   };

//   const loadConversations = async () => {
//     try {
//       const convs = await chatApi.getConversations(userId);
//       setConversations(convs);
//     } catch (error) {
//       console.error('Failed to load conversations:', error);
//       setError('Failed to load conversations');
//     }
//   };

//   const loadConversationMessages = async (conversationId) => {
//     try {
//       setError(null);
//       const { messages } = await chatApi.getConversationMessages(conversationId);
//       setMessages(messages);
//       setActiveConversationId(conversationId);
//     } catch (error) {
//       console.error('Failed to load messages:', error);
//       setError('Failed to load conversation messages');
//     }
//   };

//   const handleSendMessage = async (content) => {
//     if (!content.trim() || isLoading) return;

//     setError(null);
//     setIsLoading(true);

//     // Add user message immediately
//     const userMessage = {
//       id: Date.now().toString(),
//       type: 'user',
//       content,
//       timestamp: new Date().toISOString(),
//     };

//     setMessages(prev => [...prev, userMessage]);

//     try {
//       const response = await chatApi.sendMessage(content, userId, activeConversationId);
      
//       // Add assistant response
//       const assistantMessage = {
//         id: (Date.now() + 1).toString(),
//         type: 'assistant',
//         content: response.response,
//         timestamp: new Date().toISOString(),
//       };

//       setMessages(prev => [...prev, assistantMessage]);

//       // Update active conversation ID if it's a new conversation
//       if (!activeConversationId && response.conversation_id) {
//         setActiveConversationId(response.conversation_id);
//       }

//       // Reload conversations to update the sidebar
//       loadConversations();
//       setIsConnected(true);

//     } catch (error) {
//       console.error('Failed to send message:', error);
//       setError('Failed to send message. Please check your connection.');
//       setIsConnected(false);
      
//       // Remove the user message if sending failed
//       setMessages(prev => prev.slice(0, -1));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleNewConversation = () => {
//     setMessages([]);
//     setActiveConversationId(undefined);
//     setError(null);
//   };

//   const handleDeleteConversation = async (conversationId) => {
//     try {
//       await chatApi.deleteConversation(conversationId);
      
//       // If we're deleting the active conversation, start a new one
//       if (conversationId === activeConversationId) {
//         handleNewConversation();
//       }
      
//       // Reload conversations
//       loadConversations();
//     } catch (error) {
//       console.error('Failed to delete conversation:', error);
//       setError('Failed to delete conversation');
//     }
//   };

//   const handleToggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   const dismissError = () => {
//     setError(null);
//   };

//   // Welcome message when no conversation is active
//   const welcomeMessage = !activeConversationId && messages.length === 0;

//   return (
//     <ErrorBoundary>
//       <div className="h-screen flex bg-gray-50">
//         {/* Sidebar */}
//         <Sidebar
//           conversations={conversations}
//           activeConversationId={activeConversationId}
//           onSelectConversation={loadConversationMessages}
//           onNewConversation={handleNewConversation}
//           onDeleteConversation={handleDeleteConversation}
//           isOpen={isSidebarOpen}
//         />

//         {/* Main Chat Area */}
//         <div className="flex-1 flex flex-col">
//           {/* Header */}
//           <Header 
//             onToggleSidebar={handleToggleSidebar}
//             isConnected={isConnected}
//           />

//           {/* Error Banner */}
//           {error && (
//             <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
//               <div className="flex items-center space-x-2 text-red-700">
//                 <AlertCircle className="w-4 h-4" />
//                 <span className="text-sm">{error}</span>
//               </div>
//               <button
//                 onClick={dismissError}
//                 className="text-red-700 hover:text-red-900 text-sm font-medium"
//               >
//                 Dismiss
//               </button>
//             </div>
//           )}

//           {/* Messages Area */}
//           <div className="flex-1 overflow-y-auto scrollbar-hide">
//             {welcomeMessage ? (
//               // Welcome Screen
//               <div className="h-full flex items-center justify-center p-8">
//                 <div className="text-center max-w-2xl">
//                   <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
//                     <Bot className="w-8 h-8 text-white" />
//                   </div>
                  
//                   <h1 className="text-3xl font-bold text-gray-900 mb-4">
//                     Welcome to E-commerce Assistant
//                   </h1>
                  
//                   <p className="text-lg text-gray-600 mb-8">
//                     I'm here to help you with product information, order status, stock levels, and more!
//                   </p>

//                   {/* Quick Start Options */}
//                   <div className="grid md:grid-cols-3 gap-4 mb-8">
//                     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//                       <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
//                       <h3 className="font-semibold text-gray-900 mb-2">Product Search</h3>
//                       <p className="text-sm text-gray-600">Find products, check availability, and get details</p>
//                     </div>
                    
//                     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//                       <Sparkles className="w-8 h-8 text-green-500 mx-auto mb-3" />
//                       <h3 className="font-semibold text-gray-900 mb-2">Order Status</h3>
//                       <p className="text-sm text-gray-600">Track your orders and get shipping updates</p>
//                     </div>
                    
//                     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//                       <Bot className="w-8 h-8 text-purple-500 mx-auto mb-3" />
//                       <h3 className="font-semibold text-gray-900 mb-2">Smart Assistance</h3>
//                       <p className="text-sm text-gray-600">Get personalized recommendations and help</p>
//                     </div>
//                   </div>

//                   {/* Example Questions */}
//                   <div className="bg-gray-50 rounded-lg p-6">
//                     <h3 className="font-semibold text-gray-900 mb-4">Try asking me:</h3>
//                     <div className="space-y-2">
//                       {[
//                         "What are the top 5 most sold products?",
//                         "How many Classic T-Shirts are left in stock?",
//                         "Show me the status of order ID 12345",
//                         "What products are available in the electronics category?"
//                       ].map((question, index) => (
//                         <button
//                           key={index}
//                           onClick={() => handleSendMessage(question)}
//                           className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-md hover:bg-gray-50 border border-gray-200 transition-colors"
//                           disabled={isLoading}
//                         >
//                           "{question}"
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               // Chat Messages
//               <div className="p-4 space-y-6">
//                 {messages.map((message) => (
//                   <Message key={message.id} message={message} />
//                 ))}
                
//                 {/* Loading indicator */}
//                 {isLoading && (
//                   <div className="flex justify-start">
//                     <Loading />
//                   </div>
//                 )}
                
//                 {/* Scroll anchor */}
//                 <div ref={messagesEndRef} />
//               </div>
//             )}
//           </div>

//           {/* Chat Input */}
//           <ChatInput
//             onSendMessage={handleSendMessage}
//             disabled={isLoading || !isConnected}
//           />
//         </div>
//       </div>
//     </ErrorBoundary>
//   );
// }

// export default App;



import React from 'react';
import { ChatProvider } from './context/ChatContext';
import ChatWindow from './components/ChatWindow';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <ChatProvider>
        <ChatWindow />
      </ChatProvider>
    </ErrorBoundary>
  );
}

export default App;