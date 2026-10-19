"""Serve the static export locally, including Next.js's exported 404 page."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

EXPORT = Path(__file__).resolve().parents[1] / "out"


class ExportHandler(SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        if code != 404:
            return super().send_error(code, message, explain)
        try:
            content = (EXPORT / "404.html").read_bytes()
        except OSError:
            return super().send_error(code, message, explain)
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(content)


if __name__ == "__main__":
    if not (EXPORT / "index.html").is_file():
        raise SystemExit("Run bun run build before starting the preview.")
    handler = partial(ExportHandler, directory=str(EXPORT))
    with ThreadingHTTPServer(("127.0.0.1", 3000), handler) as server:
        print("Static preview: http://127.0.0.1:3000", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
