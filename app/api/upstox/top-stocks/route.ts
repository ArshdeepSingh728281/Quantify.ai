// import { NextResponse } from "next/server";
// import { gunzipSync } from "zlib";

// import clientPromise from "@/lib/mongodb";

// import {
//   getTopStocksCollection,
//   TopStock,
// } from "@/models/TopStocks";


// /*
// |--------------------------------------------------------------------------
// | TYPES
// |--------------------------------------------------------------------------
// */

// type UpstoxInstrument = {
//   segment?: string;

//   name?: string;

//   exchange?: string;

//   isin?: string;

//   instrument_type?: string;

//   instrument_key?: string;

//   trading_symbol?: string;

//   short_name?: string;

//   security_type?: string;
// };


// type UpstoxOHLC = {
//   open?: number;

//   high?: number;

//   low?: number;

//   close?: number;
// };


// type UpstoxQuote = {
//   ohlc?: UpstoxOHLC;

//   instrument_token?: string;

//   symbol?: string;

//   last_price?: number;

//   volume?: number;

//   average_price?: number;

//   net_change?: number;

//   timestamp?: string;

//   last_trade_time?: string;
// };


// /*
// |--------------------------------------------------------------------------
// | CONSTANTS
// |--------------------------------------------------------------------------
// */

// const NSE_INSTRUMENTS_URL =
//   "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";


// const QUOTE_BATCH_SIZE = 500;

// const TOP_STOCK_COUNT = 10;


// /*
//  * 30 MINUTES
//  */

// const CACHE_TIME =
//   30 * 60 * 1000;


// /*
// |--------------------------------------------------------------------------
// | NUMBER HELPER
// |--------------------------------------------------------------------------
// */

// function numberOrNull(
//   value: unknown
// ): number | null {

//   const number =
//     Number(value);

//   if (
//     !Number.isFinite(number)
//   ) {
//     return null;
//   }

//   return number;
// }


// /*
// |--------------------------------------------------------------------------
// | CREATE SPARKLINE
// |--------------------------------------------------------------------------
// */

// function createChart(
//   quote: UpstoxQuote
// ): number[] {

//   const open =
//     numberOrNull(
//       quote.ohlc?.open
//     );

//   const high =
//     numberOrNull(
//       quote.ohlc?.high
//     );

//   const low =
//     numberOrNull(
//       quote.ohlc?.low
//     );

//   const close =
//     numberOrNull(
//       quote.ohlc?.close
//     );

//   const lastPrice =
//     numberOrNull(
//       quote.last_price
//     );

//   const netChange =
//     numberOrNull(
//       quote.net_change
//     );


//   const previousClose =
//     lastPrice !== null &&
//     netChange !== null
//       ? lastPrice - netChange
//       : null;


//   const values = [
//     previousClose,
//     open,
//     low,
//     open,
//     high,
//     close,
//     lastPrice,
//   ].filter(
//     (
//       value
//     ): value is number =>
//       value !== null &&
//       Number.isFinite(value)
//   );


//   if (
//     values.length === 0
//   ) {
//     return [];
//   }


//   if (
//     values.length === 1
//   ) {

//     return [
//       values[0],
//       values[0],
//       values[0],
//       values[0],
//       values[0],
//       values[0],
//       values[0],
//     ];
//   }


//   while (
//     values.length < 7
//   ) {

//     values.push(
//       values[
//         values.length - 1
//       ]
//     );
//   }


//   return values;
// }


// /*
// |--------------------------------------------------------------------------
// | FETCH NSE INSTRUMENTS
// |--------------------------------------------------------------------------
// */

// async function fetchNSEInstruments(): Promise<
//   UpstoxInstrument[]
// > {

//   const response =
//     await fetch(
//       NSE_INSTRUMENTS_URL,
//       {
//         method: "GET",

//         headers: {
//           Accept:
//             "application/json",
//         },

//         cache: "no-store",
//       }
//     );


//   if (
//     !response.ok
//   ) {

//     throw new Error(
//       `Failed to download Upstox NSE instruments: ${response.status}`
//     );
//   }


//   const buffer =
//     Buffer.from(
//       await response.arrayBuffer()
//     );


//   let jsonText: string;


//   if (
//     buffer.length >= 2 &&
//     buffer[0] === 0x1f &&
//     buffer[1] === 0x8b
//   ) {

//     jsonText =
//       gunzipSync(
//         buffer
//       ).toString(
//         "utf-8"
//       );

