const { z } = require('zod');

const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters'),
    description: z.string().optional(),
    managerId: z.number().int().positive().optional().nullable(),
  })
});

const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    code: z.string().min(2, 'Code must be at least 2 characters').optional(),
    description: z.string().optional(),
    managerId: z.number().int().positive().optional().nullable(),
  })
});

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema
};
