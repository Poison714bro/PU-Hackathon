"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Layers,
  Search,
  Play,
  Pause,
  Zap,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Globe,
  Map as MapIcon,
  ShieldAlert,
  Users,
  Network,
  Lock,
  CheckCircle2,
  Copy,
  Info,
  BarChart3,
  Eye,
  EyeOff,
  Crosshair,
  Radio,
  Sliders,
  Plus,
  Minus,
  RotateCcw,
  Activity,
  Fingerprint,
  AlertTriangle,
  Terminal,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import Map, { NavigationControl, FullscreenControl, Popup } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import {
  ScatterplotLayer,
  PathLayer,
  TextLayer,
  IconLayer,
  GeoJsonLayer,
  BitmapLayer,
} from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { FlyToInterpolator, _GlobeView as GlobeView } from "@deck.gl/core";
import { PathStyleExtension } from "@deck.gl/extensions";
import { useDebounce } from "use-debounce";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { type MapPin } from "@/lib/mockData";
import { getDrugColor } from "@/lib/utils";
import { useMapData } from "@/hooks/useMapData";
import { useAppStore } from "@/lib/store";
import "maplibre-gl/dist/maplibre-gl.css";

// ── Dark Tactical 2D Basemap Style for MapLibre (No Watermarks / No API Key) ──
const darkTacticalMapStyle = {
  version: 8 as const,
  sources: {
    "esri-dark-base": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "&copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
      maxzoom: 16,
    },
    "esri-dark-reference": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 16,
    },
  },
  layers: [
    {
      id: "esri-dark-base-layer",
      type: "raster",
      source: "esri-dark-base",
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: "esri-dark-reference-layer",
      type: "raster",
      source: "esri-dark-reference",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

// ── SVG Icon Atlases for Vehicle Smuggling Transits & Hub Pins ──
const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 24, height: 24, mask: true },
};
const MARKER_SVG =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 4.5 12 4.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z' fill='white'/%3E%3C/svg%3E";

const VEHICLE_ICON_MAPPING = {
  truck: { x: 0, y: 0, width: 64, height: 64, mask: false },
  ship: { x: 0, y: 0, width: 64, height: 64, mask: false },
};

const TRUCK_SVG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="28" fill="#040916" stroke="#00F0FF" stroke-width="2.5" opacity="0.95"/>
  <rect x="18" y="24" width="20" height="18" rx="2" fill="#00F0FF" opacity="0.9"/>
  <path d="M38 28H46L48 34V42H38V28Z" fill="#FFB800"/>
  <circle cx="24" cy="44" r="4" fill="#FFFFFF" stroke="#00F0FF" stroke-width="1.5"/>
  <circle cx="44" cy="44" r="4" fill="#FFFFFF" stroke="#FFB800" stroke-width="1.5"/>
  <polygon points="32,8 36,16 28,16" fill="#00F0FF"/>
</svg>
`);

const SHIP_SVG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="28" fill="#040916" stroke="#32FF7E" stroke-width="2.5" opacity="0.95"/>
  <path d="M18 36L22 46H42L46 36H18Z" fill="#32FF7E" opacity="0.95"/>
  <path d="M26 24H38V34H26V24Z" fill="#00F0FF"/>
  <rect x="29" y="16" width="6" height="8" fill="#FFFFFF"/>
  <circle cx="32" cy="32" r="3" fill="#FFFFFF"/>
  <polygon points="32,8 36,16 28,16" fill="#32FF7E"/>
</svg>
`);

const hexToRgbCache: Record<string, [number, number, number, number]> = {};
function cachedHexToRgb(hex: string, alpha: number = 255): [number, number, number, number] {
  const cacheKey = `${hex}-${alpha}`;
  if (hexToRgbCache[cacheKey]) return hexToRgbCache[cacheKey];
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  const rgb: [number, number, number, number] = [r, g, b, alpha];
  hexToRgbCache[cacheKey] = rgb;
  return rgb;
}

const INITIAL_VIEW_STATE = {
  longitude: 77.5,
  latitude: 23.5,
  zoom: 1.3,
  pitch: 0,
  bearing: 0,
  transitionDuration: 0,
};

// High-Density Great-Circle Geodesic Curve Interpolator (60 steps)
function interpolateGreatCircle(
  source: [number, number],
  target: [number, number],
  numPoints: number = 60
): [number, number][] {
  const [lng1, lat1] = source;
  const [lng2, lat2] = target;
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const lambda1 = lng1 * rad;
  const phi2 = lat2 * rad;
  const lambda2 = lng2 * rad;

  const dLambda = lambda2 - lambda1;
  const a =
    Math.sin((phi2 - phi1) / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d || 0.00001);
    const B = Math.sin(f * d) / Math.sin(d || 0.00001);

    const x = A * Math.cos(phi1) * Math.cos(lambda1) + B * Math.cos(phi2) * Math.cos(lambda2);
    const y = A * Math.cos(phi1) * Math.sin(lambda1) + B * Math.cos(phi2) * Math.sin(lambda2);
    const z = A * Math.sin(phi1) + B * Math.sin(phi2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) / rad;
    const lng = Math.atan2(y, x) / rad;
    points.push([lng, lat]);
  }
  return points;
}

// ── Major Cybernetic Transit Hubs ──
interface CyberneticHub {
  id: string;
  name: string;
  type: "CENTRAL_HUB" | "TRANSIT_PORT" | "PRECURSOR_LAB" | "BORDER_INLET";
  coords: [number, number];
  volumeTag: string;
  threatLevel: "CRITICAL" | "HIGH" | "ELEVATED";
  nodeId: string;
  color: [number, number, number];
  connectedLabs: number;
  riskScore: number;
  activeIntercepts: number;
  syndicate: string;
}

