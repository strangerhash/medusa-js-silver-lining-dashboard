import 'reflect-metadata';
import { JsonController, Get, HttpCode, HttpError } from 'routing-controllers';
import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

@JsonController('/analytics')
export class AnalyticsController {
  /**
   * @summary Get analytics dashboard data
   * @description Retrieve comprehensive analytics data for the dashboard
   * @tags Analytics
   */
  @Get('/dashboard')
  @HttpCode(200)
  async getDashboardAnalytics() {
    try {
      // Get real data from database
      const [
        totalUsers,
        activeUsers,
        totalTransactions,
        totalVolume,
        newUsersThisMonth,
        successfulTransactions,
        failedTransactions,
        totalSilverHolding,
        averageTransactionValue
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.transaction.count(),
        prisma.transaction.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        prisma.transaction.count({ where: { status: 'COMPLETED' } }),
        prisma.transaction.count({ where: { status: 'FAILED' } }),
        prisma.portfolio.aggregate({
          _sum: { totalSilverHolding: true }
        }),
        prisma.transaction.aggregate({
          where: { status: 'COMPLETED' },
          _avg: { amount: true }
        })
      ]);

      // Calculate derived metrics
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
      const userGrowth = totalUsers > 0 ? (newUsersThisMonth / totalUsers) * 100 : 0;

      // Generate monthly data for charts from real database
      const monthlyData = [];
      
      // Use dynamic date range based on actual data (last 6 months from now)
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        // Get users created up to this month (cumulative)
        const monthUsers = await prisma.user.count({
          where: {
            createdAt: {
              lt: nextMonthDate
            }
          }
        });
        
        // Get transactions completed in this month
        const monthTransactions = await prisma.transaction.aggregate({
          where: {
            status: 'COMPLETED',
            transactionDate: {
              gte: monthDate,
              lt: nextMonthDate
            }
          },
          _sum: { amount: true }
        });
        
        monthlyData.push({
          name: monthName,
          users: monthUsers,
          revenue: monthTransactions._sum.amount || 0
        });
      }

      const dashboardData = {
        overview: {
          totalUsers,
          activeUsers,
          totalTransactions,
          totalVolume: totalVolume._sum.amount || 0,
          totalSilverHolding: totalSilverHolding._sum.totalSilverHolding || 0,
          averageTransactionValue: averageTransactionValue._avg.amount || 0,
        },
        revenue: {
          totalRevenue: totalVolume._sum.amount || 0,
          monthlyRevenue: 0, // TODO: Calculate monthly revenue
          weeklyRevenue: 0, // TODO: Calculate weekly revenue
          dailyRevenue: 0, // TODO: Calculate daily revenue
          revenueGrowth: 0, // TODO: Calculate revenue growth
        },
        users: {
          newUsers: newUsersThisMonth,
          activeUsers,
          premiumUsers: 0, // TODO: Calculate premium users
          userGrowth,
        },
        transactions: {
          totalTransactions,
          successfulTransactions,
          failedTransactions,
          successRate,
          averageTransactionValue: averageTransactionValue._avg.amount || 0,
        },
        silverMetrics: {
          totalSilverHolding: totalSilverHolding._sum.totalSilverHolding || 0,
          averageSilverPrice: 105, // TODO: Calculate from transactions
          priceChange: 0, // TODO: Calculate price change
          marketTrend: 'stable', // TODO: Determine market trend
        },
        recentActivity: [
          // TODO: Get recent activity from database
          {
            id: '1',
            type: 'user_registration',
            description: 'New user registered',
            user: 'Sample User',
            timestamp: new Date().toISOString(),
          }
        ],
        monthlyData: monthlyData,
        platformHealth: [
          {
            name: 'System Uptime',
            value: '99.9%',
            status: 'excellent',
            change: 0.1,
            lastUpdated: new Date().toISOString()
          },
          {
            name: 'API Response Time',
            value: '120ms',
            status: 'good',
            change: -5,
            lastUpdated: new Date().toISOString()
          },
          {
            name: 'Database Performance',
            value: 'Optimal',
            status: 'excellent',
            change: 0,
            lastUpdated: new Date().toISOString()
          },
          {
            name: 'Security Status',
            value: 'Protected',
            status: 'excellent',
            change: 0,
            lastUpdated: new Date().toISOString()
          }
        ],
      };

