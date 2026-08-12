const authController = require('../controllers/auth.controller')
const validate = require('../plugins/validate.middleware')
const { loginSchema, changePasswordSchema } = require('../schemas/auth.schema')

async function authRoutes(fastify, options) {
  fastify.post('/login', { 
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    },
    preHandler: [validate(loginSchema)] 
  }, authController.login)
  fastify.post('/refresh', authController.refresh)
  fastify.post('/logout', authController.logout)
  fastify.post('/change-password', { preValidation: [fastify.authenticate], preHandler: [validate(changePasswordSchema)] }, authController.changePassword)
}

module.exports = authRoutes
