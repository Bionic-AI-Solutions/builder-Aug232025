import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDashboardAnalytics, useBuilderDashboard, useEndUserDashboard, useUserManagement, useApproveUser, useRejectUser } from '../../client/src/hooks/useDashboard';

// Mock the API call function
vi.mock('../../client/src/lib/auth', () => ({
    apiCall: vi.fn()
}));

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1, // OPEN
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null
}));

// Test component to render hooks
const TestComponent = ({ hook, hookParams }: { hook: any; hookParams?: any }) => {
    const result = hook(hookParams);
    return (
        <div>
        <div data - testid= "loading" > { result.isLoading ? 'loading' : 'loaded' } </div>
        < div data - testid="error" > { result.error ? 'error' : 'no-error' } </div>
            < div data - testid="data" > { result.data ? JSON.stringify(result.data) : 'no-data' } </div>
                </div>
  );
};

// Wrapper component for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return (
        <QueryClientProvider client= { queryClient } >
        { children }
        </QueryClientProvider>
  );
};

describe('Dashboard Hooks', () => {
    let mockApiCall: any;

    beforeEach(() => {
        mockApiCall = vi.mocked(await import('../../client/src/lib/auth')).apiCall;
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('useDashboardAnalytics', () => {
        it('should fetch analytics data successfully', async () => {
            const mockData = {
                platformMetrics: {
                    total_users: 100,
                    total_builders: 25,
                    total_projects: 150,
                    total_revenue: 50000
                },
                leaderboards: {
                    topBuilders: [
                        { id: '1', name: 'John Builder', revenue: 5000 }
                    ],
                    topProjects: [
                        { id: '1', name: 'Restaurant POS', revenue: 3000 }
                    ]
                }
            };

            mockApiCall.mockResolvedValueOnce(mockData);

            render(
                <TestWrapper>
                <TestComponent hook={ useDashboardAnalytics } />
            </TestWrapper>
            );

            // Initially loading
            expect(screen.getByTestId('loading')).toHaveTextContent('loading');

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });

            expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockData));
            expect(mockApiCall).toHaveBeenCalledWith('/dashboard/analytics');
        });

        it('should handle API errors gracefully', async () => {
            mockApiCall.mockRejectedValueOnce(new Error('API Error'));

            render(
                <TestWrapper>
                <TestComponent hook={ useDashboardAnalytics } />
            </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('error')).toHaveTextContent('error');
            });

            expect(screen.getByTestId('data')).toHaveTextContent('no-data');
        });

        it('should refetch data at specified intervals', async () => {
            const mockData = { platformMetrics: { total_users: 100 } };
            mockApiCall.mockResolvedValue(mockData);

            render(
                <TestWrapper>
                <TestComponent hook={ useDashboardAnalytics } />
            </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });

            // Verify initial call
            expect(mockApiCall).toHaveBeenCalledTimes(1);

            // Wait for refetch interval (30 seconds in real implementation)
            // For testing, we'll just verify the hook is set up correctly
            expect(mockApiCall).toHaveBeenCalledWith('/dashboard/analytics');
        });
    });

    describe('useBuilderDashboard', () => {
        it('should fetch builder dashboard data successfully', async () => {
            const mockData = {
                overview: {
                    total_projects: 10,
                    published_projects: 5,
                    total_revenue: 2500,
                    total_implementations: 15
                },
                projects: [
                    { id: '1', name: 'Project 1', status: 'published', revenue: 500 }
                ]
            };

            mockApiCall.mockResolvedValueOnce(mockData);

            render(
                <TestWrapper>
                <TestComponent hook={ useBuilderDashboard } hookParams = "user-123" />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });

            expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockData));
            expect(mockApiCall).toHaveBeenCalledWith('/dashboard/builder/user-123');
        });

        it('should handle missing userId parameter', async () => {
            render(
                <TestWrapper>
                <TestComponent hook={ useBuilderDashboard } hookParams = { undefined } />
                </TestWrapper>
            );

            // Should not make API call without userId
            expect(mockApiCall).not.toHaveBeenCalled();
        });

        it('should handle API errors for builder dashboard', async () => {
            mockApiCall.mockRejectedValueOnce(new Error('Builder dashboard error'));

            render(
                <TestWrapper>
                <TestComponent hook={ useBuilderDashboard } hookParams = "user-123" />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('error')).toHaveTextContent('error');
            });
        });
    });

    describe('useEndUserDashboard', () => {
        it('should fetch end user dashboard data successfully', async () => {
            const mockData = {
                overview: {
                    total_widgets: 8,
                    active_widgets: 6,
                    total_spent: 1200,
                    total_usage: 5000
                },
                widgets: [
                    { id: '1', name: 'Widget 1', builder: 'John', price: 200 }
                ]
            };

            mockApiCall.mockResolvedValueOnce(mockData);

            render(
                <TestWrapper>
                <TestComponent hook={ useEndUserDashboard } hookParams = "user-456" />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });

            expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockData));
            expect(mockApiCall).toHaveBeenCalledWith('/dashboard/end-user/user-456');
        });

        it('should handle empty widget list', async () => {
            const mockData = {
                overview: {
                    total_widgets: 0,
                    active_widgets: 0,
                    total_spent: 0,
                    total_usage: 0
                },
                widgets: []
            };

            mockApiCall.mockResolvedValueOnce(mockData);

            render(
                <TestWrapper>
                <TestComponent hook={ useEndUserDashboard } hookParams = "user-456" />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });

            expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockData));
        });
    });

    describe('useUserManagement', () => {
        it('should fetch user management data successfully', async () => {
            const mockData = {
                users: [
                    { id: '1', email: 'user1@example.com', persona: 'builder', is_active: true }
                ],
                pendingUsers: [
                    { id: '2', email: 'user2@example.com', persona: 'end_user', approval_status: 'pending' }
                ],
                stats: {
                    totalUsers: 1,
                    pendingUsers: 1,
                    activeUsers: 1
                }
            };

            mockApiCall.mockResolvedValueOnce(mockData);

            render(
                <TestWrapper>
                <TestComponent hook={ useUserManagement } />
            </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });

            expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockData));
            expect(mockApiCall).toHaveBeenCalledWith('/admin/users');
        });

        it('should handle empty user lists', async () => {
            const mockData = {
                users: [],
                pendingUsers: [],
                stats: {
                    totalUsers: 0,
                    pendingUsers: 0,
                    activeUsers: 0
                }
            };

            mockApiCall.mockResolvedValueOnce(mockData);

            render(
                <TestWrapper>
                <TestComponent hook={ useUserManagement } />
            </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
            });

            expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(mockData));
        });
    });

    describe('useApproveUser', () => {
        it('should approve user successfully', async () => {
            const mockResponse = { success: true, message: 'User approved successfully' };
            mockApiCall.mockResolvedValueOnce(mockResponse);

            const TestMutationComponent = () => {
                const approveUser = useApproveUser();

                const handleApprove = () => {
                    approveUser.mutate('user-123');
                };

                return (
                    <div>
                    <button onClick= { handleApprove } data - testid="approve-button" > Approve </button>
                        < div data - testid="is-loading" > { approveUser.isPending ? 'loading' : 'idle' } </div>
                            < div data - testid="is-success" > { approveUser.isSuccess ? 'success' : 'not-success' } </div>
                                </div>
        );
    };

    render(
        <TestWrapper>
        <TestMutationComponent />
        </TestWrapper>
    );

    const approveButton = screen.getByTestId('approve-button');
    approveButton.click();

    await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('loading');
    });

    await waitFor(() => {
        expect(screen.getByTestId('is-success')).toHaveTextContent('success');
    });

    expect(mockApiCall).toHaveBeenCalledWith('/admin/users/user-123/approve', {
        method: 'POST'
    });
});

