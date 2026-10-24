// import clientPromise from "@/lib/mongodb";
// import type {
//   ChatDocument,
//   ChatMessage,
// } from "@/models/Chat";

// const DATABASE_NAME =  "";

// const COLLECTION_NAME = "chats";

// async function getChatsCollection() {
//   const client = await clientPromise;

//   const db = client.db(
//     DATABASE_NAME
//   );

//   return db.collection<ChatDocument>(
//     COLLECTION_NAME
//   );
// }

// export async function getChatById(chatId: string) {
//   const collection = await getChatsCollection();

//   return collection.findOne({
//     chatId,
//   });
// }

// export async function ensureChatIndexes() {
//   const collection =
//     await getChatsCollection();

//   await collection.createIndex(
//     {
//       chatId: 1,
//       userId: 1,
//     },
//     {
//       unique: true,
//     }
//   );

//   await collection.createIndex({
//     userId: 1,
//     updatedAt: -1,
//   });
// }

// export async function getUserChats(
//   userId: string
// ) {
//   const collection =
//     await getChatsCollection();

//   return collection
//     .find(
//       {
//         userId,
//       },
//       {
//         projection: {
//           _id: 0,
//           chatId: 1,
//           title: 1,
//           symbol: 1,
//           stockName: 1,
//           tradingMode: 1,
//           risk: 1,
//           createdAt: 1,
//           updatedAt: 1,
//         },
//       }
//     )
//     .sort({
//       updatedAt: -1,
//     })
//     .toArray();
// }

// export async function getUserChat(
//   userId: string,
//   chatId: string
// ) {
//   const collection =
//     await getChatsCollection();

//   return collection.findOne({
//     userId,
//     chatId,
//   });
// }

// export async function createChat(
//   chat: ChatDocument
// ) {
//   const collection =
//     await getChatsCollection();

//   await collection.insertOne(chat);

//   return chat;
// }

// export async function updateChat(
//   userId: string,
//   chatId: string,
//   messages: ChatMessage[],
//   title?: string
// ) {
//   const collection =
//     await getChatsCollection();

//   const update: Record<
//     string,
//     unknown
//   > = {
//     messages,
//     updatedAt: new Date(),
//   };

//   if (title) {
//     update.title = title;
//   }

//   return collection.findOneAndUpdate(
//     {
//       userId,
//       chatId,
//     },
//     {
//       $set: update,
//     },
//     {
//       returnDocument: "after",
//     }
//   );
// }






import clientPromise from "@/lib/mongodb";

import type {
  ChatDocument,
  ChatMessage,
  StoredToolResult,
} from "@/models/Chat";

/*
 * Empty database name means:
 * use the database from the MongoDB URI.
 */
const DATABASE_NAME = "";

const COLLECTION_NAME = "chats";

/* ============================================================
   COLLECTION
============================================================ */

async function getChatsCollection() {
  const client = await clientPromise;

  const db = client.db(DATABASE_NAME);

  return db.collection<ChatDocument>(
    COLLECTION_NAME
  );
}

/* ============================================================
   GET CHAT BY ID
============================================================ */

export async function getChatById(
  chatId: string
) {
  const collection =
    await getChatsCollection();

  return collection.findOne({
    chatId,
  });
}

/* ============================================================
   INDEXES
============================================================ */

export async function ensureChatIndexes() {
  const collection =
    await getChatsCollection();

  await collection.createIndex(
    {
      chatId: 1,
      userId: 1,
    },
    {
      unique: true,
    }
  );

  await collection.createIndex({
    userId: 1,
    updatedAt: -1,
  });
}

/* ============================================================
   USER CHATS
============================================================ */

export async function getUserChats(
  userId: string
) {
  const collection =
    await getChatsCollection();

  return collection
    .find(
      {
        userId,
      },
      {
        projection: {
          _id: 0,

          chatId: 1,

          title: 1,

          symbol: 1,

          stockName: 1,

          tradingMode: 1,

          risk: 1,

          toolResults: 1,

          createdAt: 1,

          updatedAt: 1,
        },
      }
    )
    .sort({
      updatedAt: -1,
    })
    .toArray();
}

/* ============================================================
   USER CHAT
============================================================ */

export async function getUserChat(
  userId: string,
  chatId: string
) {
  const collection =
    await getChatsCollection();

  return collection.findOne({
    userId,
    chatId,
  });
}

/* ============================================================
   CREATE CHAT
============================================================ */

export async function createChat(
  chat: ChatDocument
) {
  const collection =
    await getChatsCollection();

  await collection.insertOne(chat);

  return chat;
}

/* ============================================================
   UPDATE CHAT
============================================================ */

export async function updateChat(
  userId: string,
  chatId: string,
  messages: ChatMessage[],
  title?: string,
  toolResults?: StoredToolResult[]
) {
  const collection =
    await getChatsCollection();

  const update: Record<
    string,
    unknown
  > = {
    messages,

    updatedAt:
      new Date(),
  };

  if (title) {
    update.title = title;
  }

  if (toolResults) {
    update.toolResults =
      toolResults;
  }

  return collection.findOneAndUpdate(
    {
      userId,
      chatId,
    },
    {
      $set: update,
    },
    {
      returnDocument: "after",
    }
  );
}

/* ============================================================
   APPEND TOOL RESULT
============================================================ */

export async function appendToolResult(
  userId: string,
  chatId: string,
  toolResult: StoredToolResult
) {
  const collection =
    await getChatsCollection();

  return collection.findOneAndUpdate(
    {
      userId,
      chatId,
    },
    {
      $push: {
        toolResults:
          toolResult,
      },

      $set: {
        updatedAt:
          new Date(),
      },
    },
    {
      returnDocument: "after",
    }
  );
}

/* ============================================================
   GET STORED TOOL RESULTS
============================================================ */

export async function getChatToolResults(
  userId: string,
  chatId: string
) {
  const collection =
    await getChatsCollection();

  const chat =
    await collection.findOne(
      {
        userId,
        chatId,
      },
      {
        projection: {
          _id: 0,
          toolResults: 1,
        },
      }
    );

  return chat?.toolResults ?? [];
}