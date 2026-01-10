# 🏠 Rental Room Management System

A comprehensive, production-ready rental room management platform with AI-powered features, built with modern web technologies.

## 📋 Overview

This is a full-stack application designed for managing rental properties, contracts, payments, and tenant relationships. The system includes AI-powered search, automated billing, digital signatures, and real-time notifications.

**Live Demo:** [https://diphungthinh.io.vn](https://diphungthinh.io.vn)

## 🏗️ Architecture

```
rental-room/
├── fe-rental-room/          # Next.js 16 + React 19 frontend
├── be-rental-room/          # NestJS 11 backend API
├── docker-compose.yml       # Local development setup
└── docs/                    # Additional documentation
```

### Tech Stack

| Component | Frontend | Backend |
|-----------|----------|---------|
| **Framework** | Next.js 16 (App Router) | NestJS 11 |
| **Language** | TypeScript 5 | TypeScript 5 |
| **UI** | React 19, Tailwind CSS v4 | - |
| **Database** | - | PostgreSQL + pgvector |
| **Cache** | - | Redis (Upstash) |
| **Auth** | NextAuth 4.24 | JWT + Passport |
| **AI** | - | Google Gemini (LangChain) |
| **State** | React Query 5 | - |
| **Validation** | Zod 4 | class-validator |
| **Animations** | Framer Motion 12 | - |

## ✨ Features

### Core Features
- ✅ **Authentication & Authorization** - JWT-based auth with role management
- ✅ **Property Management** - Manage properties, rooms, and amenities
- ✅ **Contract Management** - Digital contracts with e-signatures
- ✅ **Payment Processing** - Automated billing with Sepay integration
- ✅ **Tenant Management** - Track tenants, deposits, and rental history
- ✅ **AI-Powered Search** - Semantic search using vector embeddings
- ✅ **Real-time Notifications** - WebSocket-based updates
- ✅ **PDF Generation** - Automated contract and invoice PDFs
- ✅ **Email Service** - Automated email notifications

### Advanced Features
- 🤖 **AI Chatbot** - Natural language queries for property search
- 📊 **Analytics Dashboard** - Revenue tracking and occupancy rates
- 📱 **Responsive Design** - Mobile-first, Airbnb-inspired UI
- 🌙 **Dark Mode** - Full dark mode support
- 🔐 **Digital Signatures** - Legally binding e-signatures
- 📧 **Email Verification** - Secure account activation
- 🔄 **Auto Income Tracking** - Automated monthly billing

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Docker** and Docker Compose
- **PostgreSQL** 14+ (or use Docker)
- **Redis** (or use Docker)

### Local Development

#### 1. Clone the Repository

```bash
git clone https://github.com/hungthinh1104/RentalRoom_Project.git
cd rental-room
```

#### 2. Start Infrastructure (Docker)

```bash
# Start PostgreSQL and Redis
docker-compose up -d
```

#### 3. Setup Backend

```bash
cd be-rental-room

# Install dependencies
npm install --legacy-peer-deps

# Setup environment variables
cp .env.production.template .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start development server
npm run start:dev
```

Backend will be available at: `http://localhost:3005`

API Documentation (Swagger): `http://localhost:3005/api/docs`

#### 4. Setup Frontend

```bash
cd fe-rental-room

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## 📦 Project Structure

### Backend (`be-rental-room/`)

```
src/
├── modules/              # Feature modules
│   ├── auth/            # Authentication & authorization
│   ├── users/           # User management
│   ├── properties/      # Property & room management
│   ├── contracts/       # Contract & digital signatures
│   ├── payments/        # Payment processing (Sepay)
│   ├── ai/              # AI features (search, chat, analysis)
│   ├── notifications/   # Real-time notifications
│   ├── email/           # Email service
│   └── pdf/             # PDF generation
├── common/              # Shared utilities & guards
├── config/              # Configuration files
└── database/            # Prisma schema & migrations
```

### Frontend (`fe-rental-room/`)

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Shared components
│   ├── ui/             # shadcn/ui components
│   └── shared/         # Custom reusable components
├── features/           # Feature-based modules
│   ├── auth/           # Authentication feature
│   ├── properties/     # Property listings
│   └── tax/            # Tax management
├── hooks/              # Custom React hooks
├── lib/                # Utilities & API client
└── styles/             # Global styles
```

## 🔧 Configuration

### Backend Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rental_room

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# AI (Google Gemini)
GEMINI_API_KEY=your-gemini-api-key

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Payment (Sepay)
SEPAY_ACCOUNT_NUMBER=your-account-number
SEPAY_API_KEY=your-sepay-api-key

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment Variables

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3005/api/v1

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🐳 Docker Deployment

### Production Build

```bash
# Build optimized backend image (1.31GB)
cd be-rental-room
docker build -t rental-room-api:latest .

# Run with docker-compose
cd ..
docker-compose up -d
```

### Docker Image Optimizations

- ✅ Multi-stage build
- ✅ Production dependencies only
- ✅ Aggressive node_modules cleanup
- ✅ Health checks included
- ✅ 58% size reduction (from 3.13GB to 1.31GB)

## 🚢 Production Deployment

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

**Recommended Stack:**
- **Frontend:** Vercel (Free tier)
- **Backend:** Azure App Service or Railway (~$15/month)
- **Database:** Supabase (Free tier with pgvector)
- **Cache:** Upstash Redis (Free tier)
- **Total Cost:** ~$15-20/month

**Deployment Scripts:**
- `deploy-azure.sh` - Azure Container Instances deployment
- `setup-gcloud.sh` - Google Cloud setup
- `cleanup.sh` - Clean up resources

## 🧪 Testing

### Backend Tests

```bash
cd be-rental-room

# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

**Test Status:** ✅ 335/335 tests passing

### Frontend Tests

```bash
cd fe-rental-room

# Lint check
npm run lint

# Build check
npm run build
```

## 📚 Documentation

- [Backend API Documentation](./be-rental-room/README.md)
- [Frontend Documentation](./fe-rental-room/README.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.txt)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [API Reference for Frontend](./fe-rental-room/docs/API_FOR_FRONTEND.md)
- [Design System Rules](./fe-rental-room/docs/DESIGN_SYSTEM_RULES.md)

## 🛠️ Development Tools

### Useful Scripts

```bash
# Backend
cd be-rental-room
npm run start:dev          # Start with hot-reload
npm run build              # Build for production
npm run format             # Format code with Prettier
npm run lint               # Lint and fix code
npm run seed               # Seed database

# Frontend
cd fe-rental-room
npm run dev                # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Lint code
```

### Database Management

```bash
cd be-rental-room

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

## 🎨 Design System

The frontend uses an Airbnb-inspired design system with:

- **Primary Color:** `#FF385C` (Airbnb Pink)
- **Typography:** Inter, Roboto, Outfit (Google Fonts)
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS v4 (CSS-first config)
- **Animations:** Framer Motion (< 0.3s duration)
- **Theme:** Light/Dark mode support
- **Language:** Vietnamese UI labels

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Email verification
- ✅ Rate limiting (Throttler)
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation (class-validator, Zod)
- ✅ SQL injection prevention (Prisma ORM)

## 🤝 Contributing

This is a private project. For collaboration inquiries, please contact the repository owner.

## 📄 License

Private - All rights reserved

## 👨‍💻 Author

**Đinh Hùng Thịnh**
- GitHub: [@hungthinh1104](https://github.com/hungthinh1104)
- Website: [diphungthinh.io.vn](https://diphungthinh.io.vn)

## 🙏 Acknowledgments

- **NestJS** - Progressive Node.js framework
- **Next.js** - React framework for production
- **Prisma** - Next-generation ORM
- **shadcn/ui** - Beautifully designed components
- **Google Gemini** - AI-powered features
- **Supabase** - Open source Firebase alternative

---

**Built with ❤️ using modern web technologies**
