import 'reflect-metadata';
import { JsonController, Get, Post, Body, Param, HttpCode, HttpError } from 'routing-controllers';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PrismaClient, $Enums } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

enum ReportType {
  USER_ACTIVITY = 'user_activity',
  TRANSACTION_SUMMARY = 'transaction_summary',
  FINANCIAL_REPORT = 'financial_report',
  KYC_REPORT = 'kyc_report',
  PORTFOLIO_REPORT = 'portfolio_report'
}

class GenerateReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  format?: string;
}

@JsonController('/reports')
export class ReportsController {
  /**
   * @summary Get available report types
   * @description Retrieve list of available report types
   * @tags Reports
   */
  @Get('/types')
  @HttpCode(200)
  async getReportTypes() {
    try {
      const reportTypes = [
        {
          id: ReportType.USER_ACTIVITY,
          name: 'User Activity Report',
          description: 'Detailed user activity and engagement metrics',
          parameters: ['startDate', 'endDate']
        },
        {
          id: ReportType.TRANSACTION_SUMMARY,
          name: 'Transaction Summary Report',
          description: 'Comprehensive transaction analysis and statistics',
          parameters: ['startDate', 'endDate']
        },
        {
          id: ReportType.FINANCIAL_REPORT,
          name: 'Financial Report',
          description: 'Financial metrics and revenue analysis',
          parameters: ['startDate', 'endDate']
        },
        {
          id: ReportType.KYC_REPORT,
          name: 'KYC Report',
          description: 'KYC application status and processing metrics',
          parameters: ['startDate', 'endDate']
        },
        {
          id: ReportType.PORTFOLIO_REPORT,
          name: 'Portfolio Report',
          description: 'Portfolio holdings and performance analysis',
          parameters: ['startDate', 'endDate']
        }
      ];

      return {
        success: true,
        data: reportTypes
      };
    } catch (error) {
      logger.error('Get report types error:', error);
      throw error;
    }
  }

  /**
   * @summary Generate user activity report
   * @description Generate comprehensive user activity report
   * @tags Reports
   */
  @Get('/user-activity')
  @HttpCode(200)
  async getUserActivityReport(@Body() query: any) {
    try {
      const { startDate, endDate } = query;

      const where: any = {};
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const [
        totalUsers,
        newUsers,
        activeUsers,
        usersByRole,
        usersByStatus,
        userGrowth
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where }),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
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

      const report = {
        reportType: ReportType.USER_ACTIVITY,
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate },
        summary: {
          totalUsers,
          newUsers,
          activeUsers,
          userGrowth: totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0
        },
        details: {
          usersByRole: roleStats,
          usersByStatus: statusStats
        }
      };

      logger.info('User activity report generated successfully');

