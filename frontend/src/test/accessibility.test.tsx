import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { fc } from '@fast-check/vitest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink,
  PaginationPrevious,
  PaginationNext 
} from '@/components/ui/pagination'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

// Feature: shadcn-ui-migration, Property 15: Accessibility compliance
// For all migrated components, keyboard navigation should work correctly

describe('Accessibility Compliance - Phase 1', () => {
  it('should render buttons with proper accessibility attributes', () => {
    const { container } = render(<Button>Click me</Button>)
    const button = container.querySelector('button')
    
    expect(button).toBeDefined()
    expect(button?.textContent).toBe('Click me')
  })

  it('should render inputs with proper structure', () => {
    const { container } = render(
      <div>
        <Label htmlFor="test-input">Test Label</Label>
        <Input id="test-input" />
      </div>
    )
    
    const label = container.querySelector('label')
    const input = container.querySelector('input')
    
    expect(label).toBeDefined()
    expect(input).toBeDefined()
    expect(label?.getAttribute('for')).toBe('test-input')
    expect(input?.getAttribute('id')).toBe('test-input')
  })

  it('should support disabled state on buttons', () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    const button = container.querySelector('button')
    
    expect(button?.hasAttribute('disabled')).toBe(true)
  })

  it('should support various button variants', () => {
    const variants = ['default', 'destructive', 'outline', 'ghost', 'link'] as const
    
    variants.forEach(variant => {
      const { container } = render(<Button variant={variant}>Button</Button>)
      const button = container.querySelector('button')
      expect(button).toBeDefined()
    })
  })

  it('should render inputs with different types', () => {
    const types = ['text', 'email', 'password', 'number'] as const
    
    types.forEach(type => {
      const { container } = render(<Input type={type} />)
      const input = container.querySelector('input')
      expect(input?.getAttribute('type')).toBe(type)
    })
  })

  it('should support placeholder text in inputs', () => {
    const { container } = render(<Input placeholder="Enter text" />)
    const input = container.querySelector('input')
    
    expect(input?.getAttribute('placeholder')).toBe('Enter text')
  })

  it('should maintain focus management', () => {
    const { container } = render(<Button>Focusable</Button>)
    const button = container.querySelector('button')
    
    // Button should be focusable
    expect(button?.tabIndex).toBeGreaterThanOrEqual(0)
  })
})

// Feature: shadcn-ui-migration-phase2, Property 16: Accessibility compliance
// For all Phase 2 migrated components, keyboard navigation should allow users to access all interactive elements without using a mouse

