import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requirePermission, requireSuperAdmin, validateRequest, logMarketplaceOperation } from '../middleware/phase2-auth';
import { getLLMProviders, getLLMProvider, createLLMProvider, updateLLMProvider, deleteLLMProvider, getLLMModels, createLLMModel, updateLLMModel, deleteLLMModel } from '../storage';
import { encrypt, decrypt, maskApiKey } from '../lib/encryption';

const router = Router();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate API key format and determine if it's a real key
 */
function isValidApiKey(apiKey: string, providerName: string): boolean {
    if (!apiKey || apiKey.trim() === '') {
        return false;
    }

    // Check for placeholder patterns
    const placeholderPatterns = [
        'your-',
        'sk-',
        'sk_test_',
        'placeholder',
        'example',
        'demo',
        'test_',
        'fake_'
    ];

    const lowerKey = apiKey.toLowerCase();
    if (placeholderPatterns.some(pattern => lowerKey.includes(pattern))) {
        return false;
    }

    // Provider-specific validation
    switch (providerName.toLowerCase()) {
        case 'openai':
            return apiKey.startsWith('sk-') && apiKey.length >= 20;
        case 'anthropic':
            return apiKey.startsWith('sk-ant-') && apiKey.length >= 20;
        case 'google':
            return apiKey.length >= 20; // Google API keys can vary in format
        case 'cohere':
            return apiKey.startsWith('sk-') && apiKey.length >= 20;
        case 'ollama':
        case 'lm studio':
        case 'vllm':
            return true; // Local providers don't need API keys
        default:
            return apiKey.length >= 10; // Generic validation
    }
}

/**
 * Determine provider status based on API key validity
 */
function determineProviderStatus(apiKey: string | null, providerName: string): 'active' | 'inactive' | 'configured' | 'error' {
    if (!apiKey) {
        return 'inactive';
    }

    if (isValidApiKey(apiKey, providerName)) {
        return 'active';
    }

    return 'configured'; // Has a key but it's not valid
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateProviderSchema = z.object({
    name: z.string().min(1, 'Provider name is required'),
    type: z.enum(['cloud', 'local']),
    description: z.string().optional(),
    baseUrl: z.string().url().optional(),
    apiKey: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

const UpdateProviderSchema = z.object({
    name: z.string().min(1, 'Provider name is required').optional(),
    type: z.enum(['cloud', 'local']).optional(),
    description: z.string().optional(),
    baseUrl: z.string().url().optional(),
    apiKey: z.string().optional(),
    status: z.enum(['active', 'inactive', 'configured', 'error']).optional(),
    metadata: z.record(z.any()).optional(),
});

const CreateModelSchema = z.object({
    name: z.string().min(1, 'Model name is required'),
    displayName: z.string().optional(),
    type: z.enum(['chat', 'completion', 'embedding']).default('chat'),
    status: z.enum(['available', 'unavailable', 'deprecated']).default('unavailable'),
    contextLength: z.number().positive().optional(),
    maxTokens: z.number().positive().optional(),
    pricing: z.object({
        input: z.string().optional(),
        output: z.string().optional(),
        perToken: z.boolean().optional(),
    }).optional(),
    capabilities: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});

const UpdateModelSchema = z.object({
    name: z.string().min(1, 'Model name is required').optional(),
    displayName: z.string().optional(),
    type: z.enum(['chat', 'completion', 'embedding']).optional(),
    status: z.enum(['available', 'unavailable', 'deprecated']).optional(),
    contextLength: z.number().positive().optional(),
    maxTokens: z.number().positive().optional(),
    pricing: z.object({
        input: z.string().optional(),
        output: z.string().optional(),
        perToken: z.boolean().optional(),
    }).optional(),
    capabilities: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});

// ============================================================================
// LLM PROVIDERS API
// ============================================================================

/**
 * GET /api/llms/providers
 * Get all LLM providers
 */
router.get('/providers',
    authenticateToken,
    requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            console.log('[LLM PROVIDERS] Fetching all providers');

            const providers = await getLLMProviders();

            // Get models for each provider and determine real-time status
            const providersWithModels = await Promise.all(
                providers.map(async (provider) => {
                    const models = await getLLMModels(provider.id);
                    const decryptedApiKey = provider.apiKey ? decrypt(provider.apiKey) : null;
                    const realTimeStatus = determineProviderStatus(decryptedApiKey, provider.name);

                    return {
                        ...provider,
                        status: realTimeStatus, // Override stored status with real-time status
                        apiKey: decryptedApiKey ? maskApiKey(decryptedApiKey) : undefined,
                        models: models.map(model => ({
                            ...model,
                            pricing: model.pricing || null,
                            capabilities: model.capabilities || []
                        }))
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    providers: providersWithModels,
                    total: providersWithModels.length
                }
            });
        } catch (error) {
            console.error('[LLM PROVIDERS ERROR]', error);
            res.status(500).json({
                error: 'Failed to fetch LLM providers',
                code: 'PROVIDERS_FETCH_FAILED'
            });
        }
    }
);

/**
 * GET /api/llms/providers/:id
 * Get specific LLM provider
 */
router.get('/providers/:id',
    authenticateToken,
    requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            console.log('[LLM PROVIDER] Fetching provider:', id);

            const provider = await getLLMProvider(id);
            if (!provider) {
                return res.status(404).json({
                    error: 'LLM provider not found',
                    code: 'PROVIDER_NOT_FOUND'
                });
            }

            const models = await getLLMModels(provider.id);
            const decryptedApiKey = provider.apiKey ? decrypt(provider.apiKey) : null;
            const realTimeStatus = determineProviderStatus(decryptedApiKey, provider.name);

            res.json({
                success: true,
                data: {
                    provider: {
                        ...provider,
                        status: realTimeStatus, // Override stored status with real-time status
                        apiKey: decryptedApiKey ? maskApiKey(decryptedApiKey) : undefined,
                        models: models.map(model => ({
                            ...model,
                            pricing: model.pricing || null,
                            capabilities: model.capabilities || []
                        }))
                    }
                }
            });
        } catch (error) {
            console.error('[LLM PROVIDER ERROR]', error);
            res.status(500).json({
                error: 'Failed to fetch LLM provider',
                code: 'PROVIDER_FETCH_FAILED'
            });
        }
    }
);

