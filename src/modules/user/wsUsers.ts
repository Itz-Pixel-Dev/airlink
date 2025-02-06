import express from 'express';
import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../../middleware/auth';
import { WebSocket } from 'ws';
import logger from '../../handlers/logger';

interface WebSocketWithAlive extends WebSocket {
  isAlive: boolean;
}

interface WSRequest extends Request {
  ws: WebSocketWithAlive;
}

const prisma = new PrismaClient();

export const info = {
  name: 'User WebSocket',
  description: 'WebSocket functionality for users',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

export const router = () => {
  const router = express.Router();


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




