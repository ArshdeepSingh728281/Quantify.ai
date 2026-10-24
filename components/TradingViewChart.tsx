// "use client";

// import {
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// import type { PointerEvent as ReactPointerEvent } from "react";

// import {
//   CandlestickSeries,
//   ColorType,
//   HistogramSeries,
//   LineSeries,
//   createChart,
//   type IChartApi,
//   type IPriceLine,
//   type ISeriesApi,
//   type Time,
// } from "lightweight-charts";

// /* ============================================================
//    TYPES
// ============================================================ */

// // export type TradingViewChartProps = {
// //   symbol: string;
// //   advanced?: boolean;
// //   onRangeChange?: (range: Range) => void;

// //   livePrice?: number | null;
// //   liveVolume?: number | null;

// //   aiLines?: AiChartLine[];
// // };


// export type TradingMode = "Day" | "Swing" | "Long-term";

// export type TradingViewChartProps = {
//   symbol: string;
//   advanced?: boolean;
//   tradingMode?: TradingMode;
//   requestedRange?: Range;
//   onRangeChange?: (range: Range) => void;
//   livePrice?: number | null;
//   liveVolume?: number | null;
//   aiLines?: AiChartLine[];
//   aiDrawings?: AiChartDrawing[];
// };

// export type Range =
//   | "1D"
//   | "5D"
//   | "1M"
//   | "3M"
//   | "6M"
//   | "YTD"
//   | "1Y"
//   | "5Y"
//   | "All";

// export type DrawingTool =
//   | "cursor"
//   | "trendline"
//   | "horizontal"
//   | "rectangle"
//   | "text";

// export type DrawingPoint = {
//   time: Time;
//   price: number;
// };

// export type Drawing = {
//   id: number;
//   type: Exclude<DrawingTool, "cursor">;
//   start: DrawingPoint;
//   end?: DrawingPoint;
//   color: string;
//   text?: string;
// };

// /* ============================================================
//    AI LINE TYPES
// ============================================================ */

// export type AiLinePoint = {
//   time: Time;
//   price: number;
// };

// export type AiChartLine = {
//   id: string;
//   name: string;
//   color: string;

//   /**
//    * Normal point-to-point indicator line.
//    */
//   points: AiLinePoint[];

//   /**
//    * Horizontal AI price level.
//    *
//    * Example:
//    * Support ₹12.63
//    * Resistance ₹14.75
//    */
//   horizontalPrice?: number;

//   width?: number;
//   dashed?: boolean;
//   visible?: boolean;
// };


// export type AiChartDrawing =
//   | {
//       type: "straightLine";
//       id: string;
//       start: { time: string | number; price: number };
//       end: { time: string | number; price: number };
//       color: string;
//       width?: number;
//       style?: "solid" | "dashed" | "dotted";
//     }
//   | {
//       type: "point";
//       id: string;
//       time: string | number;
//       price: number;
//       text?: string;
//       color: string;
//       marker?: "circle" | "arrowUp" | "arrowDown";
//     }
//   | {
//       type: "series";
//       id: string;
//       name: string;
//       source: "candles" | "values";
//       indicator?: "SMA" | "EMA";
//       period?: number;
//       values?: {
//         time: string | number;
//         value: number;
//       }[];
//       color: string;
//       width?: number;
//       style?: "solid" | "dashed" | "dotted";
//     }
//   | {
//       type: "rectangle";
//       id: string;
//       startTime: string | number;
//       endTime: string | number;
//       top: number;
//       bottom: number;
//       color: string;
//       opacity?: number;
//       label?: string;
//     };

// export function createAiLine(
//   name: string,
//   color: string,
//   points: AiLinePoint[],
//   options?: {
//     id?: string;
//     width?: number;
//     dashed?: boolean;
//     visible?: boolean;
//     horizontalPrice?: number;
//   }
// ): AiChartLine {
//   return {
//     id:
//       options?.id ??
//       `${name}-${Date.now()}`,
//     name,
//     color,
//     points,
//     width: options?.width ?? 2,
//     dashed: options?.dashed ?? false,
//     visible: options?.visible ?? true,
//     horizontalPrice:
//       options?.horizontalPrice,
//   };
// }

// /* ============================================================
//    OTHER TYPES
// ============================================================ */

// type StockBar = {
//   time: Time;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume?: number;
// };

// type ApiResponse = {
//   success?: boolean;
//   symbol?: string;
//   range?: string;
//   data?: StockBar[];
//   bars?: StockBar[];
//   candles?: StockBar[];
//   error?: string;
//   message?: string;
// };

// export type IndicatorKey =
//   | "ema20"
//   | "sma20"
//   | "sma50"
//   | "sma200"
//   | "volume";

// type IndicatorState = Record<
//   IndicatorKey,
//   boolean
// >;

// /* ============================================================
//    CONSTANTS
// ============================================================ */

// const RANGES: Range[] = [
//   "1D",
//   "5D",
//   "1M",
//   "3M",
//   "6M",
//   "YTD",
//   "1Y",
//   "5Y",
//   "All",
// ];

// const TOOL_COLORS = [
//   "#a566ff",
//   "#28dc9b",
//   "#ff5064",
//   "#f4bf32",
//   "#4da3ff",
// ];

// const DEFAULT_INDICATORS: IndicatorState = {
//   ema20: false,
//   sma20: false,
//   sma50: false,
//   sma200: false,
//   volume: true,
// };




// /* ============================================================
//    HELPERS
// ============================================================ */

// function rangeToApi(range: Range) {
//   return range === "All"
//     ? "All"
//     : range;
// }

// function cleanSymbol(symbol: string) {
//   return decodeURIComponent(symbol)
//     .replace(/^NSE:/i, "")
//     .trim()
//     .toUpperCase();
// }

// function normalizeTime(
//   value: unknown
// ): Time | null {
//   if (
//     typeof value === "number" &&
//     Number.isFinite(value)
//   ) {
//     if (value > 10_000_000_000) {
//       return Math.floor(
//         value / 1000
//       ) as Time;
//     }

//     return Math.floor(value) as Time;
//   }

//   if (typeof value === "string") {
//     const numeric = Number(value);

//     if (Number.isFinite(numeric)) {
//       return normalizeTime(numeric);
//     }

//     const parsed = Date.parse(value);

//     if (Number.isFinite(parsed)) {
//       return Math.floor(
//         parsed / 1000
//       ) as Time;
//     }
//   }

//   return null;
// }

// function normalizeBar(
//   raw: unknown
// ): StockBar | null {
//   if (
//     typeof raw !== "object" ||
//     raw === null
//   ) {
//     return null;
//   }

//   const item =
//     raw as Record<string, unknown>;

//   const time = normalizeTime(
//     item.time ??
//       item.timestamp ??
//       item.ts ??
//       item.date ??
//       item.datetime
//   );

//   const open = Number(
//     item.open ?? item.o
//   );

//   const high = Number(
//     item.high ?? item.h
//   );

//   const low = Number(
//     item.low ?? item.l
//   );

//   const close = Number(
//     item.close ?? item.c
//   );

//   const volume = Number(
//     item.volume ??
//       item.v ??
//       0
//   );

//   if (
//     time === null ||
//     !Number.isFinite(open) ||
//     !Number.isFinite(high) ||
//     !Number.isFinite(low) ||
//     !Number.isFinite(close)
//   ) {
//     return null;
//   }

//   return {
//     time,
//     open,
//     high,
//     low,
//     close,
//     volume: Number.isFinite(volume)
//       ? volume
//       : 0,
//   };
// }

// function extractBars(
//   json: ApiResponse
// ): StockBar[] {
//   const source =
//     json.data ??
//     json.bars ??
//     json.candles ??
//     [];

//   if (!Array.isArray(source)) {
//     return [];
//   }

//   const normalized = source
//     .map(normalizeBar)
//     .filter(
//       (
//         item
//       ): item is StockBar =>
//         item !== null
//     );

//   normalized.sort(
//     (a, b) =>
//       Number(a.time) -
//       Number(b.time)
//   );

//   const unique: StockBar[] = [];
//   const seen = new Set<string>();

//   for (const bar of normalized) {
//     const key = String(bar.time);

//     if (seen.has(key)) {
//       continue;
//     }

//     seen.add(key);
//     unique.push(bar);
//   }

//   return unique;
// }

// /* ============================================================
//    INDICATORS
// ============================================================ */

// function calculateSMA(
//   bars: StockBar[],
//   period: number
// ): {
//   time: Time;
//   value: number;
// }[] {
//   if (bars.length < period) {
//     return [];
//   }

//   const result: {
//     time: Time;
//     value: number;
//   }[] = [];

//   let sum = 0;

//   for (
//     let i = 0;
//     i < bars.length;
//     i++
//   ) {
//     sum += bars[i].close;

//     if (i >= period) {
//       sum -=
//         bars[i - period].close;
//     }

//     if (i >= period - 1) {
//       result.push({
//         time: bars[i].time,
//         value: sum / period,
//       });
//     }
//   }

//   return result;
// }

// function calculateEMA(
//   bars: StockBar[],
//   period: number
// ): {
//   time: Time;
//   value: number;
// }[] {
//   if (bars.length < period) {
//     return [];
//   }

//   const result: {
//     time: Time;
//     value: number;
//   }[] = [];

//   let ema =
//     bars
//       .slice(0, period)
//       .reduce(
//         (sum, bar) =>
//           sum + bar.close,
//         0
//       ) / period;

//   const multiplier =
//     2 / (period + 1);

//   result.push({
//     time: bars[period - 1].time,
//     value: ema,
//   });

//   for (
//     let i = period;
//     i < bars.length;
//     i++
//   ) {
//     ema =
//       (bars[i].close - ema) *
//         multiplier +
//       ema;

//     result.push({
//       time: bars[i].time,
//       value: ema,
//     });
//   }

//   return result;
// }

// /* ============================================================
//    COMPONENT
// ============================================================ */


// // export default function TradingViewChart({
// //   symbol,
// //   advanced = false,
// //   tradingMode,
// //   requestedRange,
// //   onRangeChange,
// //   aiLines = [],
// //   livePrice,
// //   liveVolume,
// // }: TradingViewChartProps) {

// export default function TradingViewChart({
//   symbol,
//   advanced = false,
//   tradingMode,
//   requestedRange,
//   onRangeChange,
//   aiLines = [],
//   aiDrawings = [],
//   livePrice,
//   liveVolume,
// }: TradingViewChartProps) {


//   /* ==========================================================
//      DOM / CHART REFS
//   ========================================================== */

//   const containerRef =
//     useRef<HTMLDivElement | null>(
//       null
//     );

//   const chartRef =
//     useRef<IChartApi | null>(
//       null
//     );

//   const candleSeriesRef =
//     useRef<
//       ISeriesApi<"Candlestick"> | null
//     >(null);

//   const lineSeriesRef =
//     useRef<
//       ISeriesApi<"Line"> | null
//     >(null);

//   const emaSeriesRef =
//     useRef<
//       ISeriesApi<"Line"> | null
//     >(null);

//   const sma20SeriesRef =
//     useRef<
//       ISeriesApi<"Line"> | null
//     >(null);

//   const sma50SeriesRef =
//     useRef<
//       ISeriesApi<"Line"> | null
//     >(null);

//   const sma200SeriesRef =
//     useRef<
//       ISeriesApi<"Line"> | null
//     >(null);

//   const volumeSeriesRef =
//     useRef<
//       ISeriesApi<"Histogram"> | null
//     >(null);

//   /* ==========================================================
//      AI PRICE LINE REFS

//      IMPORTANT:
//      IPriceLine itself does NOT have remove().
//      It must be removed using series.removePriceLine().
//   ========================================================== */

//   const aiIndicatorSeriesRef =
//   useRef<ISeriesApi<"Line">[]>([]);

//   const aiPriceLinesRef =
//     useRef<IPriceLine[]>([]);

//     const aiPaneRefs = useRef<
//   Map<string, ReturnType<IChartApi["panes"]>[number]>
// >(new Map());

//   /* ==========================================================
//      DRAWING REFS
//   ========================================================== */

//   const drawingLayerRef =
//     useRef<SVGSVGElement | null>(
//       null
//     );

//   const drawingToolRef =
//     useRef<DrawingTool>("cursor");

//   const drawingColorRef =
//     useRef<string>(
//       TOOL_COLORS[0]
//     );

//   const drawingsRef =
//     useRef<Drawing[]>([]);

//   const undoStackRef =
//     useRef<Drawing[][]>([]);

//   const redoStackRef =
//     useRef<Drawing[][]>([]);

//   const currentDrawingRef =
//     useRef<Drawing | null>(null);

//   const isDrawingRef =
//     useRef(false);

//   const nextDrawingIdRef =
//     useRef(1);

//   /* ==========================================================
//      LIVE DATA REFS
//   ========================================================== */

//   const barsRef =
//     useRef<StockBar[]>([]);

//   const latestLivePriceRef =
//     useRef<number | null>(null);

//   const aiLinesRef =
//     useRef<AiChartLine[]>(aiLines);

//   const aiDrawingsRef =
//   useRef<AiChartDrawing[]>(aiDrawings);

//   /* ==========================================================
//      STATE
//   ========================================================== */

//   const [range, setRange] =
//     useState<Range>("1D");

//   const [loading, setLoading] =
//     useState(true);

//   const [error, setError] =
//     useState<string | null>(null);

//   const [bars, setBars] =
//     useState<StockBar[]>([]);

//   const [
//     selectedTool,
//     setSelectedTool,
//   ] =
//     useState<DrawingTool>(
//       "cursor"
//     );

//   const [
//     selectedColor,
//     setSelectedColor,
//   ] =
//     useState(TOOL_COLORS[0]);

//   const [
//     indicators,
//     setIndicators,
//   ] =
//     useState<IndicatorState>(
//       DEFAULT_INDICATORS
//     );

//   const [
//     indicatorsOpen,
//     setIndicatorsOpen,
//   ] =
//     useState(false);

//   const [
//     aiLinesVisible,
//     setAiLinesVisible,
//   ] =
//     useState(true);

// const aiLinesVisibleRef = useRef(aiLinesVisible);
// aiLinesVisibleRef.current = aiLinesVisible;

//   const [, forceDrawingRender] =
//     useState(0);

//   const currentSymbol =
//     cleanSymbol(symbol);

//   /* ============================================================
//      SYNC BARS REF
//   ============================================================ */

//   useEffect(() => {
//     barsRef.current = bars;
//   }, [bars]);



//   /* ============================================================
//      DRAWING COORDINATES
//   ============================================================ */

//   const pointToChartValue =
//     useCallback(
//       (
//         clientX: number,
//         clientY: number
//       ): DrawingPoint | null => {
//         const container =
//           containerRef.current;

//         const chart =
//           chartRef.current;

//         if (!container || !chart) {
//           return null;
//         }

//         const rect =
//           container.getBoundingClientRect();

//         const x =
//           clientX - rect.left;

//         const y =
//           clientY - rect.top;

//         const time =
//           chart
//             .timeScale()
//             .coordinateToTime(x);

//         let price:
//           | number
//           | null = null;

//         if (
//           candleSeriesRef.current
//         ) {
//           price =
//             candleSeriesRef.current.coordinateToPrice(
//               y
//             );
//         } else if (
//           lineSeriesRef.current
//         ) {
//           price =
//             lineSeriesRef.current.coordinateToPrice(
//               y
//             );
//         }

//         if (
//           time === null ||
//           time === undefined ||
//           price === null ||
//           price === undefined ||
//           !Number.isFinite(price)
//         ) {
//           return null;
//         }

//         return {
//           time,
//           price: Number(price),
//         };
//       },
//       []
//     );

//   /* ============================================================
//      DRAWING RENDER
//   ============================================================ */

//   const renderDrawings =
//     useCallback(() => {
//       const svg =
//         drawingLayerRef.current;

//       const chart =
//         chartRef.current;

//       if (!svg || !chart) {
//         return;
//       }

//       const width =
//         svg.clientWidth;

//       const height =
//         svg.clientHeight;

//       svg.setAttribute(
//         "viewBox",
//         `0 0 ${width} ${height}`
//       );

//       while (svg.firstChild) {
//         svg.removeChild(
//           svg.firstChild
//         );
//       }

//       const timeScale =
//         chart.timeScale();

//       const activeSeries =
//         candleSeriesRef.current ??
//         lineSeriesRef.current;

//       if (!activeSeries) {
//         return;
//       }

//       const priceToY = (
//         price: number
//       ) =>
//         activeSeries.priceToCoordinate(
//           price
//         );

//       const drawLine = (
//         x1: number,
//         y1: number,
//         x2: number,
//         y2: number,
//         color: string,
//         widthValue = 2,
//         dashed = false
//       ) => {
//         const line =
//           document.createElementNS(
//             "http://www.w3.org/2000/svg",
//             "line"
//           );

//         line.setAttribute(
//           "x1",
//           String(x1)
//         );

//         line.setAttribute(
//           "y1",
//           String(y1)
//         );

//         line.setAttribute(
//           "x2",
//           String(x2)
//         );

//         line.setAttribute(
//           "y2",
//           String(y2)
//         );

//         line.setAttribute(
//           "stroke",
//           color
//         );

//         line.setAttribute(
//           "stroke-width",
//           String(widthValue)
//         );

//         line.setAttribute(
//           "vector-effect",
//           "non-scaling-stroke"
//         );

//         line.setAttribute(
//           "stroke-linecap",
//           "round"
//         );

//         if (dashed) {
//           line.setAttribute(
//             "stroke-dasharray",
//             "7 5"
//           );
//         }

//         svg.appendChild(line);
//       };

//       const drawRect = (
//         x: number,
//         y: number,
//         rectWidth: number,
//         rectHeight: number,
//         color: string
//       ) => {
//         const rect =
//           document.createElementNS(
//             "http://www.w3.org/2000/svg",
//             "rect"
//           );

//         rect.setAttribute(
//           "x",
//           String(x)
//         );

//         rect.setAttribute(
//           "y",
//           String(y)
//         );

//         rect.setAttribute(
//           "width",
//           String(rectWidth)
//         );

//         rect.setAttribute(
//           "height",
//           String(rectHeight)
//         );

//         rect.setAttribute(
//           "fill",
//           "transparent"
//         );

//         rect.setAttribute(
//           "stroke",
//           color
//         );

//         rect.setAttribute(
//           "stroke-width",
//           "2"
//         );

//         rect.setAttribute(
//           "vector-effect",
//           "non-scaling-stroke"
//         );

//         svg.appendChild(rect);
//       };

//       const drawText = (
//         x: number,
//         y: number,
//         text: string,
//         color: string
//       ) => {
//         const element =
//           document.createElementNS(
//             "http://www.w3.org/2000/svg",
//             "text"
//           );

//         element.setAttribute(
//           "x",
//           String(x)
//         );

