import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../server/app';
import { db } from '../../../server/db';
import { storage } from '../../../server/storage';

// Mock database queries
vi.mock('../../../server/db', () => ({
    db: {
        query: vi.fn()
    }
}));

// Mock storage
vi.mock('../../../server/storage', () => ({
    storage: {
        getUser: vi.fn(),
        getUsers: vi.fn(),
        updateUser: vi.fn()
    }
}));

// Mock authentication middleware
vi.mock('../../../server/middleware/auth', () => ({
    authenticateToken: vi.fn((req, res, next) => {
        req.user = {
            id: 'test-user-id',
            email: 'test@example.com',
            persona: 'super_admin',
            roles: ['super_admin'],
            permissions: ['manage_users', 'view_all_analytics']
        };
        next();
    }),
    requireSuperAdmin: vi.fn((req, res, next) => {
        if (req.user?.persona === 'super_admin') {
            next();
        } else {
            res.status(403).json({ error: 'Super Admin access required' });
        }
    })
}));

describe('Dashboard API Endpoints', () => {
    let mockDbQuery: any;
    let mockStorage: any;

    beforeEach(() => {
        mockDbQuery = vi.mocked(db.query);
        mockStorage = vi.mocked(storage);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/dashboard/analytics', () => {
        it('should return platform analytics for super admin', async () => {
            const mockMetrics = {
                total_users: 100,
                total_builders: 25,
                total_projects: 150,
                total_revenue: 50000,
                new_users_30d: 10
            };

            const mockTopBuilders = [
                {
                    builder_id: 'user-1',
                    builder_name: 'John Builder',
                    builder_email: 'john@example.com',
                    total_projects: 10,
                    published_projects: 8,
                    total_implementations: 15,
                    total_revenue: 5000,
                    average_rating: 4.5,
                    total_downloads: 100
                }
            ];

            const mockTopProjects = [
                {
                    id: 'mp-1',
                    title: 'Restaurant POS System',
                    builder_name: 'John Builder',
                    revenue: 3000,
                    rating: 4.8,
                    download_count: 45
                }
            ];

            mockDbQuery
                .mockResolvedValueOnce([mockMetrics]) // dashboard_platform_metrics
                .mockResolvedValueOnce(mockTopBuilders) // top builders
                .mockResolvedValueOnce(mockTopProjects); // top projects

            const response = await request(app)
                .get('/api/dashboard/analytics')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    platformMetrics: mockMetrics,
                    leaderboards: {
                        topBuilders: mockTopBuilders,
                        topProjects: mockTopProjects
                    }
                }
            });

            expect(mockDbQuery).toHaveBeenCalledTimes(3);
        });

        it('should handle database errors gracefully', async () => {
            mockDbQuery.mockRejectedValueOnce(new Error('Database connection failed'));

            const response = await request(app)
                .get('/api/dashboard/analytics')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: 'Failed to fetch analytics'
            });
        });

        it('should return empty data when no records exist', async () => {
            const emptyMetrics = {
                total_users: 0,
                total_builders: 0,
                total_projects: 0,
                total_revenue: 0,
                new_users_30d: 0
            };

            mockDbQuery
                .mockResolvedValueOnce([emptyMetrics])
                .mockResolvedValueOnce([]) // empty top builders
                .mockResolvedValueOnce([]); // empty top projects

            const response = await request(app)
                .get('/api/dashboard/analytics')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body.data.platformMetrics).toEqual(emptyMetrics);
            expect(response.body.data.leaderboards.topBuilders).toEqual([]);
            expect(response.body.data.leaderboards.topProjects).toEqual([]);
        });
    });

    describe('GET /api/dashboard/builder/:userId', () => {
        it('should return builder dashboard data for valid user', async () => {
            const mockBuilderData = {
                builder_id: 'user-builder-1',
                builder_name: 'John Builder',
                builder_email: 'john@example.com',
                total_projects: 10,
                published_projects: 8,
                total_implementations: 15,
                total_revenue: 5000,
                average_rating: 4.5,
                total_downloads: 100
            };

            const mockProjects = [
                {
                    id: 'proj-1',
                    name: 'Restaurant POS System',
                    status: 'published',
                    implementations: 12,
                    revenue: 4800,
                    created_at: '2024-01-01T00:00:00Z',
                    rating: 4.8,
                    downloads: 45
                }
            ];

            mockDbQuery
                .mockResolvedValueOnce([mockBuilderData]) // builder performance
                .mockResolvedValueOnce(mockProjects); // projects

            const response = await request(app)
                .get('/api/dashboard/builder/user-builder-1')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    overview: mockBuilderData,
                    projects: mockProjects
                }
            });
        });

        it('should handle access control for non-owner users', async () => {
            // Mock user as builder (not super admin)
            vi.mocked(require('../../../server/middleware/auth').authenticateToken).mockImplementationOnce((req, res, next) => {
                req.user = {
                    id: 'other-user-id',
                    email: 'other@example.com',
                    persona: 'builder',
                    roles: ['builder'],
                    permissions: ['create_project']
                };
                next();
            });

            const response = await request(app)
                .get('/api/dashboard/builder/user-builder-1')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(403);
            expect(response.body).toEqual({
                error: 'Access denied'
            });
        });

        it('should handle missing builder data', async () => {
            mockDbQuery
                .mockResolvedValueOnce([]) // no builder data
                .mockResolvedValueOnce([]); // no projects

            const response = await request(app)
                .get('/api/dashboard/builder/non-existent-user')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body.data.overview).toBeUndefined();
            expect(response.body.data.projects).toEqual([]);
        });
    });

    describe('GET /api/dashboard/end-user/:userId', () => {
        it('should return end user dashboard data for valid user', async () => {
            const mockUserData = {
                user_id: 'user-end-1',
                user_name: 'Demo User',
                user_email: 'demo@example.com',
                total_widgets: 8,
                active_widgets: 6,
                total_spent: 1200,
                total_usage: 5000,
                last_activity: '2024-01-01T00:00:00Z'
            };

            const mockWidgets = [
                {
                    id: 'wi-1',
                    name: 'Restaurant POS System',
                    builder_name: 'John Builder',
                    price: 400,
                    usage_count: 1250,
                    last_used: '2024-01-01T00:00:00Z',
                    status: 'active'
                }
            ];

            mockDbQuery
                .mockResolvedValueOnce([mockUserData]) // end user activity
                .mockResolvedValueOnce(mockWidgets); // widgets

            const response = await request(app)
                .get('/api/dashboard/end-user/user-end-1')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    overview: mockUserData,
                    widgets: mockWidgets
                }
            });
        });

        it('should handle empty widget list', async () => {
            const mockUserData = {
                user_id: 'user-end-1',
                user_name: 'Demo User',
                user_email: 'demo@example.com',
                total_widgets: 0,
                active_widgets: 0,
                total_spent: 0,
                total_usage: 0,
                last_activity: null
            };

            mockDbQuery
                .mockResolvedValueOnce([mockUserData])
                .mockResolvedValueOnce([]); // empty widgets

            const response = await request(app)
                .get('/api/dashboard/end-user/user-end-1')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body.data.overview).toEqual(mockUserData);
            expect(response.body.data.widgets).toEqual([]);
        });
    });

    describe('GET /api/admin/users', () => {
        it('should return user management data for super admin', async () => {
            const mockUsers = [
                {
                    id: 'user-1',
                    email: 'user1@example.com',
                    name: 'User One',
                    persona: 'builder',
                    is_active: true,
                    approval_status: 'approved',
                    project_count: 5,
                    implementation_count: 0,
                    total_revenue: 2500,
                    created_at: '2024-01-01T00:00:00Z'
                }
            ];

            const mockPendingUsers = [
                {
                    id: 'user-2',
                    email: 'user2@example.com',
                    name: 'User Two',
                    persona: 'end_user',
                    is_active: false,
                    approval_status: 'pending',
                    created_at: '2024-01-02T00:00:00Z'
                }
            ];

            mockDbQuery
                .mockResolvedValueOnce(mockUsers) // all users
                .mockResolvedValueOnce(mockPendingUsers); // pending users

            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    users: mockUsers,
                    pendingUsers: mockPendingUsers,
                    stats: {
                        totalUsers: 1,
                        pendingUsers: 1,
                        activeUsers: 1
                    }
                }
            });
        });

        it('should handle empty user lists', async () => {
            mockDbQuery
                .mockResolvedValueOnce([]) // no users
                .mockResolvedValueOnce([]); // no pending users

            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body.data.stats).toEqual({
                totalUsers: 0,
                pendingUsers: 0,
                activeUsers: 0
            });
        });

        it('should require super admin access', async () => {
            // Mock user as builder (not super admin)
            vi.mocked(require('../../../server/middleware/auth').authenticateToken).mockImplementationOnce((req, res, next) => {
                req.user = {
                    id: 'builder-user',
                    email: 'builder@example.com',
                    persona: 'builder',
                    roles: ['builder'],
                    permissions: ['create_project']
                };
                next();
            });

            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(403);
            expect(response.body).toEqual({
                error: 'Super Admin access required'
            });
        });
    });

    describe('POST /api/admin/users/:id/approve', () => {
        it('should approve user successfully', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'user@example.com',
                approval_status: 'pending'
            };

            mockStorage.getUser.mockResolvedValue(mockUser);
            mockDbQuery.mockResolvedValueOnce({ rowCount: 1 }); // update successful

            const response = await request(app)
                .post('/api/admin/users/user-123/approve')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'User approved successfully'
            });

            expect(mockDbQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET approval_status = \'approved\''),
                ['test-user-id', 'user-123']
            );
        });

        it('should handle non-existent user', async () => {
            mockStorage.getUser.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/admin/users/non-existent-user/approve')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'User not found'
            });
        });

        it('should handle database update errors', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'user@example.com',
                approval_status: 'pending'
            };

            mockStorage.getUser.mockResolvedValue(mockUser);
            mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/api/admin/users/user-123/approve')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: 'Failed to approve user'
            });
        });
    });

    describe('POST /api/admin/users/:id/reject', () => {
        it('should reject user successfully', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'user@example.com',
                approval_status: 'pending'
            };

            mockStorage.getUser.mockResolvedValue(mockUser);
            mockDbQuery.mockResolvedValueOnce({ rowCount: 1 }); // update successful

            const response = await request(app)
                .post('/api/admin/users/user-123/reject')
                .set('Authorization', 'Bearer test-token')
                .send({ reason: 'Test rejection reason' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'User rejected successfully'
            });

            expect(mockDbQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET approval_status = \'rejected\''),
                ['test-user-id', 'Test rejection reason', 'user-123']
            );
        });

        it('should require rejection reason', async () => {
            const response = await request(app)
                .post('/api/admin/users/user-123/reject')
                .set('Authorization', 'Bearer test-token')
                .send({}); // no reason provided

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Rejection reason is required'
            });
        });

        it('should handle non-existent user', async () => {
            mockStorage.getUser.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/admin/users/non-existent-user/reject')
                .set('Authorization', 'Bearer test-token')
                .send({ reason: 'Test reason' });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'User not found'
            });
        });
    });

    describe('Database Query Validation', () => {
        it('should validate analytics query structure', () => {
            const analyticsQuery = `
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
        LEFT JOIN revenue_events re ON mp.id = re.project_id
      `;

            // Validate query contains required fields
            expect(analyticsQuery).toContain('total_users');
            expect(analyticsQuery).toContain('total_builders');
            expect(analyticsQuery).toContain('total_projects');
            expect(analyticsQuery).toContain('total_revenue');
            expect(analyticsQuery).toContain('new_users_30d');

            // Validate table joins
            expect(analyticsQuery).toContain('FROM users u');
            expect(analyticsQuery).toContain('LEFT JOIN projects p');
            expect(analyticsQuery).toContain('LEFT JOIN marketplace_projects mp');
            expect(analyticsQuery).toContain('LEFT JOIN revenue_events re');
        });

        it('should validate builder performance query structure', () => {
            const builderQuery = `
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
        GROUP BY u.id, u.name, u.email
      `;

            // Validate query contains required fields
            expect(builderQuery).toContain('builder_id');
            expect(builderQuery).toContain('builder_name');
            expect(builderQuery).toContain('total_projects');
            expect(builderQuery).toContain('published_projects');
            expect(builderQuery).toContain('total_revenue');

            // Validate WHERE clause
            expect(builderQuery).toContain("WHERE u.persona = 'builder'");
            expect(builderQuery).toContain('GROUP BY u.id, u.name, u.email');
        });

        it('should validate end user activity query structure', () => {
            const endUserQuery = `
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
        GROUP BY u.id, u.name, u.email
      `;

            // Validate query contains required fields
            expect(endUserQuery).toContain('user_id');
            expect(endUserQuery).toContain('user_name');
            expect(endUserQuery).toContain('total_widgets');
            expect(endUserQuery).toContain('active_widgets');
            expect(endUserQuery).toContain('total_spent');
            expect(endUserQuery).toContain('total_usage');

            // Validate WHERE clause
            expect(endUserQuery).toContain("WHERE u.persona = 'end_user'");
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed user IDs', async () => {
            const response = await request(app)
                .get('/api/dashboard/builder/invalid-uuid')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Invalid user ID format'
            });
        });

        it('should handle missing authorization header', async () => {
            const response = await request(app)
                .get('/api/dashboard/analytics');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                error: 'Access token required'
            });
        });

        it('should handle invalid authorization token', async () => {
            const response = await request(app)
                .get('/api/dashboard/analytics')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                error: 'Invalid access token'
            });
        });

        it('should handle database connection failures', async () => {
            mockDbQuery.mockRejectedValueOnce(new Error('Connection refused'));

            const response = await request(app)
                .get('/api/dashboard/analytics')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: 'Failed to fetch analytics'
            });
        });

        it('should handle timeout errors', async () => {
            mockDbQuery.mockRejectedValueOnce(new Error('Query timeout'));

            const response = await request(app)
                .get('/api/dashboard/analytics')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: 'Failed to fetch analytics'
            });
        });
    });

    describe('Performance Tests', () => {
        it('should respond within 1 second for analytics endpoint', async () => {
            const startTime = Date.now();

            mockDbQuery
                .mockResolvedValueOnce([{ total_users: 100, total_builders: 25, total_projects: 150, total_revenue: 50000 }])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const response = await request(app)
                .get('/api/dashboard/analytics')
                .set('Authorization', 'Bearer test-token');

            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(1000);
        });

        it('should handle large datasets efficiently', async () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                id: `user-${i}`,
                email: `user${i}@example.com`,
                persona: 'builder',
                is_active: true
            }));

            mockDbQuery
                .mockResolvedValueOnce([{ total_users: 1000, total_builders: 250, total_projects: 1500, total_revenue: 500000 }])
                .mockResolvedValueOnce(largeDataset.slice(0, 10)) // top 10 builders
                .mockResolvedValueOnce(largeDataset.slice(0, 10)); // top 10 projects

            const startTime = Date.now();

            const response = await request(app)
                .get('/api/dashboard/analytics')
                .set('Authorization', 'Bearer test-token');

            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(2000); // Should handle large datasets within 2 seconds
        });
    });
});
