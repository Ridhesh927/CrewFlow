const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format').optional(),
    identifier: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  }).refine(data => data.email || data.identifier, {
    message: "Either email or identifier must be provided",
    path: ["email"]
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  })
});

module.exports = { loginSchema, changePasswordSchema };
