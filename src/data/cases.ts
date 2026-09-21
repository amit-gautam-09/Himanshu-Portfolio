/**
 * The five case studies. Every fact traces to `07-CONTENT-SOURCE-OF-TRUTH.md`
 * §3; the U2 page is the one the design reference draws (#2a) and the others
 * follow the same template.
 *
 * LEGAL CONSTRAINT, not an aesthetic one: U2, U3 and U4 are Gessler GmbH
 * intellectual property. No schematics, no layouts, no photographs, ever.
 * What each page carries is architecture, constraints, decisions and measured
 * results — and `notShown` says so on the page rather than leaving the reader
 * to notice.
 */

export type DecisionKind = 'decision' | 'problem' | 'verification';

export interface Decision {
  kind: DecisionKind;
  /** e.g. "U2 · schematic" */
  stage: string;
  title: string;
  found: string;
  did: string;
  result?: string;
}

export interface CaseStudy {
  designator: string;
  slug: string;
  title: string;
  lede: string;
  chips: string[];
  status: { label: string; kind: 'released' | 'progress' };
  confidential?: boolean;
  /** Scene name for the framed 3D still. `null` renders the frame empty. */
  scene: string | null;
  sceneCaption: string;
  rail: { label: string; value: string }[];
  whatItIs: string[];
  signalChain?: {
    note: string;
    primary: { title: string; detail: string; hot?: boolean }[];
    secondary: { title: string; detail: string; row: number }[];
    transformers: { label: string; row: number }[];
    barrier: string;
    tap?: { label: string; row: number };
  };
  decisions: Decision[];
  verification?: {
    title: string;
    prose: string[];
    quote?: string;
    checked?: string[];
    tool?: string;
  };
  notShown?: string[];
  retrospective?: { heading: string; items: string[] }[];
}

