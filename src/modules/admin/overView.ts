import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../../middleware/auth';

export const info = {
  name: 'Admin Overview Module',
  description: 'Admin overview and statistics',
  version: '1.0.0'
};

const prisma = new PrismaClient();
const router = Router();

// Admin check middleware
const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session?.user?.isAdmin) {
    next();
    return;
  }
  res.status(403).render('errors/403');
};

// Admin routes
router.get('/admin', isAuthenticated(), isAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await prisma.server.count();
    const users = await prisma.users.count();
    const nodes = await prisma.node.count();

    res.render('admin/overview', {
      stats: {
        servers: stats,
        users,
        nodes
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).render('errors/500');
  }
});

// Export the module
export const adminModule = {
  info,
  router
};
