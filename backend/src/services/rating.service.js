const prisma = require('../prismaClient');
const ApiError = require('../plugins/ApiError');
const notificationService = require('./notification.service');

// BFS traversal to check if targetUserId is a subordinate of managerId
const checkIsSubordinate = async (managerId, targetUserId) => {
  let currentLevelIds = [managerId];
  const visited = new Set(currentLevelIds);

  while (currentLevelIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { managerId: { in: currentLevelIds } },
      select: { id: true }
    });

    const nextLevelIds = [];
    for (const u of users) {
      if (u.id === targetUserId) return true;
      if (!visited.has(u.id)) {
        visited.add(u.id);
        nextLevelIds.push(u.id);
      }
    }
    currentLevelIds = nextLevelIds;
  }
  return false;
};

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

const createRating = async (ratingData, rater) => {
  const { userId, rating, comments, month } = ratingData;
  const { role: raterRole, id: raterId } = rater;

  if (!userId || !rating || !comments || !month) {
    throw new ApiError(400, 'userId, rating, comments, and month are all required');
  }

  // Cannot rate yourself
  if (raterId === userId) {
    throw new ApiError(400, 'You cannot rate yourself');
  }

  // Validate rating range
  const ratingNum = parseFloat(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  // Check target user exists
  const targetUser = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
  if (!targetUser) throw new ApiError(404, 'Target user not found');

  // Admin can rate anyone; others must validate hierarchy
  if (raterRole !== 'ADMIN') {
    const isSubordinate = await checkIsSubordinate(raterId, parseInt(userId));
    if (!isSubordinate) {
      throw new ApiError(403, 'You can only rate users under your direct supervision');
    }
  }

  // Prevent duplicate rating in same month by same rater
  const existing = await prisma.rating.findFirst({
    where: { raterId, userId: parseInt(userId), month }
  });
  if (existing) {
    throw new ApiError(409, `A rating has already been submitted for this user for ${month}`);
  }

  const newRating = await prisma.rating.create({
    data: {
      userId: parseInt(userId),
      raterId,
      rating: ratingNum,
      comments,
      month
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, department: true } },
      rater: { select: { id: true, name: true, role: true } }
    }
  });

  await notificationService.createNotification(
    newRating.userId,
    'INFO',
    `You have received a new rating of ${ratingNum} for ${month} from ${newRating.rater?.name || 'your manager'}.`
  );

  return newRating;
};

module.exports = {
  getRatings,
  createRating
};
