const { z } = require('zod');

const markAttendanceSchema = z.object({
  body: z.object({
    targetUserId: z.number().int().positive(),
    date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/)),
    status: z.enum(['Present', 'Absent', 'Leave', 'Informed', 'Late', 'Completed', 'Terminated', 'Discontinued']),
    remarks: z.string().optional().nullable(),
  })
});

module.exports = { markAttendanceSchema };