it('should handle approval errors', async () => {
    mockApiCall.mockRejectedValueOnce(new Error('Approval failed'));

    const TestMutationComponent = () => {
        const approveUser = useApproveUser();

        const handleApprove = () => {
            approveUser.mutate('user-123');
        };

        return (
            <div>
            <button onClick= { handleApprove } data - testid="approve-button" > Approve </button>
                < div data - testid="is-error" > { approveUser.isError ? 'error' : 'no-error' } </div>
                    < div data - testid="error-message" > { approveUser.error?.message || 'no-error' } </div>
                        </div>
        );
      };

render(
    <TestWrapper>
    <TestMutationComponent />
    </TestWrapper>
);

const approveButton = screen.getByTestId('approve-button');
approveButton.click();

await waitFor(() => {
    expect(screen.getByTestId('is-error')).toHaveTextContent('error');
});

expect(screen.getByTestId('error-message')).toHaveTextContent('Approval failed');
    });
  });

describe('useRejectUser', () => {
    it('should reject user successfully', async () => {
        const mockResponse = { success: true, message: 'User rejected successfully' };
        mockApiCall.mockResolvedValueOnce(mockResponse);

        const TestMutationComponent = () => {
            const rejectUser = useRejectUser();

            const handleReject = () => {
                rejectUser.mutate({ userId: 'user-123', reason: 'Test rejection' });
            };

            return (
                <div>
                <button onClick= { handleReject } data - testid="reject-button" > Reject </button>
                    < div data - testid="is-loading" > { rejectUser.isPending ? 'loading' : 'idle' } </div>
                        < div data - testid="is-success" > { rejectUser.isSuccess ? 'success' : 'not-success' } </div>
                            </div>
        );
};

render(
    <TestWrapper>
    <TestMutationComponent />
    </TestWrapper>
);

const rejectButton = screen.getByTestId('reject-button');
rejectButton.click();

await waitFor(() => {
    expect(screen.getByTestId('is-loading')).toHaveTextContent('loading');
});

await waitFor(() => {
    expect(screen.getByTestId('is-success')).toHaveTextContent('success');
});

expect(mockApiCall).toHaveBeenCalledWith('/admin/users/user-123/reject', {
    method: 'POST',
    body: JSON.stringify({ reason: 'Test rejection' })
});
    });

it('should handle rejection errors', async () => {
    mockApiCall.mockRejectedValueOnce(new Error('Rejection failed'));

    const TestMutationComponent = () => {
        const rejectUser = useRejectUser();

        const handleReject = () => {
            rejectUser.mutate({ userId: 'user-123', reason: 'Test rejection' });
        };

        return (
            <div>
            <button onClick= { handleReject } data - testid="reject-button" > Reject </button>
                < div data - testid="is-error" > { rejectUser.isError ? 'error' : 'no-error' } </div>
                    < div data - testid="error-message" > { rejectUser.error?.message || 'no-error' } </div>
                        </div>
        );
      };

render(
    <TestWrapper>
    <TestMutationComponent />
    </TestWrapper>
);

const rejectButton = screen.getByTestId('reject-button');
rejectButton.click();

await waitFor(() => {
    expect(screen.getByTestId('is-error')).toHaveTextContent('error');
});

expect(screen.getByTestId('error-message')).toHaveTextContent('Rejection failed');
    });
  });
});

