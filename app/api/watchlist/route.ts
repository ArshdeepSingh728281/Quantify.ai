// // import { NextResponse } from "next/server";
// // import { ObjectId } from "mongodb";

// // import { auth } from "@/auth";
// // import clientPromise from "@/lib/mongodb";

// // /*
// // |--------------------------------------------------------------------------
// // | TYPES
// // |--------------------------------------------------------------------------
// // */

// // type WatchlistItem = {
// //   symbol: string;
// //   name: string;
// //   instrumentKey: string;
// // };

// // type MarketQuote = {
// //   instrument_token?: string;
// //   symbol?: string;

// //   ohlc?: {
// //     open?: number;
// //     high?: number;
// //     low?: number;
// //     close?: number;
// //   };

// //   last_price?: number;
// //   volume?: number;
// //   average_price?: number;
// //   net_change?: number;

// //   timestamp?: string;
// //   last_trade_time?: string;
// // };

// // type CachedQuote = {
// //   instrumentKey: string;

// //   price: number | null;
// //   change: number | null;
// //   changePercent: number | null;

// //   open: number | null;
// //   high: number | null;
// //   low: number | null;
// //   close: number | null;

// //   volume: number | null;
// //   averagePrice: number | null;

// //   chart: number[];

// //   updatedAt: string;
// // };

// // type WatchlistMarketCache = {
// //   _id?: ObjectId;

// //   userId: ObjectId | string;

// //   quotes: CachedQuote[];

// //   calculatedAt: Date;

// //   expiresAt: Date;
// // };


// // /*
// // |--------------------------------------------------------------------------
// // | CACHE SETTINGS
// // |--------------------------------------------------------------------------
// // */

// // const CACHE_DURATION_MS =
// //   4 * 60 * 1000;


// // /*
// // |--------------------------------------------------------------------------
// // | HELPERS
// // |--------------------------------------------------------------------------
// // */

// // function numberOrNull(
// //   value: unknown
// // ): number | null {

// //   const number =
// //     Number(value);

// //   return Number.isFinite(number)
// //     ? number
// //     : null;
// // }


// // /*
// // |--------------------------------------------------------------------------
// // | GET CURRENT IST TIME
// // |--------------------------------------------------------------------------
// // */

// // function getISTDateParts() {

// //   const formatter =
// //     new Intl.DateTimeFormat(
// //       "en-IN",
// //       {
// //         timeZone:
// //           "Asia/Kolkata",

// //         weekday:
// //           "short",

// //         hour:
// //           "2-digit",

// //         minute:
// //           "2-digit",

// //         hour12:
// //           false,
// //       }
// //     );


// //   const parts =
// //     formatter.formatToParts(
// //       new Date()
// //     );


// //   const get =
// //     (type: string) =>
// //       parts.find(
// //         (part) =>
// //           part.type === type
// //       )?.value;


// //   return {
// //     weekday:
// //       get("weekday") || "",

// //     hour:
// //       Number(
// //         get("hour") || 0
// //       ),

// //     minute:
// //       Number(
// //         get("minute") || 0
// //       ),
// //   };
// // }


// // /*
// // |--------------------------------------------------------------------------
// // | MARKET WINDOW
// // |--------------------------------------------------------------------------
// // |
// // | Monday-Friday
// // | 9:30 AM - 5:00 PM IST
// // |
// // */

// // function isMarketWindow() {

// //   const {
// //     weekday,
// //     hour,
// //     minute,
// //   } = getISTDateParts();


// //   const weekdays = [
// //     "Mon",
// //     "Tue",
// //     "Wed",
// //     "Thu",
// //     "Fri",
// //   ];


// //   if (
// //     !weekdays.includes(
// //       weekday
// //     )
// //   ) {

// //     return false;

// //   }


// //   const totalMinutes =
// //     hour * 60 +
// //     minute;


// //   const marketOpen =
// //     9 * 60 + 30;


// //   const marketClose =
// //     17 * 60;


// //   return (
// //     totalMinutes >=
// //       marketOpen &&
// //     totalMinutes <=
// //       marketClose
// //   );
// // }


// // /*
// // |--------------------------------------------------------------------------
// // | FIND USER
// // |--------------------------------------------------------------------------
// // */

// // async function findUser(
// //   userId: string
// // ) {

// //   const client =
// //     await clientPromise;

// //   const db =
// //     client.db();

// //   const users =
// //     db.collection("users");


// //   let user = null;


// //   /*
// //    * MongoDBAdapter normally uses
// //    * ObjectId for MongoDB _id.
// //    */

// //   if (
// //     ObjectId.isValid(
// //       userId
// //     )
// //   ) {

// //     user =
// //       await users.findOne({
// //         _id:
// //           new ObjectId(
// //             userId
// //           ),
// //       });

// //   }


// //   /*
// //    * Fallback in case the
// //    * database contains string IDs.
// //    */

// //   if (!user) {

// //     user =
// //       await users.findOne({
// //         _id:
// //           userId as any,
// //       });

// //   }


// //   return {
// //     client,
// //     db,
// //     users,
// //     user,
// //   };
// // }


// // /*
// // |--------------------------------------------------------------------------
// // | CREATE SPARKLINE
// // |--------------------------------------------------------------------------
// // */

// // function createChart(
// //   quote: MarketQuote
// // ): number[] {

// //   const open =
// //     numberOrNull(
// //       quote.ohlc?.open
// //     );

// //   const high =
// //     numberOrNull(
// //       quote.ohlc?.high
// //     );

// //   const low =
// //     numberOrNull(
// //       quote.ohlc?.low
// //     );

// //   const close =
// //     numberOrNull(
// //       quote.ohlc?.close
// //     );

// //   const lastPrice =
// //     numberOrNull(
// //       quote.last_price
// //     );

// //   const netChange =
// //     numberOrNull(
// //       quote.net_change
// //     );


// //   let previousClose:
// //     | number
// //     | null = null;


// //   if (
// //     lastPrice !== null &&
// //     netChange !== null
// //   ) {

// //     previousClose =
// //       lastPrice -
// //       netChange;

// //   }


// //   const values = [
// //     previousClose,
// //     open,
// //     low,
// //     open,
// //     high,
// //     close,
// //     lastPrice,
// //   ].filter(
// //     (
// //       value
// //     ): value is number =>
// //       value !== null &&
// //       Number.isFinite(
// //         value
// //       )
// //   );


// //   if (
// //     values.length === 0
// //   ) {

// //     return [];

// //   }


// //   while (
// //     values.length < 7
// //   ) {

// //     values.push(
// //       values[
// //         values.length - 1
// //       ]
// //     );

// //   }


// //   return values;

// // }


// // /*
// // |--------------------------------------------------------------------------
// // | BUILD QUOTE
// // |--------------------------------------------------------------------------
// // */

// // function buildCachedQuote(
// //   instrumentKey: string,
// //   quote: MarketQuote
// // ): CachedQuote {

// //   const price =
// //     numberOrNull(
// //       quote.last_price
// //     );

// //   const netChange =
// //     numberOrNull(
// //       quote.net_change
// //     );

// //   const open =
// //     numberOrNull(
// //       quote.ohlc?.open
// //     );

// //   const high =
// //     numberOrNull(
// //       quote.ohlc?.high
// //     );

// //   const low =
// //     numberOrNull(
// //       quote.ohlc?.low
// //     );

// //   const close =
// //     numberOrNull(
// //       quote.ohlc?.close
// //     );

// //   const volume =
// //     numberOrNull(
// //       quote.volume
// //     );

// //   const averagePrice =
// //     numberOrNull(
// //       quote.average_price
// //     );


// //   let changePercent:
// //     | number
// //     | null = null;


// //   if (
// //     price !== null &&
// //     netChange !== null
// //   ) {

// //     const previousClose =
// //       price -
// //       netChange;


// //     if (
// //       previousClose !== 0
// //     ) {

// //       changePercent =
// //         (
// //           netChange /
// //           previousClose
// //         ) *
// //         100;

// //     }

// //   }


// //   return {
// //     instrumentKey,

