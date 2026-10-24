import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

type StructureCandle = {
  high: number;
  low: number;
  close: number;
  time: number | string;
};

type SwingPoint = {
  type: "high" | "low";
  index: number;
  time: number | string;
  price: number;
  confirmedAtIndex: number;
  label?: string;
};

type StructureEvent = {
  type: "BOS" | "CHoCH" | "STRUCTURE_BREAK";
  direction: "bullish" | "bearish";
  level: number;
  time: number | string;
  close: number;
  brokenSwingTime: number | string;
  explanation: string;
};

const PIVOT_STRENGTH = 3;
const MAX_CANDLES = 300;

function detectSwings(
  candles: StructureCandle[],
  strength: number
): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (
    let i = strength;
    i < candles.length - strength;
    i++
  ) {
    const current = candles[i];
    let isHigh = true;
    let isLow = true;

    for (let offset = 1; offset <= strength; offset++) {
      // Strict comparisons avoid treating equal highs/lows as
      // multiple distinct pivots.
      if (
        current.high <= candles[i - offset].high ||
        current.high <= candles[i + offset].high
      ) {
        isHigh = false;
      }

      if (
        current.low >= candles[i - offset].low ||
        current.low >= candles[i + offset].low
      ) {
        isLow = false;
      }
    }

    if (isHigh) {
      swings.push({
        type: "high",
        index: i,
        time: current.time,
        price: current.high,
        confirmedAtIndex: i + strength,
      });
    }

    if (isLow) {
      swings.push({
        type: "low",
        index: i,
        time: current.time,
        price: current.low,
        confirmedAtIndex: i + strength,
      });
    }
  }

  return swings.sort((a, b) => a.index - b.index);
}

function labelSwings(swings: SwingPoint[]): SwingPoint[] {
  let previousHigh: SwingPoint | undefined;
  let previousLow: SwingPoint | undefined;

  return swings.map((swing) => {
    let label: string;

    if (swing.type === "high") {
      label =
        !previousHigh
          ? "SH"
          : swing.price > previousHigh.price
            ? "HH"
            : swing.price < previousHigh.price
              ? "LH"
              : "EQH";

      previousHigh = swing;
    } else {
      label =
        !previousLow
          ? "SL"
          : swing.price > previousLow.price
            ? "HL"
            : swing.price < previousLow.price
              ? "LL"
              : "EQL";

      previousLow = swing;
    }

    return { ...swing, label };
  });
}

function determineTrend(swings: SwingPoint[]) {
  const highs = swings.filter((s) => s.type === "high");
  const lows = swings.filter((s) => s.type === "low");

  if (highs.length < 2 || lows.length < 2) {
    return "neutral" as const;
  }

  const previousHigh = highs[highs.length - 2];
  const latestHigh = highs[highs.length - 1];
  const previousLow = lows[lows.length - 2];
  const latestLow = lows[lows.length - 1];

  if (
    latestHigh.price > previousHigh.price &&
    latestLow.price > previousLow.price
  ) {
    return "bullish" as const;
  }

  if (
    latestHigh.price < previousHigh.price &&
    latestLow.price < previousLow.price
  ) {
    return "bearish" as const;
  }

  return "range_or_mixed" as const;
}

