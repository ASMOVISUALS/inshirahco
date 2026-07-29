import { useState, type ReactNode } from "react";
import { LetterMark } from "@/components/LetterMark";
import { AdminSignInDialog } from "@/components/AdminSignInDialog";

/** Shared locked template for /auth and /join when the admin closes those doors. */
export function AccessLocked({
  eyebrow,
  title,
  message,
  children,
  adminEntry = false,
}: {
  eyebrow: string;
  title: string;
  message?: string | null;
  children?: ReactNode;
  /** Show a discreet "Admin" link bottom-right that opens the admin sign-in dialog. */
  adminEntry?: boolean;
}) {
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <section className="hero-radial relative min-h-[calc(100vh-80px)]">
      <div className="container-wide py-16 md:py-24">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-4">
            <LetterMark letter="ش" tint="heart" size={56} />
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="mt-1 text-4xl md:text-5xl leading-tight">{title}</h1>
            </div>
          </div>
          {message ? (
            <p className="mt-6 text-lg text-muted-foreground whitespace-pre-line">{message}</p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>

      {adminEntry ? (
        <>
          <div className="absolute bottom-6 right-6">
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground/70 transition-colors hover:border-heart hover:text-heart"
            >
              Admin
            </button>
          </div>
          <AdminSignInDialog open={adminOpen} onOpenChange={setAdminOpen} />
        </>
      ) : null}
    </section>
  );
}
