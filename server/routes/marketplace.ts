import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticateToken,
  requirePermission,
  requireSuperAdmin,
  requireBuilder,
  requireEndUser,
  validateMarketplaceProjectAccess,
  marketplaceRateLimit,
  purchaseRateLimit,
  reviewRateLimit,
  validateRequest,
  validateQuery,
  logMarketplaceOperation
} from '../middleware/phase2-auth';
import { storage } from '../storage';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const publishProjectSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().int().min(0), // Price in cents
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional()
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional()
});

const purchaseProjectSchema = z.object({
  projectId: z.string().uuid(),
  paymentMethod: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(1).max(1000).optional()
});

const marketplaceQuerySchema = z.object({
  category: z.string().optional(),
  tags: z.string().optional(),
  minPrice: z.string().transform(val => parseInt(val)).optional(),
  maxPrice: z.string().transform(val => parseInt(val)).optional(),
  rating: z.string().transform(val => parseFloat(val)).optional(),
  featured: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['price', 'rating', 'downloads', 'date']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional()
});

// ============================================================================
// PROJECT PUBLISHING
// ============================================================================

/**
 * POST /api/marketplace/projects
 * Publish a project to the marketplace
 */
router.post('/projects',
  authenticateToken,
  requirePermission('publish_project'),
  marketplaceRateLimit,
  validateRequest(publishProjectSchema),
  logMarketplaceOperation('publish_project'),
  async (req: Request, res: Response) => {
    try {
      const { projectId, title, description, price, category, tags, featured } = req.body;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Validate that the project exists and belongs to the user
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      if (project.userId !== req.user.id && req.user.persona !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied - project ownership required',
          code: 'PROJECT_OWNERSHIP_REQUIRED'
        });
      }

      // Check if project is already published
      const existingMarketplaceProject = await storage.getMarketplaceProjectByProjectId(projectId);
      if (existingMarketplaceProject) {
        return res.status(409).json({
          error: 'Project is already published to marketplace',
          code: 'PROJECT_ALREADY_PUBLISHED'
        });
      }

      // Create marketplace project
      const marketplaceProject = await storage.createMarketplaceProject({
        projectId,
        builderId: req.user.id,
        title,
        description: description || project.description || '',
        price,
        category: category || 'general',
        tags: tags || [],
        featured: featured || false,
        status: 'active'
      });

      // Update the original project status
      await storage.updateProject(projectId, {
        published: 'true',
        marketplacePrice: price,
        marketplaceDescription: description || project.description || ''
      });

      res.status(201).json({
        success: true,
        message: 'Project published to marketplace successfully',
        data: {
          marketplaceProject: {
            id: marketplaceProject.id,
            projectId: marketplaceProject.projectId,
            builderId: marketplaceProject.builderId,
            title: marketplaceProject.title,
            description: marketplaceProject.description,
            price: marketplaceProject.price,
            category: marketplaceProject.category,
            tags: marketplaceProject.tags,
            status: marketplaceProject.status,
            featured: marketplaceProject.featured,
            rating: marketplaceProject.rating,
            reviewCount: marketplaceProject.reviewCount,
            downloadCount: marketplaceProject.downloadCount,
            revenue: marketplaceProject.revenue,
            publishedAt: marketplaceProject.publishedAt
          }
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE PUBLISH ERROR]', error);
      res.status(500).json({
        error: 'Failed to publish project to marketplace',
        code: 'PUBLISH_FAILED'
      });
    }
  }
);

/**
 * PUT /api/marketplace/projects/:id
 * Update a marketplace project
 */
