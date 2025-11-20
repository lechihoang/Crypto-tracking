# Crypto Tracker Frontend

This is a [Next.js](https://nextjs.org) cryptocurrency tracking application built with shadcn/ui components, featuring real-time price tracking, portfolio management, and AI-powered chat assistance.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## UI Components - shadcn/ui Migration

This project has completed a comprehensive migration to [shadcn/ui](https://ui.shadcn.com/), a collection of reusable components built on Radix UI and Tailwind CSS. The migration was completed in two phases:

### Phase 1 Components

Core components migrated in Phase 1:
- **Button** - Primary interactive elements
- **Input** - Text input fields with validation
- **Label** - Form field labels
- **Form** - Form wrapper with validation
- **Dialog** - Modal dialogs
- **AlertDialog** - Confirmation dialogs
- **Table** - Data tables with sorting
- **Select** - Dropdown selectors
- **Card** - Content containers
- **Skeleton** - Loading states

### Phase 2 Components

Advanced components migrated in Phase 2:

#### Chat Interface
- **ScrollArea** - Styled scrollbars for chat messages
- **Sheet** - Slide-out panel for chat bubble (opens from right)

#### Search & Selection
- **Combobox** - Searchable dropdown using Command + Popover
  - Used in AddCoinBar for coin selection
  - Supports keyboard navigation and filtering
  - See [Combobox Usage](#combobox-usage) for details

#### Settings & UI Elements
- **Switch** - Toggle switches for settings (e.g., email notifications)
- **Separator** - Visual dividers between sections
- **Badge** - Status indicators and labels
- **Tooltip** - Helpful hints on hover
- **HoverCard** - Rich hover information displays

#### Navigation & Controls
- **Pagination** - Page navigation controls
- **Command Palette** - Quick navigation and actions (Cmd+K / Ctrl+K)
  - See [Command Palette](#command-palette) for details

#### Notifications
- **Sonner** - Toast notifications for success, error, and loading states
  - See [Sonner Migration](#sonner-toast-notifications) for details

## Command Palette

The Command Palette provides quick access to navigation and actions throughout the application.

### Opening the Command Palette

- **macOS**: `Cmd + K`
- **Windows/Linux**: `Ctrl + K`

### Available Commands

**Navigation:**
- Dashboard
- Portfolio
- Compare Coins
- Price Alerts
- Settings

**Actions:**
- Add Coin to Portfolio
- Create Price Alert
- Open Chat Assistant

### Usage Example

```typescript
import { CommandPalette } from '@/components/CommandPalette'

// Add to your layout or main component
<CommandPalette />
```

The Command Palette automatically registers the keyboard shortcut and provides fuzzy search across all commands.

## Combobox Usage

The Combobox component combines a searchable input with a dropdown list, perfect for selecting from large datasets like cryptocurrency lists.

### Basic Usage

```typescript
import { CoinCombobox } from '@/components/CoinCombobox'

function MyComponent() {
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null)
  
  return (
    <CoinCombobox
      coins={availableCoins}
      value={selectedCoin?.id || ''}
      onChange={(coin) => setSelectedCoin(coin)}
      placeholder="Search for a coin..."
    />
  )
}
```

### Features

- **Search Filtering**: Type to filter coins by name or symbol
- **Keyboard Navigation**: Use arrow keys to navigate, Enter to select, Escape to close
- **Accessibility**: Full keyboard support and screen reader compatible
- **Performance**: Efficiently handles large lists with virtualization

### Keyboard Shortcuts

- `↓` / `↑` - Navigate through options
- `Enter` - Select highlighted option
- `Escape` - Close dropdown
- `Tab` - Move to next form field

## Sonner Toast Notifications

We use [Sonner](https://sonner.emilkowal.ski/) for toast notifications throughout the application. Sonner was chosen for its excellent UX, accessibility, and seamless integration with shadcn/ui.

### Migration from react-hot-toast

The project has been fully migrated from `react-hot-toast` to Sonner. All toast notifications now use the Sonner API.

### Usage

```typescript
import { toast } from 'sonner'

// Success notification
toast.success('Portfolio updated successfully!')

// Error notification
toast.error('Failed to fetch data')

// Loading notification
toast.loading('Processing...')

// Promise-based notification
toast.promise(
  fetchData(),
  {
    loading: 'Loading data...',
    success: 'Data loaded successfully!',
    error: 'Failed to load data',
  }
)

// Custom notification with action
toast('Event created', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
})
```

### Configuration

The Toaster component is configured in the root layout (`app/layout.tsx`):

```typescript
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### Key Differences from react-hot-toast

- **API**: Similar API but with enhanced features
- **Styling**: Better integration with Tailwind CSS
- **Accessibility**: Improved screen reader support
- **Performance**: More efficient rendering
- **Positioning**: Automatic smart positioning

### Best Practices

1. Use `toast.promise()` for async operations
2. Keep messages concise and actionable
3. Use appropriate toast types (success, error, info)
4. Avoid excessive toast notifications
5. Provide actions when relevant (e.g., "Undo" button)

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Test Coverage

The project includes comprehensive testing:
- **Unit Tests**: Component behavior and logic
- **Property-Based Tests**: Universal properties using fast-check
- **Integration Tests**: End-to-end user flows
- **Accessibility Tests**: Keyboard navigation and screen reader support

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities and API
│   ├── test/            # Test files
│   └── types/           # TypeScript types
├── public/              # Static assets
└── package.json
```

## Key Features

- **Real-time Crypto Tracking**: Live price updates for cryptocurrencies
- **Portfolio Management**: Track your crypto holdings and performance
- **Price Alerts**: Set custom price alerts with email notifications
- **AI Chat Assistant**: Get crypto insights and answers
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dark Mode**: Theme support (coming soon)
- **Accessibility**: Full keyboard navigation and screen reader support

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [shadcn/ui Documentation](https://ui.shadcn.com/) - explore available components
- [Radix UI](https://www.radix-ui.com/) - underlying component primitives
- [Tailwind CSS](https://tailwindcss.com/) - utility-first CSS framework
- [Sonner](https://sonner.emilkowal.ski/) - toast notification library

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
