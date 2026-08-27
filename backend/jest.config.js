module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
