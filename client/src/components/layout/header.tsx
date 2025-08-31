import { Bell, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      "/llms": "LLM Configurations",
      "/mcp-servers": "MCP Servers",
    };
    return titles[path] || "Dashboard";
  };

  const handleLogout = () => {
    console.log("Logout clicked");
    logout();
    setLocation("/");
  };

  const handleProfile = () => {
    console.log("Profile clicked");
    setLocation("/profile");
  };

  const handleDropdownChange = (open: boolean) => {
    console.log("Dropdown state changed:", open);
    setIsDropdownOpen(open);
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getPersonaDisplayName = () => {
    switch (user?.persona) {
      case 'super_admin':
        return 'Super Admin';
      case 'builder':
        return 'Builder';
      case 'end_user':
        return 'End User';
      default:
        return 'User';
    }
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

          {/* User Avatar Dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-full"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getUserInitials()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900" data-testid="text-user-name">
                    {user?.name || user?.email || "User"}
                  </p>
                  <p className="text-xs text-gray-500" data-testid="text-user-persona">
                    {getPersonaDisplayName()}
                  </p>
                </div>
                <ChevronDown size={16} className="text-gray-500 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-50">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || user?.email}</p>
                  <p className="text-xs text-gray-500">{getPersonaDisplayName()}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                <User size={16} className="mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings size={16} className="mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 hover:text-red-700">
                <LogOut size={16} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fallback Simple Logout Button (for mobile or if dropdown fails) */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2 sm:hidden"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
