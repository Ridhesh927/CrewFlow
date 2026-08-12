const prisma = require('../plugins/prisma');
const ApiError = require('../plugins/ApiError');
const { Parser } = require('json2csv');

const getUserAnalytics = async (targetUserId, requester) => {
  const { role, id: requesterId } = requester;

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (role !== 'ADMIN' && requesterId !== targetUserId && targetUser.managerId !== requesterId) {
    throw new ApiError(403, 'Unauthorized to view this user\'s analytics');
  }

  const ratings = await prisma.rating.aggregate({
    where: { userId: targetUserId },
    _avg: { rating: true }
  });

  const taskCompletions = await prisma.proof.count({
    where: { internId: targetUserId, status: 'Approved' }
  });

  const attendances = await prisma.attendance.groupBy({
    by: ['status'],
    where: { userId: targetUserId },
    _count: { status: true }
  });

  const attendanceStats = attendances.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, { Present: 0, Absent: 0, Late: 0, Leave: 0 });

  return {
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
  };
};

const getTeamAnalytics = async (requester, departmentQuery) => {
  const { role, id: requesterId } = requester;

  let usersQuery = {};

  if (role === 'ADMIN') {
    if (departmentQuery) {
      usersQuery = { department: departmentQuery };
    }
    else {
       usersQuery = { role: { not: 'ADMIN' } };
    }
  } else {
    usersQuery = { managerId: requesterId };
  }

  const users = await prisma.user.findMany({
    where: usersQuery,
    select: { id: true, name: true, department: true }
  });

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map(u => u.id);

  const ratings = await prisma.rating.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _avg: { rating: true }
  });

  const taskCompletions = await prisma.proof.groupBy({
    by: ['internId'],
    where: { internId: { in: userIds }, status: 'Approved' },
    _count: { id: true }
  });

  const attendances = await prisma.attendance.groupBy({
    by: ['userId', 'status'],
    where: { userId: { in: userIds } },
    _count: { status: true }
  });

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

  return Array.from(analyticsMap.values());
};

const getTrendsAnalytics = async (targetUserId, requester) => {
  const { role, id: requesterId } = requester;

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  if (role !== 'ADMIN' && requesterId !== targetUserId && targetUser.managerId !== requesterId) {
    throw new ApiError(403, 'Unauthorized to view this user\'s analytics');
  }

  // Get ratings grouped by month for trends
  const ratingsByMonth = await prisma.rating.groupBy({
    by: ['month'],
    where: { userId: targetUserId },
    _avg: { rating: true },
    orderBy: { month: 'asc' }
  });

  const trends = ratingsByMonth.map(r => ({
    month: r.month,
    averageRating: r._avg.rating || 0
  }));

  return { trends };
};

const exportAttendanceCsv = async (requester, startDate, endDate) => {
  const { role, department } = requester;
  
  let whereClause = {};
  if (role !== 'ADMIN') {
    whereClause.user = { department };
  }

  if (startDate && endDate) {
    whereClause.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  const attendances = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true, email: true, department: true } }
    },
    orderBy: { date: 'desc' }
  });

  const data = attendances.map(a => ({
    Name: a.user.name,
    Email: a.user.email,
    Department: a.user.department,
    Date: a.date.toISOString().split('T')[0],
    Status: a.status,
    Remarks: a.remarks || ''
  }));

  if (data.length === 0) return '';
  const parser = new Parser();
  return parser.parse(data);
};

const exportRatingsCsv = async (requester) => {
  const { role, department } = requester;
  
  let whereClause = {};
  if (role !== 'ADMIN') {
    whereClause.user = { department };
  }

  const ratings = await prisma.rating.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true, email: true, department: true } },
      rater: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const data = ratings.map(r => ({
    Name: r.user.name,
    Email: r.user.email,
    Department: r.user.department,
    Month: r.month,
    Rating: r.rating,
    Comments: r.comments,
    Rater: r.rater.name
  }));

  if (data.length === 0) return '';
  const parser = new Parser();
  return parser.parse(data);
};

module.exports = {
  getUserAnalytics,
  getTeamAnalytics,
  getTrendsAnalytics,
  exportAttendanceCsv,
  exportRatingsCsv
};
