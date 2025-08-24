import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, apiCall } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Star, Download, Eye, DollarSign, Calendar, User, Tag } from 'lucide-react';

interface MarketplaceProject {
  id: string;
  projectId: string;
  builderId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  featured: boolean;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  revenue: number;
  publishedAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
  builderName?: string;
}

interface ProjectDetails {
  overview: string;
  prompt: string;
  files: { name: string; size: string; type: string }[];
  reviews: { rating: number; comment: string; user: string; date: string }[];
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<MarketplaceProject | null>(null);
  const [projectDetailsData, setProjectDetailsData] = useState<ProjectDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  // Debug logging
  console.log('Marketplace Page - User:', user);
  console.log('Marketplace Page - User persona:', user?.persona);

  // Fetch marketplace projects
  const { data: marketplaceData, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['marketplace-projects'],
    queryFn: async () => {
      console.log('Fetching marketplace projects...');
      console.log('User token:', localStorage.getItem('auth-token') ? 'exists' : 'not found');
      try {
        const result = await apiCall('/marketplace/projects');
        console.log('Marketplace API response:', result);
        console.log('Marketplace API data:', result.data);
        console.log('Marketplace projects array:', result.data?.projects);
        console.log('Number of projects:', result.data?.projects?.length);
        return result;
      } catch (error) {
        console.error('Marketplace API error:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: false,
  });

  // Fetch project details when a project is selected
  const { data: projectDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['project-details', selectedProject?.id],
    queryFn: () => apiCall(`/marketplace/projects/${selectedProject?.id}`),
    enabled: !!selectedProject,
  });

  console.log('Marketplace data from query:', marketplaceData);
  const marketplaceProjects = marketplaceData?.data?.projects || [];
  console.log('Extracted projects:', marketplaceProjects);
  console.log('Number of extracted projects:', marketplaceProjects.length);
  const filteredProjects = marketplaceProjects.filter((project: MarketplaceProject) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProjects = [...filteredProjects].sort((a: MarketplaceProject, b: MarketplaceProject) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'downloads':
        return b.downloadCount - a.downloadCount;
      case 'date':
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      default:
        return b.featured ? 1 : -1;
    }
  });

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

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      business: 'bg-blue-100 text-blue-800',
      content: 'bg-green-100 text-green-800',
      service: 'bg-purple-100 text-purple-800',
      health: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
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
        <p className="text-gray-600">Discover and purchase amazing projects from our community</p>
      </div>

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
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                      ) : projectDetailsData ? (
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-semibold mb-2">Overview</h3>
                            <p className="text-gray-600">{projectDetailsData.overview}</p>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">Prompt</h3>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded">{projectDetailsData.prompt}</p>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">Files</h3>
                            <div className="space-y-2">
                              {projectDetailsData.files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="font-mono text-sm">{file.name}</span>
                                  <span className="text-xs text-gray-500">{file.size}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">Reviews</h3>
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
                        </div>
                      ) : null}
                    </DialogContent>
                  </Dialog>

                  {user.persona === 'end_user' && (
                    <Button size="sm" className="flex-1">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Purchase
                    </Button>
                  )}

                  {user.persona === 'super_admin' && (
                    <Button
                      variant={project.status === 'active' ? 'destructive' : 'default'}
                      size="sm"
                      className="flex-1"
                    >
                      {project.status === 'active' ? 'Hold' : 'Activate'}
                    </Button>
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
