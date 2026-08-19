const authController = require('../controllers/auth.controller')
const validate = require('../plugins/validate.middleware')
const { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } = require('../schemas/auth.schema')

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
  
  fastify.post('/forgot-password', {
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } },
    preHandler: [validate(forgotPasswordSchema)]
  }, authController.forgotPassword)
  
  fastify.post('/reset-password', {
    preHandler: [validate(resetPasswordSchema)]
  }, authController.resetPassword)
}

module.exports = authRoutes
