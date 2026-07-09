const { createAnnouncement, getAnnouncements, getAllAnnouncements, deleteAnnouncement } = require('../controllers/announcement.controller');
const { requireRole } = require('../plugins/auth.middleware');

async function announcementRoutes(fastify, options) {
  // Create an announcement
  fastify.post('/', { preValidation: [fastify.authenticate, requireRole(['TL', 'SENIOR_TL', 'CAPTAIN', 'ADMIN'])] }, createAnnouncement);

  // Fetch relevant announcements for the logged-in user
  fastify.get('/', { preValidation: [fastify.authenticate] }, getAnnouncements);

  // Fetch all announcements (Admin only)
  fastify.get('/all', { preValidation: [fastify.authenticate, requireRole(['ADMIN'])] }, getAllAnnouncements);

  // Delete an announcement
  fastify.delete('/:id', { preValidation: [fastify.authenticate, requireRole(['TL', 'SENIOR_TL', 'CAPTAIN', 'ADMIN'])] }, deleteAnnouncement);
}

module.exports = announcementRoutes;
