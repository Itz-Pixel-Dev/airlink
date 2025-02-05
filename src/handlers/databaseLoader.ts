/**
 * ╳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╳
 *      AirLink - Open Source Project by AirlinkLabs
 *      Repository: https://github.com/airlinklabs/airlink
 *
 *     © 2024 AirlinkLabs. Licensed under the MIT License
 * ╳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╳
 */

import fs from 'fs';
import path from 'path';
import logger from './logger';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const databaseLoader = async () => {
  const dbPath = path.join(__dirname, '../../prisma/dev.db');

  if (!fs.existsSync(dbPath)) {
    logger.error('databaseLoader', `Database not found at location: ${dbPath}`);
    throw new Error('Database file not found');
  }

  try {
    await prisma.$connect();
    logger.info('Database connection established successfully');

    // Test the connection
    await prisma.$queryRaw`SELECT 1`;

    // Add shutdown handler
    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });

    return prisma;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('databaseLoader', `Database connection error: ${error.message}`);
    } else {
      logger.error('databaseLoader', 'Database connection error: Unknown error occurred');
    }
    throw error;
  }
};