// //     price,

// //     change:
// //       netChange,

// //     changePercent,

// //     open,

// //     high,

// //     low,

// //     close,

// //     volume,

// //     averagePrice,

// //     chart:
// //       createChart(
// //         quote
// //       ),

// //     updatedAt:
// //       new Date().toISOString(),
// //   };

// // }


// // /*
// // |--------------------------------------------------------------------------
// // | POST /api/watchlist
// // |--------------------------------------------------------------------------
// // |
// // | ONLY stores:
// // |
// // | symbol
// // | name
// // | instrumentKey
// // |
// // */

// // export async function POST(
// //   request: Request
// // ) {

// //   try {

// //     const session =
// //       await auth();


// //     if (
// //       !session?.user?.id
// //     ) {

// //       return NextResponse.json(
// //         {
// //           error:
// //             "You must be signed in to add stocks.",
// //         },
// //         {
// //           status: 401,
// //         }
// //       );

// //     }


// //     const body =
// //       await request.json();


// //     const stock =
// //       body?.stock;


// //     if (
// //       !stock ||
// //       typeof stock.symbol !==
// //         "string" ||
// //       typeof stock.name !==
// //         "string" ||
// //       typeof stock.instrumentKey !==
// //         "string"
// //     ) {

// //       return NextResponse.json(
// //         {
// //           error:
// //             "Invalid stock data. symbol, name and instrumentKey are required.",
// //         },
// //         {
// //           status: 400,
// //         }
// //       );

// //     }


// //     /*
// //      * IMPORTANT:
// //      *
// //      * We intentionally throw away
// //      * price, chart, volume, etc.
// //      */

// //     const watchlistItem:
// //       WatchlistItem = {

// //       symbol:
// //         stock.symbol,

// //       name:
// //         stock.name,

// //       instrumentKey:
// //         stock.instrumentKey,

// //     };


// //     const {
// //       users,
// //       user,
// //     } =
// //       await findUser(
// //         session.user.id
// //       );


// //     if (!user) {

// //       return NextResponse.json(
// //         {
// //           error:
// //             "User account was not found.",
// //         },
// //         {
// //           status: 404,
// //         }
// //       );

// //     }


// //     const existingWatchlist =
// //       Array.isArray(
// //         user.watchlist
// //       )
// //         ? user.watchlist
// //         : [];


// //     const alreadyExists =
// //       existingWatchlist.some(
// //         (
// //           item: WatchlistItem
// //         ) =>
// //           item?.instrumentKey ===
// //           watchlistItem.instrumentKey
// //       );


// //     if (
// //       alreadyExists
// //     ) {

// //       return NextResponse.json(
// //         {
// //           success:
// //             true,

// //           alreadyExists:
// //             true,

// //           message:
// //             "Stock is already in your watchlist.",

// //           stock:
// //             watchlistItem,
// //         },
// //         {
// //           status: 200,
// //         }
// //       );

// //     }


// //     /*
// //      * Store ONLY the 3 fields.
// //      */

// //     const result =
// //       await users.updateOne(
// //         {
// //           _id:
// //             user._id,
// //         },
// //         {
// //           $push: {
// //             watchlist:
// //               watchlistItem,
// //           },
// //         } as any
// //       );


// //     if (
// //       result.modifiedCount !==
// //       1
// //     ) {

// //       return NextResponse.json(
// //         {
// //           error:
// //             "Failed to save stock to watchlist.",
// //         },
// //         {
// //           status: 500,
// //         }
// //       );

// //     }


// //     return NextResponse.json(
// //       {
// //         success:
// //           true,

// //         message:
// //           "Stock added to watchlist.",

// //         stock:
// //           watchlistItem,
// //       },
// //       {
// //         status: 200,
// //       }
// //     );


// //   } catch (error) {

// //     console.error(
// //       "POST /api/watchlist error:",
// //       error
// //     );


// //     return NextResponse.json(
// //       {
// //         error:
// //           "Failed to add stock to watchlist.",
// //       },
// //       {
// //         status: 500,
// //       }
// //     );

// //   }

// // }


// // /*
// // |--------------------------------------------------------------------------
// // | GET /api/watchlist
// // |--------------------------------------------------------------------------
// // |
// // | Returns:
// // |
// // | watchlist identity
// // | +
// // | market data
// // |
// // | Market data is cached for 4 minutes.
// // |
// // */

// // export async function GET() {

// //   try {

// //     const session =
// //       await auth();


// //     if (
// //       !session?.user?.id
// //     ) {

// //       return NextResponse.json(
// //         {
// //           error:
// //             "You must be signed in.",
// //         },
// //         {
// //           status: 401,
// //         }
// //       );

// //     }


// //     const {
// //       db,
// //       user,
// //     } =
// //       await findUser(
// //         session.user.id
// //       );


// //     if (!user) {

// //       return NextResponse.json(
// //         {
// //           error:
// //             "User account was not found.",
// //         },
// //         {
// //           status: 404,
// //         }
// //       );

// //     }


// //     const watchlist:
// //       WatchlistItem[] =
// //       Array.isArray(
// //         user.watchlist
// //       )
// //         ? user.watchlist
// //             .filter(
// //               (
// //                 item: WatchlistItem
// //               ) =>
// //                 item &&
// //                 typeof item.symbol ===
// //                   "string" &&
// //                 typeof item.name ===
// //                   "string" &&
// //                 typeof item.instrumentKey ===
// //                   "string"
// //             )
// //             .map(
// //               (
// //                 item: WatchlistItem
// //               ) => ({
// //                 symbol:
// //                   item.symbol,

// //                 name:
// //                   item.name,

// //                 instrumentKey:
// //                   item.instrumentKey,
// //               })
// //             )
// //         : [];


// //     /*
// //     |--------------------------------------------------------------------------
// //     | EMPTY WATCHLIST
// //     |--------------------------------------------------------------------------
// //     */

// //     if (
// //       watchlist.length === 0
// //     ) {

// //       return NextResponse.json(
// //         {
// //           success:
// //             true,

// //           watchlist:
// //             [],

// //           marketData:
// //             [],

// //           source:
// //             "mongodb",

// //           marketOpen:
// //             isMarketWindow(),

// //         },
// //         {
// //           status: 200,
// //         }
// //       );

// //     }


// //     /*
// //     |--------------------------------------------------------------------------
// //     | CACHE
// //     |--------------------------------------------------------------------------
// //     */

// //     const cacheCollection =
// //       db.collection<WatchlistMarketCache>(
// //         "watchlist_market_cache"
// //       );


// //     const now =
// //       new Date();


// //     const cached =
// //       await cacheCollection.findOne({
// //         userId:
// //           user._id,
// //       });


// //     const cacheIsFresh =
// //       cached &&
// //       cached.expiresAt >
// //         now;


// //     const marketOpen =
// //       isMarketWindow();


// //     /*
// //     |--------------------------------------------------------------------------
// //     | USE 4-MIN CACHE
// //     |--------------------------------------------------------------------------
// //     */

// //     if (
// //       cacheIsFresh ||
// //       !marketOpen
// //     ) {

// //       const cachedQuotes =
// //         cached?.quotes || [];


// //       return NextResponse.json(
// //         {
// //           success:
// //             true,

// //           watchlist,

// //           marketData:
// //             cachedQuotes,

// //           source:
// //             "mongodb",

// //           marketOpen,

// //           cachedAt:
// //             cached?.calculatedAt ||
// //             null,

// //           expiresAt:
// //             cached?.expiresAt ||
// //             null,
// //         },
// //         {
// //           status: 200,

// //           headers: {
// //             "Cache-Control":
// //               "no-store",
// //           },
// //         }
// //       );

// //     }


// //     /*
// //     |--------------------------------------------------------------------------
// //     | MARKET IS OPEN + CACHE EXPIRED
// //     |--------------------------------------------------------------------------
// //     |
// //     | Now and ONLY now do we
// //     | call Upstox.
// //     |
// //     */

// //     const accessToken =
// //       process.env.UPSTOX_ACCESS_TOKEN
// //         ?.trim()
// //         .replace(
// //           /^["']|["']$/g,
// //           ""
// //         );


