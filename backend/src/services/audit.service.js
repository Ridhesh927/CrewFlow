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

function sanitizeDetails(details) {
  if (!details || typeof details !== 'object') return details;
  const sensitiveKeys = ['password', 'token', 'secret', 'hash', 'jwt', 'cookie', 'authorization'];
  
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = sensitiveKeys.some(s => key.toLowerCase().includes(s));
      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        result[key] = sanitize(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  return sanitize(details);
}

function maskIpAddress(ip) {
  if (!ip) return null;
  // If IPv4: 192.168.1.45 -> 192.168.1.***
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
  }
  // If IPv6: mask the suffix
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length > 2) {
      return `${parts.slice(0, 2).join(':')}:****:****`;
    }
  }
  return '***.***.***.***';
}

const getAuditLogs = async ({ page = 1, limit = 20, action, resource } = {}) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * take;

  const where = {};
  if (action && typeof action === 'string') {
    where.action = action;
  }
  if (resource && typeof resource === 'string') {
    where.resource = resource;
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    })
  ]);

  const sanitizedLogs = logs.map(log => ({
    id: log.id,
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    createdAt: log.createdAt,
    user: log.user ? {
      id: log.user.id,
      name: log.user.name,
      role: log.user.role
    } : null,
    details: sanitizeDetails(log.details),
    ipAddress: maskIpAddress(log.ipAddress)
  }));

  return {
    logs: sanitizedLogs,
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take) || 1
    }
  };
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