/**
 * POST /api/llms/providers
 * Create new LLM provider
 */
router.post('/providers',
    authenticateToken,
    requireSuperAdmin,
    validateRequest(CreateProviderSchema),
    async (req: Request, res: Response) => {
        try {
            const { name, type, description, baseUrl, apiKey, metadata } = req.body;
            console.log('[LLM PROVIDER] Creating provider:', name);

            const providerData = {
                name,
                type,
                description,
                baseUrl,
                apiKey: apiKey ? encrypt(apiKey) : undefined,
                status: determineProviderStatus(apiKey, name),
                metadata,
                createdBy: (req.user as any)?.id
            };

            const provider = await createLLMProvider(providerData);

            res.status(201).json({
                success: true,
                data: {
                    provider: {
                        ...provider,
                        apiKey: provider.apiKey ? maskApiKey(decrypt(provider.apiKey)) : undefined,
                        models: []
                    }
                }
            });
        } catch (error) {
            console.error('[LLM PROVIDER CREATE ERROR]', error);
            res.status(500).json({
                error: 'Failed to create LLM provider',
                code: 'PROVIDER_CREATE_FAILED'
            });
        }
    }
);

/**
 * PUT /api/llms/providers/:id
 * Update LLM provider
 */
router.put('/providers/:id',
    authenticateToken,
    requireSuperAdmin,
    validateRequest(UpdateProviderSchema),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, type, description, baseUrl, apiKey, status, metadata } = req.body;
            console.log('[LLM PROVIDER] Updating provider:', id);

            const updateData: any = {
                name,
                type,
                description,
                baseUrl,
                metadata
            };

            // Only encrypt API key if it's provided
            if (apiKey !== undefined) {
                updateData.apiKey = apiKey ? encrypt(apiKey) : null;

                // Automatically determine status based on API key validity
                const providerName = name || (await getLLMProvider(id))?.name || 'unknown';
                updateData.status = determineProviderStatus(apiKey, providerName);
                console.log('[LLM PROVIDER] Auto-determined status:', updateData.status, 'for provider:', providerName);
            }

            const provider = await updateLLMProvider(id, updateData);
            if (!provider) {
                return res.status(404).json({
                    error: 'LLM provider not found',
                    code: 'PROVIDER_NOT_FOUND'
                });
            }

            const models = await getLLMModels(provider.id);

            res.json({
                success: true,
                data: {
                    provider: {
                        ...provider,
                        apiKey: provider.apiKey ? maskApiKey(decrypt(provider.apiKey)) : undefined,
                        models: models.map(model => ({
                            ...model,
                            pricing: model.pricing || null,
                            capabilities: model.capabilities || []
                        }))
                    }
                }
            });
        } catch (error) {
            console.error('[LLM PROVIDER UPDATE ERROR]', error);
            res.status(500).json({
                error: 'Failed to update LLM provider',
                code: 'PROVIDER_UPDATE_FAILED'
            });
        }
    }
);

