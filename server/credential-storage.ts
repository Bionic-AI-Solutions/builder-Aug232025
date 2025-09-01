import { randomUUID } from "crypto";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
    userLlmCredentials,
    userMcpCredentials,
    projectCredentials,
    credentialUsageLog,
    mcpServerAuthMethods,
    type UserLlmCredential,
    type InsertUserLlmCredential,
    type UserMcpCredential,
    type InsertUserMcpCredential,
    type ProjectCredential,
    type InsertProjectCredential,
    type CredentialUsageLog,
    type McpServerAuthMethod
} from "../shared/schema";

// ============================================================================
// ENCRYPTION UTILITIES (DEMO - USE PRODUCTION ENCRYPTION IN PRODUCTION)
// ============================================================================

/**
 * Encrypt text using Base64 encoding (DEMO ONLY)
 * In production, use AES-256-GCM with a proper key management system
 */
export function encryptText(text: string): string {
    return Buffer.from(text).toString('base64');
}

/**
 * Decrypt text using Base64 decoding (DEMO ONLY)
 * In production, use AES-256-GCM with a proper key management system
 */
export function decryptText(encryptedText: string): string {
    return Buffer.from(encryptedText, 'base64').toString('utf-8');
}

// ============================================================================
// LLM CREDENTIAL MANAGEMENT
// ============================================================================

/**
 * Create a new LLM credential for a user
 */
export async function createUserLlmCredential(
    userId: string,
    llmModelId: string,
    apiKey: string,
    options: {
        secretKey?: string;
        organizationId?: string;
        projectId?: string;
        credentialName?: string;
    } = {}
): Promise<UserLlmCredential> {
    try {
        const credentialData: InsertUserLlmCredential = {
            userId,
            llmModelId,
            encryptedApiKey: encryptText(apiKey),
            encryptedSecretKey: options.secretKey ? encryptText(options.secretKey) : null,
            encryptedOrganizationId: options.organizationId ? encryptText(options.organizationId) : null,
            encryptedProjectId: options.projectId ? encryptText(options.projectId) : null,
            credentialName: options.credentialName || `LLM Credential for ${llmModelId}`,
            isActive: "true",
            encryptionVersion: "v1"
        };

        const result = await db.insert(userLlmCredentials).values(credentialData).returning();
        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error creating LLM credential:', error);
        throw new Error('Failed to create LLM credential');
    }
}

/**
 * Get all LLM credentials for a user
 */
export async function getUserLlmCredentials(userId: string): Promise<UserLlmCredential[]> {
    try {
        const result = await db
            .select()
            .from(userLlmCredentials)
            .where(eq(userLlmCredentials.userId, userId))
            .orderBy(desc(userLlmCredentials.createdAt));

        return result;
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error getting LLM credentials:', error);
        throw new Error('Failed to get LLM credentials');
    }
}

/**
 * Get a specific LLM credential by ID
 */
export async function getUserLlmCredential(id: string): Promise<UserLlmCredential | undefined> {
    try {
        const result = await db
            .select()
            .from(userLlmCredentials)
            .where(eq(userLlmCredentials.id, id))
            .limit(1);

        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error getting LLM credential:', error);
        throw new Error('Failed to get LLM credential');
    }
}

/**
 * Update an LLM credential
 */
export async function updateUserLlmCredential(
    id: string,
    updates: Partial<{
        apiKey: string;
        secretKey: string;
        organizationId: string;
        projectId: string;
        credentialName: string;
        isActive: boolean;
    }>
): Promise<UserLlmCredential | undefined> {
    try {
        const updateData: any = {
            updatedAt: new Date()
        };

        if (updates.apiKey) updateData.encryptedApiKey = encryptText(updates.apiKey);
        if (updates.secretKey) updateData.encryptedSecretKey = encryptText(updates.secretKey);
        if (updates.organizationId) updateData.encryptedOrganizationId = encryptText(updates.organizationId);
        if (updates.projectId) updateData.encryptedProjectId = encryptText(updates.projectId);
        if (updates.credentialName) updateData.credentialName = updates.credentialName;
        if (updates.isActive !== undefined) updateData.isActive = updates.isActive ? "true" : "false";

        const result = await db
            .update(userLlmCredentials)
            .set(updateData)
            .where(eq(userLlmCredentials.id, id))
            .returning();

        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error updating LLM credential:', error);
        throw new Error('Failed to update LLM credential');
    }
}

/**
 * Delete an LLM credential
 */
