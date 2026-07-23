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

const changePassword = async (request, reply) => {
  const { currentPassword, newPassword } = request.body
  const userId = request.user.id

  const user = await request.server.prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) return reply.code(404).send({ error: 'User not found' })

  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) return reply.code(400).send({ error: 'Incorrect current password' })

  const hashedNewPassword = await bcrypt.hash(newPassword, 10)

  await request.server.prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword }
  })

  return { success: true, message: 'Password updated successfully' }
}

module.exports = { login, changePassword }