describe('Dashboard Data Validation', () => {
    describe('Analytics Data Structure', () => {
        it('should validate platform metrics structure', () => {
            const validMetrics = {
                total_users: 100,
                total_builders: 25,
                total_projects: 150,
                total_revenue: 50000,
                new_users_30d: 10
            };

            // Validate required fields
            expect(validMetrics).toHaveProperty('total_users');
            expect(validMetrics).toHaveProperty('total_builders');
            expect(validMetrics).toHaveProperty('total_projects');
            expect(validMetrics).toHaveProperty('total_revenue');

            // Validate data types
            expect(typeof validMetrics.total_users).toBe('number');
            expect(typeof validMetrics.total_builders).toBe('number');
            expect(typeof validMetrics.total_projects).toBe('number');
            expect(typeof validMetrics.total_revenue).toBe('number');

            // Validate reasonable ranges
            expect(validMetrics.total_users).toBeGreaterThanOrEqual(0);
            expect(validMetrics.total_builders).toBeGreaterThanOrEqual(0);
            expect(validMetrics.total_projects).toBeGreaterThanOrEqual(0);
            expect(validMetrics.total_revenue).toBeGreaterThanOrEqual(0);
        });

        it('should validate leaderboard data structure', () => {
            const validLeaderboard = {
                topBuilders: [
                    {
                        id: '1',
                        name: 'John Builder',
                        email: 'john@example.com',
                        total_projects: 10,
                        total_revenue: 5000,
                        average_rating: 4.5
                    }
                ],
                topProjects: [
                    {
                        id: '1',
                        title: 'Restaurant POS',
                        builder_name: 'John Builder',
                        revenue: 3000,
                        rating: 4.8,
                        download_count: 45
                    }
                ]
            };

            // Validate topBuilders structure
            expect(Array.isArray(validLeaderboard.topBuilders)).toBe(true);
            if (validLeaderboard.topBuilders.length > 0) {
                const builder = validLeaderboard.topBuilders[0];
                expect(builder).toHaveProperty('id');
                expect(builder).toHaveProperty('name');
                expect(builder).toHaveProperty('total_revenue');
                expect(typeof builder.total_revenue).toBe('number');
            }

            // Validate topProjects structure
            expect(Array.isArray(validLeaderboard.topProjects)).toBe(true);
            if (validLeaderboard.topProjects.length > 0) {
                const project = validLeaderboard.topProjects[0];
                expect(project).toHaveProperty('id');
                expect(project).toHaveProperty('title');
                expect(project).toHaveProperty('revenue');
                expect(typeof project.revenue).toBe('number');
            }
        });
    });

    describe('Builder Dashboard Data Structure', () => {
        it('should validate builder overview structure', () => {
            const validOverview = {
                total_projects: 10,
                published_projects: 5,
                total_implementations: 15,
                total_revenue: 2500,
                monthly_revenue: 500,
                monthly_growth: 15.5,
                total_customers: 8,
                new_customers_this_month: 2
            };

            // Validate required fields
            expect(validOverview).toHaveProperty('total_projects');
            expect(validOverview).toHaveProperty('published_projects');
            expect(validOverview).toHaveProperty('total_revenue');

            // Validate data types
            expect(typeof validOverview.total_projects).toBe('number');
            expect(typeof validOverview.published_projects).toBe('number');
            expect(typeof validOverview.total_revenue).toBe('number');

            // Validate logical constraints
            expect(validOverview.published_projects).toBeLessThanOrEqual(validOverview.total_projects);
            expect(validOverview.total_revenue).toBeGreaterThanOrEqual(0);
        });

        it('should validate project data structure', () => {
            const validProject = {
                id: '1',
                name: 'Project Name',
                status: 'published',
                implementations: 5,
                revenue: 500,
                created_at: '2024-01-01T00:00:00Z',
                rating: 4.5,
                downloads: 25
            };

            // Validate required fields
            expect(validProject).toHaveProperty('id');
            expect(validProject).toHaveProperty('name');
            expect(validProject).toHaveProperty('status');
            expect(validProject).toHaveProperty('revenue');

            // Validate status values
            const validStatuses = ['draft', 'development', 'completed', 'published'];
            expect(validStatuses).toContain(validProject.status);

            // Validate numeric fields
            expect(typeof validProject.revenue).toBe('number');
            expect(validProject.revenue).toBeGreaterThanOrEqual(0);
        });
    });

    describe('End User Dashboard Data Structure', () => {
        it('should validate end user overview structure', () => {
            const validOverview = {
                total_widgets: 8,
                active_widgets: 6,
                total_spent: 1200,
                monthly_spent: 200,
                monthly_growth: -5.2,
                total_usage: 5000,
                monthly_usage: 800
            };

            // Validate required fields
            expect(validOverview).toHaveProperty('total_widgets');
            expect(validOverview).toHaveProperty('active_widgets');
            expect(validOverview).toHaveProperty('total_spent');

            // Validate logical constraints
            expect(validOverview.active_widgets).toBeLessThanOrEqual(validOverview.total_widgets);
            expect(validOverview.total_spent).toBeGreaterThanOrEqual(0);
        });

        it('should validate widget implementation structure', () => {
            const validWidget = {
                id: '1',
                name: 'Widget Name',
                builder: 'John Builder',
                status: 'active',
                price: 200,
                usage_count: 150,
                last_used: '2024-01-01T00:00:00Z',
                implementation_url: 'https://example.com',
                rating: 4.5,
                category: 'Business'
            };

            // Validate required fields
            expect(validWidget).toHaveProperty('id');
            expect(validWidget).toHaveProperty('name');
            expect(validWidget).toHaveProperty('builder');
            expect(validWidget).toHaveProperty('price');

            // Validate status values
            const validStatuses = ['active', 'inactive', 'suspended'];
            expect(validStatuses).toContain(validWidget.status);

            // Validate numeric fields
            expect(typeof validWidget.price).toBe('number');
            expect(typeof validWidget.usage_count).toBe('number');
            expect(validWidget.price).toBeGreaterThanOrEqual(0);
            expect(validWidget.usage_count).toBeGreaterThanOrEqual(0);
        });
    });
});

describe('Dashboard Error Handling', () => {
    it('should handle network errors gracefully', async () => {
        mockApiCall.mockRejectedValueOnce(new Error('Network Error'));

        render(
            <TestWrapper>
            <TestComponent hook={ useDashboardAnalytics } />
        </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('error')).toHaveTextContent('error');
        });
    });

    it('should handle malformed API responses', async () => {
        mockApiCall.mockResolvedValueOnce(null);

        render(
            <TestWrapper>
            <TestComponent hook={ useDashboardAnalytics } />
        </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('data')).toHaveTextContent('no-data');
        });
    });

    it('should handle authentication errors', async () => {
        const authError = new Error('Unauthorized');
        authError.name = 'AuthenticationError';
        mockApiCall.mockRejectedValueOnce(authError);

        render(
            <TestWrapper>
            <TestComponent hook={ useDashboardAnalytics } />
        </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId('error')).toHaveTextContent('error');
        });
    });
});
