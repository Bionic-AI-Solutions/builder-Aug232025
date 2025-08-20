import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { CreditCard, CheckCircle } from "lucide-react";

export default function Billing() {
  const { user } = useAuth();

  const usageData = {
    projects: { current: 3, limit: 25, percentage: 12 },
    mcpConnections: { current: 5, limit: Infinity, percentage: 5 },
    apiCalls: { current: 1200, limit: 10000, percentage: 12 },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="mr-3 text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{user?.plan || "Professional"}</h4>
                <p className="text-3xl font-bold text-blue-600">
                  $79<span className="text-lg text-gray-600">/month</span>
                </p>
                <p className="text-gray-600">Billed monthly</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-green-600">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="text-sm">25 Projects</span>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="text-sm">Unlimited MCP Connections</span>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="text-sm">10K API Calls/month</span>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="text-sm">Priority Support</span>
                </div>
              </div>

              <Button className="w-full" data-testid="button-change-plan">
                Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Usage */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Usage</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Projects</span>
                  <span className="text-gray-600">
                    {usageData.projects.current}/{usageData.projects.limit}
                  </span>
                </div>
                <Progress value={usageData.projects.percentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {usageData.projects.percentage}% of monthly limit
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">MCP Connections</span>
                  <span className="text-gray-600">
                    {usageData.mcpConnections.current}/∞
                  </span>
                </div>
                <Progress value={usageData.mcpConnections.percentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {usageData.mcpConnections.percentage}% capacity
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">API Calls</span>
                  <span className="text-gray-600">
                    {usageData.apiCalls.current.toLocaleString()}/{usageData.apiCalls.limit.toLocaleString()}
                  </span>
                </div>
                <Progress value={usageData.apiCalls.percentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {usageData.apiCalls.percentage}% of monthly limit
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Next billing date:</strong> January 15, 2025
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Your subscription will automatically renew.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
          
          <div className="space-y-3">
            {[
              { date: "Dec 15, 2024", amount: "$79.00", status: "Paid" },
              { date: "Nov 15, 2024", amount: "$79.00", status: "Paid" },
              { date: "Oct 15, 2024", amount: "$79.00", status: "Paid" },
            ].map((invoice, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{invoice.date}</p>
                  <p className="text-sm text-gray-600">Professional Plan</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{invoice.amount}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
