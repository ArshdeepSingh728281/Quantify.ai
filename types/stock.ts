export interface Stock {
  rank: number;
  symbol: string;
  name: string;
  shortName: string;
  price: number;
  change: number;
  instrumentKey?: string;
  chart: number[];
}