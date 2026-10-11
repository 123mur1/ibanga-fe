"use client";

type LogoutConfirmationDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
  userName?: string;
};

export function LogoutConfirmationDialog({
  onCancel,
  onConfirm,
  userName,
}: LogoutConfirmationDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-card"
      >
        <div className="h-1.5 bg-linear-to-r from-brand via-accent to-brand" />
        <div className="p-6 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
              <path d="m16 16 4-4-4-4m4 4H9" />
            </svg>
          </div>
          <h2 id="logout-dialog-title" className="mt-5 font-display text-2xl font-bold text-navy">
            Log out of iBanga?
          </h2>
          <p id="logout-dialog-description" className="mt-2 text-sm leading-6 text-muted">
            {userName ? `You’re signed in as ${userName}. ` : ""}
            You can sign back in at any time to continue managing your marketplace activity.
          </p>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              autoFocus
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-soft transition hover:border-navy/20 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Stay signed in
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Log out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
