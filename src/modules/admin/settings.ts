import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../../middleware/auth';

export const info = {
  name: 'Admin Settings Module',
  description: 'System settings management',
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

// Settings routes
router.get('/admin/settings', 
  isAuthenticated(),
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await prisma.settings.findUnique({
        where: { id: 1 }
      });

      res.render('admin/settings', { settings });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).render('errors/500');
    }
  }
);

router.put('/admin/settings',
  isAuthenticated(),
  isAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, logo, theme, language } = req.body;

      const settings = await prisma.settings.update({
        where: { id: 1 },
        data: {
          title,
          description,
          logo,
          theme,
          language
        }
      });

      res.json(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

// API settings
router.get('/admin/settings/api', async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.render('admin/settings/api', { apiKeys });
  } catch (error) {
    res.status(500).render('errors/500');
  }
});

// Create API key
router.post('/admin/settings/api/keys', async (req: Request, res: Response): Promise<void> => {
  try {
    const key = `ak_${Math.random().toString(36).substring(2)}`;
    await prisma.apiKey.create({
      data: { key }
    });
    res.json({ key });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Delete API key
router.delete('/admin/settings/api/keys/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.apiKey.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export const settingsRouter = router;

export default { info, settingsRouter };
