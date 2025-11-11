# 한국투자증권 거래량순위 API 문서
Korea Investment Securities Volume Rank API Documentation

## 개요 (Overview)

한국투자증권 OpenAPI의 거래량순위 조회 API는 국내 주식시장에서 거래량이 많은 종목들을 순위별로 조회할 수 있는 기능을 제공합니다. 이 API는 한국투자증권 HTS(eFriend Plus)의 [0171] 거래량 순위 화면과 동일한 기능을 REST API로 구현한 것입니다.

### 주요 특징
- 최대 30건까지 조회 가능
- 실시간 거래량 순위 데이터 제공
- 다음 페이지 조회 불가 (단일 호출로 최대 30건만 조회)
- 30건 이상 필요시 종목조건검색 API 활용 권장

## API 엔드포인트 정보

### 기본 정보
| 항목 | 설명 |
|------|------|
| **Method** | GET |
| **URL Path** | `/uapi/domestic-stock/v1/quotations/volume-rank` |
| **실전 Domain** | `https://openapi.koreainvestment.com:9443` |
| **모의 Domain** | 모의투자 미지원 |
| **Format** | JSON |
| **Content-Type** | `application/json; charset=utf-8` |
| **카테고리** | [국내주식] 순위분석 |

### 인증 정보
| 헤더명 | 설명 | 필수 |
|--------|------|------|
| `authorization` | Bearer {ACCESS_TOKEN} | O |
| `appkey` | 앱키 (36자리) | O |
| `appsecret` | 앱 시크릿키 (180자리) | O |
| `tr_id` | 거래ID - 실전: `FHPST01710000` | O |
| `custtype` | 고객타입 (P: 개인, B: 법인) | - |

## 요청 파라미터 (Request Parameters)

### Query Parameters
| 파라미터명 | 타입 | 필수 | 설명 | 값 |
|------------|------|------|------|-----|
| `fid_cond_mrkt_div_code` | String | O | 시장 구분 코드 | J: 주식<br>ETF: ETF |
| `fid_cond_scr_div_code` | String | O | 조회 구분 코드 | 20170: 거래량상위<br>20171: 거래대금상위<br>20172: 거래급증<br>20173: 거래율상위 |
| `fid_input_iscd` | String | O | 입력 종목코드 | 0000: 전체<br>0001: 코스피<br>1001: 코스닥 |
| `fid_rank_sort_cls_code` | String | O | 순위 정렬 구분 | 0: 내림차순<br>1: 오름차순 |
| `fid_input_cnt_1` | String | O | 입력 수 | 0: 전체 (최대 30건)<br>1~30: 지정 건수 |
| `fid_prc_cls_code` | String | O | 가격 구분 | 0: 전체<br>1: 1천원미만<br>2: 1천원~5천원<br>3: 5천원~1만원<br>4: 1만원~5만원<br>5: 5만원이상 |
| `fid_input_price_1` | String | O | 입력 가격1 | 가격 하한값 (빈값 가능) |
| `fid_input_price_2` | String | O | 입력 가격2 | 가격 상한값 (빈값 가능) |
| `fid_vol_cnt` | String | O | 거래량 수 | 거래량 하한값 (빈값 가능) |
| `fid_trgt_cls_code` | String | O | 대상 구분 | 0: 전체<br>1: 관리종목<br>2: 투자주의<br>3: 투자경고<br>4: 투자위험예고<br>5: 투자위험 |
| `fid_trgt_exls_cls_code` | String | O | 대상 제외 | 0: 전체<br>1: 우선주<br>2: 증거금50<br>3: 증거금100<br>4: 증거금40<br>5: ETF/ETN<br>6: 스팩 |
| `fid_div_cls_code` | String | O | 분류 구분 | 0: 전체 |
| `fid_rsfl_rate1` | String | - | 등락율1 | 등락율 하한 (%) |
| `fid_rsfl_rate2` | String | - | 등락율2 | 등락율 상한 (%) |

## 응답 데이터 (Response)

### 응답 구조
```json
{
  "rt_cd": "0",
  "msg_cd": "MCA00000",
  "msg1": "정상처리 되었습니다.",
  "output": [
    {
      // 응답 데이터 필드들
    }
  ]
}
```

