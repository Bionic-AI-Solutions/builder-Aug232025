import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

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

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      return user.email.split('@')[0]; // Get username part before @
    }
    return 'User';
  };

  const getUserPlan = () => {
    if (user?.persona) {
      const planMap: Record<string, string> = {
        'super_admin': 'Super Admin',
        'builder': 'Professional',
        'end_user': 'Basic'
      };
      return planMap[user.persona] || user.persona;
    }
    return 'Basic';
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

          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-700">
              {getUserDisplayName()}
            </span>
            <span className="text-xs text-gray-500">
              {getUserPlan()}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">{getUserDisplayName()}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
