import { ArrowDownLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StudioLoading() {
  return (
    <section
      className="studio-entry-loading"
      aria-busy="true"
      aria-label="Loading studio"
    >
      <p className="sr-only" role="status">
        Opening your build. Loading your configuration and preview from BMW.
      </p>
      <div aria-hidden="true">
        <div className="intro-row">
          <div>
            <h1>A little more individual.</h1>
          </div>
          <div className="import-form loading-import">
            <span className="field-label">BMW build link or code</span>
            <div className="import-input-row">
              <span className="input-with-icon">
                <Skeleton className="loading-input" />
              </span>
              <Skeleton className="loading-submit" />
            </div>
            <span className="text-action">
              Or try an M4 example <ArrowDownLeft />
            </span>
          </div>
        </div>
        <div className="workspace studio-loading-workspace">
          <div className="vehicle-panel">
            <div className="vehicle-heading">
              <div>
                <h2>
                  <Skeleton className="loading-model-title" />
                </h2>
              </div>
              <div className="vehicle-actions">
                <Skeleton className="loading-action" />
                <Skeleton className="loading-action" />
              </div>
            </div>
            <div className="vehicle-stage">
              <Skeleton className="loading-vehicle" />
            </div>
            <div className="preview-controls">
              <Skeleton className="loading-control" />
              <Skeleton className="loading-control" />
            </div>
            <div className="view-filmstrip">
              <div className="filmstrip-heading">
                <Skeleton className="loading-camera-heading" />
                <Skeleton className="loading-camera-arrows" />
              </div>
              <div className="filmstrip-track loading-filmstrip">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="filmstrip-slide">
                    <div className="camera-choice">
                      <Skeleton className="camera-thumbnail" />
                      <span className="camera-label">
                        <Skeleton className="loading-camera-label" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="selected-paint">
              <div>
                <Skeleton className="loading-paint-title" />
                <Skeleton className="loading-paint-code" />
              </div>
              <Skeleton className="loading-original" />
            </div>
          </div>
          <div className="palette-panel">
            <div className="palette-heading">
              <h2>Individual paints</h2>
              <Skeleton className="loading-count" />
            </div>
            <Skeleton className="loading-search" />
            <div className="paint-filters">
              <Skeleton className="loading-filter" />
              <Skeleton className="loading-filter" />
            </div>
            <div className="paint-scroll">
              <div className="paint-grid">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i}>
                    <Skeleton className="paint-swatch" />
                    <div className="paint-option-name">
                      <Skeleton className="loading-paint-name" />
                    </div>
                    <Skeleton className="loading-paint-code" />
                  </div>
                ))}
              </div>
            </div>
            <div className="palette-footer">
              <p>
                Confirm paint availability and pricing with your BMW Center.
              </p>
            </div>
          </div>
        </div>
        <div className="details-section">
          <div className="loading-detail-row">
            <Skeleton />
          </div>
          <div className="loading-detail-row">
            <Skeleton />
          </div>
        </div>
      </div>
    </section>
  );
}
