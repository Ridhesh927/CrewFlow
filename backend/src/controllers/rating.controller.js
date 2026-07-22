const getRatings = async (request, reply) => {
  const userRole = request.user.role
  const userId = request.user.id

  let whereClause = {}
  
  if (userRole === 'INTERN') {
    whereClause = { userId: userId }
  } else if (userRole !== 'ADMIN') {
    whereClause = { user: { department: request.user.department } }
  }

  const ratings = await request.server.prisma.rating.findMany({
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
      },
      rater: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return { success: true, ratings }
}

module.exports = { getRatings }