      return {
        success: true,
        data: report
      };
    } catch (error) {
      logger.error('Generate user activity report error:', error);
      throw error;
    }
  }

  /**
   * @summary Generate transaction summary report
   * @description Generate comprehensive transaction analysis report
   * @tags Reports
   */
  @Get('/transaction-summary')
  @HttpCode(200)
  async getTransactionSummaryReport(@Body() query: any) {
    try {
      const { startDate, endDate } = query;

      const where: any = {};
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const [
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        totalVolume,
        averageTransactionValue,
        transactionsByType,
        transactionsByStatus
      ] = await Promise.all([
        prisma.transaction.count({ where }),
        prisma.transaction.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.transaction.count({ where: { ...where, status: 'FAILED' } }),
        prisma.transaction.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _avg: { amount: true }
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where,
          _count: { type: true }
        }),
        prisma.transaction.groupBy({
          by: ['status'],
          where,
          _count: { status: true }
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

      const report = {
        reportType: ReportType.TRANSACTION_SUMMARY,
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate },
        summary: {
          totalTransactions,
          successfulTransactions,
          failedTransactions,
          successRate,
          totalVolume: totalVolume._sum.amount || 0,
          averageTransactionValue: averageTransactionValue._avg.amount || 0
        },
        details: {
          transactionsByType: typeStats,
          transactionsByStatus: statusStats
        }
      };

      logger.info('Transaction summary report generated successfully');

      return {
        success: true,
        data: report
      };
    } catch (error) {
      logger.error('Generate transaction summary report error:', error);
      throw error;
    }
  }

  /**
   * @summary Generate financial report
   * @description Generate comprehensive financial analysis report
   * @tags Reports
   */
  @Get('/financial')
  @HttpCode(200)
  async getFinancialReport(@Body() query: any) {
    try {
      const { startDate, endDate } = query;

      const where: any = {};
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const [
        totalRevenue,
        totalSilverHolding,
        averageSilverPrice,
        revenueByMonth,
        portfolioValue
      ] = await Promise.all([
        prisma.transaction.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.portfolio.aggregate({
          _sum: { totalSilverHolding: true }
        }),
        prisma.transaction.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _avg: { silverPrice: true }
        }),
        prisma.transaction.groupBy({
          by: ['createdAt'],
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.portfolio.aggregate({
          _sum: { currentValue: true }
        })
      ]);

      const report = {
        reportType: ReportType.FINANCIAL_REPORT,
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate },
        summary: {
          totalRevenue: totalRevenue._sum.amount || 0,
          totalSilverHolding: totalSilverHolding._sum.totalSilverHolding || 0,
          averageSilverPrice: averageSilverPrice._avg.silverPrice || 0,
          totalPortfolioValue: portfolioValue._sum.currentValue || 0
        },
        details: {
          revenueByMonth: revenueByMonth,
          silverMetrics: {
            totalHolding: totalSilverHolding._sum.totalSilverHolding || 0,
            averagePrice: averageSilverPrice._avg.silverPrice || 0
          }
        }
      };

      logger.info('Financial report generated successfully');

      return {
        success: true,
        data: report
      };
    } catch (error) {
      logger.error('Generate financial report error:', error);
      throw error;
    }
  }

  /**
   * @summary Generate KYC report
   * @description Generate KYC processing and status report
   * @tags Reports
   */
  @Get('/kyc')
  @HttpCode(200)
  async getKYCReport(@Body() query: any) {
    try {
      const { startDate, endDate } = query;

      const where: any = {};
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const [
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        applicationsByStatus
      ] = await Promise.all([
        prisma.kycApplication.count({ where }),
        prisma.kycApplication.count({ where: { ...where, status: 'PENDING' } }),
        prisma.kycApplication.count({ where: { ...where, status: 'APPROVED' } }),
        prisma.kycApplication.count({ where: { ...where, status: 'REJECTED' } }),
        prisma.kycApplication.groupBy({
          by: ['status'],
          where,
          _count: { status: true }
        })
      ]);

      const statusStats = applicationsByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      const approvalRate = totalApplications > 0 ? (approvedApplications / totalApplications) * 100 : 0;

      const report = {
        reportType: ReportType.KYC_REPORT,
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate },
        summary: {
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications,
          approvalRate
        },
        details: {
          applicationsByStatus: statusStats
        }
      };

      logger.info('KYC report generated successfully');

      return {
        success: true,
        data: report
      };
    } catch (error) {
      logger.error('Generate KYC report error:', error);
      throw error;
    }
  }

  /**
   * @summary Generate portfolio report
   * @description Generate portfolio holdings and performance report
   * @tags Reports
   */
  @Get('/portfolio')
  @HttpCode(200)
  async getPortfolioReport(@Body() query: any) {
    try {
      const [
        totalPortfolios,
        totalSilverHolding,
        totalPortfolioValue,
        averageSilverPrice,
        averagePortfolioValue
      ] = await Promise.all([
        prisma.portfolio.count(),
        prisma.portfolio.aggregate({
          _sum: { totalSilverHolding: true }
        }),
        prisma.portfolio.aggregate({
          _sum: { currentValue: true }
        }),
        prisma.portfolio.aggregate({
          _avg: { currentSilverPrice: true }
        }),
        prisma.portfolio.aggregate({
          _avg: { currentValue: true }
        })
      ]);

      const report = {
        reportType: ReportType.PORTFOLIO_REPORT,
        generatedAt: new Date().toISOString(),
        summary: {
          totalPortfolios,
          totalSilverHolding: totalSilverHolding._sum.totalSilverHolding || 0,
          totalPortfolioValue: totalPortfolioValue._sum.currentValue || 0,
          averageSilverPrice: averageSilverPrice._avg.currentSilverPrice || 0,
          averagePortfolioValue: averagePortfolioValue._avg.currentValue || 0
        },
        details: {
          silverMetrics: {
            totalHolding: totalSilverHolding._sum.totalSilverHolding || 0,
            averagePrice: averageSilverPrice._avg.currentSilverPrice || 0
          },
          portfolioMetrics: {
            totalValue: totalPortfolioValue._sum.currentValue || 0,
            averageValue: averagePortfolioValue._avg.currentValue || 0
          }
        }
      };

      logger.info('Portfolio report generated successfully');

      return {
        success: true,
        data: report
      };
    } catch (error) {
      logger.error('Generate portfolio report error:', error);
      throw error;
    }
  }

  /**
   * @summary Generate custom report
   * @description Generate a custom report based on specified parameters
   * @tags Reports
   */
  @Post('/generate')
  @HttpCode(200)
  async generateCustomReport(@Body() body: GenerateReportDto) {
    try {
      const { type, startDate, endDate, format = 'json' } = body;

      let report: any;

      switch (type) {
        case ReportType.USER_ACTIVITY:
          report = await this.getUserActivityReport({ startDate, endDate });
          break;
        case ReportType.TRANSACTION_SUMMARY:
          report = await this.getTransactionSummaryReport({ startDate, endDate });
          break;
        case ReportType.FINANCIAL_REPORT:
          report = await this.getFinancialReport({ startDate, endDate });
          break;
        case ReportType.KYC_REPORT:
          report = await this.getKYCReport({ startDate, endDate });
          break;
        case ReportType.PORTFOLIO_REPORT:
          report = await this.getPortfolioReport({ startDate, endDate });
          break;
        default:
          throw new HttpError(400, 'Invalid report type');
      }

      logger.info(`Custom report generated: ${type}`);

      return {
        success: true,
        data: report.data,
        format
      };
    } catch (error) {
      logger.error('Generate custom report error:', error);
      throw error;
    }
  }
} 