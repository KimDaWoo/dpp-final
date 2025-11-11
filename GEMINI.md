# GEMINI 기술 인수인계 문서 (v7 - 최종)

**문서 목적**: 이 문서는 다른 Gemini AI 에이전트가 프로젝트의 기술적 맥락, 설계 결정, 개발 과정을 완벽하게 이해하고 작업을 원활하게 이어받을 수 있도록 작성되었습니다.

---
## 1. 프로젝트 개요 (최종: 국내 주식 전용)

**"국내 주식 사전 분석 및 투자 성향 관리 도구"**는 사용자의 투자 성향에 맞춰 체계적이고 원칙에 기반한 트레이딩을 돕는 개인화된 웹 애플리케이션입니다. 데이터 소스를 **한국투자증권(KIS) API로 단일화**하는 과정에서 안정적인 데이터 확보가 가능한 **국내 주식 전용**으로 최종 확정되었습니다.

- **핵심 기능**:
  - **투자 성향 분석**: 첫 로그인 시 퀴즈를 통해 사용자 성향을 분석하고, 마이페이지에서 재분석 가능.
  - **인라인 종목 검색**: 페이지 내에서 즉시 국내 주식(코스피, 코스닥)을 이름 또는 종목 코드로 검색.
  - **데이터 기반 기업 분석 체크리스트**: KIS API를 통해 얻은 실제 재무 지표(PER, PBR, EPS 등) 기반의 분석을 제공.
  - **주가 차트 및 거래 연동**: 상세 정보 모달에서 주가 차트를 확인하고, '거래하러 가기' 버튼으로 토스증권 페이지로 이동.
  - **거래량 순위 표시**: KIS API를 통해 실시간 거래량 상위 30개 종목을 **좌우 화살표로 탐색 가능한** 2줄 캐러셀 형태로 제공.
  - **(신규) 매매 복기 노트**: 모든 매매 내역을 `localStorage`에 기록하고 관리. "거래하러 가기"를 통한 자동 기록과 수동 직접 입력을 모두 지원.

- **주요 기술 스택**: Next.js (App Router/Turbopack), TypeScript, Tailwind CSS, shadcn/ui, Recharts.
- **데이터 소스**: **한국투자증권(KIS) API (동적 데이터)**, **로컬 CSV 파일 (정적 데이터)**

---

## 2. 핵심 아키키텍처 및 설계 결정 (최종)
*(기존 내용과 동일)*

---

## 3. 기능별 핵심 파일 경로 (최종)
- **데이터 처리**:
  - KIS API 호출: `src/lib/kis-api.ts`
  - CSV 파싱 및 검색: `src/lib/stock-utils.ts`
- **백엔드 API 라우트**:
  - 종목 검색: `src/app/api/stock/search/[query]/route.ts`
  - 종목 상세: `src/app/api/stock/[symbol]/route.ts`
  - 차트 데이터: `src/app/api/stock/chart/[symbol]/route.ts`
  - 거래량 순위: `src/app/api/stock/volume-rank/route.ts`
- **프론트엔드 UI**:
  - 인라인 검색 및 상세 모달: `src/components/trades/stock-search.tsx`
  - 거래량 순위 캐러셀: `src/components/trades/volume-rank-carousel.tsx`
  - **(신규) 매매 복기 페이지**: `src/app/(app)/mistakes/page.tsx`
  - **(신규) 매매 기록 추가 모달**: `src/components/trades/add-trade-log-modal.tsx`
  - **(신규) 매매 기록 저장 확인 모달**: `src/components/trades/trade-confirmation-modal.tsx`
- **전역 상태 관리**:
  - **(신규) 매매 기록 컨텍스트**: `src/contexts/trade-log-context.tsx`

---

## 4. 개발 이력 및 문제 해결 (Troubleshooting History) - **최종 회고**

- **(복원) 거래량 순위 캐러셀 → 상세 모달 무한 루프 디버깅**:
  - **현상**: 거래량 순위 캐러셀에서 코스피와 코스닥에 중복 상장된 종목을 클릭하면, 상세 정보 모달에서 무한 API 요청 루프가 발생.
  - **최종 해결책**: 데이터 파이프라인의 시작점인 `kis-api.ts`의 `getVolumeRank` 함수에서 KIS API 응답과 로컬 CSV 데이터를 병합하여 각 종목에 `exchange` 필드를 추가하고, 이 `exchange` 정보를 API 요청 시 쿼리 파라미터로 사용하여 특정 시장의 종목 정보만 정확히 요청하도록 수정.