//         element.setAttribute(
//           "y",
//           String(y)
//         );

//         element.setAttribute(
//           "fill",
//           color
//         );

//         element.setAttribute(
//           "font-size",
//           "13"
//         );

//         element.setAttribute(
//           "font-family",
//           "Inter, Arial, sans-serif"
//         );

//         element.setAttribute(
//           "font-weight",
//           "500"
//         );

//         element.textContent = text;

//         svg.appendChild(element);
//       };

//       /* ========================================================
//          USER DRAWINGS
//       ======================================================== */

//       for (
//         const drawing of
//           drawingsRef.current
//       ) {
//         const startX =
//           timeScale.timeToCoordinate(
//             drawing.start.time
//           );

//         const startY =
//           priceToY(
//             drawing.start.price
//           );

//         if (
//           startX === null ||
//           startX === undefined ||
//           startY === null ||
//           startY === undefined
//         ) {
//           continue;
//         }

//         if (
//           drawing.type ===
//           "horizontal"
//         ) {
//           drawLine(
//             0,
//             startY,
//             width,
//             startY,
//             drawing.color
//           );

//           continue;
//         }

//         if (
//           drawing.type === "text"
//         ) {
//           drawText(
//             startX,
//             startY,
//             drawing.text || "Text",
//             drawing.color
//           );

//           continue;
//         }

//         if (!drawing.end) {
//           continue;
//         }

//         const endX =
//           timeScale.timeToCoordinate(
//             drawing.end.time
//           );

//         const endY =
//           priceToY(
//             drawing.end.price
//           );

//         if (
//           endX === null ||
//           endX === undefined ||
//           endY === null ||
//           endY === undefined
//         ) {
//           continue;
//         }

//         if (
//           drawing.type ===
//           "trendline"
//         ) {
//           drawLine(
//             startX,
//             startY,
//             endX,
//             endY,
//             drawing.color
//           );
//         }

//         if (
//           drawing.type ===
//           "rectangle"
//         ) {
//           drawRect(
//             Math.min(
//               startX,
//               endX
//             ),
//             Math.min(
//               startY,
//               endY
//             ),
//             Math.abs(
//               endX - startX
//             ),
//             Math.abs(
//               endY - startY
//             ),
//             drawing.color
//           );
//         }
//       }

//       /* ========================================================
//          CURRENT DRAWING
//       ======================================================== */

//       const current =
//         currentDrawingRef.current;

//       if (
//         current &&
//         current.end
//       ) {
//         const startX =
//           timeScale.timeToCoordinate(
//             current.start.time
//           );

//         const startY =
//           priceToY(
//             current.start.price
//           );

//         const endX =
//           timeScale.timeToCoordinate(
//             current.end.time
//           );

//         const endY =
//           priceToY(
//             current.end.price
//           );

//         if (
//           startX !== null &&
//           startX !== undefined &&
//           startY !== null &&
//           startY !== undefined &&
//           endX !== null &&
//           endX !== undefined &&
//           endY !== null &&
//           endY !== undefined
//         ) {
//           if (
//             current.type ===
//             "trendline"
//           ) {
//             drawLine(
//               startX,
//               startY,
//               endX,
//               endY,
//               current.color
//             );
//           }

//           if (
//             current.type ===
//             "rectangle"
//           ) {
//             drawRect(
//               Math.min(
//                 startX,
//                 endX
//               ),
//               Math.min(
//                 startY,
//                 endY
//               ),
//               Math.abs(
//                 endX - startX
//               ),
//               Math.abs(
//                 endY - startY
//               ),
//               current.color
//             );
//           }
//         }
//       }

//       /* ========================================================
//          AI / CUSTOM POINT LINES

//          Horizontal AI levels are NOT rendered here.
//          They use Lightweight Charts createPriceLine().
//       ======================================================== */

//       if (aiLinesVisible) {
//         for (
//           const aiLine of
//             aiLinesRef.current
//         ) {
//           if (
//             aiLine.visible === false
//           ) {
//             continue;
//           }

//           if (
//             aiLine.horizontalPrice !==
//             undefined
//           ) {
//             continue;
//           }

//           if (
//             aiLine.points.length < 2
//           ) {
//             continue;
//           }

//           for (
//             let i = 0;
//             i <
//             aiLine.points.length - 1;
//             i++
//           ) {
//             const first =
//               aiLine.points[i];

//             const second =
//               aiLine.points[i + 1];

//             const x1 =
//               timeScale.timeToCoordinate(
//                 first.time
//               );

//             const y1 =
//               priceToY(
//                 first.price
//               );

//             const x2 =
//               timeScale.timeToCoordinate(
//                 second.time
//               );

//             const y2 =
//               priceToY(
//                 second.price
//               );

//             if (
//               x1 === null ||
//               x1 === undefined ||
//               y1 === null ||
//               y1 === undefined ||
//               x2 === null ||
//               x2 === undefined ||
//               y2 === null ||
//               y2 === undefined
//             ) {
//               continue;
//             }

//             drawLine(
//               x1,
//               y1,
//               x2,
//               y2,
//               aiLine.color,
//               aiLine.width ?? 2,
//               aiLine.dashed ?? false
//             );
//           }
//         }
//       }


// /* ========================================================
//    AI DRAWING API
// ======================================================== */

// for (const drawing of aiDrawingsRef.current) {
//   const toX = (value: string | number) => {
//     const time = normalizeDrawingTime(value);
//     return time === null
//       ? null
//       : timeScale.timeToCoordinate(time);
//   };

//   if (drawing.type === "straightLine") {
//     const x1 = toX(drawing.start.time);
//     const x2 = toX(drawing.end.time);
//     const y1 = priceToY(drawing.start.price);
//     const y2 = priceToY(drawing.end.price);

//     if (
//       x1 == null || x2 == null ||
//       y1 == null || y2 == null
//     ) continue;

//     drawLine(
//       x1, y1, x2, y2,
//       drawing.color,
//       drawing.width ?? 2,
//       drawing.style === "dashed" ||
//         drawing.style === "dotted"
//     );

//     continue;
//   }

//   if (drawing.type === "point") {
//     const x = toX(drawing.time);
//     const y = priceToY(drawing.price);

//     if (x == null || y == null) continue;

//     const marker = document.createElementNS(
//       "http://www.w3.org/2000/svg",
//       "circle"
//     );

//     marker.setAttribute("cx", String(x));
//     marker.setAttribute("cy", String(y));
//     marker.setAttribute("r", "4");
//     marker.setAttribute("fill", drawing.color);
//     marker.setAttribute("stroke", "#0b0b0f");
//     marker.setAttribute("stroke-width", "1.5");
//     svg.appendChild(marker);

//     if (drawing.text) {
//       drawText(x + 7, y - 7, drawing.text, drawing.color);
//     }

//     continue;
//   }

//   if (drawing.type === "rectangle") {
//     const x1 = toX(drawing.startTime);
//     const x2 = toX(drawing.endTime);
//     const y1 = priceToY(drawing.top);
//     const y2 = priceToY(drawing.bottom);

//     if (
//       x1 == null || x2 == null ||
//       y1 == null || y2 == null
//     ) continue;

//     const rect = document.createElementNS(
//       "http://www.w3.org/2000/svg",
//       "rect"
//     );

//     rect.setAttribute("x", String(Math.min(x1, x2)));
//     rect.setAttribute("y", String(Math.min(y1, y2)));
//     rect.setAttribute("width", String(Math.abs(x2 - x1)));
//     rect.setAttribute("height", String(Math.abs(y2 - y1)));
//     rect.setAttribute("fill", drawing.color);
//     rect.setAttribute("fill-opacity", String(drawing.opacity ?? 0.12));
//     rect.setAttribute("stroke", drawing.color);
//     rect.setAttribute("stroke-width", "1.5");

//     svg.appendChild(rect);

//     if (drawing.label) {
//       drawText(
//         Math.min(x1, x2) + 5,
//         Math.min(y1, y2) + 15,
//         drawing.label,
//         drawing.color
//       );
//     }

//     continue;
//   }
// if (drawing.type === "series") {
//   // Indicator series are rendered by Lightweight Charts,
//   // not manually as SVG segments.
//   continue;
// }
// //   if (drawing.type === "series") {
// //     let values: { time: Time; value: number }[] = [];

// //     if (
// //       drawing.source === "candles" &&
// //       (drawing.indicator === "SMA" ||
// //         drawing.indicator === "EMA")
// //     ) {
// //       const period = drawing.period ?? 20;

// //       if (
// //         !Number.isInteger(period) ||
// //         period < 1 ||
// //         period > 1000
// //       ) continue;

// //       values =
// //         drawing.indicator === "SMA"
// //           ? calculateSMA(barsRef.current, period)
// //           : calculateEMA(barsRef.current, period);
// //     } else if (
// //       drawing.source === "values" &&
// //       drawing.values
// //     ) {
// //       values = drawing.values.flatMap((point) => {
// //         const time = normalizeDrawingTime(point.time);

// //         if (
// //           time === null ||
// //           !Number.isFinite(point.value)
// //         ) return [];

// //         return [{ time, value: point.value }];
// //       });
// //     }

// //     // for (let i = 0; i < values.length - 1; i++) {
// //     //   const first = values[i];
// //     //   const second = values[i + 1];

// //     //   const x1 = timeScale.timeToCoordinate(first.time);
// //     //   const x2 = timeScale.timeToCoordinate(second.time);
// //     //   const y1 = priceToY(first.value);
// //     //   const y2 = priceToY(second.value);

// //     //   if (
// //     //     x1 == null || x2 == null ||
// //     //     y1 == null || y2 == null
// //     //   ) continue;

// //     //   drawLine(
// //     //     x1, y1, x2, y2,
// //     //     drawing.color,
// //     //     drawing.width ?? 2,
// //     //     drawing.style === "dashed" ||
// //     //       drawing.style === "dotted"
// //     //   );
// //     // }

// // const plottedPoints = values
// //   .flatMap((point) => {
// //     const x = timeScale.timeToCoordinate(point.time);
// //     const y = priceToY(point.value);

// //     if (
// //       x == null ||
// //       y == null ||
// //       !Number.isFinite(x) ||
// //       !Number.isFinite(y)
// //     ) {
// //       return [];
// //     }

// //     return [{ x, y }];
// //   })
// //   .sort((a, b) => a.x - b.x);

// // for (let i = 0; i < plottedPoints.length - 1; i++) {
// //   const first = plottedPoints[i];
// //   const second = plottedPoints[i + 1];

// //   drawLine(
// //     first.x,
// //     first.y,
// //     second.x,
// //     second.y,
// //     drawing.color,
// //     drawing.width ?? 2,
// //     drawing.style === "dashed" ||
// //       drawing.style === "dotted"
// //   );
// // }



// //   }
// }


//     }, [aiLinesVisible]);


// const renderAiPriceLines = useCallback(() => {
//   // Use whichever price series currently exists.
//   const series =
//     candleSeriesRef.current ??
//     lineSeriesRef.current;

//   // The chart may not have created its series yet.
//   if (!series) {
//     return;
//   }

//   // Remove previous AI price lines before recreating them.
//   for (const line of aiPriceLinesRef.current) {
//     try {
//       series.removePriceLine(line);
//     } catch {
//       // Ignore lines already removed during chart recreation.
//     }
//   }

//   aiPriceLinesRef.current = [];

//   if (!aiLinesVisible) {
//     return;
//   }

//   for (const aiLine of aiLinesRef.current) {
//     if (aiLine.visible === false) continue;

//     const price = aiLine.horizontalPrice;

//     if (
//       typeof price !== "number" ||
//       !Number.isFinite(price)
//     ) {
//       continue;
//     }



// const priceLine = series.createPriceLine({
//   price: aiLine.horizontalPrice!,
//   color: aiLine.color || "#a566ff",
//   lineWidth: 2,
//   lineStyle: aiLine.dashed ? 2 : 0,
//   axisLabelVisible: true,
//   title: aiLine.name,
// });

// console.log("[AI chart line created]", {
//   name: aiLine.name,
//   price: aiLine.horizontalPrice,
//   seriesType: candleSeriesRef.current
//     ? "candlestick"
//     : "line",
// });

// aiPriceLinesRef.current.push(priceLine);


//   }
// }, [aiLinesVisible]);

// /* ============================================================
//    UPDATE AI LINE REF
// ============================================================ */

// // useEffect(() => {
// //   aiLinesRef.current = aiLines;

// //   // Wait for React to commit the updated props.
// //   const frame = requestAnimationFrame(() => {
// //     renderAiPriceLines();
// //     renderDrawings();
// //   });

// //   return () => cancelAnimationFrame(frame);
// // }, [aiLines, renderAiPriceLines, renderDrawings]);

// useEffect(() => {
//   aiLinesRef.current = aiLines;
//   aiDrawingsRef.current = aiDrawings;

//   const frame = requestAnimationFrame(() => {
//     renderAiPriceLines();
//     renderDrawings();
//   });

//   return () => cancelAnimationFrame(frame);
// }, [
//   aiLines,
//   aiDrawings,
//   renderAiPriceLines,
//   renderDrawings,
// ]);



// // useEffect(() => {
// //   const targetRange: Range | undefined =
// //     requestedRange ??
// //     (tradingMode === "Long-term"
// //       ? "6M"
// //       : tradingMode === "Swing"
// //         ? "1M"
// //         : tradingMode === "Intraday"
// //           ? "1D"
// //           : undefined);

// //   if (!targetRange) return;

// //   setRange((currentRange) =>
// //     currentRange === targetRange
// //       ? currentRange
// //       : targetRange
// //   );

// //   onRangeChange?.(targetRange);
// // }, [requestedRange, tradingMode, onRangeChange]);




// useEffect(() => {
//   // StockWorkspace controls the requested timeframe.
//   // Do not use the risk level or AI response wording here.
//   if (!requestedRange) return;

//   setRange((currentRange) =>
//     currentRange === requestedRange
//       ? currentRange
//       : requestedRange
//   );
// }, [requestedRange]);


//   useEffect(() => {
//     drawingToolRef.current =
//       selectedTool;
//   }, [selectedTool]);

//   useEffect(() => {
//     drawingColorRef.current =
//       selectedColor;
//   }, [selectedColor]);



//   /* ============================================================
//      LOAD HISTORICAL DATA
//   ============================================================ */

//   useEffect(() => {
//     let cancelled = false;

//     async function loadData() {
//       try {
//         setLoading(true);
//         setError(null);

//         const response =
//           await fetch(
//             `/api/stock/${encodeURIComponent(
//               currentSymbol
//             )}?range=${encodeURIComponent(
//               rangeToApi(range)
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

//         const text =
//           await response.text();

//         let json: ApiResponse;

//         try {
//           json = JSON.parse(text);
//         } catch {
//           throw new Error(
//             `Stock API returned an invalid response (${response.status}).`
//           );
//         }

//         if (!response.ok) {
//           throw new Error(
//             json.error ||
//               json.message ||
//               `Stock API returned ${response.status}.`
//           );
//         }

//         const nextBars =
//           extractBars(json);

//         if (
//           nextBars.length === 0
//         ) {
//           throw new Error(
//             "No chart data was returned for this symbol."
//           );
//         }

//         if (!cancelled) {
//           barsRef.current =
//             nextBars;

//           setBars(nextBars);
//         }
//       } catch (err) {
//         if (cancelled) {
//           return;
//         }

//         console.error(
//           "Chart data error:",
//           err
//         );

//         barsRef.current = [];
//         setBars([]);

//         setError(
//           err instanceof Error
//             ? err.message
//             : "Unable to load chart data."
//         );
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     }

//     loadData();

//     return () => {
//       cancelled = true;
//     };
//   }, [
//     currentSymbol,
//     range,
//   ]);

//   /* ============================================================
//      RANGE
//   ============================================================ */

//   const changeRange =
//     useCallback(
//       (nextRange: Range) => {
//         setRange(nextRange);

//         onRangeChange?.(
//           nextRange
//         );
//       },
//       [onRangeChange]
//     );

//   /* ============================================================
//      UNDO
//   ============================================================ */

//   const undo =
//     useCallback(() => {
//       if (
//         drawingsRef.current
//           .length === 0
//       ) {
//         return;
//       }

//       const current = [
//         ...drawingsRef.current,
//       ];

//       const previous =
//         undoStackRef.current.pop();

//       if (!previous) {
//         return;
//       }

//       redoStackRef.current.push(
//         current
//       );

//       drawingsRef.current = [
//         ...previous,
//       ];

//       currentDrawingRef.current =
//         null;

//       isDrawingRef.current =
//         false;

//       forceDrawingRender(
//         value => value + 1
//       );

//       requestAnimationFrame(
//         renderDrawings
//       );
//     }, [renderDrawings]);

//   /* ============================================================
//      REDO
//   ============================================================ */

//   const redo =
//     useCallback(() => {
//       const next =
//         redoStackRef.current.pop();

//       if (!next) {
//         return;
//       }

//       undoStackRef.current.push([
//         ...drawingsRef.current,
//       ]);

//       drawingsRef.current = [
//         ...next,
//       ];

//       currentDrawingRef.current =
//         null;

//       isDrawingRef.current =
//         false;

//       forceDrawingRender(
//         value => value + 1
//       );

//       requestAnimationFrame(
//         renderDrawings
//       );
//     }, [renderDrawings]);

//   /* ============================================================
//      KEYBOARD
//   ============================================================ */

//   useEffect(() => {
//     function handleKeyboard(
//       event: KeyboardEvent
//     ) {
//       const target =
//         event.target as HTMLElement;

//       if (
//         target.tagName ===
//           "INPUT" ||
//         target.tagName ===
//           "TEXTAREA"
//       ) {
//         return;
//       }

//       const modifier =
//         event.ctrlKey ||
//         event.metaKey;

//       if (
//         modifier &&
//         event.key.toLowerCase() ===
//           "z"
//       ) {
//         event.preventDefault();

//         if (event.shiftKey) {
//           redo();
//         } else {
//           undo();
//         }
//       }

//       if (
//         modifier &&
//         event.key.toLowerCase() ===
//           "y"
//       ) {
//         event.preventDefault();

//         redo();
//       }

//       if (event.key === "Escape") {
//         setSelectedTool(
//           "cursor"
//         );

//         currentDrawingRef.current =
//           null;

//         isDrawingRef.current =
//           false;

//         requestAnimationFrame(
//           renderDrawings
//         );
//       }
//     }

//     window.addEventListener(
//       "keydown",
//       handleKeyboard
//     );

//     return () => {
//       window.removeEventListener(
//         "keydown",
//         handleKeyboard
//       );
//     };
//   }, [
//     redo,
//     undo,
//     renderDrawings,
//   ]);

//   /* ============================================================
//      POINTER DOWN
//   ============================================================ */

