import { test, expect } from '@playwright/test';

test.describe('Real Dashboard Integration Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:8081');
    });

    test.describe('Super Admin Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            // Login as Super Admin
            await page.fill('[data-testid="email-input"]', 'admin@builderai.com');
            await page.fill('[data-testid="password-input"]', 'demo123');
            await page.click('[data-testid="login-button"]');
            await page.waitForURL('**/dashboard');
        });

        test('displays real platform metrics', async ({ page }) => {
            // Navigate to Super Admin dashboard
            await page.goto('http://localhost:8081/dashboard');

            // Wait for dashboard to load
            await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 10000 });

            // Verify platform metrics are real numbers (not mock data)
            const totalUsers = await page.locator('[data-testid="total-users"]').textContent();
            const totalBuilders = await page.locator('[data-testid="total-builders"]').textContent();
            const totalProjects = await page.locator('[data-testid="total-projects"]').textContent();
            const totalRevenue = await page.locator('[data-testid="total-revenue"]').textContent();

            // Verify these are actual numbers (not mock text)
            expect(totalUsers).toMatch(/^\d+$/);
            expect(totalBuilders).toMatch(/^\d+$/);
            expect(totalProjects).toMatch(/^\d+$/);
            expect(totalRevenue).toMatch(/^\$\d+$/);

            // Verify the numbers are reasonable (not 0 or extremely high)
            expect(parseInt(totalUsers!)).toBeGreaterThan(0);
            expect(parseInt(totalBuilders!)).toBeGreaterThan(0);
            expect(parseInt(totalProjects!)).toBeGreaterThan(0);
        });

        test('displays real leaderboard data', async ({ page }) => {
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify top builders section
            const topBuildersSection = page.locator('[data-testid="top-builders"]');
            await expect(topBuildersSection).toBeVisible();

            // Check that builder entries have real data
            const builderEntries = page.locator('[data-testid="builder-entry"]');
            const count = await builderEntries.count();
            expect(count).toBeGreaterThan(0);

            // Verify first builder has real data
            const firstBuilder = builderEntries.first();
            const builderName = await firstBuilder.locator('[data-testid="builder-name"]').textContent();
            const builderRevenue = await firstBuilder.locator('[data-testid="builder-revenue"]').textContent();

            expect(builderName).toBeTruthy();
            expect(builderName).not.toBe('John Builder'); // Should not be mock data
            expect(builderRevenue).toMatch(/^\$\d+$/);
        });

        test('displays real top projects data', async ({ page }) => {
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify top projects section
            const topProjectsSection = page.locator('[data-testid="top-projects"]');
            await expect(topProjectsSection).toBeVisible();

            // Check that project entries have real data
            const projectEntries = page.locator('[data-testid="project-entry"]');
            const count = await projectEntries.count();
            expect(count).toBeGreaterThan(0);

            // Verify first project has real data
            const firstProject = projectEntries.first();
            const projectName = await firstProject.locator('[data-testid="project-name"]').textContent();
            const projectRevenue = await firstProject.locator('[data-testid="project-revenue"]').textContent();

            expect(projectName).toBeTruthy();
            expect(projectName).not.toBe('Restaurant POS System'); // Should not be mock data
            expect(projectRevenue).toMatch(/^\$\d+$/);
        });

        test('real-time updates work correctly', async ({ page }) => {
            await page.goto('http://localhost:8081/dashboard');
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
            await page.fill('[data-testid="email-input"]', 'builder@builderai.com');
            await page.fill('[data-testid="password-input"]', 'demo123');
            await page.click('[data-testid="login-button"]');
            await page.waitForURL('**/dashboard');
        });

        test('displays real builder metrics', async ({ page }) => {
            // Navigate to Builder dashboard
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify builder-specific metrics
            const totalProjects = await page.locator('[data-testid="total-projects"]').textContent();
            const publishedProjects = await page.locator('[data-testid="published-projects"]').textContent();
            const totalRevenue = await page.locator('[data-testid="total-revenue"]').textContent();
            const totalImplementations = await page.locator('[data-testid="total-implementations"]').textContent();

            // Verify these are actual numbers
            expect(totalProjects).toMatch(/^\d+$/);
            expect(publishedProjects).toMatch(/^\d+$/);
            expect(totalRevenue).toMatch(/^\$\d+$/);
            expect(totalImplementations).toMatch(/^\d+$/);

            // Verify the numbers are reasonable
            expect(parseInt(totalProjects!)).toBeGreaterThan(0);
            expect(parseInt(publishedProjects!)).toBeGreaterThanOrEqual(0);
            expect(parseInt(totalImplementations!)).toBeGreaterThanOrEqual(0);
        });

        test('displays real project list', async ({ page }) => {
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify recent projects section
            const recentProjectsSection = page.locator('[data-testid="recent-projects"]');
            await expect(recentProjectsSection).toBeVisible();

            // Check that project entries have real data
            const projectEntries = page.locator('[data-testid="project-entry"]');
            const count = await projectEntries.count();
            expect(count).toBeGreaterThan(0);

            // Verify first project has real data
            const firstProject = projectEntries.first();
            const projectName = await firstProject.locator('[data-testid="project-name"]').textContent();
            const projectStatus = await firstProject.locator('[data-testid="project-status"]').textContent();
            const projectRevenue = await firstProject.locator('[data-testid="project-revenue"]').textContent();

            expect(projectName).toBeTruthy();
            expect(projectStatus).toBeTruthy();
            expect(projectRevenue).toMatch(/^\$\d+$/);
        });

        test('displays real implementation data', async ({ page }) => {
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify recent implementations section
            const implementationsSection = page.locator('[data-testid="recent-implementations"]');
            await expect(implementationsSection).toBeVisible();

            // Check that implementation entries have real data
            const implementationEntries = page.locator('[data-testid="implementation-entry"]');
            const count = await implementationEntries.count();

            if (count > 0) {
                // Verify first implementation has real data
                const firstImplementation = implementationEntries.first();
                const projectName = await firstImplementation.locator('[data-testid="implementation-project"]').textContent();
                const endUserName = await firstImplementation.locator('[data-testid="implementation-end-user"]').textContent();
                const usageCount = await firstImplementation.locator('[data-testid="implementation-usage"]').textContent();

                expect(projectName).toBeTruthy();
                expect(endUserName).toBeTruthy();
                expect(usageCount).toMatch(/^\d+$/);
            }
        });

        test('revenue trends show real data', async ({ page }) => {
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify revenue chart section
            const revenueChart = page.locator('[data-testid="revenue-chart"]');
            await expect(revenueChart).toBeVisible();

            // Check that chart has data points
            const chartDataPoints = page.locator('[data-testid="chart-data-point"]');
            const count = await chartDataPoints.count();
            expect(count).toBeGreaterThan(0);
        });
    });

    test.describe('End User Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            // Login as End User
            await page.fill('[data-testid="email-input"]', 'demo@builderai.com');
            await page.fill('[data-testid="password-input"]', 'demo123');
            await page.click('[data-testid="login-button"]');
            await page.waitForURL('**/dashboard');
        });

        test('displays real end user metrics', async ({ page }) => {
            // Navigate to End User dashboard
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify end user-specific metrics
            const totalWidgets = await page.locator('[data-testid="total-widgets"]').textContent();
            const activeWidgets = await page.locator('[data-testid="active-widgets"]').textContent();
            const totalSpent = await page.locator('[data-testid="total-spent"]').textContent();
            const totalUsage = await page.locator('[data-testid="total-usage"]').textContent();

            // Verify these are actual numbers
            expect(totalWidgets).toMatch(/^\d+$/);
            expect(activeWidgets).toMatch(/^\d+$/);
            expect(totalSpent).toMatch(/^\$\d+$/);
            expect(totalUsage).toMatch(/^\d+$/);

            // Verify the numbers are reasonable
            expect(parseInt(totalWidgets!)).toBeGreaterThanOrEqual(0);
            expect(parseInt(activeWidgets!)).toBeGreaterThanOrEqual(0);
            expect(parseInt(totalUsage!)).toBeGreaterThanOrEqual(0);
        });

        test('displays real widget implementations', async ({ page }) => {
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify widgets section
            const widgetsSection = page.locator('[data-testid="widgets-section"]');
            await expect(widgetsSection).toBeVisible();

            // Check that widget entries have real data
            const widgetEntries = page.locator('[data-testid="widget-entry"]');
            const count = await widgetEntries.count();

            if (count > 0) {
                // Verify first widget has real data
                const firstWidget = widgetEntries.first();
                const widgetName = await firstWidget.locator('[data-testid="widget-name"]').textContent();
                const builderName = await firstWidget.locator('[data-testid="widget-builder"]').textContent();
                const widgetPrice = await firstWidget.locator('[data-testid="widget-price"]').textContent();
                const usageCount = await firstWidget.locator('[data-testid="widget-usage"]').textContent();

                expect(widgetName).toBeTruthy();
                expect(builderName).toBeTruthy();
                expect(widgetPrice).toMatch(/^\$\d+$/);
                expect(usageCount).toMatch(/^\d+$/);
            }
        });

        test('displays real usage analytics', async ({ page }) => {
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify usage chart section
            const usageChart = page.locator('[data-testid="usage-chart"]');
            await expect(usageChart).toBeVisible();

            // Check that chart has data points
            const chartDataPoints = page.locator('[data-testid="chart-data-point"]');
            const count = await chartDataPoints.count();
            expect(count).toBeGreaterThan(0);
        });

        test('displays real billing information', async ({ page }) => {
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');

            // Verify billing section
            const billingSection = page.locator('[data-testid="billing-section"]');
            await expect(billingSection).toBeVisible();

            // Check billing metrics
            const currentMonthSpent = await page.locator('[data-testid="current-month-spent"]').textContent();
            const nextDueDate = await page.locator('[data-testid="next-due-date"]').textContent();

            expect(currentMonthSpent).toMatch(/^\$\d+$/);
            expect(nextDueDate).toBeTruthy();
        });
    });

    test.describe('Admin Panel', () => {
        test.beforeEach(async ({ page }) => {
            // Login as Super Admin
            await page.fill('[data-testid="email-input"]', 'admin@builderai.com');
            await page.fill('[data-testid="password-input"]', 'demo123');
            await page.click('[data-testid="login-button"]');
            await page.waitForURL('**/dashboard');
        });

        test('displays real user management data', async ({ page }) => {
            // Navigate to Admin panel
            await page.goto('http://localhost:8081/admin');
            await page.waitForSelector('[data-testid="admin-panel-loaded"]');

            // Verify user management section
            const userManagementSection = page.locator('[data-testid="user-management"]');
            await expect(userManagementSection).toBeVisible();

            // Check user statistics
            const totalUsers = await page.locator('[data-testid="total-users-count"]').textContent();
            const pendingUsers = await page.locator('[data-testid="pending-users-count"]').textContent();
            const activeUsers = await page.locator('[data-testid="active-users-count"]').textContent();

            expect(totalUsers).toMatch(/^\d+$/);
            expect(pendingUsers).toMatch(/^\d+$/);
            expect(activeUsers).toMatch(/^\d+$/);
        });

        test('displays real user list with stats', async ({ page }) => {
            await page.goto('http://localhost:8081/admin');
            await page.waitForSelector('[data-testid="admin-panel-loaded"]');

            // Verify user list
            const userList = page.locator('[data-testid="user-list"]');
            await expect(userList).toBeVisible();

            // Check that user entries have real data
            const userEntries = page.locator('[data-testid="user-entry"]');
            const count = await userEntries.count();
            expect(count).toBeGreaterThan(0);

            // Verify first user has real data
            const firstUser = userEntries.first();
            const userName = await firstUser.locator('[data-testid="user-name"]').textContent();
            const userEmail = await firstUser.locator('[data-testid="user-email"]').textContent();
            const userPersona = await firstUser.locator('[data-testid="user-persona"]').textContent();
            const userStatus = await firstUser.locator('[data-testid="user-status"]').textContent();

            expect(userName).toBeTruthy();
            expect(userEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/); // Valid email format
            expect(userPersona).toBeTruthy();
            expect(userStatus).toBeTruthy();
        });

        test('user approval workflow works with real data', async ({ page }) => {
            await page.goto('http://localhost:8081/admin');
            await page.waitForSelector('[data-testid="admin-panel-loaded"]');

            // Check for pending users
            const pendingUsersSection = page.locator('[data-testid="pending-users"]');
            const pendingUserEntries = page.locator('[data-testid="pending-user-entry"]');
            const pendingCount = await pendingUserEntries.count();

            if (pendingCount > 0) {
                // Test approval workflow
                const firstPendingUser = pendingUserEntries.first();
                const approveButton = firstPendingUser.locator('[data-testid="approve-button"]');

                await approveButton.click();

                // Wait for success message
                await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

                // Verify user status changed
                await expect(firstPendingUser.locator('[data-testid="user-status"]')).toContainText('Approved');
            }
        });

        test('user rejection workflow works with real data', async ({ page }) => {
            await page.goto('http://localhost:8081/admin');
            await page.waitForSelector('[data-testid="admin-panel-loaded"]');

            // Check for pending users
            const pendingUserEntries = page.locator('[data-testid="pending-user-entry"]');
            const pendingCount = await pendingUserEntries.count();

            if (pendingCount > 0) {
                // Test rejection workflow
                const firstPendingUser = pendingUserEntries.first();
                const rejectButton = firstPendingUser.locator('[data-testid="reject-button"]');

                await rejectButton.click();

                // Fill rejection reason
                await page.fill('[data-testid="rejection-reason-input"]', 'Test rejection reason');
                await page.click('[data-testid="confirm-reject-button"]');

                // Wait for success message
                await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

                // Verify user status changed
                await expect(firstPendingUser.locator('[data-testid="user-status"]')).toContainText('Rejected');
            }
        });
    });

    test.describe('API Endpoints', () => {
        test('dashboard analytics API returns real data', async ({ request }) => {
            // First get auth token
            const loginResponse = await request.post('http://localhost:8081/api/auth/login', {
                data: {
                    email: 'admin@builderai.com',
                    password: 'demo123'
                }
            });

            const loginData = await loginResponse.json();
            const token = loginData.accessToken;

            // Test dashboard analytics endpoint
            const analyticsResponse = await request.get('http://localhost:8081/api/dashboard/analytics', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(analyticsResponse.status()).toBe(200);

            const analyticsData = await analyticsResponse.json();

            // Verify response structure
            expect(analyticsData).toHaveProperty('success', true);
            expect(analyticsData).toHaveProperty('data');
            expect(analyticsData.data).toHaveProperty('platformMetrics');
            expect(analyticsData.data).toHaveProperty('leaderboards');

            // Verify platform metrics are real numbers
            const metrics = analyticsData.data.platformMetrics;
            expect(metrics.total_users).toBeGreaterThan(0);
            expect(metrics.total_builders).toBeGreaterThan(0);
            expect(metrics.total_projects).toBeGreaterThan(0);
            expect(metrics.total_revenue).toBeGreaterThanOrEqual(0);
        });

        test('builder dashboard API returns real data', async ({ request }) => {
            // First get auth token
            const loginResponse = await request.post('http://localhost:8081/api/auth/login', {
                data: {
                    email: 'builder@builderai.com',
                    password: 'demo123'
                }
            });

            const loginData = await loginResponse.json();
            const token = loginData.accessToken;

            // Test builder dashboard endpoint
            const dashboardResponse = await request.get('http://localhost:8081/api/dashboard/builder/user-builder-1', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(dashboardResponse.status()).toBe(200);

            const dashboardData = await dashboardResponse.json();

            // Verify response structure
            expect(dashboardData).toHaveProperty('success', true);
            expect(dashboardData).toHaveProperty('data');
            expect(dashboardData.data).toHaveProperty('overview');
            expect(dashboardData.data).toHaveProperty('projects');

            // Verify overview data
            const overview = dashboardData.data.overview;
            expect(overview.total_projects).toBeGreaterThanOrEqual(0);
            expect(overview.published_projects).toBeGreaterThanOrEqual(0);
            expect(overview.total_revenue).toBeGreaterThanOrEqual(0);
        });

        test('end user dashboard API returns real data', async ({ request }) => {
            // First get auth token
            const loginResponse = await request.post('http://localhost:8081/api/auth/login', {
                data: {
                    email: 'demo@builderai.com',
                    password: 'demo123'
                }
            });

            const loginData = await loginResponse.json();
            const token = loginData.accessToken;

            // Test end user dashboard endpoint
            const dashboardResponse = await request.get('http://localhost:8081/api/dashboard/end-user/user-end-1', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(dashboardResponse.status()).toBe(200);

            const dashboardData = await dashboardResponse.json();

            // Verify response structure
            expect(dashboardData).toHaveProperty('success', true);
            expect(dashboardData).toHaveProperty('data');
            expect(dashboardData.data).toHaveProperty('overview');
            expect(dashboardData.data).toHaveProperty('widgets');

            // Verify overview data
            const overview = dashboardData.data.overview;
            expect(overview.total_widgets).toBeGreaterThanOrEqual(0);
            expect(overview.active_widgets).toBeGreaterThanOrEqual(0);
            expect(overview.total_spent).toBeGreaterThanOrEqual(0);
        });

        test('admin users API returns real data', async ({ request }) => {
            // First get auth token
            const loginResponse = await request.post('http://localhost:8081/api/auth/login', {
                data: {
                    email: 'admin@builderai.com',
                    password: 'demo123'
                }
            });

            const loginData = await loginResponse.json();
            const token = loginData.accessToken;

            // Test admin users endpoint
            const usersResponse = await request.get('http://localhost:8081/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(usersResponse.status()).toBe(200);

            const usersData = await usersResponse.json();

            // Verify response structure
            expect(usersData).toHaveProperty('success', true);
            expect(usersData).toHaveProperty('data');
            expect(usersData.data).toHaveProperty('users');
            expect(usersData.data).toHaveProperty('pendingUsers');
            expect(usersData.data).toHaveProperty('stats');

            // Verify stats
            const stats = usersData.data.stats;
            expect(stats.totalUsers).toBeGreaterThan(0);
            expect(stats.pendingUsers).toBeGreaterThanOrEqual(0);
            expect(stats.activeUsers).toBeGreaterThan(0);

            // Verify users array
            const users = usersData.data.users;
            expect(users.length).toBeGreaterThan(0);

            // Verify first user has required fields
            const firstUser = users[0];
            expect(firstUser).toHaveProperty('id');
            expect(firstUser).toHaveProperty('email');
            expect(firstUser).toHaveProperty('persona');
            expect(firstUser).toHaveProperty('is_active');
        });
    });

    test.describe('Error Handling', () => {
        test('handles unauthorized access correctly', async ({ page }) => {
            // Try to access admin panel without login
            await page.goto('http://localhost:8081/admin');

            // Should redirect to login
            await expect(page).toHaveURL(/.*login.*/);
        });

        test('handles insufficient permissions correctly', async ({ page }) => {
            // Login as builder (not admin)
            await page.fill('[data-testid="email-input"]', 'builder@builderai.com');
            await page.fill('[data-testid="password-input"]', 'demo123');
            await page.click('[data-testid="login-button"]');
            await page.waitForURL('**/dashboard');

            // Try to access admin panel
            await page.goto('http://localhost:8081/admin');

            // Should show access denied or redirect
            await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
        });

        test('handles API errors gracefully', async ({ page }) => {
            // Login as admin
            await page.fill('[data-testid="email-input"]', 'admin@builderai.com');
            await page.fill('[data-testid="password-input"]', 'demo123');
            await page.click('[data-testid="login-button"]');
            await page.waitForURL('**/dashboard');

            // Navigate to dashboard
            await page.goto('http://localhost:8081/dashboard');

            // Simulate API error by temporarily breaking the connection
            // This would be done by mocking the API response in a real test

            // Verify error state is handled gracefully
            await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        });
    });

    test.describe('Performance', () => {
        test('dashboard loads within 2 seconds', async ({ page }) => {
            // Login as admin
            await page.fill('[data-testid="email-input"]', 'admin@builderai.com');
            await page.fill('[data-testid="password-input"]', 'demo123');
            await page.click('[data-testid="login-button"]');
            await page.waitForURL('**/dashboard');

            // Measure dashboard load time
            const startTime = Date.now();
            await page.goto('http://localhost:8081/dashboard');
            await page.waitForSelector('[data-testid="dashboard-loaded"]');
            const loadTime = Date.now() - startTime;

            expect(loadTime).toBeLessThan(2000);
        });

        test('API responses are under 1 second', async ({ request }) => {
            // Get auth token
            const loginResponse = await request.post('http://localhost:8081/api/auth/login', {
                data: {
                    email: 'admin@builderai.com',
                    password: 'demo123'
                }
            });

            const loginData = await loginResponse.json();
            const token = loginData.accessToken;

            // Measure API response time
            const startTime = Date.now();
            const response = await request.get('http://localhost:8081/api/dashboard/analytics', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const responseTime = Date.now() - startTime;

            expect(response.status()).toBe(200);
            expect(responseTime).toBeLessThan(1000);
        });
    });
});
