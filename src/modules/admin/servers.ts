import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../../middleware/auth';

export const info = {
  name: 'Admin Servers Module',
  description: 'Server management for administrators',
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

export const serversRouter = router;

export default { info, serversRouter };

