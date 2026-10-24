import {
  NextResponse,
} from "next/server";

import { auth } from "@/auth";

import {
  getUserChat,
} from "@/lib/chat";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{
    chatid: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { chatid } =
      await context.params;

    if (!UUID_REGEX.test(chatid)) {
      return NextResponse.json(
        {
          error: "Invalid chat ID.",
        },
        {
          status: 404,
        }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const chat =
      await getUserChat(
        session.user.id,
        chatid
      );

    // if (!chat) {
    //   return NextResponse.json(
    //     {
    //       error: "Chat not found.",
    //     },
    //     {
    //       status: 404,
    //     }
    //   );
    // }

    return NextResponse.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error(
      "GET /api/chats/[chatid] error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load chat.",
      },
      {
        status: 500,
      }
    );
  }
}






// import { auth } from "@/auth";

// import {
//   getUserChat,
// } from "@/lib/chat";

// /* ============================================================
//    GET /api/chats/[chatId]
// ============================================================ */

// export async function GET(
//   _request: Request,
//   {
//     params,
//   }: {
//     params: Promise<{
//       chatId: string;
//     }>;
//   }
// ) {
//   const session =
//     await auth();

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
//     const {
//       chatId,
//     } = await params;

//     const chat =
//       await getUserChat(
//         session.user.id,
//         chatId
//       );

//     if (!chat) {
//       return Response.json(
//         {
//           success: false,
//           error: "Chat not found.",
//         },
//         {
//           status: 404,
//         }
//       );
//     }

//     return Response.json({
//       success: true,

//       toolResults:
//         chat.toolResults ?? [],

//       messages:
//         chat.messages ?? [],
//     });
//   } catch (error) {
//     console.error(
//       "[GET /api/chats/[chatId]]",
//       error
//     );

//     return Response.json(
//       {
//         success: false,
//         error:
//           "Failed to load chat.",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }