const { loadEnv } = require('../load-env.js');
loadEnv();

let PrismaClient;
try {
  PrismaClient = require('../prisma/generated/client').PrismaClient;
} catch {
  PrismaClient = require('@prisma/client').PrismaClient;
}

const prisma = new PrismaClient();

async function inspectDb() {
  try {
    const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    console.log('--- PostgreSQL Tables in Public Schema ---');
    console.table(tables);

    // Count records in known tables
    for (const row of tables) {
      const name = row.table_name;
      if (name.startsWith('_')) continue;
      try {
        const countRes = await prisma.$queryRawUnsafe(`SELECT count(*) FROM "${name}";`);
        console.log(`Table "${name}": count =`, countRes[0].count);
      } catch (err) {
        console.log(`Table "${name}": error counting:`, err.message);
      }
    }
  } catch (e) {
    console.error('DB inspection error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDb();
