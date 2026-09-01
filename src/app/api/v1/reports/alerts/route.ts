import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_ALERTS = [
  {
    id: "alert-1",
    severity: "critical",
    title: "High-Volume Precursor Shipment Intercepted",
    description: "Multi-ton seizure of 4-ANPP precursor linked to DarkPhoenix_77 European distribution hub.",
    payload: "Consignment tracking #EU-99218 intercepted in Rotterdam.",
    timestamp: new Date().toISOString(),
    source: "Europol / Special Cell",
    acknowledged: false
  },
  {
    id: "alert-2",
    severity: "high",
    title: "Cryptocurrency Mixer Cash-Out Surge",
    description: "Rapid dispersal of 45 BTC across 12 unhosted wallets observed within 15 minutes.",
    payload: "ChipMixer relay deposit batch #048821",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    source: "Blockchain Analytics Engine",
    acknowledged: false
  }
];

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

    if (!feedEntries || feedEntries.length === 0) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_ALERTS
      });
    }

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
    return NextResponse.json({
      success: true,
      data: DEFAULT_ALERTS
    });
  }
}
