import { PrismaClient } from '@prisma/client';

export class DatabaseService {
  private static instance: PrismaClient | null = null;

  public static getClient(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    }
    return DatabaseService.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseService.instance) {
      await DatabaseService.instance.$disconnect();
      DatabaseService.instance = null;
    }
  }
}

export const prisma = DatabaseService.getClient();
