# GEMINI 기술 인수인계 문서 (v2)

**문서 목적**: 이 문서는 다른 Gemini AI 에이전트가 프로젝트의 기술적 맥락, 설계 결정, 개발 과정을 완벽하게 이해하고 작업을 원활하게 이어받을 수 있도록 작성되었습니다.

---

## 1. 프로젝트 개요

**"사전 거래 분석 및 투자 성향 관리 도구"**는 사용자가 자신의 투자 성향에 맞춰 체계적이고 원칙에 기반한 트레이딩을 할 수 있도록 돕는 개인화된 웹 애플리케이션입니다.

- **핵심 기능**:
  - **투자 성향 분석**: 첫 로그인 시 퀴즈를 통해 사용자 성향(보수적/공격적)을 분석하고 `localStorage`에 저장.
  - **개인화된 기업 분석**: 저장된 성향에 따라 동적으로 기준이 변경되는 기업 분석 체크리스트 제공.
  - **관심 종목(Watchlist)**: 관심 종목을 `localStorage`에 저장하고 대시보드에서 모아보기.
  - **매매 복기 노트**: 모든 매매 내역을 `localStorage`에 기록하고 표로 관리.
  - **하이브리드 API 데이터 조회**: Yahoo Finance와 Polygon.io의 장점을 결합하여 안정적인 데이터 조회.
  - **마이페이지**: 사용자 정보 및 투자 성향 확인, 로그아웃 기능.

- **주요 기술 스택**: Next.js (App Router/Turbopack), TypeScript, Tailwind CSS, shadcn/ui, Recharts.
- **주요 라이브러리**: NextAuth.js v5, Zod/React Hook Form, Lucide React.

---

## 2. 핵심 아키텍처 및 설계 결정

### 가. 하이브리드 외부 API 연동 (최종)
프로젝트 초기에는 단일 API(Alpha Vantage, FMP)를 사용하려 했으나, 무료 플랜의 엄격한 제한(호출 횟수, 레거시 엔드포인트, 봇 차단)으로 인해 심각한 불안정성을 겪었습니다. 이를 해결하기 위해 각 기능에 가장 적합한 무료 API를 선별하여 결합하는 **하이브리드 전략**을 최종 채택했습니다.

- **종목 검색 (`/api/stock/search/[query]`)**: **Yahoo Finance (Autocomplete API)**
  - **선택 이유**: 호출 제한이 넉넉하고 검색 속도가 빨라 사용자 경험에 가장 유리합니다.
- **종목 상세 정보 (`/api/stock/[symbol]`)**: **Polygon.io (Ticker Details API)**
  - **선택 이유**: 공식 API이므로 서버 간 호출에도 차단되지 않아 매우 안정적입니다. PER, EPS 등 상세 재무 지표는 제공하지 않지만, 핵심 정보(회사 개요, 시가총액, 업종)를 안정적으로 얻는 것이 더 중요하다고 판단했습니다.
- **주가 차트 데이터 (`/api/stock/chart/[symbol]`)**: **Yahoo Finance (Chart API)**
  - **선택 이유**: 상세 정보 API와 달리, 차트 API는 비공식적 사용에도 비교적 관대하여 안정적으로 작동하며, 풍부한 과거 시세 데이터를 제공합니다.

### 나. 사용자 개인화 및 상태 관리
별도의 데이터베이스 없이 사용자 경험을 개인화하기 위해 **`localStorage`**를 핵심 저장소로 활용합니다.

- **투자 성향 (`investmentType`)**: 첫 로그인 시 `/quiz` 페이지로 강제 리디렉션하여 성향 분석을 유도합니다. 분석 결과('conservative'/'aggressive')는 `localStorage`에 저장되어, 이후 `/checklist` 페이지 등에서 이 값을 읽어 개인화된 UI와 로직을 제공합니다.
- **관심 종목 (`watchlist`)**: 사용자가 종목 상세 모달에서 별 버튼을 클릭하면, 종목 심볼이 `localStorage`의 배열에 추가/제거됩니다. 대시보드는 이 배열을 읽어 관심 종목 목록을 동적으로 표시합니다.
- **매매 복기 기록 (`journalEntries`)**: `/mistakes` 페이지에서 작성된 매매 기록 객체들이 `localStorage`의 배열에 저장되고, 테이블 형태로 렌더링됩니다.

