import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertMcpServerSchema, insertChatMessageSchema } from "@shared/schema";
import authRoutes from "./routes/auth";
import oauthRoutes from "./routes/oauth";
import marketplaceRoutes from "./routes/marketplace";
import llmRoutes from "./routes/llms";
import { authenticateToken } from "./middleware/phase2-auth";
import type { User } from "./lib/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Register authentication routes
  app.use("/api/auth", authRoutes);

  // Register OAuth routes
  app.use("/api/auth/oauth", oauthRoutes);

  // Register marketplace routes
  app.use("/api/marketplace", marketplaceRoutes);

  // Register LLM routes
  app.use("/api/llms", llmRoutes);

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Get all projects (for Super Admin)
  app.get("/api/all-projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const updates = req.body;
      const project = await storage.updateProject(req.params.id, updates);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // MCP Server routes
  app.get("/api/mcp-servers", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      const servers = await storage.getMcpServers(userId);
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MCP servers" });
    }
  });

  app.post("/api/mcp-servers", async (req, res) => {
    try {
      const validatedData = insertMcpServerSchema.parse(req.body);
      const server = await storage.createMcpServer(validatedData);
      res.status(201).json(server);
    } catch (error) {
      res.status(400).json({ error: "Invalid server data" });
    }
  });

  app.put("/api/mcp-servers/:id", async (req, res) => {
    try {
      const updates = req.body;
      const server = await storage.updateMcpServer(req.params.id, updates);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      res.status(500).json({ error: "Failed to update server" });
    }
  });

  app.delete("/api/mcp-servers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMcpServer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete server" });
    }
  });

  // Chat routes
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(validatedData);

      // Simulate AI response for user messages
      if (validatedData.sender === "user") {
        setTimeout(async () => {
          const aiResponses = [
            "I'll help you build that application. Let me analyze your requirements and suggest the best approach with the right MCP servers and components.",
            "Great idea! I can create a app for you. Would you like me to start with the core functionality or focus on specific features first?",
            "Perfect! I'll design an application that meets your needs. Let me recommend the optimal tech stack and MCP server configuration for this project.",
            "I can create a app for you that tracks user analytics. Let me understand your requirements:\n\n**What specific metrics do you want to track?**\n• Real-time engagement metrics and revenue tracking\n• User activity, engagement rates, revenue visualization\n• Conversion analysis and funnel metrics\n• Performance benchmarks and growth indicators\n\nShall I start building the dashboard structure with these features?"
          ];

          const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
          await storage.createChatMessage({
            userId: validatedData.userId,
            sender: "ai",
            message: randomResponse
          });
        }, 1000);
      }

      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(user => ({ ...user, password: undefined }));
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated via admin panel
      const { password, ...safeUpdates } = updates;

      const updatedUser = await storage.updateUser(id, safeUpdates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent deletion of demo user
      if (id === "demo-user-id") {
        return res.status(403).json({ error: "Cannot delete demo user" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Marketplace routes
  app.get("/api/marketplace", async (req, res) => {
    try {
      const apps = await storage.getMarketplaceApps();
      res.json(apps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketplace apps" });
    }
  });

  // Builder Dashboard API
  app.get("/api/builder/dashboard", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      // Get real data from storage
      const projects = await storage.getProjects(userId);
      const marketplaceQueryResult = await storage.getMarketplaceProjects();
      const marketplaceProjects = marketplaceQueryResult.projects;
      const userPurchases = await storage.getUserPurchases(userId);

      // Calculate real metrics
      const publishedProjects = projects.filter(p => p.published).length;
      const totalRevenue = marketplaceProjects
        .filter((mp: any) => mp.builderId === userId)
        .reduce((sum: number, mp: any) => sum + mp.revenue, 0);

      const totalImplementations = marketplaceProjects
        .filter((mp: any) => mp.builderId === userId)
        .reduce((sum: number, mp: any) => sum + mp.downloadCount, 0);

      const totalCustomers = userPurchases.length;

      // Get recent projects (last 5)
      const recentProjects = projects
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5)
        .map(project => ({
          id: project.id,
          name: project.name,
          status: project.published ? 'published' : 'development',
          implementations: marketplaceProjects.find((mp: any) => mp.projectId === project.id)?.downloadCount || 0,
          revenue: marketplaceProjects.find((mp: any) => mp.projectId === project.id)?.revenue || 0,
          createdAt: project.createdAt ? project.createdAt.toISOString() : new Date().toISOString(),
          rating: 4.5, // Placeholder - would need review system
          downloads: marketplaceProjects.find((mp: any) => mp.projectId === project.id)?.downloadCount || 0,
        }));

      const dashboardData = {
        overview: {
          totalProjects: projects.length,
          publishedProjects,
          totalImplementations,
          activeImplementations: totalImplementations, // Assuming all are active
          totalRevenue,
          monthlyRevenue: Math.round(totalRevenue / 12), // Rough estimate
          monthlyGrowth: 15.5, // Placeholder - would need historical data
          totalCustomers,
          newCustomersThisMonth: Math.round(totalCustomers * 0.2), // Rough estimate
        },
        recentProjects,
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Builder dashboard error:', error);
      res.status(500).json({ error: "Failed to fetch builder dashboard data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
