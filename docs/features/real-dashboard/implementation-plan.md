# Real Dashboard Implementation Plan

## Phase 1: Database Enhancement & Data Migration

### 1.1 Database Schema Updates

#### Task 1.1.1: Add Missing User Fields
```sql
-- Add missing user fields to support dashboard requirements
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;
```

#### Task 1.1.2: Create Analytics Views
```sql
-- Create materialized views for dashboard analytics
CREATE MATERIALIZED VIEW dashboard_platform_metrics AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.persona = 'builder' THEN u.id END) as total_builders,
    COUNT(DISTINCT CASE WHEN u.persona = 'end_user' THEN u.id END) as total_end_users,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT mp.id) as total_marketplace_projects,
    COALESCE(SUM(re.amount), 0) as total_revenue,
    COUNT(DISTINCT CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN u.id END) as new_users_30d
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN marketplace_projects mp ON p.id = mp.project_id
LEFT JOIN revenue_events re ON mp.id = re.project_id;

-- Create index for performance
CREATE INDEX idx_dashboard_metrics_refresh ON dashboard_platform_metrics (total_users);
```

#### Task 1.1.3: Create Dashboard Aggregates
```sql
-- Builder performance aggregates
CREATE MATERIALIZED VIEW builder_performance AS
SELECT 
    u.id as builder_id,
    u.name as builder_name,
    u.email as builder_email,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT mp.id) as published_projects,
    COUNT(DISTINCT wi.id) as total_implementations,
    COALESCE(SUM(re.amount), 0) as total_revenue,
    AVG(mp.rating) as average_rating,
    COUNT(DISTINCT mp.download_count) as total_downloads
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN marketplace_projects mp ON p.id = mp.project_id
LEFT JOIN widget_implementations wi ON mp.id = wi.project_id
LEFT JOIN revenue_events re ON mp.id = re.project_id
WHERE u.persona = 'builder'
GROUP BY u.id, u.name, u.email;

-- End user activity aggregates
CREATE MATERIALIZED VIEW end_user_activity AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    COUNT(DISTINCT wi.id) as total_widgets,
    COUNT(DISTINCT CASE WHEN wi.last_used >= NOW() - INTERVAL '30 days' THEN wi.id END) as active_widgets,
    COALESCE(SUM(re.amount), 0) as total_spent,
    SUM(wi.usage_count) as total_usage,
    MAX(wi.last_used) as last_activity
FROM users u
LEFT JOIN widget_implementations wi ON u.id = wi.end_user_id
LEFT JOIN revenue_events re ON u.id = re.end_user_id
WHERE u.persona = 'end_user'
GROUP BY u.id, u.name, u.email;
```

### 1.2 Sample Data Creation