//   const handlePointerDown =
//     useCallback(
//       (
//         event: ReactPointerEvent<HTMLDivElement>
//       ) => {
//         const tool =
//           drawingToolRef.current;

//         if (tool === "cursor") {
//           return;
//         }

//         const point =
//           pointToChartValue(
//             event.clientX,
//             event.clientY
//           );

//         if (!point) {
//           return;
//         }

//         if (tool === "text") {
//           const text =
//             window.prompt(
//               "Enter text"
//             );

//           if (
//             !text ||
//             !text.trim()
//           ) {
//             return;
//           }

//           undoStackRef.current.push(
//             [
//               ...drawingsRef.current,
//             ]
//           );

//           redoStackRef.current = [];

//           drawingsRef.current.push({
//             id:
//               nextDrawingIdRef.current++,
//             type: "text",
//             start: point,
//             color:
//               drawingColorRef.current,
//             text: text.trim(),
//           });

//           forceDrawingRender(
//             value => value + 1
//           );

//           requestAnimationFrame(
//             renderDrawings
//           );

//           return;
//         }

//         if (
//           tool === "horizontal"
//         ) {
//           undoStackRef.current.push(
//             [
//               ...drawingsRef.current,
//             ]
//           );

//           redoStackRef.current = [];

//           drawingsRef.current.push({
//             id:
//               nextDrawingIdRef.current++,
//             type: "horizontal",
//             start: point,
//             color:
//               drawingColorRef.current,
//           });

//           forceDrawingRender(
//             value => value + 1
//           );

//           requestAnimationFrame(
//             renderDrawings
//           );

//           return;
//         }

//         isDrawingRef.current =
//           true;

//         currentDrawingRef.current =
//           {
//             id:
//               nextDrawingIdRef.current++,
//             type:
//               tool === "rectangle"
//                 ? "rectangle"
//                 : "trendline",
//             start: point,
//             color:
//               drawingColorRef.current,
//           };

//         try {
//           event.currentTarget.setPointerCapture(
//             event.pointerId
//           );
//         } catch {
//           // Ignore pointer capture errors.
//         }

//         event.preventDefault();
//       },
//       [
//         pointToChartValue,
//         renderDrawings,
//       ]
//     );

//   /* ============================================================
//      POINTER MOVE
//   ============================================================ */

//   const handlePointerMove =
//     useCallback(
//       (
//         event: ReactPointerEvent<HTMLDivElement>
//       ) => {
//         if (
//           !isDrawingRef.current
//         ) {
//           return;
//         }

//         const current =
//           currentDrawingRef.current;

//         if (!current) {
//           return;
//         }

//         const point =
//           pointToChartValue(
//             event.clientX,
//             event.clientY
//           );

//         if (!point) {
//           return;
//         }

//         current.end = point;

//         requestAnimationFrame(
//           renderDrawings
//         );
//       },
//       [
//         pointToChartValue,
//         renderDrawings,
//       ]
//     );

//   /* ============================================================
//      POINTER UP
//   ============================================================ */

//   const finishDrawing =
//     useCallback(() => {
//       if (
//         !isDrawingRef.current
//       ) {
//         return;
//       }

//       isDrawingRef.current =
//         false;

//       const current =
//         currentDrawingRef.current;

//       if (
//         current &&
//         current.end
//       ) {
//         undoStackRef.current.push(
//           [
//             ...drawingsRef.current,
//           ]
//         );

//         redoStackRef.current = [];

//         drawingsRef.current.push({
//           ...current,
//         });
//       }

//       currentDrawingRef.current =
//         null;

//       forceDrawingRender(
//         value => value + 1
//       );

//       requestAnimationFrame(
//         renderDrawings
//       );
//     }, [renderDrawings]);

//   /* ============================================================
//      INDICATOR TOGGLE
//   ============================================================ */

//   const toggleIndicator =
//     useCallback(
//       (
//         indicator: IndicatorKey
//       ) => {
//         setIndicators(
//           previous => ({
//             ...previous,
//             [indicator]:
//               !previous[indicator],
//           })
//         );
//       },
//       []
//     );

//   /* ============================================================
//      LIVE PRICE UPDATE
//   ============================================================ */

//   const updateChartWithLivePrice =
//     useCallback(
//       (price: number) => {
//         if (
//           !Number.isFinite(price)
//         ) {
//           return;
//         }

//         latestLivePriceRef.current =
//           price;

//         const currentBars =
//           barsRef.current;

//         if (
//           currentBars.length === 0
//         ) {
//           return;
//         }

//         const lastIndex =
//           currentBars.length - 1;

//         const lastBar =
//           currentBars[lastIndex];

//         const updatedBar: StockBar =
//           {
//             ...lastBar,
//             close: price,
//             high: Math.max(
//               lastBar.high,
//               price
//             ),
//             low: Math.min(
//               lastBar.low,
//               price
//             ),
//           };

//         barsRef.current = [
//           ...currentBars.slice(
//             0,
//             lastIndex
//           ),
//           updatedBar,
//         ];

//         if (
//           candleSeriesRef.current
//         ) {
//           candleSeriesRef.current.update(
//             {
//               time:
//                 updatedBar.time,
//               open:
//                 updatedBar.open,
//               high:
//                 updatedBar.high,
//               low:
//                 updatedBar.low,
//               close:
//                 updatedBar.close,
//             }
//           );
//         }

//         if (
//           lineSeriesRef.current
//         ) {
//           lineSeriesRef.current.update(
//             {
//               time:
//                 updatedBar.time,
//               value:
//                 updatedBar.close,
//             }
//           );
//         }

//         if (
//           emaSeriesRef.current
//         ) {
//           const emaData =
//             calculateEMA(
//               barsRef.current,
//               20
//             );

//           const latest =
//             emaData[
//               emaData.length - 1
//             ];

//           if (latest) {
//             emaSeriesRef.current.update(
//               latest
//             );
//           }
//         }

//         if (
//           sma20SeriesRef.current
//         ) {
//           const smaData =
//             calculateSMA(
//               barsRef.current,
//               20
//             );

//           const latest =
//             smaData[
//               smaData.length - 1
//             ];

//           if (latest) {
//             sma20SeriesRef.current.update(
//               latest
//             );
//           }
//         }

//         if (
//           sma50SeriesRef.current
//         ) {
//           const smaData =
//             calculateSMA(
//               barsRef.current,
//               50
//             );

//           const latest =
//             smaData[
//               smaData.length - 1
//             ];

//           if (latest) {
//             sma50SeriesRef.current.update(
//               latest
//             );
//           }
//         }

//         if (
//           sma200SeriesRef.current
//         ) {
//           const smaData =
//             calculateSMA(
//               barsRef.current,
//               200
//             );

//           const latest =
//             smaData[
//               smaData.length - 1
//             ];

//           if (latest) {
//             sma200SeriesRef.current.update(
//               latest
//             );
//           }
//         }

//         requestAnimationFrame(
//           renderDrawings
//         );

//         requestAnimationFrame(
//           renderAiPriceLines
//         );
//       },
//       [
//         renderDrawings,
//         renderAiPriceLines,
//       ]
//     );

//   /* ============================================================
//      LISTEN TO LIVE PRICE
//   ============================================================ */

//   useEffect(() => {
//     if (
//       livePrice === null ||
//       livePrice === undefined ||
//       !Number.isFinite(
//         livePrice
//       )
//     ) {
//       return;
//     }

//     updateChartWithLivePrice(
//       livePrice
//     );
//   }, [
//     livePrice,
//     updateChartWithLivePrice,
//   ]);

//   /* ============================================================
//      CREATE CHART
//   ============================================================ */

//   useEffect(() => {
//     const container =
//       containerRef.current;

//     if (!container) {
//       return;
//     }

//     /*
//      * IMPORTANT:
//      *
//      * We do NOT manually remove AI price lines
//      * before chart.remove().
//      *
//      * Lightweight Charts removes all series
//      * and their price lines when the chart is removed.
//      *
//      * This also avoids calling methods on a stale
//      * series reference.
//      */

//     if (chartRef.current) {
//       chartRef.current.remove();
//       chartRef.current = null;
//     }

//     aiPriceLinesRef.current = [];
//     aiIndicatorSeriesRef.current = [];

//     candleSeriesRef.current =
//       null;

//     lineSeriesRef.current =
//       null;

//     emaSeriesRef.current =
//       null;

//     sma20SeriesRef.current =
//       null;

//     sma50SeriesRef.current =
//       null;

//     sma200SeriesRef.current =
//       null;

//     volumeSeriesRef.current =
//       null;

//     if (bars.length === 0) {
//       return;
//     }

//     barsRef.current = bars;

//     const chart =
//       createChart(
//         container,
//         {
//           width:
//             container.clientWidth,

//           height:
//             container.clientHeight,

//           layout: {
//             background: {
//               type:
//                 ColorType.Solid,
//               color:
//                 "#0b0b0f",
//             },

//             textColor:
//               "#858894",

//             fontFamily:
//               "Inter, Arial, sans-serif",
//           },

//           grid: {
//             vertLines: {
//               color:
//                 "rgba(255,255,255,0.025)",
//             },

//             horzLines: {
//               color:
//                 "rgba(255,255,255,0.025)",
//             },
//           },

//           crosshair: {
//             mode: 0,

//             vertLine: {
//               color:
//                 "rgba(139,61,255,0.45)",
//               width: 1,
//               style: 0,
//               labelBackgroundColor:
//                 "#8b3dff",
//             },

//             horzLine: {
//               color:
//                 "rgba(139,61,255,0.45)",
//               width: 1,
//               style: 0,
//               labelBackgroundColor:
//                 "#8b3dff",
//             },
//           },

//           rightPriceScale: {
//             visible: true,

//             borderColor:
//               "#202027",

//             textColor:
//               "#858894",

//             autoScale: true,

//             scaleMargins: {
//               top:
//                 advanced
//                   ? 0.08
//                   : 0.1,

//               bottom:
//                 advanced
//                   ? 0.25
//                   : 0.1,
//             },
//           },

//           timeScale: {
//             visible: true,

//             borderColor:
//               "#202027",

//             timeVisible: true,

//             secondsVisible:
//               range === "1D",

//             rightOffset:
//               advanced
//                 ? 8
//                 : 4,

//             barSpacing:
//               advanced
//                 ? 9
//                 : 6,

//             minBarSpacing: 2,

//             fixLeftEdge: false,

//             fixRightEdge: false,

//             lockVisibleTimeRangeOnResize:
//               true,
//           },

//           localization: {
//             locale: "en-IN",

//             priceFormatter:
//               (price: number) =>
//                 `₹${price.toLocaleString(
//                   "en-IN",
//                   {
//                     maximumFractionDigits:
//                       2,
//                   }
//                 )}`,
//           },

//           handleScroll: {
//             mouseWheel: true,

//             pressedMouseMove:
//               !advanced,

//             horzTouchDrag: true,

//             vertTouchDrag: true,
//           },

//           handleScale: {
//             axisPressedMouseMove:
//               true,

//             mouseWheel: true,

//             pinch: true,
//           },
//         }
//       );

//     chartRef.current = chart;

//     /* ==========================================================
//        ADVANCED CANDLESTICKS
//     ========================================================== */

//     if (advanced) {
//       // const candle =
//       //   chart.addSeries(
//       //     CandlestickSeries,
//       //     {
//       //       upColor:
//       //         "#28dc9b",

//       //       downColor:
//       //         "#ff5064",

//       //       borderUpColor:
//       //         "#28dc9b",

//       //       borderDownColor:
//       //         "#ff5064",

//       //       wickUpColor:
//       //         "#28dc9b",

//       //       wickDownColor:
//       //         "#ff5064",

//       //       borderVisible: true,

//       //       priceLineVisible: true,

//       //       lastValueVisible: true,
//       //     }
//       //   );

// const candle = chart.addSeries(
//   CandlestickSeries,
//   {
//     upColor: "#28dc9b",
//     downColor: "#ff5064",
//     borderUpColor: "#28dc9b",
//     borderDownColor: "#ff5064",
//     wickUpColor: "#28dc9b",
//     wickDownColor: "#ff5064",
//     borderVisible: true,
//     priceLineVisible: true,
//     lastValueVisible: true,

//     // autoscaleInfoProvider: (original:any) => {
//     //   const originalInfo = original();
//     //   // const aiRange = getAiPriceRange();
//     //   const aiRange = getAiPriceRange(aiLinesRef.current);

//     //   if (!aiRange) return originalInfo;

//     //   if (!originalInfo) {
//     //     return { priceRange: aiRange };
//     //   }

//     //   return {
//     //     ...originalInfo,
//     //     priceRange: {
//     //       minValue: Math.min(
//     //         originalInfo.priceRange.minValue,
//     //         aiRange.minValue
//     //       ),
//     //       maxValue: Math.max(
//     //         originalInfo.priceRange.maxValue,
//     //         aiRange.maxValue
//     //       ),
//     //     },
//     //   };
//     // },
//   }
// );

//       candleSeriesRef.current =
//         candle;

//       candle.setData(
//         bars.map(bar => ({
//           time: bar.time,
//           open: bar.open,
//           high: bar.high,
//           low: bar.low,
//           close: bar.close,
//         }))
//       );

//       /* ========================================================
//          EMA 20
//       ======================================================== */

//       if (indicators.ema20) {
//         const ema =
//           chart.addSeries(
//             LineSeries,
//             {
//               color:
//                 "#a566ff",

//               lineWidth: 2,

//               priceLineVisible:
//                 false,

//               lastValueVisible:
//                 true,

//               title: "EMA 20",

//               crosshairMarkerVisible:
//                 false,
//             }
//           );

//         ema.setData(
//           calculateEMA(
//             bars,
//             20
//           )
//         );

//         emaSeriesRef.current =
//           ema;
//       }

//       /* ========================================================
//          SMA 20
//       ======================================================== */

//       if (indicators.sma20) {
//         const sma =
//           chart.addSeries(
//             LineSeries,
//             {
//               color:
//                 "#28dc9b",

//               lineWidth: 2,

//               priceLineVisible:
//                 false,

//               lastValueVisible:
//                 true,

//                 title: "SMA 20",

//               crosshairMarkerVisible:
//                 false,
//             }
//           );

//         sma.setData(
//           calculateSMA(
//             bars,
//             20
//           )
//         );

//         sma20SeriesRef.current =
//           sma;
//       }

//       /* ========================================================
//          SMA 50
//       ======================================================== */

//       if (indicators.sma50) {
//         const sma =
//           chart.addSeries(
//             LineSeries,
//             {
//               color:
//                 "#f4bf32",

//               lineWidth: 2,

//               priceLineVisible:
//                 false,

//               lastValueVisible:
//                 true,

//               title: "SMA 50",

//               crosshairMarkerVisible:
//                 false,
//             }
//           );

//         sma.setData(
//           calculateSMA(
//             bars,
//             50
//           )
//         );

//         sma50SeriesRef.current =
//           sma;
//       }

//       /* ========================================================
//          SMA 200
//       ======================================================== */

//       if (indicators.sma200) {
//         const sma =
//           chart.addSeries(
//             LineSeries,
//             {
//               color:
//                 "#ff5064",

//               lineWidth: 2,

//               priceLineVisible:
//                 false,

//               lastValueVisible:
//                 true,

//               title: "SMA 200",

//               crosshairMarkerVisible:
//                 false,
//             }
//           );

//         sma.setData(
//           calculateSMA(
//             bars,
//             200
//           )
//         );

//         sma200SeriesRef.current =
//           sma;
//       }

//       /* ========================================================
//          VOLUME
//       ======================================================== */

//       if (indicators.volume) {
//         const volume =
//           chart.addSeries(
//             HistogramSeries,
//             {
//               priceFormat: {
//                 type: "volume",
//               },

//               priceScaleId:
//                 "volume",

//               priceLineVisible:
//                 false,

//               lastValueVisible:
//                 false,

//               base: 0,
//             }
//           );

//         volume.setData(
//           bars.map(bar => ({
//             time: bar.time,

//             value:
//               bar.volume ?? 0,

//             color:
//               bar.close >=
//               bar.open
//                 ? "rgba(40,220,155,0.30)"
//                 : "rgba(255,80,100,0.30)",
//           }))
//         );

//         volumeSeriesRef.current =
//           volume;

//         chart
//           .priceScale("volume")
//           .applyOptions({
//             scaleMargins: {
//               top: 0.82,
//               bottom: 0,
//             },
//           });
//       }
//     }

//     /* ==========================================================
//        BASIC LINE CHART
//     ========================================================== */

//     else {
    

// const line = chart.addSeries(
//   LineSeries,
//   {
//     color: "#a566ff",
//     lineWidth: 2,
//     crosshairMarkerVisible: true,
//     priceLineVisible: true,
//     lastValueVisible: true,
//   }
// );

//       lineSeriesRef.current =
//         line;

//       line.setData(
//         bars.map(bar => ({
//           time: bar.time,
//           value: bar.close,
//         }))
//       );
//     }


// /* ==========================================================
//    SAVED AI INDICATOR SERIES
// ========================================================== */

// // for (const drawing of aiDrawingsRef.current) {
// //   if (drawing.type !== "series") continue;

// //   let values: { time: Time; value: number }[] = [];

// //   if (
// //     drawing.source === "candles" &&
// //     (drawing.indicator === "SMA" ||
// //       drawing.indicator === "EMA")
// //   ) {
// //     const period = drawing.period ?? 20;

// //     values =
// //       drawing.indicator === "SMA"
// //         ? calculateSMA(bars, period)
// //         : calculateEMA(bars, period);
// //   } else if (
// //     drawing.source === "values" &&
// //     drawing.values
// //   ) {
// //     values = drawing.values.flatMap((point) => {
// //       const time = normalizeDrawingTime(point.time);

// //       if (
// //         time === null ||
// //         !Number.isFinite(point.value)
// //       ) {
// //         return [];
// //       }

// //       return [{ time, value: point.value }];
// //     });
// //   }

// //   // Sort and remove duplicate timestamps.
// //   const unique = new Map<string, { time: Time; value: number }>();

// //   for (const point of values) {
// //     unique.set(String(point.time), point);
// //   }

// //   const data = Array.from(unique.values()).sort(
// //     (a, b) => Number(a.time) - Number(b.time)
// //   );

// //   if (data.length === 0) continue;

// //   const series = chart.addSeries(LineSeries, {
// //     title: drawing.name,
// //     color: drawing.color,
// //     lineWidth: (drawing.width ?? 2) as 1 | 2 | 3 | 4,
// //     lineStyle:
// //       drawing.style === "dashed"
// //         ? 2
// //         : drawing.style === "dotted"
// //           ? 1
// //           : 0,
// //     priceLineVisible: false,
// //     lastValueVisible: true,
// //     crosshairMarkerVisible: false,
// //   });

// //   series.setData(data);
// // }

