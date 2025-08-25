import { Router, Request, Response } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { 
  authenticateToken, 
  requireSuperAdmin,
  optionalAuth 
} from '../middleware/auth';
import { 
  generateOAuthTokens, 
  validateOAuthConfig, 
  isValidOAuthProvider,
  type OAuthProfile 
} from '../lib/oauth';
import { 
  createUserWithRoles,
  type Persona 
} from '../lib/auth';
import { storage } from '../storage';

const router = Router();

// OAuth configuration validation
const oauthConfig = validateOAuthConfig();
if (!oauthConfig.isValid) {
  console.warn('OAuth configuration issues:', oauthConfig.errors);
}

/**
 * GET /api/auth/oauth/providers
 * Get available OAuth providers
 */
router.get('/providers', (req: Request, res: Response) => {
  const providers = [
    {
      name: 'google',
      displayName: 'Google',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      authUrl: '/api/auth/oauth/google'
    },
    {
      name: 'facebook',
      displayName: 'Facebook',
      enabled: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      authUrl: '/api/auth/oauth/facebook'
    }
  ];

  res.json({
    success: true,
    data: {
      providers: providers.filter(p => p.enabled)
    }
  });
});

/**
 * GET /api/auth/oauth/:provider
 * Initiate OAuth authentication
 */
router.get('/:provider', (req: Request, res: Response) => {
  const { provider } = req.params;
  
  if (!isValidOAuthProvider(provider)) {
    return res.status(400).json({
      error: 'Invalid OAuth provider',
      code: 'INVALID_PROVIDER',
      supportedProviders: ['google', 'facebook']
    });
  }

  if (!oauthConfig.isValid) {
    return res.status(500).json({
      error: 'OAuth not properly configured',
      code: 'OAUTH_CONFIG_ERROR',
      details: oauthConfig.errors
    });
  }

  // Store the intended persona in session/state
  const persona = req.query.persona as Persona || 'builder';
  
  // Use Passport to authenticate with the provider
  passport.authenticate(provider, {
    scope: provider === 'google' ? ['profile', 'email'] : ['email'],
    state: JSON.stringify({ persona }) // Pass persona through OAuth flow
  })(req, res);
});

/**
 * GET /api/auth/oauth/callback/:provider
 * OAuth callback handler
 */
