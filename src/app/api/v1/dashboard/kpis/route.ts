import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const activeTargets = await prisma.intelEntity.count({ where: { status: 'Active' } });
    const allTargets = await prisma.intelEntity.count();
    
    // Sum crypto volume
    const wallets = await prisma.cryptoWallet.findMany();
    const cryptoVolumeUSD = wallets.reduce((acc, w) => acc + (w.observedVolumeUSD || 0), 0);
    
    // High risk alerts from FeedEntry
    const highRiskAlerts = await prisma.feedEntry.count({ 
      where: { 
        OR: [
          { severity: 'critical' },
          { severity: 'high' }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        activeTargets,
        highRiskAlerts,
        cryptoVolumeUSD,
        openInvestigations: 12, // Mocked for now
        globalArrestsEuropolContext: 270, // Operation RapTor
        interceptedListings: 1450, // Mocked
        networkTrendRate: "+12.5%"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
