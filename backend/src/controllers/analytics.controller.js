const analyticsService = require('../services/analytics.service');

async function getUserAnalytics(request, reply) {
  try {
    const { id } = request.params;
    const targetUserId = parseInt(id);
    const requester = request.user;

    const data = await analyticsService.getUserAnalytics(targetUserId, requester);

    reply.send(data);
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function getTeamAnalytics(request, reply) {
  try {
    const requester = request.user;
    const { department } = request.query;

    const analytics = await analyticsService.getTeamAnalytics(requester, department);

    if (analytics.length === 0) {
      return reply.send({ message: 'No users found for analytics', analytics: [] });
    }

    reply.send({ analytics });
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function getTrendsAnalytics(request, reply) {
  try {
    const { userId } = request.params;
    const targetUserId = parseInt(userId);
    const requester = request.user;

    const data = await analyticsService.getTrendsAnalytics(targetUserId, requester);

    reply.send(data);
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function exportAttendanceCsv(request, reply) {
  try {
    const requester = request.user;
    const { startDate, endDate } = request.query;

    const csvData = await analyticsService.exportAttendanceCsv(requester, startDate, endDate);

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="attendance_export.csv"');
    reply.send(csvData);
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

async function exportRatingsCsv(request, reply) {
  try {
    const requester = request.user;
    
    const csvData = await analyticsService.exportRatingsCsv(requester);

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="ratings_export.csv"');
    reply.send(csvData);
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

module.exports = {
  getUserAnalytics,
  getTeamAnalytics,
  getTrendsAnalytics,
  exportAttendanceCsv,
  exportRatingsCsv
};
