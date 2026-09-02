import { NextResponse } from 'next/server';

const DEFAULT_CONFLICTS = [
  {
    id: "conf-001",
    entityId: "ent-001",
    targetLabel: "DarkPhoenix_77",
    field: "Physical Distribution Hub",
    severity: "HIGH",
    sources: [
      { source: "Special Cell Wiretap #991", claim: "Ludhiana Warehouse Unit 4", credibility: 0.95, timestamp: "2026-08-28T14:30:00Z" },
      { source: "Telegram OSINT Scraping", claim: "Rotterdam Port Locker B-12", credibility: 0.62, timestamp: "2026-08-29T10:15:00Z" }
    ],
    status: "UNRESOLVED",
    recommendation: "Ludhiana Warehouse Unit 4 (Credibility Weight: 95% vs 62%)"
  },
  {
    id: "conf-002",
    entityId: "ent-003",
    targetLabel: "WhiteRabbit_VIP",
    field: "Primary Settlement Blockchain",
    severity: "MEDIUM",
    sources: [
      { source: "Archetyp Market Feedback", claim: "Ethereum / USDT", credibility: 0.88, timestamp: "2026-08-30T09:00:00Z" },
      { source: "Dread Forum Escrow Chat", claim: "Monero Privacy Pool", credibility: 0.79, timestamp: "2026-08-27T18:40:00Z" }
    ],
    status: "UNRESOLVED",
    recommendation: "Ethereum / USDT (Recent settlement receipts on-chain)"
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: DEFAULT_CONFLICTS
  });
}

export async function POST(request: Request) {
  try {
    const { conflictId, strategy, overrideValue } = await request.json();

    const conflict = DEFAULT_CONFLICTS.find(c => c.id === conflictId);
    if (!conflict) {
      return NextResponse.json({ success: false, error: "Conflict not found" }, { status: 404 });
    }

    const resolvedValue = strategy === "most_recent" 
      ? conflict.sources[conflict.sources.length - 1].claim
      : overrideValue || conflict.sources[0].claim;

    return NextResponse.json({
      success: true,
      data: {
        conflictId,
        resolvedValue,
        strategy: strategy || "credibility_weighted",
        status: "RESOLVED",
        resolvedAt: new Date().toISOString(),
        justification: `Arbitrated via Semantica ConflictResolver using ${strategy || 'credibility_weighted'} algorithm.`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
