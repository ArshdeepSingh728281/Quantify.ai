import { getMarketData } from "../market-data";

import type {
  ToolContext,
  ToolResult,
} from "../types";

/* ============================================================
   COLORS
============================================================ */

const SUPPORT_COLOR = "#28dc9b";
const RESISTANCE_COLOR = "#ff5064";

/* ============================================================
   TYPES
============================================================ */

type Candle = {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type LevelStrength = "strong" | "medium" | "weak";

type Level = {
  price: number;
  strength: LevelStrength;
  touches: number;
};

type TradingDataConfig = {
  tradingType: string;
  timeframe: string;
  interval: "1m" | "5m" | "1w";
  history: string;
  historyDays: number;
};

/* ============================================================
   TRADING TYPE CONFIGURATION
============================================================ */

/**
 * The trading type determines the candle interval and history
 * that market-data.ts must fetch.
 *
 * Intraday: last 5 trading days, 1-minute candles.
 * Swing:    last 1 month, 5-minute candles.
 * Long-term: last 5 years, weekly candles.
 */
function getTradingDataConfig(
  tradingType: ToolContext["tradingType"]
): TradingDataConfig {
  const normalized = String(tradingType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  switch (normalized) {
    case "intraday":
    case "day":
    case "daytrading":
      return {
        tradingType: "Intraday",
        timeframe: "1 minute",
        interval: "1m",
        history: "5 trading days",
        historyDays: 7,
      };

    case "longterm":
      return {
        tradingType: "Long-term",
        timeframe: "Weekly",
        interval: "1w",
        history: "5 years",
        historyDays: 365 * 5 + 2,
      };

    case "swing":
    default:
      return {
        tradingType: "Swing",
        timeframe: "5 minutes",
        interval: "5m",
        history: "1 month",
        historyDays: 32,
      };
  }
}

/* ============================================================
   PRICE HELPERS
============================================================ */

function roundPrice(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value >= 1000) {
    return Number(value.toFixed(0));
  }

  if (value >= 100) {
    return Number(value.toFixed(1));
  }

  return Number(value.toFixed(2));
}

function isValidCandle(value: unknown): value is Candle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candle = value as Record<string, unknown>;

  const numericFields = ["open", "high", "low", "close"];

  if (
    !numericFields.every(
      (field) =>
        typeof candle[field] === "number" &&
        Number.isFinite(candle[field])
    )
  ) {
    return false;
  }

  const open = candle.open as number;
  const high = candle.high as number;
  const low = candle.low as number;
  const close = candle.close as number;

  if (
    typeof candle.time !== "string" &&
    typeof candle.time !== "number"
  ) {
    return false;
  }

  if (
    typeof candle.time === "number" &&
    !Number.isFinite(candle.time)
  ) {
    return false;
  }

  if (
    typeof candle.time === "string" &&
    candle.time.trim().length === 0
  ) {
    return false;
  }

  return (
    open > 0 &&
    high > 0 &&
    low > 0 &&
    close > 0 &&
    high >= low &&
    high >= open &&
    high >= close &&
    low <= open &&
    low <= close
  );
}

/* ============================================================
   CANDLE ORDERING
============================================================ */

function getTimestampValue(
  time: string | number
): number | null {
  if (typeof time === "number") {
    if (!Number.isFinite(time)) {
      return null;
    }

    // Normalize Unix seconds to milliseconds.
    return time < 1e12 ? time * 1000 : time;
  }

  const parsed = Date.parse(time);

  return Number.isFinite(parsed) ? parsed : null;
}

function orderCandles(candles: Candle[]): Candle[] {
  const timestamps = candles.map((candle) =>
    getTimestampValue(candle.time)
  );

  // Do not guess the order if timestamps cannot be compared.
  if (timestamps.some((timestamp) => timestamp === null)) {
    return candles;
  }

  return candles
    .map((candle, index) => ({
      candle,
      timestamp: timestamps[index] as number,
      originalIndex: index,
    }))
    .sort(
      (a, b) =>
        a.timestamp - b.timestamp ||
        a.originalIndex - b.originalIndex
    )
    .map((item) => item.candle);
}

/* ============================================================
   FILTER HISTORY
============================================================ */

/**
 * Restricts the returned candles to the requested historical
 * window. The market-data provider must still supply candles
 * at the correct interval.
 *
 * Intraday uses 7 calendar days to cover 5 trading sessions.
 */
