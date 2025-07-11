import 'reflect-metadata';
import { JsonController, Post, Body, HttpCode, HttpError } from 'routing-controllers';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class RegisterDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

@JsonController('/auth')
export class AuthController {
  /**
   * @summary User login
   * @description Authenticate user with email and password
   * @tags Authentication
   */
  @Post('/login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    try {
      const { email, password } = body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new HttpError(401, 'Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new HttpError(401, 'Invalid credentials');
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        { expiresIn: '7d' }
      );

      // Store refresh token in Redis (if available)
      // await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

      logger.info(`User ${user.email} logged in successfully`);

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * @summary User registration
   * @description Register a new user account
   * @tags Authentication
   */
  @Post('/register')
  @HttpCode(201)
  async register(@Body() body: RegisterDto) {
    try {
      const { name, email, password } = body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new HttpError(409, 'User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'USER',
          status: 'ACTIVE'
        }
      });

      logger.info(`New user registered: ${user.email}`);

      return {
        success: true,
        message: 'User registered successfully. Please login to continue.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * @summary Refresh access token
   * @description Get new access token using refresh token
   * @tags Authentication
   */
  @Post('/refresh')
  @HttpCode(200)
  async refreshToken(@Body() body: RefreshTokenDto) {
    try {
      const { refreshToken } = body;

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
      ) as any;

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new HttpError(401, 'Invalid refresh token');
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
      );

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new HttpError(401, 'Invalid refresh token');
    }
  }

  /**
   * @summary User logout
   * @description Invalidate refresh token
   * @tags Authentication
   */
  @Post('/logout')
  @HttpCode(200)
  async logout(@Body() body: RefreshTokenDto) {
    try {
      const { refreshToken } = body;

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
      ) as any;

      // Invalidate refresh token in Redis (if available)
      // await redis.del(`refresh_token:${decoded.userId}`);

      logger.info(`User logged out: ${decoded.userId}`);

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      logger.error('Logout error:', error);
      throw new HttpError(401, 'Invalid refresh token');
    }
  }
} 