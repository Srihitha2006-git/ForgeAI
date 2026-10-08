import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';

const STARTER_PROMPTS = [
  'Help me explore the store.',
  'How can I track my order?',
  'What can I do on ForgeAI?'
];

const INITIAL_MESSAGE = {
  id: 'welcome-msg',
  sender: 'assistant',
  text: "Hi! I'm ForgeAI, your shopping assistant. How can I help you today?",
  time: formatCurrentTime()
};

function formatCurrentTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const messageIdCounter = useRef(1);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto-focus input when opened
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 150);
    }
  }, [messages, isLoading, isOpen]);

  // Handle escape key to close chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || input).trim();

    // Empty validation
    if (!messageText || isLoading) {
      return;
    }

    if (messageText.length > 1000) {
      setError('Message exceeds the 1,000 character limit.');
      return;
    }

    setError(null);
    setLastFailedMessage(null);

    const userMessage = {
      id: `user-msg-${messageIdCounter.current++}`,
      sender: 'user',
      text: messageText,
      time: formatCurrentTime()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await chatService.sendMessage(messageText, conversationId);

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage = {
        id: `reply-msg-${messageIdCounter.current++}`,
        sender: 'assistant',
        text: data.reply || "I'm here to help with any questions about ForgeAI!",
        time: formatCurrentTime()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      let displayError = 'Unable to get a response from ForgeAI Assistant.';

      if (err.response?.status === 503) {
        displayError = serverMsg || 'AI assistant service is currently unconfigured or unavailable.';
      } else if (err.response?.status === 429) {
        displayError = 'Too many requests. Please wait a moment before sending another message.';
      } else if (err.response?.status === 504) {
        displayError = 'AI service timed out. Please try again.';
      } else if (serverMsg) {
        displayError = serverMsg;
      }

      setError(displayError);
      setLastFailedMessage(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  const handlePromptClick = (prompt) => {
    if (isLoading) return;
    handleSendMessage(prompt);
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        time: formatCurrentTime()
      }
    ]);
    setConversationId(null);
    setError(null);
    setLastFailedMessage(null);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      {!isOpen && (
        <button
          className="chatbot-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Open ForgeAI Shopping Assistant Chat"
          title="Chat with ForgeAI Assistant"
        >
          <div className="chatbot-fab-pulse"></div>
          <svg className="chatbot-fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* AI sparkle/bot icon */}
            <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
            <rect x="4" y="6" width="16" height="12" rx="3" />
            <circle cx="9" cy="12" r="1.5" fill="currentColor" />
            <circle cx="15" cy="12" r="1.5" fill="currentColor" />
            <path d="M10 15h4" />
          </svg>
          <span className="chatbot-fab-label">Chat with AI</span>
        </button>
      )}

      {/* FLOATING CHAT PANEL */}
      {isOpen && (
        <div
          className="chatbot-window glass-panel"
          role="dialog"
          aria-label="ForgeAI Shopping Assistant"
          aria-modal="false"
        >
          {/* HEADER */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                  <rect x="4" y="6" width="16" height="12" rx="3" />
                  <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                  <path d="M10 15h4" />
                </svg>
              </div>
              <div className="chatbot-title-info">
                <div className="chatbot-title">
                  ForgeAI Assistant
                  <span className="chatbot-status-dot" title="Online"></span>
                </div>
                <div className="chatbot-subtitle">Your AI Shopping Guide</div>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                className="chatbot-action-btn"
                onClick={handleResetChat}
                title="Start New Conversation"
                aria-label="Start New Conversation"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>
              <button
                className="chatbot-action-btn"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                aria-label="Close Chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* MESSAGE STREAM */}
          <div className="chatbot-body" role="log" aria-live="polite">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-bubble-row ${msg.sender === 'user' ? 'user-row' : 'assistant-row'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="chatbot-bubble-avatar">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                )}
                <div className={`chatbot-bubble ${msg.sender === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
                  <p className="chatbot-bubble-text">{msg.text}</p>
                  <span className="chatbot-bubble-time">{msg.time}</span>
                </div>
              </div>
            ))}

            {/* STARTER PROMPTS (shown if only initial message is present) */}
            {messages.length === 1 && !isLoading && (
              <div className="chatbot-starter-container">
                <span className="chatbot-starter-label">Suggested questions:</span>
                <div className="chatbot-starter-chips">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      className="chatbot-starter-chip"
                      onClick={() => handlePromptClick(prompt)}
                      disabled={isLoading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* LOADING TYPING INDICATOR */}
            {isLoading && (
              <div className="chatbot-bubble-row assistant-row">
                <div className="chatbot-bubble-avatar">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <div className="chatbot-bubble assistant-bubble typing-indicator-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}

            {/* ERROR BANNER WITH RETRY */}
            {error && (
              <div className="chatbot-error-banner" role="alert">
                <div className="chatbot-error-text">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
                {lastFailedMessage && (
                  <button
                    className="chatbot-retry-btn"
                    onClick={handleRetry}
                    disabled={isLoading}
                    aria-label="Retry sending last message"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* FOOTER / INPUT FORM */}
          <form
            className="chatbot-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <div className="chatbot-input-wrapper">
              <textarea
                ref={inputRef}
                className="chatbot-input"
                rows={1}
                placeholder="Type your message..."
                value={input}
                maxLength={1000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                aria-label="Message to ForgeAI Assistant"
              />
              <button
                type="submit"
                className="chatbot-send-btn"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                title="Send message (Enter)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="chatbot-footer-caption">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {input.length > 800 && (
                <span className="chatbot-char-count">{input.length}/1000</span>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
