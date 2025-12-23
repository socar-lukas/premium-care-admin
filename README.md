# 프리미엄 차량 관리 어드민

차량 세차 및 관리 업체를 위한 웹 기반 어드민 시스템입니다.

## 주요 기능

- **차량 관리**: 차량 등록, 수정, 삭제, 검색
- **점검 기록**: 일자별 점검 기록 관리
- **점검 부위**: 부위별 상세 점검 내용 기록
- **사진 관리**: 
  - 다중 사진 업로드
  - 로컬 서버 저장
  - 구글 드라이브 동기화
  - 사진 갤러리 조회

## 기술 스택

- **프론트엔드**: Next.js 14, React, TypeScript, Tailwind CSS
- **백엔드**: Next.js API Routes
- **데이터베이스**: SQLite (Prisma ORM)
- **파일 저장**: 로컬 파일시스템 + Google Drive API

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

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

### 3. 데이터베이스 초기화

```bash
npm run db:generate
npm run db:push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 구글 드라이브 연동 설정

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "라이브러리"에서 "Google Drive API" 활성화
4. "사용자 인증 정보" > "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 리디렉션 URI 추가: `http://localhost:3000/api/auth/google/callback`
7. 클라이언트 ID와 클라이언트 시크릿을 `.env` 파일에 추가

### 2. Refresh Token 획득

OAuth 2.0 인증 플로우를 통해 refresh token을 획득해야 합니다. 

간단한 방법:
1. Google OAuth 2.0 Playground 사용: https://developers.google.com/oauthplayground/
2. Google Drive API v3 스코프 선택
3. Authorization code를 Exchange하여 refresh token 획득
4. `.env` 파일의 `GOOGLE_REFRESH_TOKEN`에 추가

### 3. 구글 드라이브 폴더 설정 (선택사항)

**방법 1: 특정 폴더 ID 지정**
1. 구글 드라이브에서 저장할 폴더 생성
2. 폴더 URL에서 ID 추출 (예: `https://drive.google.com/drive/folders/1ABC...`)
3. `.env` 파일의 `GOOGLE_DRIVE_FOLDER_ID`에 추가
4. 이 폴더 안에 차량번호별 폴더가 자동 생성됩니다

**방법 2: 상위 폴더 이름 지정 (기본값 사용)**
1. `.env` 파일의 `GOOGLE_DRIVE_TOP_FOLDER_NAME` 설정 (기본값: "PremiumCare")
2. 구글 드라이브 루트에 해당 이름의 폴더가 자동 생성됩니다
3. 그 안에 차량번호별 폴더가 생성됩니다

**폴더 구조 예시:**
```
PremiumCare/          (또는 지정한 상위 폴더)
  └── 156허7788/      (차량번호)
      ├── 사진1.jpg
      └── 사진2.jpg
```

## 프로젝트 구조

```
.
├── app/
│   ├── api/              # API 라우트
│   │   ├── vehicles/      # 차량 관리 API
│   │   ├── inspections/   # 점검 기록 API
│   │   └── photos/        # 사진 관리 API
│   ├── vehicles/          # 차량 관련 페이지
│   ├── inspections/       # 점검 기록 페이지
│   └── page.tsx           # 대시보드
├── lib/
│   ├── prisma.ts          # Prisma 클라이언트
│   ├── google-drive.ts    # 구글 드라이브 연동
│   └── file-upload.ts     # 파일 업로드 유틸리티
├── prisma/
│   └── schema.prisma      # 데이터베이스 스키마
└── uploads/               # 업로드된 파일 저장소
```

## 주요 API 엔드포인트

### 차량 관리
- `GET /api/vehicles` - 차량 목록 조회
- `GET /api/vehicles/:id` - 차량 상세 조회
- `POST /api/vehicles` - 차량 등록
- `PUT /api/vehicles/:id` - 차량 수정
- `DELETE /api/vehicles/:id` - 차량 삭제

### 점검 기록
- `GET /api/inspections` - 점검 기록 목록
- `GET /api/inspections/:id` - 점검 기록 상세
- `POST /api/inspections` - 점검 기록 생성
- `DELETE /api/inspections/:id` - 점검 기록 삭제

### 사진 관리
- `POST /api/photos/upload` - 사진 업로드
- `GET /api/photos/:id` - 사진 조회
- `GET /api/photos/inspection/:inspectionId` - 점검별 사진 목록
- `DELETE /api/photos/:id` - 사진 삭제

## 사용 방법

### 1. 차량 등록
1. "차량 등록" 버튼 클릭
2. 차량번호와 소유자명 필수 입력
3. 나머지 정보 선택 입력
4. "등록" 버튼 클릭

### 2. 점검 기록 작성
1. 차량 상세 페이지에서 "점검 기록 추가" 버튼 클릭
2. 점검 일자, 유형, 상태 입력
3. 점검 부위 추가 및 상태 입력
4. "등록" 버튼 클릭

### 3. 사진 업로드
1. 점검 기록 상세 페이지에서 "사진 추가" 버튼 클릭
2. 사진 파일 선택 (다중 선택 가능)
3. 설명 입력 (선택사항)
4. "업로드" 버튼 클릭
5. 사진은 자동으로 로컬 서버와 구글 드라이브에 저장됩니다

### 4. 사진 조회
1. 점검 기록 상세 페이지에서 사진 썸네일 클릭
2. 전체 화면으로 사진 확인
3. 구글 드라이브 링크가 있으면 해당 링크로도 접근 가능

## 데이터 조회 및 관리

자세한 내용은 [데이터 관리 가이드](./DATA_MANAGEMENT.md)를 참고하세요.

### 주요 조회 방법
1. **대시보드** (`/`): 전체 현황 및 최근 차량 확인
2. **차량 목록** (`/vehicles`): 모든 차량 검색 및 조회
3. **차량 상세** (`/vehicles/{id}`): 특정 차량의 모든 점검 기록 확인
4. **점검 기록 상세** (`/inspections/{id}`): 점검 상세 내용 및 사진 확인
5. **Google Drive**: 사진 백업 확인

### 데이터 보관 정책
- **기본 정책**: 데이터는 무기한 보관됩니다
- **삭제**: 수동으로만 삭제 가능 (차량 삭제 시 관련 데이터 모두 삭제)
- 자동 삭제 기능은 현재 제공되지 않습니다

## 주의사항

- 업로드된 파일은 `uploads/vehicles/` 디렉토리에 저장됩니다
- 구글 드라이브 연동은 선택사항입니다. 설정하지 않아도 로컬 저장은 정상 작동합니다
- 프로덕션 환경에서는 PostgreSQL 사용을 권장합니다
- 파일 크기 제한: 10MB
- 지원 이미지 형식: JPG, PNG, GIF, WEBP
- 데이터는 무기한 보관되므로 정기적인 백업을 권장합니다

## 라이선스

MIT


