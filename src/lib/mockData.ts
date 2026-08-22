// ── KPI Data ──
export const kpiData = {
  activeInvestigations: 47,
  suspiciousListings: 1284,
  cryptoVolumeTracked: 12500000,
  activeAlerts: 23,
  investigationsTrend: 12.5,
  listingsTrend: -8.3,
  cryptoTrend: 23.1,
  alertsTrend: 5.7,
};

// ── Multi-Source Feed ──
export interface FeedEntry {
  id: string;
  source: string;
  sourceType: "darknet" | "blockchain" | "encrypted" | "osint";
  entity: string;
  riskScore: number;
  date: string;
  category: string;
  details?: string;
}

export const feedData: FeedEntry[] = [
  { id: "F001", source: "Hydra Market", sourceType: "darknet", entity: "DarkPhoenix_77", riskScore: 94, date: "2026-08-17T14:22:00", category: "Opioids/Fentanyl", details: "New bulk listing detected — 500g fentanyl analog" },
  { id: "F002", source: "Blockchain Monitor", sourceType: "blockchain", entity: "bc1q9h...x4k2", riskScore: 87, date: "2026-08-17T14:18:00", category: "Stimulants", details: "Suspicious BTC transaction — 3.2 BTC to mixer" },
  { id: "F003", source: "Telegram Intel", sourceType: "encrypted", entity: "@Ghost_Supply", riskScore: 78, date: "2026-08-17T14:15:00", category: "Cannabis", details: "Encrypted channel advertising bulk cannabis shipments" },
  { id: "F004", source: "OSINT Scraper", sourceType: "osint", entity: "S1lkR0ad_Vendor", riskScore: 91, date: "2026-08-17T14:10:00", category: "Opioids/Fentanyl", details: "Known vendor re-emerged with new PGP key" },
  { id: "F005", source: "Monero Chain", sourceType: "blockchain", entity: "4Af2x...9pQ", riskScore: 65, date: "2026-08-17T14:05:00", category: "Psychedelics", details: "Ring signature analysis — possible vendor payment" },
  { id: "F006", source: "Dread Forum", sourceType: "darknet", entity: "ChemKing2026", riskScore: 82, date: "2026-08-17T13:55:00", category: "Stimulants", details: "Forum post advertising methamphetamine synthesis" },
  { id: "F007", source: "Signal Intel", sourceType: "encrypted", entity: "+1-XXX-XXXX", riskScore: 56, date: "2026-08-17T13:48:00", category: "Prescription/Other", details: "Intercepted message discussing Xanax distribution" },
  { id: "F008", source: "AlphaBay Reborn", sourceType: "darknet", entity: "NightOwl_Pharm", riskScore: 88, date: "2026-08-17T13:40:00", category: "Opioids/Fentanyl", details: "Vendor with 200+ sales — new oxycodone listings" },
  { id: "F009", source: "Chainalysis Feed", sourceType: "blockchain", entity: "0x8Fa2...b3C1", riskScore: 73, date: "2026-08-17T13:32:00", category: "Stimulants", details: "ETH wallet linked to known cocaine vendor cluster" },
  { id: "F010", source: "Wickr Monitor", sourceType: "encrypted", entity: "SnowFall_Direct", riskScore: 69, date: "2026-08-17T13:25:00", category: "Cannabis", details: "Wickr handle promoting West Coast cannabis network" },
  { id: "F011", source: "Versus Market", sourceType: "darknet", entity: "AcidWizard420", riskScore: 45, date: "2026-08-17T13:18:00", category: "Psychedelics", details: "New LSD vendor — first listing posted" },
  { id: "F012", source: "Blockchain Monitor", sourceType: "blockchain", entity: "bc1qm7...2kx9", riskScore: 96, date: "2026-08-17T13:10:00", category: "Opioids/Fentanyl", details: "High-volume BTC wallet — flagged by DEA" },
];

// ── Alerts ──
export interface Alert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
}

