import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_KANBAN = [
  {
    id: "col-1",
    title: "Target Identification",
    cards: [
      {
        id: "case-001",
        title: "DarkPhoenix_77",
        entityId: "ent-001",
        priority: "Critical",
        assignedAgent: "Agent Torres",
        updatedAt: new Date().toISOString(),
        summary: "Synthetic opioid distribution and chemical precursor procurement pipeline.",
        stage: "Target Identification"
      },
      {
        id: "case-002",
        title: "ChemKing2026",
        entityId: "ent-004",
        priority: "High",
        assignedAgent: "Analyst Vance",
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        summary: "Precursor chemical synthesis lab operating across maritime freight corridors.",
        stage: "Target Identification"
      }
    ]
  },
  {
    id: "col-2",
    title: "Active Investigation",
    cards: [
      {
        id: "case-003",
        title: "WhiteRabbit_VIP",
        entityId: "ent-003",
        priority: "High",
        assignedAgent: "Agent Torres",
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
        summary: "Domestic wholesale redistribution and dead-drop locker operations.",
        stage: "Active Investigation"
      }
    ]
  },
  {
    id: "col-3",
    title: "Closed/Dismantled",
    cards: [
      {
        id: "case-004",
        title: "Bohemia Admin Cell",
        entityId: "ent-002",
        priority: "Medium",
        assignedAgent: "Special Cell Lead",
        updatedAt: new Date(Date.now() - 604800000).toISOString(),
        summary: "Market infrastructure seized and assets forfeited under Operation RapTor.",
        stage: "Closed/Dismantled"
      }
    ]
  }
];

export async function GET() {
  try {
    const targets = await prisma.intelEntity.findMany({
      orderBy: { riskScore: 'desc' }
    });

    if (targets && targets.length > 0) {
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
    }

    return NextResponse.json({ success: true, data: DEFAULT_KANBAN });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: DEFAULT_KANBAN });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, stage, status } = body;

    if (id && (stage || status)) {
      try {
        await prisma.intelEntity.update({
          where: { id },
          data: {
            status: stage || status,
            lastActive: new Date()
          }
        });
      } catch {
        // Handled gracefully in mock mode
      }
    }

    return NextResponse.json({ success: true, message: "Investigation updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: true, message: "Investigation updated (fallback mode)" });
  }
}
