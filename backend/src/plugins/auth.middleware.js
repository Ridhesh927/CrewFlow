const requireRole = (roles) => {
  return async (request, reply) => {
    try {
      await request.jwtVerify()
      if (!roles.includes(request.user.role)) {
        return reply.code(403).send({ error: 'Forbidden: Insufficient privileges' })
      }
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
  }
}

// Ensure the target user is a subordinate of the requester
// This requires the request to have a target userId in params.id
const requireHierarchy = async (request, reply) => {
  try {
    await request.jwtVerify()
    const requesterId = request.user.id
    const targetUserId = parseInt(request.params.id)

    if (requesterId === targetUserId) return // User can access their own data

    // Need to recursively check if targetUserId is a subordinate of requesterId
    // Since recursive DB queries can be complex, we can fetch all subordinates of requester
    // This is a simplified BFS approach
    const prisma = request.server.prisma
    
    let isSubordinate = false
    let currentLevelIds = [requesterId]
    const visited = new Set(currentLevelIds)

    while (currentLevelIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { managerId: { in: currentLevelIds } },
        select: { id: true }
      })

      const nextLevelIds = []
      for (const u of users) {
        if (u.id === targetUserId) {
          isSubordinate = true
          break
        }
        if (!visited.has(u.id)) {
          visited.add(u.id)
          nextLevelIds.push(u.id)
        }
      }

      if (isSubordinate) break
      currentLevelIds = nextLevelIds
    }

    if (!isSubordinate) {
      return reply.code(403).send({ error: 'Forbidden: User is not in your hierarchy' })
    }

  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}

module.exports = { requireRole, requireHierarchy }
