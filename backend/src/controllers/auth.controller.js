const bcrypt = require('bcryptjs')

const login = async (request, reply) => {
  const { identifier, email, password } = request.body
  const loginIdentifier = (identifier || email || '').trim()

  if (!loginIdentifier) {
    return reply.code(400).send({ error: 'Email or ID is required' })
  }

  const user = await request.server.prisma.user.findFirst({
    where: {
      OR: [
        { email: loginIdentifier },
        { specialId: loginIdentifier }
      ]
    }
  })
  
  if (!user) return reply.code(404).send({ error: 'User not found' })
  
  if (!user.isActive) {
    return reply.code(403).send({ error: 'Your account has been disabled. Please contact your admin.' })
  }
  
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return reply.code(401).send({ error: 'Invalid password' })

  const accessToken = request.server.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '15m' })
  const refreshToken = request.server.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '7d' })
  
  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })

  // Don't send password back
  delete user.password
  
  return { success: true, token: accessToken, user }
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

const refresh = async (request, reply) => {
  const refreshToken = request.cookies.refreshToken
  if (!refreshToken) {
    return reply.code(401).send({ error: 'Refresh token missing' })
  }

  try {
    const decoded = request.server.jwt.verify(refreshToken)
    const user = await request.server.prisma.user.findUnique({ where: { id: decoded.id } })
    
    if (!user || !user.isActive) {
      return reply.code(401).send({ error: 'Invalid refresh token' })
    }

    const accessToken = request.server.jwt.sign({ id: user.id, role: user.role }, { expiresIn: '15m' })
    return { success: true, token: accessToken }
  } catch (err) {
    return reply.code(401).send({ error: 'Invalid or expired refresh token' })
  }
}

module.exports = { login, changePassword, refresh }
