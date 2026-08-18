const request = require('supertest');
const fastify = require('../src/app');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client', () => {
  const mPrisma = {
    leaveRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

const prisma = new PrismaClient();

describe('Leave API Integration Tests', () => {
  let token;

  beforeAll(async () => {
    await fastify.ready();
    token = fastify.jwt.sign({ id: 1, role: 'INTERN', name: 'John Doe' });
  });

  afterAll(async () => {
    await fastify.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/leaves', () => {
    it('should create a new leave request when valid data is provided', async () => {
      const mockLeaveData = {
        id: 1,
        userId: 1,
        startDate: new Date('2026-08-01').toISOString(),
        endDate: new Date('2026-08-05').toISOString(),
        status: 'PENDING',
        reason: 'Medical'
      };

      prisma.leaveRequest.create.mockResolvedValue(mockLeaveData);

      const response = await request(fastify.server)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startDate: '2026-08-01',
          endDate: '2026-08-05',
          reason: 'Medical'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Leave request created successfully');
      expect(response.body.leaveRequest.id).toBe(1);
    });
  });

  describe('GET /api/v1/leaves', () => {
    it('should return leave requests for the intern', async () => {
      prisma.leaveRequest.findMany.mockResolvedValue([
        { id: 1, reason: 'Sick leave', status: 'PENDING' }
      ]);

      const response = await request(fastify.server)
        .get('/api/v1/leaves')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.leaveRequests).toHaveLength(1);
      expect(prisma.leaveRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 1 }
      }));
    });
  });
});
