import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

type Candle = {
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number | string;
};

const ATR_PERIOD = 14;
const ADX_PERIOD = 14;
const HISTORY_LIMIT = 200;

function calculateATRSeries(
  candles: Candle[],
  period: number
): (number | null)[] {
  const result: (number | null)[] = Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    trueRanges.push(
      Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      )
    );
  }

  let atr = trueRanges.slice(0, period).reduce(
    (sum, value) => sum + value,
    0
  ) / period;

  result[period] = atr;

  for (let i = period + 1; i < candles.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i - 1]) / period;
    result[i] = atr;
  }

  return result;
}

function calculateADXSeries(
  candles: Candle[],
  period: number
): (number | null)[] {
  const result: (number | null)[] = Array(candles.length).fill(null);
  if (candles.length < period * 2 + 1) return result;

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    tr.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      )
    );

    const up = current.high - previous.high;
    const down = previous.low - current.low;

    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
  }

  let smoothedTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedPlus = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedMinus = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  const dx: number[] = [];

  for (let i = period - 1; i < tr.length; i++) {
    if (i > period - 1) {
      smoothedTR = smoothedTR - smoothedTR / period + tr[i];
      smoothedPlus = smoothedPlus - smoothedPlus / period + plusDM[i];
      smoothedMinus = smoothedMinus - smoothedMinus / period + minusDM[i];
    }

    const plusDI = smoothedTR > 0 ? (100 * smoothedPlus) / smoothedTR : 0;
    const minusDI = smoothedTR > 0 ? (100 * smoothedMinus) / smoothedTR : 0;
    const denominator = plusDI + minusDI;

    dx.push(
      denominator > 0
        ? (100 * Math.abs(plusDI - minusDI)) / denominator
        : 0
    );
  }

  if (dx.length < period) return result;

  let adx = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period * 2 - 1] = adx;

  for (let i = period; i < dx.length; i++) {
    adx = ((adx * (period - 1)) + dx[i]) / period;
    result[i + period] = adx;
  }

  return result;
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * fraction))
  );
  return sorted[index];
}

