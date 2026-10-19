# Development

## Setup

Use the Bun version pinned in `package.json` and a supported Node.js runtime for Next.js. Install the locked dependencies:

```sh
bun install --frozen-lockfile
bun run dev
```

No environment variables are required. The app fetches BMW data and images directly in the browser.

## Working conventions

- Keep routes, metadata, and document structure in `app/`.
- Keep shared site chrome in `components/layout/`, product UI in `components/studio/`, and generated shadcn components in `components/ui/`.
- Keep BMW transport/protocol logic in `lib/bmw/` and interactive state in `hooks/`.
- Add theme variables and shared styles to `app/globals.css`; avoid separate component styling systems.
- Reuse installed shadcn primitives. This project uses Base UI, so consult the installed API before copying Radix examples.
- Keep model and paint choices driven by BMW responses. Do not silently substitute an unavailable selection.
- Preserve imported equipment when changing render parameters.
- Read `AGENTS.md` and the bundled Next.js documentation when changing framework behavior.

## Verification

```sh
bun run check
```

This checks formatting, runs ESLint and Bun tests, then builds the static export with TypeScript validation. `bun run typecheck` is also available as a standalone check after Next.js has generated its route types.

The unit tests cover build input validation, render encoding/decoding, preservation of equipment, supported camera templates, lighting parameters, and share URL round trips and invalid input. They do not depend on BMW being available.

For changes to interaction or layout, also verify in a browser:

- Import a valid build and replace it with another build.
- Search/filter paints, switch views and lighting, and navigate the carousel.
- Reload and open shared URLs directly; download the displayed image.
- Check invalid links, unavailable palettes, render failures, and retry behavior.
- Check desktop/mobile layouts and the custom 404.

Live browser checks are separate from the unit suite and depend on BMW endpoints. A useful example is `g09kmm9f`; like all saved BMW codes, its future availability is outside this project’s control.

## Formatting

```sh
bun run format
bun run format:check
```

Prettier formats source and documentation; `.editorconfig` defines basic editor conventions. Generated build output and image assets are excluded.

## Static preview

```sh
bun run build
bun run preview
```

The Python 3 preview server serves `out/` at `http://127.0.0.1:3000`, including the exported 404 page for unknown URLs. Stop an existing process on that port before starting it. Run `bun run dev` instead when you need live reload; rebuild before previewing source changes.

## Deployment

Deploy the generated `out/` directory as static files. Preserve `/studio/` routing and configure unknown URLs to return `404.html` with status 404. Do not rewrite every unknown path to the homepage.

For Vercel, use the Bun install command and `bun run build` with output directory `out`. No runtime functions are required. Verify BMW CORS, direct shared visits, clipboard sharing, and image downloads from the final HTTPS origin before launch.

The site does not store builds on an application server. Query parameters contain the configuration code and visualization selections, so treat a share link as a link to that build. Diagnostic exports contain request URLs and the source build code; review them before sharing.
