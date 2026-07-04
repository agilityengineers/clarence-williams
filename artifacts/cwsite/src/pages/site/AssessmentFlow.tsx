import { Link } from "wouter";
import { useState } from "react";
import { apiPost, ApiError } from "@/lib/api";

type PublicAssessment = {
  id: string;
  slug: string;
  title: string;
  active: boolean;
  intro: {
    eyebrow: string;
    headline: string;
    description: string;
    metaLines: string[];
    crossLinkText: string;
  };
  resultsCopy: {
    headline: string;
    leadCapture: { title: string; description: string };
  };
  questions: Array<{
    id: string;
    text: string;
    options: Array<{ id: string; label: string }>;
  }>;
};

type AssessmentSubmitResult =
  | { ok: true; score: number; tier: { label: string; headline: string; recommendation: string } }
  | { ok: false; error: string };

type Screen = "intro" | "question" | "capture" | "results";

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];

/**
 * Assessment flow per the approved design: intro → 10 question screens with
 * progress bar and back navigation → required lead capture (name, email,
 * phone) → scored results with tier + Book-a-Call CTA. Scoring runs
 * server-side; weights never reach the browser.
 */
export default function AssessmentFlow({
  assessment,
  otherHref,
  calendlyUrl,
}: {
  assessment: PublicAssessment;
  otherHref: string | null;
  calendlyUrl: string;
}) {
  const [screen, setScreen] = useState<Screen>("intro");
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  // `website` is a honeypot: rendered off-screen, never filled by humans.
  const [lead, setLead] = useState({ name: "", email: "", phone: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<AssessmentSubmitResult, { ok: true }> | null>(null);

  const total = assessment.questions.length;
  const q = assessment.questions[Math.min(idx, total - 1)];

  const pick = (optionId: string) => {
    const next = picks.slice(0, idx);
    next[idx] = optionId;
    setPicks(next);
    if (idx >= total - 1) setScreen("capture");
    else setIdx(idx + 1);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiPost<Extract<AssessmentSubmitResult, { ok: true }>>(
        "/public/assessments/submit",
        {
          assessmentId: assessment.id,
          answerOptionIds: picks,
          ...lead,
        },
      );
      setBusy(false);
      setResult(res);
      setScreen("results");
    } catch (err) {
      setBusy(false);
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setError(message);
    }
  };

  return (
    <section className="flex flex-1 items-center justify-center bg-navy px-5 py-14 font-sans text-dark-ivory sm:px-6 md:py-20 lg:px-[100px]">
      {screen === "intro" && (
        <div className="flex max-w-[1000px] flex-col items-center text-center">
          <div className="flex items-center gap-4">
            <span className="h-[2px] w-9 bg-gold" />
            <span className="text-[14px] font-semibold tracking-[0.32em] text-dark-muted">
              {assessment.intro.eyebrow}
            </span>
            <span className="h-[2px] w-9 bg-gold" />
          </div>
          <h1
            className="mt-8 font-display text-[36px] font-medium leading-[1.1] sm:text-[44px] md:text-[80px] md:leading-[1.08]"
            style={{ textWrap: "balance" }}
          >
            {assessment.intro.headline}
          </h1>
          <p className="mt-6 max-w-[780px] text-[18px] leading-[1.7] text-dark-muted md:mt-[30px] md:text-[21px]" style={{ textWrap: "pretty" }}>
            {assessment.intro.description}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[14px] tracking-[0.14em] text-dark-muted md:mt-12 md:gap-14">
            {assessment.intro.metaLines.map((line) => (
              <MetaLine key={line} line={line} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setScreen("question");
              setIdx(0);
              setPicks([]);
            }}
            className="mt-10 bg-gold px-12 py-[22px] text-[15px] font-semibold tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90 max-sm:w-full md:mt-[52px]"
          >
            BEGIN THE ASSESSMENT
          </button>
          <span className="mt-6 text-[13px] text-dark-faint">
            Confidential. Your responses are reviewed only by Clarence&rsquo;s team. See our{" "}
            <Link href="/privacy" className="border-b border-navy-rule pb-px text-dark-muted transition-colors hover:border-gold hover:text-dark-ivory">
              Privacy Policy
            </Link>
            .
          </span>
          {otherHref ? (
            <Link
              href={otherHref}
              className="mt-9 border-b border-gold pb-[3px] text-[13px] tracking-[0.14em] text-gold transition-opacity hover:opacity-80"
            >
              {assessment.intro.crossLinkText}
            </Link>
          ) : null}
        </div>
      )}

      {screen === "question" && (
        <div className="flex w-full max-w-[1080px] flex-col">
          <div className="flex items-baseline justify-between text-[13px] tracking-[0.2em] text-dark-muted">
            <span className="max-md:hidden">{assessment.intro.eyebrow}</span>
            <span>
              QUESTION <span className="font-bold text-gold">{idx + 1}</span> OF {total}
            </span>
          </div>
          <div className="mt-[18px] h-[2px] bg-navy-rule">
            <div
              className="h-[2px] bg-gold transition-all duration-300"
              style={{ width: `${(idx / total) * 100}%` }}
            />
          </div>
          <h2
            className="mt-8 font-display text-[28px] font-medium leading-[1.2] sm:text-[32px] md:mt-16 md:text-[52px]"
            style={{ textWrap: "balance" }}
          >
            {q.text}
          </h2>
          <div className="mt-7 flex flex-col gap-3.5 md:mt-12 md:gap-4">
            {q.options.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => pick(opt.id)}
                className="flex items-center gap-4 border border-navy-rule bg-navy-panel px-5 py-5 text-left transition-colors hover:border-gold hover:bg-navy-panel-hover md:gap-6 md:px-8 md:py-[26px]"
              >
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-gold text-[14px] font-semibold text-gold">
                  {OPTION_KEYS[i]}
                </span>
                <span className="text-[16px] leading-[1.5] md:text-[19px]">{opt.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => (idx === 0 ? setScreen("intro") : setIdx(idx - 1))}
            className="mt-7 self-start py-3 text-[13px] tracking-[0.18em] text-dark-faint transition-colors hover:text-dark-ivory md:mt-10"
          >
            ← BACK
          </button>
        </div>
      )}

      {screen === "capture" && (
        <div className="flex w-full max-w-[680px] flex-col border border-navy-rule bg-navy-panel p-6 sm:p-8 md:p-14">
          <span className="text-[13px] tracking-[0.2em] text-dark-muted">{assessment.intro.eyebrow}</span>
          <h2 className="mt-5 font-display text-[32px] font-medium leading-[1.15] md:text-[40px]">
            {assessment.resultsCopy.leadCapture.title}
          </h2>
          <p className="mt-4 text-[16px] leading-[1.7] text-dark-muted" style={{ textWrap: "pretty" }}>
            {assessment.resultsCopy.leadCapture.description}
          </p>
          <div className="mt-8 flex flex-col gap-6">
            <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
              <label>
                Website
                <input
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={lead.website}
                  onChange={(e) => setLead({ ...lead, website: e.target.value })}
                />
              </label>
            </div>
            <CaptureField label="FULL NAME *" type="text" value={lead.name} onChange={(v) => setLead({ ...lead, name: v })} placeholder="Jane Smith" />
            <CaptureField label="EMAIL *" type="email" value={lead.email} onChange={(v) => setLead({ ...lead, email: v })} placeholder="jane@company.com" />
            <CaptureField label="PHONE *" type="tel" value={lead.phone} onChange={(v) => setLead({ ...lead, phone: v })} placeholder="(555) 123-4567" />
            {error ? <span className="text-[14px] text-form-error">{error}</span> : null}
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="mt-1 bg-gold py-5 text-[15px] font-semibold tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "SCORING…" : "SEE MY RESULTS"}
            </button>
            <button
              type="button"
              onClick={() => {
                setScreen("question");
                setIdx(total - 1);
              }}
              className="self-start py-3 text-[13px] tracking-[0.18em] text-dark-faint transition-colors hover:text-dark-ivory"
            >
              ← BACK TO QUESTIONS
            </button>
          </div>
        </div>
      )}

      {screen === "results" && result && (
        <div className="flex max-w-[1000px] flex-col items-center text-center">
          <span className="text-[14px] font-semibold tracking-[0.32em] text-dark-muted">
            {assessment.resultsCopy.headline}
          </span>
          <div className="relative mt-9 flex h-[230px] w-[230px] flex-col items-center justify-center rounded-full border border-navy-rule md:mt-11 md:h-[300px] md:w-[300px]">
            <div aria-hidden className="absolute inset-[14px] rounded-full border-2 border-gold" />
            <span className="font-display text-[80px] leading-none text-gold md:text-[110px]">{result.score}</span>
            <span className="mt-2 text-[13px] tracking-[0.24em] text-dark-muted">OUT OF 100</span>
          </div>
          <h2
            className="mt-9 font-display text-[32px] font-medium leading-[1.15] sm:text-[38px] md:mt-11 md:text-[62px]"
            style={{ textWrap: "balance" }}
          >
            {result.tier.headline}
          </h2>
          <p className="mt-5 max-w-[760px] text-[18px] leading-[1.7] text-dark-muted md:mt-6 md:text-[20px]" style={{ textWrap: "pretty" }}>
            {result.tier.recommendation}
          </p>
          <div className="mt-10 flex w-full flex-wrap justify-center gap-4 md:mt-12 md:w-auto md:gap-6">
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold px-11 py-[22px] text-center text-[15px] font-semibold tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90 max-sm:w-full"
            >
              BOOK A CALL WITH CLARENCE
            </a>
            <button
              type="button"
              onClick={() => {
                setScreen("intro");
                setIdx(0);
                setPicks([]);
                setResult(null);
              }}
              className="border border-dark-muted px-11 py-[22px] text-center text-[15px] font-semibold tracking-[0.14em] text-dark-ivory transition-colors hover:border-gold max-sm:w-full"
            >
              RETAKE ASSESSMENT
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** "10 QUESTIONS" → gold first token, per design. */
function MetaLine({ line }: { line: string }) {
  const [first, ...rest] = line.split(" ");
  return (
    <span>
      <span className="font-bold text-gold">{first}</span> {rest.join(" ")}
    </span>
  );
}

function CaptureField({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-2.5">
      <span className="text-[12px] font-semibold tracking-[0.2em] text-dark-muted">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-navy-rule bg-navy px-[18px] py-4 font-sans text-[17px] text-dark-ivory outline-none transition-colors placeholder:text-dark-faint focus:border-gold"
      />
    </label>
  );
}

export type { PublicAssessment };
