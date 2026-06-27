import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssetStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';
import { ReviewAssetDto } from './dto/review-asset.dto';

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const assetInclude = {
  versions: { orderBy: { version: 'desc' as const } },
  uploadedBy: { select: { id: true, firstName: true, lastName: true } },
  reviewedBy: { select: { id: true, firstName: true, lastName: true } },
};

@Injectable()
export class AssetsService {
  private readonly maxBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {
    this.maxBytes = (config.get<number>('storage.maxFileSizeMb') ?? 25) * 1024 * 1024;
  }

  private validateFile(file?: UploadedFile): asserts file is UploadedFile {
    if (!file) {
      throw new BadRequestException('A file is required');
    }
    if (file.size > this.maxBytes) {
      throw new BadRequestException(
        `File exceeds the maximum size of ${this.maxBytes / (1024 * 1024)}MB`,
      );
    }
  }

  private buildKey(orgId: string, assetId: string, version: number, fileName: string): string {
    const ext = extname(fileName);
    return `${orgId}/${assetId}/v${version}${ext}`;
  }

  private async assertRequest(orgId: string, requestId: string) {
    const request = await this.prisma.creativeRequest.findFirst({
      where: { id: requestId, organizationId: orgId },
      select: { id: true },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
  }

  async upload(
    user: AuthenticatedUser,
    requestId: string,
    file: UploadedFile,
    name?: string,
    notes?: string,
  ) {
    this.validateFile(file);
    await this.assertRequest(user.organizationId, requestId);

    const asset = await this.prisma.asset.create({
      data: {
        organizationId: user.organizationId,
        requestId,
        name: name ?? file.originalname,
        uploadedById: user.id,
        currentVersion: 1,
      },
    });

    const key = this.buildKey(user.organizationId, asset.id, 1, file.originalname);
    await this.storage.save(key, file.buffer, file.mimetype);

    await this.prisma.assetVersion.create({
      data: {
        assetId: asset.id,
        version: 1,
        fileName: file.originalname,
        storageKey: key,
        mimeType: file.mimetype,
        size: file.size,
        checksum: createHash('sha256').update(file.buffer).digest('hex'),
        notes,
        uploadedById: user.id,
      },
    });

    return this.findOne(user.organizationId, asset.id);
  }

  async addVersion(user: AuthenticatedUser, assetId: string, file: UploadedFile, notes?: string) {
    this.validateFile(file);
    const asset = await this.findOneRaw(user.organizationId, assetId);

    const nextVersion = asset.currentVersion + 1;
    const key = this.buildKey(user.organizationId, asset.id, nextVersion, file.originalname);
    await this.storage.save(key, file.buffer, file.mimetype);

    await this.prisma.$transaction([
      this.prisma.assetVersion.create({
        data: {
          assetId: asset.id,
          version: nextVersion,
          fileName: file.originalname,
          storageKey: key,
          mimeType: file.mimetype,
          size: file.size,
          checksum: createHash('sha256').update(file.buffer).digest('hex'),
          notes,
          uploadedById: user.id,
        },
      }),
      // A new version resets the asset to pending review.
      this.prisma.asset.update({
        where: { id: asset.id },
        data: {
          currentVersion: nextVersion,
          status: AssetStatus.PENDING_REVIEW,
          reviewedById: null,
          reviewedAt: null,
          reviewNote: null,
        },
      }),
    ]);

    return this.findOne(user.organizationId, asset.id);
  }

  listForRequest(orgId: string, requestId: string) {
    return this.prisma.asset.findMany({
      where: { organizationId: orgId, requestId },
      include: assetInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOneRaw(orgId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async findOne(orgId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, organizationId: orgId },
      include: assetInclude,
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async review(user: AuthenticatedUser, id: string, dto: ReviewAssetDto) {
    const asset = await this.findOneRaw(user.organizationId, id);
    if (asset.status !== AssetStatus.PENDING_REVIEW) {
      throw new BadRequestException(`Asset has already been ${asset.status.toLowerCase()}`);
    }
    await this.prisma.asset.update({
      where: { id: asset.id },
      data: {
        status: dto.decision,
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNote: dto.note,
      },
    });
    return this.findOne(user.organizationId, id);
  }

  async getDownload(orgId: string, id: string, version?: number) {
    const asset = await this.findOne(orgId, id);
    const target = version
      ? asset.versions.find((v) => v.version === version)
      : asset.versions.find((v) => v.version === asset.currentVersion);
    if (!target) {
      throw new NotFoundException('Asset version not found');
    }
    const buffer = await this.storage.read(target.storageKey);
    return { buffer, version: target };
  }

  async remove(orgId: string, id: string) {
    const asset = await this.findOne(orgId, id);
    await Promise.all(asset.versions.map((v) => this.storage.delete(v.storageKey)));
    await this.prisma.asset.delete({ where: { id: asset.id } });
    return { success: true };
  }
}
