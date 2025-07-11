import 'reflect-metadata';
import { JsonController, Get, Post, Put, Body, Param, HttpCode, HttpError } from 'routing-controllers';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PrismaClient, $Enums } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsEnum($Enums.NotificationType)
  type!: $Enums.NotificationType;
}

class UpdateNotificationDto {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

@JsonController('/notifications')
export class NotificationsController {
  /**
   * @summary Get all notifications
   * @description Retrieve all notifications with optional filtering
   * @tags Notifications
   */
  @Get('/')
  @HttpCode(200)
  async getAllNotifications(@Body() query: any) {
    try {
      const { page = 1, limit = 10, type, isRead, userId } = query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};
      if (type) where.type = type;
      if (isRead !== undefined) where.isRead = isRead === 'true';
      if (userId) where.userId = userId;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({ where })
      ]);

      logger.info(`Retrieved ${notifications.length} notifications`);

      return {
        success: true,
        data: {
          notifications,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      };
    } catch (error) {
      logger.error('Get all notifications error:', error);
      throw error;
    }
  }

  /**
   * @summary Get notification by ID
   * @description Retrieve a specific notification by ID
   * @tags Notifications
   */
  @Get('/:id')
  @HttpCode(200)
  async getNotificationById(@Param('id') id: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id },
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

      if (!notification) {
        throw new HttpError(404, 'Notification not found');
      }

      return {
        success: true,
        data: notification
      };
    } catch (error) {
      logger.error('Get notification by ID error:', error);
      throw error;
    }
  }

  /**
   * @summary Create notification
   * @description Create a new notification
   * @tags Notifications
   */
  @Post('/')
  @HttpCode(201)
  async createNotification(@Body() body: CreateNotificationDto) {
    try {
      const { userId, title, message, type } = body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          isRead: false
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

      logger.info(`Created notification for user: ${user.email}`);

      return {
        success: true,
        data: notification
      };
    } catch (error) {
      logger.error('Create notification error:', error);
      throw error;
    }
  }

  /**
   * @summary Mark notification as read
   * @description Mark a notification as read
   * @tags Notifications
   */
  @Put('/:id/read')
  @HttpCode(200)
  async markNotificationAsRead(@Param('id') id: string) {
    try {
      // Check if notification exists
      const existingNotification = await prisma.notification.findUnique({
        where: { id }
      });

      if (!existingNotification) {
        throw new HttpError(404, 'Notification not found');
      }

      const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
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

      logger.info(`Marked notification as read: ${id}`);

      return {
        success: true,
        data: notification
      };
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      throw error;
    }
  }

  /**
   * @summary Get user notifications
   * @description Retrieve all notifications for a specific user
   * @tags Notifications
   */
  @Get('/user/:userId')
  @HttpCode(200)
  async getUserNotifications(@Param('userId') userId: string, @Body() query: any) {
    try {
      const { page = 1, limit = 10, isRead } = query;
      const skip = (Number(page) - 1) * Number(limit);

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      // Build where clause
      const where: any = { userId };
      if (isRead !== undefined) where.isRead = isRead === 'true';

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({ where })
      ]);

      logger.info(`Retrieved ${notifications.length} notifications for user: ${user.email}`);

      return {
        success: true,
        data: {
          notifications,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      };
    } catch (error) {
      logger.error('Get user notifications error:', error);
      throw error;
    }
  }

  /**
   * @summary Mark all user notifications as read
   * @description Mark all notifications for a user as read
   * @tags Notifications
   */
  @Put('/user/:userId/read-all')
  @HttpCode(200)
  async markAllUserNotificationsAsRead(@Param('userId') userId: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new HttpError(404, 'User not found');
      }

      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });

      logger.info(`Marked ${result.count} notifications as read for user: ${user.email}`);

      return {
        success: true,
        data: {
          updatedCount: result.count
        }
      };
    } catch (error) {
      logger.error('Mark all user notifications as read error:', error);
      throw error;
    }
  }

  /**
   * @summary Get notification statistics
   * @description Get aggregated notification statistics
   * @tags Notifications
   */
  @Get('/stats/overview')
  @HttpCode(200)
  async getNotificationStats() {
    try {
      const [
        totalNotifications,
        unreadNotifications,
        readNotifications,
        notificationsByType
      ] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { isRead: false } }),
        prisma.notification.count({ where: { isRead: true } }),
        prisma.notification.groupBy({
          by: ['type'],
          _count: { type: true }
        })
      ]);

      const typeStats = notificationsByType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>);

      logger.info('Retrieved notification statistics');

      return {
        success: true,
        data: {
          totalNotifications,
          unreadNotifications,
          readNotifications,
          notificationsByType: typeStats
        }
      };
    } catch (error) {
      logger.error('Get notification stats error:', error);
      throw error;
    }
  }
} 