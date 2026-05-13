import { Statistic } from 'antd';
import { AntCard } from './AntCard';

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <AntCard>
      <Statistic title={label} value={value} />
    </AntCard>
  );
}
