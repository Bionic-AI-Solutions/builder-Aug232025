import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  Monitor,
  MessageSquare,
  FileText,
  Upload,
  Circle
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
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [appChatInput, setAppChatInput] = useState("");
  const [appChatMessages, setAppChatMessages] = useState<{id: string, sender: string, message: string}[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);

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

  // LLM options
  const llmOptions = [
    { value: "claude", label: "Claude 3.7" },
    { value: "gemini", label: "Gemini Pro" },
    { value: "llama", label: "LLaMA 3.3" },
    { value: "gpt4", label: "GPT-4" },
  ];

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
          { name: "Knowledge Article 1", size: "12.4kb", type: "markdown" },
          { name: "Knowledge Article 2", size: "3.2kb", type: "markdown" },
          { name: "Knowledge Article 3", size: "2.1kb", type: "markdown" },
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

  const getAppTypeResponses = (appType: string, question: string): string => {
    const responses: Record<string, Record<string, string>> = {
      "Restaurant App": {
        "what is today's menu": "Today's menu includes our signature dishes:\n\n🍝 Pasta Primavera - $18\n🥗 Caesar Salad - $12\n🍖 Grilled Ribeye - $32\n🍤 Garlic Shrimp - $24\n🍰 Tiramisu - $8\n\nWould you like to place an order or make a reservation?",
        "menu": "Here's our full menu:\n\n**APPETIZERS**\n• Bruschetta - $9\n• Calamari - $12\n\n**MAINS**\n• Pasta Primavera - $18\n• Grilled Salmon - $28\n• Ribeye Steak - $32\n\n**DESSERTS**\n• Tiramisu - $8\n• Gelato - $6",
        "reservation": "I'd be happy to help with reservations! We have availability today from 6-9 PM. How many guests and what time would you prefer?",
        "default": "Welcome to our restaurant! I can help you with our menu, reservations, or placing an order. What would you like to know?"
      },
      "E-commerce Store": {
        "products": "Here are our featured products:\n\n📱 iPhone 15 Pro - $999\n💻 MacBook Air - $1299\n⌚ Apple Watch - $399\n🎧 AirPods Pro - $249\n\nAll items come with free shipping and 30-day returns!",
        "order": "To place an order, simply add items to your cart and proceed to checkout. We accept all major credit cards and PayPal.",
        "shipping": "We offer free shipping on orders over $50. Standard delivery is 3-5 business days, or choose express delivery for next-day delivery.",
        "default": "Welcome to our store! Browse our products, check your orders, or ask me about shipping and returns. How can I help you today?"
      },
      "Blog Platform": {
        "posts": "Here are our latest blog posts:\n\n✍️ 'Getting Started with React' - Dec 18\n🚀 'Web Performance Tips' - Dec 17\n💡 'Design Trends 2025' - Dec 16\n🔧 'JavaScript Best Practices' - Dec 15\n\nWhich topic interests you most?",
        "write": "Ready to create a new post? I can help you with:\n• Post ideas and topics\n• SEO optimization\n• Content structure\n• Publishing schedule\n\nWhat would you like to write about?",
        "default": "Welcome to our blog platform! I can help you discover content, create new posts, or manage your publications. What are you looking for?"
      },
      "Fitness Tracker": {
        "workout": "Here's today's recommended workout:\n\n💪 **Upper Body Strength**\n• Push-ups: 3 sets of 12\n• Dumbbell rows: 3 sets of 10\n• Shoulder press: 3 sets of 8\n• Plank: 3 sets of 30s\n\nEstimated time: 45 minutes. Ready to start?",
        "progress": "Your fitness progress this week:\n\n📊 Workouts completed: 4/5\n🔥 Calories burned: 1,240\n⏱️ Total workout time: 3h 20m\n💪 Strength improved by 5%\n\nKeep up the great work!",
        "default": "Hi there! I'm your fitness assistant. I can help you track workouts, monitor progress, plan exercises, and stay motivated. What's your fitness goal today?"
      },
      "Task Manager": {
        "tasks": "Here are your current tasks:\n\n✅ **Completed:**\n• Review project proposal\n• Team standup meeting\n\n📋 **In Progress:**\n• Update documentation\n• Code review for feature X\n\n⏰ **Pending:**\n• Schedule client call\n• Prepare presentation",
        "project": "Your active projects:\n\n🚀 **Website Redesign** (75% complete)\n👥 **Team Onboarding** (40% complete)\n📱 **Mobile App** (90% complete)\n\nWhich project would you like to focus on?",
        "default": "Welcome to your task manager! I can help you organize tasks, track project progress, collaborate with your team, and meet deadlines. What do you need to accomplish today?"
      }
    };

    const appResponses = responses[appType] || {};
    const questionLower = question.toLowerCase();
    
    for (const [key, response] of Object.entries(appResponses)) {
      if (questionLower.includes(key)) {
        return response;
      }
    }
    
    return appResponses.default || "I'm here to help! What would you like to know about this app?";
  };

  const handleAppChatSend = () => {
    if (!appChatInput.trim() || !selectedProject) return;
    
    const selectedProjectData = projects.find(p => p.id === selectedProject);
    if (!selectedProjectData) return;

    const userMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      message: appChatInput
    };

    const aiResponse = {
      id: `msg-${Date.now()}-ai`,
      sender: "ai", 
      message: getAppTypeResponses(selectedProjectData.name, appChatInput)
    };

    setAppChatMessages(prev => [...prev, userMessage, aiResponse]);
    setAppChatInput("");
  };

  const handleKnowledgeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setKnowledgeFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Knowledge Files Added",
        description: `Added ${newFiles.length} knowledge article(s) to your project.`,
      });
    }
  };

  const removeKnowledgeFile = (index: number) => {
    setKnowledgeFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Main Chat Area */}
        <div className="lg:col-span-2 flex flex-col space-y-4 min-h-0">
          {/* Chat Messages */}
          <Card className="flex-1 shadow-sm border border-gray-100 min-h-0">
            <CardContent className="p-6 h-full overflow-y-auto">
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
        </div>

        {/* Right Panel - Live Preview */}
        <div className="lg:col-span-1 flex flex-col space-y-4 min-h-0">
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
              
              {/* Project Selection */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Select App to Preview</Label>
                <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an app to preview" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => p.status === "completed").map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProject ? (
                <div className="space-y-4">
                  {/* App-specific Chat */}
                  <div className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <MessageSquare size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Chat with your app</span>
                      </div>
                    </div>
                    
                    {/* Chat Messages */}
                    <div className="h-40 overflow-y-auto p-3 space-y-2">
                      {appChatMessages.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-500">Start chatting with your {projects.find(p => p.id === selectedProject)?.name}</p>
                        </div>
                      ) : (
                        appChatMessages.map((msg) => (
                          <div key={msg.id} className={`text-xs p-2 rounded max-w-[80%] ${
                            msg.sender === "user" 
                              ? "bg-blue-100 text-blue-900 ml-auto" 
                              : "bg-gray-100 text-gray-900"
                          }`}>
                            <div className="whitespace-pre-wrap">{msg.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Chat Input */}
                    <div className="border-t border-gray-200 p-3">
                      <div className="flex space-x-2">
                        <Input
                          value={appChatInput}
                          onChange={(e) => setAppChatInput(e.target.value)}
                          placeholder={`Ask your ${projects.find(p => p.id === selectedProject)?.name.toLowerCase()}...`}
                          className="text-xs"
                          onKeyPress={(e) => e.key === "Enter" && handleAppChatSend()}
                          data-testid="input-app-chat"
                        />
                        <Button
                          onClick={handleAppChatSend}
                          size="sm"
                          data-testid="button-send-app-chat"
                        >
                          <Send size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Monitor size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Select an app to start chatting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* App Configuration - Fixed at bottom */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Top Row - App Name, Knowledge Attachments, LLM, MCP Servers */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* App Name */}
              <div>
                <Label htmlFor="app-name" className="text-sm font-medium">App Name</Label>
                <Input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Analytics Dashboard"
                  data-testid="input-app-name"
                />
              </div>

              {/* Knowledge Attachments */}
              <div>
                <Label className="text-sm font-medium">Knowledge Attachments</Label>
                <div className="space-y-2">
                  <input
                    type="file"
                    multiple
                    accept=".md,.txt,.pdf,.doc,.docx"
                    onChange={handleKnowledgeUpload}
                    className="hidden"
                    id="knowledge-upload"
                    data-testid="input-knowledge-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('knowledge-upload')?.click()}
                    data-testid="button-upload-knowledge"
                  >
                    <Upload size={16} className="mr-2" />
                    Upload Knowledge Articles
                  </Button>
                  {knowledgeFiles.length > 0 && (
                    <div className="space-y-1 max-h-16 overflow-y-auto">
                      {knowledgeFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                          <div className="flex items-center flex-1 min-w-0">
                            <FileText size={10} className="mr-1 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeKnowledgeFile(index)}
                            data-testid={`button-remove-knowledge-${index}`}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* LLM Selection */}
              <div>
                <Label className="text-sm font-medium">LLM</Label>
                <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select LLM" />
                  </SelectTrigger>
                  <SelectContent>
                    {llmOptions.map((llm) => (
                      <SelectItem key={llm.value} value={llm.value}>
                        <div className="flex items-center space-x-2">
                          <Circle 
                            size={12} 
                            className={selectedLLM === llm.value ? "text-blue-600 fill-blue-600" : "text-gray-300"} 
                          />
                          <span>{llm.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* MCP Servers */}
              <div>
                <Label className="text-sm font-medium">MCP Servers</Label>
                <Select onValueChange={(value) => toggleServer(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`${selectedServers.length} selected`} />
                  </SelectTrigger>
                  <SelectContent>
                    {servers.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={selectedServers.includes(server.id)}
                            className="h-4 w-4"
                          />
                          <span>{server.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedServers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedServers.map((serverId) => {
                      const server = servers.find(s => s.id === serverId);
                      return server ? (
                        <Badge key={serverId} variant="secondary" className="text-xs">
                          {server.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row - Prompt and Save Button */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* Prompt */}
              <div className="lg:col-span-10">
                <Label htmlFor="main-prompt" className="text-sm font-medium">Prompt</Label>
                <Textarea
                  id="main-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Create a comprehensive user analytics dashboard..."
                  data-testid="textarea-main-prompt"
                />
              </div>

              {/* Save Button */}
              <div className="lg:col-span-2">
                <Button
                  onClick={handleSaveApp}
                  disabled={createProjectMutation.isPending || buildProgress === "building"}
                  className="w-full"
                  data-testid="button-save-app"
                >
                  {buildProgress === "building" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Building...
                    </>
                  ) : (
                    "Save App"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}