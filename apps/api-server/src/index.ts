import './config/env'; // MUST be first to load env vars
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import './config/redis'; // Initializes redis connection
import './queues/dnsWorker'; // Start the BullMQ worker

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Increase limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: [
    process.env.PORTAL_URL || 'http://localhost:3000',
    process.env.DNS_PORTAL_URL || 'http://localhost:3001'
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'API Server' });
});

import authRoutes from './routes/authRoutes';
import bridgeRoutes from './routes/bridgeRoutes';
import domainRoutes from './routes/domainRoutes';
import dnsRoutes from './routes/dnsRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import { securityMiddleware } from './middleware/securityMiddleware';

app.use('/api', securityMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/bridge', bridgeRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
