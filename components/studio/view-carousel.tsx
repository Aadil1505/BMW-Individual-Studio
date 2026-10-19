/* eslint-disable @next/next/no-img-element -- Validated browser blob URLs bypass server image optimization. */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cameraFrames } from "@/lib/bmw/views";
import { makeRenderUrl } from "@/lib/bmw/cosy";
import { request, type LogRequest } from "@/lib/bmw/client";
import type { View } from "@/lib/bmw/types";

function ThumbnailImage({
  url,
  label,
  log,
}: {
  url: string;
  label: string;
  log: LogRequest;
}) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    async function load() {
      try {
        const blob = await request<Blob>(
          "View thumbnail",
          url,
          controller.signal,
          log,
          true,
        );
        const bitmap = await createImageBitmap(blob);
        bitmap.close();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        if (!controller.signal.aborted) setSrc(objectUrl);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    void load();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, log]);
  if (failed)
    return (
      <span
        className="thumbnail-placeholder"
        title="BMW could not render this preview"
      >
        <AlertCircle />
        <span>Unavailable</span>
      </span>
    );
  return src ? (
    <img src={src} alt={label} draggable={false} />
  ) : (
    <span className="thumbnail-placeholder">
      <LoaderCircle className="spin" />
    </span>
  );
}
function Thumbnail({
  url,
  label,
  log,
}: {
  url: string;
  label: string;
  log: LogRequest;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "100px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <span className="camera-thumbnail" ref={ref}>
      {visible && (
        <ThumbnailImage key={url} url={url} label={label} log={log} />
      )}
    </span>
  );
}

export function ViewCarousel({
  views,
  viewId,
  angle,
  paint,
  night,
  onSelect,
  log,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: {
  views: View[];
  viewId: string;
  angle: number;
  paint: string;
  night: boolean;
  onSelect: (viewId: string, angle?: number) => void;
  log: LogRequest;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const wheelPlugins = useMemo(
    () => [WheelGesturesPlugin({ forceWheelAxis: "x" })],
    [],
  );
  const exterior = viewId === "exterior";
  const frames = cameraFrames(views, viewId);
  const selectedIndex = frames.findIndex((frame) =>
    exterior ? frame.angle === angle : frame.viewId === viewId,
  );
  useEffect(() => {
    if (api && selectedIndex >= 0) api.scrollTo(selectedIndex);
  }, [api, selectedIndex]);
  return (
    <div className="view-filmstrip">
      <Carousel
        key={exterior ? "exterior" : "interior"}
        opts={{ align: "start", dragFree: true, loop: true }}
        plugins={wheelPlugins}
        setApi={setApi}
        aria-label={exterior ? "Exterior angles" : "Interior cameras"}
      >
        <div className="filmstrip-heading">
          <span>
            {exterior ? "Exterior angles" : "Interior cameras"}{" "}
            <span className="filmstrip-count">{frames.length}</span>
          </span>
          <div className="filmstrip-arrows">
            <CarouselPrevious
              onClick={onPrevious}
              disabled={!canPrevious}
              aria-label="Previous preview"
            />
            <CarouselNext
              onClick={onNext}
              disabled={!canNext}
              aria-label="Next preview"
            />
          </div>
        </div>
        <CarouselContent className="filmstrip-track">
          {frames.map((frame) => {
            const selected = exterior
              ? angle === frame.angle
              : viewId === frame.viewId;
            const url = makeRenderUrl(frame.params, paint, frame.angle || 0, {
              night,
              rotatable: frame.rotatable,
              width: 320,
              height: 192,
            });
            return (
              <CarouselItem className="filmstrip-slide" key={frame.id}>
                <button
                  type="button"
                  className={`camera-choice${selected ? " is-selected" : ""}${night ? " is-night" : ""}`}
                  aria-pressed={selected}
                  aria-label={`Show ${exterior ? "exterior " : ""}${frame.label}`}
                  onClick={() => onSelect(frame.viewId, frame.angle)}
                >
                  <Thumbnail
                    url={url}
                    label={`${frame.label} preview`}
                    log={log}
                  />
                  <span className="camera-label">{frame.label}</span>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
