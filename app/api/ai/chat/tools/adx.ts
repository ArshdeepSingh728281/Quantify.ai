import { getMarketData } from "../market-data";

import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

const ADX_PERIOD = 14;
const STRONG_TREND_LEVEL = 25;
const WEAK_TREND_LEVEL = 20;

type Candle = {
  time: string;
  high: number;
  low: number;
  close: number;
};

type ADXPoint = {
  time: string;
  adx: number;
  plusDI: number;
  minusDI: number;
};

function round(value: number): number {
  return Number(value.toFixed(2));
}

function calculateADX(
  candles: Candle[],
  period = ADX_PERIOD
): ADXPoint[] {
  if (candles.length < period * 2) {
    return [];
  }

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;

    tr.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      )
    );

    plusDM.push(
      upMove > downMove && upMove > 0
        ? upMove
        : 0
    );

    minusDM.push(
      downMove > upMove && downMove > 0
        ? downMove
        : 0
    );
  }

  let smoothedTR = 0;
  let smoothedPlusDM = 0;
  let smoothedMinusDM = 0;

  for (let i = 0; i < period; i++) {
    smoothedTR += tr[i];
    smoothedPlusDM += plusDM[i];
    smoothedMinusDM += minusDM[i];
  }

  const dxValues: {
    index: number;
    dx: number;
    plusDI: number;
    minusDI: number;
  }[] = [];

  function getDirectionalValues() {
    if (smoothedTR <= 0) {
      return {
        plusDI: 0,
        minusDI: 0,
        dx: 0,
      };
    }

    const plusDI =
      (smoothedPlusDM / smoothedTR) * 100;

    const minusDI =
      (smoothedMinusDM / smoothedTR) * 100;

    const denominator = plusDI + minusDI;

    const dx =
      denominator === 0
        ? 0
        : (Math.abs(plusDI - minusDI) /
            denominator) *
          100;

    return { plusDI, minusDI, dx };
  }

  // The first smoothed directional movement values
  // correspond to the candle at index = period.
  dxValues.push({
    index: period,
    ...getDirectionalValues(),
  });

  for (let i = period; i < tr.length; i++) {
    smoothedTR =
      smoothedTR - smoothedTR / period + tr[i];

    smoothedPlusDM =
      smoothedPlusDM -
      smoothedPlusDM / period +
      plusDM[i];

    smoothedMinusDM =
      smoothedMinusDM -
      smoothedMinusDM / period +
      minusDM[i];

    dxValues.push({
      index: i + 1,
      ...getDirectionalValues(),
    });
  }

  if (dxValues.length < period) {
    return [];
  }

  // Wilder's initial ADX is the average of the first
  // `period` DX readings.
  let adx =
    dxValues
      .slice(0, period)
      .reduce((sum, point) => sum + point.dx, 0) /
    period;

  const result: ADXPoint[] = [];

  for (let i = period - 1; i < dxValues.length; i++) {
    if (i > period - 1) {
      adx =
        (adx * (period - 1) + dxValues[i].dx) /
        period;
    }

    const point = dxValues[i];
    const candle = candles[point.index];

    result.push({
      time: candle.time,
      adx: round(adx),
      plusDI: round(point.plusDI),
      minusDI: round(point.minusDI),
    });
  }

  return result;
}

function describeStrength(adx: number): string {
  if (adx < WEAK_TREND_LEVEL) {
    return "weak";
  }

  if (adx < STRONG_TREND_LEVEL) {
    return "developing";
  }

  if (adx >= 40) {
    return "very strong";
  }

  return "strong";
}

function describeDirection(
  plusDI: number,
  minusDI: number
): string {
  if (plusDI > minusDI) {
    return "upward";
  }

  if (minusDI > plusDI) {
    return "downward";
  }

  return "unclear";
}

