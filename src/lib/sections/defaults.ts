import type { SectionContentMap } from "./schemas";

/**
 * Initial content for every section type, seeded on first boot. Copy is
 * lifted verbatim from the approved design prototypes; after seeding it is
 * owned and edited in the admin dashboard.
 */
export const defaultSectionContent: SectionContentMap = {
  hero: {
    theme: "Midnight Navy",
    eyebrow: "BUSINESS & MANAGEMENT CONSULTANT",
    firstName: "Clarence",
    lastName: "Williams",
    tagline:
      "Your business is the hero of the story. I'm the guide — with a clear plan from idea to production.",
    primaryCta: { label: "BOOK A CONSULTATION" },
    secondaryCta: { label: "EXPLORE SERVICES", href: "/services" },
    pillars: [
      { title: "Business Consulting", subtitle: "Mid-market, $5M–$250M" },
      { title: "Software Delivery Leadership", subtitle: "Idea → production" },
      { title: "Brand & Marketing", subtitle: "Authority messaging" },
    ],
    portraitMediaId: null,
    portraitCaption: "CLARENCE WILLIAMS — THE GUIDE",
  },

  services: {
    eyebrow: "SERVICES",
    headline: "Three disciplines.\nOne clear plan.",
    pillars: [
      {
        title: "Business Consulting",
        subline: "MID-MARKET COMPANIES · $5M–$250M REVENUE",
        body: "Confidential counsel for owners, presidents, and CEOs. Clarence facilitates elite executive peer advisory groups — as a Vistage Chair and through CEO Advisory Group — where leaders step away from day-to-day firefighting and make better, faster strategic decisions.",
        chips: ["EXECUTIVE PEER GROUPS", "VISTAGE CHAIR", "OPERATING STRATEGY"],
      },
      {
        title: "Software Delivery Leadership",
        subline: "FROM IDEA TO PRODUCTION",
        body: "Enterprise-proven delivery discipline, brought to the mid-market. Waterfall-to-Agile transformations, Scaled Agile (SAFe®) implementation, agility assessments, and vetted staff augmentation through Agility Engineers.",
        chips: ["AGILE TRANSFORMATION", "AGILITY ASSESSMENTS", "STAFF AUGMENTATION"],
      },
      {
        title: "Brand & Marketing",
        subline: "YOUR BRAND'S STORY, TOLD CLEARLY",
        body: "Messaging built on your brand's story — where the customer is the hero. Fractional CMO counsel, automated marketing funnels, reputation management, and paid media strategy for measurable growth.",
        chips: ["FRACTIONAL CMO", "MARKETING FUNNELS", "REPUTATION MANAGEMENT"],
      },
    ],
  },

  story: {
    eyebrow: "YOUR BRAND'S STORY",
    headline: "Every hero needs a guide —\nand a plan.",
    intro:
      "Your customers are the heroes of your brand's story. Your business is the hero of ours. The path is deliberately simple:",
    steps: [
      {
        title: "Schedule a consultation",
        body: "A confidential conversation about where your company stands — operations, delivery, and market position.",
      },
      {
        title: "Receive your roadmap",
        body: "A rigorous assessment of the current state, mapped to a collaborative, prioritized plan for success.",
      },
      {
        title: "Move from idea to production",
        body: "Execute with proven delivery discipline — continuous improvement over the futile pursuit of perfection.",
      },
    ],
  },

  about: {
    eyebrow: "ABOUT CLARENCE",
    locationLine: "ALPHARETTA, GEORGIA — THE GUIDE",
    quoteHeadline: "The name of the game is delivering value.",
    bioParagraphs: [
      "Clarence Williams, MBA, PMP®, RTE®, SPC®, is a senior technology leader, executive coach, and business strategist who helps organizations change, improve, and evolve to deliver massive market value. As a Vistage Chair and facilitator of CEO Advisory Group — an Agility Engineers, LLC brand — he brings together owners, presidents, and CEOs of non-competing companies to address their most pressing leadership challenges.",
      "His enterprise pedigree includes leading the development team behind TDD, BDD, and continuous-integration pipelines for a landmark AT&T and Apple collaboration, and engineering a waterfall-to-Agile migration that cut operational MTTR from over 90 days to 24 hours. He is the co-founder of Otis AI and author of Local Marketing for Small Business: Building a 5 Star Reputation.",
    ],
    credentials: [
      { title: "MBA, Technology Management", detail: "Georgia Institute of Technology" },
      { title: "BA, English Literature", detail: "Florida State University" },
      { title: "PMP® · RTE® · SPC®", detail: "Project Management Institute & Scaled Agile" },
      {
        title: "Community",
        detail: "Habitat for Humanity · Leukemia & Lymphoma Society triathlete",
      },
    ],
    portraitMediaId: null,
  },

  proof: {
    eyebrow: "PROVEN TRACK RECORD",
    metrics: [
      {
        value: "200%+",
        label: "Monthly growth",
        body: "Led the engineering team behind TDD, BDD, and CI pipelines supporting a landmark AT&T and Apple collaboration.",
      },
      {
        value: "90d→24h",
        label: "MTTR reduction",
        body: "Designed an enterprise waterfall-to-Agile migration that cut Mean Time to Resolve from over 90 days to 24 hours.",
      },
      {
        value: "Otis AI",
        label: "Co-founded AI ad platform",
        body: "Selected for the inaugural Intuit Prosperity Accelerator cohort, applying Design for Delight frameworks.",
      },
    ],
    testimonials: [
      {
        quote:
          "My membership opened doors worldwide and created true business transformation. Clarence establishes a unique environment of trust and vulnerability.",
        attribution: "CEO ADVISORY GROUP MEMBER",
      },
      {
        quote:
          "I highly appreciate the role-based training and coaching. They meticulously vet their practitioners — sourcing top-tier Scrum Masters is seamless.",
        attribution: "ADAM — AGILITY ENGINEERS ASSOCIATE",
      },
      {
        quote:
          "The practitioners are dedicated to high-quality delivery of value, and they do it with such passion — helping us meticulously in every Agile role.",
        attribution: "CRISTIAN & ROBERT — COMMUNITY MEMBERS",
      },
    ],
  },

  ventures: {
    eyebrow: "AFFILIATED BRANDS & VENTURES",
    brands: [
      { name: "Agility Engineers", tagline: "AGILE NETWORK & ASSESSMENTS", url: "" },
      { name: "CEO Advisory Group", tagline: "AN AGILITY ENGINEERS, LLC BRAND", url: "" },
      { name: "Vistage Chair", tagline: "EXECUTIVE PEER ADVISORY", url: "" },
      { name: "Find a Business Pro!", tagline: "LOCAL BUSINESS DIRECTORY", url: "" },
    ],
    disclaimer:
      "The names and logos of third-party products and companies shown on this website are the property of their respective owners and may also be trademarks.",
  },

  insights: {
    eyebrow: "EXECUTIVE INSIGHTS",
    headline: "Perspective for the corner office.",
    feedUrl: "https://ceo-advisory-group.com/newsletter/feed/rss",
    articleCount: 3,
    layout: "Editorial List",
  },

  bookCall: {
    eyebrow: "NEXT STEP",
    headline: "Stop leading in isolation.\nStep into your next chapter.",
    note: "All consultation requests are strictly confidential.",
    primaryCta: { label: "BOOK A CALL — CALENDLY" },
    secondaryCta: { label: "REQUEST AN AGILITY ASSESSMENT", href: "/assessment/agility" },
  },

  footer: {
    quote:
      "The name of the game is delivering value — and helping leaders deliver value to their market.",
    pathways: [
      { label: "CEO Peer Advisory — CEO Advisory Group", href: "/services" },
      { label: "Agile Staffing & Directory — Agility Engineers", href: "/services" },
      { label: "Enterprise Agile Consulting — SAFe® · PMP®", href: "/services" },
      { label: "Fractional CMO & Reputation Marketing", href: "/services" },
    ],
    contactNote: "Serving the greater North Atlanta metro",
    legalLinks: [
      { label: "TERMS OF SERVICE", href: "/terms" },
      { label: "PRIVACY POLICY", href: "/privacy" },
    ],
  },

  authorFeatured: {
    eyebrow: "THE LATEST BOOK",
    intro: "",
  },

  authorArchive: {
    eyebrow: "FROM THE ARCHIVE",
    headline: "Earlier titles.",
    blurb:
      "A collection of earlier works on marketing, reputation, and building businesses that customers trust.",
    groupPhotoMediaId: null,
    amazonUrl: "",
  },

  resumeRequest: {
    eyebrow: "CURRICULUM VITAE",
    headline: "Request my current resume.",
    credentialLines: [
      "MBA, Technology Management — Georgia Institute of Technology",
      "PMP® · RTE® · SPC® — PMI & Scaled Agile",
      "Vistage Chair · CEO Advisory Group",
    ],
    formTitle: "TELL ME ABOUT THE OPPORTUNITY",
    confirmationTitle: "Request received.",
    confirmationBody:
      "Thank you — your request has been delivered. Clarence will reply with a resume tailored to the role you described.",
  },

  prose: {
    background: "ivory",
    eyebrow: "",
    headline: "",
    paragraphs: [],
  },
};
