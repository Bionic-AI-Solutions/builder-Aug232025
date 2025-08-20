import { type User, type InsertUser, type Project, type InsertProject, type McpServer, type InsertMcpServer, type ChatMessage, type InsertChatMessage, type MarketplaceApp, type InsertMarketplaceApp } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Projects
  getProjects(userId: string): Promise<Project[]>;
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
  private projects: Map<string, Project> = new Map();
  private mcpServers: Map<string, McpServer> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private marketplaceApps: Map<string, MarketplaceApp> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create demo user
    const demoUser: User = {
      id: "demo-user-id",
      username: "demo",
      email: "demo@mcpbuilder.com",
      password: "demo123", // In real app, this would be hashed
      name: "Sarah Johnson",
      plan: "Professional",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo projects
    const projects: Project[] = [
      {
        id: "project-1",
        userId: demoUser.id,
        name: "Restaurant App",
        description: "Complete restaurant management system",
        prompt: "Create a comprehensive restaurant management application with menu management, order processing, and staff dashboard",
        status: "completed",
        llm: "claude",
        mcpServers: ["database", "api", "payment"],
        files: [
          { name: "menu.json", size: "2.4kb", type: "json" },
          { name: "orders.js", size: "8.1kb", type: "javascript" },
          { name: "styles.css", size: "3.2kb", type: "css" },
          { name: "admin.html", size: "5.7kb", type: "html" },
        ],
        createdAt: new Date("2024-12-18"),
      },
      {
        id: "project-2",
        userId: demoUser.id,
        name: "Customer Support",
        description: "AI-powered customer support system",
        prompt: "Build a customer support application with ticket management, live chat, and knowledge base integration",
        status: "testing",
        llm: "gemini",
        mcpServers: ["database", "api", "auth"],
        files: [
          { name: "tickets.js", size: "12.3kb", type: "javascript" },
          { name: "chat.html", size: "6.8kb", type: "html" },
          { name: "knowledge.json", size: "4.5kb", type: "json" },
        ],
        createdAt: new Date("2024-12-17"),
      },
      {
        id: "project-3",
        userId: demoUser.id,
        name: "Tour Guide",
        description: "Interactive tour guide application",
        prompt: "Create an interactive tour guide app with location-based recommendations and offline map support",
        status: "development",
        llm: "llama",
        mcpServers: ["database", "api"],
        files: [
          { name: "maps.js", size: "15.2kb", type: "javascript" },
          { name: "locations.json", size: "8.9kb", type: "json" },
        ],
        createdAt: new Date("2024-12-16"),
      },
    ];

    projects.forEach(project => this.projects.set(project.id, project));

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
      {
        id: "server-4",
        userId: demoUser.id,
        name: "Payment MCP",
        type: "http",
        url: "https://payments.mcpbuilder.com",
        description: "Payment processing",
        status: "connected",
        latency: 55,
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      plan: insertUser.plan || "free",
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Projects
  async getProjects(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
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
      mcpServers: insertProject.mcpServers ?? [],
      files: insertProject.files ?? [],
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
