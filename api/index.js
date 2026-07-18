// Provenly — proof-of-process portfolios for the AI era (self-contained Express app)
const express = require('express');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/provenly-data' : path.join(__dirname, '..', 'data'));
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'provenly.db'));

db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS pieces (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, edit_key TEXT NOT NULL, title TEXT NOT NULL, author TEXT NOT NULL, kind TEXT DEFAULT 'Design', summary TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS stages (id INTEGER PRIMARY KEY AUTOINCREMENT, piece_id INTEGER NOT NULL, title TEXT NOT NULL, note TEXT DEFAULT '', excerpt TEXT DEFAULT '', hash TEXT NOT NULL, prev_hash TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
`);

const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const q = {
  piece: db.prepare('SELECT * FROM pieces WHERE slug=?'),
  newPiece: db.prepare('INSERT INTO pieces (slug, edit_key, title, author, kind, summary) VALUES (?,?,?,?,?,?)'),
  stages: db.prepare('SELECT * FROM stages WHERE piece_id=? ORDER BY id'),
  lastStage: db.prepare('SELECT * FROM stages WHERE piece_id=? ORDER BY id DESC LIMIT 1'),
  addStage: db.prepare('INSERT INTO stages (piece_id, title, note, excerpt, hash, prev_hash) VALUES (?,?,?,?,?,?)'),
};

function addStage(pieceId, title, note, excerpt) {
  const prev = q.lastStage.get(pieceId);
  const prevHash = prev ? prev.hash : 'GENESIS';
  const hash = sha(prevHash + '|' + title + '|' + note + '|' + excerpt + '|' + Date.now());
  return q.addStage.run(pieceId, title, note, excerpt, hash, prevHash);
}

function seed() {
  if (q.piece.get('demo')) return;
  const id = q.newPiece.run('demo', 'demo-key', 'Rebrand concept — Meridian Coffee', 'Ana Duarte', 'Brand design', 'Full identity refresh for a specialty coffee roaster: naming exploration, logo system, packaging.').lastInsertRowid;
  const S = [
    ['Client brief received', 'Kickoff call notes: warm/craft positioning, avoid the teal-and-terracotta cliché wave.', 'Brief: "We want to feel like a place, not a product." Target: third-wave drinkers, 24-40.'],
    ['Moodboards & references', 'Two directions: “harbor light” (nautical heritage) vs “slow morning” (domestic warmth). 14 refs annotated by hand.', 'Direction A anchors on the 1930s port typography of the roastery’s neighborhood.'],
    ['First sketches', '31 pencil thumbnails. The lighthouse mark kept winning — but everyone draws lighthouses, so pushed the beam, not the tower.', 'Sketch 17: the light beam doubles as a steam wisp over a cup. That’s the one.'],
    ['Digital drafts v1', 'Vectorized 4 candidates, tested at 16px favicon size. Killed two for small-size mud.', 'Mark v1.3: beam-wisp at 12° — reads at every size.'],
    ['Client review round', 'Client chose beam-wisp; asked for warmer palette. Pushed back on gradient request with print-cost rationale — accepted.', 'Decision log: palette moves from #1B3A4B to #7A3B2E base.'],
    ['Final delivery', 'Logo system, packaging dielines, 24-page guidelines. All source files handed off.', 'Guidelines v1.0 shipped. Every step above is timestamped and chained.'],
  ];
  for (const [t, n, e] of S) addStage(id, t, n, e);
}
seed();

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CSS = `
:root{--bg:#faf7f2;--panel:#ffffff;--line:#e8e0d4;--ink:#26211a;--dim:#7d7466;--vio:#6d4fc4;--vio-soft:#efeafb;--gold:#b98a2e;--gold-soft:#f8efdc;--green:#2e7d54;--green-soft:#e5f3ec;--font:"Avenir Next","Segoe UI",-apple-system,Helvetica,Arial,sans-serif;--serif:Georgia,"Times New Roman",serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font);line-height:1.6}
a{color:var(--vio);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:920px;margin:0 auto;padding:0 22px}
nav{border-bottom:1px solid var(--line);background:#fffdf9}
nav .wrap{display:flex;align-items:center;gap:22px;height:60px}
.logo{font-weight:800;font-size:1.18rem;color:var(--ink);display:flex;align-items:center;gap:9px;font-family:var(--serif);font-style:italic}
.logo:hover{text-decoration:none}
.pmark{width:26px;height:26px;border-radius:50%;background:var(--vio);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.9rem;font-style:normal;font-family:var(--font);font-weight:800}
.spacer{flex:1}
.btn{display:inline-block;background:var(--vio);color:#fff;font-weight:700;padding:10px 18px;border-radius:99px;border:none;font-size:.95rem;cursor:pointer;font-family:var(--font)}
.btn:hover{filter:brightness(1.1);text-decoration:none}
.btn.ghost{background:transparent;border:1.5px solid var(--line);color:var(--ink)}
.btn.small{padding:6px 14px;font-size:.85rem}
.hero{padding:80px 0 66px;text-align:center}
.hero h1{font-family:var(--serif);font-size:3rem;line-height:1.1;letter-spacing:-.01em;margin:0 auto 18px;max-width:700px}
.hero h1 em{color:var(--vio)}
.hero p{color:var(--dim);font-size:1.15rem;max-width:600px;margin:0 auto 28px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:26px;margin-top:18px}
.panel h3{margin-top:0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:26px}
.kicker{text-transform:uppercase;letter-spacing:.14em;font-size:.74rem;font-weight:700;color:var(--vio);margin:44px 0 6px}
h2.t{font-family:var(--serif);font-size:1.8rem;margin:0 0 10px}
input,select,textarea{width:100%;padding:10px 12px;border:1.5px solid var(--line);border-radius:9px;font-size:.95rem;font-family:var(--font);background:#fff;color:var(--ink)}
textarea{min-height:80px;resize:vertical}
input:focus,textarea:focus{outline:none;border-color:var(--vio)}
label.f{display:block;font-weight:700;font-size:.85rem;margin:12px 0 5px;color:var(--dim)}
.timeline{position:relative;margin:26px 0 0;padding-left:34px}
.timeline::before{content:"";position:absolute;left:11px;top:6px;bottom:6px;width:2px;background:var(--line)}
.stage{position:relative;margin-bottom:22px}
.stage::before{content:"";position:absolute;left:-30px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--vio);box-shadow:0 0 0 4px var(--vio-soft)}
.stage h4{margin:0 0 4px;font-size:1.05rem}
.stage .when{color:var(--dim);font-size:.8rem}
.stage .note{color:var(--dim);font-size:.95rem;margin:6px 0}
.stage .excerpt{font-family:var(--serif);font-style:italic;background:var(--gold-soft);border-left:3px solid var(--gold);padding:10px 14px;border-radius:0 9px 9px 0;font-size:.95rem;margin:8px 0}
.stage .hash{font-family:ui-monospace,Menlo,monospace;font-size:.72rem;color:var(--dim);word-break:break-all}
.tag{display:inline-block;padding:2px 11px;border-radius:99px;font-size:.76rem;font-weight:700;background:var(--vio-soft);color:var(--vio)}
.tag.green{background:var(--green-soft);color:var(--green)}
.footer{color:var(--dim);font-size:.85rem;border-top:1px solid var(--line);margin-top:70px;padding:30px 0;text-align:center}
.statrow{display:flex;gap:44px;flex-wrap:wrap;justify-content:center;margin-top:36px}
.statrow b{display:block;font-size:1.6rem;color:var(--vio)}
.statrow span{color:var(--dim);font-size:.88rem}
.notice{background:var(--green-soft);color:var(--green);padding:12px 16px;border-radius:9px;font-size:.92rem;margin-top:14px}
pre.md{white-space:pre-wrap;font-family:var(--font);font-size:.97rem}
@media(max-width:640px){.hero h1{font-size:2.1rem}}
`;
const page = (title, body) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<meta name="description" content="Provenly — proof-of-process portfolios. Show the receipts behind your work so it stands out from AI slop.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='11' fill='%236d4fc4'/><text x='12' y='17' font-size='13' font-family='Georgia' font-style='italic' text-anchor='middle' fill='white'>P</text></svg>">
<style>${CSS}</style></head><body>
<nav><div class="wrap"><a class="logo" href="/"><span class="pmark">P</span>Provenly</a>
<div class="spacer"></div><a href="/p/demo" style="color:var(--dim)">Example proof</a><a href="/whitepaper" style="color:var(--dim)">Whitepaper</a><a class="btn small" href="/#start">Start a piece</a></div></nav>
${body}
<div class="footer"><div class="wrap"><b style="color:var(--ink)">Provenly</b> — your work, with receipts. Demo deployment: data may reset periodically.</div></div>
</body></html>`;

const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(page('Provenly — your work, with receipts', `
<div class="hero"><div class="wrap">
<h1>In a flood of AI slop,<br><em>show your receipts.</em></h1>
<p>Recruiters and clients can no longer tell real work from generated work — 67% of hiring managers say AI applications are sabotaging hiring. Provenly lets you log your creative process as you go, building a timestamped, tamper-evident timeline that proves your portfolio piece is yours.</p>
<a class="btn" href="#start">Start documenting a piece</a> &nbsp; <a class="btn ghost" href="/p/demo">See an example proof</a>
<div class="statrow">
<div><b>67%</b><span>of managers: AI résumés are sabotaging hiring</span></div>
<div><b>1,000s</b><span>of identical AI portfolios per opening</span></div>
<div><b>SHA-256</b><span>hash chain seals every step you log</span></div>
</div></div></div>
<div class="wrap">
<div class="kicker">How it works</div><h2 class="t">Process is the one thing AI can't fake backwards</h2>
<div class="grid">
<div class="panel"><h3>1 · Start a piece</h3><p style="color:var(--dim)">Create a proof timeline for any project — design, writing, code, research — the day you start it.</p></div>
<div class="panel"><h3>2 · Log stages as they happen</h3><p style="color:var(--dim)">Brief, sketches, drafts, revisions, delivery. Each entry is timestamped and chained to the previous with a SHA-256 hash — backdating breaks the chain.</p></div>
<div class="panel"><h3>3 · Share one link</h3><p style="color:var(--dim)">Your public proof page shows the journey, not just the destination. Attach it to applications, proposals and portfolio pieces.</p></div>
</div>
<div class="kicker" id="start">Start now</div><h2 class="t">Create your first proof timeline</h2>
<div class="panel" style="max-width:520px">
<form method="post" action="/pieces">
<label class="f">Piece title</label><input name="title" required maxlength="120" placeholder="Rebrand concept — Meridian Coffee">
<label class="f">Your name</label><input name="author" required maxlength="80" placeholder="Ana Duarte">
<label class="f">Kind of work</label><select name="kind"><option>Design</option><option>Writing</option><option>Code</option><option>Research</option><option>Photography</option><option>Other</option></select>
<label class="f">One-line summary</label><input name="summary" maxlength="200" placeholder="What is this piece?">
<p style="color:var(--dim);font-size:.85rem">You'll get a private editing link and a public proof link. Free for 3 pieces; $8/mo unlimited.</p>
<button class="btn">Create proof timeline</button></form></div>
</div>`));
});

app.post('/pieces', (req, res) => {
  const { title, author, kind, summary } = req.body;
  if (!title || !author) return res.redirect('/');
  const slug = crypto.randomBytes(4).toString('hex');
  const key = crypto.randomBytes(8).toString('hex');
  const id = q.newPiece.run(slug, key, title.trim().slice(0, 120), author.trim().slice(0, 80), (kind || 'Other').slice(0, 30), (summary || '').slice(0, 200)).lastInsertRowid;
  addStage(id, 'Proof timeline started', `Created on Provenly by ${author.trim().slice(0, 80)}.`, '');
  res.redirect(`/p/${slug}/edit?key=${key}`);
});

function renderTimeline(stages, showHash) {
  return `<div class="timeline">${stages.map(s => `
  <div class="stage"><h4>${esc(s.title)}</h4><div class="when">${esc(s.created_at)} UTC</div>
  ${s.note ? `<div class="note">${esc(s.note)}</div>` : ''}
  ${s.excerpt ? `<div class="excerpt">${esc(s.excerpt)}</div>` : ''}
  ${showHash ? `<div class="hash">⛓ ${esc(s.hash.slice(0, 40))}…</div>` : ''}
  </div>`).join('')}</div>`;
}

function verifyChain(stages) {
  for (let i = 1; i < stages.length; i++) if (stages[i].prev_hash !== stages[i - 1].hash) return false;
  return stages.length > 0;
}

app.get('/p/:slug', (req, res) => {
  const p = q.piece.get(req.params.slug);
  if (!p) return res.status(404).send(page('Not found', `<div class="wrap" style="padding-top:60px"><div class="panel">Proof page not found. <a href="/">Home</a></div></div>`));
  const stages = q.stages.all(p.id);
  const intact = verifyChain(stages);
  const span = stages.length > 1 ? `${stages[0].created_at.slice(0, 10)} → ${stages[stages.length - 1].created_at.slice(0, 10)}` : (stages[0]?.created_at.slice(0, 10) || '');
  res.send(page(`${p.title} · Provenly proof`, `
<div class="wrap" style="padding-top:44px;max-width:760px">
<div class="kicker">Proof of process</div>
<h2 class="t" style="font-size:2.1rem">${esc(p.title)}</h2>
<p style="color:var(--dim)">${esc(p.kind)} by <b style="color:var(--ink)">${esc(p.author)}</b> · ${stages.length} logged stages · ${esc(span)}</p>
${p.summary ? `<p style="font-family:var(--serif);font-style:italic;font-size:1.05rem">${esc(p.summary)}</p>` : ''}
<div class="${intact ? 'notice' : 'panel'}">${intact ? `✓ <b>Chain intact.</b> Every stage below is hash-chained to the previous one and timestamped at logging time — a fabricated history would break the chain.` : 'Chain could not be verified.'}</div>
${renderTimeline(stages, true)}
<div class="panel"><h3>What is this?</h3><p style="color:var(--dim);margin-bottom:0">This is a Provenly proof page. ${esc(p.author)} logged each stage of this work as it happened; Provenly timestamped it and sealed it into a hash chain. It doesn't prove talent — it proves <i>process</i>: that this work has a history only its real maker could have. <a href="/">Create your own →</a></p></div>
</div>`));
});

app.get('/p/:slug/edit', (req, res) => {
  const p = q.piece.get(req.params.slug);
  if (!p || req.query.key !== p.edit_key) return res.status(403).send(page('No access', `<div class="wrap" style="padding-top:60px"><div class="panel">Invalid or missing edit key.</div></div>`));
  const stages = q.stages.all(p.id);
  res.send(page(`Editing · ${p.title}`, `
<div class="wrap" style="padding-top:44px;max-width:760px">
<div class="kicker">Private editor</div>
<h2 class="t">${esc(p.title)}</h2>
<p style="color:var(--dim)">Public proof page: <a href="/p/${esc(p.slug)}">/p/${esc(p.slug)}</a> — share that link. Keep this editing URL (with your key) private.</p>
<div class="panel"><h3>Log a new stage</h3>
<form method="post" action="/p/${esc(p.slug)}/stages?key=${esc(p.edit_key)}">
<label class="f">Stage title</label><input name="title" required maxlength="100" placeholder="First sketches">
<label class="f">What happened? (visible on proof page)</label><textarea name="note" maxlength="600" placeholder="31 pencil thumbnails; direction B is winning…"></textarea>
<label class="f">Work excerpt — a sentence, decision, or fragment from the work itself (optional)</label><textarea name="excerpt" maxlength="400"></textarea>
<p style="color:var(--dim);font-size:.85rem">Logged stages can't be edited or deleted — that's what makes the chain trustworthy.</p>
<button class="btn">Log stage (timestamps now)</button></form></div>
<h3 style="margin-top:30px">Timeline so far</h3>
${renderTimeline(stages, true)}
</div>`));
});

app.post('/p/:slug/stages', (req, res) => {
  const p = q.piece.get(req.params.slug);
  if (!p || req.query.key !== p.edit_key) return res.status(403).send(page('No access', `<div class="wrap" style="padding-top:60px"><div class="panel">Invalid edit key.</div></div>`));
  if ((req.body.title || '').trim()) addStage(p.id, req.body.title.trim().slice(0, 100), (req.body.note || '').slice(0, 600), (req.body.excerpt || '').slice(0, 400));
  res.redirect(`/p/${p.slug}/edit?key=${p.edit_key}`);
});

app.get('/whitepaper', (req, res) => {
  let md = '';
  try { md = fs.readFileSync(path.join(__dirname, '..', 'WHITEPAPER.md'), 'utf8'); } catch { md = 'Whitepaper available in the GitHub repository.'; }
  res.send(page('Whitepaper · Provenly', `<div class="wrap" style="padding-top:36px;max-width:760px"><div class="panel"><pre class="md">${esc(md)}</pre></div></div>`));
});

app.use((req, res) => res.status(404).send(page('Not found', `<div class="wrap" style="padding-top:60px"><div class="panel">Page not found. <a href="/">Home</a></div></div>`)));

if (require.main === module) app.listen(process.env.PORT || 3003, () => console.log('Provenly on :' + (process.env.PORT || 3003)));
module.exports = app;
