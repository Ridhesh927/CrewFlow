const attendanceService = require('../services/attendance.service');

const getAttendances = async (request, reply) => {
  const userRole = request.user.role;
  const userId = request.user.id;
  const userDepartment = request.user.department;

  const attendances = await attendanceService.getAttendances(userRole, userId, userDepartment);

  return { success: true, attendances };
}

const markAttendance = async (request, reply) => {
  const { targetUserId, date, status, remarks } = request.body;
  const requester = request.user;

  try {
    const attendance = await attendanceService.markAttendance(targetUserId, date, status, remarks, requester);
    return { success: true, attendance };
  } catch (error) {
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    throw error;
  }
}

module.exports = { getAttendances, markAttendance }
