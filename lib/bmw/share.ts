import { parseBuildInput } from "./cosy";

export interface SharedBuild {
  build: string;
  model?: string;
  paint?: string;
  view: string;
  angle: number;
  night: boolean;
}
export function parseShareHash(hash: string): SharedBuild | null {
  if (!hash || hash === "#") return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.get("v") !== "1")
    throw new Error("This shared link has an unsupported format.");
  const build = parseBuildInput(params.get("build") || "");
  const model = params.get("model") || undefined;
  const paint = params.get("paint") || undefined;
  const view = params.get("view") || "exterior";
  const angle = Number(params.get("angle") ?? "30");
  const lighting = params.get("lighting") || "day";
  if (
    (model && !/^[a-z0-9]{1,16}$/i.test(model)) ||
    (paint && !/^[a-z0-9]{3}$/i.test(paint)) ||
    !/^[a-z][a-z-]{0,30}$/.test(view) ||
    !Number.isInteger(angle) ||
    angle < 0 ||
    angle >= 360 ||
    !["day", "night"].includes(lighting)
  ) {
    throw new Error(
      "This shared link contains an invalid paint, camera or lighting selection.",
    );
  }
  return { build, model, paint, view, angle, night: lighting === "night" };
}
export function createShareUrl(base: string, state: SharedBuild): string {
  const url = new URL(base);
  url.pathname = "/studio/";
  url.hash = "";
  const params = new URLSearchParams({
    v: "1",
    build: state.build,
    view: state.view,
    angle: String(state.angle),
    lighting: state.night ? "night" : "day",
  });
  if (state.model) params.set("model", state.model);
  if (state.paint) params.set("paint", state.paint);
  url.search = params.toString();
  return url.toString();
}
export const finishName = (effect: string) =>
  ({ uni: "Solid", metallic: "Metallic", frozen: "Frozen" })[effect] ||
  effect.charAt(0).toUpperCase() + effect.slice(1);

export function parseShareUrl(href: string): SharedBuild | null {
  const url = new URL(href);
  if (url.searchParams.has("build") || url.searchParams.has("v"))
    return parseShareHash(`#${url.searchParams.toString()}`);
  return parseShareHash(url.hash);
}
