import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { type Project } from "@shared/schema";
import {
  useDashboardAnalytics,
  useBuilderDashboard,
  useEndUserDashboard
} from "@/hooks/useDashboard";
import { useDashboardWebSocket } from "@/hooks/useWebSocket";
import {
  Smartphone,
  Users,
  Network,
  Store,
  Eye,
  MessageCircle,
  DollarSign,
  TrendingUp,
  Crown,
  Trophy,
  BarChart3,
  Activity,
  Loader2
} from "lucide-react";

// Helper functions
const formatCurrency = (amount: string | number) => {
  const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numAmount / 100);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Dashboard() {
  const { user } = useAuth();
  const persona = user?.persona;
  const [, setLocation] = useLocation();

  // Use WebSocket for real-time updates
  useDashboardWebSocket(user?.id);

  // If not Super Admin, show persona-specific dashboard
  if (persona !== 'super_admin') {
    if (persona === 'builder') {
      return <BuilderDashboard userId={user?.id} />;
    } else if (persona === 'end_user') {
      return <EndUserDashboard userId={user?.id} />;
    }
    return <RegularDashboard />;
  }

  return <SuperAdminDashboard />;
}

function SuperAdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: analytics, isLoading, error } = useDashboardAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard data</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform-wide overview and analytics
          </p>
        </div>
        <Button onClick={() => setLocation('/admin')}>
          <Crown className="w-4 h-4 mr-2" />
          Admin Panel
        </Button>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.platformMetrics.total_users}</div>
            <p className="text-xs text-muted-foreground">
              Across all personas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Builders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.platformMetrics.builder_count}</div>
            <p className="text-xs text-muted-foreground">
              Active app creators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.platformMetrics.total_projects}</div>
            <p className="text-xs text-muted-foreground">
              Marketplace projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.platformMetrics.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              Platform revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Recent Platform Activity
          </CardTitle>
          <CardDescription>Latest platform events and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentActivity.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    {activity.type === 'project_created' && <Smartphone className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'user_registration' && <Users className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'marketplace_purchase' && <DollarSign className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BuilderDashboard({ userId }: { userId?: string }) {
  const { data: dashboard, isLoading, error } = useBuilderDashboard(userId || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading builder dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading builder dashboard</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Builder Dashboard</h1>
          <p className="text-muted-foreground">
            Your projects, revenue, and performance metrics
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard.performance.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Created</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.performance.projects_created}</div>
            <p className="text-xs text-muted-foreground">
              Total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.performance.total_downloads}</div>
            <p className="text-xs text-muted-foreground">
              Marketplace downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(dashboard.performance.avg_rating).toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" />
            Your Projects
          </CardTitle>
          <CardDescription>Projects you've created and published</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <p className="text-xs text-muted-foreground">Created: {formatDate(project.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                  {project.marketplace_title && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">{formatCurrency(project.marketplace_price || 0)}</p>
                      <p className="text-xs text-muted-foreground">{project.download_count} downloads</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      {dashboard.reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Recent Reviews
            </CardTitle>
            <CardDescription>Feedback from your customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.reviews.map((review) => (
                <div key={review.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{review.project_title}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{review.review_text}</p>
                    <p className="text-xs text-muted-foreground">
                      by {review.reviewer_name} • {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EndUserDashboard({ userId }: { userId?: string }) {
  const { data: dashboard, isLoading, error } = useEndUserDashboard(userId || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading end user dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading end user dashboard</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">End User Dashboard</h1>
          <p className="text-muted-foreground">
            Your projects, purchases, and widget usage
          </p>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard.activity.total_spent)}</div>
            <p className="text-xs text-muted-foreground">
              Marketplace purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Created</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activity.projects_created}</div>
            <p className="text-xs text-muted-foreground">
              Your projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Widget Implementations</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activity.widget_implementations}</div>
            <p className="text-xs text-muted-foreground">
              Active widgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activity.usage_events}</div>
            <p className="text-xs text-muted-foreground">
              Widget interactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" />
            Your Projects
          </CardTitle>
          <CardDescription>Projects you've created</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <p className="text-xs text-muted-foreground">Created: {formatDate(project.created_at)}</p>
                  </div>
                </div>
                <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Purchases */}
      {dashboard.purchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-green-500" />
              Marketplace Purchases
            </CardTitle>
            <CardDescription>Projects you've purchased from the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Store className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{purchase.project_title}</p>
                      <p className="text-sm text-muted-foreground">{purchase.project_description}</p>
                      <p className="text-xs text-muted-foreground">by {purchase.seller_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(purchase.amount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(purchase.purchased_at)}</p>
                    <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                      {purchase.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Widget Implementations */}
      {dashboard.widgetImplementations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              Widget Implementations
            </CardTitle>
            <CardDescription>Widgets you've implemented in your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.widgetImplementations.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Eye className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{widget.project_name}</p>
                      <p className="text-sm text-muted-foreground">Customer ID: {widget.customer_id}</p>
                      <p className="text-xs text-muted-foreground">Last used: {formatDate(widget.last_used)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{widget.usage_count} uses</p>
                    <p className="text-xs text-muted-foreground">{formatDate(widget.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Regular dashboard for non-Super Admin users
function RegularDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch(`/api/projects?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["/api/mcp-servers"],
    queryFn: async () => {
      const response = await fetch(`/api/mcp-servers?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: marketplaceApps = [] } = useQuery({
    queryKey: ["/api/marketplace"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace");
      return response.json();
    },
  });

  const totalRevenue = projects
    .filter(p => p.status === "completed")
    .reduce((sum, p: any) => sum + (p.revenue || 0), 0);

  const metrics = {
    totalApps: projects.length,
    activeProjects: projects.filter(p => p.status !== "completed").length,
    mcpConnections: servers.filter((s: any) => s.status === "connected").length,
    revenue: totalRevenue,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="status-completed">✅ Completed</Badge>;
      case "testing":
        return <Badge className="status-testing">🔄 Testing</Badge>;
      case "development":
        return <Badge className="status-development">🔄 Development</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Generated Apps</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="metric-total-apps">
                  {metrics.totalApps}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Smartphone className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="metric-active-projects">
                  {metrics.activeProjects}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">MCP Connections</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="metric-mcp-connections">
                  {metrics.mcpConnections}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Network className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setLocation('/analytics')}
          data-testid="card-revenue-metric"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Earned</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="metric-revenue">
                  ${(metrics.revenue / 100).toFixed(2)}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp size={14} className="mr-1" />
                  +12.5% this month
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Projects</h2>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No projects yet. Start building your first app!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 3).map((project) => (
                <Card key={project.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900" data-testid={`project-name-${project.id}`}>
                        {project.name}
                      </h3>
                      {getStatusBadge(project.status)}
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        Generated: {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        LLM: {project.llm.charAt(0).toUpperCase() + project.llm.slice(1)}
                      </p>
                      {project.status === "completed" && (project as any).revenue && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-green-600 font-medium">
                            Revenue: ${((project as any).revenue / 100).toFixed(2)}
                          </p>
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            +{(project as any).revenueGrowth || 15}%
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">
                        Files: {project.files?.length || 0} files
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/projects?view=${project.id}`)}
                        data-testid={`button-view-${project.id}`}
                      >
                        <Eye size={16} className="mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/chat-development`)}
                        data-testid={`button-chat-${project.id}`}
                      >
                        <MessageCircle size={16} className="mr-1" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
