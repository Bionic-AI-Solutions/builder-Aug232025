import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { type Project } from "@shared/schema";
import { 
  Smartphone, 
  Users, 
  Network, 
  Store,
  Eye,
  MessageCircle
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch(`/api/projects?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["/api/mcp-servers"],
    queryFn: async () => {
      const response = await fetch(`/api/mcp-servers?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: marketplaceApps = [] } = useQuery({
    queryKey: ["/api/marketplace"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace");
      return response.json();
    },
  });

  const metrics = {
    totalApps: projects.length,
    activeProjects: projects.filter(p => p.status !== "completed").length,
    mcpConnections: servers.filter((s: any) => s.status === "connected").length,
    marketplaceApps: marketplaceApps.length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="status-completed">✅ Completed</Badge>;
      case "testing":
        return <Badge className="status-testing">🔄 Testing</Badge>;
      case "development":
        return <Badge className="status-development">🔄 Development</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Generated Apps</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="metric-total-apps">
                  {metrics.totalApps}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Smartphone className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="metric-active-projects">
                  {metrics.activeProjects}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">MCP Connections</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="metric-mcp-connections">
                  {metrics.mcpConnections}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Network className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Marketplace Apps</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="metric-marketplace-apps">
                  {metrics.marketplaceApps}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Store className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Projects</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No projects yet. Start building your first app!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 3).map((project) => (
                <Card key={project.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900" data-testid={`project-name-${project.id}`}>
                        {project.name}
                      </h3>
                      {getStatusBadge(project.status)}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        Generated: {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        LLM: {project.llm.charAt(0).toUpperCase() + project.llm.slice(1)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Files: {project.files?.length || 0} files
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" data-testid={`button-view-${project.id}`}>
                        <Eye size={16} className="mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-chat-${project.id}`}>
                        <MessageCircle size={16} className="mr-1" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
