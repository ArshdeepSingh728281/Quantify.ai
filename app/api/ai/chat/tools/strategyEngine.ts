// app/api/ai/chat/tools/strategyEngine.ts

import type { MarketCandle } from "../market-data";

export type StrategyType = "ema_crossover" | "rsi_reversal";

export type StrategyDefinition = {
  name: string;
  description: string;
  type: StrategyType;
  fastPeriod: number;
  slowPeriod: number;
  rsiPeriod: number;
  rsiEntryBelow: number;
  rsiExitAbove: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  positionSizePercent: number;
};

export type StrategyBacktestConfig = {
  initialCapital: number;
  commissionPercent: number;
  slippagePercent: number;
};

export type StrategyTrade = {
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  grossPnl: number;
  netPnl: number;
  returnPercent: number;
  exitReason: "strategy" | "stopLoss" | "takeProfit" | "endOfData";
};

export type StrategyBacktestResult = {
  strategy: StrategyDefinition;
  candleCount: number;
  initialCapital: number;
  finalEquity: number;
  netProfit: number;
  netReturnPercent: number;
  winRatePercent: number;
  maxDrawdownPercent: number;
  profitFactor: number | null;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  trades: StrategyTrade[];
  equityCurve: Array<{ time: string; equity: number }>;
  warnings: string[];
};

type IndicatorRow = {
  emaFast: number | null;
  emaSlow: number | null;
  rsi: number | null;
};

const DEFAULT_CONFIG: StrategyBacktestConfig = {
  initialCapital: 100_000,
  commissionPercent: 0.05,
  slippagePercent: 0.05,
};

function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateCandles(candles: MarketCandle[]): MarketCandle[] {
  return candles
    .filter(
      (c) =>
        c &&
        typeof c.time === "string" &&
        Number.isFinite(new Date(c.time).getTime()) &&
        validNumber(c.open) &&
        validNumber(c.high) &&
        validNumber(c.low) &&
        validNumber(c.close) &&
        validNumber(c.volume) &&
        c.open > 0 &&
        c.high > 0 &&
        c.low > 0 &&
        c.close > 0 &&
        c.high >= Math.max(c.open, c.close, c.low) &&
        c.low <= Math.min(c.open, c.close, c.high) &&
        c.volume >= 0
    )
    .slice()
    .sort(
      (a, b) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
    )
    .filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);
}

function calculateEMA(
  values: number[],
  period: number
): Array<number | null> {
  const output: Array<number | null> = Array(values.length).fill(null);

  if (period < 2 || values.length < period) {
    return output;
  }

  const multiplier = 2 / (period + 1);

  let ema =
    values.slice(0, period).reduce((sum, value) => sum + value, 0) /
    period;

  output[period - 1] = ema;

  for (let i = period; i < values.length; i++) {
    ema = values[i] * multiplier + ema * (1 - multiplier);
    output[i] = ema;
  }

  return output;
}

function calculateRSI(
  closes: number[],
  period: number
): Array<number | null> {
  const output: Array<number | null> = Array(closes.length).fill(null);

  if (period < 2 || closes.length <= period) {
    return output;
  }

  let averageGain = 0;
  let averageLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];

    averageGain += Math.max(change, 0);
    averageLoss += Math.max(-change, 0);
  }

  averageGain /= period;
  averageLoss /= period;

  const getValue = (): number => {
    if (averageLoss === 0 && averageGain === 0) return 50;
    if (averageLoss === 0) return 100;

    const rs = averageGain / averageLoss;

    return 100 - 100 / (1 + rs);
  };

  output[period] = getValue();

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];

    averageGain =
      (averageGain * (period - 1) + Math.max(change, 0)) / period;

    averageLoss =
      (averageLoss * (period - 1) + Math.max(-change, 0)) / period;

    output[i] = getValue();
  }

  return output;
}

function calculateIndicators(
  candles: MarketCandle[],
  strategy: StrategyDefinition
): IndicatorRow[] {
  const closes = candles.map((c) => c.close);

  const fast = calculateEMA(closes, strategy.fastPeriod);
  const slow = calculateEMA(closes, strategy.slowPeriod);
  const rsi = calculateRSI(closes, strategy.rsiPeriod);

  return candles.map((_, i) => ({
    emaFast: fast[i],
    emaSlow: slow[i],
    rsi: rsi[i],
  }));
}

