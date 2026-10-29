const auditService = require('../services/audit.service');

const getAuditLogs = async (request, reply) => {
  try {
    if (request.user?.role !== 'ADMIN') {
      return reply.code(403).send({ success: false, error: 'Access denied. Administrator privileges required.' });
    }
    const { page, limit, action, resource } = request.query || {};
    const result = await auditService.getAuditLogs({ page, limit, action, resource });
    return {
      success: true,
      logs: result.logs,
      pagination: result.pagination
    };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    request.log.error(error);
    return reply.code(500).send({ success: false, error: 'Internal server error' });
  }
};

const restoreAction = async (request, reply) => {
  try {
    const { id } = request.params;
    const result = await auditService.restoreAction(id, request.user);
    return result;
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    request.log.error(error);
    return reply.code(500).send({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getAuditLogs,
  restoreAction
};
