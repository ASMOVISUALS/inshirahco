import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  settingGroupsQuery,
  settingValueQuery,
  dynamicOptionsQuery,
  type SettingGroup,
  type SettingField,
} from "@/lib/settings-schema";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAND_TEXT_COLOURS, normaliseBrandToken } from "@/lib/brand-colours";


export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Site settings — Admin" }, { name: "robots", content: "noindex" }] }),
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const { data: groups = [], isLoading } = useQuery(settingGroupsQuery());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedKey && groups.length > 0) setSelectedKey(groups[0].settings_key);
  }, [groups, selectedKey]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (groups.length === 0) return <p className="text-muted-foreground">No settings defined yet.</p>;

  const selected = groups.find((g) => g.settings_key === selectedKey) ?? groups[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-3xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Settings</p>
        <ul className="flex flex-col gap-1">
          {groups.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => setSelectedKey(g.settings_key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${selected.settings_key === g.settings_key ? "bg-secondary" : "hover:bg-secondary"}`}
              >
                {g.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <SettingForm group={selected} />
    </div>
  );
}

function SettingForm({ group }: { group: SettingGroup }) {
  const qc = useQueryClient();
  const { data: initialValue = {}, isLoading } = useQuery(settingValueQuery(group.settings_key));
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    const seeded: Record<string, unknown> = {};
    for (const f of group.fields) {
      seeded[f.field_key] = (initialValue as Record<string, unknown>)[f.field_key] ?? f.default_value ?? defaultForType(f);
    }
    setDraft(seeded);
    setSaved(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, isLoading]);

  const dirty = useMemo(() => {
    for (const f of group.fields) {
      const a = draft[f.field_key];
      const b = (initialValue as Record<string, unknown>)[f.field_key];
      if (JSON.stringify(a) !== JSON.stringify(b)) return true;
    }
    return false;
  }, [draft, initialValue, group.fields]);

  const save = useMutation({
    mutationFn: async () => {
      for (const f of group.fields) {
        if (f.required && (draft[f.field_key] === undefined || draft[f.field_key] === "" || draft[f.field_key] === null)) {
          throw new Error(`"${f.label}" is required`);
        }
      }
      const payload = { ...draft };
      const { error: err } = await supabase
        .from("site_settings")
        .upsert({ key: group.settings_key, value: payload as never }, { onConflict: "key" });
      if (err) throw err;
    },
    onSuccess: () => {
      setError(null);
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["cms", "settings", group.settings_key] });
      qc.invalidateQueries({ queryKey: ["cms", "setting-value", group.settings_key] });
    },
    onError: (e: Error) => {
      setSaved(false);
      setError(e.message);
    },
  });

  if (isLoading) return <div className="rounded-3xl border border-border bg-card p-6">Loading…</div>;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold">{group.label}</h2>
        {group.description && <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>}
      </header>

      <div className="flex flex-col gap-6">
        {group.fields.map((f) => (
          <FieldRow
            key={f.id}
            field={f}
            value={draft[f.field_key]}
            onChange={(v) => setDraft((prev) => ({ ...prev, [f.field_key]: v }))}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm" style={{ color: "var(--heart)" }}>
          {error}
        </p>
      )}
      {saved && !dirty && !error && (
        <p className="mt-4 text-sm text-muted-foreground">Saved.</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          className="btn-primary"
          onClick={() => save.mutate()}
          disabled={save.isPending || !dirty}
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </button>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}

function defaultForType(f: SettingField): unknown {
  switch (f.field_type) {
    case "toggle": return false;
    case "number": return f.min_value ?? 0;
    case "multiselect": return [];
    default: return "";
  }
}

function FieldRow({ field, value, onChange }: { field: SettingField; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label className="text-sm font-semibold">{field.label}</Label>
          {field.help && <p className="mt-0.5 text-xs text-muted-foreground">{field.help}</p>}
        </div>
        {field.field_type === "toggle" && (
          <Switch checked={!!value} onCheckedChange={(v) => onChange(v)} aria-label={field.label} />
        )}
      </div>

      {field.field_type === "text" && (
        <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.field_type === "textarea" && (
        <Textarea rows={4} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="rounded-xl" />
      )}
      {field.field_type === "number" && (
        <Input
          type="number"
          value={value === undefined || value === null || value === "" ? "" : Number(value)}
          min={field.min_value ?? undefined}
          max={field.max_value ?? undefined}
          onChange={(e) => {
            const n = e.target.value === "" ? "" : Number(e.target.value);
            onChange(n === "" ? null : n);
          }}
        />
      )}
      {field.field_type === "color" && (
        <BrandColourField value={value} onChange={onChange} label={field.label} />
      )}

      {field.field_type === "select" && <SelectField field={field} value={value} onChange={onChange} />}
      {field.field_type === "multiselect" && <MultiselectField field={field} value={value} onChange={onChange} />}
    </div>
  );
}

function BrandColourField({ value, onChange, label }: { value: unknown; onChange: (v: unknown) => void; label: string }) {
  const selected = normaliseBrandToken(value, BRAND_TEXT_COLOURS[0].value);
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={`${label} — brand colours`}>
      {BRAND_TEXT_COLOURS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          aria-pressed={selected === c.value}
          title={c.label}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
            selected === c.value ? "border-primary bg-secondary font-semibold" : "border-border hover:bg-secondary/60"
          }`}
        >
          <span className="size-4 rounded-full border border-border" style={{ background: `var(--${c.value})` }} />
          <span style={{ color: `var(--${c.value})` }}>{c.label}</span>
        </button>
      ))}
    </div>
  );
}

function useFieldOptions(field: SettingField) {

  const dyn = useQuery(dynamicOptionsQuery(field.options_source));
  if (field.options_source === "static") return field.options ?? [];
  return dyn.data ?? [];
}

function SelectField({ field, value, onChange }: { field: SettingField; value: unknown; onChange: (v: unknown) => void }) {
  const options = useFieldOptions(field);
  return (
    <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
      <SelectTrigger>
        <SelectValue placeholder="Choose…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MultiselectField({ field, value, onChange }: { field: SettingField; value: unknown; onChange: (v: unknown) => void }) {
  const options = useFieldOptions(field);
  const arr = Array.isArray(value) ? (value as string[]) : [];
  const toggle = (v: string) => {
    onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };
  return (
    <div className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-background p-3 sm:grid-cols-2">
      {options.map((o) => {
        const checked = arr.includes(o.value);
        return (
          <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary">
            <Checkbox checked={checked} onCheckedChange={() => toggle(o.value)} />
            <span className="text-sm">{o.label}</span>
          </label>
        );
      })}
      {options.length === 0 && <p className="text-xs text-muted-foreground">No options available.</p>}
    </div>
  );
}
