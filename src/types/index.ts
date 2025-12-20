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

// IPFS 相关类型
export interface PropertyMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    [key: string]: any;
  };
}

// 扩展 Asset 接口以支持 metadataURI
export interface AssetWithMetadata extends Asset {
  metadataURI?: string;
}

