const ratingService = require('../services/rating.service');

const getRatings = async (request, reply) => {
  try {
    const ratings = await ratingService.getRatings(request.user);
    return { success: true, ratings };
  } catch (error) {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  }
};

const createRating = async (request, reply) => {
  try {
    const rating = await ratingService.createRating(request.body, request.user);
    return { success: true, rating };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
};

module.exports = { getRatings, createRating };
