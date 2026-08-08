const ratingService = require('../services/rating.service');

const getRatings = async (request, reply) => {
  try {
    const ratings = await ratingService.getRatings(request.user);
    return { success: true, ratings };
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
}

module.exports = { getRatings }
