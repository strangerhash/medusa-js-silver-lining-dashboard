console.log("SERVER ENTRY");
import 'reflect-metadata';
import express from 'express';
import { useExpressServer, getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUiExpress from 'swagger-ui-express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { KYCController } from './controllers/kyc.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { PortfolioController } from './controllers/portfolio.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { ReportsController } from './controllers/reports.controller';
import { SettingsController } from './controllers/settings.controller';
import { AdminController } from './controllers/admin.controller';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Silver Lining Backend Server...');
console.log('📦 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Port:', process.env.PORT || 9000);

// Initialize Prisma
const prisma = new PrismaClient();

// Create Express app
const app = express();

console.log('✅ Express app created');

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('✅ Middleware configured');

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

console.log('✅ Health check endpoint configured');

try {
  // Use routing-controllers
  console.log('🔄 Setting up routing-controllers...');
  useExpressServer(app, {
    controllers: [
      AuthController, 
      UsersController, 
      KYCController, 
      TransactionsController, 
      AnalyticsController, 
      PortfolioController, 
      NotificationsController, 
      ReportsController, 
      SettingsController, 
      AdminController
    ],
    routePrefix: '/api',
    defaultErrorHandler: false,
    validation: {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    }
  });

  console.log('✅ Routing-controllers configured');

  // Generate OpenAPI specification
  console.log('🔄 Generating OpenAPI specification...');
  const storage = getMetadataArgsStorage();
  const spec = routingControllersToSpec(storage, {
    controllers: [
      AuthController, 
      UsersController, 
      KYCController, 
      TransactionsController, 
      AnalyticsController, 
      PortfolioController, 
      NotificationsController, 
      ReportsController, 
      SettingsController, 
      AdminController
    ],
    routePrefix: '/api'
  });

  console.log('✅ OpenAPI specification generated');

  // Serve Swagger UI
  app.use('/api-docs', swaggerUiExpress.serve, swaggerUiExpress.setup(spec));

  // Serve OpenAPI spec as JSON
  app.get('/api-spec', (req, res) => {
    res.json(spec);
  });

  console.log('✅ Swagger UI configured');

} catch (error) {
  console.error('❌ Error setting up routing-controllers:', error);
  process.exit(1);
}

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  
  if (error.httpCode) {
    return res.status(error.httpCode).json({
      success: false,
      error: error.message
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

console.log('✅ Error handlers configured');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  logger.error('Uncaught Exception:', err);
});

// Start server
const PORT = process.env.PORT || 9000;

console.log('🚀 Starting server on port', PORT);

try {
  app.listen(PORT, () => {
    console.log('🎉 Server started successfully!');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`📋 OpenAPI Spec available at http://localhost:${PORT}/api-spec`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
    
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    logger.info(`📋 OpenAPI Spec available at http://localhost:${PORT}/api-spec`);
    logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  logger.error('Failed to start server:', error);
  process.exit(1);
}

export default app; 