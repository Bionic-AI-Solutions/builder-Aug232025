import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiCall } from "@/lib/auth";
import {
  Server,
  Edit2,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Settings,
  Code,
  Key,
  Globe,
  Terminal,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface McpServer {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string;
  approved: boolean;
  status: string;
}

export default function McpServers() {
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingServer, setEditingServer] = useState<Partial<McpServer>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch MCP servers from API
  const { data: mcpData, isLoading, error } = useQuery<{ success: boolean; data: { servers: McpServer[] } }>({
    queryKey: ["mcp-servers"],
    queryFn: async () => {
      console.log('Fetching MCP servers...');
      const result = await apiCall('/servers');
      console.log('MCP servers response:', result);
      return result;
    },
  });

  const mcpServers: McpServer[] = mcpData?.data?.servers || [];

  // Update MCP server mutation
  const updateMcpServerMutation = useMutation({
    mutationFn: async (server: McpServer) => {
      // In real app, this would be an API call
      console.log("Updating MCP server:", server);
      return server;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-servers"] });
      toast({
        title: "MCP Server Updated",
        description: "The MCP server has been successfully updated.",
      });
      setShowEditModal(false);
      setEditingServer({});
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update MCP server. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditServer = (server: McpServer) => {
    setSelectedServer(server);
    setEditingServer({ ...server });
    setShowEditModal(true);
  };

  const handleSaveServer = () => {
    if (!selectedServer || !editingServer.name || !editingServer.url) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const updatedServer: McpServer = {
      ...selectedServer,
      ...editingServer,
    };

    updateMcpServerMutation.mutate(updatedServer);
  };

  const handleClearAll = () => {
    setEditingServer({});
  };

  const getConnectionTypeBadge = (type: string) => {
    const badges = {
      http: { color: "bg-blue-100 text-blue-800", icon: Globe },
      tcp: { color: "bg-green-100 text-green-800", icon: Terminal },
      websocket: { color: "bg-purple-100 text-purple-800", icon: Server },
      grpc: { color: "bg-orange-100 text-orange-800", icon: Code },
      sse: { color: "bg-indigo-100 text-indigo-800", icon: Server },
      stdio: { color: "bg-teal-100 text-teal-800", icon: Terminal },
    };
    const config = badges[type as keyof typeof badges] || badges.http;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon size={12} className="mr-1" />
        {type.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Active
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <AlertCircle size={12} className="mr-1" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }
  };

  const getApprovalBadge = (approved: boolean) => {
    if (approved) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertCircle size={12} className="mr-1" />
          Pending
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-500">Loading MCP servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-500 mb-4">Failed to load MCP servers.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MCP Servers</h1>
            <p className="text-muted-foreground">
              Manage Model Context Protocol (MCP) clients for external server connections
            </p>
          </div>
          <Button onClick={() => setShowEditModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mcpServers.length}</div>
            <p className="text-xs text-muted-foreground">
              Configured MCP servers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Servers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mcpServers.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Servers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mcpServers.filter(s => s.approved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Types</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(mcpServers.map(s => s.type)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Different protocols
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Servers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mcpServers.map((server) => (
          <Card key={server.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{server.name}</CardTitle>
                    <CardDescription>{server.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(server.status)}
                  {getApprovalBadge(server.approved)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connection Type:</span>
                  {getConnectionTypeBadge(server.type)}
                </div>

                <div>
                  <span className="text-sm font-medium">Connection String:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono break-all">
                    {server.url}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditServer(server)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(server.url);
                        toast({
                          title: "Copied!",
                          description: "Connection string copied to clipboard.",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Test connection logic would go here
                      toast({
                        title: "Test Connection",
                        description: `Testing connection to ${server.name}...`,
                      });
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Add Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedServer ? "Edit MCP Server" : "Add New MCP Server"}
            </DialogTitle>
            <DialogDescription>
              Configure the MCP server connection details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Server Name</Label>
              <Input
                id="name"
                value={editingServer.name || ""}
                onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })}
                placeholder="Enter server name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingServer.description || ""}
                onChange={(e) => setEditingServer({ ...editingServer, description: e.target.value })}
                placeholder="Enter server description"
              />
            </div>

            <div>
              <Label htmlFor="type">Connection Type</Label>
              <select
                id="type"
                value={editingServer.type || ""}
                onChange={(e) => setEditingServer({ ...editingServer, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type</option>
                <option value="http">HTTP</option>
                <option value="tcp">TCP</option>
                <option value="websocket">WebSocket</option>
                <option value="grpc">gRPC</option>
                <option value="sse">SSE</option>
                <option value="stdio">STDIO</option>
              </select>
            </div>

            <div>
              <Label htmlFor="url">Connection String</Label>
              <Input
                id="url"
                value={editingServer.url || ""}
                onChange={(e) => setEditingServer({ ...editingServer, url: e.target.value })}
                placeholder="Enter connection string"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClearAll}>
              Clear
            </Button>
            <Button onClick={handleSaveServer}>
              {selectedServer ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
