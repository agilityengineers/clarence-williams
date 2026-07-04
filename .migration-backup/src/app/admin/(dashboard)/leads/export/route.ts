import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSession } from "@/lib/auth";

/** CSV export of leads (admin only). ?type=resume | assessments */
export async function GET(req: Request) {
  if (!(await getSession())) return new Response("Not authorized", { status: 401 });
  const type = new URL(req.url).searchParams.get("type");
  const db = await getDb();

  let filename: string;
  let rows: string[][];

  if (type === "resume") {
    const data = await db.select().from(schema.resumeRequests).orderBy(desc(schema.resumeRequests.createdAt));
    filename = "resume-requests.csv";
    rows = [
      ["Date", "Name", "Email", "Company", "Role details", "Status"],
      ...data.map((r) => [r.createdAt.toISOString(), r.name, r.email, r.company, r.roleDetails, r.status]),
    ];
  } else {
    const [data, assessments] = await Promise.all([
      db.select().from(schema.assessmentSubmissions).orderBy(desc(schema.assessmentSubmissions.createdAt)),
      db.select().from(schema.assessments),
    ]);
    const names = new Map(assessments.map((a) => [a.id, a.title]));
    filename = "assessment-leads.csv";
    rows = [
      ["Date", "Assessment", "Name", "Email", "Phone", "Score", "Tier", "Status"],
      ...data.map((s) => [
        s.createdAt.toISOString(),
        names.get(s.assessmentId) ?? s.assessmentId,
        s.name,
        s.email,
        s.phone,
        String(s.score),
        s.tierLabel,
        s.status,
      ]),
    ];
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
