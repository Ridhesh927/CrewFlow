const fp = require('fastify-plugin')
const fastifyJwt = require('@fastify/jwt')

module.exports = fp(async (fastify, opts) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
  }

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET
  })

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
  })
})
