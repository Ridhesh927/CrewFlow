

async function getUserAnalytics(request, reply) {
  try {
    const { id } = request.params;
    const targetUserId = parseInt(id);
    const { role, id: requesterId } = request.user;

    const targetUser = await request.server.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Check permissions
    if (role !== 'ADMIN' && requesterId !== targetUserId && targetUser.managerId !== requesterId) {
      return reply.code(403).send({ error: 'Unauthorized to view this user\'s analytics' });
    }

    // Average Rating
    const ratings = await request.server.prisma.rating.aggregate({
      where: { userId: targetUserId },
      _avg: { rating: true }
    });

    // Task Completions (Approved Proofs)
    const taskCompletions = await request.server.prisma.proof.count({
      where: { internId: targetUserId, status: 'Approved' }
    });

    // Attendance Stats
    const attendances = await request.server.prisma.attendance.groupBy({
      by: ['status'],
      where: { userId: targetUserId },
      _count: { status: true }
    });

    const attendanceStats = attendances.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, { Present: 0, Absent: 0, Late: 0, Leave: 0 });

    reply.send({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        department: targetUser.department
      },
      analytics: {
        averageRating: ratings._avg.rating || 0,
        taskCompletions,
        attendanceStats
      }
    });

  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

async function getTeamAnalytics(request, reply) {
  try {
    const { role, id: requesterId } = request.user;
    const { department } = request.query;

    let usersQuery = {};

    if (role === 'ADMIN') {
      if (department) {
        usersQuery = { department };
      }
      // If no department specified, get all users (excluding admins perhaps)
      else {
         usersQuery = { role: { not: 'ADMIN' } };
      }
    } else {
      // TLs, SENIOR_TLs, CAPTAINS
      usersQuery = { managerId: requesterId };
    }

    const users = await request.server.prisma.user.findMany({
      where: usersQuery,
      select: { id: true, name: true, department: true }
    });

    if (users.length === 0) {
      return reply.send({ message: 'No users found for analytics', analytics: [] });
    }

    const userIds = users.map(u => u.id);

    // Get all ratings for these users
    const ratings = await request.server.prisma.rating.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _avg: { rating: true }
    });

    // Get task completions
    const taskCompletions = await request.server.prisma.proof.groupBy({
      by: ['internId'],
      where: { internId: { in: userIds }, status: 'Approved' },
      _count: { id: true }
    });

    // Get attendance
    const attendances = await request.server.prisma.attendance.groupBy({
      by: ['userId', 'status'],
      where: { userId: { in: userIds } },
      _count: { status: true }
    });

    // Aggregate the data
    const analyticsMap = new Map();
    users.forEach(user => {
      analyticsMap.set(user.id, {
        user,
        averageRating: 0,
        taskCompletions: 0,
        attendanceStats: { Present: 0, Absent: 0, Late: 0, Leave: 0 }
      });
    });

    ratings.forEach(r => {
      if(analyticsMap.has(r.userId)) {
        analyticsMap.get(r.userId).averageRating = r._avg.rating || 0;
      }
    });

    taskCompletions.forEach(t => {
      if(analyticsMap.has(t.internId)) {
        analyticsMap.get(t.internId).taskCompletions = t._count.id;
      }
    });

    attendances.forEach(a => {
      if(analyticsMap.has(a.userId)) {
        analyticsMap.get(a.userId).attendanceStats[a.status] = a._count.status;
      }
    });

    const results = Array.from(analyticsMap.values());

    reply.send({ analytics: results });

  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

module.exports = {
  getUserAnalytics,
  getTeamAnalytics
};
