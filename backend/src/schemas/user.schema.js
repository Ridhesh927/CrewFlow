const { z } = require('zod');

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN', 'INTERN']),
    department: z.string().min(2, 'Department is required'),
    specialId: z.string().optional(),
    phoneNo: z.string().optional(),
    managerId: z.number().int().positive().optional().nullable(),
  })
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    role: z.enum(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN', 'INTERN']).optional(),
    department: z.string().min(2).optional(),
    specialId: z.string().optional(),
    phoneNo: z.string().optional(),
    managerId: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional(),
  })
});

module.exports = { createUserSchema, updateUserSchema };