const CYBERNETIC_HUBS: CyberneticHub[] = [
  {
    id: "HUB-CENTRAL",
    name: "CONTEXT GRAPH CENTRAL HUB",
    type: "CENTRAL_HUB",
    coords: [75.8573, 31.326],
    volumeTag: "NEXUS-01 • MASTER RESOLUTION CORE",
    threatLevel: "CRITICAL",
    nodeId: "NODE ID: NX-990-HQ",
    color: [0, 240, 255],
    connectedLabs: 5,
    riskScore: 95,
    activeIntercepts: 48,
    syndicate: "Punjab Cyber Forensics Taskforce HQ",
  },
  {
    id: "HUB-MUMBAI",
    name: "PORT OF MUMBAI NEXUS",
    type: "TRANSIT_PORT",
    coords: [72.8777, 19.076],
    volumeTag: "540kg Fentanyl/Heroin • SEV-1",
    threatLevel: "CRITICAL",
    nodeId: "NODE ID: 778G-BOM-MARITIME",
    color: [255, 30, 86],
    connectedLabs: 4,
    riskScore: 92,
    activeIntercepts: 34,
    syndicate: "Ghost_Supply Maritime Ring",
  },
  {
    id: "HUB-DELHI",
    name: "DELHI NCR INTERMODAL CARGO",
    type: "TRANSIT_PORT",
    coords: [77.209, 28.6139],
    volumeTag: "380kg Synthetic Meth • ACTIVE",
    threatLevel: "CRITICAL",
    nodeId: "NODE ID: 442D-DEL-AIRWAY",
    color: [0, 240, 255],
    connectedLabs: 3,
    riskScore: 94,
    activeIntercepts: 28,
    syndicate: "Sinaloa-Golden Triangle Nexus",
  },
  {
    id: "HUB-AMRITSAR",
    name: "AMRITSAR BORDER CORRIDOR",
    type: "BORDER_INLET",
    coords: [74.8723, 31.634],
    volumeTag: "Golden Crescent Precursor Inlet",
    threatLevel: "CRITICAL",
    nodeId: "NODE ID: 910P-PB-BORDER",
    color: [255, 30, 86],
    connectedLabs: 6,
    riskScore: 96,
    activeIntercepts: 42,
    syndicate: "DarkPhoenix Syndicate",
  },
  {
    id: "HUB-KOLKATA",
    name: "KOLKATA MARITIME INLET",
    type: "TRANSIT_PORT",
    coords: [88.3639, 22.5726],
    volumeTag: "190kg Precursor Reagents • HIGH",
    threatLevel: "HIGH",
    nodeId: "NODE ID: 312K-CCU-PORT",
    color: [255, 140, 0],
    connectedLabs: 2,
    riskScore: 84,
    activeIntercepts: 19,
    syndicate: "ChemKing Precursor Cartel",
  },
  {
    id: "HUB-MANALI",
    name: "MANALI SYNTHESIS LAB CLUSTER",
    type: "PRECURSOR_LAB",
    coords: [77.1892, 32.2396],
    volumeTag: "45k Units LSD/MDMA • ELEVATED",
    threatLevel: "ELEVATED",
    nodeId: "NODE ID: 104H-MNL-SYNTH",
    color: [190, 40, 255],
    connectedLabs: 3,
    riskScore: 78,
    activeIntercepts: 15,
    syndicate: "SilkRoad 3.0 Collective",
  },
  {
    id: "HUB-BANGALORE",
    name: "BANGALORE CYBER & DROP RELAY",
    type: "TRANSIT_PORT",
    coords: [77.5946, 12.9716],
    volumeTag: "210kg Pharma Opioids • ACTIVE",
    threatLevel: "CRITICAL",
    nodeId: "NODE ID: 625B-BLR-CYBER",
    color: [0, 240, 255],
    connectedLabs: 2,
    riskScore: 91,
    activeIntercepts: 27,
    syndicate: "Ph03nix Rx Darknet Network",
  },
  {
    id: "HUB-DUBAI",
    name: "DUBAI OVERSEAS MIXER RELAY",
    type: "TRANSIT_PORT",
    coords: [55.2708, 25.2048],
    volumeTag: "Peel Chain Financial Mixer • 8.7 BTC",
    threatLevel: "HIGH",
    nodeId: "NODE ID: 880X-DXB-RELAY",
    color: [255, 184, 0],
    connectedLabs: 1,
    riskScore: 88,
    activeIntercepts: 16,
    syndicate: "Offshore Crypto Laundering Node",
  },
];

// ── Heavy Trafficking Multi-Strand Geodesic Energy Corridors ──
interface HeavyCorridor {
  id: string;
  source: [number, number];
  target: [number, number];
  name: string;
  category: string;
  volume: string;
  color: [number, number, number];
  flowRate: number;
  interpolatedPath: [number, number][];
  transitType: "maritime" | "overland";
  vehicleName: string;
}

const HEAVY_CORRIDORS: HeavyCorridor[] = [
  {
    id: "CORR-01",
    source: [74.8723, 31.634],
    target: [77.209, 28.6139],
    name: "Golden Crescent Primary Trunk",
    category: "Opioids/Fentanyl",
    volume: "540 kg",
    color: [255, 30, 86],
    flowRate: 3.5,
    interpolatedPath: interpolateGreatCircle([74.8723, 31.634], [77.209, 28.6139], 60),
    transitType: "overland",
    vehicleName: "Convoy TRK-09",
  },
  {
    id: "CORR-02",
    source: [77.209, 28.6139],
    target: [72.8777, 19.076],
    name: "Western Intermodal Express",
    category: "Stimulants",
    volume: "380 kg",
    color: [0, 240, 255],
    flowRate: 2.8,
    interpolatedPath: interpolateGreatCircle([77.209, 28.6139], [72.8777, 19.076], 60),
    transitType: "overland",
    vehicleName: "Hauler EXP-44",
  },
  {
    id: "CORR-03",
    source: [77.1892, 32.2396],
    target: [77.209, 28.6139],
    name: "Himalayan Synthetic Run",
    category: "Psychedelics",
    volume: "45k Blotters",
    color: [190, 40, 255],
    flowRate: 2.0,
    interpolatedPath: interpolateGreatCircle([77.1892, 32.2396], [77.209, 28.6139], 50),
    transitType: "overland",
    vehicleName: "Express TRK-12",
  },
  {
    id: "CORR-04",
    source: [72.8777, 19.076],
    target: [77.5946, 12.9716],
    name: "Southern Highway Relay",
    category: "Prescription/Other",
    volume: "210 kg",
    color: [255, 184, 0],
    flowRate: 2.4,
    interpolatedPath: interpolateGreatCircle([72.8777, 19.076], [77.5946, 12.9716], 60),
    transitType: "overland",
    vehicleName: "Carrier RX-88",
  },
  {
    id: "CORR-05",
    source: [88.3639, 22.5726],
    target: [77.209, 28.6139],
    name: "Eastern Precursor Pipeline",
    category: "Stimulants",
    volume: "190 kg",
    color: [255, 140, 0],
    flowRate: 1.8,
    interpolatedPath: interpolateGreatCircle([88.3639, 22.5726], [77.209, 28.6139], 60),
    transitType: "overland",
    vehicleName: "Cargo TRK-31",
  },
  {
    id: "CORR-06",
    source: [55.2708, 25.2048],
    target: [72.8777, 19.076],
    name: "Arabian Sea Darknet Channel",
    category: "Cannabis",
    volume: "820 kg",
    color: [50, 255, 126],
    flowRate: 4.2,
    interpolatedPath: interpolateGreatCircle([55.2708, 25.2048], [72.8777, 19.076], 70),
    transitType: "maritime",
    vehicleName: "Vessel MV-GHOST",
  },
];

// ── Suspect Threat Profiles ──
interface SuspectProfile {
  id: string;
  alias: string;
  realName: string;
  syndicate: string;
  threatLevel: "CRITICAL" | "HIGH" | "ELEVATED";
  riskScore: number;
  corridor: string;
  coords: [number, number];
  interceptVolume: string;
  sparkline: number[];
  avatarIcon: string;
}

