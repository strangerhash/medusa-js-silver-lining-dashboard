import 'reflect-metadata';
import { JsonController, Get, Post, Patch, Body, Param, QueryParam, HttpCode, HttpError } from 'routing-controllers';
import { IsString, IsOptional, IsEnum, IsNumber, IsNumberString } from 'class-validator';
import { PrismaClient, $Enums } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class CreateTransactionDto {
  @IsNumberString()
  userId!: string;

  @IsEnum($Enums.TransactionType)
  type!: $Enums.TransactionType;

  @IsNumber()
  amount!: number;

  @IsNumber()
  silverQuantity!: number;

  @IsNumber()
  silverPrice!: number;

  @IsString()
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsNumber()
  fees?: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

class UpdateTransactionStatusDto {
  @IsEnum($Enums.TransactionStatus)
  status!: $Enums.TransactionStatus;
}

@JsonController('/transactions')
export class TransactionsController {
  /**
   * @summary Get all transactions
   * @description Retrieve paginated list of transactions with optional filtering
   * @tags Transactions
   */
  @Get('/')
  @HttpCode(200)
  async getAllTransactions(@QueryParam('page') page: string = '1', @QueryParam('limit') limit: string = '10', @QueryParam('type') type?: string, @QueryParam('status') status?: string, @QueryParam('userId') userId?: string) {
    try {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};
      if (type) where.type = type;
      if (status) where.status = status;
      if (userId) where.userId = userId;

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.transaction.count({ where })
      ]);

      logger.info(`Retrieved ${transactions.length} transactions`);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
          }
        }
      };
    } catch (error) {
      logger.error('Get all transactions error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to fetch transactions');
    }
  }

  /**
   * @summary Get transaction by ID
   * @description Retrieve a specific transaction by ID
   * @tags Transactions
   */
  @Get('/:id')
  @HttpCode(200)
  async getTransactionById(@Param('id') id: string) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      if (!transaction) {
        throw new HttpError(404, 'Transaction not found');
      }

      return {
        success: true,
        data: transaction
      };
    } catch (error) {
      logger.error('Get transaction by ID error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to fetch transaction');
    }
  }

  /**
   * @summary Create new transaction
   * @description Create a new transaction record
   * @tags Transactions
   */
  @Post('/')
  @HttpCode(201)
  async createTransaction(@Body() body: CreateTransactionDto) {
    try {
      const { userId, type, amount, silverQuantity, silverPrice, paymentMethod, referenceId, fees, totalAmount, details, remarks } = body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      // Generate reference ID if not provided
      const finalReferenceId = referenceId || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const finalFees = fees || 0;
      const finalTotalAmount = totalAmount || (amount + finalFees);

      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type,
          amount,
          silverQuantity,
          silverPrice,
          paymentMethod,
          referenceId: finalReferenceId,
          fees: finalFees,
          totalAmount: finalTotalAmount,
          details: details ? JSON.parse(details) : null,
          remarks,
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      logger.info(`Created transaction for user: ${user.email}`);

      return {
        success: true,
        data: transaction
      };
    } catch (error) {
      logger.error('Create transaction error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to create transaction');
    }
  }

  /**
   * @summary Update transaction status
   * @description Update the status of a transaction
   * @tags Transactions
   */
  @Patch('/:id/status')
  @HttpCode(200)
  async updateTransactionStatus(@Param('id') id: string, @Body() body: UpdateTransactionStatusDto) {
    try {
      const { status } = body;

      // Check if transaction exists
      const existingTransaction = await prisma.transaction.findUnique({
        where: { id }
      });

      if (!existingTransaction) {
        throw new HttpError(404, 'Transaction not found');
      }

      const transaction = await prisma.transaction.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      logger.info(`Updated transaction status to ${status} for ID: ${id}`);

      return {
        success: true,
        data: transaction
      };
    } catch (error) {
      logger.error('Update transaction status error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to update transaction status');
    }
  }

  /**
   * @summary Get user transactions
   * @description Retrieve all transactions for a specific user
   * @tags Transactions
   */
  @Get('/user/:userId')
  @HttpCode(200)
  async getUserTransactions(@Param('userId') userId: string, @QueryParam('page') page: string = '1', @QueryParam('limit') limit: string = '10') {
    try {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: { userId },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.transaction.count({ where: { userId } })
      ]);

      logger.info(`Retrieved ${transactions.length} transactions for user: ${user.email}`);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        }
      };
    } catch (error) {
      logger.error('Get user transactions error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to fetch user transactions');
    }
  }

  /**
   * @summary Get transaction statistics
   * @description Get aggregated transaction statistics
   * @tags Transactions
   */
  @Get('/stats/overview')
  @HttpCode(200)
  async getTransactionStats() {
    try {
      const [
        totalTransactions,
        totalAmount,
        totalSilverQuantity,
        transactionsByType,
        transactionsByStatus
      ] = await Promise.all([
        prisma.transaction.count(),
        prisma.transaction.aggregate({
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          _sum: { silverQuantity: true }
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          _count: { type: true },
          _sum: { amount: true }
        }),
        prisma.transaction.groupBy({
          by: ['status'],
          _count: { status: true }
        })
      ]);

      const typeStats = transactionsByType.reduce((acc: Record<string, any>, item: any) => {
        acc[item.type] = {
          count: item._count.type,
          totalAmount: item._sum.amount
        };
        return acc;
      }, {} as Record<string, any>);

      const statusStats = transactionsByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      logger.info('Retrieved transaction statistics');

      return {
        success: true,
        data: {
          totalTransactions,
          totalAmount: totalAmount._sum.amount || 0,
          totalSilverQuantity: totalSilverQuantity._sum.silverQuantity || 0,
          transactionsByType: typeStats,
          transactionsByStatus: statusStats
        }
      };
    } catch (error) {
      logger.error('Get transaction stats error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to fetch transaction statistics');
    }
  }
} 