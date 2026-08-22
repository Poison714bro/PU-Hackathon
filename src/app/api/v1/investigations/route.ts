import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const targets = await prisma.intelEntity.findMany({
      orderBy: { riskScore: 'desc' }
    });

    // Mock kanban columns based on target status
    const analyzing = targets.filter(t => t.status === 'Active' || t.status === 'Monitoring');
    const investigating = targets.filter(t => t.status === 'Investigating');
    const closed = targets.filter(t => t.status.includes('Dismantled'));

    const toCard = (t: any) => ({
      id: t.id,
      title: t.primaryAlias,
      entityId: t.id,
      priority: t.riskScore > 90 ? "Critical" : t.riskScore > 75 ? "High" : "Medium",
      assignedAgent: "Agent Torres",
      updatedAt: t.lastActive.toISOString(),
      summary: t.summary,
      stage: t.status
    });

    const data = [
      { id: "col-1", title: "Target Identification", cards: analyzing.map(toCard) },
      { id: "col-2", title: "Active Investigation", cards: investigating.map(toCard) },
      { id: "col-3", title: "Closed/Dismantled", cards: closed.map(toCard) },
    ];

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
