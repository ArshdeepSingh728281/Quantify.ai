import Navbar from "@/components/Navbar";
import WatchlistHeader from "@/components/WatchlistHeader";
import QuantHero from "@/components/QuantHero";
import StockTable from "@/components/StockTable";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <WatchlistHeader />

      <QuantHero />

      <StockTable />
    </main>
  );
}