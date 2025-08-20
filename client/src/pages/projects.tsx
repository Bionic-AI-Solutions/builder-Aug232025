import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { type Project } from "@shared/schema";
import { Eye, MessageCircle, Calendar, Cpu, FileText } from "lucide-react";
import ProjectDetailsModal from "@/components/modals/project-details-modal";
import ChatAppModal from "@/components/modals/chat-app-modal";

export default function Projects() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch(`/api/projects?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
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

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleChatWithApp = (project: Project) => {
    setSelectedProject(project);
    setShowChatModal(true);
  };

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === "completed").length,
    inDev: projects.filter(p => p.status !== "completed").length,
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

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="bg-white rounded-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <div className="text-sm text-gray-600 space-x-4">
            <span>Total: <span className="font-semibold" data-testid="stat-total">{stats.total}</span></span>
            <span>Completed: <span className="font-semibold text-green-600" data-testid="stat-completed">{stats.completed}</span></span>
            <span>In Development: <span className="font-semibold text-orange-600" data-testid="stat-in-dev">{stats.inDev}</span></span>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600">Start building your first app in the Chat Development section.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900" data-testid={`project-name-${project.id}`}>
                    {project.name}
                  </h3>
                  {getStatusBadge(project.status)}
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    <span>Generated: {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  <div className="flex items-center">
                    <Cpu size={16} className="mr-2" />
                    <span>LLM: {project.llm.charAt(0).toUpperCase() + project.llm.slice(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText size={16} className="mr-2" />
                    <span>Files: {project.files?.length || 0} files ({
                      project.files?.reduce((total, file) => {
                        const size = parseFloat(file.size.replace(/[^\d.]/g, ''));
                        return total + size;
                      }, 0).toFixed(1) || 0
                    }kb)</span>
                  </div>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}
