import MetricCard from './MetricCard';
import styles from './AnalyticsChart.module.css';

interface Metric {
  id: number;
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

interface Props {
  items: Metric[];
}

export default function AnalyticsChart({ items }: Props) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <MetricCard
          key={item.id}
          icon={item.icon}
          title={item.title}
          value={item.value}
          change={item.change}
          positive={item.positive}
        />
      ))}
    </div>
  );
}

