// import React from 'react';
// import { User, Bot } from 'lucide-react';

// const Message = ({ message }) => {
//   const isUser = message.type === 'user';
  
//   return (
//     <div className={`flex items-start space-x-3 animate-slide-up ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
//       {/* Avatar */}
//       <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
//         isUser ? 'bg-blue-500' : 'bg-gray-200'
//       }`}>
//         {isUser ? (
//           <User className="w-4 h-4 text-white" />
//         ) : (
//           <Bot className="w-4 h-4 text-gray-600" />
//         )}
//       </div>
      
//       {/* Message Content */}
//       <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
//         <div className="whitespace-pre-wrap text-sm leading-relaxed">
//           {message.content}
//         </div>
//         <div className={`text-xs mt-1 opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
//           {new Date(message.timestamp).toLocaleTimeString([], { 
//             hour: '2-digit', 
//             minute: '2-digit' 
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Message;


import React from 'react';
import { User, Bot } from 'lucide-react';

const Message = ({ message }) => {
  const isUser = message.type === 'user';
  
  return (
    <div className={`flex items-start space-x-3 animate-slide-up ${
      isUser ? 'flex-row-reverse space-x-reverse' : ''
    }`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-gray-200'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600" />
        )}
      </div>
      
      {/* Message Content */}
      <div className={`chat-bubble ${
        isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
      }`}>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        <div className={`text-xs mt-1 opacity-70 ${
          isUser ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default Message;