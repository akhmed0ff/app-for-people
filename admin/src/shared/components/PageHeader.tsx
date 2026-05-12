export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-black tracking-normal sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm font-medium text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
