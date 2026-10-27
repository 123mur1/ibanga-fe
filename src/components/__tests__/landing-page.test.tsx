
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { useIbanga } from "@/lib/store";
import { LandingPage } from "../landing-page";

type LandingPageStore = Pick<ReturnType<typeof useIbanga>, "trucks" | "bookings">;

const mockUseIbanga = vi.hoisted(() => vi.fn<() => LandingPageStore>());

// Replace the real store with controlled test data.
vi.mock("@/lib/store", () => ({
  useIbanga: mockUseIbanga,
}));

// Keep this test focused on the landing page, not child components.
vi.mock("../public-navbar", () => ({
  PublicNavbar: () => <nav>iBanga navigation</nav>,
}));

vi.mock("../truck-card", () => ({
  TruckCard: ({ truck }: { truck: { plateNumber: string } }) => (
    <article>{truck.plateNumber}</article>
  ),
}));

const availableTruck = {
  id: "truck-1",
  ownerId: "owner-1",
  plateNumber: "RAB 123A",
  truckType: "Flatbed",
  capacity: 30,
  priceRwf: 1_500_000,
  currentLocation: "Kigali",
  preferredRoute: "Kigali - Mombasa",
  description: "A truck for cargo transport",
  status: "AVAILABLE" as const,
  photos: [],
};

const unavailableTruck = {
  ...availableTruck,
  id: "truck-2",
  plateNumber: "RAB 456B",
  status: "UNAVAILABLE" as const,
};

beforeEach(() => {
  mockUseIbanga.mockReturnValue({
    trucks: [availableTruck, unavailableTruck],
    bookings: [],
  });
});

afterEach(() => {
  cleanup();
});

describe("LandingPage", () => {
  it("displays the main homepage heading", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: "The right truck for every journey.",
      }),
    ).toBeInTheDocument();
  });

  it("shows available trucks but hides unavailable trucks", () => {
    render(<LandingPage />);

    expect(screen.getAllByText("RAB 123A")).toHaveLength(1);
    expect(screen.queryByText("RAB 456B")).not.toBeInTheDocument();
  });

  it("filters available trucks by plate number", () => {
    render(<LandingPage />);

    const searchInput = screen.getByPlaceholderText("Plate, route, owner…");

    fireEvent.change(searchInput, {
      target: { value: "RAB 123A" },
    });

    expect(screen.getAllByText("RAB 123A").length).toBeGreaterThan(0);
    expect(screen.queryByText("RAB 456B")).not.toBeInTheDocument();
  });

  it("shows the marketplace empty state when no trucks are available", () => {
    mockUseIbanga.mockReturnValue({
      trucks: [{ ...unavailableTruck }],
      bookings: [],
    });

    render(<LandingPage />);

    expect(
      screen.getByText("New trucks are being added to the marketplace."),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "0 of 0 available trucks"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("shows a no-match state and can clear an unsuccessful search", () => {
    render(<LandingPage />);

    fireEvent.change(screen.getByPlaceholderText("Plate, route, owner…"), {
      target: { value: "Musanze" },
    });

    expect(
      screen.getByText("No available trucks match these filters."),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "0 of 1 available trucks"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByText("RAB 123A")).toBeInTheDocument();
    expect(screen.queryByText("No available trucks match these filters.")).not.toBeInTheDocument();
  });

  it("applies location, type, capacity, and price filters together", () => {
    const secondAvailableTruck = {
      ...availableTruck,
      id: "truck-3",
      plateNumber: "RAB 789C",
      truckType: "Container",
      capacity: 12,
      priceRwf: 900_000,
      currentLocation: "Mombasa",
      preferredRoute: "Mombasa - Kigali",
    };
    mockUseIbanga.mockReturnValue({
      trucks: [availableTruck, secondAvailableTruck],
      bookings: [],
    });

    render(<LandingPage />);

    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Kigali" },
    });
    fireEvent.change(screen.getByLabelText("Truck type"), {
      target: { value: "Flatbed" },
    });
    fireEvent.change(screen.getByLabelText("Min. tons"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("Max. price (RWF)"), {
      target: { value: "1500000" },
    });

    expect(screen.getByText("RAB 123A")).toBeInTheDocument();
    expect(screen.queryByText("RAB 789C")).not.toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "1 of 2 available trucks"),
    ).toBeInTheDocument();
  });
});
