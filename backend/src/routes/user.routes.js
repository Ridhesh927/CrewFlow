const userController = require('../controllers/user.controller')
const { requireRole, requireHierarchy } = require('../plugins/auth.middleware')

async function userRoutes(fastify, options) {
  fastify.get('/leaderboard', { preValidation: [fastify.authenticate] }, userController.getLeaderboard)
  fastify.get('/:id/dashboard', { preValidation: [fastify.authenticate] }, userController.getDashboardData)

  fastify.get('/', { preValidation: [fastify.authenticate] }, userController.getAllUsers)
  
  fastify.post(
    '/',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'])] },
    userController.createUser
  )

  fastify.put(
    '/:id/promote',
    { preValidation: [requireHierarchy] },
    userController.promoteUser
  )

  fastify.put(
    '/:id/status',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    userController.toggleUserStatus
  )

  fastify.delete(
    '/:id',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    userController.deleteUser
  )
}

module.exports = userRoutes
