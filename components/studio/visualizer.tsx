"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  LoaderCircle,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  Sun,
  CarFront,
  Link2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { BmwLogo } from "@/components/layout/bmw-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { ViewCarousel } from "@/components/studio/view-carousel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useVisualizer } from "@/hooks/use-visualizer";
import { ShareBuild } from "@/components/studio/share-build";
import { RecoveryScreen } from "@/components/studio/recovery-screen";
import { StudioLoading } from "@/components/studio/studio-loading";
import { createShareUrl, finishName, parseShareUrl } from "@/lib/bmw/share";
import { cameraFrames } from "@/lib/bmw/views";
import { colorName, modelName } from "@/lib/bmw/client";

export function Visualizer({
  entry = "welcome",
}: {
  entry?: "welcome" | "studio";
}) {
  const studio = useVisualizer();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [finish, setFinish] = useState("all");
  const [family, setFamily] = useState("all");
  const [shareError, setShareError] = useState("");
  const [restoring, setRestoring] = useState(entry === "studio");
  const { load } = studio;
  useEffect(() => {
    let active = true;
    function restore() {
      if (!active) return;
      try {
        const shared = parseShareUrl(window.location.href);
        if (!shared) {
          if (entry === "studio")
            setShareError("This link is missing its build code.");
          setRestoring(false);
          return;
        }
        setRestoring(true);
        setInput(shared.build);
        setQuery("");
        setFinish("all");
        setFamily("all");
        setShareError("");
        void load(shared.build, shared).finally(() => {
          if (active) setRestoring(false);
        });
      } catch (e) {
        setRestoring(false);
        setShareError(
          e instanceof Error
            ? e.message
            : "This share link could not be opened.",
        );
      }
    }
    void Promise.resolve().then(restore);
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    return () => {
      active = false;
      window.removeEventListener("hashchange", restore);
      window.removeEventListener("popstate", restore);
    };
  }, [load, entry]);
  const finishes = Array.from(
    new Set(studio.palette.map((p) => p.effect || "unknown")),
  ).sort();
  const activeFinish = finishes.includes(finish) ? finish : "all";
  const families = Array.from(
    new Set(studio.palette.map((p) => p.mainColor || "unknown")),
  ).sort();
  const activeFamily = families.includes(family) ? family : "all";
  const familyLabel = (value: string) =>
    value === "unknown"
      ? "Unspecified"
      : value.charAt(0).toUpperCase() + value.slice(1);
  const { loaded, displayed, paint, view } = studio;
  const studioEntry = !loaded && (entry === "studio" || restoring);
  const selection = useMemo(
    () =>
      loaded
        ? {
            build: loaded.code,
            model: studio.model?.typeCode,
            paint: paint?.p0ID,
            view: studio.viewId,
            angle: studio.angle,
            night: studio.night,
          }
        : null,
    [loaded, studio.model, paint, studio.viewId, studio.angle, studio.night],
  );
  useEffect(() => {
    if (!selection || studio.importing || restoring) return;
    const url = createShareUrl(window.location.href, selection);
    if (url !== window.location.href)
      window.history.replaceState(window.history.state, "", url);
  }, [selection, studio.importing, restoring]);
  const colors = studio.palette.filter(
    (p) =>
      (activeFinish === "all" || (p.effect || "unknown") === activeFinish) &&
      (activeFamily === "all" || (p.mainColor || "unknown") === activeFamily) &&
      `${colorName(p)} ${p.p0ID} ${p.effect || ""} ${finishName(p.effect || "unknown")} ${p.mainColor || ""}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  function downloadImage() {
    if (!displayed || !loaded || studio.importing || studio.rendering) return;
    const filename = [
      loaded.build.model.name,
      displayed.name,
      displayed.paint,
      displayed.viewId,
      displayed.lighting,
      displayed.angle !== undefined ? `${displayed.angle}deg` : "",
    ]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const anchor = document.createElement("a");
    anchor.href = displayed.url;
    anchor.download = `${filename}.png`;
    anchor.click();
  }
  function clearSharedEntry() {
    setShareError("");
    setFinish("all");
    setFamily("all");
  }
  const summary = [
    ...(loaded?.build.configuration.summary?.exterior || []),
    ...(loaded?.build.configuration.summary?.interior || []),
  ];
  const frames = loaded ? cameraFrames(loaded.views, studio.viewId) : [];
  const selectedIndex = frames.findIndex((frame) =>
    frame.rotatable
      ? frame.angle === studio.angle
      : frame.viewId === studio.viewId,
  );
  function selectFrame(id: string, angle?: number) {
    studio.setViewId(id);
    if (angle !== undefined) studio.setAngle(angle);
  }
  function stepFrame(direction: number) {
    const frame =
      frames[(selectedIndex + direction + frames.length) % frames.length];
    if (frame) selectFrame(frame.viewId, frame.angle);
  }
  const canPrevious = selectedIndex >= 0 && frames.length > 1;
  const canNext = canPrevious;
  function submit(e: FormEvent) {
    e.preventDefault();
    if (studio.importing) return;
    setQuery("");
    clearSharedEntry();
    void studio.load(input);
  }
  function example() {
    setInput("g09kmm9f");
    setQuery("");
    clearSharedEntry();
    void studio.load("g09kmm9f");
  }

  const entryError = studio.importError || shareError;
  if (studioEntry && entryError && !studio.importing && !restoring) {
    return (
      <RecoveryScreen
        title="This build couldn’t be opened."
        description={entryError}
        homeLabel="Import another build"
        onRetry={() => {
          try {
            const shared = parseShareUrl(window.location.href);
            if (!shared) {
              setShareError("This link is missing its build code.");
              return;
            }
            setShareError("");
            setRestoring(true);
            void load(shared.build, shared).finally(() => setRestoring(false));
          } catch (error) {
            setShareError(
              error instanceof Error
                ? error.message
                : "This share link could not be opened.",
            );
          }
        }}
      />
    );
  }

  return (
    <div className={`studio-page${loaded || studioEntry ? "" : " is-welcome"}`}>
      <div className="studio-main">
        {studioEntry ? (
          <StudioLoading />
        ) : (
          <>
            <section className="intro-row">
              <div>
                <h1>
                  {loaded ? "A little more individual." : "Make it individual."}
                </h1>
                {!loaded && (
                  <p className="intro-copy">
                    Paste your BMW build link or code to explore its Individual
                    colors.
                  </p>
                )}
              </div>
              <form className="import-form" onSubmit={submit}>
                <label className="field-label" htmlFor="build-input">
                  BMW build link or code
                </label>
                <div className="import-input-row">
                  <div className="input-with-icon">
                    <Link2 />
                    <Input
                      id="build-input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        loaded
                          ? "Paste a BMW build link or code"
                          : "BMW link or build code"
                      }
                      required
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={studio.importing}
                    aria-busy={studio.importing}
                  >
                    {studio.importing ? (
                      <>
                        <LoaderCircle className="spin" />
                        <span>Importing</span>
                      </>
                    ) : (
                      <>
                        Import <ArrowRight />
                      </>
                    )}
                  </Button>
                </div>
                <button
                  className="text-action"
                  type="button"
                  onClick={example}
                  disabled={studio.importing}
                >
                  Or try an M4 example <ArrowDownLeft />
                </button>
                <p className="sr-only" role="status" aria-live="polite">
                  {studio.importing
                    ? "Loading your configuration from BMW…"
                    : ""}
                </p>
              </form>
            </section>
            {(studio.importError || shareError) && (
              <Alert variant="destructive" className="import-alert">
                <AlertCircle />
                <AlertTitle>Build couldn’t be imported</AlertTitle>
                <AlertDescription>
                  {studio.importError || shareError}
                </AlertDescription>
              </Alert>
            )}

            {!loaded && (
              <section
                className="how-it-works"
                aria-labelledby="how-it-works-title"
              >
                <h2 id="how-it-works-title">How it works</h2>
                <ol>
                  <li>
                    <h3>Build your BMW</h3>
                    <p>
                      Choose your model, wheels and interior in the{" "}
                      <a
                        href="https://www.bmwusa.com/build-your-own.html"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        BMW builder <ExternalLink aria-hidden="true" />
                      </a>
                      .
                    </p>
                  </li>
                  <li>
                    <h3>Bring your build here</h3>
                    <p>
                      Copy your build link or configuration code, paste it above
                      and select Import.
                    </p>
                  </li>
                  <li>
                    <h3>Find your Individual color</h3>
                    <p>
                      Explore paints on your build, compare views and lighting,
                      then share a link or download an image.
                    </p>
                  </li>
                </ol>
              </section>
            )}

            {loaded && (
              <>
                <div
                  className="workspace"
                  inert={studio.importing}
                  aria-busy={studio.importing}
                  data-importing={studio.importing}
                >
                  <section
                    className="vehicle-panel"
                    aria-label="Vehicle preview"
                  >
                    <div className="vehicle-heading">
                      <div>
                        <h2>
                          {loaded
                            ? loaded.build.model.name
                            : "Start with your BMW."}
                        </h2>
                      </div>
                      {displayed && (
                        <div className="vehicle-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="Download image"
                            disabled={studio.importing || studio.rendering}
                            onClick={downloadImage}
                          >
                            <Download /> Download
                          </Button>
                          <ShareBuild
                            disabled={studio.importing}
                            state={selection!}
                          />
                        </div>
                      )}
                    </div>
                    <div
                      className={`vehicle-stage${displayed?.lighting === "Night" ? " is-night" : ""}`}
                      aria-busy={studio.rendering || studio.importing}
                    >
                      {displayed /* BMW renders are fetched and validated directly, without an image proxy. */ ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayed.url}
                          width={displayed.width}
                          height={displayed.height}
                          alt={`${loaded?.build.model.name}, ${displayed.name}, ${displayed.view}, ${displayed.lighting}${displayed.angle !== undefined ? `, ${displayed.angle} degrees` : ""}`}
                        />
                      ) : (
                        <div className="stage-empty">
                          {studio.importing || studio.rendering ? (
                            <LoaderCircle className="spin" />
                          ) : (
                            <CarFront />
                          )}
                          <h3>
                            {studio.importing
                              ? "Bringing your build into the studio…"
                              : studio.rendering
                                ? "Preparing your BMW preview…"
                                : "Every detail stays yours."}
                          </h3>
                          <p>
                            {studio.importing || studio.rendering
                              ? "Fetching your configuration directly from BMW."
                              : "Your wheels, your interior, your equipment. A whole new palette."}
                          </p>
                          {!studio.importing && !studio.rendering && (
                            <Button variant="outline" onClick={example}>
                              Explore an M4 <ArrowRight />
                            </Button>
                          )}
                        </div>
                      )}
                      <Button
                        className="stage-nav stage-nav-prev"
                        variant="outline"
                        size="icon"
                        aria-label="Previous image"
                        onClick={() => stepFrame(-1)}
                        disabled={!canPrevious}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        className="stage-nav stage-nav-next"
                        variant="outline"
                        size="icon"
                        aria-label="Next image"
                        onClick={() => stepFrame(1)}
                        disabled={!canNext}
                      >
                        <ChevronRight />
                      </Button>
                      {displayed && (studio.rendering || studio.importing) && (
                        <div className="render-indicator" role="status">
                          <LoaderCircle className="spin" />{" "}
                          {studio.importing
                            ? "Importing new build…"
                            : "Updating preview"}
                        </div>
                      )}
                      {displayed && (
                        <div className="stage-caption">
                          <span>
                            {displayed.view} · {displayed.lighting}
                          </span>
                          <span>
                            {displayed.angle !== undefined
                              ? `${displayed.angle}°`
                              : "Fixed camera"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="preview-controls">
                      <div className="camera-control">
                        <Eye />
                        <Select
                          items={[
                            { value: "exterior", label: "Exterior" },
                            { value: "interior", label: "Interior" },
                          ]}
                          value={view?.rotatable ? "exterior" : "interior"}
                          disabled={!loaded}
                          onValueChange={(value) =>
                            studio.setViewId(
                              value === "exterior"
                                ? "exterior"
                                : loaded.views.find((v) => !v.rotatable)!.id,
                            )
                          }
                        >
                          <SelectTrigger aria-label="Camera view">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent
                            alignItemWithTrigger={false}
                            className="studio-select-menu"
                          >
                            <SelectGroup>
                              <SelectItem value="exterior">Exterior</SelectItem>
                              {loaded.views.some((v) => !v.rotatable) && (
                                <SelectItem value="interior">
                                  Interior
                                </SelectItem>
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <Tabs
                        value={studio.night ? "night" : "day"}
                        onValueChange={(value) =>
                          studio.setNight(value === "night")
                        }
                      >
                        <TabsList aria-label="Lighting">
                          <TabsTrigger value="day" disabled={!loaded}>
                            <Sun /> Day
                          </TabsTrigger>
                          <TabsTrigger value="night" disabled={!loaded}>
                            <Moon /> Night
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    <ViewCarousel
                      key={loaded.code}
                      views={loaded.views}
                      viewId={studio.viewId}
                      angle={studio.angle}
                      paint={paint ? `P0${paint.p0ID}` : view!.params.paint}
                      night={studio.night}
                      log={studio.logRequest}
                      onSelect={selectFrame}
                      onPrevious={() => stepFrame(-1)}
                      onNext={() => stepFrame(1)}
                      canPrevious={canPrevious}
                      canNext={canNext}
                    />
                    {studio.renderError && (
                      <Alert variant="destructive" className="render-alert">
                        <AlertCircle />
                        <AlertTitle>Preview unavailable</AlertTitle>
                        <AlertDescription>
                          <p>
                            {studio.renderError}{" "}
                            {displayed &&
                              `Showing the last successful preview: ${displayed.name}, ${displayed.view}, ${displayed.lighting}.`}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={studio.retry}
                          >
                            Try again
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="selected-paint">
                      <div>
                        <h3>
                          {displayed?.name || "Find your signature color."}
                        </h3>
                        <p>
                          {displayed
                            ? displayed.paint
                            : "Import a build to discover its available Individual finishes."}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => studio.setPaint(null)}
                        disabled={!loaded || !paint}
                      >
                        <RotateCcw /> Original paint
                      </Button>
                    </div>
                  </section>

                  <aside
                    className="palette-panel"
                    aria-label="Individual paint palette"
                  >
                    <div className="palette-heading">
                      <div>
                        <h2>Individual paints</h2>
                      </div>
                      <Badge variant="secondary">
                        {studio.palette.length ? colors.length : "—"}
                      </Badge>
                    </div>
                    {loaded && loaded.candidates.length > 1 && (
                      <div className="model-choice">
                        <label className="field-label" htmlFor="catalog-model">
                          Choose your catalog variant
                        </label>
                        <Select
                          items={loaded.candidates.map((m) => ({
                            value: m.typeCode,
                            label: modelName(m),
                          }))}
                          value={studio.model?.typeCode || null}
                          onValueChange={(value) => {
                            if (value) studio.chooseModel(value);
                          }}
                        >
                          <SelectTrigger id="catalog-model">
                            <SelectValue placeholder="Select variant" />
                          </SelectTrigger>
                          <SelectContent
                            alignItemWithTrigger={false}
                            className="studio-select-menu"
                          >
                            <SelectGroup>
                              {loaded.candidates.map((m) => (
                                <SelectItem key={m.typeCode} value={m.typeCode}>
                                  {modelName(m)}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="paint-search input-with-icon">
                      <Search />
                      <Input
                        aria-label="Search paints"
                        placeholder="Search name, code or finish"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={!studio.palette.length}
                      />
                    </div>
                    <div className="paint-filters">
                      <Select
                        items={[
                          { value: "all", label: "All finishes" },
                          ...finishes.map((effect) => ({
                            value: effect,
                            label: finishName(effect),
                          })),
                        ]}
                        value={activeFinish}
                        disabled={!studio.palette.length}
                        onValueChange={(value) => setFinish(value || "all")}
                      >
                        <SelectTrigger aria-label="Paint finish">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          alignItemWithTrigger={false}
                          className="studio-select-menu"
                        >
                          <SelectGroup>
                            <SelectItem value="all">
                              All finishes{" "}
                              <span className="filter-count">
                                {studio.palette.length}
                              </span>
                            </SelectItem>
                            {finishes.map((effect) => (
                              <SelectItem key={effect} value={effect}>
                                {finishName(effect)}{" "}
                                <span className="filter-count">
                                  {
                                    studio.palette.filter(
                                      (p) => (p.effect || "unknown") === effect,
                                    ).length
                                  }
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Select
                        items={[
                          { value: "all", label: "All colors" },
                          ...families.map((color) => ({
                            value: color,
                            label: familyLabel(color),
                          })),
                        ]}
                        value={activeFamily}
                        disabled={!studio.palette.length}
                        onValueChange={(value) => setFamily(value || "all")}
                      >
                        <SelectTrigger aria-label="Color family">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          align="end"
                          alignItemWithTrigger={false}
                          className="studio-select-menu"
                        >
                          <SelectGroup>
                            <SelectItem value="all">
                              All colors{" "}
                              <span className="filter-count">
                                {studio.palette.length}
                              </span>
                            </SelectItem>
                            {families.map((color) => (
                              <SelectItem key={color} value={color}>
                                {familyLabel(color)}{" "}
                                <span className="filter-count">
                                  {
                                    studio.palette.filter(
                                      (p) =>
                                        (p.mainColor || "unknown") === color,
                                    ).length
                                  }
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    {query && (
                      <p className="palette-meta">
                        {colors.length} matching colors
                      </p>
                    )}
                    <ScrollArea className="paint-scroll">
                      {studio.paletteLoading ? (
                        <div className="palette-empty">
                          <LoaderCircle className="spin" />
                          <p>Finding your colors…</p>
                        </div>
                      ) : studio.palette.length ? (
                        <div
                          className="paint-grid"
                          role="group"
                          aria-label="Available paints"
                        >
                          {colors.map((p) => (
                            <button
                              key={p.p0ID}
                              type="button"
                              className={`paint-option${paint?.p0ID === p.p0ID ? " is-selected" : ""}`}
                              aria-pressed={paint?.p0ID === p.p0ID}
                              onClick={() => studio.setPaint(p)}
                            >
                              <span
                                className="paint-swatch"
                                style={
                                  /^#[a-f\d]{6}$/i.test(p.hexCode || "")
                                    ? ({
                                        "--swatch": p.hexCode,
                                      } as CSSProperties)
                                    : undefined
                                }
                              >
                                {paint?.p0ID === p.p0ID && (
                                  <span className="swatch-check">
                                    <Check />
                                  </span>
                                )}
                              </span>
                              <span className="paint-option-name">
                                {colorName(p)}
                              </span>
                              <span className="paint-option-code">
                                {p.p0ID}
                              </span>
                            </button>
                          ))}
                          {!colors.length && (
                            <p className="no-results">
                              No paints match your filters. Try another color,
                              finish or search.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="palette-empty">
                          <BmwLogo />
                          <h3>
                            {studio.paletteError
                              ? "Palette unavailable"
                              : loaded
                                ? "No palette selected"
                                : "Your possibilities start here."}
                          </h3>
                          <p>
                            {studio.paletteError ||
                              loaded?.catalogError ||
                              (loaded
                                ? loaded.candidates.length
                                  ? "Choose your catalog variant above."
                                  : "BMW’s Individual catalog has no matching model for this build."
                                : "Import your build to load its paint collection directly from BMW.")}
                          </p>
                          {studio.paletteError && (
                            <Button variant="outline" onClick={studio.retry}>
                              Retry palette
                            </Button>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="palette-footer">
                      <ShieldCheck />
                      <p>
                        Confirm paint availability and pricing with your BMW
                        Center.
                      </p>
                    </div>
                  </aside>
                </div>

                <section className="details-section" inert={studio.importing}>
                  <Accordion>
                    <AccordionItem value="equipment">
                      <AccordionTrigger>
                        <span className="detail-title">
                          Original build details
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="original-build-heading">
                          <p>
                            Original configuration <span>{loaded.code}</span>
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            render={
                              <a
                                href={`https://www.bmwusa.com/build-your-own.html#/studio/${encodeURIComponent(loaded.code)}/exterior/color`}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                          >
                            Open in BMW builder <ExternalLink />
                          </Button>
                        </div>
                        {loaded ? (
                          <div className="equipment-grid">
                            {summary.map((item, i) => (
                              <div key={`${item.code}-${i}`}>
                                <span>{item.code}</span>
                                <p>{item.name}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="muted-copy">
                            Import a build to see its original wheels,
                            upholstery and trim.
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="diagnostics">
                      <AccordionTrigger>
                        <span className="detail-title">
                          Connection & preview details
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="diagnostic-heading">
                          <p>
                            Requests go directly from your browser to BMW. Your
                            build isn’t stored on our servers.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={studio.downloadLog}
                            disabled={!studio.logs.length}
                          >
                            <Download /> Download log
                          </Button>
                        </div>
                        <ul className="request-list">
                          {studio.logs
                            .slice(-10)
                            .reverse()
                            .map((entry) => (
                              <li key={entry.id}>
                                <span>{entry.label}</span>
                                <span>
                                  {entry.error ||
                                    `HTTP ${entry.status} · ${entry.ms} ms`}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
