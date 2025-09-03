import '@testing-library/jest-dom';
import 'vitest-localstorage-mock';
import { vi } from 'vitest';

vi.mock('~/env', () => {
  const actual = vi.importActual('~/env');
  return {
    ...actual,
    env: {
      ...actual.env,
    },
  };
});
