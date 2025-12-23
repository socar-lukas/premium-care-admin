// 데이터베이스 초기화 스크립트
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 데이터베이스 초기화 시작...\n');

// .env 파일 확인 및 생성
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 .env 파일이 없습니다. 생성 중...');
  const envContent = `# Database
DATABASE_URL="file:./dev.db"

# Google Drive API (선택사항)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
GOOGLE_REFRESH_TOKEN=""
GOOGLE_DRIVE_FOLDER_ID=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env 파일 생성 완료\n');
}

// Prisma 클라이언트 생성
console.log('📦 Prisma 클라이언트 생성 중...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma 클라이언트 생성 완료\n');
} catch (error) {
  console.error('❌ Prisma 클라이언트 생성 실패:', error.message);
  process.exit(1);
}

// 데이터베이스 스키마 푸시
console.log('🗄️  데이터베이스 스키마 적용 중...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ 데이터베이스 초기화 완료!\n');
} catch (error) {
  console.error('❌ 데이터베이스 초기화 실패:', error.message);
  process.exit(1);
}

console.log('🎉 모든 설정이 완료되었습니다!');

