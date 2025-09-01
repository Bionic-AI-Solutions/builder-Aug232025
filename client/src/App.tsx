import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";

import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import BuilderDashboard from "@/pages/builder-dashboard";
import EndUserDashboard from "@/pages/end-user-dashboard";
import WidgetImplementation from "@/pages/widget-implementation";
import ChatDevelopment from "@/pages/chat-development";
import Projects from "@/pages/projects";
import MCPServers from "@/pages/mcp-servers";
import Marketplace from "@/pages/marketplace";
import Analytics from "@/pages/analytics";
import Billing from "@/pages/billing";
import Admin from "@/pages/admin";
import LLMs from "@/pages/llms";
import Profile from "@/pages/profile";
import Credentials from "@/pages/credentials";
import MainLayout from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function PersonaRoute({
  component: Component,
  allowedPersonas
}: {
  component: React.ComponentType;
  allowedPersonas: string[];
}) {
  const { isAuthenticated, user } = useAuth();
  const persona = user?.persona;

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!allowedPersonas.includes(persona || '')) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  const persona = user?.persona;

  switch (persona) {
    case 'builder':
      return <BuilderDashboard />;
    case 'end_user':
      return <EndUserDashboard />;
    case 'super_admin':
      return <Dashboard />;
    default:
      return <Dashboard />;
  }
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/" component={() => isAuthenticated ? <ProtectedRoute component={DashboardRouter} /> : <LoginPage />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardRouter} />} />

      {/* Persona-specific routes */}
      <Route path="/end-user-dashboard" component={() => <PersonaRoute component={EndUserDashboard} allowedPersonas={['end_user']} />} />
      <Route path="/widget/:widgetId" component={() => <PersonaRoute component={WidgetImplementation} allowedPersonas={['end_user']} />} />

      {/* Builder-specific routes */}
      <Route path="/chat" component={() => <PersonaRoute component={ChatDevelopment} allowedPersonas={['builder']} />} />
      <Route path="/projects" component={() => <PersonaRoute component={Projects} allowedPersonas={['builder']} />} />

      {/* Shared routes */}
      <Route path="/servers" component={() => <ProtectedRoute component={MCPServers} />} />
      <Route path="/marketplace" component={() => <ProtectedRoute component={Marketplace} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/billing" component={() => <ProtectedRoute component={Billing} />} />

      {/* Admin routes */}
      <Route path="/admin" component={() => <PersonaRoute component={Admin} allowedPersonas={['super_admin']} />} />
      <Route path="/mcp-servers" component={() => <PersonaRoute component={MCPServers} allowedPersonas={['super_admin']} />} />
      <Route path="/llms" component={() => <PersonaRoute component={LLMs} allowedPersonas={['super_admin']} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      
      {/* Credentials route - available to builders and admins */}
      <Route path="/credentials" component={() => <PersonaRoute component={Credentials} allowedPersonas={['builder', 'super_admin']} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { initializeAuth } = useAuth();

  // Initialize auth state on app start
  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
