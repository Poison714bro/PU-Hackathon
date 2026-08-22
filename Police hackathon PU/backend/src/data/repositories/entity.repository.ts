import { PrismaClient, Entity, DrugCategory, EntityStatus, Classification, IdentifierType } from '@prisma/client';
import { DatabaseService } from '../database/prisma.service';

export interface CreateEntityDto {
  entityCode: string;
  primaryAlias: string;
  category: DrugCategory;
  colorHex?: string;
  riskScore?: number;
  status?: EntityStatus;
  firstSeen?: Date;
  lastActive?: Date;
  summary?: string;
  sourceId?: string;
  classification?: Classification;
  identifiers?: Array<{
    type: IdentifierType;
    value: string;
    isPrimary?: boolean;
    isVerified?: boolean;
    platform?: string;
    balanceUSD?: number;
  }>;
}

export class EntityRepository {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client || DatabaseService.getClient();
  }

  async findByCode(entityCode: string): Promise<Entity | null> {
    return this.prisma.entity.findUnique({
      where: { entityCode },
      include: {
        identifiers: true,
        events: true,
        cryptoIndicators: true,
        source: true,
      },
    });
  }

  async findById(id: string): Promise<Entity | null> {
    return this.prisma.entity.findUnique({
      where: { id },
      include: {
        identifiers: true,
        events: true,
        cryptoIndicators: true,
        source: true,
      },
    });
  }

  async findAll(filter?: {
    category?: DrugCategory;
    status?: EntityStatus;
    riskMin?: number;
    classification?: Classification;
  }): Promise<Entity[]> {
    return this.prisma.entity.findMany({
      where: {
        category: filter?.category,
        status: filter?.status,
        riskScore: filter?.riskMin ? { gte: filter.riskMin } : undefined,
        classification: filter?.classification,
      },
      include: {
        identifiers: true,
        source: true,
      },
      orderBy: { riskScore: 'desc' },
    });
  }

  async search(query: string): Promise<Entity[]> {
    const q = query.trim();
    return this.prisma.entity.findMany({
      where: {
        OR: [
          { primaryAlias: { contains: q } },
          { entityCode: { contains: q } },
          { summary: { contains: q } },
          { identifiers: { some: { value: { contains: q } } } },
        ],
      },
      include: { identifiers: true },
      take: 20,
    });
  }

  async upsert(data: CreateEntityDto): Promise<Entity> {
    return this.prisma.entity.upsert({
      where: { entityCode: data.entityCode },
      update: {
        primaryAlias: data.primaryAlias,
        category: data.category,
        colorHex: data.colorHex || '#FF4500',
        riskScore: data.riskScore ?? 50,
        status: data.status || EntityStatus.ACTIVE,
        firstSeen: data.firstSeen,
        lastActive: data.lastActive,
        summary: data.summary,
        sourceId: data.sourceId,
        classification: data.classification || Classification.DEMO_DATA,
      },
      create: {
        entityCode: data.entityCode,
        primaryAlias: data.primaryAlias,
        category: data.category,
        colorHex: data.colorHex || '#FF4500',
        riskScore: data.riskScore ?? 50,
        status: data.status || EntityStatus.ACTIVE,
        firstSeen: data.firstSeen,
        lastActive: data.lastActive,
        summary: data.summary,
        sourceId: data.sourceId,
        classification: data.classification || Classification.DEMO_DATA,
        identifiers: data.identifiers
          ? {
              create: data.identifiers.map((i) => ({
                type: i.type,
                value: i.value,
                isPrimary: i.isPrimary ?? false,
                isVerified: i.isVerified ?? false,
                platform: i.platform,
                balanceUSD: i.balanceUSD ?? 0,
                classification: data.classification || Classification.DEMO_DATA,
              })),
            }
          : undefined,
      },
    });
  }
}

export const entityRepository = new EntityRepository();
