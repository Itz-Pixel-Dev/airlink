import express, { Request, Response, NextFunction } from 'express';
import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import logger from '../../logger';

// Use a single Prisma instance for connection pooling
const prisma = new PrismaClient();

interface WebSocketWithAlive extends WebSocket {
  isAlive: boolean;
  server?: any;
}

interface AuthenticatedRequest extends Request {
  session: {
    user?: {
      id: number;
      username: string;
      isAdmin: boolean;
    };
    lastActivity?: number;
  };
  params: {
    [key: string]: string;
  };
  server?: any;
}

interface WSRequest extends Request {
  ws: WebSocketWithAlive;
  params: {
    [key: string]: string;
  };
  session: {
    user?: {
      id: number;
      username: string;
      isAdmin: boolean;
    };
  };
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
  return async (ws: WebSocketWithAlive, req: WSRequest, next: NextFunction): Promise<void> => {
    try {
      const userId = req.session?.user?.id;
      const serverId = req.params[serverIdParam];

      if (!userId || !serverId) {
        ws.close(1008, 'Authentication required');
        return;
      }

      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user?.isActive) {
        ws.close(1008, 'Account inactive');
        return;
      }

      const server = await prisma.server.findUnique({
        where: { UUID: serverId },
        include: { node: true }
      });

      if (user.isAdmin || server?.ownerId === userId) {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
        ws.server = server;
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
