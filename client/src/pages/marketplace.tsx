import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type MarketplaceApp } from "@shared/schema";
import { Search, Download, Eye, Star, Store } from "lucide-react";

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
        <h2 className="text-2xl font-bold text-gray-900">Marketplace</h2>
        
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
