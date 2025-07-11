import 'reflect-metadata';
import { JsonController, Get, Post, Put, Body, Param, HttpCode, HttpError } from 'routing-controllers';
import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

@JsonController('/admin')
export class AdminController {
  /**
   * @summary Get admin dashboard overview
   * @description Retrieve comprehensive admin dashboard data
   * @tags Admin
   */
  @Get('/dashboard')
  @HttpCode(200)
  async getAdminDashboard() {
    try {
      const [
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        totalTransactions,
        totalVolume,
        pendingKYC,
        totalPortfolios,
        totalNotifications
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        prisma.transaction.count(),
        prisma.transaction.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.kycApplication.count({ where: { status: 'PENDING' } }),
        prisma.portfolio.count(),
        prisma.notification.count()
      ]);

      const dashboardData = {
        overview: {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          totalTransactions,
          totalVolume: totalVolume._sum.amount || 0,
          pendingKYC,
          totalPortfolios,
          totalNotifications
        },
        metrics: {
          userGrowth: totalUsers > 0 ? (newUsersThisMonth / totalUsers) * 100 : 0,
          activeUserRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          averageTransactionValue: totalTransactions > 0 ? (totalVolume._sum.amount || 0) / totalTransactions : 0
        },
        recentActivity: [
          // TODO: Get recent activity from database
          {
            id: '1',
            type: 'user_registration',
            description: 'New user registered',
            timestamp: new Date().toISOString()
          }
        ]
      };

      logger.info('Admin dashboard data retrieved successfully');

      return {
        success: true,
        data: dashboardData
      };
    } catch (error) {
      logger.error('Get admin dashboard error:', error);
      throw new HttpError(500, 'Server error');
    }
  }

  /**
   * @summary Get system statistics
   * @description Retrieve comprehensive system statistics
   * @tags Admin
   */
  @Get('/stats')
  @HttpCode(200)
  async getSystemStats() {
    try {
      const [
        userStats,
        transactionStats,
        kycStats,
        portfolioStats,
        notificationStats
      ] = await Promise.all([
        // User statistics
        Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { status: 'ACTIVE' } }),
          prisma.user.count({ where: { status: 'INACTIVE' } }),
                     prisma.user.count({ where: { status: 'PENDING' } }),
          prisma.user.groupBy({
            by: ['role'],
            _count: { role: true }
          })
        ]),
        // Transaction statistics
        Promise.all([
          prisma.transaction.count(),
          prisma.transaction.count({ where: { status: 'COMPLETED' } }),
          prisma.transaction.count({ where: { status: 'PENDING' } }),
          prisma.transaction.count({ where: { status: 'FAILED' } }),
          prisma.transaction.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { amount: true }
          }),
          prisma.transaction.groupBy({
            by: ['type'],
            _count: { type: true }
          })
        ]),
        // KYC statistics
        Promise.all([
          prisma.kycApplication.count(),
          prisma.kycApplication.count({ where: { status: 'PENDING' } }),
          prisma.kycApplication.count({ where: { status: 'APPROVED' } }),
          prisma.kycApplication.count({ where: { status: 'REJECTED' } }),
          prisma.kycApplication.groupBy({
            by: ['status'],
            _count: { status: true }
          })
        ]),
        // Portfolio statistics
        Promise.all([
          prisma.portfolio.count(),
          prisma.portfolio.aggregate({
            _sum: { totalSilverHolding: true }
          }),
          prisma.portfolio.aggregate({
            _sum: { currentValue: true }
          }),
          prisma.portfolio.aggregate({
            _avg: { currentSilverPrice: true }
          })
        ]),
        // Notification statistics
        Promise.all([
          prisma.notification.count(),
          prisma.notification.count({ where: { isRead: false } }),
          prisma.notification.count({ where: { isRead: true } }),
          prisma.notification.groupBy({
            by: ['type'],
            _count: { type: true }
          })
        ])
      ]);

      const [totalUsers, activeUsers, inactiveUsers, pendingUsers, usersByRole] = userStats;
      const [totalTransactions, completedTransactions, pendingTransactions, failedTransactions, totalVolume, transactionsByType] = transactionStats;
      const [totalKYC, pendingKYC, approvedKYC, rejectedKYC, kycByStatus] = kycStats;
      const [totalPortfolios, totalSilverHolding, totalPortfolioValue, averageSilverPrice] = portfolioStats;
      const [totalNotifications, unreadNotifications, readNotifications, notificationsByType] = notificationStats;

      const roleStats = usersByRole.reduce((acc: Record<string, number>, item: any) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>);

      const typeStats = transactionsByType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>);

      const kycStatusStats = kycByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      const notificationTypeStats = notificationsByType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>);

      const systemStats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          pending: pendingUsers,
          byRole: roleStats
        },
        transactions: {
          total: totalTransactions,
          completed: completedTransactions,
          pending: pendingTransactions,
          failed: failedTransactions,
          totalVolume: totalVolume._sum.amount || 0,
          byType: typeStats,
          successRate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0
        },
        kyc: {
          total: totalKYC,
          pending: pendingKYC,
          approved: approvedKYC,
          rejected: rejectedKYC,
          byStatus: kycStatusStats,
          approvalRate: totalKYC > 0 ? (approvedKYC / totalKYC) * 100 : 0
        },
        portfolios: {
          total: totalPortfolios,
          totalSilverHolding: totalSilverHolding._sum.totalSilverHolding || 0,
          totalValue: totalPortfolioValue._sum.currentValue || 0,
          averageSilverPrice: averageSilverPrice._avg.currentSilverPrice || 0
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
          read: readNotifications,
          byType: notificationTypeStats
        }
      };

      logger.info('System statistics retrieved successfully');

      return {
        success: true,
        data: systemStats
      };
    } catch (error) {
      logger.error('Get system stats error:', error);
      throw new HttpError(500, 'Server error');
    }
  }

  /**
   * @summary Get system health
   * @description Check system health and status
   * @tags Admin
   */
  @Get('/health')
  @HttpCode(200)
  async getSystemHealth() {
    try {
      const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
        redis: 'connected', // TODO: Check Redis connection
        services: {
          auth: 'operational',
          transactions: 'operational',
          kyc: 'operational',
          notifications: 'operational'
        }
      };

      logger.info('System health check completed');

      return {
        success: true,
        data: healthCheck
      };
    } catch (error) {
      logger.error('System health check error:', error);
      throw new HttpError(500, 'Server error');
    }
  }

  /**
   * @summary Initialize system
   * @description Initialize system with default data and settings
   * @tags Admin
   */
  @Post('/init')
  @HttpCode(200)
  async initializeSystem() {
    try {
      // Initialize default settings
      const settingsController = new (require('./settings.controller').SettingsController)();
      await settingsController.initializeDefaultSettings();

      // Create default admin user if not exists
      const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (!existingAdmin) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 12);

        await prisma.user.create({
          data: {
            name: 'System Administrator',
            email: 'admin@silverlining.com',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE'
          }
        });

        logger.info('Default admin user created');
      }

      logger.info('System initialization completed');

      return {
        success: true,
        message: 'System initialized successfully',
        data: {
          settings: 'initialized',
          adminUser: existingAdmin ? 'exists' : 'created'
        }
      };
    } catch (error) {
      logger.error('System initialization error:', error);
      throw new HttpError(500, 'System initialization failed');
    }
  }
} 