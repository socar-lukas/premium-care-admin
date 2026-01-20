import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1UmO-JT_Eb3_4OryXgZip6M_Z0cIRPBpQau6RQc_iygI/gviz/tq?tqx=out:csv&gid=0';

interface Reservation {
  car_num: string;
  car_name: string;
  start_at_kst: Date | null;
  end_at_kst: Date | null;
  state: string;
}

// 한국어 날짜 파싱 (예: "2026. 1. 8 오전 7:10:00")
function parseKoreanDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  try {
    // "2026. 1. 8 오전 7:10:00" 형식 파싱
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
    if (!match) return null;

    const [, year, month, day, ampm, hour, minute, second] = match;
    let hours = parseInt(hour);

    if (ampm === '오후' && hours !== 12) {
      hours += 12;
    } else if (ampm === '오전' && hours === 12) {
      hours = 0;
    }

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hours,
      parseInt(minute),
      parseInt(second)
    );
  } catch {
    return null;
  }
}

// CSV 파싱
function parseCSV(csv: string): Reservation[] {
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  const reservations: Reservation[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV 파싱 (따옴표 처리)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 5) {
      reservations.push({
        car_num: values[0],
        car_name: values[1],
        start_at_kst: parseKoreanDate(values[2]),
        end_at_kst: parseKoreanDate(values[3]),
        state: values[4],
      });
    }
  }

  return reservations;
}

export async function GET() {
  try {
    // Google Sheets에서 데이터 가져오기
    const response = await fetch(GOOGLE_SHEET_URL, {
      next: { revalidate: 60 }, // 1분 캐시
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google Sheets data');
    }

    const csv = await response.text();
    const reservations = parseCSV(csv);

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1. D+1 예약건수: 현재 시간부터 24시간 내 start_at_kst가 있고 state가 "예약"인 건
    const upcomingReservations = reservations.filter(r => {
      if (!r.start_at_kst || r.state !== '예약') return false;
      return r.start_at_kst >= now && r.start_at_kst <= next24Hours;
    });

    // 2. 실시간 세차·점검 필요 대수: end_at_kst가 현재시간 이전이고 state가 "완료"인 예약 중
    //    해당 차량에 점검 이력이 없는 차량 대수
    const completedReservations = reservations.filter(r => {
      if (!r.end_at_kst || r.state !== '완료') return false;
      return r.end_at_kst < now;
    });

    // 완료된 예약의 차량번호 목록 (중복 제거)
    const completedCarNums = [...new Set(completedReservations.map(r => r.car_num))];

    // 각 차량의 최근 점검 이력 확인
    let needsInspectionCount = 0;

    if (completedCarNums.length > 0) {
      // 차량번호로 차량 조회
      const vehicles = await prisma.vehicle.findMany({
        where: {
          vehicleNumber: { in: completedCarNums }
        },
        select: {
          vehicleNumber: true,
          inspections: {
            take: 1,
            orderBy: { inspectionDate: 'desc' },
            select: { inspectionDate: true }
          }
        }
      });

      const vehicleMap = new Map(vehicles.map(v => [v.vehicleNumber, v]));

      // 완료된 예약 중 점검이 필요한 차량 확인
      for (const carNum of completedCarNums) {
        const vehicle = vehicleMap.get(carNum);

        // 해당 차량의 완료된 예약 중 가장 최근 end_at_kst
        const latestCompletion = completedReservations
          .filter(r => r.car_num === carNum && r.end_at_kst)
          .sort((a, b) => (b.end_at_kst?.getTime() || 0) - (a.end_at_kst?.getTime() || 0))[0];

        if (!latestCompletion?.end_at_kst) continue;

        // 차량이 시스템에 없거나, 점검 이력이 없거나, 점검 날짜가 예약 완료 시간 이전인 경우
        if (!vehicle ||
            vehicle.inspections.length === 0 ||
            vehicle.inspections[0].inspectionDate < latestCompletion.end_at_kst) {
          needsInspectionCount++;
        }
      }
    }

    return NextResponse.json({
      upcomingReservationsCount: upcomingReservations.length,
      needsInspectionCount,
      // 디버깅용 상세 정보
      debug: {
        totalReservations: reservations.length,
        upcomingReservations: upcomingReservations.map(r => ({
          car_num: r.car_num,
          start_at_kst: r.start_at_kst?.toISOString(),
          state: r.state
        })),
        completedCarNums: completedCarNums.length,
      }
    });
  } catch (error) {
    console.error('Error fetching reservation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation stats' },
      { status: 500 }
    );
  }
}
