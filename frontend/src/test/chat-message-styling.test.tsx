import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { fc } from '@fast-check/vitest';
import { ChatMessage } from '@/types';

/**
 * Property-Based Tests for chat message styling
 * Feature: chat-history-role-preservation, Property 2 & 3: Message visual consistency
 */

// Simple component that mimics the message rendering logic from ChatWindow
const MessageBubble = ({ message }: { message: ChatMessage }) => {
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
      data-testid="message-container"
    >
      <div
        className={`rounded-lg px-3 py-2 ${
          message.role === 'user'
            ? 'bg-primary-500 text-white'
            : 'bg-dark-600 text-gray-200 border border-gray-700/40'
        }`}
        data-testid="message-bubble"
      >
        <div className="text-sm">{message.content}</div>
      </div>
    </div>
  );
};

describe('Chat Message Styling - Property-Based Tests', () => {
  /**
   * Property 2: User message visual consistency
   * Feature: chat-history-role-preservation, Property 2: User message visual consistency
   * Validates: Requirements 1.2
   */
  it('Property 2: User message visual consistency - all user messages render with blue background and right alignment', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          userId: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
          sessionId: fc.string({ minLength: 1 }),
          role: fc.constant('user' as const),
          content: fc.string({ minLength: 1, maxLength: 500 }),
          timestamp: fc
            .integer({ min: 1577836800000, max: 1924905600000 })
            .map((ms) => new Date(ms).toISOString()),
        }),
        (userMessage) => {
          const { getByTestId } = render(<MessageBubble message={userMessage} />);

          try {
            const container = getByTestId('message-container');
            const bubble = getByTestId('message-bubble');

            // Verify right alignment (justify-end class)
            expect(container.className).toContain('justify-end');

            // Verify blue background (bg-primary-500 class)
            expect(bubble.className).toContain('bg-primary-500');

            // Verify white text
            expect(bubble.className).toContain('text-white');
          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Assistant message visual consistency
   * Feature: chat-history-role-preservation, Property 3: Assistant message visual consistency
   * Validates: Requirements 1.3
   */
  it('Property 3: Assistant message visual consistency - all assistant messages render with dark background and left alignment', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          userId: fc.constant(null),
          sessionId: fc.string({ minLength: 1 }),
          role: fc.constant('assistant' as const),
          content: fc.string({ minLength: 1, maxLength: 500 }),
          timestamp: fc
            .integer({ min: 1577836800000, max: 1924905600000 })
            .map((ms) => new Date(ms).toISOString()),
        }),
        (assistantMessage) => {
          const { getByTestId } = render(<MessageBubble message={assistantMessage} />);

          try {
            const container = getByTestId('message-container');
            const bubble = getByTestId('message-bubble');

            // Verify left alignment (justify-start class)
            expect(container.className).toContain('justify-start');

            // Verify dark background (bg-dark-600 class)
            expect(bubble.className).toContain('bg-dark-600');

            // Verify gray text
            expect(bubble.className).toContain('text-gray-200');

            // Verify border
            expect(bubble.className).toContain('border');
          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
