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
  const id = parseInt(leaveId, 10);
  if (isNaN(id)) throw new ApiError(400, 'Invalid leave request ID');

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { user: true }
  });
  if (!leaveRequest) {
    throw new ApiError(404, 'Leave request not found');
  }

  if (role !== 'ADMIN' && leaveRequest.user.managerId !== approverId) {
    throw new ApiError(403, 'Unauthorized to approve this leave request');
  }

  // Use an atomic transaction for all database writes
  return await prisma.$transaction(async (tx) => {
    const updatedLeaveRequest = await tx.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    const start = new Date(updatedLeaveRequest.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(updatedLeaveRequest.endDate);
    end.setUTCHours(0, 0, 0, 0);

    // 1. Pre-fetch all existing attendances for this date range in one query
    const existingAttendances = await tx.attendance.findMany({
      where: {
        userId: updatedLeaveRequest.userId,
        date: { gte: start, lte: end }
      }
    });

    // 2. Create a fast lookup map using the date's timestamp
    const attendanceMap = new Map(
      existingAttendances.map(a => [a.date.getTime(), a.id])
    );

    const attendancesToCreate = [];
    const attendancesToUpdate = [];

    let current = new Date(start);
    while (current <= end) {
      const currentTimestamp = current.getTime();
      
      if (attendanceMap.has(currentTimestamp)) {
        // Prepare for update
        attendancesToUpdate.push(attendanceMap.get(currentTimestamp));
      } else {
        // Prepare for creation
        attendancesToCreate.push({
          userId: updatedLeaveRequest.userId,
          date: new Date(current),
          status: 'Leave',
          markedBy: approverId,
          remarks: 'Approved leave request'
        });
      }
      current.setDate(current.getDate() + 1);
    }

    // 3. Execute bulk writes (only 2 queries instead of 28!)
    if (attendancesToCreate.length > 0) {
      await tx.attendance.createMany({ data: attendancesToCreate });
    }
    
    if (attendancesToUpdate.length > 0) {
      await tx.attendance.updateMany({
        where: { id: { in: attendancesToUpdate } },
        data: {
          status: 'Leave',
          markedBy: approverId,
          remarks: 'Updated due to approved leave request'
        }
      });
    }

    return updatedLeaveRequest;
  });
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
