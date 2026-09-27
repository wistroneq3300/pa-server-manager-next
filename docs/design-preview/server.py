"""Local design review only: inject proposal into unmodified fixture-backed app."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
import argparse

HERE = Path(__file__).resolve().parent
DEFAULT_REPO = HERE.parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--repo', type=Path, default=DEFAULT_REPO)
parser.add_argument('--port', type=int, default=8886)
args = parser.parse_args()
ROOT = args.repo.resolve()

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path in ('/', '/index.html'):
            source = (ROOT / 'static/index.html').read_text(encoding='utf-8')
            source = source.replace('</head>', '<script src="/static/js/preview-fixtures.js"></script><link rel="stylesheet" href="/design/proposal.css"></head>')
            source = source.replace('</body>', '<script src="/design/proposal.js"></script></body>')
            return self.reply(source.encode('utf-8'), 'text/html; charset=utf-8')
        if path.startswith('/design/'):
            file = (HERE / path.removeprefix('/design/')).resolve()
            allowed = file.parent == HERE and file.suffix in ('.css', '.js')
        elif path.startswith('/static/'):
            file = (ROOT / path.lstrip('/')).resolve()
            allowed = file.is_relative_to(ROOT / 'static')
        else:
            return self.send_error(404, 'Isolated design preview: no live backend')
        if not allowed or not file.is_file():
            return self.send_error(404)
        self.reply(file.read_bytes(), self.guess_type(str(file)))

    def reply(self, content, mime):
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, *args):
        pass

print(f'Design preview: http://127.0.0.1:{args.port}/', flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
