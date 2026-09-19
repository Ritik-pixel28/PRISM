import base64
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from functions.web.app import lambda_handler


class WebTests(unittest.TestCase):
    def setUp(self):
        self.directory = TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name) / "static"
        self.root.mkdir()
        (self.root / "index.html").write_text("<h1>PRISM</h1>")
        (self.root.parent / "secret.txt").write_text("private")
        self.patch = patch("functions.web.app.STATIC_ROOT", self.root)
        self.patch.start()
        self.addCleanup(self.patch.stop)

    def event(self, path="/", method="GET"):
        return {"rawPath": path, "requestContext": {"http": {"method": method}}}

    def test_document_and_head(self):
        response = lambda_handler(self.event())
        self.assertEqual(base64.b64decode(response["body"]), b"<h1>PRISM</h1>")
        self.assertEqual(response["headers"]["Content-Type"], "text/html")
        self.assertEqual(lambda_handler(self.event(method="HEAD"))["body"], "")

    def test_binary_asset(self):
        asset = self.root / "_next/static/font.woff2"
        asset.parent.mkdir(parents=True)
        asset.write_bytes(b"\x00\xff\x80")
        response = lambda_handler(self.event("/_next/static/font.woff2"))
        self.assertEqual(base64.b64decode(response["body"]), asset.read_bytes())
        self.assertIn("immutable", response["headers"]["Cache-Control"])

    def test_missing_and_traversal(self):
        for path in ["/missing.js", "/../secret.txt", "/%2e%2e/secret.txt"]:
            with self.subTest(path=path):
                self.assertEqual(lambda_handler(self.event(path))["statusCode"], 404)

    def test_methods_and_api(self):
        self.assertEqual(lambda_handler(self.event(method="POST"))["statusCode"], 405)
        event = self.event("/api/simulate", "POST")
        architecture = json.loads((Path(__file__).resolve().parents[1] / "sample-data/architecture.json").read_text())
        event["body"] = json.dumps({"architecture": architecture, "scenario": {"type": "traffic", "multiplier": 10}})
        response = lambda_handler(event)
        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(json.loads(response["body"])["add_nodes"], 5)
        self.assertEqual(response["headers"]["Cache-Control"], "no-store")


if __name__ == "__main__":
    unittest.main()
