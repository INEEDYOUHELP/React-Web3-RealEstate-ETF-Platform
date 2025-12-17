import Modal from '../common/Modal';
import { Asset } from '../../../types';

interface Props {
  asset?: Asset | null;
  open: boolean;
  onClose: () => void;
}

export default function AssetDetailModal({ asset, open, onClose }: Props) {
  if (!asset) return null;
  return (
    <Modal open={open} title={asset.name} onClose={onClose}>
      <p>{asset.location}</p>
      <p style={{ marginTop: '0.5rem', color: '#64748b' }}>{asset.description}</p>
      <ul style={{ marginTop: '1rem', color: '#475569' }}>
        <li>年化收益: {asset.yield}%</li>
        <li>最小投资: ${asset.minInvestment}</li>
        <li>已售份额: {asset.soldUnits}/{asset.totalUnits}</li>
      </ul>
    </Modal>
  );
}

