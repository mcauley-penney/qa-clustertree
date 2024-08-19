"""TODO."""

import http.server
import socketserver


class NoCacheRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header(
            "Cache-Control", "no-store, no-cache, must-revalidate, max-age=0"
        )
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    PORT = 8001

    with socketserver.TCPServer(("", PORT), NoCacheRequestHandler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()