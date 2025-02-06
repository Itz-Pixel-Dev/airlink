import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getDatabaseConfig, getDatabaseHost, validateDatabaseName, generateConnectionString } from '../../handlers/utils/database/databaseUtil';
import { isAuthenticated, isAuthenticatedForServer } from '../../middleware/auth';
import logger from '../../handlers/logger';

const prisma = new PrismaClient();

export const info = {
  name: 'User Database',
  description: 'User database management',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

export const router = () => {
  const router = express.Router();

// List databases for a server
router.get('/server/:serverId/databases',
  isAuthenticated(),
  isAuthenticatedForServer('serverId'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const serverId = parseInt(req.params.serverId);
      const databases = await prisma.database.findMany({
        where: { serverId }
      });

      res.render('server/settings/database', { 
        databases, 
        server: { id: serverId } 
      });
    } catch (error) {
      logger.error('Error fetching databases:', error);
      res.status(500).render('errors/500');
    }
  }
);

// Create database
router.post('/server/:serverId/databases',
  isAuthenticated(),
  isAuthenticatedForServer('serverId'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const serverId = parseInt(req.params.serverId);
      const { name } = req.body;

      const database = await prisma.database.create({
        data: {
          name,
          host: 'localhost',
          port: 3306,
          username: `user_${name}`,
          password: Math.random().toString(36).slice(-8),
          serverId
        }
      });

      res.json(database);
    } catch (error) {
      logger.error('Error creating database:', error);
      res.status(500).json({ error: 'Failed to create database' });
    }
  }
);

// Get database credentials
router.get('/server/:serverId/databases/:id/credentials',
  isAuthenticated(),
  isAuthenticatedForServer('serverId'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const database = await prisma.database.findUnique({
        where: { id: parseInt(req.params.id) }
      });

      if (!database) {
        res.status(404).json({ error: 'Database not found' });
        return;
      }

      res.json({
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password
      });
    } catch (error) {
      logger.error('Error fetching database credentials:', error);
      res.status(500).json({ error: 'Failed to fetch credentials' });
    }
  }
);

// Rotate database password
router.post('/server/:serverId/databases/:id/rotate-password',
  isAuthenticated(),
  isAuthenticatedForServer('serverId'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const database = await prisma.database.update({
        where: { id: parseInt(req.params.id) },
        data: {
          password: Math.random().toString(36).slice(-8)
        }
      });

      res.json({
        username: database.username,
        password: database.password
      });
    } catch (error) {
      logger.error('Error rotating database password:', error);
      res.status(500).json({ error: 'Failed to rotate password' });
    }
  }
);

// Delete database
router.delete('/server/:serverId/databases/:id',
  isAuthenticated(),
  isAuthenticatedForServer('serverId'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.database.delete({
        where: { id: parseInt(req.params.id) }
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting database:', error);
      res.status(500).json({ error: 'Failed to delete database' });
    }
  }
);

return router;


