import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { chatApi } from '../services/api';

// Initial state
const initialState = {
  messages: [],
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  isSidebarOpen: true,
  isConnected: true,
  error: null,
  userInputValue: '',
};

// Action types
const ActionTypes = {
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  SET_ACTIVE_CONVERSATION: 'SET_ACTIVE_CONVERSATION',
  SET_LOADING: 'SET_LOADING',
  SET_SIDEBAR_OPEN: 'SET_SIDEBAR_OPEN',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_USER_INPUT: 'SET_USER_INPUT',
  RESET_CHAT: 'RESET_CHAT',
};

// Reducer function
const chatReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case ActionTypes.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, action.payload] };
    
    case ActionTypes.SET_CONVERSATIONS:
      return { ...state, conversations: action.payload };
    
    case ActionTypes.SET_ACTIVE_CONVERSATION:
      return { ...state, activeConversationId: action.payload };
    
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ActionTypes.SET_SIDEBAR_OPEN:
      return { ...state, isSidebarOpen: action.payload };
    
    case ActionTypes.SET_CONNECTED:
      return { ...state, isConnected: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ActionTypes.SET_USER_INPUT:
      return { ...state, userInputValue: action.payload };
    
    case ActionTypes.RESET_CHAT:
      return {
        ...state,
        messages: [],
        activeConversationId: null,
        error: null,
      };
    
    default:
      return state;
  }
};

// Create context
const ChatContext = createContext();

// Context provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const userId = 'user'; // In a real app, this would come from authentication

  // Check connection status
  const checkConnection = async () => {
    try {
      await chatApi.healthCheck();
      dispatch({ type: ActionTypes.SET_CONNECTED, payload: true });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_CONNECTED, payload: false });
      console.error('Connection check failed:', error);
    }
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const conversations = await chatApi.getConversations(userId);
      dispatch({ type: ActionTypes.SET_CONVERSATIONS, payload: conversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load conversations' });
    }
  };

  // Load conversation messages
  const loadConversationMessages = async (conversationId) => {
    try {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      const { messages } = await chatApi.getConversationMessages(conversationId);
      dispatch({ type: ActionTypes.SET_MESSAGES, payload: messages });
      dispatch({ type: ActionTypes.SET_ACTIVE_CONVERSATION, payload: conversationId });
    } catch (error) {
      console.error('Failed to load messages:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load conversation messages' });
    }
  };

  // Send message
  const sendMessage = async (content) => {
    if (!content.trim() || state.isLoading) return;

    dispatch({ type: ActionTypes.CLEAR_ERROR });
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });

    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: ActionTypes.ADD_MESSAGE, payload: userMessage });

    try {
      const response = await chatApi.sendMessage(content, userId, state.activeConversationId);
      
      // Add assistant response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: ActionTypes.ADD_MESSAGE, payload: assistantMessage });

      // Update active conversation ID if it's a new conversation
      if (!state.activeConversationId && response.conversation_id) {
        dispatch({ type: ActionTypes.SET_ACTIVE_CONVERSATION, payload: response.conversation_id });
      }

      // Reload conversations to update the sidebar
      loadConversations();
      dispatch({ type: ActionTypes.SET_CONNECTED, payload: true });

    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to send message. Please check your connection.' });
      dispatch({ type: ActionTypes.SET_CONNECTED, payload: false });
      
      // Remove the user message if sending failed
      dispatch({ type: ActionTypes.SET_MESSAGES, payload: state.messages.slice(0, -1) });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  // Create new conversation
  const createNewConversation = () => {
    dispatch({ type: ActionTypes.RESET_CHAT });
  };

  // Delete conversation
  const deleteConversation = async (conversationId) => {
    try {
      await chatApi.deleteConversation(conversationId);
      
      // If we're deleting the active conversation, start a new one
      if (conversationId === state.activeConversationId) {
        createNewConversation();
      }
      
      // Reload conversations
      loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to delete conversation' });
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    dispatch({ type: ActionTypes.SET_SIDEBAR_OPEN, payload: !state.isSidebarOpen });
  };

  // Dismiss error
  const dismissError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // Initialize on mount
  useEffect(() => {
    loadConversations();
    checkConnection();
  }, []);

  // Context value
  const value = {
    // State
    messages: state.messages,
    conversations: state.conversations,
    activeConversationId: state.activeConversationId,
    isLoading: state.isLoading,
    isSidebarOpen: state.isSidebarOpen,
    isConnected: state.isConnected,
    error: state.error,
    userInputValue: state.userInputValue,
    
    // Actions
    sendMessage,
    loadConversationMessages,
    createNewConversation,
    deleteConversation,
    toggleSidebar,
    dismissError,
    checkConnection,
    loadConversations,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};