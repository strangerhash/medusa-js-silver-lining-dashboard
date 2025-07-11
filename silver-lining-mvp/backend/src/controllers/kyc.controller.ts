import 'reflect-metadata';
import { JsonController, Get, Post, Put, Body, Param, HttpCode, HttpError } from 'routing-controllers';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { PrismaClient, $Enums } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class CreateKYCDto {
  @IsString()
  userId!: string;

  @IsString()
  panNumber!: string;

  @IsString()
  aadhaarNumber!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateKYCDto {
  @IsOptional()
  @IsEnum($Enums.KycStatus)
  status?: $Enums.KycStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

@JsonController('/kyc')
export class KYCController {
  /**
   * @summary Get all KYC applications
   * @description Retrieve all KYC applications with user details
   * @tags KYC
   */
  @Get('/')
  @HttpCode(200)
  async getAllKYC() {
    try {
      const kycApplications = await prisma.kycApplication.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info(`Retrieved ${kycApplications.length} KYC applications`);

      return {
        success: true,
        data: kycApplications
      };
    } catch (error) {
      logger.error('Get all KYC error:', error);
      throw error;
    }
  }

  /**
   * @summary Get KYC by ID
   * @description Retrieve a specific KYC application by ID
   * @tags KYC
   */
  @Get('/:id')
  @HttpCode(200)
  async getKYCById(@Param('id') id: string) {
    try {
      const kyc = await prisma.kycApplication.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!kyc) {
        throw new HttpError(404, 'KYC application not found');
      }

      return {
        success: true,
        data: kyc
      };
    } catch (error) {
      logger.error('Get KYC by ID error:', error);
      throw error;
    }
  }

  /**
   * @summary Create new KYC application
   * @description Submit a new KYC application
   * @tags KYC
   */
  @Post('/')
  @HttpCode(201)
  async createKYC(@Body() body: CreateKYCDto) {
    try {
      const { userId, panNumber, aadhaarNumber, notes } = body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      // Check if KYC already exists for this user
      const existingKYC = await prisma.kycApplication.findFirst({
        where: { userId }
      });

      if (existingKYC) {
        throw new HttpError(409, 'KYC application already exists for this user');
      }

      // Create KYC application
      const kyc = await prisma.kycApplication.create({
        data: {
          userId,
          documents: {
            panNumber,
            aadhaarNumber
          },
          personalInfo: {
            notes: notes || ''
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      logger.info(`Created KYC application for user: ${user.email}`);

      return {
        success: true,
        data: kyc
      };
    } catch (error) {
      logger.error('Create KYC error:', error);
      throw error;
    }
  }

  /**
   * @summary Update KYC status
   * @description Approve or reject a KYC application
   * @tags KYC
   */
  @Put('/:id/status')
  @HttpCode(200)
  async updateKYCStatus(@Param('id') id: string, @Body() body: UpdateKYCDto) {
    try {
      const { status, notes } = body;

      // Check if KYC exists
      const existingKYC = await prisma.kycApplication.findUnique({
        where: { id }
      });

      if (!existingKYC) {
        throw new HttpError(404, 'KYC application not found');
      }

      // Update KYC status
      const kyc = await prisma.kycApplication.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(notes && { remarks: notes })
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      logger.info(`Updated KYC status to ${status} for application ID: ${id}`);

      return {
        success: true,
        data: kyc
      };
    } catch (error) {
      logger.error('Update KYC status error:', error);
      throw error;
    }
  }

  /**
   * @summary Get KYC statistics
   * @description Get aggregated KYC statistics
   * @tags KYC
   */
  @Get('/stats/overview')
  @HttpCode(200)
  async getKYCStats() {
    try {
      const [
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        applicationsByStatus
      ] = await Promise.all([
        prisma.kycApplication.count(),
        prisma.kycApplication.count({ where: { status: 'PENDING' } }),
        prisma.kycApplication.count({ where: { status: 'APPROVED' } }),
        prisma.kycApplication.count({ where: { status: 'REJECTED' } }),
        prisma.kycApplication.groupBy({
          by: ['status'],
          _count: { status: true }
        })
      ]);

      const statusStats = applicationsByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      logger.info('Retrieved KYC statistics');

      return {
        success: true,
        data: {
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications,
          applicationsByStatus: statusStats
        }
      };
    } catch (error) {
      logger.error('Get KYC stats error:', error);
      throw error;
    }
  }
} 