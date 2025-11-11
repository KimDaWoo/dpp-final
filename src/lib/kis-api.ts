import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { loadStocks } from './stock-utils';

// const KIS_BASE_URL = 'https://openapivts.koreainvestment.com:29443'; // 모의투자
const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443'; // 실전투자
const APP_KEY = process.env.KIS_APP_KEY?.trim();
const APP_SECRET = process.env.KIS_APP_SECRET?.trim();

// --- 파일 기반 토큰 캐싱 로직 ---
const TOKEN_CACHE_DIR = path.join(process.cwd(), '.temp');
const TOKEN_CACHE_PATH = path.join(TOKEN_CACHE_DIR, 'kis_token.json');

interface KisToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  token_issued_at: number; // 토큰 발급 시간을 저장 (Unix timestamp, milliseconds)
}

/**
 * KIS API 접근 토큰을 발급받거나 파일에 캐시된 토큰을 반환합니다.
 * @param forceRefresh - true일 경우 캐시를 무시하고 강제로 새 토큰을 발급합니다.
 */
async function getAccessToken(forceRefresh: boolean = false): Promise<string> {
  if (!forceRefresh) {
    try {
      const cachedTokenStr = await fs.readFile(TOKEN_CACHE_PATH, 'utf-8');
      const tokenData: KisToken = JSON.parse(cachedTokenStr);
      const now = Date.now();

      // 만료 10분 전까지만 유효한 것으로 간주
      if (now < tokenData.token_issued_at + (tokenData.expires_in - 600) * 1000) {
        console.log('Using cached KIS access token from file.');
        return tokenData.access_token;
      }
    } catch (error) {
      // 캐시 파일이 없거나 유효하지 않으면 계속 진행
    }
  }

  console.log(forceRefresh ? 'Token expired or force refresh requested. Issuing a new KIS access token...' : 'Issuing a new KIS access token...');
  try {
    const response = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: APP_KEY,
        appsecret: APP_SECRET,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to get KIS access token: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const tokenData = await response.json();
    const newToken: KisToken = { ...tokenData, token_issued_at: Date.now() };

    await fs.mkdir(TOKEN_CACHE_DIR, { recursive: true });
    await fs.writeFile(TOKEN_CACHE_PATH, JSON.stringify(newToken));
    console.log('New KIS access token saved to cache file.');
    
    return newToken.access_token;

  } catch (error) {
    console.error('Error getting KIS access token:', error);
    throw new Error('Could not retrieve KIS access token.');
  }
}

/**
 * 국내 주식의 현재 시세 정보를 조회합니다.
 */
export async function getStockDetails(symbol: string) {
  if (!APP_KEY || !APP_SECRET) {
    throw new Error('KIS_APP_KEY and KIS_APP_SECRET must be set in .env.local');
  }

  let accessToken = await getAccessToken();

  const doFetch = async (token: string) => {
    const url = new URL('/uapi/domestic-stock/v1/quotations/inquire-price', KIS_BASE_URL);
    url.searchParams.append('fid_cond_mrkt_div_code', 'J');
    url.searchParams.append('fid_input_iscd', symbol);

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
      'appkey': APP_KEY,
      'appsecret': APP_SECRET,
      'tr_id': 'FHKST01010100',
    };
    
    const response = await fetch(url.toString(), { method: 'GET', headers });
    const responseText = await response.text();
    // console.log('--- KIS Stock Details API Response ---', response.status, responseText);
    // 에러를 던지는 대신, 파싱된 데이터를 반환하여 호출자가 처리하도록 함
    return JSON.parse(responseText);
  };

  try {
    let data = await doFetch(accessToken);

    // 토큰 만료 시 1회 재시도
    if (data.rt_cd === '1' && data.msg_cd === 'EGW00123') {
      console.log('Access token expired. Retrying...');
      accessToken = await getAccessToken(true); // 강제 재발급
      data = await doFetch(accessToken); // 재시도
    }

    if (data.rt_cd !== '0') {
      throw new Error(`KIS API Error: ${data.msg1} (msg_cd: ${data.msg_cd})`);
    }

    return data.output;
  } catch (error) {
    console.error(`Error fetching stock details for ${symbol}:`, error);
    throw error;
  }
}

/**
 * 국내 주식의 기간별 시세(일봉)를 조회합니다.
 */
