import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@silverlining.com' },
    update: {},
    create: {
      email: 'admin@silverlining.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Create sample user
  const userPassword = await bcrypt.hash('user123', 10);
  const sampleUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Sample User',
      phone: '+91 98765 43210',
      password: userPassword,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  // Create additional users for realistic data
  const additionalUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        phone: '+91 98765 43211',
        password: userPassword,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date('2025-01-10T10:00:00Z'),
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        phone: '+91 98765 43212',
        password: userPassword,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date('2025-02-15T14:30:00Z'),
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike.wilson@example.com' },
      update: {},
      create: {
        email: 'mike.wilson@example.com',
        name: 'Mike Wilson',
        phone: '+91 98765 43213',
        password: userPassword,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date('2025-03-20T09:15:00Z'),
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah.jones@example.com' },
      update: {},
      create: {
        email: 'sarah.jones@example.com',
        name: 'Sarah Jones',
        phone: '+91 98765 43214',
        password: userPassword,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date('2025-04-05T16:45:00Z'),
      },
    }),
    prisma.user.upsert({
      where: { email: 'david.brown@example.com' },
      update: {},
      create: {
        email: 'david.brown@example.com',
        name: 'David Brown',
        phone: '+91 98765 43215',
        password: userPassword,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date('2025-05-12T11:20:00Z'),
      },
    }),
  ]);

  // Create sample KYC application
  const kycApplication = await prisma.kycApplication.upsert({
    where: { id: 'sample-kyc-1' },
    update: {},
    create: {
      id: 'sample-kyc-1',
      userId: sampleUser.id,
      status: 'APPROVED',
      submittedAt: new Date('2024-01-15T10:00:00Z'),
      reviewedAt: new Date('2024-01-16T14:30:00Z'),
      reviewedBy: adminUser.email,
      documents: {
        aadhar: 'aadhar_123456789012.pdf',
        pan: 'pan_ABCDE1234F.pdf',
        addressProof: 'address_proof.pdf',
        incomeProof: 'income_proof.pdf',
      },
      personalInfo: {
        fullName: 'Sample User',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        address: 'Mumbai, Maharashtra',
        occupation: 'Software Engineer',
        incomeRange: '5-10 LPA',
      },
      remarks: 'All documents verified successfully',
    },
  });

  // Create sample transactions
  const transaction1 = await prisma.transaction.upsert({
    where: { referenceId: 'TXN_001' },
    update: {},
    create: {
      userId: sampleUser.id,
      type: 'BUY',
      amount: 10000,
      silverQuantity: 100,
      silverPrice: 100,
      status: 'COMPLETED',
      transactionDate: new Date('2024-01-15T10:00:00Z'),
      paymentMethod: 'UPI',
      referenceId: 'TXN_001',
      fees: 50,
      totalAmount: 10050,
      details: {
        paymentGateway: 'Razorpay',
        gatewayTransactionId: 'pay_123456789',
        bankReference: 'BANK_REF_001',
        processingTime: '2 minutes',
      },
    },
  });

  const transaction2 = await prisma.transaction.upsert({
    where: { referenceId: 'TXN_002' },
    update: {},
    create: {
      userId: sampleUser.id,
      type: 'BUY',
      amount: 15000,
      silverQuantity: 150,
      silverPrice: 100,
      status: 'COMPLETED',
      transactionDate: new Date('2024-01-18T14:30:00Z'),
      paymentMethod: 'Bank Transfer',
      referenceId: 'TXN_002',
      fees: 75,
      totalAmount: 15075,
    },
  });

  // Create historical transactions for the last 6 months
  const historicalTransactions = await Promise.all([
    // January 2025
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_JAN_001' },
      update: {},
      create: {
        userId: additionalUsers[0].id,
        type: 'BUY',
        amount: 8000,
        silverQuantity: 80,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-01-05T10:00:00Z'),
        paymentMethod: 'UPI',
        referenceId: 'TXN_JAN_001',
        fees: 40,
        totalAmount: 8040,
      },
    }),
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_JAN_002' },
      update: {},
      create: {
        userId: additionalUsers[0].id,
        type: 'BUY',
        amount: 12000,
        silverQuantity: 120,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-01-25T14:30:00Z'),
        paymentMethod: 'Bank Transfer',
        referenceId: 'TXN_JAN_002',
        fees: 60,
        totalAmount: 12060,
      },
    }),

    // February 2025
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_FEB_001' },
      update: {},
      create: {
        userId: additionalUsers[1].id,
        type: 'BUY',
        amount: 15000,
        silverQuantity: 150,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-02-10T09:15:00Z'),
        paymentMethod: 'UPI',
        referenceId: 'TXN_FEB_001',
        fees: 75,
        totalAmount: 15075,
      },
    }),
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_FEB_002' },
      update: {},
      create: {
        userId: additionalUsers[1].id,
        type: 'BUY',
        amount: 9000,
        silverQuantity: 90,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-02-28T16:45:00Z'),
        paymentMethod: 'Card',
        referenceId: 'TXN_FEB_002',
        fees: 45,
        totalAmount: 9045,
      },
    }),

    // March 2025
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_MAR_001' },
      update: {},
      create: {
        userId: additionalUsers[2].id,
        type: 'BUY',
        amount: 20000,
        silverQuantity: 200,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-03-15T11:20:00Z'),
        paymentMethod: 'Bank Transfer',
        referenceId: 'TXN_MAR_001',
        fees: 100,
        totalAmount: 20100,
      },
    }),
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_MAR_002' },
      update: {},
      create: {
        userId: additionalUsers[2].id,
        type: 'BUY',
        amount: 11000,
        silverQuantity: 110,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-03-30T13:10:00Z'),
        paymentMethod: 'UPI',
        referenceId: 'TXN_MAR_002',
        fees: 55,
        totalAmount: 11055,
      },
    }),

    // April 2025
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_APR_001' },
      update: {},
      create: {
        userId: additionalUsers[3].id,
        type: 'BUY',
        amount: 18000,
        silverQuantity: 180,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-04-12T10:30:00Z'),
        paymentMethod: 'UPI',
        referenceId: 'TXN_APR_001',
        fees: 90,
        totalAmount: 18090,
      },
    }),
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_APR_002' },
      update: {},
      create: {
        userId: additionalUsers[3].id,
        type: 'BUY',
        amount: 13000,
        silverQuantity: 130,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-04-25T15:45:00Z'),
        paymentMethod: 'Card',
        referenceId: 'TXN_APR_002',
        fees: 65,
        totalAmount: 13065,
      },
    }),

    // May 2025
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_MAY_001' },
      update: {},
      create: {
        userId: additionalUsers[4].id,
        type: 'BUY',
        amount: 16000,
        silverQuantity: 160,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-05-08T12:00:00Z'),
        paymentMethod: 'Bank Transfer',
        referenceId: 'TXN_MAY_001',
        fees: 80,
        totalAmount: 16080,
      },
    }),
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_MAY_002' },
      update: {},
      create: {
        userId: additionalUsers[4].id,
        type: 'BUY',
        amount: 14000,
        silverQuantity: 140,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-05-22T14:20:00Z'),
        paymentMethod: 'UPI',
        referenceId: 'TXN_MAY_002',
        fees: 70,
        totalAmount: 14070,
      },
    }),

    // June 2025 (current month)
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_JUN_001' },
      update: {},
      create: {
        userId: sampleUser.id,
        type: 'BUY',
        amount: 22000,
        silverQuantity: 220,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-06-05T09:30:00Z'),
        paymentMethod: 'UPI',
        referenceId: 'TXN_JUN_001',
        fees: 110,
        totalAmount: 22110,
      },
    }),
    prisma.transaction.upsert({
      where: { referenceId: 'TXN_JUN_002' },
      update: {},
      create: {
        userId: additionalUsers[0].id,
        type: 'BUY',
        amount: 17000,
        silverQuantity: 170,
        silverPrice: 100,
        status: 'COMPLETED',
        transactionDate: new Date('2025-06-18T16:15:00Z'),
        paymentMethod: 'Card',
        referenceId: 'TXN_JUN_002',
        fees: 85,
        totalAmount: 17085,
      },
    }),
  ]);

  // Create sample portfolio
  const portfolio = await prisma.portfolio.upsert({
    where: { userId: sampleUser.id },
    update: {},
    create: {
      userId: sampleUser.id,
      totalSilverHolding: 250,
      totalInvested: 25000,
      currentValue: 27500,
      totalProfit: 2500,
      profitPercentage: 10,
      averageBuyPrice: 100,
      currentSilverPrice: 110,
      lastUpdated: new Date(),
      holdings: [
        {
          id: '1',
          purchaseDate: '2024-01-15T10:00:00Z',
          quantity: 100,
          buyPrice: 100,
          currentValue: 11000,
          profit: 1000,
          profitPercentage: 10,
        },
        {
          id: '2',
          purchaseDate: '2024-01-18T14:30:00Z',
          quantity: 150,
          buyPrice: 100,
          currentValue: 16500,
          profit: 1500,
          profitPercentage: 10,
        },
      ],
      performance: {
        daily: 2.5,
        weekly: 5.2,
        monthly: 12.8,
        yearly: 45.6,
      },
    },
  });

  // Create sample notifications
  const notification1 = await prisma.notification.create({
    data: {
      userId: sampleUser.id,
      title: 'KYC Approved',
      message: 'Your KYC application has been approved successfully.',
      type: 'SUCCESS',
      isRead: false,
    },
  });

  const notification2 = await prisma.notification.create({
    data: {
      userId: sampleUser.id,
      title: 'Transaction Successful',
      message: 'Your silver purchase of ₹10,000 has been completed successfully.',
      type: 'INFO',
      isRead: true,
    },
  });

  // Create app settings
  const settings = [
    {
      key: 'app.general',
      value: JSON.stringify({
        appName: 'Silver Lining',
        appVersion: '1.0.0',
        maintenanceMode: false,
        registrationEnabled: true,
        kycRequired: true,
      }),
    },
    {
      key: 'app.payment',
      value: JSON.stringify({
        supportedMethods: ['UPI', 'Bank Transfer', 'Card'],
        transactionFees: 0.5,
        minimumTransactionAmount: 100,
        maximumTransactionAmount: 100000,
      }),
    },
    {
      key: 'app.silver',
      value: JSON.stringify({
        currentPrice: 110,
        priceUpdateInterval: 300,
        minimumPurchaseAmount: 100,
        maximumPurchaseAmount: 100000,
      }),
    },
    {
      key: 'app.notifications',
      value: JSON.stringify({
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        priceAlerts: true,
      }),
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ Database seeding completed!');
  console.log(`👤 Admin user created: ${adminUser.email}`);
  console.log(`👤 Sample user created: ${sampleUser.email}`);
  console.log(`📋 KYC applications: 1`);
  console.log(`💰 Transactions: ${historicalTransactions.length + 2}`);
  console.log(`📊 Portfolio: 1`);
  console.log(`🔔 Notifications: 2`);
  console.log(`⚙️ Settings: ${settings.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });