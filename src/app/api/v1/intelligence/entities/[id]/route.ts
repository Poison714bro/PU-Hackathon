import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const entity = await prisma.intelEntity.findUnique({
      where: { id: params.id },
      include: { cryptoWallets: true, pgpKeys: true }
    });

    if (!entity) return NextResponse.json({ success: false, error: { message: "Not found" } }, { status: 404 });

    // Format to match IntelEntity interface on frontend
    const data = {
      id: entity.id,
      primaryAlias: entity.primaryAlias,
      category: entity.category,
      colorHex: entity.colorHex,
      riskScore: entity.riskScore,
      status: entity.status,
      firstSeen: entity.firstSeen.toISOString(),
      lastActive: entity.lastActive.toISOString(),
      sources: ["Darknet", "OSINT"], // Mocked since schema doesn't have sources array
      identifiers: {
        cryptoWallets: entity.cryptoWallets,
        pgpKeyFingerprint: entity.pgpKeys[0] || null,
        encryptedHandles: [],
        knownAliases: []
      },
      summary: entity.summary
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