//   } else {

//     jsonText =
//       buffer.toString(
//         "utf-8"
//       );
//   }


//   const data =
//     JSON.parse(
//       jsonText
//     );


//   if (
//     !Array.isArray(data)
//   ) {

//     throw new Error(
//       "Invalid Upstox NSE instrument file."
//     );
//   }


//   return data.filter(
//     (
//       instrument: UpstoxInstrument
//     ) => {

//       return (
//         instrument.segment ===
//           "NSE_EQ" &&

//         instrument.instrument_type ===
//           "EQ" &&

//         Boolean(
//           instrument.instrument_key
//         ) &&

//         Boolean(
//           instrument.trading_symbol
//         )
//       );
//     }
//   );
// }


// /*
// |--------------------------------------------------------------------------
// | FETCH MARKET QUOTES
// |--------------------------------------------------------------------------
// */

// async function fetchQuotes(
//   instruments: UpstoxInstrument[],
//   token: string
// ): Promise<UpstoxQuote[]> {

//   const allQuotes:
//     UpstoxQuote[] = [];


//   for (
//     let i = 0;
//     i < instruments.length;
//     i += QUOTE_BATCH_SIZE
//   ) {

//     const batch =
//       instruments.slice(
//         i,
//         i + QUOTE_BATCH_SIZE
//       );


//     const instrumentKeys =
//       batch
//         .map(
//           (
//             instrument
//           ) =>
//             instrument.instrument_key
//         )
//         .filter(
//           (
//             key
//           ): key is string =>
//             Boolean(key)
//         )
//         .join(",");


//     if (
//       !instrumentKeys
//     ) {
//       continue;
//     }


//     const url =
//       `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(
//         instrumentKeys
//       )}`;


//     const response =
//       await fetch(
//         url,
//         {
//           method: "GET",

//           headers: {
//             Accept:
//               "application/json",

//             Authorization:
//               `Bearer ${token}`,
//           },

//           cache: "no-store",
//         }
//       );


//     const responseText =
//       await response.text();


//     let data: {
//       status?: string;

//       data?: Record<
//         string,
//         UpstoxQuote
//       >;

//       errors?: unknown;
//     };


//     try {

//       data =
//         JSON.parse(
//           responseText
//         );

//     } catch {

//       throw new Error(
//         `Upstox returned invalid JSON for quote batch ${
//           Math.floor(
//             i / QUOTE_BATCH_SIZE
//           ) + 1
//         }.`
//       );
//     }


//     if (
//       !response.ok
//     ) {

//       console.error(
//         "Upstox quote error:",
//         data
//       );

//       throw new Error(
//         `Upstox market quote request failed: ${response.status}`
//       );
//     }


//     const quotes =
//       Object.values(
//         data.data || {}
//       );


//     allQuotes.push(
//       ...quotes
//     );
//   }


//   return allQuotes;
// }


// /*
// |--------------------------------------------------------------------------
// | CREATE STOCK
// |--------------------------------------------------------------------------
// */

// function createStock(
//   instrument: UpstoxInstrument,
//   quote: UpstoxQuote
// ): TopStock {

//   const price =
//     numberOrNull(
//       quote.last_price
//     );


//   const netChange =
//     numberOrNull(
//       quote.net_change
//     );


//   const open =
//     numberOrNull(
//       quote.ohlc?.open
//     );


//   const high =
//     numberOrNull(
//       quote.ohlc?.high
//     );


//   const low =
//     numberOrNull(
//       quote.ohlc?.low
//     );


//   const close =
//     numberOrNull(
//       quote.ohlc?.close
//     );


//   const volume =
//     numberOrNull(
//       quote.volume
//     );


//   const averagePrice =
//     numberOrNull(
//       quote.average_price
//     );


//   let changePercent:
//     | number
//     | null = null;


//   if (
//     price !== null &&
//     netChange !== null
//   ) {

//     const previousClose =
//       price -
//       netChange;


//     if (
//       previousClose !== 0 &&
//       Number.isFinite(
//         previousClose
//       )
//     ) {

//       changePercent =
//         (
//           netChange /
//           previousClose
//         ) *
//         100;
//     }
//   }


//   if (
//     changePercent === null &&
//     price !== null &&
//     close !== null &&
//     close !== 0
//   ) {

//     changePercent =
//       (
//         (price - close) /
//         close
//       ) *
//       100;
//   }


//   return {

