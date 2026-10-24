// "use client";

// import { ArrowUp, Bot, RotateCcw } from "lucide-react";
// import {
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
//   type ReactNode,
// } from "react";

// /* ==========================================================================
//    TYPES
// ========================================================================== */

// type Message = {
//   role: "user" | "assistant";
//   content: string;
//   createdAt?: string;
// };


// type AIAnalystProps = {
//   chatId: string;
//   stockName: string;
//   symbol: string;
//   price: number | null;
//   change: number | null;
//   changePercent: number | null;
//   tradingMode: string;
//   risk: string;

//   onSupportResistanceRequest?: () => void;
// };

// type ParsedTag = {
//   name: string;
//   variant?: string;
//   closing: boolean;
//   length: number;
// };

// const INLINE_TAGS = [
//   "head1",
//   "head2",
//   "bold",
//   "italic",
//   "small",
//   "muted",
//   "color",
//   "bullet",
//   "step",
//   "code",
//   "large",
//   "positive",
//   "negative",
// ] as const;

// const COLOR_CLASSES: Record<string, string> = {
//   green: "text-emerald-300",
//   red: "text-rose-300",
//   purple: "text-purple-300",
//   yellow: "text-amber-300",
//   blue: "text-sky-300",
// };

// const BOX_CLASSES: Record<string, string> = {
//   info: "border-sky-500/25 bg-sky-500/[0.07]",
//   success: "border-emerald-500/25 bg-emerald-500/[0.07]",
//   warning: "border-amber-500/30 bg-amber-500/[0.07]",
//   danger: "border-rose-500/30 bg-rose-500/[0.07]",
//   recommendation: "border-purple-500/30 bg-purple-500/[0.08]",
// };

// const BOX_TITLES: Record<string, string> = {
//   info: "Information",
//   success: "Positive signal",
//   warning: "Risk warning",
//   danger: "Caution",
//   recommendation: "AI Recommendation",
// };

// /* ==========================================================================
//    PREFERENCES
// ========================================================================== */

// function getQuantifyPreferences() {
//   if (typeof window === "undefined") {
//     return { risk: "medium", tradingType: "swing" };
//   }

//   return {
//     risk:
//       localStorage.getItem("quantify_risk_level")?.trim() ||
//       "medium",
//     tradingType:
//       localStorage.getItem("quantify_trading_type")?.trim() ||
//       "swing",
//   };
// }

// /* ==========================================================================
//    MESSAGE NORMALIZATION
// ========================================================================== */

// function normalizeMessage(value: unknown): Message | null {
//   if (!value || typeof value !== "object") return null;

//   const record = value as Record<string, unknown>;

//   const role =
//     record.role === "user" || record.role === "assistant"
//       ? record.role
//       : null;

//   if (!role) return null;

//   const content =
//     typeof record.content === "string"
//       ? record.content
//       : typeof record.message === "string"
//         ? record.message
//         : typeof record.text === "string"
//           ? record.text
//           : "";

//   return {
//     role,
//     content,
//     createdAt:
//       typeof record.createdAt === "string"
//         ? record.createdAt
//         : undefined,
//   };
// }

// function extractChatMessages(data: unknown): Message[] {
//   if (!data || typeof data !== "object") return [];

//   const record = data as Record<string, any>;

//   const candidates = [
//     record.chat?.messages,
//     record.messages,
//     record.data?.messages,
//     record.chat?.data?.messages,
//   ];

//   for (const candidate of candidates) {
//     if (Array.isArray(candidate)) {
//       return candidate
//         .map(normalizeMessage)
//         .filter((item): item is Message => item !== null);
//     }
//   }

//   return [];
// }

// /* ==========================================================================
//    TAG PARSER
// ========================================================================== */

// function readTag(
//   text: string,
//   index: number,
// ): ParsedTag | null {
//   if (text[index] !== "[") return null;

//   const end = text.indexOf("]", index);
//   if (end === -1) return null;

//   const raw = text.slice(index + 1, end).trim();
//   if (!raw) return null;

//   const closingMatch = raw.match(/^\/([a-z]+)$/i);

//   if (closingMatch) {
//     const name = closingMatch[1].toLowerCase();

//     if (
//       INLINE_TAGS.includes(name as (typeof INLINE_TAGS)[number]) ||
//       name === "box"
//     ) {
//       return {
//         name,
//         closing: true,
//         length: end - index + 1,
//       };
//     }

//     return null;
//   }

//   const colorMatch = raw.match(
//     /^color=(green|red|purple|yellow|blue)$/i,
//   );

//   if (colorMatch) {
//     return {
//       name: "color",
//       variant: colorMatch[1].toLowerCase(),
//       closing: false,
//       length: end - index + 1,
//     };
//   }

//   const boxMatch = raw.match(
//     /^box=(info|success|warning|danger|recommendation)$/i,
//   );

//   if (boxMatch) {
//     return {
//       name: "box",
//       variant: boxMatch[1].toLowerCase(),
//       closing: false,
//       length: end - index + 1,
//     };
//   }

//   if (raw.toLowerCase() === "box") {
//     return {
//       name: "box",
//       closing: true,
//       length: end - index + 1,
//     };
//   }

//   const name = raw.toLowerCase();

//   if (
//     INLINE_TAGS.includes(name as (typeof INLINE_TAGS)[number])
//   ) {
//     return {
//       name,
//       closing: false,
//       length: end - index + 1,
//     };
//   }

//   return null;
// }

// function findClosingTag(
//   text: string,
//   start: number,
//   tagName: string,
// ): { start: number; end: number } | null {
//   let cursor = start;

//   while (cursor < text.length) {
//     const openIndex = text.indexOf("[", cursor);
//     if (openIndex === -1) return null;

//     const tag = readTag(text, openIndex);

//     if (!tag) {
//       cursor = openIndex + 1;
//       continue;
//     }

//     if (tag.name === tagName) {
//       if (
//         tag.closing ||
//         (!tag.variant && !tag.closing)
//       ) {
//         return {
//           start: openIndex,
//           end: openIndex + tag.length,
//         };
//       }
//     }

//     cursor = openIndex + tag.length;
//   }

//   return null;
// }

// /* ==========================================================================
//    MARKDOWN INLINE
// ========================================================================== */

// function renderMarkdownInline(
//   source: string,
//   keyPrefix: string,
// ): ReactNode[] {
//   const output: ReactNode[] = [];
//   const pattern =
//     /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_)/g;

//   let cursor = 0;
//   let match: RegExpExecArray | null;
//   let index = 0;

//   while ((match = pattern.exec(source)) !== null) {
//     if (match.index > cursor) {
//       output.push(
//         <span key={`${keyPrefix}-text-${index++}`}>
//           {source.slice(cursor, match.index)}
//         </span>,
//       );
//     }

//     const token = match[0];
//     const key = `${keyPrefix}-formatted-${index++}`;

//     if (token.startsWith("**") || token.startsWith("__")) {
//       output.push(
//         <strong key={key} className="font-semibold text-white">
//           {token.slice(2, -2)}
//         </strong>,
//       );
//     } else if (token.startsWith("`")) {
//       output.push(
//         <code
//           key={key}
//           className="rounded-md border border-white/[0.08] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-purple-200"
//         >
//           {token.slice(1, -1)}
//         </code>,
//       );
//     } else {
//       output.push(
//         <em key={key} className="italic text-white/80">
//           {token.slice(1, -1)}
//         </em>,
//       );
//     }

//     cursor = match.index + token.length;
//   }

//   if (cursor < source.length) {
//     output.push(
//       <span key={`${keyPrefix}-text-${index++}`}>
//         {source.slice(cursor)}
//       </span>,
//     );
//   }

//   return output;
// }

// function renderInline(
//   text: string,
//   keyPrefix = "inline",
//   depth = 0,
// ): ReactNode[] {
//   if (depth > 20) return [text];

//   const output: ReactNode[] = [];
//   let cursor = 0;
//   let index = 0;

//   const pushPlainText = (value: string) => {
//     output.push(
//       ...renderMarkdownInline(
//         value,
//         `${keyPrefix}-plain-${index++}`,
//       ),
//     );
//   };

//   while (cursor < text.length) {
//     const openIndex = text.indexOf("[", cursor);

//     if (openIndex === -1) {
//       pushPlainText(text.slice(cursor));
//       break;
//     }

//     if (openIndex > cursor) {
//       pushPlainText(text.slice(cursor, openIndex));
//     }

//     const tag = readTag(text, openIndex);

//     if (!tag || tag.closing || tag.name === "box") {
//       pushPlainText(text[openIndex]);
//       cursor = openIndex + 1;
//       continue;
//     }

//     const contentStart = openIndex + tag.length;
//     const closing = findClosingTag(
//       text,
//       contentStart,
//       tag.name,
//     );

//     if (!closing) {
//       pushPlainText(text.slice(openIndex, contentStart));
//       cursor = contentStart;
//       continue;
//     }

//     const inner = text.slice(contentStart, closing.start);
//     const children = renderInline(
//       inner,
//       `${keyPrefix}-${tag.name}-${index}`,
//       depth + 1,
//     );

//     const key = `${keyPrefix}-${tag.name}-${index++}`;

//     switch (tag.name) {
//       case "head1":
//         output.push(
//           <h2
//             key={key}
//             className="mb-2 text-[22px] font-semibold leading-snug tracking-[-0.4px] text-white"
//           >
//             {children}
//           </h2>,
//         );
//         break;

//       case "head2":
//         output.push(
//           <h3
//             key={key}
//             className="mb-2 mt-5 text-[16px] font-semibold tracking-[0.1px] text-white"
//           >
//             {children}
//           </h3>,
//         );
//         break;

//       case "bold":
//         output.push(
//           <strong key={key} className="font-semibold text-white">
//             {children}
//           </strong>,
//         );
//         break;

//       case "italic":
//         output.push(
//           <em key={key} className="italic text-white/80">
//             {children}
//           </em>,
//         );
//         break;

//       case "small":
//         output.push(
//           <span
//             key={key}
//             className="text-[12px] leading-[1.7] text-white/55"
//           >
//             {children}
//           </span>,
//         );
//         break;

//       case "muted":
//         output.push(
//           <span key={key} className="text-white/50">
//             {children}
//           </span>,
//         );
//         break;

//       case "color":
//         output.push(
//           <span
//             key={key}
//             className={COLOR_CLASSES[tag.variant || "blue"]}
//           >
//             {children}
//           </span>,
//         );
//         break;

//       case "bullet":
//         output.push(
//           <span key={key} className="text-white/80">
//             <span className="mr-2 text-purple-400">•</span>
//             {children}
//           </span>,
//         );
//         break;

//       case "step":
//         output.push(
//           <span key={key} className="text-white/80">
//             {children}
//           </span>,
//         );
//         break;

//       case "code":
//         output.push(
//           <code
//             key={key}
//             className="rounded-md border border-white/[0.08] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-purple-200"
//           >
//             {children}
//           </code>,
//         );
//         break;

//       case "large":
//         output.push(
//           <span
//             key={key}
//             className="inline-block text-[25px] font-semibold tracking-[-0.4px] text-white"
//           >
//             {children}
//           </span>,
//         );
//         break;

