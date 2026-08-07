import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Configure test environment default variables
process.env.JWT_SECRET = 'test_secret_key_oh_richi_12345';
(process.env as any).NODE_ENV = 'test';

// Reset mocks automatically before each test
beforeEach(() => {
  vi.clearAllMocks();
});
