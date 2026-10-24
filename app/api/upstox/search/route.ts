// import { NextResponse } from "next/server";
// import { gunzipSync } from "zlib";

// type UpstoxInstrument = {
//   segment?: string;
//   name?: string;
//   exchange?: string;
//   isin?: string;
//   instrument_type?: string;
//   instrument_key?: string;
//   trading_symbol?: string;
//   short_name?: string;
// };

// type UpstoxQuote = {
//   last_price?: number;
//   instrument_token?: string;
//   symbol?: string;
// };


// /*
// |--------------------------------------------------------------------------
// | UPSTOX INSTRUMENT FILE
// |--------------------------------------------------------------------------
// */

// const NSE_INSTRUMENTS_URL =
//   "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";


// /*
// |--------------------------------------------------------------------------
// | NUMBER HELPER
// |--------------------------------------------------------------------------
// */

// function numberOrNull(
//   value: unknown
// ): number | null {
//   const number = Number(value);

//   return Number.isFinite(number)
//     ? number
//     : null;
// }


// /*
// |--------------------------------------------------------------------------
// | FETCH NSE INSTRUMENTS
// |--------------------------------------------------------------------------
// */

// async function fetchNSEInstruments(): Promise<
//   UpstoxInstrument[]
// > {
//   const response = await fetch(
//     NSE_INSTRUMENTS_URL,
//     {
//       method: "GET",
//       headers: {
//         Accept: "application/json",
//       },
//       cache: "no-store",
//     }
//   );

//   if (!response.ok) {
//     throw new Error(
//       `Failed to fetch Upstox instruments: ${response.status}`
//     );
//   }

//   const buffer = Buffer.from(
//     await response.arrayBuffer()
//   );

//   let jsonText: string;

//   if (
//     buffer.length >= 2 &&
//     buffer[0] === 0x1f &&
//     buffer[1] === 0x8b
//   ) {
//     jsonText = gunzipSync(buffer).toString(
//       "utf-8"
//     );
//   } else {
//     jsonText = buffer.toString("utf-8");
//   }

//   const data = JSON.parse(jsonText);

//   if (!Array.isArray(data)) {
//     throw new Error(
//       "Invalid Upstox instrument data."
//     );
//   }

//   return data.filter(
//     (instrument: UpstoxInstrument) => {
//       /*
//        * Include:
//        *
//        * NSE_EQ
//        * NSE_INDEX
//        *
//        * This allows both stocks and
//        * indices to appear in search.
//        */

//       const isEquity =
//         instrument.segment === "NSE_EQ" &&
//         instrument.instrument_type === "EQ";

//       const isIndex =
//         instrument.segment === "NSE_INDEX";

//       return (
//         (isEquity || isIndex) &&
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
// | GET MARKET QUOTES
// |--------------------------------------------------------------------------
// |
// | We only request quotes for the
// | small number of search results.
// |
// */

// async function fetchQuotes(
//   instruments: UpstoxInstrument[],
//   token: string
// ): Promise<
//   Map<string, UpstoxQuote>
// > {
//   const map =
//     new Map<string, UpstoxQuote>();

//   if (instruments.length === 0) {
//     return map;
//   }

//   const instrumentKeys =
//     instruments
//       .map(
//         (instrument) =>
//           instrument.instrument_key
//       )
//       .filter(
//         (
//           key
//         ): key is string =>
//           Boolean(key)
//       )
//       .join(",");

//   if (!instrumentKeys) {
//     return map;
//   }

//   const url =
//     `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(
//       instrumentKeys
//     )}`;

//   const response =
//     await fetch(url, {
//       method: "GET",

//       headers: {
//         Accept:
//           "application/json",

//         Authorization:
//           `Bearer ${token}`,
//       },

//       cache: "no-store",
//     });

//   if (!response.ok) {
//     /*
//      * Search should still work even
//      * if price fetching fails.
//      */
//     return map;
//   }

//   const data =
//     await response.json();

//   const quotes =
//     data?.data || {};

