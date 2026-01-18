import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    const adminPin = process.env.ADMIN_PIN;

    if (!adminPin) {
      console.error('ADMIN_PIN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (pin === adminPin) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid PIN' },
      { status: 401 }
    );
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
