import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

const VOLUME_PERIOD = 20;

type VolumeCandle = {
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number | string;
};

export async function runVolumeAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (marketData.candles as VolumeCandle[]).filter(
      (candle) =>
        Number.isFinite(candle.close) &&
        Number.isFinite(candle.volume) &&
        candle.volume >= 0 &&
        candle.time !== undefined
    );

    if (candles.length < VOLUME_PERIOD + 1) {
      throw new Error(
        `Volume analysis requires at least ${VOLUME_PERIOD + 1} candles.`
      );
    }

    const points: Array<{
      time: number | string;
      value: number;
    }> = [];

    // Each candle is compared against the 20 candles before it.
    for (let i = VOLUME_PERIOD; i < candles.length; i++) {
      const previousVolumes = candles
        .slice(i - VOLUME_PERIOD, i)
        .map((candle) => candle.volume);

      const averageVolume =
        previousVolumes.reduce((sum, volume) => sum + volume, 0) /
        VOLUME_PERIOD;

      const relativeVolume =
        averageVolume > 0
          ? candles[i].volume / averageVolume
          : 0;

      points.push({
        time: candles[i].time,
        value: relativeVolume,
      });
    }

    const latestCandle = candles[candles.length - 1];
    const previousVolumes = candles
      .slice(-VOLUME_PERIOD - 1, -1)
      .map((candle) => candle.volume);

    const averageVolume =
      previousVolumes.reduce((sum, volume) => sum + volume, 0) /
      VOLUME_PERIOD;

    const currentVolume = latestCandle.volume;
    const relativeVolume =
      averageVolume > 0 ? currentVolume / averageVolume : null;

    const volumeState =
      relativeVolume === null
        ? "unavailable"
        : relativeVolume >= 2
          ? "very_high"
          : relativeVolume >= 1.5
            ? "high"
            : relativeVolume >= 0.8
              ? "near_average"
              : "low";

    const previousCandle = candles[candles.length - 2];

    const priceChangePercent =
      previousCandle.close !== 0
        ? ((latestCandle.close - previousCandle.close) /
            previousCandle.close) *
          100
        : null;

    const priceDirection =
      priceChangePercent === null
        ? "unknown"
        : priceChangePercent > 0
          ? "up"
          : priceChangePercent < 0
            ? "down"
            : "unchanged";

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "Volume Analysis",
      period: VOLUME_PERIOD,
      currentPrice: latestCandle.close,
      currentVolume,
      averageVolume,
      relativeVolume,
      volumeChangePercent:
        relativeVolume === null
          ? null
          : (relativeVolume - 1) * 100,
      volumeState,
      priceDirection,
      priceChangePercent,
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      candleCount: candles.length,
      startTime: candles[0].time,
      endTime: latestCandle.time,
      fetchedAt: new Date().toISOString(),
      interpretation:
        "Relative volume compares the latest candle's volume with the previous 20 candles. Volume indicates participation, but does not establish price direction or guarantee a move.",
      limitations: [
        "Volume comparisons are most meaningful across the same instrument and candle interval.",
        "An incomplete live candle can have lower volume simply because it has not finished.",
        "High volume does not independently confirm a bullish or bearish move.",
      ],
    };

    const chartLine: ToolChartLine = {
      id: "relative-volume-20",
      label: "Relative Volume (20)",
      color: "#22C55E",
      points,
    };

    return {
      tool: "volumeAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: [chartLine],
      },
    };
  } catch (error) {
    return {
      tool: "volumeAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Volume analysis failed.",
    };
  }
}