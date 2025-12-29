# Backend API Documentation

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.yourdomain.com/api/v1
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Feedback APIs

### 1. System Feedback

#### Submit System Feedback
```http
POST /feedback
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "BUG_REPORT" | "FEATURE_REQUEST" | "GENERAL",
  "title": "string",
  "description": "string",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "type": "BUG_REPORT",
  "title": "Login button not working",
  "description": "...",
  "priority": "HIGH",
  "status": "PENDING",
  "userId": "uuid",
  "createdAt": "2025-12-25T10:00:00Z"
}
```

#### Get Admin Feedback (Admin only)
```http
GET /admin/feedback?status=PENDING&page=1&limit=10
Authorization: Bearer <admin_token>
```

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "BUG_REPORT",
      "title": "...",
      "status": "PENDING",
      "user": { "fullName": "...", "email": "..." }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

#### Update Feedback Status (Admin only)
```http
PATCH /feedback/:id/status
Authorization: Bearer <admin_token>

{
  "status": "IN_PROGRESS" | "RESOLVED" | "REJECTED",
  "adminNotes": "string (optional)"
}
```

---

### 2. Maintenance Feedback

#### Submit Maintenance Feedback
```http
PATCH /maintenance/requests/:id/feedback
Authorization: Bearer <token>

{
  "rating": 5,  // 1-5
  "feedback": "Great service!"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "rating": 5,
  "feedback": "Great service!",
  "updatedAt": "2025-12-25T10:00:00Z"
}
```

---

### 3. Room Review Replies

#### Reply to Review (Landlord only)
```http
POST /rooms/reviews/:id/reply
Authorization: Bearer <landlord_token>

{
  "landlordReply": "Thank you for your feedback!"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "rating": 5,
  "comment": "Great room!",
  "landlordReply": "Thank you for your feedback!",
  "updatedAt": "2025-12-25T10:00:00Z"
}
```

---

### 4. AI Feedback

#### Submit AI Feedback
```http
POST /ai/feedback
Authorization: Bearer <token>

{
  "interactionId": "uuid",
  "userFeedback": "HELPFUL" | "NOT_HELPFUL" | "INACCURATE" | "OFFENSIVE",
  "feedbackReason": "string (optional)"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "userFeedback": "HELPFUL",
  "feedbackReason": "Very accurate recommendation",
  "updatedAt": "2025-12-25T10:00:00Z"
}
```

---

## Existing APIs (Reference)

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/verify-email` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Rooms
- `GET /rooms` - List rooms (with filters)
- `GET /rooms/:id` - Get room details
- `POST /rooms` - Create room (landlord)
- `PATCH /rooms/:id` - Update room (landlord)
- `DELETE /rooms/:id` - Delete room (landlord)

### Contracts
- `GET /contracts` - List contracts
- `GET /contracts/:id` - Get contract details
- `POST /contracts` - Create contract
- `PATCH /contracts/:id/sign` - Sign contract
- `GET /contracts/:id/pdf` - Download PDF

### Maintenance
- `GET /maintenance/requests` - List requests
- `POST /maintenance/requests` - Create request
- `PATCH /maintenance/requests/:id` - Update request
- `PATCH /maintenance/requests/:id/status` - Update status

### Payments
- `GET /payments` - List payments
- `POST /payments` - Create payment
- `GET /payments/:id/receipt` - Download receipt

### AI
- `POST /ai/search` - Semantic search
- `POST /ai/chat` - AI chat
- `POST /ai/analyze` - Analyze room description
- `GET /ai/popular-searches` - Get popular searches

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthenticated"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```
