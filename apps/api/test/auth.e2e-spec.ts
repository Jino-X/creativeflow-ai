import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Requires a running database (`npm run db:up` + `npm run prisma:deploy`).
 * Run with: npm run test:e2e
 */
describe('Auth & Requests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const unique = Date.now();
  const email = `e2e-${unique}@acme.test`;
  let accessToken: string;
  let requestId: string;
  let assetId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { organizationId: true },
    });
    if (user) {
      const orgId = user.organizationId;
      // Clear child rows that RESTRICT user deletion (asset versions reference uploader),
      // then delete the org which cascades the remaining users/requests.
      await prisma.asset.deleteMany({ where: { organizationId: orgId } });
      await prisma.creativeRequest.deleteMany({ where: { organizationId: orgId } });
      await prisma.organization.delete({ where: { id: orgId } });
    }
    await app.close();
  });

  it('GET /health is public', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.data.status).toBeDefined();
  });

  it('rejects unauthenticated access to protected routes', async () => {
    await request(app.getHttpServer()).get('/api/v1/requests').expect(401);
  });

  it('registers a new organization + admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        organizationName: `E2E Org ${unique}`,
        email,
        password: 'Password123!',
        firstName: 'E2E',
        lastName: 'Tester',
      })
      .expect(201);

    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
  });

  it('creates and lists a request for the authenticated tenant', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'E2E banner request', priority: 'HIGH' })
      .expect(201);

    expect(created.body.data.status).toBe('DRAFT');
    requestId = created.body.data.id;

    const list = await request(app.getHttpServer())
      .get('/api/v1/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(list.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('uploads an asset and bumps versions', async () => {
    const uploaded = await request(app.getHttpServer())
      .post(`/api/v1/requests/${requestId}/assets`)
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', 'Hero banner')
      .attach('file', Buffer.from('fake-png-bytes'), 'hero-banner.png')
      .expect(201);

    expect(uploaded.body.data.status).toBe('PENDING_REVIEW');
    expect(uploaded.body.data.currentVersion).toBe(1);
    assetId = uploaded.body.data.id;

    const v2 = await request(app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('fake-png-bytes-v2'), 'hero-banner-v2.png')
      .expect(201);

    expect(v2.body.data.currentVersion).toBe(2);
  });

  it('approves an asset (admin) and downloads it', async () => {
    const reviewed = await request(app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ decision: 'APPROVED', note: 'Looks great' })
      .expect(201);
    expect(reviewed.body.data.status).toBe('APPROVED');

    const download = await request(app.getHttpServer())
      .get(`/api/v1/assets/${assetId}/download`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(download.headers['content-disposition']).toContain('hero-banner-v2.png');
  });

  it('adds a comment with a self-mention', async () => {
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const userId = me.body.data.id;

    const comment = await request(app.getHttpServer())
      .post(`/api/v1/requests/${requestId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ body: 'Kicking this off, cc me', mentionedUserIds: [userId] })
      .expect(201);
    expect(comment.body.data.mentions).toHaveLength(1);

    const list = await request(app.getHttpServer())
      .get(`/api/v1/requests/${requestId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('enriches a request with AI (heuristic fallback)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/ai/requests/${requestId}/enrich`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.classification.source).toBe('heuristic');
    expect(res.body.data.acceptanceCriteria.length).toBeGreaterThan(0);
  });
});
