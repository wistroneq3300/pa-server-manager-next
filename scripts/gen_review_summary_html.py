#!/usr/bin/env python3
# Generate a self-contained, CSS-paged HTML summary of the full reviewed test library
# (3112 items / 6 sheets) from data/tests.json. One tab per sheet; search/sort/verdict filter.
# ASCII-only source; CJK is injected from tests.json only (avoids any encoding risk).
# Usage: python3 scripts/gen_review_summary_html.py [input.json] [output.html]
import json
import html
import sys
import os

SRC = sys.argv[1] if len(sys.argv) > 1 else 'data/tests.json'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'docs/ui-preview/review_summary_all_sheets.html'

data = json.load(open(SRC, encoding='utf-8'))
sheets = data['sheets']

VERDICTS = ['YES', 'PARTIAL', 'NO', 'UNRESOLVED']
V_COLORS = {
    'YES': '#1a7f37',
    'PARTIAL': '#b45309',
    'NO': '#b91c1c',
    'UNRESOLVED': '#6b7280',
}

def esc(v):
    return html.escape(str(v if v is not None else ''))

def verdict_of(it):
    # report-level UNRESOLVED: criteria/procedure first line literal TBD
    for key in ('criteria', 'procedure'):
        first = str(it.get(key) or '').strip().split('\n')[0].strip().upper()
        if first == 'TBD' or first == 'TBD.':
            return 'UNRESOLVED'
    return str(it.get('ai_can_execute') or '').strip().upper() or 'UNRESOLVED'

def mini_command(cmd, width=150):
    cmd = str(cmd or '').strip()
    if '\n' in cmd:
        cmd = cmd.split('\n')[0]
    cmd = cmd.replace('\r', ' ')
    return cmd if len(cmd) <= width else cmd[:width] + '…'

# ---------------- per-sheet aggregation ----------------
sheet_meta = []   # dicts for ordering
per_sheet = {}    # name -> list of item dicts (with verdict etc.)

ORDER_EN = ['Functionality', 'Reliability', 'Performance', 'Compatibility', 'Stability', '(No Main Function)']
# map English name -> actual (Chinese) dict key in tests.json
key_by_en = {}
for k, s in sheets.items():
    key_by_en[s.get('name')] = k

for order, en in enumerate(ORDER_EN):
    key = key_by_en.get(en)
    if key is None:
        continue
    s = sheets[key]
    recs = []
    for it in s['items']:
        rec = dict(it)
        rec['_verdict'] = verdict_of(it)
        recs.append(rec)
    per_sheet[key] = recs
    sheet_meta.append((order, key, s.get('label') or key, s.get('count'), len(recs)))

sheet_meta.sort()
TOTAL_ALL = data.get('total', sum(m[4] for m in sheet_meta))

# global verdict totals
from collections import Counter
global_vc = Counter()
for _, key, _, _, _ in sheet_meta:
    for r in per_sheet[key]:
        global_vc[r['_verdict']] += 1

# ---------------- HTML ----------------
parts = []
A = parts.append

