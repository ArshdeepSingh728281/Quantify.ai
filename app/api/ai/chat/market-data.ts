// import { GET as stockRouteGET } from "@/app/api/stock/[symbol]/route";

// export type MarketCandle = {
//   time: string;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume: number;
// };

// export type MarketData = {
//   symbol: string;
//   name: string;
//   instrumentKey: string;

//   interval: string;
//   intervalUnit: string;
//   intervalValue: number;

//   candles: MarketCandle[];
// };

// /*
// |--------------------------------------------------------------------------
// | NORMALIZE TRADING TYPE
// |--------------------------------------------------------------------------
// */

// function normalizeTradingType(
//   tradingType: string
// ) {
//   const value =
//     tradingType
//       .trim()
//       .toLowerCase();

//   if (
//     value === "intraday" ||
//     value === "day" ||
//     value === "day trading"
//   ) {
//     return "intraday";
//   }

//   if (
//     value === "longterm" ||
//     value === "long-term" ||
//     value === "long term"
//   ) {
//     return "longterm";
//   }

//   return "swing";
// }

// /*
// |--------------------------------------------------------------------------
// | GET MARKET RANGE
// |--------------------------------------------------------------------------
// */

// function getMarketRange(
//   tradingType: string
// ) {
//   const type =
//     normalizeTradingType(
//       tradingType
//     );

//   switch (type) {
//     case "intraday":
//       return "5D";

//     case "longterm":
//       return "5Y";

//     case "swing":
//     default:
//       return "6M";
//   }
// }

// /*
// |--------------------------------------------------------------------------
// | GET MARKET DATA
// |--------------------------------------------------------------------------
// |
// | The tool does NOT receive OHLCV from the AI.
// |
// | It obtains the data itself through:
// |
// | /api/stock/[symbol]
// |
// |--------------------------------------------------------------------------
// */

// export async function getMarketData(
//   symbol: string,
//   tradingType: string
// ): Promise<MarketData> {
//   const cleanSymbol =
//     decodeURIComponent(
//       symbol
//     )
//       .trim()
//       .toUpperCase();

//   if (!cleanSymbol) {
//     throw new Error(
//       "Stock symbol is required."
//     );
//   }

//   const range =
//     getMarketRange(
//       tradingType
//     );

//   /*
//   |--------------------------------------------------------------------------
//   | CALL EXISTING STOCK API
//   |--------------------------------------------------------------------------
//   */

//   const request =
//     new Request(
//       `http://internal/api/stock/${encodeURIComponent(
//         cleanSymbol
//       )}?range=${range}`,
//       {
//         method: "GET",

//         headers: {
//           Accept:
//             "application/json",
//         },
//       }
//     );

//   let response: Response;

//   try {
//     response =
//       await stockRouteGET(
//         request,
//         {
//           params:
//             Promise.resolve({
//               symbol:
//                 cleanSymbol,
//             }),
//         }
//       );
//   } catch (error) {
//     console.error(
//       "[AI MARKET DATA] Stock route failed:",
//       error
//     );

//     throw new Error(
//       "Unable to retrieve market data."
//     );
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | PARSE RESPONSE
//   |--------------------------------------------------------------------------
//   */

//   let data: any;

//   try {
//     data =
//       await response.json();
//   } catch {
//     throw new Error(
//       "Stock API returned an invalid response."
//     );
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | API ERROR
//   |--------------------------------------------------------------------------
//   */

//   if (!response.ok) {
//     console.error(
//       "[AI MARKET DATA] Stock API error:",
//       data
//     );

//     throw new Error(
//       data?.error ||
//         `Unable to retrieve market data for ${cleanSymbol}.`
//     );
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | GET CANDLES
//   |--------------------------------------------------------------------------
//   */

//   const rawCandles =
//     Array.isArray(
//       data?.candles
//     )
//       ? data.candles
//       : Array.isArray(
//           data?.bars
//         )
//       ? data.bars
//       : Array.isArray(
//           data?.data
//         )
//       ? data.data
//       : [];