export async function runMarketStructureAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (
      marketData.candles as StructureCandle[]
    )
      .filter(
        (c) =>
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close) &&
          c.high >= c.low &&
          c.time !== undefined
      )
      .slice(-MAX_CANDLES);

    if (candles.length < PIVOT_STRENGTH * 2 + 5) {
      throw new Error(
        "Market structure analysis requires more valid candles."
      );
    }

    const rawSwings = detectSwings(candles, PIVOT_STRENGTH);
    const swings = labelSwings(rawSwings);
    const trend = determineTrend(swings);

    const breakEvents: StructureEvent[] = [];
    const brokenHighs = new Set<number>();
    const brokenLows = new Set<number>();

    // A swing becomes eligible only after its right-side candles
    // have confirmed it. A close must cross the level; wick touches
    // alone do not count as a structure break.
    for (let i = 1; i < candles.length; i++) {
      const previousClose = candles[i - 1].close;
      const currentClose = candles[i].close;

      const eligibleSwings = swings.filter(
        (s) => s.confirmedAtIndex < i
      );
      

      const activeHighs = eligibleSwings.filter(
        (s) =>
          s.type === "high" &&
          !brokenHighs.has(s.index) &&
          previousClose <= s.price &&
          currentClose > s.price
      );

      const activeLows = eligibleSwings.filter(
        (s) =>
          s.type === "low" &&
          !brokenLows.has(s.index) &&
          previousClose >= s.price &&
          currentClose < s.price
      );

      // If multiple levels are crossed on one candle, report the
      // nearest crossed level to the previous close.
      const highBreak = activeHighs.sort(
        (a, b) =>
          Math.abs(a.price - previousClose) -
          Math.abs(b.price - previousClose)
      )[0];

      const lowBreak = activeLows.sort(
        (a, b) =>
          Math.abs(a.price - previousClose) -
          Math.abs(b.price - previousClose)
      )[0];

      if (highBreak) {
        brokenHighs.add(highBreak.index);

        const type =
          trend === "bearish"
            ? "CHoCH"
            : trend === "bullish"
              ? "BOS"
              : "STRUCTURE_BREAK";

        breakEvents.push({
          type,
          direction: "bullish",
          level: highBreak.price,
          time: candles[i].time,
          close: currentClose,
          brokenSwingTime: highBreak.time,
          explanation:
            type === "CHoCH"
              ? "Close broke above a confirmed swing high against the previously identified bearish structure."
              : type === "BOS"
                ? "Close broke above a confirmed swing high in the previously identified bullish structure."
                : "Close broke above a confirmed swing high; prior structure was mixed or neutral.",
        });
      }

      if (lowBreak) {
        brokenLows.add(lowBreak.index);

        const type =
          trend === "bullish"
            ? "CHoCH"
            : trend === "bearish"
              ? "BOS"
              : "STRUCTURE_BREAK";

        breakEvents.push({
          type,
          direction: "bearish",
          level: lowBreak.price,
          time: candles[i].time,
          close: currentClose,
          brokenSwingTime: lowBreak.time,
          explanation:
            type === "CHoCH"
              ? "Close broke below a confirmed swing low against the previously identified bullish structure."
              : type === "BOS"
                ? "Close broke below a confirmed swing low in the previously identified bearish structure."
                : "Close broke below a confirmed swing low; prior structure was mixed or neutral.",
        });
      }
    }

    const highs = swings.filter((s) => s.type === "high");
    const lows = swings.filter((s) => s.type === "low");
    const latestSwingHigh = highs.at(-1) ?? null;
    const latestSwingLow = lows.at(-1) ?? null;
    const currentPrice = candles[candles.length - 1].close;

    const latestBreak = breakEvents.at(-1) ?? null;

    const chartLines: ToolChartLine[] = [];

    if (latestSwingHigh) {
      chartLines.push({
        id: "structure-latest-swing-high",
        label: `Swing High (${latestSwingHigh.label})`,
        color: "#F87171",
        points: [
          { time: candles[0].time, value: latestSwingHigh.price },
          {
            time: candles[candles.length - 1].time,
            value: latestSwingHigh.price,
          },
        ],
      });
    }

    if (latestSwingLow) {
      chartLines.push({
        id: "structure-latest-swing-low",
        label: `Swing Low (${latestSwingLow.label})`,
        color: "#34D399",
        points: [
          { time: candles[0].time, value: latestSwingLow.price },
          {
            time: candles[candles.length - 1].time,
            value: latestSwingLow.price,
          },
        ],
      });
    }

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "Price Action & Market Structure",
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      currentPrice,
      trend,
      swingDetection: {
        method: "confirmed_pivot",
        candlesLeft: PIVOT_STRENGTH,
        candlesRight: PIVOT_STRENGTH,
        candlesAnalyzed: candles.length,
        confirmationNote:
          "A swing is confirmed only after three candles to its right have closed.",
      },
      latestSwingHigh,
      latestSwingLow,
      recentSwings: swings.slice(-20).map((s) => ({
        type: s.type,
        label: s.label,
        price: s.price,
        time: s.time,
        confirmedAtIndex: s.confirmedAtIndex,
      })),
      latestStructureEvent: latestBreak,
      recentStructureBreaks: breakEvents.slice(-10),
      interpretation: {
        higherHighs: highs.filter((s) => s.label === "HH").length,
        higherLows: lows.filter((s) => s.label === "HL").length,
        lowerHighs: highs.filter((s) => s.label === "LH").length,
        lowerLows: lows.filter((s) => s.label === "LL").length,
        equalHighs: highs.filter((s) => s.label === "EQH").length,
        equalLows: lows.filter((s) => s.label === "EQL").length,
      },
      fetchedAt: new Date().toISOString(),
      limitations: [
        "Swing points are confirmed pivots using three candles on each side; they are identified with a delay.",
        "BOS and CHoCH labels depend on the detected prior trend and are rule-based interpretations, not universal definitions.",
        "A candle-close break can fail and does not guarantee continuation or reversal.",
        "This analysis uses the available candle history and may miss structure outside that window.",
      ],
    };

    return {
      tool: "marketStructureAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: chartLines,
      },
    };
  } catch (error) {
    return {
      tool: "marketStructureAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Market structure analysis failed.",
    };
  }
}