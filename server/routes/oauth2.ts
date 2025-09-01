import { Router, Request, Response } from 'express';
import { authenticateToken, requirePermission } from '../middleware/phase2-auth';
import { getDefaultMcpServerAuthMethod, createUserMcpCredential, updateUserMcpCredential } from '../credential-storage';
import { storage } from '../storage';

const router = Router();

// ============================================================================
// OAUTH2 FLOW FOR MCP SERVERS
// ============================================================================

/**
 * GET /api/oauth2/:mcpServerId/authorize
 * Start OAuth2 authorization flow for an MCP server
 */
router.get('/:mcpServerId/authorize',
    authenticateToken,
    requirePermission('manage_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { mcpServerId } = req.params;
            const { redirect_uri, state } = req.query;

            // Get the MCP server and its default auth method
            const mcpServer = await storage.getMcpServer(mcpServerId);
            if (!mcpServer) {
                return res.status(404).json({
                    error: 'MCP server not found',
                    code: 'MCP_SERVER_NOT_FOUND'
                });
            }

            const authMethod = await getDefaultMcpServerAuthMethod(mcpServerId);
            if (!authMethod || authMethod.authType !== 'oauth2') {
                return res.status(400).json({
                    error: 'OAuth2 not supported for this MCP server',
                    code: 'OAUTH2_NOT_SUPPORTED'
                });
            }

            const oauth2Config = authMethod.oauth2Config;
            if (!oauth2Config?.authorizationUrl || !oauth2Config?.clientId) {
                return res.status(500).json({
                    error: 'OAuth2 configuration incomplete',
                    code: 'OAUTH2_CONFIG_INCOMPLETE'
                });
            }

            // Build authorization URL
            const authUrl = new URL(oauth2Config.authorizationUrl);
            authUrl.searchParams.set('client_id', oauth2Config.clientId);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('redirect_uri', oauth2Config.redirectUri || `${req.protocol}://${req.get('host')}/api/oauth2/${mcpServerId}/callback`);
            authUrl.searchParams.set('scope', oauth2Config.scopes?.join(' ') || '');
            authUrl.searchParams.set('state', state as string || `${req.user!.id}:${mcpServerId}`);

            res.json({
                success: true,
                data: {
                    authorizationUrl: authUrl.toString(),
                    mcpServer: {
                        id: mcpServer.id,
                        name: mcpServer.name,
                        type: mcpServer.type
                    },
                    scopes: oauth2Config.scopes
                }
            });
        } catch (error) {
            console.error('[OAUTH2 API] Error starting authorization flow:', error);
            res.status(500).json({
                error: 'Failed to start OAuth2 authorization',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * GET /api/oauth2/:mcpServerId/callback
 * Handle OAuth2 callback and exchange authorization code for tokens
 */
router.get('/:mcpServerId/callback',
    async (req: Request, res: Response) => {
        try {
            const { mcpServerId } = req.params;
            const { code, state, error } = req.query;

            if (error) {
                return res.status(400).json({
                    error: 'OAuth2 authorization failed',
                    code: 'OAUTH2_AUTHORIZATION_FAILED',
                    details: error
                });
            }

            if (!code) {
                return res.status(400).json({
                    error: 'Authorization code required',
                    code: 'AUTHORIZATION_CODE_REQUIRED'
                });
            }

            // Parse state to get user ID
            const stateParts = (state as string)?.split(':');
            const userId = stateParts?.[0];

            if (!userId) {
                return res.status(400).json({
                    error: 'Invalid state parameter',
                    code: 'INVALID_STATE'
                });
            }

            // Get the MCP server and its auth method
            const mcpServer = await storage.getMcpServer(mcpServerId);
            if (!mcpServer) {
                return res.status(404).json({
                    error: 'MCP server not found',
                    code: 'MCP_SERVER_NOT_FOUND'
                });
            }

            const authMethod = await getDefaultMcpServerAuthMethod(mcpServerId);
            if (!authMethod || authMethod.authType !== 'oauth2') {
                return res.status(400).json({
                    error: 'OAuth2 not supported for this MCP server',
                    code: 'OAUTH2_NOT_SUPPORTED'
                });
            }

            const oauth2Config = authMethod.oauth2Config;
            if (!oauth2Config?.tokenUrl || !oauth2Config?.clientId || !oauth2Config?.clientSecret) {
                return res.status(500).json({
                    error: 'OAuth2 configuration incomplete',
                    code: 'OAUTH2_CONFIG_INCOMPLETE'
                });
            }

            // Exchange authorization code for tokens
            const tokenResponse = await fetch(oauth2Config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: oauth2Config.clientId,
                    client_secret: oauth2Config.clientSecret,
                    code: code as string,
                    redirect_uri: oauth2Config.redirectUri || `${req.protocol}://${req.get('host')}/api/oauth2/${mcpServerId}/callback`
                })
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.text();
                console.error('[OAUTH2 API] Token exchange failed:', errorData);
                return res.status(400).json({
                    error: 'Failed to exchange authorization code for tokens',
                    code: 'TOKEN_EXCHANGE_FAILED',
                    details: errorData
                });
            }

            const tokenData = await tokenResponse.json();

            // Check if user already has credentials for this MCP server
            const existingCredentials = await storage.getUserMcpCredentials(userId);
            const existingCredential = existingCredentials.find(cred => cred.mcpServerId === mcpServerId);

            let credential;
            if (existingCredential) {
                // Update existing credential
                credential = await updateUserMcpCredential(existingCredential.id, {
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    scopes: oauth2Config.scopes
                });
            } else {
                // Create new credential
                credential = await createUserMcpCredential(
                    userId,
                    mcpServerId,
                    oauth2Config.clientId,
                    oauth2Config.clientSecret,
                    {
                        accessToken: tokenData.access_token,
                        refreshToken: tokenData.refresh_token,
                        scopes: oauth2Config.scopes,
                        credentialName: `${mcpServer.name} OAuth2 Credential`
                    }
                );
            }

            // Redirect to success page or return success response
            const successUrl = `${req.protocol}://${req.get('host')}/credentials/success?mcpServerId=${mcpServerId}`;

            res.redirect(successUrl);
        } catch (error) {
            console.error('[OAUTH2 API] Error handling OAuth2 callback:', error);
            res.status(500).json({
                error: 'Failed to complete OAuth2 flow',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

/**
 * POST /api/oauth2/:mcpServerId/refresh
 * Refresh OAuth2 access token using refresh token
 */
router.post('/:mcpServerId/refresh',
    authenticateToken,
    requirePermission('manage_credentials'),
    async (req: Request, res: Response) => {
        try {
            const { mcpServerId } = req.params;

            // Get user's MCP credentials
            const userCredentials = await storage.getUserMcpCredentials(req.user!.id);
            const credential = userCredentials.find(cred => cred.mcpServerId === mcpServerId);

            if (!credential) {
                return res.status(404).json({
                    error: 'MCP credential not found',
                    code: 'CREDENTIAL_NOT_FOUND'
                });
            }

            if (!credential.encryptedRefreshToken) {
                return res.status(400).json({
                    error: 'No refresh token available',
                    code: 'NO_REFRESH_TOKEN'
                });
            }

            // Get the MCP server and its auth method
            const mcpServer = await storage.getMcpServer(mcpServerId);
            if (!mcpServer) {
                return res.status(404).json({
                    error: 'MCP server not found',
                    code: 'MCP_SERVER_NOT_FOUND'
                });
            }

            const authMethod = await getDefaultMcpServerAuthMethod(mcpServerId);
            if (!authMethod || authMethod.authType !== 'oauth2') {
                return res.status(400).json({
                    error: 'OAuth2 not supported for this MCP server',
                    code: 'OAUTH2_NOT_SUPPORTED'
                });
            }

            const oauth2Config = authMethod.oauth2Config;
            if (!oauth2Config?.tokenUrl || !oauth2Config?.clientId || !oauth2Config?.clientSecret) {
                return res.status(500).json({
                    error: 'OAuth2 configuration incomplete',
                    code: 'OAUTH2_CONFIG_INCOMPLETE'
                });
            }

            // Decrypt refresh token
            const refreshToken = storage.decryptText(credential.encryptedRefreshToken);

            // Exchange refresh token for new access token
            const tokenResponse = await fetch(oauth2Config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: oauth2Config.clientId,
                    client_secret: oauth2Config.clientSecret,
                    refresh_token: refreshToken
                })
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.text();
                console.error('[OAUTH2 API] Token refresh failed:', errorData);
                return res.status(400).json({
                    error: 'Failed to refresh access token',
                    code: 'TOKEN_REFRESH_FAILED',
                    details: errorData
                });
            }

            const tokenData = await tokenResponse.json();

            // Update credential with new tokens
            const updatedCredential = await updateUserMcpCredential(credential.id, {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || refreshToken // Use new refresh token if provided
            });

            res.json({
                success: true,
                message: 'Access token refreshed successfully',
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
            console.error('[OAUTH2 API] Error refreshing token:', error);
            res.status(500).json({
                error: 'Failed to refresh access token',
                code: 'INTERNAL_ERROR'
            });
        }
    }
);

export default router;