### Output 필드 설명
| 필드명 | 설명 | 타입 |
|--------|------|------|
| `hts_kor_isnm` | 한글 종목명 | String |
| `mksc_shrn_iscd` | 종목코드 (6자리) | String |
| `data_rank` | 순위 | String |
| `stck_prpr` | 현재가 | String |
| `prdy_vrss_sign` | 전일 대비 부호<br>1: 상한<br>2: 상승<br>3: 보합<br>4: 하한<br>5: 하락 | String |
| `prdy_vrss` | 전일 대비 | String |
| `prdy_ctrt` | 전일 대비율 (%) | String |
| `acml_vol` | 누적 거래량 | String |
| `prdy_vol` | 전일 거래량 | String |
| `lstn_stcn` | 상장 주수 | String |
| `avrg_vol` | 평균 거래량 | String |
| `n_befr_clpr_vrss_prpr_rate` | N일전 종가 대비 현재가 대비율 | String |
| `vol_inrt` | 거래량 증가율 (%) | String |
| `vol_tnrt` | 거래량 회전율 (%) | String |
| `nday_vol_tnrt` | N일 거래량 회전율 (%) | String |
| `avrg_tr_pbmn` | 평균 거래 대금 | String |
| `tr_pbmn_tnrt` | 거래대금 회전율 | String |
| `nday_tr_pbmn_tnrt` | N일 거래대금 회전율 | String |
| `acml_tr_pbmn` | 누적 거래대금 | String |

## 예제 코드

### Python 예제

```python
import requests
import json

# API 설정
APP_KEY = "YOUR_APP_KEY"
APP_SECRET = "YOUR_APP_SECRET"
ACCESS_TOKEN = "YOUR_ACCESS_TOKEN"
URL_BASE = "https://openapi.koreainvestment.com:9443"

def get_volume_rank():
    """거래량 순위 조회"""
    path = "/uapi/domestic-stock/v1/quotations/volume-rank"
    url = f"{URL_BASE}{path}"
    
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "authorization": f"Bearer {ACCESS_TOKEN}",
        "appKey": APP_KEY,
        "appSecret": APP_SECRET,
        "tr_id": "FHPST01710000"
    }
    
    params = {
        "fid_cond_mrkt_div_code": "J",       # 주식
        "fid_cond_scr_div_code": "20170",    # 거래량상위
        "fid_input_iscd": "0000",             # 전체
        "fid_rank_sort_cls_code": "0",       # 내림차순
        "fid_input_cnt_1": "0",               # 전체 (최대 30건)
        "fid_prc_cls_code": "0",              # 전체가격
        "fid_input_price_1": "",              # 가격 하한 (빈값)
        "fid_input_price_2": "",              # 가격 상한 (빈값)
        "fid_vol_cnt": "",                    # 거래량 하한 (빈값)
        "fid_trgt_cls_code": "0",             # 전체 대상
        "fid_trgt_exls_cls_code": "0",        # 제외 없음
        "fid_div_cls_code": "0",              # 전체
        "fid_rsfl_rate1": "",                 # 등락율 하한 (빈값)
        "fid_rsfl_rate2": ""                  # 등락율 상한 (빈값)
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data['rt_cd'] == '0':
            return data['output']
        else:
            print(f"Error: {data['msg1']}")
            return None
    else:
        print(f"HTTP Error: {response.status_code}")
        return None

# 사용 예제
if __name__ == "__main__":
    volume_rank = get_volume_rank()
    
    if volume_rank:
        print("거래량 상위 종목 TOP 10")
        print("-" * 60)
        print(f"{'순위':<5} {'종목명':<20} {'현재가':<10} {'등락율':<8} {'거래량':<15}")
        print("-" * 60)
        
        for stock in volume_rank[:10]:
            rank = stock['data_rank']
            name = stock['hts_kor_isnm']
            price = stock['stck_prpr']
            change_rate = stock['prdy_ctrt']
            volume = stock['acml_vol']
            
            # 부호 처리
            sign = ""
            if stock['prdy_vrss_sign'] == '2':
                sign = "+"
            elif stock['prdy_vrss_sign'] == '5':
                sign = "-"
            
            print(f"{rank:<5} {name:<20} {price:>10} {sign}{change_rate:>7}% {volume:>15}")
```

