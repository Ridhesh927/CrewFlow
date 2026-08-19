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

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(/[\W_]/, 'Password must contain at least one special character'),
  })
});

module.exports = { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema };
