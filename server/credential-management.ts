import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import {
    type InsertUserLlmCredential,
    type UserLlmCredential,
    type InsertUserMcpCredential,
    type UserMcpCredential,
    type InsertProjectCredential,
    type ProjectCredential,
    type McpServerAuthMethod
} from "../shared/schema";

// ============================================================================
// CREDENTIAL MANAGEMENT FUNCTIONS
// ============================================================================

// Encryption utilities (in production, use a proper encryption library)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!';

function encryptText(text: string): string {
    // Simple base64 encoding for demo - in production use proper encryption
    return Buffer.from(text).toString('base64');
}

function decryptText(encryptedText: string): string {
    // Simple base64 decoding for demo - in production use proper decryption
    return Buffer.from(encryptedText, 'base64').toString('utf-8');
}

// LLM Credential Management
export async function createUserLlmCredential(credential: InsertUserLlmCredential): Promise<UserLlmCredential> {
    try {
        const { userLlmCredentials } = await import('../shared/schema');

        const encryptedCredential = {
            ...credential,
            encryptedApiKey: encryptText(credential.encryptedApiKey),
            encryptedSecretKey: credential.encryptedSecretKey ? encryptText(credential.encryptedSecretKey) : null,
            encryptedOrganizationId: credential.encryptedOrganizationId ? encryptText(credential.encryptedOrganizationId) : null,
            encryptedProjectId: credential.encryptedProjectId ? encryptText(credential.encryptedProjectId) : null,
        };

        const result = await db.insert(userLlmCredentials).values(encryptedCredential).returning();
        return result[0];
    } catch (error) {
        console.error('[STORAGE] Error creating LLM credential:', error);
        throw new Error('Failed to create LLM credential');
    }
}

export async function getUserLlmCredentials(userId: string): Promise<UserLlmCredential[]> {
    try {
        const { userLlmCredentials } = await import('../shared/schema');

        const result = await db
            .select()
            .from(userLlmCredentials)
            .where(eq(userLlmCredentials.userId, userId))
            .orderBy(desc(userLlmCredentials.createdAt));

        return result;
    } catch (error) {
        console.error('[STORAGE] Error getting LLM credentials:', error);
        throw new Error('Failed to get LLM credentials');
    }
}

export async function getUserLlmCredential(id: string): Promise<UserLlmCredential | null> {
    try {
        const { userLlmCredentials } = await import('../shared/schema');

        const result = await db
            .select()
            .from(userLlmCredentials)
            .where(eq(userLlmCredentials.id, id))
            .limit(1);

        return result[0] || null;
    } catch (error) {
        console.error('[STORAGE] Error getting LLM credential:', error);
        throw new Error('Failed to get LLM credential');
    }
}

export async function updateUserLlmCredential(id: string, updates: Partial<InsertUserLlmCredential>): Promise<UserLlmCredential | null> {
    try {
        const { userLlmCredentials } = await import('../shared/schema');

        // Encrypt any credential fields that are being updated
        const encryptedUpdates: any = { ...updates };
        if (updates.encryptedApiKey) encryptedUpdates.encryptedApiKey = encryptText(updates.encryptedApiKey);
        if (updates.encryptedSecretKey) encryptedUpdates.encryptedSecretKey = encryptText(updates.encryptedSecretKey);
        if (updates.encryptedOrganizationId) encryptedUpdates.encryptedOrganizationId = encryptText(updates.encryptedOrganizationId);
        if (updates.encryptedProjectId) encryptedUpdates.encryptedProjectId = encryptText(updates.encryptedProjectId);

        const result = await db
            .update(userLlmCredentials)
            .set(encryptedUpdates)
            .where(eq(userLlmCredentials.id, id))
            .returning();

        return result[0] || null;
    } catch (error) {
        console.error('[STORAGE] Error updating LLM credential:', error);
        throw new Error('Failed to update LLM credential');
    }
}

export async function deleteUserLlmCredential(id: string): Promise<boolean> {
    try {
        const { userLlmCredentials } = await import('../shared/schema');

        const result = await db
            .delete(userLlmCredentials)
            .where(eq(userLlmCredentials.id, id))
            .returning();

        return result.length > 0;
    } catch (error) {
        console.error('[STORAGE] Error deleting LLM credential:', error);
        throw new Error('Failed to delete LLM credential');
    }
}

// MCP Credential Management
export async function createUserMcpCredential(credential: InsertUserMcpCredential): Promise<UserMcpCredential> {
    try {
        const { userMcpCredentials } = await import('../shared/schema');

        const encryptedCredential = {
            ...credential,
            encryptedClientId: encryptText(credential.encryptedClientId),
            encryptedClientSecret: encryptText(credential.encryptedClientSecret),
            encryptedAccessToken: credential.encryptedAccessToken ? encryptText(credential.encryptedAccessToken) : null,
            encryptedRefreshToken: credential.encryptedRefreshToken ? encryptText(credential.encryptedRefreshToken) : null,
            encryptedApiKey: credential.encryptedApiKey ? encryptText(credential.encryptedApiKey) : null,
        };

        const result = await db.insert(userMcpCredentials).values(encryptedCredential).returning();
        return result[0];
    } catch (error) {
        console.error('[STORAGE] Error creating MCP credential:', error);
        throw new Error('Failed to create MCP credential');
    }
}

