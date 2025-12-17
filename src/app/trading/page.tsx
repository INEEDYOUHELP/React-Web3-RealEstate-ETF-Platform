'use client';

import Breadcrumb from '../components/layout/Breadcrumb';
import { useTrading } from '../../hooks/useTrading';
import TradingPanel from '../components/trading/TradingPanel';
import AssetSelector from '../components/trading/AssetSelector';
import OrderForm from '../components/trading/OrderForm';
import OrderBook from '../components/trading/OrderBook';
import RecentTrades from '../components/trading/RecentTrades';

export default function TradingPage() {
  const {
    assets,
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
  } = useTrading();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || amount < 0) {
      alert('请输入正确的数量与金额');
      return;
    }
    const result = submitOrder();
    alert(`订单已提交：${result.side === 'buy' ? '买入' : '卖出'} ${result.asset.name} 数量 ${result.quantity}`);
  };

  return (
    <>
      <section className="trading-hero">
        <div className="container">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '交易中心' },
            ]}
          />
          <div className="trading-header">
            <div>
              <h1>交易中心</h1>
              <p>实时交易房地产ETF，把握市场机会</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 0' }}>
        <TradingPanel>
          <AssetSelector
            assets={assets}
            selected={selected}
            query={query}
            onQueryChange={setQuery}
            onSelect={selectAsset}
          />
          <OrderForm
            asset={selected}
            side={side}
            onSideChange={setSide}
            amount={amount}
            onAmountChange={setAmount}
            quantity={quantity}
            onQuantityChange={setQuantity}
            estimatedCost={estimatedCost}
            onSubmit={onSubmit}
          />
        </TradingPanel>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
          <OrderBook />
          <RecentTrades />
        </div>
      </div>
    </>
  );
}

