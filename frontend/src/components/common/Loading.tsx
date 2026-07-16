export default function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-primary" />
      {label}
    </div>
  );
}
