const feedbackController = require('../controllers/feedback.controller');
const { requireRole } = require('../plugins/auth.middleware');
const validate = require('../plugins/validate.middleware');
const { submitFeedbackSchema, updateFeedbackStatusSchema } = require('../schemas/feedback.schema');

async function feedbackRoutes(fastify, options) {
  fastify.post(
    '/', 
    { 
      preValidation: [fastify.authenticate],
      preHandler: [validate(submitFeedbackSchema)]
    }, 
    feedbackController.submitFeedback
  );
  
  fastify.get('/', { preValidation: [fastify.authenticate] }, feedbackController.getFeedback);
  
  fastify.patch(
    '/:id/status',
    { 
      preValidation: [fastify.authenticate, requireRole(['ADMIN'])],
      preHandler: [validate(updateFeedbackStatusSchema)]
    },
    feedbackController.updateFeedbackStatus
  );
}

module.exports = feedbackRoutes;
