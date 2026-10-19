import type { View } from "./types";

export function cameraFrames(views: View[], viewId: string) {
  const exterior = viewId === "exterior";
  const source = views.find((view) => view.id === "exterior");
  return exterior
    ? (source?.frames || (source ? [source.params] : [])).map((params) => ({
        id: `angle-${params.angle}`,
        viewId: "exterior",
        label: `${params.angle || 0}°`,
        angle: Number(params.angle || 0),
        params,
        rotatable: true,
      }))
    : views
        .filter((view) => !view.rotatable)
        .map((view) => ({
          id: view.id,
          viewId: view.id,
          label: view.label,
          angle: undefined,
          params: view.params,
          rotatable: false,
        }));
}
