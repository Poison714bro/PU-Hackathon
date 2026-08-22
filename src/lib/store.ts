import { create } from "zustand";
import { setTokenAccessor } from "./apiClient";

export interface FilterState {
  drugCategories: Set<string>;
  sourceStreams: Set<string>;
  dateRange: [string, string];
  riskRange: [number, number];
  suspectRoles: Set<string>;
  contactMethods: Set<string>;
}

export type ClearanceLevel = 1 | 2 | 3;

export interface User {
  id: string;
  username: string;
  email: string;
  clearanceLevel: ClearanceLevel;
  role: "Agent" | "Analyst" | "Admin";
}

export interface AppState {
  // Auth state
  isAuthenticated: boolean;
  currentUser: User | null;
  token: string | null;

  // Selected entity (cross-view sync)
  selectedEntityId: string | null;
  selectedEntityType: "pin" | "node" | null;
  highlightedIds: string[];

  activeEntityId: string | null;

  // View navigation
  activeView: "dashboard" | "map" | "evidence" | "investigations" | "entity-resolution" | "timeline-reconstructor" | "dossier" | "movement-tracker" | "report-investigations" | "report-listings" | "report-financial" | "report-alerts";

  // Search
  searchQuery: string;

  // Filters
  filters: FilterState;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string | null) => void;
  selectEntity: (id: string, type: "pin" | "node", linkedIds?: string[]) => void;
  clearSelection: () => void;
  setActiveView: (view: AppState["activeView"]) => void;
  setSearchQuery: (query: string) => void;
  navigateToEntity: (id: string, type: "pin" | "node", view: AppState["activeView"]) => void;
  openDossier: (entityId: string) => void;

  // Filter actions
  toggleDrugCategory: (name: string) => void;
  toggleSourceStream: (source: string) => void;
  setOnlyDrugCategory: (name: string) => void;
  setOnlySourceStream: (source: string) => void;
  setDateRange: (range: [string, string]) => void;
  setRiskRange: (range: [number, number]) => void;
  toggleSuspectRole: (role: string) => void;
  toggleContactMethod: (method: string) => void;
  resetFilters: () => void;
}

const ALL_DRUG_CATEGORIES = new Set([
  "Opioids/Fentanyl",
  "Stimulants",
  "Cannabis",
  "Psychedelics",
  "Prescription/Other",
]);

const ALL_SUSPECT_ROLES = new Set(["buyer", "dealer", "supplier", "courier"]);
const ALL_CONTACT_METHODS = new Set(["encrypted", "in-person", "phone", "darknet"]);
const ALL_SOURCE_STREAMS = new Set(["Darknet", "Blockchain", "Encrypted", "OSINT"]);

const defaultFilters: FilterState = {
  drugCategories: new Set(ALL_DRUG_CATEGORIES),
  sourceStreams: new Set(ALL_SOURCE_STREAMS),
  dateRange: ["2026-08-01", "2026-08-17"],
  riskRange: [0, 100],
  suspectRoles: new Set(ALL_SUSPECT_ROLES),
  contactMethods: new Set(ALL_CONTACT_METHODS),
};

export const useAppStore = create<AppState>((set, get) => {
  // Wire up the token accessor so apiClient can read the JWT without
  // creating a circular import with the store module.
  setTokenAccessor(() => get().token);

  return {
    isAuthenticated: false,
    currentUser: null,
    token: null,
    selectedEntityId: null,
    selectedEntityType: null,
    activeEntityId: null,
    highlightedIds: [],
    activeView: "dashboard",
    searchQuery: "",
    filters: { ...defaultFilters },

    login: (user, token) => set({ isAuthenticated: true, currentUser: user, token }),
    logout: () => set({ isAuthenticated: false, currentUser: null, token: null, activeView: "dashboard" }),
    setToken: (token) => set({ token }),

    selectEntity: (id, type, linkedIds = []) =>
      set({
        selectedEntityId: id,
        selectedEntityType: type,
        highlightedIds: linkedIds,
      }),

    clearSelection: () =>
      set({
        selectedEntityId: null,
        selectedEntityType: null,
        highlightedIds: [],
      }),

    setActiveView: (view) => set({ activeView: view }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    navigateToEntity: (id, type, view) =>
      set({
        selectedEntityId: id,
        selectedEntityType: type,
        activeView: view,
      }),

    openDossier: (entityId) => set({ activeEntityId: entityId, activeView: "dossier" }),

    toggleDrugCategory: (name) =>
      set((state) => {
        const next = new Set(state.filters.drugCategories);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return { filters: { ...state.filters, drugCategories: next } };
      }),

    setOnlyDrugCategory: (name) =>
      set((state) => ({
        filters: { ...state.filters, drugCategories: new Set([name]) },
        activeView: "dashboard",
      })),

    toggleSourceStream: (source) =>
      set((state) => {
        const next = new Set(state.filters.sourceStreams);
        if (next.has(source)) next.delete(source);
        else next.add(source);
        return { filters: { ...state.filters, sourceStreams: next } };
      }),

    setOnlySourceStream: (source) =>
      set((state) => ({
        filters: { ...state.filters, sourceStreams: new Set([source]) },
        activeView: "dashboard",
      })),

    setDateRange: (range) =>
      set((state) => ({
        filters: { ...state.filters, dateRange: range },
      })),

    setRiskRange: (range) =>
      set((state) => ({
        filters: { ...state.filters, riskRange: range },
      })),

    toggleSuspectRole: (role) =>
      set((state) => {
        const next = new Set(state.filters.suspectRoles);
        if (next.has(role)) next.delete(role);
        else next.add(role);
        return { filters: { ...state.filters, suspectRoles: next } };
      }),

    toggleContactMethod: (method) =>
      set((state) => {
        const next = new Set(state.filters.contactMethods);
        if (next.has(method)) next.delete(method);
        else next.add(method);
        return { filters: { ...state.filters, contactMethods: next } };
      }),

    resetFilters: () => set({ filters: { ...defaultFilters } }),
  };
});

