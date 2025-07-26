import React from 'react';
import { Plus, MessageCircle, Trash2, Calendar } from 'lucide-react';

const Sidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
}) => {
  return (
    <div className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 ${
      isOpen ? 'w-80' : 'w-0'
    } overflow-hidden`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onNewConversation}
            className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    activeConversationId === conversation._id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onSelectConversation(conversation._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.title}
                      </h3>
                      {conversation.last_message && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {conversation.last_message.content}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(conversation.last_activity).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{conversation.message_count} messages</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;