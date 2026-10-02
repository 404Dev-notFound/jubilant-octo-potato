/*
 * ==============================================================================
 * CodeCollab Cyber-Security: Authorization Engine
 * ==============================================================================
 * Centralized authorization rules for projects, issues, memberships, and user data.
 * Enforces ownership checks, private project access boundaries,
 * and role-based permissions to prevent Insecure Direct Object References (IDOR).
 */

/**
 * Checks if a project is configured as private.
 *
 * @param {string} projectId
 * @param {Object} options
 * @param {Function} options.readJsonFn
 * @param {string} options.projectsFilePath
 * @param {Object} [options.prismaClient]
 * @param {boolean} [options.isProduction]
 * @returns {Promise<boolean>}
 */
async function checkProjectPrivate(projectId, options = {}) {
    if (!projectId) return false;
    const cleanProjectId = String(projectId);
    const { readJsonFn, projectsFilePath, prismaClient, isDbConnected } = options;

    if (prismaClient && (options.isProduction || (isDbConnected && await isDbConnected()))) {
        try {
            const project = await prismaClient.project.findUnique({
                where: { id: cleanProjectId },
                select: { isPrivate: true, visibility: true }
            });
            if (project) {
                return project.isPrivate === true || (typeof project.visibility === 'string' && project.visibility.toLowerCase() === 'private');
            }
        } catch {
            if (options.isProduction) return false;
        }
    }

    if (readJsonFn && projectsFilePath) {
        try {
            const rawProjects = await readJsonFn(projectsFilePath, []);
            const p = (Array.isArray(rawProjects) ? rawProjects : []).find(x => String(x.id) === cleanProjectId);
            if (p) {
                return p.isPrivate === true || (typeof p.visibility === 'string' && p.visibility.toLowerCase() === 'private');
            }
        } catch {}
    }

    return false;
}

/**
 * Checks if a user is authorized to access a private project (owner or team member).
 *
 * @param {string} projectId
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<boolean>}
 */
async function isProjectAuthorized(projectId, userId, options = {}) {
    if (!projectId || !userId) return false;
    const cleanProjectId = String(projectId);
    const cleanUserId = String(userId);
    const { readJsonFn, projectsFilePath, membersFilePath, prismaClient, isDbConnected, isProduction } = options;

    if (prismaClient && (isProduction || (isDbConnected && await isDbConnected()))) {
        try {
            const project = await prismaClient.project.findUnique({
                where: { id: cleanProjectId },
                include: { members: true }
            });
            if (!project) return false;
            if (String(project.ownerId) === cleanUserId) return true;
            if (project.members && project.members.some(m => String(m.userId) === cleanUserId)) return true;
            return false;
        } catch (err) {
            if (isProduction) throw err;
        }
    }

    if (readJsonFn && projectsFilePath) {
        try {
            const rawProjects = await readJsonFn(projectsFilePath, []);
            const project = (Array.isArray(rawProjects) ? rawProjects : []).find(p => String(p.id) === cleanProjectId);
            if (!project) return false;
            if (String(project.ownerId) === cleanUserId) return true;

            if (membersFilePath) {
                const members = await readJsonFn(membersFilePath, []);
                if ((Array.isArray(members) ? members : []).some(m => String(m.projectId) === cleanProjectId && String(m.userId) === cleanUserId)) {
                    return true;
                }
            }
        } catch {}
    }

    return false;
}

/**
 * Validates whether the authenticated user has permissions to modify a resource.
 */
function isResourceOwner(resourceOwnerId, authenticatedUserId) {
    if (!resourceOwnerId || !authenticatedUserId) return false;
    return String(resourceOwnerId) === String(authenticatedUserId);
}

module.exports = {
    checkProjectPrivate,
    isProjectAuthorized,
    isResourceOwner
};