- **(복원) 주가 차트 선 표시 버그 디버깅**:
  - **현상**: 종목 상세 모달의 주가 차트에서 마우스 호버 시에만 데이터가 점으로 표시되고, 평소에는 선 그래프가 보이지 않음.
  - **최종 해결책**: `stock-chart.tsx`의 `<Line>` 컴포넌트 속성을 수정하여, `dot={{ r: 2 }}`를 추가하고 `activeDot` 속성을 제거함으로써 항상 작은 점들이 표시되어 선처럼 보이도록 개선.

- **(복원) 종목 상세 모달 타이틀 누락 버그 디버깅**:
  - **현상**: 거래량 순위 캐러셀에서 코스닥(KOSDAQ) 종목을 클릭했을 때, 종목 상세 모달의 타이틀(종목명)이 표시되지 않음.
  - **최종 해결책**: `stock-utils.ts`의 `processCsvData` 함수에서 KOSDAQ CSV 파싱 시, 실제 헤더인 `'한글종목명'`을 사용하도록 수정.

- **(복원) KIS 거래량 순위 API 연동 및 UI 디버깅**:
  - **현상**: API 호출 시 비어있는 응답을 수신하고, 캐러셀 UI가 부모 컨테이너 너비를 벗어나는 문제 발생.
  - **최종 해결책**: API 호출 시 숨겨진 필수 파라미터를 추가하고, 토큰 만료 시 자동 재발급 로직을 구현. UI 문제는 최상위 레이아웃 파일(`layout.tsx`)에 `min-w-0` 클래스를 추가하여 해결.

- **(복원) 국내 주식 차트 API 디버깅**:
  - **현상**: 차트 데이터 조회 시 지속적으로 `500 Internal Server Error` 발생.
  - **최종 해결책**: API 응답에 `output2` 필드가 없는 경우, `undefined` 대신 빈 배열 `[]`을 반환하도록 안전 장치를 추가하여 `.map` 오류를 원천적으로 차단.

- **(복원) KIS API `500 Internal Server Error` 디버깅**:
  - **현상**: 모든 KIS API 호출이 `500` 에러를 반환하며 실패.
  - **최종 해결책**: `.env.local` 파일의 환경 변수를 불러올 때 `.trim()` 메소드를 추가하여 값의 유효성을 코드 레벨에서 보장.

- **(복원) 종목 검색 기능 전체 디버깅**:
  - **현상**: 검색창에 '삼성'을 입력해도 검색 결과가 나오지 않음.
  - **최종 해결책**: `stock-utils.ts`에서 참조하는 CSV 헤더 이름을 실제 파일과 일치시키고, 헤더를 수동으로 찾아 인덱스 기반으로 파싱하도록 리팩토링.

- **(복원) 프론트엔드 Hydration 및 검색 UI 오류**:
  - **현상**: 검색 결과 깜빡임, `<div> cannot be a descendant of <p>` 등 지속적인 UI 오류 발생.
  - **최종 해결책**: HTML 구조를 바로잡고, '검색 모달'을 '인라인 검색' 방식으로 전면 교체하여 문제의 근원을 제거.

- **(복원) 전사적 타입스크립트 오류 및 런타임 에러 디버깅**:
  - **현상**: `npx tsc --noEmit` 실행 시 다수의 타입스크립트 오류 및 API 라우트에서 런타임 에러 발생.
  - **최종 해결책**: `react-hook-form` 타입 문제를 해결하고, 모든 API 라우트 핸들러에서 `await context.params`를 사용하여 Promise인 `params` 객체를 올바르게 비동기 처리.

