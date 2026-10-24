// import { auth } from "@/auth";
// import {
//   createChat,
//   getChatById,
//   updateChat,
// } from "@/lib/chat";
// import {
//   runAgent,
//   getToolLabel,
// } from "./agent";
// import type {
//   AgentMessage,
//   AgentContext,
// } from "./types";
// import type {
//   ChatMessage,
//   StoredToolResult,
// } from "@/models/Chat";

// /* ============================================================
//    UUID
// ============================================================ */

// const UUID_REGEX =
//   /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// /* ============================================================
//    COLORS
// ============================================================ */

// const TOOL_COLORS = [
//   "#a566ff",
//   "#28dc9b",
//   "#ff5064",
//   "#f4bf32",
//   "#4da3ff",
//   "#ff8a3d",
//   "#00c2ff",
//   "#ff65c3",
// ];

// /* ============================================================
//    HELPERS
// ============================================================ */

// function getToolColor(
//   tool: string,
//   existing: StoredToolResult[]
// ): string {
//   const existingTool = existing.find(
//     (item) => item.tool === tool
//   );

//   if (existingTool?.color) {
//     return existingTool.color;
//   }

//   const usedColors = new Set(
//     existing.map((item) => item.color)
//   );

//   return (
//     TOOL_COLORS.find((color) => !usedColors.has(color)) ??
//     TOOL_COLORS[existing.length % TOOL_COLORS.length]
//   );
// }

// /**
//  * Keep one saved result per tool name per chat.
//  *
//  * Existing tool:
//  * - Replace its result and chart.
//  * - Preserve its ID and color.
//  *
//  * New tool:
//  * - Append a new entry.
//  */
// function mergeToolResults(
//   existing: StoredToolResult[],
//   updates: StoredToolResult[]
// ): StoredToolResult[] {
//   const merged = [...existing];

//   for (const update of updates) {
//     const index = merged.findIndex(
//       (item) => item.tool === update.tool
//     );

//     if (index === -1) {
//       merged.push(update);
//       continue;
//     }

//     const previous = merged[index];

//     merged[index] = {
//       ...previous,
//       ...update,
//       id: previous.id,
//       color: previous.color || update.color,
//       result: update.result,
//       chart: update.chart ?? null,
//       messageId: update.messageId ?? previous.messageId,
//       createdAt: update.createdAt ?? new Date(),
//     };
//   }

//   return merged;
// }

// function encodeSSE(
//   event: string,
//   data: unknown
// ): string {
//   return (
//     `event: ${event}\n` +
//     `data: ${JSON.stringify(data)}\n\n`
//   );
// }

// function getOptionalNumber(
//   value: unknown
// ): number | null {
//   return typeof value === "number" && Number.isFinite(value)
//     ? value
//     : null;
// }

// function getOptionalString(
//   value: unknown
// ): string | undefined {
//   return typeof value === "string" && value.trim()
//     ? value.trim()
//     : undefined;
// }

// /* ============================================================
//    POST
// ============================================================ */

// export async function POST(request: Request) {
//   const session = await auth();

//   if (!session?.user?.id) {
//     return Response.json(
//       {
//         success: false,
//         error: "Unauthorized",
//       },
//       { status: 401 }
//     );
//   }

//   let body: Record<string, unknown>;

//   try {
//     const parsed: unknown = await request.json();

//     if (
//       !parsed ||
//       typeof parsed !== "object" ||
//       Array.isArray(parsed)
//     ) {
//       return Response.json(
//         {
//           success: false,
//           error: "Invalid request body.",
//         },
//         { status: 400 }
//       );
//     }

//     body = parsed as Record<string, unknown>;
//   } catch {
//     return Response.json(
//       {
//         success: false,
//         error: "Invalid request body.",
//       },
//       { status: 400 }
//     );
//   }

//   const {
//     chatId,
//     message,
//     symbol,
//     stockName,
//     instrumentKey,
//     price,
//     change,
//     changePercent,
//     tradingMode,
//     risk,
//   } = body;

//   /* ==========================================================
//      VALIDATE CHAT ID
//   ========================================================== */

//   if (
//     typeof chatId !== "string" ||
//     !UUID_REGEX.test(chatId)
//   ) {
//     return Response.json(
//       {
//         success: false,
//         error: "Invalid chat ID.",
//       },
//       { status: 400 }
//     );
//   }

