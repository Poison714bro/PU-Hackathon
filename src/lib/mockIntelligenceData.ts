// ═══════════════════════════════════════════════════════════════════════════
//  NEXUS Cyber Intel — Synthetic Intelligence Dataset
//  All entity IDs, wallet addresses, and foreign keys are cross-referenced.
// ═══════════════════════════════════════════════════════════════════════════

// ── Type Definitions ──

export interface CryptoWallet {
  address: string;
  currency: "BTC" | "XMR" | "ETH";
  observedVolumeUSD: number;
}

export interface PGPKey {
  fingerprint: string;   // 40-char hex
  shortKeyId: string;    // last 16 chars
}

export interface EntityIdentifiers {
  cryptoWallets: CryptoWallet[];
  pgpKeyFingerprint: PGPKey;
  encryptedHandles: { type: string; handle: string }[];
  knownAliases: string[];
}

export interface Entity {
  id: string;
  primaryAlias: string;
  category: "Opioids/Fentanyl" | "Stimulants" | "Cannabis" | "Psychedelics" | "Prescription/Other";
  colorHex: string;
  riskScore: number;
  status: "Active" | "Under Investigation" | "Seized";
  firstSeen: string;
  lastActive: string;
  sources: string[];
  identifiers: EntityIdentifiers;
  summary: string;
}

export interface BustLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface MapIncident {
  incidentId: string;
  entityId: string;
  drugType: string;
  colorHex: string;
  seizureWeightGrams: number;
  timestamp: string;
  bustLocation: BustLocation;
  originLocation: BustLocation;
  backtrackingRoute: [number, number][];
  communicationMedium: string;
}

export interface FeedItem {
  feedId: string;
  sourceType: "Darknet" | "Blockchain" | "Encrypted" | "OSINT";
  sourceName: string;
  entity: string;
  entityId: string;
  category: string;
  riskScore: number;
  relativeTime: string;
  timestamp: string;
  rawArtifactSnippet: string;
}

export interface CorrelationProof {
  pgpMatch: { match: boolean; keyId: string };
  stylometryScore: number;
  sharedCryptoCluster: string;
  sharedSessionId: string;
  visualMatchConfidence: number;
}

export interface AliasMatch {
  matchId: string;
  primaryEntityId: string;
  matchedEntityId: string;
  confidenceScore: number;
  correlationProof: CorrelationProof;
}

export interface TimelineEvent {
  eventId: string;
  entityId: string;
  timestamp: string;
  eventType: "GENESIS" | "MARKET_MIGRATION" | "FINANCIAL_SPIKE" | "OPSEC_FAILURE" | "SEIZURE";
  title: string;
  description: string;
  monthlyVolumeUSD: number;
  activeListingsCount: number;
  artifactHash: string;
}

export interface IntelligenceDataset {
  entities: Entity[];
  mapIncidents: MapIncident[];
  feedItems: FeedItem[];
  aliasMatches: AliasMatch[];
  timelineEvents: TimelineEvent[];
}


// ═══════════════════════════════════════════════════════════════════════════
//  1. MASTER ENTITIES & INTELLIGENCE DOSSIERS
// ═══════════════════════════════════════════════════════════════════════════

