import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const feedEntries = await prisma.feedEntry.findMany({
      where: {
        OR: [
          { severity: 'critical' },
          { severity: 'high' }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    const data = feedEntries.map(f => ({
      id: f.id,
      severity: f.severity,
      title: f.category,
      description: f.details,
      payload: f.details,
      timestamp: f.timestamp.toISOString(),
      source: f.source,
      acknowledged: false
    }));

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
