// Canonical, absolute origin of the public site. Used for canonical URLs,
// sitemap, robots, Open Graph tags and JSON-LD.
// Must NOT include a trailing slash.
//
// Set NEXT_PUBLIC_SITE_URL in your env once the production domain is
// confirmed (falls back to the address already used in Footer/Contact/Terms
// copy: contact@addifyacademy.com -> https://addifyacademy.com).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://addifyacademy.com"
).replace(/\/$/, "");

export const SITE_NAME = "Addify Academy";

export const SITE_DESCRIPTION =
  "Addify Academy offers personalized 1-on-1 online tutoring for young learners and adults — Math, Science, English, IELTS and more with certified educators.";

export const ORG_ID = `${SITE_URL}/#organization`;

export const absoluteUrl = (path = "") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
