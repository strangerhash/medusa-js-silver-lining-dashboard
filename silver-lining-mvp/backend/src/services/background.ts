import { loggingService } from './logger';
import { notificationService, NotificationType } from './notification';
import { logger } from '../utils/logger';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

class BackgroundService {
  private static instance: BackgroundService;
  private intervals: NodeJS.Timeout[] = [];

  private constructor() {}

  public static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  // Start all background services
  public start(): void {
    logger.info('Starting background services...');
    
    // Start notification cleanup (every 6 hours)
    this.startNotificationCleanup();
    
    // Start log cleanup (every 12 hours)
    this.startLogCleanup();
    
    // Start system health monitoring (every 5 minutes)
    this.startSystemHealthMonitoring();
    
    // Start user activity monitoring (every 10 minutes)
    this.startUserActivityMonitoring();
    
    // Start transaction monitoring (every 15 minutes)
    this.startTransactionMonitoring();
    
    logger.info('Background services started successfully');
  }

  // Stop all background services
  public stop(): void {
    logger.info('Stopping background services...');
    
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    
    this.intervals = [];
    logger.info('Background services stopped');
  }

  // Notification cleanup service
  private startNotificationCleanup(): void {
    const interval = setInterval(async () => {
      try {
        await notificationService.cleanupOldNotifications();
        logger.info('Notification cleanup completed');
      } catch (error) {
        logger.error('Notification cleanup failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    this.intervals.push(interval);
  }

  // Log cleanup service
  private startLogCleanup(): void {
    const interval = setInterval(async () => {
      try {
        // Delete logs older than 90 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);

        const result = await prisma.log.deleteMany({
          where: {
            timestamp: {
              lt: cutoffDate
            },
            level: {
              not: 'AUDIT' // Keep audit logs longer
            }
          }
        });

        logger.info(`Log cleanup completed: ${result.count} logs deleted`);
      } catch (error) {
        logger.error('Log cleanup failed:', error);
      }
    }, 12 * 60 * 60 * 1000); // 12 hours

    this.intervals.push(interval);
  }

  // System health monitoring
  private startSystemHealthMonitoring(): void {
    const interval = setInterval(async () => {
      try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        
        // Check for recent errors
        const recentErrors = await prisma.log.count({
          where: {
            level: 'ERROR',
            timestamp: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
            }
          }
        });

        if (recentErrors > 10) {
          await notificationService.createSystemNotification(
            'High Error Rate Detected',
            `System has generated ${recentErrors} errors in the last 5 minutes. Please check system logs.`,
            NotificationType.WARNING
          );
        }

        // Log system health
        await loggingService.logSystemEvent('System health check completed', {
          recentErrors,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('System health monitoring failed:', error);
        await notificationService.createSystemNotification(
          'System Health Check Failed',
          'System health monitoring service encountered an error.',
          NotificationType.ERROR
        );
      }
    }, 5 * 60 * 1000); // 5 minutes

    this.intervals.push(interval);
  }

  // User activity monitoring
  private startUserActivityMonitoring(): void {
    const interval = setInterval(async () => {
      try {
        // Check for suspicious login patterns
        const recentLogins = await prisma.log.findMany({
          where: {
            category: 'AUTH',
            action: 'LOGIN',
            timestamp: {
              gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
            }
          }
        });

        // Group by IP address to detect potential attacks
        const loginByIP = recentLogins.reduce((acc, log) => {
          const ip = log.ipAddress || 'unknown';
          if (!acc[ip]) acc[ip] = [];
          acc[ip].push(log);
          return acc;
        }, {} as Record<string, any[]>);

        // Check for suspicious patterns
        Object.entries(loginByIP).forEach(([ip, logs]) => {
          if (logs.length > 5) {
            // Multiple login attempts from same IP
            loggingService.logSecurityEvent(
              'unknown',
              'unknown',
              'SUSPICIOUS_LOGIN_PATTERN',
              `Multiple login attempts detected from IP: ${ip}`,
              ip
            );
          }
        });

        // Check for failed login attempts
        const failedLogins = await prisma.log.count({
          where: {
            category: 'AUTH',
            action: 'LOGIN_FAILED',
            timestamp: {
              gte: new Date(Date.now() - 10 * 60 * 1000)
            }
          }
        });

        if (failedLogins > 20) {
          await notificationService.createSystemNotification(
            'High Failed Login Rate',
            `System detected ${failedLogins} failed login attempts in the last 10 minutes.`,
            NotificationType.WARNING
          );
        }
      } catch (error) {
        logger.error('User activity monitoring failed:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes

    this.intervals.push(interval);
  }

  // Transaction monitoring
  private startTransactionMonitoring(): void {
    const interval = setInterval(async () => {
      try {
        // Check for failed transactions
        const failedTransactions = await prisma.transaction.count({
          where: {
            status: 'FAILED',
            updatedAt: {
              gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
            }
          }
        });

        if (failedTransactions > 5) {
          await notificationService.createSystemNotification(
            'High Transaction Failure Rate',
            `System detected ${failedTransactions} failed transactions in the last 15 minutes.`,
            NotificationType.WARNING
          );
        }

        // Check for large transactions
        const largeTransactions = await prisma.transaction.findMany({
          where: {
            amount: {
              gte: 100000 // Transactions over 1 lakh
            },
            status: 'COMPLETED',
            updatedAt: {
              gte: new Date(Date.now() - 15 * 60 * 1000)
            }
          },
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        });

        largeTransactions.forEach(transaction => {
          loggingService.logTransaction(
            transaction.userId,
            transaction.user.email,
            'LARGE_TRANSACTION_COMPLETED',
            transaction.id,
            `Large transaction completed: ₹${transaction.amount.toLocaleString()}`,
            {
              amount: transaction.amount,
              type: transaction.type,
              referenceId: transaction.referenceId
            }
          );
        });

        // Check for pending transactions that are too old
        const oldPendingTransactions = await prisma.transaction.findMany({
          where: {
            status: 'PENDING',
            createdAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
            }
          }
        });

        if (oldPendingTransactions.length > 0) {
          await notificationService.createSystemNotification(
            'Old Pending Transactions',
            `System has ${oldPendingTransactions.length} transactions pending for more than 24 hours.`,
            NotificationType.WARNING
          );
        }
      } catch (error) {
        logger.error('Transaction monitoring failed:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    this.intervals.push(interval);
  }

  // Manual cleanup methods for immediate execution
  public async cleanupNotifications(): Promise<void> {
    try {
      await notificationService.cleanupOldNotifications();
      logger.info('Manual notification cleanup completed');
    } catch (error) {
      logger.error('Manual notification cleanup failed:', error);
      throw error;
    }
  }

  public async cleanupLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const result = await prisma.log.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          },
          level: {
            not: 'AUDIT'
          }
        }
      });

      logger.info(`Manual log cleanup completed: ${result.count} logs deleted`);
    } catch (error) {
      logger.error('Manual log cleanup failed:', error);
      throw error;
    }
  }

  // Get service status
  public getStatus(): {
    running: boolean;
    activeIntervals: number;
    lastCleanup?: Date;
  } {
    return {
      running: this.intervals.length > 0,
      activeIntervals: this.intervals.length,
      lastCleanup: new Date() // This could be enhanced to track actual last cleanup
    };
  }
}

export const backgroundService = BackgroundService.getInstance(); 