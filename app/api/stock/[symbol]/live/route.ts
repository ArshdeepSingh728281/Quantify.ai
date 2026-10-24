// import { NextResponse } from "next/server";

// /*
// |--------------------------------------------------------------------------
// | TYPES
// |--------------------------------------------------------------------------
// */

// type UpstoxLtpItem = {
//   last_price?: number;
//   ltp?: number;
//   cp?: number;
//   close_price?: number;
//   volume?: number;
//   ltq?: number;
// };

// type UpstoxLtpResponse = {
//   status?: string;

//   data?: Record<
//     string,
//     UpstoxLtpItem
//   >;

//   errors?: unknown;
// };

// /*
// |--------------------------------------------------------------------------
// | MARKET STATUS
// |--------------------------------------------------------------------------
// */

// function isMarketOpen() {
//   const formatter =
//     new Intl.DateTimeFormat(
//       "en-IN",
//       {
//         timeZone: "Asia/Kolkata",

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

//   const get = (type: string) =>
//     parts.find(
//       part => part.type === type
//     )?.value || "";

//   const weekday =
//     get("weekday");

//   const hour =
//     Number(get("hour"));

//   const minute =
//     Number(get("minute"));

//   if (
//     ![
//       "Mon",
//       "Tue",
//       "Wed",
//       "Thu",
//       "Fri",
//     ].includes(weekday)
//   ) {
//     return false;
//   }

//   const current =
//     hour * 60 + minute;

//   return (
//     current >= 9 * 60 + 15 &&
//     current <= 15 * 60 + 30
//   );
// }

// /*
// |--------------------------------------------------------------------------
// | GET LIVE STOCK DATA
// |--------------------------------------------------------------------------
// */

// export async function GET(
//   request: Request,
//   context: {
//     params: Promise<{
//       symbol: string;
//     }>;
//   }
// ) {
//   try {
//     /*
//      * --------------------------------------------------------------
//      * SYMBOL
//      * --------------------------------------------------------------
//      */

//     const {
//       symbol: rawSymbol,
//     } =
//       await context.params;

//     const symbol =
//       decodeURIComponent(
//         rawSymbol
//       )
//         .replace(
//           /^NSE:/i,
//           ""
//         )
//         .trim()
//         .toUpperCase();

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

//     /*
//      * --------------------------------------------------------------
//      * ACCESS TOKEN
//      * --------------------------------------------------------------
//      */

//     const accessToken =
//       process.env.UPSTOX_ACCESS_TOKEN
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
//      * --------------------------------------------------------------
//      * INSTRUMENT KEY
//      * --------------------------------------------------------------
//      *
//      * We get this from the initial stock API call.
//      *
//      * This prevents doing an Upstox instrument search
//      * on every polling request.
//      * --------------------------------------------------------------
//      */

//     const url =
//       new URL(
//         request.url
//       );

//     const instrumentKey =
//       url.searchParams.get(
//         "instrumentKey"
//       )?.trim();

//     if (!instrumentKey) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "instrumentKey is required.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     /*
//      * Basic validation.
//      *
//      * We only want NSE equity instruments
//      * through this endpoint.
//      */

//     if (
//       !instrumentKey.startsWith(
//         "NSE_EQ|"
//       )
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Invalid NSE equity instrument.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     /*
//      * --------------------------------------------------------------
//      * UPSTOX LTP
//      * --------------------------------------------------------------
//      *
//      * Upstox V3:
//      *
//      * last_price = current LTP
//      * cp         = previous trading day's close
//      * volume     = current day's cumulative volume
//      *
//      * --------------------------------------------------------------
//      */

//     const upstoxUrl =
//       new URL(
//         "https://api.upstox.com/v3/market-quote/ltp"
//       );

//     upstoxUrl.searchParams.set(
//       "instrument_key",
//       instrumentKey
//     );

//     const response =
//       await fetch(
//         upstoxUrl.toString(),
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
//         JSON.parse(text);
//     } catch {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Upstox returned invalid JSON.",
//         },
//         {
//           status: 502,
//         }
//       );
//     }

//     if (!response.ok) {
//       console.error(
//         "Upstox live LTP error:",
//         response.status,
//         data
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Unable to fetch live price from Upstox.",
//         },
//         {
//           status:
//             response.status >= 400 &&
//             response.status < 500
//               ? response.status
//               : 502,
//         }
//       );
//     }

