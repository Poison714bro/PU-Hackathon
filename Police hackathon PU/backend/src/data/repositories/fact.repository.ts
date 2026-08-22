import { PrismaClient, Fact, Classification } from '@prisma/client';
import { DatabaseService } from '../database/prisma.service';

export interface CreateFactDto {
  sourceId: string;
  documentId?: string;
  factKey: string;
  statement: string;
  numericValue?: number;
  unit?: string;
  jurisdiction?: string;
  timeframe?: string;
  confidenceScore?: number;
  classification?: Classification;
}

export class FactRepository {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client || DatabaseService.getClient();
  }

  async findByKey(factKey: string): Promise<Fact | null> {
    return this.prisma.fact.findUnique({
      where: { factKey },
      include: { source: true, document: true },
    });
  }

  async findBySourceId(sourceId: string): Promise<Fact[]> {
    return this.prisma.fact.findMany({
      where: { sourceId },
      include: { source: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAll(): Promise<Fact[]> {
    return this.prisma.fact.findMany({
      include: { source: true, document: true },
      orderBy: { factKey: 'asc' },
    });
  }

  async upsert(data: CreateFactDto): Promise<Fact> {
    return this.prisma.fact.upsert({
      where: { factKey: data.factKey },
      update: {
        statement: data.statement,
        numericValue: data.numericValue,
        unit: data.unit,
        jurisdiction: data.jurisdiction,
        timeframe: data.timeframe,
        confidenceScore: data.confidenceScore ?? 1.0,
        classification: data.classification || Classification.SOURCE_FACT,
      },
      create: {
        sourceId: data.sourceId,
        documentId: data.documentId,
        factKey: data.factKey,
        statement: data.statement,
        numericValue: data.numericValue,
        unit: data.unit,
        jurisdiction: data.jurisdiction,
        timeframe: data.timeframe,
        confidenceScore: data.confidenceScore ?? 1.0,
        classification: data.classification || Classification.SOURCE_FACT,
      },
    });
  }
}

export const factRepository = new FactRepository();
