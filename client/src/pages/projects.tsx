import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { type Project } from "@shared/schema";
import { Eye, MessageCircle, Calendar, Cpu, FileText, Package, Download, Crown, Upload, DollarSign } from "lucide-react";
import ProjectDetailsModal from "@/components/modals/project-details-modal";
import ChatAppModal from "@/components/modals/chat-app-modal";

// Mock data for purchased templates
const mockPurchasedTemplates = [
  {
    id: "template-1",
    name: "Restaurant POS System",
    description: "Complete point-of-sale system for restaurants with menu management, order tracking, and payment processing.",
    status: "completed",
    type: "purchased",
    purchasedFrom: "john_dev",
    purchaseDate: "2024-12-15T10:30:00Z",
    price: 299,
    llm: "claude",
    files: [
      { name: "POS System", size: "45.2kb", type: "javascript" },
      { name: "Menu Manager", size: "23.1kb", type: "javascript" },
      { name: "Payment Gateway", size: "18.7kb", type: "javascript" },
    ],
    createdAt: "2024-12-10T09:15:00Z",
  },
  {
    id: "template-2",
    name: "E-commerce Analytics Dashboard",
    description: "Comprehensive analytics dashboard for e-commerce businesses with sales tracking, customer insights, and inventory management.",
    status: "completed",
    type: "purchased",
    purchasedFrom: "alice_coder",
    purchaseDate: "2024-12-12T14:20:00Z",
    price: 199,
    llm: "gpt4",
    files: [
      { name: "Analytics Engine", size: "67.3kb", type: "javascript" },
      { name: "Data Visualizations", size: "34.8kb", type: "javascript" },
      { name: "Report Generator", size: "28.9kb", type: "javascript" },
    ],
    createdAt: "2024-12-08T10:30:00Z",
  },
  {
    id: "template-3",
    name: "Blog Content Manager",
    description: "AI-powered content management system for blogs with automated writing assistance, SEO optimization, and publishing tools.",
    status: "completed",
    type: "purchased",
    purchasedFrom: "mike_startup",
    purchaseDate: "2024-12-10T16:45:00Z",
    price: 149,
    llm: "gemini",
    files: [
      { name: "Content Editor", size: "52.1kb", type: "javascript" },
      { name: "SEO Optimizer", size: "19.6kb", type: "javascript" },
      { name: "Publishing Tools", size: "15.3kb", type: "javascript" },
    ],
    createdAt: "2024-12-05T16:45:00Z",
  },
];

