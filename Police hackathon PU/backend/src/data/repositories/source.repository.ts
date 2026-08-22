import { PrismaClient, Source, SourceType, Classification } from '@prisma/client';
import { DatabaseService } from '../database/prisma.service';

export interface CreateSourceDto {
  sourceCode: string;
  name: string;
  publisher: string;
  title: string;
  url: string;
  publicationDate?: Date;
  sourceType: SourceType;
  description?: string;
  classification?: Classification;
}

export class SourceRepository {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client || DatabaseService.getClient();
  }

  async findByCode(sourceCode: string): Promise<Source | null> {
    return this.prisma.source.findUnique({
      where: { sourceCode },
      include: { documents: true, facts: true },
    });
  }

  async findById(id: string): Promise<Source | null> {
    return this.prisma.source.findUnique({
      where: { id },
      include: { documents: true, facts: true },
    });
  }

  async findAll(): Promise<Source[]> {
    return this.prisma.source.findMany({
      include: {
        _count: {
          select: { documents: true, facts: true, entities: true, events: true },
        },
      },
      orderBy: { sourceCode: 'asc' },
    });
  }

  async upsert(data: CreateSourceDto): Promise<Source> {
    return this.prisma.source.upsert({
      where: { sourceCode: data.sourceCode },
      update: {
        name: data.name,
        publisher: data.publisher,
        title: data.title,
        url: data.url,
        publicationDate: data.publicationDate,
        sourceType: data.sourceType,
        description: data.description,
        classification: data.classification || Classification.SOURCE_FACT,
      },
      create: {
        sourceCode: data.sourceCode,
        name: data.name,
        publisher: data.publisher,
        title: data.title,
        url: data.url,
        publicationDate: data.publicationDate,
        sourceType: data.sourceType,
        description: data.description,
        classification: data.classification || Classification.SOURCE_FACT,
      },
    });
  }
}

export const sourceRepository = new SourceRepository();