//     rank: 0,

//     symbol:
//       instrument.trading_symbol ||
//       quote.symbol ||
//       "",

//     shortName:
//       instrument.short_name ||
//       instrument.trading_symbol ||
//       quote.symbol ||
//       "",

//     name:
//       instrument.name ||
//       instrument.trading_symbol ||
//       quote.symbol ||
//       "",

//     instrumentKey:
//       instrument.instrument_key ||
//       quote.instrument_token ||
//       "",

//     price,

//     change:
//       changePercent,

//     changePercent,

//     open,

//     high,

//     low,

//     close,

//     volume,

//     averagePrice,

//     chart:
//       createChart(
//         quote
//       ),
//   };
// }


// /*
// |--------------------------------------------------------------------------
// | GET
// |--------------------------------------------------------------------------
// */

// export async function GET() {

//   try {

//     /*
//     |--------------------------------------------------------------------------
//     | 1. CONNECT TO MONGODB
//     |--------------------------------------------------------------------------
//     */

//     const client =
//       await clientPromise;


//     const db =
//       client.db();


//     const collection =
//       getTopStocksCollection(
//         db
//       );


//     /*
//     |--------------------------------------------------------------------------
//     | 2. CHECK DATABASE CACHE
//     |--------------------------------------------------------------------------
//     */

//     const cached =
//       await collection.findOne(
//         {
//           type:
//             "top-stocks",
//         }
//       );


//     if (
//       cached
//     ) {

//       const calculatedAt =
//         new Date(
//           cached.calculatedAt
//         ).getTime();


//       const age =
//         Date.now() -
//         calculatedAt;


//       /*
//        * If data is younger than
//        * 30 minutes, return it.
//        */

//       if (
//         age <
//         CACHE_TIME
//       ) {

//         console.log(
//           "Returning Top 10 stocks from MongoDB cache."
//         );


//         return NextResponse.json(
//           {
//             success: true,

//             stocks:
//               cached.stocks,

//             calculatedAt:
//               cached.calculatedAt,

//             expiresAt:
//               cached.expiresAt,

//             source:
//               "MongoDB cache",

//             sort:
//               "volume_desc",
//           },
//           {
//             status: 200,

//             headers: {
//               "Cache-Control":
//                 "no-store",
//             },
//           }
//         );
//       }
//     }


//     /*
//     |--------------------------------------------------------------------------
//     | 3. CACHE EXPIRED
//     |--------------------------------------------------------------------------
//     |
//     | Only now do we call Upstox.
//     |
//     */

//     console.log(
//       "Top 10 cache expired. Fetching fresh Upstox data..."
//     );


//     const accessToken =
//       process.env.UPSTOX_ACCESS_TOKEN;


//     const token =
//       accessToken
//         ?.trim()
//         .replace(
//           /^["']|["']$/g,
//           ""
//         );


//     if (
//       !token
//     ) {

//       return NextResponse.json(
//         {
//           error:
//             "UPSTOX_ACCESS_TOKEN is not configured.",
//         },
//         {
//           status: 500,
//         }
//       );
//     }


//     /*
//     |--------------------------------------------------------------------------
//     | 4. GET NSE UNIVERSE
//     |--------------------------------------------------------------------------
//     */

//     const instruments =
//       await fetchNSEInstruments();


//     console.log(
//       `NSE instruments: ${instruments.length}`
//     );


//     /*
//     |--------------------------------------------------------------------------
//     | 5. FETCH MARKET QUOTES
//     |--------------------------------------------------------------------------
//     */

//     const quotes =
//       await fetchQuotes(
//         instruments,
//         token
//       );


//     console.log(
//       `Quotes received: ${quotes.length}`
//     );


//     /*
//     |--------------------------------------------------------------------------
//     | 6. CREATE INSTRUMENT MAP
//     |--------------------------------------------------------------------------
//     */

//     const instrumentMap =
//       new Map<
//         string,
//         UpstoxInstrument
//       >();


//     for (
//       const instrument of
//         instruments
//     ) {

//       if (
//         instrument.instrument_key
//       ) {

//         instrumentMap.set(
//           instrument.instrument_key,
//           instrument
//         );
//       }
//     }


//     /*
//     |--------------------------------------------------------------------------
//     | 7. CREATE STOCK LIST
//     |--------------------------------------------------------------------------
//     */

//     const stocksWithVolume =
//       quotes
//         .map(
//           (
//             quote
//           ) => {

