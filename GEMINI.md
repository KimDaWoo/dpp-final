# GEMINI 기술 인수인계 문서 (v5 - 최종)

**문서 목적**: 이 문서는 다른 Gemini AI 에이전트가 프로젝트의 기술적 맥락, 설계 결정, 개발 과정을 완벽하게 이해하고 작업을 원활하게 이어받을 수 있도록 작성되었습니다.

---

## 1. 프로젝트 개요 (최종: 국내 주식 전용)

**"국내 주식 사전 분석 및 투자 성향 관리 도구"**는 사용자의 투자 성향에 맞춰 체계적이고 원칙에 기반한 트레이딩을 돕는 개인화된 웹 애플리케이션입니다. 데이터 소스를 **한국투자증권(KIS) API로 단일화**하는 과정에서 안정적인 데이터 확보가 가능한 **국내 주식 전용**으로 최종 확정되었습니다.

- **핵심 기능**:
  - **투자 성향 분석**: 첫 로그인 시 퀴즈를 통해 사용자 성향을 분석하고, 마이페이지에서 재분석 가능.
  - **인라인 종목 검색**: 페이지 내에서 즉시 국내 주식(코스피, 코스닥)을 이름 또는 종목 코드로 검색.
  - **데이터 기반 기업 분석 체크리스트**: KIS API를 통해 얻은 실제 재무 지표(PER, PBR, EPS 등) 기반의 분석을 제공.
    - **신뢰도 높은 UI**: 분석 데이터가 없는 항목은 '정보 없음' 상태로 명확하게 표시.
  - **주가 차트 및 거래 연동**: 상세 정보 모달에서 주가 차트를 확인하고, '거래하러 가기' 버튼으로 토스증권 페이지로 이동.
  - **거래량 순위 표시**: KIS API를 통해 실시간 거래량 상위 30개 종목을 **좌우 화살표로 탐색 가능한** 2줄 캐러셀 형태로 제공.
  - **매매 복기 노트**: 모든 매매 내역을 `localStorage`에 기록하고 관리.

- **주요 기술 스택**: Next.js (App Router/Turbopack), TypeScript, Tailwind CSS, shadcn/ui, Recharts.
- **데이터 소스**: **한국투자증권(KIS) API (동적 데이터)**, **로컬 CSV 파일 (정적 데이터)**

---

## 2. 핵심 아키텍처 및 설계 결정 (최종)

### 가. 데이터 소스: KIS API + 로컬 CSV 하이브리드
- **동적 데이터 (실시간)**: **한국투자증권(KIS) API**
  - **인증**: `.env.local`의 `KIS_APP_KEY`, `KIS_APP_SECRET` 사용. 토큰은 `.temp/kis_token.json` 파일에 하루 동안 캐싱. 토큰 만료 에러(`EGW00123`) 발생 시, 자동으로 토큰을 1회 재발급하여 API를 재시도하는 로직을 구현하여 안정성을 높임.
  - **종목 상세 정보**: `/uapi/domestic-stock/v1/quotations/inquire-price` (`tr_id: FHKST01010100`) 사용.
  - **주가 차트 데이터**: `/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice` (`tr_id: FHKST03010100`) 사용.
  - **거래량 순위**: `/uapi/domestic-stock/v1/quotations/volume-rank` (`tr_id: FHPST01710000`) 사용.

- **정적 데이터 (비실시간)**: **로컬 CSV 파일 (`src/lib/data`)**
  - **종목 검색**: `kospi_code.csv`, `kosdaq_code.csv` 파일을 앱 시작 시 메모리에 캐싱하여 빠르고 안정적인 검색 경험 제공.
  - **CSV 파싱**: `papaparse` 라이브러리 사용. 헤더 자동 인식(`columns: true`)의 불안정성으로 인해, 최종적으로는 **헤더를 수동으로 찾아 인덱스 기반으로 파싱**하는 안정적인 방식으로 구현 (`stock-utils.ts`).

