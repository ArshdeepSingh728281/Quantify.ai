// import { NextResponse } from "next/server";

// /* =========================================================
//    TYPES
// ========================================================= */

// type UpstoxInstrument = {
//   name?: string;
//   segment?: string;
//   exchange?: string;
//   instrument_key?: string;
//   trading_symbol?: string;
//   short_name?: string;
//   instrument_type?: string;
// };

// type UpstoxInstrumentResponse = {
//   status?: string;
//   data?: UpstoxInstrument[];
//   meta_data?: unknown;
// };

// type UpstoxCandleResponse = {
//   status?: string;

//   data?: {
//     candles?: unknown[][];
//   };

//   errors?: unknown;
// };

// type UpstoxLtpResponse = {
//   status?: string;

//   data?: Record<
//     string,
//     {
//       last_price?: number;
//       ltp?: number;
//       cp?: number;
//       close_price?: number;
//       volume?: number;
//     }
//   >;

//   errors?: unknown;
// };

// type ChartCandle = {
//   time: string;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume: number;
// };

// type StockQuote = {
//   price: number | null;
//   change: number | null;
//   changePercent: number | null;
//   previousClose: number | null;
//   open: number | null;
//   high: number | null;
//   low: number | null;
//   close: number | null;
//   volume: number | null;
//   averagePrice: number | null;
// };

// type Range =
//   | "1D"
//   | "5D"
//   | "1M"
//   | "3M"
//   | "6M"
//   | "YTD"
//   | "1Y"
//   | "5Y"
//   | "All";

// type CandleInterval = {
//   unit:
//     | "minutes"
//     | "hours"
//     | "days"
//     | "weeks";

//   interval: number;

//   label: string;
// };

// /* =========================================================
//    RANGE → TIMEFRAME
// ========================================================= */

// const RANGE_INTERVALS: Record<
//   Range,
//   CandleInterval[]
// > = {
//   "1D": [
//     {
//       unit: "minutes",
//       interval: 1,
//       label: "1m",
//     },
//     {
//       unit: "minutes",
//       interval: 5,
//       label: "5m",
//     },
//     {
//       unit: "hours",
//       interval: 1,
//       label: "1h",
//     },
//     {
//       unit: "hours",
//       interval: 2,
//       label: "2h",
//     },
//     {
//       unit: "days",
//       interval: 1,
//       label: "1d",
//     },
//     {
//       unit: "weeks",
//       interval: 1,
//       label: "1w",
//     },
//   ],

//   "5D": [
//     {
//       unit: "minutes",
//       interval: 5,
//       label: "5m",
//     },
//     {
//       unit: "hours",
//       interval: 1,
//       label: "1h",
//     },
//     {
//       unit: "hours",
//       interval: 2,
//       label: "2h",
//     },
//     {
//       unit: "days",
//       interval: 1,
//       label: "1d",
//     },
//     {
//       unit: "weeks",
//       interval: 1,
//       label: "1w",
//     },
//   ],

//   "1M": [
//     {
//       unit: "minutes",
//       interval: 30,
//       label: "30m",
//     },
//     {
//       unit: "hours",
//       interval: 1,
//       label: "1h",
//     },
//     {
//       unit: "hours",
//       interval: 2,
//       label: "2h",
//     },
//     {
//       unit: "days",
//       interval: 1,
//       label: "1d",
//     },
//     {
//       unit: "weeks",
//       interval: 1,
//       label: "1w",
//     },
//   ],

//   "3M": [
//     {
//       unit: "hours",
//       interval: 1,
//       label: "1h",
//     },
//     {
//       unit: "hours",
//       interval: 2,
//       label: "2h",
//     },
//     {
//       unit: "days",
//       interval: 1,
//       label: "1d",
//     },
//     {
//       unit: "weeks",
//       interval: 1,
//       label: "1w",
//     },
//   ],

//   "6M": [
//     {
//       unit: "hours",
//       interval: 2,
//       label: "2h",
//     },
//     {
//       unit: "days",
//       interval: 1,
//       label: "1d",
//     },
//     {
//       unit: "weeks",
//       interval: 1,
//       label: "1w",
//     },
//   ],

//   YTD: [
//     {
//       unit: "weeks",
//       interval: 1,
//       label: "1w",
//     },
//     {
//       unit: "days",
//       interval: 1,
//       label: "1d",
//     },
//   ],

//   "1Y": [
//     {
//       unit: "weeks",
//       interval: 1,
//       label: "1w",
//     },
//     {
//       unit: "days",
//       interval: 1,
//       label: "1d",
//     },
//   ],

//   "5Y": [
//     {
//       unit: "weeks",
//       interval: 1,
//       label: "1w",
//     },
//     {
//       unit: "days",
//       interval: 1,
//       label: "1d",
//     },
//   ],

//   All: [
//     {
//       unit: "days",
//       interval: 1,
//       label: "1d",
//     },
//     {
//       unit: "weeks",
//       interval: 1,
//       label: "1w",
//     },
//   ],
// };

// /* =========================================================
//    SYMBOL
// ========================================================= */

// function cleanSymbol(
//   symbol: string
// ) {
//   return decodeURIComponent(symbol)
//     .replace(/^NSE:/i, "")
//     .trim()
//     .toUpperCase();
// }

// /* =========================================================
//    INSTRUMENT KEY VALIDATION
// ========================================================= */

// function isValidInstrumentKey(
//   key: string
// ) {
//   return (
//     key.startsWith("NSE_EQ|") ||
//     key.startsWith("NSE_INDEX|")
//   );
// }

// /* =========================================================
//    IST DATE
// ========================================================= */

// function getISTDate() {
//   const formatter =
//     new Intl.DateTimeFormat(
//       "en-CA",
//       {
//         timeZone:
//           "Asia/Kolkata",

//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//       }
//     );

//   return formatter.format(
//     new Date()
//   );
// }

// function parseISTDate(
//   dateString: string
// ) {
//   return new Date(
//     `${dateString}T00:00:00+05:30`
//   );
// }

// function formatISTDate(
//   date: Date
// ) {
//   return date.toLocaleDateString(
//     "en-CA",
//     {
//       timeZone:
//         "Asia/Kolkata",

