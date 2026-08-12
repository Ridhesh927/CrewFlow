const prisma = require('../plugins/prisma');

/**
 * Creates a notification for a specific user
 * @param {number} userId 
 * @param {string} type 'INFO', 'WARNING', 'SUCCESS'
 * @param {string} message 
 */
const createNotification = async (userId, type, message) => {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      message
    }
  });
};

/**
 * Gets all notifications for a user, sorted newest first
 * @param {number} userId 
 */
const getNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Marks a specific notification as read
 * @param {number} notificationId 
 * @param {number} userId 
 */
const markAsRead = async (notificationId, userId) => {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true }
  });
};

/**
 * Marks all notifications as read for a user
 * @param {number} userId 
 */
const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true }
  });
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
};
