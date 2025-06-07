// tests/setup.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger le fichier .env.test s'il existe
dotenv.config({ path: join(__dirname, '../.env.test') });

// Sinon charger .env par défaut
if (!process.env.JWT_SECRET) {
  dotenv.config({ path: join(__dirname, '../.env') });
}

// Forcer l'environnement de test
process.env.NODE_ENV = 'test';