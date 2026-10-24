
import { runSupportResistance } from "./supportResistance";
import type {
  ToolContext,
  ToolName,
  ToolResult,
} from "../types";
import { runTrendAnalysis } from "./trendAnalysis";
import { runRSIAnalysis } from "./rsi";
import { runADXAnalysis } from "./adx";
import { runATRAnalysis } from "./atr";
import { runVolumeAnalysis } from "./volume";
import { runBollingerAnalysis } from "./bollinger";
import { runVWAPAnalysis } from "./vwap";
import { runStochasticAnalysis } from "./stochastic";
import { runOBVAnalysis } from "./obv";
import { runVolumeProfileAnalysis } from "./volume-profile";
import { runFibonacciAnalysis } from "./fibonacci";
import { runMarketStructureAnalysis } from "./market-structure";
import { runBreakoutAnalysis } from "./breakout";
import { runDivergenceAnalysis } from "./divergence";
import { runMarketRegimeAnalysis } from "./market-regime";

/* ============================================================
   TOOL REGISTRY
============================================================ */

// export const TOOL_LABELS: Record<ToolName, string> = {
//   supportResistance: "Support & Resistance",
// };

export const TOOL_LABELS: Record<ToolName, string> = {
  supportResistance: "Support & Resistance",
  trendAnalysis: "Trend Analysis",
  rsiAnalysis: "RSI Analysis",
  adxAnalysis: "Trend Strength (ADX)",
  atrAnalysis: "ATR / Volatility",
  bollingerAnalysis: "Bollinger Bands",
  volumeAnalysis: "Volume Analysis",
  vwapAnalysis: "VWAP",
  stochasticAnalysis: "Stochastic Oscillator",
  obvAnalysis: "OBV (On-Balance Volume)",
  volumeProfileAnalysis: "Volume Profile",
  fibonacciAnalysis: "Fibonacci Levels",
  marketStructureAnalysis: "Price Action & Market Structure",
  breakoutAnalysis: "Breakout & Breakdown Detection",
  divergenceAnalysis: "Divergence Detection",
  marketRegimeAnalysis: "Market Regime Detection",
};

/* ============================================================
   EXECUTE TOOL
============================================================ */

export async function executeTool(
  tool: ToolName,
  context: ToolContext
): Promise<ToolResult> {
  switch (tool) {
    case "supportResistance": {
      // Validate that a stock is available for analysis.
      const symbol =
        typeof context.symbol === "string"
          ? context.symbol.trim().toUpperCase()
          : "";

      if (!symbol) {
        return {
          tool,
          success: false,
          error:
            "No stock is selected. Please open a stock before requesting support and resistance analysis.",
        };
      }

      try {
        // Forward the complete context so the analysis tool
        // receives the stock identity and user preferences.
        const result = await runSupportResistance({
          ...context,
          symbol,
          stockName:
            context.stockName?.trim() || symbol,
          instrumentKey:
            context.instrumentKey?.trim() || undefined,
        });

        return result;
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while calculating support and resistance.";

        console.error(
          `[Tool Registry] ${tool} failed:`,
          error
        );

        return {
          tool,
          success: false,
          error: message,
        };
      }
    }

    case "adxAnalysis":
  return runADXAnalysis(context);

case "trendAnalysis": {
  const symbol =
    typeof context.symbol === "string"
      ? context.symbol.trim().toUpperCase()
      : "";

  if (!symbol) {
    return {
      tool,
      success: false,
      error:
        "No stock is selected. Please open a stock before requesting trend analysis.",
    };
  }

  try {
    return await runTrendAnalysis({
      ...context,
      symbol,
      stockName: context.stockName?.trim() || symbol,
      instrumentKey: context.instrumentKey?.trim() || undefined,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during trend analysis.";

    console.error(`[Tool Registry] ${tool} failed:`, error);

    return {
      tool,
      success: false,
      error: message,
    };
  }
}

case "obvAnalysis":
  return runOBVAnalysis(context);

case "atrAnalysis":
  return runATRAnalysis(context);


case "volumeAnalysis":
  return runVolumeAnalysis(context);

case "bollingerAnalysis":
  return runBollingerAnalysis(context);

case "vwapAnalysis":
  return runVWAPAnalysis(context);

case "stochasticAnalysis":
  return runStochasticAnalysis(context);

case "volumeProfileAnalysis":
  return runVolumeProfileAnalysis(context);

case "fibonacciAnalysis":
  return runFibonacciAnalysis(context);

case "marketStructureAnalysis":
  return runMarketStructureAnalysis(context);

case "breakoutAnalysis":
  return runBreakoutAnalysis(context);

case "divergenceAnalysis":
  return runDivergenceAnalysis(context);

case "marketRegimeAnalysis":
  return runMarketRegimeAnalysis(context);


case "rsiAnalysis": {
  const symbol =
    typeof context.symbol === "string"
      ? context.symbol.trim().toUpperCase()
      : "";

  if (!symbol) {
    return {
      tool,
      success: false,
      error:
        "No stock is selected. Please open a stock before requesting RSI analysis.",
    };
  }

  try {
    return await runRSIAnalysis({
      ...context,
      symbol,
      stockName: context.stockName?.trim() || symbol,
      instrumentKey: context.instrumentKey?.trim() || undefined,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during RSI analysis.";

    console.error(`[Tool Registry] ${tool} failed:`, error);

    return {
      tool,
      success: false,
      error: message,
    };
  }
}

    default: {
      // Protect against unknown tool names at runtime.
      const unknownTool = tool as string;

      console.error(
        `[Tool Registry] Unknown tool: ${unknownTool}`
      );

      return {
        tool,
        success: false,
        error: `Unknown tool: ${unknownTool}`,
      };
    }
  }
}

/* ============================================================
   TOOL HELPERS
============================================================ */

/**
 * Returns the user-facing label for a registered tool.
 */
export function getToolLabel(tool: ToolName): string {
  return TOOL_LABELS[tool] ?? tool;
}

/**
 * Returns whether a tool is registered.
 */
export function isRegisteredTool(
  tool: string
): tool is ToolName {
  return Object.prototype.hasOwnProperty.call(
    TOOL_LABELS,
    tool
  );
}
