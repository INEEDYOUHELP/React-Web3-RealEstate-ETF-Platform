import Card from '../common/Card';
import styles from './AssetSelector.module.css';
import { TradingAsset } from '../../../types';

interface Props {
  assets: TradingAsset[];
  selected: TradingAsset;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (asset: TradingAsset) => void;
}

export default function AssetSelector({ assets, selected, query, onQueryChange, onSelect }: Props) {
  return (
    <Card
      title="选择资产"
      actions={
        <input
          className={styles.search}
          placeholder="搜索资产名称/代码"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      }
    >
      <div className={styles.list}>
        {assets.map((asset) => (
          <button
            key={asset.id}
            className={`${styles.item} ${selected.id === asset.id ? styles.active : ''}`}
            onClick={() => onSelect(asset)}
          >
            <div>
              <strong>{asset.name}</strong>
              <p className={styles.itemSubtext}>
                {asset.code} · {asset.region} · {asset.type}
              </p>
            </div>
            <div className={styles.price}>
              <span className={styles.priceValue}>${asset.price}</span>
              <span className={asset.change >= 0 ? styles.positive : styles.negative}>
                {asset.change >= 0 ? '+' : ''}
                {asset.change}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

