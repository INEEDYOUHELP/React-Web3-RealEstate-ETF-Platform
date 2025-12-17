'use client';

import Button from '../common/Button';
import Card from '../common/Card';
import styles from './OrderForm.module.css';
import { TradingAsset } from '../../../types';

type OrderSide = 'buy' | 'sell';

interface Props {
  asset: TradingAsset;
  side: OrderSide;
  onSideChange: (side: OrderSide) => void;
  amount: number;
  onAmountChange: (value: number) => void;
  quantity: number;
  onQuantityChange: (value: number) => void;
  estimatedCost: number;
  onSubmit: () => void;
}

export default function OrderForm({
  asset,
  side,
  onSideChange,
  amount,
  onAmountChange,
  quantity,
  onQuantityChange,
  estimatedCost,
  onSubmit,
}: Props) {
  return (
    <Card
      title="下单"
      actions={
        <div className={styles.tabs}>
          <Button variant={side === 'buy' ? 'primary' : 'outline'} onClick={() => onSideChange('buy')}>
            买入
          </Button>
          <Button variant={side === 'sell' ? 'primary' : 'outline'} onClick={() => onSideChange('sell')}>
            卖出
          </Button>
        </div>
      }
    >
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className={styles.label}>
          <span>资产</span>
          <div className={styles.readonly}>
            <strong>{asset.name}</strong>
            <span>{asset.code}</span>
          </div>
        </label>

        <label className={styles.label}>
          <span>数量</span>
          <input
            className={styles.input}
            type="number"
            value={quantity}
            min={1}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
          />
        </label>

        <label className={styles.label}>
          <span>金额 (USD)</span>
          <input
            className={styles.input}
            type="number"
            value={amount}
            min={0}
            onChange={(e) => onAmountChange(Number(e.target.value))}
          />
        </label>

        <div className={styles.estimate}>
          <span>预估成交额</span>
          <strong className={styles.estimateValue}>${estimatedCost.toFixed(2)}</strong>
          <small className={styles.estimatePrice}>价格 ${asset.price}</small>
        </div>

        <Button type="submit" style={{ width: '100%' }}>
          提交订单
        </Button>
      </form>
    </Card>
  );
}