export async function runMarketRegimeAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (
      marketData.candles as Candle[]
    )
      .filter(
        (c) =>
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close) &&
          c.high >= c.low &&
          c.time !== undefined
      )
      .slice(-HISTORY_LIMIT);

    if (candles.length < 60) {
      throw new Error(
        "Market Regime Detection requires at least 60 valid candles."
      );
    }

    const atrSeries = calculateATRSeries(candles, ATR_PERIOD);
    const adxSeries = calculateADXSeries(candles, ADX_PERIOD);

    const latestIndex = candles.length - 1;
    const current = candles[latestIndex];
    const currentATR = atrSeries[latestIndex];
    const currentADX = adxSeries[latestIndex];

    if (currentATR === null || currentADX === null) {
      throw new Error(
        "Insufficient valid indicator data to classify the current market regime."
      );
    }

    const atrPercentHistory = candles
      .map((candle, index) => {
        const atr = atrSeries[index];
        return atr !== null && candle.close > 0
          ? (atr / candle.close) * 100
          : null;
      })
      .filter((value): value is number => value !== null)
      .slice(-60);

    const currentATRPercent = (currentATR / current.close) * 100;
    const lowVolThreshold = percentile(atrPercentHistory, 0.25);
    const highVolThreshold = percentile(atrPercentHistory, 0.75);

    let volatilityRegime: "low" | "normal" | "high" = "normal";

    if (currentATRPercent <= lowVolThreshold) {
      volatilityRegime = "low";
    } else if (currentATRPercent >= highVolThreshold) {
      volatilityRegime = "high";
    }

    let trendRegime: "trending" | "ranging" | "mixed";

    if (currentADX >= 25) {
      trendRegime = "trending";
    } else if (currentADX < 20) {
      trendRegime = "ranging";
    } else {
      trendRegime = "mixed";
    }

    const recentCandles = candles.slice(-20);
    const netChange =
      recentCandles[recentCandles.length - 1].close -
      recentCandles[0].close;
    const netChangePercent =
      recentCandles[0].close !== 0
        ? (netChange / recentCandles[0].close) * 100
        : 0;

    const direction =
      netChange > 0 ? "bullish" : netChange < 0 ? "bearish" : "neutral";

    const plusDI = (() => {
      const period = ADX_PERIOD;
      const start = candles.length - period - 1;
      if (start < 0) return null;

      let trSum = 0;
      let plusSum = 0;
      let minusSum = 0;

      for (let i = start + 1; i < candles.length; i++) {
        const c = candles[i];
        const p = candles[i - 1];

        trSum += Math.max(
          c.high - c.low,
          Math.abs(c.high - p.close),
          Math.abs(c.low - p.close)
        );

        const up = c.high - p.high;
        const down = p.low - c.low;

        plusSum += up > down && up > 0 ? up : 0;
        minusSum += down > up && down > 0 ? down : 0;
      }

      return {
        plusDI: trSum > 0 ? (100 * plusSum) / trSum : 0,
        minusDI: trSum > 0 ? (100 * minusSum) / trSum : 0,
      };
    })();

    const directionalBias =
      plusDI === null
        ? "unavailable"
        : plusDI.plusDI > plusDI.minusDI
          ? "bullish"
          : plusDI.plusDI < plusDI.minusDI
            ? "bearish"
            : "neutral";

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "Market Regime Detection",
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      currentPrice: current.close,
      classification: {
        trend: trendRegime,
        volatility: volatilityRegime,
        directionalBias,
        summary: `${trendRegime} market with ${volatilityRegime} volatility`,
      },
      indicators: {
        adx: currentADX,
        adxPeriod: ADX_PERIOD,
        atr: currentATR,
        atrPercent: currentATRPercent,
        volatilityPercentileThresholds: {
          low: lowVolThreshold,
          high: highVolThreshold,
          sampleCount: atrPercentHistory.length,
        },
        plusDI: plusDI?.plusDI ?? null,
        minusDI: plusDI?.minusDI ?? null,
        recent20CandlePriceChangePercent: netChangePercent,
        recent20CandleDirection: direction,
      },
      rules: {
        trending: "ADX >= 25",
        ranging: "ADX < 20",
        mixed: "ADX >= 20 and < 25",
        lowVolatility:
          "ATR as a percentage of price is at or below its recent 25th percentile",
        highVolatility:
          "ATR as a percentage of price is at or above its recent 75th percentile",
      },
      fetchedAt: new Date().toISOString(),
      limitations: [
        "Regime classifications are heuristic and depend on timeframe and historical window.",
        "ADX measures trend strength, not direction; directional bias is estimated separately from +DI and -DI.",
        "Volatility is measured relative to the recent ATR-percent distribution, not a universal threshold.",
        "A market can change regime quickly; this classification is not a prediction.",
      ],
    };

    const chartLines: ToolChartLine[] = [
      {
        id: "market-regime-adx",
        label: "ADX (14)",
        color: "#A78BFA",
        points: candles.flatMap((candle, index) =>
          adxSeries[index] === null
            ? []
            : [{ time: candle.time, value: adxSeries[index]! }]
        ),
      },
      {
        id: "market-regime-atr-percent",
        label: "ATR % (14)",
        color: "#38BDF8",
        points: candles.flatMap((candle, index) =>
          atrSeries[index] === null || candle.close <= 0
            ? []
            : [{
                time: candle.time,
                value: (atrSeries[index]! / candle.close) * 100,
              }]
        ),
      },
    ];

    return {
      tool: "marketRegimeAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: chartLines,
      },
    };
  } catch (error) {
    return {
      tool: "marketRegimeAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Market Regime Detection failed.",
    };
  }
}