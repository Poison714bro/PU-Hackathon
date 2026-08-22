import { PrismaClient, Location, Classification } from '@prisma/client';
import { DatabaseService } from '../database/prisma.service';

export interface CreateLocationDto {
  city: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  classification?: Classification;
}

export class LocationRepository {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client || DatabaseService.getClient();
  }

  async findAll(): Promise<Location[]> {
    return this.prisma.location.findMany({
      include: { evidences: true },
    });
  }

  async create(data: CreateLocationDto): Promise<Location> {
    return this.prisma.location.create({
      data: {
        city: data.city,
        country: data.country,
        countryCode: data.countryCode,
        latitude: data.latitude,
        longitude: data.longitude,
        classification: data.classification || Classification.DEMO_DATA,
      },
    });
  }
}

export const locationRepository = new LocationRepository();