//       case "positive":
//         output.push(
//           <span key={key} className="font-semibold text-emerald-300">
//             {children}
//           </span>,
//         );
//         break;

//       case "negative":
//         output.push(
//           <span key={key} className="font-semibold text-rose-300">
//             {children}
//           </span>,
//         );
//         break;

//       default:
//         output.push(<span key={key}>{children}</span>);
//     }

//     cursor = closing.end;
//   }

//   return output;
// }

// /* ==========================================================================
//    BLOCK RENDERER
// ========================================================================== */

// function renderAIMessage(content: string): ReactNode[] {
//   const lines = content
//     .replace(/\r\n?/g, "\n")
//     .replace(/\u00a0/g, " ")
//     .split("\n");

//   const output: ReactNode[] = [];
//   let index = 0;
//   let blockIndex = 0;

//   while (index < lines.length) {
//     const line = lines[index].trim();

//     if (!line) {
//       index++;
//       continue;
//     }

//     /* BOXES */

//     const boxOpening = line.match(
//       /^\[box=(info|success|warning|danger|recommendation)\]\s*$/i,
//     );

//     if (boxOpening) {
//       const variant = boxOpening[1].toLowerCase();
//       const boxLines: string[] = [];
//       index++;

//       while (index < lines.length) {
//         const current = lines[index].trim();

//         if (current === "[box]" || current === "[/box]") {
//           index++;
//           break;
//         }

//         boxLines.push(lines[index]);
//         index++;
//       }

//       output.push(
//         <div
//           key={`box-${blockIndex++}`}
//           className={`my-4 rounded-xl border px-4 py-4 ${BOX_CLASSES[variant]}`}
//         >
//           <div className="mb-2 flex items-center gap-2">
//             <span
//               className={`h-2 w-2 rounded-full ${
//                 variant === "success"
//                   ? "bg-emerald-400"
//                   : variant === "warning"
//                     ? "bg-amber-400"
//                     : variant === "danger"
//                       ? "bg-rose-400"
//                       : variant === "info"
//                         ? "bg-sky-400"
//                         : "bg-purple-400"
//               }`}
//             />
//             <span className="text-[12px] font-semibold uppercase tracking-[0.8px] text-white/75">
//               {BOX_TITLES[variant]}
//             </span>
//           </div>

//           <div className="text-[14px] leading-[1.8] text-white/85">
//             {renderAIMessage(boxLines.join("\n"))}
//           </div>
//         </div>,
//       );

//       continue;
//     }

//     /* DIVIDERS */

//     if (
//       line === "[line]" ||
//       /^---+$/.test(line) ||
//       /^\*\*\*+$/.test(line)
//     ) {
//       output.push(
//         <div
//           key={`divider-${blockIndex++}`}
//           className="my-5 h-px w-full bg-white/[0.10]"
//         />,
//       );

//       index++;
//       continue;
//     }

//     /* CUSTOM HEADINGS */

//     if (/^\[head1\]/i.test(line) && /\[head1\]\s*$/i.test(line)) {
//       output.push(
//         <div key={`heading-${blockIndex++}`} className="mb-5">
//           {renderInline(line)}
//           <div className="mt-3 h-px w-12 bg-purple-500/80" />
//         </div>,
//       );

//       index++;
//       continue;
//     }

//     if (/^\[head2\]/i.test(line) && /\[head2\]\s*$/i.test(line)) {
//       output.push(
//         <div key={`subheading-${blockIndex++}`}>
//           {renderInline(line)}
//         </div>,
//       );

//       index++;
//       continue;
//     }

//     /* MARKDOWN HEADINGS */

//     const markdownHeading = line.match(/^(#{1,3})\s+(.+)$/);

//     if (markdownHeading) {
//       const level = markdownHeading[1].length;
//       const children = renderInline(markdownHeading[2]);
//       const key = `markdown-heading-${blockIndex++}`;

//       if (level === 1) {
//         output.push(
//           <h2 key={key} className="mb-3 text-[22px] font-semibold text-white">
//             {children}
//           </h2>,
//         );
//       } else if (level === 2) {
//         output.push(
//           <h3 key={key} className="mb-2 mt-5 text-[16px] font-semibold text-white">
//             {children}
//           </h3>,
//         );
//       } else {
//         output.push(
//           <h4 key={key} className="mb-2 mt-4 text-[14px] font-semibold text-white">
//             {children}
//           </h4>,
//         );
//       }

//       index++;
//       continue;
//     }

//     /* CUSTOM BULLETS */

//     const customBullet = line.match(
//       /^\[bullet\]([\s\S]*?)\[bullet\]\s*$/i,
//     );

//     if (customBullet) {
//       output.push(
//         <div
//           key={`bullet-${blockIndex++}`}
//           className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
//         >
//           <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
//           <div className="min-w-0 flex-1">
//             {renderInline(customBullet[1].trim())}
//           </div>
//         </div>,
//       );

//       index++;
//       continue;
//     }

//     /* AUTOMATIC SUPPORT / RESISTANCE BULLETS */

//     if (/^(support|resistance)\s*:/i.test(line)) {
//       output.push(
//         <div
//           key={`level-${blockIndex++}`}
//           className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
//         >
//           <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
//           <div className="min-w-0 flex-1">
//             {renderInline(line)}
//           </div>
//         </div>,
//       );

//       index++;
//       continue;
//     }

//     /* MARKDOWN BULLETS */

//     const markdownBullet = line.match(/^[-*+]\s+(.+)$/);

//     if (markdownBullet) {
//       output.push(
//         <div
//           key={`markdown-bullet-${blockIndex++}`}
//           className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
//         >
//           <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
//           <div className="min-w-0 flex-1">
//             {renderInline(markdownBullet[1])}
//           </div>
//         </div>,
//       );

//       index++;
//       continue;
//     }

//     /* CUSTOM STEPS */

//     const customStep = line.match(
//       /^\[step\]([\s\S]*?)\[step\]\s*$/i,
//     );

//     if (customStep) {
//       const stepText = customStep[1].trim();
//       const match = stepText.match(/^(\d+[.)]?)\s*(.*)$/);

//       output.push(
//         <div
//           key={`step-${blockIndex++}`}
//           className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
//         >
//           <span className="shrink-0 font-semibold text-purple-300">
//             {match?.[1] || "•"}
//           </span>
//           <div className="min-w-0 flex-1">
//             {renderInline(match?.[2] || stepText)}
//           </div>
//         </div>,
//       );

//       index++;
//       continue;
//     }

//     /* MARKDOWN NUMBERED LIST */

//     const numberedStep = line.match(/^(\d+[.)])\s+(.+)$/);

//     if (numberedStep) {
//       output.push(
//         <div
//           key={`numbered-step-${blockIndex++}`}
//           className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
//         >
//           <span className="shrink-0 font-semibold text-purple-300">
//             {numberedStep[1]}
//           </span>
//           <div className="min-w-0 flex-1">
//             {renderInline(numberedStep[2])}
//           </div>
//         </div>,
//       );

//       index++;
//       continue;
//     }

//     /* NORMAL PARAGRAPHS */

//     output.push(
//       <p
//         key={`paragraph-${blockIndex++}`}
//         className="mb-3 whitespace-pre-wrap break-words text-[14px] leading-[1.6] text-white/80"
//       >
//         {renderInline(line)}
//       </p>,
//     );

//     index++;
//   }

//   return output;
// }

// /* ==========================================================================
//    SSE PARSER
// ========================================================================== */

// function parseSSEEvent(event: string) {
//   let eventType = "message";
//   const dataLines: string[] = [];

//   for (const line of event.split(/\r?\n/)) {
//     if (line.startsWith("event:")) {
//       eventType = line.slice(6).trim() || "message";
//     } else if (line.startsWith("data:")) {
//       dataLines.push(line.slice(5).trimStart());
//     }
//   }

//   if (!dataLines.length) return null;

//   const rawData = dataLines.join("\n");

//   if (rawData === "[DONE]" || rawData === "DONE") {
//     return { type: "done" };
//   }

//   let parsedData: any;

//   try {
//     parsedData = JSON.parse(rawData);
//   } catch {
//     parsedData = { content: rawData };
//   }

//   if (
//     parsedData &&
//     typeof parsedData === "object" &&
//     !Array.isArray(parsedData)
//   ) {
//     return { ...parsedData, type: eventType };
//   }

//   return { type: eventType, data: parsedData };
// }

// /* ==========================================================================
//    COMPONENT
// ========================================================================== */

// export default function AIAnalyst({
//   // chatId,
//   // stockName,
//   // symbol,
//   // price,
//   // change,
//   // changePercent,
//   // tradingMode,
//   // risk,
//   chatId,
//   stockName,
//   symbol,
//   price,
//   change,
//   changePercent,
//   tradingMode,
//   risk,
//   onSupportResistanceRequest,
// }: AIAnalystProps) {
//   const [message, setMessage] = useState("");
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [loadingChat, setLoadingChat] = useState(true);
//   const [streaming, setStreaming] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [retryMessage, setRetryMessage] = useState<string | null>(null);
//   const [toolStatus, setToolStatus] = useState<string | null>(null);

//   const messagesEndRef = useRef<HTMLDivElement | null>(null);
//   const abortControllerRef = useRef<AbortController | null>(null);

//   /* LOAD CHAT */

//   useEffect(() => {
//     let cancelled = false;

//     async function loadChat() {
//       if (!chatId) {
//         setMessages([]);
//         setLoadingChat(false);
//         return;
//       }

//       setLoadingChat(true);
//       setError(null);

//       try {
//         const response = await fetch(
//           `/api/chats/${encodeURIComponent(chatId)}`,
//           {
//             method: "GET",
//             cache: "no-store",
//             headers: { Accept: "application/json" },
//           },
//         );

//         let data: any = null;

//         try {
//           data = await response.json();
//         } catch {
//           data = null;
//         }

//         if (response.status === 401) {
//           if (!cancelled) {
//             setError("Please sign in to load this conversation.");
//           }
//           return;
//         }

//         if (response.status === 404) {
//           if (!cancelled) setMessages([]);
//           return;
//         }

//         if (!response.ok) {
//           throw new Error(
//             data?.error ||
//               data?.message ||
//               `Failed to load chat (${response.status}).`,
//           );
//         }

//         if (!cancelled) {
//           setMessages(extractChatMessages(data));
//         }
//       } catch (loadError) {
//         console.error("[AIAnalyst] Load chat failed:", loadError);

//         if (!cancelled) {
//           setError(
//             loadError instanceof Error
//               ? loadError.message
//               : "Unable to load this chat.",
//           );
//         }
//       } finally {
//         if (!cancelled) setLoadingChat(false);
//       }
//     }

//     void loadChat();

//     return () => {
//       cancelled = true;
//     };
//   }, [chatId]);

