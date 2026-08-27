const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const crypto = require('crypto');
const emailService = require('./email.service');
const ApiError = require('../plugins/ApiError');
const redis = require('../config/redis');

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
  
  // Store refresh token in Redis with a 7-day expiration
  await redis.set(`refresh_token:${user.id}:${refreshToken}`, 'active', 'EX', 7 * 24 * 60 * 60);
  
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  
  return { accessToken, refreshToken, user: userWithoutPassword };
};

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (idToken, fastifyJwt) => {
  if (!idToken) throw new ApiError(400, 'ID Token is required');

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    throw new ApiError(401, 'Invalid Google token');
  }

  const payload = ticket.getPayload();
  const email = payload.email;

  // Find user by email
  let user = await prisma.user.findUnique({ where: { email } });

  // Map to existing or return error if not allowed to auto-register
  if (!user) {
    // Optionally: auto-register user if domain is @uptoskills.com
    // For now, throw an error if user doesn't exist in our DB
    throw new ApiError(404, 'No account associated with this Google email. Please contact Admin.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been disabled.');
  }

  const { accessToken, refreshToken } = generateTokens(user, fastifyJwt);
  await redis.set(`refresh_token:${user.id}:${refreshToken}`, 'active', 'EX', 7 * 24 * 60 * 60);

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

  // Revoke all active sessions
  const keys = await redis.keys(`refresh_token:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  return { success: true };
};

const refresh = async (currentRefreshToken, fastifyJwt) => {
  if (!currentRefreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  try {
    const decoded = jwt.verify(currentRefreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if the refresh token is valid in Redis
    const tokenStatus = await redis.get(`refresh_token:${decoded.id}:${currentRefreshToken}`);
    if (!tokenStatus) {
      throw new ApiError(401, 'Invalid or expired refresh token in session');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user, fastifyJwt);

    // Replace old refresh token with new one in Redis
    await redis.del(`refresh_token:${decoded.id}:${currentRefreshToken}`);
    await redis.set(`refresh_token:${decoded.id}:${refreshToken}`, 'active', 'EX', 7 * 24 * 60 * 60);

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

  // Revoke all active sessions
  const keys = await redis.keys(`refresh_token:${user.id}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  return { success: true, message: 'Password has been successfully reset' };
};

const logout = async (userId, refreshToken) => {
  if (userId && refreshToken) {
    await redis.del(`refresh_token:${userId}:${refreshToken}`);
  }
};

module.exports = {
  login,
  googleLogin,
  changePassword,
  refresh,
  forgotPassword,
  resetPassword,
  logout
};
