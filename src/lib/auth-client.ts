import { createAuthClient } from 'better-auth/react';

const runtimeBaseURL =
  (typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000');

export const authClient = createAuthClient({
  baseURL: runtimeBaseURL,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  resetPassword,
  requestPasswordReset,
} = authClient;