export default function Projects() {
  const { user } = useAuth();
  const searchParams = useSearch();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState("developed");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishProject, setPublishProject] = useState<Project | null>(null);
  const [publishPrice, setPublishPrice] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const { toast } = useToast();
  const [projectModifications, setProjectModifications] = useState<Record<string, boolean>>({});
  const [lastPublishedStates, setLastPublishedStates] = useState<Record<string, string>>({});

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch(`/api/projects?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Auto-open project details modal if view parameter is present
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams);
    const viewProjectId = urlParams.get('view');

    if (viewProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === viewProjectId);
      if (project) {
        setSelectedProject(project);
        setShowDetailsModal(true);
      }
    }
  }, [searchParams, projects]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800">✅ Published</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">✅ Completed</Badge>;
      case "testing":
        return <Badge className="bg-orange-100 text-orange-800">🔄 Testing</Badge>;
      case "development":
        return <Badge className="bg-yellow-100 text-yellow-800">🔄 Development</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "developed" ? (
      <Badge variant="default" className="bg-blue-100 text-blue-800">🛠️ Developed</Badge>
    ) : (
      <Badge variant="secondary" className="bg-purple-100 text-purple-800">📦 Purchased</Badge>
    );
  };

  // Check if project has been modified since last publish
  const checkProjectModifications = (project: any) => {
    const currentState = JSON.stringify({
      name: project.name,
      description: project.description,
      prompt: project.prompt,
      mcpServers: project.mcpServers,
      files: project.files?.map((f: any) => f.name + f.size)
    });

    const lastState = lastPublishedStates[project.id];
    if (lastState && currentState !== lastState) {
      setProjectModifications(prev => ({ ...prev, [project.id]: true }));
    } else if (lastState && currentState === lastState) {
      setProjectModifications(prev => ({ ...prev, [project.id]: false }));
    }
  };

  // Check modifications for all projects
  useEffect(() => {
    projects.forEach(project => {
      if (project.published === "true") {
        checkProjectModifications(project);
      }
    });
  }, [projects, lastPublishedStates]);

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleChatWithApp = (project: Project) => {
    setSelectedProject(project);
    setShowChatModal(true);
  };

  const handlePublishProject = (project: Project) => {
    setPublishProject(project);
    setPublishPrice("");
    setPublishDescription(project.description || "");
    setShowPublishModal(true);
  };

  const handlePublishSubmit = () => {
    if (!publishProject || !publishPrice) return;

    // Update project status to published
    const updatedProject = {
      ...publishProject,
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

    setLastPublishedStates(prev => ({ ...prev, [updatedProject.id]: publishedState }));
    setProjectModifications(prev => ({ ...prev, [updatedProject.id]: false }));

    // Add to marketplace (in a real app, this would be an API call)
    // For now, we'll simulate this by updating the project in our local state
    console.log("Adding to marketplace:", updatedProject);

    toast({
      title: "Project Published!",
      description: `"${updatedProject.name}" has been published to the marketplace for $${publishPrice}`,
    });

    setShowPublishModal(false);
    setPublishProject(null);
    setPublishPrice("");
    setPublishDescription("");
  };

  const developedStats = {
    total: projects.length,
    completed: projects.filter(p => p.status === "completed").length,
    inDev: projects.filter(p => p.status !== "completed").length,
  };

  const purchasedStats = {
    total: mockPurchasedTemplates.length,
    completed: mockPurchasedTemplates.filter(p => p.status === "completed").length,
    totalSpent: mockPurchasedTemplates.reduce((sum, p) => sum + p.price, 0),
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

  const renderProjectCard = (project: any, isPurchased: boolean = false) => (
    <Card key={project.id} className="hover:shadow-md transition-shadow border border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900" data-testid={`project-name-${project.id}`}>
            {project.name}
          </h3>
          <div className="flex gap-2">
            {getTypeBadge(isPurchased ? "purchased" : "developed")}
            {getStatusBadge(project.status)}
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar size={16} className="mr-2" />
            <span>
              {isPurchased ? 'Purchased' : 'Generated'}: {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="flex items-center">
            <Cpu size={16} className="mr-2" />
            <span>LLM: {project.llm.charAt(0).toUpperCase() + project.llm.slice(1)}</span>
          </div>
          <div className="flex items-center">
            <FileText size={16} className="mr-2" />
            <span>Knowledge Files: {project.files?.length || 0} files ({
              project.files?.reduce((total: number, file: any) => {
                const size = parseFloat(file.size.replace(/[^\d.]/g, ''));
                return total + size;
              }, 0).toFixed(1) || 0
            }kb)</span>
          </div>
          {isPurchased && (
            <>
              <div className="flex items-center">
                <Package size={16} className="mr-2" />
                <span>From: @{project.purchasedFrom}</span>
              </div>
              <div className="flex items-center">
                <Crown size={16} className="mr-2" />
                <span>Price: ${project.price}</span>
              </div>
            </>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewProject(project)}
            data-testid={`button-view-${project.id}`}
          >
            <Eye size={16} className="mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleChatWithApp(project)}
            data-testid={`button-chat-${project.id}`}
          >
            <MessageCircle size={16} className="mr-1" />
            Chat
          </Button>
          {!isPurchased && project.status === "completed" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handlePublishProject(project)}
              data-testid={`button-publish-${project.id}`}
              className="bg-green-600 hover:bg-green-700"
              disabled={project.published === "true" && !projectModifications[project.id]}
            >
              <Upload size={16} className="mr-1" />
              {project.published === "true" ? "Republish" : "Publish"}
            </Button>
          )}
          {isPurchased && (
            <Button
              size="sm"
              variant="outline"
              data-testid={`button-download-${project.id}`}
            >
              <Download size={16} className="mr-1" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="bg-white rounded-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <div className="text-sm text-gray-600 space-x-4">
            <span>Developed: <span className="font-semibold" data-testid="stat-developed-total">{developedStats.total}</span></span>
            <span>Purchased: <span className="font-semibold" data-testid="stat-purchased-total">{purchasedStats.total}</span></span>
            <span>Total Spent: <span className="font-semibold text-purple-600" data-testid="stat-total-spent">${purchasedStats.totalSpent}</span></span>
          </div>
        </div>
      </div>

      {/* Projects Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="developed">🛠️ Developed Projects</TabsTrigger>
          <TabsTrigger value="purchased">📦 Purchased Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="developed" className="space-y-6">
          {/* Developed Projects Stats */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-blue-900">Developed Projects</h3>
              <div className="text-sm text-blue-700 space-x-4">
                <span>Total: <span className="font-semibold">{developedStats.total}</span></span>
                <span>Completed: <span className="font-semibold text-green-600">{developedStats.completed}</span></span>
                <span>In Development: <span className="font-semibold text-orange-600">{developedStats.inDev}</span></span>
              </div>
            </div>
          </div>

          {/* Developed Projects Grid */}
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No developed projects yet</h3>
                <p className="text-gray-600">Start building your first app in the Chat Development section.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => renderProjectCard(project, false))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchased" className="space-y-6">
          {/* Purchased Templates Stats */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-purple-900">Purchased Templates</h3>
              <div className="text-sm text-purple-700 space-x-4">
                <span>Total: <span className="font-semibold">{purchasedStats.total}</span></span>
                <span>Completed: <span className="font-semibold text-green-600">{purchasedStats.completed}</span></span>
                <span>Total Spent: <span className="font-semibold">${purchasedStats.totalSpent}</span></span>
              </div>
            </div>
          </div>

          {/* Purchased Templates Grid */}
          {mockPurchasedTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchased templates yet</h3>
                <p className="text-gray-600">Browse the marketplace to find templates you can purchase and customize.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockPurchasedTemplates.map((template) => renderProjectCard(template, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedProject && (
        <>
          <ProjectDetailsModal
            project={selectedProject}
            open={showDetailsModal}
            onOpenChange={setShowDetailsModal}
          />
          <ChatAppModal
            project={selectedProject}
            open={showChatModal}
            onOpenChange={setShowChatModal}
          />
        </>
      )}

      {/* Publish to Marketplace Modal */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
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

          {publishProject && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">App Details</h4>
                <p className="text-sm text-blue-800">
                  <strong>Name:</strong> {publishProject.name}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>LLM:</strong> {publishProject.llm.charAt(0).toUpperCase() + publishProject.llm.slice(1)}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Knowledge Files:</strong> {publishProject.files?.length || 0} files
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publish-price" className="text-sm font-medium">
                  Your Price (USD)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="publish-price"
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
                <Label htmlFor="publish-description" className="text-sm font-medium">
                  Marketplace Description
                </Label>
                <textarea
                  id="publish-description"
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
                  onClick={() => setShowPublishModal(false)}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
