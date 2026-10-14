#!/usr/bin/env python3
"""Lokaler Vorschau-Server für die Sportwagen-Nürnberg-Website.

Startet einen Webserver in diesem Ordner und zeigt die Adresse an,
die Handys im selben WLAN öffnen können. Unterstützt Range-Requests,
damit Videos auch auf dem iPhone (Safari) abspielen.
"""
import http.server, os, re, socket, socketserver, sys, webbrowser

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # no packet is sent; just picks the LAN interface
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".webm": "video/webm", ".mp4": "video/mp4", ".js": "text/javascript"}

    def send_head(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or os.path.isdir(path) or not os.path.isfile(path):
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        size = os.path.getsize(path)
        if not m:
            return super().send_head()
        start = int(m.group(1)) if m.group(1) else max(0, size - int(m.group(2) or 0))
        end = int(m.group(2)) if m.group(1) and m.group(2) else size - 1
        end = min(end, size - 1)
        if start > end:
            self.send_error(416)
            return None
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        self._remaining = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        remaining = getattr(self, "_remaining", None)
        if remaining is None:
            return super().copyfile(source, outputfile)
        while remaining > 0:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, *a):
        pass


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


try:
    httpd = Server(("0.0.0.0", PORT), Handler)
except OSError:
    print(f"Port {PORT} ist belegt. Starte mit anderem Port, z. B.:  python server.py 8080")
    sys.exit(1)

ip = lan_ip()
print("\n  Sportwagen Nürnberg – Vorschau läuft\n")
print(f"  Auf diesem Computer:   http://localhost:{PORT}")
print(f"  Auf dem Handy (WLAN):  http://{ip}:{PORT}\n")
print("  Handy muss im selben WLAN sein. Beenden mit Strg+C.\n")
try:
    webbrowser.open(f"http://localhost:{PORT}")
except Exception:
    pass
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\n  Server beendet.")
