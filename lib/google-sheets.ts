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
  vehicleType: string;  // 차량종류
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
  vehicleType: string;  // 차량종류
  overallStatus: string;
  inspector: string;
  carWash?: string;
  battery?: string;
  wiperWasher?: string[];
  warningLights?: string[];
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
 * 컬럼: 점검ID, 날짜, 차량번호, 소유자, 상태, 담당자, 세차, 배터리, 와이퍼/워셔액, 경고등, 특이사항, 사진수, 기록상태
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

    // 디버깅: 전달받은 레코드 로그
    console.log('[Google Sheets] 세차점검 레코드:', JSON.stringify(record, null, 2));
    console.log('[Google Sheets] wiperWasher:', record.wiperWasher);
    console.log('[Google Sheets] warningLights:', record.warningLights);

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
      record.memo || '',                          // K: 특이사항
      record.photoCount,                          // L: 사진수
      '정상',                                     // M: 기록상태
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '세차점검!A:M',
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
 * 사진수 업데이트
 */
export async function updatePhotoCount(inspectionId: string, inspectionType: string, photoCount: number): Promise<boolean> {
  console.log(`[Google Sheets] updatePhotoCount 호출 - ID: ${inspectionId}, 유형: ${inspectionType}, 사진수: ${photoCount}`);

  const auth = getServiceAccountAuth();
  if (!auth) {
    console.error('[Google Sheets] 인증 실패 - updatePhotoCount');
    return false;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    console.error('[Google Sheets] GOOGLE_SHEETS_ID 미설정 - updatePhotoCount');
    return false;
  }

  const sheetName = inspectionType === '반납상태' ? '반납상태' : '세차점검';
  console.log(`[Google Sheets] 시트명: ${sheetName}`);

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    // A열(점검ID)에서 해당 ID 찾기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = response.data.values;
    console.log(`[Google Sheets] A열 총 행 수: ${rows?.length || 0}`);
    if (!rows) return false;

    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === inspectionId) {
        rowIndex = i + 1;
        break;
      }
    }

    // 점검 ID를 찾지 못한 경우, 잠시 후 재시도 (시트 기록 지연 대응)
    if (rowIndex === -1) {
      console.log(`[Google Sheets] 점검 ID 첫 시도 실패, 2초 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const retryResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`,
      });

      const retryRows = retryResponse.data.values;
      if (retryRows) {
        for (let i = 0; i < retryRows.length; i++) {
          if (retryRows[i][0] === inspectionId) {
            rowIndex = i + 1;
            break;
          }
        }
      }
    }

    if (rowIndex === -1) {
      console.warn(`[Google Sheets] 점검 ID를 찾을 수 없음 (재시도 후에도): ${inspectionId}`);
      console.log(`[Google Sheets] A열의 처음 5개 값:`, rows.slice(0, 5).map(r => r[0]));
      return false;
    }

    console.log(`[Google Sheets] 점검 ID 발견 - 행 번호: ${rowIndex}`);

    // L열(사진수) 업데이트
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!L${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[photoCount]] },
    });

    console.log(`[Google Sheets] 사진수 업데이트 완료: ${inspectionId} -> ${photoCount}장 (행 ${rowIndex})`);
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

  const sheetName = inspectionType === '반납상태' ? '반납상태' : '세차점검';

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

    // M열(기록상태) 업데이트
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!M${rowIndex}`,
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