//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     }
//   );
// }

// function addDays(
//   dateString: string,
//   days: number
// ) {
//   const date =
//     parseISTDate(
//       dateString
//     );

//   date.setDate(
//     date.getDate() + days
//   );

//   return formatISTDate(
//     date
//   );
// }

// /* =========================================================
//    RANGE START
// ========================================================= */

// function getFromDate(
//   range: Range,
//   toDate: string
// ) {
//   const date =
//     parseISTDate(
//       toDate
//     );

//   switch (range) {
//     case "1D":
//       return toDate;

//     case "5D":
//       date.setDate(
//         date.getDate() - 7
//       );
//       break;

//     case "1M":
//       date.setMonth(
//         date.getMonth() - 1
//       );
//       break;

//     case "3M":
//       date.setMonth(
//         date.getMonth() - 3
//       );
//       break;

//     case "6M":
//       date.setMonth(
//         date.getMonth() - 6
//       );
//       break;

//     case "YTD":
//       date.setMonth(0);
//       date.setDate(1);
//       break;

//     case "1Y":
//       date.setFullYear(
//         date.getFullYear() - 1
//       );
//       break;

//     case "5Y":
//       date.setFullYear(
//         date.getFullYear() - 5
//       );
//       break;

//     case "All":
//       date.setFullYear(
//         date.getFullYear() - 20
//       );
//       break;
//   }

//   return formatISTDate(
//     date
//   );
// }

// /* =========================================================
//    MARKET STATUS
// ========================================================= */

// function isMarketOpen() {
//   const formatter =
//     new Intl.DateTimeFormat(
//       "en-IN",
//       {
//         timeZone:
//           "Asia/Kolkata",

//         weekday: "short",

//         hour: "2-digit",

//         minute: "2-digit",

//         hour12: false,
//       }
//     );

//   const parts =
//     formatter.formatToParts(
//       new Date()
//     );

//   const get = (
//     type: string
//   ) =>
//     parts.find(
//       part =>
//         part.type === type
//     )?.value || "";

//   const weekday =
//     get("weekday");

//   const hour =
//     Number(
//       get("hour")
//     );

//   const minute =
//     Number(
//       get("minute")
//     );

//   if (
//     ![
//       "Mon",
//       "Tue",
//       "Wed",
//       "Thu",
//       "Fri",
//     ].includes(
//       weekday
//     )
//   ) {
//     return false;
//   }

//   const current =
//     hour * 60 + minute;

//   return (
//     current >=
//       9 * 60 + 15 &&
//     current <=
//       15 * 60 + 30
//   );
// }

// /* =========================================================
//    FIND INSTRUMENT
// ========================================================= */

// async function findInstrument(
//   symbol: string,
//   accessToken: string
// ) {
//   /*
//    * IMPORTANT:
//    *
//    * Search INDEX first.
//    *
//    * This prevents:
//    *
//    * NIFTY
//    *   ↓
//    * NIFTYBEES
//    *
//    * when the user directly opens /stock/NIFTY.
//    */

//   const search = async (
//     segment: "INDEX" | "EQ"
//   ) => {
//     const url =
//       new URL(
//         "https://api.upstox.com/v2/instruments/search"
//       );

//     url.searchParams.set(
//       "query",
//       symbol
//     );

//     url.searchParams.set(
//       "exchanges",
//       "NSE"
//     );

//     url.searchParams.set(
//       "segments",
//       segment
//     );

//     url.searchParams.set(
//       "page_number",
//       "1"
//     );

//     url.searchParams.set(
//       "records",
//       "30"
//     );

//     const response =
//       await fetch(
//         url.toString(),
//         {
//           method: "GET",

//           headers: {
//             Accept:
//               "application/json",

//             Authorization:
//               `Bearer ${accessToken}`,
//           },

//           cache: "no-store",
//         }
//       );

//     const text =
//       await response.text();

//     let data:
//       | UpstoxInstrumentResponse
//       | null = null;

//     try {
//       data =
//         JSON.parse(
//           text
//         );
//     } catch {
//       return [];
//     }

//     if (!response.ok) {
//       return [];
//     }

//     return data?.data || [];
//   };

//   /*
//    * INDEX FIRST
//    */

//   const indexResults =
//     await search(
//       "INDEX"
//     );

//   const exactIndex =
//     indexResults.find(
//       instrument =>
//         instrument.trading_symbol
//           ?.toUpperCase() ===
//           symbol ||
//         instrument.name
//           ?.toUpperCase() ===
//           symbol
//     );

//   if (
//     exactIndex?.instrument_key
//   ) {
//     return exactIndex;
//   }

//   /*
//    * EQUITY SECOND
//    */

//   const equityResults =
//     await search(
//       "EQ"
//     );

//   const exactEquity =
//     equityResults.find(
//       instrument =>
//         instrument.trading_symbol
//           ?.toUpperCase() ===
//         symbol
//     );

//   if (
//     exactEquity?.instrument_key
//   ) {
//     return exactEquity;
//   }

//   const shortName =
//     equityResults.find(
//       instrument =>
//         instrument.short_name
//           ?.toUpperCase() ===
//         symbol
//     );

//   if (
//     shortName?.instrument_key
//   ) {
//     return shortName;
//   }

//   return null;
// }

// /* =========================================================
//    HISTORICAL URL
// ========================================================= */

// function buildHistoricalUrl(
//   instrumentKey: string,
//   interval: CandleInterval,
//   toDate: string,
//   fromDate: string
// ) {
//   return (
//     `https://api.upstox.com/v3/historical-candle/` +
//     `${encodeURIComponent(
//       instrumentKey
//     )}/` +
//     `${interval.unit}/` +
//     `${interval.interval}/` +
//     `${toDate}/` +
//     `${fromDate}`
//   );
// }

// /* =========================================================
//    HISTORICAL REQUEST
// ========================================================= */

// async function fetchHistoricalRequest(
//   instrumentKey: string,
//   interval: CandleInterval,
//   toDate: string,
//   fromDate: string,
//   accessToken: string
// ): Promise<unknown[][]> {
//   try {
//     const response =
//       await fetch(
//         buildHistoricalUrl(
//           instrumentKey,
//           interval,
//           toDate,
//           fromDate
//         ),
//         {
//           method: "GET",

