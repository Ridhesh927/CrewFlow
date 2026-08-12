const notificationController = require('../controllers/notification.controller')

async function notificationRoutes(fastify, options) {
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    notificationController.getNotifications
  )

  fastify.put(
    '/:id/read',
    { preValidation: [fastify.authenticate] },
    notificationController.markAsRead
  )

  fastify.put(
    '/read-all',
    { preValidation: [fastify.authenticate] },
    notificationController.markAllAsRead
  )
}

module.exports = notificationRoutes
