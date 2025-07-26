/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { chatApi } from '../services/api';

// localStorage keys
const STORAGE_KEYS = {
  ACTIVE_CONVERSATION_ID: 'ecommerce_chat_active_conversation_id',
  MESSAGES: 'ecommerce_chat_messages',
  SIDEBAR_STATE: 'ecommerce_chat_sidebar_open',
};

// Helper functions for localStorage
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
};

// Initial state with localStorage data
const getInitialState = () => {
  const savedConversationId = loadFromStorage(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
  const savedMessages = loadFromStorage(STORAGE_KEYS.MESSAGES, []);
  const savedSidebarState = loadFromStorage(STORAGE_KEYS.SIDEBAR_STATE, true);

  return {
    messages: savedMessages,
    conversations: [],
    activeConversationId: savedConversationId,
    isLoading: false,
    isSidebarOpen: savedSidebarState,
    isConnected: true,
    error: null,
    userInputValue: '',
  };
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
  const [state, dispatch] = useReducer(chatReducer, getInitialState());
  const userId = 'user'; // In a real app, this would come from authentication

  // Save state to localStorage when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, state.activeConversationId);
  }, [state.activeConversationId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MESSAGES, state.messages);
  }, [state.messages]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SIDEBAR_STATE, state.isSidebarOpen);
  }, [state.isSidebarOpen]);

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

      // Check if the saved active conversation still exists
      if (state.activeConversationId) {
        const activeConversationExists = conversations.some(
          conv => conv._id === state.activeConversationId
        );

        if (!activeConversationExists) {
          // Clear the active conversation if it no longer exists
          clearActiveConversation();
        }
      }
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
      // Clear invalid conversation from storage
      clearActiveConversation();
    }
  };

  // Validate and restore active conversation on app load
  const validateAndRestoreConversation = async () => {
    if (state.activeConversationId) {
      try {
        // Try to load the conversation to see if it still exists
        const { conversation, messages } = await chatApi.getConversationMessages(state.activeConversationId);

        if (conversation && messages) {
          // Update messages if they differ from localStorage (in case of updates from other tabs)
          if (JSON.stringify(messages) !== JSON.stringify(state.messages)) {
            dispatch({ type: ActionTypes.SET_MESSAGES, payload: messages });
          }
        }
      } catch (error) {
        console.warn('Saved conversation no longer exists, clearing...', error);
        clearActiveConversation();
      }
    }
  };

  // Clear active conversation and related data
  const clearActiveConversation = () => {
    dispatch({ type: ActionTypes.RESET_CHAT });
    removeFromStorage(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    removeFromStorage(STORAGE_KEYS.MESSAGES);
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
    clearActiveConversation();
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
    const initializeApp = async () => {
      await checkConnection();
      await loadConversations();
      // Validate saved conversation after loading conversations
      await validateAndRestoreConversation();
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    clearActiveConversation,
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