router.put('/projects/:id',
  authenticateToken,
  requirePermission('publish_project'),
  marketplaceRateLimit,
  validateRequest(updateProjectSchema),
  logMarketplaceOperation('update_project'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Get the marketplace project
      const marketplaceProject = await storage.getMarketplaceProject(id);
      if (!marketplaceProject) {
        return res.status(404).json({
          error: 'Marketplace project not found',
          code: 'MARKETPLACE_PROJECT_NOT_FOUND'
        });
      }

      // Check ownership
      if (marketplaceProject.builderId !== req.user.id && req.user.persona !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied - project ownership required',
          code: 'PROJECT_OWNERSHIP_REQUIRED'
        });
      }

      // Update marketplace project
      const updatedProject = await storage.updateMarketplaceProject(id, updates);

      // Update the original project if price or description changed
      if (updates.price || updates.description) {
        const projectUpdates: any = {};
        if (updates.price) projectUpdates.marketplacePrice = updates.price;
        if (updates.description) projectUpdates.marketplaceDescription = updates.description;

        await storage.updateProject(marketplaceProject.projectId, projectUpdates);
      }

      res.json({
        success: true,
        message: 'Marketplace project updated successfully',
        data: {
          marketplaceProject: updatedProject
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE UPDATE ERROR]', error);
      res.status(500).json({
        error: 'Failed to update marketplace project',
        code: 'UPDATE_FAILED'
      });
    }
  }
);

/**
 * DELETE /api/marketplace/projects/:id
 * Remove a project from marketplace
 */
router.delete('/projects/:id',
  authenticateToken,
  requirePermission('publish_project'),
  marketplaceRateLimit,
  logMarketplaceOperation('unpublish_project'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Get the marketplace project
      const marketplaceProject = await storage.getMarketplaceProject(id);
      if (!marketplaceProject) {
        return res.status(404).json({
          error: 'Marketplace project not found',
          code: 'MARKETPLACE_PROJECT_NOT_FOUND'
        });
      }

      // Check ownership
      if (marketplaceProject.builderId !== req.user.id && req.user.persona !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied - project ownership required',
          code: 'PROJECT_OWNERSHIP_REQUIRED'
        });
      }

      // Delete marketplace project
      await storage.deleteMarketplaceProject(id);

      // Update the original project status
      await storage.updateProject(marketplaceProject.projectId, {
        published: 'false'
      });

      res.json({
        success: true,
        message: 'Project removed from marketplace successfully'
      });

    } catch (error) {
      console.error('[MARKETPLACE DELETE ERROR]', error);
      res.status(500).json({
        error: 'Failed to remove project from marketplace',
        code: 'DELETE_FAILED'
      });
    }
  }
);

// ============================================================================
// PROJECT DISCOVERY
// ============================================================================

/**
 * GET /api/marketplace/projects
 * Get marketplace projects with persona-based filtering and pagination
 */
router.get('/projects',
  authenticateToken,
  validateQuery(marketplaceQuerySchema),
  logMarketplaceOperation('browse_projects'),
  async (req: Request, res: Response) => {
    try {
      const {
        category,
        tags,
        minPrice,
        maxPrice,
        rating,
        featured,
        sortBy = 'date',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query as any;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Build filters based on user persona
      const filters: any = {};

      // Super Admin: can see all projects
      if (req.user.persona === 'super_admin') {
        // No status filter - can see all
      }
      // Builder: can see active approved projects plus own projects
      else if (req.user.persona === 'builder') {
        filters.status = 'active';
        filters.approval_status = 'approved';
        // Will also include own projects regardless of status
      }
      // End User: can only see active approved projects
      else {
        filters.status = 'active';
        filters.approval_status = 'approved';
      }

      if (category) filters.category = category;
      if (featured !== undefined) filters.featured = featured;
      if (minPrice !== undefined) filters.minPrice = minPrice;
      if (maxPrice !== undefined) filters.maxPrice = maxPrice;
      if (rating !== undefined) filters.minRating = rating;
      if (tags) filters.tags = tags.split(',');

      // Get marketplace projects
      const result = await storage.getMarketplaceProjects({
        filters,
        sortBy,
        sortOrder,
        page,
        limit,
        includeOwnProjects: req.user.persona === 'builder',
        userId: req.user.id
      });

      res.json({
        success: true,
        data: {
          projects: result.projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            price: project.price,
            category: project.category,
            tags: project.tags,
            rating: project.rating,
            reviewCount: project.reviewCount,
            downloadCount: project.downloadCount,
            featured: project.featured,
            status: project.status,
            approval_status: project.approval_status,
            builder: {
              id: project.builderId,
              name: project.builderName || 'Unknown Builder'
            },
            publishedAt: project.publishedAt,
            // Include additional fields for builders and admins
            ...(req.user.persona !== 'end_user' && {
              mcpServers: project.mcpServers,
              popularity_score: project.popularity_score
            })
          })),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / result.limit)
          }
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE BROWSE ERROR]', error);
      res.status(500).json({
        error: 'Failed to fetch marketplace projects',
        code: 'BROWSE_FAILED'
      });
    }
  }
);