//     /* ==========================================================
//        AI PRICE LINES + DRAWINGS
//     ========================================================== */

//     requestAnimationFrame(() => {
//       renderAiPriceLines();
//       renderDrawings();
//     });

//     /* ==========================================================
//        APPLY LATEST LIVE PRICE
//     ========================================================== */

//     if (
//       latestLivePriceRef.current !==
//         null &&
//       Number.isFinite(
//         latestLivePriceRef.current
//       )
//     ) {
//       requestAnimationFrame(
//         () => {
//           const latest =
//             latestLivePriceRef.current;

//           if (
//             latest !== null &&
//             Number.isFinite(latest)
//           ) {
//             updateChartWithLivePrice(
//               latest
//             );
//           }
//         }
//       );
//     }

//     /* ==========================================================
//        FIT CONTENT
//     ========================================================== */

//     chart
//       .timeScale()
//       .fitContent();

//     /* ==========================================================
//        CHART SCROLL / ZOOM
//     ========================================================== */

//     const rerender = () => {
//       requestAnimationFrame(
//         () => {
//           renderDrawings();
//           renderAiPriceLines();
//         }
//       );
//     };

//     chart
//       .timeScale()
//       .subscribeVisibleLogicalRangeChange(
//         rerender
//       );

//     /* ==========================================================
//        RESIZE
//     ========================================================== */

//     const resizeObserver =
//       new ResizeObserver(() => {
//         if (!chartRef.current) {
//           return;
//         }

//         chartRef.current.resize(
//           container.clientWidth,
//           container.clientHeight
//         );

//         requestAnimationFrame(
//           () => {
//             renderDrawings();
//             renderAiPriceLines();
//           }
//         );
//       });

//     resizeObserver.observe(
//       container
//     );

//     requestAnimationFrame(() => {
//       renderDrawings();
//       renderAiPriceLines();
//     });

//     /* ==========================================================
//        CLEANUP
//     ========================================================== */

//     return () => {
//       resizeObserver.disconnect();

//       try {
//         chart
//           .timeScale()
//           .unsubscribeVisibleLogicalRangeChange(
//             rerender
//           );
//       } catch {
//         // noop
//       }

//       /*
//        * DO NOT DO:
//        *
//        * line.remove()
//        *
//        * IPriceLine has no remove() method.
//        *
//        * chart.remove() removes the chart and its
//        * associated price lines/series.
//        */

//       aiPriceLinesRef.current = [];

//       chart.remove();

//       if (
//         chartRef.current ===
//         chart
//       ) {
//         chartRef.current =
//           null;
//       }

//       candleSeriesRef.current =
//         null;

//       lineSeriesRef.current =
//         null;

//       emaSeriesRef.current =
//         null;

//       sma20SeriesRef.current =
//         null;

//       sma50SeriesRef.current =
//         null;

//       sma200SeriesRef.current =
//         null;

//       volumeSeriesRef.current =
//         null;
//     };
//   }, [
//     bars,
//     advanced,
//     range,
//     indicators,
//     renderDrawings,
//     updateChartWithLivePrice,
//     renderAiPriceLines,
//   ]);

// /* ============================================================
//    REACTIVE AI INDICATOR SERIES

//    Rebuild AI series when the selected tools change or
//    when the chart is recreated.
// ============================================================ */

// useEffect(() => {
//   const chart = chartRef.current;

//   if (!chart) {
//     return;
//   }

//   // Remove the previous AI indicator series.
//   for (const series of aiIndicatorSeriesRef.current) {
//     try {
//       chart.removeSeries(series);
//     } catch (error) {
//       console.warn(
//         "Could not remove previous AI indicator series:",
//         error
//       );
//     }
//   }

//   aiIndicatorSeriesRef.current = [];
//   aiPaneRefs.current.clear();

 
 
 
// //   // Create a separate pane for bounded oscillators.
// // const hasStochastic = aiDrawings.some(
// //   (drawing) =>
// //     drawing.type === "series" &&
// //     /stochastic|overbought\s*\(80\)|oversold\s*\(20\)/i.test(
// //       drawing.name
// //     )
// // );

// // const hasADX = aiDrawings.some(
// //   (drawing) =>
// //     drawing.type === "series" &&
// //     /\bADX\b|\+\s*DI|-\s*DI/i.test(drawing.name)
// // );

// // const hasATR = aiDrawings.some(
// //   (drawing) =>
// //     drawing.type === "series" &&
// //     /\bATR\b/i.test(drawing.name)
// // );

// // const hasVolumeAnalysis = aiDrawings.some(
// //   (drawing) =>
// //     drawing.type === "series" &&
// //     /relative\s*volume/i.test(drawing.name)
// // );

// // const hasOBV = aiDrawings.some(
// //   (drawing) =>
// //     drawing.type === "series" &&
// //     /\bOBV\b|on[- ]balance volume/i.test(drawing.name)
// // );



// // // const hasDivergence = aiDrawings.some(
// // //   (drawing) =>
// // //     drawing.type === "series" &&
// // //     /divergence/i.test(drawing.id)
// // // );


// // const hasDivergence = aiDrawings.some(
// //   (drawing) =>
// //     drawing.type === "series" &&
// //     /divergence/i.test(
// //       `${drawing.id} ${drawing.name}`
// //     )
// // );



// // const hasVolumeProfile = aiDrawings.some(
// //   (drawing) =>
// //     drawing.type === "series" &&
// //     /volume\s*profile|volumeprofile|volume\s*by\s*price/i.test(
// //       drawing.name
// //     )
// // );





// // const stochasticPane = hasStochastic
// //   ? chart.addPane()
// //   : null;

// // const adxPane = hasADX
// //   ? chart.addPane()
// //   : null;

// // const atrPane = hasATR
// //   ? chart.addPane()
// //   : null;

// // const volumeAnalysisPane = hasVolumeAnalysis
// //   ? chart.addPane()
// //   : null;

// // const obvPane = hasOBV
// //   ? chart.addPane()
// //   : null;

// // // const divergencePane = hasDivergence
// // //   ? chart.addPane()
// // //   : null;

// // const volumeProfilePane = hasVolumeProfile
// //   ? chart.addPane()
// //   : null;

// //   // const stochasticPaneIndex = hasStochastic
// //   //   ? chart.addPane()
// //   //   : 0;







// // Identify which indicators need separate panes.
// const hasStochastic = aiDrawings.some(
//   (d) =>
//     d.type === "series" &&
//     /stochastic|overbought\s*\(80\)|oversold\s*\(20\)/i.test(d.name)
// );

// const hasADX = aiDrawings.some(
//   (d) =>
//     d.type === "series" &&
//     /\bADX\b|\+\s*DI|-\s*DI/i.test(d.name)
// );

// const hasATR = aiDrawings.some(
//   (d) =>
//     d.type === "series" && /\bATR\b/i.test(d.name)
// );

// const hasVolumeAnalysis = aiDrawings.some(
//   (d) =>
//     d.type === "series" && /relative\s*volume/i.test(d.name)
// );

// const hasOBV = aiDrawings.some(
//   (d) =>
//     d.type === "series" &&
//     /\bOBV\b|on[- ]balance volume/i.test(d.name)
// );

// const hasDivergence = aiDrawings.some(
//   (d) =>
//     d.type === "series" &&
//     /divergence/i.test(`${d.id} ${d.name}`)
// );

// const hasVolumeProfile = aiDrawings.some(
//   (d) =>
//     d.type === "series" &&
//     /volume\s*profile|volumeprofile|volume\s*by\s*price/i.test(d.name)
// );

// // Create each pane only once for the current chart.
// const getOrCreatePane = (key: string, needed: boolean) => {
//   if (!needed) {
//     const existing = aiPaneRefs.current.get(key);

//     if (existing) {
//       try {
//         const index = chart.panes().indexOf(existing);

//         // Never remove the main chart pane.
//         if (index > 0) {
//           chart.removePane(index);
//         }
//       } catch {
//         // The pane may already have been removed.
//       }

//       aiPaneRefs.current.delete(key);
//     }

//     return null;
//   }

//   const existing = aiPaneRefs.current.get(key);

//   if (existing && chart.panes().includes(existing)) {
//     return existing;
//   }

//   const pane = chart.addPane();
//   aiPaneRefs.current.set(key, pane);

//   return pane;
// };

// const stochasticPane = getOrCreatePane("stochastic", hasStochastic);
// const adxPane = getOrCreatePane("adx", hasADX);
// const atrPane = getOrCreatePane("atr", hasATR);
// const volumeAnalysisPane = getOrCreatePane("relative-volume", hasVolumeAnalysis);
// const obvPane = getOrCreatePane("obv", hasOBV);
// const divergencePane = getOrCreatePane("divergence", hasDivergence);
// const volumeProfilePane = getOrCreatePane("volume-profile", hasVolumeProfile);







//   // Keep the ref synchronized with the latest props.
//   aiDrawingsRef.current = aiDrawings;

//   for (const drawing of aiDrawings) {
//     if (drawing.type !== "series") {
//       continue;
//     }

//     let values: { time: Time; value: number }[] = [];

//     if (
//       drawing.source === "candles" &&
//       (drawing.indicator === "SMA" ||
//         drawing.indicator === "EMA")
//     ) {
//       const period = drawing.period ?? 20;

//       if (
//         !Number.isInteger(period) ||
//         period < 1 ||
//         period > 1000
//       ) {
//         continue;
//       }

//       values =
//         drawing.indicator === "SMA"
//           ? calculateSMA(barsRef.current, period)
//           : calculateEMA(barsRef.current, period);
//     } else if (
//       drawing.source === "values" &&
//       drawing.values
//     ) {
//       values = drawing.values.flatMap((point) => {
//         const time = normalizeDrawingTime(point.time);

//         if (
//           time === null ||
//           !Number.isFinite(point.value)
//         ) {
//           return [];
//         }

//         return [{ time, value: point.value }];
//       });
//     }

//     // Sort chronologically and remove duplicate timestamps.
//     const uniqueValues = new Map<
//       string,
//       { time: Time; value: number }
//     >();

//     for (const point of values) {
//       uniqueValues.set(String(point.time), point);
//     }

//     const data = Array.from(uniqueValues.values()).sort(
//       (a, b) => {
//         const timeValue = (time: Time): number => {
//           if (typeof time === "number") {
//             return time;
//           }

//           if (typeof time === "string") {
//             return /^\d{4}-\d{2}-\d{2}$/.test(time)
//               ? Date.parse(`${time}T00:00:00Z`)
//               : Date.parse(time);
//           }

//           return Date.UTC(
//             time.year,
//             time.month - 1,
//             time.day
//           );
//         };

//         return timeValue(a.time) - timeValue(b.time);
//       }
//     );

//     if (data.length === 0) {
//       continue;
//     }

//     // const series = chart.addSeries(LineSeries, {
//     //   title: drawing.name,
//     //   color: drawing.color,
//     //   lineWidth: (drawing.width ?? 2) as 1 | 2 | 3 | 4,
//     //   lineStyle:
//     //     drawing.style === "dashed"
//     //       ? 2
//     //       : drawing.style === "dotted"
//     //         ? 1
//     //         : 0,
//     //   priceLineVisible: false,
//     //   lastValueVisible: true,
//     //   crosshairMarkerVisible: false,
//     // });


// const isStochastic =
//   /stochastic|overbought\s*\(80\)|oversold\s*\(20\)/i.test(
//     drawing.name
//   );

// const isADX =
//   /\bADX\b|\+\s*DI|-\s*DI/i.test(drawing.name);

// const isATR = /\bATR\b/i.test(drawing.name);

// const isRelativeVolume =
//   /relative\s*volume/i.test(drawing.name);

// const isOBV =
//   /\bOBV\b|on[- ]balance volume/i.test(drawing.name);

// const isDivergence =
//   /divergence/i.test(drawing.name);

// const isVolumeProfile =
//   /volume\s*profile|volumeprofile|volume\s*by\s*price/i.test(
//     drawing.name
//   );


  

// const series = chart.addSeries(
//   LineSeries,
//   {
//     title: drawing.name,
//     color: drawing.color,
//     lineWidth: (drawing.width ?? 2) as 1 | 2 | 3 | 4,
//     lineStyle:
//       drawing.style === "dashed"
//         ? 2
//         : drawing.style === "dotted"
//           ? 1
//           : 0,
//     priceLineVisible: false,
//     lastValueVisible: true,
//     crosshairMarkerVisible: false,

//     ...(isStochastic
//       ? {
//           autoscaleInfoProvider: () => ({
//             priceRange: {
//               minValue: 0,
//               maxValue: 100,
//             },
//           }),
//         }
//       : {}),
//   }
// );





// if (isStochastic && stochasticPane) {
//   series.moveToPane(stochasticPane.paneIndex());
// }

// if (isADX && adxPane) {
//   series.moveToPane(adxPane.paneIndex());
// }

// if (isATR && atrPane) {
//   series.moveToPane(atrPane.paneIndex());
// }

// if (isRelativeVolume && volumeAnalysisPane) {
//   series.moveToPane(volumeAnalysisPane.paneIndex());
// }

// if (isOBV && obvPane) {
//   series.moveToPane(obvPane.paneIndex());
// }

// if (isDivergence && divergencePane) {
//   series.moveToPane(divergencePane.paneIndex());
// }

// if (isVolumeProfile && volumeProfilePane) {
//   series.moveToPane(volumeProfilePane.paneIndex());
// }



// // if (isStochastic || isADX || isATR || isRelativeVolume) {
// if (
//   isStochastic ||
//   isADX ||
//   isATR ||
//   isRelativeVolume ||
//   isOBV ||
//   isDivergence ||
//   isVolumeProfile
// ) {
//   series.priceScale().applyOptions({
//     autoScale: true,
//     scaleMargins: {
//       top: 0.08,
//       bottom: 0.08,
//     },
//   });
// }

// series.setData(data);
// aiIndicatorSeriesRef.current.push(series);



//   }

//   chart.timeScale().applyOptions({});
// }, [aiDrawings, bars, advanced, range, indicators]);

//   /* ============================================================
//      DRAWING RERENDER
//   ============================================================ */

//   useEffect(() => {
//     requestAnimationFrame(() => {
//       renderDrawings();
//       renderAiPriceLines();
//     });
//   }, [
//     selectedColor,
//     selectedTool,
//     aiLinesVisible,
//     renderDrawings,
//     renderAiPriceLines,
//   ]);


  
//   /* ============================================================
//      TOOL SELECT
//   ============================================================ */

//   const selectTool = (
//     tool: DrawingTool
//   ) => {
//     setSelectedTool(tool);

//     if (tool === "cursor") {
//       currentDrawingRef.current =
//         null;

//       isDrawingRef.current =
//         false;
//     }

//     requestAnimationFrame(
//       renderDrawings
//     );
//   };


// // function getAiPriceRange() {
// //   const prices = aiLinesRef.current
// //     .filter(
// //       line =>
// //         line.visible !== false &&
// //         typeof line.horizontalPrice === "number" &&
// //         Number.isFinite(line.horizontalPrice)
// //     )
// //     .map(line => line.horizontalPrice as number);

// //   if (prices.length === 0) {
// //     return null;
// //   }

// //   return {
// //     minValue: Math.min(...prices),
// //     maxValue: Math.max(...prices),
// //   };
// // }



//   /* ============================================================
//      INDICATOR ITEMS
//   ============================================================ */

//   const indicatorItems: {
//     key: IndicatorKey;
//     label: string;
//     color: string;
//   }[] = [
//     {
//       key: "ema20",
//       label: "EMA 20",
//       color: "#a566ff",
//     },
//     {
//       key: "sma20",
//       label: "SMA 20",
//       color: "#28dc9b",
//     },
//     {
//       key: "sma50",
//       label: "SMA 50",
//       color: "#f4bf32",
//     },
//     {
//       key: "sma200",
//       label: "SMA 200",
//       color: "#ff5064",
//     },
//     {
//       key: "volume",
//       label: "Volume",
//       color: "#4da3ff",
//     },
//   ];



// function normalizeDrawingTime(
//   value: string | number
// ): Time | null {
//   if (typeof value === "number") {
//     if (!Number.isFinite(value)) return null;

//     return (
//       value > 1e12
//         ? Math.floor(value / 1000)
//         : Math.floor(value)
//     ) as Time;
//   }

//   const input = value.trim();

//   if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
//     return input as Time;
//   }

//   const milliseconds = Date.parse(input);

//   if (!Number.isFinite(milliseconds)) {
//     return null;
//   }

//   return Math.floor(milliseconds / 1000) as Time;
// }


  
//   /* ============================================================
//      UI
//   ============================================================ */

//   return (
//     <div className="relative h-full w-full min-h-0 overflow-hidden bg-[#0b0b0f]">
//       {/* LOADING */}

//       {loading && (
//         <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0b0f]">
//           <div className="flex items-center gap-2 font-mono text-[10px] text-[#777b86]">
//             <span className="h-2 w-2 animate-pulse rounded-full bg-[#8b3dff]" />
//             Loading chart...
//           </div>
//         </div>
//       )}

//       {/* ERROR */}

//       {!loading && error && (
//         <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0b0f]">
//           <div className="max-w-[420px] px-6 text-center">
//             <div className="mb-2 font-mono text-[12px] text-[#ff5064]">
//               Chart data unavailable
//             </div>

//             <div className="font-mono text-[10px] leading-5 text-[#666a75]">
//               {error}
//             </div>

//             <button
//               onClick={() =>
//                 window.location.reload()
//               }
//               className="mt-4 rounded-[4px] border border-[#292932] bg-[#14141a] px-3 py-2 font-mono text-[10px] text-[#9b9da7] hover:bg-[#1b1b23] hover:text-white"
//             >
//               Retry
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ADVANCED TOOLBAR */}

//       {advanced && (
//         <div className="absolute left-0 right-0 top-0 z-40 flex h-[40px] items-center border-b border-[#202027] bg-[#0d0d11] px-2">
//           <div className="flex items-center gap-0.5">
//             <button
//               onClick={() =>
//                 selectTool("cursor")
//               }
//               title="Cursor"
//               className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] text-[13px] transition ${
//                 selectedTool ===
//                 "cursor"
//                   ? "bg-[#292334] text-[#c28cff]"
//                   : "text-[#737681] hover:bg-[#19191f] hover:text-white"
//               }`}
//             >
//               ↖
//             </button>

//             <button
//               onClick={() =>
//                 selectTool("trendline")
//               }
//               title="Trend Line"
//               className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] text-[14px] transition ${
//                 selectedTool ===
//                 "trendline"
//                   ? "bg-[#292334] text-[#c28cff]"
//                   : "text-[#737681] hover:bg-[#19191f] hover:text-white"
//               }`}
//             >
//               ╱
//             </button>

