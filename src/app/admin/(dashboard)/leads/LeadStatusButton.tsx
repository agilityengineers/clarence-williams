"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setResumeRequestStatusAction, setSubmissionStatusAction } from "../actions";

export default function LeadStatusButton({
  kind,
  id,
  status,
}: {
  kind: "resume" | "assessment";
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isNew = status === "new";
  const next = kind === "resume" ? (isNew ? "replied" : "new") : isNew ? "handled" : "new";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (kind === "resume") await setResumeRequestStatusAction(id, next as "new" | "replied");
          else await setSubmissionStatusAction(id, next as "new" | "handled");
          router.refresh();
        })
      }
      className={`px-2.5 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-80 disabled:opacity-40 ${
        isNew ? "bg-[#F1E5C9] text-[#7A5A1E]" : "bg-green-100 text-green-900"
      }`}
      title="Click to toggle"
    >
      {status}
    </button>
  );
}
