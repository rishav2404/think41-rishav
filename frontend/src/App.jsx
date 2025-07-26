import React from 'react';
import { ChatProvider } from './context/ChatContext';
import ChatWindow from './components/ChatWindow';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <ChatProvider>
        <ChatWindow />
      </ChatProvider>
    </ErrorBoundary>
  );
}

export default App;