//   /* ==========================================================
//      VALIDATE MESSAGE
//   ========================================================== */

//   if (
//     typeof message !== "string" ||
//     !message.trim()
//   ) {
//     return Response.json(
//       {
//         success: false,
//         error: "Message is required.",
//       },
//       { status: 400 }
//     );
//   }

//   const cleanMessage = message.trim();

//   /* ==========================================================
//      NORMALIZE REQUEST STOCK CONTEXT
//   ========================================================== */

//   const cleanSymbol =
//     typeof symbol === "string" && symbol.trim()
//       ? symbol.trim().toUpperCase()
//       : "";

//   const cleanStockName =
//     getOptionalString(stockName);

//   const cleanInstrumentKey =
//     getOptionalString(instrumentKey);

//   /* ==========================================================
//      LOAD CHAT AND CHECK OWNERSHIP
//   ========================================================== */

//   const existingChat = await getChatById(chatId);

//   if (
//     existingChat &&
//     existingChat.userId !== session.user.id
//   ) {
//     return Response.json(
//       {
//         success: false,
//         error: "You cannot access this chat.",
//       },
//       { status: 403 }
//     );
//   }

//   /* ==========================================================
//      RESOLVE EFFECTIVE STOCK CONTEXT

//      The stock currently selected in the dashboard is used
//      when supplied. Otherwise, reuse the stock saved in chat.
//   ========================================================== */

//   const existingSymbol =
//     typeof existingChat?.symbol === "string"
//       ? existingChat.symbol.trim().toUpperCase()
//       : "";

//   if (
//     existingSymbol &&
//     cleanSymbol &&
//     existingSymbol !== cleanSymbol
//   ) {
//     return Response.json(
//       {
//         success: false,
//         error: "Chat symbol does not match stock.",
//       },
//       { status: 403 }
//     );
//   }

//   const effectiveSymbol =
//     cleanSymbol || existingSymbol;

//   const existingStockName =
//     typeof existingChat?.stockName === "string"
//       ? existingChat.stockName.trim()
//       : "";

//   const effectiveStockName =
//     cleanStockName ||
//     existingStockName ||
//     effectiveSymbol;

//   /*
//    * Prefer the instrument key from the current dashboard
//    * request. If it is absent, reuse a key stored in chat
//    * when your chat model has that field.
//    *
//    * The type guard avoids assuming that every Chat model
//    * already stores instrumentKey.
//    */
//   const savedInstrumentKey =
//     existingChat &&
//     "instrumentKey" in existingChat &&
//     typeof existingChat.instrumentKey === "string"
//       ? existingChat.instrumentKey.trim()
//       : "";

//   const effectiveInstrumentKey =
//     cleanInstrumentKey || savedInstrumentKey || undefined;

//   /* ==========================================================
//      CHAT HISTORY
//   ========================================================== */

//   const history: AgentMessage[] =
//     existingChat?.messages?.map((item) => ({
//       role: item.role,
//       content: item.content,
//     })) ?? [];

//   /* ==========================================================
//      AGENT CONTEXT

//      Pass the selected stock's identity to the agent.
//      The agent still decides whether a tool is necessary.
//   ========================================================== */

//   const context: AgentContext = {
//     symbol: effectiveSymbol,
//     stockName: effectiveStockName || effectiveSymbol,
//     instrumentKey: effectiveInstrumentKey,

//     price: getOptionalNumber(price),
//     change: getOptionalNumber(change),
//     changePercent: getOptionalNumber(changePercent),

//     tradingType:
//       getOptionalString(tradingMode) ||
//       existingChat?.tradingMode ||
//       "Swing",

//     riskLevel:
//       getOptionalString(risk) ||
//       existingChat?.risk ||
//       "Medium",
//   };

//   /* ==========================================================
//      SSE STREAM
//   ========================================================== */

//   const encoder = new TextEncoder();

//   const stream = new ReadableStream<Uint8Array>({
//     async start(controller) {
//       const send = (
//         event: string,
//         data: unknown
//       ) => {
//         controller.enqueue(
//           encoder.encode(encodeSSE(event, data))
//         );
//       };

