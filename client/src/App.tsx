import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";

import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ChatDevelopment from "@/pages/chat-development";
import Projects from "@/pages/projects";
import MCPServers from "@/pages/mcp-servers";
import Marketplace from "@/pages/marketplace";
import Analytics from "@/pages/analytics";
import Billing from "@/pages/billing";
import Admin from "@/pages/admin";
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

function Router() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={() => isAuthenticated ? <ProtectedRoute component={Dashboard} /> : <LoginPage />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/chat" component={() => <ProtectedRoute component={ChatDevelopment} />} />
      <Route path="/projects" component={() => <ProtectedRoute component={Projects} />} />
      <Route path="/servers" component={() => <ProtectedRoute component={MCPServers} />} />
      <Route path="/marketplace" component={() => <ProtectedRoute component={Marketplace} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/billing" component={() => <ProtectedRoute component={Billing} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
