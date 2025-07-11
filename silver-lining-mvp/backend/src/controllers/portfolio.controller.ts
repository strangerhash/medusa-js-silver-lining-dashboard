import 'reflect-metadata';
import { JsonController, Get, Post, Put, Body, Param, HttpCode, HttpError } from 'routing-controllers';
import { IsString, IsOptional, IsNumber, IsNumberString } from 'class-validator';
import { PrismaClient, $Enums } from '../generated/prisma';
import { logger } from '../utils/logger';

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
}

@JsonController('/portfolio')
export class PortfolioController {
  /**
   * @summary Get all portfolios
   * @description Retrieve all user portfolios
   * @tags Portfolio
   */
  @Get('/')
  @HttpCode(200)
  async getAllPortfolios() {
    try {
      const portfolios = await prisma.portfolio.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { currentValue: 'desc' }
      });

      logger.info(`Retrieved ${portfolios.length} portfolios`);

      return {
        success: true,
        data: portfolios
      };
    } catch (error) {
      logger.error('Get all portfolios error:', error);
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
              email: true
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
      const { userId, totalSilverHolding, totalInvested, currentValue, currentSilverPrice } = body;

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
          holdings: [],
          performance: {
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
  @Put('/user/:userId')
  @HttpCode(200)
  async updatePortfolio(@Param('userId') userId: string, @Body() body: UpdatePortfolioDto) {
    try {
      const { totalSilverHolding, totalInvested, currentValue, currentSilverPrice } = body;

      // Check if portfolio exists
      const existingPortfolio = await prisma.portfolio.findUnique({
        where: { userId }
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

      const portfolio = await prisma.portfolio.update({
        where: { userId },
        data: {
          totalSilverHolding: newTotalSilverHolding,
          totalInvested: newTotalInvested,
          currentValue: newCurrentValue,
          totalProfit,
          profitPercentage,
          averageBuyPrice,
          currentSilverPrice: newCurrentSilverPrice,
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

      logger.info(`Updated portfolio for user: ${portfolio.user.email}`);

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
   * @summary Get portfolio statistics
   * @description Get aggregated portfolio statistics
   * @tags Portfolio
   */
  @Get('/stats/overview')
  @HttpCode(200)
  async getPortfolioStats() {
    try {
      const [
        totalPortfolios,
        totalSilverHolding,
        totalPortfolioValue,
        averageSilverPrice,
        totalPortfolioValueByMonth
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
        prisma.portfolio.groupBy({
          by: ['lastUpdated'],
          _sum: { currentValue: true }
        })
      ]);

      logger.info('Retrieved portfolio statistics');

      return {
        success: true,
        data: {
          totalPortfolios,
          totalSilverHolding: totalSilverHolding._sum.totalSilverHolding || 0,
          totalPortfolioValue: totalPortfolioValue._sum.currentValue || 0,
          averageSilverPrice: averageSilverPrice._avg.currentSilverPrice || 0,
          averagePortfolioValue: totalPortfolios > 0 ? (totalPortfolioValue._sum.currentValue || 0) / totalPortfolios : 0,
          portfolioValueByMonth: totalPortfolioValueByMonth
        }
      };
    } catch (error) {
      logger.error('Get portfolio stats error:', error);
      throw error;
    }
  }
} 