//   for (
//     const quote of Object.values(
//       quotes
//     ) as UpstoxQuote[]
//   ) {
//     if (
//       quote.instrument_token
//     ) {
//       map.set(
//         quote.instrument_token,
//         quote
//       );
//     }

//     if (
//       quote.symbol
//     ) {
//       map.set(
//         quote.symbol,
//         quote
//       );
//     }
//   }

//   return map;
// }


// /*
// |--------------------------------------------------------------------------
// | GET
// |--------------------------------------------------------------------------
// */

// export async function GET(
//   request: Request
// ) {
//   try {
//     const { searchParams } =
//       new URL(request.url);

//     const query =
//       searchParams
//         .get("q")
//         ?.trim()
//         .toLowerCase() || "";


//     /*
//      * Don't search when query is
//      * too short.
//      */

//     if (query.length < 1) {
//       return NextResponse.json({
//         success: true,
//         stocks: [],
//       });
//     }


//     /*
//      * UPSTOX TOKEN
//      */

//     const accessToken =
//       process.env.UPSTOX_ACCESS_TOKEN;

//     const token =
//       accessToken
//         ?.trim()
//         .replace(
//           /^["']|["']$/g,
//           ""
//         );

//     if (!token) {
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
//      * GET NSE INSTRUMENTS
//      */

//     const instruments =
//       await fetchNSEInstruments();


//     /*
//      * SEARCH
//      */

//     const matches =
//       instruments
//         .filter(
//           (
//             instrument
//           ) => {

//             const symbol =
//               (
//                 instrument
//                   .trading_symbol ||
//                 ""
//               ).toLowerCase();

//             const name =
//               (
//                 instrument.name ||
//                 ""
//               ).toLowerCase();

//             const shortName =
//               (
//                 instrument.short_name ||
//                 ""
//               ).toLowerCase();

//             return (
//               symbol.includes(query) ||
//               name.includes(query) ||
//               shortName.includes(query)
//             );
//           }
//         )
//         .sort(
//           (
//             a,
//             b
//           ) => {

//             const aSymbol =
//               (
//                 a.trading_symbol ||
//                 ""
//               ).toLowerCase();

//             const bSymbol =
//               (
//                 b.trading_symbol ||
//                 ""
//               ).toLowerCase();


//             /*
//              * Exact symbol first.
//              */

//             if (
//               aSymbol === query &&
//               bSymbol !== query
//             ) {
//               return -1;
//             }

//             if (
//               bSymbol === query &&
//               aSymbol !== query
//             ) {
//               return 1;
//             }


//             /*
//              * Symbol beginning with
//              * query comes next.
//              */

//             const aStarts =
//               aSymbol.startsWith(
//                 query
//               );

//             const bStarts =
//               bSymbol.startsWith(
//                 query
//               );

//             if (
//               aStarts &&
//               !bStarts
//             ) {
//               return -1;
//             }

//             if (
//               bStarts &&
//               !aStarts
//             ) {
//               return 1;
//             }


//             return aSymbol.localeCompare(
//               bSymbol
//             );
//           }
//         )
//         .slice(0, 6);


//     /*
//      * FETCH PRICES FOR RESULTS
//      */

//     const quoteMap =
//       await fetchQuotes(
//         matches,
//         token
//       );


//     /*
//      * FORMAT RESPONSE
//      */

//     const stocks =
//       matches.map(
//         (
//           instrument
//         ) => {

//           const instrumentKey =
//             instrument.instrument_key ||
//             "";

//           let quote =
//             quoteMap.get(
//               instrumentKey
//             );


//           /*
//            * Try symbol fallback.
//            */

//           if (!quote) {
//             quote =
//               quoteMap.get(
//                 instrument.trading_symbol ||
//                   ""
//               );
//           }


//           const price =
//             numberOrNull(
//               quote?.last_price
//             );


//           return {
//             symbol:
//               instrument.trading_symbol ||
//               "",

//             shortName:
//               instrument.short_name ||
//               instrument.trading_symbol ||
//               "",

//             name:
//               instrument.name ||
//               instrument.trading_symbol ||
//               "",

