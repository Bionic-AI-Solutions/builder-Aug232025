import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { type Project } from "@shared/schema";
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
  Activity
} from "lucide-react";

// Mock data for Super Admin dashboard
const mockSuperAdminData = {
  platformMetrics: {
    totalApps: 156,
    totalBuilders: 89,
    totalUsers: 1247,
    totalRevenue: 45600, // in cents
    monthlyGrowth: 23.5,
  },
  leaderboards: {
    topBuilders: [
      {
        id: '1',
        name: 'John Builder',
        email: 'john@example.com',
        appsCount: 12,
        revenue: 8900,
        users: 45,
      },
      {
        id: '2',
        name: 'Sarah Developer',
        email: 'sarah@example.com',
        appsCount: 8,
        revenue: 6700,
        users: 32,
      },
      {
        id: '3',
        name: 'Mike Creator',
        email: 'mike@example.com',
        appsCount: 6,
        revenue: 5400,
        users: 28,
      },
    ],
    topApps: [
      {
        id: '1',
        name: 'Restaurant POS System',
        builder: 'John Builder',
        revenue: 3200,
        users: 23,
        rating: 4.8,
      },
      {
        id: '2',
        name: 'E-commerce Analytics',
        builder: 'Sarah Developer',
        revenue: 2800,
        users: 18,
        rating: 4.6,
      },
      {
        id: '3',
        name: 'Inventory Management',
        builder: 'Mike Creator',
        revenue: 2400,
        users: 15,
        rating: 4.7,
      },
    ],
    topMcpServers: [
      {
        name: 'Database Connector',
        usage: 89,
        builders: 45,
        status: 'active',
      },
      {
        name: 'API Gateway',
        usage: 67,
        builders: 32,
        status: 'active',
      },
      {
        name: 'Payment Processor',
        usage: 54,
        builders: 28,
        status: 'active',
      },
    ],
  },
  recentActivity: [
    {
      id: '1',
      type: 'new_app',
      message: 'New app "Restaurant POS" published by John Builder',
      timestamp: '2024-12-18T14:20:00Z',
      revenue: 400,
    },
    {
      id: '2',
      type: 'new_user',
      message: 'New end user "Pizza Palace" registered',
      timestamp: '2024-12-18T13:15:00Z',
    },
    {
      id: '3',
      type: 'revenue',
      message: 'Revenue milestone: $45,000 total platform revenue',
      timestamp: '2024-12-18T12:30:00Z',
      revenue: 45000,
    },
  ],
};

export default function Dashboard() {
  const { user } = useAuth();
  const persona = user?.persona;
  const [, setLocation] = useLocation();

  // If not Super Admin, show regular dashboard
  if (persona !== 'super_admin') {
    return <RegularDashboard />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSuperAdminData.platformMetrics.totalApps}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockSuperAdminData.platformMetrics.monthlyGrowth}%</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Builders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSuperAdminData.platformMetrics.totalBuilders}</div>
            <p className="text-xs text-muted-foreground">
              Active app creators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSuperAdminData.platformMetrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              End users implementing apps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockSuperAdminData.platformMetrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Platform-wide earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Builders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Builders
            </CardTitle>
            <CardDescription>Builders with most apps and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSuperAdminData.leaderboards.topBuilders.map((builder, index) => (
                <div key={builder.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{builder.name}</p>
                      <p className="text-sm text-muted-foreground">{builder.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{builder.appsCount} apps</p>
                    <p className="text-sm text-green-600">{formatCurrency(builder.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Apps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Top Apps
            </CardTitle>
            <CardDescription>Most successful applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSuperAdminData.leaderboards.topApps.map((app, index) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-sm text-muted-foreground">by {app.builder}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(app.revenue)}</p>
                    <p className="text-sm text-muted-foreground">{app.users} users</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top MCP Servers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-green-500" />
              Top MCP Servers
            </CardTitle>
            <CardDescription>Most used MCP servers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSuperAdminData.leaderboards.topMcpServers.map((server, index) => (
                <div key={server.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{server.name}</p>
                      <p className="text-sm text-muted-foreground">{server.builders} builders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{server.usage} uses</p>
                    <Badge variant="outline" className="text-xs">
                      {server.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
            {mockSuperAdminData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    {activity.type === 'new_app' && <Smartphone className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'new_user' && <Users className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'revenue' && <DollarSign className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.message}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
                {activity.revenue && (
                  <div className="text-right">
                    <p className="font-medium text-green-600">{formatCurrency(activity.revenue)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
