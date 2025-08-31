import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../lib/auth';

// Types for dashboard data
export interface DashboardAnalytics {
    platformMetrics: {
        total_users: string;
        super_admin_count: string;
        builder_count: string;
        end_user_count: string;
        pending_approvals: string;
        total_marketplace_projects: string;
        total_projects: string;
        total_widget_implementations: string;
        total_revenue: string;
        total_usage_events: string;
        active_user_rate_30d: string;
    };
    recentActivity: Array<{
        type: string;
        title: string;
        timestamp: string;
        category: string;
    }>;
    revenueTrends: Array<{
        date: string;
        daily_revenue: string;
        transactions: string;
    }>;
    userGrowth: Array<{
        date: string;
        new_users: string;
        persona: string;
    }>;
}

export interface BuilderDashboard {
    performance: {
        builder_id: string;
        builder_name: string;
        builder_email: string;
        persona: string;
        approval_status: string;
        joined_date: string;
        last_login_at: string;
        projects_created: string;
        total_downloads: string;
        total_reviews: string;
        avg_rating: string;
        total_revenue: string;
        widget_implementations: string;
        usage_events_generated: string;
    };
    projects: Array<{
        id: string;
        name: string;
        description: string;
        status: string;
        created_at: string;
        revenue: number;
        marketplace_title?: string;
        marketplace_price?: number;
        download_count?: number;
        rating?: string;
        marketplace_status?: string;
    }>;
    revenueData: Array<{
        date: string;
        daily_revenue: string;
        transactions: string;
        event_type: string;
    }>;
    widgetImplementations: Array<{
        id: string;
        customer_id: string;
        configuration: any;
        usage_count: number;
        last_used: string;
        created_at: string;
        project_name: string;
    }>;
    reviews: Array<{
        id: string;
        rating: number;
        review_text: string;
        created_at: string;
        project_title: string;
        reviewer_name: string;
    }>;
}

export interface EndUserDashboard {
    activity: {
        user_id: string;
        user_name: string;
        user_email: string;
        persona: string;
        approval_status: string;
        plan_type: string;
        joined_date: string;
        last_login_at: string;
        projects_created: string;
        marketplace_purchases: string;
        widget_implementations: string;
        usage_events: string;
        total_spent: string;
        reviews_written: string;
    };
    projects: Array<{
        id: string;
        name: string;
        description: string;
        status: string;
        created_at: string;
        updated_at: string;
    }>;
    purchases: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        purchased_at: string;
        project_title: string;
        project_description: string;
        seller_name: string;
    }>;
    widgetImplementations: Array<{
        id: string;
        customer_id: string;
        configuration: any;
        usage_count: number;
        last_used: string;
        created_at: string;
        project_name: string;
    }>;
    usageEvents: Array<{
        id: string;
        event_type: string;
        metadata: any;
        created_at: string;
        customer_id: string;
    }>;
    reviews: Array<{
        id: string;
        rating: number;
        review_text: string;
        created_at: string;
        project_title: string;
    }>;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    username: string;
    persona: string;
    approval_status: string;
    plan_type: string;
    avatar_url: string;
    last_login_at: string;
    created_at: string;
    updated_at: string;
    project_count: string;
    marketplace_project_count: string;
    widget_implementation_count: string;
    total_revenue: string;
}

export interface AdminUsersResponse {
    users: AdminUser[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface AdminStatistics {
    userStatistics: Array<{
        persona: string;
        approval_status: string;
        count: string;
    }>;
    pendingApprovals: string;
    recentRegistrations: Array<{
        name: string;
        email: string;
        persona: string;
        approval_status: string;
        created_at: string;
    }>;
    platformMetrics: {
        total_users: string;
        super_admin_count: string;
        builder_count: string;
        end_user_count: string;
        pending_approvals: string;
        total_marketplace_projects: string;
        total_projects: string;
        total_widget_implementations: string;
        total_revenue: string;
        total_usage_events: string;
        active_user_rate_30d: string;
    };
}

// Dashboard Analytics Hook
export const useDashboardAnalytics = () => {
    return useQuery<DashboardAnalytics>({
        queryKey: ['dashboard', 'analytics'],
        queryFn: async () => {
            const response = await apiCall<DashboardAnalytics>('/dashboard/analytics');
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 30 * 1000, // 30 seconds
    });
};

// Builder Dashboard Hook
export const useBuilderDashboard = (userId: string) => {
    return useQuery<BuilderDashboard>({
        queryKey: ['dashboard', 'builder', userId],
        queryFn: async () => {
            const response = await apiCall<BuilderDashboard>(`/dashboard/builder/${userId}`);
            return response.data;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 30 * 1000, // 30 seconds
    });
};

// End User Dashboard Hook
export const useEndUserDashboard = (userId: string) => {
    return useQuery<EndUserDashboard>({
        queryKey: ['dashboard', 'end-user', userId],
        queryFn: async () => {
            const response = await apiCall<EndUserDashboard>(`/dashboard/end-user/${userId}`);
            return response.data;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 30 * 1000, // 30 seconds
    });
};

// Admin Users Hook
export const useUserManagement = (page = 1, limit = 10, filters?: {
    persona?: string;
    approval_status?: string;
    search?: string;
}) => {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (filters?.persona) {
        queryParams.append('persona', filters.persona);
    }
    if (filters?.approval_status) {
        queryParams.append('approval_status', filters.approval_status);
    }
    if (filters?.search) {
        queryParams.append('search', filters.search);
    }

    return useQuery<AdminUsersResponse>({
        queryKey: ['admin', 'users', page, limit, filters],
        queryFn: async () => {
            const response = await apiCall<AdminUsersResponse>(`/admin/users?${queryParams.toString()}`);
            return response.data;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

// Admin Statistics Hook
export const useAdminStatistics = () => {
    return useQuery<AdminStatistics>({
        queryKey: ['admin', 'statistics'],
        queryFn: async () => {
            const response = await apiCall<AdminStatistics>('/admin/statistics');
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 60 * 1000, // 1 minute
    });
};

// Approve User Hook
export const useApproveUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await apiCall(`/admin/users/${userId}/approve`, {
                method: 'POST',
            });
            return response.data;
        },
        onSuccess: () => {
            // Invalidate and refetch user management queries
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'statistics'] });
        },
    });
};

// Reject User Hook
export const useRejectUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await apiCall(`/admin/users/${userId}/reject`, {
                method: 'POST',
            });
            return response.data;
        },
        onSuccess: () => {
            // Invalidate and refetch user management queries
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'statistics'] });
        },
    });
};