/**
 * GET /api/marketplace/projects/:id
 * Get detailed marketplace project information
 */
router.get('/projects/:id',
  authenticateToken, // Changed from optionalAuth to authenticateToken
  logMarketplaceOperation('view_project'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const marketplaceProject = await storage.getMarketplaceProject(id);
      if (!marketplaceProject) {
        return res.status(404).json({
          error: 'Marketplace project not found',
          code: 'MARKETPLACE_PROJECT_NOT_FOUND'
        });
      }

      // Get the original project details
      const project = await storage.getProject(marketplaceProject.projectId);
      if (!project) {
        return res.status(404).json({
          error: 'Original project not found',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Get builder information
      const builder = await storage.getUserById(marketplaceProject.builderId);

      // Get reviews
      const reviews = await storage.getMarketplaceProjectReviews(id, { limit: 10 });

      res.json({
        success: true,
        data: {
          marketplaceProject: {
            id: marketplaceProject.id,
            title: marketplaceProject.title,
            description: marketplaceProject.description,
            price: marketplaceProject.price,
            category: marketplaceProject.category,
            tags: marketplaceProject.tags,
            rating: marketplaceProject.rating,
            reviewCount: marketplaceProject.reviewCount,
            downloadCount: marketplaceProject.downloadCount,
            featured: marketplaceProject.featured,
            publishedAt: marketplaceProject.publishedAt
          },
          project: {
            id: project.id,
            name: project.name,
            prompt: project.prompt,
            llm: project.llm,
            mcpServers: project.mcpServers,
            files: project.files
          },
          builder: builder ? {
            id: builder.id,
            email: builder.email,
            persona: builder.persona
          } : null,
          reviews: reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            reviewText: review.reviewText,
            reviewerId: review.reviewerId,
            createdAt: review.createdAt
          }))
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE VIEW PROJECT ERROR]', error);
      res.status(500).json({
        error: 'Failed to fetch project details',
        code: 'VIEW_FAILED'
      });
    }
  }
);

/**
 * GET /api/marketplace/projects/featured
 * Get featured marketplace projects
 */
router.get('/projects/featured',
  authenticateToken, // Changed from optionalAuth to authenticateToken
  logMarketplaceOperation('browse_featured'),
  async (req: Request, res: Response) => {
    try {
      const featuredProjects = await storage.getFeaturedMarketplaceProjects();

      res.json({
        success: true,
        data: {
          projects: featuredProjects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            price: project.price,
            category: project.category,
            tags: project.tags,
            rating: project.rating,
            reviewCount: project.reviewCount,
            downloadCount: project.downloadCount,
            builder: {
              id: project.builderId,
              name: project.builderName || 'Unknown Builder'
            },
            publishedAt: project.publishedAt
          }))
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE FEATURED ERROR]', error);
      res.status(500).json({
        error: 'Failed to fetch featured projects',
        code: 'FEATURED_FAILED'
      });
    }
  }
);

// ============================================================================
// PURCHASE MANAGEMENT
// ============================================================================

/**
 * POST /api/marketplace/purchases
 * Purchase a marketplace project
 */
