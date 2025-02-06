import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const info = {
  name: 'Core',
  description: 'Core functionality',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

export const router = () => {
  const router = express.Router();

  // Home page
  router.get('/', async (req: Request, res: Response) => {
    try {
      const settings = await prisma.settings.findUnique({
        where: { id: 1 }
      });

      if (req.session.user) {
        const [user, servers] = await Promise.all([
          prisma.users.findUnique({
            where: { id: req.session.user.id }
          }),
          prisma.server.findMany({
            where: { ownerId: req.session.user.id },
            include: { node: true }
          })
        ]);
        res.render('user/dashboard', { user, servers, settings });
      } else {
        res.render('auth/login', { settings });
      }
    } catch (error) {
      res.status(500).render('errors/500');
    }
  });

  // Health check endpoint
  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handlers
  router.use((req: Request, res: Response) => {
    res.status(404).render('errors/404');
  });

  router.use((err: Error, req: Request, res: Response) => {
    console.error(err);
    res.status(500).render('errors/500');
  });

  return router;
};

export default { info, router };
