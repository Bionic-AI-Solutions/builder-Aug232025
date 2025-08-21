import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { DollarSign, TrendingUp, Users, Server, Activity, Eye, MessageSquare, Download } from "lucide-react";

// Dummy data for analytics
const revenueData = [
  { month: "Jul", revenue: 2400, growth: 12 },
  { month: "Aug", revenue: 2800, growth: 16.7 },
  { month: "Sep", revenue: 3200, growth: 14.3 },
  { month: "Oct", revenue: 3800, growth: 18.8 },
  { month: "Nov", revenue: 4200, growth: 10.5 },
  { month: "Dec", revenue: 4950, growth: 17.9 },
];

const userEngagementData = [
  { day: "Mon", activeUsers: 245, sessions: 890, pageViews: 2340 },
  { day: "Tue", activeUsers: 289, sessions: 980, pageViews: 2680 },
  { day: "Wed", activeUsers: 356, sessions: 1120, pageViews: 3120 },
  { day: "Thu", activeUsers: 298, sessions: 1050, pageViews: 2890 },
  { day: "Fri", activeUsers: 412, sessions: 1340, pageViews: 3560 },
  { day: "Sat", activeUsers: 378, sessions: 1200, pageViews: 3200 },
  { day: "Sun", activeUsers: 320, sessions: 980, pageViews: 2750 },
];

const serverMetricsData = [
  { time: "00:00", latency: 32, uptime: 99.9, connections: 145 },
  { time: "04:00", latency: 28, uptime: 99.8, connections: 120 },
  { time: "08:00", latency: 45, uptime: 99.9, connections: 280 },
  { time: "12:00", latency: 52, uptime: 99.7, connections: 340 },
  { time: "16:00", latency: 38, uptime: 99.9, connections: 295 },
  { time: "20:00", latency: 42, uptime: 99.8, connections: 220 },
];

const appPerformanceData = [
  { app: "Restaurant App", downloads: 1240, ratings: 4.8, revenue: 4500 },
  { app: "E-commerce Store", downloads: 890, ratings: 4.6, revenue: 7250 },
  { app: "Blog Platform", downloads: 2100, ratings: 4.9, revenue: 3200 },
  { app: "Fitness Tracker", downloads: 750, ratings: 4.7, revenue: 0 },
  { app: "Task Manager", downloads: 620, ratings: 4.5, revenue: 0 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="text-sm text-gray-500">
          Real-time data • Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$149.50</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp size={14} className="mr-1" />
                  +17.9% this month
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="text-green-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Users size={14} className="mr-1" />
                  +8.3% from last week
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="text-blue-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Server Uptime</p>
                <p className="text-2xl font-bold text-gray-900">99.8%</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <Activity size={14} className="mr-1" />
                  Excellent performance
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Server className="text-purple-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">App Downloads</p>
                <p className="text-2xl font-bold text-gray-900">5,600</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Download size={14} className="mr-1" />
                  +24.1% growth
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Download className="text-orange-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign size={20} className="mr-2 text-green-600" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${(value as number / 100).toFixed(2)}` : `${value}%`,
                    name === 'revenue' ? 'Revenue' : 'Growth'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users size={20} className="mr-2 text-blue-600" />
              User Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userEngagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Active Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Server Performance */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server size={20} className="mr-2 text-purple-600" />
              Server Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={serverMetricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    name === 'latency' ? `${value}ms` : 
                    name === 'uptime' ? `${value}%` : value,
                    name === 'latency' ? 'Latency' : 
                    name === 'uptime' ? 'Uptime' : 'Connections'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  name="Latency (ms)"
                />
                <Line 
                  type="monotone" 
                  dataKey="connections" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  name="Active Connections"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* App Performance Summary */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity size={20} className="mr-2 text-orange-600" />
              App Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appPerformanceData.map((app, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{app.app}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-600 flex items-center">
                        <Download size={12} className="mr-1" />
                        {app.downloads.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-600">
                        ⭐ {app.ratings}
                      </span>
                      {app.revenue > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          ${(app.revenue / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {app.revenue > 0 ? (
                      <span className="text-sm font-semibold text-green-600">
                        Published
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        In Development
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Insights */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <TrendingUp className="text-green-600" size={16} />
                </div>
                <div>
                  <p className="font-medium text-green-900">Revenue Growth</p>
                  <p className="text-sm text-green-700">Your published apps are generating steady revenue with 17.9% month-over-month growth.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <Eye className="text-blue-600" size={16} />
                </div>
                <div>
                  <p className="font-medium text-blue-900">User Engagement</p>
                  <p className="text-sm text-blue-700">High user engagement with average session duration of 8.5 minutes across all apps.</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <MessageSquare className="text-orange-600" size={16} />
                </div>
                <div>
                  <p className="font-medium text-orange-900">Optimization</p>
                  <p className="text-sm text-orange-700">Consider publishing your in-development apps to increase your revenue potential.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}