import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiPost } from "@/lib/api";

export default function LeadStatusButton({
  kind,
  id,
  status,
}: {
  kind: "resume" | "assessment";
  id: string;
  status: string;
}) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const isNew = status === "new";
  const next = kind === "resume" ? (isNew ? "replied" : "new") : isNew ? "handled" : "new";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const path =
            kind === "resume"
              ? `/admin/leads/resume/${id}/status`
              : `/admin/leads/submission/${id}/status`;
          await apiPost(path, { status: next });
          await queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) navigate("/login");
        } finally {
          setPending(false);
        }
      }}
      className={`px-2.5 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-80 disabled:opacity-40 ${
        isNew ? "bg-[#F1E5C9] text-[#7A5A1E]" : "bg-green-100 text-green-900"
      }`}
      title="Click to toggle"
    >
      {status}
    </button>
  );
}
