import { PrismaClient, SourceDocument, Classification } from '@prisma/client';
import { DatabaseService } from '../database/prisma.service';

export interface CreateDocumentDto {
  sourceId: string;
  documentTitle: string;
  author?: string;
  sectionReference?: string;
  rawTextExcerpt?: string;
  contentHash?: string;
  classification?: Classification;
}

export class DocumentRepository {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client || DatabaseService.getClient();
  }

  async findBySourceId(sourceId: string): Promise<SourceDocument[]> {
    return this.prisma.sourceDocument.findMany({
      where: { sourceId },
      include: { facts: true },
    });
  }

  async create(data: CreateDocumentDto): Promise<SourceDocument> {
    return this.prisma.sourceDocument.create({
      data: {
        sourceId: data.sourceId,
        documentTitle: data.documentTitle,
        author: data.author,
        sectionReference: data.sectionReference,
        rawTextExcerpt: data.rawTextExcerpt,
        contentHash: data.contentHash,
        classification: data.classification || Classification.SOURCE_FACT,
      },
    });
  }
}

export const documentRepository = new DocumentRepository();
