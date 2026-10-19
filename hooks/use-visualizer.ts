"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  colorName,
  fetchPalette,
  importBuild,
  message,
  request,
} from "@/lib/bmw/client";
import type { SharedBuild } from "@/lib/bmw/share";
import { equipmentSa, makeRenderUrl, verifyRender } from "@/lib/bmw/cosy";
import type {
  CatalogModel,
  DisplayedRender,
  ImportedBuild,
  Paint,
  RequestLog,
} from "@/lib/bmw/types";

export function useVisualizer() {
  const [loaded, setLoaded] = useState<ImportedBuild | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [model, setModel] = useState<CatalogModel | null>(null);
  const [palette, setPalette] = useState<Paint[]>([]);
  const [paletteLoading, setPaletteLoading] = useState(false);
  const [paletteError, setPaletteError] = useState("");
  const [paint, setPaint] = useState<Paint | null>(null);
  const [viewId, setViewId] = useState("exterior");
  const [night, setNight] = useState(false);
  const [angle, setAngle] = useState(30);
  const [displayed, setDisplayed] = useState<DisplayedRender | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState("");
  const [retry, setRetry] = useState(0);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const importController = useRef<AbortController | null>(null);
  const objectUrl = useRef<string | null>(null);
  const preparedImport = useRef<{
    build: ImportedBuild;
    palette: boolean;
    render: boolean;
  } | null>(null);
  const log = useCallback(
    (entry: RequestLog) => setLogs((prev) => [...prev.slice(-79), entry]),
    [],
  );
  const view = loaded?.views.find((v) => v.id === viewId);

  const load = useCallback(
    async (input: string, shared?: SharedBuild) => {
      importController.current?.abort();
      const controller = new AbortController();
      importController.current = controller;
      setImporting(true);
      setImportError("");
      try {
        const data = await importBuild(input, controller.signal, log);
        if (controller.signal.aborted) return;
        const nextView = data.views.find(
          (v) => v.id === (shared?.view || "exterior"),
        );
        if (!nextView)
          throw new Error(
            "The shared camera is no longer available for this build.",
          );
        const nextModel = shared?.model
          ? data.candidates.find((m) => m.typeCode === shared.model) || null
          : data.candidates.length === 1
            ? data.candidates[0]
            : null;
        if (shared?.model && !nextModel)
          throw new Error(
            "The shared catalog variant is no longer available for this build.",
          );
        const colors = nextModel
          ? await fetchPalette(nextModel, controller.signal, log).then(
              (value) => ({ value, error: "" }),
              (e) => ({ value: [] as Paint[], error: message(e) }),
            )
          : { value: [] as Paint[], error: "" };
        const nextPaint = shared?.paint
          ? colors.value.find((p) => p.p0ID === shared.paint) || null
          : null;
        if (shared?.paint && !nextPaint)
          throw new Error(
            colors.error ||
              "The shared paint is no longer in this model’s live palette.",
          );
        const nextAngle = shared?.angle ?? 30;
        const nextNight = shared?.night ?? false;
        const base = nextView.rotatable
          ? nextView.frames?.find(
              (frame) => Number(frame.angle) === nextAngle,
            ) || nextView.params
          : nextView.params;
        if (
          shared &&
          nextView.rotatable &&
          nextView.frames?.length &&
          !nextView.frames.some((frame) => Number(frame.angle) === nextAngle)
        )
          throw new Error(
            "The shared exterior angle is no longer available for this build.",
          );
        const paintCode = nextPaint ? `P0${nextPaint.p0ID}` : base.paint;
        const url = makeRenderUrl(base, paintCode, nextAngle, {
          night: nextNight,
          rotatable: nextView.rotatable,
        });
        const params = verifyRender(url, base);
        const blob = await request<Blob>(
          "Vehicle render",
          url,
          controller.signal,
          log,
          true,
        );
        if (controller.signal.aborted) return;
        const nextUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.src = nextUrl;
        try {
          await image.decode();
          if (!image.naturalWidth || !image.naturalHeight)
            throw new Error("BMW returned an empty preview.");
        } catch (e) {
          URL.revokeObjectURL(nextUrl);
          throw e;
        }
        if (controller.signal.aborted) {
          URL.revokeObjectURL(nextUrl);
          return;
        }
        const previous = objectUrl.current;
        objectUrl.current = nextUrl;
        preparedImport.current = { build: data, palette: true, render: true };
        // Commit the replacement only after its first image and palette settle.
        setPaint(nextPaint);
        setPalette(colors.value);
        setPaletteLoading(false);
        setViewId(nextView.id);
        setNight(nextNight);
        setAngle(nextAngle);
        setDisplayed({
          url: nextUrl,
          paint: paintCode,
          name: nextPaint ? colorName(nextPaint) : data.originalName,
          viewId: nextView.id,
          view: nextView.label,
          lighting: nextNight ? "Night" : "Day",
          angle: nextView.rotatable ? nextAngle : undefined,
          params,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
        setRendering(false);
        setRenderError("");
        setPaletteError(colors.error);
        setLoaded(data);
        setModel(nextModel);
        if (previous) URL.revokeObjectURL(previous);
      } catch (e) {
        if (!controller.signal.aborted) setImportError(message(e));
      } finally {
        if (!controller.signal.aborted) setImporting(false);
      }
    },
    [log],
  );

  useEffect(() => {
    if (
      preparedImport.current?.build === loaded &&
      preparedImport.current.palette
    ) {
      preparedImport.current.palette = false;
      return;
    }
    const controller = new AbortController();
    async function run() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setPalette([]);
      setPaletteError("");
      if (!model) {
        setPaletteLoading(false);
        return;
      }
      setPaletteLoading(true);
      try {
        const colors = await fetchPalette(model, controller.signal, log);
        if (!controller.signal.aborted) setPalette(colors);
      } catch (e) {
        if (!controller.signal.aborted) setPaletteError(message(e));
      } finally {
        if (!controller.signal.aborted) setPaletteLoading(false);
      }
    }
    void run();
    return () => controller.abort();
  }, [loaded, model, log, retry]);

  useEffect(() => {
    if (
      preparedImport.current?.build === loaded &&
      preparedImport.current.render
    ) {
      preparedImport.current.render = false;
      return;
    }
    const controller = new AbortController();
    async function run() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      if (!view || !loaded) {
        setRendering(false);
        return;
      }
      setRendering(true);
      setRenderError("");
      const code = paint ? `P0${paint.p0ID}` : view.params.paint;
      const base = view.rotatable
        ? view.frames?.find((frame) => Number(frame.angle) === angle) ||
          view.params
        : view.params;
      const url = makeRenderUrl(base, code, angle, {
        night,
        rotatable: view.rotatable,
      });
      try {
        const params = verifyRender(url, base);
        const blob = await request<Blob>(
          "Vehicle render",
          url,
          controller.signal,
          log,
          true,
        );
        if (controller.signal.aborted) return;
        const bitmap = await createImageBitmap(blob);
        const width = bitmap.width,
          height = bitmap.height;
        bitmap.close();
        if (!width || !height)
          throw new Error("BMW returned an empty preview.");
        const nextUrl = URL.createObjectURL(blob);
        const probe = new Image();
        probe.src = nextUrl;
        try {
          await probe.decode();
        } catch (e) {
          URL.revokeObjectURL(nextUrl);
          throw e;
        }
        if (controller.signal.aborted) {
          URL.revokeObjectURL(nextUrl);
          return;
        }
        const previous = objectUrl.current;
        objectUrl.current = nextUrl;
        setDisplayed({
          url: nextUrl,
          paint: code,
          name: paint ? colorName(paint) : loaded.originalName,
          viewId: view.id,
          view: view.label,
          lighting: night ? "Night" : "Day",
          angle: view.rotatable ? angle : undefined,
          params,
          width,
          height,
        });
        if (previous) URL.revokeObjectURL(previous);
      } catch (e) {
        if (!controller.signal.aborted) setRenderError(message(e));
      } finally {
        if (!controller.signal.aborted) setRendering(false);
      }
    }
    void run();
    return () => controller.abort();
  }, [loaded, view, paint, angle, night, retry, log]);

  useEffect(
    () => () => {
      importController.current?.abort();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function chooseModel(value: string) {
    setPaint(null);
    setPalette([]);
    setModel(loaded?.candidates.find((m) => m.typeCode === value) || null);
  }
  function downloadLog() {
    const report = {
      exportedAt: new Date().toISOString(),
      sourceBuild: loaded?.code,
      catalogModel: model,
      displayed: displayed ? { ...displayed, url: undefined } : null,
      requests: logs,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "individual-studio-log.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  // The codec is also checked by tests; equipment is never synthesized from UI fields.
  const equipmentCount = view
    ? equipmentSa(view.params.sa).split(",").filter(Boolean).length
    : 0;
  return {
    loaded,
    importing,
    importError,
    load,
    model,
    chooseModel,
    palette,
    paletteLoading,
    paletteError,
    paint,
    setPaint,
    view,
    viewId,
    setViewId,
    night,
    setNight,
    angle,
    setAngle,
    displayed,
    rendering,
    renderError,
    retry: () => setRetry((n) => n + 1),
    logs,
    downloadLog,
    equipmentCount,
    logRequest: log,
  };
}
