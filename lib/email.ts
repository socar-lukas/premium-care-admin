import nodemailer from 'nodemailer';

// Gmail SMTP 설정
function getEmailTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.error('[Email] 환경 변수 누락 - EMAIL_USER 또는 EMAIL_APP_PASSWORD');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface InspectionEmailData {
  vehicleNumber: string;
  ownerName: string;
  inspectionType: string;
  inspectionDate: string;
  overallStatus: string;
  inspector?: string;
  memo?: string;
  photoCount: number;
  attachments?: EmailAttachment[];
}

/**
 * 점검 완료 이메일 발송
 */
export async function sendInspectionEmail(data: InspectionEmailData): Promise<boolean> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return false;
  }

  const recipientEmail = process.env.EMAIL_RECIPIENT;
  if (!recipientEmail) {
    console.error('[Email] EMAIL_RECIPIENT 환경 변수 미설정');
    return false;
  }

  try {
    const subject = `[점검완료] ${data.vehicleNumber} - ${data.ownerName} (${data.inspectionType})`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          차량 점검 완료 알림
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold; width: 30%;">차량번호</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${data.vehicleNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">소유자</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${data.ownerName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">점검유형</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${data.inspectionType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">점검일시</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${data.inspectionDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">상태</td>
            <td style="padding: 10px; border: 1px solid #ddd; color: ${data.overallStatus === '양호' ? '#28a745' : '#dc3545'}; font-weight: bold;">
              ${data.overallStatus}
            </td>
          </tr>
          ${data.inspector ? `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">담당자</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${data.inspector}</td>
          </tr>
          ` : ''}
          ${data.memo ? `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">특이사항</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${data.memo}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">첨부 사진</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${data.photoCount}장</td>
          </tr>
        </table>

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          본 메일은 BlackLabel Admin 시스템에서 자동 발송되었습니다.
        </p>
      </div>
    `;

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject,
      html: htmlContent,
    };

    // 첨부파일 추가 (최대 25MB 제한 고려)
    if (data.attachments && data.attachments.length > 0) {
      const totalSize = data.attachments.reduce((sum, att) => sum + att.content.length, 0);
      const maxSize = 20 * 1024 * 1024; // 20MB (여유 두기)

      if (totalSize <= maxSize) {
        mailOptions.attachments = data.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        }));
      } else {
        console.warn(`[Email] 첨부파일 크기 초과 (${Math.round(totalSize / 1024 / 1024)}MB), 첨부 생략`);
      }
    }

    await transporter.sendMail(mailOptions);
    console.log(`[Email] 발송 완료: ${data.vehicleNumber} -> ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('[Email] 발송 실패:', error);
    return false;
  }
}

/**
 * 사진만 이메일로 발송 (점검 완료 후 사진 업로드 시)
 */
export async function sendPhotosEmail(
  vehicleNumber: string,
  ownerName: string,
  inspectionType: string,
  inspectionDate: string,
  attachments: EmailAttachment[]
): Promise<boolean> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return false;
  }

  const recipientEmail = process.env.EMAIL_RECIPIENT;
  if (!recipientEmail) {
    console.error('[Email] EMAIL_RECIPIENT 환경 변수 미설정');
    return false;
  }

  try {
    const subject = `[사진백업] ${vehicleNumber} - ${ownerName} (${inspectionType}) - ${attachments.length}장`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">점검 사진 백업</h2>
        <p><strong>차량번호:</strong> ${vehicleNumber}</p>
        <p><strong>소유자:</strong> ${ownerName}</p>
        <p><strong>점검유형:</strong> ${inspectionType}</p>
        <p><strong>점검일:</strong> ${inspectionDate}</p>
        <p><strong>첨부 사진:</strong> ${attachments.length}장</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          본 메일은 BlackLabel Admin 시스템에서 자동 발송되었습니다.
        </p>
      </div>
    `;

    // 첨부파일 크기 체크
    const totalSize = attachments.reduce((sum, att) => sum + att.content.length, 0);
    const maxSize = 20 * 1024 * 1024; // 20MB

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject,
      html: htmlContent,
    };

    if (totalSize <= maxSize) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      }));
    } else {
      // 크기 초과 시 여러 이메일로 분할 발송
      console.log(`[Email] 첨부파일 크기 초과 (${Math.round(totalSize / 1024 / 1024)}MB), 분할 발송`);

      let currentBatch: EmailAttachment[] = [];
      let currentSize = 0;
      let batchNumber = 1;

      for (const att of attachments) {
        if (currentSize + att.content.length > maxSize && currentBatch.length > 0) {
          // 현재 배치 발송
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `${subject} (${batchNumber}/${Math.ceil(attachments.length / currentBatch.length)})`,
            html: htmlContent,
            attachments: currentBatch.map(a => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType,
            })),
          });
          console.log(`[Email] 분할 발송 ${batchNumber} 완료`);

          currentBatch = [];
          currentSize = 0;
          batchNumber++;
        }

        currentBatch.push(att);
        currentSize += att.content.length;
      }

      // 마지막 배치 발송
      if (currentBatch.length > 0) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipientEmail,
          subject: `${subject} (${batchNumber}/${batchNumber})`,
          html: htmlContent,
          attachments: currentBatch.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
          })),
        });
        console.log(`[Email] 분할 발송 ${batchNumber} 완료`);
      }

      return true;
    }

    await transporter.sendMail(mailOptions);
    console.log(`[Email] 사진 발송 완료: ${vehicleNumber} (${attachments.length}장)`);
    return true;
  } catch (error) {
    console.error('[Email] 사진 발송 실패:', error);
    return false;
  }
}
