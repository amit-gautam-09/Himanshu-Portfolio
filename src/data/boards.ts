/**
 * The five boards, by reference designator. The projects are not a sequence,
 * so they are designators, not 01/02/03 (§11).
 *
 * `specsMobile` / `standardsMobile` name the chips the 390 artboard keeps.
 * Anything not listed is hidden below the breakpoint rather than duplicated
 * into a second markup tree. On mobile every board drops its standards
 * chips; the confidentiality chip always survives, because the dashed border
 * is the signal that the design cannot be shown (§9.1).
 */
export interface Board {
  designator: string;
  title: string;
  role: string;
  status?: { label: string; kind: 'released' | 'progress' };
  specs: string[];
  specsMobile?: string[];
  standards?: string[];
  standardsMobile?: string[];
  confidential?: boolean;
  mains?: boolean;
  unfabricated?: boolean;
  href?: string;
  /** Capability facets this board claims. Drives sheet 3's filter AND the
   *  card's own footer line, so a chip can never promise a board the list
   *  does not then show. */
  capabilities?: Capability[];
  /** Sheet 3 head row carries ONE secondary chip, not the standards row.
   *  A confidential board uses the short "Confidential" chip instead. */
  indexChip?: string;
  /** U5 only: spans both columns and carries a milestone panel (§2.2). */
  featured?: boolean;
  milestone?: { label: string; value: string };
}

/**
 * Six facets, in the order the filter draws them. Named as the work is named
 * in the capability summary, not as a taxonomy someone invented afterwards.
 */
export const capabilityFacets = [
  'Power',
  'Layout',
  'RF and impedance',
  'Embedded',
  'Manufacturing',
  'Simulation'
] as const;

export type Capability = (typeof capabilityFacets)[number];

export const boards: Board[] = [
  {
    designator: 'U1',
    title: 'Pico satellite (CANSAT)',
    role: 'Sole electronics engineer',
    status: { label: 'Flown', kind: 'released' },
    specs: ['2 round boards', 'XBee 2.4 GHz', 'Teensy 4.0'],
    specsMobile: ['XBee 2.4 GHz', 'Teensy 4.0'],
    // His own work, so it is the ONE board that may carry images — but no
    // publishable photography exists (2026-09-21: only the low-resolution
    // PDF crops). "Available" beside three "Confidential" chips reads as
    // "this one you can see", and the case study would then fail that
    // promise. "On request" is true, still distinguishes U1 from the client
    // work, and promises the page nothing — the same register as
    // "reasoning published, design not".
    //
    // If publishable photography ever arrives, restore the reference's
    // wording and build the gallery.
    standards: ['CANSAT INDIA 2023', 'Flight photography on request'],
    standardsMobile: [],
    capabilities: ['Layout', 'Embedded', 'RF and impedance'],
    indexChip: 'Photography on request',
    href: '/work/pico-satellite-cansat'
  },
  {
    designator: 'U2',
    title: 'Multi-output AC–DC power supply, 84 W',
    role: 'Owned the power stage · Gessler GmbH',
    status: { label: 'Released', kind: 'released' },
    mains: true,
    specs: ['90–264 VAC in', '380–400 VDC bus', '93 % @ 84 W'],
    specsMobile: ['380–400 VDC bus', '93 % @ 84 W'],
    standards: ['IEC 61000-3-2', 'DIN EN 61347-2-7'],
    standardsMobile: [],
    confidential: true,
    capabilities: ['Power', 'Layout', 'Manufacturing', 'Simulation'],
    href: '/work/ac-dc-power-supply-84w'
  },
  {
    designator: 'U3',
    title: 'NiMH battery charging and monitoring board',
    role: 'Charger design and layout · Gessler GmbH',
    status: { label: 'Released', kind: 'released' },
    specs: ['4-switch buck-boost', '3 cells NiMH', '0402 field'],
    specsMobile: ['4-switch buck-boost'],
    standards: ['IEC 62133'],
    standardsMobile: [],
    confidential: true,
    capabilities: ['Power', 'Layout', 'Embedded'],
    href: '/work/nimh-charging-board'
  },
  {
    designator: 'U4',
    title: 'Six-layer RK3399 carrier board',
    role: 'Layout and impedance control · Gessler GmbH',
    status: { label: 'Released', kind: 'released' },
    specs: ['PCIe Gen2 ×1', '50 Ω / 90 Ω diff', '2 × SMA RF launch'],
    specsMobile: ['50 Ω / 90 Ω diff'],
    standards: ['IPC-2221B'],
    standardsMobile: [],
    confidential: true,
    capabilities: ['Layout', 'RF and impedance', 'Manufacturing'],
    href: '/work/rk3399-carrier-board'
  }
];

/**
 * U5 is on the bench, not released. The home page's "Selected work" is the
 * four fabricated boards; the work index is all five, with U5 featured last.
 * It carries no capability footer — the reference draws none on it — but it
 * does carry the facets, so the filter counts it.
 */
