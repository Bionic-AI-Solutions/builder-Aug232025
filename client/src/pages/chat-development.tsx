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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Circle,
  Code,
  Copy,
  Download
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
  const [appChatMessages, setAppChatMessages] = useState<{ id: string, sender: string, message: string }[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProject, setExportProject] = useState<Project | null>(null);
  const [isProjectModified, setIsProjectModified] = useState(false);
  const [lastPublishedState, setLastPublishedState] = useState<string>("");

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
        status: "completed",
        files: [
          { name: "Knowledge Base Document 1", size: "12.4kb", type: "markdown" },
          { name: "Knowledge Base Document 2", size: "3.2kb", type: "markdown" },
          { name: "Knowledge Base Document 3", size: "2.1kb", type: "markdown" },
        ],
      });

      // Set the published state when project is completed
      const publishedState = JSON.stringify({
        name: appName,
        description: "",
        prompt: prompt,
        mcpServers: selectedServers,
        knowledgeFiles: knowledgeFiles.map(f => f.name + f.size + f.lastModified)
      });
      setLastPublishedState(publishedState);
      setIsProjectModified(false);
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
        title: "Knowledge Content Added",
        description: `Added ${newFiles.length} knowledge file(s) to your RAG knowledge base.`,
      });
    }
  };

  const removeKnowledgeFile = (index: number) => {
    setKnowledgeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateWidgetCode = (project: Project, customerId: string = "demo-customer") => {
    const widgetCode = `<!-- MCP Builder Widget - ${project.name} -->
<script>
(function() {
  // Widget configuration
  const config = {
    projectId: '${project.id}',
    customerId: '${customerId}',
    apiEndpoint: 'https://api.mcpbuilder.com/widget',
    theme: 'light', // or 'dark'
    position: 'bottom-right', // or 'bottom-left', 'top-right', 'top-left'
    width: '400px',
    height: '600px'
  };

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'mcp-widget-${project.id}';
  widgetContainer.style.cssText = \`
    position: fixed;
    \${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
    \${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
    width: \${config.width};
    height: \${config.height};
    z-index: 9999;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    background: white;
    border: 1px solid #e5e7eb;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  \`;

  // Create chat interface
  widgetContainer.innerHTML = \`
    <div style="display: flex; flex-direction: column; height: 100%;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">\${project.name}</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Powered by MCP Builder</p>
        </div>
        <button onclick="toggleWidget()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
      </div>
      
      <!-- Chat Messages -->
      <div id="chat-messages" style="flex: 1; padding: 16px; overflow-y: auto; background: #f9fafb;">
        <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
          Welcome! How can I help you today?
        </div>
      </div>
      
      <!-- Input Area -->
      <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: white;">
        <div style="display: flex; gap: 8px;">
          <input type="text" id="chat-input" placeholder="Type your message..." 
                 style="flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
          <button onclick="sendMessage()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
            Send
          </button>
        </div>
      </div>
    </div>
  \`;

  // Add to page
  document.body.appendChild(widgetContainer);

  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.id = 'mcp-widget-toggle-${project.id}';
  toggleButton.innerHTML = '💬';
  toggleButton.style.cssText = \`
    position: fixed;
    \${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
    \${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9998;
    transition: transform 0.2s;
  \`;
  toggleButton.onmouseover = () => toggleButton.style.transform = 'scale(1.1)';
  toggleButton.onmouseout = () => toggleButton.style.transform = 'scale(1)';
  toggleButton.onclick = toggleWidget;
  document.body.appendChild(toggleButton);

  // Widget functions
  window.toggleWidget = function() {
    const widget = document.getElementById('mcp-widget-${project.id}');
    const toggle = document.getElementById('mcp-widget-toggle-${project.id}');
    
    if (widget.style.display === 'none' || !widget.style.display) {
      widget.style.display = 'block';
      toggle.style.display = 'none';
    } else {
      widget.style.display = 'none';
      toggle.style.display = 'block';
    }
  };

  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    // Add user message
    addMessage('user', message);
    input.value = '';

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      addMessage('ai', 'Thank you for your message! This is a demo response. In production, this would connect to the MCP Builder API.');
    }, 1000);
  };

  function addMessage(sender, text) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = \`
      margin-bottom: 12px;
      display: flex;
      justify-content: \${sender === 'user' ? 'flex-end' : 'flex-start'};
    \`;
    
    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = \`
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      background: \${sender === 'user' ? '#667eea' : 'white'};
      color: \${sender === 'user' ? 'white' : '#374151'};
      border: \${sender === 'user' ? 'none' : '1px solid #e5e7eb'};
    \`;
    messageBubble.textContent = text;
    
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Handle Enter key
  document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  console.log('MCP Builder Widget loaded for project: ${project.name}');
})();
</script>`;

    return widgetCode;
  };

  const handleExportWidget = (project: Project) => {
    setExportProject(project);
    setShowExportModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Code Copied",
        description: "Widget code has been copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Check if project has been modified since last publish
  const checkProjectModifications = () => {
    const currentState = JSON.stringify({
      name: appName,
      description: "", // We'll add description field later
      prompt: prompt,
      mcpServers: selectedServers,
      knowledgeFiles: knowledgeFiles.map(f => f.name + f.size + f.lastModified)
    });

    if (lastPublishedState && currentState !== lastPublishedState) {
      setIsProjectModified(true);
    } else if (lastPublishedState && currentState === lastPublishedState) {
      setIsProjectModified(false);
    }
  };

  // Update modification check when any field changes
  useEffect(() => {
    checkProjectModifications();
  }, [appName, prompt, selectedServers, knowledgeFiles]);

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
                      <div className={`rounded-full p-2 ${message.sender === "user"
                        ? "bg-gray-200"
                        : "bg-blue-500"
                        }`}>
                        {message.sender === "user" ? (
                          <User size={16} className="text-gray-600" />
                        ) : (
                          <Bot size={16} className="text-white" />
                        )}
                      </div>
                      <div className={`rounded-lg p-3 max-w-2xl ${message.sender === "user"
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
                          <div key={msg.id} className={`text-xs p-2 rounded max-w-[80%] ${msg.sender === "user"
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
            {/* Top Row - App Name, Knowledge Attachments, MCP Servers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label className="text-sm font-medium">RAG Knowledge Base</Label>
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
                  className="w-full h-10"
                  onClick={() => document.getElementById('knowledge-upload')?.click()}
                  data-testid="button-upload-knowledge"
                >
                  <Upload size={16} className="mr-2" />
                  Upload Knowledge Content
                </Button>
                {knowledgeFiles.length > 0 && (
                  <div className="mt-1 text-xs text-gray-600">
                    {knowledgeFiles.length} knowledge file{knowledgeFiles.length !== 1 ? 's' : ''} uploaded
                  </div>
                )}
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
              <div className="lg:col-span-8">
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

              {/* Save and Export Buttons */}
              <div className="lg:col-span-4 space-y-2">
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

                <Button
                  variant="outline"
                  onClick={() => {
                    const completedProject = projects.find(p => p.status === "completed");
                    if (completedProject) {
                      handleExportWidget(completedProject);
                    } else {
                      toast({
                        title: "No Completed App",
                        description: "Please save and complete an app first before exporting widget code.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full"
                  data-testid="button-export-widget"
                >
                  <Code className="mr-2 h-4 w-4" />
                  Export Widget Code
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Widget Code Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Export Widget Code: {exportProject?.name}
            </DialogTitle>
            <DialogDescription>
              Copy the embeddable widget code to integrate this app into your customers' websites
            </DialogDescription>
          </DialogHeader>

          {exportProject && (
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="code">Widget Code</TabsTrigger>
                <TabsTrigger value="customization">Customization</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Customer ID (Optional)</Label>
                  <Input
                    placeholder="Enter customer ID for tracking (e.g., customer-123)"
                    className="w-full"
                    id="customer-id-input"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Embeddable Widget Code</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const customerId = (document.getElementById('customer-id-input') as HTMLInputElement)?.value || 'demo-customer';
                        copyToClipboard(generateWidgetCode(exportProject, customerId));
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={generateWidgetCode(exportProject, (document.getElementById('customer-id-input') as HTMLInputElement)?.value || 'demo-customer')}
                      readOnly
                      rows={20}
                      className="font-mono text-xs bg-gray-50"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Integration Instructions:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Copy the widget code above</li>
                    <li>Paste it into your customer's website HTML (before the closing &lt;/body&gt; tag)</li>
                    <li>The widget will appear as a chat button in the bottom-right corner</li>
                    <li>Customers can click the button to open the chat interface</li>
                    <li>All interactions are tracked back to your builder account</li>
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="customization" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Widget Position</Label>
                    <Select defaultValue="bottom-right">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Theme</Label>
                    <Select defaultValue="light">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Width</Label>
                    <Input defaultValue="400px" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Height</Label>
                    <Input defaultValue="600px" />
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Customization Note:</h4>
                  <p className="text-sm text-yellow-800">
                    These settings will be applied to the widget code. You can modify the code directly
                    or use these options to generate customized versions for different customers.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-4">Widget Preview</h4>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full">
                      💬
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Chat button will appear here on your customer's website
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Ready to Deploy!</h4>
                  <p className="text-sm text-green-800">
                    Your widget is ready to be embedded. The chat interface will provide the same
                    functionality as your app, allowing customers to interact with your AI assistant.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}