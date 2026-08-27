const userService = require('../services/user.service');
const auditService = require('../services/audit.service');

const getDashboardData = async (request, reply) => {
  const { id } = request.params;
  const userId = parseInt(id);
  
  try {
    const data = await userService.getDashboardData(userId);
    return { success: true, ...data };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

const createUser = async (request, reply) => {
  const managerId = request.user.id; // The creator is the manager

  try {
    const user = await userService.createUser(request.body, managerId);
    
    await auditService.logAction({
      userId: managerId,
      action: 'USER_CREATED',
      resource: 'User',
      resourceId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: request.ip
    });

    return { success: true, user };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

const getAllUsers = async (request, reply) => {
  const currentUserId = request.user.id;
  
  try {
    const users = await userService.getAllUsers(currentUserId);
    return { success: true, users };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

const promoteUser = async (request, reply) => {
  const targetUserId = parseInt(request.params.id);
  const { newRole } = request.body;
  const requesterRole = request.user.role;

  try {
    const user = await userService.promoteUser(targetUserId, newRole, requesterRole);

    await auditService.logAction({
      userId: request.user.id,
      action: 'USER_PROMOTED',
      resource: 'User',
      resourceId: user.id,
      details: { newRole },
      ipAddress: request.ip
    });

    return { success: true, user };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

const getLeaderboard = async (request, reply) => {
  try {
    const leaderboard = await userService.getLeaderboard();
    return { success: true, leaderboard };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

const toggleUserStatus = async (request, reply) => {
  const userId = parseInt(request.params.id);
  
  try {
    const isActive = await userService.toggleUserStatus(userId);

    await auditService.logAction({
      userId: request.user.id,
      action: 'USER_STATUS_TOGGLED',
      resource: 'User',
      resourceId: userId,
      details: { isActive },
      ipAddress: request.ip
    });

    return { success: true, isActive };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

const deleteUser = async (request, reply) => {
  const userId = parseInt(request.params.id);
  
  try {
    await userService.deleteUser(userId, request.user);
    return { success: true };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

const getUserById = async (request, reply) => {
  const userId = parseInt(request.params.id);
  try {
    const user = await userService.getUserById(userId);
    return { success: true, user };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
}

const updateUser = async (request, reply) => {
  const targetUserId = parseInt(request.params.id);
  const requester = request.user;
  try {
    const user = await userService.updateUser(targetUserId, request.body, requester);
    return { success: true, user };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
}

const updateProfile = async (request, reply) => {
  const userId = parseInt(request.params.id);
  const requester = request.user;
  try {
    const user = await userService.updateProfile(userId, request.body, requester);
    return { success: true, user };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
}

const bulkUpdateDepartment = async (request, reply) => {
  const { userIds, department } = request.body;
  const requester = request.user;
  
  try {
    const result = await userService.bulkUpdateDepartment(userIds, department, requester.id);
    
    await auditService.logAction({
      userId: requester.id,
      action: 'USERS_DEPARTMENT_UPDATED',
      resource: 'User',
      details: { updatedCount: result.updatedCount, newDepartment: department },
      ipAddress: request.ip
    });

    return { success: true, ...result };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
}

const bulkUploadUsers = async (request, reply) => {
  const data = await request.file();
  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }
  
  const requesterId = request.user.id;
  try {
    const result = await userService.bulkUploadUsers(data.file, requesterId);
    
    await auditService.logAction({
      userId: requesterId,
      action: 'USERS_BULK_UPLOADED',
      resource: 'User',
      details: { count: result.count },
      ipAddress: request.ip
    });

    return { success: true, count: result.count, errors: result.errors };
  } catch (error) {
    if (error.statusCode) return reply.code(error.statusCode).send({ error: error.message });
    throw error;
  }
}

module.exports = { getDashboardData, createUser, promoteUser, getLeaderboard, getAllUsers, toggleUserStatus, deleteUser, getUserById, updateUser, updateProfile, bulkUpdateDepartment, bulkUploadUsers }
