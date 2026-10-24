// import StockWorkspace from "@/components/StockWorkspace";

// type PageProps = {
//   params: Promise<{
//     symbol: string;
//   }>;
// };

// export default async function StockPage({
//   params,
// }: PageProps) {
//   const { symbol } =
//     await params;

//   return (
//     <main className="h-screen w-screen overflow-hidden bg-[#0b0b0f] text-white">
//       <StockWorkspace
//         symbol={decodeURIComponent(
//           symbol
//         )}
//       />
//     </main>
//   );
// }





import { auth } from "@/auth";
import { getChatById } from "@/lib/chat";
import { redirect } from "next/navigation";
import StockWorkspace from "@/components/StockWorkspace";

type PageProps = {
  params: Promise<{
    symbol: string;
    chatid: string;
  }>;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function StockPage({
  params,
}: PageProps) {

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/unaccessible");
  }

  const { symbol, chatid } = await params;

  const cleanSymbol =
    decodeURIComponent(symbol);


  if (!UUID_REGEX.test(chatid)) {
    redirect("/unaccessible");
  }

  const existingChat =
    await getChatById(chatid);


  if (!existingChat) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-[#0b0b0f] text-white">
        <StockWorkspace
          symbol={cleanSymbol}
          chatId={chatid}
        />
      </main>
    );
  }


  if (
    existingChat.userId !==
    session.user.id
  ) {
    redirect("/unaccessible");
  }


  if (
    existingChat.symbol &&
    existingChat.symbol.toUpperCase() !==
      cleanSymbol.toUpperCase()
  ) {
    redirect("/unaccessible");
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0b0b0f] text-white">
      <StockWorkspace
        symbol={cleanSymbol}
        chatId={chatid}
      />
    </main>
  );
}