//     /*
//      * --------------------------------------------------------------
//      * FIND QUOTE
//      * --------------------------------------------------------------
//      */

//     const quote =
//       data?.data?.[
//         instrumentKey
//       ] ??
//       Object.values(
//         data?.data || {}
//       )[0];

//     if (!quote) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "No live quote was returned by Upstox.",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     /*
//      * --------------------------------------------------------------
//      * NORMALIZE
//      * --------------------------------------------------------------
//      */

//     const price = Number(
//       quote.last_price ??
//         quote.ltp
//     );

//     const previousClose =
//       Number(
//         quote.cp ??
//           quote.close_price
//       );

//     const volume =
//       Number(quote.volume);

//     const validPrice =
//       Number.isFinite(price);

//     const validPreviousClose =
//       Number.isFinite(
//         previousClose
//       ) &&
//       previousClose !== 0;

//     const validVolume =
//       Number.isFinite(volume);

//     let change:
//       | number
//       | null = null;

//     let changePercent:
//       | number
//       | null = null;

//     if (
//       validPrice &&
//       validPreviousClose
//     ) {
//       change =
//         price -
//         previousClose;

//       changePercent =
//         (change /
//           previousClose) *
//         100;
//     }

//     /*
//      * --------------------------------------------------------------
//      * RESPONSE
//      * --------------------------------------------------------------
//      */

//     return NextResponse.json(
//       {
//         success: true,

//         symbol,

//         instrumentKey,

//         marketOpen:
//           isMarketOpen(),

//         timestamp:
//           Date.now(),

//         price:
//           validPrice
//             ? price
//             : null,

//         previousClose:
//           validPreviousClose
//             ? previousClose
//             : null,

//         change,

//         changePercent,

//         volume:
//           validVolume
//             ? volume
//             : null,

//         source:
//           "upstox",
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
//       "GET /api/stock/[symbol]/live error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         success: false,

//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to fetch live stock data.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }














// import { NextResponse } from "next/server";

// /*
// |--------------------------------------------------------------------------
// | TYPES
// |--------------------------------------------------------------------------
// */

// type UpstoxLtpItem = {
//   last_price?: number;
//   ltp?: number;
//   cp?: number;
//   close_price?: number;
//   volume?: number;
//   ltq?: number;
// };

// type UpstoxLtpResponse = {
//   status?: string;

//   data?: Record<
//     string,
//     UpstoxLtpItem
//   >;

//   errors?: unknown;
// };

// /*
// |--------------------------------------------------------------------------
// | MARKET STATUS
// |--------------------------------------------------------------------------
// */

// function isMarketOpen() {
//   const formatter =
//     new Intl.DateTimeFormat(
//       "en-IN",
//       {
//         timeZone: "Asia/Kolkata",

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

//   const get = (type: string) =>
//     parts.find(
//       part => part.type === type
//     )?.value || "";

//   const weekday =
//     get("weekday");

//   const hour =
//     Number(get("hour"));

//   const minute =
//     Number(get("minute"));

//   if (
//     ![
//       "Mon",
//       "Tue",
//       "Wed",
//       "Thu",
//       "Fri",
//     ].includes(weekday)
//   ) {
//     return false;
//   }

//   const current =
//     hour * 60 + minute;

//   return (
//     current >= 9 * 60 + 15 &&
//     current <= 15 * 60 + 30
//   );
// }

// /*
// |--------------------------------------------------------------------------
// | GET LIVE STOCK DATA
// |--------------------------------------------------------------------------
// */

// export async function GET(
//   request: Request,
//   context: {
//     params: Promise<{
//       symbol: string;
//     }>;
//   }
// ) {
//   try {
//     /*
//      * --------------------------------------------------------------
//      * SYMBOL
//      * --------------------------------------------------------------
//      */

//     const {
//       symbol: rawSymbol,
//     } =
//       await context.params;

//     const symbol =
//       decodeURIComponent(
//         rawSymbol
//       )
//         .replace(
//           /^NSE:/i,
//           ""
//         )
//         .trim()
//         .toUpperCase();

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

//     /*
//      * --------------------------------------------------------------
//      * ACCESS TOKEN
//      * --------------------------------------------------------------
//      */

