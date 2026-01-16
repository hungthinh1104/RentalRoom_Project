# API Documentation for Frontend

## 🚀 Backend Server

- **Base URL**: `http://localhost:3000`
- **API Version**: v1
- **Framework**: NestJS 11.0.1
- **Authentication**: JWT Bearer Token
- **Database**: PostgreSQL 15 + pgvector 0.5.1
- **Cache**: Redis 7

## 🔐 Authentication Flow

### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nguyen Van A",
  "phone": "0123456789",
  "role": "TENANT" // or "LANDLORD"
}

Response:
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

### 2. Verify Email
```http
POST /auth/verify-email/:code

Response:
{
  "message": "Email verified successfully. You can now login."
}
```

### 2.1 Resend Verification Code
```http
POST /auth/resend-verification/:email

Response:
{
  "message": "Verification email sent. Please check your inbox."
}
```

### 3. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "role": "TENANT"
  }
}
```

### 4. Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "access_token": "new_access_token"
}
```

## 📋 Main API Endpoints

### Properties
```http
# List all properties (with pagination)
GET /properties?page=1&limit=10&sortBy=createdAt&sortOrder=DESC

# Get property by ID
GET /properties/:id

# Create property (LANDLORD only)
POST /properties
Authorization: Bearer {token}
{
  "landlordId": "uuid",
  "name": "Chung cu ABC",
  "address": "123 Nguyen Trai",
  "city": "Ho Chi Minh",
  "district": "District 1",
  "propertyType": "APARTMENT" // APARTMENT, HOUSE, STUDIO
}

# Update property
PATCH /properties/:id
Authorization: Bearer {token}

# Delete property
DELETE /properties/:id
Authorization: Bearer {token}
```

### Rooms
```http
# List all rooms (CACHED 5 minutes)
GET /rooms?page=1&limit=10&propertyId=uuid&status=AVAILABLE

# Room statuses: AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED

# Get room by ID
GET /rooms/:id

# Create room (LANDLORD only)
POST /rooms
Authorization: Bearer {token}
{
  "propertyId": "uuid",
  "roomNumber": "101",
  "floor": 1,
  "area": 25.5,
  "pricePerMonth": 5000000,
  "deposit": 10000000,
  "maxOccupants": 2,
  "status": "AVAILABLE",
  "description": "Phong dep, thoang mat"
}

# Update room
PATCH /rooms/:id
Authorization: Bearer {token}

# Delete room
DELETE /rooms/:id
Authorization: Bearer {token}
```

### Tenants
```http
# List tenants
GET /tenants?page=1&limit=10

# Get tenant by ID
GET /tenants/:id

# Create tenant profile (auto-created during registration)
POST /tenants
Authorization: Bearer {token}
{
  "userId": "uuid",
  "citizenId": "001234567890",
  "dateOfBirth": "1990-01-01",
  "address": "123 Main Street",
  "emergencyContact": "0987654321"
}

# Update tenant
PATCH /tenants/:id
Authorization: Bearer {token}

# Delete tenant
DELETE /tenants/:id
Authorization: Bearer {token}
```

### Landlords
```http
# List landlords
GET /landlords?page=1&limit=10

# Get landlord by ID
GET /landlords/:id

# Create landlord profile (auto-created during registration)
POST /landlords
Authorization: Bearer {token}
{
  "userId": "uuid",
  "citizenId": "001234567890",
  "dateOfBirth": "1985-05-15",
  "address": "456 Business Street",
  "bankAccount": "1234567890",
  "bankName": "Vietcombank"
}
```

### Contracts
```http
# List contracts
GET /contracts?page=1&limit=10&status=ACTIVE

# Contract statuses: ACTIVE, TERMINATED, EXPIRED

# Get contract by ID
GET /contracts/:id

# Create contract
POST /contracts
Authorization: Bearer {token}
{
  "tenantId": "uuid",
  "landlordId": "uuid",
  "roomId": "uuid",
  "applicationId": "uuid",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T00:00:00.000Z",
  "monthlyRent": 5000000,
  "deposit": 10000000,
  "terms": "Hop dong thue phong..."
}
```

