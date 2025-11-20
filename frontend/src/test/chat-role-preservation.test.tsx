import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import { ChatMessage } from '@/types';

/**
 * Unit tests for chat message role preservation
 * Tests the transformation logic from backend messages to frontend ChatMessage objects
 */

// Simulate the transformation logic from ChatWindow.tsx
const transformMessages = (
  backendMessages: Array<{
    role: string;
    id: string;
    content: string;
    timestamp: string;
    userId?: string;
    sessionId?: string;
  }>,
  sessionId: string = 'test-session'
): ChatMessage[] => {
  return backendMessages
    .filter((msg) => {
      // Validate role field exists and is valid
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        console.error('Invalid message role:', msg);
        return false;
      }
      // Don't show system messages
      return msg.role !== 'system';
    })
    .map((msg): ChatMessage => ({
      id: msg.id,
      userId: msg.userId || null,
      sessionId: msg.sessionId || sessionId,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      timestamp: msg.timestamp,
    }));
};

describe('Chat Role Preservation - Unit Tests', () => {

  it('should maintain user role after transformation', () => {
    const backendMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date().toISOString(),
      },
    ];

    const transformed = transformMessages(backendMessages);

    expect(transformed).toHaveLength(1);
    expect(transformed[0].role).toBe('user');
    expect(transformed[0].content).toBe('Hello');
  });

  it('should maintain assistant role after transformation', () => {
    const backendMessages = [
      {
        id: '1',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date().toISOString(),
      },
    ];

    const transformed = transformMessages(backendMessages);

    expect(transformed).toHaveLength(1);
    expect(transformed[0].role).toBe('assistant');
    expect(transformed[0].content).toBe('Hi there!');
  });

  it('should filter out messages with invalid roles', () => {
    const backendMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Valid message',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'invalid-role',
        content: 'Invalid message',
        timestamp: new Date().toISOString(),
      },
      {
        id: '3',
        role: 'assistant',
        content: 'Another valid message',
        timestamp: new Date().toISOString(),
      },
    ];

    const transformed = transformMessages(backendMessages);

    expect(transformed).toHaveLength(2);
    expect(transformed[0].role).toBe('user');
    expect(transformed[1].role).toBe('assistant');
  });

  it('should result in initial message display when message array is empty', () => {
    const backendMessages: Array<{
      role: string;
      id: string;
      content: string;
      timestamp: string;
    }> = [];

    const transformed = transformMessages(backendMessages);

    expect(transformed).toHaveLength(0);
    // In the actual component, this would trigger showing INITIAL_MESSAGE
  });

  it('should filter out messages with missing role field', () => {
    const backendMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Valid message',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: '',
        content: 'Message with empty role',
        timestamp: new Date().toISOString(),
      },
    ];

    const transformed = transformMessages(backendMessages);

    expect(transformed).toHaveLength(1);
    expect(transformed[0].id).toBe('1');
  });

  it('should preserve all message properties during transformation', () => {
    const backendMessages = [
      {
        id: 'msg-123',
        role: 'user',
        content: 'Test message',
        timestamp: '2024-01-01T12:00:00.000Z',
        userId: 'user-456',
        sessionId: 'session-789',
      },
    ];

    const transformed = transformMessages(backendMessages);

    expect(transformed).toHaveLength(1);
    expect(transformed[0]).toEqual({
      id: 'msg-123',
      role: 'user',
      content: 'Test message',
      timestamp: '2024-01-01T12:00:00.000Z',
      userId: 'user-456',
      sessionId: 'session-789',
    });
  });

  it('should handle mixed valid and invalid messages', () => {
    const backendMessages = [
      {
        id: '1',
        role: 'user',
        content: 'User message',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        role: 'system',
        content: 'System message (should be filtered)',
        timestamp: new Date().toISOString(),
      },
      {
        id: '3',
        role: 'assistant',
        content: 'Assistant message',
        timestamp: new Date().toISOString(),
      },
      {
        id: '4',
        role: 'unknown',
        content: 'Unknown role (should be filtered)',
        timestamp: new Date().toISOString(),
      },
    ];

    const transformed = transformMessages(backendMessages);

    expect(transformed).toHaveLength(2);
    expect(transformed[0].role).toBe('user');
    expect(transformed[1].role).toBe('assistant');
  });
});

/**
 * Property-Based Tests for chat message role preservation
 * Feature: chat-history-role-preservation, Property 1: Role preservation during transformation
 * Validates: Requirements 1.1, 1.5
 */

describe('Chat Role Preservation - Property-Based Tests', () => {
  it('Property 1: Role preservation during transformation - for any message with valid role, role is preserved', () => {
    fc.assert(
      fc.property(
        fc
          .array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              role: fc.constantFrom('user' as const, 'assistant' as const, 'system' as const),
              content: fc.string({ minLength: 1, maxLength: 500 }),
              timestamp: fc
                .integer({ min: 1577836800000, max: 1924905600000 })
                .map((ms) => new Date(ms).toISOString()),
              userId: fc.oneof(fc.string({ minLength: 1 }), fc.constant(undefined)),
              sessionId: fc.oneof(fc.string({ minLength: 1 }), fc.constant(undefined)),
            }),
            { minLength: 1, maxLength: 50 }
          )
          .map((messages) => {
            // Ensure unique IDs by appending index
            return messages.map((msg, idx) => ({
              ...msg,
              id: `${msg.id}-${idx}`,
            }));
          }),
        (backendMessages) => {
          // Transform messages using the same logic as ChatWindow
          const transformed = transformMessages(backendMessages, 'test-session');

          // For each transformed message, verify its role matches the original
          transformed.forEach((transformedMsg) => {
            const originalMsg = backendMessages.find((m) => m.id === transformedMsg.id);
            expect(originalMsg).toBeDefined();
            expect(transformedMsg.role).toBe(originalMsg!.role);
          });

          // Verify that only user and assistant messages are in the result
          transformed.forEach((msg) => {
            expect(['user', 'assistant']).toContain(msg.role);
          });

          // Verify system messages are filtered out
          const systemMessages = backendMessages.filter((m) => m.role === 'system');
          const transformedIds = transformed.map((m) => m.id);
          systemMessages.forEach((sysMsg) => {
            expect(transformedIds).not.toContain(sysMsg.id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
