import '@testing-library/jest-dom';
import 'vitest-localstorage-mock';
import { vi } from 'vitest';

vi.mock('./src/env.js', () => ({
  env: {
    DATABASE_URL: 'file:./test.db',
    NODE_ENV: 'test',
  },
}));
