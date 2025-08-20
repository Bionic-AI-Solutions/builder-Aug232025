# MCP Builder

## Overview

MCP Builder is a full-stack web application for developing and managing MCP (Model Context Protocol) applications through a conversational interface. The platform allows users to create, configure, and deploy applications using various AI models while managing MCP server connections and accessing a marketplace of pre-built solutions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Components**: Shadcn/ui component library with Radix UI primitives for consistent, accessible interface components
- **Styling**: Tailwind CSS with custom design system including brand colors and gradients
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for authentication state, React Query for server state management
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Development Storage**: In-memory storage implementation for development/demo purposes
- **API Design**: RESTful endpoints for users, projects, MCP servers, chat messages, and marketplace apps
- **Authentication**: Simple credential-based authentication (demo implementation)

### Data Storage Solutions
- **ORM**: Drizzle ORM with PostgreSQL dialect for production database operations
- **Schema**: Comprehensive database schema including users, projects, MCP servers, chat messages, and marketplace apps
- **Migrations**: Drizzle Kit for database schema migrations and management
- **Connection**: Neon Database serverless PostgreSQL for cloud database hosting

### Authentication and Authorization
- **Authentication**: Email/password based authentication with session management
- **Session Storage**: Connect-pg-simple for PostgreSQL session storage
- **User Management**: User profiles with plan-based access control (free, professional, etc.)
- **Demo Mode**: Built-in demo user for easy testing and demonstration

### Key Features and Components
- **Chat Development Interface**: Real-time conversational interface for application development
- **Project Management**: Full CRUD operations for managing development projects
- **MCP Server Management**: Configuration and monitoring of MCP server connections
- **Marketplace**: Browse and deploy pre-built applications and components
- **Analytics Dashboard**: Usage tracking and performance monitoring
- **Billing System**: Subscription management and usage tracking
- **Admin Panel**: Administrative tools for platform management

### Development Workflow
- **Hot Reload**: Vite development server with HMR for instant feedback
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Error Handling**: Comprehensive error boundaries and API error handling
- **Logging**: Request/response logging with performance metrics

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database schema management and migrations
- **@tanstack/react-query**: Server state management and caching
- **express**: Node.js web application framework

### UI and Component Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds

### Authentication and Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **zustand**: Lightweight state management for client-side auth state

### Form Handling and Validation
- **react-hook-form**: Performant forms with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **zod**: Schema validation and type inference
- **drizzle-zod**: Integration between Drizzle and Zod schemas

### Additional Utilities
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **nanoid**: Unique ID generation
- **wouter**: Lightweight React router