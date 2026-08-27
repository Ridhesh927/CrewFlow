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

  fastify.post(
    '/restore/:id',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const result = await auditService.restoreAction(id, request.user);
        return result;
      } catch (error) {
        if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
        request.log.error(error);
        return reply.code(500).send({ success: false, error: 'Internal server error' });
      }
    }
  );
}

module.exports = auditRoutes;
