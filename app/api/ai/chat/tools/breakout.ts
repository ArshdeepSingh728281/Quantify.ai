import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

type BreakoutCandle = {
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number | string;
};

const RANGE_PERIOD = 20;
const VOLUME_PERIOD = 20;
const ADX_PERIOD = 14;
const MIN_ADX = 20;
const MIN_VOLUME_RATIO = 1.5;

function calculateADX(
  candles: BreakoutCandle[],
  period: number
): number | null {
  if (candles.length < period * 2 + 1) return null;

  const trueRanges: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    trueRanges.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      )
    );

    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;

    plusDM.push(
      upMove > downMove && upMove > 0 ? upMove : 0
    );
    minusDM.push(
      downMove > upMove && downMove > 0 ? downMove : 0
    );
  }

  // Wilder-style smoothed sums, initialized with the first period.
  let smoothedTR = trueRanges
    .slice(0, period)
    .reduce((sum, value) => sum + value, 0);
  let smoothedPlus = plusDM
    .slice(0, period)
    .reduce((sum, value) => sum + value, 0);
  let smoothedMinus = minusDM
    .slice(0, period)
    .reduce((sum, value) => sum + value, 0);

  const dxValues: number[] = [];

  for (let i = period - 1; i < trueRanges.length; i++) {
    if (i > period - 1) {
      smoothedTR =
        smoothedTR - smoothedTR / period + trueRanges[i];
      smoothedPlus =
        smoothedPlus - smoothedPlus / period + plusDM[i];
      smoothedMinus =
        smoothedMinus - smoothedMinus / period + minusDM[i];
    }

    const plusDI =
      smoothedTR > 0 ? (100 * smoothedPlus) / smoothedTR : 0;
    const minusDI =
      smoothedTR > 0 ? (100 * smoothedMinus) / smoothedTR : 0;
    const denominator = plusDI + minusDI;

    dxValues.push(
      denominator > 0
        ? (100 * Math.abs(plusDI - minusDI)) / denominator
        : 0
    );
  }

  if (dxValues.length < period) return null;

  let adx = dxValues.slice(0, period).reduce(
    (sum, value) => sum + value,
    0
  ) / period;

  for (let i = period; i < dxValues.length; i++) {
    adx = ((adx * (period - 1)) + dxValues[i]) / period;
  }

  return adx;
}

export async function runBreakoutAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (
      marketData.candles as BreakoutCandle[]
    ).filter(
      (c) =>
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close) &&
        Number.isFinite(c.volume) &&
        c.high >= c.low &&
        c.volume >= 0 &&
        c.time !== undefined
    );

    const requiredCandles =
      Math.max(RANGE_PERIOD, VOLUME_PERIOD) +
      ADX_PERIOD * 2 +
      2;

    if (candles.length < requiredCandles) {
      throw new Error(
        `Breakout analysis requires at least ${requiredCandles} valid candles.`
      );
    }

    const lastIndex = candles.length - 1;
    const current = candles[lastIndex];

    // Exclude the current candle from the range and average-volume
    // baselines to avoid contaminating the comparison.
    const rangeCandles = candles.slice(
      lastIndex - RANGE_PERIOD,
      lastIndex
    );

    const volumeCandles = candles.slice(
      lastIndex - VOLUME_PERIOD,
      lastIndex
    );

    const resistance = Math.max(
      ...rangeCandles.map((c) => c.high)
    );
    const support = Math.min(
      ...rangeCandles.map((c) => c.low)
    );

    const averageVolume =
      volumeCandles.reduce((sum, c) => sum + c.volume, 0) /
      volumeCandles.length;

    const volumeRatio =
      averageVolume > 0
        ? current.volume / averageVolume
        : null;

    const brokeAbove = current.close > resistance;
    const brokeBelow = current.close < support;

    const breakoutDirection = brokeAbove
      ? "bullish"
      : brokeBelow
        ? "bearish"
        : "none";

    const adx = calculateADX(candles, ADX_PERIOD);

    const volumeConfirmed =
      volumeRatio !== null &&
      volumeRatio >= MIN_VOLUME_RATIO;

    const trendStrengthConfirmed =
      adx !== null && adx >= MIN_ADX;

    let status:
      | "confirmed"
      | "weak"
      | "unconfirmed"
      | "no_breakout" = "no_breakout";

    if (brokeAbove || brokeBelow) {
      if (volumeConfirmed && trendStrengthConfirmed) {
        status = "confirmed";
      } else if (volumeConfirmed || trendStrengthConfirmed) {
        status = "weak";
      } else {
        status = "unconfirmed";
      }
    }

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "Breakout & Breakdown Detection",
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      currentPrice: current.close,
      candleTime: current.time,
      range: {
        period: RANGE_PERIOD,
        support,
        resistance,
        description:
          "Highest high and lowest low of the preceding 20 candles, excluding the current candle.",
      },
      detection: {
        direction: breakoutDirection,
        status,
        closeConfirmed: brokeAbove || brokeBelow,
        breakoutLevel: brokeAbove
          ? resistance
          : brokeBelow
            ? support
            : null,
        distanceBeyondLevel:
          brokeAbove
            ? current.close - resistance
            : brokeBelow
              ? support - current.close
              : 0,
      },
      confirmation: {
        volume: {
          currentVolume: current.volume,
          averageVolume,
          relativeVolume: volumeRatio,
          threshold: MIN_VOLUME_RATIO,
          confirmed: volumeConfirmed,
        },
        trendStrength: {
          adx,
          threshold: MIN_ADX,
          confirmed: trendStrengthConfirmed,
          note:
            adx === null
              ? "Insufficient data to calculate ADX."
              : "ADX measures trend strength, not bullish or bearish direction.",
        },
      },
      fetchedAt: new Date().toISOString(),
      limitations: [
        "A single candle close beyond the range is not proof that the breakout will hold.",
        "The 20-candle range is a configurable rule, not a universally optimal period.",
        "ADX measures trend strength, not trend direction.",
        "The latest candle may still be forming, depending on the data provider.",
        "Volume confirmation is less reliable when market data has missing or delayed volume.",
      ],
    };

    const chartLines: ToolChartLine[] = [
      {
        id: "breakout-resistance",
        label: "Range Resistance",
        color: "#F87171",
        points: [
          { time: rangeCandles[0].time, value: resistance },
          { time: current.time, value: resistance },
        ],
      },
      {
        id: "breakout-support",
        label: "Range Support",
        color: "#34D399",
        points: [
          { time: rangeCandles[0].time, value: support },
          { time: current.time, value: support },
        ],
      },
    ];

    return {
      tool: "breakoutAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: chartLines,
      },
    };
  } catch (error) {
    return {
      tool: "breakoutAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Breakout analysis failed.",
    };
  }
}