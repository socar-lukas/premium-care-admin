# Git 오류 해결 가이드

## 발생한 오류

```
error: remote origin already exists.
remote: Repository not found.
fatal: repository 'https://github.com/YOUR_USERNAME/premium-care-admin.git/' not found
```

## 원인

1. **이미 origin이 설정되어 있음** - 기존에 잘못된 URL로 설정됨
2. **저장소를 찾을 수 없음** - 다음 중 하나:
   - `YOUR_USERNAME`이 실제 사용자명으로 바뀌지 않음
   - GitHub 저장소가 아직 생성되지 않음
   - 저장소 이름이 다름

## 해결 방법

### 방법 1: GitHub 저장소 먼저 생성 (권장)

#### 1단계: GitHub에서 저장소 생성

1. https://github.com/new 접속
2. **Repository name**: `premium-care-admin` (또는 원하는 이름)
3. **Public** 또는 **Private** 선택
4. **"Create repository"** 클릭
5. **중요**: "Initialize this repository with a README" 체크하지 않기!

#### 2단계: 올바른 URL로 origin 설정

저장소 생성 후 나오는 URL을 사용:

```bash
cd "/Users/lukas/Desktop/Premium Care Admin"

# 기존 origin 제거 (이미 완료됨)
git remote remove origin

# 올바른 URL로 추가 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/premium-care-admin.git

# 확인
git remote -v

# 업로드
git push -u origin main
```

### 방법 2: 저장소 URL 확인

만약 이미 저장소가 있다면:

```bash
# 현재 설정된 origin 확인
git remote -v

# 올바른 URL로 변경
git remote set-url origin https://github.com/실제사용자명/실제저장소명.git

# 확인
git remote -v

# 업로드
git push -u origin main
```

## 단계별 해결

### 1. 기존 origin 제거 (완료됨)
```bash
git remote remove origin
```

### 2. GitHub 저장소 생성 확인
- [ ] GitHub에 로그인되어 있는지 확인
- [ ] 새 저장소 생성 완료했는지 확인
- [ ] 저장소 이름 확인

### 3. 올바른 URL로 origin 추가

**저장소 URL 형식:**
```
https://github.com/[사용자명]/[저장소명].git
```

**예시:**
```
https://github.com/johndoe/premium-care-admin.git
```

### 4. 업로드

```bash
git push -u origin main
```

## 문제 해결 체크리스트

- [ ] GitHub에 로그인되어 있나요?
- [ ] 저장소를 생성했나요?
- [ ] 저장소 이름이 정확한가요?
- [ ] 사용자명이 정확한가요?
- [ ] origin이 제거되었나요?
- [ ] 올바른 URL로 다시 추가했나요?

## 다음 단계

origin 설정이 완료되면:
1. `git push -u origin main` 실행
2. GitHub에서 코드 확인
3. Vercel 배포 진행

