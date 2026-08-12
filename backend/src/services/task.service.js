const cloudinary = require('cloudinary').v2;
const prisma = require('../plugins/prisma');
const ApiError = require('../plugins/ApiError');
const notificationService = require('./notification.service');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const getTasks = async (user) => {
  const { role, id: userId, department } = user;

  if (role === 'INTERN') {
    // Interns see only active tasks (filtered by targetAudience matching their dept or "All")
    const tasks = await prisma.task.findMany({
      where: {
        status: 'Active',
        OR: [
          { targetAudience: 'All' },
          { targetAudience: department }
        ]
      },
      include: {
        subTasks: true,
        proofs: {
          where: { internId: userId },
          select: { id: true, status: true, imageUrl: true, timestamp: true }
        }
      },
      orderBy: { deadline: 'asc' }
    });
    return tasks;
  }

  // Managers / Admin see all tasks with proof counts
  const tasks = await prisma.task.findMany({
    include: {
      subTasks: true,
      _count: { select: { proofs: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return tasks;
};

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

  // Notify relevant users (interns)
  let userWhereClause = { role: 'INTERN', isActive: true };
  if (targetAudience !== 'All') {
    userWhereClause.department = targetAudience;
  }
  
  const targetUsers = await prisma.user.findMany({
    where: userWhereClause,
    select: { id: true }
  });

  for (const u of targetUsers) {
    await notificationService.createNotification(
      u.id,
      'INFO',
      `A new task has been assigned to you: "${task.title}"`
    );
  }

  return task;
};

const fillTaskSheet = async (internId, parts) => {
  let imageUrl = null;
  const fields = {};

  for await (const part of parts) {
    if (part.file) {
      // Upload image to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'crewflow/proofs',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (error, result) => {
            if (error) reject(new ApiError(500, 'Image upload failed: ' + error.message));
            else resolve(result);
          }
        );
        part.file.pipe(uploadStream);
      });
      imageUrl = uploadResult.secure_url;
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  const taskId = parseInt(fields.taskId);
  if (!taskId) throw new ApiError(400, 'taskId is required');

  let completedSubTasks = [];
  try {
    completedSubTasks = fields.completedSubTasks ? JSON.parse(fields.completedSubTasks) : [];
  } catch {
    completedSubTasks = [];
  }

  // Check if intern already submitted a proof for this task
  const existing = await prisma.proof.findFirst({
    where: { taskId, internId }
  });
  if (existing) {
    throw new ApiError(409, 'You have already submitted a proof for this task');
  }

  const proof = await prisma.proof.create({
    data: {
      taskId,
      internId,
      imageUrl,
      completedSubTasks
    }
  });

  return proof;
};

const getPendingProofs = async (user) => {
  const { role, id: userId } = user;

  let whereClause = { status: 'Pending' };

  if (role !== 'ADMIN') {
    // Fetch direct subordinates only (1 level for now — can be expanded with BFS)
    const subordinates = await prisma.user.findMany({
      where: { managerId: userId },
      select: { id: true }
    });
    const subIds = subordinates.map(s => s.id);
    whereClause.internId = { in: subIds };
  }

  const proofs = await prisma.proof.findMany({
    where: whereClause,
    include: {
      task: { include: { subTasks: true } },
      intern: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          role: true,
          specialId: true
        }
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  return proofs;
};

const approveProof = async (proofId) => {
  const proof = await prisma.proof.update({
    where: { id: proofId },
    data: { status: 'Approved' },
    include: { task: { select: { title: true } } }
  });

  await prisma.user.update({
    where: { id: proof.internId },
    data: { points: { increment: 10 } }
  });

  return proof;
};

const rejectProof = async (proofId) => {
  const proof = await prisma.proof.update({
    where: { id: proofId },
    data: { status: 'Rejected' },
    include: { task: { select: { title: true } } }
  });

  return proof;
};

module.exports = {
  getTasks,
  createTask,
  fillTaskSheet,
  getPendingProofs,
  approveProof,
  rejectProof
};
