# 사전 거래 분석 및 투자 성향 관리 도구

이 프로젝트는 사용자가 자신의 투자 성향에 맞춰 체계적이고 원칙에 기반한 트레이딩을 할 수 있도록 돕는 개인화된 웹 애플리케이션입니다.

**핵심 목표:** 사용자가 자신의 투자 성향을 객관적으로 파악하고, 그에 맞는 기준으로 종목을 분석하며, 모든 매매를 기록하여 성장할 수 있는 통합 환경을 제공하는 것입니다.

![스크린샷](ss_01.png)

## ✨ 주요 기능

- **투자 성향 분석**: 첫 로그인 시 간단한 퀴즈를 통해 자신의 투자 성향(보수적/공격적)을 분석받습니다. 이 결과는 앱 전반에 걸쳐 개인화된 경험을 제공하는 기준이 됩니다.
- **글로벌 통화 변환**: 상단 메뉴의 토글 스위치를 통해 앱 내 모든 금액 표시(시가총액, 주가 차트 등)를 USD와 KRW로 실시간 변환할 수 있습니다.
- **개인화된 기업 분석 체크리스트**: 사용자의 투자 성향과 현재 설정된 통화에 맞춰 동적으로 생성된 체크리스트를 제공합니다.
- **관심 종목(Watchlist) 대시보드**: 관심 있는 종목을 저장하고 대시보드에서 모아볼 수 있습니다.
- **매매 복기 노트 (Trading Journal)**: 모든 매매의 상세 내역과 자신의 생각을 기록하고 표로 관리할 수 있으며, 개별 기록 삭제도 가능합니다.
- **주가 차트 시각화**: 종목 상세 정보 모달에서 지난 1년간의 주가 추이를 직관적인 차트로 확인할 수 있습니다.
- **마이페이지**: GitHub 계정 정보와 분석된 투자 성향을 확인하고, 성향 분석을 다시 하거나 안전하게 로그아웃할 수 있습니다.
- **하이브리드 API**: 안정적인 데이터 조회를 위해 각 기능에 최적화된 무료 API(Yahoo Finance, Polygon.io, Frankfurter)를 선별하여 결합했습니다.

## 🛠️ 기술 스택

- **프레임워크**: Next.js (App Router with Turbopack)
- **언어**: TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Recharts (차트)
- **인증**: NextAuth.js v5
- **폼 관리**: Zod, React Hook Form
- **데이터**: Yahoo Finance, Polygon.io, Frankfurter API
- **전역 상태 관리**: React Context API
- **클라이언트 상태**: `localStorage` (성향, 관심 종목, 매매 기록, 통화 설정)

## 🚀 로컬 환경에서 실행하기

### 1. 저장소 복제 (Clone)

```bash
git clone https://github.com/KimDaWoo/dpp-final.git
cd dpp-final
```

### 2. 의존성 설치

이 프로젝트는 `pnpm`을 사용합니다.

```bash
pnpm install
```

### 3. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고, 아래 내용을 복사하여 붙여넣으세요.

```
# GitHub OAuth App credentials
AUTH_GITHUB_ID=YOUR_GITHUB_CLIENT_ID
AUTH_GITHUB_SECRET=YOUR_GITHUB_CLIENT_SECRET

# NextAuth.js 세션 암호화를 위한 비밀 키
# 터미널에서 `openssl rand -base64 32` 명령어로 생성할 수 있습니다.
AUTH_SECRET=YOUR_GENERATED_SECRET

# Polygon.io API Key (종목 상세 정보 조회용)
# https://polygon.io/ 에서 무료로 발급받을 수 있습니다.
POLYGON_API_KEY=YOUR_POLYGON_API_KEY
```

### 4. 개발 서버 실행

```bash
pnpm dev
```

이제 브라우저에서 `http://localhost:3000` 주소로 접속하여 애플리케이션을 확인할 수 있습니다. 첫 로그인 시 투자 성향 분석 퀴즈를 진행하게 됩니다.