const SUSPECT_PROFILES: SuspectProfile[] = [
  {
    id: "SP-01",
    alias: "DarkPhoenix_77",
    realName: "Tariq 'Phoenix' Mansoor",
    syndicate: "DarkPhoenix Syndicate",
    threatLevel: "CRITICAL",
    riskScore: 96,
    corridor: "Amritsar-Delhi Trunk",
    coords: [74.8723, 31.634],
    interceptVolume: "540 kg Fentanyl",
    sparkline: [45, 62, 58, 75, 89, 94, 96],
    avatarIcon: "🥷",
  },
  {
    id: "SP-02",
    alias: "S1lkR0ad_Vendor",
    realName: "Carlos 'El Guero' Ramirez",
    syndicate: "Sinaloa-Triangle Nexus",
    threatLevel: "CRITICAL",
    riskScore: 92,
    corridor: "Delhi NCR Freight Hub",
    coords: [77.209, 28.6139],
    interceptVolume: "380 kg Meth",
    sparkline: [30, 42, 65, 50, 78, 88, 92],
    avatarIcon: "💀",
  },
  {
    id: "SP-03",
    alias: "Ghost_Supply",
    realName: "Capt. Rashid Al-Maktoum",
    syndicate: "Ghost_Supply Maritime",
    threatLevel: "HIGH",
    riskScore: 88,
    corridor: "Dubai-Mumbai Maritime",
    coords: [72.8777, 19.076],
    interceptVolume: "820 kg Hydroponics",
    sparkline: [60, 55, 70, 68, 74, 82, 88],
    avatarIcon: "⚓",
  },
  {
    id: "SP-04",
    alias: "ChemKing2026",
    realName: "Dr. Arvind Banerjee",
    syndicate: "ChemKing Precursor Cartel",
    threatLevel: "HIGH",
    riskScore: 84,
    corridor: "Kolkata Air Cargo",
    coords: [88.3639, 22.5726],
    interceptVolume: "190 kg Precursors",
    sparkline: [20, 35, 40, 55, 68, 77, 84],
    avatarIcon: "🧪",
  },
  {
    id: "SP-05",
    alias: "AcidWizard420",
    realName: "Vikram 'Osho' Thakur",
    syndicate: "SilkRoad 3.0 Labs",
    threatLevel: "ELEVATED",
    riskScore: 78,
    corridor: "Manali Synthetic Valley",
    coords: [77.1892, 32.2396],
    interceptVolume: "45k Blotters LSD",
    sparkline: [50, 48, 62, 60, 65, 72, 78],
    avatarIcon: "🔮",
  },
  {
    id: "SP-06",
    alias: "Ph03nix_Rx",
    realName: "Naveen 'Byte' Hegde",
    syndicate: "Ph03nix Rx Darknet",
    threatLevel: "CRITICAL",
    riskScore: 91,
    corridor: "Bangalore Cyber Relay",
    coords: [77.5946, 12.9716],
    interceptVolume: "210 kg Pharma",
    sparkline: [35, 45, 60, 72, 80, 85, 91],
    avatarIcon: "💻",
  },
];

// ── Real-Time Intelligence Feed ──
interface IntelLogEntry {
  id: string;
  time: string;
  sourceType: "SIGINT" | "BLOCKCHAIN" | "CUSTOMS" | "WIRETAP" | "DARKNET";
  message: string;
  region: string;
  coords: [number, number];
  severity: "CRITICAL" | "HIGH" | "INFO";
}

const INITIAL_INTEL_LOGS: IntelLogEntry[] = [
  {
    id: "LOG-01",
    time: "13:51:02",
    sourceType: "SIGINT",
    message: "Encrypted Telegram cluster ping in Amritsar Sector (847 subscribers)",
    region: "Amritsar Sector",
    coords: [74.8723, 31.634],
    severity: "CRITICAL",
  },
  {
    id: "LOG-02",
    time: "13:50:44",
    sourceType: "BLOCKCHAIN",
    message: "4.2 BTC transaction routed to Dubai peel mixer (0x8Fa2...b3C1)",
    region: "Dubai-Mumbai Channel",
    coords: [55.2708, 25.2048],
    severity: "HIGH",
  },
  {
    id: "LOG-03",
    time: "13:49:15",
    sourceType: "CUSTOMS",
    message: "190kg precursor barrels seized at Kolkata Port cargo terminal",
    region: "Kolkata Port",
    coords: [88.3639, 22.5726],
    severity: "HIGH",
  },
  {
    id: "LOG-04",
    time: "13:48:02",
    sourceType: "WIRETAP",
    message: "VoIP intercepted: Manali synthesis shipment scheduled on NH-44",
    region: "Manali Valley",
    coords: [77.1892, 32.2396],
    severity: "CRITICAL",
  },
  {
    id: "LOG-05",
    time: "13:46:30",
    sourceType: "DARKNET",
    message: "Hydra Market: 500g fentanyl analog bulk batch listing flagged",
    region: "Delhi Freight Hub",
    coords: [77.209, 28.6139],
    severity: "CRITICAL",
  },
  {
    id: "LOG-06",
    time: "13:44:18",
    sourceType: "BLOCKCHAIN",
    message: "Monero ring signature link identified to Bangalore cyber drop",
    region: "Bangalore Cyber Hub",
    coords: [77.5946, 12.9716],
    severity: "INFO",
  },
];

const historicalTrendData = [
  { month: "Mar 2026", volumeKg: 420, graphDensity: 340, activeLinks: 180 },
  { month: "Apr 2026", volumeKg: 680, graphDensity: 520, activeLinks: 290 },
  { month: "May 2026", volumeKg: 510, graphDensity: 610, activeLinks: 410 },
  { month: "Jun 2026", volumeKg: 890, graphDensity: 890, activeLinks: 570 },
  { month: "Jul 2026", volumeKg: 1240, graphDensity: 1180, activeLinks: 790 },
  { month: "Aug 2026", volumeKg: 1580, graphDensity: 1428, activeLinks: 940 },
];

function formatShortDate(isoString: string) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toISOString().split("T")[0];
  } catch {
    return isoString.split("T")[0];
  }
}

