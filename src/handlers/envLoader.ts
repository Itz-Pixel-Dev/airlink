/**
 * ╳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╳
 *      AirLink - Open Source Project by AirlinkLabs
 *      Repository: https://github.com/airlinklabs/airlink
 *
 *     © 2024 AirlinkLabs. Licensed under the MIT License
 * ╳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╳
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import logger from './logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadEnv() {
  const envPath = resolve(dirname(dirname(__dirname)), '.env');

  try {
    const data = fs.readFileSync(envPath, 'utf8');

    data.split('\n').forEach((line) => {
      const [key, value] = line.split('=');

      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    });
  } catch (error) {
    logger.error('Error loading .env file:', error);
  }
}