router.post('/purchases',
  authenticateToken,
  requirePermission('purchase_project'),
  purchaseRateLimit,
  validateRequest(purchaseProjectSchema),
  logMarketplaceOperation('purchase_project'),
  async (req: Request, res: Response) => {
    try {
      const { projectId, paymentMethod, metadata } = req.body;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Get marketplace project
      const marketplaceProject = await storage.getMarketplaceProject(projectId);
      if (!marketplaceProject) {
        return res.status(404).json({
          error: 'Marketplace project not found',
          code: 'MARKETPLACE_PROJECT_NOT_FOUND'
        });
      }

      // Check if project is active
      if (marketplaceProject.status !== 'active') {
        return res.status(400).json({
          error: 'Project is not available for purchase',
          code: 'PROJECT_NOT_AVAILABLE'
        });
      }

      // Check if user is trying to purchase their own project
      if (marketplaceProject.builderId === req.user.id) {
        return res.status(400).json({
          error: 'Cannot purchase your own project',
          code: 'SELF_PURCHASE_NOT_ALLOWED'
        });
      }

      // Check if user has already purchased this project
      const existingPurchase = await storage.getUserPurchase(req.user.id, projectId);
      if (existingPurchase) {
        return res.status(409).json({
          error: 'Project already purchased',
          code: 'ALREADY_PURCHASED'
        });
      }

      // Create purchase record
      const purchase = await storage.createMarketplacePurchase({
        projectId,
        buyerId: req.user.id,
        sellerId: marketplaceProject.builderId,
        amount: marketplaceProject.price,
        currency: 'USD',
        status: 'completed',
        paymentMethod: paymentMethod || 'platform',
        metadata: metadata || {}
      });

      // Update download count
      await storage.updateMarketplaceProject(projectId, {
        downloadCount: marketplaceProject.downloadCount + 1
      });

      // Create revenue event
      await storage.createRevenueEvent({
        eventType: 'purchase',
        projectId: marketplaceProject.projectId,
        builderId: marketplaceProject.builderId,
        buyerId: req.user.id,
        amount: marketplaceProject.price,
        currency: 'USD',
        commissionRate: 0.3000, // 30% platform fee
        builderShare: Math.floor(marketplaceProject.price * 0.7), // 70% builder share
        platformShare: Math.floor(marketplaceProject.price * 0.3), // 30% platform share
        status: 'processed',
        paymentMethod: paymentMethod || 'platform',
        metadata: {
          purchaseId: purchase.id,
          projectTitle: marketplaceProject.title
        }
      });

      // Generate download token
      const downloadToken = await storage.generateDownloadToken(projectId, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Project purchased successfully',
        data: {
          purchase: {
            id: purchase.id,
            projectId: purchase.projectId,
            amount: purchase.amount,
            currency: purchase.currency,
            status: purchase.status,
            purchasedAt: purchase.purchasedAt
          },
          downloadUrl: `/api/marketplace/downloads/${projectId}`,
          accessToken: downloadToken
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE PURCHASE ERROR]', error);
      res.status(500).json({
        error: 'Failed to purchase project',
        code: 'PURCHASE_FAILED'
      });
    }
  }
);

/**
 * GET /api/marketplace/purchases
 * Get user's purchase history
 */
router.get('/purchases',
  authenticateToken,
  logMarketplaceOperation('view_purchases'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      const purchases = await storage.getUserPurchases(req.user.id);

      res.json({
        success: true,
        data: {
          purchases: purchases.map(purchase => ({
            id: purchase.id,
            projectId: purchase.projectId,
            amount: purchase.amount,
            currency: purchase.currency,
            status: purchase.status,
            purchasedAt: purchase.purchasedAt,
            project: purchase.project ? {
              title: purchase.project.title,
              description: purchase.project.description,
              category: purchase.project.category
            } : null
          }))
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE PURCHASES ERROR]', error);
      res.status(500).json({
        error: 'Failed to fetch purchase history',
        code: 'PURCHASES_FAILED'
      });
    }
  }
);

// ============================================================================
// REVIEWS AND RATINGS
// ============================================================================

/**
 * POST /api/marketplace/projects/:id/reviews
 * Add a review to a marketplace project
 */
router.post('/projects/:id/reviews',
  authenticateToken,
  requirePermission('purchase_project'),
  reviewRateLimit,
  validateRequest(reviewSchema),
  logMarketplaceOperation('add_review'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rating, reviewText } = req.body;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Check if user has purchased the project
      const purchase = await storage.getUserPurchase(req.user.id, id);
      if (!purchase) {
        return res.status(403).json({
          error: 'Must purchase project before reviewing',
          code: 'PURCHASE_REQUIRED_FOR_REVIEW'
        });
      }

      // Check if user has already reviewed this project
      const existingReview = await storage.getUserProjectReview(req.user.id, id);
      if (existingReview) {
        return res.status(409).json({
          error: 'You have already reviewed this project',
          code: 'REVIEW_ALREADY_EXISTS'
        });
      }

      // Create review
      const review = await storage.createMarketplaceReview({
        projectId: id,
        reviewerId: req.user.id,
        rating,
        reviewText: reviewText || ''
      });

      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: {
          review: {
            id: review.id,
            rating: review.rating,
            reviewText: review.reviewText,
            createdAt: review.createdAt
          }
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE REVIEW ERROR]', error);
      res.status(500).json({
        error: 'Failed to add review',
        code: 'REVIEW_FAILED'
      });
    }
  }
);