// //     if (!accessToken) {

// //       /*
// //        * If Upstox token is missing,
// //        * return whatever cache exists.
// //        */

// //       return NextResponse.json(
// //         {
// //           success:
// //             true,

// //           watchlist,

// //           marketData:
// //             cached?.quotes || [],

// //           source:
// //             "mongodb",

// //           marketOpen,

// //           warning:
// //             "UPSTOX_ACCESS_TOKEN is not configured.",
// //         },
// //         {
// //           status: 200,
// //         }
// //       );

// //     }


// //     /*
// //     |--------------------------------------------------------------------------
// //     | ONE UPSTOX REQUEST FOR WHOLE WATCHLIST
// //     |--------------------------------------------------------------------------
// //     */

// //     const instrumentKeys =
// //       watchlist
// //         .map(
// //           (item) =>
// //             item.instrumentKey
// //         )
// //         .join(",");


// //     const url =
// //       `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(
// //         instrumentKeys
// //       )}`;


// //     const response =
// //       await fetch(
// //         url,
// //         {
// //           method:
// //             "GET",

// //           headers: {
// //             Accept:
// //               "application/json",

// //             Authorization:
// //               `Bearer ${accessToken}`,
// //           },

// //           cache:
// //             "no-store",
// //         }
// //       );


// //     const responseText =
// //       await response.text();


// //     let upstoxData:
// //       {
// //         status?: string;

// //         data?: Record<
// //           string,
// //           MarketQuote
// //         >;

// //         errors?: unknown;
// //       };


// //     try {

// //       upstoxData =
// //         JSON.parse(
// //           responseText
// //         );

// //     } catch {

// //       /*
// //        * Don't destroy the user's
// //        * cached data if Upstox fails.
// //        */

// //       return NextResponse.json(
// //         {
// //           success:
// //             true,

// //           watchlist,

// //           marketData:
// //             cached?.quotes || [],

// //           source:
// //             "mongodb",

// //           marketOpen,

// //           warning:
// //             "Upstox returned an invalid response.",
// //         },
// //         {
// //           status: 200,
// //         }
// //       );

// //     }


// //     if (
// //       !response.ok
// //     ) {

// //       console.error(
// //         "Watchlist Upstox error:",
// //         upstoxData
// //       );


// //       return NextResponse.json(
// //         {
// //           success:
// //             true,

// //           watchlist,

// //           marketData:
// //             cached?.quotes || [],

// //           source:
// //             "mongodb",

// //           marketOpen,

// //           warning:
// //             "Unable to refresh market data from Upstox.",
// //         },
// //         {
// //           status: 200,
// //         }
// //       );

// //     }


// //     const quoteData =
// //       upstoxData.data || {};


// //     /*
// //     |--------------------------------------------------------------------------
// //     | CONVERT UPSTOX DATA
// //     |--------------------------------------------------------------------------
// //     */

// //     const quotes:
// //       CachedQuote[] =
// //       watchlist
// //         .map(
// //           (
// //             item
// //           ) => {

// //             let quote:
// //               | MarketQuote
// //               | undefined;


// //             /*
// //              * Exact instrument key.
// //              */

// //             quote =
// //               quoteData[
// //                 item.instrumentKey
// //               ];


// //             /*
// //              * Search by instrument token.
// //              */

// //             if (!quote) {

// //               quote =
// //                 Object.values(
// //                   quoteData
// //                 ).find(
// //                   (
// //                     value
// //                   ) =>
// //                     value?.instrument_token ===
// //                     item.instrumentKey
// //                 );

// //             }


// //             /*
// //              * Search by symbol.
// //              */

// //             if (!quote) {

// //               quote =
// //                 Object.values(
// //                   quoteData
// //                 ).find(
// //                   (
// //                     value
// //                   ) =>
// //                     value?.symbol ===
// //                     item.symbol
// //                 );

// //             }


// //             if (!quote) {

// //               return null;

// //             }


// //             return buildCachedQuote(
// //               item.instrumentKey,
// //               quote
// //             );

// //           }
// //         )
// //         .filter(
// //           (
// //             quote
// //           ): quote is CachedQuote =>
// //             quote !== null
// //         );


// //     /*
// //     |--------------------------------------------------------------------------
// //     | SAVE 4-MINUTE CACHE
// //     |--------------------------------------------------------------------------
// //     */

// //     const calculatedAt =
// //       new Date();


// //     const expiresAt =
// //       new Date(
// //         calculatedAt.getTime() +
// //           CACHE_DURATION_MS
// //       );


// //     await cacheCollection.updateOne(

// //       {
// //         userId:
// //           user._id,
// //       },

// //       {
// //         $set: {
// //           userId:
// //             user._id,

// //           quotes,

// //           calculatedAt,

// //           expiresAt,
// //         },
// //       },

// //       {
// //         upsert:
// //           true,
// //       }

// //     );


// //     /*
// //     |--------------------------------------------------------------------------
// //     | RETURN
// //     |--------------------------------------------------------------------------
// //     */

// //     return NextResponse.json(
// //       {
// //         success:
// //           true,

// //         watchlist,

// //         marketData:
// //           quotes,

// //         source:
// //           "upstox",

// //         marketOpen,

// //         cachedAt:
// //           calculatedAt,

// //         expiresAt,
// //       },
// //       {
// //         status: 200,

// //         headers: {
// //           "Cache-Control":
// //             "no-store",
// //         },
// //       }
// //     );


// //   } catch (error) {

// //     console.error(
// //       "GET /api/watchlist error:",
// //       error
// //     );


// //     return NextResponse.json(
// //       {
// //         error:
// //           "Failed to load watchlist.",
// //       },
// //       {
// //         status: 500,
// //       }
// //     );

// //   }

// // }











// import { NextResponse } from "next/server";
// import { ObjectId } from "mongodb";

// import { auth } from "@/auth";
// import clientPromise from "@/lib/mongodb";

// /*
// |--------------------------------------------------------------------------
// | TYPES
// |--------------------------------------------------------------------------
// */

// type WatchlistItem = {
//   symbol: string;
//   name: string;
//   instrumentKey: string;
// };

// type MarketQuote = {
//   instrument_token?: string;

//   symbol?: string;

//   ohlc?: {
//     open?: number;
//     high?: number;
//     low?: number;
//     close?: number;
//   };

//   last_price?: number;
//   volume?: number;
//   average_price?: number;
//   net_change?: number;

//   timestamp?: string;
//   last_trade_time?: string;
// };

// type CachedQuote = {
//   instrumentKey: string;

//   price: number | null;

//   change: number | null;

//   changePercent: number | null;

//   open: number | null;

//   high: number | null;

//   low: number | null;

//   close: number | null;

//   volume: number | null;

//   averagePrice: number | null;

//   chart: number[];

//   updatedAt: string;
// };

// type WatchlistMarketCache = {
//   _id?: ObjectId;

//   userId: ObjectId | string;

//   quotes: CachedQuote[];

//   calculatedAt: Date;

//   expiresAt: Date;
// };

// /*
// |--------------------------------------------------------------------------
// | CACHE
// |--------------------------------------------------------------------------
// */

// const CACHE_DURATION_MS = 4 * 60 * 1000;

// /*
// |--------------------------------------------------------------------------
// | HELPERS
// |--------------------------------------------------------------------------
// */

// function numberOrNull(value: unknown): number | null {
//   const number = Number(value);

//   return Number.isFinite(number) ? number : null;
// }

// /*
// |--------------------------------------------------------------------------
// | MARKET TIME
// |--------------------------------------------------------------------------
// |
// | Monday - Friday
// | 9:30 AM - 5:00 PM IST
// |
// */

// function getISTDateParts() {
//   const formatter = new Intl.DateTimeFormat("en-IN", {
//     timeZone: "Asia/Kolkata",
//     weekday: "short",
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: false,
//   });

//   const parts = formatter.formatToParts(new Date());

//   const get = (type: string) =>
//     parts.find((part) => part.type === type)?.value;

