'use client';

import { marketOverview, analyticsCards } from '../data/analytics';

export function useAnalytics() {
  return {
    marketOverview,
    analyticsCards,
  };
}

