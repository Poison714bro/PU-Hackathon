/**
 * Centralized API Client for NEXUS Cyber-Intelligence Platform.
 *
 * All frontend components should import from this module instead of
 * calling fetch() directly. The client automatically:
 *   - Prefixes the backend base URL
 *   - Injects the JWT Bearer token from the Zustand store
 *   - Unwraps the { success, data } envelope the backend returns
 *   - Returns typed responses with loading/error state helpers
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiEnvelope<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  };
  meta?: {
    timestamp: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ApiResult<T = any> {
  ok: boolean;
  data: T | null;
  error: string | null;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Dashboard types
export interface KpiData {
  activeTargets: number;
  highRiskAlerts: number;
  cryptoVolumeUSD: number;
  openInvestigations: number;
  globalArrestsEuropolContext: number;
  interceptedListings: number;
  networkTrendRate: string;
}

export interface ChartData {
  weeklyActivity: Array<{ date: string; transactions: number; alerts: number }>;
  drugDistribution: Array<{ name: string; count: number; color: string }>;
}

export interface FeedItem {
  id: string;
  timestamp: string;
  source: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  summary: string;
  entityId?: string;
  rawSnippet: string;
}

// Intelligence types
export interface CryptoWallet {
  address: string;
  currency: "BTC" | "XMR" | "ETH";
  balanceUSD: number;
  isPrimary: boolean;
}

export interface IntelEntity {
  id: string;
  primaryAlias: string;
  category: string;
  colorHex: string;
  riskScore: number;
  status: string;
  firstSeen: string;
  lastActive: string;
  sources: string[];
  identifiers: {
    cryptoWallets: CryptoWallet[];
    pgpKeyFingerprint: { keyId: string; fingerprint: string; verified: boolean };
    encryptedHandles: Array<{ platform: string; handle: string }>;
    knownAliases: Array<{ alias: string; platform: string; firstSeen: string }>;
  };
  summary: string;
}

export interface DossierData {
  entity: IntelEntity;
  threatScore: number;
  classification: string;
  timeline: any[];
  geospatialActivity: any[];
  activeInvestigations: any[];
  legalChainOfCustody: {
    sha256DossierHash: string;
    lastAccessed: string;
    authorizedJurisdiction: string;
  };
}

// Map types
export interface MapPinApi {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  drugCategory: string;
  riskScore: number;
  entityId: string;
  date: string;
  label: string;
  quantityEst: string;
  sourceType: string;
}

// Graph types
export interface GraphNodeApi {
  id: string;
  label: string;
  type: "suspect" | "wallet" | "comms" | "pgp" | "market";
  riskScore?: number;
  category?: string;
  status?: string;
  walletBalance?: string;
  details?: Record<string, any>;
}

export interface GraphEdgeApi {
  id: string;
  source: string;
  target: string;
  label: string;
  strength?: number;
}

export interface GraphTopology {
  nodes: GraphNodeApi[];
  edges: GraphEdgeApi[];
}

// Tracker types
export interface TrackerEntityApi {
  id: string;
  date: string;
  alias: string;
  category: string;
  risk: number;
  status: string;
  source: string;
  platform: string;
  evidence: string;
  wallet: string;
  pgp: string;
  comms: string;
  location: string;
  lat: number;
  lng: number;
}

// Investigation types
export interface KanbanCardApi {
  id: string;
  title: string;
  entityId: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  assignedAgent: string;
  updatedAt: string;
  summary: string;
  stage: string;
}

export interface KanbanColumnApi {
  id: string;
  title: string;
  cards: KanbanCardApi[];
}

// Report types
export interface InvestigationReport {
  caseId: string;
  target: string;
  agent: string;
  risk: string;
  status: string;
  updated: string;
}

export interface FinancialReport {
  sankeyStages: Array<{
    label: string;
    color: string;
    items: string[];
    totalBTC: number;
  }>;
  ledger: Array<{
    date: string;
    txHash: string;
    amountBTC: number;
    usd: number;
    owner: string;
    direction: string;
  }>;
}

export interface ListingReport {
  id: string;
  vendor: string;
  title: string;
  priceUSD: number;
  priceBTC: number;
  platform: string;
  category: string;
  flag: string;
  scraped: string;
}

export interface AlertItemApi {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  payload: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
}

// Search types
export interface SearchResultApi {
  id: string;
  label: string;
  type: "pin" | "node" | "case" | "entity";
  category: string;
  view: "map" | "evidence" | "investigations" | "dossier";
}

// Reconstruct types
export interface ReconstructResult {
  entityId: string;
  primaryAlias: string;
  riskScore: number;
  status: string;
  financialProfile: {
    totalVolumeUSD: number;
    peakOperationPeriod: string;
    genesisDate: string;
    coinJoinRounds: number;
    isFallback?: boolean;
  };
}

// Auth types
export interface AuthLoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export interface AliasMatch {
  aliasA: string;
  aliasB: string;
  similarity: number;
  matchingSignals: string[];
  status: "Verified" | "Probable" | "Investigating";
}

// ---------------------------------------------------------------------------
// Token accessor — lazily imported to avoid circular deps with Zustand store
// ---------------------------------------------------------------------------

let _getToken: (() => string | null) | null = null;

export function setTokenAccessor(fn: () => string | null): void {
  _getToken = fn;
}

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const BASE_URL: string =
  (typeof window !== "undefined" &&
    (window as any).__NEXT_PUBLIC_API_BASE_URL) ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/api/v1";

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function request<T>(
  method: string,
  path: string,
  body?: any,
  query?: Record<string, string | number | undefined>
): Promise<ApiResult<T>> {
  try {
    // Build query string
    let url = `${BASE_URL}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") {
          params.set(k, String(v));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = _getToken ? _getToken() : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle non-JSON responses
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      if (!res.ok) {
        return { ok: false, data: null, error: `HTTP ${res.status}: ${res.statusText}` };
      }
      return { ok: true, data: null, error: null };
    }

    const json: ApiEnvelope<T> = await res.json();

    if (json.success) {
      return {
        ok: true,
        data: json.data ?? null,
        error: null,
        pagination: json.meta?.pagination,
      };
    }

    return {
      ok: false,
      data: null,
      error: json.error?.message || `HTTP ${res.status}`,
    };
  } catch (err: any) {
    console.error(`[API Client] Network or parsing error for ${method} ${path}:`, err);
    return {
      ok: false,
      data: null,
      error: err.message || "Network error",
    };
  }
}

// ---------------------------------------------------------------------------
// API Namespace
// ---------------------------------------------------------------------------

export const api = {
  // ── Auth ──
  auth: {
    login: (username: string, password: string) =>
      request<AuthLoginResponse>("POST", "/auth/login", { username, password }),

    me: () => request<{ user: AuthLoginResponse["user"] }>("GET", "/auth/me"),

    logout: () => request<{ message: string }>("POST", "/auth/logout"),
  },

  // ── Dashboard ──
  dashboard: {
    kpis: () => request<KpiData>("GET", "/dashboard/kpis"),

    feed: (filters?: {
      source?: string;
      category?: string;
      severity?: string;
      limit?: number;
      page?: number;
    }) =>
      request<FeedItem[]>("GET", "/dashboard/feed", undefined, filters as any),

    charts: () => request<ChartData>("GET", "/dashboard/charts"),

    drugDetails: (category: string) =>
      request<{ name: string; count: number }[]>("GET", "/dashboard/drug-details", undefined, { category }),
  },

  // ── Intelligence ──
  intelligence: {
    entities: (filters?: {
      category?: string;
      status?: string;
      riskMin?: number;
    }) =>
      request<IntelEntity[]>(
        "GET",
        "/intelligence/entities",
        undefined,
        filters as any
      ),

    entity: (id: string) =>
      request<IntelEntity>("GET", `/intelligence/entities/${encodeURIComponent(id)}`),

    dossier: (id: string) =>
      request<DossierData>(
        "GET",
        `/intelligence/entities/${encodeURIComponent(id)}/dossier`
      ),

    timeline: (entityId: string) =>
      request<any[]>(
        "GET",
        `/intelligence/timeline/${encodeURIComponent(entityId)}`
      ),

    aliasMatches: () => request<AliasMatch[]>("GET", "/intelligence/alias-matches"),
  },

  // ── Map ──
  map: {
    pins: (filters?: {
      drugCategory?: string;
      riskMin?: number;
      riskMax?: number;
      sourceType?: string;
      startDate?: string;
      endDate?: string;
    }) =>
      request<MapPinApi[]>("GET", "/map/pins", undefined, filters as any),
  },

  // ── Graph ──
  graph: {
    topology: (entityId?: string) =>
      request<GraphTopology>(
        "GET",
        entityId ? `/network/${encodeURIComponent(entityId)}` : "/network/default"
      ),
  },

  // ── Tracker ──
  tracker: {
    list: (filters?: {
      q?: string;
      category?: string;
      status?: string;
      limit?: number;
      page?: number;
    }) =>
      request<TrackerEntityApi[]>("GET", "/tracker", undefined, filters as any),
  },

  // ── Investigations ──
  investigations: {
    list: () => request<KanbanColumnApi[]>("GET", "/investigations"),

    update: (
      id: string,
      body: { stage?: string; priority?: string; assignedAgent?: string }
    ) => request<KanbanCardApi>("PATCH", `/investigations/${encodeURIComponent(id)}`, body),
  },

  // ── Reports ──
  reports: {
    investigations: () =>
      request<InvestigationReport[]>("GET", "/reports/investigations"),

    financial: () => request<FinancialReport>("GET", "/reports/financial"),

    listings: () => request<ListingReport[]>("GET", "/reports/listings"),

    alerts: () => request<AlertItemApi[]>("GET", "/reports/alerts"),

    acknowledgeAlert: (id: string) =>
      request<AlertItemApi>(
        "PATCH",
        `/reports/alerts/${encodeURIComponent(id)}/acknowledge`
      ),
  },

  // ── Search ──
  search: (q: string) =>
    request<SearchResultApi[]>("GET", "/search/", undefined, { keyword: q }),

  // ── Reconstruct (Timeline) ──
  reconstruct: (query: string) =>
    request<ReconstructResult>("POST", "/reconstruct", { query }),
};