### 다. 라우팅 및 레이아웃
- **라우트 그룹 활용**: 투자 성향 분석 퀴즈 페이지(`(full)/quiz`)는 사이드바와 헤더가 없는 독립적인 경험을 제공하기 위해 `(full)` 라우트 그룹으로 분리하여 별도의 레이아웃을 적용했습니다. 나머지 모든 페이지는 `(app)` 그룹에 속하여 공통 레이아웃(사이드바, 헤더)을 공유합니다.

---

## 3. 기능별 핵심 파일 경로

- **인증 및 개인화**:
  - 첫 로그인 리디렉션: `src/app/(app)/dashboard/page.tsx`
  - 투자 성향 분석 퀴즈: `src/app/(full)/quiz/page.tsx`
  - 마이페이지: `src/app/(app)/mypage/page.tsx`
- **기업 분석**:
  - 종목 검색 UI: `src/components/trades/stock-search.tsx`
  - 개인화된 체크리스트: `src/components/checklist/stock-analysis.tsx`
  - 주가 차트: `src/components/trades/stock-chart.tsx`
- **백엔드 API 라우트**:
  - 종목 검색: `src/app/api/stock/search/[query]/route.ts` (Yahoo)
  - 종목 상세: `src/app/api/stock/[symbol]/route.ts` (Polygon)
  - 차트 데이터: `src/app/api/stock/chart/[symbol]/route.ts` (Yahoo)
- **매매 복기**:
  - 페이지 및 폼/테이블: `src/app/(app)/mistakes/page.tsx`

---

## 4. 개발 이력 및 문제 해결 (Troubleshooting History)

**이 섹션은 미래의 AI가 동일한 문제에 직면했을 때의 디버깅 시간을 단축시키기 위해 매우 중요합니다.**

- **문제 1: 수많은 외부 API 제한 문제 (가장 중요)**
  - **현상**: Alpha Vantage(호출 횟수 초과), FMP(레거시 엔드포인트), Yahoo Finance 상세 정보(봇 차단) 등 사용하는 모든 API에서 지속적으로 데이터 조회 실패 발생.
  - **시도**: API를 계속해서 교체했으나, 단일 무료 API로는 모든 기능(빠른 검색, 안정적인 상세 정보, 차트)을 만족시킬 수 없었음.
  - **최종 해결책**: 각 기능의 특성에 맞춰 가장 적합한 API를 선별하는 **하이브리드 아키텍처**를 채택하여 안정성을 확보함. (상세 내용은 2-가 항 참조)

- **문제 2: `JWTSessionError: no matching decryption secret`**
  - **현상**: API 키를 정리하는 과정에서 `AUTH_SECRET`을 실수로 삭제한 후, 서버를 재시작하고 `.env.local` 파일을 복원해도 인증 오류가 지속적으로 발생.
  - **원인**: Next.js 개발 서버 캐시(`.next` 폴더)와 브라우저에 저장된 쿠키가 `AUTH_SECRET`이 없던 시절의 손상된 세션 정보를 계속 사용하고 있었기 때문.
  - **최종 해결책**: ① `.next` 폴더 완전 삭제, ② 브라우저 개발자 도구에서 관련 쿠키 수동 삭제, ③ `auth.ts`에 `secret` 옵션 명시적 추가 후 서버를 재시작하여 모든 캐시를 초기화함으로써 해결.

- **문제 3: Recharts 차트의 선이 그려지지 않는 현상**
  - **현상**: Y축과 점은 표시되나, 선(Line)이 그려지지 않음.
  - **시도**: `connectNulls` 속성 추가, 데이터 형식(string -> number) 변경 등을 시도했으나 실패.
  - **최종 해결책**: 백엔드 API(`api/stock/chart`)에서 데이터를 프론트로 보내기 전, `typeof price === 'number' && isFinite(price)` 조건을 사용하여 **데이터 배열에서 유효한 숫자가 아닌 모든 값을 원천적으로 제거**하는 강력한 정제 로직을 추가하여 해결. Recharts는 유효하지 않은 값이 하나라도 있으면 선 전체를 그리지 않음.

- **문제 4: API 라우트의 동적 파라미터 `params` 오류**
  - **현상**: `GET /api/.../[symbol]` 호출 시 `params is a Promise` 오류 발생.
  - **해결책**: `GEMINI.md` v1에 기록된 대로, `const awaitedParams = await params;` 코드를 추가하여 해결.

---

## 5. 필수 환경 변수 (`.env.local`)

```
# GitHub OAuth App credentials
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...

# Secret for signing NextAuth.js tokens
AUTH_SECRET=...

# API Key for Polygon.io (for stable stock detail fetching)
POLYGON_API_KEY=...
```