//   return {
//     weekday: get("weekday") || "",
//     hour: Number(get("hour") || 0),
//     minute: Number(get("minute") || 0),
//   };
// }

// function isMarketWindow() {
//   const { weekday, hour, minute } = getISTDateParts();

//   const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

//   if (!weekdays.includes(weekday)) {
//     return false;
//   }

//   const currentMinutes = hour * 60 + minute;

//   const marketOpen = 9 * 60 + 30;
//   const marketClose = 17 * 60;

//   return (
//     currentMinutes >= marketOpen &&
//     currentMinutes <= marketClose
//   );
// }

// /*
// |--------------------------------------------------------------------------
// | FIND USER
// |--------------------------------------------------------------------------
// */

// async function findUser(userId: string) {
//   const client = await clientPromise;

//   const db = client.db();

//   const users = db.collection("users");

//   let user = null;

//   /*
//    * MongoDBAdapter normally uses ObjectId.
//    */

//   if (ObjectId.isValid(userId)) {
//     user = await users.findOne({
//       _id: new ObjectId(userId),
//     });
//   }

//   /*
//    * Fallback for string IDs.
//    */

//   if (!user) {
//     user = await users.findOne({
//       _id: userId as any,
//     });
//   }

//   return {
//     client,
//     db,
//     users,
//     user,
//   };
// }

// /*
// |--------------------------------------------------------------------------
// | CREATE SPARKLINE
// |--------------------------------------------------------------------------
// */

// function createChart(quote: MarketQuote): number[] {
//   const open = numberOrNull(quote.ohlc?.open);

//   const high = numberOrNull(quote.ohlc?.high);

//   const low = numberOrNull(quote.ohlc?.low);

//   const close = numberOrNull(quote.ohlc?.close);

//   const lastPrice = numberOrNull(quote.last_price);

//   const netChange = numberOrNull(quote.net_change);

//   let previousClose: number | null = null;

//   if (lastPrice !== null && netChange !== null) {
//     previousClose = lastPrice - netChange;
//   }

//   const values = [
//     previousClose,
//     open,
//     low,
//     open,
//     high,
//     close,
//     lastPrice,
//   ].filter(
//     (value): value is number =>
//       value !== null &&
//       Number.isFinite(value)
//   );

//   if (values.length === 0) {
//     return [];
//   }

//   while (values.length < 7) {
//     values.push(values[values.length - 1]);
//   }

//   return values;
// }

// /*
// |--------------------------------------------------------------------------
// | BUILD QUOTE
// |--------------------------------------------------------------------------
// */

// function buildCachedQuote(
//   instrumentKey: string,
//   quote: MarketQuote
// ): CachedQuote {
//   const price = numberOrNull(quote.last_price);

//   const netChange = numberOrNull(
//     quote.net_change
//   );

//   const open = numberOrNull(
//     quote.ohlc?.open
//   );

//   const high = numberOrNull(
//     quote.ohlc?.high
//   );

//   const low = numberOrNull(
//     quote.ohlc?.low
//   );

//   const close = numberOrNull(
//     quote.ohlc?.close
//   );

//   const volume = numberOrNull(
//     quote.volume
//   );

//   const averagePrice = numberOrNull(
//     quote.average_price
//   );

//   let changePercent: number | null = null;

//   if (
//     price !== null &&
//     netChange !== null
//   ) {
//     const previousClose =
//       price - netChange;

//     if (
//       previousClose !== 0 &&
//       Number.isFinite(previousClose)
//     ) {
//       changePercent =
//         (netChange / previousClose) * 100;
//     }
//   }

//   return {
//     instrumentKey,

//     price,

//     change: netChange,

//     changePercent,

//     open,

//     high,

//     low,

//     close,

//     volume,

//     averagePrice,

//     chart: createChart(quote),

//     updatedAt: new Date().toISOString(),
//   };
// }

// /*
// |--------------------------------------------------------------------------
// | NORMALIZE WATCHLIST
// |--------------------------------------------------------------------------
// |
// | This also cleans old watchlist objects that
// | may still contain price/chart/volume/etc.
// |
// */

// function normalizeWatchlist(
//   value: unknown
// ): WatchlistItem[] {
//   if (!Array.isArray(value)) {
//     return [];
//   }

//   return value
//     .filter((item) => {
//       return (
//         item &&
//         typeof item.symbol === "string" &&
//         typeof item.name === "string" &&
//         typeof item.instrumentKey === "string"
//       );
//     })
//     .map((item) => ({
//       symbol: item.symbol,
//       name: item.name,
//       instrumentKey: item.instrumentKey,
//     }));
// }

// /*
// |--------------------------------------------------------------------------
// | WATCHLIST IDENTITY COMPARISON
// |--------------------------------------------------------------------------
// */

// function sameWatchlist(
//   a: WatchlistItem[],
//   b: WatchlistItem[]
// ) {
//   if (a.length !== b.length) {
//     return false;
//   }

//   return a.every((item, index) => {
//     const other = b[index];

//     return (
//       item.symbol === other.symbol &&
//       item.name === other.name &&
//       item.instrumentKey ===
//         other.instrumentKey
//     );
//   });
// }

// /*
// |--------------------------------------------------------------------------
// | POST /api/watchlist
// |--------------------------------------------------------------------------
// |
// | Stores ONLY:
// |
// | symbol
// | name
// | instrumentKey
// |
// |--------------------------------------------------------------------------
// */

