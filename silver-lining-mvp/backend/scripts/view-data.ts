import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function viewData() {
  console.log('📊 Database Data Overview\n');

  // View Users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    
  });
  console.log('👥 Users:');
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
  });

  // View KYC Applications
  const kycApplications = await prisma.kycApplication.findMany({
    select: {
      id: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
  console.log('\n📋 KYC Applications:');
  kycApplications.forEach(kyc => {
    console.log(`  - ${kyc.user.name} - Status: ${kyc.status} - Submitted: ${kyc.submittedAt.toDateString()}`);
  });

  // View Transactions
  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      type: true,
      amount: true,
      status: true,
      transactionDate: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
  console.log('\n💰 Transactions:');
  transactions.forEach(txn => {
    console.log(`  - ${txn.user.name} - ${txn.type} ₹${txn.amount} - ${txn.status} - ${txn.transactionDate.toDateString()}`);
  });

  // View Portfolios
  const portfolios = await prisma.portfolio.findMany({
    select: {
      id: true,
      totalSilverHolding: true,
      totalInvested: true,
      currentValue: true,
      totalProfit: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
  console.log('\n📊 Portfolios:');
  portfolios.forEach(portfolio => {
    console.log(`  - ${portfolio.user.name} - Silver: ${portfolio.totalSilverHolding}g - Invested: ₹${portfolio.totalInvested} - Current: ₹${portfolio.currentValue} - Profit: ₹${portfolio.totalProfit}`);
  });

  // View Notifications
  const notifications = await prisma.notification.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      isRead: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
  console.log('\n🔔 Notifications:');
  notifications.forEach(notification => {
    console.log(`  - ${notification.user.name} - ${notification.title} (${notification.type}) - Read: ${notification.isRead}`);
  });

  // View Settings
  const settings = await prisma.setting.findMany({
    select: {
      key: true,
      value: true,
    },
  });
  console.log('\n⚙️ Settings:');
  settings.forEach(setting => {
    console.log(`  - ${setting.key}: ${setting.value.substring(0, 50)}...`);
  });

  await prisma.$disconnect();
}

viewData().catch(console.error); 