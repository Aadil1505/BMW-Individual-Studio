import { describe, expect, test } from "bun:test";
import {
  createShareUrl,
  finishName,
  parseShareHash,
  parseShareUrl,
} from "../lib/bmw/share";

describe("share links", () => {
  test("round trips a render selection in static studio query parameters", () => {
    const state = {
      build: "g09kmm9f",
      model: "21HK",
      paint: "P5C",
      view: "front-seats",
      angle: 30,
      night: true,
    };
    const url = new URL(createShareUrl("https://studio.example/?old=1", state));
    expect(url.searchParams.get("build")).toBe("g09kmm9f");
    expect(url.hash).toBe("");
    expect(url.pathname).toBe("/studio/");
    expect(parseShareUrl(url.href)).toEqual(state);
  });
  test("original paint is represented without an Individual paint override", () => {
    const url = new URL(
      createShareUrl("https://studio.example/", {
        build: "g09kmm9f",
        view: "exterior",
        angle: 350,
        night: false,
      }),
    );
    expect(parseShareUrl(url.href)?.paint).toBeUndefined();
    expect(parseShareUrl(url.href)?.angle).toBe(350);
  });
  test("supports older fragment links", () => {
    expect(
      parseShareUrl(
        "https://studio.example/#v=1&build=g09kmm9f&view=dashboard&lighting=night",
      )?.view,
    ).toBe("dashboard");
  });
  test("an empty fragment does not import a build", () =>
    expect(parseShareHash("")).toBeNull());
  test.each([
    "#v=9&build=g09kmm9f",
    "#v=1&build=g09kmm9f&angle=NaN",
    "#v=1&build=g09kmm9f&angle=360",
    "#v=1&build=g09kmm9f&paint=bad-code",
    "#v=1&build=g09kmm9f&lighting=invalid",
    "#v=1&build=https://evil.example/",
  ])("rejects malformed state %s", (hash) =>
    expect(() => parseShareHash(hash)).toThrow(),
  );
  test("finish labels are presentation labels with a future-value fallback", () => {
    expect(finishName("uni")).toBe("Solid");
    expect(finishName("frozen")).toBe("Frozen");
    expect(finishName("new-effect")).toBe("New-effect");
  });
});
