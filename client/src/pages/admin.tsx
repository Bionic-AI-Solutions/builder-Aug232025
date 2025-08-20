import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FolderOpen, 
  DollarSign, 
  Activity, 
  Wifi, 
  AlertTriangle,
  TrendingUp,
  Database
} from "lucide-react";

export default function Admin() {
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
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === "user" ? "bg-blue-500" :
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