### 나. UI/UX 관련 주요 결정
- **검색 UI**: 초기 '검색 모달' 방식이 지속적인 Hydration 오류와 상태 관리 문제를 유발. **모달을 완전히 제거**하고, 페이지에 직접 포함된 **'인라인 검색' 방식**으로 전면 교체하여 사용성과 안정성을 모두 확보.
- **체크리스트 신뢰도**: 일부 종목은 KIS API에서 특정 재무 데이터를 제공하지 않음. 이때 'N/A' 대신, **'정보 없음'을 나타내는 별도의 아이콘(물음표)과 텍스트**를 표시하는 3-state UI(통과/실패/정보없음)를 구현.
- **SSR 충돌 해결**: 상호작용이 많은 `StockSearch` 컴포넌트가 서버 사이드 렌더링(SSR)될 때 Hydration 오류가 발생하는 문제를 해결하기 위해, `next/dynamic`을 사용하여 해당 컴포넌트의 **SSR을 비활성화**(`ssr: false`). 이 로직은 별도의 클라이언트 컴포넌트(`trades-client.tsx`)로 분리하여 서버 컴포넌트 규칙을 준수.

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
  - 주가 차트: `src/components/trades/stock-chart.tsx`
  - 3-state 체크리스트: `src/components/checklist/stock-analysis.tsx`
  - SSR 비활성화 로직: `src/app/(app)/trades/trades-client.tsx`

---

## 4. 개발 이력 및 문제 해결 (Troubleshooting History) - **최종 회고**

- **(신규) 거래량 순위 캐러셀 → 상세 모달 무한 루프 디버깅**:
  - **현상**: 거래량 순위 캐러셀에서 '엑셀세라퓨틱스'(`373110`)처럼 코스피와 코스닥에 중복 상장된 종목을 클릭하면, 상세 정보 모달에서 무한 API 요청 루프가 발생.
  - **오류의 여정 (실수 기록)**:
    1. 최초에는 `stock-utils.ts`에서 CSV 데이터를 로드할 때 중복을 제거하는 방식으로 접근했으나, 이는 근본 원인이 아니었음. 거래량 순위 API 자체가 시장 정보를 주지 않는 것이 문제의 핵심.
    2. API 라우트(`volume-rank/route.ts`)에서 직접 `exchange` 정보를 추가하려다 `getKisToken` import 오류로 빌드 실패를 유발. 로직의 위치가 잘못되었음을 파악.
  - **결정적 원인 발견**: KIS 거래량 순위 API는 종목의 소속 시장(`exchange`) 정보를 반환하지 않음. 클라이언트에서는 종목 코드(`symbol`)만으로 상세 정보를 요청하게 되고, `/api/stock/search/[query]` API가 중복된 종목 정보를 모두 반환하면서 `useEffect` 훅에서 무한 루프가 발생.
  - **최종 해결책**:
    1. **데이터 보강**: 데이터 파이프라인의 시작점인 `kis-api.ts`의 `getVolumeRank` 함수를 수정. KIS API 응답을 받은 후, 로컬 CSV에서 로드한 전체 주식 정보(`stockMap`)와 병합하여 각 종목에 `exchange` 필드를 추가.
    2. **컴포넌트 수정**: `VolumeRankCarousel`이 클릭 시 `{ symbol, exchange }` 객체를 부모(`trades-client`)에게 전달하도록 수정.
    3. **상태 관리 수정**: `trades-client`의 `selectedStock` 상태가 `{ symbol, exchange }` 객체를 저장하도록 변경.
    4. **API 호출 수정**: `StockSearch` 컴포넌트가 모달을 열 때, `exchange` 정보가 있으면 이를 검색 API(`/api/stock/search/[symbol]?exchange=...`)의 쿼리 파라미터로 사용하여 특정 시장의 종목 정보만 정확히 요청하도록 수정. 이를 통해 무한 루프를 원천적으로 해결.

