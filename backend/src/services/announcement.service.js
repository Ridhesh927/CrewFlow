const prisma = require('../prismaClient');
const ApiError = require('../plugins/ApiError');

const createAnnouncement = async (announcementData, author) => {
  const { title, content, targetRole, targetDepartment } = announcementData;
  const { role, department, id: authorId } = author;

  const isGlobal = !targetRole && !targetDepartment;
  
  if (isGlobal && role !== 'ADMIN' && role !== 'SENIOR_TL') {
    throw new ApiError(403, 'Only ADMIN and SENIOR_TL can create global announcements');
  }

  if (role === 'TL' || role === 'CAPTAIN') {
    if (!targetDepartment || targetDepartment !== department) {
       throw new ApiError(403, 'You can only create announcements for your own department');
    }
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      targetRole,
      targetDepartment,
      authorId
    }
  });

  return announcement;
};

const getAnnouncements = async (user) => {
  const { role, department } = user;

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [
        { targetRole: role, targetDepartment: department },
        { targetRole: null, targetDepartment: department },
        { targetRole: role, targetDepartment: null },
        { targetRole: null, targetDepartment: null }
      ]
    },
    include: {
      author: {
        select: { name: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return announcements;
};

const getAllAnnouncements = async () => {
  const announcements = await prisma.announcement.findMany({
    include: {
      author: {
        select: { name: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return announcements;
};

const deleteAnnouncement = async (announcementId, user) => {
  const { role, id: userId } = user;

  const announcement = await prisma.announcement.findUnique({
    where: { id: parseInt(announcementId) }
  });

  if (!announcement) {
    throw new ApiError(404, 'Announcement not found');
  }

  if (role !== 'ADMIN' && announcement.authorId !== userId) {
    throw new ApiError(403, 'Unauthorized to delete this announcement');
  }

  await prisma.announcement.delete({
    where: { id: parseInt(announcementId) }
  });
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAllAnnouncements,
  deleteAnnouncement
};
