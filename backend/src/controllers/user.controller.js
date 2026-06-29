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

const createIntern = async (request, reply) => {
  const { email, password, name, department } = request.body
  const managerId = request.user.id // The creator is the manager

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  const newIntern = await request.server.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      department,
      role: 'INTERN',
      managerId
    }
  })

  delete newIntern.password
  return { success: true, user: newIntern }
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

module.exports = { getDashboardData, createIntern, promoteUser, getLeaderboard }
