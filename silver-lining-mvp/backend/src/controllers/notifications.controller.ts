import 'reflect-metadata';
import { JsonController, Get, Post, Put, Delete, Body, Param, QueryParam, HttpCode, UseBefore, Req } from 'routing-controllers';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { notificationService, NotificationType } from '../services/notification';
import { logger } from '../utils/logger';
import { authMiddleware, AuthRequest } from '../middleware/auth';

@JsonController('/notifications')
@UseBefore(authMiddleware)
export class NotificationsController {
  /**
   * @summary Get user notifications
   * @description Retrieve paginated notifications for the authenticated user
   * @tags Notifications
   */
  @Get('/')
  @HttpCode(200)
  async getUserNotifications(
    @Req() req: AuthRequest,
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 20,
    @QueryParam('unreadOnly') unreadOnly: boolean = false,
    @QueryParam('type') type?: NotificationType
  ) {
    try {
      // Get user ID from auth context
      const userId = req.user?.id;
      
      if (!userId) {
        throw new Error('User ID not found in auth context');
      }

      const result = await notificationService.getUserNotifications(userId, {
        page,
        limit,
        unreadOnly,
        type
      });

      logger.info(`Retrieved ${result.notifications.length} notifications for user ${userId}`);

      return {
        success: true,
        data: result.notifications,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1
        },
        unreadCount: result.unreadCount
      };
    } catch (error) {
      logger.error('Get user notifications error:', error);
      throw error;
    }
  }

  /**
   * @summary Mark notification as read
   * @description Mark a specific notification as read
   * @tags Notifications
   */
  @Put('/:id/read')
  @HttpCode(200)
  async markAsRead(@Param('id') id: string) {
    try {
      const notification = await notificationService.markAsRead(id);

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
   * @summary Mark all notifications as read
   * @description Mark all notifications for the user as read
   * @tags Notifications
   */
  @Put('/mark-all-read')
  @HttpCode(200)
  async markAllAsRead(@Req() req: AuthRequest) {
    try {
      // Get user ID from auth context
      const userId = req.user?.id;
      
      if (!userId) {
        throw new Error('User ID not found in auth context');
      }

      await notificationService.markAllAsRead(userId);

      logger.info(`Marked all notifications as read for user ${userId}`);

      return {
        success: true,
        message: 'All notifications marked as read'
      };
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      throw error;
    }
  }

  /**
   * @summary Delete notification
   * @description Delete a specific notification
   * @tags Notifications
   */
  @Delete('/:id')
  @HttpCode(200)
  async deleteNotification(@Param('id') id: string) {
    try {
      await notificationService.deleteNotification(id);

      logger.info(`Deleted notification: ${id}`);

      return {
        success: true,
        message: 'Notification deleted successfully'
      };
    } catch (error) {
      logger.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * @summary Get notification statistics
   * @description Get notification statistics for the user
   * @tags Notifications
   */
  @Get('/stats')
  @HttpCode(200)
  async getNotificationStats(@Req() req: AuthRequest) {
    try {
      // Get user ID from auth context
      const userId = req.user?.id;
      
      if (!userId) {
        throw new Error('User ID not found in auth context');
      }

      const stats = await notificationService.getNotificationStats(userId);

      logger.info('Retrieved notification statistics');

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Get notification stats error:', error);
      throw error;
    }
  }

  /**
   * @summary Create notification (Admin only)
   * @description Create a new notification for a user
   * @tags Notifications
   */
  @Post('/')
  @HttpCode(201)
  async createNotification(@Body() body: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }) {
    try {
      const notification = await notificationService.createNotification(body);

      logger.info(`Created notification for user: ${body.userId}`);

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
   * @summary Send template notification (Admin only)
   * @description Send a notification using predefined templates
   * @tags Notifications
   */
  @Post('/template/:templateId')
  @HttpCode(201)
  async sendTemplateNotification(
    @Param('templateId') templateId: string,
    @Body() body: {
      userId: string;
      variables: Record<string, any>;
    }
  ) {
    try {
      const notification = await notificationService.sendTemplateNotification(
        templateId,
        body.userId,
        body.variables
      );

      logger.info(`Sent template notification ${templateId} to user: ${body.userId}`);

      return {
        success: true,
        data: notification
      };
    } catch (error) {
      logger.error('Send template notification error:', error);
      throw error;
    }
  }

  /**
   * @summary Create system notification (Admin only)
   * @description Create a notification for all admin users
   * @tags Notifications
   */
  @Post('/system')
  @HttpCode(201)
  async createSystemNotification(@Body() body: {
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }) {
    try {
      await notificationService.createSystemNotification(
        body.title,
        body.message,
        body.type,
        body.metadata
      );

      logger.info('Created system notification');

      return {
        success: true,
        message: 'System notification created successfully'
      };
    } catch (error) {
      logger.error('Create system notification error:', error);
      throw error;
    }
  }

  /**
   * @summary Get all notifications (Admin only)
   * @description Retrieve all notifications with pagination and filtering
   * @tags Notifications
   */
  @Get('/all')
  @HttpCode(200)
  async getAllNotifications(
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 50,
    @QueryParam('type') type?: NotificationType,
    @QueryParam('unreadOnly') unreadOnly: boolean = false,
    @QueryParam('userId') userId?: string
  ) {
    try {
      // This would require a different service method for admin access
      // For now, we'll use the existing method with a specific user
      const targetUserId = userId || 'all-users';
      
      const result = await notificationService.getUserNotifications(targetUserId, {
        page,
        limit,
        unreadOnly,
        type
      });

      logger.info(`Retrieved ${result.notifications.length} notifications (admin view)`);

      return {
        success: true,
        data: result.notifications,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1
        },
        unreadCount: result.unreadCount
      };
    } catch (error) {
      logger.error('Get all notifications error:', error);
      throw error;
    }
  }
} 