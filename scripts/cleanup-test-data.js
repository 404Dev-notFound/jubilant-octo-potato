const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestData() {
    console.log('--- Starting Safe Test Data Cleanup ---');

    try {
        // 1. Identify test users (created specifically during test automation runs)
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                status: true,
                profile: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        const testUsers = allUsers.filter(u => {
            const email = (u.email || '').toLowerCase();
            return (
                email.startsWith('test_') ||
                email.startsWith('test-user-') ||
                email.startsWith('__test_') ||
                email.includes('_notif_test') ||
                email.startsWith('cleanup_test_')
            );
        });

        console.log(`Found ${testUsers.length} test runner users out of ${allUsers.length} total users.`);
        testUsers.forEach(u => {
            const fullName = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || 'No Name';
            console.log(`  - [TEST USER TO CLEAN] ID ${u.id}: ${u.email} (${fullName})`);
        });

        if (testUsers.length > 0) {
            const testUserIds = testUsers.map(u => u.id);

            // Delete test join requests
            if (prisma.joinRequest) {
                try {
                    const deletedJR = await prisma.joinRequest.deleteMany({
                        where: {
                            OR: [
                                { userId: { in: testUserIds } },
                                { project: { ownerId: { in: testUserIds } } }
                            ]
                        }
                    });
                    console.log(`Deleted ${deletedJR.count} test join requests.`);
                } catch (e) { console.warn('JR clean note:', e.message); }
            }

            // Delete test meeting requests
            if (prisma.meetingRequest) {
                try {
                    const deletedMR = await prisma.meetingRequest.deleteMany({
                        where: {
                            OR: [
                                { userId: { in: testUserIds } },
                                { ownerId: { in: testUserIds } }
                            ]
                        }
                    });
                    console.log(`Deleted ${deletedMR.count} test meeting requests.`);
                } catch (e) { console.warn('MR clean note:', e.message); }
            }

            // Delete test notifications for test users
            if (prisma.notification) {
                try {
                    const deletedNotifs = await prisma.notification.deleteMany({
                        where: {
                            OR: [
                                { userId: { in: testUserIds } },
                                { actorId: { in: testUserIds } }
                            ]
                        }
                    });
                    console.log(`Deleted ${deletedNotifs.count} notifications for test users.`);
                } catch (e) { console.warn('Notif clean note:', e.message); }
            }

            // Delete test project members
            if (prisma.projectMember) {
                try {
                    const deletedPM = await prisma.projectMember.deleteMany({
                        where: { userId: { in: testUserIds } }
                    });
                    console.log(`Deleted ${deletedPM.count} project members belonging to test users.`);
                } catch (e) { console.warn('PM clean note:', e.message); }
            }

            // Delete test issues
            if (prisma.issue) {
                try {
                    const deletedIssues = await prisma.issue.deleteMany({
                        where: {
                            OR: [
                                { assigneeId: { in: testUserIds } },
                                { creatorId: { in: testUserIds } }
                            ]
                        }
                    });
                    console.log(`Deleted ${deletedIssues.count} test issues.`);
                } catch (e) { console.warn('Issue clean note:', e.message); }
            }

            // Delete test projects
            if (prisma.project) {
                try {
                    const deletedProjects = await prisma.project.deleteMany({
                        where: {
                            OR: [
                                { ownerId: { in: testUserIds } }
                            ]
                        }
                    });
                    console.log(`Deleted ${deletedProjects.count} test projects.`);
                } catch (e) { console.warn('Project clean note:', e.message); }
            }

            // Finally, delete the test user accounts themselves
            const deletedUsers = await prisma.user.deleteMany({
                where: { id: { in: testUserIds } }
            });
            console.log(`Deleted ${deletedUsers.count} test user accounts.`);
        }

        // 2. Clean up any leftover test issues with [TEST] or test title
        if (prisma.issue) {
            try {
                const deletedTestIssues = await prisma.issue.deleteMany({
                    where: {
                        OR: [
                            { title: { startsWith: '[TEST]' } },
                            { title: { startsWith: 'Test Issue' } }
                        ]
                    }
                });
                console.log(`Deleted ${deletedTestIssues.count} leftover test issues.`);
            } catch (e) { console.warn('Issue extra clean note:', e.message); }
        }

        // Summary of remaining genuine records
        const remainingUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                status: true,
                profile: { select: { firstName: true, lastName: true } }
            }
        });
        const remainingProjects = await prisma.project.findMany({ select: { id: true, title: true } });
        const remainingIssues = await prisma.issue.findMany({ select: { id: true, title: true } });

        console.log('\n--- Current Production Database Summary ---');
        console.log(`Active Genuine Users (${remainingUsers.length}):`);
        remainingUsers.forEach(u => {
            const fullName = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || 'User';
            console.log(`  - ID ${u.id}: ${fullName} (${u.email}) [${u.status}]`);
        });
        console.log(`Active Projects (${remainingProjects.length}):`);
        remainingProjects.forEach(p => console.log(`  - ID ${p.id}: ${p.title}`));
        console.log(`Active Issues (${remainingIssues.length}):`);
        remainingIssues.forEach(i => console.log(`  - ID ${i.id}: ${i.title}`));

        console.log('\n--- Test Data Cleanup Successfully Finished ---');
    } catch (err) {
        console.error('Error during test data cleanup:', err);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupTestData();