export const alertsData: Alert[] = [
  { id: "A001", severity: "critical", title: "Fentanyl Bulk Listing Detected", description: "DarkPhoenix_77 posted a new bulk fentanyl listing on Hydra Market with international shipping enabled.", timestamp: "2026-08-17T14:22:00", source: "Hydra Market", acknowledged: false },
  { id: "A002", severity: "critical", title: "DEA Flagged Wallet Active", description: "BTC wallet bc1qm7...2kx9 has received 8.7 BTC in the last 24 hours from multiple mixer outputs.", timestamp: "2026-08-17T13:10:00", source: "Chainalysis", acknowledged: false },
  { id: "A003", severity: "high", title: "Known Vendor Re-emergence", description: "S1lkR0ad_Vendor, previously delisted, has re-appeared with a new PGP identity on AlphaBay Reborn.", timestamp: "2026-08-17T14:10:00", source: "OSINT", acknowledged: false },
  { id: "A004", severity: "high", title: "Suspicious Mixer Activity", description: "3.2 BTC routed through CoinJoin mixer — pattern consistent with vendor cash-out.", timestamp: "2026-08-17T14:18:00", source: "Blockchain", acknowledged: true },
  { id: "A005", severity: "medium", title: "New Encrypted Channel Identified", description: "Telegram channel @Ghost_Supply promoting bulk cannabis — 847 subscribers.", timestamp: "2026-08-17T14:15:00", source: "Telegram", acknowledged: false },
  { id: "A006", severity: "medium", title: "Methamphetamine Synthesis Guide", description: "ChemKing2026 posted synthesis instructions on Dread Forum — 120 views in 2 hours.", timestamp: "2026-08-17T13:55:00", source: "Dread", acknowledged: true },
  { id: "A007", severity: "low", title: "New LSD Vendor Detected", description: "AcidWizard420 registered on Versus Market — no prior history.", timestamp: "2026-08-17T13:18:00", source: "Versus", acknowledged: true },
];

// ── Map Pins (Enhanced with routes and cross-refs) ──
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  drugCategory: string;
  label: string;
  date: string;
  details: string;
  riskScore: number;
  linkedNodeIds: string[];
  originRoute: Array<{ lat: number; lng: number }>;
  confiscatedAmount?: string;
  arrestCount?: number;
  suspectNames?: string[];
}

