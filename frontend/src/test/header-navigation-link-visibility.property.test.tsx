import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import Header from '@/components/Header';
import { User } from '@/types';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock NotificationDropdown component
vi.mock('@/components/NotificationDropdown', () => ({
  default: () => <div data-testid="notification-dropdown">Notifications</div>,
}));

const { useAuth } = await import('@/contexts/AuthContext');
const { usePathname } = await import('next/navigation');

/**
 * Property-Based Tests for Header Navigation Link Visibility
 * Feature: watchlist-feature, Property 1: Navigation link visibility for authenticated users
 * Feature: watchlist-feature, Property 2: Navigation link hidden for unauthenticated users
 * Validates: Requirements 1.1, 1.4
 */

describe('Header Navigation Link Visibility - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Property 1: Navigation link visibility for authenticated users - for any authenticated user, the link should be visible', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        (user: User) => {
          // Mock authenticated state
          vi.mocked(useAuth).mockReturnValue({
            user,
            loading: false,
            isAuthenticated: true,
            signIn: vi.fn(),
            signOut: vi.fn(),
            checkAuthStatus: vi.fn(),
          });
          vi.mocked(usePathname).mockReturnValue('/');

          const { unmount } = render(<Header />);

          // For any authenticated user, the "Danh mục theo dõi" link should be visible
          const portfolioLink = screen.queryAllByText('Danh mục theo dõi');
          expect(portfolioLink.length).toBeGreaterThan(0);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2: Navigation link hidden for unauthenticated users - for any unauthenticated state, the link should not be visible', () => {
    fc.assert(
      fc.property(fc.boolean(), (loading) => {
        // Mock unauthenticated state
        vi.mocked(useAuth).mockReturnValue({
          user: null,
          loading,
          isAuthenticated: false,
          signIn: vi.fn(),
          signOut: vi.fn(),
          checkAuthStatus: vi.fn(),
        });
        vi.mocked(usePathname).mockReturnValue('/');

        const { unmount } = render(<Header />);

        // For any unauthenticated user, the "Danh mục theo dõi" link should not be visible
        const portfolioLink = screen.queryByText('Danh mục theo dõi');
        expect(portfolioLink).toBeNull();

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