//   if (
//     rawCandles.length ===
//     0
//   ) {
//     throw new Error(
//       `No historical market data is available for ${cleanSymbol}.`
//     );
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | NORMALIZE CANDLES
//   |--------------------------------------------------------------------------
//   */

//   const candles =
//     rawCandles
//       .map(
//         (
//           candle: any
//         ) => {
//           if (
//             !candle ||
//             typeof candle !==
//               "object"
//           ) {
//             return null;
//           }

//           const time =
//             String(
//               candle.time ??
//                 candle.timestamp ??
//                 ""
//             );

//           const open =
//             Number(
//               candle.open
//             );

//           const high =
//             Number(
//               candle.high
//             );

//           const low =
//             Number(
//               candle.low
//             );

//           const close =
//             Number(
//               candle.close
//             );

//           const volume =
//             Number(
//               candle.volume ??
//                 0
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
//           candle:any
//         ): candle is MarketCandle =>
//           candle !== null
//       );

//   if (
//     candles.length ===
//     0
//   ) {
//     throw new Error(
//       `Market data for ${cleanSymbol} could not be normalized.`
//     );
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | SORT OLDEST → NEWEST
//   |--------------------------------------------------------------------------
//   */

//   candles.sort(
//     (a:any, b:any) =>
//       new Date(
//         a.time
//       ).getTime() -
//       new Date(
//         b.time
//       ).getTime()
//   );

//   /*
//   |--------------------------------------------------------------------------
//   | REMOVE DUPLICATES
//   |--------------------------------------------------------------------------
//   */

//   const uniqueCandles:
//     MarketCandle[] = [];

//   const seen =
//     new Set<string>();

//   for (
//     const candle of candles
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

//     uniqueCandles.push(
//       candle
//     );
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | RETURN
//   |--------------------------------------------------------------------------
//   */

//   return {
//     symbol:
//       data?.symbol ||
//       cleanSymbol,

//     name:
//       data?.name ||
//       cleanSymbol,

//     instrumentKey:
//       data?.instrumentKey ||
//       "",

//     interval:
//       data?.interval ||
//       "unknown",

//     intervalUnit:
//       data?.intervalUnit ||
//       "",

//     intervalValue:
//       Number(
//         data?.intervalValue
//       ) || 0,

//     candles:
//       uniqueCandles,
//   };
// }















// import { GET as stockRouteGET } from "@/app/api/stock/[symbol]/route";

// /* ==========================================================================
//    TYPES
// ========================================================================== */

// export type MarketCandle = {
//   time: string;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume: number;
// };

// export type MarketData = {
//   symbol: string;
//   name: string;
//   instrumentKey: string;

//   interval: string;
//   intervalUnit: string;
//   intervalValue: number;

//   candles: MarketCandle[];

//   // Useful for cache freshness checks and debugging.
//   fetchedAt: string;
// };

// /* ==========================================================================
//    NORMALIZE TRADING TYPE
// ========================================================================== */

// function normalizeTradingType(
//   tradingType: string
// ): "intraday" | "swing" | "longterm" {
//   const value = String(tradingType ?? "")
//     .trim()
//     .toLowerCase()
//     .replace(/[_\s]+/g, "-");

//   if (
//     value === "intraday" ||
//     value === "day" ||
//     value === "day-trading"
//   ) {
//     return "intraday";
//   }

//   if (
//     value === "longterm" ||
//     value === "long-term"
//   ) {
//     return "longterm";
//   }

//   return "swing";
// }

// /* ==========================================================================
//    GET MARKET RANGE
// ========================================================================== */

// function getMarketRange(
//   tradingType: string
// ): string {
//   switch (normalizeTradingType(tradingType)) {
//     case "intraday":
//       return "5D";

//     case "longterm":
//       return "5Y";

//     case "swing":
//     default:
//       return "6M";
//   }
// }

// /* ==========================================================================
//    SAFE NUMBER
// ========================================================================== */

// function toFiniteNumber(
//   value: unknown
// ): number | null {
//   if (
//     value === null ||
//     value === undefined ||
//     value === ""
//   ) {
//     return null;
//   }