//   /* AUTO SCROLL */

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({
//       behavior: streaming ? "auto" : "smooth",
//       block: "end",
//     });
//   }, [messages, streaming, error, toolStatus]);

//   /* CLEANUP */

//   useEffect(() => {
//     return () => {
//       abortControllerRef.current?.abort();
//     };
//   }, []);

//   /* SEND MESSAGE */

//   const sendMessage = useCallback(
//     async (messageToSend?: string, isRetry = false) => {
//       const trimmed = (messageToSend ?? message).trim();



//       if (!trimmed || streaming) return;

//       const normalizedMessage = trimmed.toLowerCase();
//       const isSupportResistanceRequest =
//   /\b(support|resistance)\b/.test(normalizedMessage);

//       abortControllerRef.current?.abort();

//       const controller = new AbortController();
//       abortControllerRef.current = controller;

//       const preferences = getQuantifyPreferences();
//       const currentRisk = preferences.risk || risk || "medium";
//       const currentTradingType =
//         preferences.tradingType || tradingMode || "swing";

//       if (!isRetry) {
//         setMessage("");

//         setMessages((current) => [
//           ...current,
//           {
//             role: "user",
//             content: trimmed,
//             createdAt: new Date().toISOString(),
//           },
//           {
//             role: "assistant",
//             content: "",
//             createdAt: new Date().toISOString(),
//           },
//         ]);
//       } else {
//         setMessages((current) => {
//           const next = [...current];

//           if (
//             next.at(-1)?.role === "assistant" &&
//             !next.at(-1)?.content
//           ) {
//             next.pop();
//           }

//           next.push({
//             role: "assistant",
//             content: "",
//             createdAt: new Date().toISOString(),
//           });

//           return next;
//         });
//       }

//       setRetryMessage(null);
//       setError(null);
//       setToolStatus("THINKING");
//       setStreaming(true);

//       let receivedAssistantText = false;
//       let requestFailed = false;
//       let streamFinished = false;

// let supportResistanceCallbackTriggered = false;

// const completeSupportResistanceRequest = () => {
//   if (
//     !isSupportResistanceRequest ||
//     supportResistanceCallbackTriggered
//   ) {
//     return;
//   }

//   supportResistanceCallbackTriggered = true;
//   onSupportResistanceRequest?.();
// };

//       const removeEmptyAssistant = () => {
//         setMessages((current) => {
//           const next = [...current];

//           if (
//             next.at(-1)?.role === "assistant" &&
//             !next.at(-1)?.content
//           ) {
//             next.pop();
//           }

//           return next;
//         });
//       };

//       try {
//         const response = await fetch("/api/ai/chat", {
//           method: "POST",
//           signal: controller.signal,
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "text/event-stream, application/json",
//           },
//           body: JSON.stringify({
//             chatId,
//             message: trimmed,
//             symbol,
//             stockName,
//             price,
//             change,
//             changePercent,
//             tradingMode: currentTradingType,
//             risk: currentRisk,
//           }),
//         });

//         if (!response.ok) {
//           let serverError = `AI request failed (${response.status}).`;

//           try {
//             const data = await response.json();
//             serverError =
//               data?.error || data?.message || serverError;
//           } catch {
//             // Keep the default error.
//           }

//           throw new Error(serverError);
//         }

//         if (!response.body) {
//           throw new Error("AI streaming is unavailable.");
//         }

//         const reader = response.body.getReader();
//         const decoder = new TextDecoder();
//         let buffer = "";

//         const processPayload = (payload: any) => {
//           if (!payload) return;

//           switch (payload.type) {
//             case "start":
//               setToolStatus("THINKING");
//               break;

//             case "tool_start": {
//               const labels: Record<string, string> = {
//                 supportResistance: "ANALYZING SUPPORT / RESISTANCE",
//                 trend: "ANALYZING TREND",
//                 rsi: "ANALYZING RSI",
//                 macd: "ANALYZING MACD",
//                 movingAverage: "ANALYZING MOVING AVERAGE",
//                 analysis: "ANALYZING MARKET DATA",
//               };

//               setToolStatus(
//                 labels[payload.tool] ||
//                   payload.label ||
//                   "ANALYZING MARKET",
//               );
//               break;
//             }

//             case "tool_result":
//               setToolStatus("ANALYZING RESULTS");
//               break;

//             case "delta": {
//               const delta =
//                 typeof payload.text === "string"
//                   ? payload.text
//                   : typeof payload.content === "string"
//                     ? payload.content
//                     : "";

//               if (!delta) break;

//               receivedAssistantText = true;
//               setToolStatus(null);

//               setMessages((current) => {
//                 const next = [...current];
//                 const lastIndex = next.length - 1;

//                 if (
//                   lastIndex >= 0 &&
//                   next[lastIndex].role === "assistant"
//                 ) {
//                   next[lastIndex] = {
//                     ...next[lastIndex],
//                     content: next[lastIndex].content + delta,
//                   };
//                 } else {
//                   next.push({
//                     role: "assistant",
//                     content: delta,
//                     createdAt: new Date().toISOString(),
//                   });
//                 }

//                 return next;
//               });

//               break;
//             }

//             case "message":
//             case "assistant": {
//               const content =
//                 typeof payload.content === "string"
//                   ? payload.content
//                   : typeof payload.text === "string"
//                     ? payload.text
//                     : "";

//               if (!content) break;

//               receivedAssistantText = true;
//               setToolStatus(null);

//               setMessages((current) => {
//                 const next = [...current];

//                 if (next.at(-1)?.role === "assistant") {
//                   next[next.length - 1] = {
//                     ...next[next.length - 1],
//                     content,
//                   };
//                 } else {
//                   next.push({
//                     role: "assistant",
//                     content,
//                     createdAt: new Date().toISOString(),
//                   });
//                 }

//                 return next;
//               });

//               break;
//             }

//             case "saved":
//               window.dispatchEvent(new CustomEvent("chat-updated"));
//               break;

//             // case "done":
//             // case "complete":
//             //   streamFinished = true;
//             //   setToolStatus(null);
//             //   setRetryMessage(null);
//             //   setError(null);
//             //   window.dispatchEvent(new CustomEvent("chat-updated"));
//             //   break;
//             case "done":
//             case "complete":
//               streamFinished = true;
//               setToolStatus(null);
//               setRetryMessage(null);
//               setError(null);

//               completeSupportResistanceRequest();

//               window.dispatchEvent(new CustomEvent("chat-updated"));
//               break;

//             case "retry_failed":
//             case "error":
//               requestFailed = true;
//               streamFinished = true;
//               setToolStatus(null);
//               setError(
//                 payload.error ||
//                   payload.message ||
//                   "The AI is temporarily unavailable. Please try again.",
//               );
//               setRetryMessage(trimmed);
//               removeEmptyAssistant();
//               break;

//             default:
//               break;
//           }
//         };

//         while (!streamFinished && !requestFailed) {
//           const { done, value } = await reader.read();
//           if (done) break;

//           buffer += decoder.decode(value, { stream: true });
//           buffer = buffer.replace(/\r\n/g, "\n");

//           const events = buffer.split("\n\n");
//           buffer = events.pop() || "";

//           for (const event of events) {
//             if (!event.trim()) continue;

//             const payload = parseSSEEvent(event);
//             if (payload) processPayload(payload);

//             if (streamFinished || requestFailed) break;
//           }
//         }

//         buffer += decoder.decode();
//         buffer = buffer.replace(/\r\n/g, "\n");

//         if (!streamFinished && !requestFailed && buffer.trim()) {
//           const payload = parseSSEEvent(buffer);
//           if (payload) processPayload(payload);
//         }

//         if (!receivedAssistantText && !requestFailed) {
//           throw new Error(
//             "The AI connection ended without a response.",
//           );
//         }

//         // if (receivedAssistantText && !requestFailed) {
//         //   setToolStatus(null);
//         //   setRetryMessage(null);
//         //   setError(null);
//         //   window.dispatchEvent(new CustomEvent("chat-updated"));
//         // }

// if (receivedAssistantText && !requestFailed) {
//   setToolStatus(null);
//   setRetryMessage(null);
//   setError(null);

//   completeSupportResistanceRequest();

//   window.dispatchEvent(new CustomEvent("chat-updated"));
// }
//       } catch (requestError) {
//         if (
//           requestError instanceof DOMException &&
//           requestError.name === "AbortError"
//         ) {
//           return;
//         }

//         console.error("[AIAnalyst] Request failed:", requestError);

//         removeEmptyAssistant();
//         setToolStatus(null);
//         setRetryMessage(trimmed);

//         setError(
//           requestError instanceof Error
//             ? requestError.message
//             : "The AI is temporarily unavailable. Please try again.",
//         );
//       } finally {
//         setStreaming(false);
//         setToolStatus(null);

//         if (abortControllerRef.current === controller) {
//           abortControllerRef.current = null;
//         }
//       }
//     },
//     [
//       message,
//       streaming,
//       chatId,
//       symbol,
//       stockName,
//       price,
//       change,
//       changePercent,
//       tradingMode,
//       risk,
//     ],
//   );

//   function retryLastMessage() {
//     if (!retryMessage || streaming) return;
//     void sendMessage(retryMessage, true);
//   }

//   /* UI */

//   return (
//     <aside className="hidden w-[360px] shrink-0 flex-col border-l border-[#202027] bg-black xl:flex">
//       <div className="flex h-[62px] shrink-0 items-center justify-between border-b border-[#202027] px-5">
//         <div className="flex items-center gap-2">
//           <div className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900">
//             <Bot size={14} strokeWidth={2} />
//           </div>

//           <span className="font-mono text-[12px] font-semibold tracking-[1px]">
//             QUANT BOT
//           </span>
//         </div>

//         <span
//           className={`font-mono text-[9px] tracking-[1.2px] ${
//             streaming ? "text-purple-400" : "text-[#5e626c]"
//           }`}
//         >
//           {streaming ? toolStatus || "THINKING" : "AI ANALYST"}
//         </span>
//       </div>

//       <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
//         {loadingChat ? (
//           <div className="flex h-full items-center justify-center">
//             <div className="font-mono text-[12px] tracking-[0.5px] text-[#626570]">
//               Loading conversation...
//             </div>
//           </div>
//         ) : messages.length === 0 ? (
//           <div className="flex h-full items-center justify-center">
//             <div className="max-w-[270px] text-center">
//               <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#292932] bg-[#121218]">
//                 <Bot size={18} className="text-purple-400" />
//               </div>

//               <div className="mt-4 font-mono text-[13px] text-white">
//                 Ask Quant Bot
//               </div>

//               <p className="mt-2 text-[13px] leading-[1.7] text-[#858895]">
//                 Ask about {stockName}, technical analysis,
//                 strategies, risk or trading ideas.
//               </p>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-7">
//             {messages.map((item, index) => {
//               const isUser = item.role === "user";
//               const isLast = index === messages.length - 1;

//               return (
//                 <div
//                   key={`${item.createdAt ?? "message"}-${index}`}
//                   className={
//                     isUser ? "flex justify-end" : "flex justify-start"
//                   }
//                 >
//                   {isUser ? (
//                     <div className="max-w-[300px] whitespace-pre-wrap break-words rounded-[18px] bg-[#43237491] px-4 py-3 text-[14px] leading-[1.75] text-white">
//                       {item.content}
//                     </div>
//                   ) : (
//                     <div className="w-full max-w-[325px] min-w-0">
//                       <div className="mb-3 flex items-center gap-2">
//                         <span
//                           className={`h-1.5 w-1.5 rounded-full bg-purple-400 ${
//                             // streaming && isLast ? "animate-pulse" : ""
//                             streaming && isLast ? "hidden" : ""
//                           }`}
//                         />

//                         <span className="font-mono text-[11px] font-medium tracking-[1px] text-purple-400">
//                           QUANT BOT
//                         </span>
//                       </div>

//                       {item.content ? (
//                         <div className="min-w-0 break-words">
//                           {renderAIMessage(item.content)}

//                           {streaming && isLast && (
//                             <span className="ml-0.5 inline-block h-[16px] w-[5px] translate-y-[2px] animate-pulse bg-purple-400" />
//                           )}
//                         </div>
//                       ) : (
//                         <div className="flex items-center gap-2 py-2 font-mono text-[11px] tracking-[0.8px] text-white/45">
//                           <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
//                           {toolStatus || "THINKING"}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}

//             <div ref={messagesEndRef} />
//           </div>
//         )}

//         {error && (
//           <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-[#63252e] bg-[#211013] px-3 py-3">
//             <div className="text-center text-[12px] leading-[1.6] text-[#ff7b88]">
//               {error}
//             </div>

//             {retryMessage && (
//               <button
//                 type="button"
//                 onClick={retryLastMessage}
//                 disabled={streaming}
//                 className="inline-flex items-center gap-1.5 rounded-md border border-[#633b7f] bg-[#24152f] px-3 py-2 font-mono text-[11px] text-[#cda8ff] transition hover:bg-[#301b40] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 <RotateCcw size={13} />
//                 Retry
//               </button>
//             )}
//           </div>
//         )}
//       </div>

//       <div className="shrink-0 border-t border-[#202027] p-4">
//         <div className="flex h-[48px] items-center rounded-md border border-[#282832] bg-[#121218] px-3 pr-2">
//           <input
//             value={message}
//             onChange={(event) => setMessage(event.target.value)}
//             onKeyDown={(event) => {
//               if (event.key === "Enter" && !event.shiftKey) {
//                 event.preventDefault();
//                 void sendMessage();
//               }
//             }}
//             disabled={streaming}
//             placeholder={
//               streaming
//                 ? toolStatus || "Quant Bot is thinking..."
//                 : "Ask AI anything..."
//             }
//             className="googlesans min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-[#777b87] disabled:opacity-50"
//           />

//           <button
//             type="button"
//             onClick={() => void sendMessage()}
//             disabled={!message.trim() || streaming}
//             aria-label="Send message"
//             className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
//           >
//             <ArrowUp size={17} strokeWidth={2.5} />
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// }











"use client";

import { ArrowUp, Bot, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ==========================================================================
   TYPES
========================================================================== */

type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};


type AIAnalystProps = {
  chatId: string;
  stockName: string;
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  tradingMode: string;
  risk: string;

  onSupportResistanceRequest?: () => void;
};

type ParsedTag = {
  name: string;
  variant?: string;
  closing: boolean;
  length: number;
};

const INLINE_TAGS = [
  "head1",
  "head2",
  "bold",
  "italic",
  "small",
  "muted",
  "color",
  "bullet",
  "step",
  "code",
  "large",
  "positive",
  "negative",
] as const;

const COLOR_CLASSES: Record<string, string> = {
  green: "text-emerald-300",
  red: "text-rose-300",
  purple: "text-purple-300",
  yellow: "text-amber-300",
  blue: "text-sky-300",
};

const BOX_CLASSES: Record<string, string> = {
  info: "border-sky-500/25 bg-sky-500/[0.07]",
  success: "border-emerald-500/25 bg-emerald-500/[0.07]",
  warning: "border-amber-500/30 bg-amber-500/[0.07]",
  danger: "border-rose-500/30 bg-rose-500/[0.07]",
  recommendation: "border-purple-500/30 bg-purple-500/[0.08]",
};

const BOX_TITLES: Record<string, string> = {
  info: "Information",
  success: "Positive signal",
  warning: "Risk warning",
  danger: "Caution",
  recommendation: "AI Recommendation",
};

/* ==========================================================================
   PREFERENCES
========================================================================== */

function getQuantifyPreferences() {
  if (typeof window === "undefined") {
    return { risk: "medium", tradingType: "swing" };
  }

  return {
    risk:
      localStorage.getItem("quantify_risk_level")?.trim() ||
      "medium",
    tradingType:
      localStorage.getItem("quantify_trading_type")?.trim() ||
      "swing",
  };
}

/* ==========================================================================
   MESSAGE NORMALIZATION
========================================================================== */

function normalizeMessage(value: unknown): Message | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  const role =
    record.role === "user" || record.role === "assistant"
      ? record.role
      : null;

  if (!role) return null;

  const content =
    typeof record.content === "string"
      ? record.content
      : typeof record.message === "string"
        ? record.message
        : typeof record.text === "string"
          ? record.text
          : "";

  return {
    role,
    content,
    createdAt:
      typeof record.createdAt === "string"
        ? record.createdAt
        : undefined,
  };
}

function extractChatMessages(data: unknown): Message[] {
  if (!data || typeof data !== "object") return [];

  const record = data as Record<string, any>;

  const candidates = [
    record.chat?.messages,
    record.messages,
    record.data?.messages,
    record.chat?.data?.messages,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map(normalizeMessage)
        .filter((item): item is Message => item !== null);
    }
  }

  return [];
}

