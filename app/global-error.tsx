"use client";

import { RecoveryScreen } from "@/components/studio/recovery-screen";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong | Individual Studio</title>
      </head>
      <body className="app-body recovery-root">
        <div className="app-shell">
          <SiteNavbar />
          <main className="site-content">
            <RecoveryScreen
              title="Something went wrong."
              description="Try opening the page again, or return home to start a new build."
              onRetry={reset}
            />
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
