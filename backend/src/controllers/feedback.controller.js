const prisma = require('../prismaClient');

const submitFeedback = async (request, reply) => {
  const { type, subject, description } = request.body;
  const userId = request.user.id;
  try {
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type,
        subject,
        description
      }
    });
    return { success: true, feedback };
  } catch (error) {
    throw error;
  }
};

const getFeedback = async (request, reply) => {
  const user = request.user;
  try {
    let feedback;
    if (user.role === 'ADMIN') {
      feedback = await prisma.feedback.findMany({
        include: { user: { select: { id: true, name: true, email: true, department: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      feedback = await prisma.feedback.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
    }
    return { success: true, feedback };
  } catch (error) {
    throw error;
  }
};

const updateFeedbackStatus = async (request, reply) => {
  const { id } = request.params;
  const { status, adminNotes } = request.body;
  try {
    const data = { status };
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    
    const feedback = await prisma.feedback.update({
      where: { id: parseInt(id) },
      data
    });
    return { success: true, feedback };
  } catch (error) {
    throw error;
  }
};

module.exports = { submitFeedback, getFeedback, updateFeedbackStatus };
