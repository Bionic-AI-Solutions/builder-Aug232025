import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Project } from "@shared/schema";
import { X, User, Send, Sparkles } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "app";
  message: string;
  timestamp: Date;
}

interface ChatAppModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChatAppModal({ 
  project, 
  open, 
  onOpenChange 
}: ChatAppModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize conversation when modal opens
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        sender: "app",
        message: getWelcomeMessage(),
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [open, messages.length, project]);

  // Reset messages when modal closes
  useEffect(() => {
    if (!open) {
      setMessages([]);
    }
  }, [open]);

  const getWelcomeMessage = () => {
    switch (project.name.toLowerCase()) {
      case "restaurant app":
        return "Welcome to your Restaurant Management System! I can help you with:\n\n• Managing menu items and categories\n• Processing orders and payments\n• Staff management and scheduling\n• Viewing sales reports and analytics\n• Customer management\n\nHow can I assist you today?";
      
      case "customer support":
        return "Hello! I'm your Customer Support Assistant. I can help you with:\n\n• Creating and managing support tickets\n• Live chat with customers\n• Knowledge base management\n• Escalating issues to human agents\n• Tracking customer satisfaction\n\nWhat would you like to do?";
      
      case "tour guide":
        return "Welcome to your Interactive Tour Guide! I can help you with:\n\n• Finding nearby attractions and points of interest\n• Planning optimal tour routes\n• Providing historical and cultural information\n• Managing bookings and schedules\n• Offline map functionality\n\nHow can I enhance your tour experience?";
      
      default:
        return `Welcome to your ${project.name}! I'm here to help you navigate and use all the features of your application. What would you like to know or do?`;
    }
  };

  const generateAppResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Restaurant App responses
    if (project.name.toLowerCase().includes("restaurant")) {
      if (message.includes("menu") || message.includes("item")) {
        return "To manage menu items:\n\n1. Navigate to the Admin Dashboard\n2. Click on 'Menu Management'\n3. Select 'Add New Item' or edit existing items\n4. Fill in the item details (name, price, description, category)\n5. Upload an image if desired\n6. Click 'Save Item'\n\nThe new item will immediately appear in your customer-facing menu! Would you like help with anything else?";
      }
      
      if (message.includes("order")) {
        return "For order management:\n\n• **New Orders**: Appear in real-time on your dashboard\n• **Order Status**: Update from 'Received' → 'Preparing' → 'Ready' → 'Completed'\n• **Kitchen Display**: Shows active orders with preparation times\n• **Payment Processing**: Integrated with your payment gateway\n\nYou can also view order history and generate reports. Need help with a specific order process?";
      }
      
      if (message.includes("staff") || message.includes("employee")) {
        return "Staff management features include:\n\n• **Add Staff Members**: Create accounts for waiters, chefs, managers\n• **Role Permissions**: Different access levels for different positions\n• **Shift Scheduling**: Plan and manage work schedules\n• **Performance Tracking**: Monitor order handling and customer ratings\n\nWould you like to add a new staff member or modify existing permissions?";
      }
    }
    
    // Customer Support App responses
    if (project.name.toLowerCase().includes("support")) {
      if (message.includes("ticket")) {
        return "Ticket management made easy:\n\n• **Create Tickets**: Automatically generated from customer inquiries\n• **Priority Levels**: High, Medium, Low based on issue type\n• **Assignment**: Route to appropriate support agents\n• **Status Tracking**: Open → In Progress → Resolved → Closed\n• **SLA Monitoring**: Track response times and resolution metrics\n\nWould you like to create a new ticket or check existing ones?";
      }
      
      if (message.includes("chat")) {
        return "Live chat functionality:\n\n• **Real-time Messaging**: Instant communication with customers\n• **Chat Routing**: Direct customers to available agents\n• **File Sharing**: Support image and document uploads\n• **Chat History**: Complete conversation records\n• **Canned Responses**: Quick replies for common questions\n\nThe chat widget is active on your website. Need help with chat settings?";
      }
    }
    
    // Tour Guide App responses  
    if (project.name.toLowerCase().includes("tour")) {
      if (message.includes("route") || message.includes("plan")) {
        return "Route planning features:\n\n• **Smart Routing**: Optimized paths based on time and distance\n• **Interest Categories**: Historical sites, restaurants, museums, parks\n• **Custom Tours**: Create personalized experiences\n• **Time Estimates**: Accurate duration calculations\n• **Weather Integration**: Adjusted recommendations based on conditions\n\nWould you like help creating a new tour route or modifying an existing one?";
      }
      
      if (message.includes("location") || message.includes("place")) {
        return "Location services include:\n\n• **GPS Integration**: Real-time location tracking\n• **Nearby Attractions**: Discover points of interest within radius\n• **Detailed Information**: History, hours, contact details, reviews\n• **Photo Gallery**: High-quality images of locations\n• **Audio Guides**: Narrated information for key sites\n\nWhat specific location information are you looking for?";
      }
    }
    
    // Generic responses
    const genericResponses = [
      `Great question! Your ${project.name} has comprehensive features to handle that. Let me walk you through the process step by step.`,
      `I can definitely help you with that in your ${project.name}! Here's what you need to know...`,
      `That's a common question about ${project.name}. The feature you're looking for is designed to be intuitive and user-friendly.`,
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)] + 
           "\n\nIf you need more specific guidance, please let me know exactly what you're trying to accomplish!";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      message: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate app response delay
    setTimeout(() => {
      const appResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "app",
        message: generateAppResponse(inputMessage),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, appResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-brand text-white p-2 rounded-lg">
                <Sparkles size={20} />
              </div>
              <div>
                <DialogTitle>Chat with {project.name}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center space-x-2 mt-1">
                    <span>Interactive demo of your generated application</span>
                    <Badge variant="outline" className="text-xs">
                      {project.status === "completed" ? "Live" : "Preview"}
                    </Badge>
                  </div>
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-chat-modal"
            >
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <Card className="flex-1 min-h-0 shadow-sm border border-gray-100">
          <CardContent className="p-6 h-full overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className={`rounded-full p-2 flex-shrink-0 ${
                    message.sender === "user" 
                      ? "bg-gray-200" 
                      : "bg-gradient-brand text-white"
                  }`}>
                    {message.sender === "user" ? (
                      <User size={16} className="text-gray-600" />
                    ) : (
                      <Sparkles size={16} />
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
                    <p className="text-xs text-gray-500 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start space-x-3">
                  <div className="bg-gradient-brand text-white rounded-full p-2">
                    <Sparkles size={16} />
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Chat Input */}
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex items-center space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask about your ${project.name}...`}
              className="flex-1"
              data-testid="input-chat-app-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              data-testid="button-send-chat-app-message"
            >
              <Send size={16} />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This is a simulated conversation with your generated application.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
