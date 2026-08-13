const prisma = require('../prismaClient');
const ApiError = require('../plugins/ApiError');

const createLeaveRequest = async (userId, startDate, endDate, reason) => {
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    }
  });

  return leaveRequest;
};

const getLeaveRequests = async (user) => {
  const { role, id } = user;
  let leaveRequests;

  if (role === 'INTERN') {
    leaveRequests = await prisma.leaveRequest.findMany({
      where: { userId: id },
      include: { user: { select: { name: true, email: true, department: true } } },
      orderBy: { createdAt: 'desc' }
    });
  } else if (role === 'ADMIN') {
    leaveRequests = await prisma.leaveRequest.findMany({
      include: { user: { select: { name: true, email: true, department: true } } },
      orderBy: { createdAt: 'desc' }
    });
  } else {
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

  return leaveRequests;
};

const approveLeaveRequest = async (leaveId, approver) => {
  const { role, id: approverId } = approver;

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: parseInt(leaveId) },
    include: { user: true }
  });

  if (!leaveRequest) {
    throw new ApiError(404, 'Leave request not found');
  }

  if (role !== 'ADMIN' && leaveRequest.user.managerId !== approverId) {
    throw new ApiError(403, 'Unauthorized to approve this leave request');
  }

  const updatedLeaveRequest = await prisma.leaveRequest.update({
    where: { id: parseInt(leaveId) },
    data: { status: 'APPROVED' }
  });

  const startDate = new Date(updatedLeaveRequest.startDate);
  const endDate = new Date(updatedLeaveRequest.endDate);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const current = new Date(d);
    
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

  return updatedLeaveRequest;
};

const rejectLeaveRequest = async (leaveId, approver) => {
  const { role, id: approverId } = approver;

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: parseInt(leaveId) },
    include: { user: true }
  });

  if (!leaveRequest) {
    throw new ApiError(404, 'Leave request not found');
  }

  if (role !== 'ADMIN' && leaveRequest.user.managerId !== approverId) {
    throw new ApiError(403, 'Unauthorized to reject this leave request');
  }

  const updatedLeaveRequest = await prisma.leaveRequest.update({
    where: { id: parseInt(leaveId) },
    data: { status: 'REJECTED' }
  });

  return updatedLeaveRequest;
};

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest
};
