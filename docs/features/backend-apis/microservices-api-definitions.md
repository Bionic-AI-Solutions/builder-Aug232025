# BuilderAI Microservices API Definitions

## Overview

This document defines the complete API specifications for all BuilderAI microservices, including their endpoints, request/response formats, and how they support the frontend pages and functionality. The platform supports three distinct user personas: Super Admin, Builder, and End User.

## User Personas

### 🏢 Super Admin
- Full platform access and administration
- Can view all users, projects, and implementations
- Manages platform-wide analytics and health
- Oversees marketplace operations

### 🛠️ Builder
- Creates and monetizes projects/widgets
- Publishes projects to marketplace
- Tracks end-user implementations
- Receives revenue from project sales and usage
- Can purchase templates from other builders

### 🎯 End User
- Purchases and implements widgets
- Embeds widgets into their applications
- Pays for widget usage and features
- Accesses widget analytics and support

## API Gateway Configuration

### Base URLs
```
Production: https://api.builderai.com
Development: http://localhost:3000
```

### Service Routing
```
/api/auth/*          → Authentication Service
/api/users/*         → User Service
/api/builders/*      → Builder Service
/api/end-users/*     → End User Service
/api/projects/*      → Project Service
/api/chat/*          → Chat Service
/api/mcp/*           → MCP Service
/api/marketplace/*   → Marketplace Service
/api/widgets/*       → Widget Service
/api/analytics/*     → Analytics Service
/api/billing/*       → Billing Service
/api/admin/*         → Admin Service
/api/files/*         → File Service
/api/notifications/* → Notification Service
/api/monitoring/*    → Monitoring Service
```

---

## 1. Authentication Service

**Service URL**: `auth-service:3001`
**Frontend Pages**: Login, Registration, Password Reset

### 1.1 User Registration
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "persona": "builder" // "super_admin", "builder", "end_user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "username": "johndoe",
      "email": "user@example.com",
      "name": "John Doe",
      "persona": "builder",
      "status": "active",
      "createdAt": "2024-12-19T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-456"
  }
}
```

### 1.2 User Login
**POST** `/api/auth/login`

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
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "username": "johndoe",
      "email": "user@example.com",
      "name": "John Doe",
      "persona": "builder",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-456"
  }
}
```

### 1.3 Get User Persona
**GET** `/api/auth/persona/:userId`

**Response:**
```json
{
  "success": true,
  "data": {
    "persona": "builder",
    "permissions": [
      "create_projects",
      "publish_to_marketplace",
      "view_revenue",
      "manage_implementations"
    ],
    "roles": ["builder"]
  }
}
```

---

## 2. User Service

**Service URL**: `user-service:3002`
**Frontend Pages**: User Profile, Account Settings, Dashboard (user info)

### 2.1 Get User Profile
**GET** `/api/users/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Doe",
    "persona": "builder",
    "avatar": "https://example.com/avatar.jpg",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    },
    "stats": {
      "projectsCount": 15,
      "implementationsCount": 45,
      "totalRevenue": 12500,
      "lastLogin": "2024-12-19T09:30:00Z",
      "loginCount": 45
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2.2 Get Users by Persona (Admin)
**GET** `/api/users/by-persona/:persona`

**Query Parameters:**
- `limit` (optional): Number of users (default: 50)
- `offset` (optional): Number to skip (default: 0)
- `search` (optional): Search by name, email, or username

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "username": "johndoe",
        "email": "user@example.com",
        "name": "John Doe",
        "persona": "builder",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z",
        "stats": {
          "projectsCount": 15,
          "implementationsCount": 45,
          "totalRevenue": 12500
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
}
```

### 2.3 Update User Persona (Admin)
**PATCH** `/api/users/:userId/persona`

**Request Body:**
```json
{
  "persona": "builder",
  "roles": ["builder"],
  "permissions": [
    "create_projects",
    "publish_to_marketplace",
    "view_revenue"
  ]
}
```

---

