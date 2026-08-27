jest.mock('@prisma/client', () => {
  const mPrisma = {
    attendance: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

const request = require('supertest');
const fastify = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Attendance API Integration Tests', () => {
  let token;
  let adminToken;

  beforeAll(async () => {
    await fastify.ready();
    token = fastify.jwt.sign({ id: 1, role: 'INTERN', name: 'John Doe', department: 'Engineering' });
    adminToken = fastify.jwt.sign({ id: 2, role: 'ADMIN', name: 'Admin User', department: 'HR' });
  });

  afterAll(async () => {
    await fastify.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/attendances', () => {
    it('should return attendances for an intern', async () => {
      prisma.attendance.findMany.mockResolvedValue([
        { id: 1, date: new Date('2026-07-28').toISOString(), status: 'Present' }
      ]);

      const response = await request(fastify.server)
        .get('/api/v1/attendances')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.attendances).toHaveLength(1);
      expect(prisma.attendance.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 1 }
      }));
    });
  });

  describe('POST /api/v1/attendances', () => {
    it('should allow admin to mark attendance', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 3, department: 'Engineering' });
      prisma.attendance.upsert.mockResolvedValue({ id: 2, status: 'Present', markedBy: 2 });

      const response = await request(fastify.server)
        .post('/api/v1/attendances/mark')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetUserId: 3,
          date: '2026-07-29',
          status: 'Present',
          remarks: 'On time'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.attendance.status).toBe('Present');
      expect(prisma.attendance.upsert).toHaveBeenCalled();
    });

    it('should deny intern from marking attendance', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/attendances/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetUserId: 3,
          date: '2026-07-29',
          status: 'Present'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Interns cannot mark attendance');
    });
  });
});
