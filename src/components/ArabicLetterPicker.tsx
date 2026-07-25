import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// 28 letters of the Arabic alphabet, in traditional order (alif → ya).
// Rendered RTL so alif appears top-right and ya bottom-left.
export const ARABIC_LETTERS = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ",
  "د", "ذ", "ر", "ز", "س", "ش", "ص",
  "ض", "ط", "ظ", "ع", "غ", "ف", "ق",
  "ك", "ل", "م", "ن", "ه", "و", "ي",
];

export function ArabicLetterPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (letter: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-input bg-background px-4 py-2.5 text-left outline-none transition-colors hover:border-heart focus:border-heart"
          aria-label="Choose Arabic letter"
        >
          <span className="font-arabic text-2xl leading-none" style={{ color: "var(--heart)" }}>
            {value || "—"}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-2xl border border-border bg-popover p-3 shadow-xl"
      >
        <div dir="rtl" className="grid grid-cols-7 gap-1">
          {ARABIC_LETTERS.map((l) => {
            const active = l === value;
            return (
              <button
                key={l}
                type="button"
                onClick={() => {
                  onChange(l);
                  setOpen(false);
                }}
                className={`grid h-10 w-10 place-items-center rounded-xl font-arabic text-xl leading-none transition-colors ${
                  active
                    ? "bg-heart text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
                style={active ? { background: "var(--heart)", color: "var(--paper)" } : undefined}
                aria-label={`Select ${l}`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const TINT_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "heart", label: "Heart", color: "var(--heart)" },
  { value: "heart-soft", label: "Heart soft", color: "var(--heart-soft)" },
  { value: "tazkiyah", label: "Tazkiyah", color: "var(--tazkiyah)" },
  { value: "gold", label: "Gold", color: "var(--gold)" },
  { value: "ink", label: "Ink", color: "var(--ink)" },
];

export function TintSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (tint: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = TINT_OPTIONS.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-input bg-background px-4 py-2.5 text-left outline-none transition-colors hover:border-heart focus:border-heart"
          aria-label="Choose tint"
        >
          <span className="flex items-center gap-2.5">
            <span
              className="h-5 w-5 rounded-full border border-border"
              style={{ background: current?.color ?? "transparent" }}
            />
            <span className="text-sm font-semibold">{current?.label ?? value ?? "—"}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] rounded-2xl border border-border bg-popover p-1 shadow-xl"
      >
        <ul className="divide-y divide-border">
          {TINT_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    active ? "bg-secondary" : "hover:bg-secondary"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ background: opt.color }}
                  />
                  <span>{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