### Payments
```http
# List payments
GET /payments?page=1&limit=10&status=COMPLETED

# Payment statuses: PENDING, COMPLETED, FAILED
# Payment methods: CASH, BANK_TRANSFER, MOMO, ZALOPAY

# Create payment
POST /payments
Authorization: Bearer {token}
{
  "invoiceId": "uuid",
  "tenantId": "uuid",
  "amount": 5000000,
  "paymentMethod": "BANK_TRANSFER",
  "paymentDate": "2024-01-15"
}

# Confirm payment
PATCH /payments/:id/confirm
Authorization: Bearer {token}
```

### Services
```http
# List services
GET /services?page=1&limit=10&propertyId=uuid

# Service types: ELECTRICITY, WATER, INTERNET, PARKING, CLEANING
# Billing methods: FIXED, METERED

# Create service
POST /services
Authorization: Bearer {token}
{
  "propertyId": "uuid",
  "serviceName": "Dien",
  "serviceType": "ELECTRICITY",
  "unitPrice": 3500,
  "billingMethod": "METERED"
}
```

### Maintenance Requests
```http
# List maintenance requests
GET /maintenance?page=1&limit=10&status=PENDING

# Priorities: LOW, MEDIUM, HIGH, URGENT
# Statuses: PENDING, IN_PROGRESS, COMPLETED, CANCELLED

# Create maintenance request
POST /maintenance
Authorization: Bearer {token}
{
  "roomId": "uuid",
  "tenantId": "uuid",
  "title": "Sua ong nuoc",
  "description": "Ong nuoc bi ro",
  "priority": "HIGH",
  "category": "PLUMBING"
}
```

### Notifications
```http
# Get user notifications
GET /notifications?page=1&limit=10&isRead=false

# Mark as read
PATCH /notifications/:id/read
Authorization: Bearer {token}
```

## 🎯 Common Query Parameters

All list endpoints support:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Field to sort by (default: 'createdAt')
- `sortOrder`: Sort direction - 'ASC' or 'DESC' (default: 'DESC')

## 📦 Response Format

### Success Response
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## 🔑 Authentication Header

For protected endpoints, include JWT token:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚦 HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## 🎨 Enums Reference

### UserRole
- `TENANT`
- `LANDLORD`
- `ADMIN`

### PropertyType
- `APARTMENT`
- `HOUSE`
- `STUDIO`

### RoomStatus
- `AVAILABLE`
- `OCCUPIED`
- `MAINTENANCE`
- `RESERVED`

### ContractStatus
- `ACTIVE`
- `TERMINATED`
- `EXPIRED`

### PaymentMethod
- `CASH`
- `BANK_TRANSFER`
- `MOMO`
- `ZALOPAY`

### PaymentStatus
- `PENDING`
- `COMPLETED`
- `FAILED`

### ServiceType
- `ELECTRICITY`
- `WATER`
- `INTERNET`
- `PARKING`
- `CLEANING`

### BillingMethod
- `FIXED`
- `METERED`

### MaintenancePriority
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

### MaintenanceStatus
- `PENDING`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

## 💡 Tips for Frontend

1. **Token Management**: Store access_token in memory, refresh_token in httpOnly cookie
2. **Auto Refresh**: Implement token refresh logic before expiration
3. **Error Handling**: Handle 401 errors globally and redirect to login
4. **Caching**: Use TanStack Query with proper stale times for GET requests
5. **Optimistic Updates**: Update UI optimistically for better UX
6. **Form Validation**: Use Zod schemas matching backend DTOs
7. **Loading States**: Show loading indicators during API calls
8. **Pagination**: Implement infinite scroll or pagination for lists

## 🔗 Quick Setup Example (Next.js + TanStack Query)

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// hooks/useRooms.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useRooms(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () => {
      const { data } = await api.get('/rooms', { params });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  });
}
```

## 🤖 AI Module (Powered by Google Gemini)

### Health Check
```http
GET /ai/health

Response:
{
  "status": "healthy",
  "models": {
    "chat": "gemini-2.5-flash",
    "embedding": "text-embedding-004"
  },
  "apiKey": {
    "configured": true,
    "valid": true
  },
  "timestamp": "2025-12-06T08:55:05.672Z"
}
```

### Generate Single Embedding
```http
POST /ai/embeddings/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Phòng trọ gần trường đại học, có ban công, wifi tốc độ cao"
}

