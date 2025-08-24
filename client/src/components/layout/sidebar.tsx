import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { PersonaSelector } from "@/components/ui/persona-selector";
import {
  BarChart3,
  MessageCircle,
  Folder,
  Server,
  Store,
  TrendingUp,
  CreditCard,
  Settings,
  Box,
  Package,
  Users,
  Crown,
  Brain
} from "lucide-react";

// Persona-specific navigation
const getNavigation = (persona: string) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, personas: ['super_admin', 'builder', 'end_user'] },
    { name: "Marketplace", href: "/marketplace", icon: Store, personas: ['super_admin', 'builder', 'end_user'] },
    { name: "Analytics", href: "/analytics", icon: TrendingUp, personas: ['super_admin', 'builder', 'end_user'] },
    { name: "Billing", href: "/billing", icon: CreditCard, personas: ['builder', 'end_user'] }, // Removed super_admin
  ];

  const builderNavigation = [
    { name: "Chat Development", href: "/chat", icon: MessageCircle, personas: ['builder'] },
    { name: "Projects", href: "/projects", icon: Folder, personas: ['builder'] },
  ];

  const endUserNavigation = [
    { name: "End User Dashboard", href: "/end-user-dashboard", icon: Package, personas: ['end_user'] },
    { name: "My Widgets", href: "/widgets", icon: Package, personas: ['end_user'] },
  ];

  const adminNavigation = [
    { name: "Admin", href: "/admin", icon: Settings, personas: ['super_admin'] },
    { name: "MCP Servers", href: "/mcp-servers", icon: Server, personas: ['super_admin'] },
    { name: "LLMs", href: "/llms", icon: Brain, personas: ['super_admin'] },
  ];

  const allNavigation = [
    ...baseNavigation,
    ...builderNavigation,
    ...endUserNavigation,
    ...adminNavigation,
  ];

  return allNavigation.filter(item => item.personas.includes(persona));
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const persona = user?.persona || 'builder';
  const navigation = getNavigation(persona);

  // Debug logging
  console.log('Sidebar - User:', user);
  console.log('Sidebar - Persona:', persona);

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="gradient-brand w-10 h-10 rounded-lg flex items-center justify-center">
            <Box size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg">MCP Builder</h1>
          </div>
        </div>
      </div>

      {/* Persona Selector */}
      <div className="p-4 border-b border-slate-700">
        <div className="text-xs font-medium text-slate-400 mb-2">Current Persona</div>
        <div className="flex items-center gap-2">
          {persona === 'super_admin' && <Crown className="w-4 h-4 text-yellow-400" />}
          {persona === 'builder' && <Package className="w-4 h-4 text-blue-400" />}
          {persona === 'end_user' && <Users className="w-4 h-4 text-green-400" />}
          <span className="text-sm font-medium capitalize">
            {persona?.replace('_', ' ') || 'Builder'}
          </span>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer",
                  isActive && "sidebar-active"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Persona Switcher */}
      <div className="absolute bottom-4 left-4 right-4">
        <details className="group">
          <summary className="flex items-center justify-between p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
            <span className="text-sm font-medium">Switch Persona</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-2 p-3 bg-slate-800 rounded-lg">
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/builder-dashboard'}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  Builder
                </div>
              </button>
              <button
                onClick={() => window.location.href = '/end-user-dashboard'}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  End User
                </div>
              </button>
              <button
                onClick={() => window.location.href = '/admin'}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  Super Admin
                </div>
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
