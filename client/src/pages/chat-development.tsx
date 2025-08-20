import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type ChatMessage, type Project, type McpServer } from "@shared/schema";
import { 
  Mic, 
  Paperclip, 
  Send, 
  User, 
  Bot,
  Rocket,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";

export default function ChatDevelopment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatInput, setChatInput] = useState("");
  const [appName, setAppName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedLLM, setSelectedLLM] = useState("llama");
  const [selectedServers, setSelectedServers] = useState<string[]>(["database", "api"]);
  const [buildProgress, setBuildProgress] = useState<"idle" | "building" | "completed">("idle");

  // Fetch data
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    queryFn: async () => {
      const response = await fetch(`/api/chat/messages?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 1000, // Poll for new messages
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch(`/api/projects?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: servers = [] } = useQuery<McpServer[]>({
    queryKey: ["/api/mcp-servers"],
    queryFn: async () => {
      const response = await fetch(`/api/mcp-servers?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest("POST", "/api/chat/messages", {
        userId: user?.id,
        sender: "user",
        message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "App Generated!",
        description: "Your application has been created successfully.",
      });
      // Reset form
      setAppName("");
      setPrompt("");
      setBuildProgress("completed");
      setTimeout(() => setBuildProgress("idle"), 3000);
    },
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    try {
      await sendMessageMutation.mutateAsync(chatInput);
      setChatInput("");
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTransferPrompt = () => {
    const lastAIMessage = messages
      .filter(m => m.sender === "ai")
      .pop();
    
    if (lastAIMessage) {
      setPrompt(lastAIMessage.message);
      toast({
        title: "Prompt Transferred",
        description: "AI response has been transferred to the prompt area.",
      });
    }
  };

  const handleSaveApp = async () => {
    if (!appName.trim() || !prompt.trim() || selectedServers.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setBuildProgress("building");

    try {
      await createProjectMutation.mutateAsync({
        userId: user?.id,
        name: appName,
        prompt: prompt,
        llm: selectedLLM,
        mcpServers: selectedServers,
        status: "development",
        files: [
          { name: "app.js", size: "12.4kb", type: "javascript" },
          { name: "index.html", size: "3.2kb", type: "html" },
          { name: "styles.css", size: "2.1kb", type: "css" },
        ],
      });
    } catch (error) {
      setBuildProgress("idle");
      toast({
        title: "Failed to create app",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleServer = (serverId: string) => {
    setSelectedServers(prev => 
      prev.includes(serverId) 
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Main Chat Area */}
      <div className="lg:col-span-2 space-y-6 flex flex-col">
        {/* Chat Messages */}
        <Card className="flex-1 shadow-sm border border-gray-100">
          <CardContent className="p-6 h-96 overflow-y-auto">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Start a conversation to develop your app</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className={`rounded-full p-2 ${
                      message.sender === "user" 
                        ? "bg-gray-200" 
                        : "bg-blue-500"
                    }`}>
                      {message.sender === "user" ? (
                        <User size={16} className="text-gray-600" />
                      ) : (
                        <Bot size={16} className="text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 max-w-2xl ${
                      message.sender === "user" 
                        ? "bg-gray-100" 
                        : "bg-blue-50"
                    }`}>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Chat Input */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI to generate a persona prompt for your agent"
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleTransferPrompt}
                className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap"
                data-testid="button-transfer-prompt"
              >
                Transfer left ready prompt
              </Button>
              <Button variant="outline" size="icon" data-testid="button-voice-input">
                <Mic size={16} />
              </Button>
              <Button variant="outline" size="icon" data-testid="button-attach-file">
                <Paperclip size={16} />
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Configuration */}
        <Card className="shadow-sm border border-gray-100">
          <CardContent className="p-6 space-y-6">
            {/* App Name & Knowledge Attachments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="app-name">App Name</Label>
                <Input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Analytics Dashboard"
                  data-testid="input-app-name"
                />
              </div>
              <div>
                <Label>Knowledge Attachments</Label>
                <Button variant="outline" className="w-full" data-testid="button-browse-files">
                  Browse Files
                </Button>
              </div>
            </div>

            {/* Prompt Area */}
            <div>
              <Label htmlFor="main-prompt">Prompt</Label>
              <Textarea
                id="main-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                placeholder="Create a comprehensive user analytics dashboard that tracks real-time engagement metrics, revenue data, user activity patterns, and conversion analysis with interactive visualizations..."
                data-testid="textarea-main-prompt"
              />
            </div>

            {/* LLM & MCP Servers Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium">LLM</Label>
                <RadioGroup value={selectedLLM} onValueChange={setSelectedLLM} className="mt-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="claude" id="claude" />
                    <Label htmlFor="claude">Claude 3.7</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gemini" id="gemini" />
                    <Label htmlFor="gemini">Gemini Pro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="llama" id="llama" />
                    <Label htmlFor="llama">LLaMA 3.3</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gpt4" id="gpt4" />
                    <Label htmlFor="gpt4">GPT-4</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">MCP Servers</Label>
                <div className="mt-3 space-y-2">
                  {servers.map((server) => (
                    <div key={server.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={server.id}
                        checked={selectedServers.includes(server.id)}
                        onCheckedChange={() => toggleServer(server.id)}
                      />
                      <Label htmlFor={server.id} className="flex items-center space-x-2">
                        <span>{server.name}</span>
                        <Badge variant={server.status === "connected" ? "default" : "secondary"}>
                          {server.status}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Save App Button */}
            <div className="text-center">
              <Button
                onClick={handleSaveApp}
                disabled={createProjectMutation.isPending || buildProgress === "building"}
                size="lg"
                className="px-8"
                data-testid="button-save-app"
              >
                {buildProgress === "building" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Building App...
                  </>
                ) : (
                  "Save App"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="lg:col-span-1">
        <Card className="shadow-sm border border-gray-100 h-full">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Live Preview</h3>
            
            <div className="space-y-6">
              {buildProgress === "building" ? (
                <>
                  <div className="text-center">
                    <Loader2 size={48} className="mx-auto text-blue-500 animate-spin mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">Building your application...</h4>
                    <p className="text-gray-600 text-sm">Processing your request</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Build Progress</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-2" />
                        <span className="text-sm">Project Setup</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-2" />
                        <span className="text-sm">Database</span>
                      </div>
                      <div className="flex items-center text-blue-600">
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        <span className="text-sm">UI Components</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Clock size={16} className="mr-2" />
                        <span className="text-sm">Authentication</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Clock size={16} className="mr-2" />
                        <span className="text-sm">Deployment</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : buildProgress === "completed" ? (
                <>
                  <div className="text-center">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">App Generated!</h4>
                    <p className="text-gray-600 text-sm">Your application is ready</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Build Progress</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-2" />
                        <span className="text-sm">Project Created</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-2" />
                        <span className="text-sm">Files Generated</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-2" />
                        <span className="text-sm">Ready for Testing</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <Rocket size={48} className="mx-auto text-gray-400 mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">Ready to Build</h4>
                    <p className="text-gray-600 text-sm">Configure your app and start building</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Fill in the app details and click "Save App" to start the generation process.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