//             instrumentKey,

//             price,
//           };
//         }
//       );


//     return NextResponse.json(
//       {
//         success: true,

//         stocks,
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
//       "Stock search error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         success: false,

//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to search stocks.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }











// import { NextResponse } from "next/server";
// import { gunzipSync } from "zlib";

// type UpstoxInstrument = {
//   segment?: string;
//   name?: string;
//   exchange?: string;
//   isin?: string;
//   instrument_type?: string;
//   instrument_key?: string;
//   trading_symbol?: string;
//   short_name?: string;
// };

// type UpstoxQuote = {
//   last_price?: number;
//   instrument_token?: string;
//   symbol?: string;

//   ohlc?: {
//     open?: number;
//     high?: number;
//     low?: number;
//     close?: number;
//     volume?: number;
//     ts?: number;
//   };

//   depth?: {
//     buy?: Array<{
//       price?: number;
//       quantity?: number;
//       orders?: number;
//     }>;

//     sell?: Array<{
//       price?: number;
//       quantity?: number;
//       orders?: number;
//     }>;
//   };

//   volume?: number;
//   average_price?: number;
//   oi?: number;

//   total_buy_quantity?: number;
//   total_sell_quantity?: number;

//   prev_close_price?: number;
//   net_change?: number;

//   lower_circuit_limit?: number;
//   upper_circuit_limit?: number;
// };

// /*
// |--------------------------------------------------------------------------
// | UPSTOX NSE INSTRUMENT FILE
// |--------------------------------------------------------------------------
// */

// const NSE_INSTRUMENTS_URL =
//   "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";

// /*
// |--------------------------------------------------------------------------
// | NUMBER HELPER
// |--------------------------------------------------------------------------
// */

// function numberOrNull(
//   value: unknown
// ): number | null {
//   const number = Number(value);

//   return Number.isFinite(number)
//     ? number
//     : null;
// }

// /*
// |--------------------------------------------------------------------------
// | TEXT NORMALIZER
// |--------------------------------------------------------------------------
// */

// function normalizeText(
//   value: unknown
// ): string {
//   return String(value ?? "")
//     .trim()
//     .toLowerCase();
// }

// /*
// |--------------------------------------------------------------------------
// | BUILD QUOTE KEY
// |--------------------------------------------------------------------------
// |
// | IMPORTANT:
// |
// | For NSE_EQ:
// |
// | NSE_EQ + trading symbol
// |
// | Example:
// |
// | NSE_EQ:RELIANCE
// |
// | For NSE_INDEX:
// |
// | We MUST use the instrument_key,
// | because the trading_symbol is only
// | "NIFTY" while the actual quote key is:
// |
// | NSE_INDEX:Nifty 50
// |
// |--------------------------------------------------------------------------
// */

// function getQuoteKey(
//   instrument: UpstoxInstrument
// ): string | null {
//   const instrumentKey =
//     instrument.instrument_key?.trim();

//   const segment =
//     instrument.segment?.trim();

//   const tradingSymbol =
//     instrument.trading_symbol?.trim();

//   if (!instrumentKey) {
//     return null;
//   }

//   /*
//    * INDEX
//    *
//    * NSE_INDEX|Nifty 50
//    *
//    * becomes
//    *
//    * NSE_INDEX:Nifty 50
//    */

//   if (
//     segment === "NSE_INDEX"
//   ) {
//     return instrumentKey.replace(
//       "|",
//       ":"
//     );
//   }

//   /*
//    * EQUITY
//    *
//    * NSE_EQ:RELIANCE
//    */

//   if (
//     segment === "NSE_EQ" &&
//     tradingSymbol
//   ) {
//     return `${segment}:${tradingSymbol}`;
//   }

//   /*
//    * Generic fallback.
//    */

//   return instrumentKey.replace(
//     "|",
//     ":"
//   );
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

//   if (!response.ok) {
//     throw new Error(
//       `Failed to fetch Upstox instruments: ${response.status}`
//     );
//   }

//   const buffer =
//     Buffer.from(
//       await response.arrayBuffer()
//     );

