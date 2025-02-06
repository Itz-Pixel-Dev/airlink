import express, { Express, Request, Response, NextFunction } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { loadEnv } from './handlers/envLoader';
import { databaseLoader } from './handlers/databaseLoader';
import { loadModules } from './handlers/modulesLoader';
import logger from './handlers/logger';
import config from '../storage/config.json' assert { type: 'json' };
import cookieParser from 'cookie-parser';
import expressWs from 'express-ws';
import compression from 'compression';
import { translationMiddleware } from './handlers/utils/core/translation';
import PrismaSessionStore from './handlers/sessionStore';
import { settingsLoader } from './handlers/settingsLoader';
import { loadPlugins } from './handlers/pluginHandler';
import { createClient } from 'redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadEnv();

const app: Express = express();

const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const name = process.env.NAME || 'AirLink';
const airlinkVersion = config.meta.version;

// Trust proxy if enabled
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.CSP_ENABLED === 'true' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
if (process.env.CORS_ENABLED === 'true') {
  const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || false,
    credentials: true,
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15')) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// WebSocket setup with ping/pong
const wsInstance = expressWs(app);
wsInstance.getWss().on('connection', (ws: any) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

// WebSocket heartbeat
const wsHeartbeat = setInterval(() => {
  wsInstance.getWss().clients.forEach((ws: any) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Cache setup
let cache: any;
if (process.env.CACHE_ENABLED === 'true') {
  if (process.env.CACHE_DRIVER === 'redis') {
    cache = createClient({
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD
    });
    cache.connect().catch(console.error);
  }
}

// Static files with cache control
app.use(express.static(join(dirname(__filename), '../public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || Math.random().toString(36).substring(2, 15),
  resave: false,
  saveUninitialized: false,
  store: new PrismaSessionStore(),
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none' || 'strict',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || '259200') * 1000,
  },
  name: 'airlink.sid',
}));

// Body parsers with configurable limits
const maxSize = process.env.UPLOAD_MAX_SIZE ? `${process.env.UPLOAD_MAX_SIZE}mb` : '1mb';
app.use(express.json({ limit: maxSize }));
app.use(express.urlencoded({ extended: true, limit: maxSize }));
app.use(cookieParser());
app.use(compression());
app.use(translationMiddleware);

// Health check endpoint
if (process.env.ENABLE_HEALTH_CHECK === 'true') {
  app.get(process.env.HEALTH_CHECK_PATH || '/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}

// Locals middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.locals.name = name;
  res.locals.airlinkVersion = airlinkVersion;
  res.locals.env = process.env.NODE_ENV;
  next();
});

// Error handlers
app.use((_req: Request, res: Response) => {
  res.status(404).render('errors/404');
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  if (res.headersSent) return next(err);

  const statusCode = (err as any).status || 500;
  if (req.accepts('html')) {
    res.status(statusCode).render(`errors/${statusCode}`, {
      error: process.env.NODE_ENV === 'development' ? err : 'Internal Server Error',
    });
  } else {
    res.status(statusCode).json({
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    });
  }
});

// Initialize application
const initializeApp = async () => {
  try {
    await databaseLoader();
    await settingsLoader();
    await loadModules(app, airlinkVersion);
    await loadPlugins(app);

    const server = app.listen(port, () => {
      logger.info(`Server is running on http://localhost:${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      clearInterval(wsHeartbeat);
      if (cache) await cache.disconnect();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error('Failed to initialize application:', err);
    process.exit(1);
  }
};

initializeApp();

export default app;