Response:
{
  "embedding": [0.123, -0.456, ...], // 768 dimensions
  "dimensions": 768,
  "model": "text-embedding-004"
}
```

### Batch Generate Embeddings
```http
POST /ai/embeddings/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "texts": [
    "Phòng 25m2 giá 5 triệu/tháng",
    "Căn hộ mini đầy đủ nội thất"
  ],
  "batchSize": 10
}

Response:
{
  "embeddings": [
    [0.123, ...], // 768 dims
    [0.234, ...]
  ],
  "count": 2,
  "dimensions": 768,
  "model": "text-embedding-004",
  "processingTime": "1.2s"
}
```

### Analyze Room Description (AI Extraction)
```http
POST /ai/analyze/room-description
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Phòng trọ 25m2 gần ĐH Bách Khoa, có điều hòa, nóng lạnh, wifi, giá 5.5 triệu/tháng"
}

Response:
{
  "analysis": {
    "amenities": ["điều hòa", "nóng lạnh", "wifi"],
    "sentiment": "positive",
    "estimated_price_range": "5-6 triệu VND",
    "room_type": "studio",
    "key_features": ["gần trường đại học", "đầy đủ tiện nghi"]
  },
  "model": "gemini-2.5-flash",
  "processingTime": "0.8s"
}
```

### AI Chat (Conversational Interface)
```http
POST /ai/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Tìm phòng giá 4-6 triệu gần Quận 1",
  "context": "Tôi là sinh viên, cần phòng có wifi"
}

Response:
{
  "response": "Dựa trên yêu cầu của bạn, tôi gợi ý một số phòng trọ gần Quận 1 trong tầm giá 4-6 triệu...",
  "model": "gemini-2.5-flash",
  "timestamp": "2025-12-06T09:00:00Z"
}
```

## 📊 Reports Module

### Landlord Revenue Report
```http
GET /reports/landlord/revenue?landlordId=uuid&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}

Response:
{
  "data": {
    "totalRevenue": 120000000,
    "monthlyBreakdown": [
      { "month": "2024-01", "revenue": 10000000 }
    ],
    "propertyRevenue": [
      { "propertyId": "uuid", "propertyName": "Chung cư ABC", "revenue": 50000000 }
    ]
  }
}
```

### Property Performance
```http
GET /reports/landlord/property-performance?landlordId=uuid
Authorization: Bearer {token}

Response:
{
  "data": {
    "properties": [
      {
        "propertyId": "uuid",
        "occupancyRate": 85.5,
        "totalRooms": 20,
        "occupiedRooms": 17,
        "avgMonthlyRevenue": 45000000
      }
    ]
  }
}
```

### Tenant Analytics
```http
GET /reports/landlord/tenant-analytics?landlordId=uuid
Authorization: Bearer {token}

Response:
{
  "data": {
    "totalTenants": 45,
    "avgContractDuration": 12,
    "onTimePaymentRate": 92.5,
    "tenantRetentionRate": 78.3
  }
}
```

### Tenant Payment History
```http
GET /reports/tenant/payment-history?tenantId=uuid&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}

Response:
{
  "data": {
    "totalPaid": 60000000,
    "payments": [
      {
        "date": "2024-01-15",
        "amount": 5000000,
        "method": "BANK_TRANSFER",
        "status": "COMPLETED"
      }
    ]
  }
}
```

### Tenant Expenses Summary
```http
GET /reports/tenant/expenses?tenantId=uuid&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}

Response:
{
  "data": {
    "totalExpenses": 65000000,
    "breakdown": {
      "rent": 60000000,
      "electricity": 3500000,
      "water": 1500000
    }
  }
}
```

### Admin Overview (ADMIN only)
```http
GET /reports/admin/overview
Authorization: Bearer {token}

Response:
{
  "data": {
    "totalProperties": 150,
    "totalRooms": 1250,
    "occupancyRate": 87.5,
    "totalRevenue": 5500000000,
    "totalUsers": 2345,
    "activeContracts": 1094
  }
}
```

### Market Insights (ADMIN only)
```http
GET /reports/admin/market-insights
Authorization: Bearer {token}

