import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiCall } from "@/lib/auth";
import { Brain, Key, Globe, Server, Save, X, Plus, Trash2 } from "lucide-react";

interface LLMProvider {
    id: string;
    name: string;
    type: 'cloud' | 'local';
    description?: string;
    baseUrl?: string;
    apiKey?: string;
    status: 'active' | 'inactive' | 'configured' | 'error';
    metadata?: Record<string, any>;
    models: LLMModel[];
}

interface LLMModel {
    id: string;
    name: string;
    displayName?: string;
    type: 'chat' | 'completion' | 'embedding';
    status: 'available' | 'unavailable' | 'deprecated';
    contextLength?: number;
    maxTokens?: number;
    pricing?: {
        input?: string;
        output?: string;
        perToken?: boolean;
    };
    capabilities?: string[];
    metadata?: Record<string, any>;
}

interface LLMProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider?: LLMProvider | null;
    onSuccess: () => void;
}

export default function LLMProviderModal({ isOpen, onClose, provider, onSuccess }: LLMProviderModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'cloud' as 'cloud' | 'local',
        description: '',
        baseUrl: '',
        apiKey: '',
        metadata: {} as Record<string, any>
    });

    const [models, setModels] = useState<LLMModel[]>([]);
    const [showApiKey, setShowApiKey] = useState(false);

    const isEditing = !!provider;

    useEffect(() => {
        if (provider) {
            setFormData({
                name: provider.name,
                type: provider.type,
                description: provider.description || '',
                baseUrl: provider.baseUrl || '',
                apiKey: provider.apiKey || '',
                metadata: provider.metadata || {}
            });
            setModels(provider.models || []);
        } else {
            setFormData({
                name: '',
                type: 'cloud',
                description: '',
                baseUrl: '',
                apiKey: '',
                metadata: {}
            });
            setModels([]);
        }
    }, [provider]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                apiKey: formData.apiKey || undefined,
                baseUrl: formData.baseUrl || undefined,
                description: formData.description || undefined
            };

            if (isEditing) {
                await apiCall(`/llms/providers/${provider!.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                toast({
                    title: "Provider Updated",
                    description: "LLM provider has been updated successfully.",
                });
            } else {
                await apiCall('/llms/providers', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                toast({
                    title: "Provider Created",
                    description: "New LLM provider has been created successfully.",
                });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving provider:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save provider",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!provider) return;

        if (!confirm('Are you sure you want to delete this provider? This action cannot be undone.')) {
            return;
        }

        setIsLoading(true);
        try {
            await apiCall(`/llms/providers/${provider.id}`, {
                method: 'DELETE'
            });

            toast({
                title: "Provider Deleted",
                description: "LLM provider has been deleted successfully.",
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error deleting provider:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete provider",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'configured': return 'bg-blue-100 text-blue-800';
            case 'error': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        {isEditing ? 'Edit LLM Provider' : 'Add New LLM Provider'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the configuration for this LLM provider.'
                            : 'Configure a new LLM provider with its API credentials and settings.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Provider Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., OpenAI, Anthropic"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Provider Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: 'cloud' | 'local') => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cloud">Cloud</SelectItem>
                                        <SelectItem value="local">Local</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the provider"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Connection Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Connection Settings</h3>

                        <div className="space-y-2">
                            <Label htmlFor="baseUrl">Base URL</Label>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-gray-500" />
                                <Input
                                    id="baseUrl"
                                    value={formData.baseUrl}
                                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                                    placeholder="https://api.openai.com/v1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <div className="flex items-center gap-2">
                                <Key className="h-4 w-4 text-gray-500" />
                                <Input
                                    id="apiKey"
                                    type={showApiKey ? "text" : "password"}
                                    value={formData.apiKey}
                                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                    placeholder="sk-..."
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                >
                                    {showApiKey ? "Hide" : "Show"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Provider Status */}
                    {isEditing && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Provider Status</h3>
                            <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(provider!.status)}>
                                    {provider!.status}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                    {provider!.models.length} models configured
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Models Section */}
                    {isEditing && models.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Configured Models</h3>
                            <div className="space-y-2">
                                {models.map((model) => (
                                    <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <div className="font-medium">{model.displayName || model.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {model.type} • {model.status} • {model.contextLength?.toLocaleString()} tokens
                                            </div>
                                        </div>
                                        <Badge variant={model.status === 'available' ? 'default' : 'secondary'}>
                                            {model.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between">
                        <div className="flex gap-2">
                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Provider
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading ? 'Saving...' : (isEditing ? 'Update Provider' : 'Create Provider')}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
