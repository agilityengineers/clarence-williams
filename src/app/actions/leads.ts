"use server";

import { getDb, schema } from "@/db";
import { ensureBootstrapped } from "@/db/bootstrap";
import { scoreAssessment } from "@/lib/assessments";
import { notifyAdmin } from "@/lib/notify";

export type ResumeFormState =
  | { ok: true; firstName: string }
  | {
      ok?: false;
      error: string;
      values: { name: string; email: string; company: string; roleDetails: string };
    }
  | null;

export async function submitResumeRequest(
  _prev: ResumeFormState,
  formData: FormData,
): Promise<ResumeFormState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    roleDetails: String(formData.get("roleDetails") ?? "").trim(),
  };

  if (!values.name || !values.email || !values.roleDetails) {
    return { error: "Please provide your name, email, and a note about the role.", values };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return { error: "Please enter a valid email address.", values };
  }
  if (values.name.length > 200 || values.email.length > 320 || values.company.length > 300 || values.roleDetails.length > 5000) {
    return { error: "One of the fields is too long.", values };
  }

  await ensureBootstrapped();
  const db = await getDb();
  await db.insert(schema.resumeRequests).values(values);

  await notifyAdmin(
    `Resume request from ${values.name}`,
    [
      `A new resume request was submitted on clarencewilliams.com.`,
      ``,
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      `Company: ${values.company || "—"}`,
      ``,
      `Role / opportunity:`,
      values.roleDetails,
      ``,
      `This lead is also stored in the admin dashboard under Leads.`,
    ].join("\n"),
  );

  return { ok: true, firstName: values.name.split(" ")[0] };
}

export type AssessmentSubmitResult =
  | { ok: true; score: number; tier: { label: string; headline: string; recommendation: string } }
  | { ok: false; error: string };

/**
 * Completes an assessment: validates the required lead details (name,
 * email, phone), scores the answers server-side from stored weights,
 * stores the submission as a lead, and notifies Clarence.
 */
export async function submitAssessmentAction(input: {
  assessmentId: string;
  answerOptionIds: string[];
  name: string;
  email: string;
  phone: string;
}): Promise<AssessmentSubmitResult> {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  if (!name || !email || !phone) {
    return { ok: false, error: "Please provide your name, email, and phone number." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!/^[\d\s()+.\-]{7,25}$/.test(phone)) {
    return { ok: false, error: "Please enter a valid phone number." };
  }
  if (name.length > 200 || !Array.isArray(input.answerOptionIds) || input.answerOptionIds.length > 50) {
    return { ok: false, error: "Invalid submission." };
  }

  await ensureBootstrapped();
  const db = await getDb();
  const scored = await scoreAssessment(input.assessmentId, input.answerOptionIds);
  if (!scored) return { ok: false, error: "Please answer every question, then try again." };

  const assessment = await db.query.assessments.findFirst({
    where: (a, { eq }) => eq(a.id, input.assessmentId),
  });

  await db.insert(schema.assessmentSubmissions).values({
    assessmentId: input.assessmentId,
    name,
    email,
    phone,
    answers: input.answerOptionIds,
    score: scored.score,
    tierLabel: scored.tier.label,
  });

  await notifyAdmin(
    `${assessment?.title ?? "Assessment"} lead: ${name} scored ${scored.score}`,
    [
      `A new assessment was completed on clarencewilliams.com.`,
      ``,
      `Assessment: ${assessment?.title ?? input.assessmentId}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Score: ${scored.score}/100 — ${scored.tier.label}`,
      ``,
      `This lead is also stored in the admin dashboard under Leads.`,
    ].join("\n"),
  );

  return { ok: true, score: scored.score, tier: scored.tier };
}
