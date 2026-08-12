const attendanceController = require('../controllers/attendance.controller')
const validate = require('../plugins/validate.middleware')
const { markAttendanceSchema } = require('../schemas/attendance.schema')

async function attendanceRoutes(fastify, options) {
  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    attendanceController.getAttendances
  )
  fastify.post(
    '/mark',
    { 
      preValidation: [fastify.authenticate],
      preHandler: [validate(markAttendanceSchema)]
    },
    attendanceController.markAttendance
  )
}

module.exports = attendanceRoutes
