const { loadEnv } = require('../load-env.js');
loadEnv();

let PrismaClient;
try {
  PrismaClient = require('../prisma/generated/client').PrismaClient;
} catch {
  PrismaClient = require('@prisma/client').PrismaClient;
}

const prisma = new PrismaClient();

async function inspectAll() {
  try {
    console.log('=== PROJECTS IN POSTGRESQL ===');
    const projects = await prisma.project.findMany({
      include: {
        owner: { select: { id: true, email: true } },
        members: true,
        issues: true
      }
    });
    console.dir(projects, { depth: null });

    console.log('\n=== ISSUES IN POSTGRESQL ===');
    const issues = await prisma.issue.findMany();
    console.dir(issues, { depth: null });

    console.log('\n=== JOIN REQUESTS IN POSTGRESQL ===');
    const joinReqs = await prisma.joinRequest.findMany();
    console.dir(joinReqs, { depth: null });

    console.log('\n=== NOTIFICATIONS IN POSTGRESQL ===');
    const notifs = await prisma.notification.findMany();
    console.dir(notifs, { depth: null });

    console.log('\n=== USERS IN POSTGRESQL (Sample emails masked) ===');
    const users = await prisma.user.findMany({
      include: { profile: true }
    });
    users.forEach(u => {
      console.log(`ID: ${u.id} | Name: ${u.profile?.firstName} ${u.profile?.lastName} | Email: ${u.email ? u.email.substring(0, 3) + '***@' + (u.email.split('@')[1] || '') : 'none'} | Status: ${u.status}`);
    });
  } catch (e) {
    console.error('Inspection error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectAll();
