import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: { signAsync: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn(), update: jest.fn() },
      organization: { findUnique: jest.fn() },
      refreshToken: { create: jest.fn().mockResolvedValue({}) },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('access-token') };
    const config = { get: jest.fn().mockReturnValue('secret') } as unknown as ConfigService;
    service = new AuthService(
      prisma as PrismaService,
      jwt as unknown as JwtService,
      config,
    );
  });

  describe('login', () => {
    it('rejects unknown users', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nobody@acme.test', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'user@acme.test',
        organizationId: 'org-1',
        role: 'REQUESTER',
        isActive: true,
        passwordHash,
      });
      await expect(
        service.login({ email: 'user@acme.test', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues tokens on valid credentials', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'user@acme.test',
        firstName: 'U',
        lastName: 'Ser',
        organizationId: 'org-1',
        role: 'REQUESTER',
        isActive: true,
        passwordHash,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.login({
        email: 'user@acme.test',
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.user.email).toBe('user@acme.test');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('rejects an already-registered email', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({
          organizationName: 'Acme',
          email: 'dup@acme.test',
          password: 'Password123!',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