//     const accessToken =
//       process.env.UPSTOX_ACCESS_TOKEN
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
//      * --------------------------------------------------------------
//      * INSTRUMENT KEY
//      * --------------------------------------------------------------
//      *
//      * We get this from the initial stock API call.
//      *
//      * This prevents doing an Upstox instrument search
//      * on every polling request.
//      * --------------------------------------------------------------
//      */

//     const url =
//       new URL(
//         request.url
//       );

//     const instrumentKey =
//       url.searchParams.get(
//         "instrumentKey"
//       )?.trim();

//     if (!instrumentKey) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "instrumentKey is required.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     /*
//      * Basic validation.
//      *
//      * We only want NSE equity instruments
//      * through this endpoint.
//      */

//     if (
//       !instrumentKey.startsWith(
//         "NSE_EQ|"
//       )
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Invalid NSE equity instrument.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     /*
//      * --------------------------------------------------------------
//      * UPSTOX LTP
//      * --------------------------------------------------------------
//      *
//      * Upstox V3:
//      *
//      * last_price = current LTP
//      * cp         = previous trading day's close
//      * volume     = current day's cumulative volume
//      *
//      * --------------------------------------------------------------
//      */

//     const upstoxUrl =
//       new URL(
//         "https://api.upstox.com/v3/market-quote/quotes"
//       );

//     upstoxUrl.searchParams.set(
//       "instrument_key",
//       instrumentKey
//     );

//     const response =
//       await fetch(
//         upstoxUrl.toString(),
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
//         JSON.parse(text);
//     } catch {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Upstox returned invalid JSON.",
//         },
//         {
//           status: 502,
//         }
//       );
//     }

//     if (!response.ok) {
//       console.error(
//         "Upstox live LTP error:",
//         response.status,
//         data
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Unable to fetch live price from Upstox.",
//         },
//         {
//           status:
//             response.status >= 400 &&
//             response.status < 500
//               ? response.status
//               : 502,
//         }
//       );
//     }

//     /*
//      * --------------------------------------------------------------
//      * FIND QUOTE
//      * --------------------------------------------------------------
//      */

//     const quote =
//       data?.data?.[
//         instrumentKey
//       ] ??
//       Object.values(
//         data?.data || {}
//       )[0];

//     if (!quote) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "No live quote was returned by Upstox.",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     /*
//      * --------------------------------------------------------------
//      * NORMALIZE
//      * --------------------------------------------------------------
//      */

//     const price = Number(
//       quote.last_price ??
//         quote.ltp
//     );

//     const previousClose =
//       Number(
//         quote.cp ??
//           quote.close_price
//       );

//     const volume =
//       Number(quote.volume);

//     const validPrice =
//       Number.isFinite(price);

//     const validPreviousClose =
//       Number.isFinite(
//         previousClose
//       ) &&
//       previousClose !== 0;

//     const validVolume =
//       Number.isFinite(volume);

//     let change:
//       | number
//       | null = null;

//     let changePercent:
//       | number
//       | null = null;

//     if (
//       validPrice &&
//       validPreviousClose
//     ) {
//       change =
//         price -
//         previousClose;

//       changePercent =
//         (change /
//           previousClose) *
//         100;
//     }

//     /*
//      * --------------------------------------------------------------
//      * RESPONSE
//      * --------------------------------------------------------------
//      */

//     return NextResponse.json(
//       {
//         success: true,

//         symbol,

//         instrumentKey,

//         marketOpen:
//           isMarketOpen(),

//         timestamp:
//           Date.now(),

//         price:
//           validPrice
//             ? price
//             : null,

//         previousClose:
//           validPreviousClose
//             ? previousClose
//             : null,

//         change,

//         changePercent,

//         volume:
//           validVolume
//             ? volume
//             : null,

//         source:
//           "upstox",
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
//       "GET /api/stock/[symbol]/live error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         success: false,

//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to fetch live stock data.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }














// import { NextResponse } from "next/server";

// type UpstoxFullQuote = {
//   last_price?: number;

//   volume?: number;

//   average_price?: number;

//   net_change?: number;

//   prev_close_price?: number;

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

//   ohlc?: {
//     open?: number;
//     high?: number;
//     low?: number;
//     close?: number;
//     volume?: number;
//     ts?: number;
//   };