//             <button
//               onClick={() =>
//                 selectTool("horizontal")
//               }
//               title="Horizontal Line"
//               className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] text-[14px] transition ${
//                 selectedTool ===
//                 "horizontal"
//                   ? "bg-[#292334] text-[#c28cff]"
//                   : "text-[#737681] hover:bg-[#19191f] hover:text-white"
//               }`}
//             >
//               ─
//             </button>

//             <button
//               onClick={() =>
//                 selectTool("rectangle")
//               }
//               title="Rectangle"
//               className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] text-[13px] transition ${
//                 selectedTool ===
//                 "rectangle"
//                   ? "bg-[#292334] text-[#c28cff]"
//                   : "text-[#737681] hover:bg-[#19191f] hover:text-white"
//               }`}
//             >
//               □
//             </button>

//             <button
//               onClick={() =>
//                 selectTool("text")
//               }
//               title="Text"
//               className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] font-mono text-[12px] transition ${
//                 selectedTool === "text"
//                   ? "bg-[#292334] text-[#c28cff]"
//                   : "text-[#737681] hover:bg-[#19191f] hover:text-white"
//               }`}
//             >
//               T
//             </button>
//           </div>

//           <div className="mx-2 h-[20px] w-px bg-[#25252d]" />

//           <div className="flex items-center gap-1">
//             {TOOL_COLORS.map(
//               color => (
//                 <button
//                   key={color}
//                   onClick={() =>
//                     setSelectedColor(
//                       color
//                     )
//                   }
//                   title="Drawing color"
//                   className={`flex h-[24px] w-[24px] items-center justify-center rounded-full border ${
//                     selectedColor === color
//                       ? "border-white"
//                       : "border-transparent"
//                   }`}
//                 >
//                   <span
//                     className="h-[10px] w-[10px] rounded-full"
//                     style={{
//                       backgroundColor:
//                         color,
//                     }}
//                   />
//                 </button>
//               )
//             )}
//           </div>

//           <div className="mx-2 h-[20px] w-px bg-[#25252d]" />

//           <button
//             onClick={undo}
//             title="Undo (Ctrl+Z)"
//             className="flex h-[28px] w-[30px] items-center justify-center rounded-[4px] text-[15px] text-[#777b86] transition hover:bg-[#19191f] hover:text-white"
//           >
//             ↶
//           </button>

//           <button
//             onClick={redo}
//             title="Redo (Ctrl+Y)"
//             className="flex h-[28px] w-[30px] items-center justify-center rounded-[4px] text-[15px] text-[#777b86] transition hover:bg-[#19191f] hover:text-white"
//           >
//             ↷
//           </button>

//           <div className="mx-2 h-[20px] w-px bg-[#25252d]" />

//           <div className="relative">
//             <button
//               onClick={() =>
//                 setIndicatorsOpen(
//                   value => !value
//                 )
//               }
//               title="Indicators"
//               className={`flex h-[28px] items-center gap-1.5 rounded-[4px] px-2 font-mono text-[10px] transition ${
//                 indicatorsOpen
//                   ? "bg-[#292334] text-[#c28cff]"
//                   : "text-[#858894] hover:bg-[#19191f] hover:text-white"
//               }`}
//             >
//               <span>ƒx</span>

//               <span>
//                 Indicators
//               </span>

//               <span className="ml-1 text-[8px]">
//                 {indicatorsOpen
//                   ? "▲"
//                   : "▼"}
//               </span>
//             </button>

//             {indicatorsOpen && (
//               <div className="absolute left-0 top-[34px] z-[100] w-[190px] overflow-hidden rounded-[6px] border border-[#292932] bg-[#111116] shadow-[0_12px_35px_rgba(0,0,0,0.5)]">
//                 <div className="border-b border-[#24242c] px-3 py-2">
//                   <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#555963]">
//                     Indicators
//                   </div>
//                 </div>

//                 {indicatorItems.map(
//                   item => {
//                     const enabled =
//                       indicators[
//                         item.key
//                       ];

//                     return (
//                       <button
//                         key={
//                           item.key
//                         }
//                         onClick={() =>
//                           toggleIndicator(
//                             item.key
//                           )
//                         }
//                         className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-[#19191f]"
//                       >
//                         <span
//                           className="h-[8px] w-[8px] rounded-full"
//                           style={{
//                             backgroundColor:
//                               item.color,
//                             opacity:
//                               enabled
//                                 ? 1
//                                 : 0.25,
//                           }}
//                         />

//                         <span className="flex-1 font-mono text-[10px] text-[#9b9da7]">
//                           {
//                             item.label
//                           }
//                         </span>

//                         <span
//                           className={`flex h-[14px] w-[14px] items-center justify-center rounded-[3px] border text-[9px] ${
//                             enabled
//                               ? "border-[#8b3dff] bg-[#8b3dff] text-white"
//                               : "border-[#34343d] text-transparent"
//                           }`}
//                         >
//                           ✓
//                         </span>
//                       </button>
//                     );
//                   }
//                 )}

//                 <div className="border-t border-[#24242c] px-3 py-2">
//                   <button
//                     onClick={() =>
//                       setIndicators(
//                         DEFAULT_INDICATORS
//                       )
//                     }
//                     className="font-mono text-[9px] text-[#666a75] hover:text-white"
//                   >
//                     Reset indicators
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* AI LINE TOGGLE */}

//           {aiLines.length > 0 && (
//             <>
//               <div className="mx-2 h-[20px] w-px bg-[#25252d]" />

//               <button
//                 onClick={() =>
//                   setAiLinesVisible(
//                     value => !value
//                   )
//                 }
//                 title="Show / hide AI lines"
//                 className={`flex h-[28px] items-center gap-1.5 rounded-[4px] px-2 font-mono text-[10px] transition ${
//                   aiLinesVisible
//                     ? "bg-[#292334] text-[#c28cff]"
//                     : "text-[#777b86] hover:bg-[#19191f] hover:text-white"
//                 }`}
//               >
//                 <span>AI</span>

//                 <span className="text-[8px]">
//                   {aiLinesVisible
//                     ? "●"
//                     : "○"}
//                 </span>
//               </button>
//             </>
//           )}

//           <div className="ml-auto flex items-center gap-3">
//             <span className="font-mono text-[9px] text-[#555963]">
//               {currentSymbol}
//             </span>

//             <span className="h-1.5 w-1.5 rounded-full bg-[#28dc9b]" />

//             <span className="font-mono text-[9px] text-[#555963]">
//               UPSTOX
//             </span>
//           </div>
//         </div>
//       )}

//       {/* CHART */}

//       <div
//         ref={containerRef}
//         className={`absolute left-0 right-0 w-full overflow-hidden ${
//           advanced
//             ? "top-[40px] bottom-[42px]"
//             : "top-0 bottom-[42px]"
//         } ${
//           advanced &&
//           selectedTool !== "cursor"
//             ? "cursor-crosshair"
//             : ""
//         }`}
//         onPointerDown={
//           advanced
//             ? handlePointerDown
//             : undefined
//         }
//         onPointerMove={
//           advanced
//             ? handlePointerMove
//             : undefined
//         }
//         onPointerUp={
//           advanced
//             ? finishDrawing
//             : undefined
//         }
//         onPointerCancel={
//           advanced
//             ? finishDrawing
//             : undefined
//         }
//       >
//         {/* {advanced && (
//           // <svg
//           //   ref={drawingLayerRef}
//           //   className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
//           // />
//           // <svg
//           //   ref={drawingLayerRef}
//           //   className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
//           // />
//           <svg
//               ref={drawingLayerRef}
//               className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
//             />
//         )} */}
//         <svg
//               ref={drawingLayerRef}
//               className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
//             />
//       </div>



//             {/* INDICATOR LEGEND */}
//       {/* {advanced && (
//         <div className="absolute left-3 top-[46px] z-30 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-[#25252d] bg-[#0b0b0f]/90 px-3 py-2">
//           {indicatorItems
//             .filter(
//               (item) =>
//                 item.key !== "volume" &&
//                 indicators[item.key]
//             )
//             .map((item) => (
//               <div
//                 key={item.key}
//                 className="flex items-center gap-1.5 font-mono text-[10px]"
//                 title={item.label}
//               >
//                 <span
//                   className="h-[2px] w-4 rounded-full"
//                   style={{
//                     backgroundColor: item.color,
//                   }}
//                 />
//                 <span style={{ color: item.color }}>
//                   {item.label}
//                 </span>
//               </div>
//             ))}

//           {advanced &&
//             !indicators.ema20 &&
//             !indicators.sma20 &&
//             !indicators.sma50 &&
//             !indicators.sma200 && (
//               <span className="font-mono text-[10px] text-[#777b86]">
//                 No price indicators enabled
//               </span>
//             )}
//         </div>
//       )} */}
//        {/* INDICATOR LEGEND */}
//       {advanced && (
//         <div className="absolute left-3 top-[46px] z-30 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-[#25252d] bg-[#0b0b0f]/90 px-3 py-2">
//           {indicatorItems
//             .filter(
//               (item) =>
//                 item.key !== "volume" && indicators[item.key]
//             )
//             .map((item) => (
//               <div
//                 key={item.key}
//                 className="flex items-center gap-1.5 font-mono text-[10px]"
//               >
//                 <span
//                   className="h-[2px] w-4 rounded-full"
//                   style={{ backgroundColor: item.color }}
//                 />
//                 <span style={{ color: item.color }}>{item.label}</span>
//               </div>
//             ))}

//           {aiDrawings
//             .filter(
//               (drawing) => drawing.type === "series"
//             )
//             .map((drawing) => (
//               <div
//                 key={drawing.id}
//                 className="flex items-center gap-1.5 font-mono text-[10px]"
//               >
//                 <span
//                   className="h-[2px] w-4 rounded-full"
//                   style={{ backgroundColor: drawing.color }}
//                 />
//                 <span style={{ color: drawing.color }}>
//                   {drawing.name}
//                 </span>
//               </div>
//             ))}
//         </div>
//       )}




//       {/* RANGE BAR */}

//       <div className="absolute bottom-0 left-0 right-0 z-40 flex h-[42px] items-center gap-1 border-t border-[#202027] bg-[#0d0d11] px-4">
//         {RANGES.map(item => {
//           const active =
//             item === range;

//           return (
//             <button
//               key={item}
//               onClick={() =>
//                 changeRange(item)
//               }
//               className={`h-[28px] rounded-[3px] px-2.5 font-mono text-[10px] font-medium transition ${
//                 active
//                   ? "bg-[#25202f] text-white"
//                   : "text-[#777b86] hover:bg-[#18181f] hover:text-white"
//               }`}
//             >
//               {item}
//             </button>
//           );
//         })}

//         <div className="ml-auto flex items-center gap-2 font-mono text-[9px] text-[#555963]">
//           <span className="h-1.5 w-1.5 rounded-full bg-[#28dc9b]" />

//           UPSTOX • NSE
//         </div>
//       </div>
//     </div>
//   );
// }























"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { PointerEvent as ReactPointerEvent } from "react";

import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

/* ============================================================
   TYPES
============================================================ */

// export type TradingViewChartProps = {
//   symbol: string;
//   advanced?: boolean;
//   onRangeChange?: (range: Range) => void;

//   livePrice?: number | null;
//   liveVolume?: number | null;

//   aiLines?: AiChartLine[];
// };


export type TradingMode = "Day" | "Swing" | "Long-term";

export type TradingViewChartProps = {
  symbol: string;
  advanced?: boolean;
  tradingMode?: TradingMode;
  requestedRange?: Range;
  onRangeChange?: (range: Range) => void;
  livePrice?: number | null;
  liveVolume?: number | null;
  aiLines?: AiChartLine[];
  aiDrawings?: AiChartDrawing[];
};

export type Range =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "YTD"
  | "1Y"
  | "5Y"
  | "All";

export type DrawingTool =
  | "cursor"
  | "trendline"
  | "horizontal"
  | "rectangle"
  | "text";

export type DrawingPoint = {
  time: Time;
  price: number;
};

export type Drawing = {
  id: number;
  type: Exclude<DrawingTool, "cursor">;
  start: DrawingPoint;
  end?: DrawingPoint;
  color: string;
  text?: string;
};

/* ============================================================
   AI LINE TYPES
============================================================ */

export type AiLinePoint = {
  time: Time;
  price: number;
};

export type AiChartLine = {
  id: string;
  name: string;
  color: string;

  /**
   * Normal point-to-point indicator line.
   */
  points: AiLinePoint[];

  /**
   * Horizontal AI price level.
   *
   * Example:
   * Support ₹12.63
   * Resistance ₹14.75
   */
  horizontalPrice?: number;

  width?: number;
  dashed?: boolean;
  visible?: boolean;
};


export type AiChartDrawing =
  | {
      type: "straightLine";
      id: string;
      start: { time: string | number; price: number };
      end: { time: string | number; price: number };
      color: string;
      width?: number;
      style?: "solid" | "dashed" | "dotted";
    }
  | {
      type: "point";
      id: string;
      time: string | number;
      price: number;
      text?: string;
      color: string;
      marker?: "circle" | "arrowUp" | "arrowDown";
    }
  | {
      type: "series";
      id: string;
      name: string;
      source: "candles" | "values";
      indicator?: "SMA" | "EMA";
      period?: number;
      values?: {
        time: string | number;
        value: number;
      }[];
      color: string;
      width?: number;
      style?: "solid" | "dashed" | "dotted";
    }
  | {
      type: "rectangle";
      id: string;
      startTime: string | number;
      endTime: string | number;
      top: number;
      bottom: number;
      color: string;
      opacity?: number;
      label?: string;
    };

export function createAiLine(
  name: string,
  color: string,
  points: AiLinePoint[],
  options?: {
    id?: string;
    width?: number;
    dashed?: boolean;
    visible?: boolean;
    horizontalPrice?: number;
  }
): AiChartLine {
  return {
    id:
      options?.id ??
      `${name}-${Date.now()}`,
    name,
    color,
    points,
    width: options?.width ?? 2,
    dashed: options?.dashed ?? false,
    visible: options?.visible ?? true,
    horizontalPrice:
      options?.horizontalPrice,
  };
}

/* ============================================================
   OTHER TYPES
============================================================ */

type StockBar = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type ApiResponse = {
  success?: boolean;
  symbol?: string;
  range?: string;
  data?: StockBar[];
  bars?: StockBar[];
  candles?: StockBar[];
  error?: string;
  message?: string;
};

export type IndicatorKey =
  | "ema20"
  | "sma20"
  | "sma50"
  | "sma200"
  | "volume";

type IndicatorState = Record<
  IndicatorKey,
  boolean
>;

/* ============================================================
   CONSTANTS
============================================================ */

const RANGES: Range[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "5Y",
  "All",
];

const TOOL_COLORS = [
  "#a566ff",
  "#28dc9b",
  "#ff5064",
  "#f4bf32",
  "#4da3ff",
];

const DEFAULT_INDICATORS: IndicatorState = {
  ema20: false,
  sma20: false,
  sma50: false,
  sma200: false,
  volume: true,
};




/* ============================================================
   HELPERS
============================================================ */

function rangeToApi(range: Range) {
  return range === "All"
    ? "All"
    : range;
}

function cleanSymbol(symbol: string) {
  return decodeURIComponent(symbol)
    .replace(/^NSE:/i, "")
    .trim()
    .toUpperCase();
}

function normalizeTime(
  value: unknown
): Time | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    if (value > 10_000_000_000) {
      return Math.floor(
        value / 1000
      ) as Time;
    }

    return Math.floor(value) as Time;
  }

  if (typeof value === "string") {
    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return normalizeTime(numeric);
    }

    const parsed = Date.parse(value);

    if (Number.isFinite(parsed)) {
      return Math.floor(
        parsed / 1000
      ) as Time;
    }
  }

  return null;
}

function normalizeBar(
  raw: unknown
): StockBar | null {
  if (
    typeof raw !== "object" ||
    raw === null
  ) {
    return null;
  }

  const item =
    raw as Record<string, unknown>;

  const time = normalizeTime(
    item.time ??
      item.timestamp ??
      item.ts ??
      item.date ??
      item.datetime
  );

  const open = Number(
    item.open ?? item.o
  );

  const high = Number(
    item.high ?? item.h
  );

  const low = Number(
    item.low ?? item.l
  );

  const close = Number(
    item.close ?? item.c
  );

  const volume = Number(
    item.volume ??
      item.v ??
      0
  );

  if (
    time === null ||
    !Number.isFinite(open) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    !Number.isFinite(close)
  ) {
    return null;
  }

  return {
    time,
    open,
    high,
    low,
    close,
    volume: Number.isFinite(volume)
      ? volume
      : 0,
  };
}

function extractBars(
  json: ApiResponse
): StockBar[] {
  const source =
    json.data ??
    json.bars ??
    json.candles ??
    [];

  if (!Array.isArray(source)) {
    return [];
  }

  const normalized = source
    .map(normalizeBar)
    .filter(
      (
        item
      ): item is StockBar =>
        item !== null
    );

  normalized.sort(
    (a, b) =>
      Number(a.time) -
      Number(b.time)
  );

  const unique: StockBar[] = [];
  const seen = new Set<string>();

  for (const bar of normalized) {
    const key = String(bar.time);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(bar);
  }

  return unique;
}

/* ============================================================
   INDICATORS
============================================================ */

function calculateSMA(
  bars: StockBar[],
  period: number
): {
  time: Time;
  value: number;
}[] {
  if (bars.length < period) {
    return [];
  }

  const result: {
    time: Time;
    value: number;
  }[] = [];

  let sum = 0;

  for (
    let i = 0;
    i < bars.length;
    i++
  ) {
    sum += bars[i].close;

    if (i >= period) {
      sum -=
        bars[i - period].close;
    }

    if (i >= period - 1) {
      result.push({
        time: bars[i].time,
        value: sum / period,
      });
    }
  }

  return result;
}

function calculateEMA(
  bars: StockBar[],
  period: number
): {
  time: Time;
  value: number;
}[] {
  if (bars.length < period) {
    return [];
  }

  const result: {
    time: Time;
    value: number;
  }[] = [];

  let ema =
    bars
      .slice(0, period)
      .reduce(
        (sum, bar) =>
          sum + bar.close,
        0
      ) / period;

  const multiplier =
    2 / (period + 1);

  result.push({
    time: bars[period - 1].time,
    value: ema,
  });

  for (
    let i = period;
    i < bars.length;
    i++
  ) {
    ema =
      (bars[i].close - ema) *
        multiplier +
      ema;

    result.push({
      time: bars[i].time,
      value: ema,
    });
  }

  return result;
}

/* ============================================================
   COMPONENT
============================================================ */


// export default function TradingViewChart({
//   symbol,
//   advanced = false,
//   tradingMode,
//   requestedRange,
//   onRangeChange,
//   aiLines = [],
//   livePrice,
//   liveVolume,
// }: TradingViewChartProps) {

