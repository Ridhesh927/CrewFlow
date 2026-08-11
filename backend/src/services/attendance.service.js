const prisma = require('../plugins/prisma');
const ApiError = require('../plugins/ApiError');

const getAttendances = async (userRole, userId, userDepartment, startDate, endDate) => {
  let whereClause = {};
  
  if (userRole === 'INTERN') {
    whereClause = { userId: userId };
  } else if (userRole !== 'ADMIN') {
    whereClause = { user: { department: userDepartment } };
  }

  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) whereClause.date.gte = new Date(startDate);
    if (endDate) whereClause.date.lte = new Date(endDate);
  }

  const attendances = await prisma.attendance.findMany({
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
  });

  return attendances;
};

const markAttendance = async (targetUserId, date, status, remarks, requester) => {
  if (requester.role === 'INTERN') {
    throw new ApiError(403, 'Interns cannot mark attendance');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId }
  });

  if (!targetUser) {
    throw new ApiError(404, 'Target user not found');
  }

  if (requester.role !== 'ADMIN' && requester.department !== targetUser.department) {
    throw new ApiError(403, 'You can only mark attendance for users in your group');
  }

  const attendanceDate = new Date(date);

  const attendance = await prisma.attendance.upsert({
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
  });

  return attendance;
};

module.exports = {
  getAttendances,
  markAttendance
};
