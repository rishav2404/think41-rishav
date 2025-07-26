import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const UserInput = () => {
  const [inputValue, setInputValue] = useState('');
  const { sendMessage, isLoading, isConnected } = useChatContext();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && isConnected) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    const target = e.target;
    target.style.height = '44px';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const quickSuggestions = [
    "What are the top 5 most sold products?",
    "How many Classic T-Shirts are left in stock?",
    "Show me products in the electronics category",
  ];

  const handleSuggestionClick = (suggestion) => {
    if (!isLoading && isConnected) {
      sendMessage(suggestion);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onInput={handleInput}
              placeholder="Ask me about products, orders, or stock levels..."
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              rows={1}
              disabled={isLoading || !isConnected}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || !isConnected}
            className="flex items-center justify-center w-11 h-11 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading || !isConnected}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserInput;
