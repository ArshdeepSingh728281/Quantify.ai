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

type Pivot = {
  index: number;
  time: number | string;
  price: number;
  indicatorValue: number;
  type: "high" | "low";
};

type DivergenceEvent = {
  indicator: "RSI" | "MACD";
  type:
    | "regular_bullish"
    | "regular_bearish"
    | "hidden_bullish"
    | "hidden_bearish";
  firstPrice: number;
  secondPrice: number;
  firstIndicator: number;
  secondIndicator: number;
  firstTime: number | string;
  secondTime: number | string;
  explanation: string;
};

const PIVOT_STRENGTH = 3;
const RSI_PERIOD = 14;

function calculateRSI(
  candles: Candle[],
  period: number
): (number | null)[] {
  const result: (number | null)[] = Array(candles.length).fill(null);

  if (candles.length <= period) return result;

  let averageGain = 0;
  let averageLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    averageGain += Math.max(change, 0);
    averageLoss += Math.max(-change, 0);
  }

  averageGain /= period;
  averageLoss /= period;

  const rsiValue = () =>
    averageLoss === 0
      ? averageGain === 0
        ? 50
        : 100
      : 100 - 100 / (1 + averageGain / averageLoss);

  result[period] = rsiValue();

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    averageGain =
      (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss =
      (averageLoss * (period - 1) + Math.max(-change, 0)) / period;

    result[i] = rsiValue();
  }

  return result;
}

function calculateEMA(
  values: number[],
  period: number
): (number | null)[] {
  const result: (number | null)[] = Array(values.length).fill(null);

  if (values.length < period) return result;

  const multiplier = 2 / (period + 1);
  let ema =
    values.slice(0, period).reduce((sum, value) => sum + value, 0) /
    period;

  result[period - 1] = ema;

  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
    result[i] = ema;
  }

  return result;
}

function calculateMACD(candles: Candle[]): (number | null)[] {
  const closes = candles.map((c) => c.close);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  return closes.map((_, index) => {
    if (ema12[index] === null || ema26[index] === null) return null;
    return ema12[index]! - ema26[index]!;
  });
}

function findPivots(
  candles: Candle[],
  indicator: (number | null)[],
  type: "high" | "low"
): Pivot[] {
  const pivots: Pivot[] = [];

  for (
    let i = PIVOT_STRENGTH;
    i < candles.length - PIVOT_STRENGTH;
    i++
  ) {
    const value = indicator[i];

    if (value === null || !Number.isFinite(value)) continue;

    let isPivot = true;

    for (let offset = 1; offset <= PIVOT_STRENGTH; offset++) {
      const left = candles[i - offset];
      const right = candles[i + offset];

      if (type === "high") {
        if (
          candles[i].high <= left.high ||
          candles[i].high <= right.high
        ) {
          isPivot = false;
          break;
        }
      } else if (
        candles[i].low >= left.low ||
        candles[i].low >= right.low
      ) {
        isPivot = false;
        break;
      }
    }

    if (isPivot) {
      pivots.push({
        index: i,
        time: candles[i].time,
        price: type === "high" ? candles[i].high : candles[i].low,
        indicatorValue: value,
        type,
      });
    }
  }

  return pivots;
}

