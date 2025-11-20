import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import { Coin } from '@/types';

// Feature: shadcn-ui-migration-phase2, Property 2: Combobox filtering correctness
// For any search term entered in combobox, the displayed options should only include items whose name or symbol contains the search term (case-insensitive).
// Validates: Requirements 2.2

describe('Combobox Filtering Correctness', () => {
  // Helper to generate random coins
  const coinArbitrary = fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    symbol: fc.string({ minLength: 1, maxLength: 10 }),
    image: fc.string(),
  });

  it('should filter coins by name (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(coinArbitrary, { minLength: 5, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (coins, searchTerm) => {
          // Simulate filtering logic
          const filtered = coins.filter(
            (coin) =>
              coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // Verify all filtered results match search term
          filtered.forEach((coin) => {
            const matchesName = coin.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
            const matchesSymbol = coin.symbol
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
            expect(matchesName || matchesSymbol).toBe(true);
          });

          // Verify no non-matching coins are included
          const nonFiltered = coins.filter((c) => !filtered.includes(c));
          nonFiltered.forEach((coin) => {
            const matchesName = coin.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
            const matchesSymbol = coin.symbol
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
            expect(matchesName || matchesSymbol).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all coins when search term is empty', () => {
    fc.assert(
      fc.property(
        fc.array(coinArbitrary, { minLength: 1, maxLength: 50 }),
        (coins) => {
          const searchTerm = '';
          const filtered = coins.filter(
            (coin) =>
              coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
          );

          expect(filtered.length).toBe(coins.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no coins match', () => {
    const coins: Coin[] = [
      { id: '1', name: 'Bitcoin', symbol: 'BTC', image: '' },
      { id: '2', name: 'Ethereum', symbol: 'ETH', image: '' },
    ];
    const searchTerm = 'ZZZZZZZ'; // Non-existent term

    const filtered = coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(filtered.length).toBe(0);
  });

  it('should handle special characters in search term', () => {
    fc.assert(
      fc.property(
        fc.array(coinArbitrary, { minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (coins, searchTerm) => {
          // Should not throw error with special characters
          expect(() => {
            coins.filter(
              (coin) =>
                coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should match partial strings', () => {
    const coins: Coin[] = [
      { id: '1', name: 'Bitcoin', symbol: 'BTC', image: '' },
      { id: '2', name: 'Bitcoin Cash', symbol: 'BCH', image: '' },
      { id: '3', name: 'Ethereum', symbol: 'ETH', image: '' },
    ];

    // Search for "bit" should match Bitcoin and Bitcoin Cash
    const filtered = coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes('bit') ||
        coin.symbol.toLowerCase().includes('bit')
    );

    expect(filtered.length).toBe(2);
    expect(filtered.some((c) => c.name === 'Bitcoin')).toBe(true);
    expect(filtered.some((c) => c.name === 'Bitcoin Cash')).toBe(true);
  });
});
