/*
 * ==============================================================================
 * CodeCollab Notification Management Service
 * ==============================================================================
 * Centralized service for dispatching, retrieving, and updating notifications.
 * Backed by Supabase PostgreSQL (via Prisma ORM) with atomic JSON storage fallback.
 * Ensures data integrity, concurrency protection, and zero email leakage.
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readJson, modifyJson } = require('../storage/jsonStorage');

const NOTIFICATIONS_FILE = path.join(__dirname, '..', '..', 'codecollab data', 'notifications.json');

/**
 * Sanitizes notification records to prevent PII / email leakage.
 */
function sanitizeNotification(n) {
    if (!n) return null;
    return {
        id: n.id,
        userId: String(n.userId),
        actorId: n.actorId ? String(n.actorId) : null,
        actor: n.actor ? {
            id: String(n.actor.id),
            name: n.actor.profile?.firstName ? `${n.actor.profile.firstName} ${n.actor.profile.lastName || ''}`.trim() : 'Collaborator',
            avatarUrl: n.actor.profile?.avatarUrl || ''
        } : null,
        projectId: n.projectId ? String(n.projectId) : null,
        project: n.project ? { id: n.project.id, title: n.project.title } : undefined,
        type: n.type || 'SYSTEM',
        title: n.title || 'Notification',
        message: n.message || n.content || '',
        data: n.data || {},
        read: Boolean(n.read),
        createdAt: n.createdAt
    };
}

class NotificationService {
    constructor(prismaClient, isDbConnectedFn) {
        this.prisma = prismaClient;
        this.isDbConnected = isDbConnectedFn;
    }

    /**
     * Creates and persists a new notification for a target user.
     */
    async createNotification({ userId, actorId = null, projectId = null, type = 'SYSTEM', title = 'Notification', message = '', data = {} }) {
        if (!userId) return null;
        const targetUserId = String(userId);
        const notificationRecord = {
            id: `notif_${Date.now()}_${uuidv4().substring(0, 8)}`,
            userId: targetUserId,
            actorId: actorId ? String(actorId) : null,
            projectId: projectId ? String(projectId) : null,
            type: type || 'SYSTEM',
            title: title || 'Notification',
            message: message || '',
            data: data || {},
            read: false,
            createdAt: new Date().toISOString()
        };

        if (this.prisma && (await this.isDbConnected())) {
            try {
                await this.prisma.notification.create({
                    data: {
                        id: notificationRecord.id,
                        userId: targetUserId,
                        actorId: notificationRecord.actorId,
                        projectId: notificationRecord.projectId,
                        type: notificationRecord.type,
                        title: notificationRecord.title,
                        message: notificationRecord.message,
                        data: notificationRecord.data,
                        read: false
                    }
                });
                return notificationRecord;
            } catch (err) {
                console.warn('[NotificationService DB Warning]:', err.message);
            }
        }

        // Atomic file fallback with concurrency lock
        await modifyJson(NOTIFICATIONS_FILE, (notifs = []) => {
            const list = Array.isArray(notifs) ? notifs : [];
            list.unshift(notificationRecord);
            return list;
        }, []);

        return notificationRecord;
    }

