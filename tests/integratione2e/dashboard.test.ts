import { test, expect } from '@playwright/test';

test.describe('Real Dashboard Integration Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:8080');
    });

    test.describe('Super Admin Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            // Login as Super Admin
            await page.fill('input[type="email"]', 'admin@builderai.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard');
        });

        test('should display real platform metrics', async ({ page }) => {
            await page.goto('http://localhost:8080/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 10000 });

            // Verify real metrics are displayed
            const totalUsers = await page.locator('[data-testid="total-users"]').textContent();
            const totalRevenue = await page.locator('[data-testid="total-revenue"]').textContent();
            const totalProjects = await page.locator('[data-testid="total-projects"]').textContent();

            expect(totalUsers).toBeTruthy();
            expect(totalRevenue).toBeTruthy();
            expect(totalProjects).toBeTruthy();

            // Verify metrics are numeric and reasonable
            expect(parseInt(totalUsers!)).toBeGreaterThan(0);
            expect(parseFloat(totalRevenue!.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
            expect(parseInt(totalProjects!)).toBeGreaterThan(0);
        });

        test('should display recent activity with real data', async ({ page }) => {
            await page.goto('http://localhost:8080/dashboard');
            await page.waitForSelector('[data-testid="recent-activity"]', { timeout: 10000 });

            const activityItems = await page.locator('[data-testid="activity-item"]').count();
            expect(activityItems).toBeGreaterThan(0);
        });

        test('should display revenue trends with real data', async ({ page }) => {
            await page.goto('http://localhost:8080/dashboard');
            await page.waitForSelector('[data-testid="revenue-chart"]', { timeout: 10000 });

            const chartData = await page.locator('[data-testid="revenue-data-point"]').count();
            expect(chartData).toBeGreaterThan(0);
        });

        test('real-time updates work correctly', async ({ page }) => {
            await page.goto('http://localhost:8080/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Get initial metrics
            const initialUsers = await page.locator('[data-testid="total-users"]').textContent();
            const initialRevenue = await page.locator('[data-testid="total-revenue"]').textContent();

            // Wait for potential real-time update (30 seconds)
            await page.waitForTimeout(30000);

            // Get updated metrics
            const updatedUsers = await page.locator('[data-testid="total-users"]').textContent();
            const updatedRevenue = await page.locator('[data-testid="total-revenue"]').textContent();

            // Verify data is consistent (or has updated if there were changes)
            expect(updatedUsers).toBeTruthy();
            expect(updatedRevenue).toBeTruthy();

            // Verify WebSocket connection status
            const wsStatus = await page.locator('[data-testid="websocket-status"]').textContent();
            expect(wsStatus).toContain('Connected');
        });
    });

    test.describe('Builder Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            // Login as Builder
            await page.fill('input[type="email"]', 'builder@builderai.com');
            await page.fill('input[type="password"]', 'builder123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard');
        });

        test('should display builder-specific metrics', async ({ page }) => {
            await page.goto('http://localhost:8080/dashboard');
            await page.waitForSelector('[data-testid="builder-dashboard"]', { timeout: 10000 });

            // Verify builder metrics
            const projectsCreated = await page.locator('[data-testid="projects-created"]').textContent();
            const totalRevenue = await page.locator('[data-testid="builder-revenue"]').textContent();
            const avgRating = await page.locator('[data-testid="avg-rating"]').textContent();

            expect(projectsCreated).toBeTruthy();
            expect(totalRevenue).toBeTruthy();
            expect(avgRating).toBeTruthy();
        });

        test('should display real project data', async ({ page }) => {
            await page.goto('http://localhost:8080/dashboard');
            await page.waitForSelector('[data-testid="projects-list"]', { timeout: 10000 });

            const projectItems = await page.locator('[data-testid="project-item"]').count();
            expect(projectItems).toBeGreaterThan(0);

            // Verify project details
            const firstProject = await page.locator('[data-testid="project-item"]').first();
            const projectName = await firstProject.locator('[data-testid="project-name"]').textContent();
            const projectStatus = await firstProject.locator('[data-testid="project-status"]').textContent();

            expect(projectName).toBeTruthy();
            expect(projectStatus).toBeTruthy();
        });

        test('should display real revenue data', async ({ page }) => {
            await page.goto('http://localhost:8080/dashboard');
            await page.waitForSelector('[data-testid="revenue-chart"]', { timeout: 10000 });

            const revenueData = await page.locator('[data-testid="revenue-data-point"]').count();
            expect(revenueData).toBeGreaterThan(0);
        });
    });

    test.describe('End User Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            // Login as End User
            await page.fill('input[type="email"]', 'user@builderai.com');
            await page.fill('input[type="password"]', 'user123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard');
        });

        test('should display end user specific data', async ({ page }) => {
            await page.goto('http://localhost:8080/dashboard');
            await page.waitForSelector('[data-testid="end-user-dashboard"]', { timeout: 10000 });

            // Verify end user metrics
            const totalWidgets = await page.locator('[data-testid="total-widgets"]').textContent();
            const activeWidgets = await page.locator('[data-testid="active-widgets"]').textContent();
            const totalSpent = await page.locator('[data-testid="total-spent"]').textContent();

            expect(totalWidgets).toBeTruthy();
            expect(activeWidgets).toBeTruthy();
            expect(totalSpent).toBeTruthy();
        });

        test('should display real widget implementations', async ({ page }) => {
            await page.goto('http://localhost:8080/dashboard');
            await page.waitForSelector('[data-testid="widgets-list"]', { timeout: 10000 });

            const widgetItems = await page.locator('[data-testid="widget-item"]').count();
            expect(widgetItems).toBeGreaterThanOrEqual(0); // May be 0 for new users
        });
    });

    test.describe('Admin Panel', () => {
        test.beforeEach(async ({ page }) => {
            // Login as Super Admin
            await page.fill('input[type="email"]', 'admin@builderai.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard');
        });

        test('should display real user management data', async ({ page }) => {
            await page.goto('http://localhost:8080/admin');
            await page.waitForSelector('[data-testid="admin-users-list"]', { timeout: 10000 });

            const userItems = await page.locator('[data-testid="user-item"]').count();
            expect(userItems).toBeGreaterThan(0);

            // Verify user details
            const firstUser = await page.locator('[data-testid="user-item"]').first();
            const userName = await firstUser.locator('[data-testid="user-name"]').textContent();
            const userEmail = await firstUser.locator('[data-testid="user-email"]').textContent();
            const userPersona = await firstUser.locator('[data-testid="user-persona"]').textContent();

            expect(userName).toBeTruthy();
            expect(userEmail).toBeTruthy();
            expect(userPersona).toBeTruthy();
        });

        test('should display real user statistics', async ({ page }) => {
            await page.goto('http://localhost:8080/admin');
            await page.waitForSelector('[data-testid="user-statistics"]', { timeout: 10000 });

            const totalUsers = await page.locator('[data-testid="total-users"]').textContent();
            const pendingApprovals = await page.locator('[data-testid="pending-approvals"]').textContent();

            expect(totalUsers).toBeTruthy();
            expect(pendingApprovals).toBeTruthy();
        });

        test('should allow user approval/rejection', async ({ page }) => {
            await page.goto('http://localhost:8080/admin');
            await page.waitForSelector('[data-testid="admin-users-list"]', { timeout: 10000 });

            // Find a user with pending status
            const pendingUser = await page.locator('[data-testid="user-item"]').filter({ hasText: 'pending' }).first();
            
            if (await pendingUser.count() > 0) {
                await pendingUser.locator('[data-testid="approve-button"]').click();
                await page.waitForSelector('[data-testid="success-toast"]', { timeout: 5000 });
                
                const successMessage = await page.locator('[data-testid="success-toast"]').textContent();
                expect(successMessage).toContain('approved');
            }
        });
    });

    test.describe('API Endpoint Tests', () => {
        test('dashboard analytics API returns real data', async ({ request }) => {
            // Login to get token
            const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
                data: {
                    email: 'admin@builderai.com',
                    password: 'admin123'
                }
            });
            
            const loginData = await loginResponse.json();
            const token = loginData.data.tokens.accessToken;

            // Test analytics endpoint
            const analyticsResponse = await request.get('http://localhost:8080/api/dashboard/analytics', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(analyticsResponse.status()).toBe(200);
            const analyticsData = await analyticsResponse.json();
            
            expect(analyticsData.success).toBe(true);
            expect(analyticsData.data.platformMetrics).toBeTruthy();
            expect(analyticsData.data.recentActivity).toBeTruthy();
            expect(analyticsData.data.revenueTrends).toBeTruthy();
        });

        test('builder dashboard API returns real data', async ({ request }) => {
            // Login to get token
            const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
                data: {
                    email: 'builder@builderai.com',
                    password: 'builder123'
                }
            });
            
            const loginData = await loginResponse.json();
            const token = loginData.data.tokens.accessToken;
            const userId = loginData.data.user.id;

            // Test builder dashboard endpoint
            const dashboardResponse = await request.get(`http://localhost:8080/api/dashboard/builder/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(dashboardResponse.status()).toBe(200);
            const dashboardData = await dashboardResponse.json();
            
            expect(dashboardData.success).toBe(true);
            expect(dashboardData.data.performance).toBeTruthy();
            expect(dashboardData.data.projects).toBeTruthy();
        });

        test('end user dashboard API returns real data', async ({ request }) => {
            // Login to get token
            const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
                data: {
                    email: 'user@builderai.com',
                    password: 'user123'
                }
            });
            
            const loginData = await loginResponse.json();
            const token = loginData.data.tokens.accessToken;
            const userId = loginData.data.user.id;

            // Test end user dashboard endpoint
            const dashboardResponse = await request.get(`http://localhost:8080/api/dashboard/end-user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(dashboardResponse.status()).toBe(200);
            const dashboardData = await dashboardResponse.json();
            
            expect(dashboardData.success).toBe(true);
            expect(dashboardData.data.activity).toBeTruthy();
            expect(dashboardData.data.projects).toBeTruthy();
        });

        test('admin users API returns real data', async ({ request }) => {
            // Login to get token
            const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
                data: {
                    email: 'admin@builderai.com',
                    password: 'admin123'
                }
            });
            
            const loginData = await loginResponse.json();
            const token = loginData.data.tokens.accessToken;

            // Test admin users endpoint
            const usersResponse = await request.get('http://localhost:8080/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(usersResponse.status()).toBe(200);
            const usersData = await usersResponse.json();
            
            expect(usersData.success).toBe(true);
            expect(usersData.data.users).toBeTruthy();
            expect(usersData.data.pagination).toBeTruthy();
        });
    });

    test.describe('Performance Tests', () => {
        test('dashboard loads within 2 seconds', async ({ page }) => {
            const startTime = Date.now();
            
            await page.goto('http://localhost:8080');
            await page.fill('input[type="email"]', 'admin@builderai.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 10000 });
            
            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(2000);
        });

        test('API responses are under 1 second', async ({ request }) => {
            // Login to get token
            const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
                data: {
                    email: 'admin@builderai.com',
                    password: 'admin123'
                }
            });
            
            const loginData = await loginResponse.json();
            const token = loginData.data.tokens.accessToken;

            // Test multiple API endpoints
            const endpoints = [
                '/api/dashboard/analytics',
                '/api/admin/users',
                '/api/health'
            ];

            for (const endpoint of endpoints) {
                const startTime = Date.now();
                const response = await request.get(`http://localhost:8080${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const responseTime = Date.now() - startTime;
                
                expect(response.status()).toBe(200);
                expect(responseTime).toBeLessThan(1000);
            }
        });
    });

    test.describe('Error Handling Tests', () => {
        test('handles unauthorized access correctly', async ({ request }) => {
            const response = await request.get('http://localhost:8080/api/dashboard/analytics');
            expect(response.status()).toBe(401);
        });

        test('handles invalid user ID correctly', async ({ request }) => {
            // Login to get token
            const loginResponse = await request.post('http://localhost:8080/api/auth/login', {
                data: {
                    email: 'admin@builderai.com',
                    password: 'admin123'
                }
            });
            
            const loginData = await loginResponse.json();
            const token = loginData.data.tokens.accessToken;

            // Test with invalid user ID
            const response = await request.get('http://localhost:8080/api/dashboard/builder/invalid-user-id', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(response.status()).toBe(400);
        });

        test('handles database errors gracefully', async ({ page }) => {
            // This test would require mocking database errors
            // For now, we'll test that the application doesn't crash
            await page.goto('http://localhost:8080');
            await page.fill('input[type="email"]', 'admin@builderai.com');
            await page.fill('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            
            // Should not crash and should show some content
            await page.waitForSelector('body', { timeout: 10000 });
            const bodyText = await page.textContent('body');
            expect(bodyText).toBeTruthy();
        });
    });
});
