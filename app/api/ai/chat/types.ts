// export type TradingType =
//   | "intraday"
//   | "swing"
//   | "longterm"
//   | string;

// export type RiskLevel =
//   | "low"
//   | "medium"
//   | "high"
//   | string;

// export type ChatRole =
//   | "user"
//   | "assistant"| "system";

// export type AgentMessage = {
//   role: ChatRole;
//   content: string;
// };

// /* ============================================================
//    TOOL TYPES
// ============================================================ */

// // export type ToolName =
// //   | "supportResistance";


// export type ToolName =
//   | "supportResistance"
//   | "trendAnalysis"
//   | "rsiAnalysis"
//   | "adxAnalysis"
//   | "atrAnalysis"
//   | "bollingerAnalysis"
//   | "volumeAnalysis"
//   | "vwapAnalysis"
//   | "stochasticAnalysis"
//   | "obvAnalysis"
//   | "volumeProfileAnalysis"
//   | "fibonacciAnalysis"
//   | "marketStructureAnalysis"
//   | "breakoutAnalysis"
//   | "divergenceAnalysis"
//   | "marketRegimeAnalysis";

// export type AgentContext = {
//   symbol: string;

//   stockName: string;

//   price?: number | null;

//   change?: number | null;

//   changePercent?: number | null;

//   tradingType: TradingType;

//   riskLevel: RiskLevel;

//   instrumentKey?:
//     | string
//     | null;
// };

// export type ToolContext =
//   AgentContext;

// /* ============================================================
//    CHART
// ============================================================ */

// export type ToolChartLine = {
//   id: string;

//   label: string;

//   price?: number;

//   color: string;

//   dashed?: boolean;

//   points?: {
//     time: string | number;
//     value: number;
//   }[];
// };


// /* ============================================================
//    TOOL RESULT
// ============================================================ */

// export type ToolResult = {
//   tool: ToolName;

//   success: boolean;

//   data?: unknown;

//   error?: string;

//   chart?: ToolChart | null;
// };

// /* ============================================================
//    AGENT RESULT
// ============================================================ */

// export type AgentResult = {
//   answer: string;

//   toolsUsed:
//     ToolResult[];
// };



// export type ToolChartDrawing =
//   | {
//       type: "straightLine";
//       id: string;
//       start: { time: string | number; price: number };
//       end: { time: string | number; price: number };
//       color: string;
//       width?: number;
//       style?: "solid" | "dashed" | "dotted";
//     }
//   | {
//       type: "point";
//       id: string;
//       time: string | number;
//       price: number;
//       text?: string;
//       color: string;
//       marker?: "circle" | "arrowUp" | "arrowDown";
//     }
//   | {
//       type: "series";
//       id: string;
//       name: string;
//       source: "candles" | "values";
//       indicator?: "SMA" | "EMA";
//       period?: number;
//       values?: {
//         time: string | number;
//         value: number;
//       }[];
//       color: string;
//       width?: number;
//       style?: "solid" | "dashed" | "dotted";
//     }
//   | {
//       type: "rectangle";
//       id: string;
//       startTime: string | number;
//       endTime: string | number;
//       top: number;
//       bottom: number;
//       color: string;
//       opacity?: number;
//       label?: string;
//     };

// export type ToolChart = {
//   type: "priceLines" | "line";
//   lines: ToolChartLine[];
//   drawings?: ToolChartDrawing[];
// };







export type TradingType =
  | "intraday"
  | "swing"
  | "longterm"
  | string;

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | string;

export type ChatRole = "user" | "assistant" | "system";

export type AgentMessage = {
  role: ChatRole;
  content: string;
};

/* ============================================================
   TOOL TYPES
============================================================ */

export type ToolName =
  | "supportResistance"
  | "trendAnalysis"
  | "rsiAnalysis"
  | "adxAnalysis"
  | "atrAnalysis"
  | "bollingerAnalysis"
  | "volumeAnalysis"
  | "vwapAnalysis"
  | "stochasticAnalysis"
  | "obvAnalysis"
  | "volumeProfileAnalysis"
  | "fibonacciAnalysis"
  | "marketStructureAnalysis"
  | "breakoutAnalysis"
  | "divergenceAnalysis"
  | "marketRegimeAnalysis";

