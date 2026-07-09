const { getUserAnalytics, getTeamAnalytics } = require('../controllers/analytics.controller');
const { requireRole } = require('../plugins/auth.middleware');

async function analyticsRoutes(fastify, options) {
  // Fetch personal or subordinate analytics
  fastify.get('/user/:id', { preValidation: [fastify.authenticate] }, getUserAnalytics);

  // Fetch team analytics
  fastify.get('/team', { preValidation: [fastify.authenticate, requireRole(['TL', 'SENIOR_TL', 'CAPTAIN', 'ADMIN'])] }, getTeamAnalytics);
}

module.exports = analyticsRoutes;