function filterCandlesByHistory(
  candles: Candle[],
  historyDays: number
): Candle[] {
  if (candles.length === 0) {
    return [];
  }

  const timestamps = candles.map((candle) =>
    getTimestampValue(candle.time)
  );

  if (timestamps.some((timestamp) => timestamp === null)) {
    // Without parseable timestamps, we cannot safely filter.
    return candles;
  }

  const latestTimestamp = Math.max(
    ...(timestamps as number[])
  );

  const earliestAllowed =
    latestTimestamp - historyDays * 24 * 60 * 60 * 1000;

  return candles.filter((candle) => {
    const timestamp = getTimestampValue(candle.time);

    return (
      timestamp !== null &&
      timestamp >= earliestAllowed &&
      timestamp <= latestTimestamp
    );
  });
}

/* ============================================================
   SWING POINTS
============================================================ */

/**
 * A swing high is at least as high as the three candles on
 * either side. This requires three candles after the high,
 * so the newest three candles cannot yet confirm a swing.
 */
function findSwingHighs(candles: Candle[]): number[] {
  const result: number[] = [];

  for (let i = 3; i < candles.length - 3; i++) {
    const current = candles[i].high;
    let isHigh = true;

    for (let j = i - 3; j <= i + 3; j++) {
      if (j === i) continue;

      if (candles[j].high > current) {
        isHigh = false;
        break;
      }
    }

    if (isHigh) {
      result.push(current);
    }
  }

  return result;
}

/**
 * A swing low is at least as low as the three candles on
 * either side.
 */
function findSwingLows(candles: Candle[]): number[] {
  const result: number[] = [];

  for (let i = 3; i < candles.length - 3; i++) {
    const current = candles[i].low;
    let isLow = true;

    for (let j = i - 3; j <= i + 3; j++) {
      if (j === i) continue;

      if (candles[j].low < current) {
        isLow = false;
        break;
      }
    }

    if (isLow) {
      result.push(current);
    }
  }

  return result;
}

/* ============================================================
   CLUSTER LEVELS
============================================================ */

/**
 * Groups swing prices within 1.5% of a cluster's average.
 * Strength is based on the number of detected swing points.
 *
 * Touches are swing-point counts, not counts of every
 * individual interaction with a price zone.
 */
function clusterLevels(prices: number[]): Level[] {
  if (prices.length === 0) {
    return [];
  }

  const sorted = [...prices]
    .filter(
      (price) => Number.isFinite(price) && price > 0
    )
    .sort((a, b) => a - b);

  const clusters: number[][] = [];

  for (const price of sorted) {
    const matchingCluster = clusters.find((cluster) => {
      const average =
        cluster.reduce((sum, value) => sum + value, 0) /
        cluster.length;

      return Math.abs(price - average) / average <= 0.015;
    });

    if (matchingCluster) {
      matchingCluster.push(price);
    } else {
      clusters.push([price]);
    }
  }

  return clusters.map((cluster): Level => {
    const average =
      cluster.reduce((sum, value) => sum + value, 0) /
      cluster.length;

    const touches = cluster.length;

    const strength: LevelStrength =
      touches >= 4
        ? "strong"
        : touches >= 2
          ? "medium"
          : "weak";

    return {
      price: roundPrice(average),
      strength,
      touches,
    };
  });
}

/* ============================================================
   MAIN TOOL
============================================================ */

