const auditService = require('../services/audit.service');

const getAuditLogs = async (request, reply) => {
  try {
    const logs = await auditService.getAuditLogs();
    return { success: true, logs };
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