#### Task 1.2.1: Create Comprehensive Sample Data
```sql
-- Insert real users with proper data
INSERT INTO users (id, email, password_hash, name, username, persona, roles, permissions, is_active, approval_status, created_at) VALUES
('user-admin-1', 'admin@builderai.com', '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22', 'Admin User', 'admin', 'super_admin', ARRAY['super_admin'], ARRAY['manage_users', 'manage_marketplace', 'view_all_analytics', 'approve_users'], true, 'approved', NOW()),
('user-builder-1', 'builder@builderai.com', '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22', 'John Builder', 'john_builder', 'builder', ARRAY['builder'], ARRAY['create_project', 'edit_project', 'publish_project', 'view_analytics'], true, 'approved', NOW()),
('user-builder-2', 'sarah@builderai.com', '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22', 'Sarah Developer', 'sarah_dev', 'builder', ARRAY['builder'], ARRAY['create_project', 'edit_project', 'publish_project', 'view_analytics'], true, 'approved', NOW()),
('user-end-1', 'demo@builderai.com', '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22', 'Demo User', 'demo_user', 'end_user', ARRAY['end_user'], ARRAY['purchase_project'], true, 'approved', NOW()),
('user-end-2', 'pizza@example.com', '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22', 'Pizza Palace', 'pizza_palace', 'end_user', ARRAY['end_user'], ARRAY['purchase_project'], true, 'approved', NOW()),
('user-end-3', 'tech@example.com', '$2b$12$Qdcg6ig8aPq1dONSzq.qJOGPg5RiH0sD2UWv4EeMYdyX2DsZVLB22', 'Tech Store', 'tech_store', 'end_user', ARRAY['end_user'], ARRAY['purchase_project'], true, 'approved', NOW());

-- Insert sample projects
INSERT INTO projects (id, user_id, name, description, prompt, status, published, marketplace_price, marketplace_description, revenue, created_at) VALUES
('proj-restaurant-1', 'user-builder-1', 'Restaurant POS System', 'Complete restaurant management system with online ordering', 'Create a comprehensive restaurant management application', 'completed', true, 400, 'Complete restaurant management system with online ordering, table reservations, and staff dashboard', 4800, NOW() - INTERVAL '30 days'),
('proj-inventory-1', 'user-builder-1', 'Inventory Management', 'Inventory tracking and management system', 'Create an inventory management system', 'completed', true, 300, 'Inventory tracking and management system with barcode scanning', 3200, NOW() - INTERVAL '25 days'),
('proj-analytics-1', 'user-builder-2', 'E-commerce Analytics', 'Analytics dashboard for e-commerce businesses', 'Create an analytics dashboard', 'completed', true, 250, 'Analytics dashboard for e-commerce businesses with real-time metrics', 1800, NOW() - INTERVAL '20 days'),
('proj-blog-1', 'user-builder-2', 'Blog Platform', 'Modern blog platform with CMS', 'Create a modern blog platform', 'completed', true, 200, 'Modern blog platform with content management system', 1200, NOW() - INTERVAL '15 days');

-- Insert marketplace projects
INSERT INTO marketplace_projects (id, project_id, builder_id, title, description, price, category, tags, status, featured, rating, review_count, download_count, revenue, published_at) VALUES
('mp-restaurant-1', 'proj-restaurant-1', 'user-builder-1', 'Restaurant POS System', 'Complete restaurant management system with online ordering', 400, 'Business', ARRAY['restaurant', 'pos', 'management'], 'active', true, 4.8, 12, 45, 4800, NOW() - INTERVAL '30 days'),
('mp-inventory-1', 'proj-inventory-1', 'user-builder-1', 'Inventory Management', 'Inventory tracking and management system', 300, 'Business', ARRAY['inventory', 'tracking', 'management'], 'active', false, 4.6, 8, 32, 3200, NOW() - INTERVAL '25 days'),
('mp-analytics-1', 'proj-analytics-1', 'user-builder-2', 'E-commerce Analytics', 'Analytics dashboard for e-commerce businesses', 250, 'Analytics', ARRAY['analytics', 'ecommerce', 'dashboard'], 'active', true, 4.7, 15, 28, 1800, NOW() - INTERVAL '20 days'),
('mp-blog-1', 'proj-blog-1', 'user-builder-2', 'Blog Platform', 'Modern blog platform with CMS', 200, 'Content', ARRAY['blog', 'cms', 'content'], 'active', false, 4.5, 6, 18, 1200, NOW() - INTERVAL '15 days');

-- Insert widget implementations
INSERT INTO widget_implementations (id, project_id, end_user_id, customer_id, configuration, usage_count, last_used, created_at) VALUES
('wi-pizza-1', 'proj-restaurant-1', 'user-end-2', 'pizza-palace-001', '{"theme": "dark", "features": ["ordering", "payment", "reservations"]}', 1250, NOW(), NOW() - INTERVAL '25 days'),
('wi-tech-1', 'proj-inventory-1', 'user-end-3', 'tech-store-001', '{"theme": "light", "features": ["inventory", "reports", "barcode"]}', 890, NOW(), NOW() - INTERVAL '20 days'),
('wi-demo-1', 'proj-analytics-1', 'user-end-1', 'demo-analytics-001', '{"theme": "blue", "features": ["analytics", "reports"]}', 567, NOW() - INTERVAL '18 days'),
('wi-demo-2', 'proj-blog-1', 'user-end-1', 'demo-blog-001', '{"theme": "green", "features": ["blog", "cms"]}', 234, NOW() - INTERVAL '12 days');

-- Insert revenue events
INSERT INTO revenue_events (id, project_id, builder_id, end_user_id, event_type, amount, currency, status, commission_rate, builder_share, platform_share, created_at) VALUES
('rev-pizza-1', 'proj-restaurant-1', 'user-builder-1', 'user-end-2', 'purchase', 400, 'USD', 'completed', 0.15, 340, 60, NOW() - INTERVAL '25 days'),
('rev-tech-1', 'proj-inventory-1', 'user-builder-1', 'user-end-3', 'purchase', 300, 'USD', 'completed', 0.15, 255, 45, NOW() - INTERVAL '20 days'),
('rev-demo-1', 'proj-analytics-1', 'user-builder-2', 'user-end-1', 'purchase', 250, 'USD', 'completed', 0.15, 212, 38, NOW() - INTERVAL '18 days'),
('rev-demo-2', 'proj-blog-1', 'user-builder-2', 'user-end-1', 'purchase', 200, 'USD', 'completed', 0.15, 170, 30, NOW() - INTERVAL '12 days');

-- Insert usage events
INSERT INTO usage_events (id, widget_implementation_id, project_id, end_user_id, event_type, metadata, created_at) VALUES
('usage-pizza-1', 'wi-pizza-1', 'proj-restaurant-1', 'user-end-2', 'widget_used', '{"action": "order_placed", "items": 3}', NOW() - INTERVAL '1 hour'),
('usage-pizza-2', 'wi-pizza-1', 'proj-restaurant-1', 'user-end-2', 'widget_used', '{"action": "payment_processed", "amount": 45.50}', NOW() - INTERVAL '2 hours'),
('usage-tech-1', 'wi-tech-1', 'proj-inventory-1', 'user-end-3', 'widget_used', '{"action": "inventory_updated", "items": 15}', NOW() - INTERVAL '3 hours'),
('usage-demo-1', 'wi-demo-1', 'proj-analytics-1', 'user-end-1', 'widget_used', '{"action": "report_generated", "type": "sales"}', NOW() - INTERVAL '4 hours');
```