//   const number =
//     typeof value === "number"
//       ? value
//       : Number(value);

//   return Number.isFinite(number)
//     ? number
//     : null;
// }

// /* ==========================================================================
//    NORMALIZE TIMESTAMP

//    Supports:
//    - ISO timestamps
//    - Date strings
//    - Unix timestamps in seconds
//    - Unix timestamps in milliseconds

//    Date-only strings are preserved as YYYY-MM-DD.
// ========================================================================== */

// function normalizeTime(
//   value: unknown
// ): string | null {
//   if (
//     value === null ||
//     value === undefined ||
//     value === ""
//   ) {
//     return null;
//   }

//   if (typeof value === "number") {
//     if (!Number.isFinite(value)) {
//       return null;
//     }

//     const milliseconds =
//       Math.abs(value) < 1e12
//         ? value * 1000
//         : value;

//     const date = new Date(milliseconds);

//     return Number.isNaN(date.getTime())
//       ? null
//       : date.toISOString();
//   }

//   const raw = String(value).trim();

//   if (!raw) {
//     return null;
//   }

//   // Keep date-only candle keys stable.
//   if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
//     return raw;
//   }

//   // Handle numeric Unix timestamps supplied as strings.
//   if (/^\d{10,13}$/.test(raw)) {
//     const numeric = Number(raw);

//     const milliseconds =
//       raw.length <= 10
//         ? numeric * 1000
//         : numeric;

//     const date = new Date(milliseconds);

//     return Number.isNaN(date.getTime())
//       ? null
//       : date.toISOString();
//   }

//   const date = new Date(raw);

//   return Number.isNaN(date.getTime())
//     ? null
//     : date.toISOString();
// }

// /* ==========================================================================
//    SORT KEY
// ========================================================================== */

// function getTimeKey(
//   time: string
// ): number {
//   const timestamp = Date.parse(time);

//   if (Number.isFinite(timestamp)) {
//     return timestamp;
//   }

//   // Handles YYYY-MM-DD consistently.
//   return Number.MAX_SAFE_INTEGER;
// }

// /* ==========================================================================
//    NORMALIZE CANDLE
// ========================================================================== */

// function normalizeCandle(
//   candle: unknown
// ): MarketCandle | null {
//   if (
//     !candle ||
//     typeof candle !== "object"
//   ) {
//     return null;
//   }

//   const item = candle as Record<string, unknown>;

//   const time = normalizeTime(
//     item.time ??
//       item.timestamp ??
//       item.date ??
//       item.datetime
//   );

//   const open = toFiniteNumber(item.open);
//   const high = toFiniteNumber(item.high);
//   const low = toFiniteNumber(item.low);
//   const close = toFiniteNumber(item.close);

//   const volume =
//     toFiniteNumber(
//       item.volume ??
//         item.vol ??
//         item.quantity
//     ) ?? 0;

//   if (
//     !time ||
//     open === null ||
//     high === null ||
//     low === null ||
//     close === null
//   ) {
//     return null;
//   }

//   // Reject malformed OHLC candles.
//   if (
//     high < low ||
//     high < open ||
//     high < close ||
//     low > open ||
//     low > close
//   ) {
//     return null;
//   }

//   return {
//     time,
//     open,
//     high,
//     low,
//     close,
//     volume: Math.max(0, volume),
//   };
// }

// /* ==========================================================================
//    EXTRACT RAW CANDLES
// ========================================================================== */

// function extractCandles(
//   data: unknown
// ): unknown[] {
//   if (!data || typeof data !== "object") {
//     return [];
//   }

//   const response = data as Record<string, unknown>;

//   const candidates = [
//     response.candles,
//     response.bars,
//     response.history,
//     response.data,
//   ];

//   for (const candidate of candidates) {
//     if (Array.isArray(candidate)) {
//       return candidate;
//     }

//     if (
//       candidate &&
//       typeof candidate === "object"
//     ) {
//       const nested = candidate as Record<string, unknown>;

//       if (Array.isArray(nested.candles)) {
//         return nested.candles;
//       }