const entities: Entity[] = [
  {
    id: "ent-001",
    primaryAlias: "DarkPhoenix_77",
    category: "Opioids/Fentanyl",
    colorHex: "#FF4500",
    riskScore: 94,
    status: "Active",
    firstSeen: "2024-03-12T08:14:00Z",
    lastActive: "2026-08-17T14:32:00Z",
    sources: ["AlphaBay Reborn", "Dread Forum", "Telegram"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2", currency: "BTC", observedVolumeUSD: 482000 },
        { address: "42xM7q9Lr5kB3pN2vT1wH4yG6fD8cE0zA7sJ5mK9oI3uR6tY1wQ4eP2xL", currency: "XMR", observedVolumeUSD: 195000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "F9B24A321109E77A8C3D5F6B7E2A9D014C8F3B62",
        shortKeyId: "4C8F3B62",
      },
      encryptedHandles: [
        { type: "Session", handle: "056c8a1f3b7e9d2c4a6f8b0e1d3c5a7f9b2e4d6c8a0f1b3e5d7c9a1f3b5e7d9f9a1" },
        { type: "Telegram", handle: "@Ghost_Supply" },
      ],
      knownAliases: ["DP_Supply", "Ph03nix_Rx", "DarkP77"],
    },
    summary: "High-volume Fentanyl HCL distributor operating primarily on AlphaBay Reborn with verified multi-sig escrow. Linked to a Sinaloa-sourced precursor pipeline. Uses automated mixing services (Wasabi Wallet → Samourai Whirlpool) to obfuscate withdrawals. PGP key rotation observed every 90 days. Stylometry analysis links this alias to 'Ph03nix_Rx' on Dream Market (now defunct). Estimated cumulative revenue exceeds $670K across all wallets.",
  },
  {
    id: "ent-002",
    primaryAlias: "bc1q9h...x4k2",
    category: "Opioids/Fentanyl",
    colorHex: "#FF4500",
    riskScore: 87,
    status: "Under Investigation",
    firstSeen: "2025-01-05T16:20:00Z",
    lastActive: "2026-08-16T09:11:00Z",
    sources: ["Blockchain Monitor", "Chainalysis Reactor"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2", currency: "BTC", observedVolumeUSD: 482000 },
        { address: "0x7a3B9fCd2E8a1b4F6c5D0e9A3b7C2d8E4f1A6b9C", currency: "ETH", observedVolumeUSD: 34000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "F9B24A321109E77A8C3D5F6B7E2A9D014C8F3B62",
        shortKeyId: "4C8F3B62",
      },
      encryptedHandles: [],
      knownAliases: ["DarkPhoenix_77"],
    },
    summary: "Primary Bitcoin wallet cluster associated with DarkPhoenix_77. High-frequency peel chain transactions detected to Binance hot wallets. 14 separate CoinJoin rounds observed in the last 30 days. Wallet received 2.45 BTC from a known Hydra Market escrow refund address on 2026-08-16. Currently flagged in FinCEN SAR system.",
  },
  {
    id: "ent-003",
    primaryAlias: "@Ghost_Supply",
    category: "Stimulants",
    colorHex: "#00FFFF",
    riskScore: 78,
    status: "Active",
    firstSeen: "2025-06-18T11:30:00Z",
    lastActive: "2026-08-17T20:45:00Z",
    sources: ["Telegram", "Signal Proxy", "AlphaBay Reborn"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", currency: "BTC", observedVolumeUSD: 128000 },
        { address: "48nR3c7Y2vK5bL9mP1oQ4tU8xW3eF6gH0jJ2kS5iM7nA", currency: "XMR", observedVolumeUSD: 87000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "A1C3E5G7I9K2M4O6Q8S0U2W4Y6B8D0F2H4J6L8N0",
        shortKeyId: "H4J6L8N0",
      },
      encryptedHandles: [
        { type: "Telegram", handle: "@Ghost_Supply" },
        { type: "Telegram", handle: "@GhostBulk_Orders" },
        { type: "Tox", handle: "A04F3C8D91B7E2F5A6C8D0E3F5A7B9C1D3E5F7A9B1C3D5E7F9A1B3C5D7E9F1A3" },
      ],
      knownAliases: ["GhostBulk", "G_Supply_EU", "SpeedGhost"],
    },
    summary: "European-based stimulant wholesaler specializing in high-purity amphetamine sulfate and MDMA crystal. Operates primarily through Telegram channels with automated order bots. Ships via Dutch postal service (PostNL). Linked to a Netherlands-based production lab via OSINT scraping of a clear-web chemistry forum. Monero-only payment preference suggests elevated OPSEC awareness.",
  },
  {
    id: "ent-004",
    primaryAlias: "S11kR0ad_Vendor",
    category: "Opioids/Fentanyl",
    colorHex: "#FF4500",
    riskScore: 91,
    status: "Under Investigation",
    firstSeen: "2023-11-02T14:05:00Z",
    lastActive: "2026-08-15T18:22:00Z",
    sources: ["Versus Market", "Dread Forum", "Blockchain Monitor"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1q5v8n2m7k4j3h6g9f0d1s2a4p7o0i3u8y5t2r1e", currency: "BTC", observedVolumeUSD: 920000 },
        { address: "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A", currency: "XMR", observedVolumeUSD: 410000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "3D7C9A1B5E8F2D4C6A0B3E5D7F9A1C3E5G7I9K20",
        shortKeyId: "G7I9K20",
      },
      encryptedHandles: [
        { type: "Session", handle: "059d7b3e1f8a2c4d6e0b3f5a7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7" },
        { type: "Wickr", handle: "silkvendor_direct" },
      ],
      knownAliases: ["SilkRoad_Legacy", "SR_Vendor2023", "TheSilkMan"],
    },
    summary: "Legacy vendor originally active during Silk Road era. Migrated through Dream Market, Wall Street Market, and now operates on Versus Market. Specializes in pharmaceutical-grade opioid press operations, pressing counterfeit OxyContin M30 tablets containing fentanyl. DEA HIDTA intelligence links this alias to a pill press facility in Phoenix, AZ. Total estimated throughput exceeds $1.3M. Currently under multi-agency investigation (FBI/DEA joint task force).",
  },
  {
    id: "ent-005",
    primaryAlias: "ChemKing2026",
    category: "Stimulants",
    colorHex: "#00FFFF",
    riskScore: 82,
    status: "Active",
    firstSeen: "2025-09-14T09:00:00Z",
    lastActive: "2026-08-17T22:10:00Z",
    sources: ["AlphaBay Reborn", "Dread Forum", "Signal Proxy"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", currency: "BTC", observedVolumeUSD: 215000 },
        { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", currency: "ETH", observedVolumeUSD: 45000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "7F2A4C6E8B0D3F5A7C9E1B3D5F7A9C1E3B5D7F90",
        shortKeyId: "3B5D7F90",
      },
      encryptedHandles: [
        { type: "Signal", handle: "+31-6-XXXX-8827" },
        { type: "Session", handle: "05ab3c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4" },
      ],
      knownAliases: ["CK_2026", "ChemicalKingpin", "CK_NL"],
    },
    summary: "Mid-tier stimulant vendor operating from the Netherlands. Known for high-purity 4-FA and 2-CB synthesis. Ships in vacuum-sealed MYLAR bags within hollowed-out books. Advertising high-volume discounts on Dread Forums suggests scaling operation. NLP stylometry matches writing patterns of now-defunct vendor 'SpeedFactory_NL' on the original AlphaBay (2017). Uses Signal exclusively for direct communications.",
  },
  {
    id: "ent-006",
    primaryAlias: "NightOwl_Pharm",
    category: "Prescription/Other",
    colorHex: "#FFD700",
    riskScore: 65,
    status: "Active",
    firstSeen: "2025-03-20T21:15:00Z",
    lastActive: "2026-08-17T03:40:00Z",
    sources: ["Versus Market", "Telegram", "Clear-Web Forum"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1q7kw2uepvmd7p4q5mvr6ax3mykwpz7q42gy3yr2", currency: "BTC", observedVolumeUSD: 73000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "B4D6F8A0C2E4G6I8K0M2O4Q6S8U0W2Y4A6C8E0G2",
        shortKeyId: "A6C8E0G2",
      },
      encryptedHandles: [
        { type: "Telegram", handle: "@NightOwl_Scripts" },
        { type: "Telegram", handle: "@PharmOwl_Support" },
      ],
      knownAliases: ["OwlPharm", "NightScript_Rx"],
    },
    summary: "Prescription medication vendor offering diverted benzodiazepines (Xanax, Klonopin) and Z-drugs (Ambien) sourced from Indian pharmaceutical wholesalers. Listings show consistent domestic US shipping with USPS Priority Mail. Moderate risk score due to lower controlled substance scheduling. Telegram channel has 2,400+ subscribers. No PGP key rotation observed in 8 months — potential OPSEC decay.",
  },
  {
    id: "ent-007",
    primaryAlias: "AcidWizard420",
    category: "Psychedelics",
    colorHex: "#B026FF",
    riskScore: 56,
    status: "Active",
    firstSeen: "2024-07-04T12:00:00Z",
    lastActive: "2026-08-16T17:55:00Z",
    sources: ["AlphaBay Reborn", "Dread Forum"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h", currency: "BTC", observedVolumeUSD: 89000 },
        { address: "46BeWrHpwXmHDpDEUmZBWZfoQpdc6HaERCNmx1pEYL2rAcuwufPN9rXHHtyUA4QVy68t3cJmAk65sR4qUUKnuJR2r5s8Rnq", currency: "XMR", observedVolumeUSD: 112000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "C5E7G9I1K3M5O7Q9S1U3W5Y7A9C1E3G5I7K9M1O3",
        shortKeyId: "I7K9M1O3",
      },
      encryptedHandles: [
        { type: "Session", handle: "05cd5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e" },
      ],
      knownAliases: ["WizardLSD", "Acid_W420", "BlotterKing"],
    },
    summary: "Established LSD vendor with a reputation for high-quality 'Gamma Goblin' template blotter art. Ships internationally from an unknown European location. Positive feedback ratio of 99.2% across 1,800+ transactions. Lower risk score reflects reduced violence association with psychedelic distribution. Monero-preferred payments. OSINT analysis of blotter artwork watermarks links production to a known print shop near Zurich, Switzerland.",
  },
  {
    id: "ent-008",
    primaryAlias: "El_Chapo_Junior",
    category: "Cannabis",
    colorHex: "#39FF14",
    riskScore: 73,
    status: "Under Investigation",
    firstSeen: "2024-11-18T10:30:00Z",
    lastActive: "2026-08-14T12:00:00Z",
    sources: ["Hydra Market", "Telegram", "OSINT Scraper"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1qzlf9t6v8j0s1h3k5m7n9p2r4t6u8w0x2y4z6a8", currency: "BTC", observedVolumeUSD: 340000 },
        { address: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", currency: "ETH", observedVolumeUSD: 18000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "1A3B5C7D9E1F3A5B7C9D1E3F5A7B9C1D3E5F7A9B",
        shortKeyId: "3E5F7A9B",
      },
      encryptedHandles: [
        { type: "Telegram", handle: "@ChapoGreenDirect" },
        { type: "Wickr", handle: "chapo_green" },
      ],
      knownAliases: ["ChapoGreen", "GreenKingMX", "CaliBud_Premium"],
    },
    summary: "High-volume cannabis vendor specializing in California-grown indoor flower and THC concentrates. Suspected US-to-Europe shipping pipeline via USPS → Royal Mail remailer. Telegram storefront has 5,200+ subscribers. Blockchain analysis shows funds consolidating into a Coinbase Commerce wallet — likely laundering through legitimate e-commerce. Currently under investigation by HSI for international controlled substance trafficking.",
  },
  {
    id: "ent-009",
    primaryAlias: "PharmaGrad_RU",
    category: "Prescription/Other",
    colorHex: "#FFD700",
    riskScore: 69,
    status: "Active",
    firstSeen: "2025-05-01T06:00:00Z",
    lastActive: "2026-08-17T15:20:00Z",
    sources: ["Hydra Market", "Telegram", "Clear-Web Forum"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1qnkf5d2r7t8y3e6u9i2o5p8a1s4d7f0g3h6j9k2", currency: "BTC", observedVolumeUSD: 56000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "2B4D6F8A0C2E4F6A8C0E2F4A6C8E0F2A4C6E8F0A",
        shortKeyId: "4C6E8F0A",
      },
      encryptedHandles: [
        { type: "Telegram", handle: "@PharmaGrad_Orders" },
        { type: "Tox", handle: "B15F4C9D82A7E3F6A5C9D1E4F6A8C0E3F5A7C9D1E4F6A8C0E3F5A7C9D1E4F6A8" },
      ],
      knownAliases: ["RU_Pharma", "GradPharm", "Moscow_Meds"],
    },
    summary: "Russian-speaking vendor offering Tramadol, Pregabalin, and Phenazepam sourced from Russian and Indian pharmaceutical networks. Ships from Moscow using international registered mail. Listings are bilingual (Russian/English). Known to operate dead-drop services within Moscow city limits. OSINT links Telegram username to a VK.com profile with personal photos — significant OPSEC failure under investigation.",
  },
  {
    id: "ent-010",
    primaryAlias: "MethLabMike",
    category: "Stimulants",
    colorHex: "#00FFFF",
    riskScore: 96,
    status: "Seized",
    firstSeen: "2023-06-15T04:20:00Z",
    lastActive: "2026-07-02T00:00:00Z",
    sources: ["Versus Market", "Dread Forum", "Blockchain Monitor"],
    identifiers: {
      cryptoWallets: [
        { address: "bc1qp3w7e2r5t8y1u4i7o0p3a6s9d2f5g8h1j4k7l0", currency: "BTC", observedVolumeUSD: 1240000 },
        { address: "47tJ4e6bL8mP2oQ5uR8wX1yZ4cA7fB0gD3hE6iK9lM", currency: "XMR", observedVolumeUSD: 780000 },
      ],
      pgpKeyFingerprint: {
        fingerprint: "9E1F3A5B7C9D1E3F5A7B9C1D3E5F7A9B1C3D5E7F",
        shortKeyId: "1C3D5E7F",
      },
      encryptedHandles: [
        { type: "Wickr", handle: "mlm_direct" },
      ],
      knownAliases: ["MethMan_USA", "MM_Crystal", "LabMike_Direct"],
    },
    summary: "SEIZED — Lab shut down by DEA on 2026-07-02 in Riverside, CA. Previously the highest-volume methamphetamine vendor on Versus Market. P2P synthesis method confirmed from seized lab equipment. Total seized assets include 12kg crystal meth, $340K in cryptocurrency, and 3 firearms. Operator identified as Michael D. [REDACTED], age 34. Case # DEA-2026-SW-00847.",
  },
];