export async function deleteUserLlmCredential(id: string): Promise<boolean> {
    try {
        const result = await db
            .delete(userLlmCredentials)
            .where(eq(userLlmCredentials.id, id))
            .returning();

        return result.length > 0;
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error deleting LLM credential:', error);
        throw new Error('Failed to delete LLM credential');
    }
}

// ============================================================================
// MCP CREDENTIAL MANAGEMENT
// ============================================================================

/**
 * Create a new MCP credential for a user
 */
export async function createUserMcpCredential(
    userId: string,
    mcpServerId: string,
    clientId: string,
    clientSecret: string,
    options: {
        accessToken?: string;
        refreshToken?: string;
        apiKey?: string;
        scopes?: string[];
        credentialName?: string;
    } = {}
): Promise<UserMcpCredential> {
    try {
        const credentialData: InsertUserMcpCredential = {
            userId,
            mcpServerId,
            encryptedClientId: encryptText(clientId),
            encryptedClientSecret: encryptText(clientSecret),
            encryptedAccessToken: options.accessToken ? encryptText(options.accessToken) : null,
            encryptedRefreshToken: options.refreshToken ? encryptText(options.refreshToken) : null,
            encryptedApiKey: options.apiKey ? encryptText(options.apiKey) : null,
            scopes: options.scopes || [],
            credentialName: options.credentialName || `MCP Credential for ${mcpServerId}`,
            isActive: "true",
            encryptionVersion: "v1"
        };

        const result = await db.insert(userMcpCredentials).values(credentialData).returning();
        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error creating MCP credential:', error);
        throw new Error('Failed to create MCP credential');
    }
}

/**
 * Get all MCP credentials for a user
 */
export async function getUserMcpCredentials(userId: string): Promise<UserMcpCredential[]> {
    try {
        const result = await db
            .select()
            .from(userMcpCredentials)
            .where(eq(userMcpCredentials.userId, userId))
            .orderBy(desc(userMcpCredentials.createdAt));

        return result;
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error getting MCP credentials:', error);
        throw new Error('Failed to get MCP credentials');
    }
}

/**
 * Get a specific MCP credential by ID
 */
export async function getUserMcpCredential(id: string): Promise<UserMcpCredential | undefined> {
    try {
        const result = await db
            .select()
            .from(userMcpCredentials)
            .where(eq(userMcpCredentials.id, id))
            .limit(1);

        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error getting MCP credential:', error);
        throw new Error('Failed to get MCP credential');
    }
}

/**
 * Update an MCP credential
 */
export async function updateUserMcpCredential(
    id: string,
    updates: Partial<{
        clientId: string;
        clientSecret: string;
        accessToken: string;
        refreshToken: string;
        apiKey: string;
        scopes: string[];
        credentialName: string;
        isActive: boolean;
    }>
): Promise<UserMcpCredential | undefined> {
    try {
        const updateData: any = {
            updatedAt: new Date()
        };

        if (updates.clientId) updateData.encryptedClientId = encryptText(updates.clientId);
        if (updates.clientSecret) updateData.encryptedClientSecret = encryptText(updates.clientSecret);
        if (updates.accessToken) updateData.encryptedAccessToken = encryptText(updates.accessToken);
        if (updates.refreshToken) updateData.encryptedRefreshToken = encryptText(updates.refreshToken);
        if (updates.apiKey) updateData.encryptedApiKey = encryptText(updates.apiKey);
        if (updates.scopes) updateData.scopes = updates.scopes;
        if (updates.credentialName) updateData.credentialName = updates.credentialName;
        if (updates.isActive !== undefined) updateData.isActive = updates.isActive ? "true" : "false";

        const result = await db
            .update(userMcpCredentials)
            .set(updateData)
            .where(eq(userMcpCredentials.id, id))
            .returning();

        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error updating MCP credential:', error);
        throw new Error('Failed to update MCP credential');
    }
}

/**
 * Delete an MCP credential
 */
export async function deleteUserMcpCredential(id: string): Promise<boolean> {
    try {
        const result = await db
            .delete(userMcpCredentials)
            .where(eq(userMcpCredentials.id, id))
            .returning();

        return result.length > 0;
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error deleting MCP credential:', error);
        throw new Error('Failed to delete MCP credential');
    }
}

// ============================================================================
// PROJECT CREDENTIAL ASSOCIATIONS
// ============================================================================

/**
 * Create or update project credential associations
 */