export function validateStrategy(
  strategy: StrategyDefinition
): string[] {
  const errors: string[] = [];

  if (!strategy.name?.trim()) {
    errors.push("Strategy name is required.");
  }

  if (
    strategy.type !== "ema_crossover" &&
    strategy.type !== "rsi_reversal"
  ) {
    errors.push("Unsupported strategy type.");
  }

  for (const [name, value] of [
    ["fastPeriod", strategy.fastPeriod],
    ["slowPeriod", strategy.slowPeriod],
    ["rsiPeriod", strategy.rsiPeriod],
  ] as const) {
    if (!Number.isInteger(value) || value < 2 || value > 300) {
      errors.push(`${name} must be an integer between 2 and 300.`);
    }
  }

  if (strategy.fastPeriod >= strategy.slowPeriod) {
    errors.push("fastPeriod must be smaller than slowPeriod.");
  }

  if (
    !validNumber(strategy.rsiEntryBelow) ||
    strategy.rsiEntryBelow < 1 ||
    strategy.rsiEntryBelow > 50
  ) {
    errors.push("rsiEntryBelow must be between 1 and 50.");
  }

  if (
    !validNumber(strategy.rsiExitAbove) ||
    strategy.rsiExitAbove < 50 ||
    strategy.rsiExitAbove > 99
  ) {
    errors.push("rsiExitAbove must be between 50 and 99.");
  }

  if (
    !validNumber(strategy.stopLossPercent) ||
    strategy.stopLossPercent <= 0 ||
    strategy.stopLossPercent >= 100
  ) {
    errors.push("stopLossPercent must be greater than 0 and below 100.");
  }

  if (
    !validNumber(strategy.takeProfitPercent) ||
    strategy.takeProfitPercent <= 0
  ) {
    errors.push("takeProfitPercent must be greater than 0.");
  }

  if (
    !validNumber(strategy.positionSizePercent) ||
    strategy.positionSizePercent <= 0 ||
    strategy.positionSizePercent > 100
  ) {
    errors.push("positionSizePercent must be greater than 0 and at most 100.");
  }

  return errors;
}

function getEntrySignal(
  strategy: StrategyDefinition,
  previous: IndicatorRow,
  current: IndicatorRow
): boolean {
  if (strategy.type === "ema_crossover") {
    return (
      previous.emaFast !== null &&
      previous.emaSlow !== null &&
      current.emaFast !== null &&
      current.emaSlow !== null &&
      previous.emaFast <= previous.emaSlow &&
      current.emaFast > current.emaSlow
    );
  }

  return (
    previous.rsi !== null &&
    current.rsi !== null &&
    previous.rsi < strategy.rsiEntryBelow &&
    current.rsi >= strategy.rsiEntryBelow
  );
}

function getExitSignal(
  strategy: StrategyDefinition,
  previous: IndicatorRow,
  current: IndicatorRow
): boolean {
  if (strategy.type === "ema_crossover") {
    return (
      previous.emaFast !== null &&
      previous.emaSlow !== null &&
      current.emaFast !== null &&
      current.emaSlow !== null &&
      previous.emaFast >= previous.emaSlow &&
      current.emaFast < current.emaSlow
    );
  }

  return (
    current.rsi !== null &&
    current.rsi >= strategy.rsiExitAbove
  );
}

