import {
  API,
  BUILD_API,
  colorName,
  extractViews,
  parseBuildInput,
} from "./cosy";
import type {
  Build,
  CatalogModel,
  ImportedBuild,
  Paint,
  RequestLog,
} from "./types";

let requestId = 0;
export type LogRequest = (entry: RequestLog) => void;
export const message = (e: unknown) =>
  e instanceof Error ? e.message : "The request could not be completed.";

export async function request<T>(
  label: string,
  url: string,
  signal: AbortSignal,
  log: LogRequest,
  image = false,
): Promise<T> {
  const started = performance.now(),
    id = ++requestId;
  let status: number | undefined;
  try {
    const response = await fetch(url, {
      credentials: "omit",
      signal: AbortSignal.any([signal, AbortSignal.timeout(25000)]),
    });
    status = response.status;
    if (!response.ok)
      throw new Error(`${label}: BMW returned HTTP ${response.status}.`);
    if (
      image &&
      !/^image\/(png|jpeg|webp)(?:;|$)/i.test(
        response.headers.get("content-type") || "",
      )
    )
      throw new Error("BMW returned an unexpected image format.");
    const data = image ? await response.blob() : await response.json();
    log({
      id,
      label,
      url,
      status,
      ms: Math.round(performance.now() - started),
    });
    return data as T;
  } catch (e) {
    if (!signal.aborted)
      log({
        id,
        label,
        url,
        status,
        ms: Math.round(performance.now() - started),
        error: message(e),
      });
    throw e;
  }
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
function validBuild(v: unknown): v is Build {
  if (
    !record(v) ||
    v.errorCode !== 0 ||
    !record(v.model) ||
    !record(v.configuration)
  )
    return false;
  return (
    typeof v.model.name === "string" &&
    typeof v.model.code === "string" &&
    record(v.configuration.cosy)
  );
}
function validModels(v: unknown): v is CatalogModel[] {
  return (
    Array.isArray(v) &&
    v.every(
      (m) =>
        record(m) &&
        typeof m.modelRange === "string" &&
        typeof m.typeCode === "string",
    )
  );
}
export async function importBuild(
  input: string,
  signal: AbortSignal,
  log: LogRequest,
): Promise<ImportedBuild> {
  const code = parseBuildInput(input);
  const [buildResult, catalogResult] = await Promise.allSettled([
    request<unknown>(
      "Build import",
      BUILD_API + encodeURIComponent(code),
      signal,
      log,
    ),
    request<unknown>("Model catalog", API + "/cars", signal, log),
  ]);
  if (buildResult.status === "rejected") throw buildResult.reason;
  const build = buildResult.value;
  if (!validBuild(build))
    throw new Error(
      "BMW could not resolve this build or returned an unsupported build format.",
    );
  const views = extractViews(build);
  const base = views.find((v) => v.id === "exterior")?.params;
  if (!base)
    throw new Error("This build has no supported exterior render template.");
  const range = build.model.modelRange || build.configuration.modelRange;
  const models =
    catalogResult.status === "fulfilled" ? catalogResult.value : null;
  const catalogError = !validModels(models)
    ? "The Individual catalog is unavailable. You can still explore your original build."
    : undefined;
  const candidates = validModels(models)
    ? models.filter((m) => m.modelRange === range)
    : [];
  const originalName =
    build.configuration.summary?.exterior?.find((i) => i.code === base.paint)
      ?.name || base.paint;
  return { code, build, views, candidates, catalogError, originalName };
}
export async function fetchPalette(
  model: CatalogModel,
  signal: AbortSignal,
  log: LogRequest,
): Promise<Paint[]> {
  const data = await request<unknown>(
    "Paint palette",
    `${API}/cars/${encodeURIComponent(model.modelRange)}/${encodeURIComponent(model.typeCode)}/colors`,
    signal,
    log,
  );
  if (
    !Array.isArray(data) ||
    !data.every(
      (p) =>
        record(p) &&
        typeof p.p0ID === "string" &&
        /^[a-z0-9]{3}$/i.test(p.p0ID),
    )
  )
    throw new Error("BMW returned an unsupported paint palette.");
  return (data as Paint[]).map((p) => ({
    ...p,
    mainColor:
      typeof p.mainColor === "string" && p.mainColor.trim()
        ? p.mainColor.trim()
        : undefined,
    localizedName: record(p.localizedName)
      ? Object.fromEntries(
          Object.entries(p.localizedName).filter(
            ([, v]) => typeof v === "string",
          ),
        )
      : undefined,
  }));
}
export const modelName = (m: CatalogModel) =>
  m.localizedName?.en || `${m.modelRange} · ${m.typeCode}`;
export { colorName };