//           headers: {
//             Accept:
//               "application/json",

//             Authorization:
//               `Bearer ${accessToken}`,
//           },

//           cache: "no-store",
//         }
//       );

//     const text =
//       await response.text();

//     let data:
//       | UpstoxCandleResponse
//       | null = null;

//     try {
//       data =
//         JSON.parse(
//           text
//         );
//     } catch {
//       return [];
//     }

//     if (!response.ok) {
//       return [];
//     }

//     const candles =
//       data?.data?.candles;

//     return Array.isArray(
//       candles
//     )
//       ? candles
//       : [];
//   } catch {
//     return [];
//   }
// }

// /* =========================================================
//    INTRADAY
// ========================================================= */

// async function fetchIntraday(
//   instrumentKey: string,
//   interval: CandleInterval,
//   accessToken: string
// ) {
//   if (
//     interval.unit ===
//     "weeks"
//   ) {
//     return [];
//   }

//   const url =
//     `https://api.upstox.com/v3/historical-candle/intraday/` +
//     `${encodeURIComponent(
//       instrumentKey
//     )}/` +
//     `${interval.unit}/` +
//     `${interval.interval}`;

//   try {
//     const response =
//       await fetch(
//         url,
//         {
//           method: "GET",

//           headers: {
//             Accept:
//               "application/json",

//             Authorization:
//               `Bearer ${accessToken}`,
//           },

//           cache: "no-store",
//         }
//       );

//     const text =
//       await response.text();

//     let data:
//       | UpstoxCandleResponse
//       | null = null;

//     try {
//       data =
//         JSON.parse(
//           text
//         );
//     } catch {
//       return [];
//     }

//     if (!response.ok) {
//       return [];
//     }

//     const candles =
//       data?.data?.candles;

//     return Array.isArray(
//       candles
//     )
//       ? candles
//       : [];
//   } catch {
//     return [];
//   }
// }

// /* =========================================================
//    CHUNK SIZE
// ========================================================= */

// function getChunkDays(
//   interval: CandleInterval
// ) {
//   if (
//     interval.unit ===
//     "minutes"
//   ) {
//     return interval.interval <=
//       15
//       ? 28
//       : 80;
//   }

//   if (
//     interval.unit ===
//     "hours"
//   ) {
//     return 80;
//   }

//   if (
//     interval.unit ===
//     "days"
//   ) {
//     return 3000;
//   }

//   return 10000;
// }

// /* =========================================================
//    HISTORICAL CHUNKED
// ========================================================= */

// async function fetchHistoricalChunked(
//   instrumentKey: string,
//   interval: CandleInterval,
//   fromDate: string,
//   toDate: string,
//   accessToken: string
// ) {
//   const chunkDays =
//     getChunkDays(
//       interval
//     );

//   const allCandles:
//     unknown[][] = [];

//   let chunkStart =
//     fromDate;

//   while (
//     parseISTDate(
//       chunkStart
//     ).getTime() <=
//     parseISTDate(
//       toDate
//     ).getTime()
//   ) {
//     const proposedEnd =
//       addDays(
//         chunkStart,
//         chunkDays - 1
//       );

//     const chunkEnd =
//       parseISTDate(
//         proposedEnd
//       ).getTime() >
//       parseISTDate(
//         toDate
//       ).getTime()
//         ? toDate
//         : proposedEnd;

//     const candles =
//       await fetchHistoricalRequest(
//         instrumentKey,
//         interval,
//         chunkEnd,
//         chunkStart,
//         accessToken
//       );

//     if (
//       candles.length > 0
//     ) {
//       allCandles.push(
//         ...candles
//       );
//     }

//     const nextStart =
//       addDays(
//         chunkEnd,
//         1
//       );

//     if (
//       nextStart ===
//       chunkStart
//     ) {
//       break;
//     }

//     chunkStart =
//       nextStart;
//   }

//   return allCandles;
// }

// /* =========================================================
//    GET CANDLES
// ========================================================= */

// async function getCandlesForInterval(
//   instrumentKey: string,
//   interval: CandleInterval,
//   range: Range,
//   fromDate: string,
//   toDate: string,
//   accessToken: string
// ) {
//   if (
//     range === "1D"
//   ) {
//     if (
//       interval.unit ===
//         "minutes" ||
//       interval.unit ===
//         "hours"
//     ) {
//       const intraday =
//         await fetchIntraday(
//           instrumentKey,
//           interval,
//           accessToken
//         );

//       if (
//         intraday.length > 0
//       ) {
//         return intraday;
//       }
//     }

//     return fetchHistoricalChunked(
//       instrumentKey,
//       interval,
//       fromDate,
//       toDate,
//       accessToken
//     );
//   }

//   return fetchHistoricalChunked(
//     instrumentKey,
//     interval,
//     fromDate,
//     toDate,
//     accessToken
//   );
// }

// /* =========================================================
//    NORMALIZE CANDLES
// ========================================================= */

// function normalizeCandles(
//   candles: unknown[][]
// ): ChartCandle[] {
//   const normalized =
//     candles
//       .map(
//         candle => {
//           if (
//             !Array.isArray(
//               candle
//             ) ||
//             candle.length < 6
//           ) {
//             return null;
//           }

//           const time =
//             String(
//               candle[0]
//             );

//           const open =
//             Number(
//               candle[1]
//             );

//           const high =
//             Number(
//               candle[2]
//             );

//           const low =
//             Number(
//               candle[3]
//             );

//           const close =
//             Number(
//               candle[4]
//             );

//           const volume =
//             Number(
//               candle[5]
//             );

//           if (
//             !time ||
//             !Number.isFinite(
//               open
//             ) ||
//             !Number.isFinite(
//               high
//             ) ||
//             !Number.isFinite(
//               low
//             ) ||
//             !Number.isFinite(
//               close
//             )
//           ) {
//             return null;
//           }

//           return {
//             time,
//             open,
//             high,
//             low,
//             close,

