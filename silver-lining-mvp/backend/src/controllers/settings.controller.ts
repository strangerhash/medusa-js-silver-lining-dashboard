import 'reflect-metadata';
import { JsonController, Get, Post, Put, Body, Param, HttpCode, HttpError } from 'routing-controllers';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class CreateSettingDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

class UpdateSettingDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

@JsonController('/settings')
export class SettingsController {
  /**
   * @summary Get all settings
   * @description Retrieve all system settings
   * @tags Settings
   */
  @Get('/')
  @HttpCode(200)
  async getAllSettings() {
    try {
      const settings = await prisma.setting.findMany({
        orderBy: { category: 'asc' }
      });

      // Group settings by category
      const groupedSettings = settings.reduce((acc: Record<string, any[]>, setting: any) => {
        const category = setting.category || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(setting);
        return acc;
      }, {});

      logger.info(`Retrieved ${settings.length} settings`);

      return {
        success: true,
        data: {
          settings,
          groupedSettings
        }
      };
    } catch (error) {
      logger.error('Get settings error:', error);
      throw error;
    }
  }

  /**
   * @summary Get setting by key
   * @description Retrieve a specific setting by its key
   * @tags Settings
   */
  @Get('/:key')
  @HttpCode(200)
  async getSettingByKey(@Param('key') key: string) {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key }
      });

      if (!setting) {
        throw new HttpError(404, 'Setting not found');
      }

      return {
        success: true,
        data: setting
      };
    } catch (error) {
      logger.error('Get setting by key error:', error);
      throw error;
    }
  }

  /**
   * @summary Get settings by category
   * @description Retrieve all settings for a specific category
   * @tags Settings
   */
  @Get('/category/:category')
  @HttpCode(200)
  async getSettingsByCategory(@Param('category') category: string) {
    try {
      const settings = await prisma.setting.findMany({
        where: { category },
        orderBy: { key: 'asc' }
      });

      logger.info(`Retrieved ${settings.length} settings for category: ${category}`);

      return {
        success: true,
        data: settings
      };
    } catch (error) {
      logger.error('Get settings by category error:', error);
      throw error;
    }
  }

  /**
   * @summary Create new setting
   * @description Create a new system setting
   * @tags Settings
   */
  @Post('/')
  @HttpCode(201)
  async createSetting(@Body() body: CreateSettingDto) {
    try {
      const { key, value, description, category } = body;

      // Check if setting already exists
      const existingSetting = await prisma.setting.findUnique({
        where: { key }
      });

      if (existingSetting) {
        throw new HttpError(409, 'Setting with this key already exists');
      }

      const setting = await prisma.setting.create({
        data: {
          key,
          value,
          description: description || '',
          category: category || 'general'
        }
      });

      logger.info(`Created setting: ${key}`);

      return {
        success: true,
        data: setting
      };
    } catch (error) {
      logger.error('Create setting error:', error);
      throw error;
    }
  }

  /**
   * @summary Update setting
   * @description Update an existing setting
   * @tags Settings
   */
  @Put('/:key')
  @HttpCode(200)
  async updateSetting(@Param('key') key: string, @Body() body: UpdateSettingDto) {
    try {
      const { value, description, category } = body;

      // Check if setting exists
      const existingSetting = await prisma.setting.findUnique({
        where: { key }
      });

      if (!existingSetting) {
        throw new HttpError(404, 'Setting not found');
      }

      const setting = await prisma.setting.update({
        where: { key },
        data: {
          ...(value && { value }),
          ...(description && { description }),
          ...(category && { category })
        }
      });

      logger.info(`Updated setting: ${key}`);

      return {
        success: true,
        data: setting
      };
    } catch (error) {
      logger.error('Update setting error:', error);
      throw error;
    }
  }

  /**
   * @summary Get system configuration
   * @description Get all system configuration settings
   * @tags Settings
   */
  @Get('/system/config')
  @HttpCode(200)
  async getSystemConfig() {
    try {
      const settings = await prisma.setting.findMany({
        where: { category: 'system' },
        orderBy: { key: 'asc' }
      });

      // Convert to key-value object
      const config = settings.reduce((acc: Record<string, string>, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      logger.info('System configuration retrieved');

      return {
        success: true,
        data: config
      };
    } catch (error) {
      logger.error('Get system config error:', error);
      throw error;
    }
  }

  /**
   * @summary Get application settings
   * @description Get all application-specific settings
   * @tags Settings
   */
  @Get('/app/config')
  @HttpCode(200)
  async getAppConfig() {
    try {
      const settings = await prisma.setting.findMany({
        where: { category: 'app' },
        orderBy: { key: 'asc' }
      });

      // Convert to key-value object
      const config = settings.reduce((acc: Record<string, string>, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      logger.info('Application configuration retrieved');

      return {
        success: true,
        data: config
      };
    } catch (error) {
      logger.error('Get app config error:', error);
      throw error;
    }
  }

  /**
   * @summary Initialize default settings
   * @description Initialize system with default settings
   * @tags Settings
   */
  @Post('/init')
  @HttpCode(200)
  async initializeDefaultSettings() {
    try {
      const defaultSettings = [
        // System settings
        { key: 'app_name', value: 'Silver Lining MVP', description: 'Application name', category: 'system' },
        { key: 'app_version', value: '1.0.0', description: 'Application version', category: 'system' },
        { key: 'maintenance_mode', value: 'false', description: 'Maintenance mode flag', category: 'system' },
        { key: 'debug_mode', value: 'false', description: 'Debug mode flag', category: 'system' },
        
        // App settings
        { key: 'default_currency', value: 'INR', description: 'Default currency', category: 'app' },
        { key: 'silver_price', value: '105', description: 'Current silver price per gram', category: 'app' },
        { key: 'min_transaction_amount', value: '1000', description: 'Minimum transaction amount', category: 'app' },
        { key: 'max_transaction_amount', value: '1000000', description: 'Maximum transaction amount', category: 'app' },
        { key: 'kyc_required', value: 'true', description: 'KYC requirement flag', category: 'app' },
        { key: 'auto_approve_kyc', value: 'false', description: 'Auto approve KYC flag', category: 'app' },
        
        // Notification settings
        { key: 'email_notifications', value: 'true', description: 'Enable email notifications', category: 'notifications' },
        { key: 'sms_notifications', value: 'false', description: 'Enable SMS notifications', category: 'notifications' },
        { key: 'push_notifications', value: 'true', description: 'Enable push notifications', category: 'notifications' },
        
        // Security settings
        { key: 'session_timeout', value: '3600', description: 'Session timeout in seconds', category: 'security' },
        { key: 'max_login_attempts', value: '5', description: 'Maximum login attempts', category: 'security' },
        { key: 'password_min_length', value: '8', description: 'Minimum password length', category: 'security' },
        { key: 'require_2fa', value: 'false', description: 'Require two-factor authentication', category: 'security' }
      ];

      const createdSettings = [];

      for (const setting of defaultSettings) {
        const existingSetting = await prisma.setting.findUnique({
          where: { key: setting.key }
        });

        if (!existingSetting) {
          const createdSetting = await prisma.setting.create({
            data: setting
          });
          createdSettings.push(createdSetting);
        }
      }

      logger.info(`Initialized ${createdSettings.length} default settings`);

      return {
        success: true,
        message: `Initialized ${createdSettings.length} default settings`,
        data: {
          created: createdSettings.length,
          total: defaultSettings.length
        }
      };
    } catch (error) {
      logger.error('Initialize default settings error:', error);
      throw error;
    }
  }
} 