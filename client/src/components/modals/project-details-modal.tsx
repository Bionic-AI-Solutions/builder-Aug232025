import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  X,
  Upload,
  CheckCircle,
  DollarSign
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
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [publishPrice, setPublishPrice] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [isProjectModified, setIsProjectModified] = useState(false);
  const [lastPublishedState, setLastPublishedState] = useState<string>("");

  const publishProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest("PATCH", `/api/projects/${projectId}`, { published: "true" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Published Successfully",
        description: "Your project has been published to the marketplace!",
      });
      setIsDeploying(false);
    },
    onError: () => {
      toast({
        title: "Publish Failed",
        description: "Failed to publish project. Please try again.",
        variant: "destructive",
      });
      setIsDeploying(false);
    },
  });

  const getStatusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-green-100 text-green-800">✅ Completed</Badge>;
    if (status === "testing") return <Badge className="bg-yellow-100 text-yellow-800">🧪 Testing</Badge>;
    if (status === "development") return <Badge className="bg-blue-100 text-blue-800">🔧 Development</Badge>;
    if (status === "published") return <Badge className="bg-purple-100 text-purple-800">📦 Published</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">❓ Unknown</Badge>;
  };

  // Check if project has been modified since last publish
  const checkProjectModifications = () => {
    if (!project) return;

    const currentState = JSON.stringify({
      name: project.name,
      description: project.description,
      prompt: project.prompt,
      mcpServers: project.mcpServers,
      files: project.files?.map((f: any) => f.name + f.size)
    });

    if (lastPublishedState && currentState !== lastPublishedState) {
      setIsProjectModified(true);
    } else if (lastPublishedState && currentState === lastPublishedState) {
      setIsProjectModified(false);
    }
  };

  // Check modifications when project changes
  useEffect(() => {
    checkProjectModifications();
  }, [project, lastPublishedState]);

  const handlePublish = () => {
    setShowPricingModal(true);
  };

  const handlePublishSubmit = () => {
    if (!project || !publishPrice) return;

    // Update project status to published
    const updatedProject = {
      ...project,
      published: "true",
      marketplacePrice: parseFloat(publishPrice),
      marketplaceDescription: publishDescription
    };

    // Set the published state for modification tracking
    const publishedState = JSON.stringify({
      name: updatedProject.name,
      description: updatedProject.description,
      prompt: updatedProject.prompt,
      mcpServers: updatedProject.mcpServers,
      files: updatedProject.files?.map((f: any) => f.name + f.size)
    });

    setLastPublishedState(publishedState);
    setIsProjectModified(false);

    // Add to marketplace (in a real app, this would be an API call)
    console.log("Adding to marketplace:", updatedProject);

    // Close modal and reset form
    setShowPricingModal(false);
    setPublishPrice("");
    setPublishDescription("");

    // Close the main modal
    onOpenChange(false);
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
                <label className="text-sm font-medium text-gray-700">RAG Knowledge Base</label>
                <p className="text-xs text-gray-500 mt-1">Knowledge content for chatbot context</p>
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
                  <p className="text-gray-500 text-sm">No knowledge files uploaded yet</p>
                  <p className="text-xs text-gray-400 mt-1">Upload knowledge content to provide context for your chatbot</p>
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
                              Knowledge content for chatbot context • {file.size}
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
                          Knowledge Base Summary
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
            {(project as any).published === "true" ? (
              <Button
                disabled
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-published-project"
              >
                <CheckCircle size={16} className="mr-2" /> Published to Marketplace
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={project.status !== "completed" || ((project as any).published === "true" && !isProjectModified)}
                data-testid="button-publish-project"
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload size={16} className="mr-2" />
                {(project as any).published === "true" ? "Republish to Marketplace" : "Publish to Marketplace"}
              </Button>
            )}

            <Button
              variant="outline"
              data-testid="button-chat-with-project"
            >
              <MessageCircle size={16} className="mr-2" />
              Chat
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

      {/* Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Publish to Marketplace
            </DialogTitle>
            <DialogDescription>
              Set the price for your app in the marketplace. Super Admin will add a base fee to this price.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">App Details</h4>
              <p className="text-sm text-blue-800">
                <strong>Name:</strong> {project.name}
              </p>
              <p className="text-sm text-blue-800">
                <strong>LLM:</strong> {project.llm.charAt(0).toUpperCase() + project.llm.slice(1)}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Files:</strong> {project.files?.length || 0} files
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-price-modal" className="text-sm font-medium">
                Your Price (USD)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="publish-price-modal"
                  type="number"
                  placeholder="0.00"
                  value={publishPrice}
                  onChange={(e) => setPublishPrice(e.target.value)}
                  className="pl-8"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-gray-500">
                This is your base price. Super Admin will add platform fees.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-description-modal" className="text-sm font-medium">
                Marketplace Description
              </Label>
              <textarea
                id="publish-description-modal"
                value={publishDescription}
                onChange={(e) => setPublishDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md text-sm"
                rows={4}
                placeholder="Describe your app for potential buyers..."
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <h5 className="font-medium text-yellow-900 mb-1">Pricing Information</h5>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Your price: ${publishPrice || '0.00'}</li>
                <li>• Platform fee: +$10.00 (set by Super Admin)</li>
                <li>• Total marketplace price: ${(parseFloat(publishPrice) || 0) + 10}</li>
              </ul>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPricingModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublishSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Upload size={16} className="mr-2" />
                Publish to Marketplace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
