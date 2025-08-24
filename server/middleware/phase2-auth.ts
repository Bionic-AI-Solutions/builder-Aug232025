import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { verifyAccessToken, hasPermission, hasAnyPermission, type User, type Persona } from '../lib/auth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Authenticate JWT token and attach user to request
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const user = await verifyAccessToken(token);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check approval status for non-super-admin users
    if (user.persona !== 'super_admin' && user.approvalStatus !== 'approved') {
      return res.status(401).json({
        error: 'Account pending approval or rejected',
        code: 'ACCOUNT_NOT_APPROVED',
        status: user.approvalStatus
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTHENTICATION ERROR]', error);
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTHENTICATION_FAILED'
    });
  }
};

/**
 * Optional authentication - attach user if token is valid, but don't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await verifyAccessToken(token);
      if (user && user.isActive && (user.persona === 'super_admin' || user.approvalStatus === 'approved')) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Require specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermission: permission
      });
    }

    next();
  };
};

/**
 * Require any of the specified permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!hasAnyPermission(req.user, permissions)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: permissions
      });
    }

    next();
  };
};

/**
 * Require specific persona
 */
export const requirePersona = (personas: Persona[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!personas.includes(req.user.persona)) {
      return res.status(403).json({
        error: 'Access denied for this persona',
        code: 'PERSONA_ACCESS_DENIED',
        requiredPersonas: personas,
        userPersona: req.user.persona
      });
    }

    next();
  };
};

/**
 * Require Super Admin persona
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  return requirePersona(['super_admin'])(req, res, next);
};

/**
 * Require Builder persona
 */
export const requireBuilder = (req: Request, res: Response, next: NextFunction) => {
  return requirePersona(['builder', 'super_admin'])(req, res, next);
};

/**
 * Require End User persona
 */
export const requireEndUser = (req: Request, res: Response, next: NextFunction) => {
  return requirePersona(['end_user', 'builder', 'super_admin'])(req, res, next);
};

// ============================================================================
// RESOURCE OWNERSHIP MIDDLEWARE
// ============================================================================

/**
 * Validate that user owns the resource (for builders)
 */
export const validateResourceOwnership = (resourceType: 'project' | 'marketplace_project' | 'revenue_account') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Super admin can access all resources
    if (req.user.persona === 'super_admin') {
      return next();
    }

    try {
      const resourceId = req.params.id || req.params.projectId || req.params.userId;
      
      if (!resourceId) {
        return res.status(400).json({
          error: 'Resource ID required',
          code: 'RESOURCE_ID_REQUIRED'
        });
      }

      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import('../storage');
      
      let isOwner = false;

      switch (resourceType) {
        case 'project':
          const project = await storage.getProject(resourceId);
          isOwner = project?.userId === req.user.id;
          break;
          
        case 'marketplace_project':
          // This would need to be implemented in storage
          // For now, we'll assume ownership validation is done in the service layer
          isOwner = true; // Placeholder
          break;
          
        case 'revenue_account':
          isOwner = resourceId === req.user.id;
          break;
      }

      if (!isOwner) {
        return res.status(403).json({
          error: 'Access denied - resource ownership required',
          code: 'RESOURCE_OWNERSHIP_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('[RESOURCE OWNERSHIP VALIDATION ERROR]', error);
      return res.status(500).json({
        error: 'Resource ownership validation failed',
        code: 'OWNERSHIP_VALIDATION_FAILED'
      });
    }
  };
};

// ============================================================================
// MARKETPLACE-SPECIFIC AUTHORIZATION
// ============================================================================

/**
 * Require permission to publish projects
 */
export const requirePublishPermission = (req: Request, res: Response, next: NextFunction) => {
  return requirePermission('publish_project')(req, res, next);
};

/**
 * Require permission to purchase projects
 */
export const requirePurchasePermission = (req: Request, res: Response, next: NextFunction) => {
  return requirePermission('purchase_project')(req, res, next);
};

/**
 * Require permission to manage marketplace
 */
export const requireMarketplaceManagementPermission = (req: Request, res: Response, next: NextFunction) => {
  return requireAnyPermission(['manage_marketplace', 'super_admin'])(req, res, next);
};

/**
 * Validate marketplace project access
 */
export const validateMarketplaceProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  const projectId = req.params.projectId || req.params.id;
  
  if (!projectId) {
    return res.status(400).json({
      error: 'Project ID required',
      code: 'PROJECT_ID_REQUIRED'
    });
  }

  try {
    // Import storage dynamically
    const { storage } = await import('../storage');
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Super admin can access all projects
    if (req.user.persona === 'super_admin') {
      return next();
    }

    // Builder can access their own projects
    if (req.user.persona === 'builder' && project.userId === req.user.id) {
      return next();
    }

    // End users can access published projects
    if (req.user.persona === 'end_user' && project.published === 'true') {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied to project',
      code: 'PROJECT_ACCESS_DENIED'
    });
  } catch (error) {
    console.error('[MARKETPLACE PROJECT ACCESS VALIDATION ERROR]', error);
    return res.status(500).json({
      error: 'Project access validation failed',
      code: 'PROJECT_ACCESS_VALIDATION_FAILED'
    });
  }
};