/* ==========================================================================
   TAG PARSER
========================================================================== */

function readTag(
  text: string,
  index: number,
): ParsedTag | null {
  if (text[index] !== "[") return null;

  const end = text.indexOf("]", index);
  if (end === -1) return null;

  const raw = text.slice(index + 1, end).trim();
  if (!raw) return null;

  const closingMatch = raw.match(/^\/([a-z]+)$/i);

  if (closingMatch) {
    const name = closingMatch[1].toLowerCase();

    if (
      INLINE_TAGS.includes(name as (typeof INLINE_TAGS)[number]) ||
      name === "box"
    ) {
      return {
        name,
        closing: true,
        length: end - index + 1,
      };
    }

    return null;
  }

  const colorMatch = raw.match(
    /^color=(green|red|purple|yellow|blue)$/i,
  );

  if (colorMatch) {
    return {
      name: "color",
      variant: colorMatch[1].toLowerCase(),
      closing: false,
      length: end - index + 1,
    };
  }

  const boxMatch = raw.match(
    /^box=(info|success|warning|danger|recommendation)$/i,
  );

  if (boxMatch) {
    return {
      name: "box",
      variant: boxMatch[1].toLowerCase(),
      closing: false,
      length: end - index + 1,
    };
  }

  if (raw.toLowerCase() === "box") {
    return {
      name: "box",
      closing: true,
      length: end - index + 1,
    };
  }

  const name = raw.toLowerCase();

  if (
    INLINE_TAGS.includes(name as (typeof INLINE_TAGS)[number])
  ) {
    return {
      name,
      closing: false,
      length: end - index + 1,
    };
  }

  return null;
}

function findClosingTag(
  text: string,
  start: number,
  tagName: string,
): { start: number; end: number } | null {
  let cursor = start;

  while (cursor < text.length) {
    const openIndex = text.indexOf("[", cursor);
    if (openIndex === -1) return null;

    const tag = readTag(text, openIndex);

    if (!tag) {
      cursor = openIndex + 1;
      continue;
    }

    if (tag.name === tagName) {
      if (
        tag.closing ||
        (!tag.variant && !tag.closing)
      ) {
        return {
          start: openIndex,
          end: openIndex + tag.length,
        };
      }
    }

    cursor = openIndex + tag.length;
  }

  return null;
}

/* ==========================================================================
   MARKDOWN INLINE
========================================================================== */

function removeRawJsonBlocks(text: string): string {
  return text.replace(
    /```json\s*[\s\S]*?```/gi,
    "[Detailed tool data is available in the analysis findings.]"
  );
}



function renderMarkdownInline(
  source: string,
  keyPrefix: string,
): ReactNode[] {
  const output: ReactNode[] = [];
  const pattern =
    /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_)/g;

  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > cursor) {
      output.push(
        <span key={`${keyPrefix}-text-${index++}`}>
          {source.slice(cursor, match.index)}
        </span>,
      );
    }

    const token = match[0];
    const key = `${keyPrefix}-formatted-${index++}`;

    if (token.startsWith("**") || token.startsWith("__")) {
      output.push(
        <strong key={key} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      output.push(
        <code
          key={key}
          className="rounded-md border border-white/[0.08] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-purple-200"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      output.push(
        <em key={key} className="italic text-white/80">
          {token.slice(1, -1)}
        </em>,
      );
    }

    cursor = match.index + token.length;
  }

  if (cursor < source.length) {
    output.push(
      <span key={`${keyPrefix}-text-${index++}`}>
        {source.slice(cursor)}
      </span>,
    );
  }

  return output;
}

function renderInline(
  text: string,
  keyPrefix = "inline",
  depth = 0,
): ReactNode[] {
  if (depth > 20) return [text];

  const output: ReactNode[] = [];
  let cursor = 0;
  let index = 0;

  const pushPlainText = (value: string) => {
    output.push(
      ...renderMarkdownInline(
        value,
        `${keyPrefix}-plain-${index++}`,
      ),
    );
  };

  while (cursor < text.length) {
    const openIndex = text.indexOf("[", cursor);

    if (openIndex === -1) {
      pushPlainText(text.slice(cursor));
      break;
    }

    if (openIndex > cursor) {
      pushPlainText(text.slice(cursor, openIndex));
    }

    const tag = readTag(text, openIndex);

    if (!tag || tag.closing || tag.name === "box") {
      pushPlainText(text[openIndex]);
      cursor = openIndex + 1;
      continue;
    }

    const contentStart = openIndex + tag.length;
    const closing = findClosingTag(
      text,
      contentStart,
      tag.name,
    );

    if (!closing) {
      pushPlainText(text.slice(openIndex, contentStart));
      cursor = contentStart;
      continue;
    }

    const inner = text.slice(contentStart, closing.start);
    const children = renderInline(
      inner,
      `${keyPrefix}-${tag.name}-${index}`,
      depth + 1,
    );

    const key = `${keyPrefix}-${tag.name}-${index++}`;

    switch (tag.name) {
      case "head1":
        output.push(
          <h2
            key={key}
            className="mb-2 text-[22px] font-semibold leading-snug tracking-[-0.4px] text-white"
          >
            {children}
          </h2>,
        );
        break;

      case "head2":
        output.push(
          <h3
            key={key}
            className="mb-2 mt-5 text-[16px] font-semibold tracking-[0.1px] text-white"
          >
            {children}
          </h3>,
        );
        break;

      case "bold":
        output.push(
          <strong key={key} className="font-semibold text-white">
            {children}
          </strong>,
        );
        break;

      case "italic":
        output.push(
          <em key={key} className="italic text-white/80">
            {children}
          </em>,
        );
        break;

      case "small":
        output.push(
          <span
            key={key}
            className="text-[12px] leading-[1.7] text-white/55"
          >
            {children}
          </span>,
        );
        break;

      case "muted":
        output.push(
          <span key={key} className="text-white/50">
            {children}
          </span>,
        );
        break;

      case "color":
        output.push(
          <span
            key={key}
            className={COLOR_CLASSES[tag.variant || "blue"]}
          >
            {children}
          </span>,
        );
        break;

      case "bullet":
        output.push(
          <span key={key} className="text-white/80">
            <span className="mr-2 text-purple-400">•</span>
            {children}
          </span>,
        );
        break;

      case "step":
        output.push(
          <span key={key} className="text-white/80">
            {children}
          </span>,
        );
        break;

      case "code":
        output.push(
          <code
            key={key}
            className="rounded-md border border-white/[0.08] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-purple-200"
          >
            {children}
          </code>,
        );
        break;

      case "large":
        output.push(
          <span
            key={key}
            className="inline-block text-[25px] font-semibold tracking-[-0.4px] text-white"
          >
            {children}
          </span>,
        );
        break;

      case "positive":
        output.push(
          <span key={key} className="font-semibold text-emerald-300">
            {children}
          </span>,
        );
        break;

      case "negative":
        output.push(
          <span key={key} className="font-semibold text-rose-300">
            {children}
          </span>,
        );
        break;

      default:
        output.push(<span key={key}>{children}</span>);
    }

    cursor = closing.end;
  }

  return output;
}

