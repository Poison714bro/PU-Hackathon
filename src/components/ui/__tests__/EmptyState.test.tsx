import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "../EmptyState";
import { Database } from "lucide-react";

describe("EmptyState Component", () => {
  it("renders with title and description", () => {
    render(
      <EmptyState
        title="No Results Found"
        description="Try adjusting your search filters."
      />
    );

    expect(screen.getByText("No Results Found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search filters.")).toBeInTheDocument();
  });

  it("renders the default icon if none is provided", () => {
    const { container } = render(
      <EmptyState title="Default" description="Testing default icon" />
    );
    // Lucide search icon is the default, SVG is rendered
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders a custom icon when provided", () => {
    const { container } = render(
      <EmptyState
        icon={Database}
        title="Custom Icon"
        description="Testing custom icon"
      />
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains("lucide-database")).toBeTruthy();
  });

  it("renders the action button when provided", () => {
    render(
      <EmptyState
        title="Action Test"
        description="Testing action button"
        action={<button>Click Me</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Click Me" })).toBeInTheDocument();
  });
});
