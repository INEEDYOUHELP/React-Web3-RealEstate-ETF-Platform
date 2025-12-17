import { AnalyticsMetric, MarketMetric } from '../types';

export const marketOverview: MarketMetric[] = [
  { label: '总市值', value: '$2.54B', change: '+5.2% 本周', positive: true },
  { label: '24小时交易量', value: '$89.5M', change: '-2.1% 昨日', positive: false },
  { label: '活跃ETF数量', value: '156', change: '+3 本周', positive: true },
  { label: '平均收益率', value: '6.8%', change: '+0.3% 本月', positive: true },
];

export const analyticsCards: AnalyticsMetric[] = [
  { id: 1, title: '北美核心地产', value: '$1.02B', change: '+4.1%', positive: true, icon: 'fa-building' },
  { id: 2, title: '欧洲写字楼', value: '$720M', change: '+2.6%', positive: true, icon: 'fa-city' },
  { id: 3, title: '亚太零售', value: '$480M', change: '+1.3%', positive: true, icon: 'fa-store' },
  { id: 4, title: '中东新兴', value: '$320M', change: '-0.8%', positive: false, icon: 'fa-chart-line' },
];

