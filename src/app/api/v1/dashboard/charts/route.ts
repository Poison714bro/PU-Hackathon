import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const mapIncidents = await prisma.mapIncident.findMany();
    
    // Group by drugCategory for drugDistribution chart
    const distributionMap: Record<string, number> = {};
    mapIncidents.forEach(inc => {
      const mainCategory = inc.drugCategory.split(' - ')[0] || inc.drugCategory;
      distributionMap[mainCategory] = (distributionMap[mainCategory] || 0) + 1;
    });

    const colors = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#eab308"];
    const drugDistribution = Object.keys(distributionMap).map((key, i) => ({
      name: key,
      count: distributionMap[key],
      color: colors[i % colors.length]
    }));

    // Mock weekly activity since we don't have enough time-series data
    const weeklyActivity = [
      { date: "Mon", transactions: 120, alerts: 5 },
      { date: "Tue", transactions: 132, alerts: 8 },
      { date: "Wed", transactions: 101, alerts: 3 },
      { date: "Thu", transactions: 154, alerts: 12 },
      { date: "Fri", transactions: 190, alerts: 15 },
      { date: "Sat", transactions: 230, alerts: 20 },
      { date: "Sun", transactions: 210, alerts: 18 }
    ];

    return NextResponse.json({
      success: true,
      data: {
        weeklyActivity,
        drugDistribution
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
