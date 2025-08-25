import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiCall } from "@/lib/auth";
import { type User } from "@shared/schema";
import {
  Users,
  FolderOpen,
  DollarSign,
  Activity,
  Wifi,
  AlertTriangle,
  TrendingUp,
  Database,
  Search,
  Edit2,
  Trash2,
  MoreHorizontal,
  UserCheck,
  UserX,
  Package,
  Eye,
  Play,
  Pause,
  Crown,
  Calendar,
  BarChart3,
  Settings,
  Shield
} from "lucide-react";

// Mock data for user management details
const mockUserDetails = {
  "user-2": {
    id: "user-2",
    name: "John Smith",
    email: "john@example.com",
    username: "john_dev",
    plan: "Professional",
    persona: "builder",
    status: "active",
    joinedDate: "2024-12-15T10:30:00Z",
    lastActive: "2024-12-18T14:20:00Z",
    apps: [
      {
        id: "app-1",
        name: "Restaurant POS System",
        status: "published",
        revenue: 3200,
        implementations: 12,
        createdAt: "2024-12-10T09:15:00Z",
      },
      {
        id: "app-2",
        name: "Inventory Management",
        status: "development",
        revenue: 0,
        implementations: 0,
        createdAt: "2024-12-18T11:30:00Z",
      },
      {
        id: "app-3",
        name: "E-commerce Analytics",
        status: "published",
        revenue: 1800,
        implementations: 8,
        createdAt: "2024-12-05T16:45:00Z",
      },
    ],
    endUsers: [
      {
        id: "eu-1",
        name: "Pizza Palace",
        email: "contact@pizzapalace.com",
        implementations: 2,
        totalSpent: 800,
        lastActivity: "2024-12-18T14:20:00Z",
      },
      {
        id: "eu-2",
        name: "Burger Joint",
        email: "info@burgerjoint.com",
        implementations: 1,
        totalSpent: 400,
        lastActivity: "2024-12-17T11:30:00Z",
      },
    ],
    revenue: {
      total: 5000,
      monthly: 1200,
      growth: 15.5,
    },
  },
  "user-3": {
    id: "user-3",
    name: "Alice Cooper",
    email: "alice@company.com",
    username: "alice_coder",
    plan: "Professional",
    persona: "builder",
    status: "active",
    joinedDate: "2024-12-14T14:20:00Z",
    lastActive: "2024-12-18T12:15:00Z",
    apps: [
      {
        id: "app-4",
        name: "Blog Platform",
        status: "published",
        revenue: 2900,
        implementations: 18,
        createdAt: "2024-12-08T10:30:00Z",
      },
    ],
    endUsers: [
      {
        id: "eu-3",
        name: "Tech Blog",
        email: "editor@techblog.com",
        implementations: 1,
        totalSpent: 300,
        lastActivity: "2024-12-16T09:45:00Z",
      },
    ],
    revenue: {
      total: 2900,
      monthly: 2900,
      growth: 8.2,
    },
  },
  "user-4": {
    id: "user-4",
    name: "Mike Wilson",
    email: "mike@startup.io",
    username: "mike_startup",
    plan: "Enterprise",
    persona: "super_admin",
    status: "active",
    joinedDate: "2024-12-13T11:15:00Z",
    lastActive: "2024-12-18T15:30:00Z",
    apps: [],
    endUsers: [],
    revenue: {
      total: 0,
      monthly: 0,
      growth: 0,
    },
  },
};

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debug logging
  console.log('Admin page loaded');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<Record<string, 'active' | 'suspended'>>({
    "user-2": "active",
    "user-3": "active",
    "user-4": "active",
  });

  const platformStats = {
    totalUsers: 127,
    activeProjects: 89,
    revenue: 12450,
    monthlyGrowth: 23.5,
  };

  const systemHealth = {
    serverUptime: 99.9,
    activeConnections: 245,
    pendingReviews: 3,
    databaseHealth: "Excellent",
  };

  // Fetch all users for admin panel
  const { data: usersData, error: usersError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      console.log('Fetching admin users...');
      const result = await apiCall('/admin/users');
      console.log('Admin users API response:', result);
      return result;
    },
  });

  const users = usersData?.data?.users || [];
  console.log('Admin users data:', users);
  console.log('Admin users error:', usersError);

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      return apiCall(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user information.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiCall(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "User Deleted",
        description: "User has been removed from the platform.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search and plan
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === "all" || user.plan.toLowerCase() === selectedPlan.toLowerCase();
    return matchesSearch && matchesPlan;
  });

  const handlePlanChange = (userId: string, newPlan: string) => {
    updateUserMutation.mutate({ userId, updates: { plan: newPlan } });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleStatusToggle = (userId: string) => {
    const newStatus = userStatus[userId] === 'active' ? 'suspended' : 'active';
    setUserStatus(prev => ({
      ...prev,
      [userId]: newStatus
    }));

    toast({
      title: `User ${newStatus === 'active' ? 'Activated' : 'Suspended'}`,
      description: `User has been ${newStatus === 'active' ? 'activated' : 'suspended'} successfully.`,
    });
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      case "professional":
        return "bg-blue-100 text-blue-800";
      case "free":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'suspended') {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <Pause className="w-3 h-3" />
        Suspended
      </Badge>;
    }
    return <Badge variant="default" className="flex items-center gap-1">
      <Play className="w-3 h-3" />
      Active
    </Badge>;
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Statistics */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="mr-3 text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Platform Stats</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Total Users</span>
                </div>
                <span className="text-2xl font-bold text-gray-900" data-testid="stat-total-users">
                  {platformStats.totalUsers}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FolderOpen size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Active Projects</span>
                </div>
                <span className="text-2xl font-bold text-gray-900" data-testid="stat-active-projects">
                  {platformStats.activeProjects}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Monthly Revenue</span>
                </div>
                <span className="text-2xl font-bold text-green-600" data-testid="stat-revenue">
                  ${platformStats.revenue.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Growth Rate</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-green-600">
                    +{platformStats.monthlyGrowth}%
                  </span>
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    This Month
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Activity className="mr-3 text-green-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wifi size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Server Uptime</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-green-600">
                    {systemHealth.serverUptime}%
                  </span>
                  <span className="ml-2 text-green-600">🟢</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Active Connections</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {systemHealth.activeConnections}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Pending Reviews</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-orange-600">
                    {systemHealth.pendingReviews}
                  </span>
                  <span className="ml-2 text-orange-600">⚠️</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database size={20} className="mr-3 text-gray-400" />
                  <span className="text-gray-600">Database Health</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {systemHealth.databaseHealth}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm || selectedPlan !== "all" ? "No users found matching the criteria" : "No users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.plan}
                          onValueChange={(value) => handlePlanChange(user.id, value)}
                          disabled={updateUserMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>
                              <Badge className={getPlanBadgeColor(user.plan)}>
                                {user.plan}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Free">Free</SelectItem>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(userStatus[user.id] || 'active')}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user.id)}
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                <Edit2 size={14} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <UserCheck className="w-5 h-5" />
                                  User Management: {user.name}
                                </DialogTitle>
                                <DialogDescription>
                                  Comprehensive user details, apps, end users, and management actions
                                </DialogDescription>
                              </DialogHeader>

                              {selectedUser && mockUserDetails[selectedUser] && (
                                <Tabs defaultValue="overview" className="w-full">
                                  <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="apps">Apps</TabsTrigger>
                                    <TabsTrigger value="endUsers">End Users</TabsTrigger>
                                    <TabsTrigger value="actions">Actions</TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="overview" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <UserCheck className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium">User Info:</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-6">
                                          {mockUserDetails[selectedUser].name} ({mockUserDetails[selectedUser].email})
                                        </p>
                                        <p className="text-sm text-muted-foreground ml-6">
                                          Username: @{mockUserDetails[selectedUser].username}
                                        </p>
                                        <p className="text-sm text-muted-foreground ml-6">
                                          Persona: {mockUserDetails[selectedUser].persona}
                                        </p>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium">Activity:</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground ml-6">
                                          Joined: {formatDate(mockUserDetails[selectedUser].joinedDate)}
                                        </p>
                                        <p className="text-sm text-muted-foreground ml-6">
                                          Last Active: {formatDate(mockUserDetails[selectedUser].lastActive)}
                                        </p>
                                      </div>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-3 gap-4">
                                      <Card>
                                        <CardHeader className="pb-2">
                                          <CardTitle className="text-sm">Total Apps</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="text-2xl font-bold">
                                            {mockUserDetails[selectedUser].apps.length}
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            Published apps
                                          </p>
                                        </CardContent>
                                      </Card>

                                      <Card>
                                        <CardHeader className="pb-2">
                                          <CardTitle className="text-sm">End Users</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="text-2xl font-bold">
                                            {mockUserDetails[selectedUser].endUsers.length}
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            Active customers
                                          </p>
                                        </CardContent>
                                      </Card>

                                      <Card>
                                        <CardHeader className="pb-2">
                                          <CardTitle className="text-sm">Total Revenue</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="text-2xl font-bold">
                                            {formatCurrency(mockUserDetails[selectedUser].revenue.total)}
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            +{mockUserDetails[selectedUser].revenue.growth}% growth
                                          </p>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="apps" className="space-y-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">User's Applications:</span>
                                      </div>
                                      <div className="space-y-2">
                                        {mockUserDetails[selectedUser].apps.length === 0 ? (
                                          <p className="text-sm text-muted-foreground">No apps created yet.</p>
                                        ) : (
                                          mockUserDetails[selectedUser].apps.map((app) => (
                                            <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                                              <div className="flex items-center gap-3">
                                                <Package className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                  <p className="font-medium">{app.name}</p>
                                                  <p className="text-sm text-muted-foreground">
                                                    Created: {formatDate(app.createdAt)}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <Badge variant={app.status === 'published' ? 'default' : 'secondary'}>
                                                  {app.status}
                                                </Badge>
                                                <p className="text-sm font-medium mt-1">
                                                  {formatCurrency(app.revenue)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {app.implementations} implementations
                                                </p>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="endUsers" className="space-y-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">End Users:</span>
                                      </div>
                                      <div className="space-y-2">
                                        {mockUserDetails[selectedUser].endUsers.length === 0 ? (
                                          <p className="text-sm text-muted-foreground">No end users yet.</p>
                                        ) : (
                                          mockUserDetails[selectedUser].endUsers.map((endUser) => (
                                            <div key={endUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                                              <div className="flex items-center gap-3">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                  <p className="font-medium">{endUser.name}</p>
                                                  <p className="text-sm text-muted-foreground">{endUser.email}</p>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-sm font-medium">
                                                  {formatCurrency(endUser.totalSpent)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {endUser.implementations} implementations
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  Last: {formatDate(endUser.lastActivity)}
                                                </p>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="actions" className="space-y-4">
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                          <h4 className="font-medium">User Status</h4>
                                          <p className="text-sm text-muted-foreground">
                                            Control user access to the platform
                                          </p>
                                        </div>
                                        <Button
                                          variant={userStatus[selectedUser] === 'active' ? 'destructive' : 'default'}
                                          onClick={() => handleStatusToggle(selectedUser)}
                                        >
                                          {userStatus[selectedUser] === 'active' ? (
                                            <>
                                              <Pause className="w-4 h-4 mr-2" />
                                              Suspend User
                                            </>
                                          ) : (
                                            <>
                                              <Play className="w-4 h-4 mr-2" />
                                              Activate User
                                            </>
                                          )}
                                        </Button>
                                      </div>

                                      <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                          <h4 className="font-medium">Subscription Plan</h4>
                                          <p className="text-sm text-muted-foreground">
                                            Change user's subscription level
                                          </p>
                                        </div>
                                        <Select
                                          value={mockUserDetails[selectedUser].plan}
                                          onValueChange={(value) => handlePlanChange(selectedUser, value)}
                                        >
                                          <SelectTrigger className="w-40">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Free">Free</SelectItem>
                                            <SelectItem value="Professional">Professional</SelectItem>
                                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                          <h4 className="font-medium">Delete User</h4>
                                          <p className="text-sm text-muted-foreground">
                                            Permanently remove user from platform
                                          </p>
                                        </div>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleDeleteUser(selectedUser)}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete User
                                        </Button>
                                      </div>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteUserMutation.isPending || user.id === "demo-user-id"}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <p>Showing {filteredUsers.length} of {users.length} users</p>
              <div className="flex items-center space-x-4">
                <span>Total Active: {users.filter(u => u.plan !== "Free").length}</span>
                <span>Free Users: {users.filter(u => u.plan === "Free").length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>

          <div className="space-y-3">
            {[
              {
                time: "2 minutes ago",
                action: "New user registration",
                details: "sarah.wilson@example.com joined the platform",
                type: "user",
              },
              {
                time: "15 minutes ago",
                action: "Project deployed to marketplace",
                details: "Restaurant POS System by john.doe",
                type: "deployment",
              },
              {
                time: "1 hour ago",
                action: "MCP server connected",
                details: "Payment Gateway server established connection",
                type: "server",
              },
              {
                time: "3 hours ago",
                action: "Subscription upgrade",
                details: "User upgraded to Professional plan",
                type: "billing",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === "user" ? "bg-blue-500" :
                  activity.type === "deployment" ? "bg-green-500" :
                    activity.type === "server" ? "bg-purple-500" :
                      "bg-orange-500"
                  }`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