//             volume:
//               Number.isFinite(
//                 volume
//               )
//                 ? volume
//                 : 0,
//           };
//         }
//       )
//       .filter(
//         (
//           candle
//         ): candle is ChartCandle =>
//           candle !== null
//       );

//   normalized.sort(
//     (a, b) =>
//       new Date(
//         a.time
//       ).getTime() -
//       new Date(
//         b.time
//       ).getTime()
//   );

//   const unique:
//     ChartCandle[] = [];

//   const seen =
//     new Set<string>();

//   for (
//     const candle of normalized
//   ) {
//     if (
//       seen.has(
//         candle.time
//       )
//     ) {
//       continue;
//     }

//     seen.add(
//       candle.time
//     );

//     unique.push(
//       candle
//     );
//   }

//   return unique;
// }

// /* =========================================================
//    LIVE LTP
// ========================================================= */

// async function fetchLiveQuote(
//   instrumentKey: string,
//   accessToken: string
// ) {
//   const url =
//     new URL(
//       "https://api.upstox.com/v3/market-quote/ltp"
//     );

//   url.searchParams.set(
//     "instrument_key",
//     instrumentKey
//   );

//   try {
//     const response =
//       await fetch(
//         url.toString(),
//         {
//           method: "GET",

//           headers: {
//             Accept:
//               "application/json",

//             Authorization:
//               `Bearer ${accessToken}`,
//           },

//           cache: "no-store",
//         }
//       );

//     const text =
//       await response.text();

//     let data:
//       | UpstoxLtpResponse
//       | null = null;

//     try {
//       data =
//         JSON.parse(
//           text
//         );
//     } catch {
//       return null;
//     }

//     if (!response.ok) {
//       return null;
//     }

//     const raw =
//       data?.data?.[
//         instrumentKey
//       ];

//     if (raw) {
//       return raw;
//     }

//     return (
//       Object.values(
//         data?.data || {}
//       )[0] || null
//     );
//   } catch {
//     return null;
//   }
// }

// /* =========================================================
//    CANDLE QUOTE
// ========================================================= */

// function calculateQuoteFromCandles(
//   candles: ChartCandle[]
// ): StockQuote {
//   if (
//     candles.length === 0
//   ) {
//     return {
//       price: null,
//       change: null,
//       changePercent: null,
//       previousClose: null,
//       open: null,
//       high: null,
//       low: null,
//       close: null,
//       volume: null,
//       averagePrice: null,
//     };
//   }

//   const latest =
//     candles[
//       candles.length - 1
//     ];

//   const price =
//     Number(
//       latest.close
//     );

//   const latestDate =
//     latest.time.slice(
//       0,
//       10
//     );

//   let previousClose:
//     | number
//     | null = null;

//   for (
//     let i =
//       candles.length - 1;
//     i >= 0;
//     i--
//   ) {
//     const candle =
//       candles[i];

//     const candleDate =
//       candle.time.slice(
//         0,
//         10
//       );

//     if (
//       candleDate !==
//       latestDate
//     ) {
//       const close =
//         Number(
//           candle.close
//         );

//       if (
//         Number.isFinite(
//           close
//         )
//       ) {
//         previousClose =
//           close;
//       }

//       break;
//     }
//   }

//   if (
//     previousClose === null &&
//     candles.length >= 2
//   ) {
//     const previous =
//       candles[
//         candles.length - 2
//       ];

//     const close =
//       Number(
//         previous.close
//       );

//     if (
//       Number.isFinite(
//         close
//       )
//     ) {
//       previousClose =
//         close;
//     }
//   }

//   let change:
//     | number
//     | null = null;

//   let changePercent:
//     | number
//     | null = null;

//   if (
//     Number.isFinite(
//       price
//     ) &&
//     previousClose !== null &&
//     previousClose !== 0
//   ) {
//     change =
//       price -
//       previousClose;

//     changePercent =
//       (change /
//         previousClose) *
//       100;
//   }

//   const averagePrice =
//     (
//       latest.open +
//       latest.high +
//       latest.low +
//       latest.close
//     ) / 4;

//   return {
//     price:
//       Number.isFinite(
//         price
//       )
//         ? price
//         : null,

//     change,

//     changePercent,

//     previousClose,

//     open:
//       Number.isFinite(
//         latest.open
//       )
//         ? latest.open
//         : null,

//     high:
//       Number.isFinite(
//         latest.high
//       )
//         ? latest.high
//         : null,

//     low:
//       Number.isFinite(
//         latest.low
//       )
//         ? latest.low
//         : null,

//     close:
//       Number.isFinite(
//         latest.close
//       )
//         ? latest.close
//         : null,

//     volume:
//       Number.isFinite(
//         latest.volume
//       )
//         ? latest.volume
//         : null,

//     averagePrice:
//       Number.isFinite(
//         averagePrice
//       )
//         ? averagePrice
//         : null,
//   };
// }

// /* =========================================================
//    BUILD QUOTE
// ========================================================= */

// async function buildQuote(
//   instrumentKey: string,
//   candles: ChartCandle[],
//   accessToken: string
// ): Promise<StockQuote> {
//   const candleQuote =
//     calculateQuoteFromCandles(
//       candles
//     );

//   const liveQuote =
//     await fetchLiveQuote(
//       instrumentKey,
//       accessToken
//     );

//   if (!liveQuote) {
//     return candleQuote;
//   }

//   const previousCloseRaw =
//     Number(
//       liveQuote.cp ??
//         liveQuote.close_price
//     );

//   const validPreviousClose =
//     Number.isFinite(
//       previousCloseRaw
//     ) &&
//     previousCloseRaw !== 0;

//   /*
//    * Keep initial header and chart
//    * consistent.
//    *
//    * Live polling takes over after
//    * the workspace has loaded.
//    */

//   const price =
//     candleQuote.price;

//   const previousClose =
//     validPreviousClose
//       ? previousCloseRaw
//       : candleQuote.previousClose;

//   let change:
//     | number
//     | null = null;

//   let changePercent:
//     | number
//     | null = null;

//   if (
//     price !== null &&
//     previousClose !== null &&
//     previousClose !== 0
//   ) {
//     change =
//       price -
//       previousClose;

//     changePercent =
//       (change /
//         previousClose) *
//       100;
//   }

