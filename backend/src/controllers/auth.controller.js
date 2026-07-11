const bcrypt = require('bcryptjs')

const login = async (request, reply) => {
  const { email, password } = request.body
  const user = await request.server.prisma.user.findUnique({
    where: { email: email.trim() }
  })
  
  if (!user) return reply.code(404).send({ error: 'User not found' })
  
  if (!user.isActive) {
    return reply.code(403).send({ error: 'Your account has been disabled. Please contact your admin.' })
  }
  
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return reply.code(401).send({ error: 'Invalid password' })

  const token = request.server.jwt.sign({ id: user.id, role: user.role })
  
  // Don't send password back
  delete user.password
  
  return { success: true, token, user }
}

module.exports = { login }
