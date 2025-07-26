import React, { useRef, useEffect } from 'react';
import Message from './Message';
import Loading from './Loading';
import WelcomeScreen from './WelcomeScreen';
import { useChatContext } from '../context/ChatContext';

// const MessageList = () => {
//   const { messages, isLoading, activeConversationId } = useChatContext();
//   const messagesEndRef = useRef(null);

//   // Auto-scroll to bottom when new messages arrive
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Show welcome screen if no active conversation and no messages
//   const showWelcome = !activeConversationId && messages.length === 0;

//   if (showWelcome) {
//     return <WelcomeScreen />;
//   }

//   return (
//     <div className="flex-1 overflow-y-auto scrollbar-hide">
//       <div className="p-4 space-y-6">
//         {messages.map((message) => (
//           <Message key={message.id} message={message} />
//         ))}
        
//         {/* Loading indicator */}
//         {isLoading && (
//           <div className="flex justify-start">
//             <Loading />
//           </div>
//         )}
        
//         {/* Scroll anchor */}
//         <div ref={messagesEndRef} />
//       </div>
//     </div>
//   );
// };

// export default MessageList;



// const MessageList = () => {
//   const { messages, isLoading, activeConversationId } = useChatContext();
//   const messagesEndRef = useRef(null);

//   // Auto-scroll to bottom when new messages arrive
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Show welcome screen if no active conversation and no messages
//   const showWelcome = !activeConversationId && messages.length === 0;

//   if (showWelcome) {
//     return (
//       <div className="h-full flex items-center justify-center">
//         <WelcomeScreen />
//       </div>
//     );
//   }

//   return (
//     <div className="h-full flex flex-col">
//       {/* Messages container with scroll */}
//       <div className="flex-1 overflow-y-auto scrollbar-hide">
//         {messages.length === 0 ? (
//           // Empty state when conversation is selected but no messages
//           <div className="h-full flex items-center justify-center p-8">
//             <div className="text-center text-gray-500">
//               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                 </svg>
//               </div>
//               <p className="text-lg font-medium mb-2">No messages yet</p>
//               <p className="text-sm">Start a conversation by typing a message below</p>
//             </div>
//           </div>
//         ) : (
//           // Messages
//           <div className="p-4 space-y-6">
//             {messages.map((message) => (
//               <Message key={message.id} message={message} />
//             ))}
            
//             {/* Loading indicator */}
//             {isLoading && (
//               <div className="flex justify-start">
//                 <Loading />
//               </div>
//             )}
            
//             {/* Scroll anchor */}
//             <div ref={messagesEndRef} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessageList;

const MessageList = () => {
  const { messages, isLoading, activeConversationId } = useChatContext();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show welcome screen if no active conversation and no messages
  const showWelcome = !activeConversationId && messages.length === 0;

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages container with scroll */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {messages.length === 0 ? (
          // Empty state when conversation is selected but no messages
          <div className="h-full flex items-center justify-center p-4 sm:p-8">
            <div className="text-center text-gray-500 max-w-md mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-base sm:text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">Start a conversation by typing a message below</p>
            </div>
          </div>
        ) : (
          // Messages
          <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <Loading />
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;