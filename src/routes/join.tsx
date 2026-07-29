import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { LetterMark } from "@/components/LetterMark";
import { supabase } from "@/integrations/supabase/client";
import { siteUrl } from "@/lib/site-url";
import { useAuthAccess } from "@/lib/auth-access";
import { AccessLocked } from "@/components/AccessLocked";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join Inshirah — Create your account" },
      { name: "description", content: "Create your Inshirah account in three quiet steps — email, password, and a little about you." },
      { property: "og:title", content: "Join Inshirah" },
      { property: "og:description", content: "Create your Inshirah account in three quiet steps." },
    ],
  }),
  component: JoinPage,
});

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email." }).max(255),
});
const passwordSchema = z
  .object({
    password: z.string().min(8, { message: "Use at least 8 characters." }).max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match." });
const profileSchema = z.object({
  name: z.string().trim().nonempty({ message: "Please share your name." }).max(80),
  dob: z
    .string()
    .nonempty({ message: "Please enter your date of birth." })
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d < new Date();
    }, { message: "Please enter a valid date." }),
  gender: z.enum(["male", "female", "prefer_not_to_say"], {
    message: "Please choose an option.",
  }),
});

type Step = 1 | 2 | 3;

function JoinPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "prefer_not_to_say" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const progress = useMemo(() => (done ? 100 : (step / 3) * 100), [step, done]);

  const goNext = async () => {
    setErrors({});
    setServerError(null);
    if (step === 1) {
      const r = emailSchema.safeParse({ email });
      if (!r.success) return setErrors({ email: r.error.issues[0].message });
      setStep(2);
    } else if (step === 2) {
      const r = passwordSchema.safeParse({ password, confirm });
      if (!r.success) {
        const e: Record<string, string> = {};
        r.error.issues.forEach((i) => { e[i.path[0] as string] = i.message; });
        return setErrors(e);
      }
      setStep(3);
    } else {
      const r = profileSchema.safeParse({ name, dob, gender });
      if (!r.success) {
        const e: Record<string, string> = {};
        r.error.issues.forEach((i) => { e[i.path[0] as string] = i.message; });
        return setErrors(e);
      }
      setSubmitting(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: siteUrl("/"),
          data: { name, dob, gender },
        },
      });
      setSubmitting(false);
      if (error) return setServerError(error.message);
      setDone(true);
    }
  };

  const goBack = () => {
    setErrors({});
    if (step === 1) navigate({ to: "/" });
    else setStep(((step - 1) as Step));
  };

  return (
    <section className="hero-radial min-h-[calc(100vh-80px)]">
      <div className="container-wide py-16 md:py-24">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-4">
            <LetterMark letter="ش" tint="heart" size={56} />
            <div>
              <p className="eyebrow">Join Inshirah</p>
              <h1 className="mt-1 text-4xl md:text-5xl leading-tight">Create your account</h1>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span>Step {done ? 3 : step} of 3</span>
              <span>{done ? "Complete" : step === 1 ? "Email" : step === 2 ? "Password" : "About you"}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--heart)" }} />
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-border bg-card p-7 md:p-10 shadow-[0_20px_50px_-30px_rgba(46,33,24,0.35)]">
            {done ? (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: "color-mix(in oklab, var(--tazkiyah) 22%, transparent)", color: "var(--tazkiyah)" }}>
                  <Check className="h-6 w-6" strokeWidth={2} />
                </div>
                <h2 className="mt-5 text-3xl">Ahlan wa sahlan, {name.split(" ")[0]}</h2>
                <p className="mt-3 text-muted-foreground">Your account is ready. A gentle welcome note is on its way to <span className="font-semibold text-foreground">{email}</span>.</p>
                <button onClick={() => navigate({ to: "/" })} className="btn-primary mt-8">Return home</button>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); goNext(); }}
                noValidate
                className="flex flex-col gap-5"
              >
                {step === 1 && (
                  <Field label="Email address" htmlFor="join-email" error={errors.email} hint="We'll send you a quiet welcome note — nothing more.">
                    <input
                      id="join-email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@thoughtful.email"
                      className="w-full rounded-2xl border border-input bg-background px-5 py-3.5 outline-none focus:border-heart"
                    />
                  </Field>
                )}

                {step === 2 && (
                  <>
                    <Field label="Password" htmlFor="join-password" error={errors.password} hint="At least 8 characters.">
                      <input
                        id="join-password"
                        type="password"
                        autoComplete="new-password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border border-input bg-background px-5 py-3.5 outline-none focus:border-heart"
                      />
                    </Field>
                    <Field label="Confirm password" htmlFor="join-confirm" error={errors.confirm}>
                      <input
                        id="join-confirm"
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="w-full rounded-2xl border border-input bg-background px-5 py-3.5 outline-none focus:border-heart"
                      />
                    </Field>
                  </>
                )}

                {step === 3 && (
                  <>
                    <Field label="Your name" htmlFor="join-name" error={errors.name}>
                      <input
                        id="join-name"
                        type="text"
                        autoComplete="name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="What shall we call you?"
                        className="w-full rounded-2xl border border-input bg-background px-5 py-3.5 outline-none focus:border-heart"
                      />
                    </Field>
                    <Field label="Date of birth" htmlFor="join-dob" error={errors.dob}>
                      <input
                        id="join-dob"
                        type="date"
                        autoComplete="bday"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full rounded-2xl border border-input bg-background px-5 py-3.5 outline-none focus:border-heart"
                      />
                    </Field>
                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold">Gender</legend>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {[
                          { v: "male", label: "Male" },
                          { v: "female", label: "Female" },
                          { v: "prefer_not_to_say", label: "Prefer not to say" },
                        ].map((o) => {
                          const active = gender === o.v;
                          return (
                            <label
                              key={o.v}
                              className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition-colors ${active ? "border-heart bg-heart-soft/40 text-heart" : "border-input bg-background hover:bg-secondary"}`}
                            >
                              <input
                                type="radio"
                                name="gender"
                                value={o.v}
                                checked={active}
                                onChange={() => setGender(o.v as typeof gender)}
                                className="sr-only"
                              />
                              {o.label}
                            </label>
                          );
                        })}
                      </div>
                      {errors.gender && <p role="alert" className="mt-2 text-sm" style={{ color: "var(--heart)" }}>{errors.gender}</p>}
                    </fieldset>
                  </>
                )}

                {serverError && (
                  <p role="alert" className="text-sm" style={{ color: "var(--heart)" }}>{serverError}</p>
                )}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-2 rounded-pill px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-secondary"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                    {step === 1 ? "Cancel" : "Back"}
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
                    {submitting ? "Creating…" : step === 3 ? "Create account" : "Continue"}
                    {step !== 3 && !submitting && <ArrowRight className="h-4 w-4" strokeWidth={1.8} />}
                  </button>
                </div>
                {step === 1 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account? <Link to="/auth" className="font-semibold underline" style={{ color: "var(--heart)" }}>Sign in</Link>
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label, htmlFor, error, hint, children,
}: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      {error && <p role="alert" className="mt-2 text-sm" style={{ color: "var(--heart)" }}>{error}</p>}
    </div>
  );
}
