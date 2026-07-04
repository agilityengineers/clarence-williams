/**
 * Server-side semantic HTML rendering of public page/assessment content, for
 * injection into the initial HTML response (see client-serving.ts). This is
 * not a pixel-perfect SSR of the React components — it is a lightweight,
 * content-faithful "poor man's prerender": real headings, copy, and links
 * so non-JS crawlers (AI bots, some social scrapers) see actual page
 * content instead of an empty app shell.
 *
 * The client mounts with `createRoot(...).render(...)` (not `hydrateRoot`),
 * so once the bundle runs it fully replaces this markup with the real,
 * interactive React tree — there is no hydration mismatch risk.
 */
import type { ResolvedPage, ResolvedSection } from "./pages";
import type { PublicAssessment } from "./assessments";
import type { PublicLayout } from "./layout";
import type { SectionContentMap } from "./sections/schemas";

const escapeText = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttr = (s: string): string => escapeText(s).replace(/"/g, "&quot;");

const p = (text: string): string => (text.trim() ? `<p>${escapeText(text)}</p>` : "");

const link = (href: string, label: string): string =>
  `<a href="${escapeAttr(href)}">${escapeText(label)}</a>`;

function list(items: string[]): string {
  if (items.length === 0) return "";
  return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

/** Renders one section's real copy as semantic HTML, keyed by section type. */
function renderSection(section: ResolvedSection, calendlyUrl: string): string {
  const c = section.content;
  switch (section.type) {
    case "hero": {
      const v = c as SectionContentMap["hero"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        <h1>${escapeText(v.firstName)} ${escapeText(v.lastName)}</h1>
        ${p(v.tagline)}
        <p>${link(calendlyUrl, v.primaryCta.label)} ${link(v.secondaryCta.href, v.secondaryCta.label)}</p>
        ${list(v.pillars.map((pl) => `<strong>${escapeText(pl.title)}</strong> — ${escapeText(pl.subtitle)}`))}
      </section>`;
    }
    case "services": {
      const v = c as SectionContentMap["services"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        <h2>${escapeText(v.headline)}</h2>
        ${v.pillars
          .map(
            (pl) =>
              `<article><h3>${escapeText(pl.title)}</h3><p>${escapeText(pl.subline)}</p>${p(pl.body)}${list(
                pl.chips.map(escapeText),
              )}</article>`,
          )
          .join("")}
      </section>`;
    }
    case "story": {
      const v = c as SectionContentMap["story"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        <h2>${escapeText(v.headline)}</h2>
        ${p(v.intro)}
        <ol>${v.steps
          .map((s) => `<li><strong>${escapeText(s.title)}</strong> — ${escapeText(s.body)}</li>`)
          .join("")}</ol>
      </section>`;
    }
    case "about": {
      const v = c as SectionContentMap["about"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        <h2>${escapeText(v.quoteHeadline)}</h2>
        ${v.bioParagraphs.map(p).join("")}
        ${list(v.credentials.map((cr) => `<strong>${escapeText(cr.title)}</strong> — ${escapeText(cr.detail)}`))}
      </section>`;
    }
    case "proof": {
      const v = c as SectionContentMap["proof"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        ${list(v.metrics.map((m) => `<strong>${escapeText(m.value)}</strong> ${escapeText(m.label)} — ${escapeText(m.body)}`))}
        ${v.testimonials
          .map((t) => `<blockquote>${escapeText(t.quote)}<footer>${escapeText(t.attribution)}</footer></blockquote>`)
          .join("")}
      </section>`;
    }
    case "ventures": {
      const v = c as SectionContentMap["ventures"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        ${list(v.brands.map((b) => `${link(b.url, b.name)} — ${escapeText(b.tagline)}`))}
        ${p(v.disclaimer)}
      </section>`;
    }
    case "insights": {
      const v = c as SectionContentMap["insights"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        <h2>${escapeText(v.headline)}</h2>
      </section>`;
    }
    case "bookCall": {
      const v = c as SectionContentMap["bookCall"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        <h2>${escapeText(v.headline)}</h2>
        ${p(v.note)}
        <p>${link(calendlyUrl, v.primaryCta.label)} ${link(v.secondaryCta.href, v.secondaryCta.label)}</p>
      </section>`;
    }
    case "authorFeatured": {
      const v = c as SectionContentMap["authorFeatured"];
      return `<section><p>${escapeText(v.eyebrow)}</p>${p(v.intro)}</section>`;
    }
    case "authorArchive": {
      const v = c as SectionContentMap["authorArchive"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        <h2>${escapeText(v.headline)}</h2>
        ${p(v.blurb)}
      </section>`;
    }
    case "resumeRequest": {
      const v = c as SectionContentMap["resumeRequest"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        <h2>${escapeText(v.headline)}</h2>
        ${p(v.intro)}
        ${list(v.credentialLines.map(escapeText))}
        ${p(v.confidentialNote)}
      </section>`;
    }
    case "prose": {
      const v = c as SectionContentMap["prose"];
      return `<section>
        <p>${escapeText(v.eyebrow)}</p>
        <h2>${escapeText(v.headline)}</h2>
        ${v.paragraphs.map(p).join("")}
      </section>`;
    }
    default:
      return "";
  }
}

function renderNav(layout: PublicLayout): string {
  const links = layout.navPages
    .map((n) => link(n.slug === "home" ? "/" : `/${n.slug}`, n.navLabel ?? n.title))
    .join(" ");
  return `<header><nav>${links}</nav></header>`;
}

function renderFooter(layout: PublicLayout): string {
  if (!layout.footer) return "";
  const { footer, settings } = layout;
  return `<footer>
    <blockquote>${escapeText(footer.quote)}</blockquote>
    ${list(footer.pathways.map((pl) => link(pl.href, pl.label)))}
    <p>${escapeText(settings.contact.email)} ${escapeText(settings.contact.phone)} ${escapeText(settings.contact.address)}</p>
    <p>${escapeText(footer.contactNote)}</p>
    ${list(footer.legalLinks.map((l) => link(l.href, l.label)))}
  </footer>`;
}

/** Full server-rendered body markup for a public CMS page (`/`, `/:slug`). */
export function renderPageBodyHtml(page: ResolvedPage, layout: PublicLayout): string {
  const calendlyUrl = layout.settings.calendlyUrl;
  const main = page.sections
    .filter((s) => s.enabled)
    .map((s) => renderSection(s, calendlyUrl))
    .join("");
  return `${renderNav(layout)}<main><h1 class="sr-only">${escapeText(page.title)}</h1>${main}</main>${renderFooter(layout)}`;
}

/** Full server-rendered body markup for a public assessment (`/assessment/:slug`). */
export function renderAssessmentBodyHtml(
  assessment: PublicAssessment,
  layout: PublicLayout,
  otherHref: string | null,
): string {
  const { intro, questions } = assessment;
  const questionsHtml = questions
    .map(
      (q, i) =>
        `<li><p>${escapeText(`${i + 1}. ${q.text}`)}</p>${list(q.options.map((o) => escapeText(o.label)))}</li>`,
    )
    .join("");
  const crossLink = otherHref ? `<p>${link(otherHref, intro.crossLinkText)}</p>` : "";
  return `${renderNav(layout)}<main>
    <h1>${escapeText(intro.headline)}</h1>
    <p>${escapeText(intro.eyebrow)}</p>
    ${p(intro.description)}
    ${list(intro.metaLines.map(escapeText))}
    <ol>${questionsHtml}</ol>
    ${crossLink}
  </main>${renderFooter(layout)}`;
}
