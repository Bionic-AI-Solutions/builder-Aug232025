import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db, client } from '../db';
import { z } from 'zod';

const router = Router();

// Validation schemas
const userIdParamSchema = z.object({
    id: z.string().uuid(),
});

const userQuerySchema = z.object({
    page: z.string().optional().transform(val => parseInt(val || '1')),
    limit: z.string().optional().transform(val => parseInt(val || '10')),
    persona: z.string().optional(),
    approvalStatus: z.string().optional(),
    search: z.string().optional(),
});

const approveUserSchema = z.object({
    id: z.string().uuid(),
    approved: z.boolean(),
    notes: z.string().optional(),
});

// GET /api/admin/users - Get all users with pagination and filtering
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Check if user is super admin
        if (req.user!.persona !== 'super_admin') {
            return res.status(403).json({
                error: 'Super Admin access required',
                code: 'SUPER_ADMIN_REQUIRED',
                userPersona: req.user!.persona
            });
        }

        const { page, limit, persona, approvalStatus, search } = userQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await client`
      SELECT COUNT(*) as total
      FROM users u
    `;
        const total = parseInt(countResult[0].total);

        // Get users with pagination
        const usersResult = await client`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        u.persona,
        u.approval_status,
        u.plan_type,
        u.avatar_url,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT p.id) as project_count,
        COUNT(DISTINCT mp.id) as marketplace_project_count,
        COUNT(DISTINCT wi.id) as widget_implementation_count,
        COALESCE(SUM(re.amount), 0) as total_revenue
      FROM users u
      LEFT JOIN projects p ON p.user_id = u.id
      LEFT JOIN marketplace_projects mp ON mp.builder_id = u.id
      LEFT JOIN widget_implementations wi ON wi.end_user_id = u.id
      LEFT JOIN revenue_events re ON re.builder_id = u.id
      GROUP BY u.id, u.name, u.email, u.username, u.persona, u.approval_status, u.plan_type, u.avatar_url, u.last_login_at, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            success: true,
            data: {
                users: usersResult,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                }
            }
        });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({
            error: 'Failed to fetch users',
            code: 'ADMIN_USERS_ERROR'
        });
    }
});

// GET /api/admin/users/:id - Get specific user details
router.get('/users/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Check if user is super admin
        if (req.user!.persona !== 'super_admin') {
            return res.status(403).json({
                error: 'Super Admin access required',
                code: 'SUPER_ADMIN_REQUIRED',
                userPersona: req.user!.persona
            });
        }

        const { id } = userIdParamSchema.parse(req.params);

        // Get user details with extended information
        const userResult = await client`
      SELECT 
        u.*,
        COUNT(DISTINCT p.id) as project_count,
        COUNT(DISTINCT mp.id) as marketplace_project_count,
        COUNT(DISTINCT wi.id) as widget_implementation_count,
        COALESCE(SUM(re.amount), 0) as total_revenue,
        COUNT(DISTINCT ue.id) as usage_event_count
      FROM users u
      LEFT JOIN projects p ON p.user_id = u.id
      LEFT JOIN marketplace_projects mp ON mp.builder_id = u.id
      LEFT JOIN widget_implementations wi ON wi.end_user_id = u.id
      LEFT JOIN revenue_events re ON re.builder_id = u.id
      LEFT JOIN usage_events ue ON ue.end_user_id = u.id
      WHERE u.id = ${id}
      GROUP BY u.id
    `;

        if (userResult.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Get user's recent activity
        const activityResult = await client`
      SELECT 
        'project_created' as type,
        p.name as title,
        p.created_at as timestamp,
        p.status as status
      FROM projects p
      WHERE p.user_id = ${id}
      UNION ALL
      SELECT 
        'marketplace_purchase' as type,
        mp.title as title,
        mp.published_at as timestamp,
        mp.status as status
      FROM marketplace_projects mp
      WHERE mp.builder_id = ${id}
      UNION ALL
      SELECT 
        'widget_implementation' as type,
        CONCAT('Widget for ', p.name) as title,
        wi.created_at as timestamp,
        'active' as status
      FROM widget_implementations wi
      JOIN projects p ON p.id = wi.project_id
      WHERE wi.end_user_id = ${id}
      ORDER BY timestamp DESC
      LIMIT 20
    `;

        res.json({
            success: true,
            data: {
                user: userResult[0],
                recentActivity: activityResult
            }
        });
    } catch (error) {
        console.error('Admin user details error:', error);
        res.status(500).json({
            error: 'Failed to fetch user details',
            code: 'ADMIN_USER_DETAILS_ERROR'
        });
    }
});

// POST /api/admin/users/:id/approve - Approve or reject user
router.post('/users/:id/approve', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Check if user is super admin
        if (req.user!.persona !== 'super_admin') {
            return res.status(403).json({
                error: 'Super Admin access required',
                code: 'SUPER_ADMIN_REQUIRED',
                userPersona: req.user!.persona
            });
        }

        const { id } = userIdParamSchema.parse(req.params);
        const { approved, notes } = approveUserSchema.parse(req.body);

        // Check if user exists
        const userCheck = await client`SELECT id, approval_status FROM users WHERE id = ${id}`;
        if (userCheck.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        const currentStatus = userCheck[0].approval_status;
        if (currentStatus === (approved ? 'approved' : 'rejected')) {
            return res.status(400).json({
                error: 'User is already in the requested status',
                code: 'USER_STATUS_ALREADY_SET'
            });
        }

        // Update user approval status
        const newStatus = approved ? 'approved' : 'rejected';
        await client`UPDATE users SET approval_status = ${newStatus}, updated_at = NOW() WHERE id = ${id}`;

        // Log the approval action (you might want to create an audit log table)
        console.log(`User ${id} ${approved ? 'approved' : 'rejected'} by admin ${req.user!.id}. Notes: ${notes || 'None'}`);

        res.json({
            success: true,
            data: {
                message: `User ${approved ? 'approved' : 'rejected'} successfully`,
                userId: id,
                newStatus,
                approvedBy: req.user!.id,
                notes
            }
        });
    } catch (error) {
        console.error('Admin approve user error:', error);
        res.status(500).json({
            error: 'Failed to update user approval status',
            code: 'ADMIN_APPROVE_USER_ERROR'
        });
    }
});

// GET /api/admin/statistics - Get admin statistics
router.get('/statistics', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Check if user is super admin
        if (req.user!.persona !== 'super_admin') {
            return res.status(403).json({
                error: 'Super Admin access required',
                code: 'SUPER_ADMIN_REQUIRED',
                userPersona: req.user!.persona
            });
        }

        // Get user statistics by persona
        const userStats = await client`
      SELECT 
        persona,
        approval_status,
        COUNT(*) as count
      FROM users
      GROUP BY persona, approval_status
      ORDER BY persona, approval_status
    `;

        // Get pending approvals count
        const pendingApprovals = await client`
      SELECT COUNT(*) as count
      FROM users
      WHERE approval_status = 'pending'
    `;

        // Get recent registrations
        const recentRegistrations = await client`
      SELECT 
        name,
        email,
        persona,
        approval_status,
        created_at
      FROM users
      WHERE created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 10
    `;

        // Get platform metrics
        const platformMetrics = await client`
      SELECT * FROM dashboard_platform_metrics
    `;

        res.json({
            success: true,
            data: {
                userStatistics: userStats,
                pendingApprovals: pendingApprovals[0].count,
                recentRegistrations: recentRegistrations,
                platformMetrics: platformMetrics[0]
            }
        });
    } catch (error) {
        console.error('Admin statistics error:', error);
        res.status(500).json({
            error: 'Failed to fetch admin statistics',
            code: 'ADMIN_STATISTICS_ERROR'
        });
    }
});

export default router;
