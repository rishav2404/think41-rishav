import React from 'react';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

// const WelcomeScreen = () => {
//   const { sendMessage, isLoading } = useChatContext();

//   const exampleQuestions = [
//     "What are the top 5 most sold products?",
//     "How many Classic T-Shirts are left in stock?",
//     "Show me the status of order ID 12345",
//     "What products are available in the electronics category?"
//   ];

//   return (
//     <div className="w-full max-w-4xl mx-auto p-8">
//       <div className="text-center">
//         <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
//           <Bot className="w-8 h-8 text-white" />
//         </div>

//         <h1 className="text-3xl font-bold text-gray-900 mb-4">
//           Welcome to E-commerce Assistant
//         </h1>

//         <p className="text-lg text-gray-600 mb-8">
//           I'm here to help you with product information, order status, stock levels, and more!
//         </p>

//         {/* Quick Start Options */}
//         <div className="grid md:grid-cols-3 gap-4 mb-8">
//           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//             <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
//             <h3 className="font-semibold text-gray-900 mb-2">Product Search</h3>
//             <p className="text-sm text-gray-600">Find products, check availability, and get details</p>
//           </div>

//           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//             <Sparkles className="w-8 h-8 text-green-500 mx-auto mb-3" />
//             <h3 className="font-semibold text-gray-900 mb-2">Order Status</h3>
//             <p className="text-sm text-gray-600">Track your orders and get shipping updates</p>
//           </div>

//           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//             <Bot className="w-8 h-8 text-purple-500 mx-auto mb-3" />
//             <h3 className="font-semibold text-gray-900 mb-2">Smart Assistance</h3>
//             <p className="text-sm text-gray-600">Get personalized recommendations and help</p>
//           </div>
//         </div>

//         {/* Example Questions */}
//         <div className="bg-gray-50 rounded-lg p-6">
//           <h3 className="font-semibold text-gray-900 mb-4">Try asking me:</h3>
//           <div className="grid gap-2 max-w-2xl mx-auto">
//             {exampleQuestions.map((question, index) => (
//               <button
//                 key={index}
//                 onClick={() => sendMessage(question)}
//                 className="text-left px-4 py-3 text-sm text-gray-700 bg-white rounded-md hover:bg-gray-50 border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                 disabled={isLoading}
//               >
//                 "{question}"
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WelcomeScreen;

const WelcomeScreen = () => {
  const { sendMessage, isLoading } = useChatContext();

  const exampleQuestions = [
    "What are the top 5 most sold products?",
    "How many Classic T-Shirts are left in stock?",
    "Show me the status of order ID 12345",
    "What products are available in the electronics category?"
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center">
            {/* Header Section */}
            <div className="mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
                Welcome to E-commerce Assistant
              </h1>
              
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                I'm here to help you with product information, order status, stock levels, and more!
              </p>
            </div>

            {/* Quick Start Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 px-4">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Product Search</h3>
                <p className="text-xs sm:text-sm text-gray-600">Find products, check availability, and get details</p>
              </div>
              
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Order Status</h3>
                <p className="text-xs sm:text-sm text-gray-600">Track your orders and get shipping updates</p>
              </div>
              
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Smart Assistance</h3>
                <p className="text-xs sm:text-sm text-gray-600">Get personalized recommendations and help</p>
              </div>
            </div>

            {/* Example Questions */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mx-4 max-w-3xl mx-auto">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Try asking me:</h3>
              <div className="grid gap-2 sm:gap-3">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(question)}
                    className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 bg-white rounded-md hover:bg-gray-50 border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    "{question}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;