// export type ChatRole = "user" | "assistant";

import { ToolChartDrawing } from "@/app/api/ai/chat/types";

// export type ChatMessage = {
//   role: ChatRole;
//   content: string;
//   createdAt: Date;
// };

// export type ChatDocument = {
//   chatId: string;
//   userId: string;

//   symbol: string;
//   stockName: string;

//   title: string;

//   tradingMode: string;
//   risk: string;

//   messages: ChatMessage[];

//   createdAt: Date;
//   updatedAt: Date;
// };





export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  createdAt: Date;
};



/* ============================================================
   TOOL CHART TYPES
============================================================ */

export type ToolChartLine = {
  id: string;
  label: string;
  price?: number;
  color: string;
  dashed?: boolean;

  /*
   * For future indicators such as RSI/MACD/EMA,
   * we can store actual time/value points.
   */
  points?: {
    time: string | number;
    value: number;
  }[];
};

// export type ToolChart = {
//   type: "priceLines" | "line";
//   lines: ToolChartLine[];
// };


export type ToolChart = {
  type: "priceLines" | "line";
  lines: ToolChartLine[];
  drawings?: ToolChartDrawing[];
};

/* ============================================================
   STORED TOOL RESULT
============================================================ */

export type StoredToolResult = {
  id: string;

  /*
   * Internal tool name.
   * Example:
   * supportResistance
   * rsi
   * macd
   */
  tool: string;

  /*
   * Human readable name shown in INDICATORS.map()
   */
  label: string;

  /*
   * Unique color assigned when the tool is stored.
   */
  color: string;

  /*
   * Actual result returned by the tool.
   */
  result: unknown;

  /*
   * What should be drawn on the chart.
   */
  chart?: ToolChart | null;

  /*
   * Which AI message caused this tool call.
   */
  messageId?: string;

  createdAt: Date;
};

/* ============================================================
   CHAT DOCUMENT
============================================================ */

export type ChatDocument = {
  chatId: string;

  userId: string;

  symbol: string;

  stockName: string;

  title: string;

  tradingMode: string;

  risk: string;

  messages: ChatMessage[];

  /*
   * Every tool used by AI in this chat.
   *
   * Example:
   *
   * [
   *   {
   *     tool: "supportResistance",
   *     label: "Support & Resistance",
   *     color: "#a566ff",
   *     result: {...},
   *     chart: {...}
   *   }
   * ]
   */
  toolResults: StoredToolResult[];

  createdAt: Date;

  updatedAt: Date;
};