//       if (Array.isArray(nested.bars)) {
//         return nested.bars;
//       }

//       if (Array.isArray(nested.data)) {
//         return nested.data;
//       }
//     }
//   }

//   return [];
// }

// /* ==========================================================================
//    GET MARKET DATA
// ========================================================================== */

// export async function getMarketData(
//   symbol: string,
//   tradingType: string
// ): Promise<MarketData> {
//   const cleanSymbol = decodeURIComponent(
//     String(symbol ?? "")
//   )
//     .trim()
//     .replace(/^NSE:/i, "")
//     .toUpperCase();

//   if (!cleanSymbol) {
//     throw new Error(
//       "Stock symbol is required."
//     );
//   }

//   const range = getMarketRange(tradingType);

//   /* ==========================================================================
//      CALL EXISTING STOCK API
//   ========================================================================== */

//   const request = new Request(
//     `http://internal/api/stock/${encodeURIComponent(
//       cleanSymbol
//     )}?range=${encodeURIComponent(range)}`,
//     {
//       method: "GET",
//       headers: {
//         Accept: "application/json",
//       },
//     }
//   );

//   let response: Response;

//   try {
//     response = await stockRouteGET(request, {
//       params: Promise.resolve({
//         symbol: cleanSymbol,
//       }),
//     });
//   } catch (error) {
//     console.error(
//       "[AI MARKET DATA] Stock route failed:",
//       error
//     );

//     throw new Error(
//       `Unable to retrieve market data for ${cleanSymbol}.`
//     );
//   }

//   /* ==========================================================================
//      PARSE RESPONSE
//   ========================================================================== */

//   let data: unknown;

//   try {
//     data = await response.json();
//   } catch {
//     throw new Error(
//       "Stock API returned an invalid JSON response."
//     );
//   }

//   if (!response.ok) {
//     const payload =
//       data && typeof data === "object"
//         ? (data as Record<string, unknown>)
//         : {};

//     const errorMessage =
//       typeof payload.error === "string"
//         ? payload.error
//         : typeof payload.message === "string"
//           ? payload.message
//           : `Unable to retrieve market data for ${cleanSymbol}.`;

//     console.error(
//       "[AI MARKET DATA] Stock API error:",
//       {
//         status: response.status,
//         data,
//       }
//     );

//     throw new Error(errorMessage);
//   }

//   if (!data || typeof data !== "object") {
//     throw new Error(
//       "Stock API returned an empty response."
//     );
//   }

//   const payload =
//     data as Record<string, unknown>;

//   /* ==========================================================================
//      NORMALIZE CANDLES
//   ========================================================================== */

//   const rawCandles = extractCandles(data);

//   if (rawCandles.length === 0) {
//     throw new Error(
//       `No historical market data is available for ${cleanSymbol}.`
//     );
//   }

//   const normalizedCandles = rawCandles
//     .map(normalizeCandle)
//     .filter(
//       (candle): candle is MarketCandle =>
//         candle !== null
//     );

//   if (normalizedCandles.length === 0) {
//     throw new Error(
//       `Market data for ${cleanSymbol} could not be normalized.`
//     );
//   }

//   /* ==========================================================================
//      SORT OLDEST TO NEWEST
//   ========================================================================== */

//   normalizedCandles.sort(
//     (a, b) =>
//       getTimeKey(a.time) - getTimeKey(b.time)
//   );

//   /* ==========================================================================
//      REMOVE DUPLICATE TIMESTAMPS

//      Keep the last occurrence after sorting.
//   ========================================================================== */

//   const candlesByTime =
//     new Map<string, MarketCandle>();

//   for (const candle of normalizedCandles) {
//     candlesByTime.set(
//       candle.time,
//       candle
//     );
//   }

//   const candles = Array.from(
//     candlesByTime.values()
//   ).sort(
//     (a, b) =>
//       getTimeKey(a.time) - getTimeKey(b.time)
//   );

//   if (candles.length === 0) {
//     throw new Error(
//       `No usable candles remain for ${cleanSymbol}.`
//     );
//   }