export const mapPinsData: MapPin[] = [
  {
    id: "M001", lat: 19.076, lng: 72.8777, drugCategory: "Opioids/Fentanyl", label: "Mumbai Hub",
    date: "2026-08-15", details: "Intercepted fentanyl shipment — 200g seized at cargo terminal",
    riskScore: 95, linkedNodeIds: ["N001", "N005"],
    originRoute: [{ lat: 21.1702, lng: 72.8311 }, { lat: 20.0, lng: 72.85 }, { lat: 19.076, lng: 72.8777 }],
    confiscatedAmount: "200g Fentanyl HCl", arrestCount: 3, suspectNames: ["Rahul M.", "Vijay S.", "Unknown courier"],
  },
  {
    id: "M002", lat: 28.6139, lng: 77.209, drugCategory: "Stimulants", label: "Delhi Server",
    date: "2026-08-14", details: "Darknet marketplace server identified in Connaught Place data center",
    riskScore: 82, linkedNodeIds: ["N009", "N008"],
    originRoute: [{ lat: 30.7333, lng: 76.7794 }, { lat: 29.5, lng: 77.0 }, { lat: 28.6139, lng: 77.209 }],
    confiscatedAmount: "Server equipment + 50g crystal meth samples", arrestCount: 1, suspectNames: ["Amit K."],
  },
  {
    id: "M003", lat: 12.9716, lng: 77.5946, drugCategory: "Cannabis", label: "Bangalore Drop",
    date: "2026-08-16", details: "Cannabis distribution network node — warehouse raid",
    riskScore: 58, linkedNodeIds: [],
    originRoute: [{ lat: 15.2993, lng: 74.124 }, { lat: 14.0, lng: 75.8 }, { lat: 12.9716, lng: 77.5946 }],
    confiscatedAmount: "12kg Cannabis", arrestCount: 2, suspectNames: ["Karthik R.", "Deepak L."],
  },
  {
    id: "M004", lat: 22.5726, lng: 88.3639, drugCategory: "Psychedelics", label: "Kolkata Network",
    date: "2026-08-12", details: "LSD distribution ring — 3 suspects identified via OSINT",
    riskScore: 71, linkedNodeIds: [],
    originRoute: [{ lat: 25.3176, lng: 82.9739 }, { lat: 24.0, lng: 85.5 }, { lat: 22.5726, lng: 88.3639 }],
    confiscatedAmount: "500 LSD blotter tabs", arrestCount: 0, suspectNames: ["Under investigation"],
  },
  {
    id: "M005", lat: 13.0827, lng: 80.2707, drugCategory: "Prescription/Other", label: "Chennai Pharmacy",
    date: "2026-08-17", details: "Illegal prescription drug sales via darknet — fake pharmacy front",
    riskScore: 67, linkedNodeIds: [],
    originRoute: [{ lat: 12.9716, lng: 77.5946 }, { lat: 13.05, lng: 79.0 }, { lat: 13.0827, lng: 80.2707 }],
    confiscatedAmount: "2000 Xanax tablets, 500 Oxycodone pills", arrestCount: 1, suspectNames: ["Suresh P."],
  },
  {
    id: "M006", lat: 23.0225, lng: 72.5714, drugCategory: "Opioids/Fentanyl", label: "Ahmedabad Route",
    date: "2026-08-13", details: "Fentanyl analog smuggling corridor — Gujarat highway interception",
    riskScore: 89, linkedNodeIds: ["N001", "N002"],
    originRoute: [{ lat: 21.1702, lng: 72.8311 }, { lat: 22.0, lng: 72.7 }, { lat: 23.0225, lng: 72.5714 }],
    confiscatedAmount: "150g Fentanyl analog", arrestCount: 2, suspectNames: ["Harsh P.", "Nikhil D."],
  },
  {
    id: "M007", lat: 17.385, lng: 78.4867, drugCategory: "Stimulants", label: "Hyderabad Lab",
    date: "2026-08-11", details: "Suspected amphetamine synthesis lab in Secunderabad industrial zone",
    riskScore: 91, linkedNodeIds: ["N009"],
    originRoute: [{ lat: 15.2993, lng: 74.124 }, { lat: 16.0, lng: 76.5 }, { lat: 17.385, lng: 78.4867 }],
    confiscatedAmount: "Lab equipment + 2kg precursor chemicals", arrestCount: 4, suspectNames: ["Ravi T.", "Pradeep K.", "Anand M.", "Srinivas G."],
  },
  {
    id: "M008", lat: 26.9124, lng: 75.7873, drugCategory: "Cannabis", label: "Jaipur Cultivation",
    date: "2026-08-10", details: "Indoor cannabis cultivation site discovered via thermal imaging",
    riskScore: 45, linkedNodeIds: [],
    originRoute: [{ lat: 28.6139, lng: 77.209 }, { lat: 27.5, lng: 76.5 }, { lat: 26.9124, lng: 75.7873 }],
    confiscatedAmount: "50 cannabis plants", arrestCount: 1, suspectNames: ["Manoj S."],
  },
  {
    id: "M009", lat: 18.5204, lng: 73.8567, drugCategory: "Opioids/Fentanyl", label: "Pune Transit",
    date: "2026-08-16", details: "Drug courier route — opioid shipments intercepted on Pune-Mumbai expressway",
    riskScore: 78, linkedNodeIds: ["N006"],
    originRoute: [{ lat: 19.076, lng: 72.8777 }, { lat: 18.8, lng: 73.3 }, { lat: 18.5204, lng: 73.8567 }],
    confiscatedAmount: "80g Heroin", arrestCount: 1, suspectNames: ["Unknown courier"],
  },
  {
    id: "M010", lat: 15.2993, lng: 74.124, drugCategory: "Psychedelics", label: "Goa Network",
    date: "2026-08-09", details: "Psychedelic drug distribution at rave venues — MDMA and LSD",
    riskScore: 54, linkedNodeIds: [],
    originRoute: [{ lat: 12.9716, lng: 77.5946 }, { lat: 14.0, lng: 75.5 }, { lat: 15.2993, lng: 74.124 }],
    confiscatedAmount: "200 MDMA pills, 100 LSD tabs", arrestCount: 0, suspectNames: ["Surveillance ongoing"],
  },
  {
    id: "M011", lat: 30.7333, lng: 76.7794, drugCategory: "Stimulants", label: "Chandigarh Link",
    date: "2026-08-14", details: "Methamphetamine supply chain node — cross-border Punjab connection",
    riskScore: 72, linkedNodeIds: ["N009"],
    originRoute: [{ lat: 31.6, lng: 74.8 }, { lat: 31.0, lng: 75.8 }, { lat: 30.7333, lng: 76.7794 }],
    confiscatedAmount: "30g Crystal Methamphetamine", arrestCount: 2, suspectNames: ["Gurpreet S.", "Harjinder K."],
  },
  {
    id: "M012", lat: 25.3176, lng: 82.9739, drugCategory: "Prescription/Other", label: "Varanasi Pharma",
    date: "2026-08-15", details: "Counterfeit benzodiazepine manufacturing — pill press operation",
    riskScore: 63, linkedNodeIds: [],
    originRoute: [{ lat: 28.6139, lng: 77.209 }, { lat: 26.8, lng: 80.9 }, { lat: 25.3176, lng: 82.9739 }],
    confiscatedAmount: "5000 counterfeit Diazepam tablets", arrestCount: 3, suspectNames: ["Rajesh V.", "Anil G.", "Prakash T."],
  },
  {
    id: "M013", lat: 21.1702, lng: 72.8311, drugCategory: "Opioids/Fentanyl", label: "Surat Port",
    date: "2026-08-17", details: "International fentanyl import via cargo container at Hazira port",
    riskScore: 97, linkedNodeIds: ["N001", "N005", "N002"],
    originRoute: [{ lat: 25.2048, lng: 55.2708 }, { lat: 23.0, lng: 65.0 }, { lat: 21.1702, lng: 72.8311 }],
    confiscatedAmount: "1.2kg Fentanyl HCl", arrestCount: 5, suspectNames: ["International syndicate — 5 detained"],
  },
  {
    id: "M014", lat: 26.4499, lng: 80.3319, drugCategory: "Cannabis", label: "Kanpur Distribution",
    date: "2026-08-08", details: "Large-scale cannabis distribution warehouse on GT Road",
    riskScore: 55, linkedNodeIds: [],
    originRoute: [{ lat: 28.6139, lng: 77.209 }, { lat: 27.2, lng: 79.0 }, { lat: 26.4499, lng: 80.3319 }],
    confiscatedAmount: "50kg Cannabis", arrestCount: 4, suspectNames: ["Ajay P.", "Sanjay M.", "Raghav N.", "Prashant K."],
  },
  {
    id: "M015", lat: 11.0168, lng: 76.9558, drugCategory: "Psychedelics", label: "Coimbatore Ring",
    date: "2026-08-13", details: "DMT synthesis and distribution ring — university connections",
    riskScore: 66, linkedNodeIds: [],
    originRoute: [{ lat: 12.9716, lng: 77.5946 }, { lat: 12.0, lng: 77.2 }, { lat: 11.0168, lng: 76.9558 }],
    confiscatedAmount: "50g DMT powder", arrestCount: 2, suspectNames: ["Aravind K.", "Senthil R."],
  },
  {
    id: "M016", lat: 23.2599, lng: 77.4126, drugCategory: "Opioids/Fentanyl", label: "Bhopal Relay",
    date: "2026-08-16", details: "Relay point for opioid shipments between Gujarat and UP",
    riskScore: 74, linkedNodeIds: ["N006"],
    originRoute: [{ lat: 23.0225, lng: 72.5714 }, { lat: 23.1, lng: 75.0 }, { lat: 23.2599, lng: 77.4126 }],
    confiscatedAmount: "60g Heroin", arrestCount: 1, suspectNames: ["Rohit Y."],
  },
  {
    id: "M017", lat: 9.9312, lng: 76.2673, drugCategory: "Cannabis", label: "Kochi Port",
    date: "2026-08-14", details: "Maritime cannabis smuggling — fishing vessel interception",
    riskScore: 68, linkedNodeIds: [],
    originRoute: [{ lat: 7.0, lng: 79.8 }, { lat: 8.5, lng: 77.5 }, { lat: 9.9312, lng: 76.2673 }],
    confiscatedAmount: "200kg Cannabis (maritime)", arrestCount: 6, suspectNames: ["Fishing crew — 6 detained"],
  },
  {
    id: "M018", lat: 22.7196, lng: 75.8577, drugCategory: "Stimulants", label: "Indore Cluster",
    date: "2026-08-15", details: "Amphetamine distribution cluster in college areas",
    riskScore: 61, linkedNodeIds: [],
    originRoute: [{ lat: 23.0225, lng: 72.5714 }, { lat: 22.9, lng: 74.0 }, { lat: 22.7196, lng: 75.8577 }],
    confiscatedAmount: "100 Amphetamine tablets", arrestCount: 2, suspectNames: ["Student distributors"],
  },
];

