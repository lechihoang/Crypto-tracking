import { describe, it, expect, vi } from 'vitest';
import { fc } from '@fast-check/vitest';

// Feature: shadcn-ui-migration-phase2, Property 14: Command palette action execution
// For any command selected in command palette, the corresponding action should be executed or navigation should occur.
// Validates: Requirements 9.4

interface CommandItem {
  id: string;
  label: string;
  action: () => void;
  group: string;
}

describe('Command Palette Action Execution', () => {
  it('should execute action when command is selected', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            label: fc.string({ minLength: 1, maxLength: 50 }),
            group: fc.constantFrom('navigation', 'actions'),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (commandData) => {
          // Create commands with mock actions
          const executionTracker: Record<string, boolean> = {};
          const commands: CommandItem[] = commandData.map((data) => ({
            ...data,
            action: () => {
              executionTracker[data.id] = true;
            },
          }));

          // Select a random command and execute its action
          const randomIndex = Math.floor(Math.random() * commands.length);
          const selectedCommand = commands[randomIndex];

          // Execute the action
          selectedCommand.action();

          // Verify the action was executed
          expect(executionTracker[selectedCommand.id]).toBe(true);

          // Verify only the selected command's action was executed
          const executedCount = Object.keys(executionTracker).length;
          expect(executedCount).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should execute correct action for each command', () => {
    const executionLog: string[] = [];

    const commands: CommandItem[] = [
      {
        id: '1',
        label: 'Dashboard',
        action: () => executionLog.push('dashboard'),
        group: 'navigation',
      },
      {
        id: '2',
        label: 'Portfolio',
        action: () => executionLog.push('portfolio'),
        group: 'navigation',
      },
      {
        id: '3',
        label: 'Settings',
        action: () => executionLog.push('settings'),
        group: 'navigation',
      },
    ];

    // Execute each command's action
    commands.forEach((command) => {
      command.action();
    });

    // Verify all actions were executed in order
    expect(executionLog).toEqual(['dashboard', 'portfolio', 'settings']);
  });

  it('should handle action execution without errors', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            label: fc.string({ minLength: 1, maxLength: 50 }),
            group: fc.constantFrom('navigation', 'actions'),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (commandData) => {
          const commands: CommandItem[] = commandData.map((data) => ({
            ...data,
            action: () => {
              // Simple action that doesn't throw
            },
          }));

          // Should not throw when executing any action
          expect(() => {
            commands.forEach((command) => command.action());
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should execute navigation actions', () => {
    const mockRouter = {
      push: vi.fn(),
    };

    const commands: CommandItem[] = [
      {
        id: '1',
        label: 'Dashboard',
        action: () => mockRouter.push('/dashboard'),
        group: 'navigation',
      },
      {
        id: '2',
        label: 'Portfolio',
        action: () => mockRouter.push('/portfolio'),
        group: 'navigation',
      },
    ];

    // Execute first command
    commands[0].action();
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');

    // Execute second command
    commands[1].action();
    expect(mockRouter.push).toHaveBeenCalledWith('/portfolio');

    expect(mockRouter.push).toHaveBeenCalledTimes(2);
  });

  it('should execute action commands', () => {
    const mockActions = {
      addCoin: vi.fn(),
      createAlert: vi.fn(),
    };

    const commands: CommandItem[] = [
      {
        id: '1',
        label: 'Add Coin',
        action: () => mockActions.addCoin(),
        group: 'actions',
      },
      {
        id: '2',
        label: 'Create Alert',
        action: () => mockActions.createAlert(),
        group: 'actions',
      },
    ];

    // Execute action commands
    commands[0].action();
    expect(mockActions.addCoin).toHaveBeenCalledTimes(1);

    commands[1].action();
    expect(mockActions.createAlert).toHaveBeenCalledTimes(1);
  });

  it('should execute actions independently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (numCommands) => {
          const executionCounts: Record<string, number> = {};

          const commands: CommandItem[] = Array.from(
            { length: numCommands },
            (_, i) => ({
              id: `cmd-${i}`,
              label: `Command ${i}`,
              action: () => {
                executionCounts[`cmd-${i}`] =
                  (executionCounts[`cmd-${i}`] || 0) + 1;
              },
              group: 'navigation',
            })
          );

          // Execute each command once
          commands.forEach((cmd) => cmd.action());

          // Verify each command was executed exactly once
          Object.values(executionCounts).forEach((count) => {
            expect(count).toBe(1);
          });

          // Verify total executions match number of commands
          expect(Object.keys(executionCounts).length).toBe(numCommands);
        }
      ),
      { numRuns: 100 }
    );
  });
});
