import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash"), // Optional for OAuth users
  persona: text("persona").notNull().default("builder"), // super_admin, builder, end_user
  roles: jsonb("roles").$type<string[]>().default([]),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  metadata: jsonb("metadata").default({}),
  isActive: text("is_active").notNull().default("true"), // Stored as text in DB, converted to boolean in app
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OAuth social accounts table
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'google', 'facebook'
  providerUserId: text("provider_user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  profileData: jsonb("profile_data").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  status: text("status").notNull().default("development"), // development, testing, completed
  llm: text("llm").notNull(), // claude, gemini, llama, gpt4
  mcpServers: jsonb("mcp_servers").$type<string[]>().notNull().default([]),
  files: jsonb("files").$type<{ name: string, size: string, type: string }[]>().default([]),
  revenue: integer("revenue").default(0), // in cents
  revenueGrowth: integer("revenue_growth").default(0), // percentage
  published: text("published").default("false"), // "true" or "false"
  createdAt: timestamp("created_at").defaultNow(),
});

export const mcpServers = pgTable("mcp_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull().default("sse"), // sse, stdio, websocket, grpc
  url: text("url"),
  description: text("description"),
  status: text("status").notNull().default("disconnected"), // connected, disconnected
  latency: integer("latency").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sender: text("sender").notNull(), // user, ai
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceApps = pgTable("marketplace_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  rating: text("rating").notNull().default("0"),
  downloads: integer("downloads").default(0),
  category: text("category").notNull().default("custom"),
  icon: text("icon").notNull().default("🔧"),
  createdAt: timestamp("created_at").defaultNow(),
});

// New tables for enhanced personas
export const widgetImplementations = pgTable("widget_implementations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  endUserId: varchar("end_user_id").notNull().references(() => users.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  builderId: varchar("builder_id").notNull().references(() => users.id),
  implementationUrl: text("implementation_url").notNull(),
  embedCode: text("embed_code").notNull(),
  configuration: jsonb("configuration").default({}),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  usageCount: integer("usage_count").default(0),
  revenueGenerated: integer("revenue_generated").default(0), // in cents
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const revenueEvents = pgTable("revenue_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  implementationId: varchar("implementation_id").references(() => widgetImplementations.id),
  builderId: varchar("builder_id").notNull().references(() => users.id),
  endUserId: varchar("end_user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // in cents
  eventType: text("event_type").notNull(), // purchase, usage, subscription
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const templatePurchases = pgTable("template_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  templateProjectId: varchar("template_project_id").notNull().references(() => projects.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  purchaseAmount: integer("purchase_amount").notNull(), // in cents
  purchaseDate: timestamp("purchase_date").defaultNow(),
  status: text("status").notNull().default("completed"), // completed, pending, failed
  metadata: jsonb("metadata").default({}),
});

export const usageEvents = pgTable("usage_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  implementationId: varchar("implementation_id").notNull().references(() => widgetImplementations.id),
  eventType: text("event_type").notNull(), // load, interaction, error
  eventData: jsonb("event_data").default({}),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  sessionId: varchar("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// LLM PROVIDERS SCHEMA
// ============================================================================

export const llmProviders = pgTable('llm_providers', {
  id: text('id').primaryKey().$defaultFn(() => `provider-${crypto.randomUUID()}`),
  name: text('name').notNull(),
  type: text('type', { enum: ['cloud', 'local'] }).notNull(),
  description: text('description'),
  baseUrl: text('base_url'),
  apiKey: text('api_key_encrypted'), // Encrypted API key
  status: text('status', { enum: ['active', 'inactive', 'configured', 'error'] }).notNull().default('inactive'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const llmModels = pgTable('llm_models', {
  id: text('id').primaryKey().$defaultFn(() => `model-${crypto.randomUUID()}`),
  providerId: text('provider_id').notNull().references(() => llmProviders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  displayName: text('display_name'),
  type: text('type', { enum: ['chat', 'completion', 'embedding'] }).notNull().default('chat'),
  status: text('status', { enum: ['available', 'unavailable', 'deprecated'] }).notNull().default('unavailable'),
  contextLength: integer('context_length'),
  maxTokens: integer('max_tokens'),
  pricing: jsonb('pricing').$type<{
    input?: string;
    output?: string;
    perToken?: boolean;
  }>(),
  capabilities: jsonb('capabilities').$type<string[]>(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// TYPES
// ============================================================================

export type LLMProvider = typeof llmProviders.$inferSelect;
export type NewLLMProvider = typeof llmProviders.$inferInsert;
export type LLMModel = typeof llmModels.$inferSelect;
export type NewLLMModel = typeof llmModels.$inferInsert;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertMarketplaceAppSchema = createInsertSchema(marketplaceApps).omit({
  id: true,
  createdAt: true,
});

export const insertWidgetImplementationSchema = createInsertSchema(widgetImplementations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRevenueEventSchema = createInsertSchema(revenueEvents).omit({
  id: true,
  createdAt: true,
});

export const insertTemplatePurchaseSchema = createInsertSchema(templatePurchases).omit({
  id: true,
  purchaseDate: true,
});

export const insertUsageEventSchema = createInsertSchema(usageEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = z.infer<typeof insertMcpServerSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type MarketplaceApp = typeof marketplaceApps.$inferSelect;
export type InsertMarketplaceApp = z.infer<typeof insertMarketplaceAppSchema>;

export type WidgetImplementation = typeof widgetImplementations.$inferSelect;
export type InsertWidgetImplementation = z.infer<typeof insertWidgetImplementationSchema>;

export type RevenueEvent = typeof revenueEvents.$inferSelect;
export type InsertRevenueEvent = z.infer<typeof insertRevenueEventSchema>;

export type TemplatePurchase = typeof templatePurchases.$inferSelect;
export type InsertTemplatePurchase = z.infer<typeof insertTemplatePurchaseSchema>;

export type UsageEvent = typeof usageEvents.$inferSelect;
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
