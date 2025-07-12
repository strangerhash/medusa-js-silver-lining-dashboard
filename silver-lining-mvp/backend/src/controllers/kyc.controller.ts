import 'reflect-metadata';
import { JsonController, Get, Post, Put, Delete, Body, Param, QueryParam, HttpCode, HttpError, UseBefore } from 'routing-controllers';
import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { PrismaClient, $Enums } from '../generated/prisma';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';

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

  @IsOptional()
  documents?: {
    panImage?: string;
    aadhaarImage?: string;
    selfieImage?: string;
  };

  @IsOptional()
  personalInfo?: {
    address?: string;
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
  };
}

class UpdateKYCDto {
  @IsOptional()
  @IsEnum($Enums.KycStatus)
  status?: $Enums.KycStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  verificationDetails?: {
    panVerified?: boolean;
    aadhaarVerified?: boolean;
    faceMatch?: number;
    addressMatch?: number;
  };
}

class BulkKYCUpdateDto {
  @IsArray()
  @IsString({ each: true })
  kycIds!: string[];

  @IsEnum($Enums.KycStatus)
  status!: $Enums.KycStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

class KYCQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

@JsonController('/kyc')
@UseBefore(authMiddleware)
export class KYCController {
  /**
   * @summary Test KYC endpoint
   * @description Simple test endpoint to check if KYC controller is working
   * @tags KYC
   */
  @Get('/health/test')
  @HttpCode(200)
  async testKYC() {
    try {
      // Test database connection
      await prisma.$connect();
      
      // Count total KYC applications
      const total = await prisma.kycApplication.count();
      
      return {
        success: true,
        message: 'KYC controller is working',
        data: {
          totalApplications: total,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('KYC test error:', error);
      throw error;
    }
  }
  /**
   * @summary Get all KYC applications with pagination and filtering
   * @description Retrieve KYC applications with advanced filtering, search, and pagination
   * @tags KYC
   */
  @Get('/')
  @HttpCode(200)
  async getAllKYC(
    @QueryParam('status') status?: string,
    @QueryParam('search') search?: string,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10,
    @QueryParam('sortBy') sortBy: string = 'createdAt',
    @QueryParam('sortOrder') sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: any = {};
      
      if (status && status !== 'all') {
        where.status = status.toUpperCase();
      }
      
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
          },
          {
            user: {
              phone: { contains: search, mode: 'insensitive' }
            }
          },
          {
            documents: {
              path: ['panNumber'],
              string_contains: search
            }
          },
          {
            documents: {
              path: ['aadhaarNumber'],
              string_contains: search
            }
          }
        ];
      }

