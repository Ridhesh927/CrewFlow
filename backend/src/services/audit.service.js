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

module.exports = {
  logAction,
  getAuditLogs
};
