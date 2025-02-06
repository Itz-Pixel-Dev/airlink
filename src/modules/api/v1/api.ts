import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { apiAuth } from '../../../middleware/auth';
import logger from '../../../handlers/logger';

const prisma = new PrismaClient();

export const info = {
  name: 'API v1',
  description: 'API version 1 endpoints',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

export const router = () => {
  const router = express.Router();

// API key validation middleware
const validateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    res.status(401).json({ error: 'API key is required' });
    return;
  }

  try {
    const key = await prisma.apiKey.findFirst({
      where: { 
        key: apiKey as string,
        active: true
      }
    });

    if (!key) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply API key validation to all API routes
router.use('/api/v1/*', validateApiKey);

// Get server details
router.get('/api/v1/servers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const server = await prisma.server.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        node: true,
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
            isAdmin: true,
            description: true
          }
        }
      }
    });

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    res.json(server);
  } catch (error) {
    console.error('Error fetching server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Server endpoints
router.get('/api/v1/servers', async (req: Request, res: Response) => {
  try {
    const servers = await prisma.server.findMany({
      include: {
        owner: true,
        node: true
      }
    });
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// User endpoints
router.get('/api/v1/users', async (req: Request, res: Response) => {
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
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Node endpoints
router.get('/api/v1/nodes', async (req: Request, res: Response) => {
  try {
    const nodes = await prisma.node.findMany();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
});

return router;