export const cases: CaseStudy[] = [
  /* ────────────────────────── U1 ────────────────────────── */
  {
    designator: 'U1',
    slug: 'pico-satellite-cansat',
    title: 'Pico satellite (CANSAT)',
    lede: 'A two-board pico satellite flown to the national finals of CANSAT INDIA. Sole electronics engineer, blank schematic to recovered hardware.',
    chips: ['CANSAT INDIA', '2023', '9 min read'],
    status: { label: 'Flown', kind: 'released' },
    scene: 's2-pico-satellite',
    sceneCaption: 'His own work. Real geometry.',
    rail: [
      { label: 'Role', value: 'Only electronics hardware engineer' },
      { label: 'Ownership', value: 'Sole · schematic to flight' },
      { label: 'Scope', value: 'Power board · sensor and telemetry motherboard' },
      { label: 'Constraints', value: 'Fixed cylindrical envelope · mass and volume budget · ascent vibration · single deployment' },
      { label: 'Outcome', value: 'Launched and recovered · live telemetry throughout descent' },
      { label: 'Fabrication', value: 'JLCPCB · his own manufacturing outputs' }
    ],
    whatItIs: [
      'CANSAT INDIA is run by ISRO and the Astronautical Society of India. The team reached the national finals. Two custom boards sit in a stacked assembly inside a fixed cylindrical container: a power board, and a sensor and telemetry motherboard.',
      'The power board takes a 2S Li-ion 21700 pack into two buck converters generating 5 V and 3.3 V rails, plus an ESC channel for the descent actuator and a servo channel, with a ribbon interconnect to the upper board.',
      'The motherboard is a Teensy 4.1 host with a BNO055 IMU, a BMP390 barometric altimeter and a NEO-8M GNSS on I²C, an ESP32-CAM for imaging, and an XBee S2C Pro with an external antenna for the telemetry downlink. Coin cell backup, state LEDs, and a buzzer driven from a 555 astable for post-landing recovery.',
      'Both boards use custom non-rectangular outlines to fit the container, on threaded nylon standoffs, inside a 3D-printed frame sealed with PTFE film.'
    ],
    decisions: [
      {
        kind: 'problem',
        stage: 'U1 · integration',
        title: 'Sensor crosstalk inside a sealed container',
        found: 'During integration testing the IMU and barometer readings were corrupted once the boards were mounted inside the sealed container. Outside the enclosure they were clean.',
        did: 'Treated it as a coupling problem rather than a firmware one — the enclosure was vibration-heavy and the sensor traces ran close to the switching and motor wiring. Added board-level shielding over the affected region and rerouted the sensitive traces away from the noisy nets.',
        result: 'All sensors read within spec, and held through the flight.'
      },
      {
        kind: 'decision',
        stage: 'U1 · layout',
        title: 'A four-layer board built, and then rejected',
        found: 'Produced a four-layer version of the motherboard with a stitched via fence around the perimeter, intending to improve ground return and reduce the coupling.',
        did: 'Did not use it.',
        result: 'It did not fit the available area once the mechanical envelope was fixed, and it did not resolve the EMI behaviour of the sensor modules themselves, which were the actual source. The two-layer board with local shielding was the better answer for the deadline.'
      }
    ],
    retrospective: [
      {
        heading: 'Power stage',
        items: [
          'Used an older non-synchronous buck regulator with a large through-hole toroidal inductor. I would use a modern synchronous converter now: better efficiency, much less heat in a sealed enclosure, a fraction of the board area. On a battery powered payload, efficiency is endurance.',
          'The switching loops are larger than they need to be. I now place the input capacitor, high-side switch and inductor to keep the hot loop tight before anything else is routed.',
          "There is no deliberate input filter. I would design one: common mode choke, differential mode capacitance sized against the switching frequency, and a TVS clamp chosen against the regulator's absolute maximum rating. Exactly the thing that would have reduced the coupling I later had to shield against."
        ]
      },
      {
        heading: 'Layout and stackup',
        items: [
          'Two layers with routed ground was the wrong starting point for a board carrying an IMU, a GNSS receiver and a radio next to switching converters. A four-layer stackup with a continuous ground plane should have been the default rather than the fallback.',
          'I would keep the noisy power domain physically separated from the sensor domain, with a defined return path, instead of relying on shielding to fix it afterwards.',
          'No controlled impedance was specified anywhere. For the radio and the GNSS antenna feed that was luck rather than design.'
        ]
      },
      {
        heading: 'Process',
        items: [
          'No formal design review happened, because there was nobody to review it. I now run structured reviews and write down what was checked, what was found and what changed. The crosstalk problem would very likely have been caught on paper.',
          'Component selection was not documented. I now record the trade-off and the lifecycle status for every significant part.',
          'I did not simulate anything. I would now model the converter and the load transient in LTspice before committing to fabrication.'
        ]
      }
    ],
    verification: {
      title: 'What I would do differently now',
      prose: [
        'The system worked, the engineering judgement was thin, and I know specifically where. Most of what I would change, I learned by doing it properly at work over the last year.'
      ],
      quote: 'On a battery powered payload, efficiency is endurance.'
    }
  },

  /* ────────────────────────── U2 ────────────────────────── */
  {
    designator: 'U2',
    slug: 'ac-dc-power-supply-84w',
    title: 'Multi-output AC–DC power supply, 84 W',
    lede: 'Mains input supply for a lighting and emergency power product. Universal input, active PFC, two isolated GaN flyback outputs.',
    chips: ['Gessler GmbH', '2025–2026', '12 min read'],
    status: { label: 'Released', kind: 'released' },
    confidential: true,
    scene: 's3-mains-power-stage',
    sceneCaption: "Representative model. Not the client's design.",
    rail: [
      { label: 'Role', value: 'Hardware engineer, power stage' },
      { label: 'Ownership', value: 'Owned PFC and flyback stages · contributed to PLC subsystem' },
      { label: 'Scope', value: 'Schematic · magnetics spec · layout review · bench bring-up' },
      { label: 'Constraints', value: '90–264 VAC universal input · 93 % at 84 W · 8.0 mm creepage' },
      { label: 'Standards', value: 'IEC 61000-3-2 Class A · DIN EN 61347-2-7 · CE' },
      { label: 'Tools', value: 'Altium · LTspice · PI Expert · electronic load · thermal camera' }
    ],
    whatItIs: [
      'The supply takes 90–264 VAC universal input and runs an active continuous conduction mode boost PFC stage up to a regulated 380–400 VDC bus. Two isolated GaN flyback converters sit downstream of that bus. The main output is 24 V at 3.5 A — 84 W — at 93 % efficiency.',
      'A separate isolated power line communication subsystem is fed from a second tap on the same bus. The controllers are Power Integrations InnoSwitch5-Pro GaN parts; the flyback transformer is a custom Würth Elektronik component.',
      'I revised and extended the schematic across six hierarchical sheets, completed the multilayer layout to fabrication release, configured the secondary-side control and its I²C startup sequence, and wrote the hardware design documentation.'
    ],
    signalChain: {
      note: 'The transformer is the only thing allowed to cross the barrier.',
      barrier: '8.0 mm',
      primary: [
        { title: 'Mains input', detail: '90–264 VAC · 47–63 Hz' },
        { title: 'EMI filter and bridge rectifier', detail: 'CM choke · X/Y caps · full bridge' },
        { title: 'CCM boost PFC', detail: 'L1 boost inductor · IEC 61000-3-2 Class A' },
        { title: 'Regulated DC bus', detail: '380–400 VDC · C12 470 µF / 450 V', hot: true }
      ],
      /* Row numbers, not offsets. The side labels hold row 1, primary stages
         take rows 2/4/6/8 with arrows between, so T1 and the flyback it
         feeds both sit on row 8 — level with the DC bus that drives them. */
      transformers: [
        { label: 'T1', row: 8 },
        { label: 'T2', row: 12 }
      ],
      secondary: [
        { title: 'GaN flyback converter', detail: 'Main rail · 93 % at full load', row: 8 },
        { title: '24 V output', detail: '3.5 A · 84 W', row: 10 },
        { title: 'Second GaN flyback', detail: 'Isolated PLC subsystem supply', row: 12 }
      ],
      tap: { label: 'bus tapped again', row: 12 }
    },
    decisions: [
      {
        kind: 'problem',
        stage: 'U2 · schematic',
        title: 'An I²C address collision',
        found: 'Two identical flyback controllers on one bus. The part has a fixed I²C slave address, so the host could not address them independently.',
        did: 'Resolved it with an analogue multiplexer on the bus, selected by the host before each transaction. Changing controller would have meant requalifying the part and the magnetics.',
        result: 'Kept the qualified design intact, at a cost of two passives and one small IC.'
      },
      {
        kind: 'problem',
        stage: 'U2 · design review',
        title: 'Threshold overlap caught in review',
        found: 'During design review, the line overvoltage threshold overlapped the regulated PFC bus voltage under part of the input range. In the field that would have caused nuisance shutdowns, and been extremely awkward to diagnose there.',
        did: 'Retuned the sensing divider before the board was fabricated.',
        result: 'No respin.'
      }
    ],
    verification: {
      title: 'How I knew the magnetics were right',
      checked: ['Primary inductance', 'Turns ratio', 'Flux density margin', 'Core and copper loss'],
      tool: 'PI Expert',
      prose: [
        'The custom flyback transformer was specified with Würth application engineers. I then rebuilt the design independently in PI Expert and compared: primary inductance, turns ratio, flux density margin at maximum duty, and the core and copper loss split. The numbers agreed, and where they did not I asked why before releasing.'
      ],
      quote: "I would rather check a vendor's design than accept it."
    },
    notShown: [
      'The schematic, the layout, the magnetics specification and the measured data are Gessler GmbH intellectual property. What I can publish is the architecture, the reasoning, and the decisions — and I have published all three above. The 3D model on this page is built from the architecture description only.',
      'What I cannot do is hand over the designs themselves, and I would not want to work somewhere that wanted me to.'
    ]
  },

  /* ────────────────────────── U3 ────────────────────────── */
  {
    designator: 'U3',
    slug: 'nimh-charging-board',
    title: 'NiMH battery charging and monitoring board',
    lede: 'A board replacing centralised power supplies inside luminaires. Four-switch synchronous buck-boost charging, four hardware variants, one PCB architecture.',
    chips: ['Gessler GmbH', '2025–2026', '8 min read'],
    status: { label: 'Released', kind: 'released' },
    confidential: true,
    scene: 's4-charger-board',
    sceneCaption: "Representative model. Not the client's design.",
    rail: [
      { label: 'Role', value: 'Charger design and layout' },
      { label: 'Ownership', value: 'Led the power stage and magnetics sizing' },
      { label: 'Scope', value: 'Buck-boost stage · input EMI and ESD · controller selection study' },
      { label: 'Constraints', value: '0402 maximum package where space allowed · ten-year service life' },
      { label: 'Standards', value: 'DIN EN 61347-2-7 · IEC 61000-4-2 · IEC 61000-4-4' },
      { label: 'Variants', value: 'Four · two charge controllers · two cell types' }
    ],
    whatItIs: [
      'The board replaces centralised power supplies inside luminaires. A three-cell NiMH pack is charged through a four-switch synchronous buck-boost stage giving a programmable 3–24 V output, with 1-Wire UART monitoring back to the host controller.',
      'Four hardware variants cover two charge controllers and two cell types across a single PCB architecture. I designed the buck-boost power stage, the input EMI and ESD network, and the magnetics sizing for both cell variants, and produced the charge controller selection study that set the choice for all four.'
    ],
    decisions: [
      {
        kind: 'problem',
        stage: 'U3 · input filter',
        title: 'A common mode choke that would not have survived',
        found: 'The part specified for the input filter was rated 300 mA with 1.6 Ω DCR, against a load of up to 1.5 A. It would have dropped roughly 2.4 V and run hot.',
        did: 'Sized the replacement against the real load — a 2 A part at 0.19 Ω.',
        result: 'Rail drop about 1.2 % of the 24 V input.'
      },
      {
        kind: 'decision',
        stage: 'U3 · interface',
        title: 'Protecting a single-wire interface',
        found: 'The 1-Wire UART shares a connector with the 24 V supply and its return passes through the input choke, so switching transients were going to move the local ground reference against the host and corrupt edges at 115200 baud.',
        did: 'Added a series damping resistor of 33 Ω to control reflections on the cable, and a low-capacitance ESD diode — chosen for low capacitance specifically so the edge rate is preserved rather than rounded off.',
        result: 'Clean 115200 baud signalling through the input choke.'
      }
    ],
    verification: {
      title: 'Building the model the vendor did not supply',
      checked: ['Inrush current', 'Fast role-swap transition'],
      tool: 'LTspice',
      prose: [
        'No vendor SPICE model existed for the charge controller, so I built my own subcircuit and a test bench substituting a capacitor for the battery, to study inrush and the fast role-swap transition before committing to hardware. Building the model was also the fastest way to understand what the part actually does.'
      ],
      quote: 'This is the kind of thing that passes schematic review and fails in the field.'
    },
    notShown: [
      'The schematic, the layout and the measured data are Gessler GmbH intellectual property. The architecture, the reasoning and the decisions are mine to publish, and they are above.',
      'What I cannot do is hand over the designs themselves, and I would not want to work somewhere that wanted me to.'
    ]
  },

  /* ────────────────────────── U4 ────────────────────────── */
  {
    designator: 'U4',
    slug: 'rk3399-carrier-board',
    title: 'Six-layer RK3399 carrier board',
    lede: 'A carrier board for a Rockchip RK3399 system-on-module on an impedance-controlled stackup. PCIe to an SSD, two radios, three point-of-load rails.',
    chips: ['Gessler GmbH', '2025–2026', '9 min read'],
    status: { label: 'Released', kind: 'released' },
    confidential: true,
    scene: 's5-carrier-board',
    sceneCaption: "Representative model. Not the client's design.",
    rail: [
      { label: 'Role', value: 'Layout and impedance control' },
      { label: 'Ownership', value: 'Contributed · a team board, not a solo one' },
      { label: 'Scope', value: 'Power section · two RF paths · PCIe pairs · SD card interface' },
      { label: 'Power tree', value: '3.3 V · 5 V · 12 V point-of-load bucks' },
      { label: 'Standards', value: 'IPC-2221B' },
      { label: 'Stackup', value: 'Six layers · impedance targets defined before layout' }
    ],
    whatItIs: [
      'A six-layer carrier board for a Rockchip RK3399 system-on-module, on an impedance-controlled stackup. It carries a point-of-load power tree, a PCIe-attached SSD, an SD card interface, and two radios brought out to SMD SMA connectors — one LTE, one Bluetooth Low Energy.',
      'I placed and routed the power section, the two RF paths, the PCIe differential pairs to the SSD, and the SD card interface, then worked the schematic and component review comments through to release and contributed to the documentation package.',
      'This was a team board. The stackup and the impedance targets were defined before layout started; I worked inside them rather than setting them.'
    ],
    decisions: [
      {
        kind: 'decision',
        stage: 'U4 · PCIe',
        title: 'Differential pairs to the SSD',
        found: 'First differential pairs routed to a real target.',
        did: 'Kept each pair on a single layer over a continuous reference plane; held intra-pair skew tight by matching within the pair before matching pair to pair; kept the pairs away from the switching nodes of the buck converters; stitched ground around the transitions.',
        result: 'Length matching done against the budget the stackup gave me rather than a number I invented.'
      },
      {
        kind: 'decision',
        stage: 'U4 · RF',
        title: 'Two radios on one board',
        found: 'LTE and BLE both terminate at SMD SMA connectors. The work is in the launch and the isolation.',
        did: 'A clean transition from the coplanar feed into the connector; ground vias tight around the launch so the return path does not have to travel; enough separation and ground between the two paths that the LTE transmit path is not sitting on top of the BLE receive path.'
      },
      {
        kind: 'decision',
        stage: 'U4 · floorplan',
        title: 'Switching converters next to sensitive nets',
        found: 'A carrier board puts three buck converters a few centimetres from RF and PCIe.',
        did: "Kept each converter's high di/dt loop small and local, gave each one its own return area, planned the floorplan so the noisy corners and the sensitive corners are not the same corner.",
        result: 'The same discipline as the mains work, at a different frequency.'
      }
    ],
    verification: {
      title: 'What I would not claim',
      prose: [
        'I did not define the stackup or the impedance targets, and I have not run signal integrity simulation on this board. What I have done is route to a defined impedance target, length match a differential interface, and lay out RF connector launches on a board that went to fabrication.'
      ],
      quote: 'That is a smaller claim than owning the high-speed design, and it is the true one.'
    },
    notShown: [
      'The schematic, the layout and the stackup definition are Gessler GmbH intellectual property. The reasoning and the decisions above are mine.',
      'What I cannot do is hand over the designs themselves, and I would not want to work somewhere that wanted me to.'
    ]
  },

  /* ────────────────────────── U5 ────────────────────────── */
  {
    designator: 'U5',
    slug: 'usb-c-pd-bench-supply',
    title: 'USB-C PD programmable bench supply',
    lede: 'Own work, own time. A PD sink into a four-switch buck-boost stage, on a published four-layer stackup, with the measurements published as they come off the bench.',
    chips: ['Own work', '2026', '6 min read'],
    status: { label: 'In progress · not yet fabricated', kind: 'progress' },
    scene: null,
    sceneCaption: 'Not yet fabricated. No photographs until there are.',
    rail: [
      { label: 'Role', value: 'Everything' },
      { label: 'Ownership', value: 'Sole · own time' },
      { label: 'Scope', value: 'Schematic · stackup · layout · bring-up' },
      { label: 'Stackup', value: 'Four layers · published · 90 Ω USB pair' },
      { label: 'Status', value: 'Schematic complete · first layout in review' },
      { label: 'Next', value: 'Fabricate and publish the measured efficiency curve' }
    ],
    whatItIs: [
      'A USB-C Power Delivery programmable bench supply: a PD sink negotiating up to 20 V into a four-switch buck-boost stage giving an adjustable 0–24 V output, with an STM32 over USB, a precision current and voltage monitor on I²C, and a small display.',
      'Four layers on a published stackup so the impedance numbers are real, with the USB differential pair routed to a 90 Ω target and length matched.',
      'My current role is fully remote to a German client, which means I write bring-up procedures but do not run them at a bench. That is the gap in my week, and I am closing it on my own time.'
    ],
    decisions: [
      {
        kind: 'decision',
        stage: 'U5 · scope',
        title: 'Choosing a project that covers what work does not',
        found: 'Professional work gives me schematic revision, layout to release, and documentation — but not originating a design of my own, and not a bench.',
        did: 'Chose a project that requires all three: originating a schematic on a commercial-grade design, specifying a stackup and its impedance targets myself rather than routing to targets someone else set, and putting my own board on a bench and debugging it.',
        result: 'The gaps are the point. That is why this one is published in progress rather than when it is finished.'
      }
    ],
    verification: {
      title: 'What gets published',
      prose: [
        'The full package: the stackup and impedance report, the manufacturing outputs, and a bring-up and measurement report covering what did not work first time.'
      ],
      quote: 'I publish the measurements as they come off the bench, including the ones that disagree with the simulation.'
    }
  }
];

export const caseBySlug = (slug: string) => cases.find((c) => c.slug === slug);
