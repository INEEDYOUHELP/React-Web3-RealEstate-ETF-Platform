export interface Asset {
  id: number;
  name: string;
  location: string;
  price: number;
  yield: number;
  image: string;
  type: string;
  region: string;
  tags: string[];
  minInvestment: number;
  totalUnits: number;
  soldUnits: number;
  description: string;
}

export interface Holding {
  id: number;
  name: string;
  investment: number;
  currentValue: number;
  return: number;
  returnRate: number;
  shares: number;
  location: string;
  type: string;
}

export interface Transaction {
  id: number;
  type: 'buy' | 'sell' | 'dividend';
  assetName: string;
  amount: number;
  shares: number;
  price?: number;
  date: string;
  status: string;
}

export interface TradingAsset {
  id: number;
  name: string;
  code: string;
  price: number;
  change: number;
  volume: number;
  region: string;
  type: string;
}

export interface MarketMetric {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export interface AnalyticsMetric {
  id: number;
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

