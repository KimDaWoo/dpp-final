# 한국투자증권 오픈 API - 금리 종합(국내채권/금리) 조회

## 1. API 개요

### 기본 정보
| 항목 | 내용 |
|------|------|
| **API 명칭** | 금리 종합(국내채권_금리) |
| **API ID** | 국내주식-155 |
| **메뉴 위치** | [국내주식] 업종/기타 |
| **통신 방식** | REST |
| **HTTP Method** | GET |
| **실전 TR ID** | FHPST07020000 |
| **모의 TR ID** | 모의투자 미지원 |

### API 설명
- 금리 종합(국내채권/금리) API입니다.
- 한국투자 HTS(eFriend Plus) > [0702] 금리 종합 화면의 기능을 API로 개발한 사항으로, 해당 화면을 참고하시면 기능을 이해하기 쉽습니다.
- **주의사항**: 11:30 이후에 신규데이터가 수신되는 점 참고하시기 바랍니다.

### API 엔드포인트
| 구분 | URL |
|------|-----|
| **실전 도메인** | `https://openapi.koreainvestment.com:9443` |
| **모의 도메인** | 모의투자 미지원 |
| **URL 경로** | `/uapi/domestic-stock/v1/quotations/comp-interest` |

## 2. 사전 준비사항

### 2.1 필수 요구사항
1. 한국투자증권 계좌 개설
2. KIS Developers 서비스 신청 완료
3. App Key 및 App Secret 발급
4. OAuth 접근토큰(Access Token) 발급

### 2.2 접근토큰 발급 방법
```python
import requests
import json

def get_access_token(app_key, app_secret):
    """
    OAuth 접근토큰 발급 함수
    
    Parameters:
        app_key (str): 한국투자증권에서 발급받은 앱키
        app_secret (str): 한국투자증권에서 발급받은 앱시크릿
    
    Returns:
        str: 접근토큰
    """
    url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
    
    headers = {
        "content-type": "application/json"
    }
    
    body = {
        "grant_type": "client_credentials",
        "appkey": app_key,
        "appsecret": app_secret
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(body))
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"토큰 발급 실패: {response.text}")
```

## 3. Request (요청)

### 3.1 Request Headers
| Header 명 | 한글명 | Type | 필수 | 길이 | 설명 |
|-----------|--------|------|------|------|------|
| `content-type` | 컨텐츠타입 | string | Y | 40 | `application/json; charset=utf-8` |
| `authorization` | 접근토큰 | string | Y | 350 | Bearer {ACCESS_TOKEN}<br>- 일반고객: 유효기간 1일<br>- 법인: 유효기간 3개월 |
| `appkey` | 앱키 | string | Y | 36 | 한국투자증권에서 발급받은 appkey |
| `appsecret` | 앱시크릿키 | string | Y | 180 | 한국투자증권에서 발급받은 appsecret |
| `personalseckey` | 고객식별키 | string | N | 180 | [법인 필수] 제휴사 회원 관리를 위한 고객식별키 |
| `tr_id` | 거래ID | string | Y | 13 | `FHPST07020000` |
| `tr_cont` | 연속 거래 여부 | string | N | 1 | tr_cont를 이용한 다음조회 불가 API |
| `custtype` | 고객 타입 | string | Y | 1 | B: 법인<br>P: 개인 |
| `seq_no` | 일련번호 | string | N | 2 | [법인 필수] 001 |
| `mac_address` | 맥주소 | string | N | 12 | 법인/개인 고객의 Mac address 값 |
| `phone_number` | 핸드폰번호 | string | N | 12 | [법인 필수] 사용자 핸드폰번호 (하이픈 제거) |
| `ip_addr` | 접속 단말 공인 IP | string | N | 12 | [법인 필수] 사용자의 IP Address |
| `gt_uid` | Global UID | string | N | 32 | [법인 전용] 거래고유번호 (거래별 UNIQUE) |

### 3.2 Request Query Parameters
| Parameter | 한글명 | Type | 필수 | 길이 | 설명 |
|-----------|--------|------|------|------|------|
| `FID_COND_MRKT_DIV_CODE` | 조건시장분류코드 | string | Y | 2 | Unique key(I) |
| `FID_COND_SCR_DIV_CODE` | 조건화면분류코드 | string | Y | 5 | Unique key(20702) |
| `FID_DIV_CLS_CODE` | 분류구분코드 | string | Y | 2 | 1: 해외금리지표 |
| `FID_DIV_CLS_CODE1` | 분류구분코드 | string | Y | 2 | 공백: 전체 |

### 3.3 Request 예제

