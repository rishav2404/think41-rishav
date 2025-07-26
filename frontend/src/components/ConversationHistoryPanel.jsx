import React from 'react';
import { Plus, MessageCircle, Trash2, Calendar } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const ConversationHistoryPanel = () => {
  const {
    conversations,
    activeConversationId,
    isSidebarOpen,
    loadConversationMessages,
    createNewConversation,
    deleteConversation,
  } = useChatContext();

  const handleConversationClick = (conversationId) => {
    loadConversationMessages(conversationId);
  };

  const handleDeleteClick = (e, conversationId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversationId);
    }
  };

  return (
    <div className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 ${
      isSidebarOpen ? 'w-80' : 'w-0'
    } overflow-hidden`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Start a new conversation to begin
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Recent Conversations
              </div>
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    activeConversationId === conversation._id
                      ? 'bg-blue-100 border border-blue-200 shadow-sm'
                      : 'hover:bg-gray-100 hover:shadow-sm'
                  }`}
                  onClick={() => handleConversationClick(conversation._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Conversation Title */}
                      <h3 className={`text-sm font-medium truncate mb-1 ${
                        activeConversationId === conversation._id
                          ? 'text-blue-900'
                          : 'text-gray-900'
                      }`}>
                        {conversation.title}
                      </h3>
                      
                      {/* Last Message Preview */}
                      {conversation.last_message && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {conversation.last_message.type === 'user' ? 'You: ' : 'Assistant: '}
                          {conversation.last_message.content}
                        </p>
                      )}
                      
                      {/* Metadata */}
                      <div className="flex items-center space-x-3 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(conversation.last_activity).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: new Date().getFullYear() !== new Date(conversation.last_activity).getFullYear() ? 'numeric' : undefined
                            })}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{conversation.message_count} messages</span>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteClick(e, conversation._id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all duration-200"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Active indicator */}
                  {activeConversationId === conversation._id && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="text-xs text-gray-500 text-center">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistoryPanel;
