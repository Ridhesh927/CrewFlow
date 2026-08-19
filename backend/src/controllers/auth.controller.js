const authService = require('../services/auth.service');
const auditService = require('../services/audit.service');

const login = async (request, reply) => {
  const { identifier, email, password } = request.body;
  const loginIdentifier = (identifier || email || '').trim();

  try {
    const { accessToken, refreshToken, user } = await authService.login(loginIdentifier, password, request.server.jwt);
    
    await auditService.logAction({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user.id,
      ipAddress: request.ip
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });

    return { success: true, token: accessToken, user };
  } catch (error) {
    await auditService.logAction({
      action: 'FAILED_LOGIN',
      resource: 'User',
      details: { identifier: loginIdentifier, reason: error.message },
      ipAddress: request.ip
    });

    throw error;
  }
}

const changePassword = async (request, reply) => {
  const { currentPassword, newPassword } = request.body;
  const userId = request.user.id;

  try {
    await authService.changePassword(userId, currentPassword, newPassword);
    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

const refresh = async (request, reply) => {
  const currentRefreshToken = request.cookies.refreshToken;

  try {
    const { accessToken, refreshToken } = await authService.refresh(currentRefreshToken, request.server.jwt);
    
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });

    return { success: true, token: accessToken };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

const logout = async (request, reply) => {
  reply.clearCookie('refreshToken', {
    path: '/'
  });
  return { success: true, message: 'Logged out successfully' };
}

const forgotPassword = async (request, reply) => {
  const { email } = request.body;
  try {
    const result = await authService.forgotPassword(email);
    return result;
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
};

const resetPassword = async (request, reply) => {
  const { token, newPassword } = request.body;
  try {
    const result = await authService.resetPassword(token, newPassword);
    return result;
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
};

module.exports = { login, changePassword, refresh, logout, forgotPassword, resetPassword }
