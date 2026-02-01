import { google } from 'googleapis';

// 서비스 계정 인증 클라이언트
function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  console.log('[Google Sheets Auth] email:', email ? 'SET' : 'NOT SET');
  console.log('[Google Sheets Auth] privateKey:', privateKey ? `SET (${privateKey.length} chars)` : 'NOT SET');

  if (!email || !privateKey) {
    console.error('[Google Sheets Auth] 환경 변수 누락');
    return null;
  }

  // Vercel에서 줄바꿈 처리
  privateKey = privateKey.replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// 점검 데이터 인터페이스
export interface InspectionRecord {
  inspectionId: string;            // 점검 ID (삭제 시 찾기용)
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
      record.inspectionId,                        // A: 점검ID
      record.date,                                // B: 날짜
      record.vehicleNumber,                       // C: 차량번호
      record.ownerName,                           // D: 소유자
      record.inspectionType,                      // E: 점검유형
      record.overallStatus,                       // F: 상태
      record.inspector || '',                     // G: 담당자
      record.contamination || '',                 // H: 오염도
      arrayToStr(record.exteriorDamage),          // I: 외관이상
      tiresStr,                                   // J: 타이어상태
      arrayToStr(record.interiorContamination),   // K: 내부오염
      record.carWash || '',                       // L: 세차
      record.battery || '',                       // M: 배터리
      arrayToStr(record.wiperWasher),             // N: 와이퍼/워셔액
      arrayToStr(record.warningLights),           // O: 경고등
      record.memo || '',                          // P: 특이사항
      record.photoCount,                          // Q: 사진수
      '정상',                                     // R: 상태 (정상/삭제됨)
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:R`,
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
 * 점검 ID로 해당 행을 찾아 상태를 '삭제됨'으로 변경
 */
export async function markInspectionAsDeleted(inspectionId: string): Promise<boolean> {
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

    // A열(점검ID)에서 해당 ID 찾기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = response.data.values;
    if (!rows) {
      console.warn('[Google Sheets] 데이터 없음');
      return false;
    }

    // 점검 ID가 있는 행 번호 찾기 (1-indexed)
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === inspectionId) {
        rowIndex = i + 1; // 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      console.warn(`[Google Sheets] 점검 ID를 찾을 수 없음: ${inspectionId}`);
      return false;
    }

    // R열(상태)을 '삭제됨'으로 업데이트
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!R${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['삭제됨']],
      },
    });

    console.log(`[Google Sheets] 삭제 표시 완료: ${inspectionId} (행 ${rowIndex})`);
    return true;
  } catch (error) {
    console.error('[Google Sheets] 삭제 표시 실패:', error);
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
      '점검ID', '날짜', '차량번호', '소유자', '점검유형', '상태', '담당자',
      '오염도', '외관이상', '타이어상태', '내부오염',
      '세차', '배터리', '와이퍼/워셔액', '경고등',
      '특이사항', '사진수', '기록상태'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:R1`,
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
