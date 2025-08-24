import { type User, type InsertUser, type Project, type InsertProject, type McpServer, type InsertMcpServer, type ChatMessage, type InsertChatMessage, type MarketplaceApp, type InsertMarketplaceApp, type SocialAccount, type InsertSocialAccount } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private socialAccounts: Map<string, SocialAccount> = new Map();
  private projects: Map<string, Project> = new Map();
  private mcpServers: Map<string, McpServer> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private marketplaceApps: Map<string, MarketplaceApp> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create demo users
    const demoUser: User = {
      id: "demo-user-id",
      email: "demo@mcpbuilder.com",
      password_hash: "$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22", // "demo123" hashed
      persona: "builder",
      roles: ["builder"],
      permissions: ["create_project", "edit_project", "publish_project", "view_analytics"],
      metadata: {},
      isActive: "true",
      approvalStatus: "approved",
      approvedBy: "user-4", // Super admin
      approvedAt: new Date(),
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Additional demo users for admin panel
    const additionalUsers: User[] = [
      {
        id: "user-2",
        email: "john@example.com",
        password_hash: "$2b$12$ll0ggtpr6Zw.XMqJuy14A.EkmdaznQsxoet2qEoW.dOXWkqJpEW7W", // "password123" hashed
        persona: "builder",
        roles: ["builder"],
        permissions: ["create_project", "edit_project", "publish_project"],
        metadata: {},
        isActive: "true",
        approvalStatus: "approved",
        approvedBy: "user-4", // Super admin
        approvedAt: new Date("2024-12-15"),
        lastLoginAt: null,
        createdAt: new Date("2024-12-15"),
        updatedAt: new Date("2024-12-15"),
      },
      {
        id: "user-3",
        email: "alice@company.com",
        password_hash: "$2b$12$ll0ggtpr6Zw.XMqJuy14A.EkmdaznQsxoet2qEoW.dOXWkqJpEW7W", // "password123" hashed
        persona: "end_user",
        roles: ["end_user"],
        permissions: ["purchase_project", "use_widget"],
        metadata: {},
        isActive: "true",
        approvalStatus: "approved",
        approvedBy: "user-4", // Super admin
        approvedAt: new Date("2024-12-14"),
        lastLoginAt: null,
        createdAt: new Date("2024-12-14"),
        updatedAt: new Date("2024-12-14"),
      },
      {
        id: "user-4",
        email: "mike@startup.io",
        password_hash: "$2b$12$ll0ggtpr6Zw.XMqJuy14A.EkmdaznQsxoet2qEoW.dOXWkqJpEW7W", // "password123" hashed
        persona: "super_admin",
        roles: ["super_admin"],
        permissions: ["*"], // Super admin has all permissions
        metadata: {},
        isActive: "true",
        approvalStatus: "approved", // Super admin is auto-approved
        approvedBy: null,
        approvedAt: new Date("2024-12-13"),
        lastLoginAt: null,
        createdAt: new Date("2024-12-13"),
        updatedAt: new Date("2024-12-13"),
      },
      {
        id: "user-5",
        email: "emma@design.co",
        password_hash: "$2b$12$ll0ggtpr6Zw.XMqJuy14A.EkmdaznQsxoet2qEoW.dOXWkqJpEW7W", // "password123" hashed
        persona: "builder",
        roles: ["builder"],
        permissions: ["create_project", "edit_project", "publish_project", "view_analytics"],
        metadata: {},
        isActive: "true",
        approvalStatus: "approved",
        approvedBy: "user-4", // Super admin
        approvedAt: new Date("2024-12-12"),
        lastLoginAt: null,
        createdAt: new Date("2024-12-12"),
        updatedAt: new Date("2024-12-12"),
      },
    ];
    additionalUsers.forEach(user => this.users.set(user.id, user));

    // Add builder user for builder-specific projects
    const builderUser: User = {
      id: "user-builder",
      email: "builder@builderai.com",
      password_hash: "$2b$12$LjBayR399a7o9BFQW6ijSuKVhDFv8jgw4MxWTMwEZyCANJW/83HRO", // "builder123" hashed
      persona: "builder",
      roles: ["builder"],
      permissions: ["create_project", "edit_project", "publish_project", "view_analytics"],
      metadata: {},
      isActive: "true",
      approvalStatus: "approved",
      approvedBy: "user-4", // Super admin
      approvedAt: new Date("2024-12-10"),
      lastLoginAt: null,
      createdAt: new Date("2024-12-10"),
      updatedAt: new Date("2024-12-10"),
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
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      persona: insertUser.persona || "builder",
      roles: Array.isArray(insertUser.roles) ? (insertUser.roles as string[]) : [insertUser.persona || "builder"],
      permissions: Array.isArray(insertUser.permissions) ? (insertUser.permissions as string[]) : [],
      metadata: insertUser.metadata || {},
      isActive: "true",
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

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
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
    const user = this.users.get(id);
    if (!user) return;

    const updatedUser = { ...user, lastLoginAt: new Date() };
    this.users.set(id, updatedUser);
  }

  async getPendingUsers(): Promise<User[]> {
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
}

export const storage = new MemStorage();
