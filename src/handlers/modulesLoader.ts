/**
 * ╳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╳
 *      AirLink - Open Source Project by AirlinkLabs
 *      Repository: https://github.com/airlinklabs/airlink
 *
 *     © 2024 AirlinkLabs. Licensed under the MIT License
 * ╳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╳
 */

import { Express } from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from './logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const loadModules = async (
  app: Express,
  airlinkVersion: string,
) => {
  const modulesDir = join(dirname(__dirname), 'modules');

  const getFilesRecursively = (dir: string): string[] => {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    const files = dirents.flatMap((dirent) => {
      const fullPath = join(dir, dirent.name);
      return dirent.isDirectory() ? getFilesRecursively(fullPath) : fullPath;
    });
    return files.filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
  };

  const files = getFilesRecursively(modulesDir);

  for (const file of files) {
    try {
      const { default: module } = await import(file);
      if (module && module.info && typeof module.router === 'function') {
        const { info, router } = module;

        if (info.version === airlinkVersion) {
          logger.log(`Loading module: ${info.name} (v${info.moduleVersion})`);
          app.use(router());
        } else {
          logger.warn(
            `Skipping ${info.name}: incompatible with AirLink version ${airlinkVersion}`,
          );
        }
      } else {
        logger.warn(
          `Module ${file} is missing required exports (info and router).`,
        );
      }
    } catch (error) {
      logger.error(`Failed to load module ${file}:`, error);
    }
  }
};