//   let jsonText: string;

//   /*
//    * Handle gzip.
//    */

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
//       "Invalid Upstox instrument data."
//     );
//   }

//   /*
//    * Only keep:
//    *
//    * NSE_EQ / EQ
//    *
//    * NSE_INDEX / INDEX
//    */

//   return data.filter(
//     (
//       instrument: UpstoxInstrument
//     ) => {
//       const isEquity =
//         instrument.segment ===
//           "NSE_EQ" &&
//         instrument.instrument_type ===
//           "EQ";

//       const isIndex =
//         instrument.segment ===
//           "NSE_INDEX" &&
//         instrument.instrument_type ===
//           "INDEX";

//       return (
//         (isEquity || isIndex) &&
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
// | FETCH FULL MARKET QUOTES
// |--------------------------------------------------------------------------
// |
// | Uses Upstox V3.
// |
// | This gives:
// |
// | last_price
// | depth.buy
// | depth.sell
// | volume
// | previous close
// | etc.
// |
// |--------------------------------------------------------------------------
// */

// async function fetchQuotes(
//   instruments: UpstoxInstrument[],
//   token: string
// ): Promise<
//   Map<string, UpstoxQuote>
// > {
//   const map =
//     new Map<
//       string,
//       UpstoxQuote
//     >();

//   if (
//     instruments.length === 0
//   ) {
//     return map;
//   }

//   /*
//    * Get instrument keys.
//    */

//   const instrumentKeys =
//     instruments
//       .map(
//         (
//           instrument
//         ) =>
//           instrument.instrument_key
//       )
//       .filter(
//         (
//           key
//         ): key is string =>
//           Boolean(key)
//       );

//   if (
//     instrumentKeys.length === 0
//   ) {
//     return map;
//   }

//   /*
//    * Upstox V3 endpoint.
//    */

//   const url =
//     "https://api.upstox.com/v3/market-quote/quotes";

//   const params =
//     new URLSearchParams();

//   params.set(
//     "instrument_key",
//     instrumentKeys.join(",")
//   );

//   const response =
//     await fetch(
//       `${url}?${params.toString()}`,
//       {
//         method: "GET",

//         headers: {
//           Accept:
//             "application/json",

//           Authorization:
//             `Bearer ${token}`,
//         },

//         cache: "no-store",
//       }
//     );

//   if (!response.ok) {
//     const errorText =
//       await response.text();

//     console.error(
//       "Upstox V3 quote request failed:",
//       response.status,
//       errorText
//     );

//     return map;
//   }

//   const data =
//     await response.json();

//   const quotes =
//     data?.data || {};

//   /*
//    * Upstox V3 response:
//    *
//    * {
//    *   "NSE_EQ:RELIANCE": {...},
//    *   "NSE_INDEX:Nifty 50": {...}
//    * }
//    */

//   for (
//     const [
//       quoteKey,
//       quoteValue
//     ] of Object.entries(
//       quotes
//     )
//   ) {
//     if (
//       quoteValue &&
//       typeof quoteValue ===
//         "object"
//     ) {
//       map.set(
//         quoteKey,
//         quoteValue as UpstoxQuote
//       );
//     }
//   }

//   return map;
// }

// /*
// |--------------------------------------------------------------------------
// | SEARCH RANK
// |--------------------------------------------------------------------------
// */

// function getSearchRank(
//   instrument: UpstoxInstrument,
//   query: string
// ): number {
//   const symbol =
//     normalizeText(
//       instrument.trading_symbol
//     );

//   const name =
//     normalizeText(
//       instrument.name
//     );

//   const shortName =
//     normalizeText(
//       instrument.short_name
//     );

//   /*
//    * NIFTY 50 exact match.
//    */

//   if (
//     query === "nifty 50" &&
//     name === "nifty 50"
//   ) {
//     return 0;
//   }

//   /*
//    * Exact trading symbol.
//    */

//   if (
//     symbol === query
//   ) {
//     return 10;
//   }

//   /*
//    * Exact name.
//    */

//   if (
//     name === query
//   ) {
//     return 20;
//   }

