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
  }).strict()
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    department: z.string().min(2).optional(),
    specialId: z.string().optional(),
    phoneNo: z.string().optional(),
    managerId: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional(),
  }).strict()
});

const updateProfileSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be numeric'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phoneNo: z.string().optional(),
  }).strict()
});

const promoteUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be numeric'),
  }),
  body: z.object({
    newRole: z.enum(['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN', 'INTERN'], {
      message: 'Invalid role provided for promotion',
    }),
  }),
});

module.exports = { createUserSchema, updateUserSchema, updateProfileSchema, promoteUserSchema };