/* ==========================================================================
   BLOCK RENDERER
========================================================================== */


/* ==========================================================================
   MARKDOWN TABLES + BLOCKQUOTES
========================================================================== */

function normalizeMarkdownLine(line: string): string {
  return line
    .replace(/\\\|/g, "|")
    .replace(/\\>/g, ">")
    .trim();
}

function splitMarkdownTableRow(line: string): string[] {
  let normalized = normalizeMarkdownLine(line);

  if (normalized.startsWith("|")) {
    normalized = normalized.slice(1);
  }

  if (normalized.endsWith("|") && !normalized.endsWith("\\|")) {
    normalized = normalized.slice(0, -1);
  }

  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (const char of normalized) {
    if (char === "|" && !escaped) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;

    if (char === "\\" && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }

  cells.push(current.trim());

  return cells;
}

function isMarkdownTableRow(line: string): boolean {
  const normalized = normalizeMarkdownLine(line);

  return (
    normalized.includes("|") &&
    splitMarkdownTableRow(normalized).length >= 2
  );
}

function isMarkdownTableSeparator(line: string): boolean {
  const cells = splitMarkdownTableRow(line);

  return (
    cells.length >= 2 &&
    cells.every((cell) =>
      /^:?-+:?$/.test(cell.replace(/\s/g, ""))
    )
  );
}

function renderMarkdownTable(
  headers: string[],
  rows: string[][],
  key: string,
): ReactNode {
  const columnCount = Math.max(
    headers.length,
    ...rows.map((row) => row.length),
  );

  const normalizedHeaders = Array.from(
    { length: columnCount },
    (_, index) => headers[index] ?? "",
  );

  return (
    <div
      key={key}
      className="my-4 w-full min-w-0 overflow-hidden rounded-[6px] border border-white/[0.10] bg-[#101016]"
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-white/[0.12] bg-white/[0.05]">
              {normalizedHeaders.map((header, index) => (
                <th
                  key={`${key}-header-${index}`}
                  className="whitespace-nowrap px-3 py-3 font-semibold text-white/90"
                >
                  {renderInline(header, `${key}-header-inline-${index}`)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={`${key}-row-${rowIndex}`}
                className={
                  rowIndex % 2 === 0
                    ? "border-b border-white/[0.06]"
                    : "border-b border-white/[0.06] bg-white/[0.02]"
                }
              >
                {Array.from({ length: columnCount }, (_, columnIndex) => {
                  const cell = row[columnIndex] ?? "";
                  const isFirstColumn = columnIndex === 0;

                  return (
                    <td
                      key={`${key}-cell-${rowIndex}-${columnIndex}`}
                      className={`max-w-[220px] px-3 py-3 align-top leading-[1.7] ${
                        isFirstColumn
                          ? "font-medium text-white/90"
                          : "text-white/70"
                      }`}
                    >
                      <div className="min-w-[50px] break-words">
                        {renderInline(
                          cell,
                          `${key}-cell-inline-${rowIndex}-${columnIndex}`,
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function renderWarningList(content: string): ReactNode {
  const normalized = content
    .replace(/\r\n?/g, "\n")
    .replace(/\\n/g, "\n");

  // Remove the warning title and icon from the content.
  const cleaned = normalized
    .replace(/⚠️?/g, "")
    .replace(/\*\*Important:\s*Read before acting\*\*/i, "")
    .trim();

  // Each warning starts with a dash followed by a space.
  const items = cleaned
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-−–—•*]\s*/, "").trim())
    .filter(Boolean);

  return (
    <ul className="m-0 list-none space-y-4 p-0">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3 text-[13px] leading-7 text-white/85"
        >
          <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
          <span className="min-w-0 flex-1 break-words">
            {renderInline(item, `warning-item-${index}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}



function renderMarkdownBlockquote(
  lines: string[],
  key: string,
): ReactNode {
  const content = lines
    .map((line) => normalizeMarkdownLine(line).replace(/^>\s?/, ""))
    .join("\n")
    .trim();

  const isWarning =
    /\b(warning|caution|risk|danger|loss|bearish)\b/i.test(content);

  const isRecommendation =
    /\b(recommendation|recommend|verdict|best action|suggestion)\b/i.test(
      content,
    );

  const variant = isWarning
    ? "warning"
    : isRecommendation
      ? "recommendation"
      : "info";

  const variantClasses: Record<string, string> = {
    warning: "border-amber-500/30 bg-amber-500/[0.07]",
    recommendation: "border-purple-500/30 bg-purple-500/[0.08]",
    info: "border-sky-500/25 bg-sky-500/[0.06]",
  };

  const variantTitles: Record<string, string> = {
    warning: "Risk warning",
    recommendation: "AI Recommendation",
    info: "Key takeaway",
  };

  const dotClasses: Record<string, string> = {
    warning: "bg-amber-400",
    recommendation: "bg-purple-400",
    info: "bg-sky-400",
  };

  // return (
  //   // <div
  //   //   key={key}
  //   //   // className={`my-4 rounded-xl border px-4 py-4 ${variantClasses[variant]}`}
  //   //   className={`my-4 min-w-0 rounded-xl border px-3 py-4 sm:px-4 ${variantClasses[variant]}`}
  //   // >
  //   //   <div className="mb-2 flex items-center gap-2">
  //   //     <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[variant]}`} />
  //   //     <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/75">
  //   //       {variantTitles[variant]}
  //   //     </span>
  //   //   </div>

  //   //   {/* <div className="whitespace-pre-wrap break-words text-[13px] leading-[1.8] text-white/85"> */}
  //   //   <div className="whitespace-pre-wrap break-words text-[13px] leading-[1.8] text-white/85">
  //   //     {renderInline(content, `${key}-content`)}
  //   //   </div>
  //   // </div>

    
  // );

  return (
  <div
    key={key}
    className={`my-4 min-w-0 rounded-xl border px-3 py-4 sm:px-4 ${variantClasses[variant]}`}
  >
    {/* Box title */}
    <div className="mb-3 flex items-center gap-2">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[variant]}`}
      />
      <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/75">
        {variantTitles[variant]}
      </span>
    </div>

    {/* Box content */}
    {isWarning ? (
      <div className="min-w-0">
        <div className="mb-4 flex items-start gap-2 font-semibold leading-6 text-white">
          <span className="shrink-0">⚠️</span>
          <span>Important: Read before acting</span>
        </div>

        {renderWarningList(content)}
      </div>
    ) : (
      <div className="whitespace-pre-wrap break-words text-[13px] leading-[1.8] text-white/85">
        {renderInline(content, `${key}-content`)}
      </div>
    )}
  </div>
);
}







/* ==========================================================================
   BLOCK RENDERER
========================================================================== */
// function normalizeWarningBullets(text: string): string {
//   const heading = "### Warnings and limitations";
//   const headingIndex = text.toLowerCase().indexOf(heading.toLowerCase());

//   if (headingIndex === -1) return text;

//   const beforeWarnings = text.slice(0, headingIndex);
//   const warningSection = text.slice(headingIndex + heading.length);

//   // Split warning sentences that the AI has put on one line.
//   const warningStarts =
//     /(?<=\s)-\s+(?=(?:This is|Taxes,|EMA and|If a stop-loss|Stop-loss and|Open positions|Fewer than|The strategy|Profit factor|Past performance|Projected price|This strategy)\b)/g;

//   const normalized = warningSection
//     .replace(/\r\n?/g, "\n")
//     .replace(/\\-/g, "-")
//     .replace(warningStarts, "\n- ")
//     .replace(/^\s*-\s*/gm, "")
//     .replace(/^\s*⚠️?\s*\*\*Important:\s*Read before acting\*\*\s*$/gm, "")
//     .replace(/^\s*\*\*Key takeaway\*\*\s*$/gm, "");

//   const warningLines = normalized
//     .split("\n")
//     .map((line) => line.trim())
//     .filter(Boolean);

//   const output: string[] = [
//     heading,
//     "",
//     "**Important: Read before acting**",
//     "",
//   ];

//   for (const line of warningLines) {
//     // Ignore duplicate headings and labels.
//     if (
//       /^#{1,3}\s+Warnings and limitations/i.test(line) ||
//       /^\*\*Important:\s*Read before acting\*\*$/i.test(line)
//     ) {
//       continue;
//     }

//     const cleaned = line.replace(/^[-*•]\s+/, "");

//     // Keep every warning as a separate Markdown bullet.
//     output.push(`- ${cleaned}`);
//   }

//   return `${beforeWarnings}${output.join("\n")}`;
// }




// function fixWarningSection(content: string): string {
//   const heading = "### Warnings and limitations";
//   const headingIndex = content.indexOf(heading);

//   if (headingIndex === -1) return content;

//   const beforeWarnings = content.slice(0, headingIndex);
//   let warnings = content.slice(headingIndex + heading.length);

//   // Remove the repeated "Key takeaway" labels.
//   warnings = warnings.replace(/^\s*\*\*Key takeaway\*\*\s*$/gm, "");

//   // Normalize the warning heading.
//   warnings = warnings.replace(
//     /^\s*⚠️?\s*\*\*Important:\s*Read before acting\*\*\s*$/m,
//     "**Important: Read before acting**"
//   );

//   const lines = warnings.split("\n");
//   const result: string[] = [];
//   let insideWarningList = false;

//   for (const rawLine of lines) {
//     const line = rawLine.trim();

//     if (!line) {
//       result.push("");
//       continue;
//     }

//     // Preserve any following section heading.
//     if (/^#{1,3}\s+/.test(line)) {
//       insideWarningList = false;
//       result.push(line, "");
//       continue;
//     }

//     if (line === "**Important: Read before acting**") {
//       result.push("", line, "");
//       insideWarningList = true;
//       continue;
//     }

//     if (insideWarningList) {
//       // Remove an existing bullet prefix before adding one.
//       const bulletText = line.replace(/^[-*]\s+/, "");
//       result.push(`- ${bulletText}`);
//     } else {
//       result.push(line);
//     }
//   }

//   return `${beforeWarnings}${heading}\n${result.join("\n")}`;
// }





// function normalizeWarningBullets(text: string): string {
//   const heading = "### Warnings and limitations";
//   const headingIndex = text.search(
//     /^#{1,3}\s+Warnings and limitations\s*$/im,
//   );

//   if (headingIndex === -1) return text;

//   const beforeWarnings = text.slice(0, headingIndex);
//   const headingMatch = text
//     .slice(headingIndex)
//     .match(/^#{1,3}\s+Warnings and limitations\s*$/im);

//   if (!headingMatch) return text;

//   const actualHeading = headingMatch[0];
//   let warnings = text.slice(
//     headingIndex + actualHeading.length,
//   );

//   // Keep the warning section separate from subsequent sections.
//   const nextHeadingIndex = warnings.search(/^#{1,3}\s+/m);

//   let followingContent = "";

//   if (nextHeadingIndex !== -1) {
//     followingContent = warnings.slice(nextHeadingIndex);
//     warnings = warnings.slice(0, nextHeadingIndex);
//   }

//   // Remove escaped pipes, escaped blockquote markers and blank backslash lines.
//   warnings = warnings
//     .replace(/\\\|/g, "|")
//     .replace(/\\>/g, ">")
//     .replace(/^\s*\\\s*$/gm, "");

//   // Remove the warning title and emoji from the body.
//   warnings = warnings
//     .replace(/^\s*⚠️?\s*\*\*Important:\s*Read before acting\*\*\s*/im, "")
//     .replace(/^\s*\*\*Important:\s*Read before acting\*\*\s*/im, "")
//     .replace(/^\s*\*\*Key takeaway\*\*\s*$/gm, "")
//     .trim();

//   // Split inline dash-separated sentences into separate warning items.
//   warnings = warnings.replace(
//     /\s+-\s+(?=(?:This|Taxes|EMA|If|Stop-loss|Open|Fewer|The|Profit|Past|Projected)\b)/gi,
//     "\n- ",
//   );

//   // Normalize existing bullet characters and add bullets to remaining points.
//   const warningItems = warnings
//     .split(/\n/)
//     .map((line) => line.trim())
//     .filter(Boolean)
//     .flatMap((line) =>
//       line
//         .split(/\s+-\s+(?=[A-Z])/g)
//         .map((part) => part.trim())
//         .filter(Boolean),
//     )
//     .map((line) => line.replace(/^[-*•]\s*/, "").trim())
//     .filter(Boolean);

//   const formattedWarnings = warningItems
//     .map((item) => `- ${item}`)
//     .join("\n");

//   return [
//     beforeWarnings.trimEnd(),
//     actualHeading,
//     "",
//     "**Important: Read before acting**",
//     "",
//     formattedWarnings,
//     "",
//     followingContent.trimStart(),
//   ]
//     .filter(Boolean)
//     .join("\n\n");
// }


function normalizeWarningBullets(text: string): string {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const result: string[] = [];

  let insideWarnings = false;
  let insideWarningList = false;

  for (const rawLine of lines) {
    let line = rawLine.trim();

    // Detect the warnings section even if the heading has different
    // Markdown formatting.
    if (/^#{0,3}\s*Warnings and limitations\s*#*$/i.test(line)) {
      insideWarnings = true;
      insideWarningList = false;
      result.push(line);
      continue;
    }

    // Stop at the next section.
    if (insideWarnings && /^#{1,3}\s+/.test(line)) {
      insideWarnings = false;
      insideWarningList = false;
      result.push(line);
      continue;
    }

    if (!insideWarnings) {
      result.push(rawLine);
      continue;
    }

    // Remove repeated labels that are not useful as content.
    if (/^\*\*Key takeaway\*\*$/i.test(line)) {
      continue;
    }

    // Normalize the warning title, including an emoji on its own line.
    if (/^⚠️?$/.test(line)) {
      continue;
    }

    if (
      /^\*\*Important:\s*Read before acting\*\*$/i.test(line) ||
      /^Important:\s*Read before acting$/i.test(line)
    ) {
      result.push("**Important: Read before acting**");
      insideWarningList = true;
      continue;
    }

    if (!line) {
      result.push("");
      continue;
    }

    if (insideWarningList) {
      // Strip any existing hyphen or bullet so it can be rendered
      // as a real HTML list item by the renderer.
      line = line.replace(/^[-*•]\s+/, "");
      result.push(`- ${line}`);
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}


function fixWarningSection(content: string): string {
  // Retained for compatibility with the existing renderer.
  // Warning formatting is handled by normalizeWarningBullets().
  return content;
}



function splitWarningItems(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    // Split dash-prefixed warnings even when the AI puts them on one line.
    .replace(
      /\s+-\s+(?=(?:This is|Taxes,|EMA and|If a stop-loss|Stop-loss and|Open positions|Fewer than|The strategy|Profit factor|Past performance|Projected price|This strategy engine)\b)/gi,
      "\n",
    )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}



function renderAIMessage(content: string): ReactNode[] {
content = fixWarningSection(content);
content = normalizeWarningBullets(content);

const lines = content
  .replace(/\r\n?/g, "\n")
  .replace(/\u00a0/g, " ")
  .replace(/\\\|/g, "|")
  .replace(/\\>/g, ">")
  .replace(/^\s*\\\s*$/gm, "")
  .split("\n");
  

  const output: ReactNode[] = [];
  let index = 0;
  let blockIndex = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index++;
      continue;
    }

    /* BOXES */

    const boxOpening = line.match(
      /^\[box=(info|success|warning|danger|recommendation)\]\s*$/i,
    );

    if (boxOpening) {
      const variant = boxOpening[1].toLowerCase();
      const boxLines: string[] = [];
      index++;

      while (index < lines.length) {
        const current = lines[index].trim();

        if (current === "[box]" || current === "[/box]") {
          index++;
          break;
        }

        boxLines.push(lines[index]);
        index++;
      }

      output.push(
        <div
          key={`box-${blockIndex++}`}
          className={`my-4 rounded-xl border px-4 py-4 ${BOX_CLASSES[variant]}`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                variant === "success"
                  ? "bg-emerald-400"
                  : variant === "warning"
                    ? "bg-amber-400"
                    : variant === "danger"
                      ? "bg-rose-400"
                      : variant === "info"
                        ? "bg-sky-400"
                        : "bg-purple-400"
              }`}
            />
            <span className="text-[12px] font-semibold uppercase tracking-[0.8px] text-white/75">
              {BOX_TITLES[variant]}
            </span>
          </div>

          {/* <div className="text-[14px] leading-[1.8] text-white/85">
            {renderAIMessage(boxLines.join("\n"))}
          </div> */}

<div className="min-w-0 text-[13px] leading-[1.8] text-white/85">
  
  
  
{variant === "warning" ? (
  (() => {
    const rawContent = boxLines
      .join("\n")
      .replace(/\\n/g, "\n")
      .replace(/^\s*⚠️?\s*\*\*Important:\s*Read before acting\*\*\s*/i, "")
      .replace(/^\s*\*\*Important:\s*Read before acting\*\*\s*/i, "")
      .trim();

    const items = rawContent
      // Split warning points even when they arrive on one line.
      .replace(
        /\s+-\s+(?=(?:This is|Taxes,|EMA and|If a stop-loss|Stop-loss and|Open positions|Fewer than|The strategy|Profit factor|Past performance|Projected price|This strategy engine)\b)/gi,
        "\n",
      )
      .split(/\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      // .map((item) => item.replace(/^[-*•]\s*/, "").trim())
    .map((item) =>
      item
        .replace(/^\s*[-*•]\s*/, "")
        .replace(/^\s*\\-\s*/, "")
        .trim()
    )
      .filter(Boolean);

    return (
      <div className="min-w-0">
        <div className="mb-4 flex items-start gap-2 font-semibold leading-6 text-white">
          <span className="shrink-0">⚠️</span>
          <span>Important: Read before acting</span>
        </div>

        <ul className="m-0 list-none space-y-4 p-0">
          {items.map((item, itemIndex) => (
            <li
              key={itemIndex}
              className="flex items-start gap-3 break-words text-[13px] leading-7 text-white/85"
            >
              <span
                aria-hidden="true"
                className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
              />
              <span className="min-w-0 flex-1">
                {/* {renderInline(item)} */}
                {renderInline(
  item
    .replace(/^\s*[-−–—•*]+\s*/, "")
    .trim()
)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  })()
) : (
  renderAIMessage(boxLines.join("\n"))
)}





</div>



        </div>,
      );

      continue;
    }

    /* DIVIDERS */

    if (
      line === "[line]" ||
      /^---+$/.test(line) ||
      /^\*\*\*+$/.test(line)
    ) {
      output.push(
        <div
          key={`divider-${blockIndex++}`}
          className="my-5 h-px w-full bg-white/[0.10]"
        />,
      );

      index++;
      continue;
    }

    /* CUSTOM HEADINGS */

    if (/^\[head1\]/i.test(line) && /\[head1\]\s*$/i.test(line)) {
      output.push(
        <div key={`heading-${blockIndex++}`} className="mb-5">
          {renderInline(line)}
          <div className="mt-3 h-px w-12 bg-purple-500/80" />
        </div>,
      );

      index++;
      continue;
    }

    if (/^\[head2\]/i.test(line) && /\[head2\]\s*$/i.test(line)) {
      output.push(
        <div key={`subheading-${blockIndex++}`}>
          {renderInline(line)}
        </div>,
      );

      index++;
      continue;
    }

    /* MARKDOWN HEADINGS */

    const markdownHeading = line.match(/^(#{1,3})\s+(.+)$/);

    if (markdownHeading) {
      const level = markdownHeading[1].length;
      const children = renderInline(markdownHeading[2]);
      const key = `markdown-heading-${blockIndex++}`;

      if (level === 1) {
        output.push(
          <h2 key={key} className="mb-3 text-[22px] font-semibold text-white">
            {children}
          </h2>,
        );
      } else if (level === 2) {
        output.push(
          <h3
            key={key}
            className="mb-2 mt-5 text-[16px] font-semibold text-white"
          >
            {children}
          </h3>,
        );
      } else {
        output.push(
          <h4
            key={key}
            className="mb-2 mt-4 text-[14px] font-semibold text-white"
          >
            {children}
          </h4>,
        );
      }

      index++;
      continue;
    }

    /* MARKDOWN TABLES
       Supports both normal pipes and escaped pipes (\|).
    */

    if (
      index + 1 < lines.length &&
      isMarkdownTableRow(line) &&
      isMarkdownTableSeparator(lines[index + 1])
    ) {
      const headers = splitMarkdownTableRow(line);
      const rows: string[][] = [];

      index += 2;

      while (index < lines.length) {
        const rowLine = lines[index].trim();

        if (!rowLine || !isMarkdownTableRow(rowLine)) {
          break;
        }

        rows.push(splitMarkdownTableRow(rowLine));
        index++;
      }

      output.push(
        renderMarkdownTable(
          headers,
          rows,
          `markdown-table-${blockIndex++}`,
        ),
      );

      continue;
    }

    /* MARKDOWN BLOCKQUOTES
       Supports > text and escaped \> text.
    */

    const normalizedLine = normalizeMarkdownLine(line);

    if (/^>\s?/.test(normalizedLine)) {
      const quoteLines: string[] = [];

      while (index < lines.length) {
        const current = normalizeMarkdownLine(lines[index].trim());

        if (!/^>\s?/.test(current)) {
          break;
        }

        quoteLines.push(current);
        index++;
      }

      output.push(
        renderMarkdownBlockquote(
          quoteLines,
          `blockquote-${blockIndex++}`,
        ),
      );

      continue;
    }

    /* CUSTOM BULLETS */

    const customBullet = line.match(
      /^\[bullet\]([\s\S]*?)\[bullet\]\s*$/i,
    );

    if (customBullet) {
      output.push(
        <div
          key={`bullet-${blockIndex++}`}
          className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
        >
          <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
          <div className="min-w-0 flex-1">
            {renderInline(customBullet[1].trim())}
          </div>
        </div>,
      );

      index++;
      continue;
    }

    /* AUTOMATIC SUPPORT / RESISTANCE BULLETS */

    if (/^(support|resistance)\s*:/i.test(line)) {
      output.push(
        <div
          key={`level-${blockIndex++}`}
          className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
        >
          <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
          <div className="min-w-0 flex-1">
            {renderInline(line)}
          </div>
        </div>,
      );

      index++;
      continue;
    }

    /* MARKDOWN BULLETS */

    // const markdownBullet = line.match(/^[-*+]\s+(.+)$/);

    // if (markdownBullet) {
    //   output.push(
    //     <div
    //       key={`markdown-bullet-${blockIndex++}`}
    //       className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
    //     >
    //       <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
    //       <div className="min-w-0 flex-1">
    //         {renderInline(markdownBullet[1])}
    //       </div>
    //     </div>,
    //   );

    //   index++;
    //   continue;
    // }


/* MARKDOWN BULLETS */

// const markdownBullet = line.match(/^[-*+]\s+(.+)$/);


/* MARKDOWN BULLETS */

// const markdownBullet = line.match(/^[-*+•]\s+(.+)$/);

// if (markdownBullet) {
//   output.push(
//     <div
//       key={`markdown-bullet-${blockIndex++}`}
//       className="my-3 flex items-start gap-3 text-[13px] leading-[1.8] text-white/85"
//     >
//       <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />

//       <div className="min-w-0 flex-1 break-words">
//         {renderInline(markdownBullet[1])}
//       </div>
//     </div>,
//   );

//   index++;
//   continue;
// }



/* MARKDOWN BULLETS */

// const markdownBullet = line.match(/^[-*+•]\s+(.+)$/);

// if (markdownBullet) {
//   output.push(
//     <div
//       key={`markdown-bullet-${blockIndex++}`}
//       className="my-3 flex items-start gap-3 text-[13px] leading-[1.8] text-white/85"
//     >
//       <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
//       <div className="min-w-0 flex-1 break-words">
//         {renderInline(markdownBullet[1])}
//       </div>
//     </div>,
//   );

//   index++;
//   continue;
// }


/* MARKDOWN BULLETS */

const markdownBullet = line.match(/^[-*+]\s+(.+)$/);

if (markdownBullet) {
  output.push(
    <div
      key={`markdown-bullet-${blockIndex++}`}
      className="my-3 flex items-start gap-3 text-[14px] leading-[1.8] text-white/85"
    >
      <span
        aria-hidden="true"
        className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
      />

      <div className="min-w-0 flex-1 break-words">
        {renderInline(markdownBullet[1])}
      </div>
    </div>,
  );

  index++;
  continue;
}


// if (markdownBullet) {
//   const isWarningBullet =
//     /Warnings and limitations/i.test(
//       lines.slice(0, index).reverse().find((item) =>
//         /^#{1,3}\s+/.test(item.trim())
//       ) || ""
//     );

//   output.push(
//     <div
//       key={`markdown-bullet-${blockIndex++}`}
//       className={`flex items-start gap-3 text-[14px] leading-[1.8] text-white/85 ${
//         isWarningBullet ? "my-3" : "my-1.5"
//       }`}
//     >
//       <span
//         className={`mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full ${
//           isWarningBullet ? "bg-amber-400" : "bg-purple-400"
//         }`}
//       />
//       <div className="min-w-0 flex-1 break-words">
//         {renderInline(markdownBullet[1])}
//       </div>
//     </div>,
//   );

//   index++;
//   continue;
// }



    /* CUSTOM STEPS */

    const customStep = line.match(
      /^\[step\]([\s\S]*?)\[step\]\s*$/i,
    );

    if (customStep) {
      const stepText = customStep[1].trim();
      const match = stepText.match(/^(\d+[.)]?)\s*(.*)$/);

      output.push(
        <div
          key={`step-${blockIndex++}`}
          className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
        >
          <span className="shrink-0 font-semibold text-purple-300">
            {match?.[1] || "•"}
          </span>
          <div className="min-w-0 flex-1">
            {renderInline(match?.[2] || stepText)}
          </div>
        </div>,
      );

      index++;
      continue;
    }

    /* MARKDOWN NUMBERED LIST */

    const numberedStep = line.match(/^(\d+[.)])\s+(.+)$/);

    if (numberedStep) {
      output.push(
        <div
          key={`numbered-step-${blockIndex++}`}
          className="my-1.5 flex items-start gap-2.5 text-[14px] leading-[1.8] text-white/80"
        >
          <span className="shrink-0 font-semibold text-purple-300">
            {numberedStep[1]}
          </span>
          <div className="min-w-0 flex-1">
            {renderInline(numberedStep[2])}
          </div>
        </div>,
      );

      index++;
      continue;
    }

    /* NORMAL PARAGRAPHS */

    output.push(
      <p
        key={`paragraph-${blockIndex++}`}
        className="mb-3 whitespace-pre-wrap break-words text-[14px] leading-[1.6] text-white/80"
      >
        {renderInline(normalizeMarkdownLine(line))}
      </p>,
    );

    index++;
  }

  return output;
}



/* ==========================================================================
   SSE PARSER
========================================================================== */

function parseSSEEvent(event: string) {
  let eventType = "message";
  const dataLines: string[] = [];

  for (const line of event.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim() || "message";
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (!dataLines.length) return null;

  const rawData = dataLines.join("\n");

  if (rawData === "[DONE]" || rawData === "DONE") {
    return { type: "done" };
  }

  let parsedData: any;

  try {
    parsedData = JSON.parse(rawData);
  } catch {
    parsedData = { content: rawData };
  }

  if (
    parsedData &&
    typeof parsedData === "object" &&
    !Array.isArray(parsedData)
  ) {
    return { ...parsedData, type: eventType };
  }

  return { type: eventType, data: parsedData };
}

/* ==========================================================================
   COMPONENT
========================================================================== */

export default function AIAnalyst({
  // chatId,
  // stockName,
  // symbol,
  // price,
  // change,
  // changePercent,
  // tradingMode,
  // risk,
  chatId,
  stockName,
  symbol,
  price,
  change,
  changePercent,
  tradingMode,
  risk,
  onSupportResistanceRequest,
}: AIAnalystProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /* LOAD CHAT */

  useEffect(() => {
    let cancelled = false;

    async function loadChat() {
      if (!chatId) {
        setMessages([]);
        setLoadingChat(false);
        return;
      }

      setLoadingChat(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/chats/${encodeURIComponent(chatId)}`,
          {
            method: "GET",
            cache: "no-store",
            headers: { Accept: "application/json" },
          },
        );

        let data: any = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.status === 401) {
          if (!cancelled) {
            setError("Please sign in to load this conversation.");
          }
          return;
        }

        if (response.status === 404) {
          if (!cancelled) setMessages([]);
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              `Failed to load chat (${response.status}).`,
          );
        }

        if (!cancelled) {
          setMessages(extractChatMessages(data));
        }
      } catch (loadError) {
        console.error("[AIAnalyst] Load chat failed:", loadError);

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load this chat.",
          );
        }
      } finally {
        if (!cancelled) setLoadingChat(false);
      }
    }

    void loadChat();

    return () => {
      cancelled = true;
    };
  }, [chatId]);

  /* AUTO SCROLL */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: streaming ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, streaming, error, toolStatus]);

  /* CLEANUP */

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /* SEND MESSAGE */

  const sendMessage = useCallback(
    async (messageToSend?: string, isRetry = false) => {
      const trimmed = (messageToSend ?? message).trim();



      if (!trimmed || streaming) return;

      const normalizedMessage = trimmed.toLowerCase();
      const isSupportResistanceRequest =
  /\b(support|resistance)\b/.test(normalizedMessage);

      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const preferences = getQuantifyPreferences();
      const currentRisk = preferences.risk || risk || "medium";
      const currentTradingType =
        preferences.tradingType || tradingMode || "swing";

      if (!isRetry) {
        setMessage("");

        setMessages((current) => [
          ...current,
          {
            role: "user",
            content: trimmed,
            createdAt: new Date().toISOString(),
          },
          {
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((current) => {
          const next = [...current];

          if (
            next.at(-1)?.role === "assistant" &&
            !next.at(-1)?.content
          ) {
            next.pop();
          }

          next.push({
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
          });

          return next;
        });
      }

      setRetryMessage(null);
      setError(null);
      setToolStatus("THINKING");
      setStreaming(true);

      let receivedAssistantText = false;
      let requestFailed = false;
      let streamFinished = false;

let supportResistanceCallbackTriggered = false;

const completeSupportResistanceRequest = () => {
  if (
    !isSupportResistanceRequest ||
    supportResistanceCallbackTriggered
  ) {
    return;
  }

  supportResistanceCallbackTriggered = true;
  onSupportResistanceRequest?.();
};

      const removeEmptyAssistant = () => {
        setMessages((current) => {
          const next = [...current];

          if (
            next.at(-1)?.role === "assistant" &&
            !next.at(-1)?.content
          ) {
            next.pop();
          }

          return next;
        });
      };

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, application/json",
          },
          body: JSON.stringify({
            chatId,
            message: trimmed,
            symbol,
            stockName,
            price,
            change,
            changePercent,
            tradingMode: currentTradingType,
            risk: currentRisk,
          }),
        });

        if (!response.ok) {
          let serverError = `AI request failed (${response.status}).`;

          try {
            const data = await response.json();
            serverError =
              data?.error || data?.message || serverError;
          } catch {
            // Keep the default error.
          }

          throw new Error(serverError);
        }

        if (!response.body) {
          throw new Error("AI streaming is unavailable.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processPayload = (payload: any) => {
          if (!payload) return;

          switch (payload.type) {
            case "start":
              setToolStatus("THINKING");
              break;

            case "tool_start": {
              const labels: Record<string, string> = {
                supportResistance: "ANALYZING SUPPORT / RESISTANCE",
                trend: "ANALYZING TREND",
                rsi: "ANALYZING RSI",
                macd: "ANALYZING MACD",
                movingAverage: "ANALYZING MOVING AVERAGE",
                analysis: "ANALYZING MARKET DATA",
              };

              setToolStatus(
                labels[payload.tool] ||
                  payload.label ||
                  "ANALYZING MARKET",
              );
              break;
            }

            case "tool_result":
              setToolStatus("ANALYZING RESULTS");
              break;

            case "delta": {
              const delta =
                typeof payload.text === "string"
                  ? payload.text
                  : typeof payload.content === "string"
                    ? payload.content
                    : "";

              if (!delta) break;

              receivedAssistantText = true;
              setToolStatus(null);

              setMessages((current) => {
                const next = [...current];
                const lastIndex = next.length - 1;

                if (
                  lastIndex >= 0 &&
                  next[lastIndex].role === "assistant"
                ) {
                  next[lastIndex] = {
                    ...next[lastIndex],
                    content: next[lastIndex].content + delta,
                  };
                } else {
                  next.push({
                    role: "assistant",
                    content: delta,
                    createdAt: new Date().toISOString(),
                  });
                }

                return next;
              });

              break;
            }

            case "message":
            case "assistant": {
              const content =
                typeof payload.content === "string"
                  ? payload.content
                  : typeof payload.text === "string"
                    ? payload.text
                    : "";

              if (!content) break;

              receivedAssistantText = true;
              setToolStatus(null);

              setMessages((current) => {
                const next = [...current];

                if (next.at(-1)?.role === "assistant") {
                  next[next.length - 1] = {
                    ...next[next.length - 1],
                    content,
                  };
                } else {
                  next.push({
                    role: "assistant",
                    content,
                    createdAt: new Date().toISOString(),
                  });
                }

                return next;
              });

              break;
            }

            case "saved":
              window.dispatchEvent(new CustomEvent("chat-updated"));
              break;

            // case "done":
            // case "complete":
            //   streamFinished = true;
            //   setToolStatus(null);
            //   setRetryMessage(null);
            //   setError(null);
            //   window.dispatchEvent(new CustomEvent("chat-updated"));
            //   break;
            case "done":
            case "complete":
              streamFinished = true;
              setToolStatus(null);
              setRetryMessage(null);
              setError(null);

              completeSupportResistanceRequest();

              window.dispatchEvent(new CustomEvent("chat-updated"));
              break;

            case "retry_failed":
            case "error":
              requestFailed = true;
              streamFinished = true;
              setToolStatus(null);
              setError(
                payload.error ||
                  payload.message ||
                  "The AI is temporarily unavailable. Please try again.",
              );
              setRetryMessage(trimmed);
              removeEmptyAssistant();
              break;

            default:
              break;
          }
        };

        while (!streamFinished && !requestFailed) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replace(/\r\n/g, "\n");

          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            if (!event.trim()) continue;

            const payload = parseSSEEvent(event);
            if (payload) processPayload(payload);

            if (streamFinished || requestFailed) break;
          }
        }

        buffer += decoder.decode();
        buffer = buffer.replace(/\r\n/g, "\n");

        if (!streamFinished && !requestFailed && buffer.trim()) {
          const payload = parseSSEEvent(buffer);
          if (payload) processPayload(payload);
        }

        if (!receivedAssistantText && !requestFailed) {
          throw new Error(
            "The AI connection ended without a response.",
          );
        }

        // if (receivedAssistantText && !requestFailed) {
        //   setToolStatus(null);
        //   setRetryMessage(null);
        //   setError(null);
        //   window.dispatchEvent(new CustomEvent("chat-updated"));
        // }

if (receivedAssistantText && !requestFailed) {
  setToolStatus(null);
  setRetryMessage(null);
  setError(null);

  completeSupportResistanceRequest();

  window.dispatchEvent(new CustomEvent("chat-updated"));
}
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        console.error("[AIAnalyst] Request failed:", requestError);

        removeEmptyAssistant();
        setToolStatus(null);
        setRetryMessage(trimmed);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "The AI is temporarily unavailable. Please try again.",
        );
      } finally {
        setStreaming(false);
        setToolStatus(null);

        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      message,
      streaming,
      chatId,
      symbol,
      stockName,
      price,
      change,
      changePercent,
      tradingMode,
      risk,
    ],
  );

  function retryLastMessage() {
    if (!retryMessage || streaming) return;
    void sendMessage(retryMessage, true);
  }

  /* UI */

  return (
    <aside className="hidden w-[360px] shrink-0 flex-col border-l border-[#202027] bg-black xl:flex">
      <div className="flex h-[62px] shrink-0 items-center justify-between border-b border-[#202027] px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900">
            <Bot size={14} strokeWidth={2} />
          </div>

          <span className="font-mono text-[12px] font-semibold tracking-[1px]">
            QUANT BOT
          </span>
        </div>

        <span
          className={`font-mono text-[9px] tracking-[1.2px] ${
            streaming ? "text-purple-400" : "text-[#5e626c]"
          }`}
        >
          {streaming ? toolStatus || "THINKING" : "AI ANALYST"}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {loadingChat ? (
          <div className="flex h-full items-center justify-center">
            <div className="font-mono text-[12px] tracking-[0.5px] text-[#626570]">
              Loading conversation...
            </div>
          </div>
        ) : 
        // messages.length === 0 ? (
        //   <div className="flex h-full items-center justify-center">
        //     <div className="max-w-[270px] text-center">
        //       <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#292932] bg-[#121218]">
        //         <Bot size={18} className="text-purple-400" />
        //       </div>

        //       <div className="mt-4 font-mono text-[13px] text-white">
        //         Ask Quant Bot
        //       </div>

        //       <p className="mt-2 text-[13px] leading-[1.7] text-[#858895]">
        //         Ask about {stockName}, technical analysis,
        //         strategies, risk or trading ideas.
        //       </p>
        //     </div>
        //   </div>
        // ) 
 messages.length === 0 ? (
  <div className="flex min-h-full items-center justify-center py-3">
    <div className="w-full max-w-[310px]">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/25 bg-purple-500/[0.09]">
        <Bot size={21} className="text-purple-400" />
      </div>

      <div className="mt-4 text-center">
        <h3 className="font-mono text-[14px] font-semibold text-white">
          AI Stock Analyst
        </h3>

        <p className="mt-2 text-[12px] leading-[1.7] text-[#858895]">
          Not sure what to ask? Start with a suggested analysis for{" "}
          <span className="font-medium text-purple-300">{symbol}</span>.
        </p>
      </div>

      <div className="mt-5">
        <div className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[#737582]">
          TECHNICAL ANALYSIS
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              title: "Analyze trend",
              description: "Bullish or bearish?",
              prompt: `Analyze the current trend of ${symbol} (${stockName}). Use the available trend and moving-average tools. Explain the trend direction, supporting evidence, and what could invalidate the analysis.`,
            },
            {
              title: "RSI analysis",
              description: "Momentum & reversals",
              prompt: `Analyze RSI and momentum for ${symbol} (${stockName}). Use the RSI tool if available. Explain whether the stock appears overbought, oversold, or neutral, and mention important limitations.`,
            },
            {
              title: "Support & resistance",
              description: "Important price levels",
              prompt: `Identify and explain the key support and resistance levels for ${symbol} (${stockName}). Use the available support/resistance tool and explain what these levels mean.`,
            },
            {
              title: "Full analysis",
              description: "Combine key indicators",
              prompt: `Perform a comprehensive technical analysis of ${symbol} (${stockName}) using the relevant available tools, including trend, RSI, MACD, moving averages, and support/resistance where supported. Summarize the evidence, risks, and uncertainties without inventing indicator values.`,
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => void sendMessage(item.prompt)}
              disabled={streaming || loadingChat}
              className="rounded-lg border border-[#292932] bg-[#101015] p-3 text-left transition hover:border-purple-500/50 hover:bg-purple-500/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="text-[12px] font-medium text-white">
                {item.title}
              </div>
              <div className="mt-1 text-[10px] leading-[1.5] text-[#858895]">
                {item.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 font-mono text-[10px] tracking-[1.2px] text-[#737582]">
          MARKET & STRATEGY
        </div>

        <div className="space-y-2">
          {[
            {
              title: "Market outlook",
              prompt: `Give me a market outlook for ${symbol} (${stockName}) using the available market data and analysis tools. Clearly distinguish verified data from interpretation, and state when current data is unavailable.`,
            },
            {
              title: "Analyze the risk",
              prompt: `Analyze the trading risks of ${symbol} (${stockName}) for my selected ${tradingMode} trading style and ${risk} risk preference. Discuss volatility, invalidation levels, and risk management. Do not invent prices or guarantee returns.`,
            },
            {
              title: "Build a strategy",
              prompt: `Help me develop a rule-based ${tradingMode} strategy for ${symbol} (${stockName}) suitable for a ${risk}-risk preference. Explain entry conditions, exit conditions, stop-loss logic, and how to backtest it before considering real trades. Do not claim profitability without backtest results.`,
            },
            {
              title: "Explain like a beginner",
              prompt: `Explain the current technical picture of ${symbol} (${stockName}) in beginner-friendly language. Use relevant available analysis tools, explain technical terms simply, and tell me what the evidence does and does not establish.`,
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => void sendMessage(item.prompt)}
              disabled={streaming || loadingChat}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#292932] bg-[#101015] px-3 py-3 text-left transition hover:border-purple-500/50 hover:bg-purple-500/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-[12px] text-white">
                {item.title}
              </span>
              <ArrowUp
                size={14}
                className="shrink-0 rotate-45 text-purple-400"
              />
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] leading-[1.6] text-[#626570]">
        Analysis is informational, not a guarantee of future performance.
      </p>
    </div>
  </div>
) 


        : (
          <div className="space-y-7">
            {messages.map((item, index) => {
              const isUser = item.role === "user";
              const isLast = index === messages.length - 1;

              return (
                <div
                  key={`${item.createdAt ?? "message"}-${index}`}
                  className={
                    isUser ? "flex justify-end" : "flex justify-start"
                  }
                >
                  {isUser ? (
                    <div className="max-w-[300px] whitespace-pre-wrap break-words rounded-[18px] bg-[#43237491] px-4 py-3 text-[14px] leading-[1.75] text-white">
                      {item.content}
                    </div>
                  ) : (
                    <div className="w-full max-w-[325px] min-w-0">
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full bg-purple-400 ${
                            // streaming && isLast ? "animate-pulse" : ""
                            streaming && isLast ? "hidden" : ""
                          }`}
                        />

                        <span className="font-mono text-[11px] font-medium tracking-[1px] text-purple-400">
                          QUANT BOT
                        </span>
                      </div>

                      {item.content ? (
                        <div className="min-w-0 break-words">
                          {renderAIMessage(removeRawJsonBlocks(item.content))}

                          {streaming && isLast && (
                            <span className="ml-0.5 inline-block h-[16px] w-[5px] translate-y-[2px] animate-pulse bg-purple-400" />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-2 font-mono text-[11px] tracking-[0.8px] text-white/45">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
                          {toolStatus || "THINKING"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-[#63252e] bg-[#211013] px-3 py-3">
            <div className="text-center text-[12px] leading-[1.6] text-[#ff7b88]">
              {error}
            </div>

            {retryMessage && (
              <button
                type="button"
                onClick={retryLastMessage}
                disabled={streaming}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#633b7f] bg-[#24152f] px-3 py-2 font-mono text-[11px] text-[#cda8ff] transition hover:bg-[#301b40] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={13} />
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[#202027] p-4">
        <div className="flex h-[48px] items-center rounded-md border border-[#282832] bg-[#121218] px-3 pr-2">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            disabled={streaming}
            placeholder={
              streaming
                ? toolStatus || "Quant Bot is thinking..."
                : "Ask AI anything..."
            }
            className="googlesans min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-[#777b87] disabled:opacity-50"
          />

          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!message.trim() || streaming}
            aria-label="Send message"
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp size={17} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
