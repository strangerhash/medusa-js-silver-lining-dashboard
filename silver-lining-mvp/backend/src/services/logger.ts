import { PrismaClient } from '../generated/prisma';
import { logger as consoleLogger } from '../utils/logger';

const prisma = new PrismaClient();

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  AUDIT = 'AUDIT'
}

export enum LogCategory {
  AUTH = 'AUTH',
  USER = 'USER',
  TRANSACTION = 'TRANSACTION',
  PORTFOLIO = 'PORTFOLIO',
  KYC = 'KYC',
  SYSTEM = 'SYSTEM',
  API = 'API',
  SECURITY = 'SECURITY'
}

export interface LogEntry {
  id?: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  userEmail?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface AuditLogEntry extends LogEntry {
  level: LogLevel.AUDIT;
  beforeState?: any;
  afterState?: any;
  changes?: Record<string, { from: any; to: any }>;
}

class LoggingService {
  private static instance: LoggingService;

  private constructor() {}

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      // Console logging for immediate visibility
      this.logToConsole(entry);

      // Database logging for persistence
      await this.logToDatabase(entry);
    } catch (error) {
      consoleLogger.error('Failed to log entry:', error);
    }
  }

  async auditLog(entry: AuditLogEntry): Promise<void> {
    try {
      // Console logging
      this.logToConsole(entry);

      // Database logging with audit details
      await this.logToDatabase({
        ...entry,
        metadata: {
          ...entry.metadata,
          beforeState: entry.beforeState,
          afterState: entry.afterState,
          changes: entry.changes
        }
      });
    } catch (error) {
      consoleLogger.error('Failed to log audit entry:', error);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp || new Date();
    const logMessage = `[${timestamp.toISOString()}] [${entry.level}] [${entry.category}] ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        consoleLogger.debug(logMessage);
        break;
      case LogLevel.INFO:
        consoleLogger.info(logMessage);
        break;
      case LogLevel.WARN:
        consoleLogger.warn(logMessage);
        break;
      case LogLevel.ERROR:
        consoleLogger.error(logMessage);
        break;
      case LogLevel.AUDIT:
        consoleLogger.info(`[AUDIT] ${logMessage}`);
        break;
    }
  }

  private async logToDatabase(entry: LogEntry): Promise<void> {
    try {
      await prisma.log.create({
        data: {
          level: entry.level,
          category: entry.category,
          message: entry.message,
          userId: entry.userId,
          userEmail: entry.userEmail,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata || {},
          timestamp: entry.timestamp || new Date()
        }
      });
    } catch (error) {
      consoleLogger.error('Failed to save log to database:', error);
    }
  }

  // Convenience methods for common logging scenarios
  async logUserAction(
    userId: string,
    userEmail: string,
    action: string,
    resource: string,
    resourceId: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      category: LogCategory.USER,
      message,
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      metadata
    });
  }

  async logSecurityEvent(
    userId: string,
    userEmail: string,
    action: string,
    message: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.WARN,
      category: LogCategory.SECURITY,
      message,
      userId,
      userEmail,
      action,
      ipAddress,
      userAgent,
      metadata
    });
  }

  async logTransaction(
    userId: string,
    userEmail: string,
    action: string,
    transactionId: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      category: LogCategory.TRANSACTION,
      message,
      userId,
      userEmail,
      action,
      resource: 'TRANSACTION',
      resourceId: transactionId,
      metadata
    });
  }

  async logPortfolioChange(
    userId: string,
    userEmail: string,
    action: string,
    portfolioId: string,
    message: string,
    beforeState?: any,
    afterState?: any,
    changes?: Record<string, { from: any; to: any }>
  ): Promise<void> {
    await this.auditLog({
      level: LogLevel.AUDIT,
      category: LogCategory.PORTFOLIO,
      message,
      userId,
      userEmail,
      action,
      resource: 'PORTFOLIO',
      resourceId: portfolioId,
      beforeState,
      afterState,
      changes
    });
  }

  async logSystemEvent(
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message,
      metadata
    });
  }

  async logError(
    error: Error,
    userId?: string,
    userEmail?: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message: error.message,
      userId,
      userEmail,
      metadata: {
        stack: error.stack,
        name: error.name,
        ...context
      }
    });
  }

  // Query methods for retrieving logs
  async getLogs(params: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      level,
      category,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      search
    } = params;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (level) where.level = level;
    if (category) where.category = category;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' }
      }),
      prisma.log.count({ where })
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAuditLogs(params: {
    userId?: string;
    resource?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      userId,
      resource,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = params;

    const skip = (page - 1) * limit;
    const where: any = {
      level: LogLevel.AUDIT
    };

    if (userId) where.userId = userId;
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' }
      }),
      prisma.log.count({ where })
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getSystemStats(): Promise<{
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByCategory: Record<string, number>;
    recentErrors: number;
    recentAuditLogs: number;
  }> {
    const [
      totalLogs,
      logsByLevel,
      logsByCategory,
      recentErrors,
      recentAuditLogs
    ] = await Promise.all([
      prisma.log.count(),
      prisma.log.groupBy({
        by: ['level'],
        _count: { level: true }
      }),
      prisma.log.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      prisma.log.count({
        where: {
          level: LogLevel.ERROR,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.log.count({
        where: {
          level: LogLevel.AUDIT,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    const levelStats = logsByLevel.reduce((acc, item) => {
      acc[item.level] = item._count.level;
      return acc;
    }, {} as Record<string, number>);

    const categoryStats = logsByCategory.reduce((acc, item) => {
      acc[item.category] = item._count.category;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs,
      logsByLevel: levelStats,
      logsByCategory: categoryStats,
      recentErrors,
      recentAuditLogs
    };
  }
}

export const loggingService = LoggingService.getInstance(); 