// ═══════════════════════════════════════════════════════════════════════════
//  2. GEOSPATIAL INCIDENTS & BACKTRACKING MAP DATA
// ═══════════════════════════════════════════════════════════════════════════

const mapIncidents: MapIncident[] = [
  {
    incidentId: "inc-101",
    entityId: "ent-001",
    drugType: "Opioids/Fentanyl - Fentanyl HCL Pressed Pills",
    colorHex: "#FF4500",
    seizureWeightGrams: 2200,
    timestamp: "2026-07-14T03:45:00Z",
    bustLocation: { name: "Warehouse District, Chicago, IL", lat: 41.8827, lng: -87.6233 },
    originLocation: { name: "Sinaloa Precursor Lab (Suspected), Culiacán, MX", lat: 24.7994, lng: -107.3940 },
    backtrackingRoute: [[24.7994, -107.3940], [29.0729, -110.9559], [31.3322, -110.9747], [32.2226, -110.9747], [33.4484, -112.0740], [35.1983, -111.6513], [36.1699, -115.1398], [39.7392, -104.9903], [41.8827, -87.6233]],
    communicationMedium: "Telegram Bot (@DPOrders_Bot)",
  },
  {
    incidentId: "inc-102",
    entityId: "ent-001",
    drugType: "Opioids/Fentanyl - Raw Fentanyl Powder",
    colorHex: "#FF4500",
    seizureWeightGrams: 500,
    timestamp: "2026-05-22T18:10:00Z",
    bustLocation: { name: "South Bronx, New York, NY", lat: 40.8176, lng: -73.9209 },
    originLocation: { name: "Mail Forwarding Service, Phoenix, AZ", lat: 33.4484, lng: -112.0740 },
    backtrackingRoute: [[33.4484, -112.0740], [35.0844, -106.6504], [36.1540, -95.9928], [38.6270, -90.1994], [39.7684, -86.1581], [40.4406, -79.9959], [40.8176, -73.9209]],
    communicationMedium: "Direct Darknet Escrow (AlphaBay)",
  },
  {
    incidentId: "inc-103",
    entityId: "ent-003",
    drugType: "Stimulants - Amphetamine Sulfate Paste",
    colorHex: "#00FFFF",
    seizureWeightGrams: 5000,
    timestamp: "2026-06-30T12:00:00Z",
    bustLocation: { name: "Rotterdam Port Customs, Netherlands", lat: 51.9244, lng: 4.4777 },
    originLocation: { name: "Warehouse, Eindhoven, Netherlands", lat: 51.4416, lng: 5.4697 },
    backtrackingRoute: [[51.4416, 5.4697], [51.5860, 4.7770], [51.9244, 4.4777]],
    communicationMedium: "Telegram Bot (@GhostBulk_Bot)",
  },
  {
    incidentId: "inc-104",
    entityId: "ent-004",
    drugType: "Opioids/Fentanyl - Counterfeit OxyContin M30",
    colorHex: "#FF4500",
    seizureWeightGrams: 15000,
    timestamp: "2026-04-18T09:30:00Z",
    bustLocation: { name: "Pill Press Facility, Phoenix, AZ", lat: 33.5721, lng: -112.0880 },
    originLocation: { name: "Chemical Precursor Source, Wuhan, China", lat: 30.5928, lng: 114.3055 },
    backtrackingRoute: [[30.5928, 114.3055], [22.3193, 114.1694], [37.7749, -122.4194], [34.0522, -118.2437], [33.5721, -112.0880]],
    communicationMedium: "Session Messenger",
  },
  {
    incidentId: "inc-105",
    entityId: "ent-005",
    drugType: "Stimulants - MDMA Crystal",
    colorHex: "#00FFFF",
    seizureWeightGrams: 3200,
    timestamp: "2026-08-02T14:20:00Z",
    bustLocation: { name: "Frankfurt Airport Customs, Germany", lat: 50.0379, lng: 8.5622 },
    originLocation: { name: "Lab (Suspected), Brabant, Netherlands", lat: 51.5719, lng: 5.0913 },
    backtrackingRoute: [[51.5719, 5.0913], [51.4416, 5.4697], [50.8503, 5.6910], [50.0379, 8.5622]],
    communicationMedium: "Signal Proxy",
  },
  {
    incidentId: "inc-106",
    entityId: "ent-007",
    drugType: "Psychedelics - LSD Blotter (250µg tabs)",
    colorHex: "#B026FF",
    seizureWeightGrams: 15,
    timestamp: "2026-03-11T06:45:00Z",
    bustLocation: { name: "US Customs, JFK Airport, New York", lat: 40.6413, lng: -73.7781 },
    originLocation: { name: "Postal Drop, Zurich, Switzerland", lat: 47.3769, lng: 8.5417 },
    backtrackingRoute: [[47.3769, 8.5417], [48.8566, 2.3522], [51.5074, -0.1278], [40.6413, -73.7781]],
    communicationMedium: "Direct Darknet Escrow (AlphaBay)",
  },
  {
    incidentId: "inc-107",
    entityId: "ent-008",
    drugType: "Cannabis - Indoor Flower (OG Kush)",
    colorHex: "#39FF14",
    seizureWeightGrams: 22000,
    timestamp: "2026-06-05T10:00:00Z",
    bustLocation: { name: "Royal Mail Sorting Office, London, UK", lat: 51.5322, lng: -0.1270 },
    originLocation: { name: "Grow House, Humboldt County, CA", lat: 40.7450, lng: -123.8695 },
    backtrackingRoute: [[40.7450, -123.8695], [37.7749, -122.4194], [40.6413, -73.7781], [51.5322, -0.1270]],
    communicationMedium: "Telegram Channel (@ChapoGreenDirect)",
  },
  {
    incidentId: "inc-108",
    entityId: "ent-010",
    drugType: "Stimulants - Crystal Methamphetamine",
    colorHex: "#00FFFF",
    seizureWeightGrams: 12000,
    timestamp: "2026-07-02T05:00:00Z",
    bustLocation: { name: "Residential Lab, Riverside, CA", lat: 33.9533, lng: -117.3962 },
    originLocation: { name: "Precursor Storage, Tijuana, MX", lat: 32.5149, lng: -117.0382 },
    backtrackingRoute: [[32.5149, -117.0382], [32.7157, -117.1611], [33.1581, -117.3506], [33.9533, -117.3962]],
    communicationMedium: "Wickr (mlm_direct)",
  },
  {
    incidentId: "inc-109",
    entityId: "ent-006",
    drugType: "Prescription/Other - Alprazolam (Xanax) 2mg bars",
    colorHex: "#FFD700",
    seizureWeightGrams: 800,
    timestamp: "2026-08-10T15:30:00Z",
    bustLocation: { name: "USPS Distribution Center, Memphis, TN", lat: 35.1495, lng: -90.0490 },
    originLocation: { name: "Repackaging Facility (Suspected), Houston, TX", lat: 29.7604, lng: -95.3698 },
    backtrackingRoute: [[29.7604, -95.3698], [32.7767, -96.7970], [34.7465, -92.2896], [35.1495, -90.0490]],
    communicationMedium: "Telegram (@NightOwl_Scripts)",
  },
  {
    incidentId: "inc-110",
    entityId: "ent-009",
    drugType: "Prescription/Other - Tramadol 200mg",
    colorHex: "#FFD700",
    seizureWeightGrams: 4500,
    timestamp: "2026-07-28T08:00:00Z",
    bustLocation: { name: "Russian Customs, Sheremetyevo Airport, Moscow", lat: 55.9726, lng: 37.4146 },
    originLocation: { name: "Pharmaceutical Warehouse, Mumbai, India", lat: 19.0760, lng: 72.8777 },
    backtrackingRoute: [[19.0760, 72.8777], [25.2048, 55.2708], [41.0082, 28.9784], [55.9726, 37.4146]],
    communicationMedium: "Telegram (@PharmaGrad_Orders)",
  },
  {
    incidentId: "inc-111",
    entityId: "ent-004",
    drugType: "Opioids/Fentanyl - Fentanyl Citrate Solution",
    colorHex: "#FF4500",
    seizureWeightGrams: 750,
    timestamp: "2026-06-12T22:15:00Z",
    bustLocation: { name: "Traffic Stop, I-10, Tucson, AZ", lat: 32.2226, lng: -110.9747 },
    originLocation: { name: "Stash House, Nogales, MX", lat: 31.3322, lng: -110.9390 },
    backtrackingRoute: [[31.3322, -110.9390], [31.9505, -110.9710], [32.2226, -110.9747]],
    communicationMedium: "Session Messenger",
  },
  {
    incidentId: "inc-112",
    entityId: "ent-003",
    drugType: "Stimulants - MDMA Pressed Pills (Blue Punisher)",
    colorHex: "#00FFFF",
    seizureWeightGrams: 1800,
    timestamp: "2026-08-08T16:45:00Z",
    bustLocation: { name: "Parcel Hub, Liège Airport, Belgium", lat: 50.6376, lng: 5.4390 },
    originLocation: { name: "Lab Distribution, Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
    backtrackingRoute: [[52.3676, 4.9041], [51.4416, 5.4697], [50.6376, 5.4390]],
    communicationMedium: "Telegram Bot (@GhostBulk_Bot)",
  },
  {
    incidentId: "inc-113",
    entityId: "ent-008",
    drugType: "Cannabis - THC Distillate Cartridges",
    colorHex: "#39FF14",
    seizureWeightGrams: 3000,
    timestamp: "2026-05-15T11:30:00Z",
    bustLocation: { name: "CBP Mail Facility, Los Angeles, CA", lat: 33.9425, lng: -118.4081 },
    originLocation: { name: "Extraction Lab, Oakland, CA", lat: 37.8044, lng: -122.2712 },
    backtrackingRoute: [[37.8044, -122.2712], [36.7783, -119.4179], [34.9530, -120.4357], [33.9425, -118.4081]],
    communicationMedium: "Wickr (chapo_green)",
  },
  {
    incidentId: "inc-114",
    entityId: "ent-001",
    drugType: "Opioids/Fentanyl - Carfentanil (Research Chemical)",
    colorHex: "#FF4500",
    seizureWeightGrams: 50,
    timestamp: "2026-08-14T07:20:00Z",
    bustLocation: { name: "Controlled Delivery, Detroit, MI", lat: 42.3314, lng: -83.0458 },
    originLocation: { name: "Mail Drop, Toronto, Canada", lat: 43.6532, lng: -79.3832 },
    backtrackingRoute: [[43.6532, -79.3832], [42.9849, -81.2453], [42.3314, -83.0458]],
    communicationMedium: "Direct Darknet Escrow (AlphaBay)",
  },
  {
    incidentId: "inc-115",
    entityId: "ent-005",
    drugType: "Stimulants - 2C-B Powder",
    colorHex: "#00FFFF",
    seizureWeightGrams: 250,
    timestamp: "2026-07-20T13:10:00Z",
    bustLocation: { name: "Spanish Customs, Barajas Airport, Madrid", lat: 40.4983, lng: -3.5676 },
    originLocation: { name: "Postal Drop, Utrecht, Netherlands", lat: 52.0907, lng: 5.1214 },
    backtrackingRoute: [[52.0907, 5.1214], [48.8566, 2.3522], [40.4983, -3.5676]],
    communicationMedium: "Signal Proxy",
  },
];


// ═══════════════════════════════════════════════════════════════════════════
//  3. MULTI-SOURCE INTELLIGENCE FEED ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const feedItems: FeedItem[] = [
  {
    feedId: "feed-001",
    sourceType: "Darknet",
    sourceName: "AlphaBay Reborn",
    entity: "DarkPhoenix_77",
    entityId: "ent-001",
    category: "Opioids/Fentanyl",
    riskScore: 94,
    relativeTime: "1h ago",
    timestamp: "2026-08-17T14:32:00Z",
    rawArtifactSnippet: "Listing: 500g Fentanyl HCL pressed pills via multi-sig escrow. Ships US domestic.",
  },
  {
    feedId: "feed-002",
    sourceType: "Blockchain",
    sourceName: "Blockchain Monitor",
    entity: "bc1q9h...x4k2",
    entityId: "ent-002",
    category: "Opioids/Fentanyl",
    riskScore: 87,
    relativeTime: "3h ago",
    timestamp: "2026-08-17T12:00:00Z",
    rawArtifactSnippet: "Transaction sweep: 2.45 BTC consolidated into mixing service (Whirlpool round detected).",
  },
  {
    feedId: "feed-003",
    sourceType: "Encrypted",
    sourceName: "Telegram Intel",
    entity: "@Ghost_Supply",
    entityId: "ent-003",
    category: "Stimulants",
    riskScore: 78,
    relativeTime: "5h ago",
    timestamp: "2026-08-17T10:15:00Z",
    rawArtifactSnippet: "Channel post: '🔥 RESTOCK — Pure NL speed paste & MDMA crystal. DM @GhostBulk_Orders for wholesale.'",
  },
  {
    feedId: "feed-004",
    sourceType: "Darknet",
    sourceName: "Versus Market",
    entity: "S11kR0ad_Vendor",
    entityId: "ent-004",
    category: "Opioids/Fentanyl",
    riskScore: 91,
    relativeTime: "6h ago",
    timestamp: "2026-08-17T09:00:00Z",
    rawArtifactSnippet: "New listing: 'M30 OxyContin Pressed (10-pack). Domestic US only. FE required for new buyers.'",
  },
  {
    feedId: "feed-005",
    sourceType: "OSINT",
    sourceName: "Dread Forum",
    entity: "ChemKing2026",
    entityId: "ent-005",
    category: "Stimulants",
    riskScore: 82,
    relativeTime: "8h ago",
    timestamp: "2026-08-17T07:30:00Z",
    rawArtifactSnippet: "Forum post: 'Looking for bulk 4-FA supplier. Can move 5kg/month EU-EU. PGP verified only.'",
  },
  {
    feedId: "feed-006",
    sourceType: "Encrypted",
    sourceName: "Telegram Intel",
    entity: "@NightOwl_Scripts",
    entityId: "ent-006",
    category: "Prescription/Other",
    riskScore: 65,
    relativeTime: "12h ago",
    timestamp: "2026-08-17T03:40:00Z",
    rawArtifactSnippet: "Channel update: 'Xanax 2mg back in stock. Pfizer press. Packs of 100/250/500. US-US priority.'",
  },
  {
    feedId: "feed-007",
    sourceType: "Darknet",
    sourceName: "AlphaBay Reborn",
    entity: "AcidWizard420",
    entityId: "ent-007",
    category: "Psychedelics",
    riskScore: 56,
    relativeTime: "1d ago",
    timestamp: "2026-08-16T17:55:00Z",
    rawArtifactSnippet: "Listing update: 'Gamma Goblin 250µg tabs. 10/25/50/100-sheet pricing. Free sample w/ orders >$200.'",
  },
  {
    feedId: "feed-008",
    sourceType: "Blockchain",
    sourceName: "Chainalysis Reactor",
    entity: "bc1qzlf9...z6a8",
    entityId: "ent-008",
    category: "Cannabis",
    riskScore: 73,
    relativeTime: "1d ago",
    timestamp: "2026-08-16T14:00:00Z",
    rawArtifactSnippet: "Alert: 4.2 BTC deposited to Coinbase Commerce address linked to El_Chapo_Junior cluster.",
  },
  {
    feedId: "feed-009",
    sourceType: "OSINT",
    sourceName: "Clear-Web Forum",
    entity: "PharmaGrad_RU",
    entityId: "ent-009",
    category: "Prescription/Other",
    riskScore: 69,
    relativeTime: "1d ago",
    timestamp: "2026-08-16T10:30:00Z",
    rawArtifactSnippet: "VK.com profile match: User 'PharmaGrad' posted pharmacy stock photos matching Tramadol listings.",
  },
  {
    feedId: "feed-010",
    sourceType: "Darknet",
    sourceName: "Versus Market",
    entity: "MethLabMike",
    entityId: "ent-010",
    category: "Stimulants",
    riskScore: 96,
    relativeTime: "47d ago",
    timestamp: "2026-07-02T00:00:00Z",
    rawArtifactSnippet: "SEIZED: Vendor account locked. DEA takedown notice posted. All escrow funds frozen.",
  },
  {
    feedId: "feed-011",
    sourceType: "Blockchain",
    sourceName: "Blockchain Monitor",
    entity: "bc1q5v8n...r1e",
    entityId: "ent-004",
    category: "Opioids/Fentanyl",
    riskScore: 88,
    relativeTime: "2d ago",
    timestamp: "2026-08-15T22:00:00Z",
    rawArtifactSnippet: "High-risk transaction: 6.8 BTC moved through 3-hop peel chain to unhosted wallet.",
  },
  {
    feedId: "feed-012",
    sourceType: "Encrypted",
    sourceName: "Session Intel",
    entity: "DarkPhoenix_77",
    entityId: "ent-001",
    category: "Opioids/Fentanyl",
    riskScore: 45,
    relativeTime: "3d ago",
    timestamp: "2026-08-14T22:00:00Z",
    rawArtifactSnippet: "Intercepted Session msg: 'Tracking number 1Z999AA10123456784. Allow 3-5 business days.'",
  },
];


