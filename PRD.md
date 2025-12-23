# 프리미엄 차량 관리 서비스 어드민 PRD

## 1. 프로젝트 개요

### 1.1 목적
차량 세차 및 관리 업체가 차량 관리 전후의 상태를 체계적으로 기록하고 관리할 수 있는 웹 기반 어드민 시스템

### 1.2 주요 목표
- 차량별 일자별 점검 기록 관리
- 점검 부위별 상세 내용 및 사진 기록
- 사진의 이중 저장 (로컬 서버 + 구글 드라이브)
- 직관적인 조회 및 검색 기능

## 2. 기능 요구사항

### 2.1 차량 관리
- **차량 등록**
  - 차량번호 (필수)
  - 차량 소유자명
  - 차량 모델/제조사
  - 연식
  - 연락처
  - 차량 유형 (승용차, SUV, 트럭 등)
  - 메모/특이사항

- **차량 목록 조회**
  - 차량번호, 소유자명으로 검색
  - 최근 점검일 기준 정렬
  - 페이지네이션

- **차량 정보 수정/삭제**

### 2.2 점검 기록 관리
- **점검 기록 생성**
  - 차량 선택 (차량번호)
  - 점검 일자 (필수)
  - 점검 유형 (세차 전, 세차 후, 정기점검, 수리 등)
  - 전체 점검 상태 (우수/양호/보통/불량)
  - 점검 담당자

- **점검 부위별 상세 기록**
  - 부위 카테고리 (외부, 내부, 엔진실, 타이어, 기타)
  - 부위별 상태 (우수/양호/보통/불량/수리필요)
  - 부위별 메모/설명
  - 부위별 사진 첨부 (다중 업로드 가능)
  - 사진별 설명/메모

### 2.3 사진 관리
- **사진 업로드**
  - 다중 파일 선택 (드래그 앤 드롭 지원)
  - 이미지 미리보기
  - 업로드 진행률 표시
  - 파일 형식 제한 (JPG, PNG, HEIC)
  - 파일 크기 제한 (최대 10MB)

- **사진 저장**
  - 로컬 서버 저장 (uploads/vehicles/{차량번호}/{일자}/)
  - 구글 드라이브 동기화
  - 구글 드라이브 폴더 구조: PremiumCare/{차량번호}/{일자}/

- **사진 조회**
  - 점검 기록 상세에서 사진 갤러리 형태로 조회
  - 썸네일 및 원본 이미지 뷰어
  - 사진별 메모/설명 표시
  - 다운로드 기능

### 2.4 대시보드
- 전체 차량 수
- 최근 점검 기록
- 오늘 예정된 점검
- 통계 (월별 점검 건수, 차량별 점검 이력)

### 2.5 검색 및 필터
- 차량번호로 검색
- 소유자명으로 검색
- 점검일자 범위 필터
- 점검 유형 필터
- 상태별 필터

## 3. 기술 스택

### 3.1 프론트엔드
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **UI 라이브러리**: React, Tailwind CSS
- **상태 관리**: React Context / Zustand
- **폼 관리**: React Hook Form
- **이미지 처리**: next/image
- **날짜 처리**: date-fns

### 3.2 백엔드
- **런타임**: Node.js
- **프레임워크**: Next.js API Routes
- **데이터베이스**: SQLite (개발) / PostgreSQL (운영 권장)
- **ORM**: Prisma
- **파일 업로드**: multer, formidable

### 3.3 외부 연동
- **구글 드라이브 API**: googleapis
- **인증**: OAuth 2.0 (구글 드라이브 접근용)

### 3.4 인프라
- **파일 저장**: 로컬 파일시스템 + 구글 드라이브
- **환경 변수**: .env 파일

## 4. 데이터베이스 스키마

### 4.1 Vehicle (차량)
```
- id: UUID (Primary Key)
- vehicleNumber: String (Unique, 차량번호)
- ownerName: String (소유자명)
- model: String (모델)
- manufacturer: String (제조사)
- year: Integer (연식)
- contact: String (연락처)
- vehicleType: String (차량 유형)
- memo: String? (메모)
- createdAt: DateTime
- updatedAt: DateTime
```

