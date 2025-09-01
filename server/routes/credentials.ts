import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requirePermission } from '../middleware/phase2-auth';
import {
    createUserLlmCredential,
    getUserLlmCredentials,
    getUserLlmCredential,
    updateUserLlmCredential,
    deleteUserLlmCredential,
    createUserMcpCredential,
    getUserMcpCredentials,
    getUserMcpCredential,
    updateUserMcpCredential,
    deleteUserMcpCredential,
    createProjectCredential,
    getProjectCredential,
    updateProjectCredential,
    logCredentialUsage,
    getMcpServerAuthMethods,
    getDefaultMcpServerAuthMethod,
    encryptText,
    decryptText
} from '../credential-storage';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createLlmCredentialSchema = z.object({
    llmModelId: z.string().min(1),
    apiKey: z.string().min(1),
    secretKey: z.string().optional(),
    organizationId: z.string().optional(),
    projectId: z.string().optional(),
    credentialName: z.string().optional()
});

const updateLlmCredentialSchema = z.object({
    apiKey: z.string().optional(),
    secretKey: z.string().optional(),
    organizationId: z.string().optional(),
    projectId: z.string().optional(),
    credentialName: z.string().optional(),
    isActive: z.boolean().optional()
});

const createMcpCredentialSchema = z.object({
    mcpServerId: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    apiKey: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    credentialName: z.string().optional()
});

const updateMcpCredentialSchema = z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    apiKey: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    credentialName: z.string().optional(),
    isActive: z.boolean().optional()
});

const projectCredentialSchema = z.object({
    llmCredentialId: z.string().min(1).optional(),
    mcpCredentialIds: z.array(z.string().min(1)).optional(),
    llmConfiguration: z.record(z.any()).optional(),
    mcpConfiguration: z.record(z.any()).optional()
});

// ============================================================================
// LLM CREDENTIAL MANAGEMENT
// ============================================================================

/**
 * POST /api/credentials/llm
 * Create a new LLM credential for the authenticated user
 */
