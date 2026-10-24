import { getMarketData } from "../market-data";

import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

/* ============================================================
   CONFIGURATION
============================================================ */

const RSI_PERIOD = 14;
const OVERBOUGHT_LEVEL = 70;
const OVERSOLD_LEVEL = 30;
const MIDDLE_LEVEL = 50;

/* ============================================================
   TYPES
============================================================ */

type RSIHistoryPoint = {
  time: string;
  value: number;
};

type RSIStatus =
  | "overbought"
  | "oversold"
  | "bullish-momentum"
  | "bearish-momentum"
  | "neutral";

/* ============================================================
   RSI CALCULATION — WILDER'S SMOOTHING

   RSI = 100 - (100 / (1 + RS))
   RS  = Average Gain / Average Loss

   The initial averages use the first 14 changes.
   Subsequent averages use Wilder's smoothing method.
============================================================ */

function calculateRSIHistory(
  candles: { time: string; close: number }[],
  period: number
): RSIHistoryPoint[] {
  if (candles.length <= period) {
    return [];
  }

  const result: RSIHistoryPoint[] = [];

  let averageGain = 0;
  let averageLoss = 0;

  // The first RSI uses the first `period` price changes.
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;

    if (change > 0) {
      averageGain += change;
    } else if (change < 0) {
      averageLoss += Math.abs(change);
    }
  }

  averageGain /= period;
  averageLoss /= period;

  function getRSI(
    avgGain: number,
    avgLoss: number
  ): number {
    // If there were no losses, RSI is 100 when gains exist.
    if (avgLoss === 0) {
      return avgGain === 0 ? 50 : 100;
    }

    if (avgGain === 0) {
      return 0;
    }

    const relativeStrength = avgGain / avgLoss;

    return 100 - 100 / (1 + relativeStrength);
  }

  result.push({
    time: candles[period].time,
    value: getRSI(averageGain, averageLoss),
  });

  // Wilder's smoothed moving averages for subsequent candles.
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;

    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    averageGain =
      (averageGain * (period - 1) + gain) / period;

    averageLoss =
      (averageLoss * (period - 1) + loss) / period;

    result.push({
      time: candles[i].time,
      value: getRSI(averageGain, averageLoss),
    });
  }

  return result;
}

/* ============================================================
   CLASSIFY LATEST RSI
============================================================ */

function classifyRSI(value: number): RSIStatus {
  if (value >= OVERBOUGHT_LEVEL) {
    return "overbought";
  }

  if (value <= OVERSOLD_LEVEL) {
    return "oversold";
  }

  if (value > MIDDLE_LEVEL) {
    return "bullish-momentum";
  }

  if (value < MIDDLE_LEVEL) {
    return "bearish-momentum";
  }

  return "neutral";
}

/* ============================================================
   FRIENDLY STATUS DESCRIPTION
============================================================ */

function describeRSI(status: RSIStatus): string {
  switch (status) {
    case "overbought":
      return (
        "RSI is at or above 70, indicating strong recent upward " +
        "momentum. The stock may be overbought, but this does not " +
        "automatically mean its price will fall."
      );

    case "oversold":
      return (
        "RSI is at or below 30, indicating strong recent downward " +
        "momentum. The stock may be oversold, but this does not " +
        "automatically mean its price will rise."
      );

    case "bullish-momentum":
      return (
        "RSI is above 50 but below 70, indicating that recent " +
        "upward momentum is stronger than downward momentum."
      );

    case "bearish-momentum":
      return (
        "RSI is below 50 but above 30, indicating that recent " +
        "downward momentum is stronger than upward momentum."
      );

    default:
      return (
        "RSI is around 50, suggesting a relatively balanced " +
        "momentum reading."
      );
  }
}

/* ============================================================
   RUN RSI ANALYSIS
============================================================ */

