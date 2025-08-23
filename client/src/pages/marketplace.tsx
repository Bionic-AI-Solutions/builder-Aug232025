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

// Mock project data for Super Admin details panel
const mockProjectData = {
  "demo-1": {
    id: "demo-1",
    name: "E-commerce Store",
    description: "Complete e-commerce solution with payment processing, inventory management, and customer analytics",
    prompt: "Create a comprehensive e-commerce platform with the following features:\n- Product catalog with categories and search\n- Shopping cart and checkout process\n- Payment gateway integration (Stripe/PayPal)\n- Order management and tracking\n- Customer account management\n- Inventory tracking and alerts\n- Sales analytics and reporting\n- Mobile-responsive design\n- Admin dashboard for store management",
    llm: "claude",
    mcpServers: ["database", "payment", "analytics", "email"],
    files: [
      { name: "E-commerce Requirements", size: "15.7kb", type: "markdown" },
      { name: "Database Schema", size: "8.3kb", type: "sql" },
      { name: "API Documentation", size: "12.1kb", type: "markdown" },
      { name: "UI Components", size: "6.8kb", type: "typescript" },
      { name: "Payment Integration", size: "9.2kb", type: "javascript" },
    ],
    status: "completed",
    revenue: 4900,
    revenueGrowth: 18,
    published: "true",
    createdAt: "2024-12-15T10:30:00Z",
    builder: {
      name: "John Builder",
      email: "john@example.com",
      id: "builder-1"
    },
    implementations: 23,
    totalRevenue: 8900,
  },
  "demo-2": {
    id: "demo-2",
    name: "Blog Platform",
    description: "Modern blogging platform with content management and analytics",
    prompt: "Build a modern blogging platform with:\n- Rich text editor with markdown support\n- Content categorization and tagging\n- SEO optimization features\n- Comment system with moderation\n- User authentication and roles\n- Analytics dashboard\n- RSS feed generation\n- Social media integration\n- Mobile app for content creation",
    llm: "gpt4",
    mcpServers: ["database", "search", "analytics", "storage"],
    files: [
      { name: "Blog Requirements", size: "11.2kb", type: "markdown" },
      { name: "Content Schema", size: "5.8kb", type: "json" },
      { name: "Editor Components", size: "7.4kb", type: "typescript" },
      { name: "SEO Implementation", size: "4.9kb", type: "javascript" },
    ],
    status: "completed",
    revenue: 2900,
    revenueGrowth: 12,
    published: "true",
    createdAt: "2024-12-10T14:20:00Z",
    builder: {
      name: "Sarah Developer",
      email: "sarah@example.com",
      id: "builder-2"
    },
    implementations: 18,
    totalRevenue: 6700,
  },
  "demo-3": {
    id: "demo-3",
    name: "Booking System",
    description: "Appointment booking system with calendar integration",
    prompt: "Create an appointment booking system featuring:\n- Interactive calendar interface\n- Time slot management and availability\n- Customer booking flow\n- Email notifications and reminders\n- Admin dashboard for scheduling\n- Payment processing for deposits\n- Calendar sync (Google, Outlook)\n- Mobile-responsive design\n- Multi-location support\n- Reporting and analytics",
    llm: "claude",
    mcpServers: ["database", "calendar", "email", "payment"],
    files: [
      { name: "Booking Requirements", size: "13.5kb", type: "markdown" },
      { name: "Calendar Integration", size: "8.7kb", type: "javascript" },
      { name: "Notification System", size: "6.2kb", type: "typescript" },
      { name: "Payment Flow", size: "5.9kb", type: "javascript" },
      { name: "Admin Dashboard", size: "9.1kb", type: "typescript" },
    ],
    status: "completed",
    revenue: 3900,
    revenueGrowth: 25,
    published: "true",
    createdAt: "2024-12-08T09:15:00Z",
    builder: {
      name: "Mike Creator",
      email: "mike@example.com",
      id: "builder-3"
    },
    implementations: 32,
    totalRevenue: 5400,
  },
};

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

  const { data: apps = [], isLoading } = useQuery<MarketplaceApp[]>({
    queryKey: ["/api/marketplace"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace");
      return response.json();
    },
  });

  // Add some demo marketplace apps for display
  const demoApps = [
    {
      id: "demo-1",
      name: "E-commerce Store",
      description: "Complete e-commerce solution",
      price: 4900,
      rating: "4.8",
      downloads: 1200,
      category: "business",
      icon: "⚡",
      status: appStatus["demo-1"] || "active",
    },
    {
      id: "demo-2",
      name: "Blog Platform",
      description: "Modern blogging platform",
      price: 2900,
      rating: "4.6",
      downloads: 890,
      category: "content",
      icon: "📊",
      status: appStatus["demo-2"] || "active",
    },
    {
      id: "demo-3",
      name: "Booking System",
      description: "Appointment booking system",
      price: 3900,
      rating: "4.9",
      downloads: 2100,
      category: "service",
      icon: "💬",
      status: appStatus["demo-3"] || "hold",
    },
  ];

  const allApps = [...demoApps, ...apps];

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
                          
                          {selectedApp && mockProjectData[selectedApp] && (
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                                <TabsTrigger value="files">Files</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">Builder:</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-6">
                                      {mockProjectData[selectedApp].builder.name} ({mockProjectData[selectedApp].builder.email})
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Brain className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">LLM:</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-6">
                                      {mockProjectData[selectedApp].llm.toUpperCase()}
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">Created:</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-6">
                                      {new Date(mockProjectData[selectedApp].createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">Revenue:</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-6">
                                      {formatPrice(mockProjectData[selectedApp].totalRevenue)}
                                    </p>
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Server className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">MCP Servers:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 ml-6">
                                    {mockProjectData[selectedApp].mcpServers.map((server, index) => (
                                      <Badge key={index} variant="outline">
                                        {server}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="prompt" className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">Original Prompt:</span>
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-lg border">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                      {mockProjectData[selectedApp].prompt}
                                    </pre>
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="files" className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">Generated Files:</span>
                                  </div>
                                  <div className="space-y-2">
                                    {mockProjectData[selectedApp].files.map((file, index) => (
                                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                          <FileText className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium">{file.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {file.type}
                                          </Badge>
                                          <span className="text-sm text-muted-foreground">
                                            {file.size}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="analytics" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Implementations</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">
                                        {mockProjectData[selectedApp].implementations}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Active implementations
                                      </p>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Total Revenue</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">
                                        {formatPrice(mockProjectData[selectedApp].totalRevenue)}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Platform earnings
                                      </p>
                                    </CardContent>
                                  </Card>
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
