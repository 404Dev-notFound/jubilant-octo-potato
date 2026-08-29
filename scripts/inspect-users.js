const { loadEnv } = require('../load-env.js');
loadEnv();

let PrismaClient;
try {
  PrismaClient = require('../prisma/generated/client').PrismaClient;
} catch {
  PrismaClient = require('@prisma/client').PrismaClient;
}

const prisma = new PrismaClient();

async function inspectUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true
      },
      take: 10
    });
    console.log('--- Sample 10 Users from Supabase PostgreSQL ---');
    users.forEach(u => {
      console.log({
        id: u.id,
        email: u.email ? u.email.substring(0, 3) + '***' : null,
        firstName: u.profile?.firstName,
        lastName: u.profile?.lastName,
        avatarUrl: u.profile?.avatarUrl,
        preferences: u.profile?.preferences
      });
    });
  } catch (e) {
    console.error('User inspection error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectUsers();