export async function getUserMcpCredentials(userId: string): Promise<UserMcpCredential[]> {
    try {
        const { userMcpCredentials } = await import('../shared/schema');

        const result = await db
            .select()
            .from(userMcpCredentials)
            .where(eq(userMcpCredentials.userId, userId))
            .orderBy(desc(userMcpCredentials.createdAt));

        return result;
    } catch (error) {
        console.error('[STORAGE] Error getting MCP credentials:', error);
        throw new Error('Failed to get MCP credentials');
    }
}

export async function getUserMcpCredential(id: string): Promise<UserMcpCredential | null> {
    try {
        const { userMcpCredentials } = await import('../shared/schema');

        const result = await db
            .select()
            .from(userMcpCredentials)
            .where(eq(userMcpCredentials.id, id))
            .limit(1);

        return result[0] || null;
    } catch (error) {
        console.error('[STORAGE] Error getting MCP credential:', error);
        throw new Error('Failed to get MCP credential');
    }
}

export async function updateUserMcpCredential(id: string, updates: Partial<InsertUserMcpCredential>): Promise<UserMcpCredential | null> {
    try {
        const { userMcpCredentials } = await import('../shared/schema');

        // Encrypt any credential fields that are being updated
        const encryptedUpdates: any = { ...updates };
        if (updates.encryptedClientId) encryptedUpdates.encryptedClientId = encryptText(updates.encryptedClientId);
        if (updates.encryptedClientSecret) encryptedUpdates.encryptedClientSecret = encryptText(updates.encryptedClientSecret);
        if (updates.encryptedAccessToken) encryptedUpdates.encryptedAccessToken = encryptText(updates.encryptedAccessToken);
        if (updates.encryptedRefreshToken) encryptedUpdates.encryptedRefreshToken = encryptText(updates.encryptedRefreshToken);
        if (updates.encryptedApiKey) encryptedUpdates.encryptedApiKey = encryptText(updates.encryptedApiKey);

        const result = await db
            .update(userMcpCredentials)
            .set(encryptedUpdates)
            .where(eq(userMcpCredentials.id, id))
            .returning();

        return result[0] || null;
    } catch (error) {
        console.error('[STORAGE] Error updating MCP credential:', error);
        throw new Error('Failed to update MCP credential');
    }
}

export async function deleteUserMcpCredential(id: string): Promise<boolean> {
    try {
        const { userMcpCredentials } = await import('../shared/schema');

        const result = await db
            .delete(userMcpCredentials)
            .where(eq(userMcpCredentials.id, id))
            .returning();

        return result.length > 0;
    } catch (error) {
        console.error('[STORAGE] Error deleting MCP credential:', error);
        throw new Error('Failed to delete MCP credential');
    }
}

// Project Credential Associations
export async function createProjectCredential(projectCredential: InsertProjectCredential): Promise<ProjectCredential> {
    try {
        const { projectCredentials } = await import('../shared/schema');

        const result = await db.insert(projectCredentials).values(projectCredential).returning();
        return result[0];
    } catch (error) {
        console.error('[STORAGE] Error creating project credential:', error);
        throw new Error('Failed to create project credential');
    }
}

export async function getProjectCredential(projectId: string): Promise<ProjectCredential | null> {
    try {
        const { projectCredentials } = await import('../shared/schema');

        const result = await db
            .select()
            .from(projectCredentials)
            .where(eq(projectCredentials.projectId, projectId))
            .limit(1);

        return result[0] || null;
    } catch (error) {
        console.error('[STORAGE] Error getting project credential:', error);
        throw new Error('Failed to get project credential');
    }
}

export async function updateProjectCredential(projectId: string, updates: Partial<InsertProjectCredential>): Promise<ProjectCredential | null> {
    try {
        const { projectCredentials } = await import('../shared/schema');

        const result = await db
            .update(projectCredentials)
            .set(updates)
            .where(eq(projectCredentials.projectId, projectId))
            .returning();

        return result[0] || null;
    } catch (error) {
        console.error('[STORAGE] Error updating project credential:', error);
        throw new Error('Failed to update project credential');
    }
}

// Credential Usage Logging
export async function logCredentialUsage(usageLog: {
    userId: string;
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
}): Promise<void> {
    try {
        const { credentialUsageLog } = await import('../shared/schema');

        await db.insert(credentialUsageLog).values({
            userId: usageLog.userId,
            projectId: usageLog.projectId,
            llmCredentialId: usageLog.llmCredentialId,
            mcpCredentialId: usageLog.mcpCredentialId,
            operation: usageLog.operation,
            tokensUsed: usageLog.tokensUsed,
            costInCents: usageLog.costInCents,
            success: usageLog.success ? 'true' : 'false',
            errorMessage: usageLog.errorMessage,
            requestId: usageLog.requestId,
            userAgent: usageLog.userAgent,
            ipAddress: usageLog.ipAddress,
        });
    } catch (error) {
        console.error('[STORAGE] Error logging credential usage:', error);
        // Don't throw - logging should not break the main flow
    }
}

// MCP Server Authentication Methods
export async function getMcpServerAuthMethods(mcpServerId: string): Promise<McpServerAuthMethod[]> {
    try {
        const { mcpServerAuthMethods } = await import('../shared/schema');

        const result = await db
            .select()
            .from(mcpServerAuthMethods)
            .where(and(
                eq(mcpServerAuthMethods.mcpServerId, mcpServerId),
                eq(mcpServerAuthMethods.isActive, 'true')
            ));

        return result;
    } catch (error) {
        console.error('[STORAGE] Error getting MCP server auth methods:', error);
        throw new Error('Failed to get MCP server auth methods');
    }
}
