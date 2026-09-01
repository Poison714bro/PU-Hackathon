import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_FEED = [
  {
    id: "feed-1",
    timestamp: new Date().toISOString(),
    source: "AlphaBay Reborn",
    category: "Opioids / Fentanyl",
    severity: "critical",
    summary: "High-volume vendor DarkPhoenix_77 posted new bulk listing for 500g pressed counterfeit fentanyl pills.",
    entityId: "ent-001",
    rawSnippet: "AlphaBay Vendor DarkPhoenix_77 - 500x pressed oxycodone M30 (Fentanyl HCL)"
  },
  {
    id: "feed-2",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    source: "Telegram OSINT",
    category: "Payment Flow",
    severity: "high",
    summary: "Monero payment link detected routing through mixer relay ChipMixer_Relay_04 ($890,000 equivalent).",
    entityId: "wallet-btc-1",
    rawSnippet: "Telegram @DarkPhoenix_Direct -> Tx Hash 0x8a92...e4f -> Mixer Relay 04"
  },
  {
    id: "feed-3",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    source: "Dread Forum",
    category: "Precursor Chemicals",
    severity: "medium",
    summary: "Suspect ChemKing2026 advertised wholesale piperidone delivery pipeline across European freight routes.",
    entityId: "ent-005",
    rawSnippet: "Dread feedback logged: 99.4% positive delivery rating for 4-ANPP precursor."
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const feedEntries = await prisma.feedEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    if (!feedEntries || feedEntries.length === 0) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_FEED
      });
    }

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
    return NextResponse.json({
      success: true,
      data: DEFAULT_FEED
    });
  }
}
