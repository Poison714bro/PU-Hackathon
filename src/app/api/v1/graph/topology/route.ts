import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const entities = await prisma.intelEntity.findMany({
      include: { cryptoWallets: true, pgpKeys: true }
    });
    
    const nodes: any[] = [];
    const edges: any[] = [];

    entities.forEach(entity => {
      // Add entity node
      nodes.push({
        id: entity.id,
        label: entity.primaryAlias,
        type: "suspect",
        riskScore: entity.riskScore,
        category: entity.category,
        status: entity.status
      });

      // Add wallets
      entity.cryptoWallets.forEach(wallet => {
        const walletNodeId = `wallet-${wallet.address}`;
        if (!nodes.find(n => n.id === walletNodeId)) {
          nodes.push({
            id: walletNodeId,
            label: `${wallet.currency}: ${wallet.address.substring(0,8)}...`,
            type: "wallet",
            walletBalance: wallet.observedVolumeUSD?.toString()
          });
        }
        edges.push({
          id: `edge-${entity.id}-${walletNodeId}`,
          source: entity.id,
          target: walletNodeId,
          label: "Owns"
        });
      });

      // Add PGP keys
      entity.pgpKeys.forEach(pgp => {
        const pgpNodeId = `pgp-${pgp.fingerprint}`;
        if (!nodes.find(n => n.id === pgpNodeId)) {
          nodes.push({
            id: pgpNodeId,
            label: `PGP: ${pgp.shortKeyId}`,
            type: "pgp"
          });
        }
        edges.push({
          id: `edge-${entity.id}-${pgpNodeId}`,
          source: entity.id,
          target: pgpNodeId,
          label: "Uses"
        });
      });
    });

    return NextResponse.json({
      success: true,
      data: { nodes, edges }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
