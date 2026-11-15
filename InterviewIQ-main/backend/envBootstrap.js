import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(backendDir, '.env');
const envResult = dotenv.config({ path: envPath });

if (envResult.error && envResult.error.code !== 'ENOENT') {
  console.warn(`[ENV] Failed to load backend .env file from ${envPath}`);
  console.warn('Actual error:', envResult.error.message);
} else if (envResult.parsed) {
  console.log(`[ENV] Loaded backend .env from ${envPath}`);
} else {
  console.log('[ENV] No local backend .env file found; using process environment');
}

const isConfiguredValue = (value) => {
  if (!value) {
    return false;
  }

  const normalized = String(value).trim();
  return !/^(your_|YOUR_|change_in_production|placeholder)/.test(normalized);
};

console.log(
  isConfiguredValue(process.env.GROQ_API_KEY)
    ? '✓ Groq API Key Loaded'
    : '✗ Groq API Key Missing'
);
