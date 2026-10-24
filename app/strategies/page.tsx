import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function StrategiesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#08080a] text-white p-8">
      <h1 className="text-3xl font-semibold">
        Strategies
      </h1>
    </main>
  );
}