      logger.info('Dashboard analytics retrieved successfully');

      return {
        success: true,
        message: 'Dashboard analytics retrieved successfully',
        data: dashboardData,
      };
    } catch (error) {
      logger.error('Get dashboard analytics error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to fetch dashboard analytics');
    }
  }

  /**
   * @summary Get user analytics
   * @description Retrieve user-related analytics data
   * @tags Analytics
   */
  @Get('/users')
  @HttpCode(200)
  async getUserAnalytics() {
    try {
      const [
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        usersByRole,
        usersByStatus,
        userGrowthRate
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
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        }),
        prisma.user.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
            }
          }
        })
      ]);

      const roleStats = usersByRole.reduce((acc: Record<string, number>, item: any) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>);

      const statusStats = usersByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      logger.info('User analytics retrieved successfully');

      return {
        success: true,
        data: {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          usersByRole: roleStats,
          usersByStatus: statusStats,
          userGrowthRate
        }
      };
    } catch (error) {
      logger.error('Get user analytics error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to fetch user analytics');
    }
  }

  /**
   * @summary Get transaction analytics
   * @description Retrieve transaction-related analytics data
   * @tags Analytics
   */
  @Get('/transactions')
  @HttpCode(200)
  async getTransactionAnalytics() {
    try {
      const [
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        totalVolume,
        averageTransactionValue,
        transactionsByType,
        transactionsByStatus,
        transactionsByMonth
      ] = await Promise.all([
        prisma.transaction.count(),
        prisma.transaction.count({ where: { status: 'COMPLETED' } }),
        prisma.transaction.count({ where: { status: 'FAILED' } }),
        prisma.transaction.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { status: 'COMPLETED' },
          _avg: { amount: true }
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          _count: { type: true }
        }),
        prisma.transaction.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.transaction.groupBy({
          by: ['createdAt'],
          _count: { createdAt: true }
        })
      ]);

      const typeStats = transactionsByType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>);

      const statusStats = transactionsByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

      logger.info('Transaction analytics retrieved successfully');

      return {
        success: true,
        data: {
          totalTransactions,
          successfulTransactions,
          failedTransactions,
          totalVolume: totalVolume._sum.amount || 0,
          averageTransactionValue: averageTransactionValue._avg.amount || 0,
          successRate,
          transactionsByType: typeStats,
          transactionsByStatus: statusStats
        }
      };
    } catch (error) {
      logger.error('Get transaction analytics error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to fetch transaction analytics');
    }
  }

  /**
   * @summary Get financial analytics
   * @description Retrieve financial metrics and revenue data
   * @tags Analytics
   */
  @Get('/financial')
  @HttpCode(200)
  async getFinancialAnalytics() {
    try {
      const [
        totalRevenue,
        totalSilverHolding,
        averageSilverPrice,
        revenueByMonth,
        silverPriceHistory
      ] = await Promise.all([
        prisma.transaction.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.portfolio.aggregate({
          _sum: { totalSilverHolding: true }
        }),
        prisma.transaction.aggregate({
          where: { status: 'COMPLETED' },
          _avg: { silverPrice: true }
        }),
        prisma.transaction.groupBy({
          by: ['createdAt'],
          where: { status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.transaction.findMany({
          where: { status: 'COMPLETED' },
          select: {
            silverPrice: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 30
        })
      ]);

      logger.info('Financial analytics retrieved successfully');

      return {
        success: true,
        data: {
          totalRevenue: totalRevenue._sum.amount || 0,
          totalSilverHolding: totalSilverHolding._sum.totalSilverHolding || 0,
          averageSilverPrice: averageSilverPrice._avg.silverPrice || 0,
          revenueByMonth: revenueByMonth,
          silverPriceHistory: silverPriceHistory
        }
      };
    } catch (error) {
      logger.error('Get financial analytics error:', error);
      throw new HttpError(500, 'Server error');
    }
  }
} 