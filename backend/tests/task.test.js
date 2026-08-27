const request = require('supertest');
const fastify = require('../src/app');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client', () => {
  const mPrisma = {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    proof: {
      findMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

const prisma = new PrismaClient();

describe('Task API Integration Tests', () => {
  let tlToken;
  let internToken;

  beforeAll(async () => {
    await fastify.ready();
    tlToken = fastify.jwt.sign({ id: 1, role: 'TL', name: 'Team Lead', department: 'Eng' });
    internToken = fastify.jwt.sign({ id: 2, role: 'INTERN', name: 'Intern', department: 'Eng' });
  });

  afterAll(async () => {
    await fastify.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/tasks', () => {
    it('should return tasks assigned to the intern', async () => {
      prisma.task.findMany.mockResolvedValue([
        { id: 1, title: 'Test Task' }
      ]);

      const response = await request(fastify.server)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${internToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('should allow TL to create task', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 2 }]);
      prisma.task.create.mockResolvedValue({ id: 2, title: 'New Task' });

      const response = await request(fastify.server)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${tlToken}`)
        .send({
          title: 'New Task',
          description: 'A test task',
          targetAudience: 'Eng',
          deadline: new Date().toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should deny intern from creating task', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${internToken}`)
        .send({
          title: 'New Task',
          description: 'A test task',
          targetAudience: 'Eng',
          deadline: new Date().toISOString()
        });

      expect(response.status).toBe(403);
    });
  });
});
