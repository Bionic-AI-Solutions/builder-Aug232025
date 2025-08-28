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

      if (project.userId !== (req.user as any).id && (req.user as any).persona !== 'super_admin') {
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
        builderId: (req.user as any).id,
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
        published: 'true'
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
      if (marketplaceProject.builderId !== (req.user as any).id && (req.user as any).persona !== 'super_admin') {
        return res.status(403).json({
          error: 'Access denied - project ownership required',
          code: 'PROJECT_OWNERSHIP_REQUIRED'
        });
      }

      // Update marketplace project
      const updatedProject = await storage.updateMarketplaceProject(id, updates);

      // Note: Marketplace pricing is handled separately in marketplaceApps table
      // No need to update the original project for price/description changes

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
      if (marketplaceProject.builderId !== (req.user as any).id && (req.user as any).persona !== 'super_admin') {
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
 * Get marketplace projects with filtering and pagination
 */
router.get('/projects',
  // authenticateToken, // Temporarily disabled for testing
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

      // Build filters
      const filters: any = {
        status: 'active'
      };

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
        limit
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
            builder: {
              id: project.builderId,
              name: project.builderName || 'Unknown Builder'
            },
            publishedAt: project.publishedAt
          })),
          pagination: {
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages
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
      if (marketplaceProject.builderId === (req.user as any).id) {
        return res.status(400).json({
          error: 'Cannot purchase your own project',
          code: 'SELF_PURCHASE_NOT_ALLOWED'
        });
      }

      // Check if user has already purchased this project
      const existingPurchase = await storage.getUserPurchase((req.user as any).id, projectId);
      if (existingPurchase) {
        return res.status(409).json({
          error: 'Project already purchased',
          code: 'ALREADY_PURCHASED'
        });
      }

      // Create purchase record
      const purchase = await storage.createMarketplacePurchase({
        projectId,
        buyerId: (req.user as any).id,
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
        buyerId: (req.user as any).id,
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
      const downloadToken = await storage.generateDownloadToken(projectId, (req.user as any).id);

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

      const purchases = await storage.getUserPurchases((req.user as any).id);

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
      const purchase = await storage.getUserPurchase((req.user as any).id, id);
      if (!purchase) {
        return res.status(403).json({
          error: 'Must purchase project before reviewing',
          code: 'PURCHASE_REQUIRED_FOR_REVIEW'
        });
      }

      // Check if user has already reviewed this project
      const existingReview = await storage.getUserProjectReview((req.user as any).id, id);
      if (existingReview) {
        return res.status(409).json({
          error: 'You have already reviewed this project',
          code: 'REVIEW_ALREADY_EXISTS'
        });
      }

      // Create review
      const review = await storage.createMarketplaceReview({
        projectId: id,
        reviewerId: (req.user as any).id,
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

export default router;