export function runStrategyBacktest(
  inputCandles: MarketCandle[],
  strategy: StrategyDefinition,
  config: Partial<StrategyBacktestConfig> = {}
): StrategyBacktestResult {
  const validationErrors = validateStrategy(strategy);

  if (validationErrors.length > 0) {
    throw new Error(`Invalid strategy: ${validationErrors.join(" ")}`);
  }

  const candles = validateCandles(inputCandles);

  if (
    candles.length <
    Math.max(strategy.slowPeriod, strategy.rsiPeriod) + 3
  ) {
    throw new Error(
      "Not enough valid historical candles to backtest this strategy."
    );
  }

  const settings = { ...DEFAULT_CONFIG, ...config };

  if (
    !validNumber(settings.initialCapital) ||
    settings.initialCapital <= 0
  ) {
    throw new Error("initialCapital must be greater than zero.");
  }

  if (
    !validNumber(settings.commissionPercent) ||
    settings.commissionPercent < 0 ||
    !validNumber(settings.slippagePercent) ||
    settings.slippagePercent < 0
  ) {
    throw new Error("Commission and slippage must be non-negative numbers.");
  }

  const indicators = calculateIndicators(candles, strategy);

  const warnings: string[] = [
    "This is a historical simulation, not a prediction of future performance.",
    "Taxes, exchange charges, liquidity constraints and market impact are not included.",
    "EMA and RSI are calculated over historical candles inside the backtest; current-only tool results are not treated as historical signals.",
    "If a stop-loss and take-profit are both touched in the same candle, the stop-loss is assumed to execute first.",
    "Stop-loss and take-profit gap execution is approximated using the configured trigger price; real execution may differ.",
    "Open positions are marked to market at each candle close. The final open position is closed at the final candle close.",
  ];

  let cash = settings.initialCapital;
  let equity = settings.initialCapital;
  let peakEquity = equity;
  let maxDrawdownPercent = 0;

  let position:
    | {
        entryTime: string;
        entryPrice: number;
        quantity: number;
        entryFee: number;
        stopPrice: number;
        targetPrice: number;
      }
    | null = null;

  const trades: StrategyTrade[] = [];

  const equityCurve: Array<{ time: string; equity: number }> = [
    { time: candles[0].time, equity },
  ];

  // Signals are known only after a candle closes.
  // Pending orders execute no earlier than the next candle's open.
  let pendingEntry = false;
  let pendingExit = false;

  const closePosition = (
    candleIndex: number,
    rawExitPrice: number,
    reason: StrategyTrade["exitReason"]
  ): void => {
    if (!position) return;

    const candle = candles[candleIndex];

    // Sell-side slippage reduces the actual exit price.
    const exitPrice =
      rawExitPrice * (1 - settings.slippagePercent / 100);

    const exitValue = position.quantity * exitPrice;

    const exitFee =
      exitValue * (settings.commissionPercent / 100);

    const grossPnl =
      (exitPrice - position.entryPrice) * position.quantity;

    const netPnl = grossPnl - position.entryFee - exitFee;

    const entryValue = position.entryPrice * position.quantity;

    cash += exitValue - exitFee;

    trades.push({
      entryTime: position.entryTime,
      exitTime: candle.time,
      entryPrice: position.entryPrice,
      exitPrice,
      quantity: position.quantity,
      grossPnl,
      netPnl,
      returnPercent:
        entryValue > 0 ? (netPnl / entryValue) * 100 : 0,
      exitReason: reason,
    });

    position = null;
  };

  for (let i = 1; i < candles.length; i++) {
    const candle = candles[i];

    const previousIndicators = indicators[i - 1];
    const currentIndicators = indicators[i];

    // 1. Execute a previously signalled exit at this candle's open.
    if (position && pendingExit) {
      closePosition(i, candle.open, "strategy");
      pendingExit = false;
    }

    // 2. Execute a previously signalled entry at this candle's open.
    if (!position && pendingEntry) {
      const entryPrice =
        candle.open * (1 + settings.slippagePercent / 100);

      const budget =
        cash * (strategy.positionSizePercent / 100);

      const quantity = Math.floor(budget / entryPrice);

      if (quantity > 0) {
        const entryValue = quantity * entryPrice;

        const entryFee =
          entryValue * (settings.commissionPercent / 100);

        if (entryValue + entryFee <= cash) {
          cash -= entryValue + entryFee;

          position = {
            entryTime: candle.time,
            entryPrice,
            quantity,
            entryFee,
            stopPrice:
              entryPrice * (1 - strategy.stopLossPercent / 100),
            targetPrice:
              entryPrice * (1 + strategy.takeProfitPercent / 100),
          };
        }
      }

      pendingEntry = false;
    }

    // 3. Check intrabar risk levels.
    // If both are touched, use the conservative stop-first assumption.
    if (position) {
      if (candle.low <= position.stopPrice) {
        closePosition(i, position.stopPrice, "stopLoss");
        pendingExit = false;
      } else if (candle.high >= position.targetPrice) {
        closePosition(i, position.targetPrice, "takeProfit");
        pendingExit = false;
      }
    }

    // 4. Generate signals using data available at this candle's close.
    // These signals may execute only on the next candle.
    if (i + 1 < candles.length) {
      if (position) {
        pendingEntry = false;

        if (
          getExitSignal(
            strategy,
            previousIndicators,
            currentIndicators
          )
        ) {
          pendingExit = true;
        } else {
          pendingExit = false;
        }
      } else {
        pendingExit = false;

        if (
          getEntrySignal(
            strategy,
            previousIndicators,
            currentIndicators
          )
        ) {
          pendingEntry = true;
        } else {
          pendingEntry = false;
        }
      }
    } else {
      // There is no next candle in which to execute a new signal.
      pendingEntry = false;
      pendingExit = false;
    }

    // 5. Mark the portfolio to this candle's closing price.
    equity =
      cash + (position ? position.quantity * candle.close : 0);

    peakEquity = Math.max(peakEquity, equity);

    if (peakEquity > 0) {
      maxDrawdownPercent = Math.max(
        maxDrawdownPercent,
        ((peakEquity - equity) / peakEquity) * 100
      );
    }

    equityCurve.push({
      time: candle.time,
      equity,
    });
  }

  // Close any remaining position at the final candle's close.
  if (position) {
    closePosition(
      candles.length - 1,
      candles[candles.length - 1].close,
      "endOfData"
    );

    equity = cash;

    equityCurve[equityCurve.length - 1].equity = equity;
  }

  const finalEquity = equity;
  const netProfit = finalEquity - settings.initialCapital;

  const winningTrades = trades.filter((trade) => trade.netPnl > 0);
  const losingTrades = trades.filter((trade) => trade.netPnl < 0);

  const grossWins = winningTrades.reduce(
    (sum, trade) => sum + trade.netPnl,
    0
  );

  const grossLosses = Math.abs(
    losingTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
  );

  return {
    strategy,
    candleCount: candles.length,
    initialCapital: settings.initialCapital,
    finalEquity,
    netProfit,
    netReturnPercent:
      (netProfit / settings.initialCapital) * 100,
    winRatePercent:
      trades.length > 0
        ? (winningTrades.length / trades.length) * 100
        : 0,
    maxDrawdownPercent,
    profitFactor:
      grossLosses > 0
        ? grossWins / grossLosses
        : grossWins > 0
          ? null
          : 0,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    trades,
    equityCurve,
    warnings,
  };
}