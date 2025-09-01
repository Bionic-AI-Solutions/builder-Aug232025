import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { type McpServer } from "@shared/schema";
import { X, Server } from "lucide-react";

const serverConfigSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  type: z.enum(["sse", "stdio", "websocket", "grpc"]),
  url: z.string().optional(),
  description: z.string().optional(),
});

type ServerConfigForm = z.infer<typeof serverConfigSchema>;

interface ServerConfigModalProps {
  server: McpServer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const serverTypes = [
  { value: "sse", label: "SSE (Server-Sent Events)", description: "Real-time streaming" },
  { value: "stdio", label: "Stdio", description: "Standard input/output" },
  { value: "websocket", label: "WebSocket", description: "Bidirectional real-time" },
  { value: "grpc", label: "gRPC", description: "High-performance RPC" },
];

export default function ServerConfigModal({
  server,
  open,
  onOpenChange
}: ServerConfigModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServerConfigForm>({
    resolver: zodResolver(serverConfigSchema),
    defaultValues: {
      name: "",
      type: "sse",
      url: "",
      description: "",
    },
  });

  // Reset form when server changes or modal opens
  useEffect(() => {
    if (open) {
      if (server) {
        // Editing existing server
        form.reset({
          name: server.name,
          type: server.type as any,
          url: server.url || "",
          description: server.description || "",
        });
      } else {
        // Adding new server
        form.reset({
          name: "",
          type: "sse",
          url: "",
          description: "",
        });
      }
    }
  }, [server, open, form]);

  const createServerMutation = useMutation({
    mutationFn: async (data: ServerConfigForm) => {
      return apiRequest("POST", "/api/admin/mcp-servers", {
        ...data,
        status: "active",
        approved: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mcp-servers"] });
      toast({
        title: "Server Added",
        description: "MCP server has been configured successfully.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Failed to Add Server",
        description: "Please check your configuration and try again.",
        variant: "destructive",
      });
    },
  });

  const updateServerMutation = useMutation({
    mutationFn: async (data: ServerConfigForm) => {
      if (!server) throw new Error("No server to update");
      return apiRequest("PUT", `/api/admin/mcp-servers/${server.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mcp-servers"] });
      toast({
        title: "Server Updated",
        description: "MCP server configuration has been updated.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Failed to Update Server",
        description: "Please check your configuration and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ServerConfigForm) => {
    setIsSubmitting(true);

    try {
      if (server) {
        await updateServerMutation.mutateAsync(data);
      } else {
        await createServerMutation.mutateAsync(data);
      }
    } catch (error) {
      // Error handled by mutations
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = form.watch("type");
  const requiresUrl = selectedType !== "stdio";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Server size={20} className="text-blue-600" />
              </div>
              <div>
                <DialogTitle>
                  {server ? "Configure MCP Server" : "Add New MCP Server"}
                </DialogTitle>
                <DialogDescription>
                  {server ? "Update server configuration" : "Configure a new MCP server connection"}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-server-modal"
            >
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Database MCP"
                      data-testid="input-server-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-server-type">
                        <SelectValue placeholder="Select server type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serverTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requiresUrl && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {selectedType === "websocket" ? "WebSocket URL" :
                        selectedType === "grpc" ? "gRPC Endpoint" : "URL/Endpoint"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          selectedType === "websocket" ? "wss://api.example.com" :
                            selectedType === "grpc" ? "grpc://api.example.com:9090" :
                              selectedType === "sse" ? "wss://sse.example.com" :
                                "Enter endpoint URL"
                        }
                        data-testid="input-server-url"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Real-time database connections..."
                      rows={3}
                      data-testid="textarea-server-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-server-config"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-save-server-config"
              >
                {isSubmitting ? "Saving..." : server ? "Update Server" : "Add Server"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
