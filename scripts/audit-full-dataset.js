/*
 * ==============================================================================
 * Comprehensive Full-Dataset Relational Integrity Audit Script
 * ==============================================================================
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'codecollab data');

async function loadJson(filename) {
    const p = path.join(DATA_DIR, filename);
    const content = await fs.readFile(p, 'utf-8');
    return JSON.parse(content);
}

async function audit() {
    console.log('===============================================================');
    console.log('🔍 FULL JSON DATASET RELATIONAL INTEGRITY AUDIT');
    console.log('===============================================================\n');

    const users = await loadJson('users.json');
    const projects = await loadJson('projects.json');
    const projectMembers = await loadJson('projectMembers.json');
    const tasks = await loadJson('tasks.json');
    const projectInvitations = await loadJson('projectInvitations.json');
    const notifications = await loadJson('notifications.json');
    const lookingFor = await loadJson('lookingFor.json');

    const userIds = new Set();
    const emails = new Set();
    const projectIds = new Set();
    const taskIds = new Set();
    const invitationIds = new Set();
    const notificationIds = new Set();

    const violations = [];
    const passes = [];

    // 1. Users Check
    for (const u of users) {
        if (!u.id) violations.push(`User missing ID: ${JSON.stringify(u)}`);
        if (userIds.has(String(u.id))) violations.push(`Duplicate User ID: ${u.id}`);
        userIds.add(String(u.id));

        if (!u.email || !u.email.includes('@')) violations.push(`Invalid email for user ${u.id}: ${u.email}`);
        if (emails.has(u.email.toLowerCase())) violations.push(`Duplicate email: ${u.email}`);
        emails.add(u.email.toLowerCase());

        // Check that email was not converted to ID
        if (String(u.id).includes('@')) violations.push(`User ID appears to be an email address: ${u.id}`);
    }
    passes.push(`Users: ${userIds.size} unique users validated`);

    // 2. Projects Check
    for (const p of projects) {
        if (!p.id) violations.push(`Project missing ID: ${JSON.stringify(p)}`);
        if (projectIds.has(String(p.id))) violations.push(`Duplicate Project ID: ${p.id}`);
        projectIds.add(String(p.id));

        if (p.ownerId && !userIds.has(String(p.ownerId))) {
            violations.push(`Project ${p.id} references non-existent ownerId: ${p.ownerId}`);
        }
    }
    passes.push(`Projects: ${projectIds.size} unique projects validated`);

    // 3. Project Members Check
    const memberPairs = new Set();
    for (const m of projectMembers) {
        if (!m.projectId || !projectIds.has(String(m.projectId))) {
            violations.push(`ProjectMember references invalid projectId: ${m.projectId}`);
        }
        if (!m.userId || !userIds.has(String(m.userId))) {
            violations.push(`ProjectMember references invalid userId: ${m.userId}`);
        }
        const key = `${m.projectId}:${m.userId}`;
        if (memberPairs.has(key)) violations.push(`Duplicate ProjectMember pair: ${key}`);
        memberPairs.add(key);
    }
    passes.push(`ProjectMembers: ${projectMembers.length} valid membership links verified`);

    // 4. Tasks / Issues Check
    for (const t of tasks) {
        if (!t.id) violations.push(`Task missing ID: ${JSON.stringify(t)}`);
        if (taskIds.has(String(t.id))) violations.push(`Duplicate Task ID: ${t.id}`);
        taskIds.add(String(t.id));

        if (!t.projectId || !projectIds.has(String(t.projectId))) {
            violations.push(`Task ${t.id} references invalid projectId: ${t.projectId}`);
        }
        if (!t.creatorId || !userIds.has(String(t.creatorId))) {
            violations.push(`Task ${t.id} references invalid creatorId: ${t.creatorId}`);
        }
        if (t.assigneeId && !userIds.has(String(t.assigneeId))) {
            violations.push(`Task ${t.id} references invalid assigneeId: ${t.assigneeId}`);
        }
        if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(String(t.status || '').toUpperCase())) {
            violations.push(`Task ${t.id} has invalid status: ${t.status}`);
        }
        if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(t.priority || '').toUpperCase())) {
            violations.push(`Task ${t.id} has invalid priority: ${t.priority}`);
        }
    }
    passes.push(`Tasks: ${tasks.length} valid issues verified`);

    // 5. Project Invitations / Join Requests Check
    for (const r of projectInvitations) {
        if (!r.id) violations.push(`JoinRequest missing ID: ${JSON.stringify(r)}`);
        if (invitationIds.has(String(r.id))) violations.push(`Duplicate JoinRequest ID: ${r.id}`);
        invitationIds.add(String(r.id));

        if (!r.userId || !userIds.has(String(r.userId))) {
            violations.push(`JoinRequest ${r.id} references invalid userId: ${r.userId}`);
        }
        if (!r.ownerId || !userIds.has(String(r.ownerId))) {
            violations.push(`JoinRequest ${r.id} references invalid ownerId: ${r.ownerId}`);
        }
        if (!r.projectId || !projectIds.has(String(r.projectId))) {
            violations.push(`JoinRequest ${r.id} references invalid projectId: ${r.projectId}`);
        }
    }
    passes.push(`JoinRequests: ${projectInvitations.length} valid join requests verified`);

    // 6. Notifications Check
    for (const n of notifications) {
        if (!n.id) violations.push(`Notification missing ID: ${JSON.stringify(n)}`);
        if (notificationIds.has(String(n.id))) violations.push(`Duplicate Notification ID: ${n.id}`);
        notificationIds.add(String(n.id));

        if (!n.userId || !userIds.has(String(n.userId))) {
            violations.push(`Notification ${n.id} references invalid recipient userId: ${n.userId}`);
        }
        if (n.actorId && !userIds.has(String(n.actorId))) {
            violations.push(`Notification ${n.id} references invalid actorId: ${n.actorId}`);
        }
        if (n.projectId && !projectIds.has(String(n.projectId))) {
            violations.push(`Notification ${n.id} references invalid projectId: ${n.projectId}`);
        }
    }
    passes.push(`Notifications: ${notifications.length} valid notifications verified`);

    // 7. Community LookingFor Check
    for (const l of lookingFor) {
        if (l.userId && !userIds.has(String(l.userId))) {
            violations.push(`LookingFor ${l.id} references invalid userId: ${l.userId}`);
        }
    }
    passes.push(`LookingFor: ${lookingFor.length} valid community board entries verified`);

    console.log('--- Verification Checklist ---');
    passes.forEach(p => console.log(`  ✅ ${p}`));

    if (violations.length === 0) {
        console.log('\n🎉 ZERO INTEGRITY VIOLATIONS FOUND ACROSS ALL JSON DATASETS!');
        console.log('The dataset is 100% compliant and ready for preflight validation.\n');
        return true;
    } else {
        console.error(`\n❌ ${violations.length} VIOLATIONS FOUND:`);
        violations.forEach(v => console.error(`  - ${v}`));
        return false;
    }
}

audit().then(ok => {
    if (!ok) process.exit(1);
});