- **(신규) 매매 복기 기능 전체 구현 및 디버깅**:
  - **목표**: 사용자가 자신의 투자 내역을 기록하고, 수익률을 추적하며 투자 결정을 복기할 수 있는 '매매 복기' 기능을 구현.
  - **구현 내용**:
    1.  **데이터 구조 및 Context**: `TradeLog` 인터페이스를 정의하고, `localStorage`와 연동하여 매매 기록을 전역적으로 관리하는 `TradeLogContext`를 생성.
    2.  **매매 복기 페이지 UI**: `mistakes/page.tsx`에 `localStorage`의 데이터를 기반으로 매매 기록을 보여주는 테이블과 "직접 입력" 버튼을 구현.
    3.  **수동/자동 입력 모달**: `add-trade-log-modal.tsx`를 생성하여 사용자가 직접 매매 기록을 추가하는 UI 및 로직을 구현. "거래하러 가기"를 통한 자동 기록 시 현재가를 API로 조회하여 '매수가'에 자동 반영.
    4.  **UX 개선**: 모달 크기 확장, 유효성 검사 오류 메시지 툴팁 처리, 금액 입력 필드 천 단위 콤마(,) 자동 추가, "거래하러 가기" 시 모달과 토스 증권 페이지 동시 열림 기능 등 사용자 경험을 개선.
  - **주요 디버깅**:
    - **`NaN` 오류**: API 응답의 숫자 값에 포함된 쉼표(,)로 인해 발생. API 라우트에서 쉼표를 제거하는 로직을 추가하여 해결.
    - **데이터 불일치 오류**: API 응답 키(`PascalCase`)와 클라이언트 기대 키(`camelCase`) 불일치 문제. `stock-search.tsx`에서 데이터 키를 변환하여 해결.
    - **Zod 스키마 유효성 검사 오류**: 매도 관련 필드를 비웠을 때 유효성 검사에 실패하는 문제. `z.preprocess`를 사용하여 빈 문자열을 `undefined`로 변환 후 검증하여 해결.
    - **`useEffect` 의존성 배열 오류**: `react-hook-form`의 `form` 객체 전체를 의존성 배열에 포함시켜 발생. 안정적인 `reset` 함수만 추출하여 전달하는 방식으로 해결.

---

## 5. 향후 개발 계획 (Future Development Plan)

**목표**: 매매 복기 기능의 사용성을 고도화하고 사용자 경험을 개선한다.

### 가. 매매 기록 수정 기능 구현
- **현황**: 현재 "나의 매매 기록"(`mistakes/page.tsx`) 페이지에는 수정 버튼의 UI만 구현되어 있으며, 실제 기능은 비활성화된 상태.
- **개발 계획**:
  1.  **수정 모달 생성/재사용**: `add-trade-log-modal.tsx`를 재사용하거나, 수정을 위한 별도의 모달 컴포넌트(`edit-trade-log-modal.tsx`)를 생성.
  2.  **데이터 연동**: 사용자가 수정 버튼을 클릭하면, 해당 row의 `TradeLog` 데이터를 모달에 채워서 보여줌.
  3.  **로직 구현**: `trade-log-context.tsx`에 구현된 `updateTradeLog` 함수를 사용하여 `localStorage`의 데이터를 업데이트하는 로직을 연결.
  4.  **주요 사용 사례**: 사용자가 매도 후 "매도가, 매도량, 매도일" 정보를 추가하거나, 기존에 입력한 내용을 수정하는 경우.

### 나. 날짜 입력 UI 개선 (캘린더 기능 도입)
- **현황**: 현재 "매수일"과 "매도일"은 사용자가 `YYYY-MM-DD` 형식에 맞춰 직접 텍스트로 입력해야 함.
- **문제점**: 사용자에게 불편함을 유발하고, 입력 오류가 발생할 가능성이 높음.
- **개발 계획**:
  1.  **라이브러리 설치**: `shadcn/ui`와 호환성이 좋은 `react-day-picker` 라이브러리를 프로젝트에 추가.
      ```bash
      pnpm add react-day-picker
      ```
  2.  **캘린더 컴포넌트 생성**: `shadcn/ui`의 `Calendar` 컴포넌트(`components/ui/calendar.tsx`)를 생성하고, `Popover`와 조합하여 날짜를 선택할 수 있는 Date Picker 컴포넌트를 구현.
  3.  **모달에 적용**: `add-trade-log-modal.tsx`와 향후 구현될 수정 모달의 날짜 입력 필드를 기존의 `Input`에서 새로 만든 Date Picker 컴포넌트로 교체.
  4.  **스타일링**: 이전에 실패했던 `globals.css` 및 `tailwind.config.ts`와의 충돌 문제를 `shadcn/ui` 공식 문서를 참고하여 해결.

---

## 6. 필수 환경 변수 (`.env.local` - 최종)

```
# GitHub OAuth App credentials
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...

# Secret for signing NextAuth.js tokens
AUTH_SECRET...

# Korea Investment & Securities (KIS) API Key
KIS_APP_KEY=...
KIS_APP_SECRET=...
```