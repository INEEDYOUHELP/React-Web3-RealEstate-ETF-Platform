import { TradingAsset } from '../types';

export const tradingAssets: TradingAsset[] = [
  {
    id: 1,
    name: '纽约曼哈顿商业区',
    code: 'RE-NY-MAN',
    price: 102.35,
    change: 1.2,
    volume: 1850000,
    region: '北美',
    type: '商业地产',
  },
  {
    id: 2,
    name: '伦敦金融城办公区',
    code: 'RE-LON-CBD',
    price: 98.7,
    change: -0.6,
    volume: 1320000,
    region: '欧洲',
    type: '商业地产',
  },
  {
    id: 3,
    name: '东京银座商业区',
    code: 'RE-TYO-GIN',
    price: 99.1,
    change: 0.3,
    volume: 870000,
    region: '亚太',
    type: '零售地产',
  },
  {
    id: 4,
    name: '新加坡CBD写字楼',
    code: 'RE-SG-CBD',
    price: 110.8,
    change: 1.8,
    volume: 950000,
    region: '亚太',
    type: '商业地产',
  },
];

