import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const inspectionSchema = z.object({
  vehicleId: z.string().uuid(),
  inspectionDate: z.string().datetime(),
  inspectionType: z.string(),
  overallStatus: z.string(),
  inspector: z.string().optional(),
  memo: z.string().optional(),
  areas: z.array(
    z.object({
      areaCategory: z.string(),
      areaName: z.string(),
      status: z.string(),
      memo: z.string().optional(),
    })
  ).optional(),
});

// GET /api/inspections - 점검 기록 목록
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get('vehicleId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const inspectionType = searchParams.get('inspectionType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (inspectionType) where.inspectionType = inspectionType;
    if (startDate || endDate) {
      where.inspectionDate = {};
      if (startDate) where.inspectionDate.gte = new Date(startDate);
      if (endDate) where.inspectionDate.lte = new Date(endDate);
    }

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { inspectionDate: 'desc' },
        include: {
          vehicle: {
            select: {
              id: true,
              vehicleNumber: true,
              ownerName: true,
            },
          },
          areas: {
            include: {
              photos: {
                take: 1,
              },
            },
          },
        },
      }),
      prisma.inspection.count({ where }),
    ]);

    return NextResponse.json({
      inspections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspections' },
      { status: 500 }
    );
  }
}

// POST /api/inspections - 점검 기록 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = inspectionSchema.parse(body);

    // 차량 존재 확인
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const inspection = await prisma.inspection.create({
      data: {
        vehicleId: data.vehicleId,
        inspectionDate: new Date(data.inspectionDate),
        inspectionType: data.inspectionType,
        overallStatus: data.overallStatus,
        inspector: data.inspector,
        memo: data.memo,
        areas: data.areas
          ? {
              create: data.areas.map((area) => ({
                areaCategory: area.areaCategory,
                areaName: area.areaName,
                status: area.status,
                memo: area.memo,
              })),
            }
          : undefined,
      },
      include: {
        vehicle: true,
        areas: true,
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating inspection:', error);
    return NextResponse.json(
      { error: 'Failed to create inspection' },
      { status: 500 }
    );
  }
}