// export async function POST(request: Request) {
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       return NextResponse.json(
//         {
//           error:
//             "You must be signed in to add stocks.",
//         },
//         {
//           status: 401,
//         }
//       );
//     }

//     const body = await request.json();

//     const stock = body?.stock;

//     if (
//       !stock ||
//       typeof stock.symbol !== "string" ||
//       typeof stock.name !== "string" ||
//       typeof stock.instrumentKey !== "string"
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "Invalid stock data. symbol, name and instrumentKey are required.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     /*
//      * IMPORTANT:
//      *
//      * Only these 3 fields are saved.
//      */

//     const watchlistItem: WatchlistItem = {
//       symbol: stock.symbol,
//       name: stock.name,
//       instrumentKey: stock.instrumentKey,
//     };

//     const { users, user } =
//       await findUser(session.user.id);

//     if (!user) {
//       return NextResponse.json(
//         {
//           error:
//             "User account was not found.",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     const existingWatchlist =
//       normalizeWatchlist(
//         user.watchlist
//       );

//     const alreadyExists =
//       existingWatchlist.some(
//         (item) =>
//           item.instrumentKey ===
//           watchlistItem.instrumentKey
//       );

//     if (alreadyExists) {
//       return NextResponse.json(
//         {
//           success: true,
//           alreadyExists: true,
//           message:
//             "Stock is already in your watchlist.",
//           stock: watchlistItem,
//           watchlist:
//             existingWatchlist,
//         },
//         {
//           status: 200,
//         }
//       );
//     }

//     const newWatchlist = [
//       ...existingWatchlist,
//       watchlistItem,
//     ];

//     const result =
//       await users.updateOne(
//         {
//           _id: user._id,
//         },
//         {
//           $set: {
//             watchlist: newWatchlist,
//           },
//         }
//       );

//     if (result.modifiedCount !== 1) {
//       return NextResponse.json(
//         {
//           error:
//             "Failed to save stock to watchlist.",
//         },
//         {
//           status: 500,
//         }
//       );
//     }

//     /*
//      * Return the complete watchlist so
//      * frontend can immediately synchronize
//      * localStorage.
//      */

//     return NextResponse.json(
//       {
//         success: true,

//         message:
//           "Stock added to watchlist.",

//         stock: watchlistItem,

//         watchlist: newWatchlist,
//       },
//       {
//         status: 200,
//       }
//     );
//   } catch (error) {
//     console.error(
//       "POST /api/watchlist error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         error:
//           "Failed to add stock to watchlist.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

// /*
// |--------------------------------------------------------------------------
// | DELETE /api/watchlist
// |--------------------------------------------------------------------------
// |
// | Removes a stock using instrumentKey.
// |
// |--------------------------------------------------------------------------
// */

// export async function DELETE(
//   request: Request
// ) {
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       return NextResponse.json(
//         {
//           error:
//             "You must be signed in.",
//         },
//         {
//           status: 401,
//         }
//       );
//     }

//     const body = await request.json();

//     const instrumentKey =
//       body?.instrumentKey;

//     if (
//       typeof instrumentKey !== "string" ||
//       !instrumentKey.trim()
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "instrumentKey is required.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     const { users, user } =
//       await findUser(session.user.id);

//     if (!user) {
//       return NextResponse.json(
//         {
//           error:
//             "User account was not found.",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     const existingWatchlist =
//       normalizeWatchlist(
//         user.watchlist
//       );

//     const newWatchlist =
//       existingWatchlist.filter(
//         (item) =>
//           item.instrumentKey !==
//           instrumentKey
//       );

//     /*
//      * Nothing was removed.
//      */

//     if (
//       newWatchlist.length ===
//       existingWatchlist.length
//     ) {
//       return NextResponse.json(
//         {
//           success: true,
//           message:
//             "Stock was not in your watchlist.",
//           watchlist:
//             existingWatchlist,
//         },
//         {
//           status: 200,
//         }
//       );
//     }

//     await users.updateOne(
//       {
//         _id: user._id,
//       },
//       {
//         $set: {
//           watchlist: newWatchlist,
//         },
//       }
//     );

//     /*
//      * Also remove the stock's cached
//      * market quote.
//      */

//     const client =
//       await clientPromise;

//     const db = client.db();

//     const cacheCollection =
//       db.collection<WatchlistMarketCache>(
//         "watchlist_market_cache"
//       );

//     const cache =
//       await cacheCollection.findOne({
//         userId: user._id,
//       });

//     if (cache) {
//       const quotes =
//         cache.quotes.filter(
//           (quote) =>
//             quote.instrumentKey !==
//             instrumentKey
//         );

//       await cacheCollection.updateOne(
//         {
//           _id: cache._id,
//         },
//         {
//           $set: {
//             quotes,
//           },
//         }
//       );
//     }

//     return NextResponse.json(
//       {
//         success: true,

//         message:
//           "Stock removed from watchlist.",

//         watchlist: newWatchlist,
//       },
//       {
//         status: 200,
//       }
//     );
//   } catch (error) {
//     console.error(
//       "DELETE /api/watchlist error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         error:
//           "Failed to remove stock from watchlist.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

// /*
// |--------------------------------------------------------------------------
// | GET /api/watchlist
// |--------------------------------------------------------------------------
// |
// | 1. Get watchlist from MongoDB.
// |
// | 2. If market is closed:
// |    return DB watchlist + cached prices.
// |
// | 3. If market is open and cache is fresh:
// |    return cached prices.
// |
// | 4. If market is open and cache expired:
// |    call Upstox ONCE for all stocks.
// |
// | 5. Store prices for 4 minutes.
// |
// |--------------------------------------------------------------------------
// */

// export async function GET() {
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       return NextResponse.json(
//         {
//           error:
//             "You must be signed in.",
//         },
//         {
//           status: 401,
//         }
//       );
//     }

//     const {
//       db,
//       user,
//     } = await findUser(
//       session.user.id
//     );

//     if (!user) {
//       return NextResponse.json(
//         {
//           error:
//             "User account was not found.",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     const watchlist =
//       normalizeWatchlist(
//         user.watchlist
//       );

//     const marketOpen =
//       isMarketWindow();

//     /*
//      * Empty watchlist.
//      */

//     if (watchlist.length === 0) {
//       return NextResponse.json(
//         {
//           success: true,

//           watchlist: [],

//           marketData: [],

//           source: "mongodb",

//           marketOpen,
//         },
//         {
//           status: 200,
//           headers: {
//             "Cache-Control":
//               "no-store",
//           },
//         }
//       );
//     }

//     /*
//      * Market cache collection.
//      */

//     const cacheCollection =
//       db.collection<WatchlistMarketCache>(
//         "watchlist_market_cache"
//       );

//     const now = new Date();

//     const cached =
//       await cacheCollection.findOne({
//         userId: user._id,
//       });

//     /*
//      * Make sure cache actually contains
//      * all current watchlist stocks.
//      *
//      * This is important when user adds
//      * a new stock while old cache is
//      * still fresh.
//      */

//     const cachedQuotes =
//       cached?.quotes || [];

//     const hasAllQuotes =
//       watchlist.every((item) =>
//         cachedQuotes.some(
//           (quote) =>
//             quote.instrumentKey ===
//             item.instrumentKey
//         )
//       );

//     const cacheIsFresh =
//       Boolean(
//         cached &&
//         cached.expiresAt > now &&
//         hasAllQuotes
//       );

//     /*
//      * CACHE HIT
//      *
//      * Also used outside market hours.
//      */

//     if (
//       cacheIsFresh ||
//       !marketOpen
//     ) {
//       return NextResponse.json(
//         {
//           success: true,

//           watchlist,

//           marketData:
//             cachedQuotes.filter(
//               (quote) =>
//                 watchlist.some(
//                   (item) =>
//                     item.instrumentKey ===
//                     quote.instrumentKey
//                 )
//             ),

//           source: "mongodb",

//           marketOpen,

//           cachedAt:
//             cached?.calculatedAt ||
//             null,

//           expiresAt:
//             cached?.expiresAt ||
//             null,
//         },
//         {
//           status: 200,

//           headers: {
//             "Cache-Control":
//               "no-store",
//           },
//         }
//       );
//     }

//     /*
//      * MARKET OPEN + CACHE EXPIRED
//      *
//      * Now we are allowed to call
//      * Upstox.
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
//           success: true,

//           watchlist,

//           marketData:
//             cachedQuotes,

//           source: "mongodb",

//           marketOpen,

//           warning:
//             "UPSTOX_ACCESS_TOKEN is not configured.",
//         },
//         {
//           status: 200,
//         }
//       );
//     }

//     /*
//      * ONE API REQUEST FOR THE
//      * ENTIRE WATCHLIST.
//      */

//     const instrumentKeys =
//       watchlist
//         .map(
//           (item) =>
//             item.instrumentKey
//         )
//         .join(",");

//     const url =
//       `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(
//         instrumentKeys
//       )}`;

//     const response =
//       await fetch(url, {
//         method: "GET",

//         headers: {
//           Accept:
//             "application/json",

//           Authorization:
//             `Bearer ${accessToken}`,
//         },

//         cache: "no-store",
//       });

//     const responseText =
//       await response.text();

//     let upstoxData: {
//       status?: string;

//       data?: Record<
//         string,
//         MarketQuote
//       >;

//       errors?: unknown;
//     };

//     try {
//       upstoxData =
//         JSON.parse(
//           responseText
//         );
//     } catch {
//       return NextResponse.json(
//         {
//           success: true,

//           watchlist,

//           marketData:
//             cachedQuotes,

//           source: "mongodb",

//           marketOpen,

//           warning:
//             "Upstox returned an invalid response.",
//         },
//         {
//           status: 200,
//         }
//       );
//     }

//     if (!response.ok) {
//       console.error(
//         "Watchlist Upstox error:",
//         upstoxData
//       );

//       return NextResponse.json(
//         {
//           success: true,

//           watchlist,

//           marketData:
//             cachedQuotes,

//           source: "mongodb",

//           marketOpen,

//           warning:
//             "Unable to refresh market data from Upstox.",
//         },
//         {
//           status: 200,
//         }
//       );
//     }

//     const quoteData =
//       upstoxData.data || {};

//     /*
//      * BUILD QUOTES
//      */

//     const quotes: CachedQuote[] =
//       watchlist
//         .map((item) => {
//           let quote:
//             | MarketQuote
//             | undefined;

//           /*
//            * Exact response key.
//            */

//           quote =
//             quoteData[
//               item.instrumentKey
//             ];

//           /*
//            * Instrument token fallback.
//            */

//           if (!quote) {
//             quote =
//               Object.values(
//                 quoteData
//               ).find(
//                 (value) =>
//                   value?.instrument_token ===
//                   item.instrumentKey
//               );
//           }

//           /*
//            * Symbol fallback.
//            */

//           if (!quote) {
//             quote =
//               Object.values(
//                 quoteData
//               ).find(
//                 (value) =>
//                   value?.symbol ===
//                   item.symbol
//               );
//           }

//           if (!quote) {
//             return null;
//           }

//           return buildCachedQuote(
//             item.instrumentKey,
//             quote
//           );
//         })
//         .filter(
//           (
//             quote
//           ): quote is CachedQuote =>
//             quote !== null
//         );

//     /*
//      * SAVE 4-MINUTE CACHE
//      */

//     const calculatedAt =
//       new Date();

//     const expiresAt =
//       new Date(
//         calculatedAt.getTime() +
//           CACHE_DURATION_MS
//       );

//     await cacheCollection.updateOne(
//       {
//         userId: user._id,
//       },
//       {
//         $set: {
//           userId: user._id,

//           quotes,

//           calculatedAt,

//           expiresAt,
//         },
//       },
//       {
//         upsert: true,
//       }
//     );

//     return NextResponse.json(
//       {
//         success: true,

//         watchlist,

//         marketData: quotes,

//         source: "upstox",

//         marketOpen,

//         cachedAt:
//           calculatedAt,

//         expiresAt,
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
//       "GET /api/watchlist error:",
//       error
//     );

//     return NextResponse.json(
//       {
//         error:
//           "Failed to load watchlist.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }















import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type WatchlistItem = {
  symbol: string;
  name: string;
  instrumentKey: string;
};

type MarketQuote = {
  instrument_token?: string;

  symbol?: string;

  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  };

  last_price?: number;

  volume?: number;

  average_price?: number;

  net_change?: number;

  timestamp?: string;

  last_trade_time?: string;
};

type CachedQuote = {
  instrumentKey: string;

  price: number | null;

  change: number | null;

  changePercent: number | null;

  open: number | null;

  high: number | null;

  low: number | null;

  close: number | null;

  volume: number | null;

  averagePrice: number | null;

  chart: number[];

  updatedAt: string;
};

type WatchlistMarketCache = {
  _id?: ObjectId;

  userId: ObjectId | string;

  quotes: CachedQuote[];

  calculatedAt: Date;

  expiresAt: Date;
};

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
|
| During market hours:
|   4 minute cache
|
| Outside market hours:
|   Last known market data is kept indefinitely until
|   a new market session provides new data.
|
|--------------------------------------------------------------------------
*/

const CACHE_DURATION_MS =
  4 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function numberOrNull(
  value: unknown
): number | null {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

/*
|--------------------------------------------------------------------------
| MARKET TIME
|--------------------------------------------------------------------------
|
| NSE market:
|
| Monday - Friday
| 9:15 AM - 3:30 PM IST
|
|--------------------------------------------------------------------------
*/

function getISTDateParts() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        timeZone:
          "Asia/Kolkata",

        weekday: "short",

        hour: "2-digit",

        minute: "2-digit",

        hour12: false,
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const get = (
    type: string
  ) =>
    parts.find(
      (part) =>
        part.type === type
    )?.value;

  return {
    weekday:
      get("weekday") || "",

    hour: Number(
      get("hour") || 0
    ),

    minute: Number(
      get("minute") || 0
    ),
  };
}


/*
|--------------------------------------------------------------------------
| IS MARKET OPEN?
|--------------------------------------------------------------------------
*/

function isMarketWindow() {
  const {
    weekday,
    hour,
    minute,
  } = getISTDateParts();

  const weekdays = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ];

  if (
    !weekdays.includes(
      weekday
    )
  ) {
    return false;
  }

  const currentMinutes =
    hour * 60 + minute;

  const marketOpen =
    9 * 60 + 15;

  const marketClose =
    15 * 60 + 30;

  return (
    currentMinutes >=
      marketOpen &&
    currentMinutes <=
      marketClose
  );
}


/*
|--------------------------------------------------------------------------
| FIND USER
|--------------------------------------------------------------------------
*/

async function findUser(
  userId: string
) {
  const client =
    await clientPromise;

  const db =
    client.db();

  const users =
    db.collection("users");

  let user = null;

  /*
   * MongoDBAdapter normally
   * stores ObjectId users.
   */

  if (
    ObjectId.isValid(
      userId
    )
  ) {
    user =
      await users.findOne({
        _id:
          new ObjectId(
            userId
          ),
      });
  }

  /*
   * Fallback for string IDs.
   */

  if (!user) {
    user =
      await users.findOne({
        _id:
          userId as any,
      });
  }

  return {
    client,
    db,
    users,
    user,
  };
}


/*
|--------------------------------------------------------------------------
| CREATE SPARKLINE
|--------------------------------------------------------------------------
*/

function createChart(
  quote: MarketQuote
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

  /*
   * IMPORTANT:
   *
   * If market is closed, last_price
   * can still contain the last traded
   * price.
   */

  const lastPrice =
    numberOrNull(
      quote.last_price
    ) ??
    close;

  const netChange =
    numberOrNull(
      quote.net_change
    );

  let previousClose:
    | number
    | null = null;

  if (
    lastPrice !== null &&
    netChange !== null
  ) {
    previousClose =
      lastPrice -
      netChange;
  }

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
| BUILD QUOTE
|--------------------------------------------------------------------------
*/

function buildCachedQuote(
  instrumentKey: string,
  quote: MarketQuote
): CachedQuote {

  /*
   * LAST PRICE
   *
   * Prefer last_price.
   *
   * If unavailable, use
   * most recent close.
   */

  const rawLastPrice =
    numberOrNull(
      quote.last_price
    );

  const close =
    numberOrNull(
      quote.ohlc?.close
    );

  const price =
    rawLastPrice ??
    close;


  /*
   * CHANGE
   */

  const netChange =
    numberOrNull(
      quote.net_change
    );


  /*
   * OHLC
   */

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


  /*
   * VOLUME
   */

  const volume =
    numberOrNull(
      quote.volume
    );


  /*
   * AVERAGE PRICE
   */

  const averagePrice =
    numberOrNull(
      quote.average_price
    );


  /*
   * CHANGE %
   */

  let changePercent:
    | number
    | null = null;

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
        (netChange /
          previousClose) *
        100;

    }

  }


  return {

    instrumentKey,

    price,

    change:
      netChange,

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

    updatedAt:
      new Date().toISOString(),

  };
}


