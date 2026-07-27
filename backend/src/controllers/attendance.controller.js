const getAttendances = async (request, reply) => {
  const userRole = request.user.role
  const userId = request.user.id

  let whereClause = {}
  
  if (userRole === 'INTERN') {
    whereClause = { userId: userId }
  } else if (userRole !== 'ADMIN') {
    whereClause = { user: { department: request.user.department } }
  }

  const attendances = await request.server.prisma.attendance.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          specialId: true
        }
      }
    },
    orderBy: { date: 'desc' }
  })

  return { success: true, attendances }
}

const markAttendance = async (request, reply) => {
  const { targetUserId, date, status, remarks } = request.body
  const requester = request.user

  if (requester.role === 'INTERN') {
    return reply.code(403).send({ error: 'Interns cannot mark attendance' })
  }

  const targetUser = await request.server.prisma.user.findUnique({
    where: { id: targetUserId }
  })

  if (!targetUser) {
    return reply.code(404).send({ error: 'Target user not found' })
  }

  if (requester.role !== 'ADMIN' && requester.department !== targetUser.department) {
    return reply.code(403).send({ error: 'You can only mark attendance for users in your group' })
  }

  const attendanceDate = new Date(date)

  const attendance = await request.server.prisma.attendance.upsert({
    where: {
      userId_date: {
        userId: targetUserId,
        date: attendanceDate
      }
    },
    update: {
      status,
      remarks,
      markedBy: requester.id
    },
    create: {
      userId: targetUserId,
      date: attendanceDate,
      status,
      remarks,
      markedBy: requester.id
    }
  })

  return { success: true, attendance }
}

module.exports = { getAttendances, markAttendance }