//   /*
//    * Exact short name.
//    */

//   if (
//     shortName === query
//   ) {
//     return 30;
//   }

//   /*
//    * Symbol starts with query.
//    */

//   if (
//     symbol.startsWith(query)
//   ) {
//     return 40;
//   }

//   /*
//    * Name starts with query.
//    */

//   if (
//     name.startsWith(query)
//   ) {
//     return 50;
//   }

//   /*
//    * Short name starts with query.
//    */

//   if (
//     shortName.startsWith(query)
//   ) {
//     return 60;
//   }

//   /*
//    * Symbol contains query.
//    */

//   if (
//     symbol.includes(query)
//   ) {
//     return 70;
//   }

//   /*
//    * Name contains query.
//    */

//   if (
//     name.includes(query)
//   ) {
//     return 80;
//   }

//   /*
//    * Short name contains query.
//    */

//   if (
//     shortName.includes(query)
//   ) {
//     return 90;
//   }

//   return 100;
// }

// /*
// |--------------------------------------------------------------------------
// | GET
// |--------------------------------------------------------------------------
// */

// export async function GET(
//   request: Request
// ) {
//   try {
//     const {
//       searchParams
//     } = new URL(
//       request.url
//     );

//     const query =
//       searchParams
//         .get("q")
//         ?.trim()
//         .toLowerCase() || "";

//     /*
//      * Empty query.
//      */

//     if (!query) {
//       return NextResponse.json(
//         {
//           success: true,
//           stocks: [],
//         }
//       );
//     }

//     /*
//      * UPSTOX TOKEN
//      */

//     const accessToken =
//       process.env
//         .UPSTOX_ACCESS_TOKEN;

//     const token =
//       accessToken
//         ?.trim()
//         .replace(
//           /^["']|["']$/g,
//           ""
//         );

//     if (!token) {
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
//      * FETCH INSTRUMENTS
//      */

//     const instruments =
//       await fetchNSEInstruments();

//     /*
//      * SEARCH
//      */

//     const matches =
//       instruments
//         .filter(
//           (
//             instrument
//           ) => {
//             const symbol =
//               normalizeText(
//                 instrument.trading_symbol
//               );

//             const name =
//               normalizeText(
//                 instrument.name
//               );

//             const shortName =
//               normalizeText(
//                 instrument.short_name
//               );

//             return (
//               symbol.includes(query) ||
//               name.includes(query) ||
//               shortName.includes(query)
//             );
//           }
//         )
//         .sort(
//           (
//             a,
//             b
//           ) => {
//             const rankA =
//               getSearchRank(
//                 a,
//                 query
//               );

//             const rankB =
//               getSearchRank(
//                 b,
//                 query
//               );

//             if (
//               rankA !== rankB
//             ) {
//               return (
//                 rankA - rankB
//               );
//             }

//             return normalizeText(
//               a.trading_symbol
//             ).localeCompare(
//               normalizeText(
//                 b.trading_symbol
//               )
//             );
//           }
//         )
//         .slice(
//           0,
//           6
//         );

//     /*
//      * FETCH QUOTES
//      */

//     const quoteMap =
//       await fetchQuotes(
//         matches,
//         token
//       );

//     /*
//      * FORMAT RESULTS
//      */

//     const stocks =
//       matches.map(
//         (
//           instrument
//         ) => {
//           const instrumentKey =
//             instrument
//               .instrument_key ||
//             "";

//           /*
//            * IMPORTANT:
//            *
//            * For Nifty:
//            *
//            * instrumentKey:
//            * NSE_INDEX|Nifty 50
//            *
//            * quoteKey:
//            * NSE_INDEX:Nifty 50
//            */

//           const quoteKey =
//             getQuoteKey(
//               instrument
//             );

//           const quote =
//             quoteKey
//               ? quoteMap.get(
//                   quoteKey
//                 )
//               : undefined;

//           /*
//            * LAST TRADED PRICE
//            */

//           const price =
//             numberOrNull(
//               quote?.last_price
//             );