function detectDivergences(
  candles: Candle[],
  indicator: (number | null)[],
  indicatorName: "RSI" | "MACD"
): DivergenceEvent[] {
  const events: DivergenceEvent[] = [];

  for (const type of ["high", "low"] as const) {
    const pivots = findPivots(candles, indicator, type);

    // Compare consecutive confirmed pivots of the same type.
    for (let i = 1; i < pivots.length; i++) {
      const first = pivots[i - 1];
      const second = pivots[i];

      // Ignore pivots that are too close or too far apart.
      const distance = second.index - first.index;
      if (distance < 5 || distance > 60) continue;

      const priceHigher = second.price > first.price;
      const priceLower = second.price < first.price;
      const indicatorHigher =
        second.indicatorValue > first.indicatorValue;
      const indicatorLower =
        second.indicatorValue < first.indicatorValue;

      let divergenceType: DivergenceEvent["type"] | null = null;
      let explanation = "";

      if (
        type === "low" &&
        priceLower &&
        indicatorHigher
      ) {
        divergenceType = "regular_bullish";
        explanation =
          "Price made a lower low while the indicator made a higher low, suggesting potential weakening of downward momentum.";
      } else if (
        type === "high" &&
        priceHigher &&
        indicatorLower
      ) {
        divergenceType = "regular_bearish";
        explanation =
          "Price made a higher high while the indicator made a lower high, suggesting potential weakening of upward momentum.";
      } else if (
        type === "low" &&
        priceHigher &&
        indicatorLower
      ) {
        divergenceType = "hidden_bullish";
        explanation =
          "Price made a higher low while the indicator made a lower low, which may be consistent with bullish trend continuation.";
      } else if (
        type === "high" &&
        priceLower &&
        indicatorHigher
      ) {
        divergenceType = "hidden_bearish";
        explanation =
          "Price made a lower high while the indicator made a higher high, which may be consistent with bearish trend continuation.";
      }

      if (divergenceType) {
        events.push({
          indicator: indicatorName,
          type: divergenceType,
          firstPrice: first.price,
          secondPrice: second.price,
          firstIndicator: first.indicatorValue,
          secondIndicator: second.indicatorValue,
          firstTime: first.time,
          secondTime: second.time,
          explanation,
        });
      }
    }
  }

  return events.sort((a, b) => {
    const timeA = candles.findIndex((c) => c.time === a.secondTime);
    const timeB = candles.findIndex((c) => c.time === b.secondTime);
    return timeA - timeB;
  });
}

export async function runDivergenceAnalysis(
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
      .slice(-300);

    if (candles.length < 80) {
      throw new Error(
        "Divergence detection requires at least 80 valid candles for indicator warm-up and confirmed swings."
      );
    }

    const rsi = calculateRSI(candles, RSI_PERIOD);
    const macd = calculateMACD(candles);

    const rsiEvents = detectDivergences(candles, rsi, "RSI");
    const macdEvents = detectDivergences(candles, macd, "MACD");

    const events = [...rsiEvents, ...macdEvents].sort((a, b) => {
      const indexA = candles.findIndex((c) => c.time === a.secondTime);
      const indexB = candles.findIndex((c) => c.time === b.secondTime);
      return indexB - indexA;
    });

    const recentEvents = events.slice(-20).reverse();
    const latestPrice = candles[candles.length - 1].close;

    // These lines are indicator values on candle timestamps.
    // They are intended for an indicator pane, not the price scale.
    const chartLines: ToolChartLine[] = [
      {
        id: "divergence-rsi",
        label: "RSI (14)",
        color: "#A78BFA",
        points: candles.flatMap((candle, index) =>
          rsi[index] === null
            ? []
            : [{ time: candle.time, value: rsi[index]! }]
        ),
      },
      {
        id: "divergence-macd",
        label: "MACD (12,26)",
        color: "#38BDF8",
        points: candles.flatMap((candle, index) =>
          macd[index] === null
            ? []
            : [{ time: candle.time, value: macd[index]! }]
        ),
      },
    ];

    return {
      tool: "divergenceAnalysis",
      success: true,
      data: {
        symbol: context.symbol,
        stockName: context.stockName,
        indicator: "Divergence Detection",
        tradingType: context.tradingType,
        interval: marketData.interval,
        intervalUnit: marketData.intervalUnit,
        intervalValue: marketData.intervalValue,
        currentPrice: latestPrice,
        candlesAnalyzed: candles.length,
        pivotStrength: PIVOT_STRENGTH,
        indicatorsChecked: ["RSI (14)", "MACD (12,26)"],
        divergenceCount: events.length,
        recentDivergences: recentEvents,
        latestDivergence: recentEvents[0] ?? null,
        fetchedAt: new Date().toISOString(),
        limitations: [
          "Divergence is based on confirmed three-candle pivots on each side; detection is delayed until the right-side candles close.",
          "MACD uses the MACD line (12,26), without the signal line, for this divergence comparison.",
          "Only consecutive pivots of the same type, separated by 5 to 60 candles, are compared.",
          "Divergence can persist or fail and does not guarantee a reversal.",
        ],
      },
      chart: {
        type: "line",
        lines: chartLines,
      },
    };
  } catch (error) {
     console.log("[divergenceAnalysis] Failed:", error);
    return {
      tool: "divergenceAnalysis",
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Divergence analysis failed.",
    };
  }
}