### JavaScript (Node.js) 예제

```javascript
const axios = require('axios');

const APP_KEY = 'YOUR_APP_KEY';
const APP_SECRET = 'YOUR_APP_SECRET';
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN';
const URL_BASE = 'https://openapi.koreainvestment.com:9443';

async function getVolumeRank() {
    const path = '/uapi/domestic-stock/v1/quotations/volume-rank';
    const url = `${URL_BASE}${path}`;
    
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'authorization': `Bearer ${ACCESS_TOKEN}`,
        'appKey': APP_KEY,
        'appSecret': APP_SECRET,
        'tr_id': 'FHPST01710000'
    };
    
    const params = {
        fid_cond_mrkt_div_code: 'J',
        fid_cond_scr_div_code: '20170',
        fid_input_iscd: '0000',
        fid_rank_sort_cls_code: '0',
        fid_input_cnt_1: '0',
        fid_prc_cls_code: '0',
        fid_input_price_1: '',
        fid_input_price_2: '',
        fid_vol_cnt: '',
        fid_trgt_cls_code: '0',
        fid_trgt_exls_cls_code: '0',
        fid_div_cls_code: '0',
        fid_rsfl_rate1: '',
        fid_rsfl_rate2: ''
    };
    
    try {
        const response = await axios.get(url, { headers, params });
        
        if (response.data.rt_cd === '0') {
            return response.data.output;
        } else {
            console.error(`Error: ${response.data.msg1}`);
            return null;
        }
    } catch (error) {
        console.error(`HTTP Error: ${error.message}`);
        return null;
    }
}

// 사용 예제
async function main() {
    const volumeRank = await getVolumeRank();
    
    if (volumeRank) {
        console.log('거래량 상위 종목 TOP 10');
        console.log('-'.repeat(60));
        
        volumeRank.slice(0, 10).forEach(stock => {
            const sign = stock.prdy_vrss_sign === '2' ? '+' : 
                         stock.prdy_vrss_sign === '5' ? '-' : '';
            
            console.log(
                `${stock.data_rank.padEnd(5)} ` +
                `${stock.hts_kor_isnm.padEnd(20)} ` +
                `${stock.stck_prpr.padStart(10)} ` +
                `${sign}${stock.prdy_ctrt}% `.padStart(10) +
                `${stock.acml_vol.padStart(15)}`
            );
        });
    }
}

main();
```

## 응답 예제

```json
{
  "rt_cd": "0",
  "msg_cd": "MCA00000",
  "msg1": "정상처리 되었습니다.",
  "output": [
    {
      "hts_kor_isnm": "삼성전자",
      "mksc_shrn_iscd": "005930",
      "data_rank": "1",
      "stck_prpr": "65100",
      "prdy_vrss_sign": "5",
      "prdy_vrss": "-300",
      "prdy_ctrt": "-0.46",
      "acml_vol": "8958147",
      "prdy_vol": "12334657",
      "lstn_stcn": "5969782550",
      "avrg_vol": "8958147",
      "n_befr_clpr_vrss_prpr_rate": "-0.46",
      "vol_inrt": "72.63",
      "vol_tnrt": "0.15",
      "nday_vol_tnrt": "0.15",
      "avrg_tr_pbmn": "584861890300",
      "tr_pbmn_tnrt": "0.15",
      "nday_tr_pbmn_tnrt": "0.15",
      "acml_tr_pbmn": "584861890300"
    },
    {
      "hts_kor_isnm": "두산에너빌리티",
      "mksc_shrn_iscd": "034020",
      "data_rank": "2",
      "stck_prpr": "15730",
      "prdy_vrss_sign": "5",
      "prdy_vrss": "-90",
      "prdy_ctrt": "-0.57",
      "acml_vol": "3285533",
      "prdy_vol": "609099",
      "lstn_stcn": "476653872",
      "avrg_vol": "3285533",
      "n_befr_clpr_vrss_prpr_rate": "-0.57",
      "vol_inrt": "539.31",
      "vol_tnrt": "0.69",
      "nday_vol_tnrt": "0.69",
      "avrg_tr_pbmn": "51667531590",
      "tr_pbmn_tnrt": "0.69",
      "nday_tr_pbmn_tnrt": "0.69",
      "acml_tr_pbmn": "51667531590"
    }
    // ... 최대 30건까지
  ]
}
```

