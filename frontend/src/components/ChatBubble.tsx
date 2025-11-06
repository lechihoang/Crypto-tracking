'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle, X, Minimize2 } from 'lucide-react';

// Lazy load ChatWindow
const ChatWindow = dynamic(() => import('./ChatWindow'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
});

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleChat = () => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true);
    } else if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-20 right-4 md:right-6 z-50 transition-all duration-300 ${
            isMinimized ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 md:w-96 h-96 md:h-[500px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="font-semibold">Crypto Assistant</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleChat}
                  className="hover:bg-blue-700 p-1 rounded"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  onClick={closeChat}
                  className="hover:bg-blue-700 p-1 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <ChatWindow />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-4 right-4 md:right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          isOpen && !isMinimized ? 'scale-90' : 'scale-100'
        }`}
        aria-label="Open crypto assistant chat"
        data-tooltip="Crypto chatbot"
      >
        {isOpen && !isMinimized ? (
          <Minimize2 size={24} className="group-hover:scale-110 transition-transform" />
        ) : (
          <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
        )}

        {/* Notification dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      </button>
    </>
  );
}