      // Build order by clause
      const orderBy: any = {};
      if (sortBy === 'user') {
        orderBy.user = { name: sortOrder };
      } else if (sortBy === 'status') {
        orderBy.status = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      // First, check if database is connected
      await prisma.$connect();

      const [kycApplications, total] = await Promise.all([
        prisma.kycApplication.findMany({
          where,
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
          orderBy,
          skip,
          take: limit
        }),
        prisma.kycApplication.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${kycApplications.length} KYC applications (page ${page}/${totalPages})`);

      return {
        success: true,
        data: kycApplications,
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
      logger.error('Get all KYC error:', error);
      throw error;
    }
  }

  /**
   * @summary Get KYC by ID with detailed information
   * @description Retrieve a specific KYC application by ID with full details
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
              phone: true,
              status: true,
              createdAt: true
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
   * @description Submit a new KYC application with documents and personal info
   * @tags KYC
   */
  @Post('/')
  @HttpCode(201)
  async createKYC(@Body() body: CreateKYCDto) {
    try {
      const { userId, panNumber, aadhaarNumber, notes, documents, personalInfo } = body;

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
            aadhaarNumber,
            ...documents
          },
          personalInfo: {
            notes: notes || '',
            ...personalInfo
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
   * @summary Update KYC status (Approve/Reject)
   * @description Approve or reject a KYC application with notes
   * @tags KYC
   */
  @Put('/:id/status')
  @HttpCode(200)
  async updateKYCStatus(@Param('id') id: string, @Body() body: UpdateKYCDto) {
    try {
      const { status, notes, rejectionReason, verificationDetails } = body;

      // Check if KYC exists
      const existingKYC = await prisma.kycApplication.findUnique({
        where: { id }
      });

      if (!existingKYC) {
        throw new HttpError(404, 'KYC application not found');
      }

      if (existingKYC.status !== 'PENDING') {
        throw new HttpError(400, 'KYC application is not in pending status');
      }

      // Prepare update data
      const updateData: any = {
        status: status!,
        reviewedAt: new Date(),
        reviewedBy: 'admin', // TODO: Get from auth context
      };

      if (notes) {
        updateData.remarks = notes;
      }

      if (rejectionReason && status === 'REJECTED') {
        updateData.remarks = `Rejected: ${rejectionReason}`;
      }

      if (verificationDetails) {
        updateData.documents = {
          ...(existingKYC.documents as Record<string, any>),
          verificationDetails
        };
      }

      // Update KYC status
      const kyc = await prisma.kycApplication.update({
        where: { id },
        data: updateData,
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

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: kyc.userId,
          title: `KYC ${status!.toLowerCase()}`,
          message: status === 'APPROVED' 
            ? 'Your KYC application has been approved successfully.'
            : `Your KYC application has been rejected. Reason: ${rejectionReason || 'Please contact support for details.'}`,
          type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING'
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
   * @summary Bulk update KYC status
   * @description Approve or reject multiple KYC applications at once
   * @tags KYC
   */
  @Put('/bulk/status')
  @HttpCode(200)
  async bulkUpdateKYCStatus(@Body() body: BulkKYCUpdateDto) {
    try {
      const { kycIds, status, notes } = body;

      // Check if all KYC applications exist and are pending
      const existingKYCs = await prisma.kycApplication.findMany({
        where: {
          id: { in: kycIds },
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      if (existingKYCs.length !== kycIds.length) {
        throw new HttpError(400, 'Some KYC applications not found or not in pending status');
      }

      // Update all KYC applications
      const updatePromises = kycIds.map(kycId => 
        prisma.kycApplication.update({
          where: { id: kycId },
          data: {
            status,
            reviewedAt: new Date(),
            reviewedBy: 'admin', // TODO: Get from auth context
            remarks: notes || `Bulk ${status.toLowerCase()}`
          }
        })
      );

      const updatedKYCs = await Promise.all(updatePromises);

      // Create notifications for all users
      const notificationPromises = existingKYCs.map(kyc =>
        prisma.notification.create({
          data: {
            userId: kyc.userId,
            title: `KYC ${status!.toLowerCase()}`,
            message: status === 'APPROVED' 
              ? 'Your KYC application has been approved successfully.'
              : `Your KYC application has been rejected. ${notes ? `Reason: ${notes}` : ''}`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING'
          }
        })
      );

      await Promise.all(notificationPromises);

      logger.info(`Bulk updated ${kycIds.length} KYC applications to ${status}`);

      return {
        success: true,
        data: updatedKYCs,
        message: `Successfully ${status.toLowerCase()} ${kycIds.length} KYC applications`
      };
    } catch (error) {
      logger.error('Bulk update KYC status error:', error);
      throw error;
    }
  }

  /**
   * @summary Delete KYC application
   * @description Delete a KYC application (admin only)
   * @tags KYC
   */
  @Delete('/:id')
  @HttpCode(200)
  async deleteKYC(@Param('id') id: string) {
    try {
      const kyc = await prisma.kycApplication.findUnique({
        where: { id }
      });

      if (!kyc) {
        throw new HttpError(404, 'KYC application not found');
      }

      await prisma.kycApplication.delete({
        where: { id }
      });

      logger.info(`Deleted KYC application ID: ${id}`);

      return {
        success: true,
        message: 'KYC application deleted successfully'
      };
    } catch (error) {
      logger.error('Delete KYC error:', error);
      throw error;
    }
  }

  /**
   * @summary Get KYC statistics
   * @description Get aggregated KYC statistics and analytics
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
        applicationsByStatus,
        recentApplications,
        applicationsByMonth
      ] = await Promise.all([
        prisma.kycApplication.count(),
        prisma.kycApplication.count({ where: { status: 'PENDING' } }),
        prisma.kycApplication.count({ where: { status: 'APPROVED' } }),
        prisma.kycApplication.count({ where: { status: 'REJECTED' } }),
        prisma.kycApplication.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.kycApplication.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.kycApplication.groupBy({
          by: ['status'],
          _count: { status: true },
          where: {
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
          }
        })
      ]);

      const statusStats = applicationsByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      const monthlyStats = applicationsByMonth.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      const approvalRate = totalApplications > 0 ? (approvedApplications / totalApplications) * 100 : 0;
      const rejectionRate = totalApplications > 0 ? (rejectedApplications / totalApplications) * 100 : 0;

      logger.info('Retrieved KYC statistics');

      return {
        success: true,
        data: {
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications,
          applicationsByStatus: statusStats,
          monthlyStats,
          approvalRate: Math.round(approvalRate * 100) / 100,
          rejectionRate: Math.round(rejectionRate * 100) / 100,
          recentApplications
        }
      };
    } catch (error) {
      logger.error('Get KYC stats error:', error);
      throw error;
    }
  }

  /**
   * @summary Get KYC applications by user
   * @description Get all KYC applications for a specific user
   * @tags KYC
   */
  @Get('/user/:userId')
  @HttpCode(200)
  async getKYCByUser(@Param('userId') userId: string) {
    try {
      const kycApplications = await prisma.kycApplication.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: kycApplications
      };
    } catch (error) {
      logger.error('Get KYC by user error:', error);
      throw error;
    }
  }

  /**
   * @summary Update KYC verification details
   * @description Update verification details for a KYC application
   * @tags KYC
   */
  @Put('/:id/verification')
  @HttpCode(200)
  async updateKYCVerification(@Param('id') id: string, @Body() body: { verificationDetails: any }) {
    try {
      const { verificationDetails } = body;

      const existingKYC = await prisma.kycApplication.findUnique({
        where: { id }
      });

      if (!existingKYC) {
        throw new HttpError(404, 'KYC application not found');
      }

      const updatedKYC = await prisma.kycApplication.update({
        where: { id },
        data: {
          documents: {
            ...(existingKYC.documents as Record<string, any>),
            verificationDetails
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

      logger.info(`Updated verification details for KYC application ID: ${id}`);

      return {
        success: true,
        data: updatedKYC
      };
    } catch (error) {
      logger.error('Update KYC verification error:', error);
      throw error;
    }
  }
} 