import styles from './AssetSearch.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function AssetSearch({ value, onChange }: Props) {
  return (
    <div className={styles.search}>
      <i className="fas fa-search" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索资产名称/地区/类型"
      />
    </div>
  );
}