Response:
{
  "data": {
    "avgRoomPrice": 5500000,
    "priceByDistrict": [
      { "district": "Quận 1", "avgPrice": 8500000 }
    ],
    "popularAmenities": [
      { "amenity": "AC", "count": 850 }
    ],
    "trendingSearches": [
      { "query": "phòng gần trường", "count": 234 }
    ]
  }
}
```

## 💰 Billing Module

### Create Invoice
```http
POST /billing/invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "contractId": "uuid",
  "billingMonth": "2024-01",
  "dueDate": "2024-01-15",
  "totalAmount": 5500000
}

Response:
{
  "id": "uuid",
  "invoiceNumber": "INV-2024-001",
  "status": "PENDING",
  "totalAmount": 5500000
}
```

### Add Invoice Line Item
```http
POST /billing/invoices/:invoiceId/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Tiền điện tháng 1",
  "quantity": 150,
  "unitPrice": 3500,
  "amount": 525000
}
```

### Get All Invoices
```http
GET /billing/invoices?page=1&limit=10&status=PENDING
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2024-001",
      "status": "PENDING",
      "totalAmount": 5500000,
      "lineItems": [...]
    }
  ],
  "meta": { "total": 50, "page": 1, "limit": 10 }
}
```

### Mark Invoice as Paid
```http
PATCH /billing/invoices/:id/mark-paid
Authorization: Bearer {token}

Response:
{
  "id": "uuid",
  "status": "PAID",
  "paidAt": "2024-01-15T10:00:00Z"
}
```

---

## 📊 Database Schema Reference

### Core Tables
- `user` - Base user accounts (email, password, role, fullName, phone)
- `landlord` - Landlord-specific data (citizenId, bankAccount)
- `tenant` - Tenant-specific data (citizenId, emergencyContact)
- `property` - Properties managed by landlords
- `room` - Individual rooms with pricing & status
- `room_amenity` - Room amenities (AC, WIFI, etc.)
- `room_image` - Room photos
- `room_review` - Tenant reviews

### Contract & Payment Tables
- `rental_application` - Tenant applications for rooms
- `contract` - Active/terminated rental contracts
- `invoice` - Monthly invoices
- `invoice_line_item` - Invoice details (rent, electricity, water)
- `payment` - Payment transactions
- `service` - Property services (electricity, water, internet)

### Operations Tables
- `maintenance_request` - Repair/maintenance requests
- `notification` - User notifications

### AI & Analytics Tables (NEW)
- `room_embedding` - 768-dim vectors for semantic search (pgvector)
- `search_cache` - Cached search results with vectors
- `tenant_ai_profile` - User preference vectors
- `ai_interaction_log` - Search/click analytics
- `popular_search` - Trending queries

---

## 🔧 Backend Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL 15 + pgvector 0.5.1
- **Cache**: Redis 7
- **AI**: LangChain + Google Gemini (gemini-2.5-flash, text-embedding-004)
- **Authentication**: JWT (access + refresh tokens)
- **Email**: Nodemailer + Handlebars templates
- **Validation**: class-validator + class-transformer
- **ORM**: Prisma 6.19.0
- **API Docs**: Swagger/OpenAPI at `/api/docs`

---

## 🚀 Quick Start for Frontend

### Setup API Client
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Example Hook (TanStack Query)
```typescript
// hooks/useRooms.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useRooms(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () => {
      const { data } = await api.get('/rooms', { params });
      return data;
    },
    staleTime: 5 * 60 * 1000, // Match backend cache
  });
}
```

---

**Backend Status**: ✅ Production Ready  
**Docker Image**: 326 MB (optimized)  
**Database**: 70 rooms with embeddings seeded  
**AI Models**: gemini-2.5-flash, text-embedding-004 (768 dims)  
**Last Updated**: December 6, 2025

**Test Accounts**:
- Admin: `admin@rentalroom.vn` / `password123`
- Landlord: `landlord1@example.com` / `password123`
- Tenant: `tenant1@example.com` / `password123`
