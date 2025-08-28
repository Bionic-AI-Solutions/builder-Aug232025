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
  Terminal
} from "lucide-react";

interface McpClient {
  id: string;
  name: string;
  connectionString: string;
  connectionType: 'sse' | 'stdio' | 'websocket' | 'grpc';
  command?: string;
  args?: string[];
  headers?: Record<string, string>;
  customVars?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
}

// Mock MCP clients data
const mockMcpClients: McpClient[] = [
  {
    id: "mcp-1",
    name: "Database Connector",
    connectionString: "sse://api.database-service.com/events",
    connectionType: "sse",
    headers: {
      "Authorization": "Bearer ${API_KEY}",
      "Content-Type": "application/json"
    },
    customVars: {
      "API_KEY": "your-database-api-key",
      "ENVIRONMENT": "production"
    },
    isActive: true,
    createdAt: new Date("2024-12-01"),
  },
  {
    id: "mcp-2",
    name: "File System Manager",
    connectionString: "stdio:///usr/local/bin/file-manager",
    connectionType: "stdio",
    command: "/usr/local/bin/file-manager",
    args: ["--config", "/etc/file-manager/config.json"],
    isActive: true,
    createdAt: new Date("2024-12-05"),
  },
  {
    id: "mcp-3",
    name: "Payment Gateway",
    connectionString: "websocket://wss://payment-gateway.com/ws",
    connectionType: "websocket",
    headers: {
      "X-API-Key": "${PAYMENT_API_KEY}",
      "X-Client-ID": "${CLIENT_ID}"
    },
    customVars: {
      "PAYMENT_API_KEY": "pk_live_...",
      "CLIENT_ID": "client_12345"
    },
    isActive: false,
    createdAt: new Date("2024-12-10"),
  },
  {
    id: "mcp-4",
    name: "Analytics Engine",
    connectionString: "grpc://analytics-service:9090",
    connectionType: "grpc",
    headers: {
      "Authorization": "Bearer ${ANALYTICS_TOKEN}"
    },
    customVars: {
      "ANALYTICS_TOKEN": "analytics_token_123"
    },
    isActive: true,
    createdAt: new Date("2024-12-15"),
  },
];