//           /*
//            * PREVIOUS CLOSE
//            */

//           const previousClose =
//             numberOrNull(
//               quote?.prev_close_price
//             );

//           /*
//            * BEST BID
//            *
//            * Buy orders sitting in
//            * the order book.
//            */

//           const bestBid =
//             numberOrNull(
//               quote
//                 ?.depth
//                 ?.buy?.[0]
//                 ?.price
//             );

//           /*
//            * BEST ASK
//            *
//            * Sell orders sitting in
//            * the order book.
//            */

//           const bestAsk =
//             numberOrNull(
//               quote
//                 ?.depth
//                 ?.sell?.[0]
//                 ?.price
//             );

//           /*
//            * Return everything needed
//            * by the frontend.
//            */

//           return {
//             symbol:
//               instrument
//                 .trading_symbol ||
//               "",

//             shortName:
//               instrument
//                 .short_name ||
//               instrument
//                 .trading_symbol ||
//               "",

//             name:
//               instrument.name ||
//               instrument
//                 .trading_symbol ||
//               "",

//             exchange:
//               instrument.exchange ||
//               "NSE",

//             segment:
//               instrument.segment ||
//               "",

//             instrumentType:
//               instrument
//                 .instrument_type ||
//               "",

//             instrumentKey,

//             quoteKey,

//             price,

//             previousClose,

//             buyPrice:
//               bestAsk,

//             sellPrice:
//               bestBid,

//             volume:
//               numberOrNull(
//                 quote?.volume
//               ),

//             quoteFound:
//               Boolean(
//                 quote
//               ),
//           };
//         }
//       );

//     /*
//      * DEBUG
//      */

//     console.log(
//       "Stock search:",
//       JSON.stringify(
//         {
//           query,
//           results:
//             stocks.map(
//               (
//                 stock
//               ) => ({
//                 symbol:
//                   stock.symbol,

//                 name:
//                   stock.name,

//                 segment:
//                   stock.segment,

//                 instrumentKey:
//                   stock.instrumentKey,

//                 quoteKey:
//                   stock.quoteKey,

//                 price:
//                   stock.price,

//                 buyPrice:
//                   stock.buyPrice,

//                 sellPrice:
//                   stock.sellPrice,

//                 quoteFound:
//                   stock.quoteFound,
//               })
//             ),
//         },
//         null,
//         2
//       )
//     );

//     return NextResponse.json(
//       {
//         success: true,
//         stocks,
//       },
//       {
//         status: 200,

//         headers: {
//           "Cache-Control":
//             "no-store, no-cache, must-revalidate",
//         },
//       }
//     );

//   } catch (error) {
//     console.error(
//       "Stock search error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         success: false,

//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to search stocks.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }










import { NextResponse } from "next/server";
import { gunzipSync } from "zlib";

type UpstoxInstrument = {
  segment?: string;
  name?: string;
  exchange?: string;
  isin?: string;
  instrument_type?: string;
  instrument_key?: string;
  trading_symbol?: string;
  short_name?: string;
};

type UpstoxQuote = {
  last_price?: number;
  instrument_token?: string;
  symbol?: string;

  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    ts?: number;
  };

  depth?: {
    buy?: Array<{
      price?: number;
      quantity?: number;
      orders?: number;
    }>;

    sell?: Array<{
      price?: number;
      quantity?: number;
      orders?: number;
    }>;
  };

  volume?: number;
  average_price?: number;
  oi?: number;

  total_buy_quantity?: number;
  total_sell_quantity?: number;

  prev_close_price?: number;
  net_change?: number;

  lower_circuit_limit?: number;
  upper_circuit_limit?: number;
};

const NSE_INSTRUMENTS_URL =
  "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";

