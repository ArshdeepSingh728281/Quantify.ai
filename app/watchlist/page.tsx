import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function WatchlistPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#08080a] text-white p-8">
      <h1 className="text-3xl font-semibold">
        Watchlist
      </h1>

      <p className="text-[#77777f] mt-2">
        Your private watchlist will appear here.
      </p>
    </main>
  );
}