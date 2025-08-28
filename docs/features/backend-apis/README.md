# BuilderAI Microservices Architecture Documentation

## Overview

This documentation provides comprehensive information about the BuilderAI microservices architecture, including service definitions, implementation plans, and detailed API specifications. The BuilderAI platform is an AI-powered application development system built using a microservices architecture that enables users to create, deploy, and monetize applications through an intuitive chat-based interface.

## Documentation Structure

### 📋 [Architecture Overview](./architecture-overview.md)
Comprehensive microservices architecture documentation including:
- High-level system design with service mesh
- Technology stack for each microservice
- Database per service pattern
- Communication patterns and protocols
- Security architecture
- Scalability and deployment design

### 🔌 [Microservices API Definitions](./microservices-api-definitions.md)
Complete API specification for all 12 microservices:
- 12 microservices with 100+ endpoints
- Service-to-frontend page mapping
- Request/response formats
- Authentication and authorization
- Error handling and rate limiting
- WebSocket specifications
- Service communication patterns

### 📅 [Implementation Plan](./implementation-plan.md)
Detailed 18-week microservices implementation roadmap:
- 6 implementation phases
- Service-specific task breakdowns
- Infrastructure and deployment strategies
- Testing strategies for each service
- Success criteria and risk mitigation

### 🗄️ [PostgreSQL Storage Implementation](./postgresql-storage-implementation.md)
Complete PostgreSQL storage layer documentation:
- Migration from in-memory to PostgreSQL
- Drizzle ORM integration and usage
- Database schema definitions
- Storage interface implementation
- Error resolution and fixes
- Performance optimization strategies
- Testing and deployment guidelines

## Quick Start

### API Gateway Configuration
```
Production: https://api.builderai.com
Development: http://localhost:3000
```

### Service Routing
```
/api/auth/*          → Authentication Service (Port: 3001)
/api/users/*         → User Service (Port: 3002)
/api/projects/*      → Project Service (Port: 3003)
/api/chat/*          → Chat Service (Port: 3004)
/api/mcp/*           → MCP Service (Port: 3005)
/api/marketplace/*   → Marketplace Service (Port: 3006)
/api/analytics/*     → Analytics Service (Port: 3007)
/api/billing/*       → Billing Service (Port: 3008)
/api/admin/*         → Admin Service (Port: 3009)
/api/files/*         → File Service (Port: 3010)
/api/notifications/* → Notification Service (Port: 3011)
/api/monitoring/*    → Monitoring Service (Port: 3012)
```

### Authentication
All APIs require authentication via JWT tokens except health check endpoints.

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

## Microservices Architecture

### 1. 🔐 Authentication Service (Port: 3001)
- User registration and login
- JWT token management
- OAuth integration
- Session management
- Password security

### 2. 👤 User Service (Port: 3002)
- Profile management
- Account settings
- User preferences
- User statistics

### 3. 📁 Project Service (Port: 3003)
- Project CRUD operations
- Project lifecycle management
- Project metadata
- Status tracking

### 4. 🔗 MCP Service (Port: 3004)
- MCP server connections
- Server health monitoring
- Protocol handling (SSE, WebSocket, gRPC)
- Connection pooling

### 5. 💬 Chat Service (Port: 3005)
- Real-time chat functionality
- AI response generation
- Conversation context
- WebSocket connections

### 6. 🏪 Marketplace Service (Port: 3006)
- App publishing and distribution
- App installation and customization
- Rating and review system
- Revenue tracking

### 7. 📊 Analytics Service (Port: 3007)
- User analytics and reporting
- Project performance metrics
- Revenue analytics
- Platform-wide analytics

### 8. 💳 Billing Service (Port: 3008)
- Subscription management
- Payment processing (Stripe)
- Usage tracking and limits
- Invoice generation

### 9. ⚙️ Admin Service (Port: 3009)
- User management (admin)
- System configuration
- Platform monitoring
- Audit logging

### 10. 📁 File Service (Port: 3010)
- File upload and storage
- File type validation
- Storage quota management
- Cloud storage integration

### 11. 🔔 Notification Service (Port: 3011)
- Real-time notifications
- Email notifications
- Push notifications
- Notification preferences

### 12. 🏥 Monitoring Service (Port: 3012)
- Health checks
- Performance monitoring
- Error tracking
- Metrics collection

## Frontend Page to Microservice Mapping

