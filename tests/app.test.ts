import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

const PORT = 3456;
let server: ReturnType<typeof app.listen>;

beforeAll(async () => {
  server = app.listen(PORT);
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('GET /teams', () => {
  it('debe responder con 200 y un array de equipos', async () => {
    const response = await request(app).get('/teams');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
