import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const areaSchema = z.object({
  inspectionId: z.string().uuid(),
  areaCategory: z.string(),
  areaName: z.string(),
  status: z.string(),
  memo: z.string().optional(),
});

// POST /api/inspections/areas - 점검 부위 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = areaSchema.parse(body);

    const area = await prisma.inspectionArea.create({
      data,
      include: {
        photos: true,
      },
    });

    return NextResponse.json(area, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating area:', error);
    return NextResponse.json(
      { error: 'Failed to create area' },
      { status: 500 }
    );
  }
}


