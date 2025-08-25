import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, hasPermission, hasAnyPermission, hasAllPermissions, canAccessPersonaData, extractUserFromToken, type Permission, type Persona } from '../lib/auth';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        persona: Persona;
        roles: string[];
        permissions: Permission[];
      };
    }
  }
}

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      persona: payload.persona,
      roles: payload.roles,
      permissions: payload.permissions,
    };
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid or expired access token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Authorization middleware - checks if user has specific permission
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({ 
        error: `Permission denied: ${permission} required`,
        code: 'PERMISSION_DENIED',
        requiredPermission: permission
      });
    }

    next();
  };
}

/**
 * Authorization middleware - checks if user has any of the required permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!hasAnyPermission(req.user.permissions, permissions)) {
      return res.status(403).json({ 
        error: `Permission denied: one of ${permissions.join(', ')} required`,
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions
      });
    }

    next();
  };
}

/**
 * Authorization middleware - checks if user has all required permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!hasAllPermissions(req.user.permissions, permissions)) {
      return res.status(403).json({ 
        error: `Permission denied: all of ${permissions.join(', ')} required`,
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions
      });
    }

    next();
  };
}

/**
 * Persona-based access control middleware
 */
export function requirePersona(allowedPersonas: Persona[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!allowedPersonas.includes(req.user.persona)) {
      return res.status(403).json({ 
        error: `Access denied: ${req.user.persona} persona not allowed`,
        code: 'PERSONA_ACCESS_DENIED',
        allowedPersonas,
        userPersona: req.user.persona
      });
    }

    next();
  };
}

/**
 * Super admin only middleware
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  return requirePersona(['super_admin'])(req, res, next);
}

/**
 * Builder only middleware
 */
export function requireBuilder(req: Request, res: Response, next: NextFunction) {
  return requirePersona(['builder'])(req, res, next);
}

/**
 * End user only middleware
 */
export function requireEndUser(req: Request, res: Response, next: NextFunction) {
  return requirePersona(['end_user'])(req, res, next);
}

/**
 * Optional authentication middleware - attaches user if token is present
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.userId,
        email: payload.email,
        persona: payload.persona,
        roles: payload.roles,
        permissions: payload.permissions,
      };
    } catch (error) {
      // Token is invalid, but we don't fail the request
      // User will be undefined
    }
  }

  next();
}

/**
 * Rate limiting middleware for authentication endpoints
 */
export function createRateLimitMiddleware(limit: number, windowMs: number) {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    const key = `rate_limit:${identifier}`;

    const current = attempts.get(key);
    
    if (!current || now > current.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      current.count++;
      
      if (current.count > limit) {
        return res.status(429).json({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        });
      }
    }

    next();
  };
}

/**
 * CORS middleware for authentication endpoints
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = process.env.CORS_ORIGIN || 'http://localhost:8080';
  
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
}

/**
 * Request logging middleware for authentication endpoints
 */
export function authLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, path, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(`[AUTH] ${method} ${path} ${statusCode} ${duration}ms - ${ip}`);
    
    // Log authentication attempts
    if (path.includes('/auth') && (method === 'POST' || method === 'PUT')) {
      const success = statusCode >= 200 && statusCode < 300;
      console.log(`[AUTH] ${success ? 'SUCCESS' : 'FAILED'} - ${method} ${path} - User: ${req.user?.email || 'anonymous'}`);
    }
  });

  next();
}

/**
 * Error handling middleware for authentication errors
 */
export function authErrorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error('[AUTH ERROR]', error);

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

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }

  // Default error
  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}

export default {
  authenticateToken,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requirePersona,
  requireSuperAdmin,
  requireBuilder,
  requireEndUser,
  optionalAuth,
  createRateLimitMiddleware,
  corsMiddleware,
  authLoggingMiddleware,
  authErrorHandler,
};
