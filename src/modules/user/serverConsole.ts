import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../../handlers/utils/auth/authUtil';
import { isAuthenticatedForServer, isAuthenticatedForServerWS } from '../../handlers/utils/auth/serverAuthUtil';
import { WebSocket, MessageEvent } from 'ws';
import { RequestHandler } from 'express';
import logger from '../../handlers/logger';

const prisma = new PrismaClient();

export const info = {
  name: 'Server Console',
  description: 'Server console and real-time logs',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

// WebSocket authentication middleware
const wsAuth = (ws: WebSocket, req: Request, next: NextFunction): void => {
  if (!req.session?.user?.id) {
    ws.close();
    return;
  }
  next();
};

export const router = () => {
  const router = Router();

  // Console page
  router.get('/server/:serverId/console', 
    isAuthenticated() as RequestHandler,
    isAuthenticatedForServer('serverId') as RequestHandler,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const server = await prisma.server.findUnique({
          where: { id: parseInt(req.params.serverId) },
          include: {
            node: true,
            image: true
          }
        });
    
        if (!server) {
          res.status(404).render('errors/404');
          return;
        }

        res.render('server/console/index', { server });
      } catch (error) {
        logger.error('Error fetching server:', error);
        res.status(500).render('errors/500');
      }
    });

  // WebSocket routes with proper typing
  router.ws(
    '/server/:serverId/console/ws',
    wsAuth,
    isAuthenticatedForServerWS('serverId'),
    async (ws: WebSocket, req: any) => {
      const userId = req.session?.user?.id;
      if (!userId) {
        ws.send(JSON.stringify({ error: 'User not authenticated' }));
        ws.close();
        return;
      }

      try {
        const user = await prisma.users.findUnique({ where: { id: userId } });
        if (!user || !user.username) {
          ws.send(JSON.stringify({ error: 'User not found or username missing' }));
          ws.close();
          return;
        }

        const serverId = req.params.id;
        if (!serverId) {
          ws.send(JSON.stringify({ error: 'Server ID is required' }));
          ws.close();
          return;
        }

        const server = await prisma.server.findUnique({
          where: { UUID: serverId },
          include: { node: true },
        });
        if (!server) {
          ws.send(JSON.stringify({ error: 'Server not found' }));
          ws.close();
          return;
        }

        const node = server.node;
        const socket = new WebSocket(`ws://${node.address}:${node.port}/container/${serverId}`);

        socket.onopen = () => {
          socket.send(JSON.stringify({ event: 'auth', args: [node.key] }));
        };

        socket.onmessage = (msg: MessageEvent) => {
          ws.send(msg.data.toString());
        };

        socket.onerror = () => {
          ws.send('\x1b[31;1mThis instance is unavailable!\x1b[0m');
        };

        socket.onclose = () => {
          logger.info('Socket connection closed');
        };

        ws.on('message', (msg: WebSocket.Data) => {
          if (typeof msg === 'string') {
          socket.send(msg);
          } else if (msg instanceof Buffer) {
          socket.send(msg.toString());
          }
        });

        ws.on('close', () => {
          socket.close();
          logger.info('WebSocket connection closed');
        });

        ws.on('error', (error) => {
          logger.error('WebSocket error:', error);
          socket.close();
        });
      } catch (error) {
        logger.error('Error fetching user:', error);
        ws.send(JSON.stringify({ error: 'Internal server error' }));
        ws.close();
      }
    }
  );

  router.ws(
    '/status/:id',
    wsAuth,
    isAuthenticatedForServerWS('id'),
    async (ws: WebSocket, req: any) => {
      const userId = req.session?.user?.id;
      if (!userId) {
        ws.send(JSON.stringify({ error: 'User not authenticated' }));
        ws.close();
        return;
      }

      try {
        const user = await prisma.users.findUnique({ where: { id: userId } });
        if (!user || !user.username) {
          ws.send(JSON.stringify({ error: 'User not found or username missing' }));
          ws.close();
          return;
        }

        const serverId = req.params.id;
        if (!serverId) {
          ws.send(JSON.stringify({ error: 'Server ID is required' }));
          ws.close();
          return;
        }

        const server = await prisma.server.findUnique({
          where: { UUID: serverId },
          include: { node: true },
        });
        if (!server) {
          ws.send(JSON.stringify({ error: 'Server not found' }));
          ws.close();
          return;
        }

        const node = server.node;
        const socket = new WebSocket(`ws://${node.address}:${node.port}/containerstatus/${serverId}`);

        socket.onopen = () => {
          socket.send(JSON.stringify({ event: 'auth', args: [node.key] }));
        };

        socket.onmessage = (msg: MessageEvent) => {
          ws.send(msg.data.toString());
        };

        socket.onerror = () => {
          ws.send('\x1b[31;1mThis instance is unavailable!\x1b[0m');
        };

        socket.onclose = () => {
          logger.info('Socket connection closed');
          ws.close();
        };

        ws.on('message', (msg: WebSocket.Data) => {
          if (typeof msg === 'string') {
          socket.send(msg);
          } else if (msg instanceof Buffer) {
          socket.send(msg.toString());
          }
        });

        ws.on('close', () => {
          socket.close();
          logger.info('WebSocket connection closed');
        });

        ws.on('error', (error) => {
          logger.error('WebSocket error:', error);
          socket.close();
        });
      } catch (error) {
        logger.error('Error fetching user:', error);
        ws.send(JSON.stringify({ error: 'Internal server error' }));
        ws.close();
      }
    }
  );



  // Send command to server
  router.post('/server/:serverId/console/command',
    isAuthenticated() as RequestHandler,
    isAuthenticatedForServer('serverId') as RequestHandler,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { command } = req.body;
        const server = await prisma.server.findUnique({
          where: { id: parseInt(req.params.serverId) },
          include: { node: true }
        });

        if (!server) {
          res.status(404).json({ error: 'Server not found' });
          return;
        }

        // Send command to server through WebSocket
        const socket = new WebSocket(`ws://${server.node.address}:${server.node.port}/container/${server.UUID}`);
    
        socket.onopen = () => {
          socket.send(JSON.stringify({ event: 'command', args: [command] }));
          socket.close();
        };

        res.status(200).json({ success: true });
      } catch (error) {
        logger.error('Error sending command:', error);
        res.status(500).json({ error: 'Failed to send command' });
      }
    });

  return router;
};


