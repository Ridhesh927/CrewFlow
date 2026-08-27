const { z } = require('zod');

const submitFeedbackSchema = z.object({
  body: z.object({
    type: z.string().min(1, 'Type is required'),
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
  })
});

const updateFeedbackStatusSchema = z.object({
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    adminNotes: z.string().optional(),
  })
});

module.exports = {
  submitFeedbackSchema,
  updateFeedbackStatusSchema
};
