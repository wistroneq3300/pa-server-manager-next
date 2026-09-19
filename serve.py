from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent

class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path in ('/', '/index.html'):
            self.path = '/static/index.html'
        if self.path.startswith(('/api/', '/ws/')):
            self.send_error(404, 'Design preview has no live backend')
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    print('Wistron product preview: http://127.0.0.1:8768/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8768), PreviewHandler).serve_forever()