export const benchBoard: Board = {
  designator: 'U5',
  title: 'USB-C PD programmable bench supply',
  role: '0–20 V, 0–5 A · schematic complete, first layout in review',
  status: { label: 'In progress · not yet fabricated', kind: 'progress' },
  specs: ['USB PD sink', 'Synchronous buck', 'Constant-current mode'],
  standards: ['Own work'],
  standardsMobile: ['Own work'],
  unfabricated: true,
  featured: true,
  capabilities: ['Power', 'Manufacturing', 'Simulation'],
  indexChip: 'Own work',
  href: '/work/usb-c-pd-bench-supply',
  milestone: {
    label: 'Next milestone',
    value: 'Fabricate and publish the measured efficiency curve'
  }
};

/** Sheet 3 shows every board. */
export const allBoards: Board[] = [...boards, benchBoard];

/** Counts are DERIVED, never authored: see README on the `Simulation` chip. */
export function capabilityCounts(list: Board[] = allBoards) {
  return capabilityFacets.map((name) => ({
    name,
    count: list.filter((b) => b.capabilities?.includes(name)).length
  }));
}

/** Six domains, named by what is owned. Depth markers appear on About. */
export const capabilities = [
  {
    name: 'Switch-mode conversion',
    description: 'CCM boost PFC, isolated GaN flyback, four-switch buck-boost',
    mobile: 'CCM boost PFC, isolated GaN flyback, four-switch buck-boost'
  },
  {
    name: 'Magnetics',
    description: 'Custom flyback transformer specified with Würth, verified independently in PI Expert',
    mobile: 'Custom flyback transformer specified with Würth, verified in PI Expert'
  },
  {
    name: 'PCB layout',
    description: 'Six-layer impedance-controlled stackups, 50 Ω single-ended, 90 Ω differential, RF launches',
    mobile: 'Six-layer impedance-controlled stackups, 50 Ω and 90 Ω differential'
  },
  {
    name: 'Standards and compliance',
    description: 'IEC 61000-3-2, DIN EN 61347-2-7, CE marking, creepage and clearance, hi-pot verification',
    mobile: 'IEC 61000-3-2, DIN EN 61347-2-7, CE marking, hi-pot verification'
  },
  {
    name: 'Embedded bring-up',
    description: 'I²C control of flyback controllers, isolated power line communication subsystem',
    mobile: 'I²C control of flyback controllers, isolated power line communication'
  },
  {
    name: 'Simulation and bench',
    description: 'LTspice, PI Expert, electronic load and thermal measurement on real hardware',
    mobile: 'LTspice, PI Expert, electronic load and thermal measurement'
  }
];

/** Lead with the number (§10). */
export const metrics = [
  { value: '84 W', caption: 'Multi-output supply, released', mobile: { value: '84 W', caption: 'Multi-output supply' } },
  { value: '93 %', caption: 'Efficiency at full load', mobile: { value: '93 %', caption: 'Efficiency at full load' } },
  { value: '380–400 VDC', caption: 'Regulated PFC bus', mobile: { value: '380–400 V', caption: 'Regulated PFC bus' } },
  { value: '6 layers', caption: 'Impedance-controlled carrier', mobile: { value: '6 layers', caption: 'Carrier board' } }
];

/**
 * Sheet 5 answers the same question at full length — #3c adds nationality and
 * the employer's obligation, which is the pair a recruiter actually has to
 * check before they can make an offer.
 */
export const workAuthorisationFull = [
  { label: 'Nationality', value: 'Indian · currently resident in India' },
  { label: 'Irish permit route', value: 'Critical Skills Employment Permit eligible' },
  { label: 'Occupation', value: 'Electronics Engineer · Critical Skills Occupations List' },
  { label: 'Labour Market Needs Test', value: 'Does not apply to this occupation' },
  {
    label: 'Employer obligation',
    value: 'Job offer of two years minimum, at or above the salary threshold'
  },
  { label: 'Notice period', value: '45 days · open to relocation' }
];

/** The question every EU recruiter asks, answered before it is asked. */
export const workAuthorisation = [
  { label: 'Irish permit route', value: 'Critical Skills Employment Permit eligible' },
  { label: 'Occupation', value: 'Electronics Engineer · Critical Skills list' },
  { label: 'Labour Market Needs Test', value: 'Does not apply' },
  { label: 'Notice period', value: '45 days · open to relocation' }
];

export const homeRail = [
  { label: 'Discipline', value: 'Power electronics' },
  { label: 'Based', value: 'India · UTC+5:30' },
  { label: 'Standards', value: 'IEC · DIN EN · CE' }
];

/** The 390 spec strip carries a fourth field the desktop rail does not. */
export const homeRailMobile = [
  ...homeRail,
  { label: 'Available', value: '45 days notice' }
];

export const buildingNow = {
  designator: 'U5',
  ownership: 'Own work, own time',
  title: 'USB-C PD programmable bench supply',
  status: 'In progress',
  body: 'A 0–20 V, 0–5 A programmable supply taking power from a USB-C PD source, with current sense on both rails and a constant-current mode. Schematic complete, first layout in review. I publish the measurements as they come off the bench, including the ones that disagree with the simulation.',
  bodyMobile: 'A 0–20 V, 0–5 A programmable supply taking power from a USB-C PD source, with current sense on both rails. Schematic complete, first layout in review.'
};

export const positioning =
  'I design mains switching supplies end to end: active boost PFC to a regulated 380–400 VDC bus, isolated GaN flyback conversion, and four-switch buck-boost charging, to IEC and DIN standards with CE marking.';
