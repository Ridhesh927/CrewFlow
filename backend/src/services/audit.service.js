const prisma = require('../prismaClient');

/**
 * Logs an action to the audit log
 * @param {Object} params
 * @param {number} [params.userId] ID of the user performing the action
 * @param {string} params.action The action performed (e.g. 'USER_LOGIN', 'PROOF_APPROVED')
 * @param {string} [params.resource] The resource affected (e.g. 'User', 'Proof')
 * @param {number} [params.resourceId] The ID of the resource affected
 * @param {Object} [params.details] Any additional details
 * @param {string} [params.ipAddress] IP address of the requester
 */
const logAction = async ({ userId, action, resource, resourceId, details, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        resource,
        resourceId: resourceId || null,
        details: details || null,
        ipAddress: ipAddress || null
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

const getAuditLogs = async () => {
  return await prisma.auditLog.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 500 // Limit to last 500 logs for performance
  });
};

const ApiError = require('../plugins/ApiError');

const restoreAction = async (auditLogId, requester) => {
  if (requester.role !== 'ADMIN') {
    throw new ApiError(403, 'Only admins can restore actions');
  }

  const log = await prisma.auditLog.findUnique({
    where: { id: parseInt(auditLogId) }
  });

  if (!log) {
    throw new ApiError(404, 'Audit log not found');
  }

  if (log.action === 'USER_DELETED') {
    const details = log.details;
    if (!details || !details.snapshot) {
      throw new ApiError(400, 'No structural snapshot available to restore this user');
    }

    const { snapshot } = details;

    // Check if email or specialId is already taken by someone else now
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: snapshot.email },
          ...(snapshot.specialId ? [{ specialId: snapshot.specialId }] : [])
        ]
      }
    });

    if (existingUser) {
      throw new ApiError(400, 'Cannot restore user. Email or Special ID is currently in use.');
    }

    // Restore the user (without regenerating password hash, we have it in the snapshot)
    await prisma.user.create({
      data: {
        id: snapshot.id, // Explicitly restoring the same ID if possible
        email: snapshot.email,
        password: snapshot.password,
        name: snapshot.name,
        role: snapshot.role,
        department: snapshot.department,
        isActive: snapshot.isActive,
        specialId: snapshot.specialId,
        phoneNo: snapshot.phoneNo,
        points: snapshot.points,
        managerId: snapshot.managerId
      }
    });

    await logAction({
      userId: requester.id,
      action: 'USER_RESTORED',
      resource: 'User',
      resourceId: snapshot.id,
      details: { restoredFromLogId: log.id }
    });

    return { success: true, message: 'User restored successfully' };
  }

  throw new ApiError(400, `Restoration for action type ${log.action} is not supported`);
};

module.exports = {
  logAction,
  getAuditLogs,
  restoreAction
};
