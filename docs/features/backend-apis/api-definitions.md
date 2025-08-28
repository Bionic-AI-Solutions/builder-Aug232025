# BuilderAI API Definitions

## Base URL
```
Production: https://api.builderai.com/v1
Development: http://localhost:5000/api
```

## Authentication
All API endpoints require authentication via session cookies except where noted.

## Response Format
All API responses follow this standard format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2024-12-19T10:30:00Z"
}
```

---

## 1. Health & System APIs

### 1.1 Health Check
**GET** `/health`

Check system health and status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-19T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "cache": "healthy",
    "external_apis": "healthy"
  }
}
```

---

## 2. Authentication APIs

### 2.1 User Login
**POST** `/auth/login`

Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "professional",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "session": {
    "id": "session-456",
    "expiresAt": "2024-12-26T10:30:00Z"
  }
}
```

### 2.2 User Logout
**POST** `/auth/logout`

Terminate user session.

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

### 2.3 User Registration
**POST** `/auth/register`

Create new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free",
    "createdAt": "2024-12-19T10:30:00Z"
  }
}
```

### 2.4 Get Current User
**GET** `/auth/me`

Get current authenticated user information.

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "professional",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 3. User Management APIs

### 3.1 Get User Profile
**GET** `/users/:id`

Get user profile by ID.

**Parameters:**
- `id` (path): User ID

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "professional",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 3.2 Update User Profile
**PATCH** `/users/:id`

Update user profile information.

**Parameters:**
- `id` (path): User ID

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "johnsmith@example.com",
    "name": "John Smith",
    "plan": "professional",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 3.3 Change Password
**POST** `/users/:id/password`

Change user password.

**Parameters:**
- `id` (path): User ID

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

---

## 4. Project Management APIs

### 4.1 Get User Projects
**GET** `/projects`

Get all projects for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (development, testing, completed)
- `llm` (optional): Filter by LLM provider (claude, gpt4, gemini, llama)
- `limit` (optional): Number of projects to return (default: 50)
- `offset` (optional): Number of projects to skip (default: 0)

