# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a cryptocurrency tracking full-stack application with a separated frontend (Next.js) and backend (NestJS) architecture:

```
crypto-tracking-separated/
├── frontend/          # Next.js 15 React application (port 3000)
├── backend/           # NestJS TypeScript API server (port 3001)
└── README.md         # Project documentation
```

## Development Commands

### Root Level (Workspace Scripts)
```bash
# Install dependencies for both projects
npm run install:all

# Start both frontend and backend in development
npm run dev

# Build both projects
npm run build

# Start both in production
npm run start
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend (NestJS)
```bash
cd backend
npm run start:dev    # Start development server with watch mode
npm run build        # Build TypeScript to dist/
npm run start:prod   # Start production server
npm run lint         # Run ESLint with auto-fix
npm run test         # Run Jest unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:cov     # Run tests with coverage
```

## Architecture Overview

### Backend Architecture (NestJS)
The backend follows a modular NestJS architecture with these core modules:

- **AuthModule**: Supabase-based authentication with JWT
- **CryptoModule**: Cryptocurrency data from CoinMarketCap API
- **AlertsModule**: Price alerts and notifications
- **PortfolioModule**: User portfolio management
- **ChatbotModule**: AI-powered crypto chatbot
- **RagModule**: RAG (Retrieval Augmented Generation) functionality

**Database**: PostgreSQL via Supabase with TypeORM entities:
- `PriceAlert`: User price alerts
- `PortfolioHolding`: User crypto holdings
- `PortfolioSnapshot`: Portfolio value snapshots

### Frontend Architecture (Next.js)
- **App Router**: Next.js 15 with app directory structure
- **Authentication**: Supabase Auth UI integration
- **Styling**: Tailwind CSS with custom theming
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **API**: Axios for backend communication

### API Integration Pattern
The frontend communicates exclusively with the backend API (not external APIs directly). The backend handles all external API calls including:
- CoinGecko for crypto data
- Supabase for authentication and database
- AI services for chatbot functionality

## Key Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Backend (.env)
```env
DATABASE_URL=your-database-url
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
COINMARKETCAP_API_KEY=your-coinmarketcap-key
FRONTEND_URL=http://localhost:3000
```

## Development Workflow

1. **Startup Order**: Always start backend first, then frontend
2. **API Development**: Backend endpoints are defined in respective controllers
3. **Database Changes**: TypeORM synchronize is enabled for development
4. **Testing**: Use backend test scripts before making changes to API endpoints

## Important Notes

- The application was recently migrated from frontend-direct API calls to backend-proxy pattern for better security and performance
- Chatbot functionality requires both backend API and AI service integration
- Frontend uses Vietnamese language in some UI elements (lang="vi" in layout)
- Tailwind CSS v4 is used with PostCSS integration
- TypeScript is used throughout both frontend and backend