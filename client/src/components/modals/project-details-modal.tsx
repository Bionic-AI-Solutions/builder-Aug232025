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
    switch (type.toLowerCase()) {
      case "javascript":
      case "js":
        return "📜";
      case "html":
      case "htm":
        return "🌐";
      case "css":
        return "🎨";
      case "json":
        return "📋";
      case "typescript":
      case "ts":
        return "📘";
      case "python":
      case "py":
        return "🐍";
      case "sql":
        return "🗃️";
      case "yml":
      case "yaml":
        return "⚙️";
      case "md":
      case "markdown":
        return "📝";
      case "txt":
        return "📄";
      case "xml":
        return "🔖";
      case "config":
        return "⚙️";
      default:
        return "📄";
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "javascript":
      case "js":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "html":
      case "htm":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "css":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "json":
        return "text-green-600 bg-green-50 border-green-200";
      case "typescript":
      case "ts":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "python":
      case "py":
        return "text-green-700 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const handleDownloadFile = (file: any) => {
    toast({
      title: "Download Started",
      description: `Downloading ${file.name}...`,
    });
  };

  const handleViewFile = (file: any) => {
    toast({
      title: "File Preview",
      description: `Opening ${file.name} in preview mode...`,
    });
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Project Files</label>
                <p className="text-xs text-gray-500 mt-1">Files generated during development</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-600">
                  {project.files?.length || 0} files • {getTotalFileSize()}
                </span>
              </div>
            </div>
            
            {!project.files || project.files.length === 0 ? (
              <Card className="border-dashed border-gray-300 bg-gray-50">
                <CardContent className="p-6 text-center">
                  <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">No files generated yet</p>
                  <p className="text-xs text-gray-400 mt-1">Files will appear here once the project is built</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {project.files.map((file, index) => (
                  <Card key={index} className="border-gray-100 hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg border mr-3">
                            <span className="text-lg">
                              {getFileIcon(file.type)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getFileTypeColor(file.type)}`}
                              >
                                {file.type.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Created during project generation • {file.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewFile(file)}
                            className="text-gray-600 hover:text-gray-900"
                            data-testid={`button-view-file-${index}`}
                          >
                            <FileText size={14} className="mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(file)}
                            className="text-gray-600 hover:text-gray-900"
                            data-testid={`button-download-file-${index}`}
                          >
                            <Download size={14} className="mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* File Summary */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <FileText size={16} className="mr-2 text-blue-600" />
                        <span className="text-blue-900 font-medium">
                          Files Summary
                        </span>
                      </div>
                      <div className="text-blue-700">
                        <span className="font-medium">{project.files?.length || 0}</span> files • 
                        <span className="font-medium">{getTotalFileSize()}</span> total
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
