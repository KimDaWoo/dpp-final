// scripts/fetch-fundamentals.js
const fs = require('fs');
const path = require('path');

// Alpha Vantage API 키 (사용자가 .env.local 파일에 추가해야 함)
// .env.local 파일 예시: ALPHA_VANTAGE_API_KEY=YOUR_API_KEY
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// 데이터를 가져올 기업 목록 (예: S&P 500의 일부 대표 기업)
const SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
  'TSLA', 'META', 'JPM', 'JNJ', 'V'
];

// 데이터를 저장할 경로
const OUTPUT_PATH = path.resolve(process.cwd(), 'src/lib/data/stock-fundamentals.json');

async function fetchFundamentals(symbol) {
  // 1초에 한 번씩 호출하여 API 제한을 피합니다.
  await new Promise(resolve => setTimeout(resolve, 1000)); 
  
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.Note) {
      console.log(`API 호출 제한 참고: ${data.Note}`);
      return null;
    }
    if (!data.Symbol) {
      console.warn(`경고: ${symbol}에 대한 데이터를 찾을 수 없습니다.`);
      return null;
    }

    console.log(`성공: ${symbol} 데이터 처리 완료.`);
    return data;
  } catch (error) {
    console.error(`에러: ${symbol} 데이터 가져오기 실패`, error);
    return null;
  }
}

async function main() {
  if (!API_KEY) {
    console.error('에러: .env.local 파일에 ALPHA_VANTAGE_API_KEY를 설정해주세요.');
    return;
  }

  const allData = {};
  for (const symbol of SYMBOLS) {
    const fundamentalData = await fetchFundamentals(symbol);
    if (fundamentalData) {
      allData[symbol] = fundamentalData;
    }
  }

  try {
    // src/lib/data 폴더가 없으면 생성
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
    console.log(`\n성공: 펀더멘털 데이터가 ${OUTPUT_PATH}에 저장되었습니다.`);
    console.log('이제 백엔드 API와 프론트엔드 컴포넌트를 수정하여 이 데이터를 활용할 수 있습니다.');
  } catch (error) {
    console.error('에러: 파일 저장 실패', error);
  }
}

main();
