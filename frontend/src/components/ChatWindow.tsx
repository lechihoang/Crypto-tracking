'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquarePlus } from 'lucide-react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const INITIAL_MESSAGE: ChatMessage = {
  id: '1',
  userId: null,
  sessionId: 'initial',
  content: 'Xin chào! Tôi là trợ lý crypto của bạn. Tôi có thể giúp bạn trả lời các câu hỏi về tiền điện tử, phân tích thị trường, mẹo giao dịch và nhiều hơn nữa. Bạn muốn biết điều gì?',
  role: 'assistant',
  timestamp: new Date().toISOString(),
};

export default function ChatWindow() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (user) {
        // For logged-in users, load from database
        try {
          setIsLoadingHistory(true);
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/history`, {
            params: { userId: user.id },
          });

          if (!response.data || !Array.isArray(response.data.messages)) {
            setMessages([INITIAL_MESSAGE]);
            setIsLoadingHistory(false);
            return;
          }

          if (response.data.messages.length > 0) {
            const loadedMessages = response.data.messages
              .filter((msg: { role: string; id: string; content: string; timestamp: string }) => {
                if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
                  return false;
                }
                return msg.role !== 'system';
              })
              .map((msg: { role: 'user' | 'assistant'; id: string; content: string; timestamp: string; userId?: string; sessionId?: string }): ChatMessage => ({
                id: msg.id,
                userId: msg.userId || null,
                sessionId: msg.sessionId || response.data.sessionId || 'loaded',
                content: msg.content,
                role: msg.role, // Explicitly preserve role
                timestamp: msg.timestamp,
              }));

            if (loadedMessages.length > 0) {
              setMessages(loadedMessages);

              // Set sessionId from response
              if (response.data.sessionId) {
                setSessionId(response.data.sessionId);
              }
            }
          }
        } catch (error) {
          setMessages([INITIAL_MESSAGE]);
        } finally {
          setIsLoadingHistory(false);
        }
      } else {
        // For guests, load sessionId from localStorage
        const savedSessionId = localStorage.getItem('chatSessionId');
        if (savedSessionId) {
          setSessionId(savedSessionId);
        }
      }
    };

    loadChatHistory();
  }, [user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: user?.id || null,
      sessionId: sessionId || 'new',
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const requestBody: {
        message: string;
        sessionId?: string;
        userId?: string;
      } = {
        message: userMessage.content,
        sessionId: sessionId || undefined,
      };

      // Add userId for logged-in users
      if (user) {
        requestBody.userId = user.id;
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/chat`, requestBody);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: null,
        sessionId: response.data.sessionId || sessionId || 'new',
        content: response.data.message,
        role: 'assistant',
        timestamp: response.data.timestamp,
      };

      setMessages(prev => [...prev, botMessage]);

      // Store session ID for conversation continuity
      if (response.data.sessionId) {
        const newSessionId = response.data.sessionId;
        setSessionId(newSessionId);

        // For guests, save sessionId to localStorage
        if (!user) {
          localStorage.setItem('chatSessionId', newSessionId);
        }
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: null,
        sessionId: sessionId || 'error',
        content: 'Sorry, I encountered an error. Please try again later or make sure you have set up your Groq API key.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleNewConversation = async () => {
    if (user) {
      // For logged-in users, clear history from database
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/history`, {
          params: { userId: user.id },
        });
      } catch (error) {
      }
    } else {
      // For guests, clear localStorage
      localStorage.removeItem('chatSessionId');
    }

    // Reset UI state
    setMessages([INITIAL_MESSAGE]);
    setSessionId('');
    setInputMessage('');
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting with HTML entities escaped
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');

    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['strong', 'em', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre'],
      ALLOWED_ATTR: [],
    });
  };

  if (isLoadingHistory || authLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-700">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Conversation button */}
      <div className="border-b border-gray-700/40 p-3 bg-dark-600/50 flex items-center justify-end">
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors border border-primary-500/40"
          title="Tạo cuộc trò chuyện mới"
        >
          <MessageSquarePlus size={16} />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-dark-800">
        <div className="p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-2 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-600 text-gray-300 border border-gray-700/40'
                }`}
              >
                {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* ChatMessage Bubble */}
              <div
                className={`rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-600 text-gray-200 border border-gray-700/40'
                }`}
              >
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message.content),
                  }}
                />
                <div
                  className={`text-xs mt-1 opacity-70 ${
                    message.role === 'user' ? 'text-primary-100' : 'text-gray-400'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-dark-600 text-gray-300 flex items-center justify-center flex-shrink-0 border border-gray-700/40">
                <Bot size={16} />
              </div>
              <div className="bg-dark-600 text-gray-200 border border-gray-700/40 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 size={16} className="animate-spin text-primary-500" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-700/40 p-4 bg-dark-600/50">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about crypto..."
            className="flex-1 border border-gray-700/40 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 bg-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 flex items-center justify-center transition-all"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}