**Response:**
```json
{
  "projects": [
    {
      "id": "project-123",
      "userId": "user-123",
      "name": "Analytics Dashboard",
      "description": "Comprehensive user analytics dashboard",
      "prompt": "Create a comprehensive user analytics dashboard...",
      "status": "completed",
      "llm": "claude",
      "mcpServers": ["database", "api"],
      "files": [
        {
          "name": "Knowledge Article 1",
          "size": "12.4kb",
          "type": "markdown"
        }
      ],
      "revenue": 4500,
      "revenueGrowth": 15,
      "published": "true",
      "createdAt": "2024-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 4.2 Get Project Details
**GET** `/projects/:id`

Get detailed information about a specific project.

**Parameters:**
- `id` (path): Project ID

**Response:**
```json
{
  "project": {
    "id": "project-123",
    "userId": "user-123",
    "name": "Analytics Dashboard",
    "description": "Comprehensive user analytics dashboard",
    "prompt": "Create a comprehensive user analytics dashboard...",
    "status": "completed",
    "llm": "claude",
    "mcpServers": ["database", "api"],
    "files": [
      {
        "name": "Knowledge Article 1",
        "size": "12.4kb",
        "type": "markdown"
      }
    ],
    "revenue": 4500,
    "revenueGrowth": 15,
    "published": "true",
    "createdAt": "2024-12-15T10:30:00Z",
    "updatedAt": "2024-12-18T14:20:00Z"
  }
}
```

### 4.3 Create New Project
**POST** `/projects`

Create a new AI-generated project.

**Request Body:**
```json
{
  "userId": "user-123",
  "name": "E-commerce Store",
  "description": "Complete e-commerce solution",
  "prompt": "Create a comprehensive e-commerce platform...",
  "llm": "claude",
  "mcpServers": ["database", "payment", "inventory"],
  "status": "development"
}
```

**Response:**
```json
{
  "project": {
    "id": "project-456",
    "userId": "user-123",
    "name": "E-commerce Store",
    "description": "Complete e-commerce solution",
    "prompt": "Create a comprehensive e-commerce platform...",
    "status": "development",
    "llm": "claude",
    "mcpServers": ["database", "payment", "inventory"],
    "files": [],
    "revenue": 0,
    "revenueGrowth": 0,
    "published": "false",
    "createdAt": "2024-12-19T10:30:00Z"
  }
}
```

### 4.4 Update Project
**PATCH** `/projects/:id`

Update project information and status.

**Parameters:**
- `id` (path): Project ID

**Request Body:**
```json
{
  "name": "Updated E-commerce Store",
  "description": "Enhanced e-commerce solution",
  "status": "testing",
  "revenue": 2500,
  "revenueGrowth": 25
}
```

**Response:**
```json
{
  "project": {
    "id": "project-456",
    "userId": "user-123",
    "name": "Updated E-commerce Store",
    "description": "Enhanced e-commerce solution",
    "status": "testing",
    "llm": "claude",
    "mcpServers": ["database", "payment", "inventory"],
    "files": [],
    "revenue": 2500,
    "revenueGrowth": 25,
    "published": "false",
    "createdAt": "2024-12-19T10:30:00Z",
    "updatedAt": "2024-12-19T11:00:00Z"
  }
}
```

### 4.5 Delete Project
**DELETE** `/projects/:id`

Delete a project and all associated data.

**Parameters:**
- `id` (path): Project ID

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

### 4.6 Publish Project
**POST** `/projects/:id/publish`

Publish a project to the marketplace.

**Parameters:**
- `id` (path): Project ID

**Request Body:**
```json
{
  "price": 4900,
  "category": "business",
  "description": "Complete e-commerce solution for online stores"
}
```

**Response:**
```json
{
  "project": {
    "id": "project-456",
    "published": "true",
    "marketplaceApp": {
      "id": "marketplace-789",
      "projectId": "project-456",
      "name": "E-commerce Store",
      "description": "Complete e-commerce solution for online stores",
      "price": 4900,
      "rating": "0",
      "downloads": 0,
      "category": "business",
      "icon": "🛒",
      "createdAt": "2024-12-19T11:30:00Z"
    }
  }
}
```

---

## 5. MCP Server Management APIs

### 5.1 Get User MCP Servers
**GET** `/mcp-servers`

Get all MCP servers for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (connected, disconnected)
- `type` (optional): Filter by type (sse, stdio, websocket, grpc)
- `limit` (optional): Number of servers to return (default: 50)
- `offset` (optional): Number of servers to skip (default: 0)

**Response:**
```json
{
  "servers": [
    {
      "id": "server-123",
      "userId": "user-123",
      "name": "Database Server",
      "type": "sse",
      "url": "https://api.database.com/mcp",
      "description": "PostgreSQL database connection",
      "status": "connected",
      "latency": 45,
      "createdAt": "2024-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 5.2 Get MCP Server Details
**GET** `/mcp-servers/:id`

Get detailed information about a specific MCP server.

**Parameters:**
- `id` (path): Server ID

**Response:**
```json
{
  "server": {
    "id": "server-123",
    "userId": "user-123",
    "name": "Database Server",
    "type": "sse",
    "url": "https://api.database.com/mcp",
    "description": "PostgreSQL database connection",
    "status": "connected",
    "latency": 45,
    "createdAt": "2024-12-15T10:30:00Z",
    "lastConnected": "2024-12-19T10:25:00Z"
  }
}
```

### 5.3 Create MCP Server
**POST** `/mcp-servers`

Create a new MCP server connection.

**Request Body:**
```json
{
  "userId": "user-123",
  "name": "Payment Gateway",
  "type": "websocket",
  "url": "wss://api.payments.com/mcp",
  "description": "Stripe payment processing integration"
}
```

**Response:**
```json
{
  "server": {
    "id": "server-456",
    "userId": "user-123",
    "name": "Payment Gateway",
    "type": "websocket",
    "url": "wss://api.payments.com/mcp",
    "description": "Stripe payment processing integration",
    "status": "disconnected",
    "latency": 0,
    "createdAt": "2024-12-19T10:30:00Z"
  }
}
```

### 5.4 Update MCP Server
**PUT** `/mcp-servers/:id`

Update MCP server configuration and status.

**Parameters:**
- `id` (path): Server ID

**Request Body:**
```json
{
  "name": "Updated Payment Gateway",
  "url": "wss://api.payments.com/v2/mcp",
  "description": "Enhanced Stripe payment processing",
  "status": "connected"
}
```

**Response:**
```json
{
  "server": {
    "id": "server-456",
    "userId": "user-123",
    "name": "Updated Payment Gateway",
    "type": "websocket",
    "url": "wss://api.payments.com/v2/mcp",
    "description": "Enhanced Stripe payment processing",
    "status": "connected",
    "latency": 32,
    "createdAt": "2024-12-19T10:30:00Z",
    "lastConnected": "2024-12-19T11:00:00Z"
  }
}
```

### 5.5 Delete MCP Server
**DELETE** `/mcp-servers/:id`

Delete an MCP server connection.

**Parameters:**
- `id` (path): Server ID

**Response:**
```json
{
  "message": "MCP server deleted successfully"
}
```

### 5.6 Test MCP Server Connection
**POST** `/mcp-servers/:id/test`

Test the connection to an MCP server.

**Parameters:**
- `id` (path): Server ID

**Response:**
```json
{
  "success": true,
  "latency": 45,
  "status": "connected",
  "capabilities": [
    "database.query",
    "database.schema",
    "database.transaction"
  ]
}
```

---

## 6. Chat Development APIs

### 6.1 Get Chat Messages
**GET** `/chat/messages`

Get chat messages for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 100)
- `offset` (optional): Number of messages to skip (default: 0)
- `sender` (optional): Filter by sender (user, ai)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-123",
      "userId": "user-123",
      "sender": "user",
      "message": "Create a restaurant management app",
      "createdAt": "2024-12-19T10:30:00Z"
    },
    {
      "id": "msg-124",
      "userId": "user-123",
      "sender": "ai",
      "message": "I'll help you create a restaurant management app...",
      "createdAt": "2024-12-19T10:31:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

### 6.2 Send Chat Message
**POST** `/chat/messages`

Send a new chat message and get AI response.

**Request Body:**
```json
{
  "userId": "user-123",
  "sender": "user",
  "message": "Create a restaurant management app with inventory tracking"
}
```

**Response:**
```json
{
  "message": {
    "id": "msg-125",
    "userId": "user-123",
    "sender": "user",
    "message": "Create a restaurant management app with inventory tracking",
    "createdAt": "2024-12-19T10:35:00Z"
  },
  "aiResponse": {
    "id": "msg-126",
    "userId": "user-123",
    "sender": "ai",
    "message": "I'll create a comprehensive restaurant management app...",
    "createdAt": "2024-12-19T10:35:30Z"
  }
}
```

### 6.3 Get Chat Context
**GET** `/chat/context`

Get current chat context and conversation summary.

**Response:**
```json
{
  "context": {
    "currentTopic": "Restaurant Management App",
    "conversationLength": 15,
    "lastActivity": "2024-12-19T10:35:00Z",
    "suggestedActions": [
      "Create project structure",
      "Define database schema",
      "Set up MCP servers"
    ]
  }
}
```

---

## 7. Marketplace APIs

### 7.1 Get Marketplace Apps
**GET** `/marketplace`

Get all published marketplace applications.

**Query Parameters:**
- `category` (optional): Filter by category (business, content, service, custom)
- `search` (optional): Search by name or description
- `minRating` (optional): Minimum rating filter (0-5)
- `maxPrice` (optional): Maximum price filter (in cents)
- `sortBy` (optional): Sort by (popularity, rating, price, date)
- `order` (optional): Sort order (asc, desc)
- `limit` (optional): Number of apps to return (default: 20)
- `offset` (optional): Number of apps to skip (default: 0)

**Response:**
```json
{
  "apps": [
    {
      "id": "marketplace-123",
      "projectId": "project-123",
      "name": "E-commerce Store",
      "description": "Complete e-commerce solution",
      "price": 4900,
      "rating": "4.8",
      "downloads": 1200,
      "category": "business",
      "icon": "🛒",
      "createdAt": "2024-12-15T10:30:00Z",
      "author": {
        "id": "user-123",
        "name": "John Doe",
        "username": "johndoe"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 7.2 Get Marketplace App Details
**GET** `/marketplace/:id`

Get detailed information about a marketplace app.

**Parameters:**
- `id` (path): Marketplace app ID

**Response:**
```json
{
  "app": {
    "id": "marketplace-123",
    "projectId": "project-123",
    "name": "E-commerce Store",
    "description": "Complete e-commerce solution with payment processing",
    "price": 4900,
    "rating": "4.8",
    "downloads": 1200,
    "category": "business",
    "icon": "🛒",
    "createdAt": "2024-12-15T10:30:00Z",
    "author": {
      "id": "user-123",
      "name": "John Doe",
      "username": "johndoe"
    },
    "features": [
      "Payment processing",
      "Inventory management",
      "Order tracking",
      "Customer management"
    ],
    "screenshots": [
      "https://example.com/screenshot1.png",
      "https://example.com/screenshot2.png"
    ],
    "reviews": [
      {
        "id": "review-123",
        "rating": 5,
        "comment": "Excellent e-commerce solution!",
        "user": "user-456",
        "createdAt": "2024-12-18T15:30:00Z"
      }
    ]
  }
}
```

### 7.3 Install Marketplace App
**POST** `/marketplace/:id/install`

Install a marketplace app (creates a copy for the user).

**Parameters:**
- `id` (path): Marketplace app ID

**Request Body:**
```json
{
  "userId": "user-456",
  "customization": {
    "name": "My E-commerce Store",
    "theme": "dark",
    "features": ["payment", "inventory"]
  }
}
```

**Response:**
```json
{
  "project": {
    "id": "project-789",
    "userId": "user-456",
    "name": "My E-commerce Store",
    "description": "Complete e-commerce solution",
    "status": "development",
    "llm": "claude",
    "mcpServers": ["database", "payment"],
    "createdAt": "2024-12-19T11:00:00Z"
  },
  "installation": {
    "id": "install-123",
    "marketplaceAppId": "marketplace-123",
    "userId": "user-456",
    "installedAt": "2024-12-19T11:00:00Z"
  }
}
```

### 7.4 Rate Marketplace App
**POST** `/marketplace/:id/rate`

Rate and review a marketplace app.

**Parameters:**
- `id` (path): Marketplace app ID

**Request Body:**
```json
{
  "userId": "user-456",
  "rating": 5,
  "comment": "Excellent e-commerce solution with great features!"
}
```

**Response:**
```json
{
  "review": {
    "id": "review-456",
    "marketplaceAppId": "marketplace-123",
    "userId": "user-456",
    "rating": 5,
    "comment": "Excellent e-commerce solution with great features!",
    "createdAt": "2024-12-19T11:30:00Z"
  }
}
```

---

## 8. Analytics APIs

### 8.1 Get User Analytics
**GET** `/analytics/user`

Get analytics data for the authenticated user.

**Query Parameters:**
- `period` (optional): Time period (day, week, month, year)
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)

**Response:**
```json
{
  "analytics": {
    "overview": {
      "totalProjects": 15,
      "completedProjects": 8,
      "totalRevenue": 14950,
      "monthlyGrowth": 17.9,
      "activeMcpServers": 5
    },
    "revenue": {
      "current": 14950,
      "previous": 12680,
      "growth": 17.9,
      "trend": [
        {
          "date": "2024-12-01",
          "revenue": 1200,
          "growth": 12
        }
      ]
    },
    "projects": {
      "byStatus": {
        "development": 5,
        "testing": 2,
        "completed": 8
      },
      "byLLM": {
        "claude": 8,
        "gpt4": 4,
        "gemini": 2,
        "llama": 1
      }
    },
    "engagement": {
      "chatMessages": 245,
      "avgSessionDuration": 25.5,
      "mostActiveDay": "Wednesday"
    }
  }
}
```

### 8.2 Get Project Analytics
**GET** `/analytics/projects/:id`

Get detailed analytics for a specific project.

**Parameters:**
- `id` (path): Project ID

**Query Parameters:**
- `period` (optional): Time period (day, week, month, year)

**Response:**
```json
{
  "analytics": {
    "project": {
      "id": "project-123",
      "name": "E-commerce Store",
      "status": "completed",
      "revenue": 4500,
      "revenueGrowth": 15
    },
    "performance": {
      "downloads": 1200,
      "rating": 4.8,
      "reviews": 45,
      "conversionRate": 3.2
    },
    "usage": {
      "dailyActiveUsers": 89,
      "monthlyActiveUsers": 1200,
      "avgSessionDuration": 8.5,
      "bounceRate": 23.4
    },
    "revenue": {
      "total": 4500,
      "monthly": 1500,
      "growth": 15,
      "trend": [
        {
          "date": "2024-12-01",
          "revenue": 150,
          "downloads": 12
        }
      ]
    }
  }
}
```

### 8.3 Get Platform Analytics (Admin Only)
**GET** `/analytics/platform`

Get platform-wide analytics (admin access required).

**Query Parameters:**
- `period` (optional): Time period (day, week, month, year)

**Response:**
```json
{
  "analytics": {
    "overview": {
      "totalUsers": 127,
      "activeUsers": 89,
      "totalProjects": 450,
      "totalRevenue": 124500,
      "monthlyGrowth": 23.5
    },
    "users": {
      "byPlan": {
        "free": 45,
        "professional": 67,
        "enterprise": 15
      },
      "growth": {
        "newUsers": 23,
        "churnRate": 2.1,
        "conversionRate": 15.3
      }
    },
    "projects": {
      "byStatus": {
        "development": 234,
        "testing": 89,
        "completed": 127
      },
      "byLLM": {
        "claude": 245,
        "gpt4": 123,
        "gemini": 56,
        "llama": 26
      }
    },
    "revenue": {
      "total": 124500,
      "monthly": 41500,
      "growth": 23.5,
      "byPlan": {
        "professional": 53000,
        "enterprise": 71500
      }
    },
    "system": {
      "serverUptime": 99.9,
      "avgResponseTime": 245,
      "activeConnections": 89,
      "databaseHealth": "excellent"
    }
  }
}
```

---

## 9. Billing & Subscription APIs

### 9.1 Get User Billing Info
**GET** `/billing/user`

Get billing information for the authenticated user.

**Response:**
```json
{
  "billing": {
    "user": {
      "id": "user-123",
      "plan": "professional",
      "status": "active"
    },
    "subscription": {
      "id": "sub-123",
      "plan": "professional",
      "amount": 7900,
      "currency": "usd",
      "interval": "month",
      "status": "active",
      "currentPeriodStart": "2024-12-15T00:00:00Z",
      "currentPeriodEnd": "2025-01-15T00:00:00Z",
      "cancelAtPeriodEnd": false
    },
    "usage": {
      "projects": {
        "current": 15,
        "limit": 25,
        "percentage": 60
      },
      "mcpConnections": {
        "current": 5,
        "limit": null,
        "percentage": null
      },
      "apiCalls": {
        "current": 12000,
        "limit": 100000,
        "percentage": 12
      }
    },
    "invoices": [
      {
        "id": "inv-123",
        "amount": 7900,
        "currency": "usd",
        "status": "paid",
        "createdAt": "2024-12-15T00:00:00Z",
        "pdfUrl": "https://example.com/invoice.pdf"
      }
    ]
  }
}
```

### 9.2 Update Subscription
**POST** `/billing/subscription`

Update user subscription plan.

**Request Body:**
```json
{
  "plan": "enterprise",
  "paymentMethod": "pm_1234567890"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "sub-123",
    "plan": "enterprise",
    "amount": 19900,
    "currency": "usd",
    "interval": "month",
    "status": "active",
    "currentPeriodStart": "2024-12-19T00:00:00Z",
    "currentPeriodEnd": "2025-01-19T00:00:00Z"
  }
}
```

### 9.3 Cancel Subscription
**POST** `/billing/subscription/cancel`

Cancel user subscription (effective at period end).

**Response:**
```json
{
  "subscription": {
    "id": "sub-123",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "canceledAt": "2024-12-19T10:30:00Z"
  }
}
```

---

## 10. Admin APIs

### 10.1 Get All Users (Admin Only)
**GET** `/admin/users`

Get all users in the system (admin access required).

**Query Parameters:**
- `search` (optional): Search by name, email, or username
- `plan` (optional): Filter by subscription plan
- `status` (optional): Filter by account status
- `limit` (optional): Number of users to return (default: 50)
- `offset` (optional): Number of users to skip (default: 0)

**Response:**
```json
{
  "users": [
    {
      "id": "user-123",
      "username": "johndoe",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "professional",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastLogin": "2024-12-19T09:30:00Z",
      "stats": {
        "projects": 15,
        "revenue": 4500,
        "mcpServers": 5
      }
    }
  ],
  "pagination": {
    "total": 127,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### 10.2 Update User (Admin Only)
**PATCH** `/admin/users/:id`

Update user information (admin access required).

**Parameters:**
- `id` (path): User ID

**Request Body:**
```json
{
  "plan": "enterprise",
  "status": "suspended",
  "name": "John Smith"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Smith",
    "plan": "enterprise",
    "status": "suspended",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

### 10.3 Delete User (Admin Only)
**DELETE** `/admin/users/:id`

Delete a user account (admin access required).

**Parameters:**
- `id` (path): User ID

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### 10.4 Get System Health (Admin Only)
**GET** `/admin/system/health`

Get detailed system health information (admin access required).

**Response:**
```json
{
  "system": {
    "status": "healthy",
    "uptime": 99.9,
    "version": "1.0.0",
    "lastUpdated": "2024-12-19T10:30:00Z"
  },
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "connections": 25,
      "maxConnections": 100
    },
    "cache": {
      "status": "healthy",
      "hitRate": 85.2,
      "memoryUsage": 67.3
    },
    "external": {
      "openai": "healthy",
      "anthropic": "healthy",
      "stripe": "healthy"
    }
  },
  "metrics": {
    "requestsPerMinute": 245,
    "averageResponseTime": 180,
    "errorRate": 0.1,
    "activeUsers": 89
  }
}
```

---

## 11. File Management APIs

### 11.1 Upload Project Files
**POST** `/projects/:id/files`

Upload files for a project.

**Parameters:**
- `id` (path): Project ID

**Request Body:** (multipart/form-data)
```
file: [binary file data]
type: "knowledge" | "asset" | "document"
```

**Response:**
```json
{
  "file": {
    "id": "file-123",
    "projectId": "project-123",
    "name": "knowledge-article.md",
    "size": 12400,
    "type": "knowledge",
    "url": "https://example.com/files/knowledge-article.md",
    "uploadedAt": "2024-12-19T10:30:00Z"
  }
}
```

### 11.2 Get Project Files
**GET** `/projects/:id/files`

Get all files for a project.

**Parameters:**
- `id` (path): Project ID

**Query Parameters:**
- `type` (optional): Filter by file type

**Response:**
```json
{
  "files": [
    {
      "id": "file-123",
      "projectId": "project-123",
      "name": "knowledge-article.md",
      "size": 12400,
      "type": "knowledge",
      "url": "https://example.com/files/knowledge-article.md",
      "uploadedAt": "2024-12-19T10:30:00Z"
    }
  ]
}
```

### 11.3 Delete Project File
**DELETE** `/projects/:id/files/:fileId`

Delete a file from a project.

**Parameters:**
- `id` (path): Project ID
- `fileId` (path): File ID

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

---

## 12. WebSocket APIs

### 12.1 Chat WebSocket
**WebSocket** `/ws/chat`

Real-time chat connection for development interface.

**Connection URL:**
```
ws://localhost:5000/ws/chat?userId=user-123
```

**Message Types:**

**Send Message:**
```json
{
  "type": "send_message",
  "data": {
    "message": "Create a restaurant app",
    "projectId": "project-123"
  }
}
```

**Receive Message:**
```json
{
  "type": "message",
  "data": {
    "id": "msg-123",
    "sender": "ai",
    "message": "I'll help you create a restaurant app...",
    "timestamp": "2024-12-19T10:30:00Z"
  }
}
```

**Typing Indicator:**
```json
{
  "type": "typing",
  "data": {
    "sender": "ai",
    "isTyping": true
  }
}
```

### 12.2 Project Updates WebSocket
**WebSocket** `/ws/projects`

Real-time project status updates.

**Connection URL:**
```
ws://localhost:5000/ws/projects?userId=user-123
```

**Message Types:**

**Project Status Update:**
```json
{
  "type": "project_update",
  "data": {
    "projectId": "project-123",
    "status": "completed",
    "progress": 100,
    "message": "Project generation completed"
  }
}
```

**Build Progress:**
```json
{
  "type": "build_progress",
  "data": {
    "projectId": "project-123",
    "stage": "generating_code",
    "progress": 75,
    "message": "Generating application code..."
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Rate Limits

- **Authentication APIs**: 10 requests per minute
- **Project APIs**: 100 requests per minute
- **Chat APIs**: 60 requests per minute
- **Analytics APIs**: 30 requests per minute
- **Admin APIs**: 50 requests per minute

## Pagination

All list endpoints support pagination with the following parameters:
- `limit`: Number of items per page (default: 50, max: 100)
- `offset`: Number of items to skip

Response includes pagination metadata:
```json
{
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```