// ── Evidence Graph Nodes (Enhanced with roles and cross-refs) ──
export interface GraphNodeData {
  id: string;
  type: "username" | "wallet" | "email" | "pgp" | "listing";
  label: string;
  details: string;
  riskScore: number;
  metadata: Record<string, string>;
  suspectRole: "buyer" | "dealer" | "supplier" | "courier" | "unknown";
  linkedPinIds: string[];
}

export const graphNodesData: GraphNodeData[] = [
  {
    id: "N001", type: "username", label: "DarkPhoenix_77",
    details: "Active vendor on Hydra Market since 2024. 347 confirmed sales. Specializes in fentanyl analogs. Operates internationally.",
    riskScore: 94, suspectRole: "supplier", linkedPinIds: ["M001", "M006", "M013"],
    metadata: { "First Seen": "2024-03-15", "Markets": "Hydra, AlphaBay", "Sales": "347", "Rating": "4.8/5", "Ships From": "Gujarat, India" },
  },
  {
    id: "N002", type: "wallet", label: "bc1q9h...x4k2",
    details: "Bitcoin wallet with high-volume transactions. Connected to known mixer services. Linked to multiple vendor identities.",
    riskScore: 87, suspectRole: "unknown", linkedPinIds: ["M006", "M013"],
    metadata: { "Total Volume": "42.7 BTC", "Transactions": "891", "Mixer Usage": "Yes", "Risk Flag": "High" },
  },
  {
    id: "N003", type: "email", label: "d.phoenix@proton.me",
    details: "ProtonMail address linked to DarkPhoenix_77 via PGP key registration leak.",
    riskScore: 76, suspectRole: "unknown", linkedPinIds: [],
    metadata: { "Provider": "ProtonMail", "Linked To": "DarkPhoenix_77", "Source": "PGP leak database" },
  },
  {
    id: "N004", type: "pgp", label: "PGP: 0xA4F2...9B1C",
    details: "PGP public key used for vendor communications. Fingerprint cross-referenced across 3 markets.",
    riskScore: 82, suspectRole: "unknown", linkedPinIds: [],
    metadata: { "Key Size": "4096-bit RSA", "Created": "2024-02-28", "Markets": "3", "Messages Analyzed": "156" },
  },
  {
    id: "N005", type: "listing", label: "Fentanyl HCl 99%",
    details: "Bulk fentanyl listing with international shipping. Listed price: 0.5 BTC per 100g.",
    riskScore: 98, suspectRole: "unknown", linkedPinIds: ["M001", "M013"],
    metadata: { "Price": "0.5 BTC/100g", "Ships From": "Gujarat", "Ships To": "Worldwide", "Sales": "89" },
  },
  {
    id: "N006", type: "username", label: "S1lkR0ad_Vendor",
    details: "Re-emerged vendor with new identity. Previously active on original Silk Road era markets. Now operating via Pune-Bhopal corridor.",
    riskScore: 91, suspectRole: "dealer", linkedPinIds: ["M009", "M016"],
    metadata: { "First Seen": "2013-05-20", "Status": "Re-emerged", "Aliases": "3 known", "Markets": "5+" },
  },
  {
    id: "N007", type: "wallet", label: "0x8Fa2...b3C1",
    details: "Ethereum wallet used for stablecoin transactions. Connected to vendor payroll structure.",
    riskScore: 73, suspectRole: "unknown", linkedPinIds: [],
    metadata: { "Total Volume": "287 ETH", "USDT Volume": "$1.2M", "Contracts": "12", "DeFi Usage": "Yes" },
  },
  {
    id: "N008", type: "listing", label: "Crystal Meth 98%",
    details: "Methamphetamine listing by ChemKing2026. Claims lab-grade purity. Ships domestically from Hyderabad.",
    riskScore: 85, suspectRole: "unknown", linkedPinIds: ["M002"],
    metadata: { "Price": "0.08 BTC/28g", "Vendor": "ChemKing2026", "Reviews": "42", "Ships To": "Domestic" },
  },
  {
    id: "N009", type: "username", label: "ChemKing2026",
    details: "Methamphetamine vendor and synthesis guide author on Dread Forum. Operates labs across South India.",
    riskScore: 82, suspectRole: "supplier", linkedPinIds: ["M002", "M007", "M011"],
    metadata: { "Forum Posts": "234", "Listings": "12", "Rating": "4.6/5", "Active Since": "2025-11-01" },
  },
  {
    id: "N010", type: "pgp", label: "PGP: 0xC7E8...3D4A",
    details: "PGP key shared between S1lkR0ad_Vendor and DarkPhoenix_77 — possible same operator.",
    riskScore: 89, suspectRole: "unknown", linkedPinIds: [],
    metadata: { "Key Size": "4096-bit RSA", "Shared": "2 identities", "Confidence": "High", "Analysis": "Key reuse detected" },
  },
  {
    id: "N011", type: "username", label: "@Ghost_Supply",
    details: "Telegram channel operator promoting bulk cannabis shipments. 847 subscribers. Ships via Kochi port route.",
    riskScore: 78, suspectRole: "dealer", linkedPinIds: ["M017"],
    metadata: { "Platform": "Telegram", "Subscribers": "847", "Active Since": "2026-01-15", "Region": "Kerala/Tamil Nadu" },
  },
  {
    id: "N012", type: "username", label: "NightOwl_Pharm",
    details: "High-volume prescription drug vendor on AlphaBay Reborn. 200+ confirmed sales of oxycodone and benzodiazepines.",
    riskScore: 88, suspectRole: "dealer", linkedPinIds: ["M005"],
    metadata: { "Market": "AlphaBay Reborn", "Sales": "200+", "Speciality": "Prescription drugs", "Rating": "4.7/5" },
  },
  {
    id: "N013", type: "wallet", label: "4Af2x...9pQ",
    details: "Monero wallet with ring signature obfuscation. Linked to psychedelic drug vendor payments in Goa and Kolkata.",
    riskScore: 65, suspectRole: "unknown", linkedPinIds: ["M004", "M010"],
    metadata: { "Currency": "Monero (XMR)", "Est. Volume": "~450 XMR", "Ring Size": "11", "Stealth Addresses": "Yes" },
  },
];

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
  strength: number;
  contactMethod: "encrypted" | "in-person" | "phone" | "darknet";
}

