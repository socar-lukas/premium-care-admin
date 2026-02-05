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

// 한국어 날짜 파싱 (예: "2026. 1. 8 오전 7:10:00") - KST 기준
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

    // KST 시간을 UTC로 변환 (KST = UTC + 9)
    // ISO 문자열로 만들어서 KST 오프셋 적용
    const kstDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${minute}:${second}+09:00`;
    return new Date(kstDateStr);
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

    // 현재 시간 (UTC 기준, parseKoreanDate도 UTC로 변환되므로 비교 가능)
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 디버그 로그
    console.log('Current time (UTC):', now.toISOString());
    console.log('Next 24 hours (UTC):', next24Hours.toISOString());

    // 1. 현재 운행중 차량: state가 "운행중" 이거나 예약시작 4시간 전부터 end 사이인 차량
    const inUseVehicles = reservations.filter(r => {
      // state가 "운행중"이면 운행중
      if (r.state === '운행중') return true;
      // 예약시작 4시간 전부터 end 사이이면 운행중
      if (r.start_at_kst && r.end_at_kst) {
        const fourHoursBefore = new Date(r.start_at_kst.getTime() - 4 * 60 * 60 * 1000);
        return now >= fourHoursBefore && now <= r.end_at_kst;
      }
      return false;
    });
    // 운행중 차량은 unique하게 count
    const inUseCarNums = [...new Set(inUseVehicles.map(r => r.car_num))];

    // 2. D+1 예약: 오늘 기준 +1일 안에 예약 시작하는 건 (중복 허용)
    const upcomingReservations = reservations.filter(r => {
      if (!r.start_at_kst) return false;
      // state가 "예약"인 경우만 (이미 운행중이거나 완료된 건 제외)
      if (r.state !== '예약') return false;
      return r.start_at_kst >= now && r.start_at_kst <= next24Hours;
    });

    // 3. D+1 점검 필요: D+1 예약 중 예약 시작 9시간 전까지 세차점검 기록이 없는 차량
    // 먼저 D+1 예약의 차량번호들 수집
    const upcomingCarNums = [...new Set(upcomingReservations.map(r => r.car_num))];

    // 각 예약별로 점검 필요 여부 판단
    // 예약 시작 시간 9시간 전부터 현재까지 "세차점검" 기록이 있는지 확인
    const needsInspectionReservations: Reservation[] = [];

    if (upcomingCarNums.length > 0) {
      // 차량번호로 Vehicle ID 매핑 조회
      const vehicleData = await prisma.vehicle.findMany({
        where: {
          vehicleNumber: { in: upcomingCarNums }
        },
        select: {
          id: true,
          vehicleNumber: true,
          inspections: {
            where: {
              inspectionType: '세차점검' // 반납상태가 아닌 세차점검만
            },
            orderBy: {
              completedAt: 'desc'
            },
            take: 1, // 가장 최근 세차점검 기록만
            select: {
              completedAt: true,
              inspectionDate: true
            }
          }
        }
      });

      // 차량번호별 최근 세차점검 시간 매핑
      const lastCarWashMap: Record<string, Date | null> = {};
      for (const v of vehicleData) {
        const lastInspection = v.inspections[0];
        if (lastInspection) {
          lastCarWashMap[v.vehicleNumber] = lastInspection.completedAt || lastInspection.inspectionDate;
        } else {
          lastCarWashMap[v.vehicleNumber] = null;
        }
      }

      // 각 예약에 대해 점검 필요 여부 확인
      for (const r of upcomingReservations) {
        if (!r.start_at_kst) continue;

        // 예약 시작 24시간 전 시간 계산
        const twentyFourHoursBefore = new Date(r.start_at_kst.getTime() - 24 * 60 * 60 * 1000);

        // 해당 차량의 최근 세차점검 기록 확인
        const lastCarWash = lastCarWashMap[r.car_num];

        // 세차점검 기록이 없거나, 24시간 전보다 이전에 한 경우 점검 필요
        if (!lastCarWash || lastCarWash < twentyFourHoursBefore) {
          needsInspectionReservations.push(r);
        }
      }
    } else {
      // upcomingCarNums가 비어있으면 모든 예약이 점검 필요 (DB에 차량이 없음)
      needsInspectionReservations.push(...upcomingReservations);
    }

    // 차량별 예약 상태 정보 (차량 목록에서 사용)
    // 각 차량의 현재 상태: 운행중 / 대기중 + 차량명 + 예약시작시간 + 다음예약시작시간
    const vehicleStatusMap: Record<string, {
      status: '운행중' | '대기중';
      needsInspection: boolean;
      carName: string;
      reservationStart?: string; // ISO 문자열 (현재/다음 예약 시작시간)
      nextReservationStart?: string; // ISO 문자열 (운행중인 경우 다음 예약 시작시간)
    }> = {};

    // D+1 예약 차량별 가장 빠른 예약 시작 시간 저장
    const earliestReservationMap: Record<string, Date> = {};
    for (const r of upcomingReservations) {
      if (r.start_at_kst) {
        if (!earliestReservationMap[r.car_num] || r.start_at_kst < earliestReservationMap[r.car_num]) {
          earliestReservationMap[r.car_num] = r.start_at_kst;
        }
      }
    }

    // 모든 예약 데이터에서 차량별 상태 계산
    // 먼저 차량별로 예약을 시간순 정렬
    const reservationsByCarNum: Record<string, Reservation[]> = {};
    for (const r of reservations) {
      if (!reservationsByCarNum[r.car_num]) {
        reservationsByCarNum[r.car_num] = [];
      }
      reservationsByCarNum[r.car_num].push(r);
    }
    // 각 차량의 예약을 시작시간 기준 정렬
    for (const carNum of Object.keys(reservationsByCarNum)) {
      reservationsByCarNum[carNum].sort((a, b) => {
        if (!a.start_at_kst) return 1;
        if (!b.start_at_kst) return -1;
        return a.start_at_kst.getTime() - b.start_at_kst.getTime();
      });
    }

    for (const r of reservations) {
      // 운행중 판단: state가 "운행중" 이거나 예약시작 4시간 전부터 end 사이
      const fourHoursBefore = r.start_at_kst ? new Date(r.start_at_kst.getTime() - 4 * 60 * 60 * 1000) : null;
      const isInUse = r.state === '운행중' ||
        (fourHoursBefore && r.end_at_kst && now >= fourHoursBefore && now <= r.end_at_kst);

      // 운행중이면 무조건 운행중으로 설정 (우선순위 높음)
      if (isInUse) {
        // 운행중인 차량의 다음 예약 찾기
        const carReservations = reservationsByCarNum[r.car_num] || [];
        const nextReservation = carReservations.find(nr => {
          if (!nr.start_at_kst) return false;
          // 현재 운행중인 예약 이후의 예약 찾기
          if (r.end_at_kst) {
            return nr.start_at_kst > r.end_at_kst;
          }
          return nr.start_at_kst > now;
        });

        vehicleStatusMap[r.car_num] = {
          ...vehicleStatusMap[r.car_num],
          status: '운행중',
          needsInspection: vehicleStatusMap[r.car_num]?.needsInspection || false,
          carName: r.car_name || vehicleStatusMap[r.car_num]?.carName || '',
          nextReservationStart: nextReservation?.start_at_kst?.toISOString()
        };
      } else if (!vehicleStatusMap[r.car_num]) {
        // 아직 상태가 없으면 대기중으로 설정
        vehicleStatusMap[r.car_num] = {
          status: '대기중',
          needsInspection: false,
          carName: r.car_name || ''
        };
      } else if (!vehicleStatusMap[r.car_num].carName && r.car_name) {
        // carName이 없으면 추가
        vehicleStatusMap[r.car_num].carName = r.car_name;
      }
    }

    // 점검 필요 여부 설정 (D+1 예약이 있고 점검이력이 없는 차량)
    for (const r of needsInspectionReservations) {
      if (vehicleStatusMap[r.car_num]) {
        vehicleStatusMap[r.car_num].needsInspection = true;
      } else {
        vehicleStatusMap[r.car_num] = {
          status: '대기중',
          needsInspection: true,
          carName: r.car_name || ''
        };
      }
    }

    // 예약 시작 시간 추가 (D+1 예약 차량)
    for (const carNum of Object.keys(earliestReservationMap)) {
      if (vehicleStatusMap[carNum]) {
        vehicleStatusMap[carNum].reservationStart = earliestReservationMap[carNum].toISOString();
      }
    }

    // 점검필요 차량번호 (유니크)
    const needsInspectionCarNums = [...new Set(needsInspectionReservations.map(r => r.car_num))];

    return NextResponse.json({
      // 통계 카운트 (모두 유니크한 차량 수)
      inUseCount: inUseCarNums.length,
      upcomingReservationsCount: upcomingCarNums.length, // 예약 차량 수 (유니크)
      needsInspectionCount: needsInspectionCarNums.length, // 점검필요 차량 수 (유니크)
      // 필터링용 차량번호 목록
      inUseCarNums,
      upcomingCarNums,
      needsInspectionCarNums,
      // 차량별 상태 정보 (차량 목록 표시용)
      vehicleStatusMap,
    });
  } catch (error) {
    console.error('Error fetching reservation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation stats' },
      { status: 500 }
    );
  }
}
