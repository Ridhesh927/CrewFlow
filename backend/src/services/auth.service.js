const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const crypto = require('crypto');
const emailService = require('./email.service');
const ApiError = require('../plugins/ApiError');

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('FATAL: JWT_REFRESH_SECRET environment variable is not defined.');
}

const generateTokens = (user, fastifyJwt) => {
  const accessToken = fastifyJwt.sign({ id: user.id, role: user.role }, { expiresIn: '15m' });
  
  const refreshToken = jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const login = async (identifier, password, fastifyJwt) => {
  if (!identifier) {
    throw new ApiError(400, 'Email or ID is required');
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { specialId: identifier }
      ]
    }
  });
  
  if (!user) throw new ApiError(404, 'User not found');
  
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been disabled. Please contact your admin.');
  }
  
  let isMatch;
  try {
    isMatch = await argon2.verify(user.password, password);
  } catch (err) {
    // If the hash format is invalid for argon2 (e.g., an old bcrypt hash and we don't have a fallback), it throws.
    // For MVP, we catch it and it stays false. 
    isMatch = false;
  }
  
  if (!isMatch) throw new ApiError(401, 'Invalid password');

  const { accessToken, refreshToken } = generateTokens(user, fastifyJwt);
  
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  
  return { accessToken, refreshToken, user: userWithoutPassword };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) throw new ApiError(404, 'User not found');

  let isMatch;
  try {
    isMatch = await argon2.verify(user.password, currentPassword);
  } catch (err) {
    isMatch = false;
  }

  if (!isMatch) throw new ApiError(401, 'Incorrect current password');

  const hashedNewPassword = await argon2.hash(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword }
  });

  return { success: true };
};

const refresh = async (currentRefreshToken, fastifyJwt) => {
  if (!currentRefreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  try {
    const decoded = jwt.verify(currentRefreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const { accessToken, refreshToken } = generateTokens(user, fastifyJwt);

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};

const forgotPassword = async (email) => {
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !user.isActive) {
    // Return success even if user not found to prevent email enumeration
    return { success: true, message: 'If an account with that email exists, a reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { email },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: tokenExpiry
    }
  });

  await emailService.sendPasswordResetEmail(email, resetToken);

  return { success: true, message: 'If an account with that email exists, a reset link has been sent.' };
};

const resetPassword = async (token, newPassword) => {
  if (!token || !newPassword) throw new ApiError(400, 'Token and new password are required');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  const hashedNewPassword = await argon2.hash(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedNewPassword,
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  return { success: true, message: 'Password has been successfully reset' };
};

module.exports = {
  login,
  changePassword,
  refresh,
  forgotPassword,
  resetPassword
};
