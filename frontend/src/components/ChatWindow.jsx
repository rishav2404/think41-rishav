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
    toggleSidebar
  } = useChatContext();

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Conversation History Panel */}
      <ConversationHistoryPanel />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0">
          <Header
            onToggleSidebar={toggleSidebar}
            isConnected={isConnected}
          />
        </div>

        {/* Error Banner - Fixed height when present */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{error}</span>
            </div>
            <button
              onClick={dismissError}
              className="text-red-700 hover:text-red-900 text-sm font-medium flex-shrink-0 ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Message List - Takes remaining space */}
        <div className="flex-1 min-h-0">
          <MessageList />
        </div>

        {/* User Input - Fixed at bottom */}
        <div className="flex-shrink-0">
          <UserInput />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

