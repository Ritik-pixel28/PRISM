import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from server import Handler


class Preview(Handler, SimpleHTTPRequestHandler):
    pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=3001)
    args = parser.parse_args()
    assets = Path(__file__).resolve().parents[1] / "frontend/out"
    if not (assets / "index.html").exists():
        parser.error("Run npm --prefix frontend run build:static first")
    print(f"Static PRISM preview: http://127.0.0.1:{args.port}", flush=True)
    ThreadingHTTPServer(
        ("127.0.0.1", args.port), partial(Preview, directory=str(assets))
    ).serve_forever()