//   /* ==========================================================================
//      METADATA
//   ========================================================================== */

//   const instrumentKey =
//     typeof payload.instrumentKey === "string"
//       ? payload.instrumentKey
//       : typeof payload.instrument_key === "string"
//         ? payload.instrument_key
//         : "";

//   const interval =
//     typeof payload.interval === "string"
//       ? payload.interval
//       : "unknown";

//   const intervalUnit =
//     typeof payload.intervalUnit === "string"
//       ? payload.intervalUnit
//       : typeof payload.interval_unit === "string"
//         ? payload.interval_unit
//         : "";

//   const rawIntervalValue =
//     toFiniteNumber(
//       payload.intervalValue ??
//         payload.interval_value
//     );

//   return {
//     symbol:
//       typeof payload.symbol === "string"
//         ? payload.symbol
//         : cleanSymbol,

//     name:
//       typeof payload.name === "string"
//         ? payload.name
//         : cleanSymbol,

//     instrumentKey,

//     interval,
//     intervalUnit,
//     intervalValue: rawIntervalValue ?? 0,

//     candles,

//     fetchedAt: new Date().toISOString(),
//   };
// }







import { GET as stockRouteGET } from "@/app/api/stock/[symbol]/route";

/* ==========================================================================
   TYPES
========================================================================== */

export type MarketCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketData = {
  symbol: string;
  name: string;
  instrumentKey: string;

  interval: string;
  intervalUnit: string;
  intervalValue: number;

  candles: MarketCandle[];

  // Actual range represented by the normalized candles.
  startTime?: string;
  endTime?: string;

  // Useful for cache freshness checks and debugging.
  fetchedAt: string;
};

/* ==========================================================================
   NORMALIZE TRADING TYPE
========================================================================== */

function normalizeTradingType(
  tradingType: string
): "intraday" | "swing" | "longterm" {
  const value = String(tradingType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (
    value === "intraday" ||
    value === "day" ||
    value === "day-trading"
  ) {
    return "intraday";
  }

  if (
    value === "longterm" ||
    value === "long-term"
  ) {
    return "longterm";
  }

  return "swing";
}

/* ==========================================================================
   GET MARKET RANGE
========================================================================== */

function getMarketRange(tradingType: string): string {
  switch (normalizeTradingType(tradingType)) {
    case "intraday":
      return "5D";

    case "longterm":
      return "5Y";

    case "swing":
    default:
      return "6M";
  }
}

/* ==========================================================================
   SAFE NUMBER
========================================================================== */

function toFiniteNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

/* ==========================================================================
   NORMALIZE TIMESTAMP

   Supports:
   - ISO timestamps
   - Date strings
   - YYYY-MM-DD date-only values
   - Unix timestamps in seconds
   - Unix timestamps in milliseconds
========================================================================== */

function normalizeTime(
  value: unknown
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    const milliseconds =
      Math.abs(value) < 1e12
        ? value * 1000
        : value;

    const date = new Date(milliseconds);

    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString();
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  // Preserve date-only values without timezone conversion.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(`${raw}T00:00:00.000Z`);

    return Number.isNaN(parsed.getTime())
      ? null
      : raw;
  }

  // Handle Unix timestamps supplied as strings.
  if (/^\d{10,13}$/.test(raw)) {
    const numeric = Number(raw);

    const milliseconds =
      raw.length <= 10
        ? numeric * 1000
        : numeric;

    const date = new Date(milliseconds);

    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString();
  }

  const date = new Date(raw);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

/* ==========================================================================
   SORT KEY
========================================================================== */

function getTimeKey(time: string): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(time)) {
    return Date.parse(`${time}T00:00:00.000Z`);
  }

  const timestamp = Date.parse(time);

  return Number.isFinite(timestamp)
    ? timestamp
    : Number.MAX_SAFE_INTEGER;
}

/* ==========================================================================
   NORMALIZE CANDLE
========================================================================== */

