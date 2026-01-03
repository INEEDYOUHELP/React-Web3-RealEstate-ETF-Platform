import { Asset } from '../../../types';
import AssetCard from './AssetCard';
import styles from './AssetGrid.module.css';

interface Props {
  assets: Asset[];
  bookmarked: (id: number) => boolean;
  onBookmark: (id: number) => void;
  onDetail?: (asset: Asset) => void;
  onInvest?: (asset: Asset) => void;
}

export default function AssetGrid({ assets, bookmarked, onBookmark, onDetail, onInvest }: Props) {
  return (
    <div className={styles.grid}>
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          bookmarked={bookmarked(asset.id)}
          onBookmark={onBookmark}
          onDetail={onDetail}
          onInvest={onInvest}
        />
      ))}
    </div>
  );
}

