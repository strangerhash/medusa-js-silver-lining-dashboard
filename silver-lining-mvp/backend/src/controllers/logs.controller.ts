import 'reflect-metadata';
import { JsonController, Get, Post, Body, QueryParam, HttpCode, UseBefore, Req } from 'routing-controllers';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { logger } from '../utils/logger';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

@JsonController('/logs')
@UseBefore(authMiddleware)
export class LogsController {
  /**
   * @summary Get logs
   * @description Retrieve paginated logs with filtering
   * @tags Logs
   */
  @Get('/')
  @HttpCode(200)
  async getLogs(
    @QueryParam('level') level?: string,
    @QueryParam('category') category?: string,
    @QueryParam('userId') userId?: string,
    @QueryParam('startDate') startDate?: string,
    @QueryParam('endDate') endDate?: string,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 50,
    @QueryParam('search') search?: string
  ) {
    try {
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
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
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

      logger.info(`Retrieved ${logs.length} logs`);

      return {
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get logs error:', error);
      throw error;
    }
  }

  /**
   * @summary Create log entry
   * @description Create a new log entry
   * @tags Logs
   */
  @Post('/')
  @HttpCode(201)
  async createLog(@Body() body: {
    level: string;
    category: string;
    message: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    userId?: string;
    userEmail?: string;
    metadata?: Record<string, any>;
    timestamp?: string;
  }, @Req() req: AuthRequest) {
    try {
      // Get user ID from auth context if not provided
      const userId = body.userId || req.user?.id;
      const userEmail = body.userEmail || req.user?.email;

      const log = await prisma.log.create({
        data: {
          level: body.level,
          category: body.category,
          message: body.message,
          action: body.action,
          resource: body.resource,
          resourceId: body.resourceId,
          userId: userId,
          userEmail: userEmail,
          metadata: body.metadata || {},
          timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });

      logger.info(`Created log entry: ${log.id}`);

      return {
        success: true,
        data: log
      };
    } catch (error) {
      logger.error('Create log error:', error);
      throw error;
    }
  }

  /**
   * @summary Get log statistics
   * @description Get log statistics and analytics
   * @tags Logs
   */
  @Get('/stats')
  @HttpCode(200)
  async getLogStats() {
    try {
      const [
        totalLogs,
        errorLogs,
        warningLogs,
        infoLogs,
        auditLogs,
        logsByCategory,
        recentLogs
      ] = await Promise.all([
        prisma.log.count(),
        prisma.log.count({ where: { level: 'ERROR' } }),
        prisma.log.count({ where: { level: 'WARN' } }),
        prisma.log.count({ where: { level: 'INFO' } }),
        prisma.log.count({ where: { level: 'AUDIT' } }),
        prisma.log.groupBy({
          by: ['category'],
          _count: { category: true }
        }),
        prisma.log.findMany({
          take: 10,
          orderBy: { timestamp: 'desc' }
        })
      ]);

      const categoryStats = logsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {} as Record<string, number>);

      logger.info('Retrieved log statistics');

      return {
        success: true,
        data: {
          totalLogs,
          errorLogs,
          warningLogs,
          infoLogs,
          auditLogs,
          categoryStats,
          recentLogs
        }
      };
    } catch (error) {
      logger.error('Get log stats error:', error);
      throw error;
    }
  }

  /**
   * @summary Get audit logs
   * @description Get audit logs for compliance and security
   * @tags Logs
   */
  @Get('/audit')
  @HttpCode(200)
  async getAuditLogs(
    @QueryParam('userId') userId?: string,
    @QueryParam('resource') resource?: string,
    @QueryParam('resourceId') resourceId?: string,
    @QueryParam('startDate') startDate?: string,
    @QueryParam('endDate') endDate?: string,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 50
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = { level: 'AUDIT' };

      if (userId) where.userId = userId;
      if (resource) where.resource = resource;
      if (resourceId) where.resourceId = resourceId;

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
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

      logger.info(`Retrieved ${logs.length} audit logs`);

      return {
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get audit logs error:', error);
      throw error;
    }
  }
} 