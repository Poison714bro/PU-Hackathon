import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const drugCategory = searchParams.get('drugCategory');
    const riskMin = searchParams.get('riskMin');
    const riskMax = searchParams.get('riskMax');

    const where: any = {};
    if (drugCategory) where.drugCategory = drugCategory;
    if (riskMin || riskMax) {
      where.riskScore = {};
      if (riskMin) where.riskScore.gte = parseFloat(riskMin);
      if (riskMax) where.riskScore.lte = parseFloat(riskMax);
    }

    const incidents = await prisma.mapIncident.findMany({ where });

    const pins = incidents.map(inc => ({
      id: inc.id,
      lat: inc.lat,
      lng: inc.lng,
      city: inc.label.split(',')[0] || "Unknown",
      country: inc.label.split(',')[1]?.trim() || "Unknown",
      drugCategory: inc.drugCategory.split(' - ')[0],
      riskScore: inc.riskScore,
      entityId: inc.entityId || "",
      date: inc.date.toISOString(),
      label: inc.label,
      quantityEst: inc.details, // Mock mapping
      sourceType: "osint"
    }));

    return NextResponse.json({ success: true, data: pins });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