export const graphEdgesData: GraphEdgeData[] = [
  { id: "E001", source: "N001", target: "N002", label: "Receives payments", strength: 0.9, contactMethod: "darknet" },
  { id: "E002", source: "N001", target: "N003", label: "Registered email", strength: 0.7, contactMethod: "encrypted" },
  { id: "E003", source: "N001", target: "N004", label: "Signs with", strength: 0.85, contactMethod: "darknet" },
  { id: "E004", source: "N001", target: "N005", label: "Created listing", strength: 0.95, contactMethod: "darknet" },
  { id: "E005", source: "N004", target: "N010", label: "Key correlation", strength: 0.8, contactMethod: "darknet" },
  { id: "E006", source: "N006", target: "N010", label: "Signs with", strength: 0.85, contactMethod: "darknet" },
  { id: "E007", source: "N006", target: "N007", label: "Receives payments", strength: 0.75, contactMethod: "encrypted" },
  { id: "E008", source: "N009", target: "N008", label: "Created listing", strength: 0.95, contactMethod: "darknet" },
  { id: "E009", source: "N009", target: "N002", label: "Shared wallet", strength: 0.6, contactMethod: "in-person" },
  { id: "E010", source: "N002", target: "N007", label: "Cross-chain swap", strength: 0.5, contactMethod: "darknet" },
  { id: "E011", source: "N001", target: "N006", label: "Shared PGP key", strength: 0.8, contactMethod: "encrypted" },
  { id: "E012", source: "N011", target: "N013", label: "Vendor payment", strength: 0.65, contactMethod: "encrypted" },
  { id: "E013", source: "N012", target: "N007", label: "ETH payments", strength: 0.7, contactMethod: "darknet" },
  { id: "E014", source: "N009", target: "N011", label: "Supply chain contact", strength: 0.4, contactMethod: "phone" },
  { id: "E015", source: "N006", target: "N012", label: "Vendor referral", strength: 0.55, contactMethod: "in-person" },
];

