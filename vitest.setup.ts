import '@testing-library/jest-dom';
import 'vitest-localstorage-mock';
import { vi } from 'vitest';

vi.mock('~/env', async () => {
  // Using a simplified mock for env to avoid issues with `createEnv` in test environment
  return {
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'mock-firebase-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'mock-firebase-auth-domain',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'mock-firebase-project-id',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'mock-firebase-storage-bucket',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'mock-firebase-messaging-sender-id',
      NEXT_PUBLIC_FIREBASE_APP_ID: 'mock-firebase-app-id',
    },
  };
});
