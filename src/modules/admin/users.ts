import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../../middleware/auth';
import logger from '../../handlers/logger';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const info = {
  name: 'Admin Users',
  description: 'User management for administrators',
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

// User management routes
router.get('/admin/users',
  isAuthenticated(),
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await prisma.users.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          isAdmin: true,
          description: true
        }
      });

      res.render('admin/users', { users });
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).render('errors/500');
    }
  }
);

router.post('/admin/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, isAdmin } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isAdmin: isAdmin === 'true'
      }
    });
    
    res.redirect('/admin/users');
  } catch (error) {
    res.status(500).render('errors/500');
  }
});

router.get('/admin/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        servers: true
      }
    });
    
    if (!user) {
      res.status(404).render('errors/404');
      return;
    }
    
    res.render('admin/users/user', { user });
  } catch (error) {
    res.status(500).render('errors/500');
  }
});

router.put('/admin/users/:id',
  isAuthenticated(),
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { isAdmin: setAdmin } = req.body;
      const userId = parseInt(req.params.id);

      const user = await prisma.users.update({
        where: { id: userId },
        data: { isAdmin: setAdmin },
        select: {
          id: true,
          email: true,
          username: true,
          isAdmin: true,
          description: true
        }
      });

      res.json(user);
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

router.delete('/admin/users/:id',
  isAuthenticated(),
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);

      // Don't allow deleting the current user
      if (req.session?.user?.id === userId) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      await prisma.users.delete({
        where: { id: userId }
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

return router;


