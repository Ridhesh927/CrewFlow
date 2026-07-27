const attendanceController = require('../controllers/attendance.controller')

async function attendanceRoutes(fastify, options) {
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    attendanceController.getAttendances
  )
  fastify.post(
    '/mark',
    { preValidation: [fastify.authenticate] },
    attendanceController.markAttendance
  )
}

module.exports = attendanceRoutes
