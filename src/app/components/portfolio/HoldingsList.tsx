import Card from '../common/Card';
import styles from './HoldingsList.module.css';
import { Holding } from '../../../types';

interface Props {
  holdings: Holding[];
}

export default function HoldingsList({ holdings }: Props) {
  return (
    <Card title="持仓列表">
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>资产</th>
              <th>地区</th>
              <th>类型</th>
              <th>持仓金额</th>
              <th>当前价值</th>
              <th>收益</th>
              <th>收益率</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                <td>{h.location}</td>
                <td>{h.type}</td>
                <td>${h.investment.toLocaleString()}</td>
                <td>${h.currentValue.toLocaleString()}</td>
                <td className={styles.positive}>+${h.return.toLocaleString()}</td>
                <td className={styles.positive}>+{h.returnRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

