const request = require('supertest');
const fastify = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

jest.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

const prisma = new PrismaClient();

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login a user successfully', async () => {
      const hashedPassword = await argon2.hash('password123');
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        role: 'INTERN',
        name: 'Test Intern',
        department: 'Eng'
      });

      const response = await request(fastify.server)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should fail with invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(fastify.server)
        .post('/api/v1/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});
