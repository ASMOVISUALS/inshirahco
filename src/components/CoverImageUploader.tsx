import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "article-media";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function CoverImageUploader({
  value,
  onChange,
  slug,
}: {
  value: string;
  onChange: (url: string) => void;
  slug?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `covers/${slug || "article"}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
      if (signErr || !data?.signedUrl) throw signErr ?? new Error("Could not create link");
      onChange(data.signedUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-xs font-semibold normal-case hover:bg-secondary disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload image"}
        </button>
        {value.trim() ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-xs font-semibold normal-case hover:bg-secondary"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      {error ? <p className="text-[11px] normal-case text-destructive">{error}</p> : null}
    </div>
  );
}
