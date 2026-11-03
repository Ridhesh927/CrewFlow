const { z } = require('zod');

const createLeaveRequestSchema = z.object({
  body: z.object({
    startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/)),
    endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/)),
    reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(1000, 'Reason cannot exceed 1000 characters'),
  })
});

module.exports = { createLeaveRequestSchema };
