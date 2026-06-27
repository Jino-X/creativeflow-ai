import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssetStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { StorageService } from '../storage/storage.interface';
import { AssetsService, UploadedFile } from './assets.service';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: any;
  let storage: jest.Mocked<StorageService>;

  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'd@acme.test',
    organizationId: 'org-1',
    role: Role.DESIGNER,
  };

  const file: UploadedFile = {
    originalname: 'banner.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('fake-image'),
  };

  beforeEach(() => {
    prisma = {
      creativeRequest: { findFirst: jest.fn().mockResolvedValue({ id: 'req-1' }) },
      asset: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
      assetVersion: { create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    storage = { save: jest.fn().mockResolvedValue('key'), read: jest.fn(), delete: jest.fn() };
    const config = {
      get: jest.fn().mockReturnValue(25),
    } as unknown as ConfigService;
    service = new AssetsService(prisma as PrismaService, config, storage);
  });

  it('rejects files larger than the configured limit', async () => {
    const big = { ...file, size: 26 * 1024 * 1024 };
    await expect(
      service.upload(user, 'req-1', big),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects upload to a request in another tenant', async () => {
    prisma.creativeRequest.findFirst.mockResolvedValue(null);
    await expect(service.upload(user, 'req-x', file)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores the file and creates version 1 on upload', async () => {
    prisma.asset.create.mockResolvedValue({ id: 'asset-1' });
    prisma.asset.findFirst.mockResolvedValue({
      id: 'asset-1',
      versions: [],
      uploadedBy: {},
      reviewedBy: null,
    });

    await service.upload(user, 'req-1', file, 'Hero banner');

    expect(storage.save).toHaveBeenCalledTimes(1);
    const versionArg = prisma.assetVersion.create.mock.calls[0][0];
    expect(versionArg.data.version).toBe(1);
    expect(versionArg.data.checksum).toEqual(expect.any(String));
  });

  it('blocks reviewing an asset that is not pending', async () => {
    prisma.asset.findFirst.mockResolvedValue({
      id: 'asset-1',
      status: AssetStatus.APPROVED,
    });
    await expect(
      service.review(user, 'asset-1', { decision: AssetStatus.REJECTED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bumps version and resets status to pending on a new version', async () => {
    prisma.asset.findFirst
      .mockResolvedValueOnce({ id: 'asset-1', currentVersion: 2, status: AssetStatus.APPROVED })
      .mockResolvedValueOnce({ id: 'asset-1', versions: [], uploadedBy: {}, reviewedBy: null });

    await service.addVersion(user, 'asset-1', file);

    expect(storage.save).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