## 3. Builder Service

**Service URL**: `builder-service:3003`
**Frontend Pages**: Builder Dashboard, Project Management

### 3.1 Get Builder Dashboard
**GET** `/api/builders/:builderId/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "builder": {
      "id": "builder-123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "overview": {
      "totalProjects": 15,
      "publishedProjects": 8,
      "totalImplementations": 45,
      "activeImplementations": 38,
      "totalRevenue": 12500,
      "monthlyRevenue": 3200,
      "monthlyGrowth": 15.5
    },
    "recentProjects": [
      {
        "id": "project-123",
        "name": "Restaurant POS System",
        "status": "published",
        "implementations": 12,
        "revenue": 4800,
        "createdAt": "2024-12-15T10:30:00Z"
      }
    ],
    "recentImplementations": [
      {
        "id": "impl-123",
        "projectName": "Restaurant POS System",
        "endUserName": "Pizza Palace",
        "implementationUrl": "https://pizzapalace.com",
        "status": "active",
        "revenue": 400,
        "createdAt": "2024-12-18T14:20:00Z"
      }
    ],
    "revenue": {
      "current": 12500,
      "previous": 10800,
      "growth": 15.5,
      "trend": [
        {
          "date": "2024-12-01",
          "revenue": 400,
          "implementations": 3
        }
      ]
    }
  }
}
```

### 3.2 Get Builder Projects
**GET** `/api/builders/:builderId/projects`

**Query Parameters:**
- `status` (optional): development, testing, published
- `limit` (optional): Number of projects (default: 50)
- `offset` (optional): Number to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project-123",
        "name": "Restaurant POS System",
        "description": "Complete restaurant management solution",
        "status": "published",
        "implementations": 12,
        "revenue": 4800,
        "revenueGrowth": 15,
        "publishedAt": "2024-12-15T10:30:00Z",
        "createdAt": "2024-12-10T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 3.3 Get Builder Implementations
**GET** `/api/builders/:builderId/implementations`

**Query Parameters:**
- `projectId` (optional): Filter by specific project
- `status` (optional): active, inactive, suspended
- `limit` (optional): Number of implementations (default: 50)
- `offset` (optional): Number to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "implementations": [
      {
        "id": "impl-123",
        "projectId": "project-123",
        "projectName": "Restaurant POS System",
        "endUserId": "end-user-456",
        "endUserName": "Pizza Palace",
        "endUserEmail": "contact@pizzapalace.com",
        "implementationUrl": "https://pizzapalace.com",
        "status": "active",
        "usageCount": 1250,
        "revenue": 400,
        "lastActivity": "2024-12-19T10:30:00Z",
        "createdAt": "2024-12-18T14:20:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 3.4 Get Builder Revenue
**GET** `/api/builders/:builderId/revenue`

**Query Parameters:**
- `period` (optional): day, week, month, year
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 12500,
      "monthlyRevenue": 3200,
      "monthlyGrowth": 15.5,
      "totalImplementations": 45,
      "activeImplementations": 38
    },
    "byProject": [
      {
        "projectId": "project-123",
        "projectName": "Restaurant POS System",
        "revenue": 4800,
        "implementations": 12,
        "growth": 15
      }
    ],
    "byImplementation": [
      {
        "implementationId": "impl-123",
        "endUserName": "Pizza Palace",
        "revenue": 400,
        "usageCount": 1250
      }
    ],
    "trend": [
      {
        "date": "2024-12-01",
        "revenue": 400,
        "implementations": 3
      }
    ]
  }
}
```

### 3.5 Get Builder Customers
**GET** `/api/builders/:builderId/customers`

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "endUserId": "end-user-456",
        "name": "Pizza Palace",
        "email": "contact@pizzapalace.com",
        "implementations": 2,
        "totalSpent": 800,
        "lastActivity": "2024-12-19T10:30:00Z",
        "joinedAt": "2024-12-15T10:30:00Z"
      }
    ]
  }
}
```

