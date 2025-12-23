import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

let oauth2Client: OAuth2Client | null = null;

export function getGoogleDriveClient(): OAuth2Client | null {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return null;
  }

  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (process.env.GOOGLE_REFRESH_TOKEN) {
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
    }
  }

  return oauth2Client;
}

export async function uploadToGoogleDrive(
  filePath: string,
  fileName: string,
  folderPath: string,
  mimeType?: string
): Promise<{ fileId: string; webViewLink: string } | null> {
  const auth = getGoogleDriveClient();
  if (!auth) {
    console.warn('Google Drive credentials not configured');
    return null;
  }

  try {
    const drive = google.drive({ version: 'v3', auth });

    // 최상위 폴더 ID 설정 (환경 변수로 지정하거나 루트 사용)
    let parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';
    
    // 상위 폴더 이름이 지정되어 있으면 먼저 생성/찾기
    const topLevelFolderName = process.env.GOOGLE_DRIVE_TOP_FOLDER_NAME || 'PremiumCare';
    if (topLevelFolderName && parentFolderId === 'root') {
      // 루트에 상위 폴더가 있는지 확인
      const existingTopFolders = await drive.files.list({
        q: `name='${topLevelFolderName}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`,
        fields: 'files(id, name)',
      });

      if (existingTopFolders.data.files && existingTopFolders.data.files.length > 0) {
        parentFolderId = existingTopFolders.data.files[0].id!;
      } else {
        // 상위 폴더 생성
        const topFolder = await drive.files.create({
          requestBody: {
            name: topLevelFolderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: ['root'],
          },
          fields: 'id',
        });
        parentFolderId = topFolder.data.id!;
      }
    }
    
    // 차량번호 폴더 생성 또는 찾기
    if (folderPath) {
      // 폴더명은 차량번호만 사용 (슬래시로 구분된 경우 첫 번째만 사용)
      const folderName = folderPath.split('/')[0];
      
      if (folderName) {
        // 차량번호 폴더가 이미 존재하는지 확인
        const existingFolders = await drive.files.list({
          q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
          fields: 'files(id, name)',
        });

        if (existingFolders.data.files && existingFolders.data.files.length > 0) {
          parentFolderId = existingFolders.data.files[0].id!;
        } else {
          // 차량번호 폴더 생성
          const folder = await drive.files.create({
            requestBody: {
              name: folderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [parentFolderId],
            },
            fields: 'id',
          });
          parentFolderId = folder.data.id!;
        }
      }
    }

    // MIME 타입 결정
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
    };
    const detectedMimeType = mimeType || mimeTypes[ext] || 'image/jpeg';

    // 파일 업로드
    const fileMetadata = {
      name: fileName,
      parents: [parentFolderId],
    };

    const media = {
      mimeType: detectedMimeType,
      body: fs.createReadStream(filePath),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    // 파일 공개 권한 설정 (선택사항)
    await drive.permissions.create({
      fileId: file.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return {
      fileId: file.data.id!,
      webViewLink: file.data.webViewLink || '',
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return null;
  }
}

export async function uploadToGoogleDriveFromBuffer(
  buffer: Buffer,
  fileName: string,
  vehicleNumber: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string } | null> {
  const auth = getGoogleDriveClient();
  if (!auth) {
    console.warn('Google Drive credentials not configured');
    return null;
  }

  try {
    const drive = google.drive({ version: 'v3', auth });

    let parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';

    // If GOOGLE_DRIVE_FOLDER_ID is not set, create a top-level folder
    if (parentFolderId === 'root' && process.env.GOOGLE_DRIVE_TOP_FOLDER_NAME) {
      const topFolderName = process.env.GOOGLE_DRIVE_TOP_FOLDER_NAME;
      const existingTopFolders = await drive.files.list({
        q: `name='${topFolderName}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`,
        fields: 'files(id, name)',
      });

      if (existingTopFolders.data.files && existingTopFolders.data.files.length > 0) {
        parentFolderId = existingTopFolders.data.files[0].id!;
      } else {
        const topFolder = await drive.files.create({
          requestBody: {
            name: topFolderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: ['root'],
          },
          fields: 'id',
        });
        parentFolderId = topFolder.data.id!;
      }
    }

    // Create/find vehicle-specific folder
    const vehicleFolderName = vehicleNumber;
    let vehicleFolderId = parentFolderId;

    const existingVehicleFolders = await drive.files.list({
      q: `name='${vehicleFolderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    if (existingVehicleFolders.data.files && existingVehicleFolders.data.files.length > 0) {
      vehicleFolderId = existingVehicleFolders.data.files[0].id!;
    } else {
      const vehicleFolder = await drive.files.create({
        requestBody: {
          name: vehicleFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        },
        fields: 'id',
      });
      vehicleFolderId = vehicleFolder.data.id!;
    }

    const fileMetadata = {
      name: fileName,
      parents: [vehicleFolderId],
    };

    const media = {
      mimeType: mimeType,
      body: buffer,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    await drive.permissions.create({
      fileId: file.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return {
      fileId: file.data.id!,
      webViewLink: file.data.webViewLink || '',
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return null;
  }
}

export async function deleteFromGoogleDrive(fileId: string): Promise<boolean> {
  const auth = getGoogleDriveClient();
  if (!auth) {
    return false;
  }

  try {
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    return false;
  }
}