- **(신규) 주가 차트 선 표시 버그 디버깅**:
  - **현상**: 종목 상세 모달의 주가 차트에서 마우스 호버(hover) 시에만 데이터가 점으로 표시되고, 평소에는 선 그래프가 보이지 않음.
  - **원인 분석**: `Recharts` 라이브러리의 `<Line>` 컴포넌트 속성이 `dot={false}`로 설정되어 있어 기본적으로 데이터 포인트가 숨겨져 있었고, 선(`stroke`) 렌더링 자체에 문제가 있어 `activeDot`이 활성화되는 호버 시에만 데이터가 표시됨.
  - **최종 해결책**: `stock-chart.tsx` 파일의 `<Line>` 컴포넌트 속성을 수정하여, `dot={{ r: 2 }}`를 추가하고 `activeDot` 속성을 제거함. 이를 통해 차트에 항상 작은 점들이 표시되어 데이터의 흐름이 끊김 없는 선처럼 보이도록 하여 사용자 경험을 개선.

- **(신규) 종목 상세 모달 타이틀 누락 버그 디버깅**:
  - **현상**: 거래량 순위 캐러셀에서 코스닥(KOSDAQ) 종목을 클릭했을 때, 종목 상세 모달의 타이틀(종목명)이 표시되지 않음.
  - **오류의 여정 (실수 기록)**:
    1. 초기에는 모달이 열릴 때 상태(`selectedStockInfo`)가 제대로 업데이트되지 않는 문제로 추측하여, `useEffect`의 의존성 배열과 로직을 여러 번 수정했으나 실패.
    2. **결정적 원인 발견**: 터미널 로그를 상세히 분석한 결과, `stock-utils.ts`에서 KOSDAQ CSV 파일을 파싱할 때 `'한글명'`이라는 헤더를 찾지 못해 `Required headers not found` 에러가 발생하고 있었음. 실제 헤더는 `'한글종목명'`이었음.
  - **최종 해결책**: `stock-utils.ts`의 `processCsvData` 함수를 수정하여, KOSPI CSV는 `'종목명'`을, KOSDAQ CSV는 `'한글종목명'`을 사용하도록 분기 처리하여 문제를 해결.

- **(신규) KIS 거래량 순위 API (`getVolumeRank`) 연동 및 UI 디버깅**:
  - **현상**: 거래량 순위 API 호출 시 지속적으로 비어있는 응답(`{"rt_cd":"","msg_cd":"","msg1":""}`)을 수신했으며, 구현된 캐러셀 UI가 부모 컨테이너의 너비를 벗어나는 레이아웃 깨짐 현상이 발생.
  - **API 오류의 여정 (실수 기록)**:
    1. **(원인)** 초기 호출 시, API 문서에 명시되지 않은 숨겨진 필수 파라미터(`FID_BLNG_CLS_CODE` 등)를 누락하여 서버가 유효하지 않은 요청으로 판단. **(해결)** 다른 개발자가 성공한 파라미터 구성을 참고하여 문제를 해결.
    2. **(원인)** 간헐적으로 발생하는 `500 Internal Server Error` (`msg_cd: EGW00123`)는 캐시된 접근 토큰의 만료가 원인. **(해결)** API 호출 실패 시 에러 코드를 확인하여, 토큰 만료가 원인일 경우 토큰을 강제로 1회 재발급받아 API를 재시도하는 로직을 모든 KIS API 호출 함수에 공통적으로 적용.
    3. **(실패한 시도)** 헤더의 `appkey`, `authorization` 등의 대소문자(casing)가 문제일 것으로 추측했으나, 이는 근본 원인이 아니었음. 프로젝트 내 다른 API 호출과의 일관성을 유지하는 것이 정답.
  - **캐러셀 UI 레이아웃 오류의 여정 (실수 기록)**:
    1. **(원인)** `shadcn/ui`의 `Carousel` 컴포넌트가 내부 컨텐츠(카드 목록)의 최소 너비 때문에 부모 `div`의 너비 제약을 무시하고 화면 밖으로 확장됨.
    2. **(실패한 시도)** `overflow-hidden`, `position: absolute`, "브릿지" `div` 추가 등 국소적인 스타일 수정으로는 근본 원인을 해결하지 못하고, 화살표가 사라지거나 타이틀이 겹치는 등의 2차 문제를 유발함.
    3. **(최종 해결책 - 사용자가 직접 해결)** 문제의 근본 원인은 개별 컴포넌트가 아닌 **최상위 레이아웃 파일**에 있었음. `src/app/(app)/layout.tsx`의 메인 컨텐츠 영역을 감싸는 `div`에 `min-w-0` 클래스를 추가하여 해결. 이 클래스는 flex 아이템(메인 컨테언츠 영역)이 내부 컨텐츠(캐러셀)의 크기 때문에 부모(전체 페이지 레이아웃)의 너비를 초과하는 것을 원천적으로 방지함.
    4. **(핵심 교훈)** 특정 컴포넌트의 스타일 문제를 해결할 때는 해당 컴포넌트만 보지 말고, **프로젝트의 최상위 레이아웃 구조(`layout.tsx`)부터 분석**하여 전체적인 스타일 상속 및 제약 조건을 먼저 파악해야 함.

