'use client';

import { useMemo, useState } from 'react';
import { holdings, portfolioSummary, transactions } from '../data/portfolio';

export function usePortfolio() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('7d');
  const [allocationFilter, setAllocationFilter] = useState<'地区' | '类型'>('地区');

  const performance = useMemo(() => {
    const multipliers = { '7d': 1, '30d': 1.2, '90d': 1.35, '1y': 1.6 };
    const factor = multipliers[period];
    return holdings.map((h) => ({
      ...h,
      simulatedValue: h.currentValue * factor,
    }));
  }, [period]);

  return {
    summary: portfolioSummary,
    holdings,
    transactions,
    performance,
    period,
    setPeriod,
    allocationFilter,
    setAllocationFilter,
  };
}

