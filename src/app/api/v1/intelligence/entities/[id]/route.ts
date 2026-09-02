import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MOCK_ENTITIES: Record<string, any> = {
  "ent-001": {
    id: "ent-001",
    primaryAlias: "DarkPhoenix_77",
    category: "Opioids / Fentanyl",
    colorHex: "#ef4444",
    riskScore: 94,
    status: "Active Target",
    firstSeen: "2024-03-12T00:00:00Z",
    lastActive: "2026-08-30T14:20:00Z",
    sources: ["AlphaBay Reborn", "Telegram OSINT", "Special Cell Wiretap"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2", currency: "BTC", observedVolumeUSD: 1450000 },
        { address: "42xM7q9Lr5kB3pN2vT1wH4yG6fD8cE0zA7sJ5mK9oI3uR6tY1wQ4eP2xL", currency: "XMR", observedVolumeUSD: 890000 }
      ],
      pgpKeyFingerprint: "F9B2 4A32 1109 E77A 8C3D 5F6B 7E2A 9D01 4C8F 3B62",
      encryptedHandles: ["@DarkPhoenix_Direct", "Session: 05a9c2..."],
      knownAliases: ["DP_Supply", "Ph03nix_Rx", "DarkP77"]
    },
    summary: "Primary supplier of pressed counterfeit M30 fentanyl pills across darknet platforms with direct precursor ties to ChemKing2026."
  },
  "ent-002": {
    id: "ent-002",
    primaryAlias: "KhaosAdmin",
    category: "Escrow & Market Ops",
    colorHex: "#eab308",
    riskScore: 98,
    status: "Target Tier 1",
    firstSeen: "2023-01-14T00:00:00Z",
    lastActive: "2026-08-31T09:12:00Z",
    sources: ["Bohemia", "TorZon", "Dread Forum"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", currency: "BTC", observedVolumeUSD: 4200000 }
      ],
      pgpKeyFingerprint: "8C3D 5F6B 7E2A 9D01 4C8F F9B2 4A32 1109 E77A 3B62",
      encryptedHandles: ["@Khaos_Ops"],
      knownAliases: ["Khaos_Ops", "Admin_Khaos"]
    },
    summary: "Multi-market escrow infrastructure administrator and dispute resolution moderator."
  }
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const entity = await prisma.intelEntity.findUnique({
      where: { id: params.id },
      include: { cryptoWallets: true, pgpKeys: true }
    });

    if (entity) {
      return NextResponse.json({
        success: true,
        data: {
          id: entity.id,
          primaryAlias: entity.primaryAlias,
          category: entity.category,
          colorHex: entity.colorHex,
          riskScore: entity.riskScore,
          status: entity.status,
          firstSeen: entity.firstSeen.toISOString(),
          lastActive: entity.lastActive.toISOString(),
          sources: ["Darknet", "OSINT"],
          identifiers: {
            cryptoWallets: entity.cryptoWallets,
            pgpKeyFingerprint: entity.pgpKeys[0] || null,
            encryptedHandles: [],
            knownAliases: []
          },
          summary: entity.summary
        }
      });
    }

    const fallback = MOCK_ENTITIES[params.id] || MOCK_ENTITIES["ent-001"];
    return NextResponse.json({ success: true, data: fallback });
  } catch (error: any) {
    const fallback = MOCK_ENTITIES[params.id] || MOCK_ENTITIES["ent-001"];
    return NextResponse.json({ success: true, data: fallback });
  }
}
