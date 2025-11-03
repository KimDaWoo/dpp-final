# 사전 거래 분석 및 리스크 관리 도구

이 프로젝트는 체계적이고 원칙에 기반한 트레이딩을 돕기 위해 개발된 웹 애플리케이션입니다. 사용자가 매매에 진입하기 전 스스로 정한 원칙을 지키도록 강제하고, 매매가 끝난 후에는 자신의 실수를 분석하여 성장할 수 있도록 돕는 것을 핵심 목표로 삼고 있습니다.

Gemini AI 에이전트와의 협업을 통해 개발되었습니다.

## ✨ 주요 기능

- **사전 거래 체크리스트**: 거래 진입 전 리스크(예상 손실률)를 계산하고, 설정된 기준을 초과하면 경고하여 충동적인 매매를 방지합니다.
- **주식 종목 분석**: 전체 주식 종목 리스트에서 원하는 종목을 검색하고, Alpha Vantage API를 통해 해당 종목의 상세 정보(회사 개요, 시가총액, PER 등)를 실시간으로 조회할 수 있습니다.
- **사용자 인증**: GitHub OAuth를 이용한 안전한 로그인을 지원하며, 사용자별로 개인화된 환경을 제공합니다.
- **자동 리디렉션**: 로그인한 사용자는 사이트 재방문 시 즉시 대시보드로 이동하여 편리하게 서비스를 이용할 수 있습니다.

## 🛠️ 기술 스택

- **프레임워크**: Next.js (App Router with Turbopack)
- **언어**: TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **인증**: NextAuth.js v5
- **폼 관리**: Zod, React Hook Form
- **데이터**: Alpha Vantage (실시간 금융 데이터)
- **아이콘**: Lucide React

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

# Alpha Vantage API Key
# https://www.alphavantage.co/support/#api-key 에서 무료로 발급받을 수 있습니다.
ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_API_KEY
```

### 4. 개발 서버 실행

```bash
pnpm dev
```

이제 브라우저에서 `http://localhost:3000` 주소로 접속하여 애플리케이션을 확인할 수 있습니다.