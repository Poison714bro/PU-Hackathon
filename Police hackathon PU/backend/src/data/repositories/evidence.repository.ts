import { PrismaClient, Evidence, EvidenceType, Classification } from '@prisma/client';
import { DatabaseService } from '../database/prisma.service';

export interface CreateEvidenceDto {
  evidenceCode: string;
  evidenceType: EvidenceType;
  title: string;
  contentSnippet?: string;
  entityId?: string;
  sourceId?: string;
  documentId?: string;
  locationId?: string;
  artifactHash?: string;
  classification?: Classification;
}

export class EvidenceRepository {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client || DatabaseService.getClient();
  }

  async findByCode(evidenceCode: string): Promise<Evidence | null> {
    return this.prisma.evidence.findUnique({
      where: { evidenceCode },
      include: { source: true, document: true, entity: true, location: true },
    });
  }

  async findByEntityId(entityId: string): Promise<Evidence[]> {
    return this.prisma.evidence.findMany({
      where: { entityId },
      include: { source: true, document: true, location: true },
    });
  }

  async findAll(): Promise<Evidence[]> {
    return this.prisma.evidence.findMany({
      include: { source: true, document: true, entity: true, location: true },
    });
  }

  async upsert(data: CreateEvidenceDto): Promise<Evidence> {
    return this.prisma.evidence.upsert({
      where: { evidenceCode: data.evidenceCode },
      update: {
        evidenceType: data.evidenceType,
        title: data.title,
        contentSnippet: data.contentSnippet,
        entityId: data.entityId,
        sourceId: data.sourceId,
        documentId: data.documentId,
        locationId: data.locationId,
        artifactHash: data.artifactHash,
        classification: data.classification || Classification.DEMO_DATA,
      },
      create: {
        evidenceCode: data.evidenceCode,
        evidenceType: data.evidenceType,
        title: data.title,
        contentSnippet: data.contentSnippet,
        entityId: data.entityId,
        sourceId: data.sourceId,
        documentId: data.documentId,
        locationId: data.locationId,
        artifactHash: data.artifactHash,
        classification: data.classification || Classification.DEMO_DATA,
      },
    });
  }
}

export const evidenceRepository = new EvidenceRepository();
