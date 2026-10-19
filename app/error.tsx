"use client";

import { RecoveryScreen } from "@/components/studio/recovery-screen";

export default function ErrorPage({
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  // This static app fetches its BMW data on mount, so resetting also reloads the build.
  return (
    <RecoveryScreen
      title="Something went wrong."
      description="Try opening your build again. If this keeps happening, return home and import it again."
      onRetry={reset}
    />
  );
}
