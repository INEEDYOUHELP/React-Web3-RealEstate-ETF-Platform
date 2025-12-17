import Button from '../common/Button';
import Card from '../common/Card';
import styles from './AssetFilters.module.css';

interface Props {
  region: string;
  type: string;
  sort: 'yield' | 'price';
  onRegionChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSortChange: (value: 'yield' | 'price') => void;
}

const regions = ['全部地区', '北美', '欧洲', '亚太', '中东'];
const types = ['全部类型', '商业地产', '住宅地产', '零售地产'];

export default function AssetFilters({ region, type, sort, onRegionChange, onTypeChange, onSortChange }: Props) {
  return (
    <div className={styles.grid}>
      <Card>
        <p className={styles.label}>地区</p>
        <div className={styles.chips}>
          {regions.map((r) => (
            <Button
              key={r}
              variant={region === r ? 'primary' : 'outline'}
              onClick={() => onRegionChange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <p className={styles.label}>类型</p>
        <div className={styles.chips}>
          {types.map((r) => (
            <Button
              key={r}
              variant={type === r ? 'primary' : 'outline'}
              onClick={() => onTypeChange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <p className={styles.label}>排序</p>
        <div className={styles.sort}>
          <Button
            variant={sort === 'yield' ? 'primary' : 'outline'}
            onClick={() => onSortChange('yield')}
          >
            按收益率
          </Button>
          <Button
            variant={sort === 'price' ? 'primary' : 'outline'}
            onClick={() => onSortChange('price')}
          >
            按市值
          </Button>
        </div>
      </Card>
    </div>
  );
}

