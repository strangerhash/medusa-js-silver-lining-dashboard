import { IsEmail, IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UserResponseDto {
  id!: number;
  name!: string;
  email!: string;
  phone?: string;
  role!: UserRole;
  status!: UserStatus;
  createdAt!: Date;
  updatedAt!: Date;
}

export class UserListResponseDto {
  users!: UserResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

export class UserStatsDto {
  totalUsers!: number;
  activeUsers!: number;
  newUsersThisMonth!: number;
  usersByRole!: Record<UserRole, number>;
} 