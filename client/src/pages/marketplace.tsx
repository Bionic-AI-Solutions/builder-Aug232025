import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { type MarketplaceApp } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import {
  Search,
  Download,
  Eye,
  Star,
  Store,
  Pause,
  Play,
  AlertTriangle,
  Code,
  FileText,
  Server,
  Brain,
  Calendar,
  User,
  DollarSign
} from "lucide-react";

const categories = [
  { id: "all", name: "All" },
  { id: "business", name: "Business" },
  { id: "content", name: "Content" },
  { id: "service", name: "Service" },
  { id: "custom", name: "Custom" },
];

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<Record<string, 'active' | 'hold'>>({
    "demo-1": "active",
    "demo-2": "active",
    "demo-3": "hold"
  });
  const { persona } = useAuth();

  // Fetch all projects and filter for published ones
  const { data: allProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/all-projects"],
    queryFn: async () => {
      const response = await fetch("/api/all-projects");
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 3,
  });

  // Filter for published projects and transform to marketplace format
  const publishedProjects = allProjects
    .filter((project: any) => project.published === "true")
    .map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description || project.marketplaceDescription || "No description available",
      price: project.marketplacePrice ? Math.round(project.marketplacePrice * 100) : 0, // Convert to cents
      rating: "4.5", // Default rating
      downloads: Math.floor(Math.random() * 1000) + 100, // Random downloads for demo
      category: "business", // Default category
      icon: "⚡",
      status: "active",
      project: project, // Keep reference to original project data
    }));

  const { data: apps = [], isLoading } = useQuery<MarketplaceApp[]>({
    queryKey: ["/api/marketplace"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace");
      return response.json();
    },
  });

  // Combine published projects with any additional marketplace apps
  const allApps = [...publishedProjects, ...apps];

  const filteredApps = allApps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(0)}`;
  };

  const formatDownloads = (downloads: number | null) => {
    if (!downloads) return "0";
    if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}K`;
    }
    return downloads.toString();
  };

  const handleStatusToggle = (appId: string) => {
    setAppStatus(prev => ({
      ...prev,
      [appId]: prev[appId] === 'active' ? 'hold' : 'active'
    }));
  };

  const getStatusBadge = (status: string) => {
    if (status === 'hold') {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <Pause className="w-3 h-3" />
        On Hold
      </Badge>;
    }
    return <Badge variant="default" className="flex items-center gap-1">
      <Play className="w-3 h-3" />
      Active
    </Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketplace</h2>
          {persona === 'super_admin' && (
            <p className="text-sm text-muted-foreground mt-1">
              Super Admin Mode - Manage app availability and view detailed project information
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search apps..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-apps"
            />
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex space-x-2 overflow-x-auto">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap"
            data-testid={`filter-${category.id}`}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Apps Grid */}
      {filteredApps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Store size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No apps found</h3>
            <p className="text-gray-600">Try adjusting your search or category filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow border border-gray-100">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{app.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900" data-testid={`app-name-${app.id}`}>
                    {app.name}
                  </h3>
                  {app.description && (
                    <p className="text-sm text-gray-600 mt-1">{app.description}</p>
                  )}
                  {/* Status badge for Super Admin */}
                  {persona === 'super_admin' && (
                    <div className="mt-2">
                      {getStatusBadge(app.status)}
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(app.price)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star size={16} className="text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{app.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {formatDownloads(app.downloads)} Downloads
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {app.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {persona === 'super_admin' ? (
                    <>
                      <Button
                        variant={appStatus[app.id] === 'active' ? 'destructive' : 'default'}
                        className="flex-1"
                        size="sm"
                        onClick={() => handleStatusToggle(app.id)}
                        data-testid={`button-status-${app.id}`}
                      >
                        {appStatus[app.id] === 'active' ? (
                          <>
                            <Pause size={16} className="mr-1" />
                            Hold
                          </>
                        ) : (
                          <>
                            <Play size={16} className="mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1"
                            size="sm"
                            onClick={() => setSelectedApp(app.id)}
                            data-testid={`button-details-${app.id}`}
                          >
                            <Eye size={16} className="mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Code className="w-5 h-5" />
                              Project Details: {app.name}
                            </DialogTitle>
                            <DialogDescription>
                              Comprehensive project information and configuration details
                            </DialogDescription>
                          </DialogHeader>

                          {selectedApp && (
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                                <TabsTrigger value="files">Files</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                              </TabsList>

                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-700">Builder</h4>
                                    <p className="text-sm text-gray-600">User ID: {allApps.find(app => app.id === selectedApp)?.project?.userId || "Unknown"}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-700">LLM</h4>
                                    <p className="text-sm text-gray-600">{allApps.find(app => app.id === selectedApp)?.project?.llm || "Not specified"}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-700">Created</h4>
                                    <p className="text-sm text-gray-600">
                                      {allApps.find(app => app.id === selectedApp)?.project?.createdAt
                                        ? new Date(allApps.find(app => app.id === selectedApp)?.project?.createdAt).toLocaleDateString()
                                        : "Unknown"
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-700">Revenue</h4>
                                    <p className="text-sm text-gray-600">
                                      ${((allApps.find(app => app.id === selectedApp)?.project?.revenue || 0) / 100).toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700 mb-2">MCP Servers</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {allApps.find(app => app.id === selectedApp)?.project?.mcpServers?.map((server: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        <Server size={12} className="mr-1" />
                                        {server}
                                      </Badge>
                                    )) || <span className="text-sm text-gray-500">No MCP servers configured</span>}
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="prompt" className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Original Prompt</h4>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                                      {allApps.find(app => app.id === selectedApp)?.project?.prompt || "No prompt available"}
                                    </pre>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="files" className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Knowledge Files</h4>
                                  <div className="space-y-2">
                                    {allApps.find(app => app.id === selectedApp)?.project?.files?.map((file: any, index: number) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center">
                                          <FileText size={16} className="mr-2 text-gray-500" />
                                          <span className="text-sm">{file.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{file.size}</span>
                                      </div>
                                    )) || <span className="text-sm text-gray-500">No knowledge files uploaded</span>}
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="analytics" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-700">Implementations</h4>
                                    <p className="text-2xl font-bold text-blue-600">
                                      {Math.floor(Math.random() * 50) + 10}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-700">Total Revenue</h4>
                                    <p className="text-2xl font-bold text-green-600">
                                      ${((allApps.find(app => app.id === selectedApp)?.project?.revenue || 0) / 100).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <>
                      <Button
                        className="flex-1"
                        size="sm"
                        data-testid={`button-install-${app.id}`}
                      >
                        <Download size={16} className="mr-1" />
                        Install
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        data-testid={`button-details-${app.id}`}
                      >
                        <Eye size={16} className="mr-1" />
                        Details
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