export default function McpServers() {
  const [selectedClient, setSelectedClient] = useState<McpClient | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<McpClient>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch MCP clients
  const { data: mcpClients = mockMcpClients, isLoading } = useQuery<McpClient[]>({
    queryKey: ["/api/mcp-clients"],
    queryFn: async () => {
      // For now, return mock data. In real app, this would be an API call
      return mockMcpClients;
    },
  });

  // Update MCP client mutation
  const updateMcpClientMutation = useMutation({
    mutationFn: async (client: McpClient) => {
      // In real app, this would be an API call
      console.log("Updating MCP client:", client);
      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-clients"] });
      toast({
        title: "MCP Client Updated",
        description: "The MCP client has been successfully updated.",
      });
      setShowEditModal(false);
      setEditingClient({});
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update MCP client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditClient = (client: McpClient) => {
    setSelectedClient(client);
    setEditingClient({ ...client });
    setShowEditModal(true);
  };

  const handleSaveClient = () => {
    if (!selectedClient || !editingClient.name || !editingClient.connectionString) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const updatedClient: McpClient = {
      ...selectedClient,
      ...editingClient,
    };

    updateMcpClientMutation.mutate(updatedClient);
  };

  const handleClearAll = () => {
    setEditingClient({});
  };

  const getConnectionTypeBadge = (type: string) => {
    const badges = {
      sse: { color: "bg-blue-100 text-blue-800", icon: Globe },
      stdio: { color: "bg-green-100 text-green-800", icon: Terminal },
      websocket: { color: "bg-purple-100 text-purple-800", icon: Server },
      grpc: { color: "bg-orange-100 text-orange-800", icon: Code },
    };
    const config = badges[type as keyof typeof badges] || badges.sse;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon size={12} className="mr-1" />
        {type.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle size={12} className="mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">
        <AlertCircle size={12} className="mr-1" />
        Inactive
      </Badge>
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Connection string copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MCP Servers</h1>
          <p className="text-gray-600 mt-2">
            Manage Model Context Protocol (MCP) clients for external server connections
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" />
          Add MCP Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{mcpClients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mcpClients.filter(client => client.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mcpClients.filter(client => !client.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Types</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(mcpClients.map(client => client.connectionType)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MCP Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mcpClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow border border-gray-100">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {client.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {getConnectionTypeBadge(client.connectionType)}
                    {getStatusBadge(client.isActive)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClient(client)}
                  data-testid={`button-edit-mcp-${client.id}`}
                >
                  <Edit2 size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Connection String</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={client.connectionString}
                      readOnly
                      className="text-sm font-mono bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(client.connectionString)}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>

                {client.command && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Command</Label>
                    <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                      {client.command}
                    </p>
                  </div>
                )}

                {client.args && client.args.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Arguments</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {client.args.map((arg, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {arg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created: {client.createdAt.toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit MCP Client Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit MCP Client: {selectedClient?.name}
            </DialogTitle>
            <DialogDescription>
              Configure the MCP client connection settings and parameters
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="client-name">MCP Client Name</Label>
                <Input
                  id="client-name"
                  value={editingClient.name || ""}
                  onChange={(e) => setEditingClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter MCP client name"
                />
              </div>

              <div>
                <Label htmlFor="connection-type">Connection Type</Label>
                <select
                  id="connection-type"
                  value={editingClient.connectionType || "sse"}
                  onChange={(e) => setEditingClient(prev => ({
                    ...prev,
                    connectionType: e.target.value as 'sse' | 'stdio' | 'websocket' | 'grpc'
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="sse">SSE (Server-Sent Events)</option>
                  <option value="stdio">STDIO (Standard I/O)</option>
                  <option value="websocket">WebSocket</option>
                  <option value="grpc">gRPC</option>
                </select>
              </div>

              <div>
                <Label htmlFor="is-active">Status</Label>
                <select
                  id="is-active"
                  value={editingClient.isActive ? "true" : "false"}
                  onChange={(e) => setEditingClient(prev => ({
                    ...prev,
                    isActive: e.target.value === "true"
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </TabsContent>

            <TabsContent value="connection" className="space-y-4">
              <div>
                <Label htmlFor="connection-string">Connection String</Label>
                <Textarea
                  id="connection-string"
                  value={editingClient.connectionString || ""}
                  onChange={(e) => setEditingClient(prev => ({ ...prev, connectionString: e.target.value }))}
                  placeholder="Enter connection string (e.g., sse://api.example.com/events)"
                  rows={3}
                />
              </div>

              {editingClient.connectionType === "stdio" && (
                <div>
                  <Label htmlFor="command">Command</Label>
                  <Input
                    id="command"
                    value={editingClient.command || ""}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, command: e.target.value }))}
                    placeholder="Enter command (e.g., /usr/local/bin/mcp-server)"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {editingClient.connectionType === "stdio" && (
                <div>
                  <Label htmlFor="args">Arguments</Label>
                  <Textarea
                    id="args"
                    value={editingClient.args?.join(" ") || ""}
                    onChange={(e) => setEditingClient(prev => ({
                      ...prev,
                      args: e.target.value.split(" ").filter(arg => arg.trim())
                    }))}
                    placeholder="Enter arguments separated by spaces"
                    rows={2}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="headers">Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={JSON.stringify(editingClient.headers || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      setEditingClient(prev => ({ ...prev, headers }));
                    } catch (error) {
                      // Invalid JSON, keep as is
                    }
                  }}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              <div>
                <Label htmlFor="custom-vars">Custom Variables (JSON)</Label>
                <Textarea
                  id="custom-vars"
                  value={JSON.stringify(editingClient.customVars || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const customVars = JSON.parse(e.target.value);
                      setEditingClient(prev => ({ ...prev, customVars }));
                    } catch (error) {
                      // Invalid JSON, keep as is
                    }
                  }}
                  placeholder='{"API_KEY": "your-api-key", "ENVIRONMENT": "production"}'
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  These variables can be referenced in headers and connection strings using $&#123;VARIABLE_NAME&#125;
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveClient}
                disabled={updateMcpClientMutation.isPending}
              >
                {updateMcpClientMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
