import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterRequestDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class RefreshTokenRequestDto {
  @IsString()
  refreshToken!: string;
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export class LogoutRequestDto {
  @IsString()
  refreshToken!: string;
} 