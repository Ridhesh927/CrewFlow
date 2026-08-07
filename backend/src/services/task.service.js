const prisma = require('../plugins/prisma');
const ApiError = require('../plugins/ApiError');

const createTask = async (taskData) => {
  const { title, description, targetAudience, deadline, subTasks } = taskData;
  
  if (new Date(deadline) < new Date()) {
    throw new ApiError(400, 'Due date cannot be in the past');
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      targetAudience,
      deadline: new Date(deadline),
      subTasks: subTasks && subTasks.length > 0 ? {
        create: subTasks.map(st => ({ title: st.title }))
      } : undefined
    },
    include: { subTasks: true }
  });
  
  return task;
};

const fillTaskSheet = async (internId, taskData) => {
  const { taskId, imageUrl, completedSubTasks } = taskData;

  const proof = await prisma.proof.create({
    data: {
      taskId,
      internId,
      imageUrl,
      completedSubTasks: completedSubTasks || []
    }
  });

  return proof;
};

const approveProof = async (proofId) => {
  const proof = await prisma.proof.update({
    where: { id: proofId },
    data: { status: 'Approved' }
  });
  
  await prisma.user.update({
    where: { id: proof.internId },
    data: { points: { increment: 10 } }
  });
  
  return proof;
};

module.exports = {
  createTask,
  fillTaskSheet,
  approveProof
};
