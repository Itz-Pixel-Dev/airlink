import express from 'express';
import { Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated, isAuthenticatedForServer } from '../../middleware/auth';
import logger from '../../handlers/logger';
import { checkEulaStatus, isWorld } from '../../handlers/features';
import * as minecraftStatus from 'minecraft-status';
import { safeParseJSON, safeStringifyJSON } from '../../utils/json';

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

// Helper function for handling server variables
function parseServerVariables(server: any): ServerVariable[] {
  return safeParseJSON<ServerVariable[]>(server.Variables, []);
}

// Helper function for handling server info
function parseServerInfo(server: any): ServerImageInfo {
  const info = typeof server.image?.info === 'string' 
    ? safeParseJSON<ServerImageInfo>(server.image.info, { features: [], stop: '' })
    : server.image?.info || { features: [], stop: '' };
  return info;
}

const prisma = new PrismaClient();

export const info = {
  name: 'User Server',
  description: 'User server management functionality',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

export const router = () => {
  const router = express.Router();

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

return router;


