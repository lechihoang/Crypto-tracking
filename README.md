# Crypto Tracking Full-Stack Application

A modern cryptocurrency tracking application built with Next.js frontend and NestJS backend, featuring an AI-powered chatbot.

## 🏗️ Project Structure

```
crypto-tracking/
├── frontend/          # Next.js React application
├── backend/           # NestJS API server
├── package.json       # Root scripts and workspace config
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- MongoDB installed and running (see [MONGODB_SETUP.md](./MONGODB_SETUP.md))

### 1. Install Dependencies
```bash
# Install all dependencies for both projects
npm run install:all

# Or install separately:
npm run install:frontend
npm run install:backend
```

### 2. Environment Setup

**Frontend (.env.local):**
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Backend (.env):**
```env
# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://your-auth0-domain.auth0.com/api/v2/
AUTH0_CALLBACK_URL=http://localhost:3001/api/auth/callback

# MongoDB Database
# For local: mongodb://localhost:27017/crypto-tracking
# For Atlas: mongodb+srv://<user>:<pass>@cluster.mongodb.net/crypto-tracking
MONGODB_URI=mongodb://localhost:27017/crypto-tracking

# APIs
COINMARKETCAP_API_KEY=your-coinmarketcap-key
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
PINECONE_API_KEY=your-pinecone-api-key

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Development

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:frontend  # Frontend: http://localhost:3000
npm run dev:backend   # Backend: http://localhost:3001
```

### 4. Production Build

```bash
# Build both projects
npm run build

# Or build separately:
npm run build:frontend
npm run build:backend
```

### 5. Production Start

```bash
# Start both in production mode
npm run start
```

## 📋 Features

### Frontend (Next.js)
- 🎨 Modern React UI with Tailwind CSS
- 📱 Responsive design
- 🔐 Authentication with Auth0
- 📊 Interactive charts and data visualization
- 🌙 Dark/Light theme support

### Backend (NestJS)
- 🏗️ Simple modular architecture with TypeScript
- 📡 RESTful API endpoints
- 🔒 JWT authentication with Auth0
- 📊 Real-time crypto data from CoinMarketCap
- 🛡️ Input validation with Zod

## 🔧 API Endpoints

### Crypto API
```
GET  /api/crypto/top?limit=10        # Top cryptocurrencies
POST /api/crypto/prices              # Get specific coin prices
GET  /api/crypto/search?q=bitcoin    # Search coins
GET  /api/crypto/coin/:id            # Detailed coin info
```

### Authentication
```
POST /api/auth/login                 # User login
POST /api/auth/register              # User registration
POST /api/auth/forgot-password       # Password reset
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Authentication:** Auth0

### Backend
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB (with Mongoose)
- **Validation:** Zod
- **Authentication:** JWT + Auth0
- **APIs:** CoinMarketCap

## 📚 Documentation

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [API Documentation](./backend/docs/api.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [CoinGecko API](https://coingecko.com/api) for free crypto data
- [Google Gemini AI](https://ai.google.dev) for chatbot intelligence
- [Auth0](https://auth0.com) for authentication
- [Next.js](https://nextjs.org) and [NestJS](https://nestjs.com) teams