export async function runSupportResistance(
  context: ToolContext
): Promise<ToolResult> {
  try {
    /* --------------------------------------------------------
       VALIDATE STOCK
    -------------------------------------------------------- */

    const symbol =
      typeof context.symbol === "string"
        ? context.symbol.trim().toUpperCase()
        : "";

    if (!symbol) {
      return {
        tool: "supportResistance",
        success: false,
        error: "A stock symbol is required for this analysis.",
        chart: null,
      };
    }

    /* --------------------------------------------------------
       SELECT TRADING CONFIGURATION
    -------------------------------------------------------- */

    const config = getTradingDataConfig(
      context.tradingType
    );

    /* --------------------------------------------------------
       FETCH MARKET DATA
    -------------------------------------------------------- */

    /**
     * IMPORTANT:
     * getMarketData must use the selected trading type to fetch
     * the configured interval and history:
     *
     * Intraday  -> 1-minute candles for 5 trading days
     * Swing     -> 5-minute candles for 1 month
     * Long-term -> weekly candles for 5 years
     *
     * This call preserves the existing two-argument interface.
     * See the integration note below if market-data.ts does not
     * already implement these selections.
     */
    const marketData = await getMarketData(
      symbol,
      context.tradingType
    );

    const rawCandles: unknown[] = Array.isArray(
      marketData?.candles
    )
      ? marketData.candles
      : [];

    const validCandles = rawCandles.filter(isValidCandle);
    const orderedCandles = orderCandles(validCandles);

    const candles = filterCandlesByHistory(
      orderedCandles,
      config.historyDays
    );

    if (candles.length < 20) {
      return {
        tool: "supportResistance",
        success: false,
        error:
          `Not enough valid ${config.timeframe} candle data for ${symbol}. ` +
          `The selected analysis requires ${config.history} of history; ` +
          `received ${candles.length} valid candles. Check that the market-data ` +
          `provider supports the selected interval and date range.`,
        chart: null,
      };
    }

    /* --------------------------------------------------------
       REFERENCE PRICE
    -------------------------------------------------------- */

    const latestCandle = candles[candles.length - 1];
    const currentPrice = latestCandle.close;

    if (
      !Number.isFinite(currentPrice) ||
      currentPrice <= 0
    ) {
      return {
        tool: "supportResistance",
        success: false,
        error: `A valid latest candle price is unavailable for ${symbol}.`,
        chart: null,
      };
    }

    /* --------------------------------------------------------
       FIND SWING POINTS
    -------------------------------------------------------- */

    const swingHighs = findSwingHighs(candles);
    const swingLows = findSwingLows(candles);

    /* --------------------------------------------------------
       CLUSTER LEVELS
    -------------------------------------------------------- */

    const allResistance = clusterLevels(
      swingHighs.filter((price) => price > currentPrice)
    );

    const allSupport = clusterLevels(
      swingLows.filter((price) => price < currentPrice)
    );

    // Nearest resistance first, moving upward.
    const resistance = allResistance
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);

    // Nearest support first, moving downward.
    const support = allSupport
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);

    if (
      support.length === 0 &&
      resistance.length === 0
    ) {
      return {
        tool: "supportResistance",
        success: false,
        error:
          `No reliable swing-based support or resistance levels ` +
          `were found for ${symbol} in the available ${config.timeframe} candles.`,
        chart: null,
      };
    }

    /* --------------------------------------------------------
       CHART PRICE LINES
    -------------------------------------------------------- */

    const chartLines = [
      ...support.map((level, index) => ({
        id: `support-${index + 1}-${level.price}`,
        label: `Support ${index + 1}`,
        price: level.price,
        color: SUPPORT_COLOR,
        dashed: true,
      })),

      ...resistance.map((level, index) => ({
        id: `resistance-${index + 1}-${level.price}`,
        label: `Resistance ${index + 1}`,
        price: level.price,
        color: RESISTANCE_COLOR,
        dashed: true,
      })),
    ];

    /* --------------------------------------------------------
       METADATA
    -------------------------------------------------------- */

    const latestCandleTime = latestCandle.time;

    /* --------------------------------------------------------
       RETURN TOOL RESULT
    -------------------------------------------------------- */

    return {
      tool: "supportResistance",
      success: true,

      data: {
        symbol,
        stockName: context.stockName?.trim() || symbol,
        instrumentKey: context.instrumentKey || null,

        currentPrice: roundPrice(currentPrice),

        support,
        resistance,

        tradingType: config.tradingType,
        riskLevel: context.riskLevel,

        timeframe: config.timeframe,
        interval: config.interval,
        history: config.history,

        candleCount: candles.length,

        latestCandleTime,

        methodology:
          "Support and resistance are estimated from swing highs and lows in the selected historical candle data. Swing prices within 1.5% of a cluster average are grouped into price zones. Strength is based on detected swing points, not every price interaction. Historical levels are estimates, not guaranteed price floors or ceilings.",

        dataRequirements: {
          interval: config.interval,
          history: config.history,
          historyDays: config.historyDays,
        },
      },

      chart: {
        type: "priceLines",
        lines: chartLines,
      },
    };
  } catch (error: unknown) {
    console.error(
      "[supportResistance] Calculation failed:",
      error
    );

    return {
      tool: "supportResistance",
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Support and resistance calculation failed.",

      chart: null,
    };
  }
}