//             let instrument:
//               | UpstoxInstrument
//               | undefined;


//             /*
//              * Match using instrument key.
//              */

//             if (
//               quote.instrument_token
//             ) {

//               instrument =
//                 instrumentMap.get(
//                   quote.instrument_token
//                 );
//             }


//             /*
//              * Fallback to symbol.
//              */

//             if (
//               !instrument &&
//               quote.symbol
//             ) {

//               instrument =
//                 instruments.find(
//                   (
//                     item
//                   ) =>
//                     item.trading_symbol ===
//                     quote.symbol
//                 );
//             }


//             if (
//               !instrument
//             ) {

//               return null;
//             }


//             const volume =
//               numberOrNull(
//                 quote.volume
//               );


//             if (
//               volume === null
//             ) {

//               return null;
//             }


//             return {
//               stock:
//                 createStock(
//                   instrument,
//                   quote
//                 ),

//               volume,
//             };
//           }
//         )
//         .filter(
//           (
//             item
//           ): item is {
//             stock: TopStock;

//             volume: number;
//           } =>
//             item !== null
//         );


//     /*
//     |--------------------------------------------------------------------------
//     | 8. SORT BY VOLUME
//     |--------------------------------------------------------------------------
//     */

//     stocksWithVolume.sort(
//       (
//         a,
//         b
//       ) =>
//         b.volume -
//         a.volume
//     );


//     /*
//     |--------------------------------------------------------------------------
//     | 9. TAKE TOP 10
//     |--------------------------------------------------------------------------
//     */

//     const topStocks =
//       stocksWithVolume
//         .slice(
//           0,
//           TOP_STOCK_COUNT
//         )
//         .map(
//           (
//             item,
//             index
//           ) => {

//             return {
//               ...item.stock,

//               rank:
//                 index + 1,
//             };
//           }
//         );


//     /*
//     |--------------------------------------------------------------------------
//     | 10. SAVE TO MONGODB
//     |--------------------------------------------------------------------------
//     */

//     const calculatedAt =
//       new Date();


//     const expiresAt =
//       new Date(
//         calculatedAt.getTime() +
//           CACHE_TIME
//       );


//     await collection.updateOne(
//       {
//         type:
//           "top-stocks",
//       },

//       {
//         $set: {
//           type:
//             "top-stocks",

//           stocks:
//             topStocks,

//           calculatedAt,

//           expiresAt,
//         },
//       },

//       {
//         upsert: true,
//       }
//     );


//     console.log(
//       "Top 10 stocks saved to MongoDB."
//     );


//     /*
//     |--------------------------------------------------------------------------
//     | 11. RETURN
//     |--------------------------------------------------------------------------
//     */

//     return NextResponse.json(
//       {
//         success: true,

//         stocks:
//           topStocks,

//         calculatedAt,

//         expiresAt,

//         source:
//           "Upstox Full Market Quote",

//         sort:
//           "volume_desc",
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
//       "Top stocks API error:",
//       error
//     );


//     return NextResponse.json(
//       {
//         success: false,

//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to fetch top stocks.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }








import { NextResponse } from "next/server";
import { gunzipSync } from "zlib";

import clientPromise from "@/lib/mongodb";

import {
  getTopStocksCollection,
  TopStock,
} from "@/models/TopStocks";


/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type UpstoxInstrument = {
  segment?: string;

  name?: string;

  exchange?: string;

  isin?: string;

  instrument_type?: string;

  instrument_key?: string;

  trading_symbol?: string;

  short_name?: string;

  security_type?: string;
};


type UpstoxOHLC = {
  open?: number;

  high?: number;

  low?: number;

  close?: number;
};


type UpstoxQuote = {
  ohlc?: UpstoxOHLC;

  instrument_token?: string;

  symbol?: string;

  last_price?: number;

  volume?: number;

  average_price?: number;

  net_change?: number;

  timestamp?: string;

  last_trade_time?: string;
};


/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const NSE_INSTRUMENTS_URL =
  "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";


const QUOTE_BATCH_SIZE = 500;

const TOP_STOCK_COUNT = 10;


/*
|--------------------------------------------------------------------------
| CACHE SETTINGS
|--------------------------------------------------------------------------
|
| During market hours:
|
|   Data younger than 20 minutes
|   = MongoDB
|
|   Data 20+ minutes old
|   = Upstox
|
*/

const CACHE_TIME =
  20 * 60 * 1000;


