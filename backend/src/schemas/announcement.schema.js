const { z } = require('zod');

const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    targetRole: z.enum(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN', 'INTERN', 'ALL']).optional().nullable(),
    targetDepartment: z.string().optional().nullable(),
  })
});

module.exports = { createAnnouncementSchema };
