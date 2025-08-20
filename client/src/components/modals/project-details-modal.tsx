import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Project } from "@shared/schema";
import { 
  Calendar, 
  Cpu, 
  Server, 
  FileText, 
  Download, 
  MessageCircle,
  ExternalLink,
  X
} from "lucide-react";

interface ProjectDetailsModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailsModal({ 
  project, 
  open, 
  onOpenChange 
}: ProjectDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeploying, setIsDeploying] = useState(false);

  const deployToMarketplaceMutation = useMutation({
    mutationFn: async (projectData: any) => {
      return apiRequest("POST", "/api/marketplace", projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      toast({
        title: "Deployed Successfully",
        description: "Your app has been deployed to the marketplace!",
      });
      setIsDeploying(false);
    },
    onError: () => {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy app to marketplace. Please try again.",
        variant: "destructive",
      });
      setIsDeploying(false);
    },
  });

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

  const handleDeploy = async () => {
    if (project.status !== "completed") {
      toast({
        title: "Cannot Deploy",
        description: "Only completed projects can be deployed to the marketplace.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    try {
      await deployToMarketplaceMutation.mutateAsync({
        projectId: project.id,
        name: project.name,
        description: project.description || `Generated with ${project.llm.toUpperCase()}`,
        price: Math.floor(Math.random() * 5000) + 1500, // Random price between $15-$65
        category: "custom",
        icon: "🔧",
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getTotalFileSize = () => {
    if (!project.files || project.files.length === 0) return "0kb";
    
    const totalSize = project.files.reduce((total, file) => {
      const size = parseFloat(file.size.replace(/[^\d.]/g, ''));
      return total + size;
    }, 0);
    
    return `${totalSize.toFixed(1)}kb`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "javascript":
        return "📄";
      case "html":
        return "🌐";
      case "css":
        return "🎨";
      case "json":
        return "📋";
      default:
        return "📄";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {project.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Project details and deployment options
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-project-modal"
            >
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Project Status Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                {getStatusBadge(project.status)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Progress</label>
              <p className="text-gray-900 font-semibold mt-1">
                {project.status === "completed" ? "100%" : 
                 project.status === "testing" ? "85%" : "60%"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">LLM Used</label>
              <div className="flex items-center mt-1">
                <Cpu size={16} className="mr-2 text-gray-400" />
                <span className="text-gray-900">
                  {project.llm.charAt(0).toUpperCase() + project.llm.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Generated</label>
              <div className="flex items-center mt-1">
                <Calendar size={16} className="mr-2 text-gray-400" />
                <span className="text-gray-900">
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* MCP Servers */}
          <div>
            <label className="text-sm font-medium text-gray-700">MCP Servers</label>
            <div className="flex items-center mt-1">
              <Server size={16} className="mr-2 text-gray-400" />
              <span className="text-gray-900">
                {project.mcpServers?.join(", ") || "None"}
              </span>
            </div>
          </div>

          {/* Project Description */}
          {project.description && (
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-900 mt-1">{project.description}</p>
            </div>
          )}

          {/* Project Files */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Project Files</label>
              <span className="text-sm text-gray-600">
                Total: {getTotalFileSize()}
              </span>
            </div>
            
            {!project.files || project.files.length === 0 ? (
              <p className="text-gray-500 text-sm">No files generated yet</p>
            ) : (
              <div className="space-y-2">
                {project.files.map((file, index) => (
                  <Card key={index} className="border-gray-100">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">
                            {getFileIcon(file.type)}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-600 capitalize">
                              {file.type} file
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">{file.size}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Original Prompt */}
          {project.prompt && (
            <div>
              <label className="text-sm font-medium text-gray-700">Original Prompt</label>
              <Card className="mt-2 border-gray-100">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {project.prompt}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              onClick={handleDeploy}
              disabled={isDeploying || project.status !== "completed"}
              data-testid="button-deploy-project"
            >
              <ExternalLink size={16} className="mr-2" />
              {isDeploying ? "Deploying..." : "Deploy to Marketplace"}
            </Button>
            
            <Button
              variant="outline"
              data-testid="button-chat-with-project"
            >
              <MessageCircle size={16} className="mr-2" />
              Chat with App
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-project-details"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
