const argon2 = require('argon2');
const prisma = require('../prismaClient');
const ApiError = require('../plugins/ApiError');
const redis = require('../config/redis');

const getDashboardData = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subordinates: true,
      attendances: true,
      proofs: true,
      ratingsGot: true,
      department: true
    }
  });
  
  if (!user) throw new ApiError(404, 'User not found');

  let pendingProofs = [];
  if (['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'].includes(user.role)) {
    const subIds = user.subordinates.map(s => s.id);
    pendingProofs = await prisma.proof.findMany({
      where: { internId: { in: subIds }, status: 'Pending' },
      include: { task: { include: { subTasks: true } }, intern: true }
    });
  }

  let taskQuery = { status: 'Active' };
  
  if (user.role === 'INTERN') {
    taskQuery.OR = [
      { targetAudience: 'All' },
      { targetAudience: user.department || 'All' }
    ];
  }

  const activeTasks = await prisma.task.findMany({
    where: taskQuery,
    include: { subTasks: true }
  });

  let adminStats = null;
  if (user.role === 'ADMIN') {
    const allUsers = await prisma.user.findMany({ select: { role: true, department: true, isActive: true } });
    const pendingLeavesCount = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    
    const usersByRole = allUsers.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});
    
    const departments = new Set(allUsers.filter(u => u.department).map(u => u.department));
    const activeInterns = allUsers.filter(u => u.role === 'INTERN' && u.isActive).length;

    adminStats = {
      usersByRole,
      totalDepartments: departments.size,
      activeInterns,
      pendingLeaves: pendingLeavesCount
    };
  }

  const mappedUser = { ...user, department: user.department };

  return { user: mappedUser, pendingProofs, activeTasks, adminStats };
};

const createUser = async (userData, managerId) => {
  const { email, password, name, department, role, specialId, phoneNo } = userData;
  const cleanEmail = email.trim();

  const existingEmail = await prisma.user.findUnique({
    where: { email: cleanEmail }
  });
  if (existingEmail) {
    throw new ApiError(400, 'Email already exists');
  }

  if (specialId) {
    const existingSpecialId = await prisma.user.findUnique({
      where: { specialId }
    });
    if (existingSpecialId) {
      throw new ApiError(400, 'Special ID already exists. It must be unique.');
    }
  }

  const hashedPassword = await argon2.hash(password);

  const newUser = await prisma.user.create({
    data: {
      email: cleanEmail,
      password: hashedPassword,
      name,
      department,
      role: role || 'INTERN',
      specialId,
      phoneNo,
      managerId
    }
  });

  const userWithoutPassword = { ...newUser };
  delete userWithoutPassword.password;
  
  return userWithoutPassword;
};

const getAllUsers = async (currentUserId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const currentUserRecord = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { role: true, department: true }
  });

  let whereClause = {};

  if (currentUserRecord && currentUserRecord.role !== 'ADMIN' && currentUserRecord.departmentId) {
    whereClause.departmentId = currentUserRecord.departmentId;
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    skip: skip,
    take: limit,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      specialId: true,
      phoneNo: true,
      isActive: true,
      points: true,
      manager: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  const mappedUsers = users.map(u => ({
    ...u,
    department: u.department?.name || null
  }));
  
  return mappedUsers;
};

const promoteUser = async (targetUserId, newRole, requesterRole) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId }
  });

  if (!targetUser) throw new ApiError(404, 'User not found');

  if (newRole === 'CAPTAIN') {
    if (!['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'].includes(requesterRole)) {
      throw new ApiError(403, 'Forbidden: Cannot promote to Captain');
    }
  } else if (newRole === 'TL') {
    if (!['ADMIN', 'SENIOR_TL', 'TL'].includes(requesterRole)) {
      throw new ApiError(403, 'Forbidden: Cannot promote to TL');
    }
  } else {
    if (requesterRole !== 'ADMIN') {
       throw new ApiError(403, 'Forbidden: Only admin can promote to ' + newRole);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole }
  });

  const userWithoutPassword = { ...updatedUser };
  delete userWithoutPassword.password;
  
  return userWithoutPassword;
};

const getLeaderboard = async () => {
  const topUsers = await prisma.user.findMany({
    orderBy: { points: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      department: true,
      role: true,
      points: true
    }
  });
  const mappedTopUsers = topUsers.map(u => ({
    ...u,
    department: u.department?.name || null
  }));
  return mappedTopUsers;
};

