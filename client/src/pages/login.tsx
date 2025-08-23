import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Box, Mail, Lock, Chrome, Github, Crown, Package, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Demo users for different personas
const demoUsers = {
  super_admin: {
    email: "admin@mcpbuilder.com",
    password: "admin123",
    name: "Super Admin",
    persona: "super_admin",
  },
  builder: {
    email: "builder@mcpbuilder.com",
    password: "builder123",
    name: "John Builder",
    persona: "builder",
  },
  end_user: {
    email: "user@mcpbuilder.com",
    password: "user123",
    name: "Jane User",
    persona: "end_user",
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("demo@mcpbuilder.com");
  const [password, setPassword] = useState("demo123");
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof demoUsers>('builder');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handlePersonaSelect = (persona: keyof typeof demoUsers) => {
    setSelectedPersona(persona);
    const user = demoUsers[persona];
    setEmail(user.email);
    setPassword(user.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For demo purposes, we'll simulate a login with the selected persona
      const user = demoUsers[selectedPersona];

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a mock user object with the selected persona
      const mockUser = {
        id: `user-${selectedPersona}`,
        username: user.name.toLowerCase().replace(' ', '_'),
        email: user.email,
        password: user.password, // Add the missing password field
        name: user.name,
        persona: user.persona,
        plan: "pro",
        roles: [user.persona],
        permissions: [],
        metadata: {},
        createdAt: new Date(),
      };

      login(mockUser);

      toast({
        title: `Welcome, ${user.name}!`,
        description: `Logged in as ${user.persona.replace('_', ' ')}.`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="gradient-brand text-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Box size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MCP Builder</h1>
            <p className="text-gray-600 mt-2">Build AI apps with conversation</p>
          </div>

          {/* Persona Selection */}
          <div className="mb-6">
            <Label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Demo Persona
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePersonaSelect('super_admin')}
                className={`p-3 rounded-lg border-2 transition-all ${selectedPersona === 'super_admin'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <Crown className={`w-6 h-6 mx-auto mb-2 ${selectedPersona === 'super_admin' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                <div className="text-xs font-medium">Super Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handlePersonaSelect('builder')}
                className={`p-3 rounded-lg border-2 transition-all ${selectedPersona === 'builder'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <Package className={`w-6 h-6 mx-auto mb-2 ${selectedPersona === 'builder' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                <div className="text-xs font-medium">Builder</div>
              </button>

              <button
                type="button"
                onClick={() => handlePersonaSelect('end_user')}
                className={`p-3 rounded-lg border-2 transition-all ${selectedPersona === 'end_user'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <Users className={`w-6 h-6 mx-auto mb-2 ${selectedPersona === 'end_user' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                <div className="text-xs font-medium">End User</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="demo@mcpbuilder.com"
                  data-testid="input-email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                  data-testid="input-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-brand py-3 font-medium hover:opacity-90 transition-opacity"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing In..." : `Sign In as ${demoUsers[selectedPersona].name}`}
            </Button>

            <div className="text-center">
              <p className="text-gray-500 mb-4">Or continue with</p>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  data-testid="button-google-login"
                >
                  <Chrome className="mr-2 h-4 w-4 text-red-500" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  data-testid="button-github-login"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
