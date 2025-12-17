'use client';

import { useMemo, useState } from 'react';
import { tradingAssets } from '../data/trading';
import { TradingAsset } from '../types';

type OrderSide = 'buy' | 'sell';

export function useTrading() {
  const [selected, setSelected] = useState<TradingAsset>(tradingAssets[0]);
  const [side, setSide] = useState<OrderSide>('buy');
  const [amount, setAmount] = useState(1000);
  const [quantity, setQuantity] = useState(10);
  const [query, setQuery] = useState('');

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tradingAssets;
    return tradingAssets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.region.toLowerCase().includes(q),
    );
  }, [query]);

  const selectAsset = (asset: TradingAsset) => setSelected(asset);

  const estimatedCost = useMemo(() => {
    if (!selected) return 0;
    return side === 'buy' ? quantity * selected.price : quantity * selected.price;
  }, [quantity, selected, side]);

  const submitOrder = () => {
    // 简化：仅返回结果给 UI；实际集成时可调用合约或 API
    return {
      side,
      asset: selected,
      amount,
      quantity,
      estimatedCost,
      status: 'submitted',
    };
  };

  return {
    assets: filteredAssets,
    selected,
    selectAsset,
    side,
    setSide,
    amount,
    setAmount,
    quantity,
    setQuantity,
    query,
    setQuery,
    estimatedCost,
    submitOrder,
  };
}

