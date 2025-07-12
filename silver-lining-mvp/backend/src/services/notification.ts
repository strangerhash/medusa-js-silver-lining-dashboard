import { PrismaClient, $Enums } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: NotificationType;
  variables: string[];
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async createNotification(data: NotificationData): Promise<any> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type as $Enums.NotificationType,
          metadata: data.metadata || {}
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

      logger.info(`Created notification for user: ${data.userId}`);

      // Here you could add real-time notification delivery
      // e.g., WebSocket, push notifications, email, SMS, etc.
      await this.deliverNotification(notification);

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  async createBulkNotifications(notifications: NotificationData[]): Promise<any[]> {
    try {
      const createdNotifications = await Promise.all(
        notifications.map(notification => this.createNotification(notification))
      );

      logger.info(`Created ${createdNotifications.length} bulk notifications`);

      return createdNotifications;
    } catch (error) {
      logger.error('Failed to create bulk notifications:', error);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {}
  ): Promise<{
    notifications: any[];
    total: number;
    page: number;
    totalPages: number;
    unreadCount: number;
  }> {
    try {
      const { page = 1, limit = 20, unreadOnly = false, type } = params;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (unreadOnly) where.isRead = false;
      if (type) where.type = type;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: { userId, isRead: false }
        })
      ]);

      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        unreadCount
      };
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<any> {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      logger.info(`Marked notification as read: ${notificationId}`);

      return notification;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });

      logger.info(`Marked all notifications as read for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await prisma.notification.delete({
        where: { id: notificationId }
      });

      logger.info(`Deleted notification: ${notificationId}`);
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      });

      logger.info(`Deleted ${result.count} old notifications`);

      return result.count;
    } catch (error) {
      logger.error('Failed to delete old notifications:', error);
      throw error;
    }
  }

  // Predefined notification templates
  private notificationTemplates: Record<string, NotificationTemplate> = {
    'user-registered': {
      id: 'user-registered',
      name: 'User Registration',
      title: 'Welcome to Silver Lining!',
      message: 'Welcome {{userName}}! Your account has been successfully created.',
      type: NotificationType.SUCCESS,
      variables: ['userName']
    },
    'transaction-created': {
      id: 'transaction-created',
      name: 'Transaction Created',
      title: 'Transaction Created',
      message: 'Your {{transactionType}} transaction of ₹{{amount}} has been created successfully.',
      type: NotificationType.INFO,
      variables: ['transactionType', 'amount']
    },
    'transaction-completed': {
      id: 'transaction-completed',
      name: 'Transaction Completed',
      title: 'Transaction Completed',
      message: 'Your {{transactionType}} transaction has been completed successfully.',
      type: NotificationType.SUCCESS,
      variables: ['transactionType']
    },
    'transaction-failed': {
      id: 'transaction-failed',
      name: 'Transaction Failed',
      title: 'Transaction Failed',
      message: 'Your {{transactionType}} transaction has failed. Please contact support.',
      type: NotificationType.ERROR,
      variables: ['transactionType']
    },
    'kyc-approved': {
      id: 'kyc-approved',
      name: 'KYC Approved',
      title: 'KYC Application Approved',
      message: 'Congratulations! Your KYC application has been approved.',
      type: NotificationType.SUCCESS,
      variables: []
    },
    'kyc-rejected': {
      id: 'kyc-rejected',
      name: 'KYC Rejected',
      title: 'KYC Application Rejected',
      message: 'Your KYC application has been rejected. Reason: {{reason}}',
      type: NotificationType.ERROR,
      variables: ['reason']
    },
    'portfolio-updated': {
      id: 'portfolio-updated',
      name: 'Portfolio Updated',
      title: 'Portfolio Updated',
      message: 'Your portfolio has been updated. Current value: ₹{{currentValue}}',
      type: NotificationType.INFO,
      variables: ['currentValue']
    },
    'security-alert': {
      id: 'security-alert',
      name: 'Security Alert',
      title: 'Security Alert',
      message: 'Unusual activity detected on your account. Please verify your login.',
      type: NotificationType.WARNING,
      variables: []
    }
  };

  async sendTemplateNotification(
    templateId: string,
    userId: string,
    variables: Record<string, any>
  ): Promise<any> {
    try {
      const template = this.notificationTemplates[templateId];
      if (!template) {
        throw new Error(`Notification template not found: ${templateId}`);
      }

      let title = template.title;
      let message = template.message;

      // Replace variables in template
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        title = title.replace(placeholder, String(value));
        message = message.replace(placeholder, String(value));
      });

      return await this.createNotification({
        userId,
        title,
        message,
        type: template.type
      });
    } catch (error) {
      logger.error('Failed to send template notification:', error);
      throw error;
    }
  }

  async getNotificationStats(userId?: string): Promise<{
    totalNotifications: number;
    unreadCount: number;
    notificationsByType: Record<string, number>;
    recentNotifications: any[];
  }> {
    try {
      const where = userId ? { userId } : {};

      const [
        totalNotifications,
        unreadCount,
        notificationsByType,
        recentNotifications
      ] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { ...where, isRead: false } }),
        prisma.notification.groupBy({
          by: ['type'],
          _count: { type: true },
          where
        }),
        prisma.notification.findMany({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
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

      const typeStats = notificationsByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalNotifications,
        unreadCount,
        notificationsByType: typeStats,
        recentNotifications
      };
    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  private async deliverNotification(notification: any): Promise<void> {
    try {
      // Here you would implement real-time notification delivery
      // Examples:
      // 1. WebSocket notification
      // 2. Push notification
      // 3. Email notification
      // 4. SMS notification
      
      // For now, we'll just log it
      logger.info(`Delivering notification to user ${notification.userId}: ${notification.title}`);
      
      // You could add WebSocket emission here:
      // io.to(notification.userId).emit('notification', notification);
      
    } catch (error) {
      logger.error('Failed to deliver notification:', error);
    }
  }

  // System-wide notifications (for admins)
  async createSystemNotification(
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get all admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      // Create notifications for all admins
      const notifications = adminUsers.map(user => ({
        userId: user.id,
        title,
        message,
        type,
        metadata
      }));

      await this.createBulkNotifications(notifications);

      logger.info(`Created system notification for ${adminUsers.length} admin users`);
    } catch (error) {
      logger.error('Failed to create system notification:', error);
      throw error;
    }
  }

  // Cleanup old notifications
  async cleanupOldNotifications(): Promise<void> {
    try {
      // Delete read notifications older than 90 days
      await this.deleteOldNotifications(90);
      
      logger.info('Notification cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup old notifications:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance(); 