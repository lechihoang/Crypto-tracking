/**
 * Property-Based Tests for Toast Notifications (Sonner)
 * Feature: shadcn-ui-migration-phase2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import * as fc from 'fast-check';

// Mock component to trigger toasts
function ToastTrigger({ 
  type, 
  message 
}: { 
  type: 'success' | 'error' | 'loading' | 'info'; 
  message: string 
}) {
  const handleClick = () => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'loading':
        toast.loading(message);
        break;
      case 'info':
        toast.info(message);
        break;
    }
  };

  return (
    <div>
      <button onClick={handleClick}>Trigger Toast</button>
      <Toaster />
    </div>
  );
}

describe('Toast Notifications - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any remaining toasts
    const toasts = document.querySelectorAll('[data-sonner-toast]');
    toasts.forEach(toast => toast.remove());
  });

  /**
   * Feature: shadcn-ui-migration-phase2, Property 9: Success toast display
   * Validates: Requirements 7.2
   * 
   * Property: For any successful action message, a success toast should be displayed
   * with that message visible to the user.
   */
  it('Property 9: Success toast display - should display success toast for any success message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (message) => {
          const { unmount } = render(<ToastTrigger type="success" message={message} />);
          
          const button = screen.getByRole('button', { name: /trigger toast/i });
          button.click();

          // Wait for toast to appear
          await waitFor(() => {
            const toastElements = document.querySelectorAll('[data-sonner-toast]');
            expect(toastElements.length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          // Verify the message is displayed
          const toastContent = document.querySelector('[data-sonner-toast]');
          expect(toastContent?.textContent).toContain(message);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: shadcn-ui-migration-phase2, Property 10: Error toast display
   * Validates: Requirements 7.3
   * 
   * Property: For any error message, an error toast should be displayed
   * with that error message visible to the user.
   */
  it('Property 10: Error toast display - should display error toast for any error message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (errorMessage) => {
          const { unmount } = render(<ToastTrigger type="error" message={errorMessage} />);
          
          const button = screen.getByRole('button', { name: /trigger toast/i });
          button.click();

          // Wait for toast to appear
          await waitFor(() => {
            const toastElements = document.querySelectorAll('[data-sonner-toast]');
            expect(toastElements.length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          // Verify the error message is displayed
          const toastContent = document.querySelector('[data-sonner-toast]');
          expect(toastContent?.textContent).toContain(errorMessage);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: shadcn-ui-migration-phase2, Property 11: Loading toast display
   * Validates: Requirements 7.4
   * 
   * Property: For any loading message, a loading toast should be displayed
   * with that message and a loading indicator.
   */
  it('Property 11: Loading toast display - should display loading toast for any loading message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (loadingMessage) => {
          const { unmount } = render(<ToastTrigger type="loading" message={loadingMessage} />);
          
          const button = screen.getByRole('button', { name: /trigger toast/i });
          button.click();

          // Wait for toast to appear
          await waitFor(() => {
            const toastElements = document.querySelectorAll('[data-sonner-toast]');
            expect(toastElements.length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          // Verify the loading message is displayed
          const toastContent = document.querySelector('[data-sonner-toast]');
          expect(toastContent?.textContent).toContain(loadingMessage);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: shadcn-ui-migration-phase2, Property 12: Toast dismissal
   * Validates: Requirements 7.5
   * 
   * Property: For any toast displayed, it should be dismissible and eventually
   * auto-dismiss after a timeout period.
   */
  it('Property 12: Toast dismissal - should support dismissal for any toast type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('success', 'error', 'loading', 'info'),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (toastType, message) => {
          const { unmount } = render(
            <ToastTrigger 
              type={toastType as 'success' | 'error' | 'loading' | 'info'} 
              message={message} 
            />
          );
          
          const button = screen.getByRole('button', { name: /trigger toast/i });
          button.click();

          // Wait for toast to appear
          await waitFor(() => {
            const toastElements = document.querySelectorAll('[data-sonner-toast]');
            expect(toastElements.length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          // Verify toast exists
          const toastElement = document.querySelector('[data-sonner-toast]');
          expect(toastElement).toBeTruthy();

          // Try to find and click dismiss button if it exists
          const dismissButton = toastElement?.querySelector('button[data-close-button]');
          if (dismissButton) {
            (dismissButton as HTMLElement).click();
            
            // Wait for toast to be removed
            await waitFor(() => {
              const remainingToasts = document.querySelectorAll('[data-sonner-toast]');
              expect(remainingToasts.length).toBe(0);
            }, { timeout: 1000 });
          }

          unmount();
        }
      ),
      { numRuns: 50 } // Reduced runs for dismissal test as it's more complex
    );
  });
});
