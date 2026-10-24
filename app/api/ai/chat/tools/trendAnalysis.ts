import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
} from "../types";

type TrendDirection =
  | "bullish"
  | "bearish"
  | "sideways"
  | "mixed";

function calculateSMA(
  closes: number[],
  period: number
): number | null {
  if (closes.length < period) {
    return null;
  }

  const values = closes.slice(-period);

  return (
    values.reduce((sum, value) => sum + value, 0) /
    period
  );
}

function calculateSMAHistory(
  candles: { time: string; close: number }[],
  period: number
) {
  const result: { time: string; value: number }[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const window = candles.slice(i - period + 1, i + 1);
    const value =
      window.reduce((sum, candle) => sum + candle.close, 0) /
      period;

    result.push({
      time: candles[i].time,
      value,
    });
  }

  return result;
}

function findSwingPoints(
  values: number[],
  type: "high" | "low",
  radius = 2
): number[] {
  const points: number[] = [];

  for (
    let i = radius;
    i < values.length - radius;
    i++
  ) {
    let isSwing = true;

    for (let j = i - radius; j <= i + radius; j++) {
      if (j === i) continue;

      if (
        type === "high" &&
        values[j] >= values[i]
      ) {
        isSwing = false;
        break;
      }

      if (
        type === "low" &&
        values[j] <= values[i]
      ) {
        isSwing = false;
        break;
      }
    }

    if (isSwing) {
      points.push(values[i]);
    }
  }

  return points;
}

function classifyPriceStructure(
  highs: number[],
  lows: number[]
): {
  structure: string;
  bullish: boolean;
  bearish: boolean;
} {
  const swingHighs = findSwingPoints(highs, "high");
  const swingLows = findSwingPoints(lows, "low");

  if (swingHighs.length < 2 || swingLows.length < 2) {
    return {
      structure: "Insufficient swing points",
      bullish: false,
      bearish: false,
    };
  }

  const previousHigh = swingHighs[swingHighs.length - 2];
  const latestHigh = swingHighs[swingHighs.length - 1];

  const previousLow = swingLows[swingLows.length - 2];
  const latestLow = swingLows[swingLows.length - 1];

  const higherHighs = latestHigh > previousHigh;
  const higherLows = latestLow > previousLow;
  const lowerHighs = latestHigh < previousHigh;
  const lowerLows = latestLow < previousLow;

  if (higherHighs && higherLows) {
    return {
      structure: "Higher highs and higher lows",
      bullish: true,
      bearish: false,
    };
  }

  if (lowerHighs && lowerLows) {
    return {
      structure: "Lower highs and lower lows",
      bullish: false,
      bearish: true,
    };
  }

  return {
    structure: "Mixed or range-bound swing structure",
    bullish: false,
    bearish: false,
  };
}

function classifyTrend(input: {
  price: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  structureBullish: boolean;
  structureBearish: boolean;
}): {
  direction: TrendDirection;
  evidence: string[];
} {
  const {
    price,
    sma20,
    sma50,
    sma200,
    structureBullish,
    structureBearish,
  } = input;

  let bullishScore = 0;
  let bearishScore = 0;
  const evidence: string[] = [];

  if (sma20 !== null) {
    if (price > sma20) {
      bullishScore++;
      evidence.push("Price is above SMA 20");
    } else if (price < sma20) {
      bearishScore++;
      evidence.push("Price is below SMA 20");
    }
  }

  if (sma20 !== null && sma50 !== null) {
    if (sma20 > sma50) {
      bullishScore++;
      evidence.push("SMA 20 is above SMA 50");
    } else if (sma20 < sma50) {
      bearishScore++;
      evidence.push("SMA 20 is below SMA 50");
    }
  }

  if (sma50 !== null && sma200 !== null) {
    if (sma50 > sma200) {
      bullishScore++;
      evidence.push("SMA 50 is above SMA 200");
    } else if (sma50 < sma200) {
      bearishScore++;
      evidence.push("SMA 50 is below SMA 200");
    }
  }

  if (sma200 !== null) {
    if (price > sma200) {
      bullishScore++;
      evidence.push("Price is above SMA 200");
    } else if (price < sma200) {
      bearishScore++;
      evidence.push("Price is below SMA 200");
    }
  }

  if (structureBullish) {
    bullishScore += 2;
    evidence.push("Price structure shows higher highs and higher lows");
  }

  if (structureBearish) {
    bearishScore += 2;
    evidence.push("Price structure shows lower highs and lower lows");
  }

  if (bullishScore >= 3 && bullishScore > bearishScore) {
    return { direction: "bullish", evidence };
  }

  if (bearishScore >= 3 && bearishScore > bullishScore) {
    return { direction: "bearish", evidence };
  }

  if (
    bullishScore === 0 ||
    bearishScore === 0 ||
    bullishScore === bearishScore
  ) {
    return {
      direction:
        bullishScore === 0 && bearishScore === 0
          ? "sideways"
          : "mixed",
      evidence,
    };
  }

  return { direction: "mixed", evidence };
}

