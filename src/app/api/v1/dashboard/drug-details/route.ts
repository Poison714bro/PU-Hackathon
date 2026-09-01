import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json({ success: false, error: { message: "Category parameter is required" } }, { status: 400 });
    }

    const mapIncidents = await prisma.mapIncident.findMany({
      where: {
        drugCategory: {
          startsWith: category
        }
      }
    });

    const subCategoryMap: Record<string, number> = {};
    
    mapIncidents.forEach(inc => {
      // The granular name is the full string or everything after the first " - "
      const parts = inc.drugCategory.split(' - ');
      const subName = parts.length > 1 ? parts.slice(1).join(' - ') : parts[0];
      subCategoryMap[subName] = (subCategoryMap[subName] || 0) + 1;
    });

    const data = Object.keys(subCategoryMap).map(key => ({
      name: key,
      count: subCategoryMap[key]
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
