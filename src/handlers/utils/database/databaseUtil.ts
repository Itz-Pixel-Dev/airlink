import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { prisma } from '../../databaseLoader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DatabaseHost {
	id: string;
	name: string;
	host: string;
	port: number;
	type: string;
}

interface DatabaseConfig {
	hosts: DatabaseHost[];
	defaults: {
		charset: string;
		collation: string;
	};
}

export const getDatabaseConfig = (): DatabaseConfig => {
const configPath = join(dirname(dirname(dirname(dirname(__dirname)))), 'storage/config/database.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config;
};

export const getDatabaseHost = (hostId: string): DatabaseHost | undefined => {
  const config = getDatabaseConfig();
  return config.hosts.find(host => host.id === hostId);
};

export const validateDatabaseName = (name: string): boolean => {
  return /^[a-zA-Z0-9_]+$/.test(name) && name.length <= 64;
};

export const generateConnectionString = (
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): string => {
  return `mysql://${username}:${password}@${host}:${port}/${database}`;
};

export const getDatabaseSize = async (databaseId: number): Promise<number> => {
  const database = await prisma.database.findUnique({
    where: { id: databaseId }
  });
  return database?.size || 0;
};

export const updateDatabaseSize = async (databaseId: number, size: number): Promise<void> => {
  await prisma.database.update({
    where: { id: databaseId },
    data: { size }
  });
};

export const validateDatabaseAccess = async (userId: number, databaseId: number): Promise<boolean> => {
  const database = await prisma.database.findFirst({
    where: {
      id: databaseId,
      server: {
        ownerId: userId
      }
    }
  });
  return !!database;
};