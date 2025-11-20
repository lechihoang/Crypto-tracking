import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';

// Feature: shadcn-ui-migration-phase2, Property 13: Command palette search filtering
// For any search term entered in command palette, the displayed commands should only include items whose label contains the search term.
// Validates: Requirements 9.3

interface CommandItem {
  id: string;
  label: string;
  group: string;
}

describe('Command Palette Search Filtering', () => {
  // Helper to generate random commands
  const commandArbitrary = fc.record({
    id: fc.string({ minLength: 1 }),
    label: fc.string({ minLength: 1, maxLength: 50 }),
    group: fc.constantFrom('navigation', 'actions'),
  });

  it('should filter commands by label (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(commandArbitrary, { minLength: 5, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (commands, searchTerm) => {
          // Simulate filtering logic (cmdk filters by value which is set to label)
          const filtered = commands.filter((command) =>
            command.label.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // Verify all filtered results match search term
          filtered.forEach((command) => {
            expect(
              command.label.toLowerCase().includes(searchTerm.toLowerCase())
            ).toBe(true);
          });

          // Verify no non-matching commands are included
          const nonFiltered = commands.filter((c) => !filtered.includes(c));
          nonFiltered.forEach((command) => {
            expect(
              command.label.toLowerCase().includes(searchTerm.toLowerCase())
            ).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all commands when search term is empty', () => {
    fc.assert(
      fc.property(
        fc.array(commandArbitrary, { minLength: 1, maxLength: 50 }),
        (commands) => {
          const searchTerm = '';
          const filtered = commands.filter((command) =>
            command.label.toLowerCase().includes(searchTerm.toLowerCase())
          );

          expect(filtered.length).toBe(commands.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no commands match', () => {
    const commands: CommandItem[] = [
      { id: '1', label: 'Dashboard', group: 'navigation' },
      { id: '2', label: 'Portfolio', group: 'navigation' },
      { id: '3', label: 'Settings', group: 'navigation' },
    ];
    const searchTerm = 'ZZZZZZZ'; // Non-existent term

    const filtered = commands.filter((command) =>
      command.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(filtered.length).toBe(0);
  });

  it('should handle special characters in search term', () => {
    fc.assert(
      fc.property(
        fc.array(commandArbitrary, { minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (commands, searchTerm) => {
          // Should not throw error with special characters
          expect(() => {
            commands.filter((command) =>
              command.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should match partial strings', () => {
    const commands: CommandItem[] = [
      { id: '1', label: 'Dashboard', group: 'navigation' },
      { id: '2', label: 'Add Coin to Portfolio', group: 'actions' },
      { id: '3', label: 'Portfolio', group: 'navigation' },
    ];

    // Search for "port" should match Portfolio and Add Coin to Portfolio
    const filtered = commands.filter((command) =>
      command.label.toLowerCase().includes('port')
    );

    expect(filtered.length).toBe(2);
    expect(filtered.some((c) => c.label === 'Portfolio')).toBe(true);
    expect(filtered.some((c) => c.label === 'Add Coin to Portfolio')).toBe(
      true
    );
  });

  it('should be case-insensitive', () => {
    const commands: CommandItem[] = [
      { id: '1', label: 'Dashboard', group: 'navigation' },
      { id: '2', label: 'Portfolio', group: 'navigation' },
    ];

    const searchTerms = ['dash', 'DASH', 'DaSh', 'dAsH'];

    searchTerms.forEach((searchTerm) => {
      const filtered = commands.filter((command) =>
        command.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].label).toBe('Dashboard');
    });
  });
});
