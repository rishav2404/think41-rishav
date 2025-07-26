import React from 'react';
import MessageList from './MessageList';
import UserInput from './UserInput';
import ConversationHistoryPanel from './ConversationHistoryPanel';
import Header from './Header';
import { useChatContext } from '../context/ChatContext';
import { AlertCircle } from 'lucide-react';

const ChatWindow = () => {
  const { 
    error, 
    dismissError, 
    isConnected, 
    isSidebarOpen, 
    toggleSidebar 
  } = useChatContext();

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Conversation History Panel */}
      <ConversationHistoryPanel />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header 
          onToggleSidebar={toggleSidebar}
          isConnected={isConnected}
        />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={dismissError}
              className="text-red-700 hover:text-red-900 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Message List */}
        <MessageList />

        {/* User Input */}
        <UserInput />
      </div>
    </div>
  );
};

export default ChatWindow;