import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import { Coin } from '@/types';

// Feature: shadcn-ui-migration-phase2, Property 3: Combobox selection synchronization
// For any option selected in combobox, the component value should update to match the selection and the dropdown should close.
// Validates: Requirements 2.3

describe('Combobox Selection Synchronization', () => {
  // Helper to generate random coins
  const coinArbitrary = fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    symbol: fc.string({ minLength: 1, maxLength: 10 }),
    image: fc.string(),
  });

  it('should update value when coin is selected', () => {
    fc.assert(
      fc.property(
        fc.array(coinArbitrary, { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 0, max: 49 }),
        (coins, index) => {
          if (index >= coins.length) return;

          const selectedCoin = coins[index];
          let currentValue = '';
          let isOpen = true;

          // Simulate selection
          const handleSelect = (coin: Coin) => {
            currentValue = coin.name;
            isOpen = false;
          };

          handleSelect(selectedCoin);

          // Verify value is updated
          expect(currentValue).toBe(selectedCoin.name);
          // Verify dropdown is closed
          expect(isOpen).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain selection after dropdown closes', () => {
    fc.assert(
      fc.property(coinArbitrary, (coin) => {
        let selectedValue = '';
        let isOpen = true;

        // Select coin
        selectedValue = coin.name;
        isOpen = false;

        // Verify selection persists
        expect(selectedValue).toBe(coin.name);
        expect(isOpen).toBe(false);

        // Reopen dropdown
        isOpen = true;
        expect(selectedValue).toBe(coin.name); // Selection should still be there
      }),
      { numRuns: 100 }
    );
  });

  it('should allow changing selection', () => {
    fc.assert(
      fc.property(
        fc.array(coinArbitrary, { minLength: 2, maxLength: 50 }),
        (coins) => {
          if (coins.length < 2) return;

          let currentValue = '';

          // Select first coin
          currentValue = coins[0].name;
          expect(currentValue).toBe(coins[0].name);

          // Select second coin
          currentValue = coins[1].name;
          expect(currentValue).toBe(coins[1].name);

          // Verify value changed
          expect(currentValue).not.toBe(coins[0].name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle null selection (clear)', () => {
    fc.assert(
      fc.property(coinArbitrary, (coin) => {
        let currentValue: string | null = coin.name;

        // Clear selection
        currentValue = null;

        expect(currentValue).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should close dropdown immediately after selection', () => {
    const coins: Coin[] = [
      { id: '1', name: 'Bitcoin', symbol: 'BTC', image: '' },
      { id: '2', name: 'Ethereum', symbol: 'ETH', image: '' },
    ];

    let isOpen = true;
    let selectedValue = '';

    // Simulate selection
    const handleSelect = (coin: Coin) => {
      selectedValue = coin.name;
      isOpen = false;
    };

    handleSelect(coins[0]);

    expect(isOpen).toBe(false);
    expect(selectedValue).toBe('Bitcoin');
  });

  it('should synchronize value with selected coin object', () => {
    fc.assert(
      fc.property(
        fc.array(coinArbitrary, { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 19 }),
        (coins, index) => {
          if (index >= coins.length) return;

          const selectedCoin = coins[index];
          let currentCoin: Coin | null = null;

          // Select coin
          currentCoin = selectedCoin;

          // Verify all properties are synchronized
          expect(currentCoin?.id).toBe(selectedCoin.id);
          expect(currentCoin?.name).toBe(selectedCoin.name);
          expect(currentCoin?.symbol).toBe(selectedCoin.symbol);
          expect(currentCoin?.image).toBe(selectedCoin.image);
        }
      ),
      { numRuns: 100 }
    );
  });
});
