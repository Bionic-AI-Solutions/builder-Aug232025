import { type InsertUser, type Project, type InsertProject, type McpServer, type InsertMcpServer, type ChatMessage, type InsertChatMessage, type MarketplaceApp, type InsertMarketplaceApp, type SocialAccount, type InsertSocialAccount } from "@shared/schema";
import { type User as AuthUser, type Persona, type UserRole, type Permission } from "./lib/auth";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import {
  llmProviders,
  llmModels,
  type LLMProvider,
  type NewLLMProvider,
  type LLMModel,
  type NewLLMModel,
} from "../shared/schema";
import { db } from "./db";
import { client } from "./db";

// Storage User interface that extends AuthUser with additional fields
interface StorageUser extends AuthUser {
  password_hash: string;
  lastLoginAt: Date | null;
}

// Marketplace types
export interface MarketplaceProject {
  id: string;
  projectId: string;
  builderId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  featured: boolean;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  revenue: number;
  publishedAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
  builderName?: string;
}

export interface InsertMarketplaceProject {
  projectId: string;
  builderId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  status?: 'active' | 'inactive' | 'suspended' | 'deleted';
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  downloadCount?: number;
  revenue?: number;
  metadata?: Record<string, any>;
}

export interface MarketplacePurchase {
  id: string;
  projectId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentMethod?: string;
  purchasedAt: Date;
  metadata: Record<string, any>;
  project?: MarketplaceProject;
}