/**
 * DELETE /api/llms/providers/:id
 * Delete LLM provider
 */
router.delete('/providers/:id',
    authenticateToken,
    requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            console.log('[LLM PROVIDER] Deleting provider:', id);

            const deleted = await deleteLLMProvider(id);
            if (!deleted) {
                return res.status(404).json({
                    error: 'LLM provider not found',
                    code: 'PROVIDER_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                message: 'LLM provider deleted successfully'
            });
        } catch (error) {
            console.error('[LLM PROVIDER DELETE ERROR]', error);
            res.status(500).json({
                error: 'Failed to delete LLM provider',
                code: 'PROVIDER_DELETE_FAILED'
            });
        }
    }
);

// ============================================================================
// LLM MODELS API
// ============================================================================

/**
 * POST /api/llms/providers/:providerId/models
 * Create new LLM model
 */
router.post('/providers/:providerId/models',
    authenticateToken,
    requireSuperAdmin,
    validateRequest(CreateModelSchema),
    async (req: Request, res: Response) => {
        try {
            const { providerId } = req.params;
            const modelData = req.body;
            console.log('[LLM MODEL] Creating model for provider:', providerId);

            const model = await createLLMModel({
                ...modelData,
                providerId
            });

            res.status(201).json({
                success: true,
                data: {
                    model: {
                        ...model,
                        pricing: model.pricing || null,
                        capabilities: model.capabilities || []
                    }
                }
            });
        } catch (error) {
            console.error('[LLM MODEL CREATE ERROR]', error);
            res.status(500).json({
                error: 'Failed to create LLM model',
                code: 'MODEL_CREATE_FAILED'
            });
        }
    }
);

/**
 * PUT /api/llms/models/:id
 * Update LLM model
 */
router.put('/models/:id',
    authenticateToken,
    requireSuperAdmin,
    validateRequest(UpdateModelSchema),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            console.log('[LLM MODEL] Updating model:', id);

            const model = await updateLLMModel(id, updateData);
            if (!model) {
                return res.status(404).json({
                    error: 'LLM model not found',
                    code: 'MODEL_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                data: {
                    model: {
                        ...model,
                        pricing: model.pricing || null,
                        capabilities: model.capabilities || []
                    }
                }
            });
        } catch (error) {
            console.error('[LLM MODEL UPDATE ERROR]', error);
            res.status(500).json({
                error: 'Failed to update LLM model',
                code: 'MODEL_UPDATE_FAILED'
            });
        }
    }
);

/**
 * DELETE /api/llms/models/:id
 * Delete LLM model
 */
router.delete('/models/:id',
    authenticateToken,
    requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            console.log('[LLM MODEL] Deleting model:', id);

            const deleted = await deleteLLMModel(id);
            if (!deleted) {
                return res.status(404).json({
                    error: 'LLM model not found',
                    code: 'MODEL_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                message: 'LLM model deleted successfully'
            });
        } catch (error) {
            console.error('[LLM MODEL DELETE ERROR]', error);
            res.status(500).json({
                error: 'Failed to delete LLM model',
                code: 'MODEL_DELETE_FAILED'
            });
        }
    }
);

// ============================================================================
// LEGACY ENDPOINT (for backward compatibility)
// ============================================================================

/**
 * GET /api/llms/configurations
 * Legacy endpoint - now returns database-driven configurations
 */
router.get('/configurations',
    authenticateToken,
    requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            console.log('[LLM CONFIGURATIONS] Fetching database-driven configurations');

            const providers = await getLLMProviders();

            // Get models for each provider
            const providersWithModels = await Promise.all(
                providers.map(async (provider) => {
                    const models = await getLLMModels(provider.id);
                    return {
                        id: provider.id,
                        name: provider.name,
                        type: provider.type,
                        status: provider.status,
                        description: provider.description,
                        baseUrl: provider.baseUrl,
                        apiKey: provider.apiKey ? '***' : undefined,
                        models: models.map(model => ({
                            id: model.id,
                            name: model.name,
                            displayName: model.displayName,
                            provider: provider.id,
                            type: model.type,
                            status: model.status,
                            contextLength: model.contextLength,
                            maxTokens: model.maxTokens,
                            pricing: model.pricing || null,
                            capabilities: model.capabilities || []
                        }))
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    providers: providersWithModels,
                    total: providersWithModels.length
                }
            });
        } catch (error) {
            console.error('[LLM CONFIGURATIONS ERROR]', error);
            res.status(500).json({
                error: 'Failed to fetch LLM configurations',
                code: 'CONFIGURATIONS_FAILED'
            });
        }
    }
);

export default router;
