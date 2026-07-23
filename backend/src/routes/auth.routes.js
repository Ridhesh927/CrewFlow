const authController = require('../controllers/auth.controller')

async function authRoutes(fastify, options) {
  fastify.post('/login', authController.login)
  fastify.post('/change-password', { preValidation: [fastify.authenticate] }, authController.changePassword)
}

module.exports = authRoutes
