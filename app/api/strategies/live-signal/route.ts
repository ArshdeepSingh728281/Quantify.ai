import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMarketData } from "@/app/api/ai/chat/market-data";
import { validateStrategy } from "@/app/api/ai/chat/tools/strategyEngine";
import type { StrategyDefinition } from "@/app/api/ai/chat/tools/strategyEngine";

export const runtime = "nodejs";

function ema(
  values: number[],
  period: number
): Array<number | null> {
  const output: Array<number | null> = Array(values.length).fill(null);

  if (values.length < period || period < 2) return output;

  const multiplier = 2 / (period + 1);
  let current =
    values.slice(0, period).reduce((sum, value) => sum + value, 0) /
    period;

  output[period - 1] = current;

  for (let i = period; i < values.length; i++) {
    current = (values[i] - current) * multiplier + current;
    output[i] = current;
  }

  return output;
}

function rsi(
  values: number[],
  period: number
): Array<number | null> {
  const output: Array<number | null> = Array(values.length).fill(null);

  if (values.length <= period || period < 2) return output;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];

    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  output[period] =
    avgLoss === 0
      ? 100
      : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];

    avgGain =
      (avgGain * (period - 1) + Math.max(change, 0)) /
      period;

    avgLoss =
      (avgLoss * (period - 1) + Math.max(-change, 0)) /
      period;

    output[i] =
      avgLoss === 0
        ? 100
        : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return output;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const symbol =
      typeof body.symbol === "string"
        ? body.symbol.trim().toUpperCase()
        : "";

    const tradingType =
      typeof body.tradingType === "string"
        ? body.tradingType
        : "Swing";

    const instrumentKey =
      typeof body.instrumentKey === "string"
        ? body.instrumentKey
        : undefined;

    const strategy =
      body.strategy as StrategyDefinition | undefined;

    if (!symbol || !strategy) {
      return NextResponse.json(
        { error: "symbol and strategy are required" },
        { status: 400 }
      );
    }

    const validationErrors = validateStrategy(strategy);

    if (validationErrors.length) {
      return NextResponse.json(
        {
          error: "Invalid strategy",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    const market = await getMarketData(
      symbol,
      tradingType,
      instrumentKey
    );

    const candles = market.candles.filter(
      (candle) =>
        Number.isFinite(candle.close) &&
        candle.close > 0
    );

    const minimum =
      Math.max(strategy.slowPeriod, strategy.rsiPeriod) + 3;

    if (candles.length < minimum) {
      return NextResponse.json(
        {
          error: `Not enough candles (${candles.length}); need at least ${minimum}`,
        },
        { status: 422 }
      );
    }

    const closes = candles.map((candle) => candle.close);
    const fast = ema(closes, strategy.fastPeriod);
    const slow = ema(closes, strategy.slowPeriod);
    const rsiValues = rsi(closes, strategy.rsiPeriod);

    const lastIndex = candles.length - 1;
    const priorIndex = lastIndex - 1;
    const last = candles[lastIndex];

    let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
    let reason = "No new strategy trigger on the latest candle.";

    if (strategy.type === "ema_crossover") {
      const valuesReady =
        fast[priorIndex] !== null &&
        slow[priorIndex] !== null &&
        fast[lastIndex] !== null &&
        slow[lastIndex] !== null;

      if (valuesReady) {
        if (
          fast[priorIndex]! <= slow[priorIndex]! &&
          fast[lastIndex]! > slow[lastIndex]!
        ) {
          signal = "BUY";
          reason = `EMA ${strategy.fastPeriod} crossed above EMA ${strategy.slowPeriod}.`;
        } else if (
          fast[priorIndex]! >= slow[priorIndex]! &&
          fast[lastIndex]! < slow[lastIndex]!
        ) {
          signal = "SELL";
          reason = `EMA ${strategy.fastPeriod} crossed below EMA ${strategy.slowPeriod}.`;
        }
      }
    } else {
      const currentRsi = rsiValues[lastIndex];
      const previousRsi = rsiValues[priorIndex];

      if (
        currentRsi !== null &&
        previousRsi !== null &&
        previousRsi < strategy.rsiEntryBelow &&
        currentRsi >= strategy.rsiEntryBelow
      ) {
        signal = "BUY";
        reason = `RSI crossed back above ${strategy.rsiEntryBelow}.`;
      } else if (
        currentRsi !== null &&
        currentRsi >= strategy.rsiExitAbove
      ) {
        signal = "SELL";
        reason = `RSI is at or above ${strategy.rsiExitAbove}.`;
      }
    }

    return NextResponse.json({
      symbol,
      tradingType,
      strategy,
      signal,
      reason,
      latestCandle: {
        time: last.time,
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
        volume: last.volume,
      },
      indicators: {
        emaFast: fast[lastIndex],
        emaSlow: slow[lastIndex],
        rsi: rsiValues[lastIndex],
      },
      marketFetchedAt: market.fetchedAt,
      evaluatedAt: new Date().toISOString(),
      note:
        "Signal is computed from the latest candle returned by the market-data provider. Confirm whether the candle is complete. This endpoint does not place orders.",
      chart: {
        type: "priceLines",
        lines: [],
        drawings:
          signal === "HOLD"
            ? []
            : [
                {
                  type: "point",
                  id: `live-${signal.toLowerCase()}-${last.time}`,
                  time: last.time,
                  price: last.close,
                  text: `LIVE ${signal}`,
                  marker:
                    signal === "BUY"
                      ? "arrowUp"
                      : "arrowDown",
                  color:
                    signal === "BUY"
                      ? "#16a34a"
                      : "#dc2626",
                },
              ],
      },
    });
  } catch (error) {
    console.error("[LIVE STRATEGY SIGNAL]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not calculate live strategy signal",
      },
      { status: 500 }
    );
  }
}