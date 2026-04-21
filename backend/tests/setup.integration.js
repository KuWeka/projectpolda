process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration_test_jwt_secret_key_minimum_32_chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'integration_test_refresh_secret_key_minimum_32_chars';
process.env.DB_NAME = process.env.DB_NAME || 'helpdesk_db';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD || '';

// Keep error logs visible for integration debugging, silence info noise.
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
};
