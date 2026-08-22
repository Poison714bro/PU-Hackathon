import { PrismaClient, Relationship, RelationType, Classification } from '@prisma/client';
import { DatabaseService } from '../database/prisma.service';

export interface CreateRelationshipDto {
  sourceEntityId: string;
  targetEntityId: string;
  relationType: RelationType;
  confidence?: number;
  evidenceSummary?: string;
  classification?: Classification;
}

export class RelationshipRepository {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client || DatabaseService.getClient();
  }

  async findByEntityId(entityId: string): Promise<Relationship[]> {
    return this.prisma.relationship.findMany({
      where: {
        OR: [{ sourceEntityId: entityId }, { targetEntityId: entityId }],
      },
      include: { sourceEntity: true, targetEntity: true },
    });
  }

  async findAll(): Promise<Relationship[]> {
    return this.prisma.relationship.findMany({
      include: { sourceEntity: true, targetEntity: true },
    });
  }

  async create(data: CreateRelationshipDto): Promise<Relationship> {
    return this.prisma.relationship.create({
      data: {
        sourceEntityId: data.sourceEntityId,
        targetEntityId: data.targetEntityId,
        relationType: data.relationType,
        confidence: data.confidence ?? 0.8,
        evidenceSummary: data.evidenceSummary,
        classification: data.classification || Classification.DEMO_DATA,
      },
    });
  }
}

export const relationshipRepository = new RelationshipRepository();
