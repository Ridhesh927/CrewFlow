const { z } = require('zod');

const createRatingSchema = z.object({
  body: z.object({
    userId: z.number().int().positive(),
    rating: z.number().min(1).max(5),
    comments: z.string().min(1, 'Comments are required'),
    month: z.string().min(1, 'Month is required'),
  })
});

module.exports = { createRatingSchema };
