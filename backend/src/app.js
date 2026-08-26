const fastify = require('fastify')({ 
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
})
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
const notificationRoutes = require('./routes/notification.routes')
const auditRoutes = require('./routes/audit.routes')
const departmentRoutes = require('./routes/department.routes')
const feedbackRoutes = require('./routes/feedback.routes')

fastify.register(cors, { 
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

fastify.register(require('@fastify/multipart'), { attachFieldsToBody: false })
if (!process.env.COOKIE_SECRET) {
  throw new Error('FATAL: COOKIE_SECRET environment variable is not defined.');
}
fastify.register(require('@fastify/cookie'), {
  secret: process.env.COOKIE_SECRET,
});

// Register session handling with default in-memory store
const fastifySession = require('@fastify/session');
fastify.register(fastifySession, {
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
});

fastify.register(require('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute'
})
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
fastify.register(notificationRoutes, { prefix: '/api/v1/notifications' })
fastify.register(auditRoutes, { prefix: '/api/v1/audit' })
fastify.register(departmentRoutes, { prefix: '/api/v1/departments' })
fastify.register(feedbackRoutes, { prefix: '/api/v1/feedback' })

const errorHandler = require('./plugins/error.middleware')

fastify.setErrorHandler(errorHandler)

module.exports = fastify
