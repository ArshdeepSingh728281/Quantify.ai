import { getMarketData } from "../market-data";
import type {
  ToolContext,
  ToolResult,
  ToolChartLine,
} from "../types";

type FibonacciCandle = {
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number | string;
};

const RETRACEMENTS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const EXTENSIONS = [1.272, 1.618, 2];

export async function runFibonacciAnalysis(
  context: ToolContext
): Promise<ToolResult> {
  try {
    const marketData = await getMarketData(
      context.symbol,
      context.tradingType
    );

    const candles = (
      marketData.candles as FibonacciCandle[]
    ).filter(
      (c) =>
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close) &&
        c.high >= c.low &&
        c.time !== undefined
    );

    if (candles.length < 5) {
      throw new Error(
        "Fibonacci analysis requires at least 5 valid candles."
      );
    }

    // Use the most recent 50 candles to identify a swing.
    const swingCandles = candles.slice(-50);
    const lowIndex = swingCandles.reduce(
      (best, candle, index, arr) =>
        candle.low < arr[best].low ? index : best,
      0
    );
    const highIndex = swingCandles.reduce(
      (best, candle, index, arr) =>
        candle.high > arr[best].high ? index : best,
      0
    );

    const swingLow = swingCandles[lowIndex];
    const swingHigh = swingCandles[highIndex];
    const range = swingHigh.high - swingLow.low;

    if (range <= 0) {
      throw new Error("Unable to identify a valid price swing.");
    }

    // The order of the extreme points determines the swing direction.
    const direction =
      lowIndex < highIndex ? "upswing" : "downswing";

    const levels = RETRACEMENTS.map((ratio) => {
      const price =
        direction === "upswing"
          ? swingHigh.high - range * ratio
          : swingLow.low + range * ratio;

      return {
        type: "retracement",
        ratio,
        label: `${(ratio * 100).toFixed(1)}%`,
        price,
      };
    });

    const extensions = EXTENSIONS.map((ratio) => {
      const price =
        direction === "upswing"
          ? swingLow.low + range * ratio
          : swingHigh.high - range * (ratio - 1);

      return {
        type: "extension",
        ratio,
        label: `${(ratio * 100).toFixed(1)}%`,
        price,
      };
    });

    const allLevels = [...levels, ...extensions];
    const currentPrice = candles[candles.length - 1].close;
    const startTime = swingCandles[0].time;
    const endTime = candles[candles.length - 1].time;

    const chartLines: ToolChartLine[] = allLevels.map(
      (level, index) => ({
        id: `fibonacci-${level.type}-${level.ratio}`,
        label: `${level.label} ${level.type}`,
        color:
          level.type === "retracement"
            ? "#A78BFA"
            : "#F59E0B",
        points: [
          { time: startTime, value: level.price },
          { time: endTime, value: level.price },
        ],
      })
    );

    const resultData = {
      symbol: context.symbol,
      stockName: context.stockName,
      indicator: "Fibonacci Levels",
      tradingType: context.tradingType,
      interval: marketData.interval,
      intervalUnit: marketData.intervalUnit,
      intervalValue: marketData.intervalValue,
      currentPrice,
      swing: {
        direction,
        low: swingLow.low,
        lowTime: swingLow.time,
        high: swingHigh.high,
        highTime: swingHigh.time,
        candlesAnalyzed: swingCandles.length,
      },
      retracements: levels,
      extensions,
      fetchedAt: new Date().toISOString(),
      limitations: [
        "Swing points are selected from the highest high and lowest low in the most recent 50 candles.",
        "This automatic swing detection may not match a trader's manually identified swing points.",
        "Fibonacci levels are potential reference zones, not guaranteed support, resistance, or reversal points.",
      ],
    };

    return {
      tool: "fibonacciAnalysis",
      success: true,
      data: resultData,
      chart: {
        type: "line",
        lines: chartLines,
      },
    };
  } catch (error) {
    return {
      tool: "fibonacciAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Fibonacci analysis failed.",
    };
  }
}