export async function createProjectCredential(
    projectId: string,
    options: {
        llmCredentialId?: string;
        mcpCredentialIds?: string[];
        llmConfiguration?: Record<string, any>;
        mcpConfiguration?: Record<string, any>;
    } = {}
): Promise<ProjectCredential> {
    try {
        const credentialData: InsertProjectCredential = {
            projectId,
            llmCredentialId: options.llmCredentialId || null,
            mcpCredentialIds: options.mcpCredentialIds || [],
            llmConfiguration: options.llmConfiguration || {},
            mcpConfiguration: options.mcpConfiguration || {}
        };

        const result = await db.insert(projectCredentials).values(credentialData).returning();
        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error creating project credential:', error);
        throw new Error('Failed to create project credential');
    }
}

/**
 * Get project credential associations
 */
export async function getProjectCredential(projectId: string): Promise<ProjectCredential | undefined> {
    try {
        const result = await db
            .select()
            .from(projectCredentials)
            .where(eq(projectCredentials.projectId, projectId))
            .limit(1);

        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error getting project credential:', error);
        throw new Error('Failed to get project credential');
    }
}

/**
 * Update project credential associations
 */
export async function updateProjectCredential(
    projectId: string,
    updates: Partial<{
        llmCredentialId: string;
        mcpCredentialIds: string[];
        llmConfiguration: Record<string, any>;
        mcpConfiguration: Record<string, any>;
    }>
): Promise<ProjectCredential | undefined> {
    try {
        const updateData: any = {
            updatedAt: new Date()
        };

        if (updates.llmCredentialId !== undefined) updateData.llmCredentialId = updates.llmCredentialId;
        if (updates.mcpCredentialIds) updateData.mcpCredentialIds = updates.mcpCredentialIds;
        if (updates.llmConfiguration) updateData.llmConfiguration = updates.llmConfiguration;
        if (updates.mcpConfiguration) updateData.mcpConfiguration = updates.mcpConfiguration;

        const result = await db
            .update(projectCredentials)
            .set(updateData)
            .where(eq(projectCredentials.projectId, projectId))
            .returning();

        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error updating project credential:', error);
        throw new Error('Failed to update project credential');
    }
}

// ============================================================================
// CREDENTIAL USAGE LOGGING
// ============================================================================

/**
 * Log credential usage for audit and billing
 */
export async function logCredentialUsage(
    userId: string,
    options: {
        projectId?: string;
        llmCredentialId?: string;
        mcpCredentialId?: string;
        operation: string;
        tokensUsed?: number;
        costInCents?: number;
        success: boolean;
        errorMessage?: string;
        requestId?: string;
        userAgent?: string;
        ipAddress?: string;
    }
): Promise<CredentialUsageLog> {
    try {
        const logData = {
            userId,
            projectId: options.projectId || null,
            llmCredentialId: options.llmCredentialId || null,
            mcpCredentialId: options.mcpCredentialId || null,
            operation: options.operation,
            tokensUsed: options.tokensUsed || null,
            costInCents: options.costInCents || null,
            success: options.success ? "true" : "false",
            errorMessage: options.errorMessage || null,
            requestId: options.requestId || null,
            userAgent: options.userAgent || null,
            ipAddress: options.ipAddress || null
        };

        const result = await db.insert(credentialUsageLog).values(logData).returning();
        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error logging credential usage:', error);
        throw new Error('Failed to log credential usage');
    }
}

// ============================================================================
// MCP SERVER AUTH METHODS
// ============================================================================

/**
 * Get authentication methods for an MCP server
 */
export async function getMcpServerAuthMethods(mcpServerId: string): Promise<McpServerAuthMethod[]> {
    try {
        const result = await db
            .select()
            .from(mcpServerAuthMethods)
            .where(eq(mcpServerAuthMethods.mcpServerId, mcpServerId))
            .orderBy(desc(mcpServerAuthMethods.createdAt));

        return result;
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error getting MCP server auth methods:', error);
        throw new Error('Failed to get MCP server auth methods');
    }
}

/**
 * Get default authentication method for an MCP server
 */
export async function getDefaultMcpServerAuthMethod(mcpServerId: string): Promise<McpServerAuthMethod | undefined> {
    try {
        const result = await db
            .select()
            .from(mcpServerAuthMethods)
            .where(
                and(
                    eq(mcpServerAuthMethods.mcpServerId, mcpServerId),
                    eq(mcpServerAuthMethods.isActive, "true")
                )
            )
            .limit(1);

        return result[0];
    } catch (error) {
        console.error('[CREDENTIAL STORAGE] Error getting default MCP server auth method:', error);
        throw new Error('Failed to get default MCP server auth method');
    }
}
