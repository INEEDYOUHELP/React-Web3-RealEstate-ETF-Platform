import Card from '../common/Card';
import styles from './MetricCard.module.css';

interface Props {
  icon?: string;
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export default function MetricCard({ icon, title, value, change, positive }: Props) {
  return (
    <Card>
      <div className={styles.wrapper}>
        {icon && (
          <div className={styles.icon}>
            <i className={`fas ${icon}`} />
          </div>
        )}
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
          {change && <p className={positive ? styles.positive : styles.negative}>{change}</p>}
        </div>
      </div>
    </Card>
  );
}

