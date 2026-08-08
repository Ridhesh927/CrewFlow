const bcrypt = require('bcryptjs');
const prisma = require('../plugins/prisma');
const ApiError = require('../plugins/ApiError');

const getDashboardData = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subordinates: true,
      attendances: true,
      proofs: true,
      ratingsGot: true
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

  const activeTasks = await prisma.task.findMany({
    where: { status: 'Active' },
    include: { subTasks: true }
  });

  return { user, pendingProofs, activeTasks };
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

  const hashedPassword = await bcrypt.hash(password, 10);

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

const getAllUsers = async (currentUserId) => {
  const currentUserRecord = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { role: true, department: true }
  });

  let whereClause = {};

  if (currentUserRecord && currentUserRecord.role !== 'ADMIN' && currentUserRecord.department) {
    whereClause.department = currentUserRecord.department;
  }

  const users = await prisma.user.findMany({
    where: whereClause,
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
  
  return users;
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
  return topUsers;
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

  return updatedUser.isActive;
};

const deleteUser = async (userId) => {
  if (userId === 1) {
    throw new ApiError(403, 'Cannot delete the primary admin account');
  }

  await prisma.user.delete({
    where: { id: userId }
  });
};

module.exports = {
  getDashboardData,
  createUser,
  getAllUsers,
  promoteUser,
  getLeaderboard,
  toggleUserStatus,
  deleteUser
};
