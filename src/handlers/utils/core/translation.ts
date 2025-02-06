import { Request, Response } from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../../logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadTranslations(lang: string): Record<string, unknown> {
  const langPath = join(
    dirname(dirname(dirname(dirname(__dirname)))),
    `storage/lang/${lang}/lang.json`,
  );
  const fallbackPath = join(
    dirname(dirname(dirname(dirname(__dirname)))),
    'storage/lang/en/lang.json',
  );

  try {
    if (fs.existsSync(langPath)) {
      return JSON.parse(fs.readFileSync(langPath, 'utf8'));
    }
    return JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  } catch (error) {
    logger.error(`Error loading translations for ${lang}:`, error);
    try {
      return JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    } catch (fallbackError) {
      logger.error(
        'Error loading default English translations:',
        fallbackError,
      );
      return {};
    }
  }
}

export function translationMiddleware(
  req: Request,
  res: Response,
  next: () => void,
) {
  (req as any).lang = req.cookies && req.cookies.lang ? req.cookies.lang : 'en';
  (req as any).translations = loadTranslations((req as any).lang);
  next();
}