//   timestamp?: string;

//   instrument_token?: string;

//   symbol?: string;
// };

// type UpstoxFullQuoteResponse = {
//   status?: string;

//   data?: Record<
//     string,
//     UpstoxFullQuote
//   >;

//   errors?: unknown;
// };

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
//    QUOTE KEY
// ========================================================= */

// function getQuoteKey(
//   instrumentKey: string
// ) {
//   return instrumentKey.replace(
//     "|",
//     ":"
//   );
// }

// /* =========================================================
//    GET LIVE QUOTE
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
//       decodeURIComponent(
//         rawSymbol
//       )
//         .replace(
//           /^NSE:/i,
//           ""
//         )
//         .trim()
//         .toUpperCase();

//     const url =
//       new URL(
//         request.url
//       );

//     const instrumentKey =
//       url.searchParams
//         .get(
//           "instrumentKey"
//         )
//         ?.trim() || "";

//     if (!instrumentKey) {
//       return NextResponse.json(
//         {
//           success: false,

//           error:
//             "instrumentKey is required.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     /*
//      * Only NSE equity and NSE index
//      * instruments are allowed.
//      */

//     if (
//       !(
//         instrumentKey.startsWith(
//           "NSE_EQ|"
//         ) ||
//         instrumentKey.startsWith(
//           "NSE_INDEX|"
//         )
//       )
//     ) {
//       return NextResponse.json(
//         {
//           success: false,

//           error:
//             "Invalid NSE instrument key.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

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
//      * Full Market Quotes V3.
//      *
//      * This gives us:
//      *
//      * last_price
//      * prev_close_price
//      * volume
//      * depth.buy
//      * depth.sell
//      */

//     const upstoxUrl =
//       new URL(
//         "https://api.upstox.com/v3/market-quote/quotes"
//       );

//     upstoxUrl.searchParams.set(
//       "instrument_key",
//       instrumentKey
//     );

//     const response =
//       await fetch(
//         upstoxUrl.toString(),
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
//       | UpstoxFullQuoteResponse
//       | null = null;

//     try {
//       data =
//         JSON.parse(
//           text
//         );
//     } catch {
//       return NextResponse.json(
//         {
//           success: false,

//           error:
//             "Upstox returned invalid JSON.",
//         },
//         {
//           status: 502,
//         }
//       );
//     }

//     if (!response.ok) {
//       console.error(
//         "Upstox live quote error:",
//         response.status,
//         data
//       );

//       return NextResponse.json(
//         {
//           success: false,

//           error:
//             "Unable to fetch live quote from Upstox.",
//         },
//         {
//           status:
//             response.status >= 400 &&
//             response.status < 500
//               ? response.status
//               : 502,
//         }
//       );
//     }

//     /*
//      * Upstox uses:
//      *
//      * NSE_EQ:RELIANCE
//      *
//      * or:
//      *
//      * NSE_INDEX:Nifty 50
//      */

//     const quoteKey =
//       getQuoteKey(
//         instrumentKey
//       );

//     const quote =
//       data?.data?.[
//         quoteKey
//       ] ??
//       Object.values(
//         data?.data || {}
//       )[0];

//     if (!quote) {
//       return NextResponse.json(
//         {
//           success: false,

//           error:
//             "No live quote was returned by Upstox.",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     const price =
//       Number(
//         quote.last_price
//       );

//     const previousClose =
//       Number(
//         quote.prev_close_price
//       );

//     const volume =
//       Number(
//         quote.volume
//       );

//     /*
//      * Best ASK.
//      *
//      * This is the price a buyer would
//      * pay to buy immediately.
//      */

//     const buyPrice =
//       Number(
//         quote
//           .depth
//           ?.sell?.[0]
//           ?.price
//       );

//     /*
//      * Best BID.
//      *
//      * This is the price a seller would
//      * receive to sell immediately.
//      */

//     const sellPrice =
//       Number(
//         quote
//           .depth
//           ?.buy?.[0]
//           ?.price
//       );

//     const validPrice =
//       Number.isFinite(
//         price
//       );

//     const validPreviousClose =
//       Number.isFinite(
//         previousClose
//       ) &&
//       previousClose !== 0;

//     const validVolume =
//       Number.isFinite(
//         volume
//       );

