# Architecture

BMW Individual Studio is a static Next.js application. The root layout provides shared navigation and the footer; the client visualizer owns the interactive studio. The production build exports HTML, CSS, JavaScript, and icons to `out/`.

## Data flow

1. Parse a BMW USA build code or HTTPS builder link.
2. Fetch the saved build and live Individual model catalog in parallel.
3. Match the imported model range to catalog variants. A unique match is selected automatically; multiple matches require the visitor to choose.
4. Fetch that variant’s paint palette and extract the imported render templates.
5. Change paint and presentation parameters while preserving vehicle, wheels, upholstery, trim, and equipment parameters.
6. Fetch and validate the rendered image before replacing the displayed preview.

Requests use `credentials: omit`, abort signals, and timeouts. HTTP failures and unexpected image formats are rejected. A failed render leaves the last successful preview visible and labeled.

## Responsibilities

| Location                           | Responsibility                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `app/layout.tsx`                   | Shared document structure, fonts, navigation, and footer                          |
| `app/globals.css`                  | Theme tokens, shared component styling, and responsive layouts                    |
| `components/studio/visualizer.tsx` | Import UI, filters, image controls, URL synchronization, and downloads            |
| `hooks/use-visualizer.ts`          | Imports, cancellation, palette/render state, image lifecycle, and diagnostic logs |
| `lib/bmw/client.ts`                | Direct BMW requests and response validation                                       |
| `lib/bmw/cosy.ts`                  | Render encoding/decoding, camera extraction, and equipment-preservation checks    |
| `lib/bmw/share.ts`                 | Share URL serialization, parsing, and validation                                  |
| `lib/bmw/views.ts`                 | Camera frame selection shared by the main image and thumbnail strip               |

Generated shadcn primitives stay in `components/ui/`; product components compose them in `components/studio/` and `components/layout/`. All theme and product styling lives in the global stylesheet. Inline styles are reserved for live paint swatch values.

## BMW integrations

| Purpose            | Endpoint                                                                      |
| ------------------ | ----------------------------------------------------------------------------- |
| Import saved build | `https://configure.bmwusa.com/UBYOConfigurator/v4/configuration/start/{code}` |
| Discover models    | `https://api.visualizer.aws.bmw.cloud/v1/cars`                                |
| Load model palette | `https://api.visualizer.aws.bmw.cloud/v1/cars/{range}/{typeCode}/colors`      |
| Render vehicle     | `https://prod.cosy.bmw.cloud/bmwusa/cosySec`                                  |

These public client endpoints are undocumented dependencies, not a supported integration contract. There is no proxy, shipped paint catalog, manual model compatibility table, or server fallback.

## Filtering and camera views

Finish choices come from `effect`; `uni` is displayed as Solid. Color families come from `mainColor`, with an Unspecified group for missing values. Both filters combine with text search without changing the selected paint.

Exterior frames and fixed interior cameras come from the imported templates. Interior views are images, not an interactive panorama. Night mode uses BMW’s lighting parameters. The main image controls and thumbnails share frame selection; navigation loops through the available views.

## URLs and downloads

`/studio/` query parameters hold the source build code, catalog model, optional Individual paint, camera, angle, and lighting. Selection changes update the URL with the History API. Share links use that same selection; search/filter settings are omitted. Legacy fragment links are still accepted.

Recipients fetch BMW data and validate the selection before displaying it. Original paint is represented by omitting a paint override. Removed paints or variants produce an explicit error.

Image download saves the currently displayed validated blob without another render request. Downloads are disabled while importing or rendering. Request logs can also be downloaded for troubleshooting.

## Loading and recovery

A direct studio visit renders a matching skeleton while importing. Replacing an existing build stages its palette and first image before committing the replacement, preserving the previous studio if import fails.

- Expected build import failures use the shared recovery screen or an inline form alert.
- Palette and render failures stay inside the studio, with retry controls where available.
- `app/error.tsx` catches unexpected rendering crashes below the root layout.
- `app/global-error.tsx` covers root-layout crashes and supplies its own document and styles.
- `app/not-found.tsx` generates the custom static 404 page.

## Storage and hosting

There is no application-managed cache, database, account system, or background revalidation. Normal browser HTTP caching follows upstream response headers. The current image remains in memory as a blob URL and is revoked when replaced or unmounted.

There are no runtime API routes, Server Actions, SSR, or image optimization. Build-time font fetching and static hosting still require the usual network access and hosting resources.
