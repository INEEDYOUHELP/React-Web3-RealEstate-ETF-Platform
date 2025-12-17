import Card from '../common/Card';
import styles from './TransactionHistory.module.css';
import { Transaction } from '../../../types';

interface Props {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: Props) {
  return (
    <Card title="交易记录">
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>类型</th>
              <th>资产</th>
              <th>金额</th>
              <th>份额</th>
              <th>价格</th>
              <th>日期</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.type === 'buy' ? '买入' : t.type === 'sell' ? '卖出' : '分红'}</td>
                <td>{t.assetName}</td>
                <td>${t.amount.toLocaleString()}</td>
                <td>{t.shares}</td>
                <td>{t.price ? `$${t.price}` : '-'}</td>
                <td>{t.date}</td>
                <td>{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

