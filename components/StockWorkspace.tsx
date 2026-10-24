// "use client";

// import {
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import {
//   ChevronDown,
//   ChevronUp,
// } from "lucide-react";
// import Navbar from "@/components/Navbar";
// import ChatSidebar from "@/components/ChatSidebar";
// import AIAnalyst from "@/components/AIAnalyst";

// import TradingViewChart, {
//   type AiChartLine,
//   type AiChartDrawing,
// } from "@/components/TradingViewChart";

// /* ==========================================================================
//    TYPES
// ========================================================================== */

// type StockWorkspaceProps = {
//   symbol: string;
//   chatId: string;
// };

// type TradingMode =
//   | "Day"
//   | "Swing"
//   | "Long-term";

// type RiskLevel =
//   | "Low"
//   | "Medium"
//   | "High";

// type ChartRange =
//   | "1D"
//   | "5D"
//   | "1M"
//   | "3M"
//   | "6M"
//   | "YTD"
//   | "1Y"
//   | "5Y"
//   | "All";



// function getRangeForTradingMode(
//   mode: TradingMode
// ): ChartRange {
//   switch (mode) {
//     case "Long-term":
//       return "YTD";

//     case "Swing":
//       return "1M";

//     case "Day":
//     default:
//       return "5D";
//   }
// }



// type StoredToolResult = {
//   id: string;
//   tool: string;
//   label: string;
//   color: string;
//   result: unknown;

//   chart?: {
//     type: "priceLines" | "line";
//     lines: {
//       id: string;
//       label: string;
//       price?: number;
//       color: string;
//       dashed?: boolean;
//       points?: {
//         time: string | number;
//         value?: number;
//         price?: number;
//       }[];
//     }[];

//     drawings?: AiChartDrawing[];
//   } | null;

//   createdAt?: string;
// };



// /* ==========================================================================
//    QUOTE
// ========================================================================== */

// type StockQuote = {
//   price?: number | null;
//   lastPrice?: number | null;
//   last_price?: number | null;

//   change?: number | null;
//   netChange?: number | null;
//   net_change?: number | null;

//   changePercent?: number | null;
//   percentChange?: number | null;
//   percent_change?: number | null;

//   open?: number | null;
//   high?: number | null;
//   low?: number | null;

//   close?: number | null;

//   previousClose?: number | null;
//   previous_close?: number | null;

//   volume?: number | null;

//   averagePrice?: number | null;
//   average_price?: number | null;

//   [key: string]: unknown;
// };

// /* ==========================================================================
//    CANDLE
// ========================================================================== */

// type StockCandle = {
//   time: string | number;

//   open?: number | null;
//   high?: number | null;
//   low?: number | null;
//   close?: number | null;

//   value?: number | null;
//   price?: number | null;

//   volume?: number | null;

//   [key: string]: unknown;
// };

// /* ==========================================================================
//    STOCK DATA
// ========================================================================== */

// type StockData = {
//   symbol?: string;
//   name?: string;

//   quote?: StockQuote | null;

//   instrumentKey?: string | null;

//   price?: number | null;
//   lastPrice?: number | null;
//   last_price?: number | null;

//   change?: number | null;
//   netChange?: number | null;
//   net_change?: number | null;

//   changePercent?: number | null;
//   percentChange?: number | null;
//   percent_change?: number | null;

//   previousClose?: number | null;
//   previous_close?: number | null;

//   close?: number | null;

//   chart?: StockCandle[];
//   candles?: StockCandle[];

//   error?: string;
//   message?: string;

//   [key: string]: unknown;
// };

// /* ==========================================================================
//    DEFAULT MANUAL INDICATORS
// ========================================================================== */

// const DEFAULT_INDICATORS = [
//   "Volume",
//   "RSI",
//   "MACD",
//   "Moving Average",
// ];

// /* ==========================================================================
//    FORMAT SYMBOL
// ========================================================================== */

// function formatSymbol(symbol: string) {
//   return decodeURIComponent(symbol)
//     .replace(/^NSE:/i, "")
//     .trim()
//     .toUpperCase();
// }

// /* ==========================================================================
//    SAFE NUMBER
// ========================================================================== */

// function toNumber(
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
//    FIRST VALID NUMBER
// ========================================================================== */

// function firstNumber(
//   ...values: unknown[]
// ): number | null {
//   for (const value of values) {
//     const number =
//       toNumber(value);

//     if (number !== null) {
//       return number;
//     }
//   }

//   return null;
// }

// /* ==========================================================================
//    PRICE FORMAT
// ========================================================================== */

// function formatPrice(
//   value:
//     | number
//     | null
//     | undefined
// ) {
//   const number =
//     toNumber(value);

//   if (number === null) {
//     return "—";
//   }

//   return `₹${number.toLocaleString(
//     "en-IN",
//     {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }
//   )}`;
// }

// /* ==========================================================================
//    CHANGE FORMAT
// ========================================================================== */

// function formatChange(
//   value:
//     | number
//     | null
//     | undefined
// ) {
//   const number =
//     toNumber(value);

//   if (number === null) {
//     return "—";
//   }

//   return `${
//     number >= 0 ? "+" : ""
//   }₹${Math.abs(
//     number
//   ).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;
// }

// /* ==========================================================================
//    PERCENT FORMAT
// ========================================================================== */

// function formatPercent(
//   value:
//     | number
//     | null
//     | undefined
// ) {
//   const number =
//     toNumber(value);

//   if (number === null) {
//     return "—";
//   }

//   return `${
//     number >= 0 ? "+" : ""
//   }${number.toFixed(2)}%`;
// }

// /* ==========================================================================
//    CHANGE COLOR
// ========================================================================== */

// function getChangeColor(
//   value:
//     | number
//     | null
//     | undefined
// ) {
//   const number =
//     toNumber(value);

//   if (number === null) {
//     return "text-[#777b86]";
//   }

//   return number >= 0
//     ? "text-[#28dc9b]"
//     : "text-[#ff5064]";
// }

// /* ==========================================================================
//    NORMALIZE QUOTE
// ========================================================================== */

// function normalizeQuote(
//   data: StockData | null
// ) {
//   if (!data) {
//     return {
//       price: null,
//       change: null,
//       changePercent: null,
//       previousClose: null,
//     };
//   }

//   const quote =
//     data.quote ?? {};

//   let price =
//     firstNumber(
//       quote.price,
//       quote.lastPrice,
//       quote.last_price,
//       data.price,
//       data.lastPrice,
//       data.last_price
//     );

//   const previousClose =
//     firstNumber(
//       quote.previousClose,
//       quote.previous_close,
//       data.previousClose,
//       data.previous_close,
//       quote.close,
//       data.close
//     );

//   const candles =
//     Array.isArray(
//       data.candles
//     )
//       ? data.candles
//       : Array.isArray(
//           data.chart
//         )
//       ? data.chart
//       : [];

//   if (
//     price === null &&
//     candles.length > 0
//   ) {
//     const lastCandle =
//       candles[
//         candles.length - 1
//       ];

//     price =
//       firstNumber(
//         lastCandle.close,
//         lastCandle.value,
//         lastCandle.price
//       );
//   }

//   let change =
//     firstNumber(
//       quote.change,
//       quote.netChange,
//       quote.net_change,
//       data.change,
//       data.netChange,
//       data.net_change
//     );

//   let changePercent =
//     firstNumber(
//       quote.changePercent,
//       quote.percentChange,
//       quote.percent_change,
//       data.changePercent,
//       data.percentChange,
//       data.percent_change
//     );

//   if (
//     change === null &&
//     price !== null &&
//     previousClose !== null
//   ) {
//     change =
//       price -
//       previousClose;
//   }

//   if (
//     changePercent === null &&
//     change !== null &&
//     previousClose !== null &&
//     previousClose !== 0
//   ) {
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
//   };
// }

// /* ==========================================================================
//    COMPONENT
// ========================================================================== */

// function normalizeChartTime(
//   time: string | number
// ): AiChartLine["points"][number]["time"] | null {
//   if (typeof time === "number") {
//     if (!Number.isFinite(time)) {
//       return null;
//     }

//     // Convert milliseconds to Unix seconds.
//     return (time > 1e12
//       ? Math.floor(time / 1000)
//       : Math.floor(time)) as AiChartLine["points"][number]["time"];
//   }

//   const value = time.trim();

//   if (!value) {
//     return null;
//   }

//   // Lightweight Charts accepts YYYY-MM-DD for daily candles.
//   if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//     return value as AiChartLine["points"][number]["time"];
//   }

//   // Convert ISO date/time strings to Unix seconds.
//   const milliseconds = Date.parse(value);

//   if (!Number.isFinite(milliseconds)) {
//     return null;
//   }

//   return Math.floor(
//     milliseconds / 1000
//   ) as AiChartLine["points"][number]["time"];
// }




// export default function StockWorkspace({
//   symbol,
//   chatId,
// }: StockWorkspaceProps) {
//   const cleanSymbol =
//     formatSymbol(symbol);

//   /* ==========================================================================
//      UI STATE
//   ========================================================================== */

//   const [
//     sidebarCollapsed,
//     setSidebarCollapsed,
//   ] = useState(false);

//   const [
//     advanced,
//     setAdvanced,
//   ] = useState(false);

//   // const [
//   //   tradingMode,
//   //   setTradingMode,
//   // ] = useState<TradingMode>(
//   //   "Swing"
//   // );

// const [
//   tradingMode,
//   setTradingMode,
// ] = useState<TradingMode>(() => {
//   if (typeof window === "undefined") {
//     return "Swing";
//   }

//   const saved =
//     localStorage.getItem("quantify_trading_type")
//       ?.trim()
//       .toLowerCase();

//   switch (saved) {
//     case "long-term":
//     case "long term":
//     case "longterm":
//       return "Long-term";

//     case "day":
//     case "Day":
//       return "Day";

//     case "swing":
//       return "Swing";

//     default:
//       return "Swing";
//   }
// });


// const activateSupportResistanceAfterReloadRef =
//   useRef(false);




// const [chartRange, setChartRange] =
//   useState<ChartRange>(
//     getRangeForTradingMode(tradingMode)
//   );

// const handleSupportResistanceRequest = () => {
//   // The AI has finished a support/resistance response.
//   // The next tool-results reload should activate its saved result.
//   activateSupportResistanceAfterReloadRef.current = true;

//   // Read the latest saved preference rather than relying
//   // on a potentially stale React state value.
//   const savedTradingType =
//     typeof window !== "undefined"
//       ? localStorage
//           .getItem("quantify_trading_type")
//           ?.trim()
//           .toLowerCase()
//       : null;

//   let mode: TradingMode = tradingMode;

//   switch (savedTradingType) {
//     case "long-term":
//     case "long term":
//     case "longterm":
//       mode = "Long-term";
//       break;

//     case "day":
//     case "Day":
//       mode = "Day";
//       break;

//     case "swing":
//       mode = "Swing";
//       break;
//   }

//   setTradingMode(mode);
//   setChartRange(getRangeForTradingMode(mode));
// };



//   const [risk, setRisk] =
//     useState<RiskLevel>("Medium");

//   /* ==========================================================================
//      AI TOOL / INDICATOR STATE
//   ========================================================================== */

//   const [
//     storedToolResults,
//     setStoredToolResults,
//   ] = useState<
//     StoredToolResult[]
//   >([]);

//   const [
//     activeToolIndicators,
//     setActiveToolIndicators,
//   ] = useState<string[]>([]);


//   // Tracks which chat has completed its initial tool-results load.
// const initializedToolChatRef = useRef<string | null>(null);

// // Tracks the previous version of each saved tool result.
// const previousToolSignaturesRef = useRef<Map<string, string>>(
//   new Map()
// );

//   /* ==========================================================================
//      STOCK STATE
//   ========================================================================== */

//   const [
//     stockData,
//     setStockData,
//   ] = useState<StockData | null>(
//     null
//   );

//   const [
//     loadingStock,
//     setLoadingStock,
//   ] = useState(true);

//   const [
//     stockError,
//     setStockError,
//   ] = useState<string | null>(
//     null
//   );

//   /* ==========================================================================
//      LIVE MARKET DATA
//   ========================================================================== */

//   const [
//     livePrice,
//     setLivePrice,
//   ] = useState<number | null>(
//     null
//   );

//   const [
//     liveVolume,
//     setLiveVolume,
//   ] = useState<number | null>(
//     null
//   );

//   const [
//     livePreviousClose,
//     setLivePreviousClose,
//   ] = useState<number | null>(
//     null
//   );

//   const [
//     liveMarketOpen,
//     setLiveMarketOpen,
//   ] = useState(false);

//   const [
//     liveError,
//     setLiveError,
//   ] = useState<string | null>(
//     null
//   );

//   /* ==========================================================================
//      WATCHLIST
//   ========================================================================== */

//   const [
//     watchlistLoading,
//     setWatchlistLoading,
//   ] = useState(false);

//   const [
//     isInWatchlist,
//     setIsInWatchlist,
//   ] = useState(false);

//   const [
//     watchlistChecked,
//     setWatchlistChecked,
//   ] = useState(false);

//   /* ==========================================================================
//      STOCK NAME
//   ========================================================================== */

//   const stockName =
//     useMemo(() => {
//       if (stockData?.name) {
//         return stockData.name;
//       }

//       if (
//         cleanSymbol ===
//         "HDFCBANK"
//       ) {
//         return "HDFC BANK";
//       }

//       if (
//         cleanSymbol ===
//         "HDFCAMC"
//       ) {
//         return "HDFC AMC";
//       }

//       if (
//         cleanSymbol ===
//         "NIFTY"
//       ) {
//         return "NIFTY 50";
//       }

//       return cleanSymbol;
//     }, [
//       cleanSymbol,
//       stockData?.name,
//     ]);

//   /* ==========================================================================
//      NORMALIZED QUOTE
//   ========================================================================== */

//   const normalizedQuote =
//     useMemo(() => {
//       const base =
//         normalizeQuote(
//           stockData
//         );

//       const currentPrice =
//         livePrice !== null
//           ? livePrice
//           : base.price;

//       const previousClose =
//         livePreviousClose !==
//         null
//           ? livePreviousClose
//           : base.previousClose;

//       let currentChange =
//         base.change;

//       let currentChangePercent =
//         base.changePercent;

//       if (
//         currentPrice !== null &&
//         previousClose !== null &&
//         previousClose !== 0
//       ) {
//         currentChange =
//           currentPrice -
//           previousClose;

//         currentChangePercent =
//           (currentChange /
//             previousClose) *
//           100;
//       }

//       return {
//         price: currentPrice,
//         change: currentChange,
//         changePercent:
//           currentChangePercent,
//         previousClose,
//       };
//     }, [
//       stockData,
//       livePrice,
//       livePreviousClose,
//     ]);

//   /* ==========================================================================
//      TRADING PRICE
//   ========================================================================== */

//   const tradingPrice =
//     livePrice !== null &&
//     Number.isFinite(livePrice)
//       ? livePrice
//       : normalizedQuote.price;

//   const formattedTradingPrice =
//     tradingPrice !== null
//       ? `₹${tradingPrice.toLocaleString(
//           "en-IN",
//           {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//           }
//         )}`
//       : "--";

//   /* ==========================================================================
//      NORMALIZED VALUES
//   ========================================================================== */

//   const price =
//     normalizedQuote.price;

//   const change =
//     normalizedQuote.change;

//   const changePercent =
//     normalizedQuote.changePercent;

//   /* ==========================================================================
//      PRICE DIRECTION
//   ========================================================================== */

//   const priceDirection =
//     change !== null
//       ? change > 0
//         ? "up"
//         : change < 0
//         ? "down"
//         : "neutral"
//       : changePercent !== null
//       ? changePercent > 0
//         ? "up"
//         : changePercent < 0
//         ? "down"
//         : "neutral"
//       : "neutral";

//   /* ==========================================================================
//      LOAD STOCK
//   ========================================================================== */

//   useEffect(() => {
//     let cancelled = false;

//     async function loadStock() {
//       try {
//         setLoadingStock(true);
//         setStockError(null);

//         setLivePrice(null);
//         setLiveVolume(null);
//         setLivePreviousClose(
//           null
//         );
//         setLiveMarketOpen(false);
//         setLiveError(null);

//         const encodedSymbol =
//           encodeURIComponent(
//             cleanSymbol
//           );

//         const response =
//           await fetch(
//             `/api/stock/${encodedSymbol}?range=1D`,
//             {
//               method: "GET",
//               cache: "no-store",
//               headers: {
//                 Accept:
//                   "application/json",
//               },
//             }
//           );

//         const text =
//           await response.text();

//         let data:
//           | StockData
//           | null = null;

//         try {
//           data = text
//             ? JSON.parse(text)
//             : null;
//         } catch {
//           throw new Error(
//             "Stock API returned an invalid response."
//           );
//         }

//         if (!response.ok) {
//           throw new Error(
//             data?.error ||
//               data?.message ||
//               `Failed to load ${cleanSymbol}.`
//           );
//         }

//         if (!data) {
//           throw new Error(
//             "Stock data was empty."
//           );
//         }

//         if (!cancelled) {
//           setStockData(data);
//         }
//       } catch (error) {
//         console.error(
//           "StockWorkspace stock error:",
//           error
//         );

//         if (!cancelled) {
//           setStockError(
//             error instanceof Error
//               ? error.message
//               : "Failed to load stock data."
//           );

//           setStockData(null);
//         }
//       } finally {
//         if (!cancelled) {
//           setLoadingStock(false);
//         }
//       }
//     }

//     loadStock();

//     return () => {
//       cancelled = true;
//     };
//   }, [cleanSymbol]);

//   /* ==========================================================================
//      LIVE PRICE POLLING
//   ========================================================================== */

//   useEffect(() => {
//     let cancelled = false;

//     let timeoutId:
//       | ReturnType<typeof setTimeout>
//       | null = null;

//     const POLL_INTERVAL = 3000;

//     async function pollLivePrice() {
//       if (cancelled) {
//         return;
//       }

//       if (
//         document.visibilityState !==
//         "visible"
//       ) {
//         scheduleNextPoll();
//         return;
//       }

//       const instrumentKey =
//         stockData?.instrumentKey;

//       if (!instrumentKey) {
//         scheduleNextPoll();
//         return;
//       }

//       try {
//         const response =
//           await fetch(
//             `/api/stock/${encodeURIComponent(
//               cleanSymbol
//             )}/live?instrumentKey=${encodeURIComponent(
//               instrumentKey
//             )}`,
//             {
//               method: "GET",
//               cache: "no-store",
//               headers: {
//                 Accept:
//                   "application/json",
//               },
//             }
//           );

//         if (!response.ok) {
//           console.warn(
//             `Live API returned ${response.status}`
//           );

//           if (!cancelled) {
//             setLiveError(
//               `Live API unavailable (${response.status})`
//             );
//           }

//           scheduleNextPoll();
//           return;
//         }

//         const data =
//           await response.json();

//         if (cancelled) {
//           return;
//         }

//         if (
//           data?.success === false
//         ) {
//           console.warn(
//             "Live API error:",
//             data.error
//           );

//           setLiveError(
//             data.error ||
//               "Live price unavailable."
//           );

//           scheduleNextPoll();
//           return;
//         }

//         setLiveMarketOpen(
//           Boolean(
//             data.marketOpen
//           )
//         );

//         if (!data.marketOpen) {
//           setLiveError(null);
//           scheduleNextPoll();
//           return;
//         }

//         const nextPrice =
//           Number(data.price);

//         if (
//           Number.isFinite(
//             nextPrice
//           )
//         ) {
//           setLivePrice(
//             nextPrice
//           );
//         }

//         const nextVolume =
//           Number(data.volume);

//         if (
//           Number.isFinite(
//             nextVolume
//           )
//         ) {
//           setLiveVolume(
//             nextVolume
//           );
//         }

//         const nextPreviousClose =
//           Number(
//             data.previousClose
//           );

//         if (
//           Number.isFinite(
//             nextPreviousClose
//           )
//         ) {
//           setLivePreviousClose(
//             nextPreviousClose
//           );
//         }

//         setLiveError(null);
//       } catch (error) {
//         if (!cancelled) {
//           console.warn(
//             "Live stock polling error:",
//             error
//           );

//           setLiveError(
//             "Live price unavailable."
//           );
//         }
//       }

//       scheduleNextPoll();
//     }

//     function scheduleNextPoll() {
//       if (cancelled) {
//         return;
//       }

//       timeoutId =
//         setTimeout(
//           pollLivePrice,
//           POLL_INTERVAL
//         );
//     }

//     pollLivePrice();

//     return () => {
//       cancelled = true;

//       if (timeoutId !== null) {
//         clearTimeout(
//           timeoutId
//         );
//       }
//     };
//   }, [
//     cleanSymbol,
//     stockData?.instrumentKey,
//   ]);

//   /* ==========================================================================
//      WATCHLIST CHECK
//   ========================================================================== */

//   useEffect(() => {
//     let cancelled = false;

//     setWatchlistChecked(false);
//     setIsInWatchlist(false);

//     async function checkWatchlist() {
//       try {
//         const response =
//           await fetch(
//             "/api/watchlist",
//             {
//               method: "GET",
//               cache: "no-store",
//               headers: {
//                 Accept:
//                   "application/json",
//               },
//             }
//           );

//         if (!response.ok) {
//           return;
//         }

//         const data =
//           await response.json();

//         if (cancelled) {
//           return;
//         }

//         const list =
//           Array.isArray(
//             data?.watchlist
//           )
//             ? data.watchlist
//             : [];

//         const found =
//           list.some(
//             (item: unknown) => {
//               const record =
//                 item as {
//                   symbol?: unknown;
//                 };

//               return (
//                 String(
//                   record?.symbol ??
//                     ""
//                 ).toUpperCase() ===
//                 cleanSymbol
//               );
//             }
//           );

//         setIsInWatchlist(
//           found
//         );
//       } catch (error) {
//         console.error(
//           "Watchlist check error:",
//           error
//         );
//       } finally {
//         if (!cancelled) {
//           setWatchlistChecked(
//             true
//           );
//         }
//       }
//     }

//     checkWatchlist();

//     return () => {
//       cancelled = true;
//     };
//   }, [cleanSymbol]);

//   /* ==========================================================================
//      ADD TO WATCHLIST
//   ========================================================================== */

//   async function addToWatchlist() {
//     if (
//       watchlistLoading ||
//       isInWatchlist
//     ) {
//       return;
//     }

//     try {
//       setWatchlistLoading(true);

//       const response =
//         await fetch(
//           "/api/watchlist",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type":
//                 "application/json",
//               Accept:
//                 "application/json",
//             },
//             body: JSON.stringify({
//               stock: {
//                 symbol:
//                   cleanSymbol,

//                 name:
//                   stockName,

//                 instrumentKey:
//                   stockData?.instrumentKey ??
//                   `NSE_EQ|${cleanSymbol}`,
//               },
//             }),
//           }
//         );

//       const data =
//         await response.json();

//       if (!response.ok) {
//         throw new Error(
//           data?.error ||
//             "Failed to add stock."
//         );
//       }

//       setIsInWatchlist(true);
//     } catch (error) {
//       console.error(
//         "Add watchlist error:",
//         error
//       );
//     } finally {
//       setWatchlistLoading(false);
//     }
//   }




// /* ==========================================================================
//    LOAD AI TOOL RESULTS
// ========================================================================== */

// useEffect(() => {
//   let cancelled = false;

//   // Every chat starts with all saved AI tools turned OFF.
//   initializedToolChatRef.current = null;
//   previousToolSignaturesRef.current = new Map();

//   setActiveToolIndicators([]);
//   setStoredToolResults([]);

//   function getSupportResistanceTool(
//     tools: StoredToolResult[]
//   ): StoredToolResult | undefined {
//     const matchingTools = tools.filter((tool) => {
//       const identity = `${tool.tool ?? ""} ${tool.label ?? ""}`
//         .toLowerCase()
//         .replace(/[^a-z]/g, "");

//       return (
//         identity.includes("supportresistance") ||
//         identity.includes("support") ||
//         identity.includes("resistance")
//       );
//     });

//     if (matchingTools.length === 0) {
//       return undefined;
//     }

//     return matchingTools.reduce((newest, candidate) => {
//       const newestTime = newest.createdAt
//         ? new Date(newest.createdAt).getTime()
//         : 0;

//       const candidateTime = candidate.createdAt
//         ? new Date(candidate.createdAt).getTime()
//         : 0;

//       return candidateTime >= newestTime ? candidate : newest;
//     });
//   }

//   function getToolSignature(tool: StoredToolResult): string {
//     // Detect changes even when the backend reuses a tool's ID.
//     return JSON.stringify({
//       id: tool.id,
//       tool: tool.tool,
//       label: tool.label,
//       createdAt: tool.createdAt,
//       result: tool.result,
//       chart: tool.chart,
//     });
//   }

//   async function loadToolResults() {
//     try {
//       const response = await fetch(
//         `/api/chats/${encodeURIComponent(chatId)}`,
//         {
//           method: "GET",
//           cache: "no-store",
//           headers: {
//             Accept: "application/json",
//           },
//         }
//       );

//       if (!response.ok) {
//         console.error(
//           "Failed to load AI tool results:",
//           response.status
//         );
//         return;
//       }

//       const data = await response.json();

//       if (cancelled) return;

//       const tools: StoredToolResult[] = Array.isArray(
//         data?.chat?.toolResults
//       )
//         ? data.chat.toolResults
//         : Array.isArray(data?.toolResults)
//           ? data.toolResults
//           : [];

//       console.log("[Loaded AI tool results]", {
//         chatId,
//         toolCount: tools.length,
//         tools: tools.map((tool) => ({
//           id: tool.id,
//           label: tool.label,
//           createdAt: tool.createdAt,
//         })),
//       });

//       const nextSignatures = new Map<string, string>();

//       for (const tool of tools) {
//         nextSignatures.set(tool.id, getToolSignature(tool));
//       }

//       const isFirstLoadForChat =
//         initializedToolChatRef.current !== chatId;

//       const previousSignatures =
//         previousToolSignaturesRef.current;

//       // Update the refs before changing React state.
//       initializedToolChatRef.current = chatId;
//       previousToolSignaturesRef.current = nextSignatures;

//       setStoredToolResults(tools);

//       /*
//        * FIRST LOAD:
//        * This runs when a chat is opened or refreshed.
//        * Saved results are displayed, but none are activated.
//        */
//       if (isFirstLoadForChat) {
//         setActiveToolIndicators([]);

//         // Preserve an explicitly requested Support & Resistance
//         // activation if it was requested before this first load.
//         if (activateSupportResistanceAfterReloadRef.current) {
//           const supportResistanceTool =
//             getSupportResistanceTool(tools);

//           if (supportResistanceTool) {
//             setActiveToolIndicators([
//               supportResistanceTool.id,
//             ]);

//             activateSupportResistanceAfterReloadRef.current =
//               false;
//           }
//         }

//         return;
//       }

//       /*
//        * SUPPORT & RESISTANCE:
//        * Honor an explicit request from AIAnalyst.
//        */
//       if (activateSupportResistanceAfterReloadRef.current) {
//         const supportResistanceTool =
//           getSupportResistanceTool(tools);

//         if (supportResistanceTool) {
//           // Turn ON this tool and turn OFF all other AI tools.
//           setActiveToolIndicators([
//             supportResistanceTool.id,
//           ]);

//           activateSupportResistanceAfterReloadRef.current =
//             false;
//         }

//         // If the result is not saved yet, keep the request pending.
//         return;
//       }

//       /*
//        * SUBSEQUENT CHAT UPDATE:
//        * Detect new or changed tool results.
//        */
//       const changedTools = tools.filter((tool) => {
//         const previousSignature = previousSignatures.get(
//           tool.id
//         );

//         const nextSignature = nextSignatures.get(tool.id);

//         return (
//           previousSignature === undefined ||
//           previousSignature !== nextSignature
//         );
//       });

//       if (changedTools.length === 0) {
//         // No AI tool changed. Leave manual selections untouched.
//         return;
//       }

//       // Prefer the most recently updated result.
//       // If timestamps are equal or missing, use the last changed
//       // tool in the API response.
//       const newestTool = changedTools.reduce(
//         (newest, candidate) => {
//           const newestTime = newest.createdAt
//             ? new Date(newest.createdAt).getTime()
//             : 0;

//           const candidateTime = candidate.createdAt
//             ? new Date(candidate.createdAt).getTime()
//             : 0;

//           return candidateTime >= newestTime
//             ? candidate
//             : newest;
//         }
//       );

//       // Only the newly added or changed tool remains active.
//       setActiveToolIndicators([newestTool.id]);
//     } catch (error) {
//       console.error(
//         "Failed to load AI tool results:",
//         error
//       );
//     }
//   }

//   void loadToolResults();

//   function handleChatUpdated() {
//     void loadToolResults();
//   }

//   window.addEventListener(
//     "chat-updated",
//     handleChatUpdated
//   );

//   return () => {
//     cancelled = true;

//     window.removeEventListener(
//       "chat-updated",
//       handleChatUpdated
//     );
//   };
// }, [chatId]);



// /* ==========================================================================
//    BUILD AI CHART LINES AND DRAWINGS
// ========================================================================== */

// const activeToolResults = storedToolResults.filter((tool) =>
//   activeToolIndicators.includes(tool.id)
// );

// const aiLines: AiChartLine[] = activeToolResults.flatMap((tool) => {
//   const chart = tool.chart;

//   if (!chart || !Array.isArray(chart.lines)) {
//     return [];
//   }

//   return chart.lines.flatMap((line) => {
//     // Support/resistance price levels remain native price lines.
//     if (
//       typeof line.price === "number" &&
//       Number.isFinite(line.price)
//     ) {
//       return [{
//         id: `${tool.id}-${line.id}`,
//         name: line.label,
//         color: line.color || tool.color,
//         points: [],
//         horizontalPrice: line.price,
//         dashed: line.dashed ?? true,
//         width: 2,
//         visible: true,
//       }];
//     }

//     return [];
//   });
// });

// const aiDrawings: AiChartDrawing[] = activeToolResults.flatMap((tool) => {
//   const chart = tool.chart;

//   if (!chart) return [];

//   // Preserve any drawing definitions already saved with the tool.
//   const savedDrawings = Array.isArray(chart.drawings)
//     ? chart.drawings
//     : [];

//   // Convert saved trend-analysis lines into native chart series.
//   const trendLines: AiChartDrawing[] =
//     chart.type === "line" && Array.isArray(chart.lines)
//       ? chart.lines.flatMap((line) => {
//           if (!Array.isArray(line.points) || line.points.length === 0) {
//             return [];
//           }

//           const values = line.points.flatMap((point) => {
//             const value = firstNumber(point.value, point.price);
//             const time = normalizeChartTime(point.time);

//             if (value === null || time === null) {
//               return [];
//             }

//             return [{ time, value }];
//           });

//           // Sort by time and remove duplicate timestamps.
//          const uniqueValues = new Map<
//             string,
//             { time: string | number; value: number }
//           >();

//           for (const point of values) {
//             // uniqueValues.set(String(point.time), point);
//                   const pointTime =
//                   typeof point.time === "string"
//                     ? point.time
//                     : typeof point.time === "number"
//                       ? point.time
//                       : `${point.time.year}-${String(point.time.month).padStart(2, "0")}-${String(point.time.day).padStart(2, "0")}`;

//                 uniqueValues.set(String(pointTime), {
//                   time: pointTime,
//                   value: point.value,
//                 });
//           }

//           const sortedValues = Array.from(uniqueValues.values()).sort(
//             (a, b) => {
//               const timeA =
//                 typeof a.time === "number"
//                   ? a.time
//                   : Date.parse(a.time);

//               const timeB =
//                 typeof b.time === "number"
//                   ? b.time
//                   : Date.parse(b.time);

//               return timeA - timeB;
//             }
//           );

//           if (sortedValues.length === 0) {
//             return [];
//           }

//           return [{
//             type: "series" as const,
//             id: `${tool.id}-${line.id}`,
//             name: line.label,
//             source: "values" as const,
//             values: sortedValues,
//             color: line.color || tool.color,
//             width: 2,
//             style: "solid" as const,
//           }];
//         })
//       : [];

//   return [...savedDrawings, ...trendLines];
// });


//   /* ==========================================================================
//      PREVENT BODY SCROLL
//   ========================================================================== */

//   useEffect(() => {
//     const previous =
//       document.body.style
//         .overflow;

//     document.body.style.overflow =
//       "hidden";

//     return () => {
//       document.body.style.overflow =
//         previous;
//     };
//   }, []);


// useEffect(() => {
//   setChartRange(
//     getRangeForTradingMode(tradingMode)
//   );
// }, [tradingMode]);

//   /* ==========================================================================
//      RENDER
//   ========================================================================== */

//   return (
//     <div className="googlesans flex h-screen w-screen flex-col overflow-hidden bg-[#0b0b0f] text-white">
//       {/* =========================================================
//           NAVBAR
//       ========================================================= */}

//       <div className="shrink-0">
//         <Navbar />
//       </div>

//       {/* =========================================================
//           WORKSPACE
//       ========================================================= */}

//       <div className="flex min-h-0 flex-1 overflow-hidden">
//         {/* =======================================================
//             CHAT SIDEBAR
//         ======================================================= */}

//         <ChatSidebar
//           collapsed={
//             sidebarCollapsed
//           }
//           onToggle={() =>
//             setSidebarCollapsed(
//               current => !current
//             )
//           }
//           symbol={cleanSymbol}
//           currentChatId={chatId}
//         />

//         {/* =======================================================
//             MAIN
//         ======================================================= */}

//         <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
//           {/* =====================================================
//               STOCK HEADER
//           ===================================================== */}

//           <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-[#202027] bg-[#0c0c10] px-5">
//             <div className="min-w-0">
//               <h1 className="truncate text-[18px] font-semibold tracking-[-0.5px]">
//                 {stockName}
//               </h1>

//               <div className="mt-0.5 font-mono text-[9px] tracking-[1.1px] text-[#666a75]">
//                 NSE • {cleanSymbol}
//               </div>
//             </div>

//             {/* PRICE */}

//             <div className="flex items-center gap-4">
//               <div className="text-right">
//                 <div
//                   className={`flex items-center justify-end gap-1.5 font-mono text-[20px] font-medium tracking-[-0.7px] ${
//                     priceDirection ===
//                     "up"
//                       ? "text-[#28dc9b]"
//                       : priceDirection ===
//                         "down"
//                       ? "text-[#ff5064]"
//                       : "text-[#d8d8df]"
//                   }`}
//                 >
//                   {priceDirection ===
//                     "up" && (
//                     <ChevronUp
//                       size={17}
//                       strokeWidth={2}
//                     />
//                   )}

//                   {priceDirection ===
//                     "down" && (
//                     <ChevronDown
//                       size={17}
//                       strokeWidth={2}
//                     />
//                   )}

//                   {loadingStock &&
//                   price === null
//                     ? "Loading..."
//                     : formatPrice(
//                         price
//                       )}
//                 </div>

//                 {/* CHANGE */}

//                 <div
//                   className={`mt-0.5 flex items-center justify-end gap-1.5 font-mono text-[10px] ${getChangeColor(
//                     change
//                   )}`}
//                 >
//                   {change !== null && (
//                     <>
//                       <span>
//                         {formatChange(
//                           change
//                         )}
//                       </span>

//                       <span>
//                         (
//                         {formatPercent(
//                           changePercent
//                         )}
//                         )
//                       </span>
//                     </>
//                   )}

//                   {change === null &&
//                     changePercent !==
//                       null && (
//                       <span>
//                         {formatPercent(
//                           changePercent
//                         )}
//                       </span>
//                     )}

//                   {change === null &&
//                     changePercent ===
//                       null &&
//                     !loadingStock && (
//                       <span>—</span>
//                     )}
//                 </div>
//               </div>
//             </div>
//           </header>

//           {/* =====================================================
//               CHART MODE BAR
//           ===================================================== */}

//           <div className="flex h-[44px] shrink-0 items-center border-b border-[#202027] bg-[#0d0d11] px-4">
//             <div className="flex items-center gap-1">
//               <button
//                 onClick={() =>
//                   setAdvanced(false)
//                 }
//                 className={`h-[28px] rounded-[4px] px-3 text-[11px] font-medium transition ${
//                   !advanced
//                     ? "bg-[#292334] text-white"
//                     : "text-[#777b86] hover:bg-[#18181f] hover:text-white"
//                 }`}
//               >
//                 Basic
//               </button>

//               <button
//                 onClick={() =>
//                   setAdvanced(true)
//                 }
//                 className={`h-[28px] rounded-[4px] px-3 text-[11px] font-medium transition ${
//                   advanced
//                     ? "bg-[#292334] text-white"
//                     : "text-[#777b86] hover:bg-[#18181f] hover:text-white"
//                 }`}
//               >
//                 Advanced
//               </button>
//             </div>

//             <div className="mx-3 h-[18px] w-px bg-[#28282f]" />

//             <span className="font-mono text-[9px] tracking-[1.5px] text-[#696c77]">
//               {advanced
//                 ? "CANDLE"
//                 : "LINE"}
//             </span>

//             {/* RIGHT CONTROLS */}

//             {watchlistChecked && (
//               <div className="ml-auto flex flex-row items-center justify-center gap-3">
//                 {/* WATCHLIST */}

//                 <button
//                   onClick={
//                     addToWatchlist
//                   }
//                   disabled={
//                     isInWatchlist ||
//                     watchlistLoading
//                   }
//                   className={`flex h-[30px] items-center gap-1.5 rounded-[5px] border px-3 font-mono text-[10px] transition ${
//                     isInWatchlist
//                       ? "border-[#7135c5]/30 bg-[#171122] text-[#c28cff]/70"
//                       : "border-[#7135c5] bg-[#171122] text-[#c28cff] hover:bg-[#21152e]"
//                   }`}
//                 >
//                   {watchlistLoading
//                     ? "Adding..."
//                     : isInWatchlist
//                     ? "In Watchlist"
//                     : "Add to Watchlist"}
//                 </button>

//                 {/* BUY */}

//                 <button
//                   type="button"
//                   onClick={() => {
//                     console.log(
//                       "BUY",
//                       {
//                         symbol:
//                           cleanSymbol,
//                         price:
//                           tradingPrice,
//                       }
//                     );
//                   }}
//                   disabled={
//                     tradingPrice ===
//                     null
//                   }
//                   className="flex h-[30px] items-center gap-1.5 rounded-[5px] border border-[#42a342]/30 bg-[#132613] px-3 font-mono text-[10px] text-white/80 transition disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   <span>Buy</span>

//                   <span className="font-mono">
//                     {
//                       formattedTradingPrice
//                     }
//                   </span>
//                 </button>

//                 {/* SELL */}

//                 <button
//                   type="button"
//                   onClick={() => {
//                     console.log(
//                       "SELL",
//                       {
//                         symbol:
//                           cleanSymbol,
//                         price:
//                           tradingPrice,
//                       }
//                     );
//                   }}
//                   disabled={
//                     tradingPrice ===
//                     null
//                   }
//                   className="flex h-[30px] items-center gap-1.5 rounded-[5px] border border-[#963333]/30 bg-[#4c1313] px-3 font-mono text-[10px] text-white/80 transition disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   <span>Sell</span>

//                   <span className="font-mono">
//                     {
//                       formattedTradingPrice
//                     }
//                   </span>
//                 </button>

//                 {/* MARKET STATUS */}

//                 <div className="flex items-center gap-1.5 text-xs">
//                   <span
//                     className={`h-2 w-2 rounded-full ${
//                       liveMarketOpen
//                         ? "animate-pulse bg-emerald-400"
//                         : "bg-gray-500"
//                     }`}
//                   />

//                   <span className="text-gray-400">
//                     {liveMarketOpen
//                       ? "LIVE"
//                       : "MARKET CLOSED"}
//                   </span>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* =====================================================
//               CHART
//           ===================================================== */}

//           <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0b0b0f]">
//             {/* <TradingViewChart
//               symbol={cleanSymbol}
//               advanced={advanced}
//               livePrice={livePrice}
//               liveVolume={liveVolume}
//               aiLines={aiLines}
//             /> */}
//               {/* <TradingViewChart
//                 symbol={symbol}
//                 advanced
//                 tradingMode={tradingMode}
//                 aiLines={aiLines}
//                 livePrice={livePrice}
//                 liveVolume={liveVolume}
//               /> */}
// {/* <TradingViewChart
//   symbol={cleanSymbol}
//   advanced={advanced}
//   tradingMode={tradingMode}
//   requestedRange={chartRange}
//   onRangeChange={setChartRange}
//   aiLines={aiLines}
//   livePrice={livePrice}
//   liveVolume={liveVolume}
// /> */}

// <TradingViewChart
//   symbol={cleanSymbol}
//   advanced={advanced}
//   tradingMode={tradingMode}
//   requestedRange={chartRange}
//   onRangeChange={setChartRange}
//   aiLines={aiLines}
//   aiDrawings={aiDrawings}
//   livePrice={livePrice}
//   liveVolume={liveVolume}
// />

//           </div>

//           {/* =====================================================
//               INDICATOR BAR
//           ===================================================== */}

//           <div className="flex h-[48px] shrink-0 items-center gap-2 overflow-x-auto border-t border-[#202027] bg-[#0d0d11] px-4">
//             {/* =================================================
//                 AI TOOLS STORED IN THIS CHAT
//             ================================================= */}

//             {storedToolResults.map(
//               tool => {
//                 const active =
//                   activeToolIndicators.includes(
//                     tool.id
//                   );

//                 return (
//                   <button
//                     key={tool.id}
//                     onClick={() => {
//                       setActiveToolIndicators(
//                         current =>
//                           current.includes(
//                             tool.id
//                           )
//                             ? current.filter(
//                                 id =>
//                                   id !==
//                                   tool.id
//                               )
//                             : [
//                                 ...current,
//                                 tool.id,
//                               ]
//                       );
//                     }}
//                     title={`AI tool: ${tool.label}`}
//                     className={`flex h-[29px] shrink-0 items-center gap-2 rounded-[4px] border px-3 font-mono text-[10px] transition ${
//                       active
//                         ? "bg-[#17151e] text-white"
//                         : "border-[#292932] bg-[#14141a] text-[#8b8d97] hover:border-[#3b3b47] hover:text-white"
//                     }`}
//                     style={{
//                       borderColor:
//                         active
//                           ? tool.color
//                           : undefined,
//                     }}
//                   >
//                     <span
//                       className="h-[7px] w-[7px] rounded-full"
//                       style={{
//                         backgroundColor:
//                           tool.color,
//                       }}
//                     />

//                     <span>
//                       [{tool.label}]
//                     </span>
//                   </button>
//                 );
//               }
//             )}

//             {/* =================================================
//                 NORMAL MANUAL INDICATORS
//             ================================================= */}

//             {DEFAULT_INDICATORS.map(
//               indicator => (
//                 <button
//                   key={indicator}
//                   onClick={() => {
//                     console.log(
//                       "Manual indicator:",
//                       indicator
//                     );
//                   }}
//                   className="h-[29px] shrink-0 rounded-[4px] border border-[#292932] bg-[#14141a] px-3 font-mono text-[10px] text-[#8b8d97] transition hover:border-[#3b3b47] hover:text-white"
//                 >
//                   [{indicator}]
//                 </button>
//               )
//             )}

//             {/* =================================================
//                 EMPTY STATE
//             ================================================= */}

//             {storedToolResults.length ===
//               0 && (
//               <span className="font-mono text-[9px] text-[#555963]">
//                 AI indicators will appear here after analysis
//               </span>
//             )}
//           </div>
//         </main>

//         {/* =======================================================
//             AI ANALYST
//         ======================================================= */}



// <AIAnalyst
//   chatId={chatId}
//   stockName={stockName}
//   symbol={cleanSymbol}
//   price={price}
//   change={change}
//   changePercent={changePercent}
//   tradingMode={tradingMode}
//   risk={risk}
//   onSupportResistanceRequest={
//     handleSupportResistanceRequest
//   }
// />


//       </div>
//     </div>
//   );
// }


























"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatSidebar from "@/components/ChatSidebar";
import AIAnalyst from "@/components/AIAnalyst";

import TradingViewChart, {
  type AiChartLine,
  type AiChartDrawing,
} from "@/components/TradingViewChart";

/* ==========================================================================
   TYPES
========================================================================== */

type StockWorkspaceProps = {
  symbol: string;
  chatId: string;
};

type TradingMode =
  | "Day"
  | "Swing"
  | "Long-term";

type RiskLevel =
  | "Low"
  | "Medium"
  | "High";

type ChartRange =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "YTD"
  | "1Y"
  | "5Y"
  | "All";



function getRangeForTradingMode(
  mode: TradingMode
): ChartRange {
  switch (mode) {
    case "Long-term":
      return "YTD";

    case "Swing":
      return "1M";

    case "Day":
    default:
      return "5D";
  }
}



type StoredToolResult = {
  id: string;
  tool: string;
  label: string;
  color: string;
  result: unknown;

  chart?: {
    type: "priceLines" | "line";
    lines: {
      id: string;
      label: string;
      price?: number;
      color: string;
      dashed?: boolean;
      points?: {
        time: string | number;
        value?: number;
        price?: number;
      }[];
    }[];

    drawings?: AiChartDrawing[];
  } | null;

  createdAt?: string;
};



/* ==========================================================================
   QUOTE
========================================================================== */

type StockQuote = {
  price?: number | null;
  lastPrice?: number | null;
  last_price?: number | null;

  change?: number | null;
  netChange?: number | null;
  net_change?: number | null;

  changePercent?: number | null;
  percentChange?: number | null;
  percent_change?: number | null;

  open?: number | null;
  high?: number | null;
  low?: number | null;

  close?: number | null;

  previousClose?: number | null;
  previous_close?: number | null;

  volume?: number | null;

  averagePrice?: number | null;
  average_price?: number | null;

  [key: string]: unknown;
};

/* ==========================================================================
   CANDLE
========================================================================== */

type StockCandle = {
  time: string | number;

  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;

  value?: number | null;
  price?: number | null;

  volume?: number | null;

  [key: string]: unknown;
};

/* ==========================================================================
   STOCK DATA
========================================================================== */

type StockData = {
  symbol?: string;
  name?: string;

  quote?: StockQuote | null;

  instrumentKey?: string | null;

  price?: number | null;
  lastPrice?: number | null;
  last_price?: number | null;

  change?: number | null;
  netChange?: number | null;
  net_change?: number | null;

  changePercent?: number | null;
  percentChange?: number | null;
  percent_change?: number | null;

  previousClose?: number | null;
  previous_close?: number | null;

  close?: number | null;

  chart?: StockCandle[];
  candles?: StockCandle[];

  error?: string;
  message?: string;

  [key: string]: unknown;
};

/* ==========================================================================
   DEFAULT MANUAL INDICATORS
========================================================================== */

const DEFAULT_INDICATORS = [
  "Volume",
  "RSI",
  "MACD",
  "Moving Average",
];

/* ==========================================================================
   FORMAT SYMBOL
========================================================================== */

function formatSymbol(symbol: string) {
  return decodeURIComponent(symbol)
    .replace(/^NSE:/i, "")
    .trim()
    .toUpperCase();
}

/* ==========================================================================
   SAFE NUMBER
========================================================================== */

function toNumber(
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
   FIRST VALID NUMBER
========================================================================== */

function firstNumber(
  ...values: unknown[]
): number | null {
  for (const value of values) {
    const number =
      toNumber(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}

/* ==========================================================================
   PRICE FORMAT
========================================================================== */

function formatPrice(
  value:
    | number
    | null
    | undefined
) {
  const number =
    toNumber(value);

  if (number === null) {
    return "—";
  }

  return `₹${number.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

/* ==========================================================================
   CHANGE FORMAT
========================================================================== */

function formatChange(
  value:
    | number
    | null
    | undefined
) {
  const number =
    toNumber(value);

  if (number === null) {
    return "—";
  }

  return `${
    number >= 0 ? "+" : ""
  }₹${Math.abs(
    number
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ==========================================================================
   PERCENT FORMAT
========================================================================== */

function formatPercent(
  value:
    | number
    | null
    | undefined
) {
  const number =
    toNumber(value);

  if (number === null) {
    return "—";
  }

  return `${
    number >= 0 ? "+" : ""
  }${number.toFixed(2)}%`;
}

/* ==========================================================================
   CHANGE COLOR
========================================================================== */

function getChangeColor(
  value:
    | number
    | null
    | undefined
) {
  const number =
    toNumber(value);

  if (number === null) {
    return "text-[#777b86]";
  }

  return number >= 0
    ? "text-[#28dc9b]"
    : "text-[#ff5064]";
}

/* ==========================================================================
   NORMALIZE QUOTE
========================================================================== */

function normalizeQuote(
  data: StockData | null
) {
  if (!data) {
    return {
      price: null,
      change: null,
      changePercent: null,
      previousClose: null,
    };
  }

  const quote =
    data.quote ?? {};

  let price =
    firstNumber(
      quote.price,
      quote.lastPrice,
      quote.last_price,
      data.price,
      data.lastPrice,
      data.last_price
    );

  const previousClose =
    firstNumber(
      quote.previousClose,
      quote.previous_close,
      data.previousClose,
      data.previous_close,
      quote.close,
      data.close
    );

  const candles =
    Array.isArray(
      data.candles
    )
      ? data.candles
      : Array.isArray(
          data.chart
        )
      ? data.chart
      : [];

  if (
    price === null &&
    candles.length > 0
  ) {
    const lastCandle =
      candles[
        candles.length - 1
      ];

    price =
      firstNumber(
        lastCandle.close,
        lastCandle.value,
        lastCandle.price
      );
  }

  let change =
    firstNumber(
      quote.change,
      quote.netChange,
      quote.net_change,
      data.change,
      data.netChange,
      data.net_change
    );

  let changePercent =
    firstNumber(
      quote.changePercent,
      quote.percentChange,
      quote.percent_change,
      data.changePercent,
      data.percentChange,
      data.percent_change
    );

  if (
    change === null &&
    price !== null &&
    previousClose !== null
  ) {
    change =
      price -
      previousClose;
  }

  if (
    changePercent === null &&
    change !== null &&
    previousClose !== null &&
    previousClose !== 0
  ) {
    changePercent =
      (change /
        previousClose) *
      100;
  }

  return {
    price,
    change,
    changePercent,
    previousClose,
  };
}

/* ==========================================================================
   COMPONENT
========================================================================== */

function normalizeChartTime(
  time: string | number
): AiChartLine["points"][number]["time"] | null {
  if (typeof time === "number") {
    if (!Number.isFinite(time)) {
      return null;
    }

    // Convert milliseconds to Unix seconds.
    return (time > 1e12
      ? Math.floor(time / 1000)
      : Math.floor(time)) as AiChartLine["points"][number]["time"];
  }

  const value = time.trim();

  if (!value) {
    return null;
  }

  // Lightweight Charts accepts YYYY-MM-DD for daily candles.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value as AiChartLine["points"][number]["time"];
  }

  // Convert ISO date/time strings to Unix seconds.
  const milliseconds = Date.parse(value);

  if (!Number.isFinite(milliseconds)) {
    return null;
  }

  return Math.floor(
    milliseconds / 1000
  ) as AiChartLine["points"][number]["time"];
}




export default function StockWorkspace({
  symbol,
  chatId,
}: StockWorkspaceProps) {
  const cleanSymbol =
    formatSymbol(symbol);

  /* ==========================================================================
     UI STATE
  ========================================================================== */

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const [
    advanced,
    setAdvanced,
  ] = useState(false);

  // const [
  //   tradingMode,
  //   setTradingMode,
  // ] = useState<TradingMode>(
  //   "Swing"
  // );

const [
  tradingMode,
  setTradingMode,
] = useState<TradingMode>(() => {
  if (typeof window === "undefined") {
    return "Swing";
  }

  const saved =
    localStorage.getItem("quantify_trading_type")
      ?.trim()
      .toLowerCase();

  switch (saved) {
    case "long-term":
    case "long term":
    case "longterm":
      return "Long-term";

    case "day":
    case "Day":
      return "Day";

    case "swing":
      return "Swing";

    default:
      return "Swing";
  }
});


const activateSupportResistanceAfterReloadRef =
  useRef(false);




const [chartRange, setChartRange] =
  useState<ChartRange>(
    getRangeForTradingMode(tradingMode)
  );

const handleSupportResistanceRequest = () => {
  // The AI has finished a support/resistance response.
  // The next tool-results reload should activate its saved result.
  activateSupportResistanceAfterReloadRef.current = true;

  // Read the latest saved preference rather than relying
  // on a potentially stale React state value.
  const savedTradingType =
    typeof window !== "undefined"
      ? localStorage
          .getItem("quantify_trading_type")
          ?.trim()
          .toLowerCase()
      : null;

  let mode: TradingMode = tradingMode;

  switch (savedTradingType) {
    case "long-term":
    case "long term":
    case "longterm":
      mode = "Long-term";
      break;

    case "day":
    case "Day":
      mode = "Day";
      break;

    case "swing":
      mode = "Swing";
      break;
  }

  setTradingMode(mode);
  setChartRange(getRangeForTradingMode(mode));
};



  const [risk, setRisk] =
    useState<RiskLevel>("Medium");

  /* ==========================================================================
     AI TOOL / INDICATOR STATE
  ========================================================================== */

  const [
    storedToolResults,
    setStoredToolResults,
  ] = useState<
    StoredToolResult[]
  >([]);

  const [
    activeToolIndicators,
    setActiveToolIndicators,
  ] = useState<string[]>([]);


  // Tracks which chat has completed its initial tool-results load.
const initializedToolChatRef = useRef<string | null>(null);

// Tracks the previous version of each saved tool result.
const previousToolSignaturesRef = useRef<Map<string, string>>(
  new Map()
);

  /* ==========================================================================
     STOCK STATE
  ========================================================================== */

  const [
    stockData,
    setStockData,
  ] = useState<StockData | null>(
    null
  );

  const [
    loadingStock,
    setLoadingStock,
  ] = useState(true);

  const [
    stockError,
    setStockError,
  ] = useState<string | null>(
    null
  );

  /* ==========================================================================
     LIVE MARKET DATA
  ========================================================================== */

  const [
    livePrice,
    setLivePrice,
  ] = useState<number | null>(
    null
  );

  const [
    liveVolume,
    setLiveVolume,
  ] = useState<number | null>(
    null
  );

  const [
    livePreviousClose,
    setLivePreviousClose,
  ] = useState<number | null>(
    null
  );

  const [
    liveMarketOpen,
    setLiveMarketOpen,
  ] = useState(false);

  const [
    liveError,
    setLiveError,
  ] = useState<string | null>(
    null
  );

  /* ==========================================================================
     WATCHLIST
  ========================================================================== */

  const [
    watchlistLoading,
    setWatchlistLoading,
  ] = useState(false);

  const [
    isInWatchlist,
    setIsInWatchlist,
  ] = useState(false);

  const [
    watchlistChecked,
    setWatchlistChecked,
  ] = useState(false);

  /* ==========================================================================
     STOCK NAME
  ========================================================================== */

  const stockName =
    useMemo(() => {
      if (stockData?.name) {
        return stockData.name;
      }

      if (
        cleanSymbol ===
        "HDFCBANK"
      ) {
        return "HDFC BANK";
      }

      if (
        cleanSymbol ===
        "HDFCAMC"
      ) {
        return "HDFC AMC";
      }

      if (
        cleanSymbol ===
        "NIFTY"
      ) {
        return "NIFTY 50";
      }

      return cleanSymbol;
    }, [
      cleanSymbol,
      stockData?.name,
    ]);

  /* ==========================================================================
     NORMALIZED QUOTE
  ========================================================================== */

  const normalizedQuote =
    useMemo(() => {
      const base =
        normalizeQuote(
          stockData
        );

      const currentPrice =
        livePrice !== null
          ? livePrice
          : base.price;

      const previousClose =
        livePreviousClose !==
        null
          ? livePreviousClose
          : base.previousClose;

      let currentChange =
        base.change;

      let currentChangePercent =
        base.changePercent;

      if (
        currentPrice !== null &&
        previousClose !== null &&
        previousClose !== 0
      ) {
        currentChange =
          currentPrice -
          previousClose;

        currentChangePercent =
          (currentChange /
            previousClose) *
          100;
      }

      return {
        price: currentPrice,
        change: currentChange,
        changePercent:
          currentChangePercent,
        previousClose,
      };
    }, [
      stockData,
      livePrice,
      livePreviousClose,
    ]);

  /* ==========================================================================
     TRADING PRICE
  ========================================================================== */

  const tradingPrice =
    livePrice !== null &&
    Number.isFinite(livePrice)
      ? livePrice
      : normalizedQuote.price;

  const formattedTradingPrice =
    tradingPrice !== null
      ? `₹${tradingPrice.toLocaleString(
          "en-IN",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`
      : "--";

  /* ==========================================================================
     NORMALIZED VALUES
  ========================================================================== */

  const price =
    normalizedQuote.price;

  const change =
    normalizedQuote.change;

  const changePercent =
    normalizedQuote.changePercent;

  /* ==========================================================================
     PRICE DIRECTION
  ========================================================================== */

  const priceDirection =
    change !== null
      ? change > 0
        ? "up"
        : change < 0
        ? "down"
        : "neutral"
      : changePercent !== null
      ? changePercent > 0
        ? "up"
        : changePercent < 0
        ? "down"
        : "neutral"
      : "neutral";

  /* ==========================================================================
     LOAD STOCK
  ========================================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadStock() {
      try {
        setLoadingStock(true);
        setStockError(null);

        setLivePrice(null);
        setLiveVolume(null);
        setLivePreviousClose(
          null
        );
        setLiveMarketOpen(false);
        setLiveError(null);

        const encodedSymbol =
          encodeURIComponent(
            cleanSymbol
          );

        const response =
          await fetch(
            `/api/stock/${encodedSymbol}?range=1D`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const text =
          await response.text();

        let data:
          | StockData
          | null = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          throw new Error(
            "Stock API returned an invalid response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              `Failed to load ${cleanSymbol}.`
          );
        }

        if (!data) {
          throw new Error(
            "Stock data was empty."
          );
        }

        if (!cancelled) {
          setStockData(data);
        }
      } catch (error) {
        console.error(
          "StockWorkspace stock error:",
          error
        );

        if (!cancelled) {
          setStockError(
            error instanceof Error
              ? error.message
              : "Failed to load stock data."
          );

          setStockData(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingStock(false);
        }
      }
    }

    loadStock();

    return () => {
      cancelled = true;
    };
  }, [cleanSymbol]);

  /* ==========================================================================
     LIVE PRICE POLLING
  ========================================================================== */

  useEffect(() => {
    let cancelled = false;

    let timeoutId:
      | ReturnType<typeof setTimeout>
      | null = null;

    const POLL_INTERVAL = 3000;

    async function pollLivePrice() {
      if (cancelled) {
        return;
      }

      if (
        document.visibilityState !==
        "visible"
      ) {
        scheduleNextPoll();
        return;
      }

      const instrumentKey =
        stockData?.instrumentKey;

      if (!instrumentKey) {
        scheduleNextPoll();
        return;
      }

      try {
        const response =
          await fetch(
            `/api/stock/${encodeURIComponent(
              cleanSymbol
            )}/live?instrumentKey=${encodeURIComponent(
              instrumentKey
            )}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (!response.ok) {
          console.warn(
            `Live API returned ${response.status}`
          );

          if (!cancelled) {
            setLiveError(
              `Live API unavailable (${response.status})`
            );
          }

          scheduleNextPoll();
          return;
        }

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        if (
          data?.success === false
        ) {
          console.warn(
            "Live API error:",
            data.error
          );

          setLiveError(
            data.error ||
              "Live price unavailable."
          );

          scheduleNextPoll();
          return;
        }

        setLiveMarketOpen(
          Boolean(
            data.marketOpen
          )
        );

        if (!data.marketOpen) {
          setLiveError(null);
          scheduleNextPoll();
          return;
        }

        const nextPrice =
          Number(data.price);

        if (
          Number.isFinite(
            nextPrice
          )
        ) {
          setLivePrice(
            nextPrice
          );
        }

        const nextVolume =
          Number(data.volume);

        if (
          Number.isFinite(
            nextVolume
          )
        ) {
          setLiveVolume(
            nextVolume
          );
        }

        const nextPreviousClose =
          Number(
            data.previousClose
          );

        if (
          Number.isFinite(
            nextPreviousClose
          )
        ) {
          setLivePreviousClose(
            nextPreviousClose
          );
        }

        setLiveError(null);
      } catch (error) {
        if (!cancelled) {
          console.warn(
            "Live stock polling error:",
            error
          );

          setLiveError(
            "Live price unavailable."
          );
        }
      }

      scheduleNextPoll();
    }

    function scheduleNextPoll() {
      if (cancelled) {
        return;
      }

      timeoutId =
        setTimeout(
          pollLivePrice,
          POLL_INTERVAL
        );
    }

    pollLivePrice();

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        clearTimeout(
          timeoutId
        );
      }
    };
  }, [
    cleanSymbol,
    stockData?.instrumentKey,
  ]);

  /* ==========================================================================
     WATCHLIST CHECK
  ========================================================================== */

  useEffect(() => {
    let cancelled = false;

    setWatchlistChecked(false);
    setIsInWatchlist(false);

    async function checkWatchlist() {
      try {
        const response =
          await fetch(
            "/api/watchlist",
            {
              method: "GET",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        const list =
          Array.isArray(
            data?.watchlist
          )
            ? data.watchlist
            : [];

        const found =
          list.some(
            (item: unknown) => {
              const record =
                item as {
                  symbol?: unknown;
                };

              return (
                String(
                  record?.symbol ??
                    ""
                ).toUpperCase() ===
                cleanSymbol
              );
            }
          );

        setIsInWatchlist(
          found
        );
      } catch (error) {
        console.error(
          "Watchlist check error:",
          error
        );
      } finally {
        if (!cancelled) {
          setWatchlistChecked(
            true
          );
        }
      }
    }

    checkWatchlist();

    return () => {
      cancelled = true;
    };
  }, [cleanSymbol]);

  /* ==========================================================================
     ADD TO WATCHLIST
  ========================================================================== */

  async function addToWatchlist() {
    if (
      watchlistLoading ||
      isInWatchlist
    ) {
      return;
    }

    try {
      setWatchlistLoading(true);

      const response =
        await fetch(
          "/api/watchlist",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              stock: {
                symbol:
                  cleanSymbol,

                name:
                  stockName,

                instrumentKey:
                  stockData?.instrumentKey ??
                  `NSE_EQ|${cleanSymbol}`,
              },
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to add stock."
        );
      }

      setIsInWatchlist(true);
    } catch (error) {
      console.error(
        "Add watchlist error:",
        error
      );
    } finally {
      setWatchlistLoading(false);
    }
  }




/* ==========================================================================
   LOAD AI TOOL RESULTS
========================================================================== */

useEffect(() => {
  let cancelled = false;

  // Every chat starts with all saved AI tools turned OFF.
  initializedToolChatRef.current = null;
  previousToolSignaturesRef.current = new Map();

  setActiveToolIndicators([]);
  setStoredToolResults([]);

  function getSupportResistanceTool(
    tools: StoredToolResult[]
  ): StoredToolResult | undefined {
    const matchingTools = tools.filter((tool) => {
      const identity = `${tool.tool ?? ""} ${tool.label ?? ""}`
        .toLowerCase()
        .replace(/[^a-z]/g, "");

      return (
        identity.includes("supportresistance") ||
        identity.includes("support") ||
        identity.includes("resistance")
      );
    });

    if (matchingTools.length === 0) {
      return undefined;
    }

    return matchingTools.reduce((newest, candidate) => {
      const newestTime = newest.createdAt
        ? new Date(newest.createdAt).getTime()
        : 0;

      const candidateTime = candidate.createdAt
        ? new Date(candidate.createdAt).getTime()
        : 0;

      return candidateTime >= newestTime ? candidate : newest;
    });
  }

  function getToolSignature(tool: StoredToolResult): string {
    // Detect changes even when the backend reuses a tool's ID.
    return JSON.stringify({
      id: tool.id,
      tool: tool.tool,
      label: tool.label,
      createdAt: tool.createdAt,
      result: tool.result,
      chart: tool.chart,
    });
  }

  async function loadToolResults() {
    try {
      const response = await fetch(
        `/api/chats/${encodeURIComponent(chatId)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to load AI tool results:",
          response.status
        );
        return;
      }

      const data = await response.json();

      if (cancelled) return;

      const tools: StoredToolResult[] = Array.isArray(
        data?.chat?.toolResults
      )
        ? data.chat.toolResults
        : Array.isArray(data?.toolResults)
          ? data.toolResults
          : [];

      console.log("[Loaded AI tool results]", {
        chatId,
        toolCount: tools.length,
        tools: tools.map((tool) => ({
          id: tool.id,
          label: tool.label,
          createdAt: tool.createdAt,
        })),
      });

      const nextSignatures = new Map<string, string>();

      for (const tool of tools) {
        nextSignatures.set(tool.id, getToolSignature(tool));
      }

      const isFirstLoadForChat =
        initializedToolChatRef.current !== chatId;

      const previousSignatures =
        previousToolSignaturesRef.current;

      // Update the refs before changing React state.
      initializedToolChatRef.current = chatId;
      previousToolSignaturesRef.current = nextSignatures;

      setStoredToolResults(tools);

      /*
       * FIRST LOAD:
       * This runs when a chat is opened or refreshed.
       * Saved results are displayed, but none are activated.
       */
      if (isFirstLoadForChat) {
        setActiveToolIndicators([]);

        // Preserve an explicitly requested Support & Resistance
        // activation if it was requested before this first load.
        if (activateSupportResistanceAfterReloadRef.current) {
          const supportResistanceTool =
            getSupportResistanceTool(tools);

          if (supportResistanceTool) {
            setActiveToolIndicators([
              supportResistanceTool.id,
            ]);

            activateSupportResistanceAfterReloadRef.current =
              false;
          }
        }

        return;
      }

      /*
       * SUPPORT & RESISTANCE:
       * Honor an explicit request from AIAnalyst.
       */
      if (activateSupportResistanceAfterReloadRef.current) {
        const supportResistanceTool =
          getSupportResistanceTool(tools);

        if (supportResistanceTool) {
          // Turn ON this tool and turn OFF all other AI tools.
          setActiveToolIndicators([
            supportResistanceTool.id,
          ]);

          activateSupportResistanceAfterReloadRef.current =
            false;
        }

        // If the result is not saved yet, keep the request pending.
        return;
      }

      /*
       * SUBSEQUENT CHAT UPDATE:
       * Detect new or changed tool results.
       */
      const changedTools = tools.filter((tool) => {
        const previousSignature = previousSignatures.get(
          tool.id
        );

        const nextSignature = nextSignatures.get(tool.id);

        return (
          previousSignature === undefined ||
          previousSignature !== nextSignature
        );
      });

      if (changedTools.length === 0) {
        // No AI tool changed. Leave manual selections untouched.
        return;
      }

      // Prefer the most recently updated result.
      // If timestamps are equal or missing, use the last changed
      // tool in the API response.
      const newestTool = changedTools.reduce(
        (newest, candidate) => {
          const newestTime = newest.createdAt
            ? new Date(newest.createdAt).getTime()
            : 0;

          const candidateTime = candidate.createdAt
            ? new Date(candidate.createdAt).getTime()
            : 0;

          return candidateTime >= newestTime
            ? candidate
            : newest;
        }
      );

      // Only the newly added or changed tool remains active.
      setActiveToolIndicators([newestTool.id]);
    } catch (error) {
      console.error(
        "Failed to load AI tool results:",
        error
      );
    }
  }

  void loadToolResults();

  function handleChatUpdated() {
    void loadToolResults();
  }

  window.addEventListener(
    "chat-updated",
    handleChatUpdated
  );

  return () => {
    cancelled = true;

    window.removeEventListener(
      "chat-updated",
      handleChatUpdated
    );
  };
}, [chatId]);



/* ==========================================================================
   BUILD AI CHART LINES AND DRAWINGS
========================================================================== */

const activeToolResults = storedToolResults.filter((tool) =>
  activeToolIndicators.includes(tool.id)
);

const aiLines: AiChartLine[] = activeToolResults.flatMap((tool) => {
  const chart = tool.chart;

  if (!chart || !Array.isArray(chart.lines)) {
    return [];
  }

  return chart.lines.flatMap((line) => {
    // Support/resistance price levels remain native price lines.
    if (
      typeof line.price === "number" &&
      Number.isFinite(line.price)
    ) {
      return [{
        id: `${tool.id}-${line.id}`,
        name: line.label,
        color: line.color || tool.color,
        points: [],
        horizontalPrice: line.price,
        dashed: line.dashed ?? true,
        width: 2,
        visible: true,
      }];
    }

    return [];
  });
});

const aiDrawings: AiChartDrawing[] = activeToolResults.flatMap((tool) => {
  const chart = tool.chart;

  if (!chart) return [];

  // Preserve any drawing definitions already saved with the tool.
  const savedDrawings = Array.isArray(chart.drawings)
    ? chart.drawings
    : [];

  // Convert saved trend-analysis lines into native chart series.
  const trendLines: AiChartDrawing[] =
    chart.type === "line" && Array.isArray(chart.lines)
      ? chart.lines.flatMap((line) => {
          if (!Array.isArray(line.points) || line.points.length === 0) {
            return [];
          }

          const values = line.points.flatMap((point) => {
            const value = firstNumber(point.value, point.price);
            const time = normalizeChartTime(point.time);

            if (value === null || time === null) {
              return [];
            }

            return [{ time, value }];
          });

          // Sort by time and remove duplicate timestamps.
         const uniqueValues = new Map<
            string,
            { time: string | number; value: number }
          >();

          for (const point of values) {
            // uniqueValues.set(String(point.time), point);
                  const pointTime =
                  typeof point.time === "string"
                    ? point.time
                    : typeof point.time === "number"
                      ? point.time
                      : `${point.time.year}-${String(point.time.month).padStart(2, "0")}-${String(point.time.day).padStart(2, "0")}`;

                uniqueValues.set(String(pointTime), {
                  time: pointTime,
                  value: point.value,
                });
          }

          const sortedValues = Array.from(uniqueValues.values()).sort(
            (a, b) => {
              const timeA =
                typeof a.time === "number"
                  ? a.time
                  : Date.parse(a.time);

              const timeB =
                typeof b.time === "number"
                  ? b.time
                  : Date.parse(b.time);

              return timeA - timeB;
            }
          );

          if (sortedValues.length === 0) {
            return [];
          }

          return [{
            type: "series" as const,
            id: `${tool.id}-${line.id}`,
            name: line.label,
            source: "values" as const,
            values: sortedValues,
            color: line.color || tool.color,
            width: 2,
            style: "solid" as const,
          }];
        })
      : [];

  return [...savedDrawings, ...trendLines];
});


  /* ==========================================================================
     PREVENT BODY SCROLL
  ========================================================================== */

  useEffect(() => {
    const previous =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, []);


useEffect(() => {
  setChartRange(
    getRangeForTradingMode(tradingMode)
  );
}, [tradingMode]);

  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <div className="googlesans flex h-screen w-screen flex-col overflow-hidden bg-[#0b0b0f] text-white">
      {/* =========================================================
          NAVBAR
      ========================================================= */}

      <div className="shrink-0">
        <Navbar />
      </div>

      {/* =========================================================
          WORKSPACE
      ========================================================= */}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* =======================================================
            CHAT SIDEBAR
        ======================================================= */}

        <ChatSidebar
          collapsed={
            sidebarCollapsed
          }
          onToggle={() =>
            setSidebarCollapsed(
              current => !current
            )
          }
          symbol={cleanSymbol}
          currentChatId={chatId}
        />

        {/* =======================================================
            MAIN
        ======================================================= */}

        <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
          {/* =====================================================
              STOCK HEADER
          ===================================================== */}

          <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-[#202027] bg-[#0c0c10] px-5">
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-semibold tracking-[-0.5px]">
                {stockName}
              </h1>

              <div className="mt-0.5 font-mono text-[9px] tracking-[1.1px] text-[#666a75]">
                NSE • {cleanSymbol}
              </div>
            </div>

            {/* PRICE */}

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div
                  className={`flex items-center justify-end gap-1.5 font-mono text-[20px] font-medium tracking-[-0.7px] ${
                    priceDirection ===
                    "up"
                      ? "text-[#28dc9b]"
                      : priceDirection ===
                        "down"
                      ? "text-[#ff5064]"
                      : "text-[#d8d8df]"
                  }`}
                >
                  {priceDirection ===
                    "up" && (
                    <ChevronUp
                      size={17}
                      strokeWidth={2}
                    />
                  )}

                  {priceDirection ===
                    "down" && (
                    <ChevronDown
                      size={17}
                      strokeWidth={2}
                    />
                  )}

                  {loadingStock &&
                  price === null
                    ? "Loading..."
                    : formatPrice(
                        price
                      )}
                </div>

                {/* CHANGE */}

                <div
                  className={`mt-0.5 flex items-center justify-end gap-1.5 font-mono text-[10px] ${getChangeColor(
                    change
                  )}`}
                >
                  {change !== null && (
                    <>
                      <span>
                        {formatChange(
                          change
                        )}
                      </span>

                      <span>
                        (
                        {formatPercent(
                          changePercent
                        )}
                        )
                      </span>
                    </>
                  )}

                  {change === null &&
                    changePercent !==
                      null && (
                      <span>
                        {formatPercent(
                          changePercent
                        )}
                      </span>
                    )}

                  {change === null &&
                    changePercent ===
                      null &&
                    !loadingStock && (
                      <span>—</span>
                    )}
                </div>
              </div>
            </div>
          </header>

          {/* =====================================================
              CHART MODE BAR
          ===================================================== */}

          <div className="flex h-[44px] shrink-0 items-center border-b border-[#202027] bg-[#0d0d11] px-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setAdvanced(false)
                }
                className={`h-[28px] rounded-[4px] px-3 text-[11px] font-medium transition ${
                  !advanced
                    ? "bg-[#292334] text-white"
                    : "text-[#777b86] hover:bg-[#18181f] hover:text-white"
                }`}
              >
                Basic
              </button>

              <button
                onClick={() =>
                  setAdvanced(true)
                }
                className={`h-[28px] rounded-[4px] px-3 text-[11px] font-medium transition ${
                  advanced
                    ? "bg-[#292334] text-white"
                    : "text-[#777b86] hover:bg-[#18181f] hover:text-white"
                }`}
              >
                Advanced
              </button>
            </div>

            <div className="mx-3 h-[18px] w-px bg-[#28282f]" />

            <span className="font-mono text-[9px] tracking-[1.5px] text-[#696c77]">
              {advanced
                ? "CANDLE"
                : "LINE"}
            </span>

            {/* RIGHT CONTROLS */}

            {watchlistChecked && (
              <div className="ml-auto flex flex-row items-center justify-center gap-3">
                {/* WATCHLIST */}

                <button
                  onClick={
                    addToWatchlist
                  }
                  disabled={
                    isInWatchlist ||
                    watchlistLoading
                  }
                  className={`flex h-[30px] items-center gap-1.5 rounded-[5px] border px-3 font-mono text-[10px] transition ${
                    isInWatchlist
                      ? "border-[#7135c5]/30 bg-[#171122] text-[#c28cff]/70"
                      : "border-[#7135c5] bg-[#171122] text-[#c28cff] hover:bg-[#21152e]"
                  }`}
                >
                  {watchlistLoading
                    ? "Adding..."
                    : isInWatchlist
                    ? "In Watchlist"
                    : "Add to Watchlist"}
                </button>

                {/* BUY */}

                <button
                  type="button"
                  onClick={() => {
                    console.log(
                      "BUY",
                      {
                        symbol:
                          cleanSymbol,
                        price:
                          tradingPrice,
                      }
                    );
                  }}
                  disabled={
                    tradingPrice ===
                    null
                  }
                  className="flex h-[30px] items-center gap-1.5 rounded-[5px] border border-[#42a342]/30 bg-[#132613] px-3 font-mono text-[10px] text-white/80 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Buy</span>

                  <span className="font-mono">
                    {
                      formattedTradingPrice
                    }
                  </span>
                </button>

                {/* SELL */}

                <button
                  type="button"
                  onClick={() => {
                    console.log(
                      "SELL",
                      {
                        symbol:
                          cleanSymbol,
                        price:
                          tradingPrice,
                      }
                    );
                  }}
                  disabled={
                    tradingPrice ===
                    null
                  }
                  className="flex h-[30px] items-center gap-1.5 rounded-[5px] border border-[#963333]/30 bg-[#4c1313] px-3 font-mono text-[10px] text-white/80 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Sell</span>

                  <span className="font-mono">
                    {
                      formattedTradingPrice
                    }
                  </span>
                </button>

                {/* MARKET STATUS */}

                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      liveMarketOpen
                        ? "animate-pulse bg-emerald-400"
                        : "bg-gray-500"
                    }`}
                  />

                  <span className="text-gray-400">
                    {liveMarketOpen
                      ? "LIVE"
                      : "MARKET CLOSED"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              CHART
          ===================================================== */}

          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0b0b0f]">


<TradingViewChart
  symbol={cleanSymbol}
  advanced={advanced}
  tradingMode={tradingMode}
  requestedRange={chartRange}
  onRangeChange={setChartRange}
  aiLines={aiLines}
  aiDrawings={aiDrawings}
  livePrice={livePrice}
  liveVolume={liveVolume}
/>

          </div>

          {/* =====================================================
              INDICATOR BAR
          ===================================================== */}

          <div className="flex h-[48px] shrink-0 items-center gap-2 overflow-x-auto border-t border-[#202027] bg-[#0d0d11] px-4">
            {/* =================================================
                AI TOOLS STORED IN THIS CHAT
            ================================================= */}

            {storedToolResults.map(
              tool => {
                const active =
                  activeToolIndicators.includes(
                    tool.id
                  );

                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveToolIndicators(
                        current =>
                          current.includes(
                            tool.id
                          )
                            ? current.filter(
                                id =>
                                  id !==
                                  tool.id
                              )
                            : [
                                ...current,
                                tool.id,
                              ]
                      );
                    }}
                    title={`AI tool: ${tool.label}`}
                    className={`flex h-[29px] shrink-0 items-center gap-2 rounded-[4px] border px-3 font-mono text-[10px] transition ${
                      active
                        ? "bg-[#17151e] text-white"
                        : "border-[#292932] bg-[#14141a] text-[#8b8d97] hover:border-[#3b3b47] hover:text-white"
                    }`}
                    style={{
                      borderColor:
                        active
                          ? tool.color
                          : undefined,
                    }}
                  >
                    <span
                      className="h-[7px] w-[7px] rounded-full"
                      style={{
                        backgroundColor:
                          tool.color,
                      }}
                    />

                    <span>
                      [{tool.label}]
                    </span>
                  </button>
                );
              }
            )}

            {/* =================================================
                NORMAL MANUAL INDICATORS
            ================================================= */}

            {/* {DEFAULT_INDICATORS.map(
              indicator => (
                <button
                  key={indicator}
                  onClick={() => {
                    console.log(
                      "Manual indicator:",
                      indicator
                    );
                  }}
                  className="h-[29px] shrink-0 rounded-[4px] border border-[#292932] bg-[#14141a] px-3 font-mono text-[10px] text-[#8b8d97] transition hover:border-[#3b3b47] hover:text-white"
                >
                  [{indicator}]
                </button>
              )
            )} */}

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {storedToolResults.length ===
              0 && (
              <span className="font-mono text-[9px] text-[#555963]">
                AI indicators will appear here after analysis
              </span>
            )}
          </div>
        </main>

        {/* =======================================================
            AI ANALYST
        ======================================================= */}



<AIAnalyst
  chatId={chatId}
  stockName={stockName}
  symbol={cleanSymbol}
  price={price}
  change={change}
  changePercent={changePercent}
  tradingMode={tradingMode}
  risk={risk}
  onSupportResistanceRequest={
    handleSupportResistanceRequest
  }
/>


      </div>
    </div>
  );
  }