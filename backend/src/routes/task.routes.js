const taskController = require('../controllers/task.controller')
const { requireRole } = require('../plugins/auth.middleware')

async function taskRoutes(fastify, options) {
  // Get all tasks (role-scoped)
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    taskController.getTasks
  )

  // Create a new task (managers only)
  fastify.post(
    '/',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'])] },
    taskController.createTask
  )

  // Get pending proofs for verification (managers only)
  fastify.get(
    '/proofs/pending',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'])] },
    taskController.getPendingProofs
  )

  // Submit proof with image upload (interns only)
  fastify.post(
    '/proofs',
    { preValidation: [fastify.authenticate, requireRole(['INTERN'])] },
    taskController.fillTaskSheet
  )

  // Approve a proof
  fastify.put(
    '/proofs/:id/approve',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'])] },
    taskController.approveProof
  )

  // Reject a proof
  fastify.put(
    '/proofs/:id/reject',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'])] },
    taskController.rejectProof
  )
}

module.exports = taskRoutes
