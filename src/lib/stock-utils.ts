import path from 'path';
import fs from 'fs/promises';
import Papa from 'papaparse';

export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  exchange: 'KOSPI' | 'KOSDAQ' | 'KONEX' | 'ELW';
  realtimeSymbol: string;
}

let cachedStocks: StockInfo[] | null = null;

const processCsvData = (rows: string[][], exchange: StockInfo['exchange']): StockInfo[] => {
  if (rows.length < 2) return []; // Header + at least one data row

  const header = rows[0];
  const dataRows = rows.slice(1);

  const symbolHeader = '단축코드';
  const symbolIndex = header.indexOf(symbolHeader);
  
  // Find the name column by checking for possible header names
  let nameIndex = header.indexOf('한글명');
  if (nameIndex === -1) {
    nameIndex = header.indexOf('한글종목명');
  }

  const sectorIndex = header.indexOf('지수업종대분류');

  if (nameIndex === -1 || symbolIndex === -1) {
    console.error(`Required headers ('한글명' or '한글종목명', and '${symbolHeader}') not found in ${exchange} CSV. Headers found:`, header);
    return [];
  }

  return processCsvDataWithIndices(dataRows, exchange, symbolIndex, nameIndex, sectorIndex);
};

const processCsvDataWithIndices = (
  dataRows: string[][],
  exchange: StockInfo['exchange'],
  symbolIndex: number,
  nameIndex: number,
  sectorIndex: number
): StockInfo[] => {
  return dataRows
    .map(row => {
      const symbol = row[symbolIndex];
      const name = row[nameIndex];
      if (!symbol || !name) return null;

      return {
        symbol,
        name,
        exchange,
        sector: row[sectorIndex] || 'N/A',
        realtimeSymbol: symbol,
      };
    })
    .filter((s): s is StockInfo => s !== null) as StockInfo[];
}

export async function loadStocks(): Promise<StockInfo[]> {
  if (cachedStocks) {
    return cachedStocks;
  }

  const dataDirectory = path.join(process.cwd(), 'src', 'lib', 'data');
  const filesToLoad = [
    { name: 'kospi_code.csv', exchange: 'KOSPI' as const },
    { name: 'kosdaq_code.csv', exchange: 'KOSDAQ' as const },
    { name: 'konex_code.csv', exchange: 'KONEX' as const },
    { name: 'elw_code.csv', exchange: 'ELW' as const },
  ];

  const fileContents = await Promise.all(
    filesToLoad.map(file => 
      fs.readFile(path.join(dataDirectory, file.name), 'utf-8')
        .catch(err => {
          console.warn(`Warning: Could not read file ${file.name}. It will be skipped.`, err.message);
          return null; // Return null if a file is missing
        })
    )
  );

  const allStocks = filesToLoad.flatMap((file, index) => {
    const content = fileContents[index];
    if (!content) return []; // Skip missing files

    const parseResult: any = Papa.parse(content, { skip_empty_lines: true, bom: true } as any);
    return processCsvData(parseResult.data as string[][], file.exchange);
  });

  // Deduplicate stocks based on the symbol to prevent issues with duplicate entries
  const uniqueStocks = new Map<string, StockInfo>();
  allStocks.forEach(stock => {
    if (!uniqueStocks.has(stock.symbol)) {
      uniqueStocks.set(stock.symbol, stock);
    }
  });

  cachedStocks = Array.from(uniqueStocks.values());
  console.log(`Loaded and cached ${cachedStocks.length} unique domestic stocks from KOSPI, KOSDAQ, KONEX, and ELW.`);
  return cachedStocks;
}

export async function findStockInCsv(symbol: string, exchange?: string | null): Promise<StockInfo | null> {
  const stocks = await loadStocks();
  // exchange 정보가 있으면 더 정확하게 검색
  if (exchange) {
    return stocks.find(stock => stock.symbol === symbol && stock.exchange === exchange) || null;
  }
  return stocks.find(stock => stock.symbol === symbol) || null;
}