/*
|--------------------------------------------------------------------------
| NORMALIZE WATCHLIST
|--------------------------------------------------------------------------
*/

function normalizeWatchlist(
  value: unknown
): WatchlistItem[] {

  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .filter(
      (item) => {

        return (
          item &&
          typeof item.symbol ===
            "string" &&
          typeof item.name ===
            "string" &&
          typeof item.instrumentKey ===
            "string"
        );

      }
    )
    .map(
      (item) => ({

        symbol:
          item.symbol,

        name:
          item.name,

        instrumentKey:
          item.instrumentKey,

      })
    );
}


/*
|--------------------------------------------------------------------------
| WATCHLIST IDENTITY COMPARISON
|--------------------------------------------------------------------------
*/

function sameWatchlist(
  a: WatchlistItem[],
  b: WatchlistItem[]
) {

  if (
    a.length !==
    b.length
  ) {
    return false;
  }

  return a.every(
    (
      item,
      index
    ) => {

      const other =
        b[index];

      return (
        item.symbol ===
          other.symbol &&

        item.name ===
          other.name &&

        item.instrumentKey ===
          other.instrumentKey
      );

    }
  );
}


/*
|--------------------------------------------------------------------------
| HAS VALID PRICE
|--------------------------------------------------------------------------
*/

function hasValidPrice(
  quote:
    | CachedQuote
    | undefined
) {

  return Boolean(
    quote &&
    quote.price !== null &&
    Number.isFinite(
      quote.price
    )
  );
}


/*
|--------------------------------------------------------------------------
| DOES CACHE CONTAIN ALL
| USABLE QUOTES?
|--------------------------------------------------------------------------
*/

