import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { resetDb } from './helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await pool.end();
});

describe('auth', () => {
  it('signs up a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'a@example.com', password: 'password123', name: 'Alice' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: 'a@example.com', name: 'Alice' });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects a weak (too short) password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'b@example.com', password: '123', name: 'Bob' });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'password123', name: 'Dup' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'password123', name: 'Dup2' });

    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'c@example.com', password: 'password123', name: 'Carol' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'c@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects login with wrong password', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'd@example.com', password: 'password123', name: 'Dan' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'd@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });

  it('returns the current user from GET /me with a valid token', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'e@example.com', password: 'password123', name: 'Eve' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signup.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('e@example.com');
  });

  it('rejects GET /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
