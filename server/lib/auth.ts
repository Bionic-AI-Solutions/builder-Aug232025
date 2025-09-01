import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Persona types
export type Persona = 'super_admin' | 'builder' | 'end_user';

// User roles
export type UserRole = 'admin' | 'super_admin' | 'builder' | 'end_user';

// Permission types
export type Permission =
  | 'create_project'
  | 'edit_project'
  | 'delete_project'
  | 'publish_project'
  | 'purchase_project'
  | 'use_widget'
  | 'manage_users'
  | 'manage_mcp_servers'
  | 'view_analytics'
  | 'manage_marketplace'
  | 'manage_billing'
  | 'view_credentials'
  | 'manage_credentials'
  | 'manage_project_credentials'
  | '*'; // Wildcard permission

// User interface
export interface User {
  id: string;
  email: string;
  persona: Persona;
  roles: UserRole[];
  permissions: Permission[];
  metadata: Record<string, any>;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  persona: Persona;
  roles: UserRole[];
  permissions: Permission[];
  iat: number;
  exp: number;
}

// Authentication schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  persona: z.enum(['super_admin', 'builder', 'end_user']),
  metadata: z.record(z.any()).optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: ['*'], // All permissions
  admin: [
    'manage_users',
    'manage_mcp_servers',
    'view_analytics',
    'manage_marketplace',
    'manage_billing',
  ],
  builder: [
    'create_project',
    'edit_project',
    'delete_project',
    'publish_project',
    'view_analytics',
    'view_credentials',
    'manage_credentials',
    'manage_project_credentials',
  ],
  end_user: [
    'purchase_project',
    'use_widget',
  ],
};

// Persona to role mapping
export const PERSONA_ROLES: Record<Persona, UserRole[]> = {
  super_admin: ['super_admin', 'admin'],
  builder: ['builder'],
  end_user: ['end_user'],
};

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(user: User): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    persona: user.persona,
    roles: user.roles,
    permissions: user.permissions,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): { userId: string; email: string } {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Get user permissions from roles
 */
export function getPermissionsFromRoles(roles: UserRole[]): Permission[] {
  const permissions = new Set<Permission>();

  for (const role of roles) {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach(permission => permissions.add(permission));
  }

  return Array.from(permissions);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes('*') || userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return userPermissions.includes('*') || requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return userPermissions.includes('*') || requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Check if user can access a specific persona's data
 */
export function canAccessPersonaData(userPersona: Persona, targetPersona: Persona): boolean {
  // Super admin can access all data
  if (userPersona === 'super_admin') return true;

  // Users can only access their own data
  return userPersona === targetPersona;
}

/**
 * Validate user persona
 */
export function validatePersona(persona: string): persona is Persona {
  return ['super_admin', 'builder', 'end_user'].includes(persona);
}

/**
 * Create a new user with proper role and permission assignment
 */
export function createUserWithRoles(
  email: string,
  persona: Persona,
  metadata: Record<string, any> = {}
): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  const roles = PERSONA_ROLES[persona];
  const permissions = getPermissionsFromRoles(roles);

  return {
    email,
    persona,
    roles,
    permissions,
    metadata,
    isActive: true,
  };
}

/**
 * Extract user from JWT token
 */
export function extractUserFromToken(token: string): User {
  const payload = verifyAccessToken(token);

  return {
    id: payload.userId,
    email: payload.email,
    persona: payload.persona,
    roles: payload.roles,
    permissions: payload.permissions,
    metadata: {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(user: User): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting helper for authentication endpoints
 */
export function createRateLimitKey(identifier: string, action: string): string {
  return `auth:${action}:${identifier}`;
}

/**
 * Session management helper
 */
export function createSessionKey(userId: string): string {
  return `session:${userId}`;
}

/**
 * Blacklist token helper
 */
export function createBlacklistKey(token: string): string {
  return `blacklist:${token}`;
}

export default {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getPermissionsFromRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessPersonaData,
  validatePersona,
  createUserWithRoles,
  extractUserFromToken,
  generateTokenPair,
  validatePasswordStrength,
  createRateLimitKey,
  createSessionKey,
  createBlacklistKey,
  ROLE_PERMISSIONS,
  PERSONA_ROLES,
};
