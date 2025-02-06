import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../../middleware/auth';
import logger from '../../handlers/logger';

const prisma = new PrismaClient();

export const info = {
  name: 'User Dashboard',
  description: 'User dashboard functionality',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

export const router = () => {
  const router = express.Router();

// Apply authentication to all dashboard routes
router.use('/dashboard/*', isAuthenticated());

// Dashboard routes
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.user?.id;
    const [servers, nodes] = await Promise.all([
      prisma.server.count({ where: { ownerId: userId } }),
      prisma.node.count()
    ]);

    res.render('dashboard', {
      stats: {
        servers,
        nodes
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).render('errors/500');
  }
});

// Account management routes
router.get('/account', isAuthenticated(), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.user?.id;
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        description: true
      }
    });

    if (!user) {
      res.status(404).render('errors/404');
      return;
    }

    res.render('account', { user });
  } catch (error) {
    logger.error('Error fetching user account:', error);
    res.status(500).render('errors/500');
  }
});

router.put('/account', isAuthenticated(), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.user?.id;
    const { username, description } = req.body;

    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        username,
        description
      },
      select: {
        email: true,
        username: true,
        description: true
      }
    });

    res.json(user);
  } catch (error) {
    logger.error('Error updating user account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

return router;

