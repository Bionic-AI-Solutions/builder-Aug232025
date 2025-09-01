import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, uuid, uniqueIndex } from "drizzle-orm/pg-core";
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
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OAuth social accounts table
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  provider: text("provider").notNull(), // 'google', 'facebook'
  providerUserId: text("provider_user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  profileData: jsonb("profile_data").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LLM Models (managed by Admin)
export const llmModels = pgTable('llm_models', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  displayName: text('display_name'),
  provider: text('provider').notNull(), // openai, anthropic, google, etc.
  model: text('model').notNull(), // gpt-4, claude-3, gemini-pro, etc.
  type: text('type', { enum: ['chat', 'completion', 'embedding'] }).notNull().default('chat'),
  status: text('status', { enum: ['active', 'inactive', 'deprecated'] }).notNull().default('active'),
  contextLength: integer('context_length'),
  maxTokens: integer('max_tokens'),
  pricing: jsonb('pricing').$type<{
    input?: number; // cost per token/input
    output?: number; // cost per token/output
    perToken?: boolean;
  }>(),
  capabilities: jsonb('capabilities').$type<string[]>(),
  configuration: jsonb('configuration').$type<Record<string, any>>(), // API keys, endpoints, etc.
  approved: boolean('approved').notNull().default(false), // Admin approval for project use
  createdBy: varchar('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// LLM Providers (managed by Admin)
export const llmProviders = pgTable('llm_providers', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  type: text('type', { enum: ['cloud', 'local'] }).notNull().default('cloud'),
  description: text('description'),
  baseUrl: text('base_url'),
  apiKey: text('api_key'), // encrypted
  status: text('status', { enum: ['active', 'inactive', 'configured', 'error'] }).notNull().default('inactive'),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  createdBy: varchar('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// MCP Servers (managed by Admin)
export const mcpServers = pgTable("mcp_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("sse"), // sse, stdio, websocket, grpc
  url: text("url"),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, inactive, error
  configuration: jsonb("configuration").$type<Record<string, any>>(), // connection details, auth, etc.
  latency: integer("latency").default(0),
  approved: boolean("approved").notNull().default(false), // Admin approval for project use
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Prompts table for AI agent configuration
export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  description: text('description'),
  variables: jsonb('variables').default('{}'),
  category: varchar('category', { length: 100 }),
  tags: text('tags').array(),
  isPublic: boolean('is_public').default(false),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Knowledge Bases (one per project, created by builder)
export const knowledgeBases = pgTable("knowledge_bases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("rag"), // rag, vector_db, file_system
  configuration: jsonb("configuration").$type<Record<string, any>>(), // connection details, API keys, etc.
  documents: jsonb("documents").$type<{ name: string, size: string, type: string, url?: string }[]>(),
  status: text("status").notNull().default("active"), // active, inactive, error
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("development"), // development, testing, completed, published
  category: text("category"), // business, health, education, etc.
  tags: jsonb("tags").$type<string[]>().notNull().default([]),

  // References to components (one per project)
  llmModelId: varchar("llm_model_id"),
  promptId: varchar("prompt_id"),
  knowledgeBaseId: varchar("knowledge_base_id"),

  // Legacy fields (to be migrated)
  llm: text("llm"), // Will be deprecated - use llmModelId
  files: jsonb("files").$type<{ name: string, size: string, type: string }[]>().default([]), // Will be deprecated - use knowledgeBase

  // Marketplace fields - Single Table Design
  published: text("published").default("false"), // "true" or "false"
  marketplacePrice: integer("marketplace_price"), // in cents
  marketplaceDescription: text("marketplace_description"),
  marketplaceStatus: text("marketplace_status").default("inactive"), // active, inactive, pending, suspended
  marketplaceApprovalStatus: text("marketplace_approval_status").default("pending"), // pending, approved, rejected
  marketplacePublishedAt: timestamp("marketplace_published_at"),
  marketplaceFeatured: boolean("marketplace_featured").default(false),
  marketplaceRating: integer("marketplace_rating").default(0),
  marketplaceReviewCount: integer("marketplace_review_count").default(0),
  marketplaceDownloadCount: integer("marketplace_download_count").default(0),
  marketplaceLikeCount: integer("marketplace_like_count").default(0),
  marketplaceRevenue: integer("marketplace_revenue").default(0),
  marketplaceApprovedBy: varchar("marketplace_approved_by"),
  marketplaceApprovedAt: timestamp("marketplace_approved_at"),
  marketplaceRejectionReason: text("marketplace_rejection_reason"),
  marketplaceMcpServers: jsonb("marketplace_mcp_servers").default([]),
  marketplacePopularityScore: integer("marketplace_popularity_score").default(0),

  // Analytics (legacy)
  revenue: integer("revenue").default(0), // in cents
  revenueGrowth: integer("revenue_growth").default(0), // percentage

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project-Prompts junction table for many-to-many relationship
export const projectPrompts = pgTable('project_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'),
  promptId: uuid('prompt_id'),
  isPrimary: boolean('is_primary').default(false),
  customContent: text('custom_content'), // Allow project-specific prompt customization
  customVariables: jsonb('custom_variables').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueProjectPrompt: uniqueIndex('unique_project_prompt').on(table.projectId, table.promptId),
}));

// Project MCP Server associations (many-to-many)
export const projectMcpServers = pgTable("project_mcp_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  mcpServerId: varchar("mcp_server_id").notNull(),
  configuration: jsonb("configuration").$type<Record<string, any>>(), // project-specific config
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sender: text("sender").notNull(), // user, ai
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceApps = pgTable("marketplace_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
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
  endUserId: varchar("end_user_id").notNull(),
  builderId: varchar("builder_id").notNull(),
  projectId: varchar("project_id").notNull(),
  implementationUrl: text("implementation_url").notNull(),
  embedCode: text("embed_code").notNull(),
  configuration: jsonb("configuration").default({}),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  usageCount: integer("usage_count").default(0),
  revenueGenerated: integer("revenue_generated").default(0), // in cents
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// CREDENTIAL MANAGEMENT SYSTEM
// ============================================================================

// User Credentials for LLM Models (encrypted storage)
export const userLlmCredentials = pgTable("user_llm_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  llmModelId: varchar("llm_model_id").notNull(),

  // Encrypted credentials (encrypted at application level)
  encryptedApiKey: text("encrypted_api_key").notNull(),
  encryptedSecretKey: text("encrypted_secret_key"), // For providers that need both
  encryptedOrganizationId: text("encrypted_organization_id"), // For OpenAI org
  encryptedProjectId: text("encrypted_project_id"), // For Google AI Studio

  // Metadata
  credentialName: text("credential_name").notNull(), // User-friendly name
  isActive: text("is_active").notNull().default("true"),
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),

  // Security
  encryptionVersion: text("encryption_version").notNull().default("v1"),
  keyRotationAt: timestamp("key_rotation_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Credentials for MCP Servers (encrypted storage)
export const userMcpCredentials = pgTable("user_mcp_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mcpServerId: varchar("mcp_server_id").notNull(),

  // Encrypted credentials
  encryptedClientId: text("encrypted_client_id").notNull(),
  encryptedClientSecret: text("encrypted_client_secret").notNull(),
  encryptedAccessToken: text("encrypted_access_token"),
  encryptedRefreshToken: text("encrypted_refresh_token"),
  encryptedApiKey: text("encrypted_api_key"), // For services that use API keys

  // OAuth specific fields
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: jsonb("scopes").$type<string[]>(), // OAuth scopes

  // Metadata
  credentialName: text("credential_name").notNull(), // User-friendly name
  isActive: text("is_active").notNull().default("true"),
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),

  // Security
  encryptionVersion: text("encryption_version").notNull().default("v1"),
  keyRotationAt: timestamp("key_rotation_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Credential Associations (which credentials a project uses)
export const projectCredentials = pgTable("project_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),

  // LLM Credential association
  llmCredentialId: varchar("llm_credential_id"),

  // MCP Credential associations (JSON array of credential IDs)
  mcpCredentialIds: jsonb("mcp_credential_ids").$type<string[]>().default([]),

  // Configuration overrides for this project
  llmConfiguration: jsonb("llm_configuration").$type<Record<string, any>>(), // temperature, max_tokens, etc.
  mcpConfiguration: jsonb("mcp_configuration").$type<Record<string, any>>(), // MCP-specific settings

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credential Usage Log (for audit and billing)
export const credentialUsageLog = pgTable("credential_usage_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  projectId: varchar("project_id"),

  // Credential used
  llmCredentialId: varchar("llm_credential_id"),
  mcpCredentialId: varchar("mcp_credential_id"),

  // Usage details
  operation: text("operation").notNull(), // "llm_completion", "mcp_gmail_send", etc.
  tokensUsed: integer("tokens_used"), // For LLM operations
  costInCents: integer("cost_in_cents"), // Cost in cents
  success: text("success").notNull().default("true"), // true/false
  errorMessage: text("error_message"),

  // Request metadata
  requestId: varchar("request_id"), // For tracing
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),

  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// ENHANCED MCP SERVER CONFIGURATION
// ============================================================================

// MCP Server Authentication Methods
export const mcpServerAuthMethods = pgTable("mcp_server_auth_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mcpServerId: varchar("mcp_server_id").notNull(),

  // Authentication type
  authType: text("auth_type").notNull(), // "oauth2", "api_key", "service_account", "basic"

  // OAuth2 configuration
  oauth2Config: jsonb("oauth2_config").$type<{
    authorizationUrl?: string;
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
    redirectUri?: string;
  }>(),

  // API Key configuration
  apiKeyConfig: jsonb("api_key_config").$type<{
    headerName?: string;
    queryParamName?: string;
    keyFormat?: string; // "bearer", "basic", "custom"
  }>(),

  // Service Account configuration
  serviceAccountConfig: jsonb("service_account_config").$type<{
    keyFileFormat?: string; // "json", "pem"
    requiredFields?: string[];
  }>(),

  // Required credential fields
  requiredFields: jsonb("required_fields").$type<string[]>(), // ["client_id", "client_secret", "access_token"]
  optionalFields: jsonb("optional_fields").$type<string[]>(), // ["refresh_token", "organization_id"]

  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = typeof mcpServers.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type MarketplaceApp = typeof marketplaceApps.$inferSelect;
export type InsertMarketplaceApp = typeof marketplaceApps.$inferInsert;
export type WidgetImplementation = typeof widgetImplementations.$inferSelect;
export type InsertWidgetImplementation = typeof widgetImplementations.$inferInsert;

// LLM and Prompt types
export type LLMModel = typeof llmModels.$inferSelect;
export type NewLLMModel = typeof llmModels.$inferInsert;
export type LLMProvider = typeof llmProviders.$inferSelect;
export type NewLLMProvider = typeof llmProviders.$inferInsert;
export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = typeof prompts.$inferInsert;
export type ProjectPrompt = typeof projectPrompts.$inferSelect;
export type InsertProjectPrompt = typeof projectPrompts.$inferInsert;
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBases.$inferInsert;
export type ProjectMcpServer = typeof projectMcpServers.$inferSelect;
export type InsertProjectMcpServer = typeof projectMcpServers.$inferInsert;

// Credential management types
export type UserLlmCredential = typeof userLlmCredentials.$inferSelect;
export type InsertUserLlmCredential = typeof userLlmCredentials.$inferInsert;
export type UserMcpCredential = typeof userMcpCredentials.$inferSelect;
export type InsertUserMcpCredential = typeof userMcpCredentials.$inferInsert;
export type ProjectCredential = typeof projectCredentials.$inferSelect;
export type InsertProjectCredential = typeof projectCredentials.$inferInsert;
export type CredentialUsageLog = typeof credentialUsageLog.$inferSelect;
export type McpServerAuthMethod = typeof mcpServerAuthMethods.$inferSelect;

// Social account types
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;

// ============================================================================
// SCHEMAS
// ============================================================================

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
});

export const insertLLMModelSchema = createInsertSchema(llmModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLLMProviderSchema = createInsertSchema(llmProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectPromptSchema = createInsertSchema(projectPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectMcpServerSchema = createInsertSchema(projectMcpServers).omit({
  id: true,
  createdAt: true,
});

// Credential management schemas
export const insertUserLlmCredentialSchema = createInsertSchema(userLlmCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserMcpCredentialSchema = createInsertSchema(userMcpCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectCredentialSchema = createInsertSchema(projectCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
