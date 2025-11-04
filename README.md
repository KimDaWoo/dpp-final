# 사전 거래 분석 및 투자 성향 관리 도구

이 프로젝트는 사용자가 자신의 투자 성향에 맞춰 체계적이고 원칙에 기반한 트레이딩을 할 수 있도록 돕는 개인화된 웹 애플리케이션입니다. Gemini AI 에이전트와의 협업을 통해 개발되었습니다.

**핵심 목표:** 사용자가 자신의 투자 성향을 객관적으로 파악하고, 그에 맞는 기준으로 종목을 분석하며, 모든 매매를 기록하여 성장할 수 있는 통합 환경을 제공하는 것입니다.

## ✨ 주요 기능

- **투자 성향 분석**: 사용자는 첫 로그인 시 간단한 퀴즈를 통해 자신의 투자 성향(보수적/공격적)을 분석받습니다. 이 결과는 앱 전반에 걸쳐 개인화된 경험을 제공하는 기준이 됩니다.
- **개인화된 기업 분석 체크리스트**: 종목 분석 시, 사용자의 투자 성향에 맞춰 동적으로 생성된 체크리스트를 제공합니다. (예: 보수적 투자자는 '시가총액 > 100억 달러' 기준, 공격적 투자자는 '업종이 기술주인가?' 기준 등)
- **관심 종목(Watchlist) 대시보드**: 관심 있는 종목을 저장하고 대시보드에서 모아볼 수 있습니다. 저장된 종목은 클릭 한 번으로 바로 분석 페이지로 이동할 수 있습니다.
- **매매 복기 노트 (Trading Journal)**: 모든 매매의 상세 내역(종목, 매수/매도가, 수량)과 자신의 생각(매매 근거, 잘한 점, 아쉬운 점)을 기록하고 표로 관리할 수 있습니다. 삭제 기능도 지원됩니다.
- **하이브리드 API를 이용한 데이터 조회**: 안정적인 종목 검색(Yahoo Finance)과 상세 정보(Polygon.io), 차트(Yahoo Finance) 조회를 위해 여러 API의 장점만을 결합하여 사용합니다.
- **마이페이지**: GitHub 계정 정보와 분석된 투자 성향을 확인하고, 안전하게 로그아웃할 수 있습니다.

## 🛠️ 기술 스택

- **프레임워크**: Next.js (App Router with Turback)
- **언어**: TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Recharts (차트)
- **인증**: NextAuth.js v5
- **폼 관리**: Zod, React Hook Form
- **데이터**: **Yahoo Finance** (검색, 차트), **Polygon.io** (상세 정보)
- **상태 관리**: React Hooks, `localStorage` (성향, 관심 종목, 매매 기록)

## 🚀 로컬 환경에서 실행하기

### 1. 저장소 복제 (Clone)

```bash
git clone https://github.com/KimDaWoo/dpp-final.git
cd dpp-final
```

### 2. 의존성 설치

이 프로젝트는 `pnpm`을 사용합니다. `pnpm`이 설치되어 있지 않다면 먼저 설치해주세요 (`npm install -g pnpm`).

```bash
pnpm install
```

### 3. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고, 아래 내용을 복사하여 붙여넣으세요. 각 변수에 해당하는 실제 값을 입력해야 합니다.

```
# GitHub OAuth App credentials
# GitHub > Settings > Developer settings > OAuth Apps 에서 발급받을 수 있습니다.
AUTH_GITHUB_ID=YOUR_GITHUB_CLIENT_ID
AUTH_GITHUB_SECRET=YOUR_GITHUB_CLIENT_SECRET

# NextAuth.js 세션 암호화를 위한 비밀 키
# 터미널에서 `openssl rand -base64 32` 또는 `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` 명령어로 생성할 수 있습니다.
AUTH_SECRET=YOUR_GENERATED_SECRET

# Polygon.io API Key
# https://polygon.io/ 에서 무료로 발급받을 수 있습니다. (종목 상세 정보 조회용)
POLYGON_API_KEY=YOUR_POLYGON_API_KEY
```

### 4. 개발 서버 실행

```bash
pnpm dev
```

이제 브라우저에서 `http://localhost:3000` 주소로 접속하여 애플리케이션을 확인할 수 있습니다. 첫 로그인 시 투자 성향 분석 퀴즈를 진행하게 됩니다.