### Login Page
- **Authentication Service**: Login, registration, password reset
- **User Service**: Get user profile after login

### Dashboard Page
- **User Service**: User profile and stats
- **Project Service**: User projects list
- **Analytics Service**: User analytics and metrics
- **Billing Service**: Usage information
- **MCP Service**: Connected servers count

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

### Analytics Page
- **Analytics Service**: Comprehensive analytics and reporting
- **Project Service**: Project data for analytics

### Billing Page
- **Billing Service**: Subscription and payment management
- **Analytics Service**: Usage analytics

### Admin Page
- **Admin Service**: User management and system administration
- **Analytics Service**: Platform-wide analytics
- **Monitoring Service**: System health and metrics

## Key Features

### 🤖 AI Integration
- Multi-LLM support (Claude, GPT-4, Gemini, LLaMA)
- Intelligent prompt engineering
- Context-aware conversations
- Response caching and optimization

### 🔄 Real-time Communication
- WebSocket-based chat system
- Live project updates
- Real-time notifications
- Connection management

### 📈 Analytics & Monitoring
- Comprehensive user analytics
- Project performance tracking
- Revenue analytics
- System health monitoring

### 🛡️ Security & Scalability
- JWT-based authentication
- Role-based access control
- Rate limiting and throttling
- Input validation and sanitization
- Database per service pattern

### 💰 Monetization
- Marketplace for app distribution
- Subscription-based billing
- Revenue tracking
- Payment processing integration

## Technology Stack

### Microservices Infrastructure
- **Container Orchestration**: Kubernetes
- **API Gateway**: Kong or AWS API Gateway
- **Service Discovery**: Consul or AWS Service Discovery
- **Load Balancer**: Nginx or AWS ALB
- **Message Queue**: RabbitMQ or AWS SQS
- **Event Bus**: Apache Kafka or AWS EventBridge
- **Configuration Management**: Consul KV or AWS Parameter Store

### Individual Microservices
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL with Drizzle ORM (per service)
- **Authentication**: JWT with Redis for session storage
- **Real-time**: WebSocket with Socket.io
- **Validation**: Zod schema validation
- **Testing**: Jest with Supertest
- **Documentation**: OpenAPI/Swagger

### External Integrations
- **AI Providers**: OpenAI, Anthropic, Google
- **Payment Processing**: Stripe
- **File Storage**: AWS S3
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Caching**: Redis
- **Message Queue**: RabbitMQ

## Development Guidelines

### Code Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Comprehensive error handling
- Input validation with Zod schemas
- Proper HTTP status codes

### Testing Strategy
- Unit tests with 90%+ coverage target per service
- Integration tests for all service interactions
- Contract testing with Pact
- End-to-end testing
- Performance and load testing

### Security Practices
- JWT token management
- Password hashing and salting
- SQL injection prevention via ORM
- CORS configuration
- Rate limiting implementation
- mTLS for service-to-service communication

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Kubernetes (local: Minikube/Docker Desktop)
- PostgreSQL 14+
- Redis
- TypeScript knowledge

### Development Setup
1. Clone the repository
2. Set up Kubernetes cluster
3. Deploy infrastructure services
4. Deploy individual microservices
5. Configure API Gateway
6. Set up monitoring and logging

### Testing
- Run unit tests per service: `npm test`
- Run integration tests: `npm run test:integration`
- Run contract tests: `npm run test:contract`
- Run all tests: `npm run test:all`

## Support & Resources

### Documentation
- [Architecture Overview](./architecture-overview.md)
- [Microservices API Definitions](./microservices-api-definitions.md)
- [Implementation Plan](./implementation-plan.md)

### Development Resources
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Zod Schema Validation](https://zod.dev/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Istio Service Mesh](https://istio.io/docs/)

### External Services
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Contributing

### Development Process
1. Follow the microservices implementation plan
2. Write comprehensive tests for each service
3. Update API documentation for any changes
4. Follow security best practices
5. Ensure backward compatibility

### Code Review Checklist
- [ ] All tests passing for the service
- [ ] Code follows TypeScript standards
- [ ] Input validation implemented
- [ ] Error handling comprehensive
- [ ] API documentation updated
- [ ] Security considerations addressed
- [ ] Service communication patterns followed

## License

This project is proprietary software. All rights reserved.

---

**Last Updated**: December 19, 2024  
**Version**: 1.0.0  
**Status**: Planning Phase - Microservices Architecture
