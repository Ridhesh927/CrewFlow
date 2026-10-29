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

const getAllUsers = async (currentUserId, page = 1, limit = 50, scope = null, requester = null) => {
  const skip = (page - 1) * limit;

  const currentUserRecord = requester || await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { id: true, role: true, department: true }
  });

  const isAdmin = currentUserRecord && currentUserRecord.role === 'ADMIN';

  if (scope === 'admin-management' && !isAdmin) {
    throw new ApiError(403, 'Forbidden: Admin access required for user management');
  }

  let whereClause = {};

  if (!isAdmin && currentUserRecord && currentUserRecord.departmentId) {
    whereClause.departmentId = currentUserRecord.departmentId;
  }

  // DTO field selection: return sensitive management fields only when requested by an admin
  const selectFields = (isAdmin && scope === 'admin-management') ? {
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
  } : {
    id: true,
    name: true,
    role: true,
    department: true,
    isActive: true,
    points: true,
    manager: {
      select: {
        id: true,
        name: true,
        role: true
      }
    }
  };

  const users = await prisma.user.findMany({
    where: whereClause,
    skip: skip,
    take: limit,
    select: selectFields,
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  const activeAdminCount = await prisma.user.count({
    where: { role: 'ADMIN', isActive: true }
  });

  const mappedUsers = users.map(u => ({
    ...u,
    department: u.department?.name || null,
    isProtected: Boolean(u.role === 'ADMIN' && activeAdminCount <= 1),
    isLastAdmin: Boolean(u.role === 'ADMIN' && activeAdminCount <= 1)
  }));
  
  return mappedUsers;
};

const promoteUser = async (targetUserId, newRole, requesterRole) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId }
  });

  if (!targetUser) throw new ApiError(404, 'User not found');

  if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
    const activeAdminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true }
    });
    if (activeAdminCount <= 1) {
      throw new ApiError(403, 'Cannot demote the last remaining administrator account');
    }
  }

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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  if (user.role === 'ADMIN' && user.isActive) {
    const activeAdminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true }
    });
    if (activeAdminCount <= 1) {
      throw new ApiError(403, 'Cannot disable the last active administrator account');
    }
  }

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
  const userToRestore = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!userToRestore) throw new ApiError(404, 'User not found');

  if (userToRestore.role === 'ADMIN') {
    const activeAdminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true }
    });
    if (activeAdminCount <= 1) {
      throw new ApiError(403, 'Cannot delete the last remaining administrator account');
    }
  }

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
  if (managerId) updateData.managerId = managerId;

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

const ALLOWED_COLUMNS = ['email', 'password', 'name', 'role', 'department', 'specialId', 'phoneNo'];
const ALLOWED_ROLES = ['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN', 'INTERN'];
const MAX_CSV_ROWS = 500;

const bulkUploadUsers = async (fileStream, managerId) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let count = 0;

    const parser = fileStream.pipe(parse({
      columns: (header) => {
        const unexpected = header.filter(col => !ALLOWED_COLUMNS.includes(col.trim()));
        if (unexpected.length > 0) {
          throw new ApiError(400, `Unexpected columns in CSV: ${unexpected.join(', ')}`);
        }
        return header.map(h => h.trim());
      },
      skip_empty_lines: true
    }));

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        if (results.length >= MAX_CSV_ROWS) {
          parser.destroy(new ApiError(400, `CSV exceeds maximum limit of ${MAX_CSV_ROWS} rows`));
          return;
        }
        results.push(record);
      }
    });

    parser.on('error', function(err) {
      reject(err instanceof ApiError ? err : new ApiError(400, err.message || 'Error parsing CSV file'));
    });

    parser.on('end', async function() {
      const BATCH_SIZE = 50; 
      
      for (let i = 0; i < results.length; i += BATCH_SIZE) {
        const batch = results.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (row) => {
          try {
            if (!row.email || !row.password || !row.name) {
              errors.push({ email: row.email, error: 'Missing required fields: email, password, name' });
              return;
            }

            const cleanEmail = String(row.email).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
              errors.push({ email: row.email, error: 'Invalid email format' });
              return;
            }

            if (typeof row.password !== 'string' || row.password.length < 6) {
              errors.push({ email: row.email, error: 'Password must be at least 6 characters' });
              return;
            }

            const roleCandidate = row.role ? String(row.role).trim().toUpperCase() : 'INTERN';
            const userRole = ALLOWED_ROLES.includes(roleCandidate) ? roleCandidate : 'INTERN';
            
            const hashedPassword = await argon2.hash(row.password);
            
            await prisma.user.create({
              data: {
                email: cleanEmail,
                password: hashedPassword,
                name: String(row.name).trim(),
                role: userRole,
                department: row.department ? String(row.department).trim() : null,
                specialId: row.specialId ? String(row.specialId).trim() : null,
                phoneNo: row.phoneNo ? String(row.phoneNo).trim() : null,
                managerId: managerId
              }
            });
            count++;
          } catch (err) {
            const errorMsg = err.code === 'P2002' ? 'Email or Special ID already exists' : err.message;
            errors.push({ email: row.email, error: errorMsg });
          }
        }));
      }
      resolve({ count, errors });
    });
  });
};

const getMyTeam = async (userId) => {
  const team = await prisma.user.findMany({
    where: { managerId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      specialId: true,
      department: true,
      points: true,
      isActive: true,
      managerId: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  return team.map(u => ({
    ...u,
    department: u.department?.name || null
  }));
};

const getPotentialManagers = async () => {
  const managers = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'] },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      role: true
    },
    orderBy: {
      name: 'asc'
    }
  });
  return managers;
};

module.exports = {
  getDashboardData,
  createUser,
  getAllUsers,
  getMyTeam,
  getPotentialManagers,
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
