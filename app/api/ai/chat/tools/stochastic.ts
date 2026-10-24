import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

const K_PERIOD = 14;
const K_SMOOTHING = 3;
const D_PERIOD = 3;

type StochasticCandle = {
  high: number;
  low: number;
  close: number;
  time: number | string;
};

export async function runStochasticAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (marketData.candles as StochasticCandle[]).filter(
      (candle) =>
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close) &&
        candle.time !== undefined
    );

    if (candles.length < K_PERIOD + K_SMOOTHING + D_PERIOD - 2) {
      throw new Error(
        "Stochastic (14, 3, 3) requires at least 18 valid candles."
      );
    }

    // Raw %K: closing price's location in the 14-candle range.
    const rawK: Array<{
      time: number | string;
      value: number;
    }> = [];

    for (let i = K_PERIOD - 1; i < candles.length; i++) {
      const window = candles.slice(i - K_PERIOD + 1, i + 1);

      const highestHigh = Math.max(
        ...window.map((candle) => candle.high)
      );

      const lowestLow = Math.min(
        ...window.map((candle) => candle.low)
      );

      const range = highestHigh - lowestLow;

      // A zero range means the closing price's location is undefined.
      // Use 50 as a neutral fallback to keep the series calculable.
      const value =
        range === 0
          ? 50
          : ((candles[i].close - lowestLow) / range) * 100;

      rawK.push({
        time: candles[i].time,
        value,
      });
    }

    // Slow %K: simple 3-candle average of raw %K.
    const slowK: Array<{
      time: number | string;
      value: number;
    }> = [];

    for (let i = K_SMOOTHING - 1; i < rawK.length; i++) {
      const window = rawK.slice(i - K_SMOOTHING + 1, i + 1);

      slowK.push({
        time: rawK[i].time,
        value:
          window.reduce((sum, point) => sum + point.value, 0) /
          K_SMOOTHING,
      });
    }

    // %D: 3-candle simple moving average of slow %K.
    const dPoints: Array<{
      time: number | string;
      value: number;
    }> = [];

    for (let i = D_PERIOD - 1; i < slowK.length; i++) {
      const window = slowK.slice(i - D_PERIOD + 1, i + 1);

      dPoints.push({
        time: slowK[i].time,
        value:
          window.reduce((sum, point) => sum + point.value, 0) /
          D_PERIOD,
      });
    }

    const currentK = slowK[slowK.length - 1];
    const currentD = dPoints[dPoints.length - 1];

    const previousK = slowK[slowK.length - 2];
    const previousD = dPoints[dPoints.length - 2];

    const zone =
      currentK.value >= 80
        ? "overbought_zone"
        : currentK.value <= 20
          ? "oversold_zone"
          : "neutral_zone";

    const crossover =
      previousK.value <= previousD.value &&
      currentK.value > currentD.value
        ? "bullish_crossover"
        : previousK.value >= previousD.value &&
            currentK.value < currentD.value
          ? "bearish_crossover"
          : "no_new_crossover";

    const latestCandle = candles[candles.length - 1];

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "Stochastic Oscillator",
      parameters: {
        kPeriod: K_PERIOD,
        kSmoothing: K_SMOOTHING,
        dPeriod: D_PERIOD,
      },
      currentPrice: latestCandle.close,
      percentK: currentK.value,
      percentD: currentD.value,
      zone,
      crossover,
      referenceLevels: {
        overbought: 80,
        oversold: 20,
      },
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      candleCount: candles.length,
      startTime: candles[0].time,
      endTime: latestCandle.time,
      fetchedAt: new Date().toISOString(),
      interpretation:
        "The Stochastic Oscillator measures the closing price's position within its recent high-low range. Overbought and oversold readings can persist, especially in strong trends, and crossovers are not standalone trading signals.",
      limitations: [
        "Readings can remain overbought or oversold during strong trends.",
        "Sideways-market signals may be less reliable during strong directional moves.",
        "A crossover alone does not guarantee a reversal.",
      ],
    };

    const chartLines: ToolChartLine[] = [
      {
        id: "stochastic-k",
        label: "Stochastic %K",
        color: "#38BDF8",
        points: slowK.map((point) => ({
          time: point.time,
          value: point.value,
        })),
      },
      {
        id: "stochastic-d",
        label: "Stochastic %D",
        color: "#F59E0B",
        points: dPoints.map((point) => ({
          time: point.time,
          value: point.value,
        })),
      },
      {
        id: "stochastic-80",
        label: "Overbought (80)",
        color: "#EF4444",
        points: slowK.map((point) => ({
          time: point.time,
          value: 80,
        })),
      },
      {
        id: "stochastic-20",
        label: "Oversold (20)",
        color: "#22C55E",
        points: slowK.map((point) => ({
          time: point.time,
          value: 20,
        })),
      },
    ];

    return {
      tool: "stochasticAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: chartLines,
      },
    };
  } catch (error) {
    return {
      tool: "stochasticAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Stochastic analysis failed.",
    };
  }
}