const toggleUserStatus = async (userId) => {
  if (userId === 1) {
    throw new ApiError(403, 'Cannot modify the primary admin account');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive }
  });

  if (updatedUser.isActive === false) {
    const keys = await redis.keys(`refresh_token:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  return updatedUser.isActive;
};

const auditService = require('./audit.service');

const deleteUser = async (userId, requester) => {
  if (userId === 1) {
    throw new ApiError(403, 'Cannot delete the primary admin account');
  }

  const userToRestore = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!userToRestore) throw new ApiError(404, 'User not found');

  await prisma.user.delete({
    where: { id: userId }
  });

  if (requester) {
    await auditService.logAction({
      userId: requester.id,
      action: 'USER_DELETED',
      resource: 'User',
      resourceId: userId,
      details: { snapshot: userToRestore }
    });
  }
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      manager: { select: { id: true, name: true, role: true } },
      subordinates: { select: { id: true, name: true, role: true } },
      attendances: true,
      proofs: true,
      ratingsGot: true
    }
  });
  if (!user) throw new ApiError(404, 'User not found');
  
  // Calculate stats
  let totalTasks = 0;
  let approvedTasks = 0;
  if (user.proofs) {
    totalTasks = user.proofs.length;
    approvedTasks = user.proofs.filter(p => p.status === 'Approved').length;
  }
  
  let attendanceRate = 0;
  if (user.attendances && user.attendances.length > 0) {
    const presentCount = user.attendances.filter(a => a.status === 'Present').length;
    attendanceRate = Math.round((presentCount / user.attendances.length) * 100);
  }

  let avgRating = 0;
  if (user.ratingsGot && user.ratingsGot.length > 0) {
    const totalRating = user.ratingsGot.reduce((sum, r) => sum + r.rating, 0);
    avgRating = (totalRating / user.ratingsGot.length).toFixed(1);
  }

  const userToReturn = {
    ...user,
    department: user.department,
    stats: {
      taskCompletions: approvedTasks,
      totalTasks,
      attendanceRate,
      avgRating
    }
  };
  return userToReturn;
};

const updateUser = async (targetUserId, data, requester) => {
  const { name, department, phoneNo, specialId, managerId } = data;
  
  // Only ADMIN, SENIOR_TL, TL can update other users
  if (!['ADMIN', 'SENIOR_TL', 'TL'].includes(requester.role)) {
    throw new ApiError(403, 'Unauthorized to update users');
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (department) updateData.department = department;
  if (phoneNo) updateData.phoneNo = phoneNo;
  if (specialId) updateData.specialId = specialId;
  if (managerId) updateData.managerId = parseInt(managerId);

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, department: { select: { name: true } }, specialId: true, phoneNo: true, managerId: true }
  });

  return { ...user, department: user.department };
};

const updateProfile = async (userId, data, requester) => {
  if (userId !== requester.id) {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const { name, phoneNo } = data;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (phoneNo) updateData.phoneNo = phoneNo;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, department: { select: { name: true } }, specialId: true, phoneNo: true }
  });

  return { ...user, department: user.department };
};

const bulkUpdateDepartment = async (userIds, newDepartment, requesterId) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, 'Invalid user IDs');
  }

  const { count } = await prisma.user.updateMany({
    where: {
      id: { in: userIds }
    },
    data: { department: newDepartment }
  });

  return { updatedCount: count };
};

// Helper to verify if targetUserId is a subordinate of managerId using BFS
const checkUserHierarchy = async (managerId, targetUserId) => {
  let currentLevelIds = [managerId];
  const visited = new Set(currentLevelIds);
  while (currentLevelIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { managerId: { in: currentLevelIds } },
      select: { id: true }
    });
    const nextLevelIds = [];
    for (const u of users) {
      if (u.id === targetUserId) {
        return true;
      }
      if (!visited.has(u.id)) {
        visited.add(u.id);
        nextLevelIds.push(u.id);
      }
    }
    currentLevelIds = nextLevelIds;
  }
  return false;
};

const { parse } = require('csv-parse');

const bulkUploadUsers = async (fileStream, managerId) => {
  return new Promise(async (resolve, reject) => {
    const results = [];
    const errors = [];
    let count = 0;

    const parser = fileStream.pipe(parse({ columns: true, skip_empty_lines: true }));

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        results.push(record);
      }
    });

    parser.on('error', function(err) {
      reject(new ApiError(400, 'Error parsing CSV file'));
    });

    parser.on('end', async function() {
      for (const row of results) {
        try {
          if (!row.email || !row.password || !row.name) {
            errors.push({ email: row.email, error: 'Missing required fields: email, password, name' });
            continue;
          }
          await createUser({
            email: row.email,
            password: row.password,
            name: row.name,
            role: row.role || 'INTERN',
            department: row.department,
            specialId: row.specialId,
            phoneNo: row.phoneNo
          }, managerId);
          count++;
        } catch (err) {
          errors.push({ email: row.email, error: err.message });
        }
      }
      resolve({ count, errors });
    });
  });
};

module.exports = {
  getDashboardData,
  createUser,
  getAllUsers,
  promoteUser,
  getLeaderboard,
  toggleUserStatus,
  deleteUser,
  getUserById,
  updateUser,
  updateProfile,
  bulkUpdateDepartment,
  checkUserHierarchy,
  bulkUploadUsers,
};
