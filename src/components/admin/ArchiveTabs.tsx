import { Archive, LayoutGrid } from "lucide-react";

export type ArchiveTab = "active" | "archive";

export function ArchiveTabs({
  tab, onChange, activeCount, archiveCount,
}: {
  tab: ArchiveTab;
  onChange: (t: ArchiveTab) => void;
  activeCount: number;
  archiveCount: number;
}) {
  const cls = (t: ArchiveTab) =>
    `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      tab === t ? "border-heart bg-heart/10 text-heart" : "border-border text-muted-foreground hover:border-heart/40"
    }`;
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange("active")} className={cls("active")}>
        <LayoutGrid className="h-3.5 w-3.5" /> Active
        <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px]">{activeCount}</span>
      </button>
      <button type="button" onClick={() => onChange("archive")} className={cls("archive")}>
        <Archive className="h-3.5 w-3.5" /> Archive
        <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px]">{archiveCount}</span>
      </button>
    </div>
  );
}