/**
 * GET /api/marketplace/projects/:id/reviews
 * Get reviews for a marketplace project
 */
router.get('/projects/:id/reviews',
  authenticateToken, // Changed from optionalAuth to authenticateToken
  logMarketplaceOperation('view_reviews'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query as any;

      const reviews = await storage.getMarketplaceProjectReviews(id, { page, limit });

      res.json({
        success: true,
        data: {
          reviews: reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            reviewText: review.reviewText,
            helpfulCount: review.helpfulCount,
            createdAt: review.createdAt,
            reviewer: {
              id: review.reviewerId,
              // Note: In a real implementation, you'd fetch reviewer details
              name: 'Anonymous User'
            }
          }))
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE REVIEWS ERROR]', error);
      res.status(500).json({
        error: 'Failed to fetch reviews',
        code: 'REVIEWS_FAILED'
      });
    }
  }
);

// ============================================================================
// ANALYTICS (Super Admin Only)
// ============================================================================

/**
 * GET /api/marketplace/analytics/overview
 * Get marketplace overview analytics
 */
router.get('/analytics/overview',
  authenticateToken,
  requireSuperAdmin,
  logMarketplaceOperation('view_analytics'),
  async (req: Request, res: Response) => {
    try {
      const stats = await storage.getMarketplaceStats();

      res.json({
        success: true,
        data: {
          overview: {
            totalProjects: stats.totalProjects,
            activeProjects: stats.activeProjects,
            totalSales: stats.totalSales,
            totalRevenue: stats.totalRevenue,
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews
          }
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE ANALYTICS ERROR]', error);
      res.status(500).json({
        error: 'Failed to fetch marketplace analytics',
        code: 'ANALYTICS_FAILED'
      });
    }
  }
);

// ============================================================================
// PERSONA-BASED MARKETPLACE ENDPOINTS
// ============================================================================

/**
 * GET /api/marketplace/admin/projects
 * Get all projects for admin management (Super Admin only)
 */
router.get('/admin/projects',
  authenticateToken,
  requireSuperAdmin,
  logMarketplaceOperation('admin_view_projects'),
  async (req: Request, res: Response) => {
    try {
      const {
        status,
        approval_status,
        category,
        sortBy = 'published_at',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query as any;

      // Build filters
      const filters: any = {};
      if (status) filters.status = status;
      if (approval_status) filters.approval_status = approval_status;
      if (category) filters.category = category;

      // Get all marketplace projects for admin
      const result = await storage.getMarketplaceProjects({
        filters,
        sortBy,
        sortOrder,
        page,
        limit,
        includeInactive: true,
        includePending: true
      });

      // Group projects by status - ensure mutually exclusive categorization
      const pendingProjects = result.projects.filter(p => p.approval_status === 'pending');
      const activeProjects = result.projects.filter(p => p.status === 'active' && p.approval_status === 'approved');
      const inactiveProjects = result.projects.filter(p => p.status === 'inactive' && p.approval_status !== 'pending');

      res.json({
        success: true,
        data: {
          pending: pendingProjects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            price: project.price,
            category: project.category,
            tags: project.tags,
            status: project.status,
            approval_status: project.approval_status,
            featured: project.featured,
            rating: project.rating,
            reviewCount: project.reviewCount,
            downloadCount: project.downloadCount,
            builder: {
              id: project.builderId,
              name: project.builderName || 'Unknown Builder'
            },
            publishedAt: project.publishedAt
          })),
          active: activeProjects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            price: project.price,
            category: project.category,
            tags: project.tags,
            status: project.status,
            approval_status: project.approval_status,
            featured: project.featured,
            rating: project.rating,
            reviewCount: project.reviewCount,
            downloadCount: project.downloadCount,
            builder: {
              id: project.builderId,
              name: project.builderName || 'Unknown Builder'
            },
            publishedAt: project.publishedAt
          })),
          inactive: inactiveProjects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            price: project.price,
            category: project.category,
            tags: project.tags,
            status: project.status,
            approval_status: project.approval_status,
            featured: project.featured,
            rating: project.rating,
            reviewCount: project.reviewCount,
            downloadCount: project.downloadCount,
            builder: {
              id: project.builderId,
              name: project.builderName || 'Unknown Builder'
            },
            publishedAt: project.publishedAt
          })),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / result.limit)
          }
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE ADMIN VIEW ERROR]', error);
      res.status(500).json({
        error: 'Failed to fetch admin marketplace projects',
        code: 'ADMIN_VIEW_FAILED'
      });
    }
  }
);

