import { google } from 'googleapis';

// 서비스 계정 인증 클라이언트
function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    console.error('[Google Sheets] 환경 변수 누락');
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

// 반납상태 점검 데이터
export interface ReturnInspectionRecord {
  inspectionId: string;
  date: string;
  vehicleNumber: string;
  vehicleType: string;  // D열: 차량종류
  overallStatus: string;
  inspector: string;
  contamination?: string;
  exteriorDamage?: string[];
  tires?: Record<string, string>;
  interiorContamination?: string[];
  memo?: string;
  photoCount: number;
}

// 세차점검 데이터
export interface CarwashInspectionRecord {
  inspectionId: string;
  date: string;
  vehicleNumber: string;
  vehicleType: string;  // D열: 차량종류
  overallStatus: string;
  inspector: string;
  carWash?: string;
  battery?: string;
  wiperWasher?: string[];
  warningLights?: string[];
  amenity?: string;  // K열: 어메니티 (O/X)
  memo?: string;
  photoCount: number;
}

// 소모품·경정비 데이터
export interface MaintenanceRecord {
  inspectionId: string;
  date: string;
  vehicleNumber: string;
  vehicleType: string;  // D열: 차량종류
  overallStatus: string;  // 소모품교체/경정비/사고수리
  inspector: string;
  consumables?: string[];  // 소모품 교체 항목
  repairs?: string[];  // 경정비 항목
  accidentRepairs?: string[];  // 사고수리 항목
  memo?: string;
  photoCount: number;
}

/**
 * 반납상태 시트에 기록 추가
 * 시트명: 반납상태
 * 컬럼: 점검ID, 날짜, 차량번호, 소유자, 상태, 담당자, 오염도, 외관이상, 타이어상태, 내부오염, 특이사항, 사진수, 기록상태
 */
export async function appendReturnInspection(record: ReturnInspectionRecord): Promise<boolean> {
  const auth = getServiceAccountAuth();
  if (!auth) return false;

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    console.warn('[Google Sheets] GOOGLE_SHEETS_ID 미설정');
    return false;
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const tiresStr = record.tires
      ? Object.entries(record.tires)
          .map(([pos, status]) => `${pos}:${status}`)
          .join(', ')
      : '';

    const arrayToStr = (arr?: string[]) => arr?.join(', ') || '';

    const rowData = [
      record.inspectionId,                        // A: 점검ID
      record.date,                                // B: 날짜
      record.vehicleNumber,                       // C: 차량번호
      record.vehicleType || '',                   // D: 차량종류
      record.overallStatus,                       // E: 상태
      record.inspector || '',                     // F: 담당자
      record.contamination || '',                 // G: 오염도
      arrayToStr(record.exteriorDamage),          // H: 외관이상
      tiresStr,                                   // I: 타이어상태
      arrayToStr(record.interiorContamination),   // J: 내부오염
      record.memo || '',                          // K: 특이사항
      record.photoCount,                          // L: 사진수
      '정상',                                     // M: 기록상태
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '반납상태!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });

    console.log(`[Google Sheets] 반납상태 기록 완료: ${record.vehicleNumber}`);
    return true;
  } catch (error) {
    console.error('[Google Sheets] 반납상태 기록 실패:', error);
    return false;
  }
}

/**
 * 세차점검 시트에 기록 추가
 * 시트명: 세차점검
 * 컬럼: 점검ID, 날짜, 차량번호, 차량종류, 상태, 담당자, 세차, 배터리, 와이퍼/워셔액, 경고등, 어메니티, 특이사항, 사진수, 기록상태
 */
export async function appendCarwashInspection(record: CarwashInspectionRecord): Promise<boolean> {
  const auth = getServiceAccountAuth();
  if (!auth) return false;

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    console.warn('[Google Sheets] GOOGLE_SHEETS_ID 미설정');
    return false;
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const arrayToStr = (arr?: string[]) => arr?.join(', ') || '';

    const rowData = [
      record.inspectionId,                        // A: 점검ID
      record.date,                                // B: 날짜
      record.vehicleNumber,                       // C: 차량번호
      record.vehicleType || '',                   // D: 차량종류
      record.overallStatus,                       // E: 상태
      record.inspector || '',                     // F: 담당자
      record.carWash || '',                       // G: 세차
      record.battery || '',                       // H: 배터리
      arrayToStr(record.wiperWasher),             // I: 와이퍼/워셔액
      arrayToStr(record.warningLights),           // J: 경고등
      record.amenity || '',                       // K: 어메니티
      record.memo || '',                          // L: 특이사항
      record.photoCount,                          // M: 사진수
      '정상',                                     // N: 기록상태
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '세차점검!A:N',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });

    console.log(`[Google Sheets] 세차점검 기록 완료: ${record.vehicleNumber}`);
    return true;
  } catch (error) {
    console.error('[Google Sheets] 세차점검 기록 실패:', error);
    return false;
  }
}