//       try {
//         send("start", {
//           chatId,
//           symbol: effectiveSymbol || null,
//           stockName: effectiveStockName || null,
//           instrumentKey: effectiveInstrumentKey ?? null,
//         });

//         /* ====================================================
//            RUN AGENT
//         ==================================================== */

//         const result = await runAgent(
//           context,
//           cleanMessage,
//           history
//         );

//         /* ====================================================
//            PREVIOUS TOOL RESULTS
//         ==================================================== */

//         const previousTools: StoredToolResult[] =
//           existingChat?.toolResults ?? [];

//         const updatedTools: StoredToolResult[] = [];

//         /* ====================================================
//            PROCESS ACTUAL TOOL RESULTS
//         ==================================================== */

//         for (const toolResult of result.toolsUsed) {
//           const label = getToolLabel(toolResult.tool);

//           if (!toolResult.success) {
//             send("tool_result", {
//               tool: toolResult.tool,
//               label,
//               success: false,
//               error: toolResult.error,
//             });

//             // Preserve the last successful saved result
//             // if the new execution fails.
//             continue;
//           }

//           const previous = previousTools.find(
//             (item) => item.tool === toolResult.tool
//           );

//           const color = getToolColor(
//             toolResult.tool,
//             previousTools
//           );

//           const stored: StoredToolResult = {
//             id: previous?.id ?? crypto.randomUUID(),
//             tool: toolResult.tool,
//             label,
//             color,
//             result: toolResult.data,
//             chart: toolResult.chart ?? null,
//             messageId: crypto.randomUUID(),
//             createdAt: new Date(),
//           };

//           updatedTools.push(stored);

//           send("tool_result", {
//             id: stored.id,
//             tool: stored.tool,
//             label: stored.label,
//             color: stored.color,
//             result: stored.result,
//             chart: stored.chart,
//             success: true,
//             updated: Boolean(previous),
//           });
//         }

//         /* ====================================================
//            MERGE TOOL RESULTS

//            Re-running a tool replaces its saved result.
//            Unused tools retain their previous saved results.
//         ==================================================== */

//         const newTools = mergeToolResults(
//           previousTools,
//           updatedTools
//         );

//         /* ====================================================
//            SEND AI RESPONSE
//         ==================================================== */

//         send("delta", {
//           content: result.answer,
//         });

//         /* ====================================================
//            SAVE CHAT MESSAGES
//         ==================================================== */

//         const now = new Date();

//         const userMessage: ChatMessage = {
//           role: "user",
//           content: cleanMessage,
//           createdAt: now,
//         };

//         const assistantMessage: ChatMessage = {
//           role: "assistant",
//           content: result.answer,
//           createdAt: new Date(),
//         };

//         const newMessages: ChatMessage[] = [
//           ...(existingChat?.messages ?? []),
//           userMessage,
//           assistantMessage,
//         ];

//         /* ====================================================
//            CREATE OR UPDATE CHAT
//         ==================================================== */

//         if (!existingChat) {
//           const chat = await createChat({
//             chatId,
//             userId: session.user.id,

//             // Empty symbol allows general chat only if
//             // your Chat schema and createChat support it.
//             symbol: effectiveSymbol,
//             stockName: effectiveStockName,

//             title: cleanMessage.slice(0, 60),

//             tradingMode: context.tradingType,
//             risk: context.riskLevel,

//             messages: newMessages,
//             toolResults: newTools,

//             createdAt: now,
//             updatedAt: new Date(),
//           });

//           send("saved", {
//             success: true,
//             created: true,
//             chatId: chat.chatId,
//             symbol: effectiveSymbol || null,
//             toolResults: chat.toolResults ?? newTools,
//           });
//         } else {
//           const updated = await updateChat(
//             session.user.id,
//             chatId,
//             newMessages,
//             undefined,
//             newTools
//           );

//           send("saved", {
//             success: true,
//             created: false,
//             chatId,
//             symbol: effectiveSymbol || null,
//             toolResults: updated?.toolResults ?? newTools,
//           });
//         }

//         /* ====================================================
//            COMPLETE
//         ==================================================== */

//         send("done", {
//           answer: result.answer,
//           toolsUsed: updatedTools,
//         });

//         controller.close();
//       } catch (error) {
//         console.error(
//           "[POST /api/ai/chat]",
//           error
//         );