export async function runRSIAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  const symbol =
    typeof context.symbol === "string"
      ? context.symbol.trim().toUpperCase().replace(/^NSE:/, "")
      : "";

  if (!symbol) {
    return {
      tool: "rsiAnalysis",
      success: false,
      error: "Select a stock before requesting RSI analysis.",
    };
  }

  try {
    const market = await getMarketData(
      symbol,
      context.tradingType,
      context.instrumentKey ?? undefined
    );

    const candles = market.candles;

    if (candles.length <= RSI_PERIOD) {
      return {
        tool: "rsiAnalysis",
        success: false,
        error:
          `Only ${candles.length} candles are available for ${symbol}. ` +
          `RSI (${RSI_PERIOD}) requires at least ${RSI_PERIOD + 1} candles.`,
      };
    }

    const rsiHistory = calculateRSIHistory(
      candles,
      RSI_PERIOD
    );

    if (rsiHistory.length === 0) {
      return {
        tool: "rsiAnalysis",
        success: false,
        error: `Unable to calculate RSI for ${symbol}.`,
      };
    }

    const latestRSI = rsiHistory[rsiHistory.length - 1];
    const latestCandle = candles[candles.length - 1];
    const status = classifyRSI(latestRSI.value);

    /*
     * RSI is an oscillator with its own 0–100 scale.
     * The chart data includes the RSI series and reference levels.
     *
     * Your current StockWorkspace converts chart.lines with
     * historical points into native series on the main price chart.
     * For correct visualization, RSI should eventually be rendered
     * in a dedicated oscillator pane rather than overlaid on price.
     */
    const rsiLine: ToolChartLine = {
      id: "rsi14",
      label: `RSI (${RSI_PERIOD})`,
      color: "#a78bfa",
      points: rsiHistory.map((point) => ({
        time: point.time,
        value: point.value,
      })),
    };

    const overboughtLine: ToolChartLine = {
      id: "rsi-overbought",
      label: "Overbought (70)",
      color: "#ef4444",
      dashed: true,
      points: rsiHistory.map((point) => ({
        time: point.time,
        value: OVERBOUGHT_LEVEL,
      })),
    };

    const oversoldLine: ToolChartLine = {
      id: "rsi-oversold",
      label: "Oversold (30)",
      color: "#22c55e",
      dashed: true,
      points: rsiHistory.map((point) => ({
        time: point.time,
        value: OVERSOLD_LEVEL,
      })),
    };

    const middleLine: ToolChartLine = {
      id: "rsi-middle",
      label: "Middle (50)",
      color: "#64748b",
      dashed: true,
      points: rsiHistory.map((point) => ({
        time: point.time,
        value: MIDDLE_LEVEL,
      })),
    };

    const data = {
      symbol: market.symbol,
      stockName: market.name,
      indicator: "RSI",
      period: RSI_PERIOD,
      currentPrice: latestCandle.close,
      currentRSI: Number(latestRSI.value.toFixed(2)),
      status,
      interpretation: describeRSI(status),

      referenceLevels: {
        oversold: OVERSOLD_LEVEL,
        middle: MIDDLE_LEVEL,
        overbought: OVERBOUGHT_LEVEL,
      },

      tradingType: context.tradingType,
      interval: market.interval || "Unknown",
      intervalUnit: market.intervalUnit || "Unknown",
      intervalValue: market.intervalValue || null,

      candleCount: candles.length,
      rsiPointCount: rsiHistory.length,

      startTime: market.startTime,
      endTime: market.endTime,
      latestCandleTime: latestCandle.time,
      fetchedAt: market.fetchedAt,

      limitations: [
        "RSI is a momentum indicator, not a guaranteed buy or sell signal.",
        "Overbought readings can persist during strong uptrends.",
        "Oversold readings can persist during strong downtrends.",
        "Interpret RSI alongside price structure, trend, and risk management.",
      ],
    };

    return {
      tool: "rsiAnalysis",
      success: true,
      data,
      chart: {
        type: "line",
        lines: [
          rsiLine,
          overboughtLine,
          middleLine,
          oversoldLine,
        ],
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during RSI analysis.";

    console.error("[RSI Analysis] Failed:", {
      symbol,
      error,
    });

    return {
      tool: "rsiAnalysis",
      success: false,
      error: message,
    };
  }
}