const { prisma } = require('../plugins/prisma');

async function createAnnouncement(request, reply) {
  try {
    const { title, content, targetRole, targetDepartment } = request.body;
    const { role, department, id: authorId } = request.user;

    // Check global broadcast permission (null targetRole and targetDepartment)
    const isGlobal = !targetRole && !targetDepartment;
    
    if (isGlobal && role !== 'ADMIN' && role !== 'SENIOR_TL') {
      return reply.code(403).send({ error: 'Only ADMIN and SENIOR_TL can create global announcements' });
    }

    // TLs and CAPTAINs can only announce to their own department
    if (role === 'TL' || role === 'CAPTAIN') {
      if (!targetDepartment || targetDepartment !== department) {
         return reply.code(403).send({ error: 'You can only create announcements for your own department' });
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

    reply.code(201).send({ message: 'Announcement created successfully', announcement });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

async function getAnnouncements(request, reply) {
  try {
    const { role, department } = request.user;

    // Fetch announcements where targetRole and targetDepartment match the user,
    // or where they are null (global)
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

    reply.send({ announcements });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

async function getAllAnnouncements(request, reply) {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        author: {
          select: { name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    reply.send({ announcements });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

async function deleteAnnouncement(request, reply) {
  try {
    const { id } = request.params;
    const { role, id: userId } = request.user;

    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!announcement) {
      return reply.code(404).send({ error: 'Announcement not found' });
    }

    if (role !== 'ADMIN' && announcement.authorId !== userId) {
      return reply.code(403).send({ error: 'Unauthorized to delete this announcement' });
    }

    await prisma.announcement.delete({
      where: { id: parseInt(id) }
    });

    reply.send({ message: 'Announcement deleted successfully' });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAllAnnouncements,
  deleteAnnouncement
};
