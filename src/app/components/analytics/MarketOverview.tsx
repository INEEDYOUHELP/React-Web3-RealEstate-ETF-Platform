import MetricCard from './MetricCard';
import styles from './MarketOverview.module.css';

interface Metric {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

interface Props {
  metrics: Metric[];
}

export default function MarketOverview({ metrics }: Props) {
  return (
    <div className={styles.grid}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          title={metric.label}
          value={metric.value}
          change={metric.change}
          positive={metric.positive}
        />
      ))}
    </div>
  );
}

