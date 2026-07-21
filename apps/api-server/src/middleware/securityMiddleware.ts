import { Request, Response, NextFunction } from 'express';
import CryptoJS from 'crypto-js';

const getSecret = () => process.env.API_SECRET || 'dhanvatix_secure_api_key_2026';

export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip middleware for specific paths (webhooks, etc.)
  if (req.path.startsWith('/webhooks')) {
    return next();
  }

  const clientKey = req.headers['x-api-key'] as string;

  if (!clientKey) {
    return res.status(403).json({ error: 'Missing API Key' });
  }

  if (clientKey !== getSecret()) {
    return res.status(403).json({ error: 'Invalid API Key.' });
  }

  // 1. Decrypt incoming payload if exists
  if (req.body && req.body.payload) {
    try {
      const bytes = CryptoJS.AES.decrypt(req.body.payload, getSecret());
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      req.body = JSON.parse(decryptedString);
    } catch (e) {
      return res.status(400).json({ error: 'Malformed encrypted payload' });
    }
  } else if (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body).length > 0) {
    // If it's a mutating request and NOT using the payload structure, block it to enforce encryption
    return res.status(400).json({ error: 'Unencrypted payloads are not allowed' });
  }

  // 2. Encrypt outgoing responses
  const originalJson = res.json;
  res.json = function (body: any) {
    if (body && !body.payload && !body.error) {
      try {
        const jsonString = JSON.stringify(body);
        const encrypted = CryptoJS.AES.encrypt(jsonString, getSecret()).toString();
        
        // Call the original res.json with the encrypted wrapper
        return originalJson.call(this, { payload: encrypted });
      } catch (e) {
        console.error('Failed to encrypt response', e);
        return originalJson.call(this, { error: 'Encryption failure' });
      }
    }
    return originalJson.call(this, body);
  };

  next();
};
