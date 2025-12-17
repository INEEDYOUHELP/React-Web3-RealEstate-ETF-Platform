import Card from '../common/Card';
import styles from './DataTable.module.css';

interface Row {
  label: string;
  value: number;
}

interface Props {
  rows: Row[];
  title: string;
}

export default function DataTable({ rows, title }: Props) {
  return (
    <Card title={title}>
      <div className={styles.table}>
        {rows.map((row) => (
          <div key={row.label}>
            <div className={styles.row}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
            <div className={styles.progress}>
              <div className={styles.bar} style={{ width: `${row.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

