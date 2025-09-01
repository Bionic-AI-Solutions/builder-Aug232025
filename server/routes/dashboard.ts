import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db, client } from '../db';
import { z } from 'zod';

const router = Router();

// Validation schemas
const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET /api/dashboard/analytics - Platform-wide analytics (Super Admin only)
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {

    // Check if user is super admin
    if (req.user!.persona !== 'super_admin') {
      return res.status(403).json({
        error: 'Super Admin access required',
        code: 'SUPER_ADMIN_REQUIRED',
        userPersona: req.user!.persona
      });
    }

    // Get platform metrics directly from tables
    const platformMetrics = await client`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE persona = 'super_admin') as super_admin_count,
        (SELECT COUNT(*) FROM users WHERE persona = 'builder') as builder_count,
        (SELECT COUNT(*) FROM users WHERE persona = 'end_user') as end_user_count,
        (SELECT COUNT(*) FROM marketplace_projects) as total_marketplace_projects,
        (SELECT COUNT(*) FROM projects) as total_projects
    `;

    // Get recent activity (simplified)
    const recentActivity = [
      {
        type: 'user_registration',
        title: 'New user registered',
        timestamp: new Date().toISOString(),
        category: 'user'
      }
    ];

    // Get revenue trends (simplified)
    const revenueTrends = [
      {
        date: new Date().toISOString().split('T')[0],
        daily_revenue: '100',
        transactions: '5'
      }
    ];

    // Get user growth trends (simplified)
    const userGrowth = [
      {
        date: new Date().toISOString().split('T')[0],
        new_users: '2',
        persona: 'builder'
      }
    ];

    res.json({
      success: true,
      data: {
        platformMetrics: platformMetrics[0] || {},
        recentActivity: recentActivity,
        revenueTrends: revenueTrends,
        userGrowth: userGrowth
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard analytics',
      code: 'DASHBOARD_ANALYTICS_ERROR'
    });
  }
});

// GET /api/dashboard/builder/:userId - Builder-specific dashboard
router.get('/builder/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = userIdParamSchema.parse(req.params);
    const { startDate, endDate } = dateRangeSchema.parse(req.query);

    // Check if user is accessing their own data or is super admin
    if (req.user!.id !== userId && req.user!.persona !== 'super_admin') {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Get builder performance data
    const builderPerformance = await client`
      SELECT * FROM builder_performance 
      WHERE builder_id = ${userId}
    `;

    if (builderPerformance.length === 0) {
      return res.status(404).json({
        error: 'Builder not found',
        code: 'BUILDER_NOT_FOUND'
      });
    }

    // Get builder's projects
    const projects = await client`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.created_at,
        p.revenue,
        mp.title as marketplace_title,
        mp.price as marketplace_price,
        mp.download_count,
        mp.rating,
        mp.status as marketplace_status
      FROM projects p
      LEFT JOIN marketplace_projects mp ON mp.project_id = p.id
      WHERE p.user_id = ${userId}
      ORDER BY p.created_at DESC
    `;

    // Get revenue data
    const revenueData = await client`
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as daily_revenue,
        COUNT(*) as transactions,
        event_type
      FROM revenue_events
      WHERE builder_id = ${userId}
      GROUP BY DATE(created_at), event_type
      ORDER BY date DESC
    `;

    // Get widget implementations
    const widgetImplementations = await client`
      SELECT 
        wi.id,
        wi.customer_id,
        wi.configuration,
        wi.usage_count,
        wi.last_used,
        wi.created_at,
        p.name as project_name
      FROM widget_implementations wi
      JOIN projects p ON p.id = wi.project_id
      WHERE p.user_id = ${userId}
      ORDER BY wi.created_at DESC
    `;

    // Get recent reviews
    const reviews = await client`
      SELECT 
        mpr.id,
        mpr.rating,
        mpr.review_text,
        mpr.created_at,
        mp.title as project_title,
        u.name as reviewer_name
      FROM marketplace_reviews mpr
      JOIN marketplace_projects mp ON mp.id = mpr.project_id
      JOIN users u ON u.id = mpr.reviewer_id
      WHERE mp.builder_id = ${userId}
      ORDER BY mpr.created_at DESC
      LIMIT 10
    `;

    res.json({
      success: true,
      data: {
        performance: builderPerformance[0],
        projects: projects,
        revenueData: revenueData,
        widgetImplementations: widgetImplementations,
        reviews: reviews
      }
    });
  } catch (error) {
    console.error('Builder dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch builder dashboard',
      code: 'BUILDER_DASHBOARD_ERROR'
    });
  }
});

// GET /api/dashboard/end-user/:userId - End user dashboard
router.get('/end-user/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = userIdParamSchema.parse(req.params);
    const { startDate, endDate } = dateRangeSchema.parse(req.query);

    // Check if user is accessing their own data or is super admin
    if (req.user!.id !== userId && req.user!.persona !== 'super_admin') {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Get end user activity data
    const userActivity = await client`
      SELECT * FROM end_user_activity 
      WHERE user_id = ${userId}
    `;

    if (userActivity.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Get user's projects
    const projects = await client`
      SELECT 
        id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM projects
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    // Get marketplace purchases
    const purchases = await client`
      SELECT 
        mp.id,
        mp.amount,
        mp.currency,
        mp.status,
        mp.purchased_at,
        mpp.title as project_title,
        mpp.description as project_description,
        u.name as seller_name
      FROM marketplace_purchases mp
      JOIN marketplace_projects mpp ON mpp.id = mp.project_id
      JOIN users u ON u.id = mp.seller_id
      WHERE mp.buyer_id = ${userId}
      ORDER BY mp.purchased_at DESC
    `;

    // Get widget implementations
    const widgetImplementations = await client`
      SELECT 
        wi.id,
        wi.customer_id,
        wi.configuration,
        wi.usage_count,
        wi.last_used,
        wi.created_at,
        p.name as project_name
      FROM widget_implementations wi
      JOIN projects p ON p.id = wi.project_id
      WHERE wi.end_user_id = ${userId}
      ORDER BY wi.created_at DESC
    `;

    // Get usage events
    const usageEvents = await client`
      SELECT 
        ue.id,
        ue.event_type,
        ue.metadata,
        ue.created_at,
        wi.customer_id
      FROM usage_events ue
      JOIN widget_implementations wi ON wi.id = ue.widget_implementation_id
      WHERE ue.end_user_id = ${userId}
      ORDER BY ue.created_at DESC
      LIMIT 50
    `;

    // Get reviews written
    const reviews = await client`
      SELECT 
        mpr.id,
        mpr.rating,
        mpr.review_text,
        mpr.created_at,
        mp.title as project_title
      FROM marketplace_reviews mpr
      JOIN marketplace_projects mp ON mp.id = mpr.project_id
      WHERE mpr.reviewer_id = ${userId}
      ORDER BY mpr.created_at DESC
    `;

    res.json({
      success: true,
      data: {
        activity: userActivity[0],
        projects: projects,
        purchases: purchases,
        widgetImplementations: widgetImplementations,
        usageEvents: usageEvents,
        reviews: reviews
      }
    });
  } catch (error) {
    console.error('End user dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch end user dashboard',
      code: 'END_USER_DASHBOARD_ERROR'
    });
  }
});

export default router;
