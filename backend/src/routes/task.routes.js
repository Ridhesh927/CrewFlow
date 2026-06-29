const taskController = require('../controllers/task.controller')
const { requireRole } = require('../plugins/auth.middleware')

async function taskRoutes(fastify, options) {
  fastify.post(
    '/',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'])] },
    taskController.createTask
  )
  
  fastify.post(
    '/proofs',
    { preValidation: [fastify.authenticate, requireRole(['INTERN'])] },
    taskController.fillTaskSheet
  )
  fastify.put(
    '/proofs/:id/approve',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'])] },
    taskController.approveProof
  )
}

module.exports = taskRoutes
