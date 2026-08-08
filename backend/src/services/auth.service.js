const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../plugins/prisma');
const ApiError = require('../plugins/ApiError');

const generateTokens = (user, fastifyJwt) => {
  const accessToken = fastifyJwt.sign({ id: user.id, role: user.role }, { expiresIn: '15m' });
  
  const refreshToken = jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', 
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
  
  const isMatch = await bcrypt.compare(password, user.password);
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

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new ApiError(400, 'Incorrect current password');

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

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
    const decoded = jwt.verify(currentRefreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
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

module.exports = {
  login,
  changePassword,
  refresh
};