//   return {
//     price,

//     change,

//     changePercent,

//     previousClose,

//     open:
//       candleQuote.open,

//     high:
//       candleQuote.high,

//     low:
//       candleQuote.low,

//     close:
//       candleQuote.close,

//     volume:
//       liveQuote.volume !==
//         undefined &&
//       Number.isFinite(
//         Number(
//           liveQuote.volume
//         )
//       )
//         ? Number(
//             liveQuote.volume
//           )
//         : candleQuote.volume,

//     averagePrice:
//       candleQuote.averagePrice,
//   };
// }

// /* =========================================================
//    GET
// ========================================================= */

// export async function GET(
//   request: Request,
//   context: {
//     params: Promise<{
//       symbol: string;
//     }>;
//   }
// ) {
//   try {
//     const {
//       symbol: rawSymbol,
//     } =
//       await context.params;

//     const symbol =
//       cleanSymbol(
//         rawSymbol
//       );

//     if (!symbol) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Stock symbol is required.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     const url =
//       new URL(
//         request.url
//       );

//     const rawRange =
//       url.searchParams.get(
//         "range"
//       ) || "1D";

//     const allowedRanges:
//       Range[] = [
//         "1D",
//         "5D",
//         "1M",
//         "3M",
//         "6M",
//         "YTD",
//         "1Y",
//         "5Y",
//         "All",
//       ];

//     const range =
//       allowedRanges.includes(
//         rawRange as Range
//       )
//         ? (rawRange as Range)
//         : "1D";

//     const requestedInstrumentKey =
//       url.searchParams
//         .get(
//           "instrumentKey"
//         )
//         ?.trim() || "";

//     const accessToken =
//       process.env
//         .UPSTOX_ACCESS_TOKEN
//         ?.trim()
//         .replace(
//           /^["']|["']$/g,
//           ""
//         );

//     if (!accessToken) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "UPSTOX_ACCESS_TOKEN is not configured.",
//         },
//         {
//           status: 500,
//         }
//       );
//     }

//     /*
//      * =======================================================
//      * INSTRUMENT RESOLUTION
//      * =======================================================
//      *
//      * If Navbar supplied an instrumentKey,
//      * TRUST THAT EXACT INSTRUMENT.
//      *
//      * Example:
//      *
//      * NSE_INDEX|Nifty 50
//      *
//      * We do NOT search "NIFTY" again.
//      */

//     let instrument:
//       UpstoxInstrument | null =
//       null;

//     if (
//       requestedInstrumentKey &&
//       isValidInstrumentKey(
//         requestedInstrumentKey
//       )
//     ) {
//       instrument = {
//         instrument_key:
//           requestedInstrumentKey,

//         segment:
//           requestedInstrumentKey.startsWith(
//             "NSE_INDEX|"
//           )
//             ? "NSE_INDEX"
//             : "NSE_EQ",

//         exchange:
//           "NSE",

//         trading_symbol:
//           symbol,

//         name:
//           requestedInstrumentKey.startsWith(
//             "NSE_INDEX|"
//           )
//             ? requestedInstrumentKey
//                 .split("|")
//                 .slice(1)
//                 .join("|")
//             : symbol,

//         instrument_type:
//           requestedInstrumentKey.startsWith(
//             "NSE_INDEX|"
//           )
//             ? "INDEX"
//             : "EQ",
//       };
//     }

//     /*
//      * Direct URL fallback.
//      *
//      * If somebody manually visits:
//      *
//      * /stock/NIFTY
//      *
//      * without instrumentKey,
//      * find the index first.
//      */

//     if (
//       !instrument
//     ) {
//       instrument =
//         await findInstrument(
//           symbol,
//           accessToken
//         );
//     }

//     if (
//       !instrument?.instrument_key
//     ) {
//       return NextResponse.json(
//         {
//           success: false,

//           error:
//             `${symbol} could not be resolved to an NSE instrument on Upstox.`,
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     const instrumentKey =
//       instrument.instrument_key;

//     const today =
//       getISTDate();

//     const fromDate =
//       getFromDate(
//         range,
//         today
//       );

//     const intervals =
//       RANGE_INTERVALS[
//         range
//       ];

//     let selectedInterval:
//       | CandleInterval
//       | null = null;

//     let rawCandles:
//       unknown[][] = [];

//     for (
//       const interval of intervals
//     ) {
//       console.log(
//         `[Chart] ${symbol} ${range}: trying ${interval.label} using ${instrumentKey}`
//       );

//       const candles =
//         await getCandlesForInterval(
//           instrumentKey,
//           interval,
//           range,
//           fromDate,
//           today,
//           accessToken
//         );

//       if (
//         candles.length === 0
//       ) {
//         continue;
//       }

//       const normalized =
//         normalizeCandles(
//           candles
//         );

//       if (
//         normalized.length === 0
//       ) {
//         continue;
//       }

//       selectedInterval =
//         interval;

//       rawCandles =
//         candles;

//       console.log(
//         `[Chart] ${symbol} ${range}: using ${interval.label}`
//       );

//       break;
//     }

//     if (
//       !selectedInterval ||
//       rawCandles.length === 0
//     ) {
//       return NextResponse.json(
//         {
//           success: false,

//           symbol,

//           instrumentKey,

//           range,

//           error:
//             `No chart data is currently available for ${symbol}.`,
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     const candles =
//       normalizeCandles(
//         rawCandles
//       );

//     const quote =
//       await buildQuote(
//         instrumentKey,
//         candles,
//         accessToken
//       );

//     return NextResponse.json(
//       {
//         success: true,

//         symbol,

//         name:
//           instrument.name ||
//           instrument.short_name ||
//           symbol,

//         tradingSymbol:
//           instrument.trading_symbol ||
//           symbol,

//         instrumentKey,

//         exchange:
//           instrument.exchange ||
//           "NSE",

//         segment:
//           instrument.segment ||
//           "NSE_EQ",

//         instrumentType:
//           instrument.instrument_type ||
//           "EQ",

//         range,

//         requestedRange:
//           range,

//         interval:
//           selectedInterval.label,

//         intervalUnit:
//           selectedInterval.unit,

