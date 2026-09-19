import base64
import mimetypes
from pathlib import Path
from urllib.parse import unquote

from functions.simulate.app import lambda_handler as simulate


STATIC_ROOT = Path(__file__).resolve().parents[2] / "static"


def lambda_handler(event, context=None):
    path = unquote(event.get("rawPath", event.get("path", "/")))
    method = event.get("requestContext", {}).get("http", {}).get(
        "method", event.get("httpMethod", "GET")
    )
    if path in {"/api/simulate", "/simulate"}:
        response = simulate(event, context)
        response["headers"]["Cache-Control"] = "no-store"
        return response
    if method not in {"GET", "HEAD"}:
        return {"statusCode": 405, "body": "Method not allowed"}
    root = STATIC_ROOT.resolve()
    asset = (root / (path.lstrip("/") or "index.html")).resolve()
    if not asset.is_relative_to(root) or not asset.is_file():
        return {"statusCode": 404, "body": "Not found"}
    content_type = mimetypes.guess_type(asset.name)[0] or "application/octet-stream"
    cache = "public,max-age=31536000,immutable" if path.startswith("/_next/static/") else "no-cache"
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": content_type,
            "Cache-Control": cache,
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        "isBase64Encoded": True,
        "body": base64.b64encode(asset.read_bytes()).decode() if method == "GET" else "",
    }
