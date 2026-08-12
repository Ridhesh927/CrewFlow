const auditService = require('../services/audit.service');
const { requireRole } = require('../plugins/auth.middleware');

async function auditRoutes(fastify, options) {
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      try {
        const logs = await auditService.getAuditLogs();
        return { success: true, logs };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ success: false, error: 'Internal server error' });
      }
    }
  );
}

module.exports = auditRoutes;
