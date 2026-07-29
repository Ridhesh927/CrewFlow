
async function createLeaveRequest(request, reply) {
  try {
    const prisma = request.server.prisma;
    const { startDate, endDate, reason } = request.body;
    const userId = request.user.id;

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason
      }
    });

    reply.code(201).send({ message: 'Leave request created successfully', leaveRequest });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

async function getLeaveRequests(request, reply) {
  try {
    const prisma = request.server.prisma;
    const { role, id } = request.user;
    let leaveRequests;

    if (role === 'INTERN') {
      // Interns see their own leave requests
      leaveRequests = await prisma.leaveRequest.findMany({
        where: { userId: id },
        include: { user: { select: { name: true, email: true, department: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'ADMIN') {
      // Admins see all leave requests
      leaveRequests = await prisma.leaveRequest.findMany({
        include: { user: { select: { name: true, email: true, department: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // TLs/Managers see leave requests of their subordinates
      leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          user: {
            managerId: id
          }
        },
        include: { user: { select: { name: true, email: true, department: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }

    reply.send({ leaveRequests });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

async function approveLeaveRequest(request, reply) {
  try {
    const prisma = request.server.prisma;
    const { id } = request.params;
    const { role, id: approverId } = request.user;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!leaveRequest) {
      return reply.code(404).send({ error: 'Leave request not found' });
    }

    if (role !== 'ADMIN' && leaveRequest.user.managerId !== approverId) {
      return reply.code(403).send({ error: 'Unauthorized to approve this leave request' });
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'APPROVED' }
    });

    // Create attendance records for the approved leave dates
    const startDate = new Date(updatedLeaveRequest.startDate);
    const endDate = new Date(updatedLeaveRequest.endDate);
    
    // Iterate through dates and mark as 'Leave'
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const current = new Date(d);
      
      // Ensure we don't duplicate attendance records if they already exist
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: updatedLeaveRequest.userId,
          date: current
        }
      });

      if (!existingAttendance) {
        await prisma.attendance.create({
          data: {
            userId: updatedLeaveRequest.userId,
            date: current,
            status: 'Leave',
            markedBy: approverId,
            remarks: 'Approved leave request'
          }
        });
      } else {
        await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            status: 'Leave',
            markedBy: approverId,
            remarks: 'Updated due to approved leave request'
          }
        });
      }
    }

    reply.send({ message: 'Leave request approved', leaveRequest: updatedLeaveRequest });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

async function rejectLeaveRequest(request, reply) {
  try {
    const prisma = request.server.prisma;
    const { id } = request.params;
    const { role, id: approverId } = request.user;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!leaveRequest) {
      return reply.code(404).send({ error: 'Leave request not found' });
    }

    if (role !== 'ADMIN' && leaveRequest.user.managerId !== approverId) {
      return reply.code(403).send({ error: 'Unauthorized to reject this leave request' });
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'REJECTED' }
    });

    reply.send({ message: 'Leave request rejected', leaveRequest: updatedLeaveRequest });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
}

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest
};