function numberOrNull(
  value: unknown
): number | null {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function normalizeText(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getQuoteKey(
  instrument: UpstoxInstrument
): string | null {
  const instrumentKey =
    instrument.instrument_key?.trim();

  const segment =
    instrument.segment?.trim();

  const tradingSymbol =
    instrument.trading_symbol?.trim();

  if (!instrumentKey) {
    return null;
  }

  if (
    segment === "NSE_INDEX"
  ) {
    return instrumentKey.replace(
      "|",
      ":"
    );
  }

  if (
    segment === "NSE_EQ" &&
    tradingSymbol
  ) {
    return `${segment}:${tradingSymbol}`;
  }

  return instrumentKey.replace(
    "|",
    ":"
  );
}

async function fetchNSEInstruments(): Promise<
  UpstoxInstrument[]
> {
  const response =
    await fetch(
      NSE_INSTRUMENTS_URL,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Upstox instruments: ${response.status}`
    );
  }

  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    );

  let jsonText: string;

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
      "Invalid Upstox instrument data."
    );
  }

  return data.filter(
    (
      instrument: UpstoxInstrument
    ) => {
      const isEquity =
        instrument.segment ===
          "NSE_EQ" &&
        instrument.instrument_type ===
          "EQ";

      const isIndex =
        instrument.segment ===
          "NSE_INDEX" &&
        instrument.instrument_type ===
          "INDEX";

      return (
        (isEquity || isIndex) &&
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

async function fetchQuotes(
  instruments: UpstoxInstrument[],
  token: string
): Promise<
  Map<string, UpstoxQuote>
> {
  const map =
    new Map<
      string,
      UpstoxQuote
    >();

  if (
    instruments.length === 0
  ) {
    return map;
  }

  const instrumentKeys =
    instruments
      .map(
        instrument =>
          instrument.instrument_key
      )
      .filter(
        (
          key
        ): key is string =>
          Boolean(key)
      );

  if (
    instrumentKeys.length === 0
  ) {
    return map;
  }

  const url =
    "https://api.upstox.com/v3/market-quote/quotes";

  const params =
    new URLSearchParams();

  params.set(
    "instrument_key",
    instrumentKeys.join(",")
  );

  const response =
    await fetch(
      `${url}?${params.toString()}`,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        cache: "no-store",
      }
    );

  if (!response.ok) {
    console.error(
      "Upstox V3 quote request failed:",
      response.status
    );

    return map;
  }

  const data =
    await response.json();

  const quotes =
    data?.data || {};

  for (
    const [
      quoteKey,
      quoteValue
    ] of Object.entries(
      quotes
    )
  ) {
    if (
      quoteValue &&
      typeof quoteValue ===
        "object"
    ) {
      map.set(
        quoteKey,
        quoteValue as UpstoxQuote
      );
    }
  }

  return map;
}

function getSearchRank(
  instrument: UpstoxInstrument,
  query: string
): number {
  const symbol =
    normalizeText(
      instrument.trading_symbol
    );

  const name =
    normalizeText(
      instrument.name
    );

  const shortName =
    normalizeText(
      instrument.short_name
    );

  /*
   * NIFTY 50 should always resolve
   * to the actual NSE index.
   */

  if (
    query === "nifty" &&
    instrument.segment ===
      "NSE_INDEX" &&
    name === "nifty 50"
  ) {
    return 0;
  }

  if (
    query === "nifty 50" &&
    instrument.segment ===
      "NSE_INDEX" &&
    name === "nifty 50"
  ) {
    return 0;
  }

  if (
    symbol === query
  ) {
    return 10;
  }

  if (
    name === query
  ) {
    return 20;
  }

  if (
    shortName === query
  ) {
    return 30;
  }

  if (
    symbol.startsWith(query)
  ) {
    return 40;
  }

  if (
    name.startsWith(query)
  ) {
    return 50;
  }

  if (
    shortName.startsWith(query)
  ) {
    return 60;
  }

  if (
    symbol.includes(query)
  ) {
    return 70;
  }

  if (
    name.includes(query)
  ) {
    return 80;
  }

  if (
    shortName.includes(query)
  ) {
    return 90;
  }

  return 100;
}

export async function GET(
  request: Request
) {
  try {
    const {
      searchParams
    } = new URL(
      request.url
    );

    const query =
      searchParams
        .get("q")
        ?.trim()
        .toLowerCase() || "";

    if (!query) {
      return NextResponse.json({
        success: true,
        stocks: [],
      });
    }

    const accessToken =
      process.env
        .UPSTOX_ACCESS_TOKEN;

    const token =
      accessToken
        ?.trim()
        .replace(
          /^["']|["']$/g,
          ""
        );

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "UPSTOX_ACCESS_TOKEN is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const instruments =
      await fetchNSEInstruments();

    const matches =
      instruments
        .filter(
          instrument => {
            const symbol =
              normalizeText(
                instrument.trading_symbol
              );

            const name =
              normalizeText(
                instrument.name
              );

            const shortName =
              normalizeText(
                instrument.short_name
              );

            return (
              symbol.includes(query) ||
              name.includes(query) ||
              shortName.includes(query)
            );
          }
        )
        .sort(
          (a, b) => {
            const rankA =
              getSearchRank(
                a,
                query
              );

            const rankB =
              getSearchRank(
                b,
                query
              );

            if (
              rankA !== rankB
            ) {
              return (
                rankA - rankB
              );
            }

            /*
             * For ambiguous symbols like NIFTY,
             * prefer NSE_INDEX over NSE_EQ.
             */

            if (
              a.segment !==
              b.segment
            ) {
              if (
                a.segment ===
                "NSE_INDEX"
              ) {
                return -1;
              }

              if (
                b.segment ===
                "NSE_INDEX"
              ) {
                return 1;
              }
            }

            return normalizeText(
              a.trading_symbol
            ).localeCompare(
              normalizeText(
                b.trading_symbol
              )
            );
          }
        )
        .slice(
          0,
          6
        );

    const quoteMap =
      await fetchQuotes(
        matches,
        token
      );

    const stocks =
      matches.map(
        instrument => {
          const instrumentKey =
            instrument
              .instrument_key ||
            "";

          const quoteKey =
            getQuoteKey(
              instrument
            );

          const quote =
            quoteKey
              ? quoteMap.get(
                  quoteKey
                )
              : undefined;

          const price =
            numberOrNull(
              quote?.last_price
            );

          const previousClose =
            numberOrNull(
              quote?.prev_close_price
            );

          const bestBid =
            numberOrNull(
              quote
                ?.depth
                ?.buy?.[0]
                ?.price
            );

          const bestAsk =
            numberOrNull(
              quote
                ?.depth
                ?.sell?.[0]
                ?.price
            );

          return {
            symbol:
              instrument
                .trading_symbol ||
              "",

            shortName:
              instrument
                .short_name ||
              instrument
                .trading_symbol ||
              "",

            name:
              instrument.name ||
              instrument
                .trading_symbol ||
              "",

            exchange:
              instrument.exchange ||
              "NSE",

            segment:
              instrument.segment ||
              "",

            instrumentType:
              instrument
                .instrument_type ||
              "",

            /*
             * THIS IS THE IMPORTANT VALUE.
             *
             * Nifty:
             * NSE_INDEX|Nifty 50
             *
             * Nifty BeES:
             * NSE_EQ|...
             */

            instrumentKey,

            quoteKey,

            price,

            previousClose,

            buyPrice:
              bestAsk,

            sellPrice:
              bestBid,

            volume:
              numberOrNull(
                quote?.volume
              ),

            quoteFound:
              Boolean(
                quote
              ),
          };
        }
      );

    console.log(
      "Stock search:",
      JSON.stringify(
        {
          query,
          results:
            stocks.map(
              stock => ({
                symbol:
                  stock.symbol,

                name:
                  stock.name,

                segment:
                  stock.segment,

                instrumentKey:
                  stock.instrumentKey,

                quoteKey:
                  stock.quoteKey,

                price:
                  stock.price,

                buyPrice:
                  stock.buyPrice,

                sellPrice:
                  stock.sellPrice,

                quoteFound:
                  stock.quoteFound,
              })
            ),
        },
        null,
        2
      )
    );

    return NextResponse.json(
      {
        success: true,
        stocks,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Stock search error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to search stocks.",
      },
      {
        status: 500,
      }
    );
  }
}