# Vercel 배포 URL 차이점 설명

## 두 URL의 차이점

### 1. `premium-care-admin-git-main-lukas-projects-2703d158.vercel.app`
- **타입**: Production 배포 (메인 브랜치)
- **의미**: `main` 브랜치의 최신 배포
- **용도**: 실제 사용자가 접근하는 메인 사이트
- **특징**: 
  - `git-main`이 URL에 포함됨
  - 메인 브랜치에 푸시할 때마다 자동 업데이트
  - 가장 안정적인 버전

### 2. `premium-care-admin-6fq30mzh3-lukas-projects-2703d158.vercel.app`
- **타입**: Preview 배포 (특정 커밋)
- **의미**: 특정 커밋의 미리보기 배포
- **용도**: 코드 변경사항 테스트용
- **특징**:
  - 해시값(`6fq30mzh3`)이 URL에 포함됨
  - 각 커밋마다 고유한 URL 생성
  - Pull Request나 다른 브랜치 푸시 시 생성
  - 테스트 후 삭제 가능

## Vercel 배포 환경 종류

### Production (프로덕션)
- **URL 형식**: `프로젝트명-git-브랜치명-계정명.vercel.app`
- **예시**: `premium-care-admin-git-main-lukas-projects-2703d158.vercel.app`
- **설명**: 메인 브랜치의 배포
- **사용**: 실제 서비스 운영

### Preview (프리뷰)
- **URL 형식**: `프로젝트명-해시값-계정명.vercel.app`
- **예시**: `premium-care-admin-6fq30mzh3-lukas-projects-2703d158.vercel.app`
- **설명**: 각 커밋의 미리보기
- **사용**: 코드 변경사항 테스트

### Development (개발)
- **URL 형식**: `프로젝트명-git-브랜치명-계정명.vercel.app`
- **설명**: 개발 브랜치의 배포
- **사용**: 개발 중인 기능 테스트

## 어떤 URL을 사용해야 하나?

### ✅ Production URL 사용 (권장)
- **URL**: `premium-care-admin-git-main-lukas-projects-2703d158.vercel.app`
- **이유**: 
  - 가장 안정적이고 최신 버전
  - 메인 브랜치의 최신 코드 반영
  - 실제 사용자에게 제공되는 버전

### ⚠️ Preview URL 사용
- **URL**: `premium-care-admin-6fq30mzh3-lukas-projects-2703d158.vercel.app`
- **이유**:
  - 특정 커밋의 변경사항만 테스트
  - Pull Request 리뷰용
  - 나중에 삭제될 수 있음

## 커스텀 도메인 설정

Vercel에서는 프로젝트 이름으로 더 간단한 URL을 설정할 수 있습니다:

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings > Domains
4. 기본 도메인 확인: `premium-care-admin.vercel.app`

**기본 도메인 형식:**
- `프로젝트명.vercel.app`
- 예: `premium-care-admin.vercel.app`

이 URL은 항상 Production 배포를 가리킵니다.

## 확인 방법

### Vercel 대시보드에서 확인:
1. Vercel 대시보드 접속
2. 프로젝트 선택 (`premium-care-admin`)
3. **Deployments** 탭 클릭
4. 각 배포의 URL 확인:
   - Production: `git-main` 포함
   - Preview: 해시값 포함

## 요약

| URL | 타입 | 용도 | 안정성 |
|-----|------|------|--------|
| `git-main` | Production | 실제 서비스 | ⭐⭐⭐⭐⭐ |
| 해시값 | Preview | 테스트용 | ⭐⭐⭐ |

**권장사항**: Production URL (`git-main`)을 사용하세요. 이것이 실제 서비스 버전입니다.

