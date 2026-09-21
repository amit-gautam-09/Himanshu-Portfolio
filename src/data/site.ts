import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The CV label states the file type and size — "Buttons say what happens"
 * (§10). The README flags the designed "148 KB" as a placeholder that must
 * be replaced with the real size, so it is measured from the actual asset at
 * build time and can never drift out of date.
 */
const CV_PATH = 'Himanshu_Gautam_CV.pdf';

function cvLabel(): string {
  try {
    const bytes = statSync(fileURLToPath(new URL(`../../public/${CV_PATH}`, import.meta.url))).size;
    return `Download CV (PDF, ${Math.round(bytes / 1024)} KB)`;
  } catch {
    return 'Download CV (PDF)';
  }
}

/** `updated` is the PDF's own last-revised date, confirmed 2026-09-21. */
export const cv = { href: `/${CV_PATH}`, label: cvLabel(), updated: '2026-09-21' };

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Work', href: '/work' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' }
];

export const identity = {
  name: 'Himanshu Gautam',
  discipline: 'Hardware engineer. Power electronics and PCB design.',
  location:
    'Designing mains switching supplies at Gessler GmbH from India. Targeting hardware roles in Ireland and the EU.',
  email: 'mailto:contact@hixome.com',
  emailLabel: 'contact@hixome.com'
  // No LinkedIn. Asked for and declined 2026-09-21 — the design reference
  // draws one in the title block, and it is deliberately absent.
};

/**
 * Sheet 5. His words, punctuated; the locations come from `identity` so the
 * site states one target market, not two.
 *
 * Approved 2026-09-21, drafted from his own line: "I design complete PCB
 * from scratch schematic to complete board, Domain: Hardware Design
 * Enginnerin".
 */
export const contact = {
  lookingFor:
    'I design complete PCBs from scratch: schematic through to finished board.',
  domain: 'Hardware design engineering',
  locations: 'Ireland and the EU',
  /* #3c's own paragraph, which answers "what am I looking for" where his line
     answers "what do I do". Both are kept, in that order. */
  wants:
    'A hardware role in Ireland or the EU where I own a power stage end to end: topology, magnetics, layout, compliance and bench verification. I work well where the standards are non-negotiable and the measurements settle the argument. I am not looking to move away from hardware.',
  lede: 'Direct is fine. I reply to everything that is about hardware.',
  timezone: 'UTC+5:30 · calls after 14:00 CET suit best',
  // No response-time commitment is published — asked for and declined.
  channel: { label: 'contact@hixome.com', href: 'mailto:contact@hixome.com' },

  /**
   * Decided 2026-09-21: WhatsApp click-to-chat plus the email address, and
   * NO form. That drops the form #3c draws in its rest and error states —
   * a deliberate deviation, not an omission — and removes the need for any
   * backend, so the site stays `output: 'static'`.
   *
   * `href` uses wa.me, which needs the number in full international form
   * with no +, spaces or dashes. `label` is the readable one.
   */
  whatsapp: {
    label: '+91 76781 63826',
    href: 'https://wa.me/917678163826'
  }
};

export const titleBlock = {
  title: 'Himanshu Gautam — Hardware engineer',
  subtitle: 'Power electronics · PCB design · IEC / DIN / CE',
  rev: '1.0',
  date: '2026-09-19',
  scale: '1 : 1',
  drawnBy: 'H. Gautam'
};