    /**
     * Lists all notifications for a specific user.
     */
    async getUserNotifications(userId) {
        const targetUserId = String(userId);

        if (this.prisma && (await this.isDbConnected())) {
            try {
                const dbNotifs = await this.prisma.notification.findMany({
                    where: { userId: targetUserId },
                    include: {
                        actor: { include: { profile: true } },
                        project: true
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return dbNotifs.map(sanitizeNotification);
            } catch (err) {
                console.warn('[NotificationService List DB Warning]:', err.message);
            }
        }

        const notifs = await readJson(NOTIFICATIONS_FILE, []);
        const userNotifs = notifs.filter(n => String(n.userId) === targetUserId);
        return userNotifs.map(sanitizeNotification);
    }

    /**
     * Retrieves unread notifications for a specific user.
     */
    async getUnreadNotifications(userId) {
        const targetUserId = String(userId);

        if (this.prisma && (await this.isDbConnected())) {
            try {
                const unread = await this.prisma.notification.findMany({
                    where: { userId: targetUserId, read: false },
                    include: {
                        actor: { include: { profile: true } },
                        project: true
                    },
                    orderBy: { createdAt: 'desc' }
                });
                return unread.map(sanitizeNotification);
            } catch (err) {
                console.warn('[NotificationService Unread DB Warning]:', err.message);
            }
        }

        const notifs = await readJson(NOTIFICATIONS_FILE, []);
        const userUnread = notifs.filter(n => String(n.userId) === targetUserId && !n.read);
        return userUnread.map(sanitizeNotification);
    }

    /**
     * Marks a single notification as read, ensuring strict ownership authorization.
     */
    async markAsRead(notificationId, userId) {
        const targetUserId = String(userId);
        const notifId = String(notificationId);

        if (this.prisma && (await this.isDbConnected())) {
            try {
                const notif = await this.prisma.notification.findUnique({ where: { id: notifId } });
                if (!notif) return { status: 404, error: 'Notification not found' };
                if (String(notif.userId) !== targetUserId) return { status: 403, error: 'Not authorized to modify this notification' };

                const updated = await this.prisma.notification.update({
                    where: { id: notifId },
                    data: { read: true }
                });
                return { status: 200, notification: sanitizeNotification(updated) };
            } catch (err) {
                console.warn('[NotificationService MarkRead DB Warning]:', err.message);
            }
        }

        let result = { status: 404, error: 'Notification not found' };
        await modifyJson(NOTIFICATIONS_FILE, (notifs = []) => {
            const list = Array.isArray(notifs) ? notifs : [];
            const index = list.findIndex(n => String(n.id) === notifId);
            if (index === -1) return list;

            if (String(list[index].userId) !== targetUserId) {
                result = { status: 403, error: 'Not authorized to modify this notification' };
                return list;
            }

            list[index].read = true;
            result = { status: 200, notification: sanitizeNotification(list[index]) };
            return list;
        }, []);

        return result;
    }

    /**
     * Marks all notifications as read for a given user.
     */
    async markAllAsRead(userId) {
        const targetUserId = String(userId);

        if (this.prisma && (await this.isDbConnected())) {
            try {
                await this.prisma.notification.updateMany({
                    where: { userId: targetUserId, read: false },
                    data: { read: true }
                });
                return { success: true, message: 'All notifications marked as read' };
            } catch (err) {
                console.warn('[NotificationService MarkAllRead DB Warning]:', err.message);
            }
        }

        await modifyJson(NOTIFICATIONS_FILE, (notifs = []) => {
            const list = Array.isArray(notifs) ? notifs : [];
            return list.map(n => {
                if (String(n.userId) === targetUserId) {
                    return { ...n, read: true };
                }
                return n;
            });
        }, []);

        return { success: true, message: 'All notifications marked as read' };
    }

    /**
     * Deletes a notification, verifying user ownership.
     */
    async deleteNotification(notificationId, userId) {
        const targetUserId = String(userId);
        const notifId = String(notificationId);

        if (this.prisma && (await this.isDbConnected())) {
            try {
                const notif = await this.prisma.notification.findUnique({ where: { id: notifId } });
                if (!notif) return { status: 404, error: 'Notification not found' };
                if (String(notif.userId) !== targetUserId) return { status: 403, error: 'Not authorized to delete this notification' };

                await this.prisma.notification.delete({ where: { id: notifId } });
                return { status: 200, success: true, message: 'Notification deleted' };
            } catch (err) {
                console.warn('[NotificationService Delete DB Warning]:', err.message);
            }
        }

        let result = { status: 404, error: 'Notification not found' };
        await modifyJson(NOTIFICATIONS_FILE, (notifs = []) => {
            const list = Array.isArray(notifs) ? notifs : [];
            const index = list.findIndex(n => String(n.id) === notifId);
            if (index === -1) return list;

            if (String(list[index].userId) !== targetUserId) {
                result = { status: 403, error: 'Not authorized to delete this notification' };
                return list;
            }

            list.splice(index, 1);
            result = { status: 200, success: true, message: 'Notification deleted' };
            return list;
        }, []);

        return result;
    }
}

module.exports = {
    NotificationService,
    sanitizeNotification
};