//         intervalValue:
//           selectedInterval.interval,

//         marketOpen:
//           isMarketOpen(),

//         source:
//           "upstox",

//         quote,

//         candles,

//         data:
//           candles,

//         bars:
//           candles,
//       },
//       {
//         status: 200,

//         headers: {
//           "Cache-Control":
//             "no-store",
//         },
//       }
//     );
//   } catch (error) {
//     console.error(
//       "GET /api/stock/[symbol] error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         success: false,

//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to load stock data.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }













import { NextResponse } from "next/server";

/* =========================================================
   TYPES
========================================================= */

type UpstoxInstrument = {
  name?: string;
  segment?: string;
  exchange?: string;
  instrument_key?: string;
  trading_symbol?: string;
  short_name?: string;
  instrument_type?: string;
};

type UpstoxInstrumentResponse = {
  data?: UpstoxInstrument[];
};

type UpstoxCandleResponse = {
  data?: {
    candles?: unknown[][];
  };
};

type UpstoxLtpResponse = {
  data?: Record<
    string,
    {
      last_price?: number;
      ltp?: number;
      cp?: number;
      close_price?: number;
      volume?: number;
    }
  >;
};

type Range =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "YTD"
  | "1Y"
  | "5Y"
  | "All";

type CandleInterval = {
  unit: "minutes" | "hours" | "days" | "weeks";
  interval: number;
  label: string;
};

type ChartCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type StockQuote = {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  averagePrice: number | null;
};

/* =========================================================
   CONFIGURATION
========================================================= */

const RANGE_INTERVALS: Record<Range, CandleInterval[]> = {
  "1D": [
    { unit: "minutes", interval: 1, label: "1m" },
    { unit: "minutes", interval: 5, label: "5m" },
    { unit: "hours", interval: 1, label: "1h" },
    { unit: "hours", interval: 2, label: "2h" },
    { unit: "days", interval: 1, label: "1d" },
  ],
  "5D": [
    { unit: "minutes", interval: 5, label: "5m" },
    { unit: "hours", interval: 1, label: "1h" },
    { unit: "hours", interval: 2, label: "2h" },
    { unit: "days", interval: 1, label: "1d" },
  ],
  "1M": [
    { unit: "minutes", interval: 30, label: "30m" },
    { unit: "hours", interval: 1, label: "1h" },
    { unit: "days", interval: 1, label: "1d" },
  ],
  "3M": [
    { unit: "hours", interval: 1, label: "1h" },
    { unit: "days", interval: 1, label: "1d" },
    { unit: "weeks", interval: 1, label: "1w" },
  ],
  "6M": [
    { unit: "days", interval: 1, label: "1d" },
    { unit: "weeks", interval: 1, label: "1w" },
  ],
  YTD: [
    { unit: "days", interval: 1, label: "1d" },
    { unit: "weeks", interval: 1, label: "1w" },
  ],
  "1Y": [
    { unit: "days", interval: 1, label: "1d" },
    { unit: "weeks", interval: 1, label: "1w" },
  ],
  "5Y": [
    { unit: "weeks", interval: 1, label: "1w" },
    { unit: "days", interval: 1, label: "1d" },
  ],
  All: [
    { unit: "weeks", interval: 1, label: "1w" },
    { unit: "days", interval: 1, label: "1d" },
  ],
};

const IST = "Asia/Kolkata";

function cleanSymbol(symbol: string) {
  return decodeURIComponent(symbol)
    .replace(/^NSE:/i, "")
    .trim()
    .toUpperCase();
}

function isValidInstrumentKey(key: string) {
  return (
    key.startsWith("NSE_EQ|") ||
    key.startsWith("NSE_INDEX|")
  );
}

/* =========================================================
   DATE HELPERS — IST
========================================================= */

function getISTDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);

  // UTC arithmetic avoids server-local timezone and DST issues.
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getFromDate(range: Range, today: string): string {
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  switch (range) {
    case "1D":
      return today;
    case "5D":
      date.setUTCDate(date.getUTCDate() - 7);
      break;
    case "1M":
      date.setUTCMonth(date.getUTCMonth() - 1);
      break;
    case "3M":
      date.setUTCMonth(date.getUTCMonth() - 3);
      break;
    case "6M":
      date.setUTCMonth(date.getUTCMonth() - 6);
      break;
    case "YTD":
      date.setUTCMonth(0, 1);
      break;
    case "1Y":
      date.setUTCFullYear(date.getUTCFullYear() - 1);
      break;
    case "5Y":
      date.setUTCFullYear(date.getUTCFullYear() - 5);
      break;
    case "All":
      date.setUTCFullYear(date.getUTCFullYear() - 20);
      break;
  }

  return date.toISOString().slice(0, 10);
}

function isMarketOpen(): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  if (!["Mon", "Tue", "Wed", "Thu", "Fri"].includes(get("weekday"))) {
    return false;
  }

  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const current = hour * 60 + minute;

  return current >= 9 * 60 + 15 && current <= 15 * 60 + 30;
}

/* =========================================================
   INSTRUMENT SEARCH
========================================================= */

async function findInstrument(
  symbol: string,
  accessToken: string
): Promise<UpstoxInstrument | null> {
  async function search(segment: "INDEX" | "EQ") {
    const url = new URL("https://api.upstox.com/v2/instruments/search");
    url.searchParams.set("query", symbol);
    url.searchParams.set("exchanges", "NSE");
    url.searchParams.set("segments", segment);
    url.searchParams.set("page_number", "1");
    url.searchParams.set("records", "30");

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      if (!response.ok) return [];

      const json =
        (await response.json()) as UpstoxInstrumentResponse;

      return json.data ?? [];
    } catch {
      return [];
    }
  }

  // Exact index match first, preventing NIFTY from matching NIFTYBEES.
  const indices = await search("INDEX");

  const exactIndex = indices.find(
    (item) =>
      item.trading_symbol?.toUpperCase() === symbol ||
      item.name?.toUpperCase() === symbol
  );

  if (exactIndex?.instrument_key) return exactIndex;

  const equities = await search("EQ");

  const exactEquity = equities.find(
    (item) => item.trading_symbol?.toUpperCase() === symbol
  );

  if (exactEquity?.instrument_key) return exactEquity;

  return (
    equities.find(
      (item) => item.short_name?.toUpperCase() === symbol
    ) ?? null
  );
}

