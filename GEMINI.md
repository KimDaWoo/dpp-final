# GEMINI 기술 인수인계 문서

**문서 목적**: 이 문서는 다른 Gemini AI 에이전트가 프로젝트의 기술적 맥락, 설계 결정, 개발 과정을 완벽하게 이해하고 작업을 원활하게 이어받을 수 있도록 작성되었습니다.

---

## 1. 프로젝트 개요

**"사전 거래 분석 및 관리 도구"**는 트레이더가 감정적 매매를 배제하고 원칙에 기반한 트레이딩을 할 수 있도록 돕는 웹 애플리케이션입니다.

- **핵심 기능**: 사전 거래 리스크 분석, 주식 종목 분석, 거래 기록 및 실수 분석(오답노트).
- **주요 기술 스택**: Next.js 16+ (App Router, Turbopack), TypeScript, Tailwind CSS, shadcn/ui.
- **주요 라이브러리**: NextAuth.js v5 (인증), Zod/React Hook Form (폼 유효성 검사), PapaParse (CSV 파싱), Lucide React (아이콘).

---

## 2. 프로젝트 설정 및 주요 의존성

### 가. 초기 설정
- **shadcn/ui 초기화**: `pnpm dlx shadcn@latest init`
- **shadcn/ui 컴포넌트 추가**: 아래 컴포넌트들이 `pnpm dlx shadcn@latest add [component]` 명령어를 통해 추가되었습니다.
  - `button`, `card`, `form`, `input`, `label`, `select`, `switch`, `sonner`, `table`, `slider`, `tabs`, `badge`, `tooltip`, `separator`, `menubar`, `dropdown-menu`, `sheet`, `avatar`, `textarea`, `popover`, `command`, `dialog`

### 나. 주요 라이브러리 및 사용 목적
- `next-auth@5.0.0-beta.30`: GitHub OAuth 인증 및 세션 관리를 위해 사용.
- `papaparse`: Alpha Vantage의 종목 리스트 API가 CSV로 응답하므로, 이를 JSON으로 변환하기 위해 서버 측에서 사용.
- `lucide-react`: `shadcn/ui` 컴포넌트 내 아이콘 표시를 위해 사용.

---

## 3. 핵심 아키텍처 및 설계 결정

### 가. 인증 흐름 (NextAuth.js v5)
- **중앙 집중식 인증 로직**: 모든 인증/인가 규칙은 **`src/auth.ts`** 파일의 `callbacks.authorized` 객체 내에서 중앙 관리됩니다.
- **미들웨어 역할**: **`middleware.ts`**는 `auth.ts`에서 정의된 인증 로직을 가져와 모든 경로(`matcher`)에 적용하는 단순한 실행기(runner) 역할을 합니다. 이 구조는 로직 변경 시 `auth.ts`만 수정하면 되므로 유지보수성을 높입니다.
- **서버 액션 분리**: 클라이언트 컴포넌트(`user-menu.tsx`) 내에서 "use server"를 직접 사용하는 것이 최신 Next.js 정책에 위배되어, 로그인/아웃 로직을 **`src/lib/actions.ts`** 파일로 분리하고 컴포넌트에서는 이 함수들을 `action`으로 참조합니다.

### 나. 외부 API 연동 (Alpha Vantage)
- **API 키 보안**: 프론트엔드에서 Alpha Vantage API를 직접 호출하지 않고, Next.js의 **API 라우트 (`src/app/api/...`)**를 중개자로 사용합니다. 이를 통해 `ALPHA_VANTAGE_API_KEY`를 서버 측 환경 변수로 안전하게 숨기고, 클라이언트에는 노출시키지 않습니다.
- **서버 측 캐싱**: 전체 종목 리스트 API(`api/stock/list`)는 호출 비용이 높고 데이터 변경 주기가 길기 때문에, 간단한 **인메모리 변수 캐싱**을 구현하여 24시간 동안 동일한 데이터를 재사용하도록 최적화했습니다.

---

## 4. 기능별 핵심 파일 경로

- **인증**:
  - 설정 및 콜백: `src/auth.ts`
  - 미들웨어: `middleware.ts`
  - 서버 액션: `src/lib/actions.ts`
  - UI 컴포넌트: `src/components/layout/user-menu.tsx`
- **사전 거래 체크리스트**:
  - 페이지: `src/app/(app)/checklist/page.tsx`
  - 폼 로직: `src/components/checklist/checklist-form.tsx`
  - Zod 스키마: `src/lib/schemas.ts`
- **주식 분석**:
  - 페이지: `src/app/(app)/trades/page.tsx`
  - UI 컴포넌트: `src/components/trades/stock-search.tsx`
  - 종목 상세 정보 API: `src/app/api/stock/[symbol]/route.ts`
  - 전체 종목 리스트 API: `src/app/api/stock/list/route.ts`

---

## 5. 개발 이력 및 문제 해결 (Troubleshooting History)

**이 섹션은 미래의 AI가 동일한 문제에 직면했을 때의 디버깅 시간을 단축시키기 위해 매우 중요합니다.**

- **문제 1: API 라우트의 동적 파라미터 `params` 오류**
  - **현상**: `GET /api/stock/[symbol]` 호출 시 `params is a Promise and must be unwrapped with await` 오류가 지속적으로 발생.
  - **시도**: 함수 시그니처를 `context: { params }` 등 여러 방식으로 변경했으나 실패.
  - **최종 해결책**: 오류 메시지를 문자 그대로 따라, `params` 객체를 `await` 키워드로 풀어준 후에 속성에 접근하는 방식으로 해결. 이는 일반적이지 않으나, 이 프로젝트의 Next.js/Turbopack 환경에서는 유효한 해결책임.
    ```typescript
    // src/app/api/stock/[symbol]/route.ts
    export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
      const awaitedParams = await params; // <--- This was the key fix
      const symbol = awaitedParams.symbol;
      // ...
    }
    ```

- **문제 2: 로그인 후 리디렉션 불안정**
  - **현상**: 로그인 후 `/` 경로로 재접속 시 `/dashboard`로 이동하지 않음.
  - **시도**: 초기에는 `middleware.ts`에서 직접 리디렉션 로직을 처리하려 했으나 불안정.
  - **최종 해결책**: NextAuth.js v5의 표준 패턴인 `auth.ts`의 `callbacks.authorized` 내에서 모든 라우팅 규칙(보호/리디렉션)을 정의하는 방식으로 안정성을 확보함.

- **문제 3: 파일 누락 및 캐시 문제**
  - **현상**: 분명히 코드를 수정한 것 같은데, 브라우저에 이전 버전의 UI가 계속 표시됨 (예: `trades` 페이지에 검색창이 없음).
  - **원인**: 이전 `write_file` 작업이 누락되었거나, Next.js 개발 서버의 캐시가 변경사항을 반영하지 못함.
  - **해결책**: `read_file`로 파일의 실제 내용을 확인하여 누락된 파일을 재생성하고, `rm -r .next` 명령어로 캐시를 완전히 삭제한 후 서버를 재시작하여 해결.

---

## 6. 필수 환경 변수 (`.env.local`)

```
# GitHub OAuth App credentials
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...

# Secret for signing NextAuth.js tokens (generate with `openssl rand -base64 32`)
AUTH_SECRET=...

# API Key for Alpha Vantage
ALPHA_VANTAGE_API_KEY=...
```