/*
|--------------------------------------------------------------------------
| INDIAN MARKET HOURS
|--------------------------------------------------------------------------
|
| Monday - Friday
| 09:15 AM - 05:00 PM IST
|
| Outside this window we NEVER
| call Upstox.
|
*/

const MARKET_TIME_ZONE =
  "Asia/Kolkata";

const MARKET_OPEN_HOUR = 9;

const MARKET_OPEN_MINUTE = 15;

const MARKET_CLOSE_HOUR = 17;

const MARKET_CLOSE_MINUTE = 0;


/*
|--------------------------------------------------------------------------
| NUMBER HELPER
|--------------------------------------------------------------------------
*/

function numberOrNull(
  value: unknown
): number | null {

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return null;
  }

  return number;
}


/*
|--------------------------------------------------------------------------
| GET CURRENT IST TIME
|--------------------------------------------------------------------------
|
| We use Intl instead of relying on
| the server's timezone.
|
*/

function getISTParts(
  date: Date = new Date()
) {

  const formatter =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        timeZone:
          MARKET_TIME_ZONE,

        weekday:
          "short",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hourCycle:
          "h23",
      }
    );


  const parts =
    formatter.formatToParts(
      date
    );


  const get =
    (
      type: string
    ) =>
      parts.find(
        (part) =>
          part.type === type
      )?.value || "";


  return {
    weekday:
      get("weekday"),

    hour:
      Number(get("hour")),

    minute:
      Number(get("minute")),

    second:
      Number(get("second")),
  };
}


/*
|--------------------------------------------------------------------------
| CHECK MARKET HOURS
|--------------------------------------------------------------------------
*/

function isMarketHours(
  date: Date = new Date()
): boolean {

  const parts =
    getISTParts(date);


  /*
   * Saturday / Sunday
   */

  if (
    parts.weekday === "Sat" ||
    parts.weekday === "Sun"
  ) {
    return false;
  }


  const currentMinutes =
    parts.hour * 60 +
    parts.minute;


  const marketOpen =
    MARKET_OPEN_HOUR * 60 +
    MARKET_OPEN_MINUTE;


  const marketClose =
    MARKET_CLOSE_HOUR * 60 +
    MARKET_CLOSE_MINUTE;


  return (
    currentMinutes >=
      marketOpen &&
    currentMinutes <=
      marketClose
  );
}


/*
|--------------------------------------------------------------------------
| CREATE SPARKLINE
|--------------------------------------------------------------------------
*/

function createChart(
  quote: UpstoxQuote
): number[] {

  const open =
    numberOrNull(
      quote.ohlc?.open
    );


  const high =
    numberOrNull(
      quote.ohlc?.high
    );


  const low =
    numberOrNull(
      quote.ohlc?.low
    );


  const close =
    numberOrNull(
      quote.ohlc?.close
    );


  const lastPrice =
    numberOrNull(
      quote.last_price
    );


  const netChange =
    numberOrNull(
      quote.net_change
    );


  /*
   * Previous close:
   *
   * last price =
   * previous close + net change
   */

  const previousClose =
    lastPrice !== null &&
    netChange !== null
      ? lastPrice -
        netChange
      : null;


  const values = [
    previousClose,

    open,

    low,

    open,

    high,

    close,

    lastPrice,
  ].filter(
    (
      value
    ): value is number =>
      value !== null &&
      Number.isFinite(
        value
      )
  );


  if (
    values.length === 0
  ) {
    return [];
  }


  if (
    values.length === 1
  ) {

    return [
      values[0],
      values[0],
      values[0],
      values[0],
      values[0],
      values[0],
      values[0],
    ];

  }


  while (
    values.length < 7
  ) {

    values.push(
      values[
        values.length - 1
      ]
    );

  }


  return values;
}


/*
|--------------------------------------------------------------------------
| FETCH NSE INSTRUMENTS
|--------------------------------------------------------------------------
*/

async function fetchNSEInstruments(): Promise<
  UpstoxInstrument[]
