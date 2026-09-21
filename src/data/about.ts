/**
 * Sheet 4 content. Every line traces to `07-CONTENT-SOURCE-OF-TRUTH.md` —
 * §2 for the roles, §5 for education, patent and awards — and the prose is
 * lifted verbatim from design reference #3b.
 */

/** The rail beside the opening prose. */
export const aboutRail = [
  { label: 'Graduated', value: '2024 · B.Tech ECE' },
  { label: 'Professional', value: '~1 year, power electronics' },
  { label: 'Satellite', value: '2023 · student work' }
];

/**
 * Four paragraphs. The first and last carry full `--silk`; the middle two sit
 * at `--silk-dim`. That is the reference's emphasis, and it is doing real
 * work: the claim and the conclusion are foreground, the evidence between
 * them is not.
 */
export const aboutProse = [
  {
    lead: true,
    text: 'I graduated in 2024 and I have been designing power electronics professionally for about a year. That is the honest shape of it. The satellite at the top of the work page is from 2023, and it is student work — good student work, and it flew, but student work.'
  },
  {
    lead: false,
    text: 'I keep it on the site because the distance between how I designed that board and how I would design it now is the most useful thing I can show you. On the CANSAT I routed power and signal on the same plane without thinking hard about return paths, sized the regulator by what was in the parts bin, and found out on the bench what I should have found out in simulation.'
  },
  {
    lead: false,
    text: "Today I start from the loss budget, specify the magnetics before the layout, and check the vendor's numbers against my own. The change did not come from reading about it. It came from a year of having to sign off boards that go into a product that has to pass CE."
  },
  {
    lead: true,
    text: 'I would rather you see that difference than a portfolio where everything looks equally finished.'
  }
];

export type TimelineKind = 'normal' | 'notable' | 'current';

/**
 * `notable` rings the via in `--live`; `current` fills it and lifts the date
 * to `--live` as well. Only one entry is ever `current`.
 */
export const timeline: {
  date: string;
  title: string;
  note?: string;
  kind?: TimelineKind;
}[] = [
  {
    date: '2020 – 2024',
    title: 'B.Tech, Electronics and Communication Engineering',
    note: 'AKGEC'
  },
  { date: '2021 – 2024', title: 'Electronics lead, AKGEC Robotics Club' },
  {
    date: '2023',
    title: 'CANSAT INDIA finalist',
    note: 'Pico satellite, sole electronics engineer',
    kind: 'notable'
  },
  { date: '2022, 2023', title: 'ABU Asia-Pacific Robot Contest finalist, twice' },
  { date: 'July 2024', title: 'Patent filed', kind: 'notable' },
  { date: '2024 – 2025', title: 'Analogue layout programme' },
  {
    date: 'July 2025 – now',
    title: 'Hardware engineer, Gessler GmbH',
    note: 'Mains switching supplies for emergency lighting',
    kind: 'current'
  }
];

/**
 * Seven domains with a depth marker each. This is NOT the home page's list:
 * home states six domains by what is owned, without depth. Here the depth is
 * the point, and `studied` is stated as plainly as `owned` — the last row
 * exists precisely so the first three mean something.
 */
export const capabilityMatrix: {
  name: string;
  description: string;
  mobileDescription?: string;
  depth: 'owned' | 'contributed' | 'studied';
}[] = [
  {
    name: 'Offline power conversion',
    description: 'CCM boost PFC, isolated GaN flyback, bus regulation, loop compensation',
    mobileDescription: 'CCM boost PFC, isolated GaN flyback, loop compensation',
    depth: 'owned'
  },
  {
    name: 'Magnetics',
    description: 'Custom flyback transformer specification, verified independently in PI Expert',
    mobileDescription: 'Custom flyback transformer, verified in PI Expert',
    depth: 'owned'
  },
  {
    name: 'Battery charging',
    description: 'Four-switch buck-boost, NiMH termination by −ΔV and temperature',
    depth: 'owned'
  },
  {
    name: 'PCB layout, high speed',
    description: 'Six-layer impedance-controlled stackups, 90 Ω pairs, 50 Ω RF launches',
    depth: 'contributed'
  },
  {
    name: 'Compliance and safety',
    description: 'IEC 60664 creepage and clearance, harmonic limits, hi-pot, CE documentation',
    mobileDescription: 'IEC 60664 creepage and clearance, hi-pot, CE documentation',
    depth: 'contributed'
  },
  {
    name: 'Embedded bring-up',
    description: 'I²C control of flyback controllers, isolated power line communication',
    depth: 'contributed'
  },
  {
    name: 'Analogue IC layout',
    description: 'A year of formal training; no taped-out silicon of my own',
    depth: 'studied'
  }
];

export const tools = [
  'Altium Designer',
  'LTspice',
  'PI Expert',
  'Cadence Virtuoso',
  'Python',
  'Electronic load, thermal camera'
];

export const credentials = {
  education: {
    degree: 'B.Tech, Electronics and Communication Engineering',
    detail: 'AKGEC · 2020–2024'
  },
  patent: 'Filed July 2024',
  recognition: [
    'CANSAT INDIA finalist, 2023',
    'ABU Asia-Pacific Robot Contest finalist, 2022 and 2023'
  ]
};
