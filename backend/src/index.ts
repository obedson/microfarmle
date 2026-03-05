import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import farmRecordRoutes from './routes/farmRecords.js';
import courseRoutes from './routes/courses.js';
import courseVideoRoutes from './routes/courseVideos.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import orderPaymentRoutes from './routes/orderPayments.js';
import locationRoutes from './routes/locations.js';
import groupRoutes from './routes/groups.js';
import contributionRoutes from './routes/contributions.js';
import adminRoutes from './routes/admin.js';
import { startCronJobs } from './jobs/contributionJobs.js';
import { startBookingJobs } from './jobs/bookingJobs.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(cors({
  origin: ['http://localhost:3000', 'https://microfarmle.vercel.app', 'http://localhost:3001'],
  credentials: true
}));

// Webhook route BEFORE body parsing (Paystack needs raw body)
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/farm-records', farmRecordRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', courseVideoRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', orderPaymentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', contributionRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

import { logger } from './utils/logger.js';

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Only run cron jobs in production
  if (process.env.NODE_ENV === 'production') {
    startCronJobs();
    startBookingJobs();
    logger.info('✅ Cron jobs enabled (production mode)');
  } else {
    logger.warn('⚠️  Cron jobs disabled (development mode)');
    logger.info('   Set NODE_ENV=production to enable cron jobs');
  }
});

export default app;
