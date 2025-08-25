import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Activity,
  Eye,
  Download,
  Star
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

// Mock data for builder dashboard
const mockBuilderData = {
  overview: {
    totalProjects: 15,
    publishedProjects: 8,
    totalImplementations: 45,
    activeImplementations: 38,
    totalRevenue: 12500,
    monthlyRevenue: 3200,
    monthlyGrowth: 15.5,
    totalCustomers: 23,
    newCustomersThisMonth: 5,
  },
  recentProjects: [
    {
      id: '1',
      name: 'Restaurant POS System',
      status: 'published',
      implementations: 12,
      revenue: 4800,
      createdAt: '2024-12-15T10:30:00Z',
      rating: 4.8,
      downloads: 45,
    },
    {
      id: '2',
      name: 'E-commerce Analytics Dashboard',
      status: 'development',
      implementations: 0,
      revenue: 0,
      createdAt: '2024-12-18T14:20:00Z',
      rating: 0,
      downloads: 0,
    },
    {
      id: '3',
      name: 'Inventory Management System',
      status: 'published',
      implementations: 8,
      revenue: 3200,
      createdAt: '2024-12-10T09:15:00Z',
      rating: 4.6,
      downloads: 32,
    },
  ],
  recentImplementations: [
    {
      id: '1',
      projectName: 'Restaurant POS System',
      endUserName: 'Pizza Palace',
      implementationUrl: 'https://pizzapalace.com',
      status: 'active',
      revenue: 400,
      createdAt: '2024-12-18T14:20:00Z',
      usageCount: 1250,
    },
    {
      id: '2',
      projectName: 'Restaurant POS System',
      endUserName: 'Burger Joint',
      implementationUrl: 'https://burgerjoint.com',
      status: 'active',
      revenue: 400,
      createdAt: '2024-12-17T11:30:00Z',
      usageCount: 890,
    },
    {
      id: '3',
      projectName: 'Inventory Management System',
      endUserName: 'Tech Store',
      implementationUrl: 'https://techstore.com',
      status: 'active',
      revenue: 300,
      createdAt: '2024-12-16T16:45:00Z',
      usageCount: 567,
    },
  ],
  revenue: {
    current: 12500,
    previous: 10800,
    growth: 15.5,
    trend: [
      { date: '2024-12-01', revenue: 400, implementations: 3 },
      { date: '2024-12-02', revenue: 450, implementations: 4 },
      { date: '2024-12-03', revenue: 380, implementations: 2 },
      { date: '2024-12-04', revenue: 520, implementations: 5 },
      { date: '2024-12-05', revenue: 480, implementations: 4 },
      { date: '2024-12-06', revenue: 600, implementations: 6 },
      { date: '2024-12-07', revenue: 550, implementations: 5 },
    ],
  },
  customers: [
    {
      id: '1',
      name: 'Pizza Palace',
      email: 'contact@pizzapalace.com',
      implementations: 2,
      totalSpent: 800,
      lastActivity: '2024-12-18T14:20:00Z',
      status: 'active',
    },
    {
      id: '2',
      name: 'Burger Joint',
      email: 'info@burgerjoint.com',
      implementations: 1,
      totalSpent: 400,
      lastActivity: '2024-12-17T11:30:00Z',
      status: 'active',
    },
    {
      id: '3',
      name: 'Tech Store',
      email: 'sales@techstore.com',
      implementations: 1,
      totalSpent: 300,
      lastActivity: '2024-12-16T16:45:00Z',
      status: 'active',
    },
  ],
};

const BuilderDashboard: React.FC = () => {
  const { user } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Builder Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's your project and revenue overview.
          </p>
        </div>
        <Button>
          <Package className="w-4 h-4 mr-2" />
          Create New Project
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockBuilderData.overview.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockBuilderData.overview.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBuilderData.overview.publishedProjects}</div>
            <p className="text-xs text-muted-foreground">
              {mockBuilderData.overview.totalProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implementations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBuilderData.overview.activeImplementations}</div>
            <p className="text-xs text-muted-foreground">
              {mockBuilderData.overview.totalImplementations} total implementations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBuilderData.overview.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +{mockBuilderData.overview.newCustomersThisMonth} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="implementations">Implementations</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockBuilderData.revenue.trend.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {formatCurrency(item.revenue)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.implementations} implementations
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest implementations and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockBuilderData.recentImplementations.slice(0, 5).map((impl) => (
                    <div key={impl.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{impl.projectName}</p>
                        <p className="text-xs text-muted-foreground">
                          {impl.endUserName} • {formatDate(impl.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(impl.revenue)}</p>
                        <p className="text-xs text-muted-foreground">
                          {impl.usageCount} uses
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>Manage and track your project portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBuilderData.recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {project.rating}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Download className="w-3 h-3" />
                            {project.downloads}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(project.revenue)}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.implementations} implementations
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Widget Implementations</CardTitle>
              <CardDescription>Track who's using your widgets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBuilderData.recentImplementations.map((impl) => (
                  <div key={impl.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Eye className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{impl.projectName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {impl.endUserName} • {impl.implementationUrl}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(impl.revenue)}</p>
                      <p className="text-sm text-muted-foreground">
                        {impl.usageCount} uses • {formatDate(impl.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Customers</CardTitle>
              <CardDescription>Manage customer relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBuilderData.customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(customer.totalSpent)}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.implementations} implementations • {formatDate(customer.lastActivity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BuilderDashboard;