> {

  const response =
    await fetch(
      NSE_INSTRUMENTS_URL,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );


  if (
    !response.ok
  ) {

    throw new Error(
      `Failed to download Upstox NSE instruments: ${response.status}`
    );

  }


  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    );


  let jsonText:
    string;


  if (
    buffer.length >= 2 &&
    buffer[0] === 0x1f &&
    buffer[1] === 0x8b
  ) {

    jsonText =
      gunzipSync(
        buffer
      ).toString(
        "utf-8"
      );

  } else {

    jsonText =
      buffer.toString(
        "utf-8"
      );

  }


  const data =
    JSON.parse(
      jsonText
    );


  if (
    !Array.isArray(data)
  ) {

    throw new Error(
      "Invalid Upstox NSE instrument file."
    );

  }


  return data.filter(
    (
      instrument:
        UpstoxInstrument
    ) => {

      return (
        instrument.segment ===
          "NSE_EQ" &&

        instrument.instrument_type ===
          "EQ" &&

        Boolean(
          instrument.instrument_key
        ) &&

        Boolean(
          instrument.trading_symbol
        )
      );

    }
  );
}


/*
|--------------------------------------------------------------------------
| FETCH MARKET QUOTES
|--------------------------------------------------------------------------
*/

async function fetchQuotes(
  instruments:
    UpstoxInstrument[],

  token:
    string
): Promise<
  UpstoxQuote[]
> {

  const allQuotes:
    UpstoxQuote[] = [];


  for (
    let i = 0;

    i <
    instruments.length;

    i +=
      QUOTE_BATCH_SIZE
  ) {

    const batch =
      instruments.slice(
        i,
        i +
          QUOTE_BATCH_SIZE
      );


    const instrumentKeys =
      batch
        .map(
          (
            instrument
          ) =>
            instrument.instrument_key
        )
        .filter(
          (
            key
          ): key is string =>
            Boolean(key)
        )
        .join(",");


    if (
      !instrumentKeys
    ) {
      continue;
    }


    const url =
      `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(
        instrumentKeys
      )}`;


    const response =
      await fetch(
        url,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          cache:
            "no-store",
        }
      );


    const responseText =
      await response.text();


    let data: {
      status?: string;

      data?: Record<
        string,
        UpstoxQuote
      >;

      errors?: unknown;
    };


    try {

      data =
        JSON.parse(
          responseText
        );

    } catch {

      throw new Error(
        `Upstox returned invalid JSON for quote batch ${
          Math.floor(
            i /
              QUOTE_BATCH_SIZE
          ) + 1
        }.`
      );

    }


    if (
      !response.ok
    ) {

      console.error(
        "Upstox quote error:",
        data
      );


      throw new Error(
        `Upstox market quote request failed: ${response.status}`
      );

    }


    const quotes =
      Object.values(
        data.data || {}
      );


    allQuotes.push(
      ...quotes
    );

  }


  return allQuotes;
}


/*
|--------------------------------------------------------------------------
| CREATE STOCK
|--------------------------------------------------------------------------
*/

function createStock(
  instrument:
    UpstoxInstrument,

  quote:
    UpstoxQuote
): TopStock {

  const price =
    numberOrNull(
      quote.last_price
    );


  const netChange =
    numberOrNull(
      quote.net_change
    );


  const open =
    numberOrNull(
      quote.ohlc?.open
    );


  const high =
    numberOrNull(
      quote.ohlc?.high
    );


  const low =
    numberOrNull(
      quote.ohlc?.low
    );


  const close =
    numberOrNull(
      quote.ohlc?.close
    );


  const volume =
    numberOrNull(
      quote.volume
    );


  const averagePrice =
    numberOrNull(
      quote.average_price
    );


  let changePercent:
    number |
    null = null;


  /*
   * Calculate percentage change
   */

  if (
    price !== null &&
    netChange !== null
  ) {

    const previousClose =
      price -
      netChange;


    if (
      previousClose !== 0 &&
      Number.isFinite(
        previousClose
      )
    ) {

      changePercent =
        (
          netChange /
          previousClose
        ) *
        100;

    }

  }


  /*
   * Fallback calculation
   */

  if (
    changePercent === null &&
    price !== null &&
    close !== null &&
    close !== 0
  ) {

    changePercent =
      (
        (
          price -
          close
        ) /
        close
      ) *
      100;

  }


  return {

    rank:
      0,

    symbol:
      instrument.trading_symbol ||
      quote.symbol ||
      "",

    shortName:
      instrument.short_name ||
      instrument.trading_symbol ||
      quote.symbol ||
      "",

    name:
      instrument.name ||
      instrument.trading_symbol ||
      quote.symbol ||
      "",

    instrumentKey:
      instrument.instrument_key ||
      quote.instrument_token ||
      "",

    price,

    change:
      changePercent,

    changePercent,

    open,

    high,

    low,

    close,

    volume,

    averagePrice,

    chart:
      createChart(
        quote
      ),

  };
}