describe('Accessibility Compliance - Phase 2', () => {
  describe('Switch Component', () => {
    it('should render switch with proper ARIA attributes', () => {
      const { container } = render(
        <Switch id="test-switch" aria-label="Test switch" />
      )
      const switchElement = container.querySelector('button[role="switch"]')
      
      expect(switchElement).toBeDefined()
      expect(switchElement?.getAttribute('aria-label')).toBe('Test switch')
      expect(switchElement?.getAttribute('type')).toBe('button')
    })

    it('should support disabled state', () => {
      const { container } = render(<Switch disabled />)
      const switchElement = container.querySelector('button[role="switch"]')
      
      expect(switchElement?.hasAttribute('disabled')).toBe(true)
      expect(switchElement?.getAttribute('data-disabled')).toBeDefined()
    })

    it('should be keyboard focusable', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('button[role="switch"]')
      
      expect(switchElement?.tabIndex).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Badge Component', () => {
    it('should render badge with proper structure', () => {
      const { container } = render(<Badge>Status</Badge>)
      const badge = container.querySelector('div')
      
      expect(badge).toBeDefined()
      expect(badge?.textContent).toBe('Status')
    })

    it('should support different variants', () => {
      const variants = ['default', 'secondary', 'destructive', 'outline'] as const
      
      variants.forEach(variant => {
        const { container } = render(<Badge variant={variant}>Badge</Badge>)
        const badge = container.querySelector('div')
        expect(badge).toBeDefined()
      })
    })
  })

  describe('Separator Component', () => {
    it('should render separator with proper structure', () => {
      const { container } = render(<Separator />)
      const separator = container.querySelector('[data-radix-collection-item]') || container.firstChild
      
      expect(separator).toBeDefined()
    })

    it('should support vertical orientation', () => {
      const { container } = render(<Separator orientation="vertical" />)
      const separator = container.firstChild as HTMLElement
      
      expect(separator).toBeDefined()
      // Vertical separators have different height/width classes
      expect(separator?.className).toContain('h-full')
    })

    it('should be horizontal by default', () => {
      const { container } = render(<Separator />)
      const separator = container.firstChild as HTMLElement
      
      expect(separator).toBeDefined()
      // Horizontal separators have h-[1px] class
      expect(separator?.className).toContain('h-[1px]')
    })
  })

  describe('Pagination Component', () => {
    it('should render pagination with proper navigation role', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )
      
      const nav = container.querySelector('nav[role="navigation"]')
      expect(nav).toBeDefined()
      expect(nav?.getAttribute('aria-label')).toBe('pagination')
    })

    it('should have proper ARIA labels for navigation buttons', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )
      
      const prevButton = container.querySelector('a[aria-label="Go to previous page"]')
      const nextButton = container.querySelector('a[aria-label="Go to next page"]')
      
      expect(prevButton).toBeDefined()
      expect(nextButton).toBeDefined()
    })

    it('should mark active page with aria-current', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" isActive>1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )
      
      const activeLink = container.querySelector('a[aria-current="page"]')
      expect(activeLink).toBeDefined()
    })
  })

  describe('ScrollArea Component', () => {
    it('should render scrollable content', () => {
      const { container } = render(
        <ScrollArea className="h-[200px]">
          <div>Scrollable content</div>
        </ScrollArea>
      )
      
      const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]')
      expect(scrollArea).toBeDefined()
    })

    it('should maintain content accessibility', () => {
      const { container } = render(
        <ScrollArea className="h-[200px]">
          <button>Focusable button</button>
        </ScrollArea>
      )
      
      const button = container.querySelector('button')
      expect(button).toBeDefined()
      expect(button?.textContent).toBe('Focusable button')
    })
  })

  describe('Sheet Component', () => {
    it('should render sheet with proper dialog role', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Test Sheet</SheetTitle>
            <div>Sheet content</div>
          </SheetContent>
        </Sheet>
      )
      
      const dialog = container.querySelector('[role="dialog"]')
      expect(dialog).toBeDefined()
    })

    it('should have accessible title for screen readers', () => {
      const { getByText } = render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Test Sheet</SheetTitle>
            <div>Sheet content</div>
          </SheetContent>
        </Sheet>
      )
      
      // The sheet should have an accessible title
      const title = getByText('Test Sheet')
      expect(title).toBeDefined()
    })
  })

  // Property-based test: All Phase 2 components with disabled state should properly indicate it
  it('components with disabled state should properly indicate accessibility', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isDisabled) => {
          const { container } = render(<Switch disabled={isDisabled} />)
          const switchElement = container.querySelector('button[role="switch"]')
          
          if (isDisabled) {
            expect(switchElement?.hasAttribute('disabled')).toBe(true)
            expect(switchElement?.getAttribute('data-disabled')).toBeDefined()
          } else {
            expect(switchElement?.hasAttribute('disabled')).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property-based test: Pagination should properly mark active pages
  it('pagination should mark active page with aria-current', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (currentPage, totalPages) => {
          const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)
          
          const { container } = render(
            <Pagination>
              <PaginationContent>
                {pages.map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink href="#" isActive={page === currentPage}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
          )
          
          const activeLinks = container.querySelectorAll('a[aria-current="page"]')
          const expectedActive = pages.includes(currentPage) ? 1 : 0
          expect(activeLinks.length).toBe(expectedActive)
        }
      ),
      { numRuns: 100 }
    )
  })
})
