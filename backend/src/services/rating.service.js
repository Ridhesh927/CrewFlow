const prisma = require('../plugins/prisma');

const getRatings = async (user) => {
  const { role: userRole, id: userId, department: userDepartment } = user;

  let whereClause = {};
  
  if (userRole === 'INTERN') {
    whereClause = { userId: userId };
  } else if (userRole !== 'ADMIN') {
    whereClause = { user: { department: userDepartment } };
  }

  const ratings = await prisma.rating.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          specialId: true
        }
      },
      rater: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return ratings;
};

module.exports = {
  getRatings
};
