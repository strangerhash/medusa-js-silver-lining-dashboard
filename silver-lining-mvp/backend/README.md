# Silver Lining MVP - Backend API

A robust Express.js API built with TypeScript, Prisma ORM, and routing-controllers for the Silver Lining MVP - Silver Investment Platform.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Database**: PostgreSQL with Prisma ORM
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Validation**: Class-validator for request validation
- **Logging**: Winston logger with structured logging
- **Redis**: Caching and session management
- **TypeScript**: Full type safety
- **Docker**: Containerized deployment

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### 1. Clone and Setup

```bash
cd silver-lining-mvp/backend
npm install
```

### 2. Environment Configuration

Copy the environment file and configure your settings:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/silver_lining_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Server
PORT=9000
NODE_ENV=development
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

#### Option B: Local PostgreSQL

```bash
# Create database
createdb silver_lining_db

# Run migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

## 🚀 Running the Application

### Development

```bash
# Start the server
npm run dev

# Or using ts-node directly
npx ts-node src/server.ts
```

### Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📚 API Documentation

Once the server is running, access the API documentation:

- **Swagger UI**: http://localhost:9000/api-docs
- **OpenAPI Spec**: http://localhost:9000/api-spec
- **Health Check**: http://localhost:9000/health

## 🔐 Authentication

### Registration
```bash
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Using Protected Endpoints
```bash
curl -X GET http://localhost:9000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🗄️ Database Management

### Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: This deletes all data)
npx prisma migrate reset

# Create a new migration
npx prisma migrate dev --name add_new_field

# Deploy migrations to production
npx prisma migrate deploy
```

### 🔄 Database Migrations

When you need to add new fields or modify the database schema:

#### 1. Update the Prisma Schema

Edit `prisma/schema.prisma` to add your new fields:

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  phone     String?  // New optional field
  role      UserRole @default(USER)
  status    UserStatus @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // New fields
  profilePicture String?  // Add new field
  dateOfBirth    DateTime? // Add new field
}
```

#### 2. Create and Apply Migration

```bash
# Create migration
npx prisma migrate dev --name add_user_profile_fields

# This will:
# 1. Create a new migration file
# 2. Apply the migration to your database
# 3. Regenerate the Prisma client
```

#### 3. Update Your Code

Update your DTOs and controllers to handle the new fields:

```typescript
// Update DTO
class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  // New fields
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;
}
```

#### 4. Production Deployment

For production deployments:

```bash
# Deploy migrations safely
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### 🔧 Migration Best Practices

1. **Always backup before migrations**:
   ```bash
   pg_dump silver_lining_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test migrations in development first**:
   ```bash
   npx prisma migrate reset  # Reset to clean state
   npx prisma migrate dev    # Apply all migrations
   ```

3. **Use descriptive migration names**:
   ```bash
   npx prisma migrate dev --name add_user_profile_fields
   npx prisma migrate dev --name update_transaction_status_enum
   ```

4. **Handle data migrations**:
   ```sql
   -- In your migration file
   -- Add new column with default value
   ALTER TABLE "User" ADD COLUMN "profilePicture" TEXT;
   
   -- Update existing records if needed
   UPDATE "User" SET "profilePicture" = 'default.jpg' WHERE "profilePicture" IS NULL;
   ```

## 🐳 Docker Deployment

### Development with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker

```bash
# Build production image
docker build -t silver-lining-api .

# Run with environment variables
docker run -p 9000:9000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  silver-lining-api
```

## ☁️ AWS Migration Guide

### 1. Database Setup (RDS)

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier silver-lining-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20
```

### 2. Redis Setup (ElastiCache)

```bash
# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id silver-lining-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

### 3. Application Deployment (ECS)

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "9000:9000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=silver_lining_db
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=your-password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 4. Environment Variables for AWS

```env
# Production environment
DATABASE_URL="postgresql://admin:password@your-rds-endpoint:5432/silver_lining_db"
REDIS_URL="redis://your-elasticache-endpoint:6379"
JWT_SECRET="your-production-jwt-secret"
JWT_REFRESH_SECRET="your-production-refresh-secret"
NODE_ENV=production
PORT=9000
```

### 5. Run Migrations on AWS

```bash
# Connect to your AWS instance and run migrations
npx prisma migrate deploy

# Verify database connection
npx prisma db pull
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "auth"
```

## 📊 Monitoring & Logging

### Log Levels

- `error`: Application errors
- `warn`: Warning messages
- `info`: General information
- `debug`: Debug information

### Health Checks

```bash
# Check API health
curl http://localhost:9000/health

# Check database connection
npx prisma db pull

# Check Redis connection
redis-cli ping
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Find process using port 9000
   lsof -i :9000
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Database connection issues**:
   ```bash
   # Test database connection
   npx prisma db pull
   
   # Reset database
   npx prisma migrate reset
   ```

3. **Prisma client not generated**:
   ```bash
   npx prisma generate
   ```

4. **Migration conflicts**:
   ```bash
   # Reset migrations
   npx prisma migrate reset
   
   # Create fresh migration
   npx prisma migrate dev --name init
   ```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### KYC
- `GET /api/kyc` - Get all KYC applications
- `POST /api/kyc` - Create KYC application
- `GET /api/kyc/:id` - Get KYC by ID
- `PUT /api/kyc/:id/status` - Update KYC status

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PATCH /api/transactions/:id/status` - Update transaction status

### Portfolio
- `GET /api/portfolio` - Get all portfolios
- `POST /api/portfolio` - Create portfolio
- `GET /api/portfolio/user/:userId` - Get user portfolio
- `PUT /api/portfolio/user/:userId` - Update portfolio

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/users` - User analytics
- `GET /api/analytics/transactions` - Transaction analytics
- `GET /api/analytics/financial` - Financial analytics

### Notifications
- `GET /api/notifications` - Get all notifications
- `POST /api/notifications` - Create notification
- `GET /api/notifications/:id` - Get notification by ID
- `PUT /api/notifications/:id/read` - Mark as read

### Reports
- `GET /api/reports/types` - Get report types
- `GET /api/reports/user-activity` - User activity report
- `GET /api/reports/transaction-summary` - Transaction summary
- `POST /api/reports/generate` - Generate custom report

### Settings
- `GET /api/settings` - Get all settings
- `POST /api/settings` - Create setting
- `GET /api/settings/:key` - Get setting by key
- `PUT /api/settings/:key` - Update setting

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/health` - System health
- `POST /api/admin/init` - Initialize system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 