router.get('/callback/:provider', async (req: Request, res: Response) => {
  const { provider } = req.params;
  
  if (!isValidOAuthProvider(provider)) {
    return res.status(400).json({
      error: 'Invalid OAuth provider',
      code: 'INVALID_PROVIDER'
    });
  }

  passport.authenticate(provider, { session: false }, async (err: any, oauthProfile: OAuthProfile) => {
    try {
      if (err) {
        console.error(`[OAUTH ${provider.toUpperCase()} ERROR]`, err);
        return res.status(500).json({
          error: 'OAuth authentication failed',
          code: 'OAUTH_AUTHENTICATION_FAILED'
        });
      }

      if (!oauthProfile) {
        return res.status(401).json({
          error: 'OAuth authentication failed',
          code: 'OAUTH_AUTHENTICATION_FAILED'
        });
      }

      // Extract persona from state
      const state = req.query.state ? JSON.parse(req.query.state as string) : {};
      const persona: Persona = state.persona || 'builder';

      // Check if social account already exists
      const existingSocialAccount = await storage.getSocialAccount(provider, oauthProfile.providerUserId);
      
      if (existingSocialAccount) {
        // User already has this social account linked
        const user = await storage.getUserById(existingSocialAccount.userId);
        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        // Check approval status
        if (user.approvalStatus === 'pending') {
          return res.status(401).json({
            error: 'Account pending approval. Please wait for admin approval.',
            code: 'ACCOUNT_PENDING_APPROVAL'
          });
        }

        if (user.approvalStatus === 'rejected') {
          return res.status(401).json({
            error: 'Account registration was rejected.',
            code: 'ACCOUNT_REJECTED',
            reason: user.rejectionReason
          });
        }

        // Update last login
        await storage.updateUserLastLogin(user.id);

        // Generate tokens
        const tokens = generateOAuthTokens(user);

        // Redirect to frontend with tokens
        const redirectUrl = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/oauth-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
        return res.redirect(redirectUrl);
      }

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(oauthProfile.email);
      
      if (existingUser) {
        // User exists, link the social account
        await storage.linkSocialAccount(
          existingUser.id,
          provider,
          oauthProfile.providerUserId,
          oauthProfile.profileData
        );

        // Check approval status
        if (existingUser.approvalStatus === 'pending') {
          return res.status(401).json({
            error: 'Account pending approval. Please wait for admin approval.',
            code: 'ACCOUNT_PENDING_APPROVAL'
          });
        }

        if (existingUser.approvalStatus === 'rejected') {
          return res.status(401).json({
            error: 'Account registration was rejected.',
            code: 'ACCOUNT_REJECTED',
            reason: existingUser.rejectionReason
          });
        }

        // Update last login
        await storage.updateUserLastLogin(existingUser.id);

        // Generate tokens
        const tokens = generateOAuthTokens(existingUser);

        // Redirect to frontend with tokens
        const redirectUrl = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/oauth-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
        return res.redirect(redirectUrl);
      }

      // Create new user with OAuth data
      const userData = createUserWithRoles(oauthProfile.email, persona, {
        displayName: oauthProfile.displayName,
        firstName: oauthProfile.firstName,
        lastName: oauthProfile.lastName,
        picture: oauthProfile.picture,
        oauthProvider: provider
      });

      // Create user with pending approval
      const newUser = await storage.createUser({
        ...userData,
        password_hash: null, // OAuth users don't have passwords
        approvalStatus: 'pending',
      });

      // Link social account
      await storage.linkSocialAccount(
        newUser.id,
        provider,
        oauthProfile.providerUserId,
        oauthProfile.profileData
      );

      // Redirect to frontend with pending message
      const redirectUrl = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/oauth-pending?message=Account pending approval`;
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error(`[OAUTH ${provider.toUpperCase()} CALLBACK ERROR]`, error);
      const redirectUrl = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/oauth-error?error=Authentication failed`;
      return res.redirect(redirectUrl);
    }
  })(req, res);
});

/**
 * POST /api/auth/oauth/link-account
 * Link OAuth account to existing user
 */
router.post('/link-account', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { provider, providerUserId, profileData } = z.object({
      provider: z.enum(['google', 'facebook']),
      providerUserId: z.string(),
      profileData: z.record(z.any())
    }).parse(req.body);

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Check if social account already exists
    const existingSocialAccount = await storage.getSocialAccount(provider, providerUserId);
    if (existingSocialAccount) {
      return res.status(409).json({
        error: 'Social account already linked to another user',
        code: 'SOCIAL_ACCOUNT_EXISTS'
      });
    }

    // Link social account to current user
    const socialAccount = await storage.linkSocialAccount(
      req.user.id,
      provider,
      providerUserId,
      profileData
    );

    res.json({
      success: true,
      message: 'Social account linked successfully',
      data: {
        socialAccount: {
          id: socialAccount.id,
          provider: socialAccount.provider,
          providerUserId: socialAccount.providerUserId,
          createdAt: socialAccount.createdAt
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }

    console.error('[LINK ACCOUNT ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/auth/oauth/social-accounts
 * Get user's linked social accounts
 */
router.get('/social-accounts', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const socialAccounts = await storage.getSocialAccountsByUserId(req.user.id);

    res.json({
      success: true,
      data: {
        socialAccounts: socialAccounts.map(account => ({
          id: account.id,
          provider: account.provider,
          providerUserId: account.providerUserId,
          createdAt: account.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('[GET SOCIAL ACCOUNTS ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/auth/oauth/unlink-account/:accountId
 * Unlink social account from user
 */
router.delete('/unlink-account/:accountId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Get social account
    const socialAccounts = await storage.getSocialAccountsByUserId(req.user.id);
    const socialAccount = socialAccounts.find(account => account.id === accountId);

    if (!socialAccount) {
      return res.status(404).json({
        error: 'Social account not found',
        code: 'SOCIAL_ACCOUNT_NOT_FOUND'
      });
    }

    // Delete social account
    await storage.deleteSocialAccount(accountId);

    res.json({
      success: true,
      message: 'Social account unlinked successfully'
    });

  } catch (error) {
    console.error('[UNLINK ACCOUNT ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