function cacheHasAllUsableQuotes(
  watchlist: WatchlistItem[],
  quotes: CachedQuote[]
) {

  return watchlist.every(
    (item) => {

      const quote =
        quotes.find(
          (quote) =>
            quote.instrumentKey ===
            item.instrumentKey
        );

      return hasValidPrice(
        quote
      );

    }
  );
}


/*
|--------------------------------------------------------------------------
| POST /api/watchlist
|--------------------------------------------------------------------------
*/

export async function POST(
  request: Request
) {

  try {

    const session =
      await auth();

    if (
      !session?.user?.id
    ) {

      return NextResponse.json(
        {
          error:
            "You must be signed in to add stocks.",
        },
        {
          status: 401,
        }
      );

    }


    const body =
      await request.json();

    const stock =
      body?.stock;


    if (
      !stock ||
      typeof stock.symbol !==
        "string" ||
      typeof stock.name !==
        "string" ||
      typeof stock.instrumentKey !==
        "string"
    ) {

      return NextResponse.json(
        {
          error:
            "Invalid stock data. symbol, name and instrumentKey are required.",
        },
        {
          status: 400,
        }
      );

    }


    const watchlistItem:
      WatchlistItem = {

      symbol:
        stock.symbol,

      name:
        stock.name,

      instrumentKey:
        stock.instrumentKey,

    };


    const {
      users,
      user,
    } =
      await findUser(
        session.user.id
      );


    if (!user) {

      return NextResponse.json(
        {
          error:
            "User account was not found.",
        },
        {
          status: 404,
        }
      );

    }


    const existingWatchlist =
      normalizeWatchlist(
        user.watchlist
      );


    const alreadyExists =
      existingWatchlist.some(
        (item) =>
          item.instrumentKey ===
          watchlistItem.instrumentKey
      );


    if (
      alreadyExists
    ) {

      return NextResponse.json(
        {
          success: true,

          alreadyExists:
            true,

          message:
            "Stock is already in your watchlist.",

          stock:
            watchlistItem,

          watchlist:
            existingWatchlist,
        },
        {
          status: 200,
        }
      );

    }


    const newWatchlist =
      [
        ...existingWatchlist,

        watchlistItem,
      ];


    const result =
      await users.updateOne(
        {
          _id:
            user._id,
        },

        {
          $set: {
            watchlist:
              newWatchlist,
          },
        }
      );


    if (
      result.modifiedCount !==
      1
    ) {

      return NextResponse.json(
        {
          error:
            "Failed to save stock to watchlist.",
        },
        {
          status: 500,
        }
      );

    }


    return NextResponse.json(
      {
        success: true,

        message:
          "Stock added to watchlist.",

        stock:
          watchlistItem,

        watchlist:
          newWatchlist,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.error(
      "POST /api/watchlist error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to add stock to watchlist.",
      },
      {
        status: 500,
      }
    );

  }

}


/*
|--------------------------------------------------------------------------
| DELETE /api/watchlist
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: Request
) {

  try {

    const session =
      await auth();

    if (
      !session?.user?.id
    ) {

      return NextResponse.json(
        {
          error:
            "You must be signed in.",
        },
        {
          status: 401,
        }
      );

    }


    const body =
      await request.json();

    const instrumentKey =
      body?.instrumentKey;


    if (
      typeof instrumentKey !==
        "string" ||
      !instrumentKey.trim()
    ) {

      return NextResponse.json(
        {
          error:
            "instrumentKey is required.",
        },
        {
          status: 400,
        }
      );

    }


    const {
      users,
      user,
    } =
      await findUser(
        session.user.id
      );


    if (!user) {

      return NextResponse.json(
        {
          error:
            "User account was not found.",
        },
        {
          status: 404,
        }
      );

    }


    const existingWatchlist =
      normalizeWatchlist(
        user.watchlist
      );


    const newWatchlist =
      existingWatchlist.filter(
        (item) =>
          item.instrumentKey !==
          instrumentKey
      );


    if (
      newWatchlist.length ===
      existingWatchlist.length
    ) {

      return NextResponse.json(
        {
          success: true,

          message:
            "Stock was not in your watchlist.",

          watchlist:
            existingWatchlist,
        },
        {
          status: 200,
        }
      );

    }


    await users.updateOne(
      {
        _id:
          user._id,
      },

      {
        $set: {
          watchlist:
            newWatchlist,
        },
      }
    );


    /*
     * Remove cached market
     * data for this stock.
     */

    const client =
      await clientPromise;

    const db =
      client.db();

    const cacheCollection =
      db.collection<WatchlistMarketCache>(
        "watchlist_market_cache"
      );


    const cache =
      await cacheCollection.findOne(
        {
          userId:
            user._id,
        }
      );


    if (cache) {

      const quotes =
        cache.quotes.filter(
          (quote) =>
            quote.instrumentKey !==
            instrumentKey
        );


      await cacheCollection.updateOne(
        {
          _id:
            cache._id,
        },

        {
          $set: {
            quotes,
          },
        }
      );

    }


    return NextResponse.json(
      {
        success: true,

        message:
          "Stock removed from watchlist.",

        watchlist:
          newWatchlist,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.error(
      "DELETE /api/watchlist error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to remove stock from watchlist.",
      },
      {
        status: 500,
      }
    );

  }

}


/*
|--------------------------------------------------------------------------
| GET /api/watchlist
|--------------------------------------------------------------------------
|
| IMPORTANT BEHAVIOUR
|
| MARKET OPEN
| -------------
| - Use 4 minute MongoDB cache.
| - Refresh from Upstox when expired.
|
| MARKET CLOSED
| -------------
| - ALWAYS show last known price.
| - If MongoDB has a usable cached price,
|   use it.
| - If MongoDB does NOT have a usable price,
|   call Upstox and fetch the latest
|   available last_price / close.
|
|--------------------------------------------------------------------------
*/

