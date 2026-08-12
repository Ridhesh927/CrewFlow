const attendanceService = require('../services/attendance.service');
const auditService = require('../services/audit.service');

const getAttendances = async (request, reply) => {
  const userRole = request.user.role;
  const userId = request.user.id;
  const userDepartment = request.user.department;
  const { startDate, endDate } = request.query;

  const attendances = await attendanceService.getAttendances(userRole, userId, userDepartment, startDate, endDate);

  return { success: true, attendances };
}

const markAttendance = async (request, reply) => {
  const { targetUserId, date, status, remarks } = request.body;
  const requester = request.user;

  try {
    const attendance = await attendanceService.markAttendance(targetUserId, date, status, remarks, requester);
    
    await auditService.logAction({
      userId: requester.id,
      action: 'ATTENDANCE_MODIFIED',
      resource: 'Attendance',
      resourceId: attendance.id,
      details: { targetUserId, status, date },
      ipAddress: request.ip
    });

    return { success: true, attendance };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

module.exports = { getAttendances, markAttendance }