//     const validBuyPrice =
//       Number.isFinite(
//         buyPrice
//       ) &&
//       buyPrice > 0;

//     const validSellPrice =
//       Number.isFinite(
//         sellPrice
//       ) &&
//       sellPrice > 0;

//     let change:
//       | number
//       | null = null;

//     let changePercent:
//       | number
//       | null = null;

//     if (
//       validPrice &&
//       validPreviousClose
//     ) {
//       change =
//         price -
//         previousClose;

//       changePercent =
//         (change /
//           previousClose) *
//         100;
//     }

//     return NextResponse.json(
//       {
//         success: true,

//         symbol,

//         instrumentKey,

//         marketOpen:
//           isMarketOpen(),

//         timestamp:
//           Date.now(),

//         price:
//           validPrice
//             ? price
//             : null,

//         previousClose:
//           validPreviousClose
//             ? previousClose
//             : null,

//         change,

//         changePercent,

//         volume:
//           validVolume
//             ? volume
//             : null,

//         /*
//          * BUY = ASK
//          */

//         buyPrice:
//           validBuyPrice
//             ? buyPrice
//             : null,

//         /*
//          * SELL = BID
//          */

//         sellPrice:
//           validSellPrice
//             ? sellPrice
//             : null,

//         source:
//           "upstox",
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
//       "GET /api/stock/[symbol]/live error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         success: false,

//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to fetch live stock data.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }









import { NextResponse } from "next/server";

type UpstoxFullQuote = {
  last_price?: number;
  volume?: number;
  average_price?: number;
  net_change?: number;
  prev_close_price?: number;

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

  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    ts?: number;
  };

  timestamp?: string;
  instrument_token?: string;
  symbol?: string;
};

type UpstoxFullQuoteResponse = {
  status?: string;

  data?: Record<string, UpstoxFullQuote>;

  errors?: unknown;
};

/* =========================================================
   MARKET STATUS
========================================================= */

function isMarketOpen(): boolean {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  const weekday = getPart("weekday");

  const hour = Number(getPart("hour"));
  const minute = Number(getPart("minute"));

  if (
    !["Mon", "Tue", "Wed", "Thu", "Fri"].includes(
      weekday
    )
  ) {
    return false;
  }

  const currentMinutes = hour * 60 + minute;

  const marketOpenMinutes = 9 * 60 + 15;
  const marketCloseMinutes = 15 * 60 + 30;

  return (
    currentMinutes >= marketOpenMinutes &&
    currentMinutes <= marketCloseMinutes
  );
}

/* =========================================================
   QUOTE KEY
========================================================= */

function getQuoteKey(
  instrumentKey: string
): string {
  return instrumentKey.replace("|", ":");
}

