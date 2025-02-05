import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { WebSocket } from 'ws';
import logger from '../../logger';

// Use a single Prisma instance for connection pooling
const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  server?: any;
}

/**
 * Server authentication middleware for HTTP requests
 */
export const isAuthenticatedForServer = (serverIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.redirect('/login?error=auth_required');
    }

    try {
      const [user, server] = await Promise.all([
        prisma.users.findUnique({
          where: { id: userId },
          select: { id: true, isAdmin: true, isActive: true }
        }),
        prisma.server.findUnique({
          where: { UUID: req.params[serverIdParam] },
          include: { owner: true }
        })
      ]);

      if (!user?.isActive) {
        req.session.destroy(() => {
          res.redirect('/login?error=account_inactive');
        });
        return;
      }

      if (user.isAdmin || server?.ownerId === userId) {
        req.server = server; // Attach server to request for later use
        next();
        return;
      }

      logger.warn(`Unauthorized server access attempt by user ${userId} for server ${req.params[serverIdParam]}`);
      res.status(403).render('errors/403');
    } catch (error) {
      logger.error('Server authentication error:', error);
      res.status(500).render('errors/500');
    }
  };
};

/**
 * Server authentication middleware for WebSocket connections
 */
export const isAuthenticatedForServerWS = (serverIdParam: string = 'id') => {
  return async (ws: WebSocket, req: any, next: NextFunction): Promise<void> => {
    const userId = req.session?.user?.id;
    const serverId = req.params[serverIdParam];

    if (!userId || !serverId) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const [user, server] = await Promise.all([
        prisma.users.findUnique({
          where: { id: userId },
          select: { id: true, isAdmin: true, isActive: true }
        }),
        prisma.server.findUnique({
          where: { UUID: serverId },
          include: { owner: true }
        })
      ]);

      if (!user?.isActive) {
        ws.close(1008, 'Account inactive');
        return;
      }

      if (user.isAdmin || server?.ownerId === userId) {
        // Set up WebSocket connection monitoring
        (ws as any).isAlive = true;
        ws.on('pong', () => { (ws as any).isAlive = true; });
        
        // Attach server info to the WebSocket
        (ws as any).server = server;
        next();
        return;
      }

      logger.warn(`Unauthorized WebSocket connection attempt by user ${userId} for server ${serverId}`);
      ws.close(1003, 'Unauthorized');
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      ws.close(1011, 'Internal server error');
    }
  };
};

// Handle process termination
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
});