// ── Chart Data ──
export const activityChartData = [
  { name: "Mon", listings: 42, transactions: 28, alerts: 5 },
  { name: "Tue", listings: 55, transactions: 35, alerts: 8 },
  { name: "Wed", listings: 38, transactions: 22, alerts: 3 },
  { name: "Thu", listings: 67, transactions: 48, alerts: 12 },
  { name: "Fri", listings: 84, transactions: 62, alerts: 15 },
  { name: "Sat", listings: 71, transactions: 55, alerts: 9 },
  { name: "Sun", listings: 49, transactions: 31, alerts: 6 },
];

export const drugDistributionData = [
  { name: "Opioids/Fentanyl", value: 38, color: "#FF4500" },
  { name: "Stimulants", value: 27, color: "#00FFFF" },
  { name: "Cannabis", value: 18, color: "#39FF14" },
  { name: "Psychedelics", value: 10, color: "#B026FF" },
  { name: "Prescription/Other", value: 7, color: "#FFD700" },
];

export const cryptoVolumeData = [
  { date: "Aug 01", btc: 3.2, eth: 45, xmr: 12 },
  { date: "Aug 03", btc: 4.1, eth: 52, xmr: 18 },
  { date: "Aug 05", btc: 2.8, eth: 38, xmr: 15 },
  { date: "Aug 07", btc: 5.6, eth: 71, xmr: 22 },
  { date: "Aug 09", btc: 4.3, eth: 59, xmr: 19 },
  { date: "Aug 11", btc: 6.2, eth: 84, xmr: 28 },
  { date: "Aug 13", btc: 3.9, eth: 47, xmr: 16 },
  { date: "Aug 15", btc: 7.1, eth: 93, xmr: 31 },
  { date: "Aug 17", btc: 5.4, eth: 68, xmr: 24 },
];

