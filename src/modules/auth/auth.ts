import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../../utils/logger';

// Extend Express Session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    isAdmin: boolean;
  }
}

const router = Router();
const prisma = new PrismaClient();

export const info = {
  name: 'Authentication',
  description: 'User authentication and authorization',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

// Login route
router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        isAdmin: true
      }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    req.session.userId = user.id;
    req.session.isAdmin = user.isAdmin;
    res.redirect('/dashboard');
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
router.get('/auth/logout', (req: Request, res: Response): void => {
  req.session.destroy((err: Error | null) => {
    if (err) {
      logger.error('Logout error:', err);
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.redirect('/login');
  });
});

// Register route
router.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isAdmin: false,
        description: ''
      }
    });

    res.redirect('/login');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
});

export const authRouter = router;

export default { info, authRouter };