- **(최종) 국내 주식 차트 API (`getStockPriceHistory`) 디버깅**:
  - **현상**: 차트 데이터 조회 시 지속적으로 `500 Internal Server Error` 발생.
  - **오류의 여정 (실수 기록)**:
    1. `SocketError` 발생 시, 이를 일시적인 네트워크 문제로 성급하게 단정함.
    2. 문제 지속 시, `tr_id`가 잘못되었을 것이라 추측. `FHKST01010400`으로 수정했으나 실패.
    3. 다시 `FHKST03010100`으로 원복하는 과정에서 다른 코드에 영향을 주었을 것으로 추측.
    4. **결정적 원인 발견**: `tr_id`는 처음부터 `FHKST03010100`이 맞았음. 진짜 문제는 다른 API 호출(`getStockDetails`)의 인증 실패가 연쇄적으로 영향을 미쳤거나, API 응답에 `output2` 필드가 없는 경우 `undefined`를 반환하여 `.map` 오류를 유발한 것이었음.
  - **최종 해결책**: ① `tr_id`를 `FHKST03010100`으로 확정. ② API 응답이 `output2`를 포함하지 않을 경우, `undefined` 대신 **빈 배열 `[]`을 반환**하도록 안전 장치를 추가하여 `.map` 오류를 원천적으로 차단.

- **(최종) KIS API `500 Internal Server Error` 디버깅**:
  - **현상**: 모든 KIS API 호출이 `500` 에러를 반환하며 실패.
  - **오류의 여정 (실수 기록)**:
    1. `tr_id` 등 API 명세가 잘못되었을 것으로 추측하며 여러 번 수정했으나 모두 실패.
    2. **결정적 원인 발견**: 터미널 로그를 상세히 재검토한 결과, API 요청 헤더의 `appsecret` 값 맨 끝에 **불필요한 `N` 글자가 하나 포함**된 것을 발견.
  - **최종 해결책**: `.env.local` 파일의 잠재적인 오류(공백, 줄바꿈 등)를 방어하기 위해, `kis-api.ts`에서 `process.env`로 환경 변수를 불러올 때 **`.trim()` 메소드를 추가**하여 값의 유효성을 코드 레벨에서 보장.

- **(최종) 종목 검색 기능 전체 디버깅**:
  - **현상**: 검색창에 '삼성'을 입력해도 검색 결과가 전혀 나오지 않음.
  - **오류의 여정 (실수 기록)**:
    1. `params` 접근 오류, `papaparse`의 `bom` 옵션 등 여러 주변적인 문제를 수정했으나 핵심 원인을 찾지 못함.
    2. **결정적 원인 발견**: `papaparse`의 결과물을 직접 로깅한 결과, CSV 파일의 실제 헤더가 `'종목명'`, `'종목코드'`가 아닌 **`'한글명'`, `'단축코드'`**임을 확인.
  - **최종 해결책**: `stock-utils.ts`에서 참조하는 헤더 이름을 실제 파일과 일치시켜 해결. 이후 `papaparse`의 헤더 자동 인식 불안정성을 고려하여, **헤더를 수동으로 찾아 인덱스 기반으로 파싱**하는 방식으로 최종 리팩토링.