export async function getStockPriceHistory(symbol: string, days: number = 365) {
  if (!APP_KEY || !APP_SECRET) {
    throw new Error('KIS_APP_KEY and KIS_APP_SECRET must be set in .env.local');
  }

  let accessToken = await getAccessToken();

  const doFetch = async (token: string) => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    const formatDate = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '');
    
    const url = new URL('/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice', KIS_BASE_URL);
    url.searchParams.append('fid_cond_mrkt_div_code', 'J');
    url.searchParams.append('fid_input_iscd', symbol);
    url.searchParams.append('fid_input_date_1', formatDate(startDate));
    url.searchParams.append('fid_input_date_2', formatDate(today));
    url.searchParams.append('fid_period_div_code', 'D');
    url.searchParams.append('fid_org_adj_prc', '1');

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
      'appkey': APP_KEY,
      'appsecret': APP_SECRET,
      'tr_id': 'FHKST03010100',
    };

    const response = await fetch(url.toString(), { method: 'GET', headers });
    const responseText = await response.text();
    // console.log('--- KIS Price History API Response ---', response.status, responseText);
    // 에러를 던지는 대신, 파싱된 데이터를 반환하여 호출자가 처리하도록 함
    return JSON.parse(responseText);
  };

  try {
    let data = await doFetch(accessToken);

    // 토큰 만료 시 1회 재시도
    if (data.rt_cd === '1' && data.msg_cd === 'EGW00123') {
      console.log('Access token expired. Retrying...');
      accessToken = await getAccessToken(true); // 강제 재발급
      data = await doFetch(accessToken); // 재시도
    }

    if (data.rt_cd !== '0') {
      throw new Error(`KIS API Error for price history: ${data.msg1}`);
    }

    return data.output2 || []; // Ensure an array is always returned
  } catch (error) {
    console.error(`Error fetching stock price history for ${symbol}:`, error);
    throw error;
  }
}

/**
 * KIS API를 사용하여 거래량 순위 상위 종목을 조회하고, 각 종목에 소속 시장(exchange) 정보를 추가합니다.
 * @returns 거래량 순위 종목 배열 (exchange 정보 포함)
 */
export async function getVolumeRank() {
  if (!APP_KEY || !APP_SECRET) {
    throw new Error('KIS_APP_KEY and KIS_APP_SECRET must be set in .env.local');
  }

  // 먼저 로컬 주식 목록을 로드하여 심볼-거래소 매핑을 생성합니다.
  const allStocks = await loadStocks();
  const stockMap = new Map(allStocks.map(stock => [stock.symbol, stock]));

  let accessToken = await getAccessToken();

  const doFetch = async (token: string) => {
    const url = new URL('/uapi/domestic-stock/v1/quotations/volume-rank', KIS_BASE_URL);
    
    const params = new URLSearchParams({
      'fid_cond_mrkt_div_code': 'J',
      'fid_cond_scr_div_code': '20170',
      'fid_input_iscd': '0000',
      'fid_div_cls_code': '0',
      'FID_BLNG_CLS_CODE': '0',
      'fid_trgt_cls_code': '111111111',
      'fid_trgt_exls_cls_code': '0000000000',
      'fid_input_price_1': '',
      'fid_input_price_2': '',
      'fid_vol_cnt': '',
      'FID_INPUT_DATE_1': '',
    });

    url.search = params.toString();

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
      'appkey': APP_KEY,
      'appsecret': APP_SECRET,
      'tr_id': 'FHPST01710000',
    };
    
    const response = await fetch(url.toString(), { method: 'GET', headers });
    const responseText = await response.text();
    return JSON.parse(responseText);
  };

  try {
    let data = await doFetch(accessToken);

    if (data.rt_cd === '1' && data.msg_cd === 'EGW00123') {
      accessToken = await getAccessToken(true);
      data = await doFetch(accessToken);
    }

    if (data.rt_cd !== '0') {
      console.error(`KIS API Error for volume rank: ${data.msg1} (msg_cd: ${data.msg_cd})`);
      return [];
    }

    // KIS API 응답에 exchange 정보를 추가합니다.
    const enrichedOutput = (data.output || []).map((item: any) => {
      const stockInfo = stockMap.get(item.mksc_shrn_iscd);
      return {
        ...item,
        exchange: stockInfo ? stockInfo.exchange : 'Unknown',
      };
    });

    return enrichedOutput;
  } catch (error) {
    console.error('Error fetching volume rank:', error);
    return [];
  }
}


// 해외 주식 상세 정보 (종목, ETF)

// 기능 제거됨



// 기능 제거됨


