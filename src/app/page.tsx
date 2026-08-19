"use client";

import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/views/Dashboard";
import MapView from "@/components/views/MapView";
import EvidenceGraph from "@/components/views/EvidenceGraph";
import InvestigationManager from "@/components/views/InvestigationManager";
import EntityResolution from "@/components/views/EntityResolution";
import TimelineReconstructor from "@/components/views/TimelineReconstructor";
import IntelligenceDossier from "@/components/views/IntelligenceDossier";
import MovementTracker from "@/components/views/MovementTracker";
import ReportInvestigations from "@/components/views/ReportInvestigations";
import ReportListings from "@/components/views/ReportListings";
import ReportFinancial from "@/components/views/ReportFinancial";
import ReportAlerts from "@/components/views/ReportAlerts";
import { useAppStore } from "@/lib/store";

export type ViewType = "dashboard" | "map" | "evidence" | "investigations" | "entity-resolution" | "timeline-reconstructor" | "dossier" | "movement-tracker" | "report-investigations" | "report-listings" | "report-financial" | "report-alerts";

export default function Home() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      case "map":
        return <MapView />;
      case "evidence":
        return <EvidenceGraph />;
      case "investigations":
        return <InvestigationManager />;
      case "entity-resolution":
        return <EntityResolution />;
      case "timeline-reconstructor":
        return <TimelineReconstructor />;
      case "movement-tracker":
        return <MovementTracker />;
      case "dossier":
        return <IntelligenceDossier />;
      case "report-investigations":
        return <ReportInvestigations />;
      case "report-listings":
        return <ReportListings />;
      case "report-financial":
        return <ReportFinancial />;
      case "report-alerts":
        return <ReportAlerts />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)]">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

