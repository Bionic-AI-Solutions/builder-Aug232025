import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user } = useAuth();

  const getPageTitle = () => {
    const path = window.location.pathname;
    const titles: Record<string, string> = {
      "/": "Dashboard",
      "/dashboard": "Dashboard",
      "/chat": "Chat Development",
      "/projects": "Projects",
      "/servers": "MCP Servers",
      "/marketplace": "Marketplace",
      "/analytics": "Analytics",
      "/billing": "Billing",
      "/admin": "Admin Panel",
    };
    return titles[path] || "Dashboard";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
          {getPageTitle()}
        </h1>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell size={20} className="text-gray-500" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900" data-testid="text-user-name">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500" data-testid="text-user-plan">
                {user?.plan || "Free Plan"}
              </p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
