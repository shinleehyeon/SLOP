import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { setupProblemDetails } from '../src/bootstrap/setup-problem-details';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const email = `e2e-${Date.now()}@example.com`;
  const password = 'password1234';
  const name = 'E2E User';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupProblemDetails(app);
    app.setGlobalPrefix('api');

    prismaService = app.get(PrismaService);
    await prismaService.user.deleteMany({
      where: {
        email,
      },
    });

    await app.init();
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({
      where: {
        email,
      },
    });
    await app.close();
  });

  it('registers, logs in, reads current user, refreshes, and logs out', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        name,
        password,
      })
      .expect(201);

    expect(registerResponse.body.body.user).toMatchObject({
      email,
      name,
    });
    expect(registerResponse.body.body.tokens.accessToken).toEqual(expect.any(String));
    expect(registerResponse.body.body.tokens.refreshToken).toEqual(expect.any(String));

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const accessToken = loginResponse.body.body.tokens.accessToken;
    const refreshToken = loginResponse.body.body.tokens.refreshToken;

    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.body).toMatchObject({
          email,
          name,
        });
      });

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(200);

    const rotatedRefreshToken = refreshResponse.body.body.tokens.refreshToken;
    expect(refreshResponse.body.body.tokens.accessToken).toEqual(expect.any(String));
    expect(rotatedRefreshToken).toEqual(expect.any(String));
    expect(rotatedRefreshToken).not.toBe(refreshToken);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .send({
        refreshToken: rotatedRefreshToken,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.body).toEqual({
          success: true,
        });
      });

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refreshToken: rotatedRefreshToken,
      })
      .expect(401);
  });
});
