import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../middleware/auth';
import logger from '../../handlers/logger';

const prisma = new PrismaClient();

export const info = {
  name: 'Admin Overview',
  description: 'Admin dashboard overview',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

export const router = () => {
  const router = express.Router();

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

return router;