export default function TradingViewChart({
  symbol,
  advanced = false,
  tradingMode,
  requestedRange,
  onRangeChange,
  aiLines = [],
  aiDrawings = [],
  livePrice,
  liveVolume,
}: TradingViewChartProps) {


  /* ==========================================================
     DOM / CHART REFS
  ========================================================== */

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const chartRef =
    useRef<IChartApi | null>(
      null
    );

  const candleSeriesRef =
    useRef<
      ISeriesApi<"Candlestick"> | null
    >(null);

  const lineSeriesRef =
    useRef<
      ISeriesApi<"Line"> | null
    >(null);

  const emaSeriesRef =
    useRef<
      ISeriesApi<"Line"> | null
    >(null);

  const sma20SeriesRef =
    useRef<
      ISeriesApi<"Line"> | null
    >(null);

  const sma50SeriesRef =
    useRef<
      ISeriesApi<"Line"> | null
    >(null);

  const sma200SeriesRef =
    useRef<
      ISeriesApi<"Line"> | null
    >(null);

  const volumeSeriesRef =
    useRef<
      ISeriesApi<"Histogram"> | null
    >(null);

  /* ==========================================================
     AI PRICE LINE REFS

     IMPORTANT:
     IPriceLine itself does NOT have remove().
     It must be removed using series.removePriceLine().
  ========================================================== */

  const aiIndicatorSeriesRef =
  useRef<ISeriesApi<"Line">[]>([]);

  const aiPriceLinesRef =
    useRef<IPriceLine[]>([]);

    const aiPaneRefs = useRef<
  Map<string, ReturnType<IChartApi["panes"]>[number]>
>(new Map());

  /* ==========================================================
     DRAWING REFS
  ========================================================== */

  const drawingLayerRef =
    useRef<SVGSVGElement | null>(
      null
    );

  const drawingToolRef =
    useRef<DrawingTool>("cursor");

  const drawingColorRef =
    useRef<string>(
      TOOL_COLORS[0]
    );

  const drawingsRef =
    useRef<Drawing[]>([]);

  const undoStackRef =
    useRef<Drawing[][]>([]);

  const redoStackRef =
    useRef<Drawing[][]>([]);

  const currentDrawingRef =
    useRef<Drawing | null>(null);

  const isDrawingRef =
    useRef(false);

  const nextDrawingIdRef =
    useRef(1);

  /* ==========================================================
     LIVE DATA REFS
  ========================================================== */

  const barsRef =
    useRef<StockBar[]>([]);

  const latestLivePriceRef =
    useRef<number | null>(null);

  const aiLinesRef =
    useRef<AiChartLine[]>(aiLines);

  const aiDrawingsRef =
  useRef<AiChartDrawing[]>(aiDrawings);

  /* ==========================================================
     STATE
  ========================================================== */

  const [range, setRange] =
    useState<Range>("1D");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [bars, setBars] =
    useState<StockBar[]>([]);

  const [
    selectedTool,
    setSelectedTool,
  ] =
    useState<DrawingTool>(
      "cursor"
    );

  const [
    selectedColor,
    setSelectedColor,
  ] =
    useState(TOOL_COLORS[0]);

  const [
    indicators,
    setIndicators,
  ] =
    useState<IndicatorState>(
      DEFAULT_INDICATORS
    );

  const [
    indicatorsOpen,
    setIndicatorsOpen,
  ] =
    useState(false);

  const [
    aiLinesVisible,
    setAiLinesVisible,
  ] =
    useState(true);

const aiLinesVisibleRef = useRef(aiLinesVisible);
aiLinesVisibleRef.current = aiLinesVisible;

  const [, forceDrawingRender] =
    useState(0);

  const currentSymbol =
    cleanSymbol(symbol);

  /* ============================================================
     SYNC BARS REF
  ============================================================ */

  useEffect(() => {
    barsRef.current = bars;
  }, [bars]);



  /* ============================================================
     DRAWING COORDINATES
  ============================================================ */

  const pointToChartValue =
    useCallback(
      (
        clientX: number,
        clientY: number
      ): DrawingPoint | null => {
        const container =
          containerRef.current;

        const chart =
          chartRef.current;

        if (!container || !chart) {
          return null;
        }

        const rect =
          container.getBoundingClientRect();

        const x =
          clientX - rect.left;

        const y =
          clientY - rect.top;

        const time =
          chart
            .timeScale()
            .coordinateToTime(x);

        let price:
          | number
          | null = null;

        if (
          candleSeriesRef.current
        ) {
          price =
            candleSeriesRef.current.coordinateToPrice(
              y
            );
        } else if (
          lineSeriesRef.current
        ) {
          price =
            lineSeriesRef.current.coordinateToPrice(
              y
            );
        }

        if (
          time === null ||
          time === undefined ||
          price === null ||
          price === undefined ||
          !Number.isFinite(price)
        ) {
          return null;
        }

        return {
          time,
          price: Number(price),
        };
      },
      []
    );

  /* ============================================================
     DRAWING RENDER
  ============================================================ */

  const renderDrawings =
    useCallback(() => {
      const svg =
        drawingLayerRef.current;

      const chart =
        chartRef.current;

      if (!svg || !chart) {
        return;
      }

      const width =
        svg.clientWidth;

      const height =
        svg.clientHeight;

      svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
      );

      while (svg.firstChild) {
        svg.removeChild(
          svg.firstChild
        );
      }

      const timeScale =
        chart.timeScale();

      const activeSeries =
        candleSeriesRef.current ??
        lineSeriesRef.current;

      if (!activeSeries) {
        return;
      }

      const priceToY = (
        price: number
      ) =>
        activeSeries.priceToCoordinate(
          price
        );

      const drawLine = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        widthValue = 2,
        dashed = false
      ) => {
        const line =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );

        line.setAttribute(
          "x1",
          String(x1)
        );

        line.setAttribute(
          "y1",
          String(y1)
        );

        line.setAttribute(
          "x2",
          String(x2)
        );

        line.setAttribute(
          "y2",
          String(y2)
        );

        line.setAttribute(
          "stroke",
          color
        );

        line.setAttribute(
          "stroke-width",
          String(widthValue)
        );

        line.setAttribute(
          "vector-effect",
          "non-scaling-stroke"
        );

        line.setAttribute(
          "stroke-linecap",
          "round"
        );

        if (dashed) {
          line.setAttribute(
            "stroke-dasharray",
            "7 5"
          );
        }

        svg.appendChild(line);
      };

      const drawRect = (
        x: number,
        y: number,
        rectWidth: number,
        rectHeight: number,
        color: string
      ) => {
        const rect =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );

        rect.setAttribute(
          "x",
          String(x)
        );

        rect.setAttribute(
          "y",
          String(y)
        );

        rect.setAttribute(
          "width",
          String(rectWidth)
        );

        rect.setAttribute(
          "height",
          String(rectHeight)
        );

        rect.setAttribute(
          "fill",
          "transparent"
        );

        rect.setAttribute(
          "stroke",
          color
        );

        rect.setAttribute(
          "stroke-width",
          "2"
        );

        rect.setAttribute(
          "vector-effect",
          "non-scaling-stroke"
        );

        svg.appendChild(rect);
      };

      const drawText = (
        x: number,
        y: number,
        text: string,
        color: string
      ) => {
        const element =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );

        element.setAttribute(
          "x",
          String(x)
        );

        element.setAttribute(
          "y",
          String(y)
        );

        element.setAttribute(
          "fill",
          color
        );

        element.setAttribute(
          "font-size",
          "13"
        );

        element.setAttribute(
          "font-family",
          "Inter, Arial, sans-serif"
        );

        element.setAttribute(
          "font-weight",
          "500"
        );

        element.textContent = text;

        svg.appendChild(element);
      };

      /* ========================================================
         USER DRAWINGS
      ======================================================== */

      for (
        const drawing of
          drawingsRef.current
      ) {
        const startX =
          timeScale.timeToCoordinate(
            drawing.start.time
          );

        const startY =
          priceToY(
            drawing.start.price
          );

        if (
          startX === null ||
          startX === undefined ||
          startY === null ||
          startY === undefined
        ) {
          continue;
        }

        if (
          drawing.type ===
          "horizontal"
        ) {
          drawLine(
            0,
            startY,
            width,
            startY,
            drawing.color
          );

          continue;
        }

        if (
          drawing.type === "text"
        ) {
          drawText(
            startX,
            startY,
            drawing.text || "Text",
            drawing.color
          );

          continue;
        }

        if (!drawing.end) {
          continue;
        }

        const endX =
          timeScale.timeToCoordinate(
            drawing.end.time
          );

        const endY =
          priceToY(
            drawing.end.price
          );

        if (
          endX === null ||
          endX === undefined ||
          endY === null ||
          endY === undefined
        ) {
          continue;
        }

        if (
          drawing.type ===
          "trendline"
        ) {
          drawLine(
            startX,
            startY,
            endX,
            endY,
            drawing.color
          );
        }

        if (
          drawing.type ===
          "rectangle"
        ) {
          drawRect(
            Math.min(
              startX,
              endX
            ),
            Math.min(
              startY,
              endY
            ),
            Math.abs(
              endX - startX
            ),
            Math.abs(
              endY - startY
            ),
            drawing.color
          );
        }
      }

      /* ========================================================
         CURRENT DRAWING
      ======================================================== */

      const current =
        currentDrawingRef.current;

      if (
        current &&
        current.end
      ) {
        const startX =
          timeScale.timeToCoordinate(
            current.start.time
          );

        const startY =
          priceToY(
            current.start.price
          );

        const endX =
          timeScale.timeToCoordinate(
            current.end.time
          );

        const endY =
          priceToY(
            current.end.price
          );

        if (
          startX !== null &&
          startX !== undefined &&
          startY !== null &&
          startY !== undefined &&
          endX !== null &&
          endX !== undefined &&
          endY !== null &&
          endY !== undefined
        ) {
          if (
            current.type ===
            "trendline"
          ) {
            drawLine(
              startX,
              startY,
              endX,
              endY,
              current.color
            );
          }

          if (
            current.type ===
            "rectangle"
          ) {
            drawRect(
              Math.min(
                startX,
                endX
              ),
              Math.min(
                startY,
                endY
              ),
              Math.abs(
                endX - startX
              ),
              Math.abs(
                endY - startY
              ),
              current.color
            );
          }
        }
      }

      /* ========================================================
         AI / CUSTOM POINT LINES

         Horizontal AI levels are NOT rendered here.
         They use Lightweight Charts createPriceLine().
      ======================================================== */

      if (aiLinesVisible) {
        for (
          const aiLine of
            aiLinesRef.current
        ) {
          if (
            aiLine.visible === false
          ) {
            continue;
          }

          if (
            aiLine.horizontalPrice !==
            undefined
          ) {
            continue;
          }

          if (
            aiLine.points.length < 2
          ) {
            continue;
          }

          for (
            let i = 0;
            i <
            aiLine.points.length - 1;
            i++
          ) {
            const first =
              aiLine.points[i];

            const second =
              aiLine.points[i + 1];

            const x1 =
              timeScale.timeToCoordinate(
                first.time
              );

            const y1 =
              priceToY(
                first.price
              );

            const x2 =
              timeScale.timeToCoordinate(
                second.time
              );

            const y2 =
              priceToY(
                second.price
              );

            if (
              x1 === null ||
              x1 === undefined ||
              y1 === null ||
              y1 === undefined ||
              x2 === null ||
              x2 === undefined ||
              y2 === null ||
              y2 === undefined
            ) {
              continue;
            }

            drawLine(
              x1,
              y1,
              x2,
              y2,
              aiLine.color,
              aiLine.width ?? 2,
              aiLine.dashed ?? false
            );
          }
        }
      }


/* ========================================================
   AI DRAWING API
======================================================== */

for (const drawing of aiDrawingsRef.current) {
  const toX = (value: string | number) => {
    const time = normalizeDrawingTime(value);
    return time === null
      ? null
      : timeScale.timeToCoordinate(time);
  };

  if (drawing.type === "straightLine") {
    const x1 = toX(drawing.start.time);
    const x2 = toX(drawing.end.time);
    const y1 = priceToY(drawing.start.price);
    const y2 = priceToY(drawing.end.price);

    if (
      x1 == null || x2 == null ||
      y1 == null || y2 == null
    ) continue;

    drawLine(
      x1, y1, x2, y2,
      drawing.color,
      drawing.width ?? 2,
      drawing.style === "dashed" ||
        drawing.style === "dotted"
    );

    continue;
  }

  if (drawing.type === "point") {
    const x = toX(drawing.time);
    const y = priceToY(drawing.price);

    if (x == null || y == null) continue;

    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );

    marker.setAttribute("cx", String(x));
    marker.setAttribute("cy", String(y));
    marker.setAttribute("r", "4");
    marker.setAttribute("fill", drawing.color);
    marker.setAttribute("stroke", "#0b0b0f");
    marker.setAttribute("stroke-width", "1.5");
    svg.appendChild(marker);

    if (drawing.text) {
      drawText(x + 7, y - 7, drawing.text, drawing.color);
    }

    continue;
  }

  if (drawing.type === "rectangle") {
    const x1 = toX(drawing.startTime);
    const x2 = toX(drawing.endTime);
    const y1 = priceToY(drawing.top);
    const y2 = priceToY(drawing.bottom);

    if (
      x1 == null || x2 == null ||
      y1 == null || y2 == null
    ) continue;

    const rect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );

    rect.setAttribute("x", String(Math.min(x1, x2)));
    rect.setAttribute("y", String(Math.min(y1, y2)));
    rect.setAttribute("width", String(Math.abs(x2 - x1)));
    rect.setAttribute("height", String(Math.abs(y2 - y1)));
    rect.setAttribute("fill", drawing.color);
    rect.setAttribute("fill-opacity", String(drawing.opacity ?? 0.12));
    rect.setAttribute("stroke", drawing.color);
    rect.setAttribute("stroke-width", "1.5");

    svg.appendChild(rect);

    if (drawing.label) {
      drawText(
        Math.min(x1, x2) + 5,
        Math.min(y1, y2) + 15,
        drawing.label,
        drawing.color
      );
    }

    continue;
  }
if (drawing.type === "series") {
  // Indicator series are rendered by Lightweight Charts,
  // not manually as SVG segments.
  continue;
}



}


    }, [aiLinesVisible]);


const renderAiPriceLines = useCallback(() => {
  // Use whichever price series currently exists.
  const series =
    candleSeriesRef.current ??
    lineSeriesRef.current;

  // The chart may not have created its series yet.
  if (!series) {
    return;
  }

  // Remove previous AI price lines before recreating them.
  for (const line of aiPriceLinesRef.current) {
    try {
      series.removePriceLine(line);
    } catch {
      // Ignore lines already removed during chart recreation.
    }
  }

  aiPriceLinesRef.current = [];

  if (!aiLinesVisible) {
    return;
  }

  for (const aiLine of aiLinesRef.current) {
    if (aiLine.visible === false) continue;

    const price = aiLine.horizontalPrice;

    if (
      typeof price !== "number" ||
      !Number.isFinite(price)
    ) {
      continue;
    }



const priceLine = series.createPriceLine({
  price: aiLine.horizontalPrice!,
  color: aiLine.color || "#a566ff",
  lineWidth: 2,
  lineStyle: aiLine.dashed ? 2 : 0,
  axisLabelVisible: true,
  title: aiLine.name,
});

console.log("[AI chart line created]", {
  name: aiLine.name,
  price: aiLine.horizontalPrice,
  seriesType: candleSeriesRef.current
    ? "candlestick"
    : "line",
});

aiPriceLinesRef.current.push(priceLine);


  }
}, [aiLinesVisible]);

/* ============================================================
   UPDATE AI LINE REF
============================================================ */

// useEffect(() => {
//   aiLinesRef.current = aiLines;

//   // Wait for React to commit the updated props.
//   const frame = requestAnimationFrame(() => {
//     renderAiPriceLines();
//     renderDrawings();
//   });

//   return () => cancelAnimationFrame(frame);
// }, [aiLines, renderAiPriceLines, renderDrawings]);

useEffect(() => {
  aiLinesRef.current = aiLines;
  aiDrawingsRef.current = aiDrawings;

  const frame = requestAnimationFrame(() => {
    renderAiPriceLines();
    renderDrawings();
  });

  return () => cancelAnimationFrame(frame);
}, [
  aiLines,
  aiDrawings,
  renderAiPriceLines,
  renderDrawings,
]);



// useEffect(() => {
//   const targetRange: Range | undefined =
//     requestedRange ??
//     (tradingMode === "Long-term"
//       ? "6M"
//       : tradingMode === "Swing"
//         ? "1M"
//         : tradingMode === "Intraday"
//           ? "1D"
//           : undefined);

//   if (!targetRange) return;

//   setRange((currentRange) =>
//     currentRange === targetRange
//       ? currentRange
//       : targetRange
//   );

//   onRangeChange?.(targetRange);
// }, [requestedRange, tradingMode, onRangeChange]);




