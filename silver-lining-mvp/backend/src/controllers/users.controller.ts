import 'reflect-metadata';
import { JsonController, Get, Post, Put, Delete, Body, Param, QueryParam, UseBefore, HttpCode, HttpError } from 'routing-controllers';
import { IsString, IsOptional, IsEnum, IsIn, IsNumber } from 'class-validator';
import { PrismaClient, $Enums } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class CreateUserDto {
  @IsString()
  name!: string;

  @IsString()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'PENDING'])
  status?: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'PENDING'])
  status?: string;
}

class QueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

@JsonController('/users')
export class UsersController {
  /**
   * @summary Get all users
   * @description Retrieve paginated list of users with optional filtering
   * @tags Users
   */
  @Get('/')
  @HttpCode(200)
  async getUsers(@QueryParam('page') page: string = '1', @QueryParam('limit') limit: string = '10', @QueryParam('search') search?: string, @QueryParam('role') role?: string, @QueryParam('status') status?: string) {
    try {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause - exclude admin users
      const where: any = {
        role: { not: 'ADMIN' } // Exclude admin users from the list
      };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (role && role.toUpperCase() !== 'ADMIN') {
        where.role = role.toUpperCase() as $Enums.UserRole;
      }
      if (status) where.status = status.toUpperCase() as $Enums.UserStatus;

      // Get users
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      logger.info(`Retrieved ${users.length} users`);

      return {
        success: true,
        data: {
          users,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
          }
        }
      };
    } catch (error) {
      logger.error('Get users error:', error);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, 'Failed to fetch users');
    }
  }

  /**
   * @summary Get user by ID
   * @description Retrieve a specific user by their ID
   * @tags Users
   */
  @Get('/:id')
  @HttpCode(200)
  async getUser(@Param('id') id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });
      if (!user) {
        throw new HttpError(404, 'User not found');
      }
      return {
        success: true,
        data: user
      };
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * @summary Create new user
   * @description Create a new user account
   * @tags Users
   */
  @Post('/')
  @HttpCode(201)
  async createUser(@Body() body: CreateUserDto) {
    try {
      const { name, email, password, phone, role, status } = body;
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        throw new HttpError(409, 'User already exists');
      }
      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);
      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role: role ? role.toUpperCase() as $Enums.UserRole : undefined,
          status: status ? status.toUpperCase() as $Enums.UserStatus : undefined
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });
      logger.info(`Created new user: ${user.email}`);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      logger.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * @summary Update user
   * @description Update an existing user's information
   * @tags Users
   */
  @Put('/:id')
  @HttpCode(200)
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    try {
      const { name, email, phone, role, status } = body;
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });
      if (!existingUser) {
        throw new HttpError(404, 'User not found');
      }
      // Check if email is being changed and if it's already taken
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email }
        });
        if (emailExists) {
          throw new HttpError(409, 'Email already taken');
        }
      }
      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(role && { role: role ? role.toUpperCase() as $Enums.UserRole : undefined }),
          ...(status && { status: status ? status.toUpperCase() as $Enums.UserStatus : undefined })
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });
      logger.info(`Updated user: ${user.email}`);
      return {
        success: true,
        data: user
      };
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * @summary Delete user
   * @description Delete a user account and all related data
   * @tags Users
   */
  @Delete('/:id')
  @HttpCode(200)
  async deleteUser(@Param('id') id: string) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });
      if (!existingUser) {
        throw new HttpError(404, 'User not found');
      }

      // Check if user has related data and delete them individually
      const userWithRelations = await prisma.user.findUnique({
        where: { id },
        include: {
          notifications: true,
          kycApplications: true,
          portfolio: true,
          transactions: true
        }
      });

      if (!userWithRelations) {
        throw new HttpError(404, 'User not found');
      }

      // Delete related data first
      if (userWithRelations.notifications.length > 0) {
        await prisma.notification.deleteMany({
          where: { userId: id }
        });
      }

      if (userWithRelations.kycApplications.length > 0) {
        await prisma.kycApplication.deleteMany({
          where: { userId: id }
        });
      }

      if (userWithRelations.portfolio) {
        await prisma.portfolio.delete({
          where: { userId: id }
        });
      }

      if (userWithRelations.transactions.length > 0) {
        await prisma.transaction.deleteMany({
          where: { userId: id }
        });
      }

      // Finally delete the user
      await prisma.user.delete({
        where: { id }
      });

      logger.info(`Deleted user and all related data: ${existingUser.email}`);
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      logger.error('Delete user error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Foreign key constraint')) {
          throw new HttpError(400, 'Cannot delete user: User has related data that cannot be removed');
        }
        if (error.message.includes('User not found')) {
          throw new HttpError(404, 'User not found');
        }
      }
      
      throw new HttpError(500, 'Failed to delete user. Please try again.');
    }
  }

  /**
   * @summary Get user statistics
   * @description Get aggregated user statistics
   * @tags Users
   */
  @Get('/stats/overview')
  @HttpCode(200)
  async getUserStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        usersByRole
      ] = await Promise.all([
        prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
        prisma.user.count({ where: { status: 'ACTIVE', role: { not: 'ADMIN' } } }),
        prisma.user.count({
          where: {
            role: { not: 'ADMIN' },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        prisma.user.groupBy({
          by: ['role'],
          where: { role: { not: 'ADMIN' } },
          _count: { role: true }
        })
      ]);
      return {
        success: true,
        data: {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          usersByRole
        }
      };
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw error;
    }
  }
} 