function normalizeCandle(
  value: unknown
): MarketCandle | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;

  const time = normalizeTime(
    item.time ??
      item.timestamp ??
      item.date ??
      item.datetime ??
      item.startTime ??
      item.start_time
  );

  const open = toFiniteNumber(item.open);
  const high = toFiniteNumber(item.high);
  const low = toFiniteNumber(item.low);
  const close = toFiniteNumber(item.close);

  const volume =
    toFiniteNumber(
      item.volume ??
        item.vol ??
        item.quantity
    ) ?? 0;

  if (
    !time ||
    open === null ||
    high === null ||
    low === null ||
    close === null
  ) {
    return null;
  }

  if (
    open <= 0 ||
    high <= 0 ||
    low <= 0 ||
    close <= 0 ||
    high < low ||
    high < open ||
    high < close ||
    low > open ||
    low > close
  ) {
    return null;
  }

  return {
    time,
    open,
    high,
    low,
    close,
    volume: Math.max(0, volume),
  };
}

/* ==========================================================================
   EXTRACT CANDLES
========================================================================== */

function extractCandles(data: unknown): unknown[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as Record<string, unknown>;

  const candidates = [
    response.candles,
    response.bars,
    response.history,
    response.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate === "object"
    ) {
      const nested = candidate as Record<string, unknown>;

      if (Array.isArray(nested.candles)) {
        return nested.candles;
      }

      if (Array.isArray(nested.bars)) {
        return nested.bars;
      }

      if (Array.isArray(nested.history)) {
        return nested.history;
      }

      if (Array.isArray(nested.data)) {
        return nested.data;
      }
    }
  }

  return [];
}

/* ==========================================================================
   EXTRACT STRING METADATA
========================================================================== */

function getString(
  record: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return undefined;
}

/* ==========================================================================
   INSTRUMENT VALIDATION
========================================================================== */

function normalizeInstrumentKey(
  value: unknown
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function normalizeSymbol(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/^NSE:/, "");

  return normalized || undefined;
}

/* ==========================================================================
   GET MARKET DATA
========================================================================== */

