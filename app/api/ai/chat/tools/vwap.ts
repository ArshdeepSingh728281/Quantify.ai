import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

type VWAPCandle = {
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number | string;
};

function getSessionDate(time: number | string): string {
  let date: Date;

  if (typeof time === "number") {
    // Market timestamps are usually seconds or milliseconds.
    date = new Date(
      time < 1e12 ? time * 1000 : time
    );
  } else {
    date = new Date(time);
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid candle timestamp for VWAP.");
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function runVWAPAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (marketData.candles as VWAPCandle[]).filter(
      (candle) =>
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close) &&
        Number.isFinite(candle.volume) &&
        candle.volume >= 0 &&
        candle.time !== undefined
    );

    if (candles.length < 2) {
      throw new Error(
        "VWAP requires at least two valid intraday candles."
      );
    }

    const points: Array<{
      time: number | string;
      value: number;
    }> = [];

    let currentSession = "";
    let cumulativePriceVolume = 0;
    let cumulativeVolume = 0;

    for (const candle of candles) {
      const session = getSessionDate(candle.time);

      // Reset VWAP at the start of each exchange session.
      if (session !== currentSession) {
        currentSession = session;
        cumulativePriceVolume = 0;
        cumulativeVolume = 0;
      }

      const typicalPrice =
        (candle.high + candle.low + candle.close) / 3;

      cumulativePriceVolume += typicalPrice * candle.volume;
      cumulativeVolume += candle.volume;

      if (cumulativeVolume > 0) {
        points.push({
          time: candle.time,
          value: cumulativePriceVolume / cumulativeVolume,
        });
      }
    }

    if (points.length === 0) {
      throw new Error(
        "VWAP could not be calculated because candle volume is zero."
      );
    }

    const latestCandle = candles[candles.length - 1];
    const currentVWAP = points[points.length - 1].value;
    const currentPrice = latestCandle.close;

    const priceVsVWAPPercent =
      currentVWAP !== 0
        ? ((currentPrice - currentVWAP) / currentVWAP) * 100
        : null;

    const pricePosition =
      currentPrice > currentVWAP
        ? "above_vwap"
        : currentPrice < currentVWAP
          ? "below_vwap"
          : "at_vwap";

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "VWAP",
      currentPrice,
      currentVWAP,
      priceVsVWAPPercent,
      pricePosition,
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      candleCount: candles.length,
      sessionDate: getSessionDate(latestCandle.time),
      startTime: latestCandle.time,
      fetchedAt: new Date().toISOString(),
      interpretation:
        "VWAP is the intraday volume-weighted average price. Price above VWAP indicates trading above that average; price below VWAP indicates trading below it. Neither position guarantees future direction.",
      limitations: [
        "VWAP is most useful with intraday candles and resets each exchange session.",
        "Historical VWAP requires complete intraday candles from the session open.",
        "Zero-volume candles do not contribute to the calculation.",
        "VWAP alone is not a buy or sell signal.",
      ],
    };

    const chartLine: ToolChartLine = {
      id: "session-vwap",
      label: "VWAP",
      color: "#F59E0B",
      points,
    };

    return {
      tool: "vwapAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: [chartLine],
      },
    };
  } catch (error) {
    return {
      tool: "vwapAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "VWAP analysis failed.",
    };
  }
}