import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated, isAuthenticatedForServer } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { checkEulaStatus, isWorld } from '../../handlers/features';
import * as minecraftStatus from 'minecraft-status';

interface ErrorMessage {
  [key: string]: string;
}

interface ServerImageInfo {
  features: string[];
  stop: string;
}

interface ServerImage {
  info?: ServerImageInfo | string;
}

interface Port {
  primary: boolean;
  Port: number;
}

interface ServerVariable {
  name: string;
  env: string;
  type: 'boolean' | 'text' | 'number';
  default: string | number | boolean;
  value: string | number | boolean;
}

const prisma = new PrismaClient();

export const info = {
  name: 'Server Module',
  description: 'Server management and control',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

const router = Router();

router.get('/server/:serverId/files/edit',
  isAuthenticated() as RequestHandler,
  isAuthenticatedForServer('serverId') as RequestHandler,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { path } = req.query;
      const server = await prisma.server.findUnique({
        where: { id: parseInt(req.params.serverId) },
        include: { node: true }
      });
      
      if (!server) {
        res.status(404).render('errors/404');
        return;
      }

      const settings = await prisma.settings.findUnique({
        where: { id: 1 }
      });
      
      res.render('server/files/edit', { server, path, settings });
    } catch (error) {
      logger.error('Error accessing file editor:', error);
      res.status(500).render('errors/500');
    }
  }
);

// Add other routes here...

export const createRouter = () => router;

// Cleanup handlers
process.on('exit', async () => {
  await prisma.$disconnect();
});

