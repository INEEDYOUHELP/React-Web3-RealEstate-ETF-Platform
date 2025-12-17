import Card from '../common/Card';
import styles from './AllocationChart.module.css';

interface Allocation {
  label: string;
  value: number;
}

interface Props {
  allocations: Allocation[];
}

export default function AllocationChart({ allocations }: Props) {
  return (
    <Card title="地区配置">
      <div className={styles.list}>
        {allocations.map((a) => (
          <div key={a.label}>
            <div className={styles.row}>
              <span>{a.label}</span>
              <strong>{a.value}%</strong>
            </div>
            <div className={styles.progress}>
              <div className={styles.bar} style={{ width: `${a.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