A('<!DOCTYPE html>')
A('<html lang="zh-Hant">')
A('<head>')
A('<meta charset="UTF-8">')
A('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
A('<title>Test Library Review Summary (3112 / 6 sheets)</title>')
A('<style>')
A('''
:root { --bg:#0f172a; --panel:#1e293b; --line:#334155; --txt:#e2e8f0; --mut:#94a3b8; --acc:#38bdf8; }
* { box-sizing:border-box; }
body { margin:0; background:linear-gradient(160deg,#0f172a,#1e293b); color:var(--txt);
       font-family:'Segoe UI',Roboto,'Noto Sans TC','PingFang TC',sans-serif; }
.wrap { max-width:1280px; margin:0 auto; padding:24px; }
h1 { font-size:22px; margin:0 0 4px; letter-spacing:.5px; }
h1 .em { color:var(--acc); }
.sub { color:var(--mut); font-size:13px; margin-bottom:18px; }
.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:20px; }
.card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px 16px; }
.card .n { font-size:24px; font-weight:700; }
.card .l { font-size:12px; color:var(--mut); margin-top:2px; }
.badge { display:inline-block; padding:2px 9px; border-radius:999px; font-size:12px; font-weight:600; color:#fff; }
.tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
.tab { background:var(--panel); border:1px solid var(--line); color:var(--mut);
       padding:8px 16px; border-radius:10px; cursor:pointer; font-size:14px; }
.tab.active { background:var(--acc); border-color:var(--acc); color:#05243a; font-weight:700; }
.tab .c { font-size:11px; opacity:.8; margin-left:6px; }
.pane { display:none; }
.pane.active { display:block; }
.sheetbar { display:flex; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
.sheetbar .title { font-size:16px; font-weight:700; margin-right:auto; }
.toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px; }
.toolbar input[type=text] { background:#0b1220; border:1px solid var(--line); color:var(--txt);
       padding:7px 12px; border-radius:8px; width:260px; font-size:13px; }
.filters { display:flex; gap:6px; flex-wrap:wrap; }
.fchip { border:1px solid var(--line); background:var(--panel); color:var(--mut); padding:6px 12px;
       border-radius:999px; cursor:pointer; font-size:12px; }
.fchip.active { color:#fff; }
.fchip[data-v=YES].active { background:#1a7f37; border-color:#1a7f37; }
.fchip[data-v=PARTIAL].active { background:#b45309; border-color:#b45309; }
.fchip[data-v=NO].active { background:#b91c1c; border-color:#b91c1c; }
.fchip[data-v=UNRESOLVED].active { background:#6b7280; border-color:#6b7280; }
table { width:100%; border-collapse:collapse; background:var(--panel); border-radius:12px; overflow:hidden; }
th,td { padding:8px 10px; border-bottom:1px solid var(--line); text-align:left; font-size:12.5px; vertical-align:top; }
th { background:#0b1220; color:var(--mut); font-weight:600; cursor:pointer; white-space:nowrap; user-select:none; }
th:hover { color:var(--acc); }
td code { color:#7dd3fc; font-size:12px; }
td .cmd { color:#cbd5e1; font-size:12px; }
.pager { display:flex; align-items:center; gap:10px; margin-top:12px; font-size:13px; color:var(--mut); }
.pager button { background:var(--panel); border:1px solid var(--line); color:var(--txt);
       padding:6px 12px; border-radius:8px; cursor:pointer; }
.pager button:disabled { opacity:.4; cursor:default; }
.pager .info { margin-left:auto; }
.mut { color:var(--mut); }
.mono { font-family:ui-monospace,SFMono-Regular,Consolas,monospace; }
.foot { margin-top:24px; color:var(--mut); font-size:12px; border-top:1px solid var(--line); padding-top:12px; }
''')
A('</style>')
A('</head>')
A('<body><div class="wrap">')

# header
A('<h1>Test Library Review Summary — <span class="em">%s</span> / 6 sheets</h1>' % TOTAL_ALL)
A('<div class="sub">Wistron PA test library (source: <span class="mono">data/tests.json</span>) · '
  'verdict = <span class="mono">ai_can_execute</span>, UNRESOLVED = first-line TBD criteria/procedure (report level)</div>')

# global stat cards
A('<div class="cards">')
A('<div class="card"><div class="n">%d</div><div class="l">Total items</div></div>' % TOTAL_ALL)
for v in VERDICTS:
    n = global_vc.get(v, 0)
    A('<div class="card"><div class="n" style="color:%s">%d</div><div class="l">%s</div></div>' % (V_COLORS[v], n, v))
A('</div>')

# tabs
A('<div class="tabs" id="tabs">')
for i, (order, key, label, cnt, nrecs) in enumerate(sheet_meta):
    A('<div class="tab%s" data-tab="%d" onclick="openTab(%d)">%s<span class="c">%d</span></div>'
      % (' active' if i == 0 else '', i, i, esc(label), nrecs))
A('</div>')

# panes
A('<div id="panes">')
for i, (order, key, label, cnt, nrecs) in enumerate(sheet_meta):
    recs = per_sheet[key]
    sheet_vc = Counter(r['_verdict'] for r in recs)
    A('<div class="pane%s" data-pane="%d">' % (' active' if i == 0 else '', i))

    # sheet summary chips
    A('<div class="sheetbar"><span class="title">%s <span class="mut mono">(%s)</span></span></div>' % (esc(label), esc(key)))
    A('<div class="toolbar">')
    A('<input type="text" id="q%d" placeholder="Search code / items / test set / sub function…" oninput="applyFilter(%d)" onkeyup="applyFilter(%d)">'
      % (i, i, i))
    A('<div class="filters" data-filters="%d">' % i)
    A('<div class="fchip active" data-v="ALL" onclick="setVerdictFilter(%d,\'ALL\',this)">ALL <span class="c">%d</span></div>' % (i, len(recs)))
    for v in VERDICTS:
        n = sheet_vc.get(v, 0)
        A('<div class="fchip%s" data-v="%s" onclick="setVerdictFilter(%d,\'%s\',this)">%s <span class="c">%d</span></div>'
          % (' active' if v == 'ALL' or n == 0 else '', v, i, v, v, n))
    A('</div></div>')

    # table
    A('<div class="tblwrap">')
    A('<table id="tbl%d">' % i)
    A('<thead><tr>'
      '<th onclick="sortBy(%d,0,0)">#</th>'
      '<th onclick="sortBy(%d,1,0)">Code</th>'
      '<th onclick="sortBy(%d,2,0)">Verdict</th>'
      '<th onclick="sortBy(%d,3,0)">TestSet</th>'
      '<th onclick="sortBy(%d,4,0)">Items</th>'
      '<th onclick="sortBy(%d,5,0)">SubFunc</th>'
      '<th onclick="sortBy(%d,6,0)">Packages</th>'
      '<th onclick="sortBy(%d,7,0)">Command (head)</th>'
      '</tr></thead>' % (i,i,i,i,i,i,i,i))
    A('<tbody id="tbody%d"></tbody>' % i)
    A('</table></div>')

    A('<div class="pager">')
    A('<button onclick="page(%d,-1)" id="prev%d">‹ Prev</button>' % (i, i))
    A('<span id="pageinfo%d">1 / 1</span>' % i)
    A('<button onclick="page(%d,1)" id="next%d">Next ›</button>' % (i, i))
    A('<span class="info">showing <span id="shown%d">0</span> / %d</span>' % (i, len(recs)))
    A('</div>')

    # embed data as JSON script
    rows = []
    for r in recs:
        rows.append({
            'code': r.get('code', ''),
            'v': r['_verdict'],
            'testset': r.get('test_set', ''),
            'items': r.get('items', ''),
            'sub': r.get('sub_function', ''),
            'pkg': r.get('ai_packages_needed', ''),
            'cmd': mini_command(r.get('ai_commands', '')),
            'full': (str(r.get('code', '')) + ' ' + str(r.get('items', '')) + ' ' +
                     str(r.get('test_set', '')) + ' ' + str(r.get('sub_function', ''))).lower(),
        })
    A('<script type="application/json" id="data%d">%s</script>' % (i, json.dumps(rows, ensure_ascii=False)))
    A('</div><!-- /pane %d -->' % i)
A('</div><!-- /panes -->')

A('<div class="foot">Generated from <span class="mono">%s</span> · %d items · 6 sheets · each sheet is a separate tab (not piled on one page).</div>' % (esc(os.path.basename(SRC)), TOTAL_ALL))
A('</div></body>')

# ---------------- JS ----------------
A('<script>')
A(('const SHEETS = @SHEETS@;\n'
   'const VERDICS = @VERDICS@;\n'
   'const VERDICT_COLORS = @COLORS@;\n'
   'const current = { q:\'\', v:\'ALL\', sortIdx:1, dir:1, page:0 };\n'
   'const PAGE_SIZE = 50;\n')
   .replace('@SHEETS@', str(len(sheet_meta)))
   .replace('@VERDICS@', json.dumps(VERDICTS))
   .replace('@COLORS@', json.dumps(V_COLORS)))
A('''
function dataOf(i){ return JSON.parse(document.getElementById('data'+i).textContent); }
function openTab(i){
  document.querySelectorAll('.tab').forEach((t,j)=>t.classList.toggle('active', j===i));
  document.querySelectorAll('.pane').forEach((p,j)=>p.classList.toggle('active', j===i));
  render(i);
}
function setVerdictFilter(i, v, el){
  el.parentNode.querySelectorAll('.fchip').forEach(c=>c.classList.toggle('active', c===el));
  current.v = v; current.page = 0; render(i);
}
function applyFilter(i){ current.q = (document.getElementById('q'+i).value||'').trim().toLowerCase(); current.page=0; render(i); }
function filtered(i){
  return dataOf(i).filter(r => (current.v==='ALL'||r.v===current.v) && (current.q===''||r.full.includes(current.q)));
}
function sortBy(i, idx){
  if(current.sortIdx===idx){ current.dir*=-1; } else { current.sortIdx=idx; current.dir=1; }
  current.page=0; render(i);
}
function page(i, d){
  const n = filtered(i).length; const pages = Math.max(1, Math.ceil(n/PAGE_SIZE));
  current.page = Math.min(Math.max(0, current.page + d), pages-1); render(i);
}
function render(i){
  const rows = filtered(i);
  const pages = Math.max(1, Math.ceil(rows.length/PAGE_SIZE));
  if(current.page > pages-1) current.page = pages-1;
  const p = current.page;
  rows.sort((a,b)=>{
    let va=a, vb=b;
    if(current.sortIdx===0) va=a.code, vb=b.code;
    else if(current.sortIdx===1) va=a.code, vb=b.code;
    else if(current.sortIdx===2) va=a.v, vb=b.v;
    else if(current.sortIdx===3) va=a.testset, vb=b.testset;
    else if(current.sortIdx===4) va=a.items, vb=b.items;
    else if(current.sortIdx===5) va=a.sub, vb=b.sub;
    else if(current.sortIdx===6) va=a.pkg, vb=b.pkg;
    else va=a.cmd, vb=b.cmd;
    va=String(va).toLowerCase(); vb=String(vb).toLowerCase();
    return va<vb?-1:va>vb?1:0;
  });
  if(current.dir===-1) rows.reverse();
  const start = p*PAGE_SIZE, end = Math.min(start+PAGE_SIZE, rows.length);
  const slice = rows.slice(start, end);
  let h = '';
  slice.forEach((r, k)=>{
    const cls = VERDICT_COLORS[r.v]||'#6b7280';
    h += '<tr><td>'+(start+k+1)+'</td><td><code>'+esc(r.code)+'</code></td>'
       + '<td><span class="badge" style="background:'+cls+'">'+r.v+'</span></td>'
       + '<td>'+esc(r.testset)+'</td><td>'+esc(r.items)+'</td><td>'+esc(r.sub)+'</td><td>'+esc(r.pkg)+'</td>'
       + '<td class="cmd">'+esc(r.cmd)+'</td></tr>';
  });
  document.getElementById('tbody'+i).innerHTML = h;
  document.getElementById('pageinfo'+i).textContent = (p+1)+' / '+pages;
  document.getElementById('shown'+i).textContent = rows.length;
  document.getElementById('prev'+i).disabled = (p===0);
  document.getElementById('next'+i).disabled = (p>=pages-1);
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
openTab(0);
''')
A('</script>')
A('</html>')

html_text = '\n'.join(parts)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(html_text)
print('wrote', OUT, len(html_text), 'bytes')
for (order, key, label, cnt, nrecs) in sheet_meta:
    print('  %-22s %s  %4d items' % (key, label, nrecs))
print('global verdicts:', dict(global_vc))
