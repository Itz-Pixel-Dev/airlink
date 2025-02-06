import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../middleware/auth';
import logger from '../../handlers/logger';

const prisma = new PrismaClient();

export const info = {
  name: 'Admin Images',
  description: 'Image management for administrators',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

export const router = () => {
  const router = express.Router();


    router.get('/admin/images', isAuthenticated(true), async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = req.session?.user?.id;
        const [user, images, settings] = await Promise.all([
          prisma.users.findUnique({ where: { id: userId } }),
          prisma.images.findMany(),
          prisma.settings.findUnique({ where: { id: 1 } })
        ]);

        if (!user) {
          res.redirect('/login');
          return;
        }

        res.render('admin/images/images', { user, req, settings, images });
      } catch (error) {
        logger.error('Error fetching images:', error);
        return res.redirect('/login');
      }
    });

    router.post('/admin/images/upload', async (req: Request, res: Response): Promise<void> => {
      try {
        res.redirect('/admin/images?success=true');
      } catch (error) {
        logger.error('Error processing image upload:', error);
        res.status(500).send('Failed to process the uploaded file.');
      }
    });

    router.post('/admin/images/create', isAuthenticated(true), async (req: Request, res: Response): Promise<void> => {
      try {
        res.redirect('/admin/images?err=none');
      } catch (error) {
        logger.error('Error creating image:', error);
        res.status(500).send('Failed to create image.');
      }
    });

    router.delete('/admin/images/delete/:id', isAuthenticated(true), async (req: Request, res: Response): Promise<void> => {
      try {
        const id = Number(req.params.id);
        const serverImage = await prisma.images.findUnique({ where: { id } });
        
        if (serverImage) {
          res.status(400).send('This image is being used by a server. Please delete it from the server first.');
          return;
        }

        await prisma.images.delete({ where: { id } });
        res.status(200).send('Image deleted successfully.');
      } catch (error) {
        logger.error('Error deleting image:', error);
        res.status(500).send('Failed to delete image.');
      }
    });

    return router;
  };


