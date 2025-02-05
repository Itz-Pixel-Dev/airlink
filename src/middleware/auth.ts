import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Session } from 'express-session';
import rateLimit from 'express-rate-limit';
import logger from '../handlers/logger';

interface User {
  id: number;
  email: string;
  isAdmin: boolean;
  username: string;
  description: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
}

declare module 'express-session' {
  interface Session {
    user?: User;
    lastActivity?: number;
  }
}

const prisma = new PrismaClient();

// Rate limiter for login attempts
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Session activity checker
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const checkSessionActivity = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.lastActivity) {
    const now = Date.now();
    if (now - req.session.lastActivity > SESSION_TIMEOUT) {
      req.session.destroy(() => {
        res.redirect('/auth/login?expired=true');
      });
      return;
    }
    req.session.lastActivity = now;
  }
  next();
};

export const isAuthenticated = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.user) {
        return res.redirect('/auth/login');
      }

      // Verify user still exists and is active
      const user = await prisma.users.findUnique({
        where: { id: req.session.user.id }
      });

      if (!user || !user.isActive) {
        req.session.destroy(() => {
          res.redirect('/auth/login?invalid=true');
        });
        return;
      }

      // Update session with latest user data
      req.session.user = {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        username: user.username || '',
        description: user.description || '',
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: user.lastLoginIp
      };

      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(500).render('errors/500');
    }
  };
};

export const isAdmin = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user?.isAdmin) {
      return res.status(403).render('errors/403');
    }
    next();
  };
};

export const isAuthenticatedForServer = (serverIdParam: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.user) {
        return res.redirect('/auth/login');
      }

      const serverId = parseInt(req.params[serverIdParam]);
      if (isNaN(serverId)) {
        return res.status(400).json({ error: 'Invalid server ID' });
      }

      const server = await prisma.server.findFirst({
        where: {
          id: serverId,
          OR: [
            { ownerId: req.session.user.id },
            { owner: { isAdmin: true } }
          ]
        }
      });

      if (!server) {
        return res.status(403).render('errors/403');
      }

      // Attach server to request for later use
      (req as any).server = server;
      next();
    } catch (error) {
      logger.error('Server authentication error:', error);
      res.status(500).render('errors/500');
    }
  };
};

// API authentication middleware
export const apiAuth = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey, active: true }
    });

    if (!key) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() }
    });

    next();
  } catch (error) {
    logger.error('API authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};