export async function GET() {

  try {

    const session =
      await auth();


    if (
      !session?.user?.id
    ) {

      return NextResponse.json(
        {
          error:
            "You must be signed in.",
        },
        {
          status: 401,
        }
      );

    }


    const {
      db,
      user,
    } =
      await findUser(
        session.user.id
      );


    if (!user) {

      return NextResponse.json(
        {
          error:
            "User account was not found.",
        },
        {
          status: 404,
        }
      );

    }


    /*
     * GET WATCHLIST
     */

    const watchlist =
      normalizeWatchlist(
        user.watchlist
      );


    /*
     * MARKET STATUS
     */

    const marketOpen =
      isMarketWindow();


    /*
     * EMPTY WATCHLIST
     */

    if (
      watchlist.length ===
      0
    ) {

      return NextResponse.json(
        {
          success: true,

          watchlist: [],

          marketData: [],

          source:
            "mongodb",

          marketOpen,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );

    }


    /*
     * CACHE COLLECTION
     */

    const cacheCollection =
      db.collection<WatchlistMarketCache>(
        "watchlist_market_cache"
      );


    const now =
      new Date();


    /*
     * FIND EXISTING CACHE
     */

    const cached =
      await cacheCollection.findOne(
        {
          userId:
            user._id,
        }
      );


    const cachedQuotes =
      Array.isArray(
        cached?.quotes
      )
        ? cached.quotes
        : [];


    /*
     * CHECK WHETHER EVERY
     * WATCHLIST ITEM HAS A
     * REAL PRICE.
     */

    const hasAllUsableQuotes =
      cacheHasAllUsableQuotes(
        watchlist,
        cachedQuotes
      );


    /*
     * CACHE FRESH?
     */

    const cacheIsFresh =
      Boolean(
        cached &&
        cached.expiresAt >
          now &&
        hasAllUsableQuotes
      );


    /*
     |--------------------------------------------------------------------------
     | MARKET OPEN + FRESH CACHE
     |--------------------------------------------------------------------------
     */

    if (
      marketOpen &&
      cacheIsFresh
    ) {

      return NextResponse.json(
        {
          success: true,

          watchlist,

          marketData:
            cachedQuotes.filter(
              (quote) =>
                watchlist.some(
                  (item) =>
                    item.instrumentKey ===
                    quote.instrumentKey
                )
            ),

          source:
            "mongodb",

          marketOpen,

          cachedAt:
            cached?.calculatedAt ??
            null,

          expiresAt:
            cached?.expiresAt ??
            null,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );

    }


    /*
     |--------------------------------------------------------------------------
     | MARKET CLOSED + ALL PRICES AVAILABLE
     |--------------------------------------------------------------------------
     |
     | Do NOT need to hit Upstox again.
     |
     | The cache may be expired because the
     | 4 minute cache only applies during
     | market hours.
     |
     */

    if (
      !marketOpen &&
      hasAllUsableQuotes
    ) {

      return NextResponse.json(
        {
          success: true,

          watchlist,

          marketData:
            cachedQuotes.filter(
              (quote) =>
                watchlist.some(
                  (item) =>
                    item.instrumentKey ===
                    quote.instrumentKey
                )
            ),

          source:
            "mongodb",

          marketOpen,

          cachedAt:
            cached?.calculatedAt ??
            null,

          expiresAt:
            cached?.expiresAt ??
            null,
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );

    }


    /*
     |--------------------------------------------------------------------------
     | WE NEED MARKET DATA
     |--------------------------------------------------------------------------
     |
     | This happens when:
     |
     | 1. Market is open and cache expired
     |
     | OR
     |
     | 2. Market is closed but cache is missing
     |    or incomplete.
     |
     |--------------------------------------------------------------------------
     */

    const accessToken =
      process.env
        .UPSTOX_ACCESS_TOKEN
        ?.trim()
        .replace(
          /^["']|["']$/g,
          ""
        );


    /*
     |--------------------------------------------------------------------------
     | NO UPSTOX TOKEN
     |--------------------------------------------------------------------------
     */

    if (!accessToken) {

      return NextResponse.json(
        {
          success: true,

          watchlist,

          marketData:
            cachedQuotes.filter(
              (quote) =>
                watchlist.some(
                  (item) =>
                    item.instrumentKey ===
                    quote.instrumentKey
                )
            ),

          source:
            "mongodb",

          marketOpen,

          warning:
            "UPSTOX_ACCESS_TOKEN is not configured.",
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );

    }


    /*
     |--------------------------------------------------------------------------
     | UPSTOX REQUEST
     |--------------------------------------------------------------------------
     |
     | Upstox supports multiple instruments
     | in one request.
     |
     */

    const instrumentKeys =
      watchlist
        .map(
          (item) =>
            item.instrumentKey
        )
        .join(",");


    const url =
      `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(
        instrumentKeys
      )}`;


    let response:
      Response;


    try {

      response =
        await fetch(
          url,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            cache:
              "no-store",
          }
        );

    } catch (error) {

      console.error(
        "Upstox network error:",
        error
      );


      /*
       * If we have old data,
       * return it instead of
       * showing an error.
       */

      return NextResponse.json(
        {
          success: true,

          watchlist,

          marketData:
            cachedQuotes,

          source:
            "mongodb",

          marketOpen,

          warning:
            "Unable to connect to Upstox. Showing last known market data.",
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );

    }


    /*
     |--------------------------------------------------------------------------
     | READ RESPONSE
     |--------------------------------------------------------------------------
     */

    const responseText =
      await response.text();


    let upstoxData:
      {
        status?: string;

        data?: Record<
          string,
          MarketQuote
        >;

        errors?: unknown;
      };


    try {

      upstoxData =
        JSON.parse(
          responseText
        );

    } catch {

      console.error(
        "Invalid Upstox response:",
        responseText
      );


      return NextResponse.json(
        {
          success: true,

          watchlist,

          marketData:
            cachedQuotes,

          source:
            "mongodb",

          marketOpen,

          warning:
            "Upstox returned an invalid response. Showing last known market data.",
        },
        {
          status: 200,
        }
      );

    }


    /*
     |--------------------------------------------------------------------------
     | UPSTOX ERROR
     |--------------------------------------------------------------------------
     */

    if (
      !response.ok
    ) {

      console.error(
        "Watchlist Upstox error:",
        upstoxData
      );


      return NextResponse.json(
        {
          success: true,

          watchlist,

          marketData:
            cachedQuotes,

          source:
            "mongodb",

          marketOpen,

          warning:
            "Unable to refresh market data from Upstox. Showing last known market data.",
        },
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );

    }


    /*
     |--------------------------------------------------------------------------
     | UPSTOX QUOTE DATA
     |--------------------------------------------------------------------------
     */

    const quoteData =
      upstoxData.data ||
      {};


    /*
     |--------------------------------------------------------------------------
     | BUILD QUOTES
     |--------------------------------------------------------------------------
     */

    const quotes:
      CachedQuote[] =
      watchlist
        .map(
          (item) => {

            let quote:
              | MarketQuote
              | undefined;


            /*
             * 1. EXACT RESPONSE KEY
             */

            quote =
              quoteData[
                item.instrumentKey
              ];


            /*
             * 2. INSTRUMENT TOKEN
             */

            if (!quote) {

              quote =
                Object.values(
                  quoteData
                ).find(
                  (value) =>
                    value?.instrument_token ===
                    item.instrumentKey
                );

            }


            /*
             * 3. SYMBOL
             */

            if (!quote) {

              quote =
                Object.values(
                  quoteData
                ).find(
                  (value) =>
                    value?.symbol ===
                    item.symbol
                );

            }


            /*
             * NO QUOTE
             */

            if (!quote) {

              /*
               * Try to preserve an old
               * cached quote if one exists.
               */

              const oldQuote =
                cachedQuotes.find(
                  (cachedQuote) =>
                    cachedQuote.instrumentKey ===
                    item.instrumentKey
                );


              return (
                oldQuote ??
                null
              );

            }


            /*
             * BUILD NEW QUOTE
             */

            return buildCachedQuote(
              item.instrumentKey,
              quote
            );

          }
        )
        .filter(
          (
            quote
          ): quote is CachedQuote =>
            quote !== null
        );


    /*
     |--------------------------------------------------------------------------
     | MERGE WITH OLD CACHE
     |--------------------------------------------------------------------------
     |
     | If Upstox did not return one particular
     | instrument, don't delete its previous
     | known price.
     |
     */

    const mergedQuotes:
      CachedQuote[] =
      watchlist
        .map(
          (item) => {

            const freshQuote =
              quotes.find(
                (quote) =>
                  quote.instrumentKey ===
                  item.instrumentKey
              );


            if (
              freshQuote
            ) {

              return freshQuote;

            }


            const oldQuote =
              cachedQuotes.find(
                (quote) =>
                  quote.instrumentKey ===
                  item.instrumentKey
              );


            return (
              oldQuote ??
              null
            );

          }
        )
        .filter(
          (
            quote
          ): quote is CachedQuote =>
            quote !== null
        );


    /*
     |--------------------------------------------------------------------------
     | SAVE CACHE
     |--------------------------------------------------------------------------
     */

    const calculatedAt =
      new Date();


    /*
     * During market hours:
     *
     * 4 minute expiry.
     *
     * Outside market hours:
     *
     * The expiry is not important because
     * we don't use it to invalidate the
     * last known price.
     */

    const expiresAt =
      new Date(
        calculatedAt.getTime() +
          CACHE_DURATION_MS
      );


    await cacheCollection.updateOne(
      {
        userId:
          user._id,
      },

      {
        $set: {

          userId:
            user._id,

          quotes:
            mergedQuotes,

          calculatedAt,

          expiresAt,

        },
      },

      {
        upsert:
          true,
      }
    );


    /*
     |--------------------------------------------------------------------------
     | FINAL RESPONSE
     |--------------------------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        watchlist,

        marketData:
          mergedQuotes,

        source:
          "upstox",

        marketOpen,

        cachedAt:
          calculatedAt,

        expiresAt,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );

  } catch (error) {

    console.error(
      "GET /api/watchlist error:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Failed to load watchlist.",
      },
      {
        status: 500,
      }
    );

  }

}