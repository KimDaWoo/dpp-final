# GEMINI 기술 인수인계 문서 (v3 - 최종)

**문서 목적**: 이 문서는 다른 Gemini AI 에이전트가 프로젝트의 기술적 맥락, 설계 결정, 개발 과정을 완벽하게 이해하고 작업을 원활하게 이어받을 수 있도록 작성되었습니다.

---

## 1. 프로젝트 개요

**"사전 거래 분석 및 투자 성향 관리 도구"**는 사용자의 투자 성향에 맞춰 체계적이고 원칙에 기반한 트레이딩을 돕는 개인화된 웹 애플리케이션입니다.

- **핵심 기능**:
  - **투자 성향 분석 및 수정**: 첫 로그인 시 퀴즈를 통해 사용자 성향(보수적/공격적)을 분석하고, 마이페이지에서 언제든지 재분석 가능.
  - **전역 통화 변환 (USD/KRW)**: React Context API를 사용하여 앱 내 모든 금액 표시를 실시간으로 변환.
  - **개인화된 기업 분석**: 저장된 성향과 현재 통화에 맞춰 동적으로 기준이 변경되는 기업 분석 체크리스트 제공.
  - **관심 종목(Watchlist)**: 관심 종목을 `localStorage`에 저장하고 대시보드에서 모아보기.
  - **매매 복기 노트**: 모든 매매 내역을 `localStorage`에 기록하고 개별 삭제 기능이 포함된 표로 관리.
  - **하이브리드 API 데이터 조회**: Yahoo Finance, Polygon.io, Frankfurter의 장점을 결합하여 안정적인 데이터 조회.
  - **마이페이지**: 사용자 정보, 투자 성향 확인, 로그아웃 기능.

- **주요 기술 스택**: Next.js (App Router/Turbopack), TypeScript, Tailwind CSS, shadcn/ui, Recharts.
- **주요 라이브러리**: NextAuth.js v5, Zod/React Hook Form, Lucide React.

---

## 2. 핵심 아키텍처 및 설계 결정

### 가. 하이브리드 외부 API 연동 (최종)
초기 단일 API 사용 전략의 실패 이후, 각 기능에 가장 적합한 무료 API를 선별하여 결합하는 **하이브리드 전략**을 최종 채택했습니다.

- **종목 검색**: **Yahoo Finance (Autocomplete API)** - 호출 제한이 넉넉하고 빠름.
- **종목 상세 정보**: **Polygon.io (Ticker Details API)** - 공식 API로 서버 간 호출에 안정적.
- **주가 차트 데이터**: **Yahoo Finance (Chart API)** - 비공식적 사용에도 비교적 안정적.
- **실시간 환율**: **Frankfurter API** - 별도 키 없이 사용 가능한 안정적인 무료 환율 API.

### 나. 전역 상태 관리 (통화 변환)
- **React Context API (`CurrencyProvider`)**: 앱 전체에서 통화 설정(USD/KRW)과 환율 정보를 공유하기 위해 Context를 생성했습니다. 이 Provider는 최상위 레이아웃(`layout.tsx`)에 적용되어 모든 하위 컴포넌트에서 `useCurrency` 훅을 통해 접근할 수 있습니다.
- **상태 유지**: 사용자의 통화 선택은 `localStorage`에 저장하여 앱을 다시 방문해도 유지되도록 했습니다.

### 다. 사용자 개인화 및 클라이언트 상태 관리
- **`localStorage` 활용**: DB 없이 개인화된 경험을 제공하기 위해 `localStorage`를 핵심 저장소로 사용합니다.
  - `investmentType`: 사용자 투자 성향.
  - `watchlist`: 관심 종목 심볼 배열.
  - `journalEntries`: 매매 복기 기록 객체 배열.
  - `currency`: 사용자가 선택한 통화 (USD/KRW).