### 4.2 Inspection (점검 기록)
```
- id: UUID (Primary Key)
- vehicleId: UUID (Foreign Key -> Vehicle)
- inspectionDate: DateTime (점검 일자)
- inspectionType: String (점검 유형)
- overallStatus: String (전체 상태)
- inspector: String (담당자)
- memo: String? (전체 메모)
- createdAt: DateTime
- updatedAt: DateTime
```

### 4.3 InspectionArea (점검 부위)
```
- id: UUID (Primary Key)
- inspectionId: UUID (Foreign Key -> Inspection)
- areaCategory: String (부위 카테고리)
- areaName: String (부위명)
- status: String (상태)
- memo: String? (메모)
- createdAt: DateTime
- updatedAt: DateTime
```

### 4.4 InspectionPhoto (점검 사진)
```
- id: UUID (Primary Key)
- inspectionAreaId: UUID (Foreign Key -> InspectionArea)
- fileName: String (파일명)
- originalFileName: String (원본 파일명)
- filePath: String (로컬 경로)
- googleDriveFileId: String? (구글 드라이브 파일 ID)
- googleDriveUrl: String? (구글 드라이브 URL)
- fileSize: Integer (파일 크기)
- mimeType: String (MIME 타입)
- description: String? (설명)
- uploadedAt: DateTime
```

## 5. API 엔드포인트

### 5.1 차량 관리
- `GET /api/vehicles` - 차량 목록 조회
- `GET /api/vehicles/:id` - 차량 상세 조회
- `POST /api/vehicles` - 차량 등록
- `PUT /api/vehicles/:id` - 차량 수정
- `DELETE /api/vehicles/:id` - 차량 삭제

### 5.2 점검 기록
- `GET /api/inspections` - 점검 기록 목록
- `GET /api/inspections/:id` - 점검 기록 상세
- `GET /api/inspections/vehicle/:vehicleId` - 차량별 점검 기록
- `POST /api/inspections` - 점검 기록 생성
- `PUT /api/inspections/:id` - 점검 기록 수정
- `DELETE /api/inspections/:id` - 점검 기록 삭제

### 5.3 사진 관리
- `POST /api/photos/upload` - 사진 업로드
- `GET /api/photos/:id` - 사진 조회
- `GET /api/photos/inspection/:inspectionId` - 점검별 사진 목록
- `DELETE /api/photos/:id` - 사진 삭제

### 5.4 구글 드라이브
- `POST /api/google-drive/sync` - 구글 드라이브 동기화
- `GET /api/google-drive/status` - 동기화 상태 확인

## 6. UI/UX 요구사항

### 6.1 디자인 원칙
- 깔끔하고 직관적인 인터페이스
- 모바일 반응형 디자인
- 빠른 로딩 속도
- 접근성 고려

### 6.2 주요 화면
1. **대시보드**: 통계 및 최근 활동
2. **차량 목록**: 검색 및 필터 기능
3. **차량 상세**: 차량 정보 및 점검 이력
4. **점검 기록 작성**: 폼 기반 입력
5. **점검 기록 상세**: 사진 갤러리 포함
6. **사진 갤러리**: 전체 사진 조회

## 7. 보안 및 권한

### 7.1 인증 (향후 확장)
- 관리자 로그인 (선택사항)
- 세션 관리

### 7.2 데이터 보안
- 파일 업로드 검증
- SQL Injection 방지 (Prisma 사용)
- XSS 방지

## 8. 개발 단계

### Phase 1: 기본 구조 및 차량 관리
- 프로젝트 초기 설정
- 데이터베이스 스키마 구현
- 차량 CRUD 기능

### Phase 2: 점검 기록 관리
- 점검 기록 CRUD
- 점검 부위 관리
- 기본 UI 구현

### Phase 3: 사진 업로드 및 관리
- 로컬 파일 업로드
- 사진 갤러리
- 이미지 최적화

### Phase 4: 구글 드라이브 연동
- OAuth 설정
- 구글 드라이브 API 연동
- 동기화 기능

### Phase 5: UI/UX 개선 및 최적화
- 반응형 디자인
- 성능 최적화
- 에러 처리

## 9. 향후 확장 기능
- 알림 기능 (점검 예정일 알림)
- 리포트 생성 (PDF)
- 엑셀 내보내기
- 다국어 지원
- 모바일 앱 연동


