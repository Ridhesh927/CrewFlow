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

module.exports = { getAttendances }
