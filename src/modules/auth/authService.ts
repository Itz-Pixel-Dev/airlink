import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

interface AuthError extends Error {
  code?: string;
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
        description: true
      }
    });

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
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
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isAdmin: false,
        description: ''
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        username: true,
        description: true
      }
    });

    return user;
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === 'P2002') {
      throw new Error('Email or username already exists');
    }
    logger.error('Error creating user:', error);
    throw error;
  }
};

export const authService = {
  async initiatePasswordReset(email: string) {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Save it to the database with an expiration
    // 3. Send an email with the reset link
    // For now, we'll just log it
    console.log(`Password reset requested for ${email}`);
  },

  async validateSession(userId: number) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    return !!user;
  }
};

// Cleanup handler
process.on('exit', async () => {
  await prisma.$disconnect();
});
