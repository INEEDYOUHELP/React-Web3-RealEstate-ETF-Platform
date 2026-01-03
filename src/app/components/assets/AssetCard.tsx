import Button from '../common/Button';
import Card from '../common/Card';
import { Asset } from '../../../types';
import styles from './AssetCard.module.css';

interface Props {
  asset: Asset;
  bookmarked: boolean;
  onBookmark: (id: number) => void;
  onDetail?: (asset: Asset) => void;
  onInvest?: (asset: Asset) => void;
}

export default function AssetCard({ asset, bookmarked, onBookmark, onDetail, onInvest }: Props) {
  return (
    <Card className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={asset.image} alt={asset.name} />
        <span className={styles.badge}>{asset.tags[0] ?? '资产'}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.header}>
          <div>
            <h3>{asset.name}</h3>
            <p>{asset.location}</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => onBookmark(asset.id)}
            icon={<i className={bookmarked ? 'fas fa-bookmark' : 'far fa-bookmark'} />}
          >
            {bookmarked ? '已收藏' : '收藏'}
          </Button>
        </div>
        <div className={styles.stats}>
          <div>
            <span>年化收益</span>
            <strong className="value positive">+{asset.yield}%</strong>
          </div>
          <div>
            <span>市值</span>
            <strong>${Math.round(asset.price / 1_000_000)}M</strong>
          </div>
        </div>
        <p className={styles.desc}>{asset.description}</p>
        <div className={styles.actions}>
          <Button variant="outline" onClick={() => onDetail?.(asset)}>
            查看详情
          </Button>
          <Button onClick={() => (onInvest ?? onDetail)?.(asset)}>立即投资</Button>
        </div>
      </div>
    </Card>
  );
}