### 라. 라우팅 및 레이아웃
- **라우트 그룹**: 퀴즈 페이지(`(full)/quiz`)는 사이드바가 없는 독립적인 경험을 제공하기 위해 `(full)` 라우트 그룹으로 분리하여 별도의 레이아웃을 적용했습니다.

---

## 3. 기능별 핵심 파일 경로

- **전역 상태 및 개인화**:
  - 통화 컨텍스트: `src/contexts/currency-context.tsx`
  - 첫 로그인 리디렉션: `src/app/(app)/dashboard/page.tsx`
  - 투자 성향 분석 퀴즈: `src/app/(full)/quiz/page.tsx`
  - 마이페이지: `src/app/(app)/mypage/page.tsx`
- **기업 분석**:
  - 종목 검색 UI: `src/components/trades/stock-search.tsx`
  - 개인화된 체크리스트: `src/components/checklist/stock-analysis.tsx`
  - 주가 차트: `src/components/trades/stock-chart.tsx`
- **백엔드 API 라우트**:
  - 종목 검색: `src/app/api/stock/search/[query]/route.ts`
  - 종목 상세: `src/app/api/stock/[symbol]/route.ts`
  - 차트 데이터: `src/app/api/stock/chart/[symbol]/route.ts`
  - 환율: `src/app/api/exchange-rate/route.ts`
- **매매 복기**:
  - 페이지 및 폼/테이블: `src/app/(app)/mistakes/page.tsx`

---

## 4. 개발 이력 및 문제 해결 (Troubleshooting History)

- **문제 1: 수많은 외부 API 제한 문제 (가장 중요)**
  - **현상**: Alpha Vantage, FMP, Yahoo Finance 상세 정보 등 사용하는 모든 API에서 지속적으로 데이터 조회 실패 발생.
  - **최종 해결책**: 각 기능의 특성에 맞춰 가장 적합한 API를 선별하는 **하이브리드 아키텍처**를 채택하여 안정성을 확보함. (상세 내용은 2-가 항 참조)

- **문제 2: `JWTSessionError: no matching decryption secret`**
  - **현상**: `AUTH_SECRET`을 실수로 삭제한 후, 서버를 재시작하고 복원해도 인증 오류가 지속 발생.
  - **원인**: Next.js 캐시(`.next`)와 브라우저 쿠키에 손상된 세션 정보가 남아있었기 때문.
  - **최종 해결책**: ① `.next` 폴더 삭제, ② 브라우저 쿠키 수동 삭제, ③ `auth.ts`에 `secret` 옵션 명시적 추가 후 서버 재시작으로 모든 캐시를 초기화하여 해결.

- **문제 3: Recharts 차트의 선이 그려지지 않는 현상**
  - **현상**: Y축과 점은 표시되나, 선(Line)이 그려지지 않음.
  - **최종 해결책**: 백엔드 API에서 데이터를 프론트로 보내기 전, `typeof price === 'number' && isFinite(price)` 조건을 사용하여 **데이터 배열에서 유효한 숫자가 아닌 모든 값을 원천적으로 제거**하는 강력한 정제 로직을 추가하여 해결.

- **문제 4: 로그아웃 및 자동 로그인 실패**
  - **현상**: 로그아웃 버튼이 작동하지 않고, 자동 로그인이 간헐적으로 실패.
  - **원인**: 서버 액션을 통한 로그아웃의 불안정성 및 손상된 세션 쿠키.
  - **최종 해결책**: `next-auth/react`의 클라이언트 사이드 `signOut` 함수를 사용하도록 변경하고, 브라우저 쿠키를 삭제하여 세션을 초기화함으로써 해결.

- **문제 5: JSX 구문 오류 (`mistakes/page.tsx`)**
  - **현상**: 빌드 시 `Parsing ecmascript source code failed` 오류 발생.
  - **원인**: `FormField` 내부에 `</FormMessage>` 닫는 태그가 중복으로 사용됨.
  - **해결책**: 중복된 태그를 제거하여 JSX 구문을 수정.

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