/* =========================================================
   GET LIVE QUOTE
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      symbol: string;
    }>;
  }
) {
  try {
    /* =====================================================
       SYMBOL
    ===================================================== */

    const { symbol: rawSymbol } =
      await context.params;

    const symbol = decodeURIComponent(rawSymbol)
      .replace(/^NSE:/i, "")
      .trim()
      .toUpperCase();

    /* =====================================================
       QUERY PARAMETERS
    ===================================================== */

    const url = new URL(request.url);

    const instrumentKey =
      url.searchParams
        .get("instrumentKey")
        ?.trim() ?? "";

    if (!instrumentKey) {
      return NextResponse.json(
        {
          success: false,
          error: "instrumentKey is required.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE INSTRUMENT KEY
    ===================================================== */

    const validInstrumentKey =
      /^(NSE_EQ|NSE_INDEX)\|.+$/i.test(
        instrumentKey
      );

    if (!validInstrumentKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid NSE instrument key.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       MARKET STATUS
    ===================================================== */

    const marketOpen =
      isMarketOpen();

    /* =====================================================
       UPSTOX ACCESS TOKEN
    ===================================================== */

    const accessToken =
      process.env.UPSTOX_ACCESS_TOKEN
        ?.trim()
        .replace(
          /^["']|["']$/g,
          ""
        );

    if (!accessToken) {
      console.error(
        "UPSTOX_ACCESS_TOKEN is missing."
      );

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

    /* =====================================================
       UPSTOX FULL MARKET QUOTE V3
    ===================================================== */

    const upstoxUrl =
      new URL(
        "https://api.upstox.com/v3/market-quote/quotes"
      );

    upstoxUrl.searchParams.set(
      "instrument_key",
      instrumentKey
    );

    const response =
      await fetch(
        upstoxUrl.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    /* =====================================================
       READ RESPONSE SAFELY
    ===================================================== */

    const text =
      await response.text();

    let data:
      | UpstoxFullQuoteResponse
      | null = null;

    try {
      data =
        JSON.parse(text);
    } catch {
      console.error(
        "Upstox returned non-JSON response:",
        response.status,
        text.slice(0, 500)
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Upstox returned an invalid response.",
          marketOpen,
        },
        {
          status: 502,
        }
      );
    }

    /* =====================================================
       UPSTOX ERROR
    ===================================================== */

    if (!response.ok) {
      console.error(
        "Upstox live quote error:",
        {
          status:
            response.status,

          data,
        }
      );

      return NextResponse.json(
        {
          success: false,

          error:
            "Unable to fetch live quote from Upstox.",

          marketOpen,

          symbol,

          instrumentKey,
        },
        {
          status:
            response.status >= 400 &&
            response.status < 500
              ? response.status
              : 502,
        }
      );
    }

    /* =====================================================
       FIND QUOTE
    ===================================================== */

    const quoteKey =
      getQuoteKey(
        instrumentKey
      );

    const quote =
      data?.data?.[quoteKey] ??
      Object.values(
        data?.data ?? {}
      )[0];

    /*
     * If market is closed and Upstox doesn't
     * return a live quote, this is NOT a 404.
     *
     * Return a normal JSON response so the
     * frontend can simply stop polling/updating.
     */

    if (!quote) {
      return NextResponse.json(
        {
          success: true,

          symbol,

          instrumentKey,

          marketOpen,

          marketClosed:
            !marketOpen,

          timestamp:
            Date.now(),

          price: null,

          previousClose: null,

          change: null,

          changePercent: null,

          volume: null,

          buyPrice: null,

          sellPrice: null,

          source:
            "upstox",
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    /* =====================================================
       PRICE
    ===================================================== */

    const price =
      Number(
        quote.last_price
      );

    const previousClose =
      Number(
        quote.prev_close_price
      );

    const volume =
      Number(
        quote.volume
      );

    /* =====================================================
       BEST ASK
       BUY = ASK
    ===================================================== */

    const buyPrice =
      Number(
        quote.depth
          ?.sell?.[0]
          ?.price
      );

    /* =====================================================
       BEST BID
       SELL = BID
    ===================================================== */

    const sellPrice =
      Number(
        quote.depth
          ?.buy?.[0]
          ?.price
      );

    /* =====================================================
       VALIDATION
    ===================================================== */

    const validPrice =
      Number.isFinite(price);

    const validPreviousClose =
      Number.isFinite(
        previousClose
      ) &&
      previousClose !== 0;

    const validVolume =
      Number.isFinite(volume);

    const validBuyPrice =
      Number.isFinite(
        buyPrice
      ) &&
      buyPrice > 0;

    const validSellPrice =
      Number.isFinite(
        sellPrice
      ) &&
      sellPrice > 0;

    /* =====================================================
       CHANGE
    ===================================================== */

    let change:
      | number
      | null = null;

    let changePercent:
      | number
      | null = null;

    if (
      validPrice &&
      validPreviousClose
    ) {
      change =
        price -
        previousClose;

      changePercent =
        (change /
          previousClose) *
        100;
    }

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        symbol,

        instrumentKey,

        marketOpen,

        marketClosed:
          !marketOpen,

        timestamp:
          Date.now(),

        price:
          validPrice
            ? price
            : null,

        previousClose:
          validPreviousClose
            ? previousClose
            : null,

        change,

        changePercent,

        volume:
          validVolume
            ? volume
            : null,

        /*
         * BUY = ASK
         */

        buyPrice:
          validBuyPrice
            ? buyPrice
            : null,

        /*
         * SELL = BID
         */

        sellPrice:
          validSellPrice
            ? sellPrice
            : null,

        source:
          "upstox",
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
      "GET /api/stock/[symbol]/live error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch live stock data.",
      },
      {
        status: 500,
      }
    );
  }
}