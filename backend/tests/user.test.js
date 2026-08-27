jest.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    department: {
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

describe('User API Integration Tests', () => {
  let adminToken;
  let internToken;

  beforeAll(async () => {
    await fastify.ready();
    adminToken = fastify.jwt.sign({ id: 1, role: 'ADMIN', name: 'Admin', department: 'HR' });
    internToken = fastify.jwt.sign({ id: 2, role: 'INTERN', name: 'Intern', department: 'Eng' });
  });

  afterAll(async () => {
    await fastify.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users', () => {
    it('should return a list of users for admin', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 2, name: 'Intern User', role: 'INTERN' }
      ]);

      const response = await request(fastify.server)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should allow admin to create user', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 1, name: 'Eng' });
      prisma.user.create.mockResolvedValue({ id: 3, email: 'new@test.com', role: 'INTERN' });

      const response = await request(fastify.server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new@test.com',
          name: 'New Intern',
          password: 'password123',
          role: 'INTERN',
          department: 'Eng'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny intern from creating user', async () => {
      const response = await request(fastify.server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${internToken}`)
        .send({
          email: 'hack@test.com',
          name: 'Hack Intern',
          password: 'password123',
          role: 'INTERN'
        });

      expect(response.status).toBe(403);
    });
  });
});