---

## 4. End User Service

**Service URL**: `end-user-service:3004`
**Frontend Pages**: End User Dashboard, Widget Management

### 4.1 Get End User Dashboard
**GET** `/api/end-users/:endUserId/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "endUser": {
      "id": "end-user-456",
      "name": "Pizza Palace",
      "email": "contact@pizzapalace.com"
    },
    "overview": {
      "totalWidgets": 3,
      "activeWidgets": 3,
      "totalSpent": 1200,
      "monthlySpend": 300,
      "usageCount": 2500
    },
    "recentWidgets": [
      {
        "id": "impl-123",
        "widgetName": "Restaurant POS System",
        "builderName": "John Doe",
        "status": "active",
        "usageCount": 1250,
        "monthlyCost": 100,
        "lastUsed": "2024-12-19T10:30:00Z"
      }
    ],
    "usage": {
      "current": 2500,
      "previous": 2200,
      "growth": 13.6,
      "trend": [
        {
          "date": "2024-12-01",
          "usage": 85,
          "cost": 25
        }
      ]
    }
  }
}
```

### 4.2 Get End User Widgets
**GET** `/api/end-users/:endUserId/widgets`

**Query Parameters:**
- `status` (optional): active, inactive, suspended
- `limit` (optional): Number of widgets (default: 50)
- `offset` (optional): Number to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "widgets": [
      {
        "id": "impl-123",
        "widgetName": "Restaurant POS System",
        "builderName": "John Doe",
        "builderEmail": "john@example.com",
        "implementationUrl": "https://pizzapalace.com",
        "status": "active",
        "usageCount": 1250,
        "monthlyCost": 100,
        "lastUsed": "2024-12-19T10:30:00Z",
        "createdAt": "2024-12-18T14:20:00Z"
      }
    ],
    "pagination": {
      "total": 3,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 4.3 Get End User Usage
**GET** `/api/end-users/:endUserId/usage`

**Query Parameters:**
- `widgetId` (optional): Filter by specific widget
- `period` (optional): day, week, month, year
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsage": 2500,
      "monthlyUsage": 850,
      "totalCost": 1200,
      "monthlyCost": 300
    },
    "byWidget": [
      {
        "widgetId": "impl-123",
        "widgetName": "Restaurant POS System",
        "usage": 1250,
        "cost": 400
      }
    ],
    "trend": [
      {
        "date": "2024-12-01",
        "usage": 85,
        "cost": 25
      }
    ]
  }
}
```

---

## 5. Widget Service

**Service URL**: `widget-service:3005`
**Frontend Pages**: Widget Implementation, Widget Analytics

### 5.1 Implement Widget
**POST** `/api/widgets/implement`

**Request Body:**
```json
{
  "endUserId": "end-user-456",
  "projectId": "project-123",
  "implementationUrl": "https://pizzapalace.com",
  "configuration": {
    "theme": "dark",
    "features": ["payment", "inventory"],
    "customization": {
      "brandColor": "#FF6B35",
      "logo": "https://pizzapalace.com/logo.png"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "implementation": {
      "id": "impl-123",
      "endUserId": "end-user-456",
      "projectId": "project-123",
      "builderId": "builder-123",
      "implementationUrl": "https://pizzapalace.com",
      "status": "active",
      "embedCode": "<script src='https://widget.builderai.com/impl-123.js'></script>",
      "configuration": {
        "theme": "dark",
        "features": ["payment", "inventory"],
        "customization": {
          "brandColor": "#FF6B35",
          "logo": "https://pizzapalace.com/logo.png"
        }
      },
      "createdAt": "2024-12-19T10:30:00Z"
    }
  }
}
```

### 5.2 Get Widget Implementation
**GET** `/api/widgets/:widgetId`

**Response:**
```json
{
  "success": true,
  "data": {
    "implementation": {
      "id": "impl-123",
      "endUserId": "end-user-456",
      "endUserName": "Pizza Palace",
      "projectId": "project-123",
      "projectName": "Restaurant POS System",
      "builderId": "builder-123",
      "builderName": "John Doe",
      "implementationUrl": "https://pizzapalace.com",
      "status": "active",
      "embedCode": "<script src='https://widget.builderai.com/impl-123.js'></script>",
      "configuration": {
        "theme": "dark",
        "features": ["payment", "inventory"],
        "customization": {
          "brandColor": "#FF6B35",
          "logo": "https://pizzapalace.com/logo.png"
        }
      },
      "usageCount": 1250,
      "revenue": 400,
      "lastActivity": "2024-12-19T10:30:00Z",
      "createdAt": "2024-12-18T14:20:00Z"
    }
  }
}
```

### 5.3 Update Widget Configuration
**PATCH** `/api/widgets/:widgetId/configuration`

**Request Body:**
```json
{
  "configuration": {
    "theme": "light",
    "features": ["payment", "inventory", "analytics"],
    "customization": {
      "brandColor": "#4A90E2",
      "logo": "https://pizzapalace.com/new-logo.png"
    }
  }
}
```

### 5.4 Get Widget Usage
**GET** `/api/widgets/:widgetId/usage`

**Query Parameters:**
- `period` (optional): day, week, month, year
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsage": 1250,
      "monthlyUsage": 450,
      "revenue": 400,
      "monthlyRevenue": 150
    },
    "trend": [
      {
        "date": "2024-12-01",
        "usage": 45,
        "revenue": 15
      }
    ],
    "events": [
      {
        "timestamp": "2024-12-19T10:30:00Z",
        "event": "widget_load",
        "data": {
          "page": "/checkout",
          "userAgent": "Mozilla/5.0..."
        }
      }
    ]
  }
}
```

### 5.5 Track Widget Usage
**POST** `/api/widgets/:widgetId/track`

**Request Body:**
```json
{
  "event": "widget_load",
  "data": {
    "page": "/checkout",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "session-123"
  },
  "timestamp": "2024-12-19T10:30:00Z"
}
```

---

## 6. Project Service

**Service URL**: `project-service:3006`
**Frontend Pages**: Dashboard (projects), Projects, Chat Development (project creation)

### 6.1 Get User Projects
**GET** `/api/projects`

**Query Parameters:**
- `userId` (required): User ID
- `status` (optional): development, testing, published
- `limit` (optional): Number of projects (default: 50)
- `offset` (optional): Number to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project-123",
        "userId": "builder-123",
        "name": "Restaurant POS System",
        "description": "Complete restaurant management solution",
        "prompt": "Create a comprehensive restaurant POS system...",
        "status": "published",
        "llm": "claude",
        "mcpServers": ["database", "payment", "inventory"],
        "files": [
          {
            "id": "file-123",
            "name": "Knowledge Article 1",
            "size": 12400,
            "type": "markdown"
          }
        ],
        "implementations": 12,
        "revenue": 4800,
        "revenueGrowth": 15,
        "published": true,
        "publishedAt": "2024-12-15T10:30:00Z",
        "createdAt": "2024-12-10T10:30:00Z",
        "updatedAt": "2024-12-18T14:20:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 6.2 Publish Project to Marketplace
**POST** `/api/projects/:projectId/publish`

**Request Body:**
```json
{
  "price": 4900,
  "category": "business",
  "description": "Complete restaurant management solution for restaurants",
  "features": [
    "Payment processing",
    "Inventory management",
    "Order tracking",
    "Customer management"
  ],
  "screenshots": [
    "https://example.com/screenshot1.png",
    "https://example.com/screenshot2.png"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "marketplaceApp": {
      "id": "marketplace-123",
      "projectId": "project-123",
      "name": "Restaurant POS System",
      "description": "Complete restaurant management solution",
      "price": 4900,
      "category": "business",
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
      "createdAt": "2024-12-19T10:30:00Z"
    }
  }
}
```

---

## 7. Marketplace Service

**Service URL**: `marketplace-service:3007`
**Frontend Pages**: Marketplace, Project Details (publishing)

### 7.1 Get Marketplace Apps
**GET** `/api/marketplace/apps`

**Query Parameters:**
- `category` (optional): business, content, service, custom
- `search` (optional): Search by name or description
- `minRating` (optional): Minimum rating (0-5)
- `maxPrice` (optional): Maximum price (in cents)
- `sortBy` (optional): popularity, rating, price, date
- `order` (optional): asc, desc
- `limit` (optional): Number of apps (default: 20)
- `offset` (optional): Number to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "apps": [
      {
        "id": "marketplace-123",
        "name": "Restaurant POS System",
        "description": "Complete restaurant management solution",
        "price": 4900,
        "rating": 4.8,
        "downloads": 1200,
        "category": "business",
        "icon": "🛒",
        "builder": {
          "id": "builder-123",
          "name": "John Doe",
          "username": "johndoe"
        },
        "features": [
          "Payment processing",
          "Inventory management",
          "Order tracking"
        ],
        "createdAt": "2024-12-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### 7.2 Purchase Template (Builder)
**POST** `/api/marketplace/apps/:appId/purchase`

**Request Body:**
```json
{
  "buyerId": "builder-456",
  "paymentMethod": "pm_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purchase": {
      "id": "purchase-123",
      "buyerId": "builder-456",
      "appId": "marketplace-123",
      "sellerId": "builder-123",
      "amount": 4900,
      "status": "completed",
      "purchaseDate": "2024-12-19T10:30:00Z"
    },
    "project": {
      "id": "project-456",
      "name": "Restaurant POS System - Copy",
      "description": "Complete restaurant management solution",
      "status": "development",
      "templateId": "project-123",
      "createdAt": "2024-12-19T10:30:00Z"
    }
  }
}
```

### 7.3 Purchase Widget (End User)
**POST** `/api/marketplace/apps/:appId/buy-widget`

**Request Body:**
```json
{
  "endUserId": "end-user-456",
  "implementationUrl": "https://pizzapalace.com",
  "configuration": {
    "theme": "dark",
    "features": ["payment", "inventory"]
  },
  "paymentMethod": "pm_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purchase": {
      "id": "purchase-123",
      "endUserId": "end-user-456",
      "appId": "marketplace-123",
      "builderId": "builder-123",
      "amount": 4900,
      "status": "completed",
      "purchaseDate": "2024-12-19T10:30:00Z"
    },
    "implementation": {
      "id": "impl-123",
      "endUserId": "end-user-456",
      "projectId": "project-123",
      "builderId": "builder-123",
      "implementationUrl": "https://pizzapalace.com",
      "status": "active",
      "embedCode": "<script src='https://widget.builderai.com/impl-123.js'></script>",
      "createdAt": "2024-12-19T10:30:00Z"
    }
  }
}
```

---

## 8. Analytics Service

**Service URL**: `analytics-service:3008`
**Frontend Pages**: Analytics, Dashboard (metrics), Admin (platform analytics)

### 8.1 Get User Analytics
**GET** `/api/analytics/user`

**Query Parameters:**
- `userId` (required): User ID
- `persona` (required): super_admin, builder, end_user
- `period` (optional): day, week, month, year
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "persona": "builder",
    "overview": {
      "totalProjects": 15,
      "publishedProjects": 8,
      "totalImplementations": 45,
      "activeImplementations": 38,
      "totalRevenue": 12500,
      "monthlyGrowth": 15.5
    },
    "revenue": {
      "current": 12500,
      "previous": 10800,
      "growth": 15.5,
      "trend": [
        {
          "date": "2024-12-01",
          "revenue": 400,
          "implementations": 3
        }
      ]
    },
    "projects": {
      "byStatus": {
        "development": 5,
        "testing": 2,
        "published": 8
      },
      "byLLM": {
        "claude": 8,
        "gpt4": 4,
        "gemini": 2,
        "llama": 1
      }
    },
    "implementations": {
      "byProject": [
        {
          "projectId": "project-123",
          "projectName": "Restaurant POS System",
          "implementations": 12,
          "revenue": 4800
        }
      ],
      "byStatus": {
        "active": 38,
        "inactive": 5,
        "suspended": 2
      }
    }
  }
}
```

### 8.2 Get Platform Analytics (Super Admin)
**GET** `/api/analytics/platform`

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 127,
      "builders": 45,
      "endUsers": 82,
      "totalProjects": 450,
      "totalImplementations": 1200,
      "totalRevenue": 124500,
      "monthlyGrowth": 23.5
    },
    "byPersona": {
      "builders": {
        "count": 45,
        "activeProjects": 234,
        "totalRevenue": 89000,
        "avgRevenuePerBuilder": 1978
      },
      "endUsers": {
        "count": 82,
        "activeImplementations": 1200,
        "totalSpent": 35500,
        "avgSpentPerUser": 433
      }
    },
    "marketplace": {
      "totalApps": 150,
      "totalPurchases": 1200,
      "avgRating": 4.6,
      "topCategories": [
        { "category": "business", "count": 67 },
        { "category": "service", "count": 45 },
        { "category": "content", "count": 38 }
      ]
    },
    "revenue": {
      "total": 124500,
      "monthly": 41500,
      "growth": 23.5,
      "bySource": {
        "templateSales": 45000,
        "widgetUsage": 79500
      }
    }
  }
}
```

---

## 9. Billing Service

**Service URL**: `billing-service:3009`
**Frontend Pages**: Billing, Dashboard (usage metrics)

### 9.1 Get User Billing Info
**GET** `/api/billing/user`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "persona": "builder",
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
      "implementations": {
        "current": 45,
        "limit": null,
        "percentage": null
      },
      "apiCalls": {
        "current": 12000,
        "limit": 100000,
        "percentage": 12
      }
    },
    "revenue": {
      "total": 12500,
      "monthly": 3200,
      "pending": 800
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

---

## 10. Admin Service

**Service URL**: `admin-service:3010`
**Frontend Pages**: Admin

### 10.1 Get All Users (Super Admin)
**GET** `/api/admin/users`

**Query Parameters:**
- `persona` (optional): super_admin, builder, end_user
- `search` (optional): Search by name, email, or username
- `plan` (optional): Filter by subscription plan
- `status` (optional): Filter by account status
- `limit` (optional): Number of users (default: 50)
- `offset` (optional): Number to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "username": "johndoe",
        "email": "user@example.com",
        "name": "John Doe",
        "persona": "builder",
        "plan": "professional",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z",
        "lastLogin": "2024-12-19T09:30:00Z",
        "stats": {
          "projects": 15,
          "implementations": 45,
          "revenue": 12500
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
}
```

### 10.2 Get Builder Analytics (Super Admin)
**GET** `/api/admin/builders`

**Query Parameters:**
- `search` (optional): Search by name, email, or username
- `sortBy` (optional): revenue, projects, implementations
- `order` (optional): asc, desc
- `limit` (optional): Number of builders (default: 50)
- `offset` (optional): Number to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "builders": [
      {
        "id": "builder-123",
        "name": "John Doe",
        "email": "john@example.com",
        "status": "active",
        "joinedAt": "2024-01-15T10:30:00Z",
        "stats": {
          "projects": 15,
          "publishedProjects": 8,
          "implementations": 45,
          "totalRevenue": 12500,
          "monthlyRevenue": 3200
        },
        "topProjects": [
          {
            "projectId": "project-123",
            "name": "Restaurant POS System",
            "implementations": 12,
            "revenue": 4800
          }
        ]
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 10.3 Get End User Implementations (Super Admin)
**GET** `/api/admin/implementations`

**Query Parameters:**
- `builderId` (optional): Filter by specific builder
- `status` (optional): active, inactive, suspended
- `limit` (optional): Number of implementations (default: 50)
- `offset` (optional): Number to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "implementations": [
      {
        "id": "impl-123",
        "projectId": "project-123",
        "projectName": "Restaurant POS System",
        "builderId": "builder-123",
        "builderName": "John Doe",
        "endUserId": "end-user-456",
        "endUserName": "Pizza Palace",
        "implementationUrl": "https://pizzapalace.com",
        "status": "active",
        "usageCount": 1250,
        "revenue": 400,
        "lastActivity": "2024-12-19T10:30:00Z",
        "createdAt": "2024-12-18T14:20:00Z"
      }
    ],
    "pagination": {
      "total": 1200,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## Frontend Page to Microservice Mapping

### Login Page
- **Authentication Service**: Login, registration, password reset
- **User Service**: Get user profile after login

### Dashboard Page (Persona-Based)
- **User Service**: User profile and stats
- **Builder Service**: Builder-specific metrics (if builder)
- **End User Service**: End-user metrics (if end user)
- **Project Service**: User projects list
- **Analytics Service**: User analytics and metrics
- **Billing Service**: Usage information

### Builder Dashboard Page
- **Builder Service**: Builder-specific dashboard
- **Project Service**: Builder's projects
- **Widget Service**: Builder's implementations
- **Analytics Service**: Builder analytics
- **Billing Service**: Builder revenue

### End User Dashboard Page
- **End User Service**: End-user dashboard
- **Widget Service**: End-user's widgets
- **Analytics Service**: End-user analytics
- **Billing Service**: End-user billing

### Chat Development Page
- **Chat Service**: Real-time chat functionality
- **Project Service**: Project creation and management
- **MCP Service**: Server selection and connection
- **File Service**: Knowledge file uploads
- **Notification Service**: Real-time notifications

### Projects Page
- **Project Service**: Project CRUD operations
- **File Service**: Project file management
- **Analytics Service**: Project performance metrics

### MCP Servers Page
- **MCP Service**: Server management and monitoring
- **Notification Service**: Connection status updates

### Marketplace Page
- **Marketplace Service**: App discovery and installation
- **Analytics Service**: App performance metrics

### Widget Implementation Page
- **Widget Service**: Widget implementation and configuration
- **Analytics Service**: Widget analytics
- **Billing Service**: Widget billing

### Analytics Page
- **Analytics Service**: Comprehensive analytics and reporting
- **Project Service**: Project data for analytics

### Billing Page
- **Billing Service**: Subscription and payment management
- **Analytics Service**: Usage analytics

### Admin Page (Super Admin)
- **Admin Service**: User management and system administration
- **Analytics Service**: Platform-wide analytics
- **Monitoring Service**: System health and metrics

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-12-19T10:30:00Z"
}
```

### Error Codes
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

## Rate Limiting

### Per-Service Rate Limits
- **Authentication Service**: 10 requests per minute
- **User Service**: 100 requests per minute
- **Builder Service**: 100 requests per minute
- **End User Service**: 100 requests per minute
- **Widget Service**: 200 requests per minute
- **Project Service**: 100 requests per minute
- **Chat Service**: 60 requests per minute
- **MCP Service**: 50 requests per minute
- **Marketplace Service**: 100 requests per minute
- **Analytics Service**: 30 requests per minute
- **Billing Service**: 20 requests per minute
- **Admin Service**: 50 requests per minute
- **File Service**: 50 requests per minute
- **Notification Service**: 100 requests per minute
- **Monitoring Service**: 10 requests per minute

## Service Communication

### Synchronous Communication
- **HTTP/REST**: For request-response patterns
- **gRPC**: For high-performance inter-service communication

### Asynchronous Communication
- **Event-Driven**: Using message queues for decoupled communication
- **Pub/Sub**: For broadcasting events across services

### Service Discovery
- **Consul**: For service registration and discovery
- **Load Balancing**: Automatic load balancing across service instances