// ── Investigation / Kanban Data ──
export interface InvestigationCard {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  assignee: string;
  tags: string[];
  evidenceCount: number;
  createdAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: InvestigationCard[];
}

export const kanbanData: KanbanColumn[] = [
  {
    id: "intake",
    title: "Intake",
    cards: [
      { id: "INV-001", title: "DarkPhoenix Fentanyl Network", description: "Investigate bulk fentanyl vendor DarkPhoenix_77 and connected wallet addresses.", priority: "critical", assignee: "Agent Torres", tags: ["Fentanyl", "Darknet", "BTC"], evidenceCount: 12, createdAt: "2026-08-15" },
      { id: "INV-004", title: "Telegram Cannabis Ring", description: "Monitor and infiltrate @Ghost_Supply channel for cannabis distribution intel.", priority: "medium", assignee: "Agent Chen", tags: ["Cannabis", "Telegram"], evidenceCount: 5, createdAt: "2026-08-16" },
    ],
  },
  {
    id: "active",
    title: "Active Investigation",
    cards: [
      { id: "INV-002", title: "S1lkR0ad Vendor Re-emergence", description: "Track re-emerged vendor across multiple marketplaces. Cross-reference PGP keys.", priority: "high", assignee: "Agent Rivera", tags: ["Multi-market", "PGP", "Identity"], evidenceCount: 23, createdAt: "2026-08-10" },
      { id: "INV-005", title: "Mixer Service Analysis", description: "Analyze CoinJoin mixer usage patterns to trace vendor cash-out routes.", priority: "high", assignee: "Agent Nakamura", tags: ["BTC", "Mixer", "Blockchain"], evidenceCount: 18, createdAt: "2026-08-12" },
    ],
  },
  {
    id: "review",
    title: "Under Review",
    cards: [
      { id: "INV-003", title: "ChemKing Meth Synthesis Intel", description: "Document and analyze synthesis guides posted by ChemKing2026 on Dread Forum.", priority: "medium", assignee: "Agent Patel", tags: ["Meth", "Forum", "OSINT"], evidenceCount: 9, createdAt: "2026-08-08" },
    ],
  },
  {
    id: "closed",
    title: "Closed / Archived",
    cards: [
      { id: "INV-006", title: "Mumbai Port Seizure Case", description: "Successfully intercepted 200g fentanyl shipment at Mumbai port. 2 arrests made.", priority: "critical", assignee: "Agent Torres", tags: ["Seizure", "Fentanyl", "Arrest"], evidenceCount: 34, createdAt: "2026-07-20" },
    ],
  },
];
