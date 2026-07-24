import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  head: () => ({ meta: [{ title: "Pages — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PagesAdmin,
});

interface PageRow {
  key: string;
  content: Record<string, unknown>;
}

function PagesAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pages").select("key,content").order("key");
      if (error) throw error;
      return (data ?? []) as PageRow[];
    },
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    if (!selected && data.length > 0) setSelected(data[0].key);
  }, [data, selected]);

  useEffect(() => {
    const row = data.find((r) => r.key === selected);
    if (row) {
      setDraft((row.content ?? {}) as Record<string, unknown>);
      setDirty(false);
      setStatus(null);
    }
  }, [selected, data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const { error } = await supabase.from("pages").update({ content: draft as never }).eq("key", selected);
      if (error) throw error;
    },
    onSuccess: () => {
      setStatus({ kind: "ok", msg: "Saved." });
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      qc.invalidateQueries({ queryKey: ["cms", "page"] });
    },
    onError: (e: Error) => setStatus({ kind: "err", msg: e.message }),
  });

  const entries = useMemo(() => Object.entries(draft).sort(([a], [b]) => a.localeCompare(b)), [draft]);

  function updateKey(oldKey: string, newKey: string) {
    if (!newKey || newKey === oldKey) return;
    if (Object.prototype.hasOwnProperty.call(draft, newKey)) return;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(draft)) {
      next[k === oldKey ? newKey : k] = v;
    }
    setDraft(next);
    setDirty(true);
  }

  function updateValue(key: string, value: unknown) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }

  function deleteKey(key: string) {
    const next = { ...draft };
    delete next[key];
    setDraft(next);
    setDirty(true);
  }

  function addRow(kind: "text" | "list") {
    let base = "new_field";
    let i = 1;
    let name = base;
    while (Object.prototype.hasOwnProperty.call(draft, name)) {
      name = `${base}_${i++}`;
    }
    setDraft((d) => ({ ...d, [name]: kind === "list" ? [] : "" }));
    setDirty(true);
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-3xl border border-border bg-card p-4 h-fit">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Pages</p>
        <ul className="flex flex-col gap-1">
          {data.map((r) => (
            <li key={r.key}>
              <button
                onClick={() => setSelected(r.key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${selected === r.key ? "bg-secondary" : "hover:bg-secondary"}`}
              >
                <span className="font-mono text-[11px]">{r.key}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="rounded-3xl border border-border bg-card p-6">
        {selected ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-xs text-muted-foreground">{selected}</p>
              <div className="flex items-center gap-2">
                <button className="btn-ghost text-xs" onClick={() => addRow("text")}>
                  <Plus className="h-3.5 w-3.5" /> Text field
                </button>
                <button className="btn-ghost text-xs" onClick={() => addRow("list")}>
                  <Plus className="h-3.5 w-3.5" /> List field
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-[240px] px-4 py-2 text-left font-semibold">Key</th>
                    <th className="px-4 py-2 text-left font-semibold">Value</th>
                    <th className="w-[60px] px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(([key, value]) => (
                    <FieldRow
                      key={key}
                      fieldKey={key}
                      value={value}
                      onKeyChange={(nk) => updateKey(key, nk)}
                      onValueChange={(v) => updateValue(key, v)}
                      onDelete={() => deleteKey(key)}
                    />
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No fields yet. Add one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {status && (
              <p
                className={`mt-3 text-sm font-semibold ${status.kind === "ok" ? "text-emerald-600" : "text-destructive"}`}
              >
                {status.msg}
              </p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !dirty}>
                {save.isPending ? "Saving…" : "Save changes"}
              </button>
              {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Pick a page.</p>
        )}
      </div>
    </div>
  );
}

interface FieldRowProps {
  fieldKey: string;
  value: unknown;
  onKeyChange: (k: string) => void;
  onValueChange: (v: unknown) => void;
  onDelete: () => void;
}

function FieldRow({ fieldKey, value, onKeyChange, onValueChange, onDelete }: FieldRowProps) {
  const [editingKey, setEditingKey] = useState(false);
  const [keyDraft, setKeyDraft] = useState(fieldKey);

  useEffect(() => setKeyDraft(fieldKey), [fieldKey]);

  const isArray = Array.isArray(value);
  const isObject = !isArray && typeof value === "object" && value !== null;

  return (
    <tr className="border-t border-border align-top">
      <td className="px-4 py-3">
        {editingKey ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onKeyChange(keyDraft.trim());
                  setEditingKey(false);
                }
                if (e.key === "Escape") {
                  setKeyDraft(fieldKey);
                  setEditingKey(false);
                }
              }}
              className="w-full rounded-md border border-input bg-background px-2 py-1 font-mono text-xs outline-none focus:border-heart"
            />
            <button
              onClick={() => {
                onKeyChange(keyDraft.trim());
                setEditingKey(false);
              }}
              className="rounded p-1 text-emerald-600 hover:bg-secondary"
              title="Save key"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setKeyDraft(fieldKey);
                setEditingKey(false);
              }}
              className="rounded p-1 text-muted-foreground hover:bg-secondary"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingKey(true)}
            className="group flex w-full items-center gap-1.5 text-left font-mono text-xs font-semibold"
            title="Rename key"
          >
            <span className="truncate">{fieldKey}</span>
            <Pencil className="h-3 w-3 opacity-0 transition group-hover:opacity-60" />
          </button>
        )}
      </td>
      <td className="px-4 py-3">
        {isArray ? (
          <ListValueEditor value={value as unknown[]} onChange={onValueChange} />
        ) : isObject ? (
          <ReadOnlyJson value={value} />
        ) : (
          <TextValueEditor value={value == null ? "" : String(value)} onChange={onValueChange} />
        )}
      </td>
      <td className="px-2 py-3">
        <button
          onClick={onDelete}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete field"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

function TextValueEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={Math.min(8, Math.max(1, value.split("\n").length))}
      className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-heart"
    />
  );
}

function ListValueEditor({ value, onChange }: { value: unknown[]; onChange: (v: unknown[]) => void }) {
  const items = value.map((v) => (v == null ? "" : String(v)));

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2 font-mono text-[10px] text-muted-foreground">{i + 1}.</span>
          <textarea
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            rows={Math.min(6, Math.max(1, item.split("\n").length))}
            className="flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-heart"
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="mt-1 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="btn-ghost self-start text-xs"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  );
}

function ReadOnlyJson({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-dashed border-border bg-background/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
