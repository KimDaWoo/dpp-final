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

### 마. 펀더멘털 데이터 처리 (요청 시 캐싱)
- **문제**: 개인화된 기업 분석을 위해 필요한 펀더멘털 데이터(부채비율, 매출 성장률 등)를 매번 외부 API로 호출하는 것은 비효율적이고 API 제한에 쉽게 도달하는 문제가 있었습니다.
- **해결책**: **'요청 시 캐싱(On-demand Caching)'** 전략을 도입했습니다.
  1. **캐시 확인**: 사용자가 종목 분석을 요청하면, 백엔드 API는 먼저 로컬 `stock-fundamentals.json` 파일을 확인합니다.
  2. **캐시 미스 시 API 호출**: 파일에 해당 종목 데이터가 없으면, 그때 단 한 번만 Alpha Vantage API를 호출하여 전체 펀더멘털 데이터를 가져옵니다.
  3. **캐시 저장 및 반환**: 가져온 데이터는 `stock-fundamentals.json` 파일에 즉시 추가 저장되며, 사용자에게 반환됩니다.
  4. **캐시 히트**: 이후 동일한 종목 요청 시에는 API 호출 없이 파일에서 직접 데이터를 읽어 즉시 반환합니다.
- **기대 효과**: 이 아키텍처를 통해 API 호출을 최소화하고, 사용자가 조회하는 종목이 늘어남에 따라 시스템이 자동으로 확장되며, 최초 조회 이후에는 매우 빠른 응답 속도를 보장합니다.

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

- **문제 6: 개인화 체크리스트 기능 고도화**
  - **현상**: 기존 체크리스트가 시가총액, 업종 등 단순한 기준으로만 분석을 제공함.
  - **원인**: 프로젝트 초기 버전으로, 다양한 재무/기술 지표가 반영되지 않음.
  - **최종 해결책**: `class-paper` 폴더의 PDF 분석을 통해 투자 성향별 핵심 지표(PER, Beta, 배당수익률, 부채비율, 매출 성장률 등)를 도출하고, 이를 `stock-analysis.tsx` 컴포넌트에 반영하여 다각적인 분석이 가능하도록 기능을 대폭 확장함.

- **문제 7: 로그인 후 초기 화면에 머무는 현상**
  - **현상**: 이미 로그인한 사용자가 초기 퍼블릭 페이지(`/`)에 접속해도 아무런 변화가 없어 서비스 이용을 위해 수동으로 페이지를 이동해야 했음.
  - **원인**: `src/app/page.tsx`에 로그인 상태를 확인하고 리디렉션하는 로직이 부재했음.
  - **최종 해결책**: `page.tsx`에서 `auth()`를 통해 세션 존재 여부를 확인하고, 세션이 있을 경우 Next.js의 `redirect` 함수를 사용해 `/dashboard`로 즉시 이동시키는 로직을 추가하여 사용자 경험을 개선함.

- **문제 8: API 라우트 `params` 접근 오류**
  - **현상**: `GET /api/stock/[symbol]` 요청 시 `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` 오류가 발생하며 서버가 비정상 종료됨.
  - **원인**: Next.js App Router의 특정 동작 방식으로 인해 `params` 객체에서 `symbol` 속성을 안정적으로 읽어오지 못하는 문제가 발생.
  - **최종 해결책**: `params` 객체에 의존하는 대신, `request.url`을 직접 파싱하여 URL 경로의 마지막 세그먼트를 `symbol`로 추출하는 방식으로 로직을 변경하여 안정성을 확보함.

- **문제 9: 프론트엔드 데이터 타입 불일치 오류**
  - **현상**: 백엔드 API는 정상 응답(200 OK)을 보내지만, 프론트엔드에서는 "종목 정보를 가져오는 데 실패했습니다"라는 에러 모달이 표시됨.
  - **원인**: 백엔드 API가 보낸 JSON 데이터의 숫자 값들(예: `MarketCapitalization`)이 문자열(`"3183230100000"`) 형태였으나, 프론트엔드 `stock-analysis.tsx` 컴포넌트에서는 해당 값들을 숫자(Number)로 가정하고 처리(예: `formatCurrency`)하려다 타입 불일치 오류가 발생함.
  - **최종 해결책**: `stock-analysis.tsx`에서 API로부터 받은 모든 숫자 형태의 문자열을 `parseInt` 또는 `parseFloat`을 사용하여 명시적으로 숫자로 변환한 후 사용하도록 수정하여 런타임 오류를 해결함.


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
