/**
 * Environment-specific configuration, kept in one place.
 *
 * `dataSource` decides which service implementations are used:
 *  - "api":  backend-backed data (the default)
 *  - "mock": in-browser demonstration data, enabled explicitly
 */
const apiRequested =
  process.env.NEXT_PUBLIC_OPS_DATA_SOURCE === "api" ||
  process.env.NEXT_PUBLIC_DATA_SOURCE === "api";
const demoRequested =
  ["demo", "mock"].includes(process.env.NEXT_PUBLIC_OPS_DATA_SOURCE ?? "") ||
  ["demo", "mock"].includes(process.env.NEXT_PUBLIC_DATA_SOURCE ?? "");

export const env = {
  dataSource: (apiRequested || !demoRequested ? "api" : "mock") as
    "mock" | "api",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  /** Simulated network latency (ms) for mock services, so loading states are visible. */
  mockLatencyMs: Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 350),
  /** Bump to discard previously saved demonstration data in browsers. */
  mockDataVersion: 1,
  storageKey: "ibanga-ops-demo",
} as const;

export const DEMO_LABEL = "Demonstration data";
