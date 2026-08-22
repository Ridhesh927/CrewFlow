const prisma = require('../prismaClient');

async function createDepartment(data) {
  const existing = await prisma.department.findFirst({
    where: {
      OR: [
        { name: data.name },
        { code: data.code }
      ]
    }
  });

  if (existing) {
    throw new Error('Department with this name or code already exists');
  }

  return prisma.department.create({
    data
  });
}

async function getDepartments() {
  return prisma.department.findMany({
    include: {
      _count: {
        select: { users: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function getDepartment(id) {
  return prisma.department.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });
}

async function updateDepartment(id, data) {
  return prisma.department.update({
    where: { id },
    data
  });
}

async function deleteDepartment(id) {
  return prisma.department.delete({
    where: { id }
  });
}

module.exports = {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment
};
