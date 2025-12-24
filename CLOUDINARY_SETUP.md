# Cloudinary 설정 가이드

## Cloudinary란?

Cloudinary는 이미지 및 비디오 관리 클라우드 서비스입니다. Google Drive 대신 사용할 수 있는 대안입니다.

### 장점
- ✅ **완전 무료 티어**: 25GB 저장, 25GB 대역폭/월
- ✅ **자동 이미지 최적화**: 업로드 시 자동으로 최적화
- ✅ **CDN 제공**: 전 세계 빠른 이미지 로딩
- ✅ **설정 간단**: 회사 계정 불필요
- ✅ **코드 수정 완료**: 이미 적용됨

## 설정 방법

### 1단계: Cloudinary 계정 생성

1. https://cloudinary.com 접속
2. **"Sign Up for Free"** 클릭
3. 이메일, 비밀번호 입력하여 가입
4. 이메일 인증 완료

### 2단계: API 자격 증명 확인

1. Cloudinary 대시보드 접속
2. 상단에 표시되는 정보 확인:
   - **Cloud name** (예: `dabc123`)
   - **API Key** (예: `123456789012345`)
   - **API Secret** (예: `abcdefghijklmnopqrstuvwxyz`)

### 3단계: Vercel에 환경 변수 추가

1. Vercel 대시보드 접속
2. 프로젝트 선택 (`premium-care-admin`)
3. **Settings** > **Environment Variables** 클릭
4. 다음 변수들 추가:

#### 필수 환경 변수

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**예시:**
```
CLOUDINARY_CLOUD_NAME=dabc123
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

5. 각 변수에 대해 **Production**, **Preview**, **Development** 모두 선택
6. **Save** 클릭
7. **Redeploy** 클릭 (재배포 필요)

### 4단계: 로컬 개발 환경 설정 (선택사항)

로컬에서도 테스트하려면 `.env` 파일에 추가:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 폴더 구조

Cloudinary에 업로드된 이미지는 다음 구조로 저장됩니다:

```
PremiumCare/
  └── 차량번호/
      └── 차량번호 - 소유자명, 날짜시간, 상태, 점검유형, 담당자.jpg
```

예시:
```
PremiumCare/
  └── 156허7788/
      └── 156허7788 - 쏘카, 2025. 12. 23. 오후 2:55:00, 양호, 정기점검, 윤희성.jpg
```

## 확인 방법

### 1. Cloudinary 대시보드에서 확인

1. Cloudinary 대시보드 접속
2. 왼쪽 메뉴에서 **"Media Library"** 클릭
3. `PremiumCare` 폴더 확인
4. 차량번호 폴더 확인
5. 업로드된 이미지 확인

### 2. 웹사이트에서 확인

1. 사진 업로드
2. 이미지가 정상적으로 표시되는지 확인
3. 이미지 URL이 `res.cloudinary.com`으로 시작하는지 확인

## 무료 티어 제한

- **저장 공간**: 25GB
- **대역폭**: 25GB/월
- **변환 수**: 무제한
- **관리 API 호출**: 5,000/월

일반적인 사용에는 충분합니다.

## 문제 해결

### 이미지가 업로드되지 않는 경우

1. 환경 변수가 올바르게 설정되었는지 확인
2. Vercel 재배포 확인
3. Cloudinary 대시보드에서 업로드 로그 확인

### 이미지가 표시되지 않는 경우

1. 브라우저 콘솔에서 오류 확인
2. 이미지 URL이 올바른지 확인
3. Cloudinary 대시보드에서 이미지 존재 확인

### 저장 공간 부족 시

1. Cloudinary 대시보드에서 사용량 확인
2. 불필요한 이미지 삭제
3. 또는 유료 플랜으로 업그레이드

## Google Drive와의 차이점

| 항목 | Google Drive | Cloudinary |
|------|-------------|------------|
| 설정 복잡도 | 복잡 (OAuth 필요) | 간단 (API 키만) |
| 무료 저장 공간 | 15GB | 25GB |
| 이미지 최적화 | 없음 | 자동 |
| CDN | 없음 | 제공 |
| 회사 계정 필요 | 예 | 아니오 |

## 다음 단계

1. ✅ Cloudinary 계정 생성
2. ✅ API 자격 증명 확인
3. ✅ Vercel에 환경 변수 추가
4. ✅ 재배포
5. ✅ 사진 업로드 테스트

## 참고

- Cloudinary 공식 문서: https://cloudinary.com/documentation
- 무료 티어 정보: https://cloudinary.com/pricing

