const ratingController = require('../controllers/rating.controller')
const { requireRole } = require('../plugins/auth.middleware')
const validate = require('../plugins/validate.middleware')
const { createRatingSchema } = require('../schemas/rating.schema')

async function ratingRoutes(fastify, options) {
  // Get ratings (role-scoped)
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    ratingController.getRatings
  )

  // Create a new rating (managers/captains only)
  fastify.post(
    '/',
    { 
      preValidation: [fastify.authenticate, requireRole(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'])],
      preHandler: [validate(createRatingSchema)]
    },
    ratingController.createRating
  )
}

module.exports = ratingRoutes