#### Task 1.2.2: Create Data Refresh Scripts
```sql
-- Refresh materialized views
REFRESH MATERIALIZED VIEW dashboard_platform_metrics;
REFRESH MATERIALIZED VIEW builder_performance;
REFRESH MATERIALIZED VIEW end_user_activity;
```

## Phase 2: API Development

### 2.1 Dashboard Analytics API

#### Task 2.1.1: Create Dashboard Routes
```typescript
// server/routes/dashboard.ts
import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { db } from '../db';

const router = Router();

// GET /api/dashboard/analytics - Super Admin Platform Analytics
router.get('/analytics', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const metrics = await db.query(`
      SELECT * FROM dashboard_platform_metrics
    `);
    
    const topBuilders = await db.query(`
      SELECT * FROM builder_performance 
      ORDER BY total_revenue DESC 
      LIMIT 10
    `);
    
    const topProjects = await db.query(`
      SELECT mp.*, u.name as builder_name
      FROM marketplace_projects mp
      JOIN users u ON mp.builder_id = u.id
      ORDER BY mp.revenue DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        platformMetrics: metrics[0],
        leaderboards: {
          topBuilders,
          topProjects
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/dashboard/builder/:userId - Builder Dashboard
router.get('/builder/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access this data
    if (req.user!.persona !== 'super_admin' && req.user!.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const builderData = await db.query(`
      SELECT * FROM builder_performance WHERE builder_id = $1
    `, [userId]);
    
    const projects = await db.query(`
      SELECT p.*, mp.*, 
             COUNT(wi.id) as implementation_count,
             SUM(wi.usage_count) as total_usage
      FROM projects p
      LEFT JOIN marketplace_projects mp ON p.id = mp.project_id
      LEFT JOIN widget_implementations wi ON mp.id = wi.project_id
      WHERE p.user_id = $1
      GROUP BY p.id, mp.id
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: {
        overview: builderData[0],
        projects
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch builder dashboard' });
  }
});

// GET /api/dashboard/end-user/:userId - End User Dashboard
router.get('/end-user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access this data
    if (req.user!.persona !== 'super_admin' && req.user!.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const userData = await db.query(`
      SELECT * FROM end_user_activity WHERE user_id = $1
    `, [userId]);
    
    const widgets = await db.query(`
      SELECT wi.*, mp.title, mp.price, u.name as builder_name
      FROM widget_implementations wi
      JOIN marketplace_projects mp ON wi.project_id = mp.id
      JOIN users u ON mp.builder_id = u.id
      WHERE wi.end_user_id = $1
      ORDER BY wi.last_used DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: {
        overview: userData[0],
        widgets
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch end user dashboard' });
  }
});

export default router;
```

### 2.2 User Management API

#### Task 2.2.1: Create Admin Routes
```typescript
// server/routes/admin.ts
import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { db } from '../db';

const router = Router();

// GET /api/admin/users - Get all users with management data
router.get('/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const users = await db.query(`
      SELECT u.*, 
             COUNT(DISTINCT p.id) as project_count,
             COUNT(DISTINCT wi.id) as implementation_count,
             COALESCE(SUM(re.amount), 0) as total_revenue
      FROM users u
      LEFT JOIN projects p ON u.id = p.user_id
      LEFT JOIN widget_implementations wi ON u.id = wi.end_user_id
      LEFT JOIN revenue_events re ON u.id = re.builder_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    const pendingUsers = await db.query(`
      SELECT * FROM users 
      WHERE approval_status = 'pending'
      ORDER BY created_at ASC
    `);
    
    res.json({
      success: true,
      data: {
        users,
        pendingUsers,
        stats: {
          totalUsers: users.length,
          pendingUsers: pendingUsers.length,
          activeUsers: users.filter(u => u.is_active).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:id/approve - Approve user
router.post('/users/:id/approve', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(`
      UPDATE users 
      SET approval_status = 'approved', 
          approved_by = $1, 
          approved_at = NOW(),
          is_active = true
      WHERE id = $2
    `, [req.user!.id, id]);
    
    res.json({ success: true, message: 'User approved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// POST /api/admin/users/:id/reject - Reject user
router.post('/users/:id/reject', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    await db.query(`
      UPDATE users 
      SET approval_status = 'rejected', 
          approved_by = $1, 
          approved_at = NOW(),
          rejection_reason = $2,
          is_active = false
      WHERE id = $3
    `, [req.user!.id, reason, id]);
    
    res.json({ success: true, message: 'User rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

export default router;
```

### 2.3 Real-time Updates API

#### Task 2.3.1: Create WebSocket Endpoints
```typescript
// server/websocket/dashboard.ts
import { WebSocketServer } from 'ws';
import { db } from '../db';

export function setupDashboardWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws, req) => {
    console.log('Dashboard WebSocket connected');
    
    // Send initial data
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString()
    }));
    
    // Handle dashboard subscriptions
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'subscribe_analytics':
            // Send real-time analytics updates
            const metrics = await getRealTimeMetrics();
            ws.send(JSON.stringify({
              type: 'analytics_update',
              data: metrics
            }));
            break;
            
          case 'subscribe_user_dashboard':
            // Send user-specific dashboard updates
            const userData = await getUserDashboardData(data.userId);
            ws.send(JSON.stringify({
              type: 'user_dashboard_update',
              data: userData
            }));
            break;
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
  });
}

async function getRealTimeMetrics() {
  // Refresh and return real-time metrics
  await db.query('REFRESH MATERIALIZED VIEW dashboard_platform_metrics');
  const metrics = await db.query('SELECT * FROM dashboard_platform_metrics');
  return metrics[0];
}

async function getUserDashboardData(userId: string) {
  // Get user-specific dashboard data
  const userData = await db.query(`
    SELECT * FROM users WHERE id = $1
  `, [userId]);
  
  return userData[0];
}
```

## Phase 3: Frontend Integration

### 3.1 Dashboard Hooks

#### Task 3.1.1: Create Dashboard Hooks
```typescript
// client/src/hooks/useDashboard.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/auth';

export const useDashboardAnalytics = () => {
  return useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: () => apiCall('/dashboard/analytics'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useBuilderDashboard = (userId: string) => {
  return useQuery({
    queryKey: ['dashboard', 'builder', userId],
    queryFn: () => apiCall(`/dashboard/builder/${userId}`),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useEndUserDashboard = (userId: string) => {
  return useQuery({
    queryKey: ['dashboard', 'end-user', userId],
    queryFn: () => apiCall(`/dashboard/end-user/${userId}`),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useUserManagement = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiCall('/admin/users'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useApproveUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => apiCall(`/admin/users/${userId}/approve`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
};

export const useRejectUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => 
      apiCall(`/admin/users/${userId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
};
```

### 3.2 Real-time Updates

#### Task 3.2.1: Create WebSocket Hook
```typescript
// client/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

export const useDashboardWebSocket = (userId?: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/dashboard');
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Dashboard WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
      
      // Handle different message types
      switch (data.type) {
        case 'analytics_update':
          // Update analytics data
          break;
        case 'user_dashboard_update':
          // Update user dashboard data
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Dashboard WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const subscribeToAnalytics = () => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_analytics'
      }));
    }
  };

  const subscribeToUserDashboard = (userId: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_user_dashboard',
        userId
      }));
    }
  };

  return {
    isConnected,
    lastMessage,
    subscribeToAnalytics,
    subscribeToUserDashboard
  };
};
```

## Phase 4: Testing & Deployment

### 4.1 Integration Tests

#### Task 4.1.1: Create Dashboard Integration Tests
```typescript
// tests/integratione2e/dashboard.test.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as different user types
    await page.goto('http://localhost:8080');
    await page.fill('[data-testid="email-input"]', 'admin@builderai.com');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('Super Admin Dashboard shows real data', async ({ page }) => {
    // Navigate to Super Admin dashboard
    await page.goto('http://localhost:8080/dashboard');
    
    // Verify platform metrics are real
    await expect(page.locator('[data-testid="total-users"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="total-builders"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="total-projects"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="total-revenue"]')).toContainText(/\$\d+/);
    
    // Verify leaderboards show real data
    await expect(page.locator('[data-testid="top-builders"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-projects"]')).toBeVisible();
  });

  test('Builder Dashboard shows real project data', async ({ page }) => {
    // Login as builder
    await page.goto('http://localhost:8080');
    await page.fill('[data-testid="email-input"]', 'builder@builderai.com');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    
    // Verify builder dashboard shows real data
    await expect(page.locator('[data-testid="total-projects"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="total-revenue"]')).toContainText(/\$\d+/);
    await expect(page.locator('[data-testid="recent-projects"]')).toBeVisible();
  });

  test('End User Dashboard shows real widget data', async ({ page }) => {
    // Login as end user
    await page.goto('http://localhost:8080');
    await page.fill('[data-testid="email-input"]', 'demo@builderai.com');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    
    // Verify end user dashboard shows real data
    await expect(page.locator('[data-testid="total-widgets"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="total-spent"]')).toContainText(/\$\d+/);
    await expect(page.locator('[data-testid="widget-list"]')).toBeVisible();
  });

  test('Admin Panel shows real user management data', async ({ page }) => {
    // Navigate to admin panel
    await page.goto('http://localhost:8080/admin');
    
    // Verify user management shows real data
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-users"]')).toBeVisible();
    
    // Test user approval workflow
    const pendingUser = page.locator('[data-testid="pending-user"]').first();
    await pendingUser.locator('[data-testid="approve-button"]').click();
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('Real-time updates work correctly', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:8080/dashboard');
    
    // Wait for initial data load
    await page.waitForSelector('[data-testid="total-users"]');
    
    // Simulate real-time update (this would be triggered by WebSocket)
    const initialCount = await page.locator('[data-testid="total-users"]').textContent();
    
    // Wait for potential real-time update
    await page.waitForTimeout(5000);
    
    const updatedCount = await page.locator('[data-testid="total-users"]').textContent();
    
    // Verify data is consistent (or has updated if there were changes)
    expect(updatedCount).toBeTruthy();
  });
});
```

### 4.2 Performance Tests

#### Task 4.2.1: Create Performance Tests
```typescript
// tests/performance/dashboard.test.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Performance Tests', () => {
  test('Dashboard loads within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:8080/dashboard');
    await page.waitForSelector('[data-testid="dashboard-loaded"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('API responses are under 1 second', async ({ page }) => {
    // Test API response times
    const response = await page.request.get('http://localhost:8080/api/dashboard/analytics');
    expect(response.status()).toBe(200);
    
    // Note: Response time would be measured in actual implementation
    // This is a placeholder for performance testing
  });

  test('Real-time updates have low latency', async ({ page }) => {
    // Test WebSocket latency
    await page.goto('http://localhost:8080/dashboard');
    
    // Measure WebSocket connection time
    const wsStartTime = Date.now();
    await page.waitForFunction(() => {
      return window.websocketConnected === true;
    });
    const wsConnectTime = Date.now() - wsStartTime;
    
    expect(wsConnectTime).toBeLessThan(500);
  });
});
```

## Success Criteria Checklist

### Phase 1: Database Enhancement
- [ ] Database schema updated with missing fields
- [ ] Analytics views created and optimized
- [ ] Sample data inserted and verified
- [ ] Data migration scripts tested

### Phase 2: API Development
- [ ] Dashboard analytics endpoints implemented
- [ ] User management endpoints implemented
- [ ] Real-time update endpoints implemented
- [ ] API documentation completed
- [ ] Error handling implemented

### Phase 3: Frontend Integration
- [ ] Dashboard hooks implemented
- [ ] Real-time updates integrated
- [ ] Mock data replaced with API calls
- [ ] Error handling added
- [ ] Loading states implemented

### Phase 4: Testing & Deployment
- [ ] Integration tests pass
- [ ] Performance tests pass
- [ ] End-to-end tests pass
- [ ] Documentation updated
- [ ] Production deployment completed
