const { createLeaveRequest, getLeaveRequests, approveLeaveRequest, rejectLeaveRequest } = require('../controllers/leave.controller');
const { requireRole } = require('../plugins/auth.middleware');

async function leaveRoutes(fastify, options) {
  // Submit a leave request
  fastify.post('/', { preValidation: [fastify.authenticate] }, createLeaveRequest);

  // Fetch leave requests
  fastify.get('/', { preValidation: [fastify.authenticate] }, getLeaveRequests);

  // Approve a leave request
  fastify.put('/:id/approve', { preValidation: [fastify.authenticate, requireRole(['TL', 'SENIOR_TL', 'CAPTAIN', 'ADMIN'])] }, approveLeaveRequest);

  // Reject a leave request
  fastify.put('/:id/reject', { preValidation: [fastify.authenticate, requireRole(['TL', 'SENIOR_TL', 'CAPTAIN', 'ADMIN'])] }, rejectLeaveRequest);
}

module.exports = leaveRoutes;
