import { PrismaClient, CryptoIndicator, Classification } from '@prisma/client';
import { DatabaseService } from '../database/prisma.service';

export interface CreateCryptoIndicatorDto {
  entityId?: string;
  walletAddress: string;
  currency?: string;
  totalVolumeUSD?: number;
  coinJoinRounds?: number;
  peakPeriod?: string;
  firstSeenTx?: Date;
  classification?: Classification;
}

export class CryptoRepository {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client || DatabaseService.getClient();
  }

  async findByAddress(walletAddress: string): Promise<CryptoIndicator[]> {
    return this.prisma.cryptoIndicator.findMany({
      where: { walletAddress },
      include: { entity: true },
    });
  }

  async findByEntityId(entityId: string): Promise<CryptoIndicator[]> {
    return this.prisma.cryptoIndicator.findMany({
      where: { entityId },
    });
  }

  async create(data: CreateCryptoIndicatorDto): Promise<CryptoIndicator> {
    return this.prisma.cryptoIndicator.create({
      data: {
        entityId: data.entityId,
        walletAddress: data.walletAddress,
        currency: data.currency || 'BTC',
        totalVolumeUSD: data.totalVolumeUSD ?? 0,
        coinJoinRounds: data.coinJoinRounds ?? 0,
        peakPeriod: data.peakPeriod,
        firstSeenTx: data.firstSeenTx,
        classification: data.classification || Classification.DEMO_DATA,
      },
    });
  }
}

export const cryptoRepository = new CryptoRepository();
