const notificationService = require('../services/notification.service');

const getNotifications = async (request, reply) => {
  const userId = request.user.id;
  const notifications = await notificationService.getNotifications(userId);
  return { success: true, notifications };
};

const markAsRead = async (request, reply) => {
  const userId = request.user.id;
  const notificationId = parseInt(request.params.id);
  await notificationService.markAsRead(notificationId, userId);
  return { success: true };
};

const markAllAsRead = async (request, reply) => {
  const userId = request.user.id;
  await notificationService.markAllAsRead(userId);
  return { success: true };
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
