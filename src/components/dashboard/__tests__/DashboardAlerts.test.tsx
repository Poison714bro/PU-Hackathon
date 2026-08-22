import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardAlerts } from "../DashboardAlerts";

describe("DashboardAlerts Component", () => {
  const mockAlerts = [
    {
      id: "alert-1",
      title: "Suspicious Large Transfer",
      description: "A transfer of 50 BTC was detected.",
      severity: "critical",
      timestamp: new Date().toISOString(),
      source: "Blockchain Analysis",
      acknowledged: false,
    },
    {
      id: "alert-2",
      title: "New Vendor Account",
      description: "Vendor 'Alpha' registered.",
      severity: "medium",
      timestamp: new Date().toISOString(),
      source: "Darknet Monitor",
      acknowledged: true,
    },
  ];

  it("renders the active alerts tally correctly", () => {
    render(<DashboardAlerts alertsData={mockAlerts} />);
    // 1 active out of 2 total
    expect(screen.getByText("1 Active")).toBeInTheDocument();
  });

  it("renders alert titles and severities", () => {
    render(<DashboardAlerts alertsData={mockAlerts} />);
    
    expect(screen.getByText("Suspicious Large Transfer")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
    
    expect(screen.getByText("New Vendor Account")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
  });

  it("applies opacity-60 to acknowledged alerts", () => {
    const { container } = render(<DashboardAlerts alertsData={mockAlerts} />);
    const alertItems = container.querySelectorAll(".cursor-pointer");
    
    expect(alertItems.length).toBe(2);
    // The second alert is acknowledged, should have opacity-60
    expect(alertItems[1].classList.contains("opacity-60")).toBe(true);
    // The first is not acknowledged
    expect(alertItems[0].classList.contains("opacity-60")).toBe(false);
  });
});
