const fs = require('fs').promises;
const path = require('path');
const { loadEnv } = require('../load-env.js');
loadEnv();

let PrismaClient;
try {
  PrismaClient = require('../prisma/generated/client').PrismaClient;
} catch {
  PrismaClient = require('@prisma/client').PrismaClient;
}

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '..', 'codecollab data');

async function migrateTeamsAndLookingFor() {
  console.log('--- Migrating Teams, Guilds, and LookingFor Posts to PostgreSQL ---');
  try {
    // 1. Migrate LookingFor posts
    const lookingForRaw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'lookingFor.json'), 'utf-8'));
    console.log(`Read ${lookingForRaw.length} looking-for posts from JSON`);

    for (const item of lookingForRaw) {
      const userExists = await prisma.user.findUnique({ where: { id: String(item.userId) } });
      if (!userExists) {
        console.log(`Skipping post ${item.id} - user ${item.userId} not in DB`);
        continue;
      }

      await prisma.lookingFor.upsert({
        where: { id: String(item.id) },
        update: {
          lookingFor: item.lookingFor,
          forProject: item.for,
          requiredSkills: item.requiredSkills || [],
          commitment: item.commitment || 'Part-time (8-10 hrs/wk)',
          availability: item.availability || 'Available Now',
          context: item.context || ''
        },
        create: {
          id: String(item.id),
          userId: String(item.userId),
          lookingFor: item.lookingFor,
          forProject: item.for,
          requiredSkills: item.requiredSkills || [],
          commitment: item.commitment || 'Part-time (8-10 hrs/wk)',
          availability: item.availability || 'Available Now',
          context: item.context || '',
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
        }
      });
      console.log(`✅ Migrated LookingFor: ${item.lookingFor}`);
    }

    // 2. Migrate Teams
    const teamsRaw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'teams.json'), 'utf-8'));
    console.log(`Read ${teamsRaw.length} teams from JSON`);

    for (const t of teamsRaw) {
      if (t.teamName === 'test team name' || t.teamName === 'Automated Test Guild') {
        console.log(`Skipping test team: ${t.teamName}`);
        continue;
      }
      const leadExists = await prisma.user.findUnique({ where: { id: String(t.leadId) } });
      if (!leadExists) {
        console.log(`Skipping team ${t.teamName} - lead ${t.leadId} not in DB`);
        continue;
      }

      await prisma.team.upsert({
        where: { id: String(t.id) },
        update: {
          teamName: t.teamName,
          description: t.description || '',
          assignedProjects: t.assignedProjects || [],
          skills: t.skills || [],
          upvotes: typeof t.upvotes === 'number' ? t.upvotes : 0,
          upvoters: t.upvoters || [],
          lookingFor: t.lookingFor || 'Looking for passionate developers',
          openPositions: t.openPositions || ['Collaborator'],
          availability: t.availability || 'Active · Open for Collaboration',
          rating: typeof t.rating === 'number' ? t.rating : 5.0
        },
        create: {
          id: String(t.id),
          teamName: t.teamName,
          description: t.description || '',
          leadId: String(t.leadId),
          assignedProjects: t.assignedProjects || [],
          skills: t.skills || [],
          upvotes: typeof t.upvotes === 'number' ? t.upvotes : 0,
          upvoters: t.upvoters || [],
          lookingFor: t.lookingFor || 'Looking for passionate developers',
          openPositions: t.openPositions || ['Collaborator'],
          availability: t.availability || 'Active · Open for Collaboration',
          rating: typeof t.rating === 'number' ? t.rating : 5.0,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date()
        }
      });

      // Migrate team members
      if (Array.isArray(t.members)) {
        for (const memberId of t.members) {
          const mExists = await prisma.user.findUnique({ where: { id: String(memberId) } });
          if (mExists) {
            await prisma.teamMember.upsert({
              where: {
                teamId_userId: {
                  teamId: String(t.id),
                  userId: String(memberId)
                }
              },
              update: {
                role: String(memberId) === String(t.leadId) ? 'lead' : 'member'
              },
              create: {
                teamId: String(t.id),
                userId: String(memberId),
                role: String(memberId) === String(t.leadId) ? 'lead' : 'member'
              }
            });
          }
        }
      }
      console.log(`✅ Migrated Team: ${t.teamName}`);
    }

    // Check DB counts
    const lfCount = await prisma.lookingFor.count();
    const teamCount = await prisma.team.count();
    const tmCount = await prisma.teamMember.count();
    console.log(`\nFinal PostgreSQL Counts: LookingFor: ${lfCount}, Teams: ${teamCount}, TeamMembers: ${tmCount}`);

  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTeamsAndLookingFor();