## 주의사항

### 제한사항
1. **최대 조회 건수**: 한 번의 호출로 최대 30건만 조회 가능
2. **페이징 미지원**: 다음 페이지 조회 기능 없음
3. **모의투자 미지원**: 실전 계좌에서만 사용 가능
4. **Rate Limit**: 초당 10건 제한 (한국투자증권 API 공통)

### 30건 이상 조회가 필요한 경우
30건 이상의 거래량 순위 데이터가 필요한 경우, 대안으로 **종목조건검색 API**를 활용할 수 있습니다:

1. HTS(eFriend Plus) [0110] 조건검색에서 조건 설정
2. "거래량 상위순 100종목" 등의 조건 저장
3. 종목조건검색 API로 최대 100개까지 검색 가능

```python
# 종목조건검색 API 사용 예제
def get_condition_search():
    """종목조건검색으로 거래량 상위 100종목 조회"""
    path = "/uapi/domestic-stock/v1/quotations/inquire-condition-search"
    # ... (조건검색 API 구현)
```

## 활용 사례

### 1. 거래량 급증 종목 모니터링
```python
def monitor_volume_surge():
    """거래량 급증 종목 실시간 모니터링"""
    params = {
        "fid_cond_scr_div_code": "20172",  # 거래급증
        # ... 기타 파라미터
    }
    # 주기적으로 API 호출하여 거래량 급증 종목 추적
```

### 2. 시장별 거래 동향 분석
```python
def analyze_market_trend():
    """코스피/코스닥 거래량 상위 종목 비교"""
    kospi_data = get_volume_rank(market="0001")  # 코스피
    kosdaq_data = get_volume_rank(market="1001")  # 코스닥
    # 시장별 거래 패턴 분석
```

### 3. 가격대별 거래량 분석
```python
def analyze_by_price_range():
    """가격대별 거래량 상위 종목 분석"""
    price_ranges = ["1", "2", "3", "4", "5"]  # 1천원미만 ~ 5만원이상
    for price_range in price_ranges:
        data = get_volume_rank(price_cls=price_range)
        # 가격대별 거래 특성 분석
```

## 오류 코드

### 주요 오류 코드
| 코드 | 메시지 | 설명 |
|------|--------|------|
| `MCA00000` | 정상처리 되었습니다. | 성공 |
| `MCA00001` | 요청 파라미터가 잘못되었습니다. | 파라미터 확인 필요 |
| `MCA00002` | 인증 실패 | 토큰, appkey, appsecret 확인 |
| `MCA00003` | 권한이 없습니다. | API 사용 권한 확인 |
| `MCA00004` | 초당 거래건수를 초과하였습니다. | Rate Limit 초과 |

## 관련 API

- **[종목조건검색]**: 30건 이상의 데이터가 필요한 경우
- **[거래대금순위]**: `fid_cond_scr_div_code`를 `20171`로 설정
- **[거래급증순위]**: `fid_cond_scr_div_code`를 `20172`로 설정
- **[등락률순위]**: 가격 변동 기준 순위 조회

## 참고 자료

- [한국투자증권 KIS Developers 공식 문서](https://apiportal.koreainvestment.com)
- [API 가이드 문서](https://apiportal.koreainvestment.com/apiservice-apiservice)
- [GitHub - 한국투자증권 Open Trading API](https://github.com/koreainvestment/open-trading-api)
- [커뮤니티 라이브러리 - python-kis](https://github.com/Soju06/python-kis)

## 업데이트 이력

- 2024.03: 초기 문서 작성
- 2024.11: 파라미터 상세 설명 추가, 예제 코드 보완

---

*이 문서는 한국투자증권 OpenAPI의 거래량순위 API를 기반으로 작성되었습니다. 최신 정보는 공식 문서를 참고하시기 바랍니다.*
