const leaveService = require('../services/leave.service');

async function createLeaveRequest(request, reply) {
  try {
    const { startDate, endDate, reason } = request.body;
    const userId = request.user.id;

    const leaveRequest = await leaveService.createLeaveRequest(userId, startDate, endDate, reason);

    reply.code(201).send({ message: 'Leave request created successfully', leaveRequest });
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function getLeaveRequests(request, reply) {
  try {
    const leaveRequests = await leaveService.getLeaveRequests(request.user);
    reply.send({ leaveRequests });
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function approveLeaveRequest(request, reply) {
  try {
    const { id } = request.params;
    const leaveRequest = await leaveService.approveLeaveRequest(id, request.user);

    reply.send({ message: 'Leave request approved', leaveRequest });
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function rejectLeaveRequest(request, reply) {
  try {
    const { id } = request.params;
    const leaveRequest = await leaveService.rejectLeaveRequest(id, request.user);

    reply.send({ message: 'Leave request rejected', leaveRequest });
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest
};
