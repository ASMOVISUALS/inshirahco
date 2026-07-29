/** Small reusable sort control for admin list pages. */
export function SortBar<T extends string>({
  value, onChange, options, label = "Sort by",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-heart"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
