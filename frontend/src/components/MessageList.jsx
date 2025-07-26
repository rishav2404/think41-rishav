import React, { useRef, useEffect } from 'react';
import Message from './Message';
import Loading from './Loading';
import WelcomeScreen from './WelcomeScreen';
import { useChatContext } from '../context/ChatContext';

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
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="p-4 space-y-6">
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
    </div>
  );
};

export default MessageList;