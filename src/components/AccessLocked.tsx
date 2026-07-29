import type { ReactNode } from "react";
import { LetterMark } from "@/components/LetterMark";

/** Shared locked template for /auth and /join when the admin closes those doors. */
export function AccessLocked({
  eyebrow,
  title,
  message,
  children,
}: {
  eyebrow: string;
  title: string;
  message?: string | null;
  children?: ReactNode;
}) {
  return (
    <section className="hero-radial min-h-[calc(100vh-80px)]">
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
    </section>
  );
}