#### cURL 예제
```bash
curl -X GET "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/comp-interest?\
FID_COND_MRKT_DIV_CODE=I&\
FID_COND_SCR_DIV_CODE=20702&\
FID_DIV_CLS_CODE=1&\
FID_DIV_CLS_CODE1=" \
  -H "content-type: application/json; charset=utf-8" \
  -H "authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "appkey: YOUR_APP_KEY" \
  -H "appsecret: YOUR_APP_SECRET" \
  -H "tr_id: FHPST07020000" \
  -H "custtype: P"
```

#### Python 예제
```python
import requests

def get_interest_rates(access_token, app_key, app_secret):
    """
    금리 종합 정보 조회 함수
    
    Parameters:
        access_token (str): OAuth 접근 토큰
        app_key (str): 앱키
        app_secret (str): 앱시크릿
    
    Returns:
        dict: 금리 정보 응답 데이터
    """
    # API 엔드포인트
    url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/comp-interest"
    
    # 헤더 설정
    headers = {
        "content-type": "application/json; charset=utf-8",
        "authorization": f"Bearer {access_token}",
        "appkey": app_key,
        "appsecret": app_secret,
        "tr_id": "FHPST07020000",
        "custtype": "P"  # 개인
    }
    
    # 쿼리 파라미터
    params = {
        "FID_COND_MRKT_DIV_CODE": "I",
        "FID_COND_SCR_DIV_CODE": "20702",
        "FID_DIV_CLS_CODE": "1",
        "FID_DIV_CLS_CODE1": ""
    }
    
    # API 호출
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API 호출 실패: {response.status_code}, {response.text}")
```

## 4. Response (응답)

### 4.1 Response Headers
| Header 명 | 한글명 | Type | 필수 | 길이 | 설명 |
|-----------|--------|------|------|------|------|
| `content-type` | 컨텐츠타입 | string | Y | 40 | `application/json; charset=utf-8` |
| `tr_id` | 거래ID | string | Y | 13 | 요청한 tr_id |
| `tr_cont` | 연속 거래 여부 | string | N | 1 | tr_cont를 이용한 다음조회 불가 API |
| `gt_uid` | Global UID | string | N | 32 | [법인 전용] 거래고유번호 |

### 4.2 Response Body - 기본 응답
| Field 명 | 한글명 | Type | 필수 | 설명 |
|---------|--------|------|------|------|
| `rt_cd` | 성공 실패 여부 | string | Y | 0: 성공, 0 이외: 실패 |
| `msg_cd` | 응답코드 | string | Y | 응답코드 |
| `msg1` | 응답메세지 | string | Y | 응답메세지 |
| `output1` | 응답상세1 | object array | Y | 국내 금리 데이터 배열 |
| `output2` | 응답상세2 | object array | Y | 해외 금리 데이터 배열 |

### 4.3 Response Body - output1 (국내 금리)
| Field 명 | 한글명 | Type | 필수 | 길이 | 설명 |
|---------|--------|------|------|------|------|
| `bcdt_code` | 자료코드 | string | Y | 5 | 금리 구분 코드 |
| `hts_kor_isnm` | HTS한글종목명 | string | Y | 40 | 금리 종목명 (예: 국고채 3년) |
| `bond_mnrt_prpr` | 채권금리현재가 | string | Y | 114 | 현재 금리 (%) |
| `prdy_vrss_sign` | 전일대비부호 | string | Y | 1 | 1: 상한, 2: 상승, 3: 보합, 4: 하한, 5: 하락 |
| `bond_mnrt_prdy_vrss` | 채권금리전일대비 | string | Y | 114 | 전일 대비 변동폭 |
| `prdy_ctrt` | 전일대비율 | string | Y | 82 | 전일 대비 변동률 (%) |
| `stck_bsop_date` | 주식영업일자 | string | Y | 8 | 데이터 기준일자 (YYYYMMDD) |

### 4.4 Response Body - output2 (해외 금리)
| Field 명 | 한글명 | Type | 필수 | 길이 | 설명 |
|---------|--------|------|------|------|------|
| `bcdt_code` | 자료코드 | string | Y | 5 | 금리 구분 코드 |
| `hts_kor_isnm` | HTS한글종목명 | string | Y | 40 | 금리 종목명 (예: 美 10년물) |
| `bond_mnrt_prpr` | 채권금리현재가 | string | Y | 114 | 현재 금리 (%) |
| `prdy_vrss_sign` | 전일대비부호 | string | Y | 1 | 1: 상한, 2: 상승, 3: 보합, 4: 하한, 5: 하락 |
| `bond_mnrt_prdy_vrss` | 채권금리전일대비 | string | Y | 114 | 전일 대비 변동폭 |
| `bstp_nmix_prdy_ctrt` | 업종지수전일대비율 | string | Y | 82 | 전일 대비 변동률 (%) |
| `stck_bsop_date` | 주식영업일자 | string | Y | 8 | 데이터 기준일자 (YYYYMMDD) |

