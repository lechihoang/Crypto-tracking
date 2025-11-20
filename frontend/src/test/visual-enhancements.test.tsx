import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

describe('Visual Enhancement Components', () => {
  describe('Tooltip Component', () => {
    it('should render tooltip trigger', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button>Hover me</button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tooltip content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByRole('button', { name: /hover me/i })).toBeInTheDocument();
    });

    it('should show tooltip content on hover', async () => {
      const user = userEvent.setup();
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button>Hover me</button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tooltip content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByRole('button', { name: /hover me/i });
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Tooltip content').length).toBeGreaterThan(0);
      });
    });
  });

  describe('HoverCard Component', () => {
    it('should render hover card trigger', () => {
      render(
        <HoverCard>
          <HoverCardTrigger asChild>
            <button>Hover for card</button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div>Card content</div>
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByRole('button', { name: /hover for card/i })).toBeInTheDocument();
    });

    it('should show hover card content on hover', async () => {
      const user = userEvent.setup();
      
      render(
        <HoverCard>
          <HoverCardTrigger asChild>
            <button>Hover for card</button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div>Card content</div>
          </HoverCardContent>
        </HoverCard>
      );

      const trigger = screen.getByRole('button', { name: /hover for card/i });
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Card content')).toBeInTheDocument();
      });
    });
  });

  describe('Tooltip in Header Navigation', () => {
    it('should render tooltips for menu items', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button>Dashboard</button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View your portfolio dashboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Tooltip for Action Buttons', () => {
    it('should render tooltip for delete button', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button aria-label="Delete">Delete</button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete this alert</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });
});