- **(최종) 프론트엔드 Hydration 및 검색 UI 오류**:
  - **현상**: 검색 결과 깜빡임, `<div> cannot be a descendant of <p>` 등 지속적인 UI 오류 발생.
  - **오류의 여정 (실수 기록)**:
    1. `ssr: false`를 적용하여 증상을 해결하려 했으나, 이는 근본 원인이 아니었음.
    2. **결정적 원인 발견**: ① 잘못된 HTML 구조(`DialogDescription`(<p>) 안에 `<div>` 사용)가 Hydration 오류의 근본 원인임을 파악. ② 검색 UI 자체의 복잡성(`CommandDialog`)이 상태 관리 문제를 계속 유발.
  - **최종 해결책**: ① HTML 구조를 바로잡고, ② **'검
검색 모달'을 '인라인 검색' 방식으로 전면 교체**하여 문제의 근원을 제거하고 UX를 개선.

- **(신규) 전사적 타입스크립트 오류 및 런타임 에러 디버깅**:
  - **현상**: `npx tsc --noEmit` 실행 시 22개의 타입스크립트 컴파일 오류가 발생했으며, 이를 해결한 후에도 API 라우트에서 런타임 에러가 발생.
  - **오류의 여정 (실수 기록)**:
    1. **1차 수정**: API 라우트 핸들러의 `Request` 타입을 `NextRequest`로 변경하고, `react-hook-form`의 타입 추론 문제를 해결하기 위해 `useForm`의 `defaultValues`를 수정하는 등 개별 오류를 순차적으로 수정.
    2. **2차 수정 (잘못된 접근)**: `mistakes/page.tsx`의 `react-hook-form` 오류를 해결하기 위해 `old_string`을 너무 광범위하게 설정하여 JSX 구조를 깨뜨리는 실수를 함. `write_file`로 원상 복구 후 `SubmitHandler` 타입을 명시하여 해결.
    3. **런타임 에러 발생**: 타입스크립트 오류를 모두 해결한 후, API 라우트에서 `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` 런타임 에러 발생. `context.params`가 `undefined`일 수 있는 가능성을 놓침.
    4. **잘못된 런타임 에러 수정**: 옵셔널 체이닝(`?.`)으로 런타임 에러를 해결하려 했으나, `Error: params is a Promise and must be unwrapped with await` 라는 새로운 에러 발생. Next.js App Router의 `params` 객체가 Promise라는 핵심 동작 방식을 인지하지 못함.
  - **최종 해결책**:
    1. **타입 오류 해결**: `react-hook-form` 문제는 `zodResolver`에 스키마를 `any`로 캐스팅하여 해결. `stock-utils.ts`의 `StockInfo` 인터페이스에서 옵셔널(`?`) 속성을 제거하고 기본값을 보장하여 타입 불일치 문제를 해결.
    2. **런타임 에러 해결**: 모든 API 라우트 핸들러에서 `const { params } = context` 대신 `const params = await context.params` 와 같이 `await` 키워드를 사용하여 Promise인 `params` 객체를 올바르게 비동기적으로 처리하여 근본적인 런타임 에러를 해결.

---

## 5. 코드 품질 관리 (Code Quality Assurance)
- **타입스크립트 오류 확인**: 코드를 대량으로 수정한 후에는, 반드시 `npx tsc --noEmit` 명령어를 실행하여 프로젝트 전체에 타입스크립트 오류가 없는지 확인합니다. 이는 서비스의 안정성을 보장하고 잠재적인 버그를 사전에 방지하는 중요한 과정입니다.

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