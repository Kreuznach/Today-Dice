# 🎲 Today Dice

> **"오늘의 운을 10초 만에 확인하는 1일 1회 AI 주사위 대결"**

하루 한 번, AI 상대방과 주사위를 굴려 오늘의 운을 확인하세요.  
경품도, 포인트도 없습니다. 오직 **연승 기록**과 **재미**가 전부입니다.

## 주요 기능

- **1일 1회 플레이** — 하루에 한 번만 주사위 대결 가능
- **연승 기록** — 연속으로 이긴 기록을 추적하고 뱃지로 표시
- **재대결** — 결과가 아쉬울 때 광고 시청 후 한 번 더 도전
- **랭킹** — 연승 TOP5 리더보드 확인

## 기술 스택

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: [Supabase](https://supabase.com) (PostgreSQL + Auth + Edge Functions)

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/Kreuznach/Today-Dice.git
cd Today-Dice
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 Supabase 프로젝트 정보를 입력합니다:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_ENV=development
TZ=Asia/Seoul
NEXT_PUBLIC_AIT_AD_ID=ait.v2.live.544f01132f2a43ec
```

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

## 프로젝트 구조

```
app/                  # Next.js App Router 페이지 및 API Routes
  api/                # 서버 API 엔드포인트
components/           # 공통 UI 컴포넌트
features/             # 기능별 컴포넌트 / 훅
lib/                  # 유틸리티 및 Supabase 클라이언트
supabase/             # DB 마이그레이션 및 Edge Functions
types/                # TypeScript 타입 정의
docs/                 # 기획서 및 기술 설계 문서
```

## 데이터베이스 설정

`supabase/migrations/` 폴더의 SQL 파일을 Supabase 프로젝트에 순서대로 실행합니다.
