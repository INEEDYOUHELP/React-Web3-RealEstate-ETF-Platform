import Card from '../common/Card';
import styles from './PortfolioSummary.module.css';

interface Summary {
  totalInvestment: number;
  totalValue: number;
  totalReturn: number;
  returnRate: number;
}

interface Props {
  summary: Summary;
}

export default function PortfolioSummary({ summary }: Props) {
  const cards = [
    { label: '总投资金额', value: `$${summary.totalInvestment.toLocaleString()}` },
    { label: '总资产价值', value: `$${summary.totalValue.toLocaleString()}` },
    { label: '总收益', value: `+$${summary.totalReturn.toLocaleString()}`, accent: true },
    { label: '收益率', value: `+${summary.returnRate}%`, accent: true },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <Card key={card.label}>
          <p className={styles.label}>{card.label}</p>
          <p className={card.accent ? styles.accent : styles.value}>{card.value}</p>
        </Card>
      ))}
    </div>
  );
}

