import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';
import { resetDb, createUser } from './helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await pool.end();
});

describe('applications CRUD', () => {
  it('creates and lists an application for the owner', async () => {
    const user = await createUser('owner@example.com');

    const create = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ company: 'Acme', role: 'SWE', status: 'Applied' });

    expect(create.status).toBe(201);
    expect(create.body.application).toMatchObject({ company: 'Acme', role: 'SWE' });

    const list = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${user.token}`);

    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
    expect(list.body.applications).toHaveLength(1);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.status).toBe(401);
  });

  it('validates required fields on create', async () => {
    const user = await createUser('val@example.com');
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ role: 'SWE' }); // missing company

    expect(res.status).toBe(400);
  });

  it('paginates results with limit/offset', async () => {
    const user = await createUser('page@example.com');

    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ company: `Co${i}`, role: 'SWE' });
    }

    const res = await request(app)
      .get('/api/applications?limit=2&offset=0')
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.limit).toBe(2);
    expect(res.body.applications).toHaveLength(2);
  });
});

describe('applications ownership isolation', () => {
  it('does not leak one user\'s applications to another', async () => {
    const alice = await createUser('alice@example.com');
    const bob = await createUser('bob@example.com');

    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ company: 'AliceCorp', role: 'SWE' });

    const bobList = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${bob.token}`);

    expect(bobList.status).toBe(200);
    expect(bobList.body.total).toBe(0);
    expect(bobList.body.applications).toHaveLength(0);
  });

  it("returns 404 when accessing another user's application by id", async () => {
    const alice = await createUser('alice2@example.com');
    const bob = await createUser('bob2@example.com');

    const created = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ company: 'AliceCorp', role: 'SWE' });
    const id = created.body.application.id;

    const get = await request(app)
      .get(`/api/applications/${id}`)
      .set('Authorization', `Bearer ${bob.token}`);
    expect(get.status).toBe(404);

    const update = await request(app)
      .put(`/api/applications/${id}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ status: 'Offer' });
    expect(update.status).toBe(404);

    const del = await request(app)
      .delete(`/api/applications/${id}`)
      .set('Authorization', `Bearer ${bob.token}`);
    expect(del.status).toBe(404);

    // Alice can still access her own untouched application.
    const aliceGet = await request(app)
      .get(`/api/applications/${id}`)
      .set('Authorization', `Bearer ${alice.token}`);
    expect(aliceGet.status).toBe(200);
    expect(aliceGet.body.application.status).toBe('Applied');
  });
});
