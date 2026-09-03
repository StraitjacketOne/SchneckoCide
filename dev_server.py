#!/usr/bin/env python3
"""
Mini-Webserver zum Entwickeln.

Warum nicht einfach `python -m http.server`? Weil der Browser geaenderte
JS-Dateien aus seinem Cache liefert: Du aenderst Code, laedst neu - und siehst
die alte Version. Dieser Server verbietet das Caching, dadurch ist jeder Reload
garantiert der aktuelle Stand.

Start:  python dev_server.py [port]     ->  http://127.0.0.1:8123
Ende:   Strg+C
"""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass          # keine Zugriffslogs, das Terminal bleibt lesbar


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), NoCacheHandler) as httpd:
        print('Server laeuft: http://127.0.0.1:%d   (Strg+C beendet)' % PORT)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nBeendet.')
