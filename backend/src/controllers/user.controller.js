const bcrypt = require('bcryptjs')

const getDashboardData = async (request, reply) => {
  const { id } = request.params
  const userId = parseInt(id)
  
  const user = await request.server.prisma.user.findUnique({
    where: { id: userId },
    include: {
      subordinates: true,
      attendances: true,
      proofs: true,
      ratingsGot: true
    }
  })
  
  if (!user) return reply.code(404).send({ error: 'User not found' })

  // If Manager
  let pendingProofs = []
  if (['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'].includes(user.role)) {
    const subIds = user.subordinates.map(s => s.id)
    pendingProofs = await request.server.prisma.proof.findMany({
      where: { internId: { in: subIds }, status: 'Pending' },
      include: { task: { include: { subTasks: true } }, intern: true }
    })
  }

  // Active Tasks
  const activeTasks = await request.server.prisma.task.findMany({
    where: { status: 'Active' },
    include: { subTasks: true }
  })

  return { 
    success: true, 
    user,
    pendingProofs,
    activeTasks
  }
}

const createUser = async (request, reply) => {
  const { email, password, name, department, role, specialId, phoneNo } = request.body
  const cleanEmail = email.trim()
  const managerId = request.user.id // The creator is the manager

  // Validate that email is unique
  const existingEmail = await request.server.prisma.user.findUnique({
    where: { email: cleanEmail }
  })
  if (existingEmail) {
    return reply.code(400).send({ error: 'Email already exists' })
  }

  // Validate that specialId is unique
  if (specialId) {
    const existingSpecialId = await request.server.prisma.user.findUnique({
      where: { specialId }
    })
    if (existingSpecialId) {
      return reply.code(400).send({ error: 'Special ID already exists. It must be unique.' })
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = await request.server.prisma.user.create({
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
  })

  delete newUser.password
  return { success: true, user: newUser }
}

const getAllUsers = async (request, reply) => {
  const users = await request.server.prisma.user.findMany({
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
  })
  
  return { success: true, users }
}

const promoteUser = async (request, reply) => {
  const targetUserId = parseInt(request.params.id)
  const { newRole } = request.body
  const requesterRole = request.user.role

  const targetUser = await request.server.prisma.user.findUnique({
    where: { id: targetUserId }
  })

  if (!targetUser) return reply.code(404).send({ error: 'User not found' })

  // Promotion Rules
  if (newRole === 'CAPTAIN') {
    if (!['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'].includes(requesterRole)) {
      return reply.code(403).send({ error: 'Forbidden: Cannot promote to Captain' })
    }
  } else if (newRole === 'TL') {
    if (!['ADMIN', 'SENIOR_TL', 'TL'].includes(requesterRole)) {
      return reply.code(403).send({ error: 'Forbidden: Cannot promote to TL' })
    }
  } else {
    // Only admins can promote to higher roles
    if (requesterRole !== 'ADMIN') {
       return reply.code(403).send({ error: 'Forbidden: Only admin can promote to ' + newRole })
    }
  }

  const updatedUser = await request.server.prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole }
  })

  delete updatedUser.password
  return { success: true, user: updatedUser }
}

const getLeaderboard = async (request, reply) => {
  const topUsers = await request.server.prisma.user.findMany({
    orderBy: { points: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      department: true,
      role: true,
      points: true
    }
  })
  return { success: true, leaderboard: topUsers }
}

const toggleUserStatus = async (request, reply) => {
  const userId = parseInt(request.params.id)
  
  if (userId === 1) {
    return reply.code(403).send({ error: 'Cannot modify the primary admin account' })
  }

  const user = await request.server.prisma.user.findUnique({ where: { id: userId } })
  if (!user) return reply.code(404).send({ error: 'User not found' })

  const updatedUser = await request.server.prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive }
  })

  return { success: true, isActive: updatedUser.isActive }
}

const deleteUser = async (request, reply) => {
  const userId = parseInt(request.params.id)
  
  if (userId === 1) {
    return reply.code(403).send({ error: 'Cannot delete the primary admin account' })
  }

  await request.server.prisma.user.delete({
    where: { id: userId }
  })

  return { success: true }
}

module.exports = { getDashboardData, createUser, promoteUser, getLeaderboard, getAllUsers, toggleUserStatus, deleteUser }
