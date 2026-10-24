import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

const BB_PERIOD = 20;
const BB_STD_DEV = 2;

type Candle = {
  high: number;
  low: number;
  close: number;
  time: number | string;
};

function calculateBollingerBands(candles: Candle[]) {
  if (candles.length < BB_PERIOD) {
    throw new Error(
      `Bollinger Bands require at least ${BB_PERIOD} candles.`
    );
  }

  const points: Array<{
    time: number | string;
    upper: number;
    middle: number;
    lower: number;
    bandwidthPercent: number;
  }> = [];

  for (let i = BB_PERIOD - 1; i < candles.length; i++) {
    const window = candles
      .slice(i - BB_PERIOD + 1, i + 1)
      .map((candle) => candle.close);

    const middle =
      window.reduce((sum, close) => sum + close, 0) /
      BB_PERIOD;

    const variance =
      window.reduce(
        (sum, close) => sum + (close - middle) ** 2,
        0
      ) / BB_PERIOD;

    const standardDeviation = Math.sqrt(variance);

    const upper = middle + BB_STD_DEV * standardDeviation;
    const lower = middle - BB_STD_DEV * standardDeviation;

    points.push({
      time: candles[i].time,
      upper,
      middle,
      lower,
      bandwidthPercent:
        middle !== 0 ? ((upper - lower) / middle) * 100 : 0,
    });
  }

  return points;
}

export async function runBollingerAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (marketData.candles as Candle[]).filter(
      (candle) =>
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close) &&
        candle.time !== undefined
    );

    const points = calculateBollingerBands(candles);
    const latest = points[points.length - 1];
    const previous = points[points.length - 2];
    const latestCandle = candles[candles.length - 1];
    const currentPrice = latestCandle.close;

    const bandWidth = latest.upper - latest.lower;
    const pricePosition =
      bandWidth > 0
        ? ((currentPrice - latest.lower) / bandWidth) * 100
        : 50;

    const bandProximity =
      currentPrice >= latest.upper
        ? "at_or_above_upper_band"
        : currentPrice <= latest.lower
          ? "at_or_below_lower_band"
          : pricePosition >= 90
            ? "approaching_upper_band"
            : pricePosition <= 10
              ? "approaching_lower_band"
              : "between_bands";

    const bandwidthChangePercent =
      previous && previous.bandwidthPercent !== 0
        ? ((latest.bandwidthPercent -
            previous.bandwidthPercent) /
            previous.bandwidthPercent) *
          100
        : null;

    const volatilityState =
      bandwidthChangePercent === null
        ? "insufficient_history_to_compare"
        : bandwidthChangePercent > 2
          ? "expanding"
          : bandwidthChangePercent < -2
            ? "contracting"
            : "relatively_stable";

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "Bollinger Bands",
      period: BB_PERIOD,
      standardDeviations: BB_STD_DEV,
      currentPrice,
      upperBand: latest.upper,
      middleBand: latest.middle,
      lowerBand: latest.lower,
      bandwidth: bandWidth,
      bandwidthPercent: latest.bandwidthPercent,
      previousBandwidthPercent:
        previous?.bandwidthPercent ?? null,
      bandwidthChangePercent,
      volatilityState,
      pricePositionWithinBandsPercent: pricePosition,
      bandProximity,
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      candleCount: candles.length,
      startTime: candles[0]?.time,
      endTime: latestCandle.time,
      fetchedAt: new Date().toISOString(),
      interpretation:
        "Bollinger Bands describe price relative to a moving average and recent volatility. A band touch alone is not a buy or sell signal.",
    };

    const chartLines: ToolChartLine[] = [
      {
        id: "bollinger-upper",
        label: "Upper Band",
        color: "#A78BFA",
        points: points.map((point) => ({
          time: point.time,
          value: point.upper,
        })),
      },
      {
        id: "bollinger-middle",
        label: "Middle Band (SMA 20)",
        color: "#60A5FA",
        points: points.map((point) => ({
          time: point.time,
          value: point.middle,
        })),
      },
      {
        id: "bollinger-lower",
        label: "Lower Band",
        color: "#A78BFA",
        points: points.map((point) => ({
          time: point.time,
          value: point.lower,
        })),
      },
    ];

    return {
      tool: "bollingerAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: chartLines,
      },
    };
  } catch (error) {
    return {
      tool: "bollingerAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Bollinger Bands analysis failed.",
    };
  }
}