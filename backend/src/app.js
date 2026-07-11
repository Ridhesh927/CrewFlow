const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')
const prismaPlugin = require('./plugins/prisma')
const jwtPlugin = require('./plugins/jwt')
const authRoutes = require('./routes/auth.routes')
const userRoutes = require('./routes/user.routes')
const attendanceRoutes = require('./routes/attendance.routes')
const ratingRoutes = require('./routes/rating.routes')
const taskRoutes = require('./routes/task.routes')
const leaveRoutes = require('./routes/leave.routes')
const analyticsRoutes = require('./routes/analytics.routes')
const announcementRoutes = require('./routes/announcement.routes')
const documentRoutes = require('./routes/document.routes')

fastify.register(cors, { 
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

fastify.register(require('@fastify/multipart'), { attachFieldsToBody: false })

fastify.register(prismaPlugin)
fastify.register(jwtPlugin)

fastify.register(authRoutes, { prefix: '/api/v1/auth' })
fastify.register(userRoutes, { prefix: '/api/v1/users' })
fastify.register(attendanceRoutes, { prefix: '/api/v1/attendances' })
fastify.register(ratingRoutes, { prefix: '/api/v1/ratings' })
fastify.register(taskRoutes, { prefix: '/api/v1/tasks' })
fastify.register(leaveRoutes, { prefix: '/api/v1/leaves' })
fastify.register(analyticsRoutes, { prefix: '/api/v1/analytics' })
fastify.register(announcementRoutes, { prefix: '/api/v1/announcements' })
fastify.register(documentRoutes, { prefix: '/api/v1/documents' })

module.exports = fastify