export async function runADXAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  const symbol = String(context.symbol ?? "")
    .trim()
    .toUpperCase();

  if (!symbol) {
    return {
      tool: "adxAnalysis",
      success: false,
      error: "Select a stock before running ADX analysis.",
    };
  }

  try {
    const market = await getMarketData(
      symbol,
      context.tradingType,
      context.instrumentKey ?? undefined
    );

    const candles: Candle[] = market.candles
      .filter(
        (candle) =>
          Number.isFinite(candle.high) &&
          Number.isFinite(candle.low) &&
          Number.isFinite(candle.close) &&
          candle.high >= candle.low
      )
      .map((candle) => ({
        time: candle.time,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

    const history = calculateADX(candles);

    if (history.length === 0) {
      return {
        tool: "adxAnalysis",
        success: false,
        error:
          `Not enough valid historical candles to calculate ADX(${ADX_PERIOD}). ` +
          "More historical data is required.",
      };
    }

    const latest = history[history.length - 1];

    const strength = describeStrength(latest.adx);
    const direction = describeDirection(
      latest.plusDI,
      latest.minusDI
    );

    const interpretation =
      latest.adx < WEAK_TREND_LEVEL
        ? "The market has weak trend strength. Price may be moving sideways or changing direction frequently."
        : latest.adx < STRONG_TREND_LEVEL
          ? "Trend strength may be developing, but the trend is not yet strong by the common ADX 25 guideline."
          : direction === "upward"
            ? "Trend strength is relatively strong, with +DI above -DI. Upward directional movement currently dominates."
            : direction === "downward"
              ? "Trend strength is relatively strong, with -DI above +DI. Downward directional movement currently dominates."
              : "Trend strength is elevated, but +DI and -DI do not show a clear directional advantage.";

    const data = {
      symbol,
      stockName: context.stockName || symbol,
      indicator: "ADX",
      period: ADX_PERIOD,
      currentPrice:
        candles[candles.length - 1]?.close ?? null,
      currentADX: latest.adx,
      plusDI: latest.plusDI,
      minusDI: latest.minusDI,
      trendStrength: strength,
      trendDirection: direction,
      interpretation,
      referenceLevels: {
        weakTrendBelow: WEAK_TREND_LEVEL,
        strongTrendAtOrAbove: STRONG_TREND_LEVEL,
        veryStrongTrendAtOrAbove: 40,
      },
      tradingType: context.tradingType,
      interval: market.interval,
      intervalUnit: market.intervalUnit,
      intervalValue: market.intervalValue,
      candleCount: candles.length,
      adxPointCount: history.length,
      startTime: candles[0]?.time,
      endTime: candles[candles.length - 1]?.time,
      latestCandleTime: latest.time,
      fetchedAt: market.fetchedAt,
      limitations: [
        "ADX measures trend strength, not direction.",
        "+DI and -DI provide directional context but are not standalone trade signals.",
        "ADX thresholds are guidelines, not guarantees.",
        "This analysis does not include company fundamentals or transaction costs.",
      ],
    };

    const lines: ToolChartLine[] = [
      {
        id: "adx14",
        label: "ADX 14",
        color: "#a78bfa",
        points: history.map((point) => ({
          time: point.time,
          value: point.adx,
        })),
      },
      {
        id: "plus-di",
        label: "+DI",
        color: "#34d399",
        points: history.map((point) => ({
          time: point.time,
          value: point.plusDI,
        })),
      },
      {
        id: "minus-di",
        label: "-DI",
        color: "#fb7185",
        points: history.map((point) => ({
          time: point.time,
          value: point.minusDI,
        })),
      },
      {
        id: "adx-25",
        label: "Strong Trend Level (25)",
        color: "#f59e0b",
        points: history.map((point) => ({
          time: point.time,
          value: 25,
        })),
      },
      {
        id: "adx-20",
        label: "Weak Trend Level (20)",
        color: "#64748b",
        points: history.map((point) => ({
          time: point.time,
          value: 20,
        })),
      },
    ];

    return {
      tool: "adxAnalysis",
      success: true,
      data,
      chart: {
        type: "line",
        lines,
      },
    };
  } catch (error) {
    console.error("[ADX TOOL] Analysis failed:", error);

    return {
      tool: "adxAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ADX analysis failed.",
    };
  }
}