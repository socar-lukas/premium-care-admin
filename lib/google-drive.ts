import { google } from 'googleapis';
import { Readable } from 'stream';

// 서비스 계정 인증 클라이언트
function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    console.error('[Google Drive] 환경 변수 누락 - GOOGLE_SERVICE_ACCOUNT_EMAIL 또는 GOOGLE_PRIVATE_KEY');
    return null;
  }

  // Vercel에서 줄바꿈 처리 (\\n을 실제 줄바꿈으로)
  privateKey = privateKey.replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
}

// 폴더 찾기 또는 생성 (중복 방지 로직 개선)
async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentId: string
): Promise<string> {
  try {
    // 기존 폴더 찾기
    const existing = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (existing.data.files && existing.data.files.length > 0) {
      console.log(`[Google Drive] 기존 폴더 사용: ${folderName} (${existing.data.files[0].id})`);
      return existing.data.files[0].id!;
    }

    // 새 폴더 생성
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    console.log(`[Google Drive] 새 폴더 생성: ${folderName} (${folder.data.id})`);
    return folder.data.id!;
  } catch (error) {
    console.error(`[Google Drive] 폴더 찾기/생성 실패: ${folderName}`, error);
    throw error;
  }
}

/**
 * Google Drive에 사진 백업
 * 폴더 구조: 루트폴더 > 차량번호 > 날짜 > 점검유형 > 파일
 */
export async function backupPhotoToGoogleDrive(
  buffer: Buffer,
  fileName: string,
  vehicleNumber: string,
  date: string, // YYYY-MM-DD 형식
  mimeType: string,
  inspectionType: string // '반납상태' 또는 '세차점검'
): Promise<{ fileId: string; webViewLink: string } | null> {
  const auth = getServiceAccountAuth();
  if (!auth) {
    console.warn('[Google Drive] 서비스 계정 credentials 미설정');
    return null;
  }

  const rootFolderId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID;
  if (!rootFolderId) {
    console.warn('[Google Drive] GOOGLE_DRIVE_BACKUP_FOLDER_ID 미설정');
    return null;
  }

  try {
    const drive = google.drive({ version: 'v3', auth });

    console.log(`[Google Drive] 업로드 시작: ${vehicleNumber}/${date}/${inspectionType}/${fileName}`);

    // 폴더 구조: 차량번호 > 날짜 > 점검유형 (순차적으로 생성)
    const vehicleFolderId = await findOrCreateFolder(drive, vehicleNumber, rootFolderId);
    const dateFolderId = await findOrCreateFolder(drive, date, vehicleFolderId);
    const typeFolderId = await findOrCreateFolder(drive, inspectionType, dateFolderId);

    // Buffer를 Readable 스트림으로 변환 (Node.js 방식)
    const stream = Readable.from(buffer);

    // 파일 업로드
    console.log(`[Google Drive] 파일 업로드 시작 - 크기: ${buffer.length} bytes, mimeType: ${mimeType}`);

    const file = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [typeFolderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
    });

    console.log(`[Google Drive] files.create 응답:`, JSON.stringify(file.data, null, 2));

    if (!file.data.id) {
      console.error('[Google Drive] 파일 ID 없음');
      return null;
    }

    console.log(`[Google Drive] 파일 업로드 완료: ${file.data.id}`);

    // 공개 권한 설정 (링크로 접근 가능)
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log(`[Google Drive] 백업 완료: ${vehicleNumber}/${date}/${inspectionType}/${fileName}`);

    return {
      fileId: file.data.id,
      webViewLink: file.data.webViewLink || file.data.webContentLink || '',
    };
  } catch (error) {
    console.error('[Google Drive] 백업 실패:', error);
    return null;
  }
}

/**
 * Google Drive에서 파일 삭제
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<boolean> {
  const auth = getServiceAccountAuth();
  if (!auth) {
    return false;
  }

  try {
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId });
    console.log(`[Google Drive] 삭제 완료: ${fileId}`);
    return true;
  } catch (error) {
    console.error('[Google Drive] 삭제 실패:', error);
    return false;
  }
}
