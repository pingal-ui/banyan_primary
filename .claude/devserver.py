"""Static dev server for the prototype.

Mirrors serve.json: no-store on everything (so edits to app.js / styles.css show up
on a plain reload) and "/" -> transactions.html. Used because this machine has no Node.
"""
import functools, http.server, sys

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def translate_path(self, path):
        if path.split('?')[0] in ('/', '/index.html'):
            path = '/transactions.html'
        return super().translate_path(path)

    def log_message(self, fmt, *args):  # keep the log to real problems
        if not args or str(args[1] if len(args) > 1 else '').startswith(('2', '3')):
            return
        super().log_message(fmt, *args)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3111
    http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