export type AgentContext = {
  symbol: string;
  stockName: string;
  price?: number | null;
  change?: number | null;
  changePercent?: number | null;
  tradingType: TradingType;
  riskLevel: RiskLevel;
  instrumentKey?: string | null;
};

export type ToolContext = AgentContext;

/* ============================================================
   CHART
============================================================ */

export type ToolChartLine = {
  id: string;
  label: string;
  price?: number;
  color: string;
  dashed?: boolean;
  points?: {
    time: string | number;
    value: number;
  }[];
};




export type ToolChartDrawing =
  | {
      type: "point";
      id: string;
      time: string | number;
      price: number;
      text?: string;
      color: string;
      marker?: "circle" | "arrowUp" | "arrowDown";
    }
  | {
      type: "straightLine";
      id: string;
      start: { time: string | number; price: number };
      end: { time: string | number; price: number };
      color: string;
      width?: number;
      style?: "solid" | "dashed" | "dotted";
    }
  | {
      type: "series";
      id: string;
      name: string;
      source: "candles" | "values";
      indicator?: "SMA" | "EMA";
      period?: number;
      values?: Array<{ time: string | number; value: number }>;
      color: string;
      width?: number;
      style?: "solid" | "dashed" | "dotted";
    };




// export type ToolChartDrawing =
//   | {
//       type: "straightLine";
//       id: string;
//       start: { time: string | number; price: number };
//       end: { time: string | number; price: number };
//       color: string;
//       width?: number;
//       style?: "solid" | "dashed" | "dotted";
//     }
//   | {
//       type: "point";
//       id: string;
//       time: string | number;
//       price: number;
//       text?: string;
//       color: string;
//       marker?: "circle" | "arrowUp" | "arrowDown";
//     }
//   | {
//       type: "series";
//       id: string;
//       name: string;
//       source: "candles" | "values";
//       indicator?: "SMA" | "EMA";
//       period?: number;
//       values?: {
//         time: string | number;
//         value: number;
//       }[];
//       color: string;
//       width?: number;
//       style?: "solid" | "dashed" | "dotted";
//     }
//   | {
//       type: "rectangle";
//       id: string;
//       startTime: string | number;
//       endTime: string | number;
//       top: number;
//       bottom: number;
//       color: string;
//       opacity?: number;
//       label?: string;
//     };

export type ToolChart = {
  type: "priceLines" | "line";
  lines: ToolChartLine[];
  drawings?: ToolChartDrawing[];
};

/* ============================================================
   TOOL RESULT
============================================================ */

export type ToolResult = {
  tool: ToolName;
  success: boolean;
  data?: unknown;
  error?: string;
  chart?: ToolChart | null;
};

/* ============================================================
   STRATEGY BACKTEST RESULT
============================================================ */

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

export type StrategyEquityPoint = {
  time: string;
  equity: number;
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
  equityCurve: StrategyEquityPoint[];
  warnings: string[];
};

/**
 * Strategy results are separate from ordinary indicator-tool results.
 * The API can persist the backtest and its chart without pretending
 * the strategy is one of the registered technical-analysis tools.
 */
export type StrategyRunResult = {
  symbol: string;
  strategy: StrategyDefinition;
  backtest: StrategyBacktestResult;
  chart: ToolChart;
  createdAt: string;
scenarioCurve?: {
  basis: string;
  method: string;
  direction: "bullish" | "bearish" | "neutral";
  lastClose?: number;
  lastTime?: string;
  candlesUsed?: number;
  points: Array<{
    step: number;
    time: string;
    base: number;
    upside: number;
    downside: number;
  }>;
  assumptions: string[];
};
};

/* ============================================================
   AGENT RESULT
============================================================ */

export type AgentResult = {
  answer: string;
  toolsUsed: ToolResult[];
  strategyRun?: StrategyRunResult | null;
};