/* =========================================================
   UPSTOX CANDLE REQUESTS
========================================================= */

function buildHistoricalUrl(
  instrumentKey: string,
  interval: CandleInterval,
  toDate: string,
  fromDate: string
) {
  return (
    `https://api.upstox.com/v3/historical-candle/` +
    `${encodeURIComponent(instrumentKey)}/` +
    `${interval.unit}/${interval.interval}/` +
    `${toDate}/${fromDate}`
  );
}

async function readCandles(response: Response): Promise<unknown[][]> {
  if (!response.ok) {
    console.warn("[Chart] Upstox candle request failed:", response.status);
    return [];
  }

  try {
    const json = (await response.json()) as UpstoxCandleResponse;
    return Array.isArray(json.data?.candles) ? json.data.candles : [];
  } catch {
    return [];
  }
}

async function fetchHistorical(
  instrumentKey: string,
  interval: CandleInterval,
  fromDate: string,
  toDate: string,
  accessToken: string
): Promise<unknown[][]> {
  try {
    const response = await fetch(
      buildHistoricalUrl(instrumentKey, interval, toDate, fromDate),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );

    return await readCandles(response);
  } catch (error) {
    console.error("[Chart] Historical request error:", error);
    return [];
  }
}

async function fetchIntraday(
  instrumentKey: string,
  interval: CandleInterval,
  accessToken: string
): Promise<unknown[][]> {
  if (interval.unit === "days" || interval.unit === "weeks") {
    return [];
  }

  const url =
    `https://api.upstox.com/v3/historical-candle/intraday/` +
    `${encodeURIComponent(instrumentKey)}/` +
    `${interval.unit}/${interval.interval}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    return await readCandles(response);
  } catch (error) {
    console.error("[Chart] Intraday request error:", error);
    return [];
  }
}

/* =========================================================
   NORMALIZE AND DEDUPLICATE
========================================================= */

function normalizeCandles(raw: unknown[][]): ChartCandle[] {
  const result: ChartCandle[] = [];

  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 6) continue;

    const time = String(item[0] ?? "");
    const open = Number(item[1]);
    const high = Number(item[2]);
    const low = Number(item[3]);
    const close = Number(item[4]);
    const volume = Number(item[5] ?? 0);

    if (
      !time ||
      !Number.isFinite(Date.parse(time)) ||
      ![open, high, low, close].every(Number.isFinite)
    ) {
      continue;
    }

    result.push({
      time,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(volume) ? volume : 0,
    });
  }

  // Upstox commonly returns newest candles first.
  result.sort(
    (a, b) => Date.parse(a.time) - Date.parse(b.time)
  );

  const unique = new Map<string, ChartCandle>();

  for (const candle of result) {
    unique.set(candle.time, candle);
  }

  return [...unique.values()];
}

/* =========================================================
   FALLBACK: MOST RECENT TRADING SESSION
========================================================= */

/**
 * Used only for the 1D range when today's intraday candles
 * are unavailable or contain no usable bars.
 *
 * Searches a recent historical window, groups candles by
 * their IST trading date, and returns only the latest date
 * with usable candles. This handles weekends and holidays
 * without assuming that the previous calendar day traded.
 */
async function fetchPreviousSession(
  instrumentKey: string,
  accessToken: string,
  today: string
): Promise<{ candles: ChartCandle[]; interval: CandleInterval } | null> {
  const fromDate = addDays(today, -15);
  const toDate = addDays(today, -1);

  const fallbackIntervals: CandleInterval[] = [
    { unit: "minutes", interval: 1, label: "1m" },
    { unit: "minutes", interval: 5, label: "5m" },
    { unit: "days", interval: 1, label: "1d" },
  ];

  for (const interval of fallbackIntervals) {
    const raw = await fetchHistorical(
      instrumentKey,
      interval,
      fromDate,
      toDate,
      accessToken
    );

    const normalized = normalizeCandles(raw);

    if (normalized.length === 0) continue;

    // Derive the actual trading date in India, regardless of server timezone.
    const sessions = new Map<string, ChartCandle[]>();

    for (const candle of normalized) {
      const sessionDate = getISTDate(new Date(candle.time));

      if (sessionDate >= today) continue;

      const existing = sessions.get(sessionDate) ?? [];
      existing.push(candle);
      sessions.set(sessionDate, existing);
    }

    const latestSession = [...sessions.keys()].sort().pop();

    if (latestSession) {
      const sessionCandles = sessions.get(latestSession)!;

      console.info(
        `[Chart] Using fallback session ${latestSession} (${interval.label})`
      );

      return {
        candles: sessionCandles,
        interval,
      };
    }
  }

  return null;
}

/* =========================================================
   QUOTE
========================================================= */

function calculateQuote(candles: ChartCandle[]): StockQuote {
  const empty: StockQuote = {
    price: null,
    change: null,
    changePercent: null,
    previousClose: null,
    open: null,
    high: null,
    low: null,
    close: null,
    volume: null,
    averagePrice: null,
  };

  if (candles.length === 0) return empty;

  const latest = candles[candles.length - 1];
  const latestDate = getISTDate(new Date(latest.time));

  let previousClose: number | null = null;

  for (let i = candles.length - 2; i >= 0; i--) {
    if (getISTDate(new Date(candles[i].time)) !== latestDate) {
      previousClose = candles[i].close;
      break;
    }
  }

  const change =
    previousClose !== null ? latest.close - previousClose : null;

  const changePercent =
    previousClose !== null && previousClose !== 0
      ? ((latest.close - previousClose) / previousClose) * 100
      : null;

  return {
    price: latest.close,
    change,
    changePercent,
    previousClose,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    close: latest.close,
    volume: latest.volume,
    averagePrice:
      (latest.open + latest.high + latest.low + latest.close) / 4,
  };
}

async function fetchLiveQuote(
  instrumentKey: string,
  accessToken: string
) {
  const url = new URL("https://api.upstox.com/v3/market-quote/ltp");
  url.searchParams.set("instrument_key", instrumentKey);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const json = (await response.json()) as UpstoxLtpResponse;

    return (
      json.data?.[instrumentKey] ??
      Object.values(json.data ?? {})[0] ??
      null
    );
  } catch {
    return null;
  }
}

async function buildQuote(
  instrumentKey: string,
  candles: ChartCandle[],
  accessToken: string
): Promise<StockQuote> {
  const quote = calculateQuote(candles);
  const live = await fetchLiveQuote(instrumentKey, accessToken);

  if (!live) return quote;

  // Keep the chart price historical/session-based. The separate live-price
  // polling in the workspace can update the current price during trading.
  const previousClose = Number(live.cp ?? live.close_price);

  if (Number.isFinite(previousClose) && previousClose !== 0 && quote.price !== null) {
    quote.previousClose = previousClose;
    quote.change = quote.price - previousClose;
    quote.changePercent = (quote.change / previousClose) * 100;
  }

  if (live.volume !== undefined && Number.isFinite(Number(live.volume))) {
    quote.volume = Number(live.volume);
  }

  return quote;
}

/* =========================================================
   GET ROUTE
========================================================= */

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: rawSymbol } = await context.params;
    const symbol = cleanSymbol(rawSymbol);

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: "Stock symbol is required." },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const rawRange = url.searchParams.get("range") || "1D";

    const allowedRanges: Range[] = [
      "1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All",
    ];

    const range: Range = allowedRanges.includes(rawRange as Range)
      ? (rawRange as Range)
      : "1D";

    const accessToken = process.env.UPSTOX_ACCESS_TOKEN
      ?.trim()
      .replace(/^["']|["']$/g, "");

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "UPSTOX_ACCESS_TOKEN is not configured.",
        },
        { status: 500 }
      );
    }

    const requestedKey =
      url.searchParams.get("instrumentKey")?.trim() || "";

    let instrument: UpstoxInstrument | null = null;

    if (requestedKey && isValidInstrumentKey(requestedKey)) {
      instrument = {
        instrument_key: requestedKey,
        segment: requestedKey.startsWith("NSE_INDEX|")
          ? "NSE_INDEX"
          : "NSE_EQ",
        exchange: "NSE",
        trading_symbol: symbol,
        name: requestedKey.startsWith("NSE_INDEX|")
          ? requestedKey.split("|").slice(1).join("|")
          : symbol,
        instrument_type: requestedKey.startsWith("NSE_INDEX|")
          ? "INDEX"
          : "EQ",
      };
    } else {
      instrument = await findInstrument(symbol, accessToken);
    }

    if (!instrument?.instrument_key) {
      return NextResponse.json(
        {
          success: false,
          error: `${symbol} could not be resolved to an NSE instrument on Upstox.`,
        },
        { status: 404 }
      );
    }

    const instrumentKey = instrument.instrument_key;
    const today = getISTDate();
    const fromDate = getFromDate(range, today);

    let candles: ChartCandle[] = [];
    let selectedInterval: CandleInterval | null = null;
    let usedFallback = false;
    let fallbackSessionDate: string | null = null;

    /* -------------------------------------------------------
       1D: TRY TODAY'S INTRADAY DATA FIRST
    ------------------------------------------------------- */

    if (range === "1D") {
      for (const interval of RANGE_INTERVALS["1D"]) {
        if (interval.unit !== "minutes") continue;

        console.info(
          `[Chart] ${symbol} 1D: trying today's intraday ${interval.label}`
        );

        const raw = await fetchIntraday(
          instrumentKey,
          interval,
          accessToken
        );

        const normalized = normalizeCandles(raw);

        // Only accept actual candles belonging to today's IST session.
        const todayCandles = normalized.filter(
          (candle) => getISTDate(new Date(candle.time)) === today
        );

        if (todayCandles.length > 0) {
          candles = todayCandles;
          selectedInterval = interval;
          break;
        }
      }

      /* -----------------------------------------------------
         1D: FALL BACK TO THE LATEST PREVIOUS SESSION
      ----------------------------------------------------- */

      if (candles.length === 0) {
        console.info(
          `[Chart] ${symbol} 1D: no candles for today; checking previous sessions`
        );

        const fallback = await fetchPreviousSession(
          instrumentKey,
          accessToken,
          today
        );

        if (fallback) {
          candles = fallback.candles;
          selectedInterval = fallback.interval;
          usedFallback = true;

          fallbackSessionDate = getISTDate(
            new Date(candles[candles.length - 1].time)
          );
        }
      }
    } else {
      /* -----------------------------------------------------
         OTHER RANGES: KEEP HISTORICAL BEHAVIOR
      ----------------------------------------------------- */

      for (const interval of RANGE_INTERVALS[range]) {
        console.info(
          `[Chart] ${symbol} ${range}: trying ${interval.label}`
        );

        const raw = await fetchHistorical(
          instrumentKey,
          interval,
          fromDate,
          today,
          accessToken
        );

        const normalized = normalizeCandles(raw);

        if (normalized.length > 0) {
          candles = normalized;
          selectedInterval = interval;
          break;
        }
      }
    }

    if (!selectedInterval || candles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          symbol,
          instrumentKey,
          range,
          error: `No chart data is currently available for ${symbol}.`,
        },
        { status: 404 }
      );
    }

    const quote = await buildQuote(
      instrumentKey,
      candles,
      accessToken
    );

    return NextResponse.json(
      {
        success: true,
        symbol,
        name: instrument.name || instrument.short_name || symbol,
        tradingSymbol: instrument.trading_symbol || symbol,
        instrumentKey,
        exchange: instrument.exchange || "NSE",
        segment: instrument.segment || "NSE_EQ",
        instrumentType: instrument.instrument_type || "EQ",
        range,
        requestedRange: range,
        interval: selectedInterval.label,
        intervalUnit: selectedInterval.unit,
        intervalValue: selectedInterval.interval,
        marketOpen: isMarketOpen(),
        source: "upstox",
        usedFallback,
        fallbackSessionDate,
        quote,
        candles,
        data: candles,
        bars: candles,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/stock/[symbol] error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load stock data.",
      },
      { status: 500 }
    );
  }
}
