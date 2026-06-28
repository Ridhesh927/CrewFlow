const { createAnnouncement, getAnnouncements, getAllAnnouncements, deleteAnnouncement } = require('../controllers/announcement.controller');
const { requireAuth, requireRole } = require('../plugins/auth.middleware');

async function announcementRoutes(fastify, options) {
  // Create an announcement
  fastify.post('/', { preHandler: [requireAuth, requireRole(['TL', 'SENIOR_TL', 'CAPTAIN', 'ADMIN'])] }, createAnnouncement);

  // Fetch relevant announcements for the logged-in user
  fastify.get('/', { preHandler: [requireAuth] }, getAnnouncements);

  // Fetch all announcements (Admin only)
  fastify.get('/all', { preHandler: [requireAuth, requireRole(['ADMIN'])] }, getAllAnnouncements);

  // Delete an announcement
  fastify.delete('/:id', { preHandler: [requireAuth, requireRole(['TL', 'SENIOR_TL', 'CAPTAIN', 'ADMIN'])] }, deleteAnnouncement);
}

module.exports = announcementRoutes;
