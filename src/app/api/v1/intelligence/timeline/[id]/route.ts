import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const feed = await prisma.feedEntry.findMany({
      where: { entityId: params.id },
      orderBy: { timestamp: 'asc' }
    });
    const incidents = await prisma.mapIncident.findMany({
      where: { entityId: params.id },
      orderBy: { date: 'asc' }
    });

    const timeline = [
      ...feed.map(f => ({
        id: f.id,
        date: f.timestamp.toISOString(),
        type: "alert",
        title: f.category,
        description: f.details,
        source: f.source,
        riskScore: f.riskScore
      })),
      ...incidents.map(inc => ({
        id: inc.id,
        date: inc.date.toISOString(),
        type: "seizure",
        title: `Seizure in ${inc.label}`,
        description: inc.details,
        source: "map",
        riskScore: inc.riskScore
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ success: true, data: timeline });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
