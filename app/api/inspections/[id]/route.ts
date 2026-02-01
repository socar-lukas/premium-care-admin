import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { markInspectionAsDeleted } from '@/lib/google-sheets';

function verifyAdminPin(request: NextRequest): boolean {
  const pin = request.headers.get('x-admin-pin');
  return pin === process.env.ADMIN_PIN;
}

// GET /api/inspections/[id] - 점검 기록 상세
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id: params.id },
      include: {
        vehicle: true,
        areas: {
          include: {
            photos: {
              orderBy: { uploadedAt: 'asc' },
            },
          },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspection' },
      { status: 500 }
    );
  }
}

// DELETE /api/inspections/[id] - 점검 기록 삭제 (관리자 전용)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminPin(request)) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  try {
    // Google Sheets에 삭제 표시 (필수)
    await markInspectionAsDeleted(params.id);

    // 데이터베이스에서 삭제
    await prisma.inspection.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    return NextResponse.json(
      { error: 'Failed to delete inspection' },
      { status: 500 }
    );
  }
}


