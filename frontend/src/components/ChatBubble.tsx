'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle, X } from 'lucide-react';

// Lazy load ChatWindow
const ChatWindow = dynamic(() => import('./ChatWindow'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-800">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200/30 border-t-primary-500"></div>
    </div>
  ),
});

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Window - Toggle Display */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 md:right-6 z-50 w-80 md:w-96 h-[500px] bg-dark-800 rounded-lg shadow-2xl border border-gray-700/40 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-primary-500 text-white p-4 rounded-t-lg border-b border-gray-700/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold">Crypto Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-primary-600 rounded-full p-1 transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 md:right-6 z-50 w-14 h-14 ${
          isOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-primary-500 hover:bg-primary-600'
        } text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group`}
        aria-label={isOpen ? "Close crypto assistant chat" : "Open crypto assistant chat"}
        data-tooltip="Trò chuyện với chatbot"
      >
        {isOpen ? (
          <X size={24} className="group-hover:scale-110 transition-transform" />
        ) : (
          <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
        )}

        {/* Notification dot - only show when closed */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-danger-500 rounded-full animate-pulse"></div>
        )}
      </button>
    </>
  );
}