/*
|--------------------------------------------------------------------------
| RETURN CACHED DATA
|--------------------------------------------------------------------------
*/

function returnCachedData(
  cached: any,
  source: string
) {

  return NextResponse.json(
    {
      success:
        true,

      stocks:
        cached.stocks,

      calculatedAt:
        cached.calculatedAt,

      expiresAt:
        cached.expiresAt,

      source,

      sort:
        "volume_desc",
    },
    {
      status:
        200,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );

}


/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET() {

  try {

    /*
    |--------------------------------------------------------------------------
    | 1. CURRENT IST TIME
    |--------------------------------------------------------------------------
    */

    const now =
      new Date();


    const ist =
      getISTParts(
        now
      );


    const marketOpen =
      isMarketHours(
        now
      );


    console.log(
      `Market status: ${
        marketOpen
          ? "OPEN"
          : "CLOSED"
      } | IST ${String(
        ist.hour
      ).padStart(
        2,
        "0"
      )}:${String(
        ist.minute
      ).padStart(
        2,
        "0"
      )}`
    );


    /*
    |--------------------------------------------------------------------------
    | 2. CONNECT TO MONGODB
    |--------------------------------------------------------------------------
    */

    const client =
      await clientPromise;


    const db =
      client.db();


    const collection =
      getTopStocksCollection(
        db
      );


    /*
    |--------------------------------------------------------------------------
    | 3. GET DATABASE CACHE
    |--------------------------------------------------------------------------
    */

    const cached =
      await collection.findOne(
        {
          type:
            "top-stocks",
        }
      );


    /*
    |--------------------------------------------------------------------------
    | 4. HANDLE DATABASE CACHE
    |--------------------------------------------------------------------------
    */

    if (
      cached
    ) {

      const calculatedAt =
        new Date(
          cached.calculatedAt
        ).getTime();


      const age =
        Date.now() -
        calculatedAt;


      /*
      |--------------------------------------------------------------------------
      | OUTSIDE MARKET HOURS
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | We ALWAYS use MongoDB.
      |
      | We NEVER call Upstox.
      |
      */

      if (
        !marketOpen
      ) {

        console.log(
          "Market closed. Returning Top 10 stocks from MongoDB."
        );


        return returnCachedData(
          cached,
          "MongoDB cache - market closed"
        );

      }


      /*
      |--------------------------------------------------------------------------
      | MARKET OPEN + CACHE FRESH
      |--------------------------------------------------------------------------
      |
      | Less than 20 minutes old.
      |
      */

      if (
        age <
        CACHE_TIME
      ) {

        console.log(
          `Returning Top 10 stocks from MongoDB. Cache age: ${Math.round(
            age /
              60000
          )} minutes.`
        );


        return returnCachedData(
          cached,
          "MongoDB cache"
        );

      }


      /*
      |--------------------------------------------------------------------------
      | MARKET OPEN + CACHE OLD
      |--------------------------------------------------------------------------
      |
      | 20+ minutes old.
      |
      | Continue below and fetch
      | fresh data from Upstox.
      |
      */

      console.log(
        `MongoDB cache is ${Math.round(
          age /
            60000
        )} minutes old. Fetching fresh Upstox data.`
      );

    } else {

      /*
      |--------------------------------------------------------------------------
      | NO DATABASE CACHE
      |--------------------------------------------------------------------------
      */

      console.log(
        "No Top 10 stocks found in MongoDB."
      );


      /*
      |--------------------------------------------------------------------------
      | MARKET CLOSED + NO CACHE
      |--------------------------------------------------------------------------
      |
      | Do NOT call Upstox.
      |
      */

      if (
        !marketOpen
      ) {

        return NextResponse.json(
          {
            success:
              false,

            error:
              "No cached Top 10 stock data is available. Market is currently closed, so Upstox was not called.",

            marketOpen:
              false,
          },
          {
            status:
              503,
          }
        );

      }

    }


    /*
    |--------------------------------------------------------------------------
    | 5. ONLY HERE DO WE CALL UPSTOX
    |--------------------------------------------------------------------------
    |
    | This section can only be reached
    | when:
    |
    | Monday-Friday
    | AND
    | 09:15-17:00 IST
    | AND
    | cache is missing or 20+ minutes old.
    |
    */

    console.log(
      "Fetching fresh market data from Upstox..."
    );


    const accessToken =
      process.env.UPSTOX_ACCESS_TOKEN;


    const token =
      accessToken
        ?.trim()
        .replace(
          /^["']|["']$/g,
          ""
        );


    if (
      !token
    ) {

      return NextResponse.json(
        {
          error:
            "UPSTOX_ACCESS_TOKEN is not configured.",
        },
        {
          status:
            500,
        }
      );

    }


    /*
    |--------------------------------------------------------------------------
    | 6. GET NSE UNIVERSE
    |--------------------------------------------------------------------------
    */

    const instruments =
      await fetchNSEInstruments();


    console.log(
      `NSE instruments: ${instruments.length}`
    );


    /*
    |--------------------------------------------------------------------------
    | 7. FETCH MARKET QUOTES
    |--------------------------------------------------------------------------
    */

    const quotes =
      await fetchQuotes(
        instruments,
        token
      );


    console.log(
      `Quotes received: ${quotes.length}`
    );


    /*
    |--------------------------------------------------------------------------
    | 8. CREATE INSTRUMENT MAP
    |--------------------------------------------------------------------------
    */

    const instrumentMap =
      new Map<
        string,
        UpstoxInstrument
      >();


    for (
      const instrument of
        instruments
    ) {

      if (
        instrument.instrument_key
      ) {

        instrumentMap.set(
          instrument.instrument_key,
          instrument
        );

      }

    }


    /*
    |--------------------------------------------------------------------------
    | 9. CREATE STOCK LIST
    |--------------------------------------------------------------------------
    */

    const stocksWithVolume =
      quotes

        .map(
          (
            quote
          ) => {

            let instrument:
              | UpstoxInstrument
              | undefined;


            /*
             * Match using
             * instrument key.
             */

            if (
              quote.instrument_token
            ) {

              instrument =
                instrumentMap.get(
                  quote.instrument_token
                );

            }


            /*
             * Fallback to symbol.
             */

            if (
              !instrument &&
              quote.symbol
            ) {

              instrument =
                instruments.find(
                  (
                    item
                  ) =>
                    item.trading_symbol ===
                    quote.symbol
                );

            }


            if (
              !instrument
            ) {

              return null;

            }


            const volume =
              numberOrNull(
                quote.volume
              );


            if (
              volume === null
            ) {

              return null;

            }


            return {

              stock:
                createStock(
                  instrument,
                  quote
                ),

              volume,

            };

          }
        )

        .filter(
          (
            item
          ): item is {
            stock:
              TopStock;

            volume:
              number;
          } =>
            item !== null
        );


    /*
    |--------------------------------------------------------------------------
    | 10. SORT BY VOLUME
    |--------------------------------------------------------------------------
    */

    stocksWithVolume.sort(
      (
        a,
        b
      ) =>
        b.volume -
        a.volume
    );


    /*
    |--------------------------------------------------------------------------
    | 11. TAKE TOP 10
    |--------------------------------------------------------------------------
    */

    const topStocks =
      stocksWithVolume

        .slice(
          0,
          TOP_STOCK_COUNT
        )

        .map(
          (
            item,
            index
          ) => {

            return {

              ...item.stock,

              rank:
                index +
                1,

            };

          }
        );


    /*
    |--------------------------------------------------------------------------
    | 12. SAVE TO MONGODB
    |--------------------------------------------------------------------------
    */

    const calculatedAt =
      new Date();


    const expiresAt =
      new Date(
        calculatedAt.getTime() +
          CACHE_TIME
      );


    await collection.updateOne(
      {
        type:
          "top-stocks",
      },

      {
        $set: {

          type:
            "top-stocks",

          stocks:
            topStocks,

          calculatedAt,

          expiresAt,

        },
      },

      {
        upsert:
          true,
      }
    );


    console.log(
      "Top 10 stocks saved to MongoDB."
    );


    /*
    |--------------------------------------------------------------------------
    | 13. RETURN FRESH DATA
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        stocks:
          topStocks,

        calculatedAt,

        expiresAt,

        source:
          "Upstox Full Market Quote",

        sort:
          "volume_desc",

        marketOpen:
          true,
      },

      {
        status:
          200,

        headers: {

          "Cache-Control":
            "no-store",

        },

      }
    );


  } catch (
    error
  ) {

    console.error(
      "Top stocks API error:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch top stocks.",
      },

      {
        status:
          500,
      }
    );

  }

}