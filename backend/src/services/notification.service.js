const prisma = require('../prismaClient');
const emailService = require('./email.service');

/**
 * Creates a notification for a specific user
 * @param {number} userId 
 * @param {string} type 'INFO', 'WARNING', 'SUCCESS'
 * @param {string} message 
 */
const createNotification = async (userId, type, message) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      message
    }
  });

  // Optionally dispatch an email for important notifications (like warnings or success)
  if (type === 'WARNING' || type === 'SUCCESS') {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.email) {
        // We reuse the transporter conceptually, though emailService currently only exposes sendPasswordResetEmail.
        // Let's add a generic sendNotificationEmail to emailService and call it here.
        if (emailService.sendNotificationEmail) {
          await emailService.sendNotificationEmail(user.email, type, message);
        }
      }
    } catch (error) {
      console.error('Failed to send notification email:', error);
    }
  }

  return notification;
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
