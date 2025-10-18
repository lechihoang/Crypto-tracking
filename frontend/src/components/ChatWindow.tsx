'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquarePlus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  content: 'Xin chào! Tôi là trợ lý crypto của bạn. Tôi có thể giúp bạn trả lời các câu hỏi về tiền điện tử, phân tích thị trường, mẹo giao dịch và nhiều hơn nữa. Bạn muốn biết điều gì?',
  sender: 'bot',
  timestamp: new Date(),
};

export default function ChatWindow() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
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

          if (response.data.messages && response.data.messages.length > 0) {
            const loadedMessages = response.data.messages
              .filter((msg: { sender: string; id: string; content: string; timestamp: string }) => msg.sender !== 'system') // Don't show system messages
              .map((msg: { sender: 'user' | 'bot'; id: string; content: string; timestamp: string }) => ({
                id: msg.id,
                content: msg.content,
                sender: msg.sender,
                timestamp: new Date(msg.timestamp),
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
          console.error('Failed to load chat history:', error);
          // Don't show error to user, just use initial message
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

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
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

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.message,
        sender: 'bot',
        timestamp: new Date(response.data.timestamp),
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
      console.error('Chat error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again later or make sure you have set up your Groq API key.',
        sender: 'bot',
        timestamp: new Date(),
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
        console.error('Failed to clear chat history:', error);
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
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  if (isLoadingHistory || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Conversation button */}
      <div className="border-b border-gray-200 p-3 bg-white flex items-center justify-end">
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Tạo cuộc trò chuyện mới"
        >
          <MessageSquarePlus size={16} />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-2 max-w-[80%] ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}
              >
                {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-lg px-3 py-2 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
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
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
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
              <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about crypto..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
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