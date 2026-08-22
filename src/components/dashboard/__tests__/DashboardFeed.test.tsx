import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DashboardFeed } from "../DashboardFeed";
import { useAppStore } from "@/lib/store";

// Mock the Zustand store
vi.mock("@/lib/store", () => ({
  useAppStore: vi.fn(),
}));

describe("DashboardFeed Component", () => {
  const mockFeed = [
    {
      id: "feed-1",
      source: "Blockchain Explorer",
      sourceType: "blockchain",
      entityId: "wallet-abc",
      timestamp: new Date().toISOString(),
      category: "financial",
      summary: "Transfer of 10 BTC",
    },
    {
      id: "feed-2",
      source: "Telegram Channel",
      sourceType: "encrypted",
      entityId: "user-xyz",
      timestamp: new Date().toISOString(),
      category: "communication",
      summary: "Message about meetup",
    },
  ];

  it("renders the feed rows correctly", () => {
    (useAppStore as any).mockReturnValue(vi.fn());
    render(<DashboardFeed feed={mockFeed as any} />);
    
    // Check sources
    expect(screen.getByText("Blockchain Explorer")).toBeInTheDocument();
    expect(screen.getByText("Telegram Channel")).toBeInTheDocument();
    
    // Check entities
    expect(screen.getByText("wallet-abc")).toBeInTheDocument();
    expect(screen.getByText("user-xyz")).toBeInTheDocument();
    
    // Check categories
    expect(screen.getByText("financial")).toBeInTheDocument();
    expect(screen.getByText("communication")).toBeInTheDocument();
  });

  it("calls openDossier when a row is clicked", () => {
    const mockOpenDossier = vi.fn();
    (useAppStore as any).mockReturnValue(mockOpenDossier);
    
    const { container } = render(<DashboardFeed feed={mockFeed as any} />);
    
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
    
    // Click the first row
    fireEvent.click(rows[0]);
    expect(mockOpenDossier).toHaveBeenCalledWith("wallet-abc");
    
    // Click the second row
    fireEvent.click(rows[1]);
    expect(mockOpenDossier).toHaveBeenCalledWith("user-xyz");
  });
});
