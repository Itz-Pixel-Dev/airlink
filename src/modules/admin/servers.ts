import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../middleware/auth';
import logger from '../../handlers/logger';

const prisma = new PrismaClient();

export const info = {
  name: 'Admin Servers',
  description: 'Server management for administrators',
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

// Server management routes
router.get('/admin/servers', isAuthenticated(), isAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const servers = await prisma.server.findMany({
      include: { node: true }
    });
    res.render('admin/servers', { servers });
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).render('errors/500');
  }
});

return router;


