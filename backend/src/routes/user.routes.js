const userController = require('../controllers/user.controller')
const { requireRole, requireHierarchy } = require('../plugins/auth.middleware')
const validate = require('../plugins/validate.middleware')
const { createUserSchema, updateUserSchema } = require('../schemas/user.schema')

async function userRoutes(fastify, options) {
  fastify.get('/leaderboard', { preValidation: [fastify.authenticate] }, userController.getLeaderboard)
  fastify.get('/:id/dashboard', { preValidation: [fastify.authenticate] }, userController.getDashboardData)

  fastify.get('/', { preValidation: [fastify.authenticate] }, userController.getAllUsers)
  fastify.get('/:id', { preValidation: [fastify.authenticate] }, userController.getUserById)
  
  fastify.put(
    '/:id',
    { 
      preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL'])],
      preHandler: [validate(updateUserSchema)]
    },
    userController.updateUser
  )

  fastify.patch(
    '/:id/profile',
    { preValidation: [fastify.authenticate] },
    userController.updateProfile
  )

  fastify.put(
    '/bulk-department',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    userController.bulkUpdateDepartment
  )

  fastify.post(
    '/',
    { 
      preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'])],
      preHandler: [validate(createUserSchema)]
    },
    userController.createUser
  )

  fastify.post(
    '/bulk-upload',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    userController.bulkUploadUsers
  )

  fastify.put(
    '/:id/promote',
    { preValidation: [fastify.authenticate, requireHierarchy] },
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