//         send("error", {
//           error:
//             error instanceof Error
//               ? error.message
//               : "AI request failed.",
//         });

//         controller.close();
//       }
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream; charset=utf-8",
//       "Cache-Control": "no-cache, no-transform",
//       Connection: "keep-alive",
//       "X-Accel-Buffering": "no",
//     },
//   });
// }






















import { auth } from "@/auth";
import {
  createChat,
  getChatById,
  updateChat,
} from "@/lib/chat";
import {
  runAgent,
  getToolLabel,
} from "./agent";
import type {
  AgentMessage,
  AgentContext,
} from "./types";
import type {
  ChatMessage,
  StoredToolResult,
} from "@/models/Chat";

/* ============================================================
   UUID
============================================================ */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* ============================================================
   COLORS
============================================================ */

const TOOL_COLORS = [
  "#a566ff",
  "#28dc9b",
  "#ff5064",
  "#f4bf32",
  "#4da3ff",
  "#ff8a3d",
  "#00c2ff",
  "#ff65c3",
];

/* ============================================================
   HELPERS
============================================================ */

function getToolColor(
  tool: string,
  existing: StoredToolResult[]
): string {
  const existingTool = existing.find(
    (item) => item.tool === tool
  );

  if (existingTool?.color) {
    return existingTool.color;
  }

  const usedColors = new Set(
    existing.map((item) => item.color)
  );

  return (
    TOOL_COLORS.find((color) => !usedColors.has(color)) ??
    TOOL_COLORS[existing.length % TOOL_COLORS.length]
  );
}

/**
 * Keep one saved result per tool name per chat.
 *
 * Existing tool:
 * - Replace its result and chart.
 * - Preserve its ID and color.
 *
 * New tool:
 * - Append a new entry.
 */
function mergeToolResults(
  existing: StoredToolResult[],
  updates: StoredToolResult[]
): StoredToolResult[] {
  const merged = [...existing];

  for (const update of updates) {
    const index = merged.findIndex(
      (item) => item.tool === update.tool
    );

    if (index === -1) {
      merged.push(update);
      continue;
    }

    const previous = merged[index];

    merged[index] = {
      ...previous,
      ...update,
      id: previous.id,
      color: previous.color || update.color,
      result: update.result,
      chart: update.chart ?? null,
      messageId: update.messageId ?? previous.messageId,
      createdAt: update.createdAt ?? new Date(),
    };
  }

  return merged;
}

function encodeSSE(
  event: string,
  data: unknown
): string {
  return (
    `event: ${event}\n` +
    `data: ${JSON.stringify(data)}\n\n`
  );
}

function getOptionalNumber(
  value: unknown
): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function getOptionalString(
  value: unknown
): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

