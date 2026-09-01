import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const entity = await prisma.intelEntity.findUnique({
      where: { id: params.id },
      include: { cryptoWallets: true, pgpKeys: true, mapIncidents: true, feedEntries: true }
    });

    if (!entity) return NextResponse.json({ success: false, error: { message: "Not found" } }, { status: 404 });

    const dossier = {
      entity: {
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
      },
      threatScore: entity.riskScore,
      classification: entity.riskScore > 90 ? "Critical" : "High",
      timeline: entity.feedEntries.map(f => ({
        id: f.id,
        date: f.timestamp.toISOString(),
        event: f.category,
        description: f.details,
        source: f.source
      })),
      geospatialActivity: entity.mapIncidents.map(m => ({
        location: m.label,
        type: m.drugCategory,
        date: m.date.toISOString()
      })),
      activeInvestigations: [],
      legalChainOfCustody: {
        sha256DossierHash: "a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3", // Mocked
        lastAccessed: new Date().toISOString(),
        authorizedJurisdiction: "Global"
      }
    };

    return NextResponse.json({ success: true, data: dossier });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
