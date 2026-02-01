import { google } from 'googleapis';

// 서비스 계정 인증 클라이언트
function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    return null;
  }

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// 점검 데이터 인터페이스
export interface InspectionRecord {
  date: string;                    // 점검일시
  vehicleNumber: string;           // 차량번호
  ownerName: string;               // 소유자
  inspectionType: string;          // 점검유형 (반납상태, 세차점검)
  overallStatus: string;           // 상태 (우수, 양호, 보통, 불량)
  inspector: string;               // 담당자
  // 반납상태 필드
  contamination?: string;          // 오염도
  exteriorDamage?: string[];       // 외관이상
  tires?: Record<string, string>;  // 타이어상태
  interiorContamination?: string[]; // 내부오염
  // 세차점검 필드
  carWash?: string;                // 세차
  battery?: string;                // 배터리
  wiperWasher?: string[];          // 와이퍼/워셔액
  warningLights?: string[];        // 경고등
  memo?: string;                   // 특이사항
  photoCount: number;              // 사진수
}

/**
 * Google Sheets에 점검 기록 추가
 */
export async function appendInspectionRecord(record: InspectionRecord): Promise<boolean> {
  const auth = getServiceAccountAuth();
  if (!auth) {
    console.warn('[Google Sheets] 서비스 계정 credentials 미설정');
    return false;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const sheetName = process.env.GOOGLE_SHEETS_NAME || '점검기록';

  if (!spreadsheetId) {
    console.warn('[Google Sheets] GOOGLE_SHEETS_ID 미설정');
    return false;
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    // 타이어 상태 문자열 변환
    const tiresStr = record.tires
      ? Object.entries(record.tires)
          .map(([pos, status]) => `${pos}:${status}`)
          .join(', ')
      : '';

    // 배열 필드 문자열 변환
    const arrayToStr = (arr?: string[]) => arr?.join(', ') || '';

    // 스프레드시트에 추가할 행 데이터
    const rowData = [
      record.date,                              // A: 날짜
      record.vehicleNumber,                     // B: 차량번호
      record.ownerName,                         // C: 소유자
      record.inspectionType,                    // D: 점검유형
      record.overallStatus,                     // E: 상태
      record.inspector || '',                   // F: 담당자
      record.contamination || '',               // G: 오염도
      arrayToStr(record.exteriorDamage),        // H: 외관이상
      tiresStr,                                 // I: 타이어상태
      arrayToStr(record.interiorContamination), // J: 내부오염
      record.carWash || '',                     // K: 세차
      record.battery || '',                     // L: 배터리
      arrayToStr(record.wiperWasher),           // M: 와이퍼/워셔액
      arrayToStr(record.warningLights),         // N: 경고등
      record.memo || '',                        // O: 특이사항
      record.photoCount,                        // P: 사진수
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:P`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log(`[Google Sheets] 기록 완료: ${record.vehicleNumber} - ${record.inspectionType}`);
    return true;
  } catch (error) {
    console.error('[Google Sheets] 기록 실패:', error);
    return false;
  }
}

/**
 * 스프레드시트 헤더 설정 (최초 1회)
 */
export async function initializeSheetHeaders(): Promise<boolean> {
  const auth = getServiceAccountAuth();
  if (!auth) return false;

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const sheetName = process.env.GOOGLE_SHEETS_NAME || '점검기록';

  if (!spreadsheetId) return false;

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const headers = [
      '날짜', '차량번호', '소유자', '점검유형', '상태', '담당자',
      '오염도', '외관이상', '타이어상태', '내부오염',
      '세차', '배터리', '와이퍼/워셔액', '경고등',
      '특이사항', '사진수'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:P1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });

    console.log('[Google Sheets] 헤더 설정 완료');
    return true;
  } catch (error) {
    console.error('[Google Sheets] 헤더 설정 실패:', error);
    return false;
  }
}
