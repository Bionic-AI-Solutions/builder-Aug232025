import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
  hashPassword,
  comparePassword,
  generateTokenPair,
  verifyRefreshToken,
  validatePasswordStrength,
  createUserWithRoles,
  type User,
  type Persona
} from '../lib/auth';
import {
  authenticateToken,
  createRateLimitMiddleware,
  corsMiddleware,
  authLoggingMiddleware,
  requireSuperAdmin
} from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

// Apply middleware to all auth routes
router.use(corsMiddleware);
router.use(authLoggingMiddleware);

// Rate limiting for authentication endpoints
const loginRateLimit = createRateLimitMiddleware(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const registerRateLimit = createRateLimitMiddleware(3, 60 * 60 * 1000); // 3 attempts per hour

/**
 * POST /api/auth/login
 * User login endpoint
 */
router.post('/login', loginRateLimit, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { email, password } = LoginSchema.parse(req.body);

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
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

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          persona: user.persona,
          roles: user.roles,
          permissions: user.permissions,
          metadata: user.metadata,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60, // 15 minutes in seconds
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

    console.error('[LOGIN ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/register
 * User registration endpoint
 */
router.post('/register', registerRateLimit, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { email, password, persona, metadata } = RegisterSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with roles and permissions
    const userData = createUserWithRoles(email, persona, metadata);

    // Create user in database with pending approval
    const user = await storage.createUser({
      ...userData,
      password_hash: passwordHash,
      approvalStatus: 'pending',
    });

    // Don't generate tokens for pending users
    // They need approval before they can log in

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending approval.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          persona: user.persona,
          approvalStatus: user.approvalStatus,
        },
        message: 'Please wait for admin approval before you can log in.'
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

    console.error('[REGISTER ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { refreshToken } = RefreshTokenSchema.parse(req.body);

    // Verify refresh token
    const { userId, email } = verifyRefreshToken(refreshToken);

    // Get user from database
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

    // Return new tokens
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 15 * 60, // 15 minutes in seconds
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

    console.error('[REFRESH ERROR]', error);
    res.status(401).json({
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

/**
 * POST /api/auth/logout
 * User logout endpoint
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    // In a real application, you would blacklist the refresh token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('[LOGOUT ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Get fresh user data from database
    const user = await storage.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Return user information
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          persona: user.persona,
          roles: user.roles,
          permissions: user.permissions,
          metadata: user.metadata,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      }
    });

  } catch (error) {
    console.error('[ME ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    }).parse(req.body);

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Get user from database
    const user = await storage.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'New password does not meet requirements',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await storage.updateUserPassword(user.id, newPasswordHash);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }

    console.error('[CHANGE PASSWORD ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/register-admin
 * Register a new super admin (super admin only)
 */
router.post('/register-admin', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { email, password, metadata } = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      metadata: z.record(z.any()).optional(),
    }).parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create super admin user
    const userData = createUserWithRoles(email, 'super_admin', metadata);

    // Create user in database
    const user = await storage.createUser({
      ...userData,
      password_hash: passwordHash,
    });

    res.status(201).json({
      success: true,
      message: 'Super admin registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          persona: user.persona,
          roles: user.roles,
          permissions: user.permissions,
          metadata: user.metadata,
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

    console.error('[REGISTER ADMIN ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/auth/pending-users
 * Get list of users pending approval (super admin only)
 */
router.get('/pending-users', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const pendingUsers = await storage.getPendingUsers();

    res.json({
      success: true,
      data: {
        users: pendingUsers.map(user => ({
          id: user.id,
          email: user.email,
          persona: user.persona,
          createdAt: user.createdAt,
          metadata: user.metadata,
        }))
      }
    });
  } catch (error) {
    console.error('[PENDING USERS ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/approve-user/:userId
 * Approve a pending user (super admin only)
 */
router.post('/approve-user/:userId', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { approvedBy } = req.user!;

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.approvalStatus !== 'pending') {
      return res.status(400).json({
        error: 'User is not pending approval',
        code: 'USER_NOT_PENDING'
      });
    }

    await storage.approveUser(userId, approvedBy);

    res.json({
      success: true,
      message: 'User approved successfully'
    });
  } catch (error) {
    console.error('[APPROVE USER ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/reject-user/:userId
 * Reject a pending user (super admin only)
 */
router.post('/reject-user/:userId', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { approvedBy } = req.user!;
    const { reason } = z.object({
      reason: z.string().min(1, 'Rejection reason is required')
    }).parse(req.body);

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.approvalStatus !== 'pending') {
      return res.status(400).json({
        error: 'User is not pending approval',
        code: 'USER_NOT_PENDING'
      });
    }

    await storage.rejectUser(userId, approvedBy, reason);

    res.json({
      success: true,
      message: 'User rejected successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }

    console.error('[REJECT USER ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (authenticated users only)
 */
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, email, currentPassword, newPassword } = z.object({
      name: z.string().optional(),
      email: z.string().email('Invalid email address').optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
    }).parse(req.body);

    // Get current user
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined && email !== user.email) {
      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          error: 'Email already in use',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      }
      updateData.email = email;
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: 'Current password is required to change password',
          code: 'CURRENT_PASSWORD_REQUIRED'
        });
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      updateData.password_hash = newPasswordHash;
    }

    // Update user
    const updatedUser = await storage.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(500).json({
        error: 'Failed to update user',
        code: 'UPDATE_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          persona: updatedUser.persona,
          roles: updatedUser.roles,
          permissions: updatedUser.permissions,
          metadata: updatedUser.metadata,
          isActive: updatedUser.isActive,
          approvalStatus: updatedUser.approvalStatus,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
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

    console.error('[PROFILE UPDATE ERROR]', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
