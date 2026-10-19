/* eslint-disable @next/next/no-html-link-for-pages -- Recovery links use a full navigation to clear crashed state, including outside the router. */
"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function RecoveryScreen({
  title,
  description,
  onRetry,
  homeLabel = "Back to home",
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  homeLabel?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className="recovery-main">
      <div className="recovery-content">
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <p>{description}</p>
        <div className="recovery-actions">
          {onRetry && (
            <Button size="lg" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Button
            size="lg"
            variant={onRetry ? "outline" : "default"}
            render={<a href="/" />}
          >
            {homeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
