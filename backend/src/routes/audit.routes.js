const auditController = require('../controllers/audit.controller');
const { requireRole } = require('../plugins/auth.middleware');

async function auditRoutes(fastify, options) {
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    auditController.getAuditLogs
  );

  fastify.post(
    '/restore/:id',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    auditController.restoreAction
  );
}

module.exports = auditRoutes;
