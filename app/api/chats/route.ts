

// import { auth } from "@/auth";
// import {
//   createChat,
//   ensureChatIndexes,
//   getUserChats,
// } from "@/lib/chat";

// const UUID_REGEX =
//   /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// /*
//  * GET /api/chats
//  *
//  * Returns chats belonging ONLY to the
//  * currently logged-in user.
//  */
// export async function GET() {
//   const session = await auth();

//   if (!session?.user?.id) {
//     return Response.json(
//       {
//         success: false,
//         error: "Unauthorized",
//       },
//       {
//         status: 401,
//       }
//     );
//   }

//   try {
//     await ensureChatIndexes();

//     const chats = await getUserChats(
//       session.user.id
//     );

//     return Response.json({
//       success: true,
//       chats,
//     });
//   } catch (error) {
//     console.error(
//       "[GET /api/chats]",
//       error
//     );

//     return Response.json(
//       {
//         success: false,
//         error: "Failed to load chats.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

// /*
//  * POST /api/chats
//  *
//  * Creates a NEW chat for the currently
//  * authenticated user.
//  */
// export async function POST(
//   request: Request
// ) {
//   const session = await auth();

//   if (!session?.user?.id) {
//     return Response.json(
//       {
//         success: false,
//         error: "Unauthorized",
//       },
//       {
//         status: 401,
//       }
//     );
//   }

//   try {
//     const body = await request.json();

//     const {
//       chatId,
//       symbol,
//       stockName,
//       tradingMode,
//       risk,
//     } = body;

//     /*
//      * Validate chat ID.
//      */
//     if (
//       !chatId ||
//       typeof chatId !== "string" ||
//       !UUID_REGEX.test(chatId)
//     ) {
//       return Response.json(
//         {
//           success: false,
//           error: "Invalid chat ID.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     /*
//      * Validate symbol.
//      */
//     if (
//       !symbol ||
//       typeof symbol !== "string"
//     ) {
//       return Response.json(
//         {
//           success: false,
//           error: "Symbol is required.",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     /*
//      * Make sure indexes exist.
//      */
//     await ensureChatIndexes();

//     /*
//      * Check whether this exact chat already
//      * exists for this user.
//      */
//     const { getUserChat } =
//       await import("@/lib/chat");

//     const existingChat =
//       await getUserChat(
//         session.user.id,
//         chatId
//       );

//     if (existingChat) {
//       return Response.json({
//         success: true,
//         chat: existingChat,
//         alreadyExists: true,
//       });
//     }

//     /*
//      * Create the chat.
//      */
//     const now = new Date();

//     const chat = await createChat({
//       chatId,

//       userId: session.user.id,

//       symbol: symbol.trim(),

//       stockName:
//         typeof stockName === "string" &&
//         stockName.trim()
//           ? stockName.trim()
//           : symbol.trim(),

//       title:
//         `New ${symbol.trim()} Chat`,

//       tradingMode:
//         typeof tradingMode === "string"
//           ? tradingMode
//           : "Swing",

//       risk:
//         typeof risk === "string"
//           ? risk
//           : "Medium",

//       /*
//        * New chat starts with NO messages.
//        */
//       messages: [],

//       createdAt: now,

//       updatedAt: now,
//     });

//     return Response.json(
//       {
//         success: true,
//         chat,
//       },
//       {
//         status: 201,
//       }
//     );
//   } catch (error: any) {
//     console.error(
//       "[POST /api/chats]",
//       error
//     );

//     /*
//      * Duplicate chat ID.
//      *
//      * This can happen if two requests happen
//      * at nearly the same time.
//      */
//     if (error?.code === 11000) {
//       return Response.json(
//         {
//           success: false,
//           error:
//             "This chat already exists.",
//         },
//         {
//           status: 409,
//         }
//       );
//     }

//     return Response.json(
//       {
//         success: false,
//         error:
//           "Failed to create chat.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }








import { auth } from "@/auth";

import {
  createChat,
  ensureChatIndexes,
  getUserChats,
  getUserChat,
} from "@/lib/chat";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* ============================================================
   GET /api/chats
============================================================ */

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    await ensureChatIndexes();

    const chats =
      await getUserChats(
        session.user.id
      );

    return Response.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error(
      "[GET /api/chats]",
      error
    );

    return Response.json(
      {
        success: false,
        error: "Failed to load chats.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/chats

   NOTE:
   This route remains available, but your frontend should NOT
   call it when the user opens a stock.

   New chats are created by /api/ai/chat after the first
   successful AI response.
============================================================ */

export async function POST(
  request: Request
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body =
      await request.json();

    const {
      chatId,
      symbol,
      stockName,
      tradingMode,
      risk,
    } = body;

    if (
      !chatId ||
      typeof chatId !== "string" ||
      !UUID_REGEX.test(chatId)
    ) {
      return Response.json(
        {
          success: false,
          error: "Invalid chat ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !symbol ||
      typeof symbol !== "string"
    ) {
      return Response.json(
        {
          success: false,
          error: "Symbol is required.",
        },
        {
          status: 400,
        }
      );
    }

    await ensureChatIndexes();

    const existingChat =
      await getUserChat(
        session.user.id,
        chatId
      );

    if (existingChat) {
      return Response.json({
        success: true,
        chat: existingChat,
        alreadyExists: true,
      });
    }

    const now =
      new Date();

    const cleanSymbol =
      symbol.trim();

    const chat = await createChat({
      chatId,

      userId:
        session.user.id,

      symbol:
        cleanSymbol,

      stockName:
        typeof stockName === "string" &&
        stockName.trim()
          ? stockName.trim()
          : cleanSymbol,

      title:
        `New ${cleanSymbol} Chat`,

      tradingMode:
        typeof tradingMode === "string"
          ? tradingMode
          : "Swing",

      risk:
        typeof risk === "string"
          ? risk
          : "Medium",

      messages: [],

      toolResults: [],

      createdAt:
        now,

      updatedAt:
        now,
    });

    return Response.json(
      {
        success: true,
        chat,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "[POST /api/chats]",
      error
    );

    if (
      error?.code === 11000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "This chat already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          "Failed to create chat.",
      },
      {
        status: 500,
      }
    );
  }
}