export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-sm font-bold text-muted">{label}</p>
      <strong className="mt-2 block text-3xl font-black">{value}</strong>
    </div>
  );
}
