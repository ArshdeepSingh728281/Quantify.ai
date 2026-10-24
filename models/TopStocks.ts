import type {
  Collection,
  Db,
} from "mongodb";

export type TopStock = {
  rank: number;

  symbol: string;

  shortName: string;

  name: string;

  instrumentKey: string;

  price: number | null;

  change: number | null;

  changePercent: number | null;

  open: number | null;

  high: number | null;

  low: number | null;

  close: number | null;

  volume: number | null;

  averagePrice: number | null;

  chart: number[];
};

export type TopStocksDocument = {
  _id?: string;

  type: "top-stocks";

  stocks: TopStock[];

  calculatedAt: Date;

  expiresAt: Date;
};

export function getTopStocksCollection(
  db: Db
): Collection<TopStocksDocument> {
  return db.collection<TopStocksDocument>(
    "top_stocks"
  );
}