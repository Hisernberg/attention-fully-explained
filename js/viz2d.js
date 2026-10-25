/* ============================================================
   viz2d.js — 2D visualizations (canvas + SVG + DOM)
   ============================================================ */
const VIZ = (() => {

  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  const F = (s) => `${s}px 'Hind Siliguri','Noto Sans Bengali',sans-serif`;
  const FM = (s) => `${s}px 'JetBrains Mono',monospace`;

  /* ---------- canvas setup ---------- */
  function setup(cv, h){
    const d = DPR();
    const w = Math.max(cv.clientWidth || cv.parentElement.clientWidth || 600, 240);
    const hh = h || cv.getAttribute('height') && +cv.getAttribute('height') || 300;
    cv.width = w * d; cv.height = hh * d;
    cv.style.width = '100%'; cv.style.height = hh + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    return {ctx, w, h: hh};
  }
  function rrect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- colormap: navy → blue → cyan → pale → gold ---------- */
  const STOPS = [[11,30,61],[20,80,163],[34,184,240],[126,240,255],[255,248,176]];
  function lerp(a, b, t){ return a.map((v,i) => Math.round(v + (b[i]-v)*t)); }
  function cmap(t){
    t = Math.max(0, Math.min(1, t));
    const seg = t * (STOPS.length - 1);
    const i = Math.min(Math.floor(seg), STOPS.length - 2);
    const c = lerp(STOPS[i], STOPS[i+1], seg - i);
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  const txtFor = (t) => t > 0.55 ? '#0a1628' : '#c9dbff';

  /* ---------- generic heatmap ---------- */
  function heat(cv, M, o = {}){
    const {ctx, w, h} = setup(cv, o.height || 340);
    const n = M.length, m = M[0].length;
    const labels = o.labels || [];
    const L = 88, T = 64, B = 14, R = 14;
    const cw = Math.min((w - L - R) / m, o.maxCell || 44);
    const ch = Math.min((h - T - B) / n, o.maxCell || 44);
    let maxV = o.maxV;
    if (maxV === undefined){
      maxV = 0;
      for (const row of M) for (const v of row) if (v !== -Infinity) maxV = Math.max(maxV, Math.abs(v));
      maxV = maxV || 1;
    }
    ctx.clearRect(0, 0, w, h);
    /* axis captions */
    ctx.fillStyle = '#6b7fa8'; ctx.font = F(11); ctx.textAlign = 'left';
    if (o.xCap) ctx.fillText(o.xCap, L, 12);
    if (o.yCap) { ctx.save(); ctx.translate(12, T - 6); ctx.fillText(o.yCap, 0, 0); ctx.restore(); }
    const cell = (i, j) => {
      const x = L + j * cw, y = T + i * ch;
      const v = M[i][j];
      if (v === -Infinity){
        ctx.fillStyle = 'rgba(255,110,199,0.07)';
        ctx.fillRect(x, y, cw - 1.2, ch - 1.2);
        ctx.strokeStyle = 'rgba(255,110,199,0.45)'; ctx.lineWidth = 1;
        for (let k = -ch; k < cw; k += 7){
          ctx.beginPath(); ctx.moveTo(x + k, y + ch); ctx.lineTo(x + k + ch, y); ctx.stroke();
        }
        return;
      }
      const t = o.abs ? Math.abs(v) / maxV : (v + maxV) / (2 * maxV) * (o.positive ? 1 : 1) * (v < 0 ? 0 : 1) || (v < 0 ? (Math.abs(v) / maxV) * 0.35 : v / maxV);
      const tt = o.positive ? Math.max(v, 0) / maxV : (v >= 0 ? v / maxV : Math.abs(v) / maxV * 0.35);
      ctx.fillStyle = o.positive ? cmap(tt) : (v >= 0 ? cmap(tt) : `rgba(143,123,255,${0.15 + tt * 0.5})`);
      ctx.fillRect(x, y, cw - 1.2, ch - 1.2);
      if (cw >= 24 && ch >= 20){
        ctx.fillStyle = txtFor(tt); ctx.font = FM(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.fmt ? o.fmt(v) : v.toFixed(2), x + cw / 2, y + ch / 2);
      }
    };
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) cell(i, j);
    /* labels */
    ctx.font = F(12.5); ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++){
      ctx.fillStyle = (o.highlightRow === i) ? '#ffcf6e' : '#93a7cc';
      ctx.textAlign = 'right';
      ctx.fillText(trunc(labels[i], 9), L - 8, T + i * ch + ch / 2);
    }
    for (let j = 0; j < m; j++){
      ctx.save();
      ctx.translate(L + j * cw + cw / 2, T - 6);
      ctx.rotate(-Math.PI / 5);
      ctx.fillStyle = '#93a7cc'; ctx.textAlign = 'right';
      ctx.font = F(11.5);
      ctx.fillText(trunc(labels[j], 9), 0, 0);
      ctx.restore();
    }
    /* highlight row box */
    if (o.highlightRow !== undefined && o.highlightRow >= 0){
      ctx.strokeStyle = '#ffcf6e'; ctx.lineWidth = 2.2;
      ctx.strokeRect(L - 1, T + o.highlightRow * ch - 1, m * cw + 2, ch + 2);
    }
    /* store geometry for clicks */
    cv._heatGeo = {L, T, cw, ch, n, m};
    return {ctx, w, h, L, T, cw, ch};
  }
  const trunc = (s, n) => (s === undefined || s === null) ? '' : (s.length > n ? s.slice(0, n - 1) + '…' : s);

  /* ---------- vertical bar chart ---------- */
  function bars(cv, items, o = {}){
    const {ctx, w, h} = setup(cv, o.height || 320);
    ctx.clearRect(0, 0, w, h);
    const n = items.length;
    const B = 66, T = 18, L = 10, R = 10;
    const bw = (w - L - R) / n;
    const maxV = o.max || Math.max(...items.map(i => i.value)) || 1;
    items.forEach((it, i) => {
      const bh = (h - B - T) * (it.value / maxV);
      const x = L + i * bw + bw * 0.16, y = h - B - bh, ww = bw * 0.68;
      const g = ctx.createLinearGradient(0, y, 0, h - B);
      g.addColorStop(0, it.color || '#3fe0ff'); g.addColorStop(1, 'rgba(63,224,255,0.08)');
      ctx.fillStyle = g;
      rrect(ctx, x, y, ww, Math.max(bh, 2), 6); ctx.fill();
      ctx.fillStyle = it.flash ? '#ffcf6e' : '#e3edff';
      ctx.font = FM(11.5); ctx.textAlign = 'center';
      ctx.fillText(o.pct ? (it.value * 100).toFixed(1) + '%' : it.value.toFixed(3), x + ww / 2, y - 6);
      ctx.fillStyle = '#93a7cc'; ctx.font = F(12.5);
      ctx.save(); ctx.translate(x + ww / 2, h - B + 8); ctx.rotate(-0.42);
      ctx.textAlign = 'right'; ctx.fillText(trunc(it.label, 11), 0, 0); ctx.restore();
      if (it.flash){
        ctx.strokeStyle = '#ffcf6e'; ctx.lineWidth = 2;
        rrect(ctx, x - 2, y - 2, ww + 4, Math.max(bh, 2) + 4, 7); ctx.stroke();
      }
    });
  }

  /* ---------- horizontal chips (canvas) ---------- */
  function chipRow(ctx, tokens, x0, y0, opts = {}){
    let x = x0;
    ctx.font = F(14);
    tokens.forEach((t, i) => {
      const tw = ctx.measureText(t).width + 20;
      const gold = t.startsWith('##');
      ctx.fillStyle = opts.classes && opts.classes[i] === 'q' ? 'rgba(143,123,255,0.3)' :
        gold ? 'rgba(255,207,110,0.14)' : 'rgba(63,224,255,0.1)';
      ctx.strokeStyle = opts.classes && opts.classes[i] === 'q' ? '#8f7bff' :
        gold ? 'rgba(255,207,110,0.5)' : 'rgba(63,224,255,0.35)';
      ctx.lineWidth = 1.2;
      rrect(ctx, x, y0, tw, 30, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e3edff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(t, x + 10, y0 + 16);
      x += tw + 7;
    });
    return x;
  }

  /* =========================================================
     SECTION RENDERS
     ========================================================= */
  const R = {}; /* render functions, called on init/lang-change/resize */

  /* ---------- timeline ---------- */
  R.timeline = (lang) => {
    const el = document.getElementById('timeline');
    el.innerHTML = DATA.history.map(h => `
      <div class="tl-item reveal in">
        <span class="yr">${h.yr}</span><h4>${h[lang === 'bn' ? 'bn' : 'en']}</h4>
        <p>${h[lang === 'bn' ? 'dbn' : 'den']}</p>
      </div>`).join('');
  };

  /* ---------- tokenize ---------- */
  R.tokenize = (lang) => {
    const inp = document.getElementById('tokInput');
    const chips = document.getElementById('tokChips');
    const meta = document.getElementById('tokMeta');
    const render = () => {
      const toks = Engine.tokenize(inp.value || ' ');
      chips.innerHTML = toks.map(t => {
        const sub = t.startsWith('##');
        return `<span class="tok${sub ? ' sub' : ''}"><span class="t">${esc(t)}</span><span class="id">${Engine.tokId(t)}</span></span>`;
      }).join('');
      meta.textContent = `${toks.length} ${I18N[lang].tokCount} · ${I18N[lang].subword}`;
    };
    document.getElementById('tokBtn').onclick = render;
    inp.onkeydown = e => { if (e.key === 'Enter') render(); };
    if (!R.tokenize._presets){
      const ps = document.getElementById('tokPresets');
      [['The quick brown fox jumps over the lazy dog', 'EN'],
       ['unbelievable retraining! GPT-2 has 50,257 tokens', 'EN'],
       ['আমি মেশিন লার্নিং শিখছি', 'বাংলা'],
       ['অসম্ভব সুন্দর প্রযুক্তি!', 'বাংলা']].forEach(([txt, tag]) => {
        const b = document.createElement('button');
        b.className = 'btn sm'; b.textContent = txt.slice(0, 26) + '…'; b.title = tag;
        b.onclick = () => { inp.value = txt; render(); };
        ps.appendChild(b);
      });
      R.tokenize._presets = true;
    }
    render();
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- embedding heatmap of selected word ---------- */
  let embWord = 'cat';
  R.embWords = (lang) => {
    const el = document.getElementById('embWords');
    el.innerHTML = DATA.scatter.map(w =>
      `<span class="tok" data-w="${w.w}"><span class="t">${lang === 'bn' ? w.bn : w.w}</span></span>`).join('');
    el.querySelectorAll('.tok').forEach(t => t.onclick = () => {
      embWord = t.dataset.w; R.embHeat(lang); R.embVecTable(lang); highlight();
    });
    const highlight = () => el.querySelectorAll('.tok').forEach(t =>
      t.classList.toggle('q', t.dataset.w === embWord));
    highlight();
    R.embHeat(lang);
  };
  R.embHeat = (lang) => {
    const cv = document.getElementById('embHeat');
    const vec = Engine.embedToken(embWord);
    heat(cv, [vec], {height: 210, maxV: 1, labels: [lang === 'bn' ?
      (DATA.scatter.find(x => x.w === embWord) || {bn: embWord}).bn : embWord],
      xCap: `${I18N[lang].dModel} · ${I18N[lang].embedOf} "${embWord}"`,
      maxCell: 40, fmt: v => v.toFixed(2)});
    document.getElementById('embVecCap').textContent =
      `${I18N[lang].embedOf} "${embWord}" — [${vec.map(v => v.toFixed(2)).join(', ')}]`;
  };

  /* ---------- embedding scatter + vector magic ---------- */
  let magicT = -1;
  R.embScatter = (lang) => {
    const cv = document.getElementById('embScatter');
    const {ctx, w, h} = setup(cv, 330);
    ctx.clearRect(0, 0, w, h);
    const px = x => w / 2 + x * (w / 2.6);
    const py = y => h / 2 - y * (h / 2.6);
    /* axes */
    ctx.strokeStyle = 'rgba(122,180,255,0.14)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, py(0)); ctx.lineTo(w, py(0));
    ctx.moveTo(px(0), 0); ctx.lineTo(px(0), h); ctx.stroke();
    /* labels */
    ctx.font = F(12);
    for (const p of DATA.scatter){
      const X = px(p.x), Y = py(p.y);
      ctx.fillStyle = 'rgba(63,224,255,0.85)';
      ctx.beginPath(); ctx.arc(X, Y, 7, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(63,224,255,0.2)';
      ctx.beginPath(); ctx.arc(X, Y, 13, 0, 7); ctx.fill();
      ctx.fillStyle = '#c9dbff'; ctx.textAlign = 'center';
      ctx.fillText(lang === 'bn' ? p.bn : p.w, X, Y - 16);
    }
    /* magic animation */
    if (magicT >= 0){
      const king = DATA.scatter.find(p => p.w === 'king'),
            man = DATA.scatter.find(p => p.w === 'man'),
            woman = DATA.scatter.find(p => p.w === 'woman'),
            queen = DATA.scatter.find(p => p.w === 'queen');
      const rx = king.x - man.x + woman.x, ry = king.y - man.y + woman.y;
      const t = Math.min(magicT / 60, 1);
      const cx = king.x + (rx - king.x) * t, cy = king.y + (ry - king.y) * t;
      arrow(ctx, px(king.x), py(king.y), px(cx), py(cy), '#ffcf6e', 2.4);
      if (t > 0.85){
        ctx.setLineDash([5, 5]); arrow(ctx, px(cx), py(cy), px(queen.x), py(queen.y), '#5ef2b8', 2);
        ctx.setLineDash([]);
        ctx.fillStyle = '#5ef2b8'; ctx.font = F(15); ctx.textAlign = 'center';
        ctx.fillText('≈ ' + (lang === 'bn' ? 'রানী' : 'queen'), px(queen.x), py(queen.y) + 34);
      }
      if (magicT < 60){ magicT++; requestAnimationFrame(() => R.embScatter(lang)); }
    }
    cv._scatter = {px, py};
  };
  function arrow(ctx, x1, y1, x2, y2, color, lw){
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4));
    ctx.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4));
    ctx.fill();
  }

  /* ---------- positional encoding ---------- */
  R.pe = (lang) => {
    const cv = document.getElementById('peHeat');
    const pos = +document.getElementById('pePos').value;
    const D = 32, N = 48;
    const M = [];
    for (let d = 0; d < D; d++){
      M.push(Array.from({length: N}, (_, p) => Engine.PE(p, d, D)));
    }
    const hm = heat(cv, M, {height: 330, maxV: 1, maxCell: 22, labels: [], positive: false});
    /* highlight current position column */
    const {L, T, cw, ch} = hm;
    ctx2(cv).strokeStyle = '#ffcf6e'; ctx2(cv).lineWidth = 2;
    ctx2(cv).strokeRect(L + pos * cw - 1, T - 1, cw + 2, D * ch + 2);
    ctx2(cv).fillStyle = '#ffcf6e'; ctx2(cv).font = FM(10.5); ctx2(cv).textAlign = 'center';
    ctx2(cv).fillText('pos ' + pos, L + pos * cw + cw / 2, T + D * ch + 14);
    /* sparse pos ticks */
    ctx2(cv).fillStyle = '#6b7fa8'; ctx2(cv).font = FM(10);
    for (let p = 0; p < N; p += 8) ctx2(cv).fillText(p, L + p * cw + cw / 2, T - 10);
    document.getElementById('pePosVal').textContent = pos;
    const probe = [0, 1, 2, 3].map(d => Engine.PE(pos, d, D).toFixed(2)).join(', ');
    document.getElementById('peRead').textContent = lang === 'bn'
      ? `পজিশন ${pos}-এর প্রথম ৪ ডাইমেনশন: [${probe}] — এই সিগনেচারটাই এমবেডিংয়ের সাথে যোগ হয়`
      : `First 4 dims at position ${pos}: [${probe}] — this signature gets added to the embedding`;
    /* curves */
    const cc = document.getElementById('peCurves');
    const {ctx, w, h} = setup(cc, 330);
    ctx.clearRect(0, 0, w, h);
    const cols = ['#3fe0ff', '#8f7bff', '#ff6ec7', '#ffcf6e', '#5ef2b8', '#ff8f5e'];
    const LX = 30, BX = 24;
    for (let d = 0; d < 6; d++){
      ctx.strokeStyle = cols[d]; ctx.lineWidth = 1.8; ctx.beginPath();
      for (let p = 0; p <= N; p++){
        const X = LX + (w - LX - BX) * p / N;
        const Y = h / 2 - Engine.PE(p, d, D) * (h / 2 - 26);
        p === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
      }
      ctx.stroke();
    }
    /* slider line */
    const sx = LX + (w - LX - BX) * pos / N;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(sx, 8); ctx.lineTo(sx, h - 8); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = FM(11); ctx.fillStyle = '#93a7cc'; ctx.textAlign = 'left';
    for (let d = 0; d < 6; d++){
      ctx.fillStyle = cols[d];
      ctx.fillText((d % 2 ? 'cos' : 'sin') + ' d=' + d, LX + 6, 16 + d * 16);
    }
  };
  const ctx2 = cv => cv.getContext('2d');

  /* =========================================================
     ATTENTION STATE HELPERS (state lives in App, main.js)
     ========================================================= */
  function attData(){
    const preset = App.attPreset;
    const p = DATA.presets[preset];
    const heads = DATA.headRules[preset].map(h => ({
      id: h.id, en: h.en, bn: h.bn, S: Engine.fromRules(p.tokens, h.fn)
    }));
    return {p, heads};
  }
  function top3(row, labels){
    return row.map((v, j) => [v, j]).sort((a, b) => b[0] - a[0]).slice(0, 3);
  }

  /* ---------- scores matrix + softmax bars ---------- */
  R.scores = (lang) => {
    const {p, heads} = attData();
    const head = heads[App.headIdx % heads.length];
    const temp = App.temp;
    const cv = document.getElementById('scoreMatrix');
    heat(cv, head.S, {height: 340, labels: p.tokens, abs: true, maxCell: 46,
      highlightRow: App.qIdx, xCap: I18N[lang].legendCol, yCap: I18N[lang].legendRow});
    document.getElementById('scoreCap').textContent = I18N[lang].scoreAxis;
    /* click rows */
    if (!cv._hasClick){
      cv.addEventListener('click', e => {
        const r = cv.getBoundingClientRect();
        const g = cv._heatGeo; if (!g) return;
        const y = (e.clientY - r.top), x = (e.clientX - r.left);
        if (x < g.L){ const i = Math.floor((y - g.T) / g.ch); if (i >= 0 && i < g.n){ App.qIdx = i; R.scores(App.lang); R.softmaxBars(App.lang); } }
        else if (y < g.T){ const j = Math.floor((x - g.L) / g.cw); if (j >= 0 && j < g.m){ App.qIdx = j; R.scores(App.lang); R.softmaxBars(App.lang); } }
      });
      cv._hasClick = true;
    }
    R.softmaxBars(lang);
    /* selection info */
    const A = Engine.attentionWithRules(head.S, temp);
    const info = document.getElementById('attSelInfo');
    if (App.qIdx >= 0){
      const t3 = top3(A[App.qIdx], p.tokens);
      info.innerHTML = `<b class="hl-cy">${esc(p.tokens[App.qIdx])}</b> ${I18N[lang].looksAt}: ` +
        t3.map(([v, j]) => `<b class="hl-go">${esc(p.tokens[j])}</b> <span class="mono">${(v * 100).toFixed(1)}%</span>`).join(' · ') +
        ` <span class="note">(${I18N[lang].weight}, T = ${temp.toFixed(2)})</span>`;
    } else info.textContent = I18N[lang].noSel;
    document.getElementById('attNote').textContent = I18N[lang].presetNote;
  };
  R.softmaxBars = (lang) => {
    const {p, heads} = attData();
    const head = heads[App.headIdx % heads.length];
    const A = Engine.attentionWithRules(head.S, App.temp);
    const qi = App.qIdx >= 0 ? App.qIdx : 0;
    const cv = document.getElementById('softmaxBars');
    bars(cv, p.tokens.map((t, j) => ({label: t, value: A[qi][j], color: '#8f7bff',
      flash: j === qi})), {height: 330, max: 1, pct: true});
    document.getElementById('softmaxCap').textContent =
      `${I18N[lang].softmaxBars}: "${p.tokens[qi]}"`;
  };

  /* ---------- arc diagram (SVG, BertViz tribute) ---------- */
  R.arcs = (lang) => {
    const {p, heads} = attData();
    const head = heads[App.headIdx % heads.length];
    const A = Engine.attentionWithRules(head.S, 1);
    const qi = App.qIdx >= 0 ? App.qIdx : p.focus;
    const n = p.tokens.length;
    const W = Math.max(760, n * 92), H = 300;
    const X = i => 60 + (W - 120) * i / (n - 1);
    const Y = 210;
    let arcs = '';
    for (let j = 0; j < n; j++){
      const wv = A[qi][j];
      if (j === qi) continue;
      arcs += `<path d="M ${X(qi)} ${Y} Q ${(X(qi) + X(j)) / 2} ${Y - 2 * Math.abs(X(j) - X(qi)) - 26} ${X(j)} ${Y}"
        fill="none" stroke="${VIZ.cmap(wv)}" stroke-width="${1.5 + wv * 22}" stroke-opacity="${0.25 + wv * 0.75}" stroke-linecap="round"/>`;
    }
    let toks = '';
    for (let i = 0; i < n; i++){
      const sel = i === qi;
      toks += `<g class="arc-tok" data-i="${i}" style="cursor:pointer">
        <circle cx="${X(i)}" cy="${Y}" r="${sel ? 13 : 8}" fill="${sel ? '#8f7bff' : 'rgba(63,224,255,0.85)'}"/>
        <text x="${X(i)}" y="${Y - (sel ? 30 : 24)}" text-anchor="middle"
          fill="${sel ? '#ffcf6e' : '#c9dbff'}" font-size="15" font-family="'Hind Siliguri',sans-serif">${esc(p.tokens[i])}</text>
      </g>`;
    }
    document.getElementById('arcSvg').innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">
        <line x1="40" y1="${Y}" x2="${W - 40}" y2="${Y}" stroke="rgba(122,180,255,0.25)"/>
        ${arcs}${toks}</svg>`;
    document.getElementById('arcSvg').querySelectorAll('.arc-tok').forEach(g =>
      g.addEventListener('click', () => { App.qIdx = +g.dataset.i; R.arcs(lang); R.scores(lang); }));
    const t3 = top3(A[qi], p.tokens);
    document.getElementById('arcInfo').innerHTML =
      `<b class="hl-cy">${esc(p.tokens[qi])}</b> ${I18N[lang].looksAt} ` +
      t3.map(([v, j]) => `<b class="hl-go">${esc(p.tokens[j])}</b> <span class="mono">${(v * 100).toFixed(1)}%</span>`).join(' · ');
    document.getElementById('arcNote').textContent = I18N[lang].presetNote;
  };

  /* ---------- multi-head grid ---------- */
  R.heads = (lang) => {
    const {p, heads} = attData();
    const grid = document.getElementById('headsGrid');
    grid.innerHTML = heads.map((h, k) =>
      `<div class="viz-frame" style="padding:8px"><canvas class="viz headMini" data-k="${k}" height="200"></canvas>
       <div class="cap" style="font-size:11.5px">${lang === 'bn' ? h.bn : h.en}</div></div>`).join('');
    grid.querySelectorAll('.headMini').forEach(cv => {
      const k = +cv.dataset.k;
      heat(cv, Engine.attentionWithRules(heads[k].S, 1), {height: 200, labels: [], maxCell: 30, positive: true});
      cv.parentElement.onclick = () => { App.headIdx = k; R.heads(lang); R.scores(lang); R.arcs(lang); };
      if (k === App.headIdx % heads.length){
        cv.parentElement.style.borderColor = '#8f7bff';
        cv.parentElement.style.boxShadow = '0 0 20px rgba(143,123,255,0.2)';
      }
    });
    const head = heads[App.headIdx % heads.length];
    heat(document.getElementById('headMatrix'), Engine.attentionWithRules(head.S, 1),
      {height: 330, labels: p.tokens, maxCell: 44, positive: true, highlightRow: App.qIdx});
    document.getElementById('headCap').textContent = lang === 'bn' ? head.bn : head.en;
    document.getElementById('headsNote').textContent = I18N[lang].presetNote;
  };

  /* ---------- causal mask ---------- */
  R.mask = (lang) => {
    const {p, heads} = attData();
    const S = heads[1].S; /* coref head */
    const on = App.maskOn;
    const Sm = on ? Engine.maskRows(S, true) : S;
    const A = Engine.attentionWithRules(Sm, 1);
    heat(document.getElementById('maskMatrix'), A, {height: 340, labels: p.tokens, maxCell: 40, positive: true});
    document.getElementById('maskBtn').textContent = on ? I18N[lang].maskOn : I18N[lang].maskOff;
    document.getElementById('maskBtn').classList.toggle('primary', !on);
    document.getElementById('maskNote').textContent = on
      ? (lang === 'bn' ? 'ভবিষ্যতের ঘরগুলো −∞ → softmax ওজন ০ → মডেল নতুন শব্দ প্রেডিক্ট করতে পারে' :
         'future cells = −∞ → softmax weight 0 → the model can honestly predict the next token')
      : (lang === 'bn' ? 'এখন প্রতিটা টোকেন ভবিষ্যতও দেখছে — প্রশিক্ষণে এটা নকল করা হবে' :
         'every token currently sees the future — during training this would be cheating');
  };

  /* ---------- pipeline ---------- */
  const PIPE = {
    titles: {
      en: ['Tokenize', 'Embed', 'Add position', 'Project Q, K, V', 'Scores QKᵀ/√d', 'Softmax + causal mask', 'Weighted sum of V', 'Next-token output'],
      bn: ['টোকেনাইজ', 'এমবেড', 'পজিশন যোগ', 'Q, K, V তৈরি', 'স্কোর QKᵀ/√d', 'সফটম্যাক্স + মাস্ক', 'V-এর ওজনসমষ্টি', 'পরের টোকেন']
    },
    descs: {
      en: ['The sentence is cut into tokens, each with an integer ID — the only form a model can ingest.',
           'Each ID looks up its 8-dimensional toy embedding — a vector of "meaning coordinates".',
           'Sin/cos positional signatures are added so the model knows word order.',
           'Every token vector is multiplied by three learned matrices, producing Query, Key and Value.',
           'Every query dots with every key, divided by √8: the raw relevance score matrix.',
           'Future positions get −∞, then each row is softmaxed into weights that sum to 1.',
           'Each token outputs the weighted average of all Values — its context-updated meaning.',
           'The final vector is projected onto the vocabulary: logits → softmax → sample the next token.'],
      bn: ['বাক্যটা টোকেনে ভাগ হয়, প্রতিটার একটা পূর্ণসংখ্যা ID — মডেল শুধু এই রূপটাই গিলতে পারে।',
           'প্রতিটা ID তার ৮-ডাইমেনশনের টয় এমবেডিং ধার করে — "অর্থের স্থানাঙ্ক"-এর ভেক্টর।',
           'sin/cos পজিশনাল সিগনেচার যোগ হয়, যাতে মডেল শব্দের ক্রম জানে।',
           'প্রতিটা টোকেন ভেক্টর তিনটা শেখা ম্যাট্রিক্স দিয়ে গুণ হয় — তৈরি হয় Query, Key আর Value।',
           'প্রতিটা কুয়েরি প্রতিটা কী-এর সাথে ডট প্রোডাক্ট, ÷√৮: কাঁচা প্রাসঙ্গিকতার ম্যাট্রিক্স।',
           'ভবিষ্যতের পজিশন পায় −∞, তারপর প্রতিটা সারি softmax-এ ওজন ১-এর ভেতর normalize হয়।',
           'প্রতিটা টোকেন আউটপুট দেয় সব ভ্যালুর ওজনসহ গড় — কনটেক্সটে হালনাগাদ হওয়া অর্থ।',
           'শেষ ভেক্টর প্রজেক্ট হয় ভোকাবুলারিতে: লজিট → সফটম্যাক্স → পরের টোকেন স্যাম্পল।']
    }
  };
  let pipeData = null;
  function pipeCompute(preset){
    const toks = DATA.presets[preset].tokens;
    const c = Engine.compute(toks, 1);
    const D = 8;
    const P = toks.map((_, i) => Array.from({length: D}, (_, d) => Engine.PE(i, d, D)));
    const X1 = c.X.map((x, i) => Engine.vadd(x, P[i]));
    const Sm = Engine.maskRows(c.S, true);
    const Am = Engine.attentionWithRules(Sm, 1);
    const Out = Am.map(row => row.reduce((acc, w, j) => Engine.vadd(acc, c.V[j].map(v => v * w)), Engine.zeros(D)));
    return {toks, c, X1, Am, Out, D};
  }
  R.pipeline = (lang) => {
    if (!pipeData || pipeData.preset !== App.pipePreset) pipeData = pipeCompute(App.pipePreset);
    const {toks, c, X1, Am, Out, D} = pipeData;
    const step = App.pipeStep;
    /* chips */
    const st = document.getElementById('pipeSteps');
    if (!st.children.length){
      for (let i = 0; i < 8; i++){
        const b = document.createElement('button');
        b.className = 'stepchip'; b.textContent = I18N[lang].pipeSteps[lang][i];
        b.onclick = () => { App.pipeStep = i; R.pipeline(App.lang); };
        st.appendChild(b);
      }
    } else {
      [...st.children].forEach((b, i) => {
        b.textContent = I18N[lang].pipeSteps[lang][i];
        b.className = 'stepchip' + (i < step ? ' done' : '') + (i === step ? ' on' : '');
      });
    }
    document.getElementById('pipeCount').textContent =
      `${I18N[lang].step} ${step + 1} ${I18N[lang].of} 8`;
    document.getElementById('pipeTitle').textContent = PIPE.titles[lang][step];
    document.getElementById('pipeDesc').textContent = PIPE.descs[lang][step];
    const cv = document.getElementById('pipeCanvas');
    if (step === 0){
      const {ctx, w, h} = setup(cv, 200);
      ctx.clearRect(0, 0, w, h);
      ctx.font = F(13); ctx.fillStyle = '#93a7cc';
      ctx.fillText(`"${DATA.presets[App.pipePreset].label.split(': ')[1] || ''}"`, 10, 24);
      chipRow(ctx, toks, 10, 52);
    } else if (step === 1){
      heat(cv, c.X, {height: 280, labels: toks, maxCell: 34, yCap: 'X (n×8)'});
    } else if (step === 2){
      heat(cv, X1, {height: 280, labels: toks, maxCell: 34, yCap: 'X + PE (n×8)'});
    } else if (step === 3){
      const {ctx, w, h} = setup(cv, 280);
      ctx.clearRect(0, 0, w, h);
      const third = (w - 40) / 3;
      [['Q', c.Q, '#3fe0ff'], ['K', c.K, '#5ef2b8'], ['V', c.V, '#ffcf6e']].forEach(([nm, M, col], k) => {
        ctx.font = F(16); ctx.fillStyle = col; ctx.fillText(nm, 6 + k * (third + 20), 20);
      });
      [[c.Q, 0], [c.K, 1], [c.V, 2]].forEach(([M, k]) => {
        const sub = {L: 88, T: 64, cw: 0, ch: 0};
        /* draw mini heat manually into offset */
        drawMini(ctx, M, 0 + k * (third + 20), 34, third, 240, toks);
      });
    } else if (step === 4){
      heat(cv, c.S, {height: 300, labels: toks, maxCell: 34, abs: true, yCap: 'S = QKᵀ/√8 (n×n)'});
    } else if (step === 5){
      heat(cv, Am, {height: 300, labels: toks, maxCell: 34, positive: true, yCap: 'softmax(S+mask) (n×n)'});
    } else if (step === 6){
      heat(cv, Out, {height: 280, labels: toks, maxCell: 34, yCap: 'out = A·V (n×8)'});
    } else {
      const nw = DATA.nextword[App.pipePreset] || DATA.nextword.en;
      const probs = Engine.softmaxRaw(nw.logits, 1);
      bars(cv, nw.cands.map((t, i) => ({label: t, value: probs[i]})), {height: 280, max: 1, pct: true});
    }
  };
  function drawMini(ctx, M, ox, oy, availW, availH, labels){
    const n = M.length, m = M[0].length;
    const cw = Math.min(availW / (m + 6), 26), ch = Math.min(availH / (n + 1), 22);
    const maxV = 1;
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++){
      const v = M[i][j], t = (v + maxV) / (2 * maxV);
      ctx.fillStyle = v >= 0 ? cmap(v / maxV) : `rgba(143,123,255,${0.2 + Math.abs(v) / maxV * 0.4})`;
      ctx.fillRect(ox + 44 + j * cw, oy + i * ch, cw - 1, ch - 1);
    }
    ctx.font = F(10); ctx.fillStyle = '#93a7cc'; ctx.textAlign = 'right';
    for (let i = 0; i < n; i++) ctx.fillText(trunc(labels[i], 5), ox + 40, oy + i * ch + ch / 2);
  }

  /* ---------- output sampler ---------- */
  R.output = (lang) => {
    const nw = DATA.nextword[App.outPreset];
    const temp = App.outTemp;
    const probs = Engine.softmaxRaw(nw.logits, temp);
    bars(document.getElementById('outBars'), nw.cands.map((t, i) =>
      ({label: t, value: probs[i]})), {height: 300, max: 1, pct: true});
    const c = (DATA._counts = DATA._counts || {en: {}, bn: {}})[App.outPreset];
    const tot = Object.values(c).reduce((a, b) => a + b, 0);
    bars(document.getElementById('outCounts'), nw.cands.map((t, i) =>
      ({label: t, value: (c[t] || 0) / (tot || 1), color: '#5ef2b8'})), {height: 300, max: 1, pct: true});
    document.getElementById('outCountsCap').textContent = `${I18N[lang].counts} (${tot} ${I18N[lang].generated})`;
    document.getElementById('outStatus').textContent = tot
      ? `${I18N[lang].chosen}: "${nw.last || '—'}" · ${tot} ${I18N[lang].times}`
      : (lang === 'bn' ? 'Sample চাপো — বারবার চাপলে হিস্টোগ্রাম প্রোবাবিলিটির দিকে মুখ করবে' :
         'Press Sample — repeated presses converge the histogram to the probability distribution');
  };

  /* ---------- worked math example ---------- */
  R.mathEx = (lang) => {
    document.getElementById('exTitle').textContent = I18N[lang].exampleTitle;
    const toks = ['the', 'cat', 'sat'], d = 4;
    const X = toks.map(t => Engine.embedToken(t, d));
    const Wq = Engine.randMat(Engine.hashStr('exWq'), d),
          Wk = Engine.randMat(Engine.hashStr('exWk'), d),
          Wv = Engine.randMat(Engine.hashStr('exWv'), d);
    const Q = X.map(x => Engine.matVec(Wq, x)),
          K = X.map(x => Engine.matVec(Wk, x)),
          V = X.map(x => Engine.matVec(Wv, x));
    const S = Q.map(q => K.map(k => Engine.dot(q, k) / Math.sqrt(d)));
    const A = S.map(r => Engine.softmaxRaw(r, 1));
    const O = A.map(row => row.reduce((acc, w, j) => Engine.vadd(acc, V[j].map(v => v * w)), Engine.zeros(d)));
    const tbl = (name, M, labels) => `
      <div style="overflow-x:auto;margin:8px 0">
      <b class="hl-cy">${name}</b>
      <table class="tb" style="font-family:var(--f-mono);font-size:12.5px">
      <tr><td></td>${labels.map(l => `<td>${l}</td>`).join('')}</tr>
      ${M.map((row, i) => `<tr><td>${labels[i]}</td>${row.map(v => `<td>${v.toFixed(2)}</td>`).join('')}</tr>`).join('')}
      </table></div>`;
    document.getElementById('exBody').innerHTML =
      tbl('X', X, ['d1', 'd2', 'd3', 'd4']) +
      tbl('Q = X·W_Q', Q, ['d1', 'd2', 'd3', 'd4']) +
      tbl('S = QKᵀ/√4', S, toks) +
      tbl('A = softmax(S)', A, toks) +
      tbl('out = A·V', O, ['d1', 'd2', 'd3', 'd4']);
  };

  /* =========================================================
     DEEP-DIVE 2D — TOKENIZER LAB
     ========================================================= */

  /* ---------- BPE merge lab ---------- */
  R.tokLab = (lang) => {
    if (!DATA._bpe) DATA._bpe = Engine.bpeTrain(DATA.bpe.corpus, 8);
    const bpe = DATA._bpe;
    const step = App.bpeStep || 0;
    /* corpus words as piece-chips */
    const wordsNow = step === 0 ? bpe.corpus.map(w => w.split('')) : bpe.hist[step - 1].words;
    document.getElementById('bpeCorpus').innerHTML = wordsNow.map(w =>
      `<span class="wchip">${w.map(p => `<b>${esc(p)}</b>`).join('<i>·</i>')}</span>`).join('');
    /* merge-step chips 0..8 */
    const sc = document.getElementById('bpeStepChips');
    if (!sc.children.length){
      for (let i = 0; i <= 8; i++){
        const b = document.createElement('button');
        b.className = 'stepchip'; b.textContent = i === 0 ? (lang === 'bn' ? 'অক্ষর' : 'chars') : i;
        b.onclick = () => { stopBpePlay(); App.bpeStep = i; R.tokLab(App.lang); };
        sc.appendChild(b);
      }
    }
    [...sc.children].forEach((b, i) =>
      b.className = 'stepchip' + (i < step ? ' done' : '') + (i === step ? ' on' : ''));
    /* current merge line */
    const nowLine = document.getElementById('bpeNow');
    if (step === 0){
      nowLine.innerHTML = lang === 'bn'
        ? 'শুরু: প্রতিটা শব্দ অক্ষরে ভাঙা — ভোকাবুলারিতে সব অক্ষর আছে, বাকি কিছু নেই।'
        : 'Start: every word is broken into characters — the vocabulary holds only letters.';
    } else {
      const h = bpe.hist[step - 1];
      nowLine.innerHTML = `<b class="hl-go">${esc(h.a)} + ${esc(h.b)} → "${esc(h.merged)}"</b> ` +
        `<span class="note">(${I18N[lang].mergedThis} · ×${h.count})</span>`;
    }
    /* pair-count bars: state BEFORE next merge */
    const pairsBox = document.getElementById('bpePairs');
    const nextH = bpe.hist[step]; /* merge that WOULD happen next */
    const tops = step === 0 ? nextH.top : bpe.hist[step - 1].top;
    const maxC = Math.max(...tops.map(t => t[1]));
    pairsBox.innerHTML = tops.map(([p, c], k) => {
      const isNext = nextH && step < 8 && p[0] === nextH.a && p[1] === nextH.b;
      return `<div class="pairrow${isNext ? ' nx' : ''}">
        <span class="pp mono">${esc(p[0])} + ${esc(p[1])}</span>
        <span class="pbar"><span style="width:${(c / maxC) * 100}%"></span></span>
        <span class="pc mono">×${c}</span>${isNext ? '<span class="ptag">→</span>' : ''}</div>`;
    }).join('');
    /* vocabulary */
    const vocab = step === 0 ? bpe.initVocab : bpe.hist[step - 1].vocab;
    const fresh = step === 0 ? null : bpe.hist[step - 1].merged;
    document.getElementById('bpeVocab').innerHTML = vocab.map(v =>
      `<span class="mono vchip${v === fresh ? ' fresh' : ''}">${esc(v)}</span>`).join('');
    /* apply box */
    document.getElementById('bpeApplyBtn').onclick = () => {
      const w = document.getElementById('bpeWordInput').value.trim().replace(/[^A-Za-z]/g, '');
      if (!w) return;
      const pieces = Engine.bpeApply(w, bpe.merges.slice(0, step));
      document.getElementById('bpeOut').innerHTML =
        pieces.map(p => `<span class="tok sub"><span class="t">${esc(p)}</span></span>`).join('');
    };
  };
  let bpePlayTimer = null;
  function stopBpePlay(){
    if (bpePlayTimer){ clearInterval(bpePlayTimer); bpePlayTimer = null;
      const b = document.getElementById('bpePlayBtn');
      if (b){ b.textContent = I18N[App.lang].playMerge; b.classList.remove('on'); } }
  }
  R.tokLabPlay = () => {
    if (bpePlayTimer){ stopBpePlay(); return; }
    if ((App.bpeStep || 0) >= 8) App.bpeStep = 0;
    const b = document.getElementById('bpePlayBtn');
    b.textContent = I18N[App.lang].stopMerge; b.classList.add('on');
    bpePlayTimer = setInterval(() => {
      App.bpeStep = Math.min((App.bpeStep || 0) + 1, 8);
      R.tokLab(App.lang);
      if (App.bpeStep >= 8) stopBpePlay();
    }, 950);
  };

  /* ---------- byte anatomy ---------- */
  R.tokBytes = (lang) => {
    const text = App.byteText || 'বিড়ালটি মাদুরে বসেছিল';
    const chars = [...text];
    const row = document.getElementById('byteRow');
    row.innerHTML = chars.map((c, i) => {
      if (c === ' ') return '<span class="bspace"></span>';
      const n = Engine.bytesOf(c).length;
      return `<button class="bcell${n > 1 ? ' multi' : ''}${i === (App.byteSel || 0) ? ' sel' : ''}" data-i="${i}" data-b="${n}">
        <span class="bc">${esc(c)}</span><span class="bn mono">${n}</span></button>`;
    }).join('');
    row.querySelectorAll('.bcell').forEach(b => b.onclick = () => {
      App.byteSel = +b.dataset.i; R.tokBytes(App.lang);
    });
    /* stats (letters only) */
    const letters = chars.filter(c => c !== ' ');
    const bytes = Engine.bytesOf(letters.join('')).length;
    document.getElementById('byteStats').innerHTML =
      `<span><b class="hl-cy mono">${letters.length}</b> ${I18N[lang].byteChars}</span>
       <span><b class="hl-go mono">${bytes}</b> ${I18N[lang].byteBytes}</span>
       <span><b class="hl-vi mono">${(bytes / letters.length).toFixed(1)}×</b> ${I18N[lang].byteRatio}</span>`;
    /* detail for selected */
    const selC = chars[App.byteSel || 0];
    const bs = Engine.bytesOf(selC || ' ').map(Engine.byteHex);
    document.getElementById('byteDetail').innerHTML = selC && selC !== ' '
      ? `<span class="mono bc-big">${esc(selC)}</span> <span class="note">${I18N[lang].byteOne}</span>
         <span class="mono bytehex">${bs.join(' ')}</span>
         <span class="note mono">U+${selC.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} · ${bs.length} B</span>`
      : I18N[lang].bytePick;
  };

  /* ---------- special tokens ---------- */
  R.tokSpec = (lang) => {
    document.getElementById('specGrid').innerHTML = DATA.specialTokens.map(s =>
      `<div class="stok"><div class="st mono">${esc(s.t)}</div><p>${lang === 'bn' ? s.dbn : s.den}</p></div>`).join('');
  };

  /* ---------- three-tokenizer comparison ---------- */
  R.tokCompare = (lang) => {
    const text = document.getElementById('tokInput').value || '';
    const nWord = (text.trim().match(/\S+/g) || []).length;
    const nPiece = Engine.tokenize(text).length;
    const nChar = [...text.replace(/\s/g, '')].length;
    const rows = [
      {k: I18N[lang].cmpWord, n: nWord, c: '#5ef2b8'},
      {k: I18N[lang].cmpPiece, n: nPiece, c: '#3fe0ff'},
      {k: I18N[lang].cmpChar, n: nChar, c: '#ff6ec7'}
    ];
    const max = Math.max(nChar, nPiece, nWord, 1);
    document.getElementById('cmpBody').innerHTML = rows.map(r =>
      `<div class="cmprow"><span class="ck">${r.k}</span>
       <span class="cbar"><span style="width:${(r.n / max) * 100}%;background:${r.c}"></span></span>
       <span class="cn mono">${r.n}</span></div>`).join('');
  };

  /* =========================================================
     DEEP-DIVE 2D — EMBEDDING INSPECTOR
     ========================================================= */
  const DIMMEAN = {
    en: ['meaning map · x', 'meaning map · y', 'animal-ness', 'royalty / person',
         'food-ness', 'action-ness', 'colour-ness', 'gender (king +, queen −)'],
    bn: ['অর্থ-ম্যাপ · x', 'অর্থ-ম্যাপ · y', 'প্রাণীত্ব', 'রাজকীয়তা / ব্যক্তি',
         'খাদ্যত্ব', 'ক্রিয়াত্ব', 'রঙত্ব', 'লিঙ্গ (রাজা +, রানী −)']
  };
  R.embVecTable = (lang) => {
    const vec = Engine.embedToken(embWord);
    const isSem = !!DATA.scatter.find(s => s.w === embWord);
    document.getElementById('vecTable').innerHTML =
      `<table class="tb vt"><thead><tr>
        <th>${I18N[lang].dimName}</th><th style="width:34%"></th>
        <th>${I18N[lang].dimValue}</th>${isSem ? `<th>${I18N[lang].dimMeaning}</th>` : ''}</tr></thead>
      <tbody>${vec.map((v, d) => `<tr>
        <td class="mono">d${d}</td>
        <td><span class="vbar"><span style="left:${v < 0 ? 50 + v * 50 : 50}%;width:${Math.abs(v) * 50}%;${v < 0 ? 'background:var(--pk)' : 'background:var(--cy)'}"></span><i style="left:50%"></i></span></td>
        <td class="mono">${v.toFixed(2)}</td>
        ${isSem ? `<td class="note">${DIMMEAN[lang][d]}</td>` : ''}</tr>`).join('')}</tbody></table>
      <p class="note">${isSem ? I18N[lang].vecNote :
        (lang === 'bn' ? 'এই শব্দটা ডেমো-টেবিলে নেই — তাই ভেক্টরটা টয় হ্যাশ-র‍্যান্ডম। ওপরের ১৯টা শব্দে ক্লিক করলে অর্থবহ ডাইম দেখা যাবে।' :
        'This word is not in the demo table, so its vector is toy-hash random. Click one of the 19 map words above to see meaningful dims.')}</p>`;
  };

  /* ---------- one-hot × E ---------- */
  R.embOneHot = (lang) => {
    const words = DATA.onehotWords;
    const sel = App.onehotWord || words[0];
    const selEl = document.getElementById('ohWordSel');
    if (!selEl.options.length){
      fillSelectLocal(selEl, words);
      selEl.onchange = () => { App.onehotWord = selEl.value; R.embOneHot(App.lang); };
    }
    selEl.value = sel;
    /* E matrix: 6 rows × 8 dims, label inline per row */
    const E = words.map(w => Engine.embedToken(w));
    document.getElementById('ohGrid').innerHTML =
      words.map((w, i) =>
        `<div class="ohrow${w === sel ? ' hit' : ''}">` +
        `<span class="ohlab mono${w === sel ? ' hitl' : ''}">${esc(w)}</span>` +
        E[i].map(v => `<span class="ohc mono">${v.toFixed(1)}</span>`).join('') +
        `</div>`).join('');
    /* one-hot strip */
    document.getElementById('ohOneHot').innerHTML = words.map((w, i) =>
      `<span class="ohone mono${w === sel ? ' hot' : ''}">${w === sel ? 1 : 0}</span>`).join('');
    /* result strip */
    const r = Engine.embedToken(sel);
    document.getElementById('ohResult').innerHTML =
      r.map(v => `<span class="ohone mono r">${v.toFixed(1)}</span>`).join('');
    document.getElementById('ohGo').onclick = () => {
      const g = document.getElementById('ohGrid');
      g.classList.remove('anim'); void g.offsetWidth; g.classList.add('anim');
      document.getElementById('ohOneHot').classList.remove('flash');
      void document.getElementById('ohOneHot').offsetWidth;
      document.getElementById('ohOneHot').classList.add('flash');
    };
  };
  function fillSelectLocal(sel, opts){
    sel.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
  }

  /* ---------- cosine similarity calculator ---------- */
  R.cosCalc = (lang) => {
    const words = DATA.scatter.map(s => s.w);
    const sa = document.getElementById('cosA'), sb = document.getElementById('cosB');
    if (!sa.options.length){
      const opts = words.map(w => `<option value="${w}">${w}</option>`).join('');
      sa.innerHTML = opts; sb.innerHTML = opts;
      sa.onchange = () => { App.cosA = sa.value; R.cosCalc(App.lang); };
      sb.onchange = () => { App.cosB = sb.value; R.cosCalc(App.lang); };
      document.getElementById('cosPresets').innerHTML = DATA.cosPresets.map(([a, b]) =>
        `<button class="btn sm" data-a="${a}" data-b="${b}">${a} · ${b}</button>`).join('');
      document.getElementById('cosPresets').querySelectorAll('button').forEach(btn =>
        btn.onclick = () => { App.cosA = btn.dataset.a; App.cosB = btn.dataset.b; R.cosCalc(App.lang); });
    }
    const A = App.cosA || 'cat', B = App.cosB || 'dog';
    sa.value = A; sb.value = B;
    const va = Engine.embedToken(A), vb = Engine.embedToken(B);
    const dotV = Engine.dot(va, vb), na = Engine.norm(va), nb = Engine.norm(vb);
    const cos = Engine.cosSim(va, vb);
    const terms = va.map((x, i) => `(${x.toFixed(2)}×${vb[i].toFixed(2)})`).join(' + ');
    const verdict = cos > 0.75 ? I18N[lang].verdictHi : cos > 0.45 ? I18N[lang].verdictMid :
      cos > 0.1 ? I18N[lang].verdictLow : cos > -0.15 ? I18N[lang].verdictNone : I18N[lang].verdictNeg;
    const vColor = cos > 0.45 ? 'var(--gr)' : cos > 0.1 ? 'var(--cy)' : cos > -0.15 ? 'var(--go)' : 'var(--pk)';
    const deg = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI).toFixed(0);
    document.getElementById('cosSteps').innerHTML = `
      <div class="cosrow"><span class="cl">${I18N[lang].cosDot}</span>
        <span class="cv mono" style="font-size:11.5px">${I18N[lang].cosShow} ${terms} = <b>${dotV.toFixed(2)}</b></span></div>
      <div class="cosrow"><span class="cl">${I18N[lang].cosNormA}</span><span class="cv mono">${na.toFixed(3)}</span></div>
      <div class="cosrow"><span class="cl">${I18N[lang].cosNormB}</span><span class="cv mono">${nb.toFixed(3)}</span></div>
      <div class="cosrow big"><span class="cl">${I18N[lang].cosRes}</span>
        <span class="cv mono">${dotV.toFixed(2)} / (${na.toFixed(2)}·${nb.toFixed(2)}) = <b style="color:${vColor}">${cos.toFixed(3)}</b></span></div>
      <div class="cosverdict" style="border-color:${vColor}"><b style="color:${vColor}">${verdict}</b>
        <span class="note">· ${I18N[lang].angle} ≈ ${deg}°</span></div>`;
    /* angle sketch */
    const cv = document.getElementById('cosCanvas');
    const {ctx, w, h} = setup(cv, 170);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 + 14, R0 = Math.min(w, h) / 2 - 26;
    const pa = DATA.scatter.find(s => s.w === A), pb = DATA.scatter.find(s => s.w === B);
    const angA = Math.atan2(-(pa.y), pa.x);
    const theta = Math.acos(Math.max(-1, Math.min(1, cos)));
    const angB = angA - theta * ((pa.x * pb.y - pa.y * pb.x) >= 0 ? -1 : 1);
    ctx.strokeStyle = 'rgba(122,180,255,0.18)';
    ctx.beginPath(); ctx.arc(cx, cy, R0, 0, 7); ctx.stroke();
    const drawVec = (ang, col, lab) => {
      const X = cx + Math.cos(ang) * R0, Y = cy + Math.sin(ang) * R0;
      arrow(ctx, cx, cy, X, Y, col, 2.2);
      ctx.fillStyle = col; ctx.font = F(12.5); ctx.textAlign = 'center';
      ctx.fillText(lab, cx + Math.cos(ang) * (R0 + 16), cy + Math.sin(ang) * (R0 + 16) + 4);
    };
    drawVec(angA, '#3fe0ff', A);
    drawVec(angB, '#ffcf6e', B);
    /* arc between */
    ctx.strokeStyle = '#ff6ec7'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, 26, Math.min(angA, angB), Math.max(angA, angB)); ctx.stroke();
    ctx.fillStyle = '#ff6ec7'; ctx.font = FM(11); ctx.textAlign = 'center';
    const midA = (angA + angB) / 2;
    ctx.fillText(deg + '°', cx + Math.cos(midA) * 40, cy + Math.sin(midA) * 40 + 3);
  };

  /* ---------- QKV interactive inspector ---------- */
  R.qkvPanel = (lang) => {
    const preset = App.attPreset;
    if (!DATA._qkvCache || DATA._qkvCache.preset !== preset)
      DATA._qkvCache = {preset, c: Engine.compute(DATA.presets[preset].tokens, 1)};
    const {c} = DATA._qkvCache;
    const p = DATA.presets[preset];
    const selEl = document.getElementById('qkvTok');
    if (!selEl.options.length || selEl._n !== p.tokens.length){
      selEl.innerHTML = p.tokens.map((t, i) => `<option value="${i}">${esc(t)}</option>`).join('');
      selEl._n = p.tokens.length;
      selEl.onchange = () => { App.qkvTok = +selEl.value; R.qkvPanel(App.lang); };
    }
    if (App.qkvTok === undefined || App.qkvTok >= p.tokens.length) App.qkvTok = p.focus;
    selEl.value = App.qkvTok;
    const i = App.qkvTok;
    const rows = [
      {lab: I18N[lang].qkvX, vec: c.X[i], col: '#8f7bff'},
      {lab: 'Q', vec: c.Q[i], col: '#3fe0ff'},
      {lab: 'K', vec: c.K[i], col: '#5ef2b8'},
      {lab: 'V', vec: c.V[i], col: '#ffcf6e'}
    ];
    const cv = document.getElementById('qkvCanvas');
    const {ctx, w, h} = setup(cv, 240);
    ctx.clearRect(0, 0, w, h);
    const maxV = 1.4;
    rows.forEach((r, k) => {
      const y = 18 + k * 58;
      ctx.fillStyle = r.col; ctx.font = F(13); ctx.textAlign = 'left';
      ctx.fillText(r.lab, 6, y + 8);
      const bw = (w - 90) / 2, x0 = 52;
      r.vec.forEach((v, d) => {
        const bx = x0 + d * ((w - 62) / 8);
        const bh = (v / maxV) * 18;
        ctx.fillStyle = v >= 0 ? r.col : 'rgba(255,110,199,0.75)';
        const bw2 = (w - 62) / 8 - 5;
        ctx.fillRect(bx, y + 14 - Math.max(bh, 0), bw2, Math.abs(bh) || 1);
        ctx.fillStyle = '#93a7cc'; ctx.font = FM(9.5); ctx.textAlign = 'center';
        ctx.fillText(v.toFixed(1), bx + bw2 / 2, y + 40);
      });
    });
    /* raw score row */
    const S = c.S[i];
    document.getElementById('qkvScores').innerHTML =
      `<span class="note" style="display:block;margin-bottom:6px">${I18N[lang].qkvScoreRow}</span>` +
      p.tokens.map((t, j) => `<span class="tok"><span class="t">${esc(t)}</span>
        <span class="id mono">${S[j].toFixed(2)}</span></span>`).join('');
  };

  /* ---------- hero animation ---------- */
  R.hero = () => {
    const cv = document.getElementById('heroCanvas');
    const {ctx, w, h} = setup(cv, cv.parentElement.clientHeight);
    const rnd = Engine.mulberry32(42);
    const N = 18;
    const nodes = Array.from({length: N}, () => ({
      x: rnd() * w, y: rnd() * h, vx: (rnd() - 0.5) * 0.35, vy: (rnd() - 0.5) * 0.35, r: 2.5 + rnd() * 3
    }));
    let t = 0;
    function frame(){
      if (document.hidden || !heroVisible){ requestAnimationFrame(frame); return; }
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (const p of nodes){
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < N; i++){
        const j = (i * 7 + 3) % N;
        const a = 0.10 + 0.07 * Math.sin(t * 2 + i);
        ctx.strokeStyle = `rgba(63,224,255,${a})`;
        ctx.lineWidth = 1 + 1.6 * Math.abs(Math.sin(t + i));
        ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
      }
      for (const p of nodes){
        ctx.fillStyle = 'rgba(143,123,255,0.75)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(63,224,255,0.12)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, 7); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
  };
  let heroVisible = true;
  document.addEventListener('visibilitychange', () => { heroVisible = !document.hidden; });

  return {R, setup, heat, bars, cmap, chipRow, rrect, arrow, F, FM, DPR,
    get magicT(){ return magicT; }, set magicT(v){ magicT = v; },
    get embWord(){ return embWord; }, set embWord(v){ embWord = v; }};
})();
