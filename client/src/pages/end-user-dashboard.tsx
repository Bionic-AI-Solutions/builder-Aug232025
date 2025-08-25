import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Activity, 
  DollarSign, 
  Settings,
  Eye,
  Download,
  Star,
  CreditCard,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

// Mock data for end-user dashboard
const mockEndUserData = {
  overview: {
    totalWidgets: 8,
    activeWidgets: 7,
    totalSpent: 2400,
    monthlySpent: 400,
    monthlyGrowth: -5.2,
    totalUsage: 15420,
    monthlyUsage: 2340,
  },
  widgets: [
    {
      id: '1',
      name: 'Restaurant POS System',
      builder: 'John Doe',
      status: 'active',
      price: 400,
      usageCount: 1250,
      lastUsed: '2024-12-18T14:20:00Z',
      implementationUrl: 'https://myrestaurant.com',
      rating: 4.8,
      category: 'Business',
    },
    {
      id: '2',
      name: 'Inventory Management',
      builder: 'Jane Smith',
      status: 'active',
      price: 300,
      usageCount: 890,
      lastUsed: '2024-12-17T11:30:00Z',
      implementationUrl: 'https://myrestaurant.com/inventory',
      rating: 4.6,
      category: 'Business',
    },
    {
      id: '3',
      name: 'Analytics Dashboard',
      builder: 'Mike Johnson',
      status: 'inactive',
      price: 200,
      usageCount: 0,
      lastUsed: '2024-12-10T09:15:00Z',
      implementationUrl: 'https://myrestaurant.com/analytics',
      rating: 4.2,
      category: 'Analytics',
    },
  ],
  usage: {
    current: 2340,
    previous: 2100,
    growth: 11.4,
    trend: [
      { date: '2024-12-01', usage: 120, widgets: 3 },
      { date: '2024-12-02', usage: 145, widgets: 3 },
      { date: '2024-12-03', usage: 98, widgets: 2 },
      { date: '2024-12-04', usage: 167, widgets: 4 },
      { date: '2024-12-05', usage: 134, widgets: 3 },
      { date: '2024-12-06', usage: 189, widgets: 4 },
      { date: '2024-12-07', usage: 156, widgets: 3 },
    ],
  },
  billing: {
    currentMonth: 400,
    previousMonth: 420,
    nextDue: '2024-01-15',
    invoices: [
      {
        id: '1',
        amount: 400,
        status: 'paid',
        date: '2024-12-15',
        description: 'December 2024 Widget Usage',
      },
      {
        id: '2',
        amount: 420,
        status: 'paid',
        date: '2024-11-15',
        description: 'November 2024 Widget Usage',
      },
      {
        id: '3',
        amount: 380,
        status: 'paid',
        date: '2024-10-15',
        description: 'October 2024 Widget Usage',
      },
    ],
  },
  support: [
    {
      id: '1',
      title: 'POS System Integration Issue',
      status: 'open',
      priority: 'high',
      createdAt: '2024-12-18T10:30:00Z',
      lastUpdated: '2024-12-18T14:20:00Z',
    },
    {
      id: '2',
      title: 'Analytics Dashboard Setup',
      status: 'resolved',
      priority: 'medium',
      createdAt: '2024-12-15T09:15:00Z',
      lastUpdated: '2024-12-16T16:45:00Z',
    },
  ],
};

const EndUserDashboard: React.FC = () => {
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
          <h1 className="text-3xl font-bold">End User Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Manage your widgets and track usage.
          </p>
        </div>
        <Button>
          <Package className="w-4 h-4 mr-2" />
          Browse Widgets
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Widgets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEndUserData.overview.activeWidgets}</div>
            <p className="text-xs text-muted-foreground">
              {mockEndUserData.overview.totalWidgets} total widgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEndUserData.overview.monthlyUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockEndUserData.usage.growth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockEndUserData.overview.monthlySpent)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">{mockEndUserData.overview.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEndUserData.overview.totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time widget interactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="widgets">My Widgets</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Trend</CardTitle>
                <CardDescription>Daily widget usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEndUserData.usage.trend.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {item.usage} interactions
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.widgets} widgets
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
                <CardDescription>Latest widget usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEndUserData.widgets.slice(0, 5).map((widget) => (
                    <div key={widget.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{widget.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {widget.builder} • {formatDate(widget.lastUsed)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{widget.usageCount} uses</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(widget.price)}/month
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="widgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Widgets</CardTitle>
              <CardDescription>Manage your implemented widgets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEndUserData.widgets.map((widget) => (
                  <div key={widget.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{widget.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={widget.status === 'active' ? 'default' : 'secondary'}>
                            {widget.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {widget.rating}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            by {widget.builder}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(widget.price)}/month</p>
                        <p className="text-sm text-muted-foreground">
                          {widget.usageCount} uses
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Billing Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Overview</CardTitle>
                <CardDescription>Current month and payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Month</span>
                  <span className="text-lg font-bold">{formatCurrency(mockEndUserData.billing.currentMonth)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Previous Month</span>
                  <span className="text-sm text-muted-foreground">{formatCurrency(mockEndUserData.billing.previousMonth)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Due</span>
                  <span className="text-sm text-muted-foreground">{formatDate(mockEndUserData.billing.nextDue)}</span>
                </div>
                <Button className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Payment Methods
                </Button>
              </CardContent>
            </Card>

            {/* Invoice History */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice History</CardTitle>
                <CardDescription>Recent billing statements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEndUserData.billing.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{invoice.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(invoice.amount)}</p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Get help with your widgets</CardDescription>
                </div>
                <Button>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEndUserData.support.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <HelpCircle className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{ticket.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={ticket.status === 'open' ? 'destructive' : 'default'}>
                            {ticket.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(ticket.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDate(ticket.lastUpdated)}
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

export default EndUserDashboard;
