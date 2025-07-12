import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer, getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUiExpress from 'swagger-ui-express';
import { logger } from './utils/logger';
import { schemas } from './utils/openapi-schemas';

// Import all controllers
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { KYCController } from './controllers/kyc.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { PortfolioController } from './controllers/portfolio.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { ReportsController } from './controllers/reports.controller';
import { SettingsController } from './controllers/settings.controller';
import { AdminController } from './controllers/admin.controller';
import { LogsController } from './controllers/logs.controller';

// Initialize Redis
import './services/redis';

// Initialize background services
import { backgroundService } from './services/background';

const app = express();
const PORT = process.env.PORT || 9000;

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:7000', 'http://localhost:7001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Configure middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Configure routing-controllers
useExpressServer(app, {
  controllers: [
    AuthController,
    UsersController,
    KYCController,
    TransactionsController,
    PortfolioController,
    AnalyticsController,
    NotificationsController,
    ReportsController,
    SettingsController,
    AdminController,
    LogsController
  ],
  defaultErrorHandler: false,
  validation: true,
  classTransformer: true,
  routePrefix: '/api'
});

// Generate OpenAPI specification
const storage = getMetadataArgsStorage();
const spec = routingControllersToSpec(storage, {
  controllers: [
    AuthController,
    UsersController,
    KYCController,
    TransactionsController,
    PortfolioController,
    AnalyticsController,
    NotificationsController,
    ReportsController,
    SettingsController,
    AdminController,
    LogsController
  ],
  routePrefix: '/api'
}, {
  components: {
    schemas: schemas,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  info: {
    title: 'Silver Lining API',
    version: '1.0.0',
    description: 'API for Silver Lining MVP - Silver Investment Platform',
    contact: {
      name: 'Silver Lining Team',
      email: 'support@silverlining.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Development server'
    }
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'KYC', description: 'KYC application endpoints' },
    { name: 'Transactions', description: 'Transaction management endpoints' },
    { name: 'Portfolio', description: 'Portfolio management endpoints' },
    { name: 'Analytics', description: 'Analytics and reporting endpoints' },
    { name: 'Notifications', description: 'Notification management endpoints' },
    { name: 'Reports', description: 'Report generation endpoints' },
    { name: 'Settings', description: 'System settings endpoints' },
    { name: 'Admin', description: 'Admin management endpoints' },
    { name: 'Logs', description: 'System logs and audit trail endpoints' }
  ]
});

// Serve OpenAPI specification
app.get('/api-spec', (req, res) => {
  res.json(spec);
});

// Serve Swagger UI
app.use('/api-docs', swaggerUiExpress.serve, swaggerUiExpress.setup(spec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Silver Lining API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true
  }
}));

// Import and use the proper error handler
import { errorHandler } from './middleware/errorHandler';

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 404
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`📋 OpenAPI Spec available at http://localhost:${PORT}/api-spec`);
  logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
  
  // Start background services
  backgroundService.start();
  logger.info('🔄 Background services started');
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  backgroundService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  backgroundService.stop();
  process.exit(0);
}); 