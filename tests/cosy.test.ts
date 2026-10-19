import { describe, expect, test } from "bun:test";
import {
  decodeRender,
  encodeRender,
  equipmentSa,
  extractViews,
  makeRenderUrl,
  parseBuildInput,
  verifyRender,
} from "../lib/bmw/cosy";
import type { Build } from "../lib/bmw/types";

const base = {
  vehicle: "27DC",
  paint: "P0X1E",
  fabric: "FLKSW",
  sa: "S01T8,S02VF,S04MC",
  pov: "walkaround",
  custom: "keep-this",
  angle: "30",
};
const encoded = (p: Record<string, string>) =>
  encodeRender(new URLSearchParams(p).toString());

describe("build input", () => {
  test("accepts code and builder links", () => {
    expect(parseBuildInput(" g09kmm9f ")).toBe("g09kmm9f");
    expect(
      parseBuildInput(
        "https://www.bmwusa.com/build-your-own.html#/studio/g09kmm9f/exterior/color",
      ),
    ).toBe("g09kmm9f");
  });
  test.each([
    "https://evil.example/#/studio/g09kmm9f",
    "https://bmwusa.com.evil.example/#/studio/g09kmm9f",
    "http://bmwusa.com/#/studio/g09kmm9f",
    "https://user:pass@bmwusa.com/#/studio/g09kmm9f",
    "javascript:alert(1)",
    "",
  ])("rejects invalid input %s", (value) =>
    expect(() => parseBuildInput(value)).toThrow(),
  );
});
describe("render codec and invariants", () => {
  test("round trips escaped values and unknown parameters", () => {
    const raw =
      "vehicle=27DC&fabric=FLKSW&note=blue%20%26%20green&bkgnd=%230C0C0C";
    expect(decodeRender(encodeRender(raw))).toBe(raw);
  });
  test.each(["P0P5C", "P0327"])(
    "changes paint %s without dropping equipment or unknown fields",
    (paint) => {
      const actual = verifyRender(makeRenderUrl(base, paint, 60), base);
      expect(actual.paint).toBe(paint);
      expect(actual.vehicle).toBe(base.vehicle);
      expect(actual.fabric).toBe(base.fabric);
      expect(actual.sa).toBe(base.sa);
      expect(actual.custom).toBe("keep-this");
      expect(actual.angle).toBe("60");
    },
  );
  test("adds genuine night/interior controls separately from equipment", () => {
    const interior = { ...base, pov: "dashboard" };
    const actual = verifyRender(
      makeRenderUrl(interior, base.paint, 60, {
        night: true,
        rotatable: false,
      }),
      interior,
    );
    expect(actual.pov).toBe("dashboard");
    expect(actual.sa).toContain("CTRLNightView");
    expect(actual.sa).toContain("ctrllightsON");
    expect(equipmentSa(actual.sa)).toBe(base.sa);
    expect(actual.angle).toBe(base.angle);
    expect(actual.bkgnd).toBe("#0C0C0C");
  });
  test("stops a changed upholstery/equipment request", () => {
    expect(() =>
      verifyRender(
        makeRenderUrl({ ...base, fabric: "other" }, base.paint, 30),
        base,
      ),
    ).toThrow();
    expect(() =>
      verifyRender(
        makeRenderUrl({ ...base, sa: "S00XX" }, base.paint, 30),
        base,
      ),
    ).toThrow();
  });
  test("only exposes present camera templates", () => {
    const build = {
      configuration: {
        cosy: {
          walkaround360DegViewUrlPart: [
            encoded(base),
            encoded({ ...base, angle: "60" }),
          ],
          dashboardViewUrlPart: encoded({ ...base, pov: "dashboard" }),
        },
      },
    } as unknown as Build;
    expect(extractViews(build)[0].frames?.map((frame) => frame.angle)).toEqual([
      "30",
      "60",
    ]);
    expect(extractViews(build).map((v) => v.id)).toEqual([
      "exterior",
      "dashboard",
    ]);
  });
  test("rejects unrecognized templates and duplicate keys", () => {
    expect(() => decodeRender("unknown")).toThrow();
    const template = encodeRender("vehicle=a&vehicle=b&paint=c&sa=d&fabric=e");
    const build = {
      configuration: { cosy: { dashboardViewUrlPart: template } },
    } as unknown as Build;
    expect(() => extractViews(build)).toThrow("duplicate");
  });
});
