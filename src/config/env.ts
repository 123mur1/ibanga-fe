/** Environment-specific configuration, kept in one place. The app always runs against the API. */
export const env = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://ibanga-be.vercel.app"
      : "http://localhost:3001"),
} as const;