/* ============================================================
   POST
============================================================ */

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;

  try {
    const parsed: unknown = await request.json();

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return Response.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json(
      {
        success: false,
        error: "Invalid request body.",
      },
      { status: 400 }
    );
  }

  const {
    chatId,
    message,
    symbol,
    stockName,
    instrumentKey,
    price,
    change,
    changePercent,
    tradingMode,
    risk,
  } = body;

  /* ==========================================================
     VALIDATE CHAT ID
  ========================================================== */

  if (
    typeof chatId !== "string" ||
    !UUID_REGEX.test(chatId)
  ) {
    return Response.json(
      {
        success: false,
        error: "Invalid chat ID.",
      },
      { status: 400 }
    );
  }

  /* ==========================================================
     VALIDATE MESSAGE
  ========================================================== */

  if (
    typeof message !== "string" ||
    !message.trim()
  ) {
    return Response.json(
      {
        success: false,
        error: "Message is required.",
      },
      { status: 400 }
    );
  }

  const cleanMessage = message.trim();

  /* ==========================================================
     NORMALIZE REQUEST STOCK CONTEXT
  ========================================================== */

  const cleanSymbol =
    typeof symbol === "string" && symbol.trim()
      ? symbol.trim().toUpperCase()
      : "";

  const cleanStockName =
    getOptionalString(stockName);

  const cleanInstrumentKey =
    getOptionalString(instrumentKey);

  /* ==========================================================
     LOAD CHAT AND CHECK OWNERSHIP
  ========================================================== */

  const existingChat = await getChatById(chatId);

  if (
    existingChat &&
    existingChat.userId !== session.user.id
  ) {
    return Response.json(
      {
        success: false,
        error: "You cannot access this chat.",
      },
      { status: 403 }
    );
  }

  /* ==========================================================
     RESOLVE EFFECTIVE STOCK CONTEXT

     The stock currently selected in the dashboard is used
     when supplied. Otherwise, reuse the stock saved in chat.
  ========================================================== */

  const existingSymbol =
    typeof existingChat?.symbol === "string"
      ? existingChat.symbol.trim().toUpperCase()
      : "";

  if (
    existingSymbol &&
    cleanSymbol &&
    existingSymbol !== cleanSymbol
  ) {
    return Response.json(
      {
        success: false,
        error: "Chat symbol does not match stock.",
      },
      { status: 403 }
    );
  }

  const effectiveSymbol =
    cleanSymbol || existingSymbol;

  const existingStockName =
    typeof existingChat?.stockName === "string"
      ? existingChat.stockName.trim()
      : "";

  const effectiveStockName =
    cleanStockName ||
    existingStockName ||
    effectiveSymbol;

  /*
   * Prefer the instrument key from the current dashboard
   * request. If it is absent, reuse a key stored in chat
   * when your chat model has that field.
   *
   * The type guard avoids assuming that every Chat model
   * already stores instrumentKey.
   */
  const savedInstrumentKey =
    existingChat &&
    "instrumentKey" in existingChat &&
    typeof existingChat.instrumentKey === "string"
      ? existingChat.instrumentKey.trim()
      : "";

  const effectiveInstrumentKey =
    cleanInstrumentKey || savedInstrumentKey || undefined;

  /* ==========================================================
     CHAT HISTORY
  ========================================================== */

  const history: AgentMessage[] =
    existingChat?.messages?.map((item) => ({
      role: item.role,
      content: item.content,
    })) ?? [];

  /* ==========================================================
     AGENT CONTEXT

     Pass the selected stock's identity to the agent.
     The agent still decides whether a tool is necessary.
  ========================================================== */

  const context: AgentContext = {
    symbol: effectiveSymbol,
    stockName: effectiveStockName || effectiveSymbol,
    instrumentKey: effectiveInstrumentKey,

    price: getOptionalNumber(price),
    change: getOptionalNumber(change),
    changePercent: getOptionalNumber(changePercent),

    tradingType:
      getOptionalString(tradingMode) ||
      existingChat?.tradingMode ||
      "Swing",

    riskLevel:
      getOptionalString(risk) ||
      existingChat?.risk ||
      "Medium",
  };

  /* ==========================================================
     SSE STREAM
  ========================================================== */

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (
        event: string,
        data: unknown
      ) => {
        controller.enqueue(
          encoder.encode(encodeSSE(event, data))
        );
      };

      try {
        send("start", {
          chatId,
          symbol: effectiveSymbol || null,
          stockName: effectiveStockName || null,
          instrumentKey: effectiveInstrumentKey ?? null,
        });

        /* ====================================================
           RUN AGENT
        ==================================================== */

        // const result = await runAgent(
        //   context,
        //   cleanMessage,
        //   history
        // );


        let streamedAnswer = "";

// const result = await runAgent(
//   context,
//   cleanMessage,
//   history,
//   (token) => {
//     streamedAnswer += token;

//     send("delta", {
//       content: token,
//     });
//   }
// );




console.log("[AI CHAT] Starting agent", {
  symbol: effectiveSymbol || null,
  messageLength: cleanMessage.length,
  historyLength: history.length,
});

const result = await runAgent(
  context,
  cleanMessage,
  history
);

console.log("[AI CHAT] Agent finished", {
  answerLength: result.answer.length,
  toolsUsed: result.toolsUsed.map((tool) => ({
    tool: tool.tool,
    success: tool.success,
  })),
});



        /* ====================================================
           PREVIOUS TOOL RESULTS
        ==================================================== */

        const previousTools: StoredToolResult[] =
          existingChat?.toolResults ?? [];

        const updatedTools: StoredToolResult[] = [];

        /* ====================================================
           PROCESS ACTUAL TOOL RESULTS
        ==================================================== */

        for (const toolResult of result.toolsUsed) {
          const label = getToolLabel(toolResult.tool);

          if (!toolResult.success) {
            send("tool_result", {
              tool: toolResult.tool,
              label,
              success: false,
              error: toolResult.error,
            });

            // Preserve the last successful saved result
            // if the new execution fails.
            continue;
          }

          const previous = previousTools.find(
            (item) => item.tool === toolResult.tool
          );

          const color = getToolColor(
            toolResult.tool,
            previousTools
          );

          const stored: StoredToolResult = {
            id: previous?.id ?? crypto.randomUUID(),
            tool: toolResult.tool,
            label,
            color,
            result: toolResult.data,
            chart: toolResult.chart ?? null,
            messageId: crypto.randomUUID(),
            createdAt: new Date(),
          };

          updatedTools.push(stored);

          send("tool_result", {
            id: stored.id,
            tool: stored.tool,
            label: stored.label,
            color: stored.color,
            result: stored.result,
            chart: stored.chart,
            success: true,
            updated: Boolean(previous),
          });
        }


        



        /* ====================================================
           MERGE TOOL RESULTS

           Re-running a tool replaces its saved result.
           Unused tools retain their previous saved results.
        ==================================================== */



        if (result.strategyRun) {
          const strategyTool = "strategyBacktest";

          const existingStrategy = previousTools.find(
            (item) => item.tool === strategyTool
          );

          const strategyStoredResult: StoredToolResult = {
            id: existingStrategy?.id ?? crypto.randomUUID(),
            tool: strategyTool,
            label: "Strategy Backtest",
            color: existingStrategy?.color ?? "#60a5fa",
            result: result.strategyRun,
            chart: result.strategyRun.chart,
            messageId: crypto.randomUUID(),
            createdAt: new Date(),
          };

          updatedTools.push(strategyStoredResult);

          send("tool_result", {
            tool: strategyTool,
            label: "Strategy Backtest",
            success: true,
            result: result.strategyRun,
            chart: result.strategyRun.chart,
          });
        }



        
        const newTools = mergeToolResults(
          previousTools,
          updatedTools
        );


        /* ====================================================
           SEND AI RESPONSE
        ==================================================== */

        // send("delta", {
        //   content: result.answer,
        // });
        // Fallback answers may not use the AI token-stream callback.
if (!streamedAnswer) {
  send("delta", {
    content: result.answer,
  });
}

        /* ====================================================
           SAVE CHAT MESSAGES
        ==================================================== */

        const now = new Date();

        const userMessage: ChatMessage = {
          role: "user",
          content: cleanMessage,
          createdAt: now,
        };

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: result.answer,
          createdAt: new Date(),
        };

        const newMessages: ChatMessage[] = [
          ...(existingChat?.messages ?? []),
          userMessage,
          assistantMessage,
        ];

        /* ====================================================
           CREATE OR UPDATE CHAT
        ==================================================== */

        if (!existingChat) {
          const chat = await createChat({
            chatId,
            userId: session.user.id,

            // Empty symbol allows general chat only if
            // your Chat schema and createChat support it.
            symbol: effectiveSymbol,
            stockName: effectiveStockName,

            title: cleanMessage.slice(0, 60),

            tradingMode: context.tradingType,
            risk: context.riskLevel,

            messages: newMessages,
            toolResults: newTools,

            createdAt: now,
            updatedAt: new Date(),
          });

          send("saved", {
            success: true,
            created: true,
            chatId: chat.chatId,
            symbol: effectiveSymbol || null,
            toolResults: chat.toolResults ?? newTools,
          });
        } else {
          const updated = await updateChat(
            session.user.id,
            chatId,
            newMessages,
            undefined,
            newTools
          );

          send("saved", {
            success: true,
            created: false,
            chatId,
            symbol: effectiveSymbol || null,
            toolResults: updated?.toolResults ?? newTools,
          });
        }

        /* ====================================================
           COMPLETE
        ==================================================== */

        send("done", {
          answer: result.answer,
          toolsUsed: updatedTools,
        });

        controller.close();
      } catch (error) {
        console.error(
          "[POST /api/ai/chat]",
          error
        );

        // send("error", {
        //   error:
        //     error instanceof Error
        //       ? error.message
        //       : "AI request failed.",
        // });
        console.error("[POST /api/ai/chat] Request failed:", error);

        send("error", {
          error: "Something went wrong while processing your request. Please try again.",
        });

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
