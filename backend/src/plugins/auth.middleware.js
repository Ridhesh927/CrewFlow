const requireRole = (roles) => {
  return async (request, reply) => {
    // request.user is already populated by fastify.authenticate
    if (!request.user || !roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Forbidden: Insufficient privileges' })
    }
  }
}

// Ensure the target user is a subordinate of the requester
// This requires the request to have a target userId in params.id
// Ensure the target user is a subordinate of the requester using the service layer
const requireHierarchy = async (request, reply) => {
  try {
    // Ensure authentication has run (fastify.authenticate) or verify token here
    if (!request.user) await request.jwtVerify();
    const requesterId = request.user.id;
    const targetUserId = parseInt(request.params.id);
    if (isNaN(targetUserId)) {
      return reply.code(400).send({ error: 'Invalid target user ID' });
    }
    // Allow self-access or admins
    if (requesterId === targetUserId || request.user.role === 'ADMIN') return;
    const { checkUserHierarchy } = require('../services/user.service');
    const isSubordinate = await checkUserHierarchy(requesterId, targetUserId);
    if (!isSubordinate) {
      return reply.code(403).send({ error: 'Forbidden: User is not in your hierarchy' });
    }
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
};

module.exports = { requireRole, requireHierarchy }
