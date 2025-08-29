import { type InsertUser, type Project, type InsertProject, type McpServer, type InsertMcpServer, type ChatMessage, type InsertChatMessage, type MarketplaceApp, type InsertMarketplaceApp, type SocialAccount, type InsertSocialAccount } from "@shared/schema";
import { type User as AuthUser, type Persona, type UserRole, type Permission } from "./lib/auth";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  projects,
  mcpServers,
  chatMessages,
  marketplaceApps,
  socialAccounts,
  widgetImplementations,
  revenueEvents,
  templatePurchases,
  usageEvents,
  llmProviders,
  llmModels,
  type LLMProvider,
  type NewLLMProvider,
  type LLMModel,
  type NewLLMModel,
} from "../shared/schema";

// Storage User interface that extends AuthUser with additional fields
interface StorageUser extends AuthUser {
  password_hash: string;
  lastLoginAt: Date | null;
}

// Marketplace types (keeping existing interfaces for compatibility)
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

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<StorageUser | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result.length === 0) return undefined;

    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash || '',
      persona: user.persona as Persona,
      roles: (user.roles as UserRole[]) || [],
      permissions: (user.permissions as Permission[]) || [],
      metadata: user.metadata || {},
      isActive: String(user.isActive).toLowerCase() === 'true',
      approvalStatus: user.approvalStatus as 'pending' | 'approved' | 'rejected',
      approvedBy: user.approvedBy || undefined,
      approvedAt: user.approvedAt || undefined,
      rejectionReason: user.rejectionReason || undefined,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserByEmail(email: string): Promise<StorageUser | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) return undefined;

    const user = result[0];

    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash || '',
      persona: user.persona as Persona,
      roles: (user.roles as UserRole[]) || [],
      permissions: (user.permissions as Permission[]) || [],
      metadata: user.metadata || {},
      isActive: String(user.isActive).toLowerCase() === 'true',
      approvalStatus: user.approvalStatus as 'pending' | 'approved' | 'rejected',
      approvedBy: user.approvedBy || undefined,
      approvedAt: user.approvedAt || undefined,
      rejectionReason: user.rejectionReason || undefined,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserById(id: string): Promise<StorageUser | undefined> {
    return this.getUser(id);
  }

  async getAllUsers(): Promise<StorageUser[]> {
    const result = await db.select().from(users).orderBy(desc(users.createdAt));

    return result.map(user => ({
      id: user.id,
      email: user.email,
      password_hash: user.password_hash || '',
      persona: user.persona as Persona,
      roles: (user.roles as UserRole[]) || [],
      permissions: (user.permissions as Permission[]) || [],
      metadata: user.metadata || {},
      isActive: String(user.isActive).toLowerCase() === 'true',
      approvalStatus: user.approvalStatus as 'pending' | 'approved' | 'rejected',
      approvedBy: user.approvedBy || undefined,
      approvedAt: user.approvedAt || undefined,
      rejectionReason: user.rejectionReason || undefined,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async getPendingUsers(): Promise<StorageUser[]> {
    const result = await db.select().from(users)
      .where(eq(users.approvalStatus, 'pending'))
      .orderBy(desc(users.createdAt));

    return result.map(user => ({
      id: user.id,
      email: user.email,
      password_hash: user.password_hash || '',
      persona: user.persona as Persona,
      roles: (user.roles as UserRole[]) || [],
      permissions: (user.permissions as Permission[]) || [],
      metadata: user.metadata || {},
      isActive: String(user.isActive).toLowerCase() === 'true',
      approvalStatus: user.approvalStatus as 'pending' | 'approved' | 'rejected',
      approvedBy: user.approvedBy || undefined,
      approvedAt: user.approvedAt || undefined,
      rejectionReason: user.rejectionReason || undefined,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async createUser(user: InsertUser): Promise<StorageUser> {
    const result = await db.insert(users).values({
      email: user.email,
      password_hash: user.password_hash,
      persona: user.persona,
      roles: user.roles || [],
      permissions: user.permissions || [],
      metadata: user.metadata || {},
      is_active: user.isActive ? 'true' : 'false',
      approval_status: user.approvalStatus || 'pending',
      approved_by: user.approvedBy,
      approved_at: user.approvedAt,
      rejection_reason: user.rejectionReason,
      last_login_at: user.lastLoginAt,
    }).returning();

    const newUser = result[0];
    return {
      id: newUser.id,
      email: newUser.email,
      password_hash: newUser.password_hash || '',
      persona: newUser.persona as Persona,
      roles: (newUser.roles as UserRole[]) || [],
      permissions: (newUser.permissions as Permission[]) || [],
      metadata: newUser.metadata || {},
      isActive: String(newUser.isActive).toLowerCase() === 'true',
      approvalStatus: newUser.approvalStatus as 'pending' | 'approved' | 'rejected',
      approvedBy: newUser.approvedBy || undefined,
      approvedAt: newUser.approvedAt || undefined,
      rejectionReason: newUser.rejectionReason || undefined,
      lastLoginAt: newUser.lastLoginAt || null,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }

  async updateUser(id: string, updates: Partial<StorageUser>): Promise<StorageUser | undefined> {
    const updateData: any = {};

    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.password_hash !== undefined) updateData.password_hash = updates.password_hash;
    if (updates.persona !== undefined) updateData.persona = updates.persona;
    if (updates.roles !== undefined) updateData.roles = updates.roles;
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive ? 'true' : 'false';
    if (updates.approvalStatus !== undefined) updateData.approval_status = updates.approvalStatus;
    if (updates.approvedBy !== undefined) updateData.approved_by = updates.approvedBy;
    if (updates.approvedAt !== undefined) updateData.approved_at = updates.approvedAt;
    if (updates.rejectionReason !== undefined) updateData.rejection_reason = updates.rejectionReason;
    if (updates.lastLoginAt !== undefined) updateData.lastLoginAt = updates.lastLoginAt;
    updateData.updatedAt = new Date();

    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) return undefined;

    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash || '',
      persona: user.persona as Persona,
      roles: (user.roles as UserRole[]) || [],
      permissions: (user.permissions as Permission[]) || [],
      metadata: user.metadata || {},
      isActive: String(user.isActive).toLowerCase() === 'true',
      approvalStatus: user.approvalStatus as 'pending' | 'approved' | 'rejected',
      approvedBy: user.approvedBy || undefined,
      approvedAt: user.approvedAt || undefined,
      rejectionReason: user.rejectionReason || undefined,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await db.update(users)
      .set({
        password_hash: passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async approveUser(userId: string, approvedBy: string): Promise<void> {
    await db.update(users)
      .set({
        approval_status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date(),
        is_active: 'true',
        updated_at: new Date()
      })
      .where(eq(users.id, userId));
  }

  async rejectUser(userId: string, rejectedBy: string, reason: string): Promise<void> {
    await db.update(users)
      .set({
        approval_status: 'rejected',
        approved_by: rejectedBy,
        rejection_reason: reason,
        updated_at: new Date()
      })
      .where(eq(users.id, userId));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Social Accounts
  async getSocialAccount(provider: string, providerUserId: string): Promise<SocialAccount | undefined> {
    const result = await db.select().from(socialAccounts)
      .where(and(
        eq(socialAccounts.provider, provider),
        eq(socialAccounts.providerUserId, providerUserId)
      ))
      .limit(1);

    if (result.length === 0) return undefined;
    return result[0];
  }

  async getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]> {
    return await db.select().from(socialAccounts)
      .where(eq(socialAccounts.userId, userId))
      .orderBy(desc(socialAccounts.createdAt));
  }

  async createSocialAccount(socialAccount: InsertSocialAccount): Promise<SocialAccount> {
    const result = await db.insert(socialAccounts).values({
      userId: socialAccount.userId,
      provider: socialAccount.provider,
      providerUserId: socialAccount.providerUserId,
      accessToken: socialAccount.accessToken,
      refreshToken: socialAccount.refreshToken,
      expiresAt: socialAccount.expiresAt,
      profileData: socialAccount.profileData || {},
    }).returning();

    return result[0];
  }

  async updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount | undefined> {
    const result = await db.update(socialAccounts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(socialAccounts.id, id))
      .returning();

    if (result.length === 0) return undefined;
    return result[0];
  }

  async deleteSocialAccount(id: string): Promise<boolean> {
    const result = await db.delete(socialAccounts).where(eq(socialAccounts.id, id)).returning();
    return result.length > 0;
  }

  async linkSocialAccount(userId: string, provider: string, providerUserId: string, profileData: any): Promise<SocialAccount> {
    const result = await db.insert(socialAccounts).values({
      userId: userId,
      provider,
      providerUserId: providerUserId,
      profileData: profileData,
    }).returning();

    return result[0];
  }

  // Projects
  async getProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects)
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (result.length === 0) return undefined;
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values({
      userId: project.userId,
      name: project.name,
      description: project.description,
      prompt: project.prompt,
      status: project.status || 'development',
      llm: project.llm,
      mcpServers: project.mcpServers || [],
      files: project.files || [],
      revenue: project.revenue || 0,
      revenueGrowth: project.revenueGrowth || 0,
      published: project.published || 'false',
    } as any).returning();

    return result[0];
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();

    if (result.length === 0) return undefined;
    return result[0];
  }

  // MCP Servers
  async getMcpServers(userId: string): Promise<McpServer[]> {
    return await db.select().from(mcpServers)
      .where(eq(mcpServers.userId, userId))
      .orderBy(desc(mcpServers.createdAt));
  }

  async getMcpServer(id: string): Promise<McpServer | undefined> {
    const result = await db.select().from(mcpServers)
      .where(eq(mcpServers.id, id))
      .limit(1);

    if (result.length === 0) return undefined;
    return result[0];
  }

  async createMcpServer(server: InsertMcpServer): Promise<McpServer> {
    const result = await db.insert(mcpServers).values({
      userId: server.userId,
      name: server.name,
      type: server.type || 'sse',
      url: server.url,
      description: server.description,
      status: server.status || 'disconnected',
      latency: server.latency || 0,
    }).returning();

    return result[0];
  }

  async updateMcpServer(id: string, updates: Partial<McpServer>): Promise<McpServer | undefined> {
    const result = await db.update(mcpServers)
      .set(updates)
      .where(eq(mcpServers.id, id))
      .returning();

    if (result.length === 0) return undefined;
    return result[0];
  }

  async deleteMcpServer(id: string): Promise<boolean> {
    const result = await db.delete(mcpServers).where(eq(mcpServers.id, id)).returning();
    return result.length > 0;
  }

  // Chat Messages
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values({
      userId: message.userId,
      sender: message.sender,
      message: message.message,
    }).returning();

    return result[0];
  }

  // Marketplace Apps
  async getMarketplaceApps(): Promise<MarketplaceApp[]> {
    return await db.select().from(marketplaceApps)
      .orderBy(desc(marketplaceApps.createdAt));
  }

  async getMarketplaceApp(id: string): Promise<MarketplaceApp | undefined> {
    const result = await db.select().from(marketplaceApps)
      .where(eq(marketplaceApps.id, id))
      .limit(1);

    if (result.length === 0) return undefined;
    return result[0];
  }

  async createMarketplaceApp(app: InsertMarketplaceApp): Promise<MarketplaceApp> {
    const result = await db.insert(marketplaceApps).values({
      projectId: app.projectId,
      name: app.name,
      description: app.description,
      price: app.price,
      rating: app.rating || '0',
      downloads: app.downloads || 0,
      category: app.category || 'custom',
      icon: app.icon || '🔧',
    }).returning();

    return result[0];
  }

  // Marketplace Projects (using marketplace_apps table for now)
  async getMarketplaceProjects(options?: MarketplaceQueryOptions): Promise<MarketplaceQueryResult> {
    // Build the base query
    let baseQuery = db.select().from(marketplaceApps);

    // Apply sorting
    let orderByColumn: any = marketplaceApps.createdAt;
    if (options?.sortBy) {
      if (options.sortBy === 'price') {
        orderByColumn = marketplaceApps.price;
      } else if (options.sortBy === 'downloads') {
        orderByColumn = marketplaceApps.downloads;
      }
    }

    const sortOrder = options?.sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

    // Apply pagination
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const offset = (page - 1) * limit;

    const result = await baseQuery
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)`.as('count') }).from(marketplaceApps);
    const total = countResult[0].count;

    const projects: MarketplaceProject[] = result.map(app => ({
      id: app.id,
      projectId: app.projectId,
      builderId: '', // Will need to join with projects table
      title: app.name,
      description: app.description || '',
      price: app.price,
      category: app.category,
      tags: [],
      status: 'active',
      featured: false,
      rating: parseFloat(app.rating || '0'),
      reviewCount: 0,
      downloadCount: app.downloads || 0,
      revenue: 0,
      publishedAt: app.createdAt || new Date(),
      updatedAt: app.createdAt || new Date(),
      metadata: {},
    }));

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMarketplaceProject(id: string): Promise<MarketplaceProject | undefined> {
    const result = await db.select().from(marketplaceApps)
      .where(eq(marketplaceApps.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const app = result[0];
    return {
      id: app.id,
      projectId: app.projectId,
      builderId: '',
      title: app.name,
      description: app.description || '',
      price: app.price,
      category: app.category,
      tags: [],
      status: 'active',
      featured: false,
      rating: parseFloat(app.rating || '0'),
      reviewCount: 0,
      downloadCount: app.downloads || 0,
      revenue: 0,
      publishedAt: app.createdAt || new Date(),
      updatedAt: app.createdAt || new Date(),
      metadata: {},
    };
  }

  async getMarketplaceProjectByProjectId(projectId: string): Promise<MarketplaceProject | undefined> {
    const result = await db.select().from(marketplaceApps)
      .where(eq(marketplaceApps.projectId, projectId))
      .limit(1);

    if (result.length === 0) return undefined;

    const app = result[0];
    return {
      id: app.id,
      projectId: app.projectId,
      builderId: '',
      title: app.name,
      description: app.description || '',
      price: app.price,
      category: app.category,
      tags: [],
      status: 'active',
      featured: false,
      rating: parseFloat(app.rating || '0'),
      reviewCount: 0,
      downloadCount: app.downloads || 0,
      revenue: 0,
      publishedAt: app.createdAt || new Date(),
      updatedAt: app.createdAt || new Date(),
      metadata: {},
    };
  }

  async createMarketplaceProject(project: InsertMarketplaceProject): Promise<MarketplaceProject> {
    // For now, create a marketplace app entry
    const result = await db.insert(marketplaceApps).values({
      projectId: project.projectId,
      name: project.title,
      description: project.description,
      price: project.price,
      category: project.category,
      icon: '🔧',
    }).returning();

    const app = result[0];
    return {
      id: app.id,
      projectId: app.projectId,
      builderId: project.builderId,
      title: app.name,
      description: app.description || '',
      price: app.price,
      category: app.category,
      tags: project.tags,
      status: project.status || 'active',
      featured: project.featured || false,
      rating: project.rating || 0,
      reviewCount: project.reviewCount || 0,
      downloadCount: project.downloadCount || 0,
      revenue: project.revenue || 0,
      publishedAt: app.createdAt || new Date(),
      updatedAt: app.createdAt || new Date(),
      metadata: project.metadata || {},
    };
  }

  async updateMarketplaceProject(id: string, updates: Partial<MarketplaceProject>): Promise<MarketplaceProject | undefined> {
    const result = await db.update(marketplaceApps)
      .set({
        name: updates.title,
        description: updates.description,
        price: updates.price,
        category: updates.category,
      })
      .where(eq(marketplaceApps.id, id))
      .returning();

    if (result.length === 0) return undefined;

    const app = result[0];
    return {
      id: app.id,
      projectId: app.projectId,
      builderId: '',
      title: app.name,
      description: app.description || '',
      price: app.price,
      category: app.category,
      tags: [],
      status: 'active',
      featured: false,
      rating: parseFloat(app.rating || '0'),
      reviewCount: 0,
      downloadCount: app.downloads || 0,
      revenue: 0,
      publishedAt: app.createdAt || new Date(),
      updatedAt: app.createdAt || new Date(),
      metadata: {},
    };
  }

  async deleteMarketplaceProject(id: string): Promise<boolean> {
    const result = await db.delete(marketplaceApps).where(eq(marketplaceApps.id, id)).returning();
    return result.length > 0;
  }

  async getFeaturedMarketplaceProjects(): Promise<MarketplaceProject[]> {
    // For now, return all marketplace apps
    const result = await db.select().from(marketplaceApps)
      .orderBy(desc(marketplaceApps.createdAt))
      .limit(10);

    return result.map(app => ({
      id: app.id,
      projectId: app.projectId,
      builderId: '',
      title: app.name,
      description: app.description || '',
      price: app.price,
      category: app.category,
      tags: [],
      status: 'active',
      featured: false,
      rating: parseFloat(app.rating || '0'),
      reviewCount: 0,
      downloadCount: app.downloads || 0,
      revenue: 0,
      publishedAt: app.createdAt || new Date(),
      updatedAt: app.createdAt || new Date(),
      metadata: {},
    }));
  }

  // Marketplace Purchases (using template_purchases table)
  async createMarketplacePurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase> {
    const result = await db.insert(templatePurchases).values({
      buyerId: purchase.buyerId,
      templateProjectId: purchase.projectId,
      sellerId: purchase.sellerId,
      purchaseAmount: purchase.amount,
      status: purchase.status || 'completed',
      metadata: purchase.metadata || {},
    }).returning();

    const newPurchase = result[0];
    return {
      id: newPurchase.id,
      projectId: newPurchase.templateProjectId,
      buyerId: newPurchase.buyerId,
      sellerId: newPurchase.sellerId,
      amount: newPurchase.purchaseAmount,
      currency: 'USD',
      status: newPurchase.status as 'pending' | 'completed' | 'failed' | 'refunded',
      transactionId: undefined,
      paymentMethod: undefined,
      purchasedAt: newPurchase.purchaseDate || new Date(),
      metadata: newPurchase.metadata || {},
    };
  }

  async getUserPurchase(userId: string, projectId: string): Promise<MarketplacePurchase | undefined> {
    const result = await db.select().from(templatePurchases)
      .where(and(
        eq(templatePurchases.buyerId, userId),
        eq(templatePurchases.templateProjectId, projectId)
      ))
      .limit(1);

    if (result.length === 0) return undefined;

    const purchase = result[0];
    return {
      id: purchase.id,
      projectId: purchase.templateProjectId,
      buyerId: purchase.buyerId,
      sellerId: purchase.sellerId,
      amount: purchase.purchaseAmount,
      currency: 'USD',
      status: purchase.status as 'pending' | 'completed' | 'failed' | 'refunded',
      transactionId: undefined,
      paymentMethod: undefined,
      purchasedAt: purchase.purchaseDate || new Date(),
      metadata: purchase.metadata || {},
    };
  }

  async getUserPurchases(userId: string): Promise<MarketplacePurchase[]> {
    const result = await db.select().from(templatePurchases)
      .where(eq(templatePurchases.buyerId, userId))
      .orderBy(desc(templatePurchases.purchaseDate));

    return result.map(purchase => ({
      id: purchase.id,
      projectId: purchase.templateProjectId,
      buyerId: purchase.buyerId,
      sellerId: purchase.sellerId,
      amount: purchase.purchaseAmount,
      currency: 'USD',
      status: purchase.status as 'pending' | 'completed' | 'failed' | 'refunded',
      transactionId: undefined,
      paymentMethod: undefined,
      purchasedAt: purchase.purchaseDate || new Date(),
      metadata: purchase.metadata || {},
    }));
  }

  // Placeholder implementations for remaining methods
  async createMarketplaceReview(review: InsertMarketplaceReview): Promise<MarketplaceReview> {
    // Placeholder - would need a reviews table
    throw new Error('Marketplace reviews not implemented yet');
  }

  async getMarketplaceProjectReviews(projectId: string, options?: { page?: number; limit?: number }): Promise<MarketplaceReview[]> {
    // Placeholder - would need a reviews table
    return [];
  }

  async getUserProjectReview(userId: string, projectId: string): Promise<MarketplaceReview | undefined> {
    // Placeholder - would need a reviews table
    return undefined;
  }

  async createMarketplaceDownload(download: InsertMarketplaceDownload): Promise<MarketplaceDownload> {
    // Placeholder - would need a downloads table
    throw new Error('Marketplace downloads not implemented yet');
  }

  async generateDownloadToken(projectId: string, userId: string): Promise<string> {
    // Placeholder - would need token generation logic
    return `token-${projectId}-${userId}-${Date.now()}`;
  }

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const countResult1 = await db.select({ count: sql<number>`count(*)`.as('count') }).from(marketplaceApps);
    const totalProjects = countResult1[0].count;

    const countResult2 = await db.select({ count: sql<number>`count(*)`.as('count') }).from(templatePurchases);
    const totalPurchases = countResult2[0].count;

    return {
      totalProjects,
      activeProjects: totalProjects,
      totalSales: totalPurchases,
      totalRevenue: 0, // Would need to sum purchase amounts
      averageRating: 0, // Would need reviews table
      totalReviews: 0, // Would need reviews table
    };
  }

  async createRevenueEvent(event: any): Promise<any> {
    const result = await db.insert(revenueEvents).values({
      implementationId: event.implementationId,
      builderId: event.builderId,
      endUserId: event.endUserId,
      amount: event.amount,
      eventType: event.eventType,
      description: event.description,
      metadata: event.metadata || {},
    }).returning();

    return result[0];
  }
}

// Export the PostgreSQL storage as the default
export const storage = new PostgresStorage();
