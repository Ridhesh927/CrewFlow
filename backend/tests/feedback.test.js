jest.mock('@prisma/client', () => {
  const mPrisma = {
    feedback: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
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

describe('Feedback API Integration & Privacy Tests', () => {
  let adminToken;
  let internToken;

  beforeAll(async () => {
    await fastify.ready();
    adminToken = fastify.jwt.sign({ id: 1, role: 'ADMIN', name: 'Admin', department: 'HR' });
    internToken = fastify.jwt.sign({ id: 2, role: 'INTERN', name: 'Intern User', department: 'Engineering' });
  });

  afterAll(async () => {
    await fastify.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/feedback', () => {
    it('should return all feedback with submitter info for admin', async () => {
      prisma.feedback.findMany.mockResolvedValue([
        {
          id: 1,
          type: 'Suggestion',
          subject: 'Coffee machine',
          description: 'Need more coffee',
          status: 'OPEN',
          user: { id: 2, name: 'Intern User', email: 'intern@test.com', department: { name: 'Engineering' } }
        }
      ]);

      const response = await request(fastify.server)
        .get('/api/v1/feedback')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.feedback[0].user).toBeDefined();
      expect(response.body.feedback[0].user.name).toBe('Intern User');
      expect(response.body.feedback[0].user.department).toBe('Engineering');
    });

    it('should scope feedback query to current user for non-admin', async () => {
      prisma.feedback.findMany.mockResolvedValue([
        {
          id: 2,
          userId: 2,
          type: 'Grievance',
          subject: 'Workload',
          description: 'Too high',
          status: 'OPEN'
        }
      ]);

      const response = await request(fastify.server)
        .get('/api/v1/feedback')
        .set('Authorization', `Bearer ${internToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.feedback.findMany).toHaveBeenCalledWith({
        where: { userId: 2 },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('POST /api/v1/feedback', () => {
    it('should allow user to submit feedback', async () => {
      prisma.feedback.create.mockResolvedValue({
        id: 3,
        userId: 2,
        type: 'Suggestion',
        subject: 'Flexible hours',
        description: 'Allow flexible check-in',
        status: 'OPEN'
      });

      const response = await request(fastify.server)
        .post('/api/v1/feedback')
        .set('Authorization', `Bearer ${internToken}`)
        .send({
          type: 'Suggestion',
          subject: 'Flexible hours',
          description: 'Allow flexible check-in'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.feedback.create).toHaveBeenCalledWith({
        data: {
          userId: 2,
          type: 'Suggestion',
          subject: 'Flexible hours',
          description: 'Allow flexible check-in'
        }
      });
    });
  });

  describe('PATCH /api/v1/feedback/:id/status', () => {
    it('should allow admin to update feedback status', async () => {
      prisma.feedback.update.mockResolvedValue({
        id: 1,
        status: 'RESOLVED',
        adminNotes: 'Resolved by HR'
      });

      const response = await request(fastify.server)
        .patch('/api/v1/feedback/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
          adminNotes: 'Resolved by HR'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should forbid non-admin from updating status', async () => {
      const response = await request(fastify.server)
        .patch('/api/v1/feedback/1/status')
        .set('Authorization', `Bearer ${internToken}`)
        .send({
          status: 'RESOLVED'
        });

      expect(response.status).toBe(403);
    });
  });
});
