# Rental Room Backend API

Production-ready NestJS backend for rental room management system with AI features.

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install --legacy-peer-deps

# Setup database (Docker)
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Production (Docker)
```bash
# Build optimized image (1.31GB)
docker build -t rental-room-api:latest .

# Run with docker-compose
docker-compose up -d
```

## 📦 Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with pgvector
- **Cache**: Redis
- **AI**: Google Gemini (LangChain)
- **Auth**: JWT + Passport
- **PDF**: Puppeteer
- **Email**: Nodemailer

## 🏗️ Architecture

```
src/
├── modules/          # Feature modules
│   ├── auth/        # Authentication & authorization
│   ├── users/       # User management
│   ├── properties/  # Property & room management
│   ├── contracts/   # Contract & digital signatures
│   ├── payments/    # Payment processing
│   ├── ai/          # AI features (search, chat, analysis)
│   └── ...
├── common/          # Shared utilities
└── database/        # Prisma configuration
```

## 🔑 Environment Variables

Copy `.env.production.template` to `.env` and configure:

```bash
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
JWT_SECRET=your-secret
GEMINI_API_KEY=your-key
```

## 🐳 Docker

**Optimized Production Image**: 1.31GB (58% reduction from 3.13GB)
- Multi-stage build
- Production dependencies only
- Aggressive node_modules cleanup
- Health checks included

## 📚 API Documentation

Swagger UI available at: `http://localhost:3000/api/docs`

## 🚢 Deployment

See `deploy-azure.sh` for Azure Container Instances deployment.

**Recommended Setup**:
- Backend: Azure Container Instances (~$15/month)
- Database: Supabase (FREE tier with pgvector)
- Redis: Upstash (FREE tier)
- Total: ~$15-20/month

## 📝 License

Private
