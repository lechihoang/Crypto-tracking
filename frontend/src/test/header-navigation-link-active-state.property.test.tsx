import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import Header from '@/components/Header';
import { User } from '@/types';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
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
 * Property-Based Tests for Header Navigation Link Active State
 * Feature: watchlist-feature, Property 4: Active state on portfolio page
 * Validates: Requirements 1.3
 */

describe('Header Navigation Link Active State - Property-Based Tests', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Always mock authenticated state for these tests
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkAuthStatus: vi.fn(),
    });
  });

  it('Property 4: Active state on portfolio page - for any pathname, active state should only appear when pathname is /portfolio', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/',
          '/compare',
          '/dashboard',
          '/portfolio',
          '/alerts',
          '/settings',
          '/auth/login',
          '/coin/bitcoin',
          '/random-path'
        ),
        (pathname) => {
          // Mock the pathname
          vi.mocked(usePathname).mockReturnValue(pathname);

          const { container, unmount } = render(<Header />);

          // Find all portfolio links
          const portfolioLinks = container.querySelectorAll('a[href="/portfolio"]');
          expect(portfolioLinks.length).toBeGreaterThan(0);

          // Check if any portfolio link has active state
          const hasActiveState = Array.from(portfolioLinks).some((link) => {
            const activeIndicator = link.querySelector('.scale-x-100');
            return activeIndicator !== null;
          });

          // Active state should only be present when pathname is '/portfolio'
          if (pathname === '/portfolio') {
            expect(hasActiveState).toBe(true);
          } else {
            expect(hasActiveState).toBe(false);
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