router.post('/llm',
    authenticateToken,
    requirePermission('manage_credentials'),
    async (req: Request, res: Response) => {
        try {
            const validation = createLlmCredentialSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid request data',
                    code: 'VALIDATION_ERROR',
                    details: validation.error.errors
                });
            }

            const { llmModelId, apiKey, secretKey, organizationId, projectId, credentialName } = validation.data;

            const credential = await createUserLlmCredential(
                req.user!.id,
                llmModelId,
                apiKey,
                {
                    secretKey,
                    organizationId,
                    projectId,
                    credentialName
                }
            );

            res.status(201).json({
                success: true,
                message: 'LLM credential created successfully',
                data: {
                    credential: {
                        id: credential.id,
                        llmModelId: credential.llmModelId,
                        credentialName: credential.credentialName,
                        isActive: credential.isActive,
                        createdAt: credential.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error creating LLM credential:', error);
            res.status(500).json({
                error: 'Failed to create LLM credential',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * GET /api/credentials/llm
 * Get all LLM credentials for the authenticated user
 */
router.get('/llm',
    authenticateToken,
    requirePermission('view_credentials'),
    async (req: Request, res: Response) => {
        try {
            const credentials = await getUserLlmCredentials(req.user!.id);

            res.json({
                success: true,
                data: {
                    credentials: credentials.map(cred => ({
                        id: cred.id,
                        llmModelId: cred.llmModelId,
                        credentialName: cred.credentialName,
                        isActive: cred.isActive,
                        lastUsedAt: cred.lastUsedAt,
                        usageCount: cred.usageCount,
                        createdAt: cred.createdAt
                    }))
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error getting LLM credentials:', error);
            res.status(500).json({
                error: 'Failed to get LLM credentials',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * GET /api/credentials/llm/:id
 * Get a specific LLM credential by ID
 */
router.get('/llm/:id',
    authenticateToken,
    requirePermission('view_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const credential = await getUserLlmCredential(id);

            if (!credential) {
                return res.status(404).json({
                    error: 'LLM credential not found',
                    code: 'CREDENTIAL_NOT_FOUND'
                });
            }

            // Ensure user can only access their own credentials
            if (credential.userId !== req.user!.id) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            res.json({
                success: true,
                data: {
                    credential: {
                        id: credential.id,
                        llmModelId: credential.llmModelId,
                        credentialName: credential.credentialName,
                        isActive: credential.isActive,
                        lastUsedAt: credential.lastUsedAt,
                        usageCount: credential.usageCount,
                        createdAt: credential.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error getting LLM credential:', error);
            res.status(500).json({
                error: 'Failed to get LLM credential',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * PUT /api/credentials/llm/:id
 * Update an LLM credential
 */
router.put('/llm/:id',
    authenticateToken,
    requirePermission('manage_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const validation = updateLlmCredentialSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid request data',
                    code: 'VALIDATION_ERROR',
                    details: validation.error.errors
                });
            }

            // Check if credential exists and belongs to user
            const existingCredential = await getUserLlmCredential(id);
            if (!existingCredential) {
                return res.status(404).json({
                    error: 'LLM credential not found',
                    code: 'CREDENTIAL_NOT_FOUND'
                });
            }

            if (existingCredential.userId !== req.user!.id) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            const updatedCredential = await updateUserLlmCredential(id, validation.data);

            res.json({
                success: true,
                message: 'LLM credential updated successfully',
                data: {
                    credential: {
                        id: updatedCredential!.id,
                        llmModelId: updatedCredential!.llmModelId,
                        credentialName: updatedCredential!.credentialName,
                        isActive: updatedCredential!.isActive,
                        updatedAt: updatedCredential!.updatedAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error updating LLM credential:', error);
            res.status(500).json({
                error: 'Failed to update LLM credential',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * DELETE /api/credentials/llm/:id
 * Delete an LLM credential
 */
router.delete('/llm/:id',
    authenticateToken,
    requirePermission('manage_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Check if credential exists and belongs to user
            const existingCredential = await getUserLlmCredential(id);
            if (!existingCredential) {
                return res.status(404).json({
                    error: 'LLM credential not found',
                    code: 'CREDENTIAL_NOT_FOUND'
                });
            }

            if (existingCredential.userId !== req.user!.id) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            const deleted = await deleteUserLlmCredential(id);

            if (!deleted) {
                return res.status(500).json({
                    error: 'Failed to delete LLM credential',
                    code: 'DELETE_FAILED'
                });
            }

            res.json({
                success: true,
                message: 'LLM credential deleted successfully'
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error deleting LLM credential:', error);
            res.status(500).json({
                error: 'Failed to delete LLM credential',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

// ============================================================================
// MCP CREDENTIAL MANAGEMENT
// ============================================================================

/**
 * POST /api/credentials/mcp
 * Create a new MCP credential for the authenticated user
 */
router.post('/mcp',
    authenticateToken,
    requirePermission('manage_credentials'),
    async (req: Request, res: Response) => {
        try {
            const validation = createMcpCredentialSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid request data',
                    code: 'VALIDATION_ERROR',
                    details: validation.error.errors
                });
            }

            const { mcpServerId, clientId, clientSecret, accessToken, refreshToken, apiKey, scopes, credentialName } = validation.data;

            const credential = await createUserMcpCredential(
                req.user!.id,
                mcpServerId,
                clientId,
                clientSecret,
                {
                    accessToken,
                    refreshToken,
                    apiKey,
                    scopes,
                    credentialName
                }
            );

            res.status(201).json({
                success: true,
                message: 'MCP credential created successfully',
                data: {
                    credential: {
                        id: credential.id,
                        mcpServerId: credential.mcpServerId,
                        credentialName: credential.credentialName,
                        isActive: credential.isActive,
                        createdAt: credential.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error creating MCP credential:', error);
            res.status(500).json({
                error: 'Failed to create MCP credential',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * GET /api/credentials/mcp
 * Get all MCP credentials for the authenticated user
 */
router.get('/mcp',
    authenticateToken,
    requirePermission('view_credentials'),
    async (req: Request, res: Response) => {
        try {
            const credentials = await getUserMcpCredentials(req.user!.id);

            res.json({
                success: true,
                data: {
                    credentials: credentials.map(cred => ({
                        id: cred.id,
                        mcpServerId: cred.mcpServerId,
                        credentialName: cred.credentialName,
                        isActive: cred.isActive,
                        lastUsedAt: cred.lastUsedAt,
                        usageCount: cred.usageCount,
                        createdAt: cred.createdAt
                    }))
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error getting MCP credentials:', error);
            res.status(500).json({
                error: 'Failed to get MCP credentials',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * GET /api/credentials/mcp/:id
 * Get a specific MCP credential by ID
 */
router.get('/mcp/:id',
    authenticateToken,
    requirePermission('view_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const credential = await getUserMcpCredential(id);

            if (!credential) {
                return res.status(404).json({
                    error: 'MCP credential not found',
                    code: 'CREDENTIAL_NOT_FOUND'
                });
            }

            // Ensure user can only access their own credentials
            if (credential.userId !== req.user!.id) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            res.json({
                success: true,
                data: {
                    credential: {
                        id: credential.id,
                        mcpServerId: credential.mcpServerId,
                        credentialName: credential.credentialName,
                        isActive: credential.isActive,
                        lastUsedAt: credential.lastUsedAt,
                        usageCount: credential.usageCount,
                        createdAt: credential.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error getting MCP credential:', error);
            res.status(500).json({
                error: 'Failed to get MCP credential',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * PUT /api/credentials/mcp/:id
 * Update an MCP credential
 */
router.put('/mcp/:id',
    authenticateToken,
    requirePermission('manage_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const validation = updateMcpCredentialSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid request data',
                    code: 'VALIDATION_ERROR',
                    details: validation.error.errors
                });
            }

            // Check if credential exists and belongs to user
            const existingCredential = await getUserMcpCredential(id);
            if (!existingCredential) {
                return res.status(404).json({
                    error: 'MCP credential not found',
                    code: 'CREDENTIAL_NOT_FOUND'
                });
            }

            if (existingCredential.userId !== req.user!.id) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            const updatedCredential = await updateUserMcpCredential(id, validation.data);

            res.json({
                success: true,
                message: 'MCP credential updated successfully',
                data: {
                    credential: {
                        id: updatedCredential!.id,
                        mcpServerId: updatedCredential!.mcpServerId,
                        credentialName: updatedCredential!.credentialName,
                        isActive: updatedCredential!.isActive,
                        updatedAt: updatedCredential!.updatedAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error updating MCP credential:', error);
            res.status(500).json({
                error: 'Failed to update MCP credential',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * DELETE /api/credentials/mcp/:id
 * Delete an MCP credential
 */
router.delete('/mcp/:id',
    authenticateToken,
    requirePermission('manage_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Check if credential exists and belongs to user
            const existingCredential = await getUserMcpCredential(id);
            if (!existingCredential) {
                return res.status(404).json({
                    error: 'MCP credential not found',
                    code: 'CREDENTIAL_NOT_FOUND'
                });
            }

            if (existingCredential.userId !== req.user!.id) {
                return res.status(403).json({
                    error: 'Access denied',
                    code: 'ACCESS_DENIED'
                });
            }

            const deleted = await deleteUserMcpCredential(id);

            if (!deleted) {
                return res.status(500).json({
                    error: 'Failed to delete MCP credential',
                    code: 'DELETE_FAILED'
                });
            }

            res.json({
                success: true,
                message: 'MCP credential deleted successfully'
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error deleting MCP credential:', error);
            res.status(500).json({
                error: 'Failed to delete MCP credential',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

// ============================================================================
// PROJECT CREDENTIAL ASSOCIATIONS
// ============================================================================

/**
 * POST /api/credentials/projects/:projectId
 * Create or update project credential associations
 */
router.post('/projects/:projectId',
    authenticateToken,
    requirePermission('manage_project_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { projectId } = req.params;
            const validation = projectCredentialSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid request data',
                    code: 'VALIDATION_ERROR',
                    details: validation.error.errors
                });
            }

            const projectCredential = await createProjectCredential(projectId, validation.data);

            res.status(201).json({
                success: true,
                message: 'Project credentials configured successfully',
                data: {
                    projectCredential: {
                        id: projectCredential.id,
                        projectId: projectCredential.projectId,
                        llmCredentialId: projectCredential.llmCredentialId,
                        mcpCredentialIds: projectCredential.mcpCredentialIds,
                        createdAt: projectCredential.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error creating project credential:', error);
            res.status(500).json({
                error: 'Failed to configure project credentials',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * GET /api/credentials/projects/:projectId
 * Get project credential associations
 */
router.get('/projects/:projectId',
    authenticateToken,
    requirePermission('view_project_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { projectId } = req.params;
            const projectCredential = await getProjectCredential(projectId);

            if (!projectCredential) {
                return res.status(404).json({
                    error: 'Project credentials not found',
                    code: 'PROJECT_CREDENTIALS_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                data: {
                    projectCredential: {
                        id: projectCredential.id,
                        projectId: projectCredential.projectId,
                        llmCredentialId: projectCredential.llmCredentialId,
                        mcpCredentialIds: projectCredential.mcpCredentialIds,
                        llmConfiguration: projectCredential.llmConfiguration,
                        mcpConfiguration: projectCredential.mcpConfiguration,
                        createdAt: projectCredential.createdAt,
                        updatedAt: projectCredential.updatedAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error getting project credential:', error);
            res.status(500).json({
                error: 'Failed to get project credentials',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * PUT /api/credentials/projects/:projectId
 * Update project credential associations
 */
router.put('/projects/:projectId',
    authenticateToken,
    requirePermission('manage_project_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { projectId } = req.params;
            const validation = projectCredentialSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid request data',
                    code: 'VALIDATION_ERROR',
                    details: validation.error.errors
                });
            }

            const updatedProjectCredential = await updateProjectCredential(projectId, validation.data);

            if (!updatedProjectCredential) {
                return res.status(404).json({
                    error: 'Project credentials not found',
                    code: 'PROJECT_CREDENTIALS_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                message: 'Project credentials updated successfully',
                data: {
                    projectCredential: {
                        id: updatedProjectCredential.id,
                        projectId: updatedProjectCredential.projectId,
                        llmCredentialId: updatedProjectCredential.llmCredentialId,
                        mcpCredentialIds: updatedProjectCredential.mcpCredentialIds,
                        llmConfiguration: updatedProjectCredential.llmConfiguration,
                        mcpConfiguration: updatedProjectCredential.mcpConfiguration,
                        updatedAt: updatedProjectCredential.updatedAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error updating project credential:', error);
            res.status(500).json({
                error: 'Failed to update project credentials',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

// ============================================================================
// MCP SERVER AUTH METHODS
// ============================================================================

/**
 * GET /api/credentials/mcp-servers/:mcpServerId/auth-methods
 * Get authentication methods for an MCP server
 */
router.get('/mcp-servers/:mcpServerId/auth-methods',
    authenticateToken,
    requirePermission('view_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { mcpServerId } = req.params;
            const authMethods = await getMcpServerAuthMethods(mcpServerId);

            res.json({
                success: true,
                data: {
                    authMethods: authMethods.map(method => ({
                        id: method.id,
                        mcpServerId: method.mcpServerId,
                        authType: method.authType,
                        oauth2Config: method.oauth2Config,
                        apiKeyConfig: method.apiKeyConfig,
                        serviceAccountConfig: method.serviceAccountConfig,
                        requiredFields: method.requiredFields,
                        optionalFields: method.optionalFields,
                        isActive: method.isActive,
                        createdAt: method.createdAt
                    }))
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error getting MCP server auth methods:', error);
            res.status(500).json({
                error: 'Failed to get MCP server auth methods',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * GET /api/credentials/mcp-servers/:mcpServerId/auth-methods/default
 * Get default authentication method for an MCP server
 */
router.get('/mcp-servers/:mcpServerId/auth-methods/default',
    authenticateToken,
    requirePermission('view_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { mcpServerId } = req.params;
            const authMethod = await getDefaultMcpServerAuthMethod(mcpServerId);

            if (!authMethod) {
                return res.status(404).json({
                    error: 'No default auth method found for MCP server',
                    code: 'NO_DEFAULT_AUTH_METHOD'
                });
            }

            res.json({
                success: true,
                data: {
                    authMethod: {
                        id: authMethod.id,
                        mcpServerId: authMethod.mcpServerId,
                        authType: authMethod.authType,
                        oauth2Config: authMethod.oauth2Config,
                        apiKeyConfig: authMethod.apiKeyConfig,
                        serviceAccountConfig: authMethod.serviceAccountConfig,
                        requiredFields: authMethod.requiredFields,
                        optionalFields: authMethod.optionalFields,
                        isActive: authMethod.isActive,
                        createdAt: authMethod.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('[CREDENTIALS API] Error getting default MCP server auth method:', error);
            res.status(500).json({
                error: 'Failed to get default MCP server auth method',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

export default router;
