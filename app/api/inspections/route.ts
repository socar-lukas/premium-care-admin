import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendInspectionRecord } from '@/lib/google-sheets';
import { z } from 'zod';

const inspectionSchema = z.object({
  vehicleId: z.string().uuid(),
  inspectionDate: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  inspectionType: z.string(),
  overallStatus: z.string(),
  inspector: z.string().optional(),
  memo: z.string().optional(),
  details: z.any().optional(), // JSON 데이터 (세차점검 상세)
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

    // 통계용 간단 쿼리인지 확인 (startDate/endDate만 있고 limit 작은 경우)
    const isStatsQuery = startDate && endDate && limit <= 20;

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { inspectionDate: 'desc' },
        select: isStatsQuery ? {
          id: true,
          inspectionDate: true,
          inspectionType: true,
        } : {
          id: true,
          vehicleId: true,
          inspectionDate: true,
          completedAt: true,
          inspectionType: true,
          overallStatus: true,
          inspector: true,
          memo: true,
          details: true,
          vehicle: {
            select: {
              id: true,
              vehicleNumber: true,
              ownerName: true,
            },
          },
          areas: {
            select: {
              id: true,
              areaCategory: true,
              areaName: true,
              status: true,
              photos: {
                take: 1,
                select: {
                  id: true,
                  googleDriveUrl: true,
                  filePath: true,
                  originalFileName: true,
                },
              },
            },
          },
        },
      }),
      prisma.inspection.count({ where }),
    ]);

    const response = NextResponse.json({
      inspections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // 캐시 헤더 추가 (10초 캐시)
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');

    return response;
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
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        inspectionType: data.inspectionType,
        overallStatus: data.overallStatus,
        inspector: data.inspector,
        memo: data.memo,
        details: data.details || null,
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

    // Google Sheets 백업 (필수)
    const details = data.details as Record<string, unknown> | undefined;
    await appendInspectionRecord({
      inspectionId: inspection.id,
      date: new Date(data.inspectionDate).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      vehicleNumber: vehicle.vehicleNumber,
      ownerName: vehicle.ownerName,
      inspectionType: data.inspectionType,
      overallStatus: data.overallStatus,
      inspector: data.inspector || '',
      contamination: details?.contamination as string | undefined,
      exteriorDamage: details?.exteriorDamage as string[] | undefined,
      tires: details?.tires as Record<string, string> | undefined,
      interiorContamination: details?.interiorContamination as string[] | undefined,
      carWash: details?.carWash as string | undefined,
      battery: details?.battery as string | undefined,
      wiperWasher: details?.wiperWasher as string[] | undefined,
      warningLights: details?.warningLights as string[] | undefined,
      memo: data.memo,
      photoCount: 0, // 사진은 별도로 업로드되므로 0으로 시작
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