### 4.5 Response 예제
```json
{
    "rt_cd": "0",
    "msg_cd": "MCA00000",
    "msg1": "정상처리 되었습니다.",
    "output1": [
        {
            "bcdt_code": "00001",
            "hts_kor_isnm": "국고채 3년",
            "bond_mnrt_prpr": "3.245",
            "prdy_vrss_sign": "5",
            "bond_mnrt_prdy_vrss": "-0.015",
            "prdy_ctrt": "-0.46",
            "stck_bsop_date": "20241111"
        },
        {
            "bcdt_code": "00002",
            "hts_kor_isnm": "국고채 5년",
            "bond_mnrt_prpr": "3.301",
            "prdy_vrss_sign": "5",
            "bond_mnrt_prdy_vrss": "-0.012",
            "prdy_ctrt": "-0.36",
            "stck_bsop_date": "20241111"
        },
        {
            "bcdt_code": "00003",
            "hts_kor_isnm": "국고채 10년",
            "bond_mnrt_prpr": "3.425",
            "prdy_vrss_sign": "2",
            "bond_mnrt_prdy_vrss": "0.008",
            "prdy_ctrt": "0.23",
            "stck_bsop_date": "20241111"
        }
    ],
    "output2": [
        {
            "bcdt_code": "10001",
            "hts_kor_isnm": "美 10년물",
            "bond_mnrt_prpr": "4.432",
            "prdy_vrss_sign": "2",
            "bond_mnrt_prdy_vrss": "0.025",
            "bstp_nmix_prdy_ctrt": "0.57",
            "stck_bsop_date": "20241111"
        },
        {
            "bcdt_code": "10002",
            "hts_kor_isnm": "美 2년물",
            "bond_mnrt_prpr": "4.265",
            "prdy_vrss_sign": "2",
            "bond_mnrt_prdy_vrss": "0.018",
            "bstp_nmix_prdy_ctrt": "0.42",
            "stck_bsop_date": "20241111"
        }
    ]
}
```

## 5. 에러 처리

### 5.1 공통 에러 코드
| 에러코드 | 설명 | 해결방법 |
|---------|------|----------|
| MCA00000 | 정상처리 | - |
| MCA00001 | 요청 파라미터 오류 | 필수 파라미터 확인 |
| MCA00002 | 인증 실패 | 토큰 및 키 확인 |
| MCA00003 | 접근 권한 없음 | API 사용 권한 확인 |
| MCA00004 | 시스템 오류 | 잠시 후 재시도 |

### 5.2 에러 응답 예제
```json
{
    "rt_cd": "1",
    "msg_cd": "MCA00002",
    "msg1": "인증에 실패하였습니다.",
    "output1": null,
    "output2": null
}
```

## 6. 활용 예제