// ═══════════════════════════════════════════════════════════════════════════
//  4. CROSS-PLATFORM ALIAS CORRELATION & DISAMBIGUATION
// ═══════════════════════════════════════════════════════════════════════════

const aliasMatches: AliasMatch[] = [
  {
    matchId: "match-001",
    primaryEntityId: "ent-001",
    matchedEntityId: "ent-002",
    confidenceScore: 98,
    correlationProof: {
      pgpMatch: { match: true, keyId: "4C8F3B62" },
      stylometryScore: 94,
      sharedCryptoCluster: "bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2",
      sharedSessionId: "056c8a1f3b7e9d2c4a6f8b0e1d3c5a7f9b2e4d6c8a0f1b3e5d7c9a1f3b5e7d9f9a1",
      visualMatchConfidence: 0,
    },
  },
  {
    matchId: "match-002",
    primaryEntityId: "ent-003",
    matchedEntityId: "ent-005",
    confidenceScore: 72,
    correlationProof: {
      pgpMatch: { match: false, keyId: "" },
      stylometryScore: 68,
      sharedCryptoCluster: "",
      sharedSessionId: "",
      visualMatchConfidence: 78,
    },
  },
  {
    matchId: "match-003",
    primaryEntityId: "ent-004",
    matchedEntityId: "ent-001",
    confidenceScore: 61,
    correlationProof: {
      pgpMatch: { match: false, keyId: "" },
      stylometryScore: 55,
      sharedCryptoCluster: "",
      sharedSessionId: "",
      visualMatchConfidence: 32,
    },
  },
  {
    matchId: "match-004",
    primaryEntityId: "ent-006",
    matchedEntityId: "ent-009",
    confidenceScore: 84,
    correlationProof: {
      pgpMatch: { match: false, keyId: "" },
      stylometryScore: 79,
      sharedCryptoCluster: "",
      sharedSessionId: "",
      visualMatchConfidence: 91,
    },
  },
];