export async function getMarketData(
  symbol: string,
  tradingType: string,
  selectedInstrumentKey?: string
): Promise<MarketData> {
  const decodedSymbol = (() => {
    try {
      return decodeURIComponent(String(symbol ?? ""));
    } catch {
      return String(symbol ?? "");
    }
  })();

  const cleanSymbol = decodedSymbol
    .trim()
    .replace(/^NSE:/i, "")
    .toUpperCase();

  const expectedInstrumentKey =
    normalizeInstrumentKey(selectedInstrumentKey);

  if (!cleanSymbol) {
    throw new Error("Stock symbol is required.");
  }

  const range = getMarketRange(tradingType);

  /* ==========================================================================
     CALL EXISTING STOCK API

     The stock route must resolve the requested symbol to its actual
     instrument and return candles for that same instrument.

     If the route supports an instrumentKey query parameter, pass it
     through so the exact selected instrument can be requested.
  ========================================================================== */

  const query = new URLSearchParams({
    range,
  });

  if (expectedInstrumentKey) {
    query.set("instrumentKey", expectedInstrumentKey);
  }

  const request = new Request(
    `http://internal/api/stock/${encodeURIComponent(
      cleanSymbol
    )}?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  let response: Response;

  try {
    response = await stockRouteGET(request, {
      params: Promise.resolve({
        symbol: cleanSymbol,
      }),
    });
  } catch (error: unknown) {
    console.error(
      "[AI MARKET DATA] Stock route failed:",
      error
    );

    throw new Error(
      `Unable to retrieve market data for ${cleanSymbol}.`
    );
  }

  /* ==========================================================================
     PARSE RESPONSE
  ========================================================================== */

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Stock API returned an invalid JSON response."
    );
  }

  if (!response.ok) {
    const payload =
      data && typeof data === "object"
        ? (data as Record<string, unknown>)
        : {};

    const errorMessage =
      getString(payload, "error", "message") ??
      `Unable to retrieve market data for ${cleanSymbol}.`;

    console.error("[AI MARKET DATA] Stock API error:", {
      status: response.status,
      data,
    });

    throw new Error(errorMessage);
  }

  if (!data || typeof data !== "object") {
    throw new Error(
      "Stock API returned an empty response."
    );
  }

  const payload = data as Record<string, unknown>;

  /* ==========================================================================
     VERIFY SELECTED INSTRUMENT
  ========================================================================== */

  const responseInstrumentKey = normalizeInstrumentKey(
    payload.instrumentKey ??
      payload.instrument_key ??
      payload.instrumentToken ??
      payload.instrument_token
  );

  if (
    expectedInstrumentKey &&
    responseInstrumentKey &&
    responseInstrumentKey !== expectedInstrumentKey
  ) {
    throw new Error(
      `Instrument mismatch for ${cleanSymbol}. ` +
      "The market-data API returned a different instrument than the one selected."
    );
  }

  const responseSymbol = normalizeSymbol(
    payload.symbol ?? payload.tradingSymbol ?? payload.trading_symbol
  );

  if (
    responseSymbol &&
    responseSymbol !== normalizeSymbol(cleanSymbol)
  ) {
    throw new Error(
      `Symbol mismatch: requested ${cleanSymbol}, ` +
      `but the stock API returned ${responseSymbol}.`
    );
  }

  /* ==========================================================================
     NORMALIZE CANDLES
  ========================================================================== */

  const rawCandles = extractCandles(data);

  if (rawCandles.length === 0) {
    throw new Error(
      `No historical market data is available for ${cleanSymbol}.`
    );
  }

  const normalizedCandles = rawCandles
    .map(normalizeCandle)
    .filter(
      (candle): candle is MarketCandle =>
        candle !== null
    );

  if (normalizedCandles.length === 0) {
    throw new Error(
      `Market data for ${cleanSymbol} could not be normalized.`
    );
  }

  /* ==========================================================================
     SORT OLDEST TO NEWEST
  ========================================================================== */

  normalizedCandles.sort(
    (a, b) => getTimeKey(a.time) - getTimeKey(b.time)
  );

  /* ==========================================================================
     REMOVE DUPLICATE TIMESTAMPS

     Keep the last occurrence for each timestamp.
  ========================================================================== */

  const candlesByTime = new Map<string, MarketCandle>();

  for (const candle of normalizedCandles) {
    candlesByTime.set(candle.time, candle);
  }

  const candles = Array.from(candlesByTime.values()).sort(
    (a, b) => getTimeKey(a.time) - getTimeKey(b.time)
  );

  if (candles.length === 0) {
    throw new Error(
      `No usable candles remain for ${cleanSymbol}.`
    );
  }

  /* ==========================================================================
     METADATA

     Derive the date range from the actual returned candles.
     Do not fabricate dates when the source has no valid timestamps.
  ========================================================================== */

  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];

  const instrumentKey =
    responseInstrumentKey ??
    expectedInstrumentKey ??
    "";

  const interval = getString(payload, "interval") ?? "";

  const intervalUnit =
    getString(payload, "intervalUnit", "interval_unit") ?? "";

  const intervalValue =
    toFiniteNumber(
      payload.intervalValue ??
        payload.interval_value
    ) ?? 0;

  const responseName =
    getString(payload, "name", "stockName", "stock_name") ??
    cleanSymbol;

  const responseDateRangeStart = normalizeTime(
    payload.startTime ??
      payload.start_time ??
      payload.fromDate ??
      payload.from_date
  );

  const responseDateRangeEnd = normalizeTime(
    payload.endTime ??
      payload.end_time ??
      payload.toDate ??
      payload.to_date
  );

  return {
    symbol: responseSymbol ?? cleanSymbol,
    name: responseName,
    instrumentKey,

    interval,
    intervalUnit,
    intervalValue,

    candles,

    // Prefer a valid source-supplied date range; otherwise use
    // the actual first and last candle timestamps.
    startTime: responseDateRangeStart ?? firstCandle.time,
    endTime: responseDateRangeEnd ?? lastCandle.time,

    fetchedAt: new Date().toISOString(),
  };
}
