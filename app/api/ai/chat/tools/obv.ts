import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

type OBVCandle = {
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number | string;
};

export async function runOBVAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (
      marketData.candles as OBVCandle[]
    ).filter(
      (candle) =>
        Number.isFinite(candle.close) &&
        Number.isFinite(candle.volume) &&
        candle.volume >= 0 &&
        candle.time !== undefined
    );

    if (candles.length < 3) {
      throw new Error(
        "OBV analysis requires at least 3 valid candles."
      );
    }

    // OBV starts at zero and accumulates volume according
    // to whether each close is higher or lower than the prior close.
    let obv = 0;

    const obvPoints: {
      time: number | string;
      value: number;
    }[] = [];

    for (let i = 0; i < candles.length; i++) {
      if (i > 0) {
        if (candles[i].close > candles[i - 1].close) {
          obv += candles[i].volume;
        } else if (
          candles[i].close < candles[i - 1].close
        ) {
          obv -= candles[i].volume;
        }
        // Unchanged close: OBV remains unchanged.
      }

      obvPoints.push({
        time: candles[i].time,
        value: obv,
      });
    }

    const lastIndex = candles.length - 1;
    const comparisonLength = Math.min(10, lastIndex);
    const comparisonIndex = lastIndex - comparisonLength;

    const latestCandle = candles[lastIndex];
    const comparisonCandle = candles[comparisonIndex];

    const latestOBV = obvPoints[lastIndex].value;
    const comparisonOBV = obvPoints[comparisonIndex].value;

    const priceChange =
      latestCandle.close - comparisonCandle.close;

    const obvChange = latestOBV - comparisonOBV;

    const priceDirection =
      priceChange > 0
        ? "up"
        : priceChange < 0
          ? "down"
          : "unchanged";

    const obvDirection =
      obvChange > 0
        ? "up"
        : obvChange < 0
          ? "down"
          : "unchanged";

    let interpretation = "price_obv_mixed";

    if (priceDirection === "up" && obvDirection === "up") {
      interpretation = "price_and_obv_rising";
    } else if (
      priceDirection === "down" &&
      obvDirection === "down"
    ) {
      interpretation = "price_and_obv_falling";
    } else if (
      priceDirection === "up" &&
      obvDirection === "down"
    ) {
      interpretation = "possible_bearish_divergence";
    } else if (
      priceDirection === "down" &&
      obvDirection === "up"
    ) {
      interpretation = "possible_bullish_divergence";
    }

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "OBV",
      currentPrice: latestCandle.close,
      currentOBV: latestOBV,
      comparisonPrice: comparisonCandle.close,
      comparisonOBV,
      priceChange,
      obvChange,
      priceDirection,
      obvDirection,
      interpretation,
      comparisonCandles: comparisonLength,
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      candleCount: candles.length,
      startTime: candles[0].time,
      endTime: latestCandle.time,
      fetchedAt: new Date().toISOString(),
      limitations: [
        "OBV is cumulative, so its absolute value depends on the starting point.",
        "Price and OBV moving in different directions may suggest divergence but does not guarantee a reversal.",
        "The comparison uses the most recent available candles and is not a formal swing-high/swing-low divergence detector.",
      ],
    };

    const chartLine: ToolChartLine = {
      id: "obv-line",
      label: "On-Balance Volume",
      color: "#38BDF8",
      points: obvPoints,
    };

    return {
      tool: "obvAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: [chartLine],
      },
    };
  } catch (error) {
    return {
      tool: "obvAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "OBV analysis failed.",
    };
  }
}