import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type McpServer } from "@shared/schema";
import { 
  Plus, 
  Server, 
  Activity, 
  Settings, 
  Trash2, 
  RefreshCw,
  WifiOff,
  Wifi
} from "lucide-react";
import ServerConfigModal from "@/components/modals/server-config-modal";

export default function MCPServers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null);

  const { data: servers = [], isLoading } = useQuery<McpServer[]>({
    queryKey: ["/api/mcp-servers"],
    queryFn: async () => {
      const response = await fetch(`/api/mcp-servers?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const deleteServerMutation = useMutation({
    mutationFn: async (serverId: string) => {
      return apiRequest("DELETE", `/api/mcp-servers/${serverId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] });
      toast({
        title: "Server Deleted",
        description: "MCP server has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the server. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleConnectionMutation = useMutation({
    mutationFn: async ({ serverId, status }: { serverId: string; status: string }) => {
      const newStatus = status === "connected" ? "disconnected" : "connected";
      return apiRequest("PUT", `/api/mcp-servers/${serverId}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] });
    },
  });

  const handleAddServer = () => {
    setSelectedServer(null);
    setShowConfigModal(true);
  };

  const handleConfigureServer = (server: McpServer) => {
    setSelectedServer(server);
    setShowConfigModal(true);
  };

  const handleDeleteServer = async (serverId: string) => {
    if (confirm("Are you sure you want to delete this server?")) {
      await deleteServerMutation.mutateAsync(serverId);
    }
  };

  const handleToggleConnection = async (server: McpServer) => {
    await toggleConnectionMutation.mutateAsync({
      serverId: server.id,
      status: server.status,
    });
  };

  const getStatusIcon = (status: string) => {
    return status === "connected" ? (
      <Wifi size={16} className="text-green-500" />
    ) : (
      <WifiOff size={16} className="text-red-500" />
    );
  };

  const getStatusColor = (status: string) => {
    return status === "connected" ? "text-green-600" : "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">MCP Servers</h2>
        <Button onClick={handleAddServer} data-testid="button-add-server">
          <Plus size={16} className="mr-2" />
          Add New Server
        </Button>
      </div>

      {/* Servers Grid */}
      {servers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Server size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No MCP servers configured</h3>
            <p className="text-gray-600 mb-4">Add your first MCP server to start integrating external services.</p>
            <Button onClick={handleAddServer}>
              <Plus size={16} className="mr-2" />
              Add Server
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <Card key={server.id} className="hover:shadow-md transition-shadow border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900" data-testid={`server-name-${server.id}`}>
                    {server.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(server.status)}
                    <span className={`text-sm font-medium ${getStatusColor(server.status)}`}>
                      {server.status === "connected" ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Latency:</span>
                    <span className="font-medium">{server.latency}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Type:</span>
                    <Badge variant="outline">{server.type.toUpperCase()}</Badge>
                  </div>
                  {server.description && (
                    <p className="text-gray-600 mt-2">{server.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={server.status === "connected" ? "destructive" : "default"}
                    onClick={() => handleToggleConnection(server)}
                    disabled={toggleConnectionMutation.isPending}
                    data-testid={`button-toggle-${server.id}`}
                  >
                    {server.status === "connected" ? "Disconnect" : "Connect"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleConnection(server)}
                    disabled={toggleConnectionMutation.isPending}
                    data-testid={`button-refresh-${server.id}`}
                  >
                    <RefreshCw size={14} />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConfigureServer(server)}
                    data-testid={`button-configure-${server.id}`}
                  >
                    <Settings size={14} />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteServer(server.id)}
                    disabled={deleteServerMutation.isPending}
                    data-testid={`button-delete-${server.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Configuration Modal */}
      <ServerConfigModal
        server={selectedServer}
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
      />
    </div>
  );
}
