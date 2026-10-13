export function WorkspaceLoading({ label = "Loading your workspace" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6" role="status" aria-live="polite">
      <p className="text-base font-semibold text-navy">{label}</p>
      <div className="mt-3 h-1 w-44 overflow-hidden rounded-full bg-line">
        <div className="loading-bar h-full rounded-full bg-brand" />
      </div>
    </div>
  );
}
