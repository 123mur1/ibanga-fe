/**
 * Environment-specific configuration, kept in one place.
 *
 * `dataSource` decides which service implementations are used:
 *  - "mock": in-browser demonstration data (the default for this frontend-only phase)
 *  - "api":  real HTTP implementations (not written yet; see `src/services/index.ts`)
 */
export const env = {
  dataSource: (process.env.NEXT_PUBLIC_OPS_DATA_SOURCE === "api" ? "api" : "mock") as "mock" | "api",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  /** Simulated network latency (ms) for mock services, so loading states are visible. */
  mockLatencyMs: Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 350),
  /** Bump to discard previously saved demonstration data in browsers. */
  mockDataVersion: 1,
  storageKey: "ibanga-ops-demo",
} as const;

export const DEMO_LABEL = "Demonstration data";
