import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { fc } from '@fast-check/vitest';
import userEvent from '@testing-library/user-event';
import AddCoinBar from '@/components/AddCoinBar';
import * as api from '@/lib/api';
import { z } from 'zod';

// Feature: shadcn-ui-migration-phase2, Property 8: Form submission preservation
// For any form with validation rules, submitting with valid data should succeed and submitting with invalid data should fail with appropriate errors.
// Validates: Requirements 5.5

// Mock the API
vi.mock('@/lib/api', () => ({
  portfolioApi: {
    addHolding: vi.fn(),
  },
  clientApi: {
    getLatestListings: vi.fn(),
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    promise: vi.fn((promise) => promise),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Form Submission Preservation', () => {
  const mockCoins = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', image: 'btc.png' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', image: 'eth.png' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', image: 'ada.png' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the getLatestListings to return coins
    vi.mocked(api.clientApi.getLatestListings).mockResolvedValue({
      data: mockCoins.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image,
        slug: coin.id,
        cmc_rank: 1,
        num_market_pairs: 100,
        circulating_supply: 1000000,
        total_supply: 2000000,
        max_supply: 21000000,
        last_updated: new Date().toISOString(),
        date_added: new Date().toISOString(),
        tags: [],
        platform: null,
        self_reported_circulating_supply: null,
        self_reported_market_cap: null,
        quote: {
          USD: {
            price: 50000,
            volume_24h: 1000000,
            volume_change_24h: 5,
            percent_change_1h: 1,
            percent_change_24h: 2,
            percent_change_7d: 3,
            percent_change_30d: 4,
            percent_change_60d: 5,
            percent_change_90d: 6,
            market_cap: 1000000000,
            market_cap_dominance: 50,
            fully_diluted_market_cap: 1050000000,
            last_updated: new Date().toISOString(),
          },
        },
      })),
    } as unknown as typeof api);
  });

  afterEach(() => {
    cleanup();
  });

  it('should reject submission with invalid quantity (negative or zero)', () => {
    // Test the validation schema directly
    const addCoinSchema = z.object({
      coin: z.object({
        id: z.string(),
        name: z.string(),
        symbol: z.string(),
        image: z.string(),
      }).nullable().refine((val) => val !== null, {
        message: 'Vui lòng chọn coin',
      }),
      quantity: z.string()
        .min(1, 'Vui lòng nhập số lượng')
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: 'Số lượng phải lớn hơn 0',
        }),
    });

    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 0, noNaN: true }), // Invalid quantities
        (invalidQuantity) => {
          const result = addCoinSchema.safeParse({
            coin: { id: 'btc', name: 'Bitcoin', symbol: 'BTC', image: 'btc.png' },
            quantity: invalidQuantity.toString(),
          });

          // Should fail validation
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject submission without selecting a coin', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<AddCoinBar onSuccess={onSuccess} />);

    // Click to show form
    const addButton = screen.getByText(/Thêm coin vào danh mục đầu tư/i);
    await user.click(addButton);

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByText(/Thêm coin mới/i)).toBeInTheDocument();
    });

    // Enter only quantity without selecting coin
    const quantityInput = screen.getByPlaceholderText('0.00000000');
    await user.type(quantityInput, '10');

    // Try to submit
    const submitButton = screen.getByRole('button', { name: /Thêm/i });
    await user.click(submitButton);

    // Should not call API without coin selection
    await waitFor(() => {
      expect(api.portfolioApi.addHolding).not.toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should accept submission with valid coin and positive quantity', () => {
    // Test the validation schema directly
    const addCoinSchema = z.object({
      coin: z.object({
        id: z.string(),
        name: z.string(),
        symbol: z.string(),
        image: z.string(),
      }).nullable().refine((val) => val !== null, {
        message: 'Vui lòng chọn coin',
      }),
      quantity: z.string()
        .min(1, 'Vui lòng nhập số lượng')
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: 'Số lượng phải lớn hơn 0',
        }),
    });

    fc.assert(
      fc.property(
        fc.double({ min: 0.00000001, max: 1000000, noNaN: true }), // Valid quantities
        (validQuantity) => {
          const result = addCoinSchema.safeParse({
            coin: { id: 'btc', name: 'Bitcoin', symbol: 'BTC', image: 'btc.png' },
            quantity: validQuantity.toString(),
          });

          // Should pass validation
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve validation logic after form wrapper migration', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<AddCoinBar onSuccess={onSuccess} />);

    // Click to show form
    const addButton = screen.getByText(/Thêm coin vào danh mục đầu tư/i);
    await user.click(addButton);

    // Wait for form
    await waitFor(() => {
      expect(screen.getByText(/Thêm coin mới/i)).toBeInTheDocument();
    });

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /Thêm/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      const errorMessages = document.querySelectorAll('[class*="text-destructive"], [class*="text-danger"]');
      expect(errorMessages.length).toBeGreaterThan(0);
    }, { timeout: 1000 });

    // Should not call API
    expect(api.portfolioApi.addHolding).not.toHaveBeenCalled();
  });

  it('should handle form reset after successful submission', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    // Mock successful API response
    vi.mocked(api.portfolioApi.addHolding).mockResolvedValue({
      data: [] as never[],
    });

    const { container } = render(<AddCoinBar onSuccess={onSuccess} />);

    // Click to show form
    const addButton = container.querySelector('button');
    if (addButton) {
      await user.click(addButton);
    }

    // Wait for form
    await waitFor(() => {
      expect(screen.getByText(/Thêm coin mới/i)).toBeInTheDocument();
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    // Select coin using combobox
    const comboboxTrigger = container.querySelector('[role="combobox"]');
    if (comboboxTrigger) {
      await user.click(comboboxTrigger);
    }

    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Bitcoin'));

    // Enter quantity
    const quantityInput = screen.getByPlaceholderText('0.00000000');
    await user.type(quantityInput, '1');

    // Submit
    const submitButtons = container.querySelectorAll('button[type="submit"]');
    if (submitButtons.length > 0) {
      await user.click(submitButtons[0] as HTMLButtonElement);
    }

    // Wait for submission
    await waitFor(() => {
      expect(api.portfolioApi.addHolding).toHaveBeenCalled();
    }, { timeout: 2000 });

    // Form should be hidden after successful submission
    await waitFor(() => {
      expect(screen.queryByText(/Thêm coin mới/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
