import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface AuthError extends Error {
  code?: string;
  status?: number;
}

interface TokenData {
  token: string;
  expiresAt: Date;
}

class AuthenticationError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.status = status;
  }
}

export const validateCredentials = async (email: string, password: string) => {
  try {
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        isAdmin: true,
        username: true,
        description: true,
        isActive: true,
        tokenVersion: true
      }
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const { password: _, ...userInfo } = user;
    return userInfo;
  } catch (error) {
    logger.error('Error validating credentials:', error);
    throw error;
  }
};

export const createUser = async (email: string, username: string, password: string) => {
  try {
    if (!password || password.length < 8) {
      throw new AuthenticationError('Password must be at least 8 characters long', 400);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isAdmin: false,
        isActive: true,
        description: '',
        tokenVersion: 0
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        username: true,
        description: true,
        isActive: true
      }
    });

    return user;
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === 'P2002') {
      throw new AuthenticationError('Email or username already exists', 400);
    }
    logger.error('Error creating user:', error);
    throw error;
  }
};

export const authService = {
  async generateResetToken(email: string): Promise<TokenData> {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        tokenVersion: { increment: 1 }
      }
    });

    return { token, expiresAt };
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new AuthenticationError('Password must be at least 8 characters long', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Implementation would involve validating the token and updating the password
    logger.info('Password reset with token:', token);
  },

  async validateSession(userId: number): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true }
    });
    return !!user && user.isActive;
  },

  async invalidateAllSessions(userId: number): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }
    });
  },

  async updateLastLogin(userId: number, ip: string): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip
      }
    });
  }
};

// Cleanup handler
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
});
