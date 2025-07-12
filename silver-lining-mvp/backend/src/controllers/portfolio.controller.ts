import 'reflect-metadata';
import { JsonController, Get, Post, Put, Delete, Body, Param, QueryParam, HttpCode, HttpError, UseBefore } from 'routing-controllers';
import { IsString, IsOptional, IsNumber, IsNumberString, IsArray, IsDateString } from 'class-validator';
import { PrismaClient, $Enums } from '../generated/prisma';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();

class CreatePortfolioDto {
  @IsString()
  userId!: string;

  @IsNumber()
  totalSilverHolding!: number;

  @IsNumber()
  totalInvested!: number;

  @IsNumber()
  currentValue!: number;

  @IsNumber()
  currentSilverPrice!: number;

  @IsOptional()
  @IsArray()
  holdings?: any[];

  @IsOptional()
  performance?: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
}

class UpdatePortfolioDto {
  @IsOptional()
  @IsNumber()
  totalSilverHolding?: number;

  @IsOptional()
  @IsNumber()
  totalInvested?: number;

  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @IsOptional()
  @IsNumber()
  currentSilverPrice?: number;

  @IsOptional()
  @IsArray()
  holdings?: any[];

  @IsOptional()
  performance?: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
}

class PortfolioQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'currentValue';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

