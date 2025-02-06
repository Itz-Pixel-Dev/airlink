import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Check if a directory is a Minecraft world
 */
export const isWorld = (dirPath: string): boolean => {
  try {
    const files = fs.readdirSync(dirPath);
    return files.includes('level.dat');
  } catch {
    return false;
  }
};

/**
 * Check EULA status for a server
 */
export const checkEulaStatus = (serverPath: string): boolean => {
  try {
    const eulaPath = join(serverPath, 'eula.txt');
    if (!fs.existsSync(eulaPath)) {
      return false;
    }

    const content = fs.readFileSync(eulaPath, 'utf-8');
    return content.includes('eula=true');
  } catch {
    return false;
  }
};
