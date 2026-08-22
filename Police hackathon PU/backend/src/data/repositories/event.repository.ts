import { PrismaClient, Event, EventType, Classification } from '@prisma/client';
import { DatabaseService } from '../database/prisma.service';

export interface CreateEventDto {
  eventCode?: string;
  entityId?: string;
  sourceId?: string;
  eventType: EventType;
  timestamp: Date;
  title: string;
  description?: string;
  monthlyVolumeUSD?: number;
  activeListingsCount?: number;
  artifactHash?: string;
  classification?: Classification;
}

export class EventRepository {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client || DatabaseService.getClient();
  }

  async findByEntityId(entityId: string): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { entityId },
      include: { source: true },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findAll(): Promise<Event[]> {
    return this.prisma.event.findMany({
      include: { source: true, entity: true },
      orderBy: { timestamp: 'asc' },
    });
  }

  async upsert(data: CreateEventDto): Promise<Event> {
    if (data.eventCode) {
      return this.prisma.event.upsert({
        where: { eventCode: data.eventCode },
        update: {
          entityId: data.entityId,
          sourceId: data.sourceId,
          eventType: data.eventType,
          timestamp: data.timestamp,
          title: data.title,
          description: data.description,
          monthlyVolumeUSD: data.monthlyVolumeUSD ?? 0,
          activeListingsCount: data.activeListingsCount ?? 0,
          artifactHash: data.artifactHash,
          classification: data.classification || Classification.DEMO_DATA,
        },
        create: {
          eventCode: data.eventCode,
          entityId: data.entityId,
          sourceId: data.sourceId,
          eventType: data.eventType,
          timestamp: data.timestamp,
          title: data.title,
          description: data.description,
          monthlyVolumeUSD: data.monthlyVolumeUSD ?? 0,
          activeListingsCount: data.activeListingsCount ?? 0,
          artifactHash: data.artifactHash,
          classification: data.classification || Classification.DEMO_DATA,
        },
      });
    }

    return this.prisma.event.create({
      data: {
        entityId: data.entityId,
        sourceId: data.sourceId,
        eventType: data.eventType,
        timestamp: data.timestamp,
        title: data.title,
        description: data.description,
        monthlyVolumeUSD: data.monthlyVolumeUSD ?? 0,
        activeListingsCount: data.activeListingsCount ?? 0,
        artifactHash: data.artifactHash,
        classification: data.classification || Classification.DEMO_DATA,
      },
    });
  }
}

export const eventRepository = new EventRepository();
