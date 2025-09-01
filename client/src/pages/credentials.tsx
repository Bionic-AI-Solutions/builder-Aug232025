import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, apiCall } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Edit, Trash2, Eye, EyeOff, Key, Server, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';

interface LLMCredential {
    id: string;
    llmModelId: string;
    credentialName: string;
    isActive: boolean;
    lastUsedAt: string | null;
    usageCount: number;
    createdAt: string;
    apiKey?: string;
    secretKey?: string;
    organizationId?: string;
    projectId?: string;
    llmModel?: {
        name: string;
        provider: string;
        displayName?: string;
    };
}

interface MCPCredential {
    id: string;
    mcpServerId: string;
    credentialName: string;
    isActive: boolean;
    lastUsedAt: string | null;
    usageCount: number;
    createdAt: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    scopes?: string[];
    mcpServer?: {
        name: string;
        type: string;
        description?: string;
    };
}

interface LLMModel {
    id: string;
    name: string;
    displayName?: string;
    provider: string;
    model: string;
    approved: boolean;
    status: string;
}

interface MCPServer {
    id: string;
    name: string;
    type: string;
    description?: string;
    approved: boolean;
    status: string;
}

const CredentialsPage: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('llm');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCredential, setEditingCredential] = useState<any>(null);
    const [showApiKey, setShowApiKey] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        llmModelId: '',
        apiKey: '',
        secretKey: '',
        organizationId: '',
        projectId: '',
        credentialName: '',
        mcpServerId: '',
        clientId: '',
        clientSecret: '',
        accessToken: '',
        refreshToken: '',
        scopes: [] as string[],
        isActive: true
    });

    // Fetch LLM credentials
    const { data: llmCredentials, isLoading: loadingLLM } = useQuery({
        queryKey: ['llm-credentials'],
        queryFn: async () => {
            const result = await apiCall('/credentials/llm');
            return result.data?.credentials || [];
        },
        enabled: !!user
    });

    // Fetch MCP credentials
    const { data: mcpCredentials, isLoading: loadingMCP } = useQuery({
        queryKey: ['mcp-credentials'],
        queryFn: async () => {
            const result = await apiCall('/credentials/mcp');
            return result.data?.credentials || [];
        },
        enabled: !!user
    });

    // Fetch approved LLM models
    const { data: llmModelsData } = useQuery({
        queryKey: ['llm-models'],
        queryFn: async () => {
            const result = await apiCall('/llms/models');
            return result.data?.models || [];
        },
        enabled: !!user
    });

    // Fetch approved MCP servers
    const { data: mcpServersData } = useQuery({
        queryKey: ['mcp-servers'],
        queryFn: async () => {
            const result = await apiCall('/servers');
            return result.data?.servers || [];
        },
        enabled: !!user
    });

    // Filter only approved and active models/servers
    const approvedLLMModels = llmModelsData?.filter((model: LLMModel) => model.approved && model.status === 'active') || [];
    const approvedMCPServers = mcpServersData?.filter((server: MCPServer) => server.approved && server.status === 'active') || [];

    // Create LLM credential mutation
    const createLLMCredential = useMutation({
        mutationFn: async (data: any) => {
            return apiCall('/credentials/llm', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['llm-credentials'] });
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error) => {
            console.error('Failed to create LLM credential:', error);
        }
    });

    // Create MCP credential mutation
    const createMCPCredential = useMutation({
        mutationFn: async (data: any) => {
            return apiCall('/credentials/mcp', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mcp-credentials'] });
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error) => {
            console.error('Failed to create MCP credential:', error);
        }
    });

    // Update credential mutation
    const updateCredential = useMutation({
        mutationFn: async (data: any) => {
            const type = activeTab === 'llm' ? 'llm' : 'mcp';
            return apiCall(`/credentials/${type}/${editingCredential.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${activeTab}-credentials`] });
            setShowEditModal(false);
            setEditingCredential(null);
        },
        onError: (error) => {
            console.error('Failed to update credential:', error);
        }
    });

    // Delete credential mutation
    const deleteCredential = useMutation({
        mutationFn: async ({ type, id }: { type: 'llm' | 'mcp', id: string }) => {
            return apiCall(`/credentials/${type}/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: (_, { type }) => {
            queryClient.invalidateQueries({ queryKey: [`${type}-credentials`] });
        },
        onError: (error) => {
            console.error('Failed to delete credential:', error);
        }
    });

    const resetForm = () => {
        setFormData({
            llmModelId: '',
            apiKey: '',
            secretKey: '',
            organizationId: '',
            projectId: '',
            credentialName: '',
            mcpServerId: '',
            clientId: '',
            clientSecret: '',
            accessToken: '',
            refreshToken: '',
            scopes: [],
            isActive: true
        });
    };

    const populateEditForm = (credential: LLMCredential | MCPCredential) => {
        if ('llmModelId' in credential) {
            // LLM Credential
            setFormData({
                llmModelId: credential.llmModelId || '',
                apiKey: credential.apiKey || '',
                secretKey: credential.secretKey || '',
                organizationId: credential.organizationId || '',
                projectId: credential.projectId || '',
                credentialName: credential.credentialName || '',
                mcpServerId: '',
                clientId: '',
                clientSecret: '',
                accessToken: '',
                refreshToken: '',
                scopes: [],
                isActive: credential.isActive
            });
        } else {
            // MCP Credential
            setFormData({
                llmModelId: '',
                apiKey: '',
                secretKey: '',
                organizationId: '',
                projectId: '',
                credentialName: credential.credentialName || '',
                mcpServerId: credential.mcpServerId || '',
                clientId: credential.clientId || '',
                clientSecret: credential.clientSecret || '',
                accessToken: credential.accessToken || '',
                refreshToken: credential.refreshToken || '',
                scopes: credential.scopes || [],
                isActive: credential.isActive
            });
        }
    };

    const handleCreateCredential = () => {
        if (activeTab === 'llm') {
            createLLMCredential.mutate({
                llmModelId: formData.llmModelId,
                apiKey: formData.apiKey,
                secretKey: formData.secretKey,
                organizationId: formData.organizationId,
                projectId: formData.projectId,
                credentialName: formData.credentialName
            });
        } else {
            createMCPCredential.mutate({
                mcpServerId: formData.mcpServerId,
                clientId: formData.clientId,
                clientSecret: formData.clientSecret,
                accessToken: formData.accessToken,
                refreshToken: formData.refreshToken,
                scopes: formData.scopes,
                credentialName: formData.credentialName
            });
        }
    };

    const handleUpdateCredential = () => {
        if (activeTab === 'llm') {
            updateCredential.mutate({
                llmModelId: formData.llmModelId,
                apiKey: formData.apiKey,
                secretKey: formData.secretKey,
                organizationId: formData.organizationId,
                projectId: formData.projectId,
                credentialName: formData.credentialName,
                isActive: formData.isActive
            });
        } else {
            updateCredential.mutate({
                mcpServerId: formData.mcpServerId,
                clientId: formData.clientId,
                clientSecret: formData.clientSecret,
                accessToken: formData.accessToken,
                refreshToken: formData.refreshToken,
                scopes: formData.scopes,
                credentialName: formData.credentialName,
                isActive: formData.isActive
            });
        }
    };

    const handleOAuth2Flow = async (mcpServerId: string) => {
        try {
            const result = await apiCall(`/oauth2/${mcpServerId}/authorize`);
            if (result.data?.authorizationUrl) {
                window.location.href = result.data.authorizationUrl;
            }
        } catch (error) {
            console.error('OAuth2 flow error:', error);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert>Please log in to manage credentials</Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Credential Management</h1>
                    <p className="text-gray-600 mt-2">Manage your LLM and MCP server credentials</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Credential
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="llm" className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        LLM Credentials
                    </TabsTrigger>
                    <TabsTrigger value="mcp" className="flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        MCP Credentials
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="llm" className="space-y-4">
                    {loadingLLM ? (
                        <div className="text-center py-8">Loading LLM credentials...</div>
                    ) : llmCredentials?.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Key className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No LLM Credentials</h3>
                            <p className="text-gray-600 mb-4">Add your first LLM credential to get started</p>
                            <Button onClick={() => setShowCreateModal(true)}>Add LLM Credential</Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {llmCredentials?.map((credential) => (
                                <Card key={credential.id} className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{credential.credentialName}</h3>
                                            <p className="text-sm text-gray-600">
                                                Model: {credential.llmModel?.name || approvedLLMModels.find(m => m.id === credential.llmModelId)?.name || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Provider: {credential.llmModel?.provider || approvedLLMModels.find(m => m.id === credential.llmModelId)?.provider || 'Unknown'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {credential.isActive ? (
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>Used {credential.usageCount} times</span>
                                        </div>
                                        {credential.lastUsedAt && (
                                            <div className="text-xs">
                                                Last used: {new Date(credential.lastUsedAt).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setActiveTab('llm');
                                                setEditingCredential(credential);
                                                populateEditForm(credential);
                                                setShowEditModal(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteCredential.mutate({ type: 'llm', id: credential.id })}
                                            disabled={deleteCredential.isPending}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="mcp" className="space-y-4">
                    {loadingMCP ? (
                        <div className="text-center py-8">Loading MCP credentials...</div>
                    ) : mcpCredentials?.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Server className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No MCP Credentials</h3>
                            <p className="text-gray-600 mb-4">Add your first MCP server credential to get started</p>
                            <Button onClick={() => setShowCreateModal(true)}>Add MCP Credential</Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {mcpCredentials?.map((credential) => (
                                <Card key={credential.id} className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{credential.credentialName}</h3>
                                            <p className="text-sm text-gray-600">
                                                Server: {credential.mcpServer?.name || approvedMCPServers.find(s => s.id === credential.mcpServerId)?.name || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Type: {credential.mcpServer?.type || approvedMCPServers.find(s => s.id === credential.mcpServerId)?.type || 'Unknown'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {credential.isActive ? (
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>Used {credential.usageCount} times</span>
                                        </div>
                                        {credential.lastUsedAt && (
                                            <div className="text-xs">
                                                Last used: {new Date(credential.lastUsedAt).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setActiveTab('mcp');
                                                setEditingCredential(credential);
                                                populateEditForm(credential);
                                                setShowEditModal(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteCredential.mutate({ type: 'mcp', id: credential.id })}
                                            disabled={deleteCredential.isPending}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create Credential Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Add New {activeTab === 'llm' ? 'LLM' : 'MCP'} Credential
                        </DialogTitle>
                        <DialogDescription>
                            {activeTab === 'llm'
                                ? 'Configure credentials for an approved LLM model to enable AI capabilities in your applications.'
                                : 'Configure credentials for an approved MCP server to enable external service integrations.'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {activeTab === 'llm' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        LLM Model <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={formData.llmModelId}
                                        onValueChange={(value) => setFormData({ ...formData, llmModelId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an approved LLM model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {approvedLLMModels.map((model: LLMModel) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.displayName || model.name} ({model.provider})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {approvedLLMModels.length === 0 && (
                                        <p className="text-sm text-amber-600 mt-1">
                                            No approved LLM models available. Contact an administrator.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        API Key <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showApiKey ? 'text' : 'password'}
                                            value={formData.apiKey}
                                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                            placeholder="Enter your API key"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                        >
                                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Secret Key</label>
                                    <Input
                                        type="password"
                                        value={formData.secretKey}
                                        onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                                        placeholder="Enter your secret key (optional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Organization ID</label>
                                    <Input
                                        value={formData.organizationId}
                                        onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                                        placeholder="Enter your organization ID (optional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Project ID</label>
                                    <Input
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                        placeholder="Enter your project ID (optional)"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        MCP Server <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={formData.mcpServerId}
                                        onValueChange={(value) => setFormData({ ...formData, mcpServerId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an approved MCP server" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {approvedMCPServers.map((server: MCPServer) => (
                                                <SelectItem key={server.id} value={server.id}>
                                                    {server.name} ({server.type})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {approvedMCPServers.length === 0 && (
                                        <p className="text-sm text-amber-600 mt-1">
                                            No approved MCP servers available. Contact an administrator.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Client ID <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        placeholder="Enter your client ID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Client Secret <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="password"
                                        value={formData.clientSecret}
                                        onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                                        placeholder="Enter your client secret"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => formData.mcpServerId && handleOAuth2Flow(formData.mcpServerId)}
                                        disabled={!formData.mcpServerId}
                                    >
                                        Use OAuth2 Flow
                                    </Button>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Credential Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={formData.credentialName}
                                onChange={(e) => setFormData({ ...formData, credentialName: e.target.value })}
                                placeholder="Enter a descriptive name for this credential"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleCreateCredential}
                            disabled={createLLMCredential.isPending || createMCPCredential.isPending}
                        >
                            {createLLMCredential.isPending || createMCPCredential.isPending ? 'Creating...' : 'Create Credential'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Credential Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit {activeTab === 'llm' ? 'LLM' : 'MCP'} Credential</DialogTitle>
                        <DialogDescription>
                            Update your credential information. Note: API keys and secrets cannot be viewed for security reasons.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {activeTab === 'llm' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        LLM Model <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={formData.llmModelId}
                                        onValueChange={(value) => setFormData({ ...formData, llmModelId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an approved LLM model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {approvedLLMModels.map((model: LLMModel) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.displayName || model.name} ({model.provider})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {approvedLLMModels.length === 0 && (
                                        <p className="text-sm text-amber-600 mt-1">
                                            No approved LLM models available. Contact an administrator.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        API Key <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showApiKey ? 'text' : 'password'}
                                            value={formData.apiKey}
                                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                            placeholder="Enter your API key"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                        >
                                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Secret Key</label>
                                    <Input
                                        type="password"
                                        value={formData.secretKey}
                                        onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                                        placeholder="Enter your secret key (optional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Organization ID</label>
                                    <Input
                                        value={formData.organizationId}
                                        onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                                        placeholder="Enter your organization ID (optional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Project ID</label>
                                    <Input
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                        placeholder="Enter your project ID (optional)"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        MCP Server <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={formData.mcpServerId}
                                        onValueChange={(value) => setFormData({ ...formData, mcpServerId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an approved MCP server" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {approvedMCPServers.map((server: MCPServer) => (
                                                <SelectItem key={server.id} value={server.id}>
                                                    {server.name} ({server.type})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {approvedMCPServers.length === 0 && (
                                        <p className="text-sm text-amber-600 mt-1">
                                            No approved MCP servers available. Contact an administrator.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Client ID <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        placeholder="Enter your client ID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Client Secret <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="password"
                                        value={formData.clientSecret}
                                        onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                                        placeholder="Enter your client secret"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Access Token</label>
                                    <Input
                                        type="password"
                                        value={formData.accessToken}
                                        onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                        placeholder="Enter your access token (optional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Refresh Token</label>
                                    <Input
                                        type="password"
                                        value={formData.refreshToken}
                                        onChange={(e) => setFormData({ ...formData, refreshToken: e.target.value })}
                                        placeholder="Enter your refresh token (optional)"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => formData.mcpServerId && handleOAuth2Flow(formData.mcpServerId)}
                                        disabled={!formData.mcpServerId}
                                    >
                                        Use OAuth2 Flow
                                    </Button>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Credential Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={formData.credentialName}
                                onChange={(e) => setFormData({ ...formData, credentialName: e.target.value })}
                                placeholder="Enter a descriptive name for this credential"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isActiveEdit"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="rounded"
                            />
                            <label htmlFor="isActiveEdit" className="text-sm font-medium">
                                Active
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleUpdateCredential}
                            disabled={updateCredential.isPending}
                        >
                            {updateCredential.isPending ? 'Updating...' : 'Update Credential'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CredentialsPage;