useEffect(() => {
  // StockWorkspace controls the requested timeframe.
  // Do not use the risk level or AI response wording here.
  if (!requestedRange) return;

  setRange((currentRange) =>
    currentRange === requestedRange
      ? currentRange
      : requestedRange
  );
}, [requestedRange]);


  useEffect(() => {
    drawingToolRef.current =
      selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    drawingColorRef.current =
      selectedColor;
  }, [selectedColor]);



  /* ============================================================
     LOAD HISTORICAL DATA
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch(
            `/api/stock/${encodeURIComponent(
              currentSymbol
            )}?range=${encodeURIComponent(
              rangeToApi(range)
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

        const text =
          await response.text();

        let json: ApiResponse;

        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(
            `Stock API returned an invalid response (${response.status}).`
          );
        }

        if (!response.ok) {
          throw new Error(
            json.error ||
              json.message ||
              `Stock API returned ${response.status}.`
          );
        }

        const nextBars =
          extractBars(json);

        if (
          nextBars.length === 0
        ) {
          throw new Error(
            "No chart data was returned for this symbol."
          );
        }

        if (!cancelled) {
          barsRef.current =
            nextBars;

          setBars(nextBars);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Chart data error:",
          err
        );

        barsRef.current = [];
        setBars([]);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load chart data."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [
    currentSymbol,
    range,
  ]);

  /* ============================================================
     RANGE
  ============================================================ */

  const changeRange =
    useCallback(
      (nextRange: Range) => {
        setRange(nextRange);

        onRangeChange?.(
          nextRange
        );
      },
      [onRangeChange]
    );

  /* ============================================================
     UNDO
  ============================================================ */

  const undo =
    useCallback(() => {
      if (
        drawingsRef.current
          .length === 0
      ) {
        return;
      }

      const current = [
        ...drawingsRef.current,
      ];

      const previous =
        undoStackRef.current.pop();

      if (!previous) {
        return;
      }

      redoStackRef.current.push(
        current
      );

      drawingsRef.current = [
        ...previous,
      ];

      currentDrawingRef.current =
        null;

      isDrawingRef.current =
        false;

      forceDrawingRender(
        value => value + 1
      );

      requestAnimationFrame(
        renderDrawings
      );
    }, [renderDrawings]);

  /* ============================================================
     REDO
  ============================================================ */

  const redo =
    useCallback(() => {
      const next =
        redoStackRef.current.pop();

      if (!next) {
        return;
      }

      undoStackRef.current.push([
        ...drawingsRef.current,
      ]);

      drawingsRef.current = [
        ...next,
      ];

      currentDrawingRef.current =
        null;

      isDrawingRef.current =
        false;

      forceDrawingRender(
        value => value + 1
      );

      requestAnimationFrame(
        renderDrawings
      );
    }, [renderDrawings]);

  /* ============================================================
     KEYBOARD
  ============================================================ */

  useEffect(() => {
    function handleKeyboard(
      event: KeyboardEvent
    ) {
      const target =
        event.target as HTMLElement;

      if (
        target.tagName ===
          "INPUT" ||
        target.tagName ===
          "TEXTAREA"
      ) {
        return;
      }

      const modifier =
        event.ctrlKey ||
        event.metaKey;

      if (
        modifier &&
        event.key.toLowerCase() ===
          "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if (
        modifier &&
        event.key.toLowerCase() ===
          "y"
      ) {
        event.preventDefault();

        redo();
      }

      if (event.key === "Escape") {
        setSelectedTool(
          "cursor"
        );

        currentDrawingRef.current =
          null;

        isDrawingRef.current =
          false;

        requestAnimationFrame(
          renderDrawings
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [
    redo,
    undo,
    renderDrawings,
  ]);

  /* ============================================================
     POINTER DOWN
  ============================================================ */

  const handlePointerDown =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>
      ) => {
        const tool =
          drawingToolRef.current;

        if (tool === "cursor") {
          return;
        }

        const point =
          pointToChartValue(
            event.clientX,
            event.clientY
          );

        if (!point) {
          return;
        }

        if (tool === "text") {
          const text =
            window.prompt(
              "Enter text"
            );

          if (
            !text ||
            !text.trim()
          ) {
            return;
          }

          undoStackRef.current.push(
            [
              ...drawingsRef.current,
            ]
          );

          redoStackRef.current = [];

          drawingsRef.current.push({
            id:
              nextDrawingIdRef.current++,
            type: "text",
            start: point,
            color:
              drawingColorRef.current,
            text: text.trim(),
          });

          forceDrawingRender(
            value => value + 1
          );

          requestAnimationFrame(
            renderDrawings
          );

          return;
        }

        if (
          tool === "horizontal"
        ) {
          undoStackRef.current.push(
            [
              ...drawingsRef.current,
            ]
          );

          redoStackRef.current = [];

          drawingsRef.current.push({
            id:
              nextDrawingIdRef.current++,
            type: "horizontal",
            start: point,
            color:
              drawingColorRef.current,
          });

          forceDrawingRender(
            value => value + 1
          );

          requestAnimationFrame(
            renderDrawings
          );

          return;
        }

        isDrawingRef.current =
          true;

        currentDrawingRef.current =
          {
            id:
              nextDrawingIdRef.current++,
            type:
              tool === "rectangle"
                ? "rectangle"
                : "trendline",
            start: point,
            color:
              drawingColorRef.current,
          };

        try {
          event.currentTarget.setPointerCapture(
            event.pointerId
          );
        } catch {
          // Ignore pointer capture errors.
        }

        event.preventDefault();
      },
      [
        pointToChartValue,
        renderDrawings,
      ]
    );

  /* ============================================================
     POINTER MOVE
  ============================================================ */

  const handlePointerMove =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>
      ) => {
        if (
          !isDrawingRef.current
        ) {
          return;
        }

        const current =
          currentDrawingRef.current;

        if (!current) {
          return;
        }

        const point =
          pointToChartValue(
            event.clientX,
            event.clientY
          );

        if (!point) {
          return;
        }

        current.end = point;

        requestAnimationFrame(
          renderDrawings
        );
      },
      [
        pointToChartValue,
        renderDrawings,
      ]
    );

  /* ============================================================
     POINTER UP
  ============================================================ */

  const finishDrawing =
    useCallback(() => {
      if (
        !isDrawingRef.current
      ) {
        return;
      }

      isDrawingRef.current =
        false;

      const current =
        currentDrawingRef.current;

      if (
        current &&
        current.end
      ) {
        undoStackRef.current.push(
          [
            ...drawingsRef.current,
          ]
        );

        redoStackRef.current = [];

        drawingsRef.current.push({
          ...current,
        });
      }

      currentDrawingRef.current =
        null;

      forceDrawingRender(
        value => value + 1
      );

      requestAnimationFrame(
        renderDrawings
      );
    }, [renderDrawings]);

  /* ============================================================
     INDICATOR TOGGLE
  ============================================================ */

  const toggleIndicator =
    useCallback(
      (
        indicator: IndicatorKey
      ) => {
        setIndicators(
          previous => ({
            ...previous,
            [indicator]:
              !previous[indicator],
          })
        );
      },
      []
    );

  /* ============================================================
     LIVE PRICE UPDATE
  ============================================================ */

  const updateChartWithLivePrice =
    useCallback(
      (price: number) => {
        if (
          !Number.isFinite(price)
        ) {
          return;
        }

        latestLivePriceRef.current =
          price;

        const currentBars =
          barsRef.current;

        if (
          currentBars.length === 0
        ) {
          return;
        }

        const lastIndex =
          currentBars.length - 1;

        const lastBar =
          currentBars[lastIndex];

        const updatedBar: StockBar =
          {
            ...lastBar,
            close: price,
            high: Math.max(
              lastBar.high,
              price
            ),
            low: Math.min(
              lastBar.low,
              price
            ),
          };

        barsRef.current = [
          ...currentBars.slice(
            0,
            lastIndex
          ),
          updatedBar,
        ];

        if (
          candleSeriesRef.current
        ) {
          candleSeriesRef.current.update(
            {
              time:
                updatedBar.time,
              open:
                updatedBar.open,
              high:
                updatedBar.high,
              low:
                updatedBar.low,
              close:
                updatedBar.close,
            }
          );
        }

        if (
          lineSeriesRef.current
        ) {
          lineSeriesRef.current.update(
            {
              time:
                updatedBar.time,
              value:
                updatedBar.close,
            }
          );
        }

        if (
          emaSeriesRef.current
        ) {
          const emaData =
            calculateEMA(
              barsRef.current,
              20
            );

          const latest =
            emaData[
              emaData.length - 1
            ];

          if (latest) {
            emaSeriesRef.current.update(
              latest
            );
          }
        }

        if (
          sma20SeriesRef.current
        ) {
          const smaData =
            calculateSMA(
              barsRef.current,
              20
            );

          const latest =
            smaData[
              smaData.length - 1
            ];

          if (latest) {
            sma20SeriesRef.current.update(
              latest
            );
          }
        }

        if (
          sma50SeriesRef.current
        ) {
          const smaData =
            calculateSMA(
              barsRef.current,
              50
            );

          const latest =
            smaData[
              smaData.length - 1
            ];

          if (latest) {
            sma50SeriesRef.current.update(
              latest
            );
          }
        }

        if (
          sma200SeriesRef.current
        ) {
          const smaData =
            calculateSMA(
              barsRef.current,
              200
            );

          const latest =
            smaData[
              smaData.length - 1
            ];

          if (latest) {
            sma200SeriesRef.current.update(
              latest
            );
          }
        }

        requestAnimationFrame(
          renderDrawings
        );

        requestAnimationFrame(
          renderAiPriceLines
        );
      },
      [
        renderDrawings,
        renderAiPriceLines,
      ]
    );

  /* ============================================================
     LISTEN TO LIVE PRICE
  ============================================================ */

  useEffect(() => {
    if (
      livePrice === null ||
      livePrice === undefined ||
      !Number.isFinite(
        livePrice
      )
    ) {
      return;
    }

    updateChartWithLivePrice(
      livePrice
    );
  }, [
    livePrice,
    updateChartWithLivePrice,
  ]);

  /* ============================================================
     CREATE CHART
  ============================================================ */

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * We do NOT manually remove AI price lines
     * before chart.remove().
     *
     * Lightweight Charts removes all series
     * and their price lines when the chart is removed.
     *
     * This also avoids calling methods on a stale
     * series reference.
     */

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    aiPriceLinesRef.current = [];
    aiIndicatorSeriesRef.current = [];

    candleSeriesRef.current =
      null;

    lineSeriesRef.current =
      null;

    emaSeriesRef.current =
      null;

    sma20SeriesRef.current =
      null;

    sma50SeriesRef.current =
      null;

    sma200SeriesRef.current =
      null;

    volumeSeriesRef.current =
      null;

    if (bars.length === 0) {
      return;
    }

    barsRef.current = bars;

    const chart =
      createChart(
        container,
        {
          width:
            container.clientWidth,

          height:
            container.clientHeight,

          layout: {
            background: {
              type:
                ColorType.Solid,
              color:
                "#0b0b0f",
            },

            textColor:
              "#858894",

            fontFamily:
              "Inter, Arial, sans-serif",
          },

          grid: {
            vertLines: {
              color:
                "rgba(255,255,255,0.025)",
            },

            horzLines: {
              color:
                "rgba(255,255,255,0.025)",
            },
          },

          crosshair: {
            mode: 0,

            vertLine: {
              color:
                "rgba(139,61,255,0.45)",
              width: 1,
              style: 0,
              labelBackgroundColor:
                "#8b3dff",
            },

            horzLine: {
              color:
                "rgba(139,61,255,0.45)",
              width: 1,
              style: 0,
              labelBackgroundColor:
                "#8b3dff",
            },
          },

          rightPriceScale: {
            visible: true,

            borderColor:
              "#202027",

            textColor:
              "#858894",

            autoScale: true,

            scaleMargins: {
              top:
                advanced
                  ? 0.08
                  : 0.1,

              bottom:
                advanced
                  ? 0.25
                  : 0.1,
            },
          },

          timeScale: {
            visible: true,

            borderColor:
              "#202027",

            timeVisible: true,

            secondsVisible:
              range === "1D",

            rightOffset:
              advanced
                ? 8
                : 4,

            barSpacing:
              advanced
                ? 9
                : 6,

            minBarSpacing: 2,

            fixLeftEdge: false,

            fixRightEdge: false,

            lockVisibleTimeRangeOnResize:
              true,
          },

          localization: {
            locale: "en-IN",

            priceFormatter:
              (price: number) =>
                `₹${price.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )}`,
          },

          handleScroll: {
            mouseWheel: true,

            pressedMouseMove:
              !advanced,

            horzTouchDrag: true,

            vertTouchDrag: true,
          },

          handleScale: {
            axisPressedMouseMove:
              true,

            mouseWheel: true,

            pinch: true,
          },
        }
      );

    chartRef.current = chart;

    /* ==========================================================
       ADVANCED CANDLESTICKS
    ========================================================== */

    if (advanced) {
     

const candle = chart.addSeries(
  CandlestickSeries,
  {
    upColor: "#28dc9b",
    downColor: "#ff5064",
    borderUpColor: "#28dc9b",
    borderDownColor: "#ff5064",
    wickUpColor: "#28dc9b",
    wickDownColor: "#ff5064",
    borderVisible: true,
    priceLineVisible: true,
    lastValueVisible: true,


  }
);

      candleSeriesRef.current =
        candle;

      candle.setData(
        bars.map(bar => ({
          time: bar.time,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        }))
      );

      /* ========================================================
         EMA 20
      ======================================================== */

      if (indicators.ema20) {
        const ema =
          chart.addSeries(
            LineSeries,
            {
              color:
                "#a566ff",

              lineWidth: 2,

              priceLineVisible:
                false,

              lastValueVisible:
                true,

              title: "EMA 20",

              crosshairMarkerVisible:
                false,
            }
          );

        ema.setData(
          calculateEMA(
            bars,
            20
          )
        );

        emaSeriesRef.current =
          ema;
      }

      /* ========================================================
         SMA 20
      ======================================================== */

      if (indicators.sma20) {
        const sma =
          chart.addSeries(
            LineSeries,
            {
              color:
                "#28dc9b",

              lineWidth: 2,

              priceLineVisible:
                false,

              lastValueVisible:
                true,

                title: "SMA 20",

              crosshairMarkerVisible:
                false,
            }
          );

        sma.setData(
          calculateSMA(
            bars,
            20
          )
        );

        sma20SeriesRef.current =
          sma;
      }

      /* ========================================================
         SMA 50
      ======================================================== */

      if (indicators.sma50) {
        const sma =
          chart.addSeries(
            LineSeries,
            {
              color:
                "#f4bf32",

              lineWidth: 2,

              priceLineVisible:
                false,

              lastValueVisible:
                true,

              title: "SMA 50",

              crosshairMarkerVisible:
                false,
            }
          );

        sma.setData(
          calculateSMA(
            bars,
            50
          )
        );

        sma50SeriesRef.current =
          sma;
      }

      /* ========================================================
         SMA 200
      ======================================================== */

      if (indicators.sma200) {
        const sma =
          chart.addSeries(
            LineSeries,
            {
              color:
                "#ff5064",

              lineWidth: 2,

              priceLineVisible:
                false,

              lastValueVisible:
                true,

              title: "SMA 200",

              crosshairMarkerVisible:
                false,
            }
          );

        sma.setData(
          calculateSMA(
            bars,
            200
          )
        );

        sma200SeriesRef.current =
          sma;
      }

      /* ========================================================
         VOLUME
      ======================================================== */

      if (indicators.volume) {
        const volume =
          chart.addSeries(
            HistogramSeries,
            {
              priceFormat: {
                type: "volume",
              },

              priceScaleId:
                "volume",

              priceLineVisible:
                false,

              lastValueVisible:
                false,

              base: 0,
            }
          );

        volume.setData(
          bars.map(bar => ({
            time: bar.time,

            value:
              bar.volume ?? 0,

            color:
              bar.close >=
              bar.open
                ? "rgba(40,220,155,0.30)"
                : "rgba(255,80,100,0.30)",
          }))
        );

        volumeSeriesRef.current =
          volume;

        chart
          .priceScale("volume")
          .applyOptions({
            scaleMargins: {
              top: 0.82,
              bottom: 0,
            },
          });
      }
    }

    /* ==========================================================
       BASIC LINE CHART
    ========================================================== */

    else {
    

const line = chart.addSeries(
  LineSeries,
  {
    color: "#a566ff",
    lineWidth: 2,
    crosshairMarkerVisible: true,
    priceLineVisible: true,
    lastValueVisible: true,
  }
);

      lineSeriesRef.current =
        line;

      line.setData(
        bars.map(bar => ({
          time: bar.time,
          value: bar.close,
        }))
      );
    }


/* ==========================================================
   SAVED AI INDICATOR SERIES
========================================================== */

    /* ==========================================================
       AI PRICE LINES + DRAWINGS
    ========================================================== */

    requestAnimationFrame(() => {
      renderAiPriceLines();
      renderDrawings();
    });

    /* ==========================================================
       APPLY LATEST LIVE PRICE
    ========================================================== */

    if (
      latestLivePriceRef.current !==
        null &&
      Number.isFinite(
        latestLivePriceRef.current
      )
    ) {
      requestAnimationFrame(
        () => {
          const latest =
            latestLivePriceRef.current;

          if (
            latest !== null &&
            Number.isFinite(latest)
          ) {
            updateChartWithLivePrice(
              latest
            );
          }
        }
      );
    }

    /* ==========================================================
       FIT CONTENT
    ========================================================== */

    chart
      .timeScale()
      .fitContent();

    /* ==========================================================
       CHART SCROLL / ZOOM
    ========================================================== */

    const rerender = () => {
      requestAnimationFrame(
        () => {
          renderDrawings();
          renderAiPriceLines();
        }
      );
    };

    chart
      .timeScale()
      .subscribeVisibleLogicalRangeChange(
        rerender
      );

    /* ==========================================================
       RESIZE
    ========================================================== */

    const resizeObserver =
      new ResizeObserver(() => {
        if (!chartRef.current) {
          return;
        }

        chartRef.current.resize(
          container.clientWidth,
          container.clientHeight
        );

        requestAnimationFrame(
          () => {
            renderDrawings();
            renderAiPriceLines();
          }
        );
      });

    resizeObserver.observe(
      container
    );

    requestAnimationFrame(() => {
      renderDrawings();
      renderAiPriceLines();
    });

    /* ==========================================================
       CLEANUP
    ========================================================== */

    return () => {
      resizeObserver.disconnect();

      try {
        chart
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(
            rerender
          );
      } catch {
        // noop
      }

      /*
       * DO NOT DO:
       *
       * line.remove()
       *
       * IPriceLine has no remove() method.
       *
       * chart.remove() removes the chart and its
       * associated price lines/series.
       */

      aiPriceLinesRef.current = [];

      chart.remove();

      if (
        chartRef.current ===
        chart
      ) {
        chartRef.current =
          null;
      }

      candleSeriesRef.current =
        null;

      lineSeriesRef.current =
        null;

      emaSeriesRef.current =
        null;

      sma20SeriesRef.current =
        null;

      sma50SeriesRef.current =
        null;

      sma200SeriesRef.current =
        null;

      volumeSeriesRef.current =
        null;
    };
  }, [
    bars,
    advanced,
    range,
    indicators,
    renderDrawings,
    updateChartWithLivePrice,
    renderAiPriceLines,
  ]);

/* ============================================================
   REACTIVE AI INDICATOR SERIES

   Rebuild AI series when the selected tools change or
   when the chart is recreated.
============================================================ */

