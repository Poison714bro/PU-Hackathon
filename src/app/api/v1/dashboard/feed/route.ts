import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const feedEntries = await prisma.feedEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    const data = feedEntries.map(f => ({
      id: f.id,
      timestamp: f.timestamp.toISOString(),
      source: f.source,
      category: f.category,
      severity: f.severity,
      summary: f.details,
      entityId: f.entityId,
      rawSnippet: f.details
    }));

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