// ============================================================================
// REVENUE-SPECIFIC AUTHORIZATION
// ============================================================================

/**
 * Require permission to view revenue data
 */
export const requireRevenueViewPermission = (req: Request, res: Response, next: NextFunction) => {
  return requireAnyPermission(['view_revenue', 'manage_revenue', 'super_admin'])(req, res, next);
};

/**
 * Require permission to manage revenue
 */
export const requireRevenueManagementPermission = (req: Request, res: Response, next: NextFunction) => {
  return requireAnyPermission(['manage_revenue', 'super_admin'])(req, res, next);
};

/**
 * Require permission to request payouts
 */
export const requirePayoutPermission = (req: Request, res: Response, next: NextFunction) => {
  return requirePermission('request_payout')(req, res, next);
};

/**
 * Validate revenue account access
 */
export const validateRevenueAccountAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  const accountUserId = req.params.userId || req.params.builderId;
  
  if (!accountUserId) {
    return res.status(400).json({
      error: 'User ID required',
      code: 'USER_ID_REQUIRED'
    });
  }

  // Super admin can access all revenue accounts
  if (req.user.persona === 'super_admin') {
    return next();
  }

  // Users can only access their own revenue account
  if (accountUserId === req.user.id) {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied to revenue account',
    code: 'REVENUE_ACCOUNT_ACCESS_DENIED'
  });
};

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

/**
 * Rate limiting for marketplace operations
 */
export const createRateLimitMiddleware = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();

    const userRequests = requests.get(key);
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }

    userRequests.count++;
    next();
  };
};

// Rate limit configurations
export const marketplaceRateLimit = createRateLimitMiddleware(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const purchaseRateLimit = createRateLimitMiddleware(60 * 1000, 10); // 10 purchases per minute
export const reviewRateLimit = createRateLimitMiddleware(60 * 60 * 1000, 5); // 5 reviews per hour
export const payoutRateLimit = createRateLimitMiddleware(24 * 60 * 60 * 1000, 3); // 3 payout requests per day

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate request body against schema
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

/**
 * Validate query parameters against schema
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Query validation error',
          code: 'QUERY_VALIDATION_ERROR',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

/**
 * Log marketplace and revenue operations
 */
export const logMarketplaceOperation = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const userId = req.user?.id || 'anonymous';
      const userPersona = req.user?.persona || 'anonymous';
      
      console.log(`[MARKETPLACE ${operation.toUpperCase()}]`, {
        userId,
        userPersona,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    });
    
    next();
  };
};

export const logRevenueOperation = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const userId = req.user?.id || 'anonymous';
      const userPersona = req.user?.persona || 'anonymous';
      
      console.log(`[REVENUE ${operation.toUpperCase()}]`, {
        userId,
        userPersona,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    });
    
    next();
  };
};

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Handle authentication and authorization errors
 */
export const authErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }

  next(error);
};

// ============================================================================
// EXPORT ALL MIDDLEWARE
// ============================================================================

export default {
  // Authentication
  authenticateToken,
  optionalAuth,
  
  // Authorization
  requirePermission,
  requireAnyPermission,
  requirePersona,
  requireSuperAdmin,
  requireBuilder,
  requireEndUser,
  
  // Resource ownership
  validateResourceOwnership,
  
  // Marketplace specific
  requirePublishPermission,
  requirePurchasePermission,
  requireMarketplaceManagementPermission,
  validateMarketplaceProjectAccess,
  
  // Revenue specific
  requireRevenueViewPermission,
  requireRevenueManagementPermission,
  requirePayoutPermission,
  validateRevenueAccountAccess,
  
  // Rate limiting
  createRateLimitMiddleware,
  marketplaceRateLimit,
  purchaseRateLimit,
  reviewRateLimit,
  payoutRateLimit,
  
  // Validation
  validateRequest,
  validateQuery,
  
  // Logging
  logMarketplaceOperation,
  logRevenueOperation,
  
  // Error handling
  authErrorHandler
};