@JsonController('/portfolio')
@UseBefore(authMiddleware)
export class PortfolioController {
  /**
   * @summary Get all portfolios with advanced filtering
   * @description Retrieve paginated list of portfolios with advanced filtering and sorting
   * @tags Portfolio
   */
  @Get('/')
  @HttpCode(200)
  async getAllPortfolios(
    @QueryParam('search') search?: string,
    @QueryParam('minValue') minValue?: number,
    @QueryParam('maxValue') maxValue?: number,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10,
    @QueryParam('sortBy') sortBy: string = 'currentValue',
    @QueryParam('sortOrder') sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: any = {};
      
      if (search) {
        where.OR = [
          {
            user: {
              name: { contains: search, mode: 'insensitive' }
            }
          },
          {
            user: {
              email: { contains: search, mode: 'insensitive' }
            }
          }
        ];
      }

      if (minValue !== undefined) {
        where.currentValue = { ...where.currentValue, gte: minValue };
      }

      if (maxValue !== undefined) {
        where.currentValue = { ...where.currentValue, lte: maxValue };
      }

      // Build order by clause
      const orderBy: any = {};
      if (sortBy === 'user') {
        orderBy.user = { name: sortOrder };
      } else if (sortBy === 'profit') {
        orderBy.totalProfit = sortOrder;
      } else if (sortBy === 'profitPercentage') {
        orderBy.profitPercentage = sortOrder;
      } else if (sortBy === 'silverHolding') {
        orderBy.totalSilverHolding = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      const [portfolios, total] = await Promise.all([
        prisma.portfolio.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true
              }
            }
          },
          orderBy
        }),
        prisma.portfolio.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${portfolios.length} portfolios (page ${page}/${totalPages})`);

      return {
        success: true,
        data: portfolios,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get all portfolios error:', error);
      throw error;
    }
  }

  /**
   * @summary Get portfolio statistics
   * @description Get comprehensive portfolio statistics and analytics
   * @tags Portfolio
   */
  @Get('/stats')
  @HttpCode(200)
  async getPortfolioStats() {
    try {
      const [
        totalPortfolios,
        totalSilverHolding,
        totalPortfolioValue,
        averageSilverPrice,
        totalInvested,
        totalProfit,
        portfolioValueByMonth,
        topPerformers,
        recentPortfolios
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
          _sum: { totalInvested: true }
        }),
        prisma.portfolio.aggregate({
          _sum: { totalProfit: true }
        }),
        prisma.portfolio.groupBy({
          by: ['lastUpdated'],
          _sum: { currentValue: true },
          _count: { id: true }
        }),
        prisma.portfolio.findMany({
          take: 5,
          orderBy: { profitPercentage: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.portfolio.findMany({
          take: 5,
          orderBy: { lastUpdated: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        })
      ]);

      const totalProfitValue = totalProfit._sum.totalProfit || 0;
      const totalInvestedValue = totalInvested._sum.totalInvested || 0;
      const overallProfitPercentage = totalInvestedValue > 0 ? (totalProfitValue / totalInvestedValue) * 100 : 0;

      logger.info('Retrieved portfolio statistics');

      return {
        success: true,
        data: {
          totalPortfolios,
          totalSilverHolding: totalSilverHolding._sum.totalSilverHolding || 0,
          totalPortfolioValue: totalPortfolioValue._sum.currentValue || 0,
          totalInvested: totalInvestedValue,
          totalProfit: totalProfitValue,
          overallProfitPercentage,
          averageSilverPrice: averageSilverPrice._avg.currentSilverPrice || 0,
          averagePortfolioValue: totalPortfolios > 0 ? (totalPortfolioValue._sum.currentValue || 0) / totalPortfolios : 0,
          portfolioValueByMonth,
          topPerformers,
          recentPortfolios
        }
      };
    } catch (error) {
      logger.error('Get portfolio stats error:', error);
      throw error;
    }
  }

  /**
   * @summary Get portfolio by ID
   * @description Retrieve a specific portfolio by ID with full details
   * @tags Portfolio
   */
  @Get('/:id')
  @HttpCode(200)
  async getPortfolioById(@Param('id') id: string) {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true
            }
          }
        }
      });

      if (!portfolio) {
        throw new HttpError(404, 'Portfolio not found');
      }

      return {
        success: true,
        data: portfolio
      };
    } catch (error) {
      logger.error('Get portfolio by ID error:', error);
      throw error;
    }
  }

  /**
   * @summary Get user portfolio
   * @description Retrieve portfolio for a specific user
   * @tags Portfolio
   */
  @Get('/user/:userId')
  @HttpCode(200)
  async getUserPortfolio(@Param('userId') userId: string) {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true
            }
          }
        }
      });

      if (!portfolio) {
        throw new HttpError(404, 'Portfolio not found');
      }

      return {
        success: true,
        data: portfolio
      };
    } catch (error) {
      logger.error('Get user portfolio error:', error);
      throw error;
    }
  }

  /**
   * @summary Create portfolio
   * @description Create a new portfolio for a user
   * @tags Portfolio
   */
  @Post('/')
  @HttpCode(201)
  async createPortfolio(@Body() body: CreatePortfolioDto) {
    try {
      const { userId, totalSilverHolding, totalInvested, currentValue, currentSilverPrice, holdings, performance } = body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      // Check if portfolio already exists
      const existingPortfolio = await prisma.portfolio.findUnique({
        where: { userId }
      });

      if (existingPortfolio) {
        throw new HttpError(409, 'Portfolio already exists for this user');
      }

      // Calculate profit metrics
      const totalProfit = currentValue - totalInvested;
      const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
      const averageBuyPrice = totalSilverHolding > 0 ? totalInvested / totalSilverHolding : 0;

      const portfolio = await prisma.portfolio.create({
        data: {
          userId,
          totalSilverHolding,
          totalInvested,
          currentValue,
          totalProfit,
          profitPercentage,
          averageBuyPrice,
          currentSilverPrice,
          holdings: holdings || [],
          performance: performance || {
            daily: 0,
            weekly: 0,
            monthly: 0,
            yearly: 0
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId,
          title: 'Portfolio Created',
          message: `Your portfolio has been created successfully with ${totalSilverHolding}g silver holdings.`,
          type: 'INFO'
        }
      });

      logger.info(`Created portfolio for user: ${user.email}`);

      return {
        success: true,
        data: portfolio
      };
    } catch (error) {
      logger.error('Create portfolio error:', error);
      throw error;
    }
  }

  /**
   * @summary Update portfolio
   * @description Update an existing portfolio
   * @tags Portfolio
   */
  @Put('/:id')
  @HttpCode(200)
  async updatePortfolio(@Param('id') id: string, @Body() body: UpdatePortfolioDto) {
    try {
      const { totalSilverHolding, totalInvested, currentValue, currentSilverPrice, holdings, performance } = body;

      // Check if portfolio exists
      const existingPortfolio = await prisma.portfolio.findUnique({
        where: { id }
      });

      if (!existingPortfolio) {
        throw new HttpError(404, 'Portfolio not found');
      }

      // Calculate new values
      const newTotalSilverHolding = totalSilverHolding ?? existingPortfolio.totalSilverHolding;
      const newTotalInvested = totalInvested ?? existingPortfolio.totalInvested;
      const newCurrentValue = currentValue ?? existingPortfolio.currentValue;
      const newCurrentSilverPrice = currentSilverPrice ?? existingPortfolio.currentSilverPrice;

      // Calculate profit metrics
      const totalProfit = newCurrentValue - newTotalInvested;
      const profitPercentage = newTotalInvested > 0 ? (totalProfit / newTotalInvested) * 100 : 0;
      const averageBuyPrice = newTotalSilverHolding > 0 ? newTotalInvested / newTotalSilverHolding : 0;

      const updateData: any = {
        totalSilverHolding: newTotalSilverHolding,
        totalInvested: newTotalInvested,
        currentValue: newCurrentValue,
        totalProfit,
        profitPercentage,
        averageBuyPrice,
        currentSilverPrice: newCurrentSilverPrice,
        lastUpdated: new Date()
      };

      if (holdings !== undefined) updateData.holdings = holdings;
      if (performance !== undefined) updateData.performance = performance;

      const portfolio = await prisma.portfolio.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      logger.info(`Updated portfolio ID: ${id}`);

      return {
        success: true,
        data: portfolio
      };
    } catch (error) {
      logger.error('Update portfolio error:', error);
      throw error;
    }
  }

  /**
   * @summary Delete portfolio
   * @description Delete a portfolio (admin only)
   * @tags Portfolio
   */
  @Delete('/:id')
  @HttpCode(200)
  async deletePortfolio(@Param('id') id: string) {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id }
      });

      if (!portfolio) {
        throw new HttpError(404, 'Portfolio not found');
      }

      await prisma.portfolio.delete({
        where: { id }
      });

      logger.info(`Deleted portfolio ID: ${id}`);

      return {
        success: true,
        message: 'Portfolio deleted successfully'
      };
    } catch (error) {
      logger.error('Delete portfolio error:', error);
      throw error;
    }
  }

  // /**
  //  * @summary Get portfolio statistics
  //  * @description Get comprehensive portfolio statistics and analytics
  //  * @tags Portfolio
  //  */
  // @Get('/stats')
  // @HttpCode(200)
  // async getPortfolioStats() {
  //   try {
  //     const [
  //       totalPortfolios,
  //       totalSilverHolding,
  //       totalPortfolioValue,
  //       averageSilverPrice,
  //       totalInvested,
  //       totalProfit,
  //       portfolioValueByMonth,
  //       topPerformers,
  //       recentPortfolios
  //     ] = await Promise.all([
  //       prisma.portfolio.count(),
  //       prisma.portfolio.aggregate({
  //         _sum: { totalSilverHolding: true }
  //       }),
  //       prisma.portfolio.aggregate({
  //         _sum: { currentValue: true }
  //       }),
  //       prisma.portfolio.aggregate({
  //         _avg: { currentSilverPrice: true }
  //       }),
  //       prisma.portfolio.aggregate({
  //         _sum: { totalInvested: true }
  //       }),
  //       prisma.portfolio.aggregate({
  //         _sum: { totalProfit: true }
  //       }),
  //       prisma.portfolio.groupBy({
  //         by: ['lastUpdated'],
  //         _sum: { currentValue: true },
  //         _count: { id: true }
  //       }),
  //       prisma.portfolio.findMany({
  //         take: 5,
  //         orderBy: { profitPercentage: 'desc' },
  //         include: {
  //           user: {
  //             select: {
  //               name: true,
  //               email: true
  //             }
  //           }
  //         }
  //       }),
  //       prisma.portfolio.findMany({
  //         take: 5,
  //         orderBy: { lastUpdated: 'desc' },
  //         include: {
  //           user: {
  //             select: {
  //               name: true,
  //               email: true
  //             }
  //           }
  //         }
  //       })
  //     ]);

  //     const totalProfitValue = totalProfit._sum.totalProfit || 0;
  //     const totalInvestedValue = totalInvested._sum.totalInvested || 0;
  //     const overallProfitPercentage = totalInvestedValue > 0 ? (totalProfitValue / totalInvestedValue) * 100 : 0;

  //     logger.info('Retrieved portfolio statistics');

  //     return {
  //       success: true,
  //       data: {
  //         totalPortfolios,
  //         totalSilverHolding: totalSilverHolding._sum.totalSilverHolding || 0,
  //         totalPortfolioValue: totalPortfolioValue._sum.currentValue || 0,
  //         totalInvested: totalInvestedValue,
  //         totalProfit: totalProfitValue,
  //         overallProfitPercentage,
  //         averageSilverPrice: averageSilverPrice._avg.currentSilverPrice || 0,
  //         averagePortfolioValue: totalPortfolios > 0 ? (totalPortfolioValue._sum.currentValue || 0) / totalPortfolios : 0,
  //         portfolioValueByMonth,
  //         topPerformers,
  //         recentPortfolios
  //       }
  //     };
  //   } catch (error) {
  //     logger.error('Get portfolio stats error:', error);
  //     throw error;
  //   }
  // }

  /**
   * @summary Get portfolio analytics
   * @description Get detailed portfolio analytics for charts and reports
   * @tags Portfolio
   */
  @Get('/analytics/detailed')
  @HttpCode(200)
  async getPortfolioAnalytics(
    @QueryParam('period') period: string = '30d',
    @QueryParam('minValue') minValue?: number,
    @QueryParam('maxValue') maxValue?: number
  ) {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const where: any = {
        lastUpdated: {
          gte: startDate
        }
      };

      if (minValue !== undefined) where.currentValue = { ...where.currentValue, gte: minValue };
      if (maxValue !== undefined) where.currentValue = { ...where.currentValue, lte: maxValue };

      const portfolios = await prisma.portfolio.findMany({
        where,
        select: {
          id: true,
          currentValue: true,
          totalProfit: true,
          profitPercentage: true,
          totalSilverHolding: true,
          lastUpdated: true
        },
        orderBy: { lastUpdated: 'asc' }
      });

      // Group by date for chart data
      const dailyStats = portfolios.reduce((acc: Record<string, any>, portfolio) => {
        const date = portfolio.lastUpdated.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            totalValue: 0,
            totalProfit: 0,
            avgProfitPercentage: 0,
            count: 0
          };
        }
        
        acc[date].totalValue += portfolio.currentValue;
        acc[date].totalProfit += portfolio.totalProfit;
        acc[date].count += 1;
        acc[date].avgProfitPercentage = acc[date].totalProfit / acc[date].count;
        
        return acc;
      }, {});

      const chartData = Object.values(dailyStats);

      // Calculate distribution metrics
      const valueRanges = {
        '0-10k': 0,
        '10k-50k': 0,
        '50k-100k': 0,
        '100k-500k': 0,
        '500k+': 0
      };

      portfolios.forEach(portfolio => {
        if (portfolio.currentValue <= 10000) valueRanges['0-10k']++;
        else if (portfolio.currentValue <= 50000) valueRanges['10k-50k']++;
        else if (portfolio.currentValue <= 100000) valueRanges['50k-100k']++;
        else if (portfolio.currentValue <= 500000) valueRanges['100k-500k']++;
        else valueRanges['500k+']++;
      });

      logger.info('Retrieved portfolio analytics');

      return {
        success: true,
        data: {
          period,
          startDate,
          endDate: now,
          totalPortfolios: portfolios.length,
          totalValue: portfolios.reduce((sum, p) => sum + p.currentValue, 0),
          totalProfit: portfolios.reduce((sum, p) => sum + p.totalProfit, 0),
          avgProfitPercentage: portfolios.length > 0 ? 
            portfolios.reduce((sum, p) => sum + p.profitPercentage, 0) / portfolios.length : 0,
          chartData,
          valueRanges,
          profitDistribution: {
            profitable: portfolios.filter(p => p.totalProfit > 0).length,
            breakeven: portfolios.filter(p => p.totalProfit === 0).length,
            loss: portfolios.filter(p => p.totalProfit < 0).length
          }
        }
      };
    } catch (error) {
      logger.error('Get portfolio analytics error:', error);
      throw error;
    }
  }

  /**
   * @summary Sync portfolio with transactions
   * @description Update portfolio based on user's transaction history
   * @tags Portfolio
   */
  @Post('/:id/sync')
  @HttpCode(200)
  async syncPortfolioWithTransactions(@Param('id') id: string) {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

      if (!portfolio) {
        throw new HttpError(404, 'Portfolio not found');
      }

      // Get all completed transactions for the user
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: portfolio.userId,
          status: 'COMPLETED'
        },
        orderBy: { createdAt: 'asc' }
      });

      let totalSilverHolding = 0;
      let totalInvested = 0;
      const holdings: any[] = [];

      // Calculate holdings from transactions
      transactions.forEach(transaction => {
        if (transaction.type === 'BUY') {
          totalSilverHolding += transaction.silverQuantity;
          totalInvested += transaction.amount;
          holdings.push({
            type: 'BUY',
            quantity: transaction.silverQuantity,
            price: transaction.silverPrice,
            amount: transaction.amount,
            date: transaction.createdAt,
            transactionId: transaction.id
          });
        } else if (transaction.type === 'SELL') {
          totalSilverHolding -= transaction.silverQuantity;
          totalInvested -= transaction.amount;
          holdings.push({
            type: 'SELL',
            quantity: transaction.silverQuantity,
            price: transaction.silverPrice,
            amount: transaction.amount,
            date: transaction.createdAt,
            transactionId: transaction.id
          });
        }
      });

      // Calculate current value and profit
      const currentValue = totalSilverHolding * portfolio.currentSilverPrice;
      const totalProfit = currentValue - totalInvested;
      const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
      const averageBuyPrice = totalSilverHolding > 0 ? totalInvested / totalSilverHolding : 0;

      // Update portfolio
      const updatedPortfolio = await prisma.portfolio.update({
        where: { id },
        data: {
          totalSilverHolding,
          totalInvested,
          currentValue,
          totalProfit,
          profitPercentage,
          averageBuyPrice,
          holdings,
          lastUpdated: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      logger.info(`Synced portfolio ID: ${id} with ${transactions.length} transactions`);

      return {
        success: true,
        data: updatedPortfolio,
        message: `Portfolio synced with ${transactions.length} transactions`
      };
    } catch (error) {
      logger.error('Sync portfolio error:', error);
      throw error;
    }
  }
} 