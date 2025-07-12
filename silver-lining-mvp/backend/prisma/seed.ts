import { PrismaClient, $Enums } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.log.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.kycApplication.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log('🗑️ Cleared existing data');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@silverlining.com',
      name: 'Admin User',
      phone: '+919876543210',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  // Create regular users with distributed creation dates over the last 6 months
  const users: any[] = [];
  const userNames = [
    'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Neha Singh', 'Rajesh Verma',
    'Sneha Gupta', 'Vikram Malhotra', 'Anjali Kapoor', 'Sanjay Mehta', 'Pooja Reddy'
  ];

  for (let i = 0; i < 10; i++) {
    const password = await bcrypt.hash('password123', 12);
    
    // Distribute user creation dates over the last 6 months
    const monthsAgo = Math.floor(Math.random() * 6); // 0-5 months ago
    const daysAgo = Math.floor(Math.random() * 30); // 0-29 days ago
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - monthsAgo);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    const user = await prisma.user.create({
      data: {
        email: `user${i + 1}@example.com`,
        name: userNames[i],
        phone: `+9198765432${i.toString().padStart(2, '0')}`,
        password,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: createdAt
      }
    });
    users.push(user);
  }

  console.log('👥 Created users');

  // Create KYC applications
  const kycStatuses: $Enums.KycStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
  const kycApplications: any[] = [];

  for (let i = 0; i < 15; i++) {
    const status = kycStatuses[Math.floor(Math.random() * kycStatuses.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    
    const kyc = await prisma.kycApplication.create({
      data: {
        userId: user.id,
        status,
        submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        reviewedAt: status !== 'PENDING' ? new Date() : null,
        reviewedBy: status !== 'PENDING' ? adminUser.id : null,
        remarks: status === 'REJECTED' ? 'Document verification failed' : null,
        documents: {
          aadhar: `AADHAR_${Math.random().toString(36).substring(7)}`,
          pan: `PAN_${Math.random().toString(36).substring(7)}`,
          bankStatement: `BANK_${Math.random().toString(36).substring(7)}`
        },
        personalInfo: {
          address: `${Math.floor(Math.random() * 100)} Main Street, City ${i + 1}`,
          occupation: ['Business', 'Employee', 'Professional', 'Student'][Math.floor(Math.random() * 4)],
          annualIncome: Math.floor(Math.random() * 1000000) + 500000
        }
      }
    });
    kycApplications.push(kyc);
  }

  console.log('📋 Created KYC applications');

  // Create transactions
  const transactionTypes: $Enums.TransactionType[] = ['BUY', 'SELL'];
  const transactionStatuses: $Enums.TransactionStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];
  const paymentMethods = ['UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Net Banking'];
  
  const transactions: any[] = [];
  const silverPrices = [75000, 78000, 82000, 85000, 88000, 92000, 95000, 98000];

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const status = transactionStatuses[Math.floor(Math.random() * transactionStatuses.length)];
    const silverPrice = silverPrices[Math.floor(Math.random() * silverPrices.length)];
    const silverQuantity = Math.floor(Math.random() * 100) + 10; // 10-110 grams
    const amount = silverQuantity * silverPrice;
    const fees = amount * 0.02; // 2% fees
    const totalAmount = amount + fees;

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type,
        amount,
        silverQuantity,
        silverPrice,
        status,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        referenceId: `TXN_${Date.now()}_${i}`,
        fees,
        totalAmount,
        transactionDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        details: {
          paymentGateway: 'Razorpay',
          transactionHash: `HASH_${Math.random().toString(36).substring(7)}`
        },
        remarks: status === 'FAILED' ? 'Payment gateway timeout' : null
      }
    });
    transactions.push(transaction);
  }

  console.log('💰 Created transactions');

  // Create portfolios
  for (const user of users) {
    const userTransactions = transactions.filter(t => t.userId === user.id);
    const totalSilverHolding = userTransactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.type === 'BUY' ? t.silverQuantity : -t.silverQuantity), 0);
    
    const totalInvested = userTransactions
      .filter(t => t.status === 'COMPLETED' && t.type === 'BUY')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const currentSilverPrice = silverPrices[Math.floor(Math.random() * silverPrices.length)];
    const currentValue = totalSilverHolding * currentSilverPrice;
    const totalProfit = currentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    await prisma.portfolio.create({
      data: {
        userId: user.id,
        totalSilverHolding: Math.max(0, totalSilverHolding),
        totalInvested,
        currentValue,
        totalProfit,
        profitPercentage,
        averageBuyPrice: totalSilverHolding > 0 ? totalInvested / totalSilverHolding : 0,
        currentSilverPrice,
        lastUpdated: new Date(),
        holdings: [
          {
            silverQuantity: Math.max(0, totalSilverHolding),
            averagePrice: totalSilverHolding > 0 ? totalInvested / totalSilverHolding : 0,
            currentValue,
            profit: totalProfit
          }
        ],
        performance: {
          daily: Math.random() * 10 - 5,
          weekly: Math.random() * 20 - 10,
          monthly: Math.random() * 30 - 15,
          yearly: Math.random() * 50 - 25
        }
      }
    });
  }

  console.log('📊 Created portfolios');

  // Create admin-specific notifications
  const adminNotificationTypes: $Enums.NotificationType[] = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'];
  const adminNotifications = [
    {
      title: 'System Update',
      message: 'Database has been successfully seeded with sample data',
      type: 'SUCCESS' as $Enums.NotificationType,
      isRead: false
    },
    {
      title: 'New KYC Applications',
      message: '5 new KYC applications require review',
      type: 'WARNING' as $Enums.NotificationType,
      isRead: false
    },
    {
      title: 'High Transaction Volume',
      message: 'System detected increased transaction activity',
      type: 'INFO' as $Enums.NotificationType,
      isRead: false
    },
    {
      title: 'User Registration Alert',
      message: 'New user registration detected',
      type: 'INFO' as $Enums.NotificationType,
      isRead: false
    },
    {
      title: 'System Maintenance',
      message: 'Scheduled maintenance completed successfully',
      type: 'SUCCESS' as $Enums.NotificationType,
      isRead: false
    },
    {
      title: 'Security Alert',
      message: 'Multiple failed login attempts detected',
      type: 'ERROR' as $Enums.NotificationType,
      isRead: false
    },
    {
      title: 'Revenue Milestone',
      message: 'Monthly revenue target achieved',
      type: 'SUCCESS' as $Enums.NotificationType,
      isRead: false
    },
    {
      title: 'Database Backup',
      message: 'Daily database backup completed',
      type: 'INFO' as $Enums.NotificationType,
      isRead: false
    }
  ];

  // Create admin notifications with distributed dates
  for (let i = 0; i < adminNotifications.length; i++) {
    const notification = adminNotifications[i];
    const daysAgo = Math.floor(Math.random() * 7); // 0-6 days ago
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: createdAt,
        metadata: {
          source: 'system',
          priority: notification.type === 'ERROR' ? 'high' : 'normal',
          category: 'admin'
        }
      }
    });
  }

  // Create a few user notifications for regular users
  const userNotificationTypes: $Enums.NotificationType[] = ['INFO', 'SUCCESS', 'WARNING'];
  
  for (let i = 0; i < 10; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = userNotificationTypes[Math.floor(Math.random() * userNotificationTypes.length)];
    const daysAgo = Math.floor(Math.random() * 30); // 0-29 days ago
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: `User Notification ${i + 1}`,
        message: `This is a ${type.toLowerCase()} notification for ${user.name}`,
        type,
        isRead: Math.random() > 0.5,
        createdAt: createdAt,
        metadata: {
          source: 'user',
          priority: 'normal'
        }
      }
    });
  }

  console.log('🔔 Created notifications');

  // Create logs
  const logLevels = ['INFO', 'WARN', 'ERROR', 'AUDIT'];
  const logCategories = ['AUTH', 'USER', 'TRANSACTION', 'PORTFOLIO', 'KYC', 'SYSTEM'];
  const actions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'];

  for (let i = 0; i < 100; i++) {
    const level = logLevels[Math.floor(Math.random() * logLevels.length)];
    const category = logCategories[Math.floor(Math.random() * logCategories.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];

    await prisma.log.create({
      data: {
        level,
        category,
        message: `${action} action performed by ${user.name}`,
        userId: user.id,
        userEmail: user.email,
        action,
        resource: category,
        resourceId: Math.random().toString(36).substring(7),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          sessionId: `session_${Math.random().toString(36).substring(7)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Create some audit logs
  for (let i = 0; i < 20; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    
    await prisma.log.create({
      data: {
        level: 'AUDIT',
        category: 'USER',
        message: `User profile updated by ${user.name}`,
        userId: user.id,
        userEmail: user.email,
        action: 'UPDATE',
        resource: 'USER',
        resourceId: user.id,
        metadata: {
          beforeState: { status: 'ACTIVE' },
          afterState: { status: 'ACTIVE' },
          changes: { lastLogin: new Date().toISOString() }
        },
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }
    });
  }

  console.log('📝 Created logs');

  // Create settings
  const settings = [
    { key: 'SILVER_PRICE', value: '85000', description: 'Current silver price per kg', category: 'PRICING' },
    { key: 'TRANSACTION_FEE', value: '2', description: 'Transaction fee percentage', category: 'FEES' },
    { key: 'MIN_TRANSACTION_AMOUNT', value: '10000', description: 'Minimum transaction amount', category: 'LIMITS' },
    { key: 'MAX_TRANSACTION_AMOUNT', value: '1000000', description: 'Maximum transaction amount', category: 'LIMITS' },
    { key: 'KYC_REQUIRED', value: 'true', description: 'KYC required for transactions', category: 'COMPLIANCE' },
    { key: 'MAINTENANCE_MODE', value: 'false', description: 'System maintenance mode', category: 'SYSTEM' }
  ];

  for (const setting of settings) {
    await prisma.setting.create({
      data: setting
    });
  }

  console.log('⚙️ Created settings');

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Created ${users.length + 1} users (including admin)`);
  console.log(`📋 Created ${kycApplications.length} KYC applications`);
  console.log(`💰 Created ${transactions.length} transactions`);
  console.log(`📊 Created ${users.length} portfolios`);
  console.log(`🔔 Created 32 notifications`);
  console.log(`📝 Created 120 logs`);
  console.log(`⚙️ Created ${settings.length} settings`);

  console.log('\n🔑 Admin credentials:');
  console.log('Email: admin@silverlining.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });