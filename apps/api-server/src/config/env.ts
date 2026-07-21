import dotenv from 'dotenv';
import path from 'path';

// Load from monorepo root (CWD is apps/api-server)
const result = dotenv.config({ override: true, path: path.resolve(process.cwd(), '../../.env') });
console.log('Dotenv Loaded:', result.error ? result.error : 'Success');
console.log('Loaded REDIS_URL:', process.env.REDIS_URL);