useEffect(() => {
  const chart = chartRef.current;

  if (!chart) {
    return;
  }



  // Remove only the previous AI indicator series.
// Keep pane references so existing panes can be reused.
for (const series of aiIndicatorSeriesRef.current) {
  try {
    chart.removeSeries(series);
  } catch (error) {
    console.warn(
      "Could not remove previous AI indicator series:",
      error
    );
  }
}

aiIndicatorSeriesRef.current = [];







// Identify which indicators need separate panes.
const hasStochastic = aiDrawings.some(
  (d) =>
    d.type === "series" &&
    /stochastic|overbought\s*\(80\)|oversold\s*\(20\)/i.test(d.name)
);

const hasADX = aiDrawings.some(
  (d) =>
    d.type === "series" &&
    /\bADX\b|\+\s*DI|-\s*DI/i.test(d.name)
);

const hasATR = aiDrawings.some(
  (d) =>
    d.type === "series" && /\bATR\b/i.test(d.name)
);

const hasVolumeAnalysis = aiDrawings.some(
  (d) =>
    d.type === "series" && /relative\s*volume/i.test(d.name)
);

const hasOBV = aiDrawings.some(
  (d) =>
    d.type === "series" &&
    /\bOBV\b|on[- ]balance volume/i.test(d.name)
);



const isDivergenceDrawing = (
  drawing: AiChartDrawing
): boolean =>
  drawing.type === "series" &&
  /divergence/i.test(
    `${drawing.id} ${drawing.name}`
  );

  const hasDivergence = aiDrawings.some(
  isDivergenceDrawing
);

// const hasDivergence = aiDrawings.some(
//   (d) =>
//     d.type === "series" &&
//     /divergence/i.test(`${d.id} ${d.name}`)
// );

const hasVolumeProfile = aiDrawings.some(
  (d) =>
    d.type === "series" &&
    /volume\s*profile|volumeprofile|volume\s*by\s*price/i.test(d.name)
);

// Create each pane only once for the current chart.
const getOrCreatePane = (key: string, needed: boolean) => {
  if (!needed) {
    const existing = aiPaneRefs.current.get(key);

    if (existing) {
      try {
        const index = chart.panes().indexOf(existing);

        // Never remove the main chart pane.
        if (index > 0) {
          chart.removePane(index);
        }
      } catch {
        // The pane may already have been removed.
      }

      aiPaneRefs.current.delete(key);
    }

    return null;
  }

  const existing = aiPaneRefs.current.get(key);

  if (existing && chart.panes().includes(existing)) {
    return existing;
  }

  const pane = chart.addPane();
  aiPaneRefs.current.set(key, pane);

  return pane;
};

const stochasticPane = getOrCreatePane("stochastic", hasStochastic);
const adxPane = getOrCreatePane("adx", hasADX);
const atrPane = getOrCreatePane("atr", hasATR);
const volumeAnalysisPane = getOrCreatePane("relative-volume", hasVolumeAnalysis);
const obvPane = getOrCreatePane("obv", hasOBV);
const divergencePane = getOrCreatePane("divergence", hasDivergence);
const volumeProfilePane = getOrCreatePane("volume-profile", hasVolumeProfile);







  // Keep the ref synchronized with the latest props.
  aiDrawingsRef.current = aiDrawings;

  for (const drawing of aiDrawings) {
    if (drawing.type !== "series") {
      continue;
    }

    let values: { time: Time; value: number }[] = [];

    if (
      drawing.source === "candles" &&
      (drawing.indicator === "SMA" ||
        drawing.indicator === "EMA")
    ) {
      const period = drawing.period ?? 20;

      if (
        !Number.isInteger(period) ||
        period < 1 ||
        period > 1000
      ) {
        continue;
      }

      values =
        drawing.indicator === "SMA"
          ? calculateSMA(barsRef.current, period)
          : calculateEMA(barsRef.current, period);
    } else if (
      drawing.source === "values" &&
      drawing.values
    ) {
      values = drawing.values.flatMap((point) => {
        const time = normalizeDrawingTime(point.time);

        if (
          time === null ||
          !Number.isFinite(point.value)
        ) {
          return [];
        }

        return [{ time, value: point.value }];
      });
    }

    // Sort chronologically and remove duplicate timestamps.
    const uniqueValues = new Map<
      string,
      { time: Time; value: number }
    >();

    for (const point of values) {
      uniqueValues.set(String(point.time), point);
    }

    const data = Array.from(uniqueValues.values()).sort(
      (a, b) => {
        const timeValue = (time: Time): number => {
          if (typeof time === "number") {
            return time;
          }

          if (typeof time === "string") {
            return /^\d{4}-\d{2}-\d{2}$/.test(time)
              ? Date.parse(`${time}T00:00:00Z`)
              : Date.parse(time);
          }

          return Date.UTC(
            time.year,
            time.month - 1,
            time.day
          );
        };

        return timeValue(a.time) - timeValue(b.time);
      }
    );

    if (data.length === 0) {
      continue;
    }

    // const series = chart.addSeries(LineSeries, {
    //   title: drawing.name,
    //   color: drawing.color,
    //   lineWidth: (drawing.width ?? 2) as 1 | 2 | 3 | 4,
    //   lineStyle:
    //     drawing.style === "dashed"
    //       ? 2
    //       : drawing.style === "dotted"
    //         ? 1
    //         : 0,
    //   priceLineVisible: false,
    //   lastValueVisible: true,
    //   crosshairMarkerVisible: false,
    // });


const isStochastic =
  /stochastic|overbought\s*\(80\)|oversold\s*\(20\)/i.test(
    drawing.name
  );

const isADX =
  /\bADX\b|\+\s*DI|-\s*DI/i.test(drawing.name);

const isATR = /\bATR\b/i.test(drawing.name);

const isRelativeVolume =
  /relative\s*volume/i.test(drawing.name);

const isOBV =
  /\bOBV\b|on[- ]balance volume/i.test(drawing.name);

// const isDivergence =
//   /divergence/i.test(drawing.name);

const isDivergence =
  isDivergenceDrawing(drawing);

const isVolumeProfile =
  /volume\s*profile|volumeprofile|volume\s*by\s*price/i.test(
    drawing.name
  );


  

const series = chart.addSeries(
  LineSeries,
  {
    title: drawing.name,
    color: drawing.color,
    lineWidth: (drawing.width ?? 2) as 1 | 2 | 3 | 4,
    lineStyle:
      drawing.style === "dashed"
        ? 2
        : drawing.style === "dotted"
          ? 1
          : 0,
    priceLineVisible: false,
    lastValueVisible: true,
    crosshairMarkerVisible: false,

    ...(isStochastic
      ? {
          autoscaleInfoProvider: () => ({
            priceRange: {
              minValue: 0,
              maxValue: 100,
            },
          }),
        }
      : {}),
  }
);





if (isStochastic && stochasticPane) {
  series.moveToPane(stochasticPane.paneIndex());
}

if (isADX && adxPane) {
  series.moveToPane(adxPane.paneIndex());
}

if (isATR && atrPane) {
  series.moveToPane(atrPane.paneIndex());
}

if (isRelativeVolume && volumeAnalysisPane) {
  series.moveToPane(volumeAnalysisPane.paneIndex());
}

if (isOBV && obvPane) {
  series.moveToPane(obvPane.paneIndex());
}

if (isDivergence && divergencePane) {
  series.moveToPane(divergencePane.paneIndex());
}

if (isVolumeProfile && volumeProfilePane) {
  series.moveToPane(volumeProfilePane.paneIndex());
}



// if (isStochastic || isADX || isATR || isRelativeVolume) {
if (
  isStochastic ||
  isADX ||
  isATR ||
  isRelativeVolume ||
  isOBV ||
  isDivergence ||
  isVolumeProfile
) {
  series.priceScale().applyOptions({
    autoScale: true,
    scaleMargins: {
      top: 0.08,
      bottom: 0.08,
    },
  });
}

series.setData(data);
aiIndicatorSeriesRef.current.push(series);



  }

  chart.timeScale().applyOptions({});
}, [aiDrawings, bars, advanced, range, indicators]);

  /* ============================================================
     DRAWING RERENDER
  ============================================================ */

  useEffect(() => {
    requestAnimationFrame(() => {
      renderDrawings();
      renderAiPriceLines();
    });
  }, [
    selectedColor,
    selectedTool,
    aiLinesVisible,
    renderDrawings,
    renderAiPriceLines,
  ]);


  
  /* ============================================================
     TOOL SELECT
  ============================================================ */

  const selectTool = (
    tool: DrawingTool
  ) => {
    setSelectedTool(tool);

    if (tool === "cursor") {
      currentDrawingRef.current =
        null;

      isDrawingRef.current =
        false;
    }

    requestAnimationFrame(
      renderDrawings
    );
  };


// function getAiPriceRange() {
//   const prices = aiLinesRef.current
//     .filter(
//       line =>
//         line.visible !== false &&
//         typeof line.horizontalPrice === "number" &&
//         Number.isFinite(line.horizontalPrice)
//     )
//     .map(line => line.horizontalPrice as number);

//   if (prices.length === 0) {
//     return null;
//   }

//   return {
//     minValue: Math.min(...prices),
//     maxValue: Math.max(...prices),
//   };
// }



  /* ============================================================
     INDICATOR ITEMS
  ============================================================ */

  const indicatorItems: {
    key: IndicatorKey;
    label: string;
    color: string;
  }[] = [
    {
      key: "ema20",
      label: "EMA 20",
      color: "#a566ff",
    },
    {
      key: "sma20",
      label: "SMA 20",
      color: "#28dc9b",
    },
    {
      key: "sma50",
      label: "SMA 50",
      color: "#f4bf32",
    },
    {
      key: "sma200",
      label: "SMA 200",
      color: "#ff5064",
    },
    {
      key: "volume",
      label: "Volume",
      color: "#4da3ff",
    },
  ];



function normalizeDrawingTime(
  value: string | number
): Time | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;

    return (
      value > 1e12
        ? Math.floor(value / 1000)
        : Math.floor(value)
    ) as Time;
  }

  const input = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input as Time;
  }

  const milliseconds = Date.parse(input);

  if (!Number.isFinite(milliseconds)) {
    return null;
  }

  return Math.floor(milliseconds / 1000) as Time;
}


  
  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden bg-[#0b0b0f]">
      {/* LOADING */}

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0b0f]">
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#777b86]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#8b3dff]" />
            Loading chart...
          </div>
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0b0f]">
          <div className="max-w-[420px] px-6 text-center">
            <div className="mb-2 font-mono text-[12px] text-[#ff5064]">
              Chart data unavailable
            </div>

            <div className="font-mono text-[10px] leading-5 text-[#666a75]">
              {error}
            </div>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-4 rounded-[4px] border border-[#292932] bg-[#14141a] px-3 py-2 font-mono text-[10px] text-[#9b9da7] hover:bg-[#1b1b23] hover:text-white"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ADVANCED TOOLBAR */}

      {advanced && (
        <div className="absolute left-0 right-0 top-0 z-40 flex h-[40px] items-center border-b border-[#202027] bg-[#0d0d11] px-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() =>
                selectTool("cursor")
              }
              title="Cursor"
              className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] text-[13px] transition ${
                selectedTool ===
                "cursor"
                  ? "bg-[#292334] text-[#c28cff]"
                  : "text-[#737681] hover:bg-[#19191f] hover:text-white"
              }`}
            >
              ↖
            </button>

            <button
              onClick={() =>
                selectTool("trendline")
              }
              title="Trend Line"
              className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] text-[14px] transition ${
                selectedTool ===
                "trendline"
                  ? "bg-[#292334] text-[#c28cff]"
                  : "text-[#737681] hover:bg-[#19191f] hover:text-white"
              }`}
            >
              ╱
            </button>

            <button
              onClick={() =>
                selectTool("horizontal")
              }
              title="Horizontal Line"
              className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] text-[14px] transition ${
                selectedTool ===
                "horizontal"
                  ? "bg-[#292334] text-[#c28cff]"
                  : "text-[#737681] hover:bg-[#19191f] hover:text-white"
              }`}
            >
              ─
            </button>

            <button
              onClick={() =>
                selectTool("rectangle")
              }
              title="Rectangle"
              className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] text-[13px] transition ${
                selectedTool ===
                "rectangle"
                  ? "bg-[#292334] text-[#c28cff]"
                  : "text-[#737681] hover:bg-[#19191f] hover:text-white"
              }`}
            >
              □
            </button>

            <button
              onClick={() =>
                selectTool("text")
              }
              title="Text"
              className={`flex h-[28px] w-[32px] items-center justify-center rounded-[4px] font-mono text-[12px] transition ${
                selectedTool === "text"
                  ? "bg-[#292334] text-[#c28cff]"
                  : "text-[#737681] hover:bg-[#19191f] hover:text-white"
              }`}
            >
              T
            </button>
          </div>

          <div className="mx-2 h-[20px] w-px bg-[#25252d]" />

          <div className="flex items-center gap-1">
            {TOOL_COLORS.map(
              color => (
                <button
                  key={color}
                  onClick={() =>
                    setSelectedColor(
                      color
                    )
                  }
                  title="Drawing color"
                  className={`flex h-[24px] w-[24px] items-center justify-center rounded-full border ${
                    selectedColor === color
                      ? "border-white"
                      : "border-transparent"
                  }`}
                >
                  <span
                    className="h-[10px] w-[10px] rounded-full"
                    style={{
                      backgroundColor:
                        color,
                    }}
                  />
                </button>
              )
            )}
          </div>

          <div className="mx-2 h-[20px] w-px bg-[#25252d]" />

          <button
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="flex h-[28px] w-[30px] items-center justify-center rounded-[4px] text-[15px] text-[#777b86] transition hover:bg-[#19191f] hover:text-white"
          >
            ↶
          </button>

          <button
            onClick={redo}
            title="Redo (Ctrl+Y)"
            className="flex h-[28px] w-[30px] items-center justify-center rounded-[4px] text-[15px] text-[#777b86] transition hover:bg-[#19191f] hover:text-white"
          >
            ↷
          </button>

          <div className="mx-2 h-[20px] w-px bg-[#25252d]" />

          <div className="relative">
            <button
              onClick={() =>
                setIndicatorsOpen(
                  value => !value
                )
              }
              title="Indicators"
              className={`flex h-[28px] items-center gap-1.5 rounded-[4px] px-2 font-mono text-[10px] transition ${
                indicatorsOpen
                  ? "bg-[#292334] text-[#c28cff]"
                  : "text-[#858894] hover:bg-[#19191f] hover:text-white"
              }`}
            >
              <span>ƒx</span>

              <span>
                Indicators
              </span>

              <span className="ml-1 text-[8px]">
                {indicatorsOpen
                  ? "▲"
                  : "▼"}
              </span>
            </button>

            {indicatorsOpen && (
              <div className="absolute left-0 top-[34px] z-[100] w-[190px] overflow-hidden rounded-[6px] border border-[#292932] bg-[#111116] shadow-[0_12px_35px_rgba(0,0,0,0.5)]">
                <div className="border-b border-[#24242c] px-3 py-2">
                  <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#555963]">
                    Indicators
                  </div>
                </div>

                {indicatorItems.map(
                  item => {
                    const enabled =
                      indicators[
                        item.key
                      ];

                    return (
                      <button
                        key={
                          item.key
                        }
                        onClick={() =>
                          toggleIndicator(
                            item.key
                          )
                        }
                        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-[#19191f]"
                      >
                        <span
                          className="h-[8px] w-[8px] rounded-full"
                          style={{
                            backgroundColor:
                              item.color,
                            opacity:
                              enabled
                                ? 1
                                : 0.25,
                          }}
                        />

                        <span className="flex-1 font-mono text-[10px] text-[#9b9da7]">
                          {
                            item.label
                          }
                        </span>

                        <span
                          className={`flex h-[14px] w-[14px] items-center justify-center rounded-[3px] border text-[9px] ${
                            enabled
                              ? "border-[#8b3dff] bg-[#8b3dff] text-white"
                              : "border-[#34343d] text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  }
                )}

                <div className="border-t border-[#24242c] px-3 py-2">
                  <button
                    onClick={() =>
                      setIndicators(
                        DEFAULT_INDICATORS
                      )
                    }
                    className="font-mono text-[9px] text-[#666a75] hover:text-white"
                  >
                    Reset indicators
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI LINE TOGGLE */}

          {aiLines.length > 0 && (
            <>
              <div className="mx-2 h-[20px] w-px bg-[#25252d]" />

              <button
                onClick={() =>
                  setAiLinesVisible(
                    value => !value
                  )
                }
                title="Show / hide AI lines"
                className={`flex h-[28px] items-center gap-1.5 rounded-[4px] px-2 font-mono text-[10px] transition ${
                  aiLinesVisible
                    ? "bg-[#292334] text-[#c28cff]"
                    : "text-[#777b86] hover:bg-[#19191f] hover:text-white"
                }`}
              >
                <span>AI</span>

                <span className="text-[8px]">
                  {aiLinesVisible
                    ? "●"
                    : "○"}
                </span>
              </button>
            </>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[9px] text-[#555963]">
              {currentSymbol}
            </span>

            <span className="h-1.5 w-1.5 rounded-full bg-[#28dc9b]" />

            <span className="font-mono text-[9px] text-[#555963]">
              UPSTOX
            </span>
          </div>
        </div>
      )}

      {/* CHART */}

      <div
        ref={containerRef}
        className={`absolute left-0 right-0 w-full overflow-hidden ${
          advanced
            ? "top-[40px] bottom-[42px]"
            : "top-0 bottom-[42px]"
        } ${
          advanced &&
          selectedTool !== "cursor"
            ? "cursor-crosshair"
            : ""
        }`}
        onPointerDown={
          advanced
            ? handlePointerDown
            : undefined
        }
        onPointerMove={
          advanced
            ? handlePointerMove
            : undefined
        }
        onPointerUp={
          advanced
            ? finishDrawing
            : undefined
        }
        onPointerCancel={
          advanced
            ? finishDrawing
            : undefined
        }
      >
        
        <svg
              ref={drawingLayerRef}
              className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
            />
      </div>

      {advanced && (
        <div className="absolute left-3 top-[46px] z-30 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-[#25252d] bg-[#0b0b0f]/90 px-3 py-2">
          {indicatorItems
            .filter(
              (item) =>
                item.key !== "volume" && indicators[item.key]
            )
            .map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-1.5 font-mono text-[10px]"
              >
                <span
                  className="h-[2px] w-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span style={{ color: item.color }}>{item.label}</span>
              </div>
            ))}

          {aiDrawings
            .filter(
              (drawing) => drawing.type === "series"
            )
            .map((drawing) => (
              <div
                key={drawing.id}
                className="flex items-center gap-1.5 font-mono text-[10px]"
              >
                <span
                  className="h-[2px] w-4 rounded-full"
                  style={{ backgroundColor: drawing.color }}
                />
                <span style={{ color: drawing.color }}>
                  {drawing.name}
                </span>
              </div>
            ))}
        </div>
      )}




      {/* RANGE BAR */}

      <div className="absolute bottom-0 left-0 right-0 z-40 flex h-[42px] items-center gap-1 border-t border-[#202027] bg-[#0d0d11] px-4">
        {RANGES.map(item => {
          const active =
            item === range;

          return (
            <button
              key={item}
              onClick={() =>
                changeRange(item)
              }
              className={`h-[28px] rounded-[3px] px-2.5 font-mono text-[10px] font-medium transition ${
                active
                  ? "bg-[#25202f] text-white"
                  : "text-[#777b86] hover:bg-[#18181f] hover:text-white"
              }`}
            >
              {item}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 font-mono text-[9px] text-[#555963]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#28dc9b]" />

          UPSTOX • NSE
        </div>
      </div>
    </div>
  );
}