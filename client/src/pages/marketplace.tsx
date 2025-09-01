import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, apiCall } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Star, Download, Eye, DollarSign, Calendar, User, Tag, Plus, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
// import { toast } from 'sonner'; // Temporarily disabled

interface MarketplaceProject {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  approval_status?: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  rating: string | number;
  reviewCount: number;
  downloadCount: number;
  publishedAt: string;
  builder: {
    id: string;
    name: string;
  };
  mcpServers?: string[];
  popularity_score?: string;
}

interface EnhancedProject {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: string;
  category: string;
  tags: string[];
  llmModel?: {
    id: string;
    name: string;
    displayName: string;
    provider: string;
    model: string;
  };
  prompt?: {
    id: string;
    title: string;
    content: string;
    variables: Record<string, any>;
  };
  knowledgeBase?: {
    id: string;
    name: string;
    type: string;
    documents: any[];
  };
  mcpServers?: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
  }>;
  marketplacePrice?: number;
  marketplaceDescription?: string;
  published: string;
}

interface ProjectDetails {
  overview: string;
  prompt: string;
  files: { name: string; size: string; type: string }[];
  reviews: { rating: number; comment: string; user: string; date: string }[];
}

interface OwnProject extends EnhancedProject {
  createdAt: string;
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<MarketplaceProject | null>(null);
  const [projectDetailsData, setProjectDetailsData] = useState<ProjectDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [activeTab, setActiveTab] = useState('marketplace');

  // Project configuration state for unpublished projects
  const [projectConfig, setProjectConfig] = useState({
    llmModelId: '',
    mcpServerIds: [] as string[],
    promptId: '',
    cost: 0
  });

  // Available options for configuration
  const [availableOptions, setAvailableOptions] = useState({
    llmModels: [] as any[],
    mcpServers: [] as any[],
    prompts: [] as any[]
  });

  // Debug logging for initial state
  console.log('Initial state - searchTerm:', searchTerm, 'selectedCategory:', selectedCategory, 'sortBy:', sortBy, 'activeTab:', activeTab);

  // Debug logging
  console.log('Marketplace Page - User:', user);
  console.log('Marketplace Page - User persona:', user?.persona);

  // Fetch marketplace projects based on persona
  const { data: marketplaceData, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['marketplace-projects', user?.persona],
    queryFn: async () => {
      console.log('Fetching marketplace projects...');
      try {
        const result = await apiCall('/marketplace/projects');
        console.log('Marketplace API response:', result);
        return result;
      } catch (error) {
        console.error('Marketplace API error:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: false,
  });

  // Fetch admin-specific data
  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-marketplace-projects'],
    queryFn: async () => {
      const result = await apiCall('/marketplace/admin/projects');
      return result;
    },
    enabled: !!user && user.persona === 'super_admin',
    retry: false,
  });

  // Fetch builder-specific data
  const { data: builderData, isLoading: builderLoading } = useQuery({
    queryKey: ['builder-marketplace-projects'],
    queryFn: async () => {
      const result = await apiCall('/marketplace/builder/projects');
      return result;
    },
    enabled: !!user && user.persona === 'builder',
    retry: false,
  });

