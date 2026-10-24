import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

const ATR_PERIOD = 14;

function calculateATR(
  candles: Array<{
    high: number;
    low: number;
    close: number;
    time?: number | string;
    timestamp?: number | string;
  }>,
  period: number
) {
  if (candles.length < period + 1) {
    throw new Error(
      `ATR(${period}) requires at least ${period + 1} candles.`
    );
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );

    trueRanges.push(tr);
  }

  // Initial ATR is the average of the first `period` true ranges.
  let atr =
    trueRanges.slice(0, period).reduce((sum, value) => sum + value, 0) /
    period;

  const points: Array<{
    time: number | string;
    value: number;
  }> = [];

  const firstCandle = candles[period];

  points.push({
time: firstCandle.time ?? period,
    value: atr,
  });

  // Wilder's smoothing:
  // ATR = ((previous ATR * (period - 1)) + current TR) / period
  for (let i = period; i < trueRanges.length; i++) {
    atr =
      (atr * (period - 1) + trueRanges[i]) /
      period;

    const candle = candles[i + 1];

    points.push({
        time: candle.time ?? i + 1,
      value: atr,
    });
  }

  return points;
}

export async function runATRAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    // const marketData = await getMarketData(context);
    const marketData = await getMarketData(
  context.symbol,
  context.tradingType
);

    // Adjust this property if your existing market-data helper
    // returns candles under a different property name.
    const candles = marketData.candles;

    if (!Array.isArray(candles)) {
      throw new Error(
        "Market data did not return a candles array."
      );
    }

    const validCandles = candles.filter(
      (candle: any) =>
        Number.isFinite(Number(candle.high)) &&
        Number.isFinite(Number(candle.low)) &&
        Number.isFinite(Number(candle.close))
    );

    const atrPoints = calculateATR(
      validCandles,
      ATR_PERIOD
    );

    const latestCandle =
      validCandles[validCandles.length - 1];

    const currentATR =
      atrPoints[atrPoints.length - 1].value;

    const currentPrice = Number(latestCandle.close);

    if (
      !Number.isFinite(currentPrice) ||
      currentPrice <= 0 ||
      !Number.isFinite(currentATR) ||
      currentATR < 0
    ) {
      throw new Error("Unable to calculate a valid ATR result.");
    }

    const atrPercent = (currentATR / currentPrice) * 100;

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "ATR",
      period: ATR_PERIOD,
      currentPrice,
      currentATR,
      atrPercent,
      volatilityInterpretation:
        "ATR measures typical price movement per candle. It does not predict direction.",
      stopDistanceExamples: [
        {
          multiplier: 1,
          distance: currentATR,
          explanation: "1 × ATR",
        },
        {
          multiplier: 1.5,
          distance: currentATR * 1.5,
          explanation: "1.5 × ATR",
        },
        {
          multiplier: 2,
          distance: currentATR * 2,
          explanation: "2 × ATR",
        },
      ],
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      candleCount: validCandles.length,
      startTime: validCandles[0].time,        
      endTime: latestCandle.time,
      fetchedAt: new Date().toISOString(),
      limitations: [
        "ATR measures volatility, not market direction.",
        "Stop distances are illustrative, not guaranteed protection.",
        "Position sizing must also account for risk budget, lot size, liquidity and costs.",
      ],
    };

    // const chartLine: ToolChartLine = {
    //   name: `ATR(${ATR_PERIOD})`,
    //   color: "#F59E0B",
    //   points: atrPoints,
    // };

        const chartLine: ToolChartLine = {
        id: `atr-${ATR_PERIOD}`,
        label: `ATR(${ATR_PERIOD})`,
        color: "#F59E0B",
        points: atrPoints,
        };

    return {
      tool: "atrAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: [chartLine],
      },
    };
  } catch (error) {
    return {
      tool: "atrAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ATR analysis failed.",
    };
  }
}