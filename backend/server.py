from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from functions.simulate.app import lambda_handler


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.respond({"httpMethod": "OPTIONS"})

    def do_POST(self):
        if self.path != "/simulate":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 <= length <= 100_000:
                self.send_error(413)
                return
            body = self.rfile.read(length).decode("utf-8")
        except (ValueError, UnicodeError):
            self.send_error(400)
            return
        self.respond({"httpMethod": "POST", "body": body})

    def respond(self, event):
        result = lambda_handler(event)
        self.send_response(result["statusCode"])
        for key, value in result["headers"].items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(result["body"].encode())


if __name__ == "__main__":
    print("PRISM engine listening on http://127.0.0.1:8000", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
