const feedbackController = require('../controllers/feedback.controller');
const { requireRole } = require('../plugins/auth.middleware');

async function feedbackRoutes(fastify, options) {
  fastify.post('/', { preValidation: [fastify.authenticate] }, feedbackController.submitFeedback);
  
  fastify.get('/', { preValidation: [fastify.authenticate] }, feedbackController.getFeedback);
  
  fastify.patch(
    '/:id/status',
    { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] },
    feedbackController.updateFeedbackStatus
  );
}

module.exports = feedbackRoutes;
