import { NextResponse } from 'next/server';
import { mapPinsData } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoriesParam = searchParams.get('drugCategory');
    const riskMin = searchParams.get('riskMin');
    const riskMax = searchParams.get('riskMax');

    let results = [...mapPinsData];

    // Filter by Date Range (mocking a DB query over time)
    if (startDate && endDate) {
      const startTs = new Date(startDate).getTime();
      const endTs = new Date(endDate).getTime();
      
      results = results.filter((pin) => {
        const pinTs = new Date(pin.date).getTime();
        return pinTs >= startTs && pinTs <= endTs;
      });
    }

    // Filter by Drug Categories
    if (categoriesParam) {
      const activeCategories = new Set(categoriesParam.split(','));
      results = results.filter((pin) => activeCategories.has(pin.drugCategory));
    }
    
    // Filter by Risk
    if (riskMin || riskMax) {
      const min = riskMin ? parseFloat(riskMin) : 0;
      const max = riskMax ? parseFloat(riskMax) : 100;
      results = results.filter((pin) => pin.riskScore >= min && pin.riskScore <= max);
    }

    // Map into expected Api format
    const pins = results.map(inc => ({
      id: inc.id,
      lat: inc.lat,
      lng: inc.lng,
      city: inc.label.split(',')[0] || "Unknown",
      country: inc.label.split(',')[1]?.trim() || "Unknown",
      drugCategory: inc.drugCategory,
      riskScore: inc.riskScore,
      entityId: inc.id,
      date: inc.date,
      label: inc.label,
      quantityEst: inc.details,
      sourceType: "osint",
      originRoute: inc.originRoute || [],
      confiscatedAmount: inc.confiscatedAmount
    }));

    // Simulate network latency for hackathon realism
    await new Promise((resolve) => setTimeout(resolve, 200));

    return NextResponse.json({ success: true, data: pins });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
