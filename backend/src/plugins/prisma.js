const fp = require('fastify-plugin')
const prisma = require('../prismaClient')

module.exports = fp(async (fastify, opts) => {
  await prisma.$connect()

  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async (fastifyInstance) => {
    await fastifyInstance.prisma.$disconnect()
  })
})