/**
 * PUT /api/marketplace/admin/projects/:id/status
 * Activate/deactivate projects (Super Admin only)
 */
router.put('/admin/projects/:id/status',
  authenticateToken,
  requireSuperAdmin,
  validateRequest(z.object({
    status: z.enum(['active', 'inactive']),
    approval_status: z.enum(['approved', 'rejected']).optional(),
    rejection_reason: z.string().optional()
  })),
  logMarketplaceOperation('admin_update_project_status'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, approval_status, rejection_reason } = req.body;

      // Get the project from the projects table (single table design)
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Update project marketplace status
      const updates: any = {};
      if (status) {
        updates.marketplaceStatus = status;
      }
      if (approval_status) {
        updates.marketplaceApprovalStatus = approval_status;
        updates.marketplaceApprovedBy = req.user?.id;
        updates.marketplaceApprovedAt = new Date();
        if (rejection_reason) {
          updates.marketplaceRejectionReason = rejection_reason;
        }
      }

      const updatedProject = await storage.updateProject(id, updates);

      res.json({
        success: true,
        message: `Project ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        data: {
          project: {
            id: updatedProject.id,
            name: updatedProject.name,
            marketplaceStatus: updatedProject.marketplaceStatus,
            marketplaceApprovalStatus: updatedProject.marketplaceApprovalStatus
          }
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE ADMIN STATUS UPDATE ERROR]', error);
      res.status(500).json({
        error: 'Failed to update project status',
        code: 'STATUS_UPDATE_FAILED'
      });
    }
  }
);

/**
 * GET /api/marketplace/builder/projects
 * Get builder's own projects and marketplace projects (Builder only)
 */
router.get('/builder/projects',
  authenticateToken,
  requireBuilder,
  logMarketplaceOperation('builder_view_projects'),
  async (req: Request, res: Response) => {
    try {
      const {
        status,
        category,
        sortBy = 'published_at',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query as any;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Get builder's own projects
      const ownProjects = await storage.getProjects(req.user.id);

      // Get marketplace projects (active and approved)
      const filters: any = {
        marketplaceStatus: 'active',
        marketplaceApprovalStatus: 'approved'
      };
      if (category) filters.category = category;

      const marketplaceResult = await storage.getMarketplaceProjects({
        filters,
        sortBy,
        sortOrder,
        page,
        limit
      });

      // Get builder's own marketplace projects (published projects)
      const ownMarketplaceProjects = ownProjects.filter(project => project.published === 'true');

      res.json({
        success: true,
        data: {
          ownProjects: ownProjects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            llm: project.llm,
            mcpServers: project.mcpServers,
            category: project.category,
            tags: project.tags,
            published: project.published,
            marketplacePrice: project.marketplacePrice,
            createdAt: project.createdAt
          })),
          marketplaceProjects: marketplaceResult.projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            price: project.price,
            category: project.category,
            tags: project.tags,
            status: project.status,
            approval_status: project.approval_status,
            featured: project.featured,
            rating: project.rating,
            reviewCount: project.reviewCount,
            downloadCount: project.downloadCount,
            builder: {
              id: project.builderId,
              name: project.builderName || 'Unknown Builder'
            },
            publishedAt: project.publishedAt
          })),
          ownMarketplaceProjects: ownMarketplaceProjects.map(project => ({
            id: project.id,
            title: project.name,
            description: project.description,
            price: project.marketplacePrice || 0,
            category: project.category,
            tags: project.tags || [],
            status: project.marketplaceStatus || 'active',
            approval_status: project.marketplaceApprovalStatus || 'approved',
            featured: project.marketplaceFeatured || false,
            rating: project.marketplaceRating || 0,
            reviewCount: project.marketplaceReviewCount || 0,
            downloadCount: project.marketplaceDownloadCount || 0,
            publishedAt: project.marketplacePublishedAt || project.createdAt
          })),
          pagination: {
            page: marketplaceResult.page,
            limit: marketplaceResult.limit,
            total: marketplaceResult.total,
            totalPages: Math.ceil(marketplaceResult.total / marketplaceResult.limit)
          }
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE BUILDER VIEW ERROR]', error);
      res.status(500).json({
        error: 'Failed to fetch builder marketplace projects',
        code: 'BUILDER_VIEW_FAILED'
      });
    }
  }
);

/**
 * POST /api/marketplace/builder/projects/:id/publish
 * Publish a project to marketplace (Builder only)
 */
router.post('/builder/projects/:id/publish',
  authenticateToken,
  requireBuilder,
  validateRequest(z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    price: z.number().int().min(0),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    mcpServers: z.array(z.string()).optional()
  })),
  logMarketplaceOperation('builder_publish_project'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, price, category, tags, mcpServers } = req.body;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Verify project ownership
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      if (project.userId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied - project ownership required',
          code: 'PROJECT_OWNERSHIP_REQUIRED'
        });
      }

      // Check if project is already published
      const existingMarketplaceProject = await storage.getMarketplaceProjectByProjectId(id);
      if (existingMarketplaceProject) {
        return res.status(409).json({
          error: 'Project is already published to marketplace',
          code: 'PROJECT_ALREADY_PUBLISHED'
        });
      }

      // Create marketplace project
      const marketplaceProject = await storage.createMarketplaceProject({
        projectId: id,
        builderId: req.user.id,
        title,
        description: description || project.description || '',
        price,
        category: category || 'general',
        tags: tags || [],
        mcpServers: mcpServers || project.mcpServers || [],
        status: 'inactive', // Start as inactive, admin must approve
        approval_status: 'pending'
      });

      // Update the original project
      await storage.updateProject(id, {
        published: 'true',
        marketplacePrice: price,
        marketplaceDescription: description || project.description || ''
      });

      res.status(201).json({
        success: true,
        message: 'Project published to marketplace successfully. Awaiting admin approval.',
        data: {
          marketplaceProject: {
            id: marketplaceProject.id,
            projectId: marketplaceProject.projectId,
            title: marketplaceProject.title,
            description: marketplaceProject.description,
            price: marketplaceProject.price,
            category: marketplaceProject.category,
            tags: marketplaceProject.tags,
            status: marketplaceProject.status,
            approval_status: marketplaceProject.approval_status,
            publishedAt: marketplaceProject.publishedAt
          }
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE BUILDER PUBLISH ERROR]', error);
      res.status(500).json({
        error: 'Failed to publish project to marketplace',
        code: 'PUBLISH_FAILED'
      });
    }
  }
);

/**
 * DELETE /api/marketplace/builder/projects/:id/publish
 * Unpublish a project from marketplace (Builder only)
 */
router.delete('/builder/projects/:id/publish',
  authenticateToken,
  requireBuilder,
  logMarketplaceOperation('builder_unpublish_project'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Find the marketplace project by its ID
      const marketplaceProject = await storage.getMarketplaceProject(id);
      if (!marketplaceProject) {
        return res.status(404).json({
          error: 'Project not found in marketplace',
          code: 'MARKETPLACE_PROJECT_NOT_FOUND'
        });
      }

      // Verify project ownership
      if (marketplaceProject.builderId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied - project ownership required',
          code: 'PROJECT_OWNERSHIP_REQUIRED'
        });
      }

      // Delete the marketplace project
      await storage.deleteMarketplaceProject(marketplaceProject.id);

      // Update the original project to mark as unpublished
      await storage.updateProject(marketplaceProject.projectId, {
        published: 'false',
        marketplacePrice: null,
        marketplaceDescription: null
      });

      res.json({
        success: true,
        message: 'Project unpublished from marketplace successfully.',
        data: {
          projectId: id
        }
      });

    } catch (error) {
      console.error('[MARKETPLACE BUILDER UNPUBLISH ERROR]', error);
      res.status(500).json({
        error: 'Failed to unpublish project from marketplace',
        code: 'UNPUBLISH_FAILED'
      });
    }
  }
);

// ============================================================================
// ENHANCED PROJECT DISCOVERY WITH PERSONA-BASED FILTERING
// ============================================================================

export default router;