/**
 * 소모품·경정비 시트에 기록 추가
 * 시트명: 소모품경정비
 * 컬럼: 점검ID, 날짜, 차량번호, 차량종류, 상태, 담당자, 소모품교체, 경정비, 사고수리, 특이사항, 사진수, 기록상태
 */
export async function appendMaintenanceRecord(record: MaintenanceRecord): Promise<boolean> {
  const auth = getServiceAccountAuth();
  if (!auth) return false;

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    console.warn('[Google Sheets] GOOGLE_SHEETS_ID 미설정');
    return false;
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const arrayToStr = (arr?: string[]) => arr?.join(', ') || '';

    const rowData = [
      record.inspectionId,                        // A: 점검ID
      record.date,                                // B: 날짜
      record.vehicleNumber,                       // C: 차량번호
      record.vehicleType || '',                   // D: 차량종류
      record.overallStatus,                       // E: 상태
      record.inspector || '',                     // F: 담당자
      arrayToStr(record.consumables),             // G: 소모품교체
      arrayToStr(record.repairs),                 // H: 경정비
      arrayToStr(record.accidentRepairs),         // I: 사고수리
      record.memo || '',                          // J: 특이사항
      record.photoCount,                          // K: 사진수
      '정상',                                     // L: 기록상태
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '소모품경정비!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });

    console.log(`[Google Sheets] 소모품경정비 기록 완료: ${record.vehicleNumber}`);
    return true;
  } catch (error) {
    console.error('[Google Sheets] 소모품경정비 기록 실패:', error);
    return false;
  }
}

/**
 * 시트 이름 반환
 */
function getSheetName(inspectionType: string): string {
  if (inspectionType === '반납상태') return '반납상태';
  if (inspectionType === '소모품·경정비') return '소모품경정비';
  return '세차점검';
}

/**
 * 사진수 컬럼 반환 (소모품경정비는 K열, 반납상태는 L열, 세차점검은 M열)
 */
function getPhotoCountColumn(inspectionType: string): string {
  if (inspectionType === '소모품·경정비') return 'K';
  if (inspectionType === '반납상태') return 'L';
  return 'M';  // 세차점검
}

/**
 * 기록상태 컬럼 반환 (소모품경정비는 L열, 반납상태는 M열, 세차점검은 N열)
 */
function getStatusColumn(inspectionType: string): string {
  if (inspectionType === '소모품·경정비') return 'L';
  if (inspectionType === '반납상태') return 'M';
  return 'N';  // 세차점검
}

/**
 * 사진수 업데이트
 */
export async function updatePhotoCount(inspectionId: string, inspectionType: string, photoCount: number): Promise<boolean> {
  const auth = getServiceAccountAuth();
  if (!auth) return false;

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) return false;

  const sheetName = getSheetName(inspectionType);
  const photoCountColumn = getPhotoCountColumn(inspectionType);

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    // A열(점검ID)에서 해당 ID 찾기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = response.data.values;
    if (!rows) return false;

    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === inspectionId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      console.warn(`[Google Sheets] 점검 ID를 찾을 수 없음: ${inspectionId}`);
      return false;
    }

    // 사진수 업데이트
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${photoCountColumn}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[photoCount]] },
    });

    console.log(`[Google Sheets] 사진수 업데이트: ${inspectionId} -> ${photoCount}장`);
    return true;
  } catch (error) {
    console.error('[Google Sheets] 사진수 업데이트 실패:', error);
    return false;
  }
}

/**
 * 점검 삭제 표시
 */
export async function markInspectionAsDeleted(inspectionId: string, inspectionType: string): Promise<boolean> {
  const auth = getServiceAccountAuth();
  if (!auth) return false;

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) return false;

  const sheetName = getSheetName(inspectionType);
  const statusColumn = getStatusColumn(inspectionType);

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = response.data.values;
    if (!rows) return false;

    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === inspectionId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      console.warn(`[Google Sheets] 점검 ID를 찾을 수 없음: ${inspectionId}`);
      return false;
    }

    // 기록상태 업데이트
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${statusColumn}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['삭제됨']] },
    });

    console.log(`[Google Sheets] 삭제 표시 완료: ${inspectionId}`);
    return true;
  } catch (error) {
    console.error('[Google Sheets] 삭제 표시 실패:', error);
    return false;
  }
}