### 6.1 전체 코드 예제
```python
import requests
import pandas as pd
import json
from datetime import datetime

class KoreaInvestmentAPI:
    def __init__(self, app_key, app_secret):
        """
        한국투자증권 API 클라이언트 초기화
        
        Parameters:
            app_key (str): 앱키
            app_secret (str): 앱시크릿
        """
        self.app_key = app_key
        self.app_secret = app_secret
        self.access_token = None
        self.base_url = "https://openapi.koreainvestment.com:9443"
        
    def get_access_token(self):
        """OAuth 접근토큰 발급"""
        url = f"{self.base_url}/oauth2/tokenP"
        
        headers = {
            "content-type": "application/json"
        }
        
        body = {
            "grant_type": "client_credentials",
            "appkey": self.app_key,
            "appsecret": self.app_secret
        }
        
        response = requests.post(url, headers=headers, data=json.dumps(body))
        
        if response.status_code == 200:
            self.access_token = response.json()["access_token"]
            print("토큰 발급 성공")
            return self.access_token
        else:
            raise Exception(f"토큰 발급 실패: {response.text}")
    
    def get_interest_rates(self):
        """금리 종합 정보 조회"""
        if not self.access_token:
            self.get_access_token()
            
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/comp-interest"
        
        headers = {
            "content-type": "application/json; charset=utf-8",
            "authorization": f"Bearer {self.access_token}",
            "appkey": self.app_key,
            "appsecret": self.app_secret,
            "tr_id": "FHPST07020000",
            "custtype": "P"
        }
        
        params = {
            "FID_COND_MRKT_DIV_CODE": "I",
            "FID_COND_SCR_DIV_CODE": "20702",
            "FID_DIV_CLS_CODE": "1",
            "FID_DIV_CLS_CODE1": ""
        }
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API 호출 실패: {response.status_code}, {response.text}")
    
    def print_interest_rates(self):
        """금리 정보를 표 형태로 출력"""
        try:
            data = self.get_interest_rates()
            
            if data['rt_cd'] == '0':
                print("\n=== 국내 금리 ===")
                if data.get('output1'):
                    df_domestic = pd.DataFrame(data['output1'])
                    print(df_domestic[['hts_kor_isnm', 'bond_mnrt_prpr', 
                                      'bond_mnrt_prdy_vrss', 'prdy_ctrt']].to_string())
                
                print("\n=== 해외 금리 ===")
                if data.get('output2'):
                    df_foreign = pd.DataFrame(data['output2'])
                    print(df_foreign[['hts_kor_isnm', 'bond_mnrt_prpr', 
                                     'bond_mnrt_prdy_vrss', 'bstp_nmix_prdy_ctrt']].to_string())
                
                print(f"\n기준일자: {data['output1'][0]['stck_bsop_date']}")
            else:
                print(f"에러: {data['msg1']}")
                
        except Exception as e:
            print(f"오류 발생: {str(e)}")

# 사용 예제
if __name__ == "__main__":
    # API 키 설정 (실제 사용시 본인의 키로 변경)
    APP_KEY = "YOUR_APP_KEY"
    APP_SECRET = "YOUR_APP_SECRET"
    
    # API 클라이언트 생성
    api = KoreaInvestmentAPI(APP_KEY, APP_SECRET)
    
    # 금리 정보 조회 및 출력
    api.print_interest_rates()
```

### 6.2 데이터 가공 예제
```python
def process_interest_data(api_response):
    """
    API 응답 데이터를 가공하여 분석용 DataFrame 생성
    
    Parameters:
        api_response (dict): API 응답 데이터
    
    Returns:
        tuple: (국내금리 DataFrame, 해외금리 DataFrame)
    """
    # 국내 금리 데이터 처리
    df_domestic = pd.DataFrame(api_response['output1'])
    df_domestic['bond_mnrt_prpr'] = df_domestic['bond_mnrt_prpr'].astype(float)
    df_domestic['bond_mnrt_prdy_vrss'] = df_domestic['bond_mnrt_prdy_vrss'].astype(float)
    df_domestic['prdy_ctrt'] = df_domestic['prdy_ctrt'].astype(float)
    df_domestic['market'] = '국내'
    
    # 해외 금리 데이터 처리
    df_foreign = pd.DataFrame(api_response['output2'])
    df_foreign['bond_mnrt_prpr'] = df_foreign['bond_mnrt_prpr'].astype(float)
    df_foreign['bond_mnrt_prdy_vrss'] = df_foreign['bond_mnrt_prdy_vrss'].astype(float)
    df_foreign['bstp_nmix_prdy_ctrt'] = df_foreign['bstp_nmix_prdy_ctrt'].astype(float)
    df_foreign['market'] = '해외'
    
    return df_domestic, df_foreign
```

## 7. 주의사항

1. **데이터 업데이트 시간**: 11:30 이후에 신규 데이터가 수신됩니다.
2. **모의투자 미지원**: 이 API는 실전투자 환경에서만 사용 가능합니다.
3. **Rate Limit**: API 호출 제한이 있을 수 있으므로, 과도한 호출은 피하시기 바랍니다.
4. **보안 주의**: App Key와 App Secret은 절대 노출되지 않도록 주의하세요.
5. **토큰 유효기간**: 
   - 개인: Access token 유효기간 1일
   - 법인: Access token 유효기간 3개월, Refresh token 유효기간 1년

## 8. 참고 자료

- [한국투자증권 KIS Developers](https://apiportal.koreainvestment.com)
- [API 문서](https://apiportal.koreainvestment.com/apiservice/apiservice-domestic-stock)
- HTS 참고 화면: eFriend Plus > [0702] 금리 종합

## 9. 문의사항

API 관련 문의사항은 한국투자증권 KIS Developers 고객센터를 이용하시기 바랍니다.

---

*이 문서는 한국투자증권 오픈 API 공식 문서를 기반으로 작성되었습니다.*
*최종 업데이트: 2024년 11월*