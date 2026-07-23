import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';

/** Wipe all data between tests for isolation. */
export async function resetDb(): Promise<void> {
  await pool.query('TRUNCATE applications, users RESTART IDENTITY CASCADE');
}

export interface TestUser {
  token: string;
  id: number;
  email: string;
}

/** Sign up a user and return their auth token + id. */
export async function createUser(
  email = 'user@example.com',
  password = 'password123',
  name = 'Test User'
): Promise<TestUser> {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password, name });

  if (res.status !== 201) {
    throw new Error(`createUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.token, id: res.body.user.id, email };
}

/** Authorization header for a token. */
export function auth(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}
