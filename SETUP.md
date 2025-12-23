# 설정 가이드

## 빠른 시작

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Database
DATABASE_URL="file:./dev.db"

# Google Drive API (선택사항)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
GOOGLE_REFRESH_TOKEN=""
# 구글 드라이브 최상위 폴더 ID (특정 폴더 안에 저장하려면 설정)
GOOGLE_DRIVE_FOLDER_ID=""
# 구글 드라이브 상위 폴더 이름 (GOOGLE_DRIVE_FOLDER_ID가 없을 때 사용, 기본값: PremiumCare)
GOOGLE_DRIVE_TOP_FOLDER_NAME="PremiumCare"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. 데이터베이스 초기화

터미널에서 다음 명령어를 실행하세요:

```bash
npm run db:generate
npm run db:push
```

### 3. 개발 서버 실행

```bash
npm run dev
```

## 문제 해결

### "Failed to create vehicle" 오류

이 오류가 발생하는 경우:

1. **.env 파일 확인**: 프로젝트 루트에 `.env` 파일이 있는지 확인하세요.
2. **데이터베이스 초기화**: 다음 명령어를 실행하세요:
   ```bash
   npm run db:generate
   npm run db:push
   ```
3. **서버 재시작**: 개발 서버를 재시작하세요.
4. **브라우저 콘솔 확인**: 브라우저 개발자 도구의 콘솔에서 자세한 오류 메시지를 확인하세요.

### 데이터베이스 파일 위치

데이터베이스 파일(`dev.db`)은 프로젝트 루트에 생성됩니다.

### Prisma 클라이언트 재생성

Prisma 스키마를 수정한 경우:

```bash
npm run db:generate
npm run db:push
```

