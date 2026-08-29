const { loadEnv } = require('../load-env.js');
loadEnv();

let PrismaClient;
try {
  PrismaClient = require('../prisma/generated/client').PrismaClient;
} catch {
  PrismaClient = require('@prisma/client').PrismaClient;
}

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('--- Cleaning Up Test / Seed Data from Supabase PostgreSQL ---');
  try {
    // 1. Find test users
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { startsWith: 'test_' } },
          { email: { startsWith: 'test-' } }
        ]
      },
      select: { id: true, email: true }
    });

    console.log(`Found ${testUsers.length} test users to clean up.`);
    const testUserIds = testUsers.map(u => u.id);

    if (testUserIds.length > 0) {
      // Delete notifications for test users
      await prisma.notification.deleteMany({
        where: {
          OR: [
            { userId: { in: testUserIds } },
            { actorId: { in: testUserIds } }
          ]
        }
      });

      // Delete join requests involving test users
      await prisma.joinRequest.deleteMany({
        where: {
          OR: [
            { userId: { in: testUserIds } },
            { ownerId: { in: testUserIds } }
          ]
        }
      });

      // Delete meeting requests involving test users
      await prisma.meetingRequest.deleteMany({
        where: {
          OR: [
            { userId: { in: testUserIds } },
            { ownerId: { in: testUserIds } }
          ]
        }
      });

      // Delete issues created by test users
      await prisma.issue.deleteMany({
        where: {
          OR: [
            { creatorId: { in: testUserIds } },
            { assigneeId: { in: testUserIds } },
            { title: { contains: 'test title issue' } }
          ]
        }
      });

      // Delete project members of test users
      await prisma.projectMember.deleteMany({
        where: { userId: { in: testUserIds } }
      });

      // Delete projects owned by test users
      await prisma.project.deleteMany({
        where: { ownerId: { in: testUserIds } }
      });

      // Delete user profiles for test users
      await prisma.userProfile.deleteMany({
        where: { userId: { in: testUserIds } }
      });

      // Delete test users
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } }
      });

      console.log('✅ Successfully removed test users and associated test artifacts.');
    }

    // 2. Also remove any issue with 'test title issue'
    await prisma.issue.deleteMany({
      where: { title: 'test title issue' }
    });

    // 3. Count remaining valid production entities
    const uCount = await prisma.user.count();
    const pCount = await prisma.project.count();
    const iCount = await prisma.issue.count();
    const jCount = await prisma.joinRequest.count();
    const nCount = await prisma.notification.count();

    console.log('\n--- Production Database State After Cleanup ---');
    console.log(`Users: ${uCount}`);
    console.log(`Projects: ${pCount}`);
    console.log(`Issues: ${iCount}`);
    console.log(`Join Requests: ${jCount}`);
    console.log(`Notifications: ${nCount}`);

  } catch (e) {
    console.error('Cleanup error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
