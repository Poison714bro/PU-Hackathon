import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MOCK_TIMELINE = [
  {
    id: "tl-1",
    date: "2026-08-01T10:00:00.000Z",
    type: "alert",
    title: "Market Vendor Registration",
    description: "Account created on AlphaBay Reborn with PGP key ending in 3B62.",
    source: "AlphaBay Scrape",
    riskScore: 65
  },
  {
    id: "tl-2",
    date: "2026-08-14T15:30:00.000Z",
    type: "seizure",
    title: "Precursor Interception",
    description: "Consignment of 4-ANPP intercepted at Rotterdam Port with packaging tied to alias.",
    source: "Europol / Special Cell",
    riskScore: 92
  },
  {
    id: "tl-3",
    date: "2026-08-28T22:15:00.000Z",
    type: "alert",
    title: "High-Volume Bitcoin Laundering",
    description: "34.5 BTC routed through ChipMixer Relay 04 to unhosted wallets.",
    source: "Blockchain Analytics Engine",
    riskScore: 96
  }
];

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

    if (feed.length > 0 || incidents.length > 0) {
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
    }

    return NextResponse.json({ success: true, data: MOCK_TIMELINE });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: MOCK_TIMELINE });
  }
}