  // Project activation/deactivation mutation
  const activateProjectMutation = useMutation({
    mutationFn: async ({ projectId, status, approval_status }: { projectId: string; status: string; approval_status?: string }) => {
      return apiCall(`/marketplace/admin/projects/${projectId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, approval_status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-projects'] });
      console.log('Project status updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update project status:', error);
    },
  });

  // Project publishing mutation
  const publishProjectMutation = useMutation({
    mutationFn: async ({ projectId, publishData }: { projectId: string; publishData: any }) => {
      return apiCall(`/marketplace/builder/projects/${projectId}/publish`, {
        method: 'POST',
        body: JSON.stringify(publishData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-marketplace-projects'] });
      console.log('Project published successfully. Awaiting admin approval.');
    },
    onError: (error) => {
      console.error('Failed to publish project:', error);
    },
  });

  // Project unpublishing mutation
  const unpublishProjectMutation = useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      return apiCall(`/marketplace/builder/projects/${projectId}/publish`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builder-marketplace-projects'] });
      console.log('Project unpublished successfully.');
    },
    onError: (error) => {
      console.error('Failed to unpublish project:', error);
    },
  });

  // Fetch project details when a project is selected
  const { data: projectDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['project-details', selectedProject?.id],
    queryFn: () => apiCall(`/marketplace/projects/${selectedProject?.id}`),
    enabled: !!selectedProject,
  });

  // Fetch available LLM models
  const { data: llmModelsData } = useQuery({
    queryKey: ['llm-models'],
    queryFn: () => apiCall('/llms/models'),
    enabled: !!user
  });

  // Fetch available MCP servers
  const { data: mcpServersData } = useQuery({
    queryKey: ['mcp-servers'],
    queryFn: () => apiCall('/servers'),
    enabled: !!user
  });

  // Fetch available prompts
  const { data: promptsData } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => apiCall('/prompts'),
    enabled: !!user
  });

  console.log('Marketplace data from query:', marketplaceData);
  console.log('Admin data from query:', adminData);
  console.log('Builder data from query:', builderData);
  const marketplaceProjects = marketplaceData?.data?.projects || [];
  console.log('Extracted projects:', marketplaceProjects);
  console.log('Number of extracted projects:', marketplaceProjects.length);

  // Get projects based on persona
  const getProjectsForPersona = () => {
    if (user?.persona === 'super_admin' && adminData) {
      // For super_admin, show ALL projects (active, inactive, pending) in main view
      const allProjects = [
        ...(adminData.data?.active || []),
        ...(adminData.data?.inactive || []),
        ...(adminData.data?.pending || [])
      ];
      return {
        pending: adminData.data?.pending || [],
        active: adminData.data?.active || [],
        inactive: adminData.data?.inactive || [],
        projects: allProjects, // Show all projects for admin management
      };
    } else if (user?.persona === 'builder' && builderData) {
      // For builders, show marketplace projects and their own unpublished projects
      const ownProjects = builderData.data?.ownProjects || [];
      const marketplaceProjects = builderData.data?.marketplaceProjects || [];
      const ownMarketplaceProjects = builderData.data?.ownMarketplaceProjects || [];

      // Filter own projects to only show unpublished ones
      const unpublishedOwnProjects = ownProjects.filter((project: any) => project.published !== 'true');

      // Convert unpublished own projects to marketplace project format for display
      const ownProjectsForDisplay = unpublishedOwnProjects.map((project: any) => ({
        id: project.id,
        title: project.name,
        description: project.description,
        price: project.marketplacePrice || 0,
        category: project.category || 'general',
        tags: project.tags || [],
        status: 'unpublished',
        approval_status: 'unpublished',
        featured: false,
        rating: 0,
        reviewCount: 0,
        downloadCount: 0,
        publishedAt: project.createdAt,
        builder: {
          id: user.id,
          name: user.email
        },
        mcpServers: project.mcpServers || [],
        isOwnProject: true // Flag to identify own projects
      }));

      return {
        ownProjects: ownProjects,
        marketplaceProjects: marketplaceProjects,
        ownMarketplaceProjects: ownMarketplaceProjects,
        projects: [...marketplaceProjects, ...ownProjectsForDisplay], // Show marketplace projects + own unpublished projects
      };
    } else {
      return {
        projects: marketplaceProjects,
      };
    }
  };

  const projectsForPersona = getProjectsForPersona();
  console.log('Projects for persona:', projectsForPersona);
  console.log('Projects array:', projectsForPersona.projects);

  const filteredProjects = (projectsForPersona.projects || []).filter((project: MarketplaceProject) => {
    console.log('Filtering project:', project.title, 'searchTerm:', searchTerm, 'selectedCategory:', selectedCategory);
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    console.log('Project matches search:', matchesSearch, 'matches category:', matchesCategory);
    return matchesSearch && matchesCategory;
  });

  console.log('Filtered projects:', filteredProjects);
  const sortedProjects = [...filteredProjects].sort((a: MarketplaceProject, b: MarketplaceProject) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return parseFloat(b.rating.toString()) - parseFloat(a.rating.toString());
      case 'downloads':
        return b.downloadCount - a.downloadCount;
      case 'date':
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      default:
        return b.featured ? 1 : -1;
    }
  });
  console.log('Sorted projects:', sortedProjects);

  const handleProjectClick = (project: MarketplaceProject) => {
    setSelectedProject(project);
    // Mock project details for now
    setProjectDetailsData({
      overview: project.description,
      prompt: `Create a ${project.title.toLowerCase()} with the following features: ${project.tags.join(', ')}`,
      files: [
        { name: 'main.js', size: '2.5 KB', type: 'JavaScript' },
        { name: 'styles.css', size: '1.8 KB', type: 'CSS' },
        { name: 'config.json', size: '0.5 KB', type: 'JSON' },
      ],
      reviews: [
        { rating: 5, comment: 'Excellent project! Very well documented.', user: 'John D.', date: '2024-12-15' },
        { rating: 4, comment: 'Great functionality, easy to implement.', user: 'Sarah M.', date: '2024-12-14' },
        { rating: 5, comment: 'Perfect for my needs. Highly recommended!', user: 'Mike R.', date: '2024-12-13' },
      ],
    });
  };

  const handleActivateProject = (projectId: string, status: string, approval_status?: string) => {
    activateProjectMutation.mutate({ projectId, status, approval_status });
  };

  const handlePublishProject = (project: MarketplaceProject) => {
    // For now, we'll show a simple confirmation
    // In a real implementation, this would open a publish form
    if (confirm(`Are you sure you want to publish "${project.title}" to the marketplace?`)) {
      const publishData = {
        title: project.title,
        description: project.description,
        price: project.price,
        category: project.category,
        tags: project.tags,
        mcpServers: project.mcpServers || []
      };

      publishProjectMutation.mutate({
        projectId: project.id,
        publishData
      });
    }
  };

  const handleUnpublishProject = (project: MarketplaceProject) => {
    if (confirm(`Are you sure you want to unpublish "${project.title}" from the marketplace? This will remove it from public view.`)) {
      unpublishProjectMutation.mutate({
        projectId: project.id
      });
    }
  };

  const handleCopyProject = async (project: MarketplaceProject) => {
    try {
      const copyData = {
        name: `${project.title} (Copy)`,
        description: project.description,
        category: project.category,
        tags: project.tags,
        llmModelId: projectConfig.llmModelId,
        mcpServerIds: projectConfig.mcpServerIds,
        promptId: projectConfig.promptId,
        marketplacePrice: projectConfig.cost * 100, // Convert to cents
        published: 'false',
        marketplaceStatus: 'inactive',
        marketplaceApprovalStatus: 'pending'
      };

      const result = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify(copyData)
      });

      if (result.success) {
        console.log('Project copied successfully');
        queryClient.invalidateQueries({ queryKey: ['builder-marketplace-projects'] });
        setSelectedProject(null);
        setProjectConfig({
          llmModelId: '',
          mcpServerIds: [],
          promptId: '',
          cost: 0
        });
      }
    } catch (error) {
      console.error('Failed to copy project:', error);
    }
  };

  const updateProjectConfig = (field: string, value: any) => {
    setProjectConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isProjectPublished = (project: MarketplaceProject) => {
    return project.status === 'active' && project.approval_status === 'approved';
  };

  const isOwnProject = (project: MarketplaceProject) => {
    return project.builder?.id === user?.id;
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      business: 'bg-blue-100 text-blue-800',
      content: 'bg-green-100 text-green-800',
      service: 'bg-purple-100 text-purple-800',
      health: 'bg-red-100 text-red-800',
      education: 'bg-yellow-100 text-yellow-800',
      lifestyle: 'bg-pink-100 text-pink-800',
      finance: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string, approval_status?: string) => {
    if (approval_status === 'pending') {
      return <Badge variant="outline" className="text-orange-600 border-orange-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    } else if (approval_status === 'rejected') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    } else if (status === 'active') {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please log in to access the marketplace.</p>
          <a href="/" className="text-blue-600 hover:text-blue-800">Go to Login</a>
        </div>
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load marketplace data.</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace</h1>
        <p className="text-gray-600">
          {user.persona === 'super_admin' && 'Manage all marketplace projects and approve new submissions'}
          {user.persona === 'builder' && 'Browse marketplace projects and publish your own creations'}
          {user.persona === 'end_user' && 'Discover and purchase amazing projects from our community'}
        </p>
      </div>

      {/* Persona-specific tabs */}
      {(user.persona === 'super_admin' || user.persona === 'builder') && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className={`grid w-full ${user.persona === 'super_admin' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            {user.persona === 'super_admin' && <TabsTrigger value="pending">Pending Approval</TabsTrigger>}
            {user.persona === 'super_admin' && <TabsTrigger value="active">Active Projects</TabsTrigger>}
            {user.persona === 'builder' && <TabsTrigger value="my-projects">My Projects</TabsTrigger>}
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            {/* Filters and Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="downloads">Most Downloaded</SelectItem>
                  <SelectItem value="date">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Projects Grid */}
            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No projects found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProjects.map((project: MarketplaceProject) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(project.status, project.approval_status)}
                            <Badge variant={project.featured ? "default" : "secondary"} className="text-xs">
                              {project.featured ? 'Featured' : project.category}
                            </Badge>
                            {project.featured && (
                              <Badge variant="outline" className="text-xs">
                                {project.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatPrice(project.price)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{project.rating}</span>
                          <span>({project.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          <span>{project.downloadCount}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleProjectClick(project)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{project.title}</DialogTitle>
                              <DialogDescription>
                                {project.description}
                              </DialogDescription>
                            </DialogHeader>

                            {detailsLoading ? (
                              <div className="space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-20 bg-gray-200 rounded"></div>
                                <div className="h-32 bg-gray-200 rounded"></div>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* Project Overview */}
                                <div>
                                  <h3 className="font-semibold mb-2">Overview</h3>
                                  <p className="text-gray-600">{project.description}</p>
                                </div>

                                {/* Project Configuration Section */}
                                <div className="border-t pt-4">
                                  <h3 className="font-semibold mb-4">Project Configuration</h3>

                                  {/* LLM Model Selection */}
                                  <div className="mb-4">
                                    <Label className="text-sm font-medium">AI Model</Label>
                                    {isProjectPublished(project) ? (
                                      <div className="bg-blue-50 p-3 rounded mt-1">
                                        <div className="font-medium">GPT-4 (OpenAI)</div>
                                        <div className="text-sm text-gray-600">Provider: OpenAI | Model: GPT-4</div>
                                      </div>
                                    ) : (
                                      <Select
                                        value={projectConfig.llmModelId}
                                        onValueChange={(value) => updateProjectConfig('llmModelId', value)}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue placeholder="Select AI Model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {llmModelsData?.data?.models?.map((model: any) => (
                                            <SelectItem key={model.id} value={model.id}>
                                              {model.displayName || model.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>

                                  {/* MCP Servers Selection */}
                                  <div className="mb-4">
                                    <Label className="text-sm font-medium">MCP Servers</Label>
                                    {isProjectPublished(project) ? (
                                      <div className="bg-orange-50 p-3 rounded mt-1">
                                        <div className="font-medium">Gmail, Calendar, Drive</div>
                                        <div className="text-sm text-gray-600">3 servers connected</div>
                                      </div>
                                    ) : (
                                      <div className="mt-1">
                                        <Select
                                          value={projectConfig.mcpServerIds[0] || ''}
                                          onValueChange={(value) => updateProjectConfig('mcpServerIds', [value])}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select MCP Servers" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {mcpServersData?.data?.servers?.map((server: any) => (
                                              <SelectItem key={server.id} value={server.id}>
                                                {server.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>

                                  {/* Prompt Selection */}
                                  <div className="mb-4">
                                    <Label className="text-sm font-medium">Prompt Template</Label>
                                    {isProjectPublished(project) ? (
                                      <div className="bg-green-50 p-3 rounded mt-1">
                                        <div className="font-medium">Customer Service Assistant</div>
                                        <div className="text-sm text-gray-600">Professional customer support prompt</div>
                                      </div>
                                    ) : (
                                      <Select
                                        value={projectConfig.promptId}
                                        onValueChange={(value) => updateProjectConfig('promptId', value)}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue placeholder="Select Prompt Template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {promptsData?.data?.prompts?.map((prompt: any) => (
                                            <SelectItem key={prompt.id} value={prompt.id}>
                                              {prompt.title || prompt.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>

                                  {/* Cost Input */}
                                  <div className="mb-4">
                                    <Label className="text-sm font-medium">App Cost (USD)</Label>
                                    {isProjectPublished(project) ? (
                                      <div className="bg-green-50 p-3 rounded mt-1">
                                        <div className="font-medium">${(project.price / 100).toFixed(2)}</div>
                                        <div className="text-sm text-gray-600">Final price set</div>
                                      </div>
                                    ) : (
                                      <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={projectConfig.cost}
                                        onChange={(e) => updateProjectConfig('cost', parseFloat(e.target.value) || 0)}
                                        className="mt-1"
                                        min="0"
                                        step="0.01"
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Project Details */}
                                {projectDetailsData && (
                                  <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-4">Project Details</h3>

                                    {/* Files */}
                                    {projectDetailsData.files && projectDetailsData.files.length > 0 && (
                                      <div className="mb-4">
                                        <h4 className="font-medium mb-2">Files</h4>
                                        <div className="space-y-2">
                                          {projectDetailsData.files.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                              <span className="font-mono text-sm">{file.name}</span>
                                              <span className="text-xs text-gray-500">{file.size}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Reviews */}
                                    {projectDetailsData.reviews && projectDetailsData.reviews.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2">Reviews</h4>
                                        <div className="space-y-3">
                                          {projectDetailsData.reviews.map((review, index) => (
                                            <div key={index} className="border-l-2 border-gray-200 pl-3">
                                              <div className="flex items-center gap-2 mb-1">
                                                <div className="flex items-center">
                                                  {[...Array(5)].map((_, i) => (
                                                    <Star
                                                      key={i}
                                                      className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                    />
                                                  ))}
                                                </div>
                                                <span className="text-sm font-medium">{review.user}</span>
                                                <span className="text-xs text-gray-500">{review.date}</span>
                                              </div>
                                              <p className="text-sm text-gray-600">{review.comment}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="border-t pt-4 flex gap-2">
                                  {user?.persona === 'builder' && isOwnProject(project) && (
                                    <>
                                      {!isProjectPublished(project) ? (
                                        <Button
                                          onClick={() => handlePublishProject(project)}
                                          className="flex-1"
                                        >
                                          <Plus className="w-4 h-4 mr-1" />
                                          Publish
                                        </Button>
                                      ) : (
                                        <Button
                                          onClick={() => handleUnpublishProject(project)}
                                          variant="outline"
                                          className="flex-1"
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Unpublish
                                        </Button>
                                      )}

                                      <Button
                                        onClick={() => handleCopyProject(project)}
                                        variant="outline"
                                        className="flex-1"
                                      >
                                        <Settings className="w-4 h-4 mr-1" />
                                        Copy
                                      </Button>
                                    </>
                                  )}

                                  {user?.persona === 'end_user' && (
                                    <Button className="flex-1">
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      Purchase
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {user.persona === 'end_user' && (
                          <Button size="sm" className="flex-1">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Purchase
                          </Button>
                        )}

                        {user.persona === 'builder' && project.builder?.id === user.id && (
                          <Button
                            variant={project.status === 'unpublished' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => project.status === 'unpublished' ? handlePublishProject(project) : handleUnpublishProject(project)}
                            disabled={publishProjectMutation.isPending || unpublishProjectMutation.isPending}
                          >
                            {project.status === 'unpublished' ? (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Publish
                              </>
                            ) : (
                              <>
                                <Settings className="w-4 h-4 mr-1" />
                                Unpublish
                              </>
                            )}
                          </Button>
                        )}

                        {user.persona === 'super_admin' && (
                          <Button
                            variant={project.status === 'active' ? 'destructive' : 'default'}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleActivateProject(
                              project.id,
                              project.status === 'active' ? 'inactive' : 'active',
                              project.approval_status === 'pending' ? 'approved' : undefined
                            )}
                            disabled={activateProjectMutation.isPending}
                          >
                            {project.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Admin-specific tabs */}
          {user.persona === 'super_admin' && (
            <>
              <TabsContent value="pending">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4">Projects Pending Approval</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(projectsForPersona.pending || []).map((project: MarketplaceProject) => (
                      <Card key={project.id} className="border-orange-200">
                        <CardHeader>
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(project.status, project.approval_status)}
                            <Badge variant="outline" className="text-xs">
                              {project.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {project.description}
                          </p>
                          <div className="text-2xl font-bold text-green-600 mb-4">
                            {formatPrice(project.price)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleActivateProject(project.id, 'active', 'approved')}
                              disabled={activateProjectMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleActivateProject(project.id, 'inactive', 'rejected')}
                              disabled={activateProjectMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="active">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4">Active Projects</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(projectsForPersona.active || []).map((project: MarketplaceProject) => (
                      <Card key={project.id} className="border-green-200">
                        <CardHeader>
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(project.status, project.approval_status)}
                            <Badge variant="outline" className="text-xs">
                              {project.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {project.description}
                          </p>
                          <div className="text-2xl font-bold text-green-600 mb-4">
                            {formatPrice(project.price)}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => handleActivateProject(project.id, 'inactive')}
                            disabled={activateProjectMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Deactivate
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </>
          )}

          {/* Builder-specific tabs */}
          {user.persona === 'builder' && (
            <TabsContent value="my-projects">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">My Projects</h2>
                <p className="text-gray-600 mb-6">Manage your projects and publish them to the marketplace.</p>

                {/* Show both own projects and own marketplace projects */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Own unpublished projects */}
                  {(projectsForPersona.ownProjects || []).filter((project: any) => project.published !== 'true').map((project: any) => (
                    <Card key={`own-${project.id}`} className="border-blue-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                Draft
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {project.category || 'General'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-600">
                              {project.marketplacePrice ? formatPrice(project.marketplacePrice) : 'Not Set'}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {project.description}
                        </p>

                        {/* Show project components */}
                        <div className="space-y-2 mb-4">
                          {project.llm && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Settings className="w-3 h-3" />
                              <span>AI Model: {project.llm}</span>
                            </div>
                          )}
                          {project.mcpServers && project.mcpServers.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <User className="w-3 h-3" />
                              <span>MCP: {project.mcpServers.length} servers</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handlePublishProject({
                              id: project.id,
                              title: project.name,
                              description: project.description,
                              price: project.marketplacePrice || 0,
                              category: project.category || 'general',
                              tags: project.tags || [],
                              status: 'unpublished',
                              approval_status: 'unpublished',
                              featured: false,
                              rating: 0,
                              reviewCount: 0,
                              downloadCount: 0,
                              publishedAt: project.createdAt,
                              builder: { id: user.id, name: user.email },
                              mcpServers: project.mcpServers || [],
                              isOwnProject: true
                            })}
                            disabled={publishProjectMutation.isPending}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Publish to Marketplace
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Own published marketplace projects */}
                  {(projectsForPersona.ownMarketplaceProjects || []).map((project: MarketplaceProject) => (
                    <Card key={`marketplace-${project.id}`} className="border-green-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(project.status, project.approval_status)}
                              <Badge variant="outline" className="text-xs">
                                {project.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatPrice(project.price)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {project.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span>{project.rating}</span>
                            <span>({project.reviewCount})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            <span>{project.downloadCount}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUnpublishProject(project)}
                            disabled={unpublishProjectMutation.isPending}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Unpublish
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Show message if no projects */}
                {(projectsForPersona.ownProjects || []).filter((project: any) => project.published !== 'true').length === 0 &&
                  (projectsForPersona.ownMarketplaceProjects || []).length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">You don't have any projects yet.</p>
                      <p className="text-gray-400 text-sm mt-2">Create a new project to get started!</p>
                    </div>
                  )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* End User View (no tabs) */}
      {user.persona === 'end_user' && (
        <>
          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="downloads">Most Downloaded</SelectItem>
                <SelectItem value="date">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects Grid */}
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No projects found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProjects.map((project: MarketplaceProject) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={project.featured ? "default" : "secondary"} className="text-xs">
                            {project.featured ? 'Featured' : project.category}
                          </Badge>
                          {project.featured && (
                            <Badge variant="outline" className="text-xs">
                              {project.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(project.price)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{project.rating}</span>
                        <span>({project.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        <span>{project.downloadCount}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.tags.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleProjectClick(project)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{project.title}</DialogTitle>
                            <DialogDescription>
                              {project.description}
                            </DialogDescription>
                          </DialogHeader>

                          {detailsLoading ? (
                            <div className="space-y-4">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-20 bg-gray-200 rounded"></div>
                              <div className="h-32 bg-gray-200 rounded"></div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {/* Project Overview */}
                              <div>
                                <h3 className="font-semibold mb-2">Overview</h3>
                                <p className="text-gray-600">{project.description}</p>
                              </div>

                              {/* Project Configuration Section */}
                              <div className="border-t pt-4">
                                <h3 className="font-semibold mb-4">Project Configuration</h3>

                                {/* LLM Model Selection */}
                                <div className="mb-4">
                                  <Label className="text-sm font-medium">AI Model</Label>
                                  {isProjectPublished(project) ? (
                                    <div className="bg-blue-50 p-3 rounded mt-1">
                                      <div className="font-medium">GPT-4 (OpenAI)</div>
                                      <div className="text-sm text-gray-600">Provider: OpenAI | Model: GPT-4</div>
                                    </div>
                                  ) : (
                                    <Select
                                      value={projectConfig.llmModelId}
                                      onValueChange={(value) => updateProjectConfig('llmModelId', value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select AI Model" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {llmModelsData?.data?.models?.map((model: any) => (
                                          <SelectItem key={model.id} value={model.id}>
                                            {model.displayName || model.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>

                                {/* MCP Servers Selection */}
                                <div className="mb-4">
                                  <Label className="text-sm font-medium">MCP Servers</Label>
                                  {isProjectPublished(project) ? (
                                    <div className="bg-orange-50 p-3 rounded mt-1">
                                      <div className="font-medium">Gmail, Calendar, Drive</div>
                                      <div className="text-sm text-gray-600">3 servers connected</div>
                                    </div>
                                  ) : (
                                    <div className="mt-1">
                                      <Select
                                        value={projectConfig.mcpServerIds[0] || ''}
                                        onValueChange={(value) => updateProjectConfig('mcpServerIds', [value])}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select MCP Servers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {mcpServersData?.data?.servers?.map((server: any) => (
                                            <SelectItem key={server.id} value={server.id}>
                                              {server.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                </div>

                                {/* Prompt Selection */}
                                <div className="mb-4">
                                  <Label className="text-sm font-medium">Prompt Template</Label>
                                  {isProjectPublished(project) ? (
                                    <div className="bg-green-50 p-3 rounded mt-1">
                                      <div className="font-medium">Customer Service Assistant</div>
                                      <div className="text-sm text-gray-600">Professional customer support prompt</div>
                                    </div>
                                  ) : (
                                    <Select
                                      value={projectConfig.promptId}
                                      onValueChange={(value) => updateProjectConfig('promptId', value)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select Prompt Template" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {promptsData?.data?.prompts?.map((prompt: any) => (
                                          <SelectItem key={prompt.id} value={prompt.id}>
                                            {prompt.title || prompt.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>

                                {/* Cost Input */}
                                <div className="mb-4">
                                  <Label className="text-sm font-medium">App Cost (USD)</Label>
                                  {isProjectPublished(project) ? (
                                    <div className="bg-green-50 p-3 rounded mt-1">
                                      <div className="font-medium">${(project.price / 100).toFixed(2)}</div>
                                      <div className="text-sm text-gray-600">Final price set</div>
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      value={projectConfig.cost}
                                      onChange={(e) => updateProjectConfig('cost', parseFloat(e.target.value) || 0)}
                                      className="mt-1"
                                      min="0"
                                      step="0.01"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Project Details */}
                              {projectDetailsData && (
                                <div className="border-t pt-4">
                                  <h3 className="font-semibold mb-4">Project Details</h3>

                                  {/* Files */}
                                  {projectDetailsData.files && projectDetailsData.files.length > 0 && (
                                    <div className="mb-4">
                                      <h4 className="font-medium mb-2">Files</h4>
                                      <div className="space-y-2">
                                        {projectDetailsData.files.map((file, index) => (
                                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span className="font-mono text-sm">{file.name}</span>
                                            <span className="text-xs text-gray-500">{file.size}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Reviews */}
                                  {projectDetailsData.reviews && projectDetailsData.reviews.length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-2">Reviews</h4>
                                      <div className="space-y-3">
                                        {projectDetailsData.reviews.map((review, index) => (
                                          <div key={index} className="border-l-2 border-gray-200 pl-3">
                                            <div className="flex items-center gap-2 mb-1">
                                              <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                  <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                  />
                                                ))}
                                              </div>
                                              <span className="text-sm font-medium">{review.user}</span>
                                              <span className="text-xs text-gray-500">{review.date}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{review.comment}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="border-t pt-4 flex gap-2">
                                {user?.persona === 'builder' && isOwnProject(project) && (
                                  <>
                                    {!isProjectPublished(project) ? (
                                      <Button
                                        onClick={() => handlePublishProject(project)}
                                        className="flex-1"
                                      >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Publish
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={() => handleUnpublishProject(project)}
                                        variant="outline"
                                        className="flex-1"
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Unpublish
                                      </Button>
                                    )}

                                    <Button
                                      onClick={() => handleCopyProject(project)}
                                      variant="outline"
                                      className="flex-1"
                                      disabled={!projectConfig.llmModelId || !projectConfig.mcpServerIds.length || !projectConfig.promptId || projectConfig.cost <= 0}
                                    >
                                      <Settings className="w-4 h-4 mr-1" />
                                      Copy
                                    </Button>
                                  </>
                                )}

                                {user?.persona === 'end_user' && (
                                  <Button className="flex-1">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Purchase
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button size="sm" className="flex-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Purchase
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
