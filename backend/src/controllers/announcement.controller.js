const announcementService = require('../services/announcement.service');

async function createAnnouncement(request, reply) {
  try {
    const announcement = await announcementService.createAnnouncement(request.body, request.user);
    reply.code(201).send({ message: 'Announcement created successfully', announcement });
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function getAnnouncements(request, reply) {
  try {
    const announcements = await announcementService.getAnnouncements(request.user);
    reply.send({ announcements });
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function getAllAnnouncements(request, reply) {
  try {
    const announcements = await announcementService.getAllAnnouncements();
    reply.send({ announcements });
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function deleteAnnouncement(request, reply) {
  try {
    const { id } = request.params;
    await announcementService.deleteAnnouncement(id, request.user);
    reply.send({ message: 'Announcement deleted successfully' });
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAllAnnouncements,
  deleteAnnouncement
};