export default function MapView() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [debouncedViewState] = useDebounce(viewState, 200);

  // Geographic Projection Mode: 2D Flat vs 3D Globe
  const [projection, setProjection] = useState<"2d" | "3d">("3d");

  // Default clean state: Decluttered HUD
  const [showKpiCards, setShowKpiCards] = useState(false);
  const [showSuspectCarousel, setShowSuspectCarousel] = useState(false);
  const [showIntelFeed, setShowIntelFeed] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  const [viewMode, setViewMode] = useState<"cluster" | "heatmap">("cluster");
  const [showArcs, setShowArcs] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showReadouts, setShowReadouts] = useState(true);
  const [pulseTick, setPulseTick] = useState(0);

  const [rightAccordion, setRightAccordion] = useState<"operations" | "dossiers" | "analytics" | "actions">("operations");
  const [intelLogs] = useState<IntelLogEntry[]>(INITIAL_INTEL_LOGS);
  const [intelFilter, setIntelFilter] = useState<"ALL" | "CRITICAL" | "SIGINT" | "CUSTOMS">("ALL");

  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const playRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedCluster, setSelectedCluster] = useState<{ lng: number; lat: number; leaves: any[] } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTick((prev) => (prev + 1) % 240);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const storeSelectedId = useAppStore((s) => s.selectedEntityId);
  const storeSelectedType = useAppStore((s) => s.selectedEntityType);
  const selectEntity = useAppStore((s) => s.selectEntity);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const openDossier = useAppStore((s) => s.openDossier);
  const filters = useAppStore((s) => s.filters);

  const {
    isClient,
    mapPinsData,
    filteredPins,
    supercluster,
    unclusteredPoints,
    clusterNodes,
    globalMinDate,
    globalMaxDate,
    dateRange,
    setDateRange,
    allDateRange,
    sliderValue,
  } = useMapData(debouncedViewState.zoom, filters.drugCategories, filters.riskRange as [number, number]);

  useEffect(() => {
    if (storeSelectedType === "pin" && storeSelectedId) {
      setSelectedPin(storeSelectedId);
    }
  }, [storeSelectedId, storeSelectedType]);

  const handleProjectionChange = useCallback(
    (newProj: "2d" | "3d") => {
      if (newProj === projection) return;
      setProjection(newProj);

      if (newProj === "2d") {
        setViewState((prev) => ({
          ...prev,
          longitude: 77.5,
          latitude: 23.5,
          pitch: 0,
          bearing: 0,
          zoom: 4.5,
          transitionDuration: 1400,
          transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
        }));
      } else {
        setViewState((prev) => ({
          ...prev,
          longitude: 77.5,
          latitude: 23.5,
          pitch: 0,
          bearing: 0,
          zoom: 1.3,
          transitionDuration: 1400,
          transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
        }));
      }
    },
    [projection]
  );

  const handleZoom = useCallback((direction: "in" | "out") => {
    setViewState((prev) => ({
      ...prev,
      zoom: direction === "in" ? Math.min(prev.zoom + 0.8, 14) : Math.max(prev.zoom - 0.8, 0.2),
      transitionDuration: 200,
    }));
  }, []);

  const handleResetView = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      longitude: 77.5,
      latitude: 23.5,
      zoom: projection === "3d" ? 1.3 : 4.5,
      pitch: 0,
      bearing: 0,
      transitionDuration: 400,
    }));
  }, [projection]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, which: "start" | "end") => {
      const idx = parseInt(e.target.value);
      if (which === "start") {
        setDateRange((prev) => [allDateRange[Math.min(idx, sliderValue[1])], prev[1]]);
      } else {
        setDateRange((prev) => [prev[0], allDateRange[Math.max(idx, sliderValue[0])]]);
      }
    },
    [allDateRange, sliderValue, setDateRange]
  );

  const handleFlyToCoords = useCallback(
    (lng: number, lat: number, targetZoom: number = 8) => {
      setViewState((prev) => ({
        ...prev,
        longitude: lng,
        latitude: lat,
        zoom: projection === "3d" ? Math.min(targetZoom, 5.0) : targetZoom,
        pitch: 0,
        bearing: 0,
        transitionDuration: 600,
      }));
    },
    [projection]
  );

  const handleFlyTo = useCallback(
    (pin: MapPin) => {
      setViewState((prev) => ({
        ...prev,
        longitude: pin.lng,
        latitude: pin.lat,
        zoom: projection === "3d" ? 4.5 : 11,
        pitch: 0,
        bearing: 0,
        transitionDuration: 600,
      }));
    },
    [projection]
  );

  const handlePinClick = useCallback(
    (pinId: string) => {
      setSelectedPin(pinId);
      setSelectedCluster(null);
      const pin = mapPinsData.find((p) => p.id === pinId);
      if (pin) {
        selectEntity(pinId, "pin", pin.linkedNodeIds);
      }
    },
    [selectEntity, mapPinsData]
  );

  const handleSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const match = mapPinsData.find(
          (p) =>
            p.label.toLowerCase().includes(query) ||
            p.drugCategory.toLowerCase().includes(query) ||
            p.details.toLowerCase().includes(query)
        );
        if (match) {
          handleFlyTo(match);
          handlePinClick(match.id);
        }
      }
    },
    [searchQuery, mapPinsData, handleFlyTo, handlePinClick]
  );

  const handleCloseDrawer = useCallback(() => {
    setSelectedPin(null);
    setSelectedCluster(null);
    clearSelection();
  }, [clearSelection]);

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    let currentIdx = 0;
    playRef.current = setInterval(() => {
      currentIdx++;
      if (currentIdx >= allDateRange.length) {
        if (playRef.current) clearInterval(playRef.current);
        setIsPlaying(false);
        setDateRange([globalMinDate, globalMaxDate]);
        return;
      }
      setDateRange([globalMinDate, allDateRange[currentIdx]]);
    }, 400);
  }, [allDateRange, globalMinDate, globalMaxDate, setDateRange]);

  const stopPlayback = useCallback(() => {
    if (playRef.current) clearInterval(playRef.current);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, []);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(`SHA256: ${hash}`);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const selectedPinData = selectedPin ? mapPinsData.find((p) => p.id === selectedPin) : null;

  // ── High-Density GPU-Accelerated Deck.gl Layers ──
  const isGlobeProjection = projection === "3d";

  const layers = useMemo(() => {
    const isHeatmap = viewMode === "heatmap";
    const layerList = [];

    // ── 1. 3D Globe: Photorealistic Earth Surface & Geopolitical Boundaries ──
    if (isGlobeProjection) {
      layerList.push(
        new BitmapLayer({
          id: "globe-earth-surface",
          image: "/data/earth_day.jpg",
          bounds: [-180, -90, 180, 90],
          pickable: false,
        }),

        new GeoJsonLayer({
          id: "globe-world-countries",
          data: "/data/world_countries.geojson",
          filled: false,
          stroked: true,
          getLineColor: [0, 240, 255, 160],
          getLineWidth: 1.2,
          lineWidthUnits: "pixels",
          pickable: false,
        }),

        new TextLayer({
          id: "globe-country-labels",
          data: [
            { name: "INDIA", coords: [78.9629, 21.5] },
            { name: "PAKISTAN", coords: [69.3451, 30.3] },
            { name: "U.A.E.", coords: [54.3773, 24.4] },
            { name: "IRAN", coords: [53.688, 32.4] },
            { name: "AFGHANISTAN", coords: [67.7099, 33.9] },
            { name: "MYANMAR", coords: [95.956, 21.9] },
            { name: "THAILAND", coords: [100.9925, 15.8] },
            { name: "SRI LANKA", coords: [80.7718, 7.8] },
            { name: "CHINA", coords: [104.1954, 35.8] },
            { name: "OMAN", coords: [55.9233, 21.5] },
          ],
          getPosition: (d: any) => d.coords,
          getText: (d: any) => d.name,
          getSize: 10,
          getColor: [255, 255, 255, 210],
          backgroundColor: [4, 9, 22, 180],
          backgroundPadding: [3, 1, 3, 1],
          fontFamily: "monospace",
          fontWeight: 700,
          getAlignmentBaseline: "center",
          billboard: true,
          pickable: false,
        })
      );
    }

    if (isHeatmap) {
      layerList.push(
        new HeatmapLayer({
          id: "heatmap-layer",
          data: filteredPins,
          getPosition: (d: any) => [d.lng, d.lat],
          getWeight: (d: any) => d.riskScore,
          radiusPixels: 48,
          intensity: 1.5,
          threshold: 0.05,
          colorRange: [
            [255, 255, 255, 0],
            [0, 240, 255, 140],
            [190, 40, 255, 180],
            [255, 140, 0, 220],
            [255, 30, 86, 255],
          ],
        })
      );
    } else {
      if (showArcs) {
        // ── 2. Multi-Strand Geodesic Supply Chain Route Tubes ──
        layerList.push(
          new PathLayer({
            id: "heavy-corridors-halo",
            data: HEAVY_CORRIDORS,
            getPath: (d: HeavyCorridor) => d.interpolatedPath,
            getColor: (d: HeavyCorridor) => [...d.color, 95] as [number, number, number, number],
            getWidth: 7,
            widthUnits: "pixels",
            widthMinPixels: 3.5,
            widthMaxPixels: 11,
            capRounded: true,
            jointRounded: true,
            pickable: false,
          }),

          new PathLayer({
            id: "heavy-corridors-core",
            data: HEAVY_CORRIDORS,
            getPath: (d: HeavyCorridor) => d.interpolatedPath,
            getColor: (d: HeavyCorridor) => [...d.color, 255] as [number, number, number, number],
            getWidth: 3.2,
            widthUnits: "pixels",
            widthMinPixels: 2.2,
            widthMaxPixels: 5.5,
            capRounded: true,
            jointRounded: true,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 240],
            onHover: (info: any) => setHoverInfo(info),
          }),

          new PathLayer({
            id: "heavy-corridors-filament",
            data: HEAVY_CORRIDORS,
            getPath: (d: HeavyCorridor) => d.interpolatedPath,
            getColor: () => [255, 255, 255, 240],
            getWidth: 1.2,
            widthUnits: "pixels",
            widthMinPixels: 1,
            widthMaxPixels: 2.5,
            capRounded: true,
            jointRounded: true,
            pickable: false,
          })
        );

        // Transit Vehicles (Cargo Ships & Heavy Trucks)
        const vehicleTransitData = HEAVY_CORRIDORS.map((corr) => {
          const progress = ((pulseTick * corr.flowRate) % 240) / 240;
          const path = corr.interpolatedPath;
          const idx = Math.floor(progress * (path.length - 1));
          const nextIdx = Math.min(idx + 1, path.length - 1);
          const currentPoint = path[idx] || corr.source;
          const nextPoint = path[nextIdx] || corr.target;

          const dLng = nextPoint[0] - currentPoint[0];
          const dLat = nextPoint[1] - currentPoint[1];
          const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;

          return {
            ...corr,
            position: currentPoint,
            heading: angle,
            iconType: corr.transitType === "maritime" ? "ship" : "truck",
          };
        });

        layerList.push(
          new IconLayer({
            id: "vehicle-transit-icons",
            data: vehicleTransitData,
            iconAtlas: vehicleTransitData.some((v) => v.iconType === "ship") ? SHIP_SVG : TRUCK_SVG,
            iconMapping: VEHICLE_ICON_MAPPING,
            getIcon: (d: any) => d.iconType,
            getPosition: (d: any) => d.position,
            getAngle: (d: any) => d.heading,
            getSize: 28,
            sizeUnits: "pixels",
            sizeMinPixels: 22,
            sizeMaxPixels: 38,
            pickable: true,
            onHover: (info: any) => setHoverInfo(info),
          }),

          new ScatterplotLayer({
            id: "vehicle-pulse-rings",
            data: vehicleTransitData,
            getPosition: (d: any) => d.position,
            getFillColor: (d: any) => [...d.color, 140] as [number, number, number, number],
            getRadius: 6,
            radiusUnits: "pixels",
            radiusMinPixels: 4,
            radiusMaxPixels: 8,
            billboard: true,
            antialiasing: true,
            pickable: false,
          })
        );
      }

      // ── 3. Major Cybernetic Hubs: Billboarded High-Contrast Concentric Rings ──
      const pulseFactor = (pulseTick % 40) / 40;
      layerList.push(
        new ScatterplotLayer({
          id: "cybernetic-hubs-ripple",
          data: CYBERNETIC_HUBS,
          getPosition: (d: CyberneticHub) => d.coords,
          getFillColor: (d: CyberneticHub) => [...d.color, Math.floor(65 * (1 - pulseFactor))] as [number, number, number, number],
          getLineColor: (d: CyberneticHub) => [...d.color, Math.floor(255 * (1 - pulseFactor))] as [number, number, number, number],
          getLineWidth: 2,
          lineWidthUnits: "pixels",
          getRadius: (d: CyberneticHub) => (d.type === "CENTRAL_HUB" ? 26 + pulseFactor * 12 : 18 + pulseFactor * 9),
          radiusUnits: "pixels",
          radiusMinPixels: 15,
          radiusMaxPixels: 38,
          billboard: true,
          antialiasing: true,
          pickable: false,
        }),

        new ScatterplotLayer({
          id: "cybernetic-hubs-mid",
          data: CYBERNETIC_HUBS,
          getPosition: (d: CyberneticHub) => d.coords,
          getFillColor: (d: CyberneticHub) => [...d.color, 120] as [number, number, number, number],
          getLineColor: (d: CyberneticHub) => [...d.color, 255] as [number, number, number, number],
          getLineWidth: 2.5,
          lineWidthUnits: "pixels",
          getRadius: (d: CyberneticHub) => (d.type === "CENTRAL_HUB" ? 16 : 11),
          radiusUnits: "pixels",
          radiusMinPixels: 9,
          radiusMaxPixels: 19,
          billboard: true,
          antialiasing: true,
          pickable: true,
          onClick: (info: any) => {
            if (info.object) {
              handleFlyToCoords(info.object.coords[0], info.object.coords[1], 8);
            }
          },
          onHover: (info: any) => setHoverInfo(info),
        }),

        new ScatterplotLayer({
          id: "cybernetic-hubs-core",
          data: CYBERNETIC_HUBS,
          getPosition: (d: CyberneticHub) => d.coords,
          getFillColor: (d: CyberneticHub) => (d.type === "CENTRAL_HUB" ? [0, 240, 255, 255] : [...d.color, 255]) as [number, number, number, number],
          stroked: true,
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 1.5,
          lineWidthUnits: "pixels",
          getRadius: (d: CyberneticHub) => (d.type === "CENTRAL_HUB" ? 8 : 5.5),
          radiusUnits: "pixels",
          radiusMinPixels: 4.5,
          radiusMaxPixels: 10,
          billboard: true,
          antialiasing: true,
          pickable: false,
        }),

        new TextLayer({
          id: "central-hub-star",
          data: CYBERNETIC_HUBS.filter((h) => h.type === "CENTRAL_HUB"),
          getPosition: (d: CyberneticHub) => d.coords,
          getText: () => "★",
          getSize: 15,
          getColor: [255, 255, 255, 255],
          getAlignmentBaseline: "center",
          fontFamily: "monospace",
          fontWeight: 900,
          billboard: true,
        })
      );

      // ── 4. Standard Incidents: Markers & Clusters ──
      layerList.push(
        new IconLayer({
          id: "icon-layer",
          data: unclusteredPoints,
          iconAtlas: MARKER_SVG,
          iconMapping: ICON_MAPPING,
          getIcon: () => "marker",
          getPosition: (d: any) => d.geometry.coordinates,
          getSize: (d: any) => {
            const isSelected =
              selectedPin === d.properties.id ||
              (storeSelectedType === "pin" && storeSelectedId === d.properties.id);
            return isSelected ? 38 : 24;
          },
          getColor: (d: any) => cachedHexToRgb(getDrugColor(d.properties.drugCategory), 255),
          sizeUnits: "pixels",
          billboard: true,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 200],
          onClick: (info: any) => {
            if (info.object && !info.object.properties.cluster) {
              handlePinClick(info.object.properties.id);
            }
          },
          onHover: (info: any) => setHoverInfo(info),
          updateTriggers: {
            getSize: [selectedPin, storeSelectedId],
          },
        }),

        new ScatterplotLayer({
          id: "cluster-scatter-layer",
          data: clusterNodes,
          getPosition: (d: any) => d.geometry.coordinates,
          getFillColor: [6, 11, 25, 230],
          getLineColor: [0, 240, 255, 255],
          getLineWidth: 1.5,
          lineWidthUnits: "pixels",
          getRadius: (d: any) => Math.min(13 + d.properties.point_count, 22),
          radiusUnits: "pixels",
          billboard: true,
          antialiasing: true,
          pickable: true,
          onClick: (info: any) => {
            if (info.object && info.object.properties.cluster) {
              try {
                const clusterId = info.object.properties.cluster_id;
                const pointCount = info.object.properties.point_count;
                const leaves = supercluster.getLeaves(clusterId, pointCount);

                setSelectedPin(null);
                setSelectedCluster({
                  lng: info.object.geometry.coordinates[0],
                  lat: info.object.geometry.coordinates[1],
                  leaves,
                });
              } catch (err) {
                console.error("Unable to fetch cluster leaves:", err);
                setToastMessage("Unable to fetch case data");
                setTimeout(() => setToastMessage(null), 3000);
              }
            }
          },
          onHover: (info: any) => setHoverInfo(info),
        }),

        new TextLayer({
          id: "cluster-text-layer",
          data: clusterNodes,
          getPosition: (d: any) => d.geometry.coordinates,
          getText: (d: any) => d.properties.point_count.toString(),
          getSize: 12,
          getColor: [255, 255, 255, 255],
          getAlignmentBaseline: "center",
          fontFamily: "monospace",
          fontWeight: 700,
          billboard: true,
        })
      );

      // ── 5. Technical Readouts ──
      if (showReadouts) {
        layerList.push(
          new TextLayer({
            id: "hub-title-readouts",
            data: CYBERNETIC_HUBS,
            getPosition: (d: CyberneticHub) => [d.coords[0], d.coords[1] + (isGlobeProjection ? 0.35 : 0.25)],
            getText: (d: CyberneticHub) => `${d.name} • ${d.nodeId}`,
            getSize: 10.5,
            getColor: [255, 255, 255, 255],
            backgroundColor: [3, 7, 18, 220],
            backgroundPadding: [5, 2, 5, 2],
            fontFamily: "monospace",
            fontWeight: 800,
            getAlignmentBaseline: "bottom",
            billboard: true,
            pickable: false,
          }),

          new TextLayer({
            id: "hub-volume-readouts",
            data: CYBERNETIC_HUBS,
            getPosition: (d: CyberneticHub) => [d.coords[0], d.coords[1] + (isGlobeProjection ? 0.15 : 0.1)],
            getText: (d: CyberneticHub) => d.volumeTag,
            getSize: 9,
            getColor: (d: CyberneticHub) => [...d.color, 255] as [number, number, number, number],
            backgroundColor: [3, 7, 18, 220],
            backgroundPadding: [4, 1.5, 4, 1.5],
            fontFamily: "monospace",
            fontWeight: 700,
            getAlignmentBaseline: "bottom",
            billboard: true,
            pickable: false,
          })
        );
      }
    }

    // Selected Pin Path
    layerList.push(
      new PathLayer({
        id: "path-layer",
        data: selectedPinData && selectedPinData.originRoute.length > 1 ? [selectedPinData] : [],
        getPath: (d: any) => d.originRoute.map((p: any) => [p.lng, p.lat]),
        getColor: (d: any) => cachedHexToRgb(getDrugColor(d.drugCategory), 240),
        getWidth: 3.5,
        widthUnits: "pixels",
        dashJustified: true,
        getDashArray: [4, 2],
        extensions: [new PathStyleExtension({ dash: true })],
      })
    );

    return layerList;
  }, [
    unclusteredPoints,
    clusterNodes,
    supercluster,
    selectedPin,
    storeSelectedId,
    storeSelectedType,
    selectedPinData,
    handlePinClick,
    viewMode,
    filteredPins,
    showArcs,
    showReadouts,
    pulseTick,
    isGlobeProjection,
    handleFlyToCoords,
  ]);

  const filteredLogs = useMemo(() => {
    if (intelFilter === "ALL") return intelLogs;
    if (intelFilter === "CRITICAL") return intelLogs.filter((l) => l.severity === "CRITICAL");
    return intelLogs.filter((l) => l.sourceType === intelFilter);
  }, [intelLogs, intelFilter]);

  return (
    <div className="flex h-full flex-col bg-[#02050c] text-slate-200 overflow-hidden font-sans">
      {/* ── 1. Sleek Top Navigation Bar ── */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#060a15] px-4 py-2 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.25)]">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black uppercase tracking-wider text-white">
                Anti-Narcotics Common Operating Picture (COP)
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-2 py-0.2 text-[9.5px] font-bold uppercase text-cyan-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {projection === "3d" ? "3D Globe" : "2D Flat"}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Waveform & Audio SIGINT Stream Indicator */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-lg bg-[#080d1e] border border-cyan-950/60 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span className="font-bold text-slate-300">SIGINT</span>
            <div className="flex items-end gap-0.5 h-3 w-10">
              {[60, 95, 40, 80, 100, 70].map((height, i) => (
                <span
                  key={i}
                  className="w-1 rounded-t-sm bg-cyan-400"
                  style={{ height: `${Math.max(20, (height + Math.sin(pulseTick * 0.2 + i) * 35) % 100)}%` }}
                />
              ))}
            </div>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <span>4.8 MB/s</span>
          <span>128 CH</span>
        </div>

        {/* Top Control Cluster */}
        <div className="flex items-center gap-2">
          {/* Projection Toggle */}
          <div className="flex items-center gap-0.5 rounded-lg bg-[#0c1324] p-0.5 border border-slate-800">
            <button
              onClick={() => handleProjectionChange("2d")}
              className={`rounded px-2 py-1 text-xs font-semibold transition-all ${
                projection === "2d" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400"
              }`}
            >
              2D Flat
            </button>
            <button
              onClick={() => handleProjectionChange("3d")}
              className={`rounded px-2 py-1 text-xs font-semibold transition-all ${
                projection === "3d" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400"
              }`}
            >
              3D Globe
            </button>
          </div>

          {/* Module Drawer Toggles */}
          <div className="flex items-center gap-1 rounded-lg bg-[#0c1324] p-0.5 border border-slate-800">
            <button
              onClick={() => setShowKpiCards((p) => !p)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all ${
                showKpiCards ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>KPIs</span>
            </button>
            <button
              onClick={() => setShowSuspectCarousel((p) => !p)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all ${
                showSuspectCarousel ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Suspects</span>
            </button>
            <button
              onClick={() => setShowIntelFeed((p) => !p)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all ${
                showIntelFeed ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Intel Feed</span>
            </button>
            <button
              onClick={() => setShowRightPanel((p) => !p)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all ${
                showRightPanel ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Forensics</span>
            </button>
          </div>

          {/* Visualization Toggle */}
          <div className="flex items-center gap-0.5 rounded-lg bg-[#0c1324] p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode("cluster")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "cluster" ? "bg-slate-700 text-white" : "text-slate-400"
              }`}
            >
              Corridors
            </button>
            <button
              onClick={() => setViewMode("heatmap")}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "heatmap" ? "bg-rose-600 text-white" : "text-slate-400"
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. On-Demand Suspect Threat Carousel (Drawer Style) ── */}
      {showSuspectCarousel && (
        <div className="relative bg-[#050914] border-b border-slate-800/80 px-4 py-2 shrink-0 z-15 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-rose-400" />
              High-Value Suspect Targets
            </span>
            <button onClick={() => setShowSuspectCarousel(false)} className="text-slate-500 hover:text-slate-300">
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
            {SUSPECT_PROFILES.map((suspect) => (
              <div
                key={suspect.id}
                onClick={() => handleFlyToCoords(suspect.coords[0], suspect.coords[1], 8)}
                className="flex items-center gap-2.5 shrink-0 rounded-lg border border-slate-800 bg-[#090e1c] p-2 hover:border-cyan-500/50 hover:bg-[#0c1428] transition-all cursor-pointer group w-64 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-900 border border-slate-700 text-lg">
                  {suspect.avatarIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate group-hover:text-cyan-400">
                      {suspect.alias}
                    </span>
                    <span className="text-[9px] font-mono text-rose-400 font-bold">{suspect.riskScore}%</span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">{suspect.corridor}</div>
                  <div className="mt-1 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-emerald-400 font-bold">{suspect.interceptVolume}</span>
                    <span className="text-cyan-400">Track ➔</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. On-Demand Top KPI Threat Row (Drawer Style) ── */}
      {showKpiCards && (
        <div className="relative bg-[#050813] border-b border-slate-800/80 shrink-0 z-15 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-2.5 pr-8">
            <div className="rounded-lg border border-rose-900/50 bg-[#0b0e1b] p-2.5 shadow-sm">
              <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Threat Level</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-black text-rose-400">CRITICAL</span>
                <span className="text-[10px] font-mono text-rose-300">SEV-1</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#080d1a] p-2.5 shadow-sm">
              <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Entities Resolved</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-black text-white font-mono">1,428</span>
                <span className="text-[10px] font-mono text-emerald-400">+188</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#080d1a] p-2.5 shadow-sm">
              <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Supply Corridors</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-black text-amber-400 font-mono">38 Routes</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#080d1a] p-2.5 shadow-sm">
              <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Court Dossiers</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-black text-white font-mono">19 Dossiers</span>
                <span className="text-[9.5px] font-mono text-emerald-400">Sec 65B</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowKpiCards(false)}
            className="absolute top-2.5 right-2.5 text-slate-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── 4. Hero Map Container with Spacious Full-Screen Viewport ── */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="relative flex-1 bg-[#010309] overflow-hidden">
          {/* Volumetric Atmospheric Cyan Rim */}
          {isGlobeProjection && (
            <div
              className="absolute inset-0 pointer-events-none z-[1]"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0, 240, 255, 0.1) 0%, rgba(6, 18, 48, 0.4) 40%, rgba(2, 6, 18, 0.95) 75%, #010309 100%)",
              }}
            />
          )}

          {isClient && (
            <DeckGL
              views={isGlobeProjection ? new GlobeView({ id: "globe" }) : undefined}
              layers={layers}
              viewState={viewState}
              onViewStateChange={(e: any) => {
                if (e.viewState) {
                  setViewState((prev) => ({
                    ...prev,
                    ...e.viewState,
                  }));
                }
              }}
              controller={true}
              getCursor={({ isDragging, isHovering }: any) =>
                isDragging ? "grabbing" : isHovering || hoverInfo?.object ? "pointer" : "grab"
              }
            >
              {!isGlobeProjection && (
                <Map
                  mapStyle={darkTacticalMapStyle as any}
                  reuseMaps
                >
                  <NavigationControl position="bottom-right" />
                  <FullscreenControl position="bottom-right" />

                  {selectedPinData && (
                    <Popup
                      longitude={selectedPinData.lng}
                      latitude={selectedPinData.lat}
                      anchor="bottom"
                      onClose={handleCloseDrawer}
                      closeOnClick={false}
                      className="z-50"
                      offset={40}
                      maxWidth="300px"
                    >
                      <div className="bg-[#070c18] text-slate-200 border border-slate-700 rounded-lg shadow-2xl p-3 w-64">
                        <div className="flex flex-col mb-2 pb-1.5 border-b border-slate-700/50">
                          <span className="text-white font-bold text-xs">{selectedPinData.label}</span>
                          <span className="text-[11px] text-slate-400">{selectedPinData.details}</span>
                        </div>
                        <button
                          onClick={() => openDossier(selectedPinData.entityId || selectedPinData.id)}
                          className="w-full rounded bg-cyan-600/20 text-cyan-400 py-1 text-xs font-bold uppercase hover:bg-cyan-600/30 border border-cyan-500/30"
                        >
                          View Dossier
                        </button>
                      </div>
                    </Popup>
                  )}
                </Map>
              )}

              {/* Tactical Tooltip */}
              {hoverInfo && hoverInfo.object && (
                <div
                  className="pointer-events-none absolute z-40 rounded-xl border border-cyan-500/40 bg-[#070d1e]/95 p-3 text-xs shadow-2xl backdrop-blur-md font-mono w-64"
                  style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
                >
                  {hoverInfo.layer.id.includes("cybernetic-hubs") ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <strong className="text-cyan-300 text-[10.5px] truncate">
                          {hoverInfo.object.name}
                        </strong>
                        <span className="text-[9px] font-bold text-rose-400">{hoverInfo.object.threatLevel}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-sans">{hoverInfo.object.syndicate}</div>
                      <div className="grid grid-cols-2 gap-1.5 bg-[#040813] p-1.5 rounded text-[9.5px]">
                        <div>
                          <span className="text-slate-500 block">CONNECTED LABS</span>
                          <span className="text-amber-400 font-bold">{hoverInfo.object.connectedLabs || 3}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">RISK SCORE</span>
                          <span className="text-rose-400 font-bold">{hoverInfo.object.riskScore || 92}</span>
                        </div>
                      </div>
                    </div>
                  ) : hoverInfo.layer.id.includes("vehicle-transit") || hoverInfo.layer.id.includes("heavy-corridors") ? (
                    <div className="space-y-1">
                      <div className="text-cyan-400 font-bold text-[10.5px]">
                        {hoverInfo.object.transitType === "maritime" ? "🚢 Maritime Route" : "🚛 Overland Route"}
                      </div>
                      <div className="text-white text-xs font-bold">{hoverInfo.object.name}</div>
                      <div className="text-amber-400 text-[10px]">
                        Payload: {hoverInfo.object.volume} ({hoverInfo.object.category})
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-white">{hoverInfo.object.properties?.label || hoverInfo.object.label}</strong>
                    </div>
                  )}
                </div>
              )}
            </DeckGL>
          )}

          {/* ── Compact Floating Search Bar ── */}
          <div className="absolute top-4 left-4 z-[10] flex items-center gap-2 rounded-lg bg-[#070c18]/90 px-3 py-1.5 shadow-xl ring-1 ring-slate-800 backdrop-blur-md">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search hubs, ports, syndicates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-48 bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>

          {/* ── On-Demand Floating Live Intel Feed (Left Side) ── */}
          {showIntelFeed && (
            <div className="absolute top-14 left-4 z-[10] w-76 max-h-[380px] rounded-xl border border-slate-800 bg-[#070c18]/95 p-3 shadow-2xl backdrop-blur-md flex flex-col animate-in fade-in slide-in-from-left-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white">Live Intel Stream</span>
                </div>
                <button onClick={() => setShowIntelFeed(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1 mb-2">
                {(["ALL", "CRITICAL", "SIGINT"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setIntelFilter(f)}
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      intelFilter === f ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-xs font-mono">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => handleFlyToCoords(log.coords[0], log.coords[1], 8)}
                    className="p-1.5 rounded bg-[#040813] border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                      <span className="text-cyan-400">{log.time}</span>
                      <span className={log.severity === "CRITICAL" ? "text-rose-400" : "text-amber-400"}>
                        {log.sourceType}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-200 font-sans leading-tight group-hover:text-cyan-300">
                      {log.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Viewport Zoom & Reset Controls ── */}
          <div className="absolute bottom-6 right-6 z-[10] flex flex-col items-center gap-1 rounded-lg border border-slate-800/90 bg-[#070c18]/90 p-1 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => handleZoom("in")}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleZoom("out")}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="h-px w-full bg-slate-800 my-0.5" />
            <button
              onClick={handleResetView}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── Compact Bottom-Left Legend ── */}
          {showLegend && (
            <div className="absolute bottom-6 left-6 z-[5] w-64 rounded-xl border border-slate-800/90 bg-[#070c18]/95 p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">Corridors Legend</span>
                <button onClick={() => setShowLegend(false)} className="text-slate-500 hover:text-slate-300">
                  <EyeOff className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-1 text-[10px] text-slate-300 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[#FF1E56]" />
                  <span>Critical Route (&gt;500 kg Fentanyl)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[#00F0FF]" />
                  <span>Active Route (100–500 kg Meth)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[#32FF7E]" />
                  <span>Maritime Route (820 kg Cargo)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[#BE28FF]" />
                  <span>Precursor Synthesis Lab</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[9.5px] text-slate-400">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArcs}
                    onChange={(e) => setShowArcs(e.target.checked)}
                    className="rounded bg-slate-900 text-cyan-500 focus:ring-0 h-3 w-3"
                  />
                  <span>Energy Arcs</span>
                </label>
                <button
                  onClick={() => setViewMode(viewMode === "cluster" ? "heatmap" : "cluster")}
                  className="text-cyan-400 hover:underline font-bold"
                >
                  {viewMode === "cluster" ? "Heatmap" : "Clusters"}
                </button>
              </div>
            </div>
          )}

          {!showLegend && (
            <button
              onClick={() => setShowLegend(true)}
              className="absolute bottom-6 left-6 z-[5] rounded-lg border border-slate-800 bg-[#070c18]/90 px-2.5 py-1 text-xs font-bold text-cyan-400 shadow-xl backdrop-blur-md"
            >
              <Eye className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* ── 5. Slide-Out Forensic Operations Drawer (Right Side) ── */}
        {showRightPanel ? (
          <div className="w-full lg:w-[380px] flex flex-col bg-[#060a15]/95 backdrop-blur-xl shrink-0 overflow-y-auto custom-scrollbar border-l border-slate-800/80 animate-in fade-in slide-in-from-right-4 duration-150">
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-[#080d1c]">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00d4ff]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">Forensic Operations</h2>
              </div>
              <button onClick={() => setShowRightPanel(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Accordion */}
            <div className="divide-y divide-slate-800 text-xs">
              <div>
                <button
                  onClick={() => setRightAccordion((p) => (p === "operations" ? "dossiers" : "operations"))}
                  className="w-full flex items-center justify-between p-2.5 bg-[#070c18] font-bold text-slate-200"
                >
                  <span>1. Active Syndicates</span>
                  {rightAccordion === "operations" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {rightAccordion === "operations" && (
                  <div className="p-2 space-y-1.5 bg-[#040711]">
                    {CYBERNETIC_HUBS.map((hub) => (
                      <div
                        key={hub.id}
                        onClick={() => handleFlyToCoords(hub.coords[0], hub.coords[1], 8)}
                        className="p-2 rounded bg-[#080d1e] border border-slate-800 hover:border-cyan-500/40 cursor-pointer"
                      >
                        <div className="flex justify-between font-bold text-[11px] text-white">
                          <span>{hub.name}</span>
                          <span className="text-rose-400">{hub.threatLevel}</span>
                        </div>
                        <div className="text-[9.5px] text-slate-400">{hub.volumeTag}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setRightAccordion((p) => (p === "dossiers" ? "operations" : "dossiers"))}
                  className="w-full flex items-center justify-between p-2.5 bg-[#070c18] font-bold text-slate-200"
                >
                  <span>2. Merkle Ledger Audit</span>
                  {rightAccordion === "dossiers" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {rightAccordion === "dossiers" && (
                  <div className="p-2.5 bg-[#040711] font-mono text-[10.5px] space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span>ROOT HASH:</span>
                      <button
                        onClick={() => handleCopyHash("7f8a9e4b1c2d0f3e9a2b3c4d5e6f7a8b")}
                        className="text-emerald-400 hover:underline"
                      >
                        0x7F8A...E8B {copiedHash && "✓"}
                      </button>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>SEC 65B:</span>
                      <span className="text-cyan-300 font-bold">CERTIFIED</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setRightAccordion((p) => (p === "analytics" ? "operations" : "analytics"))}
                  className="w-full flex items-center justify-between p-2.5 bg-[#070c18] font-bold text-slate-200"
                >
                  <span>3. Volume vs Density Trend</span>
                  {rightAccordion === "analytics" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {rightAccordion === "analytics" && (
                  <div className="p-2.5 bg-[#040711]">
                    <div className="h-40 w-full rounded border border-slate-800 bg-[#030610] p-1.5">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={historicalTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 9 }} />
                          <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fontSize: 9 }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#00d4ff" tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={{ backgroundColor: "#0a0f1d", fontSize: "10px" }} />
                          <Bar yAxisId="left" dataKey="volumeKg" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={14} />
                          <Line yAxisId="right" type="monotone" dataKey="graphDensity" stroke="#00d4ff" strokeWidth={1.5} dot={{ r: 2 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setRightAccordion((p) => (p === "actions" ? "operations" : "actions"))}
                  className="w-full flex items-center justify-between p-2.5 bg-[#070c18] font-bold text-slate-200"
                >
                  <span>4. Quick Dispatch Actions</span>
                  {rightAccordion === "actions" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {rightAccordion === "actions" && (
                  <div className="p-2 bg-[#040711] space-y-1.5">
                    <button
                      onClick={() => {
                        setToastMessage("🚨 Taskforce Intercept Order Dispatched");
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="w-full py-1.5 rounded bg-rose-600/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold uppercase"
                    >
                      Dispatch Intercept Team
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Timeline Scrubbing */}
            <div className="p-3 mt-auto border-t border-slate-800 bg-[#080d1c] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-[10px] uppercase">Timeline Scrubbing</span>
                <button
                  onClick={isPlaying ? stopPlayback : startPlayback}
                  className="p-1 rounded bg-cyan-500/20 text-cyan-400"
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
              </div>
              <div className="relative h-4">
                <div className="absolute left-0 right-0 top-1.5 h-1 rounded bg-slate-800" />
                <div
                  className="absolute top-1.5 h-1 rounded bg-cyan-500"
                  style={{
                    left: `${(sliderValue[0] / Math.max(allDateRange.length - 1, 1)) * 100}%`,
                    right: `${100 - (sliderValue[1] / Math.max(allDateRange.length - 1, 1)) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={allDateRange.length - 1}
                  value={sliderValue[0]}
                  onChange={(e) => handleSliderChange(e, "start")}
                  className="absolute left-0 right-0 top-0 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                  style={{ zIndex: 3 }}
                />
                <input
                  type="range"
                  min={0}
                  max={allDateRange.length - 1}
                  value={sliderValue[1]}
                  onChange={(e) => handleSliderChange(e, "end")}
                  className="absolute left-0 right-0 top-0 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                  style={{ zIndex: 4 }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>{formatShortDate(dateRange[0])}</span>
                <span>{formatShortDate(dateRange[1])}</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowRightPanel(true)}
            title="Open Forensics Panel"
            className="absolute top-1/2 right-0 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 rounded-l-lg border-y border-l border-cyan-500/40 bg-[#080d1c]/95 py-3 px-1.5 text-cyan-400 shadow-xl backdrop-blur-md hover:bg-slate-900"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="[writing-mode:vertical-lr] text-[9.5px] font-bold uppercase tracking-widest font-mono text-slate-300">
              Forensics
            </span>
          </button>
        )}
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-cyan-500/40 bg-[#080d1e]/95 px-4 py-2 text-xs font-bold text-cyan-300 shadow-2xl backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
