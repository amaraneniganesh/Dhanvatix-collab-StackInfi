import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { redisClient, isRedisEnabled } from '../config/redis';

// Note: JWT secrets should come from env, hardcoded fallbacks here for safety during dev.
const BRIDGE_SECRET = process.env.JWT_SECRET_BRIDGE || 'bridge_secret_dev';
const DNS_SECRET = process.env.JWT_SECRET_DNS || 'dns_secret_dev';

// In-memory fallback if Redis is disabled
const memoryBridgeTokens = new Map<string, string>();

export const generateBridgeToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real app, userId comes from authenticated session (e.g. req.user.id)
    // For MVP testing without full auth middleware, we'll take it from body
    const { userId } = req.body; 

    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    // 1. Generate a single-use nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // 2. Store nonce
    if (isRedisEnabled) {
      await redisClient.setex(`bridge_nonce:${nonce}`, 60, userId);
    } else {
      memoryBridgeTokens.set(nonce, userId);
      setTimeout(() => memoryBridgeTokens.delete(nonce), 60000); // 60s TTL
    }

    // 3. Sign the JWT bridge token
    const token = jwt.sign({ userId, nonce }, BRIDGE_SECRET, { expiresIn: '60s' });

    res.status(200).json({ 
      message: 'Bridge token generated', 
      token,
      bridgeUrl: `${process.env.DNS_PORTAL_URL || 'http://localhost:3001'}/?token=${token}`
    });
  } catch (error) {
    console.error('Bridge generation error:', error);
    res.status(500).json({ message: 'Server error generating bridge token' });
  }
};

export const consumeBridgeToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ message: 'Token is required' });
      return;
    }

    // 1. Verify token signature and expiry
    let decoded: any;
    try {
      decoded = jwt.verify(token, BRIDGE_SECRET);
    } catch (err) {
      res.status(401).json({ message: 'Invalid or expired bridge token' });
      return;
    }

    const { userId, nonce } = decoded;

    // 2. Validate nonce
    let storedUserId: string | null = null;
    
    if (isRedisEnabled) {
      storedUserId = await redisClient.get(`bridge_nonce:${nonce}`);
    } else {
      storedUserId = memoryBridgeTokens.get(nonce) || null;
    }

    if (!storedUserId || storedUserId !== userId) {
      res.status(401).json({ message: 'Token has already been consumed or is invalid' });
      return;
    }

    // 3. Delete nonce to prevent reuse
    if (isRedisEnabled) {
      await redisClient.del(`bridge_nonce:${nonce}`);
    } else {
      memoryBridgeTokens.delete(nonce);
    }

    // 4. Generate the actual DNS Portal session token
    const dnsToken = jwt.sign({ id: userId }, DNS_SECRET, { expiresIn: '1d' });

    res.status(200).json({ 
      message: 'Bridge authentication successful', 
      token: dnsToken,
      userId 
    });
  } catch (error) {
    console.error('Bridge consumption error:', error);
    res.status(500).json({ message: 'Server error consuming bridge token' });
  }
};
