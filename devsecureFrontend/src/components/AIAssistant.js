import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

// Use production URL for Vercel deployment
const API_BASE = 'https://devsecure-1opt.onrender.com/api';

const AIAssistant = ({ organizationId }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your DevSecure AI Security Assistant. Ask me anything about security best practices, secret management, or how to fix security alerts!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        }]);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Network error. Please check your connection.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    'How should I store API keys securely?',
    'What makes a strong password?',
    'How to detect leaked secrets in GitHub?',
    'Best practices for JWT tokens',
    'How to rotate compromised credentials?'
  ];

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00d084, #00b4d8)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,208,132,0.3)',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          <line x1="9" y1="10" x2="15" y2="10"/>
          <line x1="12" y1="7" x2="12" y2="13"/>
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          width: '380px',
          height: '500px',
          background: '#1a1d24',
          borderRadius: '16px',
          border: '1px solid #2a2f3a',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 999,
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(0,208,132,0.1), rgba(0,180,216,0.05))',
            borderBottom: '1px solid #2a2f3a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e8edf2' }}>🤖 AI Security Assistant</h3>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6a7389' }}>
                Powered by OpenAI
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6a7389',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role === 'user' 
                    ? 'rgba(0,208,132,0.1)'
                    : '#0f1117',
                  border: msg.role === 'assistant' ? '1px solid #2a2f3a' : 'none',
                  color: '#e8edf2',
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '4px 16px 16px 16px',
                  background: '#0f1117',
                  border: '1px solid #2a2f3a',
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>●</span>
                    <span style={{ animation: 'pulse 1s infinite 0.2s' }}>●</span>
                    <span style={{ animation: 'pulse 1s infinite 0.4s' }}>●</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid #2a2f3a',
            background: '#0f1117',
          }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => sendMessage(), 100);
                  }}
                  style={{
                    padding: '4px 10px',
                    background: '#1a1d24',
                    border: '1px solid #2a2f3a',
                    borderRadius: '16px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    color: '#9aa3b8',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid #2a2f3a',
            display: 'flex',
            gap: '8px',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a security question..."
              rows="1"
              style={{
                flex: 1,
                padding: '10px',
                background: '#0f1117',
                border: '1px solid #2a2f3a',
                borderRadius: '8px',
                color: '#e8edf2',
                fontSize: '13px',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '0 16px',
                background: 'linear-gradient(135deg, #00d084, #00b4d8)',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default AIAssistant;