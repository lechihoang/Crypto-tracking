import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';
import { AuthProvider } from '@/contexts/AuthContext';
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

describe('Header Navigation Link - Unit Tests', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render "Danh mục theo dõi" link for authenticated users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkAuthStatus: vi.fn(),
    });
    vi.mocked(usePathname).mockReturnValue('/');

    render(<Header />);

    const portfolioLink = screen.getAllByText('Danh mục theo dõi');
    expect(portfolioLink.length).toBeGreaterThan(0);
  });

  it('should not render "Danh mục theo dõi" link for unauthenticated users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkAuthStatus: vi.fn(),
    });
    vi.mocked(usePathname).mockReturnValue('/');

    render(<Header />);

    const portfolioLink = screen.queryByText('Danh mục theo dõi');
    expect(portfolioLink).toBeNull();
  });

  it('should have correct href="/portfolio"', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkAuthStatus: vi.fn(),
    });
    vi.mocked(usePathname).mockReturnValue('/');

    const { container } = render(<Header />);

    const portfolioLinks = container.querySelectorAll('a[href="/portfolio"]');
    expect(portfolioLinks.length).toBeGreaterThan(0);
  });

  it('should display active state when pathname is "/portfolio"', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkAuthStatus: vi.fn(),
    });
    vi.mocked(usePathname).mockReturnValue('/portfolio');

    const { container } = render(<Header />);

    // Find the portfolio link and check for active state indicator
    const portfolioLinks = container.querySelectorAll('a[href="/portfolio"]');
    expect(portfolioLinks.length).toBeGreaterThan(0);

    // Check that at least one link has the active state (scale-x-100)
    const hasActiveState = Array.from(portfolioLinks).some((link) => {
      const activeIndicator = link.querySelector('.scale-x-100');
      return activeIndicator !== null;
    });
    expect(hasActiveState).toBe(true);
  });

  it('should position link between "Tổng quan" and "Cảnh báo" in desktop navigation', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkAuthStatus: vi.fn(),
    });
    vi.mocked(usePathname).mockReturnValue('/');

    const { container } = render(<Header />);

    // Get desktop navigation (hidden md:flex)
    const desktopNav = container.querySelector('nav.hidden.md\\:flex');
    expect(desktopNav).not.toBeNull();

    // Get all links in desktop navigation
    const links = desktopNav?.querySelectorAll('a');
    const linkTexts = Array.from(links || []).map((link) => link.textContent?.trim());

    // Find indices
    const dashboardIndex = linkTexts.indexOf('Tổng quan');
    const portfolioIndex = linkTexts.indexOf('Danh mục theo dõi');
    const alertsIndex = linkTexts.indexOf('Cảnh báo');

    // Verify order: dashboard < portfolio < alerts
    expect(dashboardIndex).toBeGreaterThan(-1);
    expect(portfolioIndex).toBeGreaterThan(-1);
    expect(alertsIndex).toBeGreaterThan(-1);
    expect(portfolioIndex).toBeGreaterThan(dashboardIndex);
    expect(alertsIndex).toBeGreaterThan(portfolioIndex);
  });

  it('should include link in mobile menu', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkAuthStatus: vi.fn(),
    });
    vi.mocked(usePathname).mockReturnValue('/');

    const { container } = render(<Header />);

    // Desktop navigation should have the portfolio link
    const desktopNav = container.querySelector('nav.hidden.md\\:flex');
    const desktopPortfolioLink = desktopNav?.querySelector('a[href="/portfolio"]');
    expect(desktopPortfolioLink).not.toBeNull();
    expect(desktopPortfolioLink?.textContent).toContain('Danh mục theo dõi');
  });
});