// ═══════════════════════════════════════════════════════════════════════════
//  5. CHRONOLOGICAL SUSPECT SCALING TIMELINE
// ═══════════════════════════════════════════════════════════════════════════

const timelineEvents: TimelineEvent[] = [
  // ─── DarkPhoenix_77 (ent-001) ───
  {
    eventId: "tl-001",
    entityId: "ent-001",
    timestamp: "2024-03-12T08:14:00Z",
    eventType: "GENESIS",
    title: "First PGP Key Upload & Market Registration",
    description: "PGP key F9B2...3B62 uploaded to SKS keyserver. Same day, vendor account 'DarkPhoenix_77' registered on AlphaBay Reborn with 0 feedback.",
    monthlyVolumeUSD: 0,
    activeListingsCount: 0,
    artifactHash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  },
  {
    eventId: "tl-002",
    entityId: "ent-001",
    timestamp: "2024-06-01T00:00:00Z",
    eventType: "FINANCIAL_SPIKE",
    title: "First Significant Revenue Month",
    description: "Wallet bc1q9h...x4k2 received 0.8 BTC across 12 transactions. Vendor achieved 'Trusted' status on AlphaBay with 50+ positive reviews.",
    monthlyVolumeUSD: 35000,
    activeListingsCount: 4,
    artifactHash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
  },
  {
    eventId: "tl-003",
    entityId: "ent-001",
    timestamp: "2025-01-15T00:00:00Z",
    eventType: "MARKET_MIGRATION",
    title: "Expanded to Dread Forum for Direct Deals",
    description: "Vendor began advertising direct-deal Telegram channel on Dread /d/DarkPhoenix. PGP-signed posts confirmed identity.",
    monthlyVolumeUSD: 52000,
    activeListingsCount: 8,
    artifactHash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
  },
  {
    eventId: "tl-004",
    entityId: "ent-001",
    timestamp: "2025-11-20T00:00:00Z",
    eventType: "FINANCIAL_SPIKE",
    title: "Massive Volume Spike — Holiday Season",
    description: "Transaction volume surged to $89K in November. 14 CoinJoin rounds detected. Wallet consolidation suggests scaling to meet holiday demand.",
    monthlyVolumeUSD: 89000,
    activeListingsCount: 12,
    artifactHash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
  },
  {
    eventId: "tl-005",
    entityId: "ent-001",
    timestamp: "2026-06-02T14:30:00Z",
    eventType: "OPSEC_FAILURE",
    title: "Telegram Channel Metadata Leak",
    description: "Telegram channel @Ghost_Supply briefly exposed admin panel showing creation timestamp and device info (Samsung Galaxy S24, timezone UTC+5:30).",
    monthlyVolumeUSD: 72000,
    activeListingsCount: 10,
    artifactHash: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
  },

  // ─── S11kR0ad_Vendor (ent-004) ───
  {
    eventId: "tl-006",
    entityId: "ent-004",
    timestamp: "2023-11-02T14:05:00Z",
    eventType: "GENESIS",
    title: "Legacy Vendor Resurfaces on Versus Market",
    description: "Account 'S11kR0ad_Vendor' created on Versus Market. Introduction post references Silk Road-era vendor reputation. PGP key 3D7C...K20 uploaded.",
    monthlyVolumeUSD: 0,
    activeListingsCount: 0,
    artifactHash: "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
  },
  {
    eventId: "tl-007",
    entityId: "ent-004",
    timestamp: "2024-04-10T00:00:00Z",
    eventType: "FINANCIAL_SPIKE",
    title: "Pill Press Operation Scales Up",
    description: "Listings expanded to include counterfeit OxyContin M30 pills. 200+ sales in April. Blockchain shows $120K in BTC inflows to primary wallet.",
    monthlyVolumeUSD: 120000,
    activeListingsCount: 6,
    artifactHash: "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8",
  },
  {
    eventId: "tl-008",
    entityId: "ent-004",
    timestamp: "2025-03-15T00:00:00Z",
    eventType: "MARKET_MIGRATION",
    title: "Added Dread Forum Presence",
    description: "Vendor created /d/S11kR0ad on Dread forum. Posted signed verification confirming identity. Began accepting direct-deal orders via Session Messenger.",
    monthlyVolumeUSD: 95000,
    activeListingsCount: 8,
    artifactHash: "b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9",
  },
  {
    eventId: "tl-009",
    entityId: "ent-004",
    timestamp: "2026-04-18T09:30:00Z",
    eventType: "SEIZURE",
    title: "Pill Press Facility Raided — Phoenix, AZ",
    description: "DEA/FBI joint task force executed warrant at 3847 W. Camelback Rd, Phoenix. Seized 15kg pressed pills, 2 rotary tablet presses, and precursor chemicals. Suspect fled prior to arrival.",
    monthlyVolumeUSD: 140000,
    activeListingsCount: 10,
    artifactHash: "c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0",
  },

  // ─── @Ghost_Supply (ent-003) ───
  {
    eventId: "tl-010",
    entityId: "ent-003",
    timestamp: "2025-06-18T11:30:00Z",
    eventType: "GENESIS",
    title: "Telegram Channel Created",
    description: "Telegram channel @Ghost_Supply launched with automated ordering bot. First listings: 'NL Speed Paste — 70%+ purity' and 'MDMA Crystal — tested 84%'.",
    monthlyVolumeUSD: 5000,
    activeListingsCount: 2,
    artifactHash: "d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1",
  },
  {
    eventId: "tl-011",
    entityId: "ent-003",
    timestamp: "2025-12-01T00:00:00Z",
    eventType: "FINANCIAL_SPIKE",
    title: "Post-Christmas Demand Surge",
    description: "MDMA crystal sales tripled following European festival season. Monero wallet shows 120 XMR received in December alone (~$18K USD at time of receipt).",
    monthlyVolumeUSD: 28000,
    activeListingsCount: 7,
    artifactHash: "e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
  },
  {
    eventId: "tl-012",
    entityId: "ent-003",
    timestamp: "2026-04-05T00:00:00Z",
    eventType: "MARKET_MIGRATION",
    title: "Expanded to AlphaBay Reborn",
    description: "Vendor created mirrored listings on AlphaBay Reborn marketplace. PGP key A1C3...L8N0 matches Telegram channel verification.",
    monthlyVolumeUSD: 42000,
    activeListingsCount: 12,
    artifactHash: "f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3",
  },

  // ─── MethLabMike (ent-010) ───
  {
    eventId: "tl-013",
    entityId: "ent-010",
    timestamp: "2023-06-15T04:20:00Z",
    eventType: "GENESIS",
    title: "First Listing on Versus Market",
    description: "Vendor 'MethLabMike' created account on Versus Market. Initial listing: '14g Crystal Meth — P2P Synth — 99% pure'. First feedback received within 48 hours.",
    monthlyVolumeUSD: 8000,
    activeListingsCount: 1,
    artifactHash: "a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4",
  },
  {
    eventId: "tl-014",
    entityId: "ent-010",
    timestamp: "2024-02-01T00:00:00Z",
    eventType: "FINANCIAL_SPIKE",
    title: "Wholesale Distribution Begins",
    description: "Listings expanded to include bulk pricing (oz/QP). BTC wallet received $180K in February. Forum posts boast 'best ice on the market.'",
    monthlyVolumeUSD: 180000,
    activeListingsCount: 5,
    artifactHash: "b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
  },
  {
    eventId: "tl-015",
    entityId: "ent-010",
    timestamp: "2025-08-10T00:00:00Z",
    eventType: "OPSEC_FAILURE",
    title: "Shipping Return Address Exposed",
    description: "Buyer posted unboxing video on Reddit showing partial return address label. OSINT analysis traced it to a UPS Store in Riverside, CA.",
    monthlyVolumeUSD: 210000,
    activeListingsCount: 8,
    artifactHash: "c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  },
  {
    eventId: "tl-016",
    entityId: "ent-010",
    timestamp: "2026-07-02T05:00:00Z",
    eventType: "SEIZURE",
    title: "DEA Lab Takedown — Riverside, CA",
    description: "DEA executed federal search warrant. Seized 12kg methamphetamine, P2P synthesis equipment, $340K in crypto, and 3 firearms. Suspect Michael D. [REDACTED] arrested. Case # DEA-2026-SW-00847.",
    monthlyVolumeUSD: 0,
    activeListingsCount: 0,
    artifactHash: "d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
  },

  // ─── AcidWizard420 (ent-007) ───
  {
    eventId: "tl-017",
    entityId: "ent-007",
    timestamp: "2024-07-04T12:00:00Z",
    eventType: "GENESIS",
    title: "Vendor Account Created on AlphaBay",
    description: "AcidWizard420 joined AlphaBay Reborn. First listing: '100x Gamma Goblin LSD tabs 200µg'. PGP key C5E7...M1O3 published.",
    monthlyVolumeUSD: 3000,
    activeListingsCount: 1,
    artifactHash: "e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
  },
  {
    eventId: "tl-018",
    entityId: "ent-007",
    timestamp: "2025-04-20T00:00:00Z",
    eventType: "FINANCIAL_SPIKE",
    title: "4/20 Sales Event — Record Month",
    description: "April volume hit $22K driven by promotional '4/20 bundle' pricing. Feedback count surpassed 500 with 99.4% positive rating.",
    monthlyVolumeUSD: 22000,
    activeListingsCount: 6,
    artifactHash: "f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
  },

  // ─── El_Chapo_Junior (ent-008) ───
  {
    eventId: "tl-019",
    entityId: "ent-008",
    timestamp: "2024-11-18T10:30:00Z",
    eventType: "GENESIS",
    title: "Storefront Launched on Hydra Market & Telegram",
    description: "El_Chapo_Junior opened shop on Hydra Market and simultaneously launched Telegram channel @ChapoGreenDirect. Listings focused on California indoor cannabis.",
    monthlyVolumeUSD: 12000,
    activeListingsCount: 3,
    artifactHash: "a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  },
  {
    eventId: "tl-020",
    entityId: "ent-008",
    timestamp: "2025-07-01T00:00:00Z",
    eventType: "MARKET_MIGRATION",
    title: "International Shipping Pipeline Established",
    description: "OSINT detected Royal Mail tracking numbers in buyer feedback. Vendor confirmed US-to-UK shipping via USPS-to-Royal Mail remailer service.",
    monthlyVolumeUSD: 45000,
    activeListingsCount: 8,
    artifactHash: "b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
  },
  {
    eventId: "tl-021",
    entityId: "ent-008",
    timestamp: "2026-05-15T11:30:00Z",
    eventType: "SEIZURE",
    title: "THC Cartridge Shipment Intercepted — LA",
    description: "CBP intercepted parcel containing 3kg THC distillate cartridges at LAX mail facility. Return address traced to Oakland extraction lab. HSI investigation initiated.",
    monthlyVolumeUSD: 55000,
    activeListingsCount: 10,
    artifactHash: "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
  },
  {
    eventId: "tl-022",
    entityId: "ent-008",
    timestamp: "2026-08-01T00:00:00Z",
    eventType: "OPSEC_FAILURE",
    title: "Coinbase Commerce Wallet Identified",
    description: "Blockchain analysis revealed BTC consolidation into a Coinbase Commerce API address, linking darknet proceeds to a legitimate Shopify storefront selling 'CBD products.'",
    monthlyVolumeUSD: 38000,
    activeListingsCount: 7,
    artifactHash: "d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
  },
];


// ═══════════════════════════════════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const mockIntelligenceData: IntelligenceDataset = {
  entities,
  mapIncidents,
  feedItems,
  aliasMatches,
  timelineEvents,
};

export default mockIntelligenceData;