export async function runTrendAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  const symbol =
    typeof context.symbol === "string"
      ? context.symbol.trim().toUpperCase()
      : "";

  if (!symbol) {
    return {
      tool: "trendAnalysis",
      success: false,
      error: "Select a stock before requesting trend analysis.",
    };
  }

  try {
    const market = await getMarketData(
      symbol,
      context.tradingType,
      context.instrumentKey ?? undefined
    );

    const candles = market.candles;
    const closes = candles.map((candle) => candle.close);
    const highs = candles.map((candle) => candle.high);
    const lows = candles.map((candle) => candle.low);

    if (candles.length < 20) {
      return {
        tool: "trendAnalysis",
        success: false,
        error:
          `Only ${candles.length} candles are available for ${symbol}. ` +
          "At least 20 candles are required for basic trend analysis.",
      };
    }

    const latestCandle = candles[candles.length - 1];
    const price = latestCandle.close;

    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);

    const structure = classifyPriceStructure(highs, lows);

    const trend = classifyTrend({
      price,
      sma20,
      sma50,
      sma200,
      structureBullish: structure.bullish,
      structureBearish: structure.bearish,
    });

    const data = {
      symbol: market.symbol,
      stockName: market.name,
      currentPrice: price,
      trend: trend.direction,
      priceStructure: structure.structure,
      movingAverages: {
        sma20,
        sma50,
        sma200,
      },
      evidence: trend.evidence,
      tradingType: context.tradingType,
      interval: market.interval || "Unknown",
      intervalUnit: market.intervalUnit || "Unknown",
      intervalValue: market.intervalValue || null,
      candleCount: candles.length,
      startTime: market.startTime,
      endTime: market.endTime,
      latestCandleTime: latestCandle.time,
      fetchedAt: market.fetchedAt,
      limitations: [
        ...(sma50 === null
          ? ["SMA 50 unavailable: fewer than 50 candles."]
          : []),
        ...(sma200 === null
          ? ["SMA 200 unavailable: fewer than 200 candles."]
          : []),
        ...(structure.structure === "Insufficient swing points"
          ? ["Insufficient swing points to confirm price structure."]
          : []),
        "Trend classifications are rule-based indicators, not predictions or guaranteed trading signals.",
      ],
    };

    const sma20History = calculateSMAHistory(candles, 20);
    const sma50History = calculateSMAHistory(candles, 50);
    const sma200History = calculateSMAHistory(candles, 200);

    return {
      tool: "trendAnalysis",
      success: true,
      data,
      chart: {
        type: "line",
        lines: [
          {
            id: "price",
            label: "Close Price",
            color: "#64748b",
            points: candles.map((candle) => ({
              time: candle.time,
              value: candle.close,
            })),
          },
          {
            id: "sma20",
            label: "SMA 20",
            color: "#f59e0b",
            points: sma20History.map((point) => ({
              time: point.time,
              value: point.value,
            })),
          },
          {
            id: "sma50",
            label: "SMA 50",
            color: "#3b82f6",
            points: sma50History.map((point) => ({
              time: point.time,
              value: point.value,
            })),
          },
          {
            id: "sma200",
            label: "SMA 200",
            color: "#a855f7",
            points: sma200History.map((point) => ({
              time: point.time,
              value: point.value,
            })),
          },
        ],
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during trend analysis.";

    console.error("[Trend Analysis] Failed:", error);

    return {
      tool: "trendAnalysis",
      success: false,
      error: message,
    };
  }
}
