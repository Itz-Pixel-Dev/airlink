import { Router, Request } from 'express';
import { Module } from '../../handlers/moduleInit';
import { PrismaClient } from '@prisma/client';
import { WebSocket } from 'ws';
import logger from '../../handlers/logger';

interface WebSocketWithAlive extends WebSocket {
  isAlive: boolean;
}

interface WSRequest extends Request {
  ws: WebSocketWithAlive;
}

const prisma = new PrismaClient();

const wsUsersModule: Module = {
  info: {
    name: 'WS Users Module',
    description: 'This file is for the users functionality.',
    version: '1.0.0',
    moduleVersion: '1.0.0',
    author: 'AirLinkLab',
    license: 'MIT',
  },

  router: () => {
    const router = Router();

    router.ws('/online-check', async (ws: WebSocketWithAlive, req: WSRequest) => {
      ws.isAlive = true;
      
      try {
        const userId = req.session?.user?.id;
        if (!userId) {
          ws.close();
          return;
        }

        const user = await prisma.users.findUnique({ where: { id: userId } });
        if (!user || !user.username) {
          ws.close();
          return;
        }

        ws.send(JSON.stringify({ online: true }));

        // Add ping/pong for connection health check
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('close', () => {
          logger.info('WebSocket connection closed');
        });
      } catch (error) {
        logger.error('Error in WebSocket connection:', error);
        ws.close();
      }
    });

    return router;
  },
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

export default wsUsersModule;

