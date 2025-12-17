import Card from '../common/Card';
import Button from '../common/Button';
import styles from './PortfolioChart.module.css';

interface Props {
  period: '7d' | '30d' | '90d' | '1y';
  onPeriodChange: (p: '7d' | '30d' | '90d' | '1y') => void;
}

const labels: Record<Props['period'], string> = {
  '7d': '7天',
  '30d': '30天',
  '90d': '90天',
  '1y': '1年',
};

export default function PortfolioChart({ period, onPeriodChange }: Props) {
  return (
    <Card
      title="收益趋势"
      actions={
        <div className={styles.tabs}>
          {(Object.keys(labels) as Props['period'][]).map((p) => (
            <Button key={p} variant={period === p ? 'primary' : 'outline'} onClick={() => onPeriodChange(p)}>
              {labels[p]}
            </Button>
          ))}
        </div>
      }
    >
      <div className={styles.placeholder}>图表占位，可接入实际折线图</div>
    </Card>
  );
}

