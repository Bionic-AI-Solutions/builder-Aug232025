import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiCall } from "@/lib/auth";
import LLMProviderModal from "@/components/modals/llm-provider-modal";
import {
    Brain,
    Zap,
    Server,
    Globe,
    Cloud,
    Database,
    Settings,
    TestTube,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Play,
    Pause,
    RefreshCw,
    ExternalLink,
    Copy,
    Edit,
    Trash2,
    Plus,
    Search,
    Filter,
    SortAsc,
    SortDesc
} from "lucide-react";

interface LLMProvider {
    id: string;
    name: string;
    type: 'cloud' | 'local';
    status: 'active' | 'inactive' | 'configured' | 'error';
    models: LLMModel[];
    baseUrl?: string;
    apiKey?: string;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

interface LLMModel {
    id: string;
    name: string;
    provider: string;
    type: 'chat' | 'completion' | 'embedding';
    status: 'available' | 'unavailable' | 'testing';
    contextLength?: number;
    maxTokens?: number;
    pricing?: {
        input: string;
        output: string;
    };
    capabilities: string[];
}

export default function LLMsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("name");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);

    // Fetch LLM providers
    const { data: llmData, isLoading, error } = useQuery({
        queryKey: ["llm-providers"],
        queryFn: async () => {
            console.log('Fetching LLM providers...');
            const result = await apiCall('/llms/providers');
            console.log('LLM providers response:', result);
            return result;
        },
    });

    const llmProviders: LLMProvider[] = llmData?.data?.providers || [];

    // Filter providers based on search and filters
    const filteredProviders = llmProviders.filter((provider) => {
        const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            provider.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            provider.models.some(model => model.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = selectedType === "all" || provider.type === selectedType;
        const matchesStatus = selectedStatus === "all" || provider.status === selectedStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    // Sort providers
    const sortedProviders = [...filteredProviders].sort((a, b) => {
        switch (sortBy) {
            case "name":
                return a.name.localeCompare(b.name);
            case "type":
                return a.type.localeCompare(b.type);
            case "status":
                return a.status.localeCompare(b.status);
            case "models":
                return b.models.length - a.models.length;
            default:
                return a.name.localeCompare(b.name);
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            case 'configured':
                return 'bg-blue-100 text-blue-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'cloud':
                return 'bg-blue-100 text-blue-800';
            case 'local':
                return 'bg-purple-100 text-purple-800';
            case 'enterprise':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getModelStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800';
            case 'unavailable':
                return 'bg-red-100 text-red-800';
            case 'testing':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleTestProvider = async (providerId: string) => {
        try {
            await apiCall(`/llms/providers/${providerId}/test`);
            toast({
                title: "Test Successful",
                description: `${providerId} connection test passed.`,
            });
        } catch (error) {
            toast({
                title: "Test Failed",
                description: `Failed to test ${providerId} connection.`,
                variant: "destructive",
            });
        }
    };

    const handleCopyConfig = (provider: LLMProvider) => {
        const config = {
            provider: provider.id,
            baseUrl: provider.baseUrl,
            apiKey: provider.apiKey ? '***' : undefined,
            models: provider.models.map(m => m.name)
        };
        navigator.clipboard.writeText(JSON.stringify(config, null, 2));
        toast({
            title: "Configuration Copied",
            description: "Provider configuration copied to clipboard.",
        });
    };

    const handleEditProvider = (provider: LLMProvider) => {
        setSelectedProvider(provider);
        setIsModalOpen(true);
    };

    const handleAddProvider = () => {
        setSelectedProvider(null);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["llm-providers"] });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProvider(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-500">Loading LLM configurations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                    <p className="text-red-500 mb-4">Failed to load LLM configurations.</p>
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">LLM Configurations</h1>
                        <p className="text-muted-foreground">
                            Manage and monitor your Language Model providers and models
                        </p>
                    </div>
                    <Button onClick={handleAddProvider}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Provider
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search providers and models..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="cloud">Cloud</option>
                        <option value="local">Local</option>
                    </select>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="configured">Configured</option>
                        <option value="error">Error</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="type">Sort by Type</option>
                        <option value="status">Sort by Status</option>
                        <option value="models">Sort by Models</option>
                    </select>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{llmProviders.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Configured LLM providers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Models</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {llmProviders.reduce((total, provider) => total + provider.models.length, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Available models
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {llmProviders.filter(p => p.status === 'active').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ready for use
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Local Models</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {llmProviders.filter(p => p.type === 'local').length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Self-hosted providers
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedProviders.map((provider) => (
                    <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        {provider.type === 'cloud' && <Cloud className="w-5 h-5 text-white" />}
                                        {provider.type === 'local' && <Server className="w-5 h-5 text-white" />}
                                        {provider.type === 'enterprise' && <Database className="w-5 h-5 text-white" />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                                        <CardDescription>{provider.description}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge className={getStatusColor(provider.status)}>
                                        {provider.status}
                                    </Badge>
                                    <Badge className={getTypeColor(provider.type)}>
                                        {provider.type}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Models List */}
                                <div>
                                    <h4 className="font-medium mb-2">Models ({provider.models.length})</h4>
                                    <div className="space-y-2">
                                        {provider.models.slice(0, 3).map((model) => (
                                            <div key={model.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-sm">{model.name}</span>
                                                    <Badge className={getModelStatusColor(model.status)}>
                                                        {model.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    {model.contextLength && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {model.contextLength.toLocaleString()} ctx
                                                        </Badge>
                                                    )}
                                                    {model.type && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {model.type}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {provider.models.length > 3 && (
                                            <div className="text-sm text-gray-500 text-center py-1">
                                                +{provider.models.length - 3} more models
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* Actions */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCopyConfig(provider)}
                                        >
                                            <Copy className="w-4 h-4 mr-1" />
                                            Config
                                        </Button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditProvider(provider)}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {sortedProviders.length === 0 && (
                <div className="text-center py-12">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No LLM providers found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm || selectedType !== "all" || selectedStatus !== "all"
                            ? "Try adjusting your search or filters."
                            : "Get started by adding your first LLM provider."}
                    </p>
                    <Button onClick={handleAddProvider}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Provider
                    </Button>
                </div>
            )}

            {/* LLM Provider Modal */}
            <LLMProviderModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                provider={selectedProvider}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
