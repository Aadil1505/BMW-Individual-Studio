import type { Build, Paint, RenderParams, View } from "./types";
// COSY codec observed in BMW USA's public client. No paint/model catalog is stored here.
const ALPHABET =
  "4Zak0rQzNsXdVEl3S1CTuf7yJ%tmLHwYqoi6Dh9pjMbG2ePUvBW8gIKx5OFcRnA";
export const API = "https://api.visualizer.aws.bmw.cloud/v1";
export const BUILD_API =
  "https://configure.bmwusa.com/UBYOConfigurator/v4/configuration/start/";
export const RENDER_API = "https://prod.cosy.bmw.cloud/bmwusa/cosySec?";

export function parseBuildInput(input: string) {
  const value = input.trim();
  if (/^[a-z0-9]{6,16}$/i.test(value)) return value;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "Paste a BMW USA studio link or a configuration code, for example g09kmm9f.",
    );
  }
  if (
    url.protocol !== "https:" ||
    !["www.bmwusa.com", "bmwusa.com"].includes(url.hostname) ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "Use an HTTPS BMW USA studio link or a configuration code.",
    );
  }
  const match = url.hash.match(/^#\/studio\/([a-z0-9]{6,16})(?:\/|$)/i);
  if (!match)
    throw new Error("The link must contain #/studio/YOUR_BUILD_CODE/.");
  return match[1];
}

export function decodeRender(encoded: string) {
  const text = decodeURIComponent(encoded);
  if (!text.startsWith("COSY-EU-100-") || text.length < 16)
    throw new Error("BMW returned an unrecognized render format.");
  let shift = Number(text.slice(12, 14));
  const increment = Number(text.slice(14, 16));
  if (!Number.isFinite(shift) || !Number.isFinite(increment))
    throw new Error("Invalid render header.");
  let out = "";
  for (const char of text.slice(16)) {
    const index = ALPHABET.indexOf(char);
    if (index < 0)
      throw new Error("Unexpected character in BMW render template.");
    out += ALPHABET[(((index - shift) % 63) + 63) % 63];
    shift += increment;
  }
  return decodeURIComponent(out.replace(/\+/g, " "));
}

export function encodeRender(raw: string) {
  const escaped = encodeURIComponent(raw)
    .replace(
      /[!'()*~]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
    )
    .replace(/-/g, "%2D")
    .replace(/_/g, "%5F")
    .replace(/\./g, "%2E");
  let out = "COSY-EU-100-1713",
    shift = 17;
  for (const char of escaped) {
    const index = ALPHABET.indexOf(char);
    out += index < 0 ? char : ALPHABET[(index + shift) % 63];
    shift += 13;
  }
  return encodeURIComponent(out);
}

function parseRenderTemplate(template: string): RenderParams {
  const params: RenderParams = {};
  for (const [key, value] of new URLSearchParams(decodeRender(template))) {
    const canonical = key.toLowerCase();
    if (Object.hasOwn(params, canonical))
      throw new Error("BMW returned duplicate render parameters.");
    params[canonical] = value;
  }
  if (!params.vehicle || !params.paint || !params.sa || !params.fabric)
    throw new Error(
      "The build is missing vehicle, paint, equipment, or upholstery render parameters.",
    );
  return params;
}
export function extractViews(build: Build): View[] {
  const cosy = build.configuration?.cosy || {};
  const fields: [string, string, string, boolean][] = [
    ["exterior", "Exterior", "walkaround360DegViewUrlPart", true],
    ["dashboard", "Dashboard", "dashboardViewUrlPart", false],
    ["front-seats", "Front seats", "frontSeatsViewUrlPart", false],
    ["rear-seats", "Rear seats", "rearSeatsViewUrlPart", false],
    ["cabin-side", "Cabin side", "interiorSideViewUrlPart", false],
    ["driver-door", "Driver door", "driverSideViewUrlPart", false],
  ];
  return fields.flatMap(([id, label, field, rotatable]) => {
    const source = cosy[field];
    const templates = (Array.isArray(source) ? source : [source]).filter(
      (item): item is string => typeof item === "string" && !!item,
    );
    if (!templates.length) return [];
    const frames = templates.map(parseRenderTemplate);
    return [{ id, label, field, rotatable, params: frames[0], frames }];
  });
}
export function extractRenderParams(build: Build) {
  const exterior = extractViews(build).find((view) => view.id === "exterior");
  if (!exterior)
    throw new Error(
      "This build has no supported exterior walkaround template.",
    );
  return exterior.params;
}
export const isLightingControl = (value: string) =>
  ["ctrlnightview", "ctrllightson"].includes(value.toLowerCase());
export function equipmentSa(sa: string) {
  return sa
    .split(",")
    .filter((value) => !isLightingControl(value))
    .join(",");
}
export function makeRenderUrl(
  base: RenderParams,
  paint: string,
  angle: number,
  { night = false, rotatable = true, width = 1200, height = 720 } = {},
) {
  // Lighting controls below are used by BMW's builder. Preserve the equipment entries.
  const params: RenderParams = {
    ...base,
    paint,
    width: String(width),
    height: String(height),
    resp: "png",
  };
  if (rotatable) params.angle = String(angle);
  const controls = [];
  if (night) controls.push("CTRLNightView");
  if (!rotatable) controls.push("ctrllightsON");
  params.sa = [
    ...controls,
    ...base.sa.split(",").filter((value) => !isLightingControl(value)),
  ].join(",");
  if (night) params.bkgnd = "%230C0C0C";
  return (
    RENDER_API +
    encodeRender(
      Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&"),
    )
  );
}
export function colorName(color: Paint) {
  return (
    color.localizedName?.en ||
    Object.values(color.localizedName || {})[0] ||
    color.p0ID
  );
}

export function verifyRender(url: string, base: RenderParams): RenderParams {
  const actual = Object.fromEntries(
    new URLSearchParams(decodeRender(new URL(url).search.slice(1))),
  );
  const presentation = new Set([
    "paint",
    "angle",
    "width",
    "height",
    "resp",
    "sa",
    "bkgnd",
  ]);
  if (
    equipmentSa(actual.sa || "") !== equipmentSa(base.sa) ||
    Object.keys(base).some(
      (key) => !presentation.has(key) && actual[key] !== base[key],
    )
  ) {
    throw new Error(
      "Equipment verification failed. The preview request was stopped.",
    );
  }
  return actual;
}
