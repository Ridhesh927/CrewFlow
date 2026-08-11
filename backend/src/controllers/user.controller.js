const userService = require('../services/user.service');

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
    await userService.deleteUser(userId);
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

module.exports = { getDashboardData, createUser, promoteUser, getLeaderboard, getAllUsers, toggleUserStatus, deleteUser, getUserById, updateUser, updateProfile }
