import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type FilterOption = { value: string; label: string };

/** Column header that opens a checkbox filter list. */
export function ColumnFilter({
  label, options, selected, onChange,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const active = selected.length > 0;
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-sm font-semibold transition-colors hover:bg-background/60 " +
            (active ? "text-heart" : "text-foreground")
          }
        >
          {label}
          {active && <span className="text-xs font-bold">({selected.length})</span>}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="max-h-64 overflow-auto">
          {options.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No options</p>
          )}
          {options.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
            >
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggle(o.value)}
                className="accent-[var(--heart)]"
              />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </div>
        {active && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 w-full rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