export interface InsertMarketplacePurchase {
  projectId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

export interface MarketplaceReview {
  id: string;
  projectId: string;
  reviewerId: string;
  rating: number;
  reviewText: string;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertMarketplaceReview {
  projectId: string;
  reviewerId: string;
  rating: number;
  reviewText: string;
  helpfulCount?: number;
}

export interface MarketplaceDownload {
  id: string;
  projectId: string;
  userId: string;
  downloadType: 'purchase' | 'demo' | 'update';
  downloadedAt: Date;
  metadata: Record<string, any>;
}

export interface InsertMarketplaceDownload {
  projectId: string;
  userId: string;
  downloadType?: 'purchase' | 'demo' | 'update';
  metadata?: Record<string, any>;
}

export interface MarketplaceQueryOptions {
  filters?: {
    status?: string;
    category?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    tags?: string[];
  };
  sortBy?: 'price' | 'rating' | 'downloads' | 'date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MarketplaceQueryResult {
  projects: MarketplaceProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MarketplaceStats {
  totalProjects: number;
  activeProjects: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<StorageUser | undefined>;
  getUserByEmail(email: string): Promise<StorageUser | undefined>;
  getUserById(id: string): Promise<StorageUser | undefined>;
  getAllUsers(): Promise<StorageUser[]>;
  getPendingUsers(): Promise<StorageUser[]>;
  createUser(user: InsertUser): Promise<StorageUser>;
  updateUser(id: string, updates: Partial<StorageUser>): Promise<StorageUser | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  updateUserLastLogin(id: string): Promise<void>;
  approveUser(userId: string, approvedBy: string): Promise<void>;
  rejectUser(userId: string, rejectedBy: string, reason: string): Promise<void>;
  deleteUser(id: string): Promise<boolean>;

  // Social Accounts (OAuth)
  getSocialAccount(provider: string, providerUserId: string): Promise<SocialAccount | undefined>;
  getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]>;
  createSocialAccount(socialAccount: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount | undefined>;
  deleteSocialAccount(id: string): Promise<boolean>;
  linkSocialAccount(userId: string, provider: string, providerUserId: string, profileData: any): Promise<SocialAccount>;

  // Projects
  getProjects(userId: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;

  // MCP Servers
  getMcpServers(userId: string): Promise<McpServer[]>;
  getMcpServer(id: string): Promise<McpServer | undefined>;
  createMcpServer(server: InsertMcpServer): Promise<McpServer>;
  updateMcpServer(id: string, updates: Partial<McpServer>): Promise<McpServer | undefined>;
  deleteMcpServer(id: string): Promise<boolean>;

  // Chat Messages
  getChatMessages(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Marketplace Apps
  getMarketplaceApps(): Promise<MarketplaceApp[]>;
  getMarketplaceApp(id: string): Promise<MarketplaceApp | undefined>;
  createMarketplaceApp(app: InsertMarketplaceApp): Promise<MarketplaceApp>;

  // Marketplace Projects
  getMarketplaceProjects(options?: MarketplaceQueryOptions): Promise<MarketplaceQueryResult>;
  getMarketplaceProject(id: string): Promise<MarketplaceProject | undefined>;
  getMarketplaceProjectByProjectId(projectId: string): Promise<MarketplaceProject | undefined>;
  createMarketplaceProject(project: InsertMarketplaceProject): Promise<MarketplaceProject>;
  updateMarketplaceProject(id: string, updates: Partial<MarketplaceProject>): Promise<MarketplaceProject | undefined>;
  deleteMarketplaceProject(id: string): Promise<boolean>;
  getFeaturedMarketplaceProjects(): Promise<MarketplaceProject[]>;

  // Marketplace Purchases
  createMarketplacePurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase>;
  getUserPurchase(userId: string, projectId: string): Promise<MarketplacePurchase | undefined>;
  getUserPurchases(userId: string): Promise<MarketplacePurchase[]>;

  // Marketplace Reviews
  createMarketplaceReview(review: InsertMarketplaceReview): Promise<MarketplaceReview>;
  getMarketplaceProjectReviews(projectId: string, options?: { page?: number; limit?: number }): Promise<MarketplaceReview[]>;
  getUserProjectReview(userId: string, projectId: string): Promise<MarketplaceReview | undefined>;

  // Marketplace Downloads
  createMarketplaceDownload(download: InsertMarketplaceDownload): Promise<MarketplaceDownload>;
  generateDownloadToken(projectId: string, userId: string): Promise<string>;

  // Marketplace Analytics
  getMarketplaceStats(): Promise<MarketplaceStats>;

  // Revenue Events
  createRevenueEvent(event: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, StorageUser> = new Map();
  private socialAccounts: Map<string, SocialAccount> = new Map();
  private projects: Map<string, Project> = new Map();
  private mcpServers: Map<string, McpServer> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private marketplaceApps: Map<string, MarketplaceApp> = new Map();
  private marketplaceProjects: Map<string, MarketplaceProject> = new Map();
  private marketplacePurchases: Map<string, MarketplacePurchase> = new Map();
  private marketplaceReviews: Map<string, MarketplaceReview> = new Map();
  private marketplaceDownloads: Map<string, MarketplaceDownload> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create demo users
    const demoUser: StorageUser = {
      id: "demo-user-id",
      email: "demo@mcpbuilder.com",
      password_hash: "$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22", // "demo123" hashed
      persona: "builder" as Persona,
      roles: ["builder"] as UserRole[],
      permissions: ["create_project", "edit_project", "publish_project", "view_analytics"] as Permission[],
      metadata: {},
      isActive: true,
      approvalStatus: "approved",
      approvedBy: "user-4", // Super admin
      approvedAt: new Date(),
      rejectionReason: undefined,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Additional demo users for admin panel
    const additionalUsers: StorageUser[] = [
      {
        id: "user-2",
        email: "john.doe@example.com",
        password_hash: "$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22",
        persona: "end_user" as Persona,
        roles: ["end_user"] as UserRole[],
        permissions: ["purchase_project", "view_marketplace"] as Permission[],
        metadata: {},
        isActive: true,
        approvalStatus: "approved",
        approvedBy: "user-4",
        approvedAt: new Date(),
        rejectionReason: undefined,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user-3",
        email: "jane.smith@example.com",
        password_hash: "$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22",
        persona: "builder" as Persona,
        roles: ["builder"] as UserRole[],
        permissions: ["create_project", "edit_project", "publish_project", "view_analytics"] as Permission[],
        metadata: {},
        isActive: true,
        approvalStatus: "approved",
        approvedBy: "user-4",
        approvedAt: new Date(),
        rejectionReason: undefined,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user-4",
        email: "admin@builderai.com",
        password_hash: "$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22",
        persona: "super_admin" as Persona,
        roles: ["super_admin"] as UserRole[],
        permissions: ["manage_users", "manage_marketplace", "view_all_analytics", "approve_users"] as Permission[],
        metadata: {},
        isActive: true,
        approvalStatus: "approved",
        approvedBy: "user-4",
        approvedAt: new Date(),
        rejectionReason: undefined,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user-5",
        email: "pending@example.com",
        password_hash: "$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22",
        persona: "builder" as Persona,
        roles: ["builder"] as UserRole[],
        permissions: ["create_project", "edit_project"] as Permission[],
        metadata: {},
        isActive: false,
        approvalStatus: "pending",
        approvedBy: undefined,
        approvedAt: undefined,
        rejectionReason: undefined,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "user-6",
        email: "rejected@example.com",
        password_hash: "$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22",
        persona: "end_user" as Persona,
        roles: ["end_user"] as UserRole[],
        permissions: ["purchase_project"] as Permission[],
        metadata: {},
        isActive: false,
        approvalStatus: "rejected",
        approvedBy: "user-4",
        approvedAt: undefined,
        rejectionReason: "Invalid business information",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    additionalUsers.forEach(user => this.users.set(user.id, user));

    // Add builder user for builder-specific projects
    const builderUser: StorageUser = {
      id: "user-builder",
      email: "builder@builderai.com",
      password_hash: "$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22", // "demo123" hashed
      persona: "builder" as Persona,
      roles: ["builder"] as UserRole[],
      permissions: ["create_project", "edit_project", "publish_project", "view_analytics"] as Permission[],
      metadata: {},
      isActive: true,
      approvalStatus: "approved",
      approvedBy: "user-4", // Super admin
      approvedAt: new Date(),
      rejectionReason: undefined,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(builderUser.id, builderUser);

    // Create demo projects for demo user
    const projects: Project[] = [
      {
        id: "project-1",
        userId: demoUser.id,
        name: "Restaurant App",
        description: "Complete restaurant management system with online ordering",
        prompt: "Create a comprehensive restaurant management application with menu management, order processing, table reservations, and staff dashboard",
        status: "completed",
        llm: "claude",
        mcpServers: ["database", "api", "payment"],
        files: [
          { name: "Restaurant Knowledge Base", size: "2.4kb", type: "markdown" },
          { name: "Menu Management Guide", size: "8.1kb", type: "markdown" },
          { name: "Order Processing Manual", size: "3.2kb", type: "markdown" },
          { name: "Staff Training Materials", size: "5.7kb", type: "markdown" },
          { name: "Customer Service Guidelines", size: "4.8kb", type: "markdown" },
        ],
        revenue: 4500, // $45.00
        revenueGrowth: 12.5,
        published: "true",
        marketplacePrice: 29.99,
        marketplaceDescription: "Complete restaurant management chatbot with menu handling, order processing, and customer support capabilities.",
        createdAt: new Date("2024-12-10"),
      },
      {
        id: "project-2",
        userId: demoUser.id,
        name: "E-commerce Store",
        description: "Modern e-commerce platform with cart and payments",
        prompt: "Build a complete e-commerce store with product catalog, shopping cart, payment processing, and order management",
        status: "completed",
        llm: "claude",
        mcpServers: ["database", "api", "payment"],
        files: [
          { name: "E-commerce Knowledge Base", size: "15.7kb", type: "markdown" },
          { name: "Product Catalog Guide", size: "9.3kb", type: "markdown" },
          { name: "Payment Processing Manual", size: "7.2kb", type: "markdown" },
          { name: "Order Management Guide", size: "6.8kb", type: "markdown" },
          { name: "Customer Support Handbook", size: "11.4kb", type: "markdown" },
        ],
        revenue: 7250, // $72.50
        revenueGrowth: 25,
        published: "true",
        marketplacePrice: 19.99,
        marketplaceDescription: "Modern e-commerce platform with cart and payments, perfect for online stores.",
        createdAt: new Date("2024-12-11"),
      },
      {
        id: "project-3",
        userId: demoUser.id,
        name: "Blog Platform",
        description: "Personal blog with content management",
        prompt: "Create a modern blog platform with content editor, categories, comments, and SEO optimization",
        status: "completed",
        llm: "gemini",
        mcpServers: ["database", "api", "auth"],
        files: [
          { name: "Blog Content Guidelines", size: "12.3kb", type: "markdown" },
          { name: "SEO Best Practices", size: "8.9kb", type: "markdown" },
          { name: "Content Management Guide", size: "5.4kb", type: "markdown" },
          { name: "Publishing Workflow", size: "6.7kb", type: "markdown" },
        ],
        revenue: 3200, // $32.00
        revenueGrowth: 12,
        published: "false",
        createdAt: new Date("2024-12-16"),
      },
      {
        id: "project-4",
        userId: demoUser.id,
        name: "Fitness Tracker",
        description: "Personal fitness and workout tracking app",
        prompt: "Build a fitness tracking application with workout plans, progress tracking, and health metrics",
        status: "testing",
        llm: "claude",
        mcpServers: ["database", "api"],
        files: [
          { name: "Fitness Training Guide", size: "18.2kb", type: "markdown" },
          { name: "Workout Plans Database", size: "14.5kb", type: "markdown" },
          { name: "Health Metrics Guide", size: "7.3kb", type: "markdown" },
        ],
        revenue: 0,
        revenueGrowth: 0,
        published: "false",
        createdAt: new Date("2024-12-15"),
      },
      {
        id: "project-5",
        userId: demoUser.id,
        name: "Task Manager",
        description: "Team collaboration and project management tool",
        prompt: "Create a task management application with team collaboration, project boards, and deadline tracking",
        status: "development",
        llm: "llama",
        mcpServers: ["database", "api", "auth"],
        files: [
          { name: "Project Management Guide", size: "16.8kb", type: "markdown" },
          { name: "Team Collaboration Handbook", size: "9.6kb", type: "markdown" },
          { name: "Task Management Best Practices", size: "3.9kb", type: "markdown" },
        ],
        revenue: 0,
        revenueGrowth: 0,
        published: "false",
        createdAt: new Date("2024-12-14"),
      },
      {
        id: "project-6",
        userId: demoUser.id,
        name: "Analytics Dashboard",
        description: "Business intelligence and data visualization platform",
        prompt: "Build a comprehensive analytics dashboard with data visualization, reporting tools, and real-time metrics",
        status: "completed",
        llm: "gpt4",
        mcpServers: ["database", "api", "analytics"],
        files: [
          { name: "Analytics Framework Guide", size: "22.1kb", type: "markdown" },
          { name: "Data Visualization Standards", size: "18.7kb", type: "markdown" },
          { name: "Reporting Best Practices", size: "14.3kb", type: "markdown" },
          { name: "API Integration Guide", size: "12.9kb", type: "markdown" },
        ],
        revenue: 0,
        revenueGrowth: 0,
        published: "false",
        createdAt: new Date("2024-12-13"),
      },
    ];

    // Create projects for builder user (user-builder)
    const builderProjects: Project[] = [
      {
        id: "builder-project-1",
        userId: "user-builder",
        name: "Customer Support Chatbot",
        description: "AI-powered customer support chatbot with knowledge base integration",
        prompt: "Create an intelligent customer support chatbot that can handle common inquiries, integrate with knowledge base, and escalate complex issues",
        status: "completed",
        llm: "claude",
        mcpServers: ["database", "api", "knowledge"],
        files: [
          { name: "Customer Support Knowledge Base", size: "28.3kb", type: "markdown" },
          { name: "FAQ Database", size: "15.7kb", type: "markdown" },
          { name: "Support Workflow Guide", size: "12.4kb", type: "markdown" },
          { name: "Response Templates", size: "8.9kb", type: "markdown" },
        ],
        revenue: 0,
        revenueGrowth: 0,
        published: "true",
        marketplacePrice: 39.99,
        marketplaceDescription: "AI-powered customer support chatbot with comprehensive knowledge base integration and intelligent issue resolution.",
        createdAt: new Date("2024-12-18"),
      },
      {
        id: "builder-project-2",
        userId: "user-builder",
        name: "E-commerce Recommendation Engine",
        description: "Smart product recommendation system for online stores",
        prompt: "Build an AI-powered recommendation engine that suggests products based on user behavior, purchase history, and preferences",
        status: "completed",
        llm: "gpt4",
        mcpServers: ["database", "api", "analytics"],
        files: [
          { name: "Product Recommendation Guide", size: "31.2kb", type: "markdown" },
          { name: "User Behavior Analysis", size: "19.8kb", type: "markdown" },
          { name: "Product Database Schema", size: "14.6kb", type: "markdown" },
          { name: "Recommendation Algorithms", size: "11.3kb", type: "markdown" },
        ],
        revenue: 0,
        revenueGrowth: 0,
        published: "false",
        createdAt: new Date("2024-12-17"),
      },
      {
        id: "builder-project-3",
        userId: "user-builder",
        name: "Content Generation Assistant",
        description: "AI content creator for blogs, social media, and marketing",
        prompt: "Develop an AI assistant that generates high-quality content for blogs, social media posts, and marketing materials",
        status: "testing",
        llm: "gemini",
        mcpServers: ["database", "api", "content"],
        files: [
          { name: "Content Creation Guidelines", size: "25.7kb", type: "markdown" },
          { name: "Writing Style Guide", size: "13.4kb", type: "markdown" },
          { name: "SEO Content Best Practices", size: "16.8kb", type: "markdown" },
        ],
        revenue: 0,
        revenueGrowth: 0,
        published: "false",
        createdAt: new Date("2024-12-16"),
      },
      {
        id: "builder-project-4",
        userId: "user-builder",
        name: "Financial Planning Advisor",
        description: "Personal finance advisor with investment recommendations",
        prompt: "Create a financial planning AI that provides personalized investment advice, budget planning, and financial goal tracking",
        status: "development",
        llm: "claude",
        mcpServers: ["database", "api", "finance"],
        files: [
          { name: "Financial Planning Guide", size: "18.9kb", type: "markdown" },
          { name: "Investment Strategies", size: "22.1kb", type: "markdown" },
          { name: "Budget Management Guide", size: "14.3kb", type: "markdown" },
        ],
        revenue: 0,
        revenueGrowth: 0,
        published: "false",
        createdAt: new Date("2024-12-15"),
      },
    ];

    projects.forEach(project => this.projects.set(project.id, project));
    builderProjects.forEach(project => this.projects.set(project.id, project));

    // Create demo MCP servers
    const servers: McpServer[] = [
      {
        id: "server-1",
        userId: demoUser.id,
        name: "Database MCP",
        type: "sse",
        url: "wss://db.mcpbuilder.com",
        description: "Real-time DB connections",
        status: "connected",
        latency: 45,
        createdAt: new Date(),
      },
      {
        id: "server-2",
        userId: demoUser.id,
        name: "API Gateway",
        type: "sse",
        url: "wss://api.mcpbuilder.com",
        description: "REST & GraphQL integrations",
        status: "connected",
        latency: 32,
        createdAt: new Date(),
      },
      {
        id: "server-3",
        userId: demoUser.id,
        name: "Auth MCP",
        type: "stdio",
        url: "",
        description: "User auth & authorization",
        status: "connected",
        latency: 28,
        createdAt: new Date(),
      },
    ];

    servers.forEach(server => this.mcpServers.set(server.id, server));

    // Create demo marketplace apps
    const marketplaceApps: MarketplaceApp[] = [
      {
        id: "app-1",
        projectId: "project-1",
        name: "E-commerce Store",
        description: "Complete e-commerce solution",
        price: 4900, // $49.00
        rating: "4.8",
        downloads: 1200,
        category: "business",
        icon: "⚡",
        createdAt: new Date(),
      },
      {
        id: "app-2",
        projectId: "project-2",
        name: "Blog Platform",
        description: "Modern blogging platform",
        price: 2900, // $29.00
        rating: "4.6",
        downloads: 890,
        category: "content",
        icon: "📊",
        createdAt: new Date(),
      },
      {
        id: "app-3",
        projectId: "project-3",
        name: "Booking System",
        description: "Appointment booking system",
        price: 3900, // $39.00
        rating: "4.9",
        downloads: 2100,
        category: "service",
        icon: "💬",
        createdAt: new Date(),
      },
    ];

    marketplaceApps.forEach(app => this.marketplaceApps.set(app.id, app));

    // Create demo marketplace projects with real data
    const marketplaceProject1: MarketplaceProject = {
      id: "mp-1",
      projectId: "project-1",
      builderId: "user-builder",
      title: "E-commerce Store Builder",
      description: "Complete e-commerce solution with product management, shopping cart, and payment processing. Perfect for online stores.",
      price: 4900, // $49.00
      category: "business",
      tags: ["ecommerce", "shopping", "payments", "retail"],
      status: "active",
      featured: true,
      rating: 4.8,
      reviewCount: 150,
      downloadCount: 1200,
      revenue: 4900,
      publishedAt: new Date("2024-12-10"),
      updatedAt: new Date("2024-12-10"),
      metadata: {},
      builderName: "Builder AI",
    };
    this.marketplaceProjects.set(marketplaceProject1.id, marketplaceProject1);

    const marketplaceProject2: MarketplaceProject = {
      id: "mp-2",
      projectId: "project-2",
      builderId: "user-builder",
      title: "Blog Platform Pro",
      description: "Modern blogging platform with content editor, SEO optimization, and social media integration.",
      price: 2900, // $29.00
      category: "content",
      tags: ["blogging", "seo", "content", "social"],
      status: "active",
      featured: false,
      rating: 4.6,
      reviewCount: 80,
      downloadCount: 890,
      revenue: 2900,
      publishedAt: new Date("2024-12-11"),
      updatedAt: new Date("2024-12-11"),
      metadata: {},
      builderName: "Builder AI",
    };
    this.marketplaceProjects.set(marketplaceProject2.id, marketplaceProject2);

    const marketplaceProject3: MarketplaceProject = {
      id: "mp-3",
      projectId: "project-3",
      builderId: "user-builder",
      title: "Appointment Booking System",
      description: "Professional appointment booking system with calendar integration, notifications, and payment processing.",
      price: 3900, // $39.00
      category: "service",
      tags: ["booking", "appointments", "calendar", "service"],
      status: "active",
      featured: true,
      rating: 4.9,
      reviewCount: 200,
      downloadCount: 2100,
      revenue: 3900,
      publishedAt: new Date("2024-12-12"),
      updatedAt: new Date("2024-12-12"),
      metadata: {},
      builderName: "Builder AI",
    };
    this.marketplaceProjects.set(marketplaceProject3.id, marketplaceProject3);

    const marketplaceProject4: MarketplaceProject = {
      id: "mp-4",
      projectId: "project-4",
      builderId: "user-builder",
      title: "Restaurant Management",
      description: "Complete restaurant management system with menu management, order processing, and staff dashboard.",
      price: 5900, // $59.00
      category: "business",
      tags: ["restaurant", "food", "management", "orders"],
      status: "active",
      featured: false,
      rating: 4.7,
      reviewCount: 95,
      downloadCount: 750,
      revenue: 5900,
      publishedAt: new Date("2024-12-13"),
      updatedAt: new Date("2024-12-13"),
      metadata: {},
      builderName: "Builder AI",
    };
    this.marketplaceProjects.set(marketplaceProject4.id, marketplaceProject4);

    const marketplaceProject5: MarketplaceProject = {
      id: "mp-5",
      projectId: "project-5",
      builderId: "user-builder",
      title: "Fitness Tracker Pro",
      description: "Personal fitness tracking app with workout plans, progress tracking, and health metrics.",
      price: 1900, // $19.00
      category: "health",
      tags: ["fitness", "health", "tracking", "workouts"],
      status: "active",
      featured: false,
      rating: 4.5,
      reviewCount: 120,
      downloadCount: 1800,
      revenue: 1900,
      publishedAt: new Date("2024-12-14"),
      updatedAt: new Date("2024-12-14"),
      metadata: {},
      builderName: "Builder AI",
    };
    this.marketplaceProjects.set(marketplaceProject5.id, marketplaceProject5);

    const marketplaceProject6: MarketplaceProject = {
      id: "mp-6",
      projectId: "project-6",
      builderId: "user-builder",
      title: "Real Estate CRM",
      description: "Customer relationship management system for real estate agents with lead tracking and property management.",
      price: 6900, // $69.00
      category: "business",
      tags: ["real-estate", "crm", "leads", "property"],
      status: "active",
      featured: true,
      rating: 4.8,
      reviewCount: 75,
      downloadCount: 450,
      revenue: 6900,
      publishedAt: new Date("2024-12-15"),
      updatedAt: new Date("2024-12-15"),
      metadata: {},
      builderName: "Builder AI",
    };
    this.marketplaceProjects.set(marketplaceProject6.id, marketplaceProject6);

    // Create demo marketplace purchases
    const marketplacePurchase1: MarketplacePurchase = {
      id: "mp-purchase-1",
      projectId: "mp-1",
      buyerId: "user-3",
      sellerId: "user-builder",
      amount: 4900,
      currency: "USD",
      status: "completed",
      transactionId: "txn-123",
      paymentMethod: "credit_card",
      purchasedAt: new Date("2024-12-10"),
      metadata: {},
    };
    this.marketplacePurchases.set(marketplacePurchase1.id, marketplacePurchase1);

    const marketplacePurchase2: MarketplacePurchase = {
      id: "mp-purchase-2",
      projectId: "mp-2",
      buyerId: "user-2",
      sellerId: "user-builder",
      amount: 2900,
      currency: "USD",
      status: "pending",
      transactionId: "txn-456",
      paymentMethod: "paypal",
      purchasedAt: new Date("2024-12-11"),
      metadata: {},
    };
    this.marketplacePurchases.set(marketplacePurchase2.id, marketplacePurchase2);

    // Create demo marketplace reviews
    const marketplaceReview1: MarketplaceReview = {
      id: "mp-review-1",
      projectId: "mp-1",
      reviewerId: "user-3",
      rating: 5,
      reviewText: "Excellent app! Highly recommend.",
      helpfulCount: 10,
      createdAt: new Date("2024-12-10"),
      updatedAt: new Date("2024-12-10"),
    };
    this.marketplaceReviews.set(marketplaceReview1.id, marketplaceReview1);

    const marketplaceReview2: MarketplaceReview = {
      id: "mp-review-2",
      projectId: "mp-2",
      reviewerId: "user-2",
      rating: 4,
      reviewText: "Good, but could use more features.",
      helpfulCount: 5,
      createdAt: new Date("2024-12-11"),
      updatedAt: new Date("2024-12-11"),
    };
    this.marketplaceReviews.set(marketplaceReview2.id, marketplaceReview2);

    // Create demo marketplace downloads
    const marketplaceDownload1: MarketplaceDownload = {
      id: "mp-download-1",
      projectId: "mp-1",
      userId: "user-3",
      downloadType: "purchase",
      downloadedAt: new Date("2024-12-10"),
      metadata: {},
    };
    this.marketplaceDownloads.set(marketplaceDownload1.id, marketplaceDownload1);

    const marketplaceDownload2: MarketplaceDownload = {
      id: "mp-download-2",
      projectId: "mp-2",
      userId: "user-2",
      downloadType: "demo",
      downloadedAt: new Date("2024-12-11"),
      metadata: {},
    };
    this.marketplaceDownloads.set(marketplaceDownload2.id, marketplaceDownload2);
  }

  // Users
  async getUser(id: string): Promise<StorageUser | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<StorageUser | undefined> {
    try {
      // First try to get from database using raw SQL
      const result = await client`
        SELECT 
          id,
          email,
          password_hash,
          persona,
          roles,
          permissions,
          metadata,
          is_active,
          approval_status,
          name,
          username,
          avatar_url,
          last_login_at,
          plan_type,
          created_at,
          updated_at
        FROM users 
        WHERE email = ${email}
      `;

      if (result.length > 0) {
        const dbUser = result[0];
        return {
          id: dbUser.id,
          email: dbUser.email,
          password_hash: dbUser.password_hash,
          persona: dbUser.persona as Persona,
          roles: dbUser.roles || [],
          permissions: dbUser.permissions || [],
          metadata: dbUser.metadata || {},
          isActive: dbUser.is_active,
          approvalStatus: dbUser.approval_status,
          name: dbUser.name,
          username: dbUser.username,
          avatarUrl: dbUser.avatar_url,
          lastLoginAt: dbUser.last_login_at,
          planType: dbUser.plan_type,
          createdAt: dbUser.created_at,
          updatedAt: dbUser.updated_at
        };
      }

      // Fallback to in-memory storage
      const user = Array.from(this.users.values()).find(user => user.email === email);
      if (user) {
        // Convert string isActive to boolean for auth compatibility
        return {
          ...user,
          isActive: user.isActive === true || user.isActive === "true"
        };
      }
      return user;
    } catch (error) {
      console.error('Error getting user by email from database:', error);
      // Fallback to in-memory storage
      const user = Array.from(this.users.values()).find(user => user.email === email);
      if (user) {
        return {
          ...user,
          isActive: user.isActive === true || user.isActive === "true"
        };
      }
      return user;
    }
  }

  async getUserById(id: string): Promise<StorageUser | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<StorageUser[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<StorageUser> {
    const id = randomUUID();
    const user: StorageUser = {
      ...insertUser,
      id,
      persona: (insertUser.persona || "builder") as Persona,
      roles: Array.isArray(insertUser.roles) ? (insertUser.roles as UserRole[]) : [(insertUser.persona || "builder") as UserRole],
      permissions: Array.isArray(insertUser.permissions) ? (insertUser.permissions as Permission[]) : [],
      metadata: insertUser.metadata || {},
      isActive: true,
      approvalStatus: insertUser.approvalStatus || "pending",
      approvedBy: insertUser.approvedBy,
      approvedAt: insertUser.approvedAt,
      rejectionReason: insertUser.rejectionReason,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<StorageUser>): Promise<StorageUser | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) return;

    const updatedUser = { ...user, password_hash: passwordHash };
    this.users.set(id, updatedUser);
  }

  async updateUserLastLogin(id: string): Promise<void> {
    try {
      // Update in database
      await client`
        UPDATE users 
        SET last_login_at = NOW(), updated_at = NOW() 
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error updating user last login in database:', error);
      // Fallback to in-memory storage
      const user = this.users.get(id);
      if (!user) return;

      const updatedUser = { ...user, lastLoginAt: new Date() };
      this.users.set(id, updatedUser);
    }
  }

  async getPendingUsers(): Promise<StorageUser[]> {
    return Array.from(this.users.values()).filter(user => user.approvalStatus === 'pending');
  }

  async approveUser(userId: string, approvedBy: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    const updatedUser = {
      ...user,
      approvalStatus: 'approved' as const,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
  }

  async rejectUser(userId: string, rejectedBy: string, reason: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    const updatedUser = {
      ...user,
      approvalStatus: 'rejected' as const,
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
  }

  // Social Accounts (OAuth)
  async getSocialAccount(provider: string, providerUserId: string): Promise<SocialAccount | undefined> {
    return Array.from(this.socialAccounts.values()).find(
      account => account.provider === provider && account.providerUserId === providerUserId
    );
  }

  async getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]> {
    return Array.from(this.socialAccounts.values()).filter(account => account.userId === userId);
  }

  async createSocialAccount(socialAccount: InsertSocialAccount): Promise<SocialAccount> {
    const id = randomUUID();
    const account: SocialAccount = {
      ...socialAccount,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.socialAccounts.set(id, account);
    return account;
  }

  async updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount | undefined> {
    const account = this.socialAccounts.get(id);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...updates, updatedAt: new Date() };
    this.socialAccounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteSocialAccount(id: string): Promise<boolean> {
    return this.socialAccounts.delete(id);
  }

  async linkSocialAccount(userId: string, provider: string, providerUserId: string, profileData: any): Promise<SocialAccount> {
    const socialAccount: InsertSocialAccount = {
      userId,
      provider,
      providerUserId,
      profileData,
    };

    return await this.createSocialAccount(socialAccount);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Projects
  async getProjects(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      description: insertProject.description || null,
      status: insertProject.status || "development",
      mcpServers: Array.isArray(insertProject.mcpServers) ? insertProject.mcpServers as string[] : [],
      files: Array.isArray(insertProject.files) ? insertProject.files as { name: string; size: string; type: string; }[] : [],
      revenue: insertProject.revenue || 0,
      revenueGrowth: insertProject.revenueGrowth || 0,
      published: insertProject.published || "false",
      createdAt: new Date()
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = { ...project, ...updates };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // MCP Servers
  async getMcpServers(userId: string): Promise<McpServer[]> {
    return Array.from(this.mcpServers.values()).filter(server => server.userId === userId);
  }

  async getMcpServer(id: string): Promise<McpServer | undefined> {
    return this.mcpServers.get(id);
  }

  async createMcpServer(insertServer: InsertMcpServer): Promise<McpServer> {
    const id = randomUUID();
    const server: McpServer = {
      ...insertServer,
      id,
      type: insertServer.type || "sse",
      url: insertServer.url || null,
      description: insertServer.description || null,
      status: insertServer.status || "disconnected",
      latency: insertServer.latency || 0,
      createdAt: new Date()
    };
    this.mcpServers.set(id, server);
    return server;
  }

  async updateMcpServer(id: string, updates: Partial<McpServer>): Promise<McpServer | undefined> {
    const server = this.mcpServers.get(id);
    if (!server) return undefined;

    const updatedServer = { ...server, ...updates };
    this.mcpServers.set(id, updatedServer);
    return updatedServer;
  }

  async deleteMcpServer(id: string): Promise<boolean> {
    return this.mcpServers.delete(id);
  }

  // Chat Messages
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Marketplace Apps
  async getMarketplaceApps(): Promise<MarketplaceApp[]> {
    return Array.from(this.marketplaceApps.values());
  }

  async getMarketplaceApp(id: string): Promise<MarketplaceApp | undefined> {
    return this.marketplaceApps.get(id);
  }

  async createMarketplaceApp(insertApp: InsertMarketplaceApp): Promise<MarketplaceApp> {
    const id = randomUUID();
    const app: MarketplaceApp = {
      ...insertApp,
      id,
      description: insertApp.description || null,
      rating: insertApp.rating || "0",
      downloads: insertApp.downloads || 0,
      category: insertApp.category || "custom",
      icon: insertApp.icon || "🔧",
      createdAt: new Date()
    };
    this.marketplaceApps.set(id, app);
    return app;
  }

  // Marketplace Projects
  async getMarketplaceProjects(options?: MarketplaceQueryOptions): Promise<MarketplaceQueryResult> {
    let projects = Array.from(this.marketplaceProjects.values());

    if (options?.filters) {
      if (options.filters.status) {
        projects = projects.filter(p => p.status === options.filters.status);
      }
      if (options.filters.category) {
        projects = projects.filter(p => p.category === options.filters.category);
      }
      if (options.filters.featured !== undefined) {
        projects = projects.filter(p => p.featured === options.filters.featured);
      }
      if (options.filters.minPrice !== undefined) {
        projects = projects.filter(p => p.price >= options.filters.minPrice);
      }
      if (options.filters.maxPrice !== undefined) {
        projects = projects.filter(p => p.price <= options.filters.maxPrice);
      }
      if (options.filters.minRating !== undefined) {
        projects = projects.filter(p => p.rating >= options.filters.minRating);
      }
      if (options.filters.tags && options.filters.tags.length > 0) {
        projects = projects.filter(p => p.tags.some(tag => options.filters.tags.includes(tag)));
      }
    }

    if (options?.sortBy) {
      projects.sort((a, b) => {
        if (options.sortOrder === 'asc') {
          if (options.sortBy === 'price') return a.price - b.price;
          if (options.sortBy === 'rating') return a.rating - b.rating;
          if (options.sortBy === 'downloads') return a.downloadCount - b.downloadCount;
          if (options.sortBy === 'date') return a.publishedAt.getTime() - b.publishedAt.getTime();
        } else {
          if (options.sortBy === 'price') return b.price - a.price;
          if (options.sortBy === 'rating') return b.rating - a.rating;
          if (options.sortBy === 'downloads') return b.downloadCount - a.downloadCount;
          if (options.sortBy === 'date') return b.publishedAt.getTime() - a.publishedAt.getTime();
        }
        return 0;
      });
    }

    const start = (options?.page || 1) * (options?.limit || 10) - (options?.limit || 10);
    const end = start + (options?.limit || 10);
    const paginatedProjects = projects.slice(start, end);

    return {
      projects: paginatedProjects,
      pagination: {
        page: options?.page || 1,
        limit: options?.limit || 10,
        total: projects.length,
        totalPages: Math.ceil(projects.length / (options?.limit || 10)),
      },
    };
  }

  async getMarketplaceProject(id: string): Promise<MarketplaceProject | undefined> {
    return this.marketplaceProjects.get(id);
  }

  async getMarketplaceProjectByProjectId(projectId: string): Promise<MarketplaceProject | undefined> {
    return Array.from(this.marketplaceProjects.values()).find(p => p.projectId === projectId);
  }

  async createMarketplaceProject(project: InsertMarketplaceProject): Promise<MarketplaceProject> {
    const id = randomUUID();
    const newProject: MarketplaceProject = {
      ...project,
      id,
      status: project.status || 'active',
      featured: project.featured || false,
      rating: project.rating || 0,
      reviewCount: project.reviewCount || 0,
      downloadCount: project.downloadCount || 0,
      revenue: project.revenue || 0,
      publishedAt: new Date(),
      updatedAt: new Date(),
      metadata: project.metadata || {},
    };
    this.marketplaceProjects.set(id, newProject);
    return newProject;
  }

  async updateMarketplaceProject(id: string, updates: Partial<MarketplaceProject>): Promise<MarketplaceProject | undefined> {
    const project = this.marketplaceProjects.get(id);
    if (!project) return undefined;

    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.marketplaceProjects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteMarketplaceProject(id: string): Promise<boolean> {
    return this.marketplaceProjects.delete(id);
  }

  async getFeaturedMarketplaceProjects(): Promise<MarketplaceProject[]> {
    return Array.from(this.marketplaceProjects.values()).filter(p => p.featured);
  }

  // Marketplace Purchases
  async createMarketplacePurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase> {
    const id = randomUUID();
    const newPurchase: MarketplacePurchase = {
      ...purchase,
      id,
      status: purchase.status || 'pending',
      purchasedAt: new Date(),
      metadata: purchase.metadata || {},
    };
    this.marketplacePurchases.set(id, newPurchase);
    return newPurchase;
  }

  async getUserPurchase(userId: string, projectId: string): Promise<MarketplacePurchase | undefined> {
    return Array.from(this.marketplacePurchases.values()).find(p => p.buyerId === userId && p.projectId === projectId);
  }

  async getUserPurchases(userId: string): Promise<MarketplacePurchase[]> {
    return Array.from(this.marketplacePurchases.values()).filter(p => p.buyerId === userId);
  }

  // Marketplace Reviews
  async createMarketplaceReview(review: InsertMarketplaceReview): Promise<MarketplaceReview> {
    const id = randomUUID();
    const newReview: MarketplaceReview = {
      ...review,
      id,
      helpfulCount: review.helpfulCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.marketplaceReviews.set(id, newReview);
    return newReview;
  }

  async getMarketplaceProjectReviews(projectId: string, options?: { page?: number; limit?: number }): Promise<MarketplaceReview[]> {
    const reviews = Array.from(this.marketplaceReviews.values()).filter(r => r.projectId === projectId);

    if (options?.sortBy) {
      reviews.sort((a, b) => {
        if (options.sortOrder === 'asc') {
          if (options.sortBy === 'date') return a.createdAt.getTime() - b.createdAt.getTime();
          if (options.sortBy === 'rating') return a.rating - b.rating;
        } else {
          if (options.sortBy === 'date') return b.createdAt.getTime() - a.createdAt.getTime();
          if (options.sortBy === 'rating') return b.rating - a.rating;
        }
        return 0;
      });
    }

    const start = (options?.page || 1) * (options?.limit || 10) - (options?.limit || 10);
    const end = start + (options?.limit || 10);
    const paginatedReviews = reviews.slice(start, end);

    return paginatedReviews;
  }

  async getUserProjectReview(userId: string, projectId: string): Promise<MarketplaceReview | undefined> {
    return Array.from(this.marketplaceReviews.values()).find(r => r.reviewerId === userId && r.projectId === projectId);
  }

  // Marketplace Downloads
  async createMarketplaceDownload(download: InsertMarketplaceDownload): Promise<MarketplaceDownload> {
    const id = randomUUID();
    const newDownload: MarketplaceDownload = {
      ...download,
      id,
      downloadedAt: new Date(),
      metadata: download.metadata || {},
    };
    this.marketplaceDownloads.set(id, newDownload);
    return newDownload;
  }

  async generateDownloadToken(projectId: string, userId: string): Promise<string> {
    const id = randomUUID();
    const download: MarketplaceDownload = {
      id,
      projectId,
      userId,
      downloadType: "demo", // Default to demo
      downloadedAt: new Date(),
      metadata: {},
    };
    this.marketplaceDownloads.set(id, download);
    return id; // Return the ID as the token
  }

  // Marketplace Analytics
  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const projects = Array.from(this.marketplaceProjects.values());
    const purchases = Array.from(this.marketplacePurchases.values());
    const reviews = Array.from(this.marketplaceReviews.values());
    const downloads = Array.from(this.marketplaceDownloads.values());

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalSales: purchases.filter(p => p.status === 'completed').length,
      totalRevenue: purchases.reduce((sum, p) => sum + p.amount, 0),
      averageRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      totalReviews: reviews.length,
    };
  }

  // Revenue Events
  async createRevenueEvent(event: any): Promise<any> {
    // In a real application, you would persist this event to a database
    // For now, we'll just return it
    return event;
  }
}

// ============================================================================
// LLM PROVIDERS STORAGE
// ============================================================================

/**
 * Get all LLM providers
 */
export async function getLLMProviders(): Promise<LLMProvider[]> {
  try {
    const result = await db.select().from(llmProviders).orderBy(llmProviders.createdAt);
    return result;
  } catch (error) {
    console.error('[STORAGE] Error fetching LLM providers:', error);
    throw new Error('Failed to fetch LLM providers');
  }
}

/**
 * Get LLM provider by ID
 */
export async function getLLMProvider(id: string): Promise<LLMProvider | null> {
  try {
    const result = await db.select().from(llmProviders).where(eq(llmProviders.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('[STORAGE] Error fetching LLM provider:', error);
    throw new Error('Failed to fetch LLM provider');
  }
}

/**
 * Create new LLM provider
 */
export async function createLLMProvider(provider: NewLLMProvider): Promise<LLMProvider> {
  try {
    const result = await db.insert(llmProviders).values(provider).returning();
    return result[0];
  } catch (error) {
    console.error('[STORAGE] Error creating LLM provider:', error);
    throw new Error('Failed to create LLM provider');
  }
}

/**
 * Update LLM provider
 */
export async function updateLLMProvider(id: string, updates: Partial<NewLLMProvider>): Promise<LLMProvider | null> {
  try {
    const result = await db
      .update(llmProviders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(llmProviders.id, id))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('[STORAGE] Error updating LLM provider:', error);
    throw new Error('Failed to update LLM provider');
  }
}

/**
 * Delete LLM provider
 */
export async function deleteLLMProvider(id: string): Promise<boolean> {
  try {
    const result = await db.delete(llmProviders).where(eq(llmProviders.id, id)).returning();
    return result.length > 0;
  } catch (error) {
    console.error('[STORAGE] Error deleting LLM provider:', error);
    throw new Error('Failed to delete LLM provider');
  }
}

/**
 * Get models for a provider
 */
export async function getLLMModels(providerId: string): Promise<LLMModel[]> {
  try {
    const result = await db
      .select()
      .from(llmModels)
      .where(eq(llmModels.providerId, providerId))
      .orderBy(llmModels.createdAt);
    return result;
  } catch (error) {
    console.error('[STORAGE] Error fetching LLM models:', error);
    throw new Error('Failed to fetch LLM models');
  }
}

/**
 * Create LLM model
 */
export async function createLLMModel(model: NewLLMModel): Promise<LLMModel> {
  try {
    const result = await db.insert(llmModels).values(model).returning();
    return result[0];
  } catch (error) {
    console.error('[STORAGE] Error creating LLM model:', error);
    throw new Error('Failed to create LLM model');
  }
}

/**
 * Update LLM model
 */
export async function updateLLMModel(id: string, updates: Partial<NewLLMModel>): Promise<LLMModel | null> {
  try {
    const result = await db
      .update(llmModels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(llmModels.id, id))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('[STORAGE] Error updating LLM model:', error);
    throw new Error('Failed to update LLM model');
  }
}

/**
 * Delete LLM model
 */
export async function deleteLLMModel(id: string): Promise<boolean> {
  try {
    const result = await db.delete(llmModels).where(eq(llmModels.id, id)).returning();
    return result.length > 0;
  } catch (error) {
    console.error('[STORAGE] Error deleting LLM model:', error);
    throw new Error('Failed to delete LLM model');
  }
}

export const storage = new MemStorage();
