const Redis = require('ioredis');

process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.JWT_SECRET = 'test_secret';
process.env.COOKIE_SECRET = '12345678901234567890123456789012'; // Needs to be 32 chars for fastify/cookie

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      quit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  });
});
