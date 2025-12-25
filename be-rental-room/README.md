# 🏠 Smart Room Rental Management System<p align="center">

  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>

> A comprehensive REST API for managing rental properties, rooms, contracts, billing, and tenant services built with NestJS, PostgreSQL, and Redis.</p>



[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs)](https://nestjs.com/)[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)[circleci-url]: https://circleci.com/gh/nestjs/nest

[![Prisma](https://img.shields.io/badge/Prisma-6.17-2D3748?logo=prisma)](https://www.prisma.io/)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)    <p align="center">

[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)](https://www.docker.com/)<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>

<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>

## 📋 Table of Contents<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>

<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>

- [Features](#-features)<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>

- [Tech Stack](#-tech-stack)<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>

- [Prerequisites](#-prerequisites)<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>

- [Quick Start](#-quick-start)  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>

- [API Documentation](#-api-documentation)    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>

- [Project Structure](#-project-structure)  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>

- [Authentication](#-authentication)</p>

- [Caching Strategy](#-caching-strategy)  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)

- [Testing](#-testing)  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

- [Docker Commands](#-docker-commands)

- [Security](#-security)## Description



## ✨ Features[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.



### Core Functionality## Project setup

- 🔐 **JWT Authentication** - Secure token-based authentication with refresh tokens

- 👥 **Role-Based Access Control** - ADMIN, LANDLORD, TENANT roles```bash

- 🏢 **Property Management** - Manage properties with full CRUD operations$ npm install

- 🏠 **Room Management** - Room listings with filtering, sorting, and pagination```

- 📝 **Contract Management** - Rental applications and contract lifecycle

- 💰 **Billing System** - Invoice generation and payment tracking## Compile and run the project

- 🔧 **Maintenance Requests** - Track and manage maintenance issues

- 🔔 **Notifications** - Real-time notification system```bash

- ⚡ **Redis Caching** - High-performance caching (5-10min TTL)# development

- 🛡️ **Security** - Rate limiting (100 req/min), Helmet, CORS$ npm run start

- 📚 **Swagger Docs** - Interactive API documentation

# watch mode

### Technical Features$ npm run start:dev

- **Pagination & Filtering** - All list endpoints support pagination and advanced filtering

- **Soft Deletes** - Safe data removal with audit trail# production mode

- **Validation** - Comprehensive input validation with class-validator$ npm run start:prod

- **Exception Handling** - Global exception filter with proper error messages```

- **Docker Support** - Full Docker Compose setup for dev/prod

- **Testing** - Unit tests with Jest and faker factories## Run tests

- **Type Safety** - Full TypeScript with strict mode

```bash

## 🛠️ Tech Stack# unit tests

$ npm run test

| Category          | Technologies                                      |

|-------------------|---------------------------------------------------|# e2e tests

| **Framework**     | NestJS 11.0, Express                              |$ npm run test:e2e

| **Language**      | TypeScript 5.7                                    |

| **Database**      | PostgreSQL 15, Prisma ORM 6.17                    |# test coverage

| **Cache**         | Redis 7, cache-manager                            |$ npm run test:cov

| **Authentication**| JWT, Passport, bcrypt                             |```

| **Validation**    | class-validator, class-transformer                |

| **Documentation** | Swagger/OpenAPI                                   |## Deployment

| **Testing**       | Jest 30.0, Supertest, Faker                       |

| **DevOps**        | Docker, Docker Compose                            |When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

| **Security**      | Helmet, Throttler, CORS                           |

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

## 📦 Prerequisites

```bash

- **Node.js** >= 18.x$ npm install -g @nestjs/mau

- **Docker** & **Docker Compose**$ mau deploy

- **npm** or **yarn**```



## 🚀 Quick StartWith Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.



### 1. Clone & Install## Resources



```bashCheck out a few resources that may come in handy when working with NestJS:

git clone <repository-url>

cd smart-room-project- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.

npm install- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).

```- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).

- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.

### 2. Environment Setup- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).

- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).

```bash- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).

cp .env.example .env- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

```

## Support

Update `.env` with your configuration:

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

```env

DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/rental_room_db?schema=public## Stay in touch

PORT=3000

NODE_ENV=development- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)

CORS_ORIGIN=*- Website - [https://nestjs.com](https://nestjs.com/)

- Twitter - [@nestframework](https://twitter.com/nestframework)

JWT_SECRET=your-super-secret-jwt-key-change-in-production

JWT_EXPIRES_IN=1d## License

JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

JWT_REFRESH_EXPIRES_IN=7dNest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).


REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600
```

### 3. Start Services

```bash
# Start Docker containers (PostgreSQL, Redis, pgAdmin)
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
npx prisma migrate dev

# Seed database with sample data
npm run seed
```

### 4. Run Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

**🎉 API is running at:** `http://localhost:3000`

**📚 Swagger Docs:** `http://localhost:3000/api/docs`

## 📚 API Documentation

### Interactive Swagger UI

Visit **http://localhost:3000/api/docs** for:
- Complete API reference
- Request/response schemas
- Try-it-out functionality
- Authentication testing

### Quick API Overview

```
API Base URL: http://localhost:3000/api/v1
```

| Module          | Endpoints                           | Description                |
|-----------------|-------------------------------------|----------------------------|
| **Auth**        | `POST /auth/register`               | Register new user          |
|                 | `POST /auth/login`                  | Login with email/password  |
|                 | `POST /auth/refresh`                | Refresh access token       |
| **Properties**  | `GET /properties`                   | List properties (cached)   |
|                 | `GET /properties/:id`               | Get property details       |
|                 | `POST /properties`                  | Create property (LANDLORD) |
| **Rooms**       | `GET /rooms`                        | List rooms (cached)        |
|                 | `GET /rooms/:id`                    | Get room details           |
|                 | `POST /rooms`                       | Create room (LANDLORD)     |
| **Contracts**   | `POST /contracts/applications`      | Submit rental application  |
|                 | `GET /contracts`                    | List contracts             |
|                 | `PATCH /contracts/:id/terminate`    | Terminate contract         |
| **Billing**     | `GET /billing/invoices`             | List invoices              |
|                 | `POST /billing/invoices`            | Create invoice (LANDLORD)  |
|                 | `PATCH /billing/invoices/:id/mark-paid` | Mark invoice paid      |
| **Payments**    | `POST /payments`                    | Create payment             |
|                 | `PATCH /payments/:id/confirm`       | Confirm payment            |
| **Maintenance** | `POST /maintenance/requests`        | Create maintenance request |
|                 | `PATCH /maintenance/requests/:id/complete` | Complete request    |

## 🗺️ Ward Data (xã/phường)

- Purpose: Standardize administrative levels at the ward/commune level across BE.
- Source: Optional shared JSON from FE at fe-rental-room/public/data/wards.json.
- Env: Set `WARDS_JSON_PATH` to point to a wards.json if using a custom path.

Backend provides a lightweight loader at src/common/services/location.service.ts:
- loadWardsIndex(): loads and indexes ward records.
- getWardType(name, provinceCode?): returns the administrative type (e.g. ward/commune).
- listWardNamesByProvinceCode(code): lists ward names by province.

Notes:
- If wards.json is not present, the API continues to run normally; loader falls back to no-op.
- You can integrate validation in property creation/update to verify `ward` and infer its type.

## 🏗️ Project Structure

```
smart-room-project/
├── prisma/
│   ├── schema.prisma          # Database schema (17 models)
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed script with sample data
│
├── src/
│   ├── common/
│   │   ├── decorators/        # @Roles, @CurrentUser, @CacheKey, @CacheTTL
│   │   ├── filters/           # GlobalExceptionFilter
│   │   ├── guards/            # JwtAuthGuard, LocalAuthGuard, RolesGuard
│   │   ├── interceptors/      # HttpCacheInterceptor
│   │   ├── services/          # CacheService
│   │   └── exceptions/        # Custom exceptions
│   │
│   ├── config/
│   │   ├── cache.config.ts    # Redis configuration
│   │   ├── constants.ts       # App constants
│   │   └── validation.ts      # Env validation
│   │
│   ├── database/
│   │   └── prisma/
│   │       └── prisma.service.ts
│   │
│   ├── modules/
│   │   ├── auth/              # JWT auth, login, register
│   │   │   ├── strategies/    # JwtStrategy, LocalStrategy
│   │   │   ├── dto/           # LoginDto, RegisterDto, AuthResponseDto
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/             # User management
│   │   ├── properties/        # Property CRUD (9 unit tests)
│   │   ├── rooms/             # Room CRUD (12 unit tests)
│   │   ├── landlords/         # Landlord management
│   │   ├── tenants/           # Tenant management
│   │   ├── contracts/         # Contract lifecycle
│   │   ├── billing/           # Invoice & billing
│   │   ├── payments/          # Payment processing
│   │   ├── services/          # Utilities (electricity, water, etc.)
│   │   ├── maintenance/       # Maintenance requests
│   │   └── notifications/     # Notification system
│   │
│   ├── shared/
│   │   └── dtos/              # PaginatedResponse, SortDto
│   │
│   ├── app.module.ts          # Root module (Throttler, Cache, Auth)
│   └── main.ts                # Bootstrap (Helmet, CORS, Validation, Swagger)
│
├── test/
│   └── utils/
│       ├── test-data.factory.ts  # Faker factories for 12 entities
│       └── prisma-mock.ts        # Mock PrismaClient
│
├── docker-compose.dev.yml     # Docker services (PostgreSQL, Redis, pgAdmin)
├── Dockerfile                 # Production image (Node 22-alpine)
├── REDIS_CACHE.md             # Redis caching documentation
└── package.json
```

## 🔐 Authentication

### Register New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "0901234567"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "TENANT"
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Use Protected Endpoints

```bash
curl -X GET http://localhost:3000/api/v1/rooms \
  -H "Authorization: Bearer <access_token>"
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'
```

## ⚡ Caching Strategy

### Redis Cache Configuration

- **Room Lists**: 5 minutes TTL
- **Room Details**: 10 minutes TTL  
- **Property Lists**: 5 minutes TTL
- **Property Details**: 10 minutes TTL

### Auto Invalidation

Cache is automatically invalidated on:
- ✅ Create operations (`POST`)
- ✅ Update operations (`PUT`, `PATCH`)
- ✅ Delete operations (`DELETE`)
- ✅ Pattern-based deletion for related keys

### Check Cache Status

```bash
# View all cache keys
docker exec rental-room-redis-dev redis-cli KEYS "*"

# Get cache value
docker exec rental-room-redis-dev redis-cli GET "/api/v1/rooms?page=1&limit=10"

# Clear all cache
docker exec rental-room-redis-dev redis-cli FLUSHALL
```

## 🧪 Testing

```bash
# Run all unit tests (21 tests)
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

**Current Test Coverage:**
- ✅ PropertiesService: 9 tests
- ✅ RoomsService: 12 tests
- 🔄 Target: 80%+ coverage

## 🐳 Docker Commands

### Start All Services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

**Services:**
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`
- pgAdmin: `localhost:5050`

### Stop Services

```bash
docker-compose -f docker-compose.dev.yml down
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### Rebuild Images

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

### Access PostgreSQL

```bash
docker exec -it rental-room-db-dev psql -U postgres -d rental_room_db
```

### Redis CLI

```bash
docker exec -it rental-room-redis-dev redis-cli
```

## 🛡️ Security

### Implemented Security Measures

✅ **Helmet.js** - Security headers (XSS, CSP, etc.)  
✅ **CORS** - Configurable cross-origin resource sharing  
✅ **Rate Limiting** - 100 requests per minute per IP  
✅ **JWT Authentication** - Secure token-based auth with refresh tokens  
✅ **Password Hashing** - bcrypt with salt rounds = 10  
✅ **Input Validation** - class-validator for all DTOs  
✅ **SQL Injection Protection** - Prisma ORM with parameterized queries  
✅ **Global Exception Filter** - Proper error handling without data leakage  

### Security Best Practices

```typescript
// ✅ Use environment variables
JWT_SECRET=<generate-strong-secret>

// ✅ Enable CORS only for trusted origins
CORS_ORIGIN=https://yourdomain.com

// ✅ Use HTTPS in production
NODE_ENV=production
```

## 📊 Database Schema

### 17 Interconnected Models

```
User → Landlord → Property → Room → RoomImage
                                   → RoomAmenity
                                   → Review

User → Tenant → RentalApplication → Contract → Invoice → InvoiceItem
                                              → Payment

Room → MaintenanceRequest
       ServiceUsage ← Service

User → Notification
```

**Key Relationships:**
- 1 Property has many Rooms
- 1 Room has many RentalApplications
- 1 Contract has many Invoices
- 1 Invoice has many InvoiceItems and Payments

See `prisma/schema.prisma` for full schema details.

## 🚀 Production Deployment

### Build Docker Image

```bash
docker build -t smart-room-api:latest .
```

### Run in Production

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name smart-room-api \
  --restart unless-stopped \
  smart-room-api:latest
```

### Production Checklist

- [ ] Change `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `CORS_ORIGIN`
- [ ] Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
- [ ] Use managed Redis (AWS ElastiCache, Azure Cache, etc.)
- [ ] Enable HTTPS/TLS
- [ ] Set up logging and monitoring
- [ ] Configure backup strategy
- [ ] Review rate limiting settings

## 📈 Performance

- ⚡ **Redis Caching**: 80-90% faster response times for cached endpoints
- 🚀 **Pagination**: Efficient offset-based pagination
- 🔍 **Indexing**: Database indexes on frequently queried fields
- 📦 **Query Optimization**: Prisma select/include for minimal data transfer

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Support

For issues and questions:
- 📧 Email: smartroom.mail@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 Docs: [Full Documentation](https://docs.example.com)

---

**Made with ❤️ using NestJS**
