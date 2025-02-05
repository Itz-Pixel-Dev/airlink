import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../../utils/logger';
import { loginRateLimiter } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export const info = {
  name: 'Authentication',
  description: 'User authentication and authorization',
  version: '1.0.0',
  moduleVersion: '1.0.0'
};

// Input validation
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
};

// Login route with rate limiting
router.post('/auth/login', loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        isAdmin: true,
        isActive: true,
        username: true,
        description: true,
        lastLoginAt: true,
        lastLoginIp: true
      }
    });

    if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login info
    await prisma.users.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip
      }
    });

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
    req.session.lastActivity = Date.now();

    res.redirect('/dashboard');
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Secure logout route
router.post('/auth/logout', (req: Request, res: Response): void => {
  const sessionID = req.session.id;
  req.session.destroy((err: Error | null) => {
    if (err) {
      logger.error('Logout error:', err);
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.clearCookie('airlink.sid');
    res.redirect('/login');
  });
});

// Register route with validation
router.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // Validation
    if (!email || !username || !password || !confirmPassword) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (!validatePassword(password)) {
      res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers' 
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isAdmin: false,
        isActive: true,
        description: '',
        lastLoginAt: null,
        lastLoginIp: null
      }
    });

    res.redirect('/login?registered=true');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ error: 'Email or username already exists' });
    } else {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
});

// Password reset request
router.post('/auth/reset-request', loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      res.json({ message: 'If an account exists, a reset link will be sent' });
      return;
    }

    // TODO: Implement email sending logic
    logger.info(`Password reset requested for ${email}`);
    res.json({ message: 'If an account exists, a reset link will be sent' });
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const authRouter = router;

export default { info, authRouter };

