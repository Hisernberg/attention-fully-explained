/* ============================================================
   main.js — app state, language, wiring
   ============================================================ */
const App = {
  lang: localStorage.getItem('attn-lang') || 'bn',
  attPreset: 'en',
  headIdx: 1,          /* coreference head by default — the magic one */
  qIdx: -1,
  temp: 1,
  maskOn: false,
  pipePreset: 'en',
  pipeStep: 0,
  outPreset: 'en',
  outTemp: 1
};

/* ---------- language ---------- */
function setLang(l){
  App.lang = l;
  localStorage.setItem('attn-lang', l);
  document.body.classList.toggle('lang-bn', l === 'bn');
  document.body.classList.toggle('lang-en', l === 'en');
  document.documentElement.lang = l === 'bn' ? 'bn' : 'en';
  document.querySelectorAll('[data-en]').forEach(el => {
    const v = el.dataset[l];
    if (v !== undefined) el.innerHTML = v;
  });
  const gs = document.getElementById('glosSearch');
  if (gs) gs.placeholder = gs.dataset['placeholder' + (l === 'bn' ? 'Bn' : 'En')];
  renderAll();
}

/* ---------- dynamic content ---------- */
function renderGlossary(){
  const q = (document.getElementById('glosSearch').value || '').toLowerCase();
  const l = App.lang;
  document.getElementById('glosBody').innerHTML = DATA.glossary
    .filter(g => !q || (g.t + ' ' + g.b + ' ' + g.den + ' ' + g.dbn).toLowerCase().includes(q))
    .map(g => `<tr><td>${g.t}</td><td>${g.b}</td><td>${l === 'bn' ? g.dbn : g.den}</td></tr>`).join('');
}

function renderVideos(){
  const l = App.lang;
  document.getElementById('videoGrid').innerHTML = DATA.videos.map(v => `
    <div class="vcard">
      <div class="fr"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/${v.id}"
        title="${l === 'bn' ? v.tbn : v.ten}" allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>
      <div class="vbody">
        <div class="vc">${v.ch} · ${v.len}</div>
        <div class="vt">${l === 'bn' ? v.tbn : v.ten}</div>
        <div class="vw">${l === 'bn' ? v.wbn : v.wen}</div>
      </div>
    </div>`).join('');
}

function renderCredits(){
  const l = App.lang;
  document.getElementById('creditGrid').innerHTML = DATA.credits.map(c => `
    <a class="ccard" href="${c.u}" target="_blank" rel="noopener">
      <div class="cn">${c.n}</div>
      <div class="cd">${l === 'bn' ? c.dbn : c.den}</div>
      <div class="cu">${c.u.replace('https://', '')}</div>
    </a>`).join('');
}

function renderAll(){
  const l = App.lang;
  VIZ.R.timeline(l); VIZ.R.tokenize(l); VIZ.R.embWords(l); VIZ.R.embScatter(l);
  VIZ.R.pe(l); VIZ.R.scores(l); VIZ.R.arcs(l); VIZ.R.heads(l); VIZ.R.mask(l);
  VIZ.R.pipeline(l); VIZ.R.output(l); VIZ.R.mathEx(l);
  renderGlossary(); renderVideos(); renderCredits();
  populateArcHead();
  VIZ3D.refreshLang();
}

/* ---------- selects ---------- */
function fillSelect(sel, opts, val){
  sel.innerHTML = opts.map((o, i) =>
    `<option value="${o.v !== undefined ? o.v : i}">${o.t}</option>`).join('');
  if (val !== undefined) sel.value = val;
}
function populateArcHead(){
  const sel = document.getElementById('arcHead');
  if (!sel) return;
  const hs = DATA.headRules[App.attPreset];
  sel.innerHTML = hs.map((h, i) =>
    `<option value="${i}" ${i === App.headIdx ? 'selected' : ''}>${App.lang === 'bn' ? h.bn : h.en}</option>`).join('');
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  /* nav: active link + progress */
  const links = [...document.querySelectorAll('.nl')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting){
        links.forEach(a => a.classList.toggle('on',
          a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, {rootMargin: '-30% 0px -60% 0px'});
  secs.forEach(s => io.observe(s));

  window.addEventListener('scroll', () => {
    const d = document.documentElement;
    const p = d.scrollTop / (d.scrollHeight - d.clientHeight);
    document.getElementById('progress').style.width = (p * 100) + '%';
  }, {passive: true});

  /* section reveal */
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); rio.unobserve(e.target); }
  }), {threshold: 0.06});
  document.querySelectorAll('.sec').forEach(s => { s.classList.add('reveal'); rio.observe(s); });

  /* lazy 3D */
  const tio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){
      VIZ3D.initArch(document.getElementById('threeArch'),
        document.getElementById('archInfo'), document.getElementById('archHint'));
      VIZ3D.initSurf(document.getElementById('threeSurf'),
        document.getElementById('surfTip'), document.getElementById('surfHead'));
      VIZ3D.setSurfHead(App.headIdx);
      tio.disconnect();
    }
  }), {threshold: 0.15});
  tio.observe(document.getElementById('d3'));

  /* language */
  document.getElementById('langBtn').onclick = () =>
    setLang(App.lang === 'bn' ? 'en' : 'bn');

  /* tokenize presets */
  /* (handled inside VIZ.R.tokenize) */

  /* embed: magic + scatter click */
  document.getElementById('embMagicBtn').onclick = () => {
    VIZ.magicT = 0;
    VIZ.R.embScatter(App.lang);
    setTimeout(() => {
      document.getElementById('embMagicNote').textContent = I18N[App.lang].magicDone;
    }, 1100);
  };
  const sc = document.getElementById('embScatter');
  sc.addEventListener('click', e => {
    const r = sc.getBoundingClientRect();
    const {px, py} = sc._scatter || {}; if (!px) return;
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = null, bd = 1e9;
    for (const p of DATA.scatter){
      const d = (px(p.x) - mx) ** 2 + (py(p.y) - my) ** 2;
      if (d < bd){ bd = d; best = p; }
    }
    if (best && bd < 400){
      VIZ.embWord = best.w;
      VIZ.R.embHeat(App.lang);
      document.getElementById('embWords').querySelectorAll('.tok').forEach(t =>
        t.classList.toggle('q', t.dataset.w === best.w));
    }
  });

  /* positional slider */
  document.getElementById('pePos').addEventListener('input', () => VIZ.R.pe(App.lang));

  /* attention preset + temperature */
  const attP = document.getElementById('attPreset');
  fillSelect(attP, [
    {v: 'en', t: DATA.presets.en.label},
    {v: 'bn', t: DATA.presets.bn.label}
  ], App.attPreset);
  const arcP = document.getElementById('arcPreset');
  fillSelect(arcP, [
    {v: 'en', t: DATA.presets.en.label},
    {v: 'bn', t: DATA.presets.bn.label}
  ], App.attPreset);
  const syncPreset = v => {
    App.attPreset = v;
    App.qIdx = DATA.presets[v].focus;
    attP.value = v; arcP.value = v;
    populateArcHead();
    VIZ.R.scores(App.lang); VIZ.R.arcs(App.lang); VIZ.R.heads(App.lang);
    VIZ3D.setSurfHead(App.headIdx);
  };
  attP.onchange = () => syncPreset(attP.value);
  arcP.onchange = () => syncPreset(arcP.value);
  document.getElementById('arcHead').onchange = e => {
    App.headIdx = +e.target.value;
    VIZ.R.scores(App.lang); VIZ.R.arcs(App.lang); VIZ.R.heads(App.lang);
    VIZ3D.setSurfHead(App.headIdx);
  };
  const tempEl = document.getElementById('attTemp');
  tempEl.addEventListener('input', () => {
    App.temp = +tempEl.value;
    document.getElementById('attTempVal').textContent = App.temp.toFixed(2);
    VIZ.R.softmaxBars(App.lang); VIZ.R.scores(App.lang);
  });

  /* mask */
  document.getElementById('maskBtn').onclick = () => {
    App.maskOn = !App.maskOn;
    VIZ.R.mask(App.lang);
  };

  /* pipeline */
  const pipeP = document.getElementById('pipePreset');
  fillSelect(pipeP, [
    {v: 'en', t: DATA.presets.en.label},
    {v: 'bn', t: DATA.presets.bn.label}
  ], App.pipePreset);
  pipeP.onchange = () => { App.pipePreset = pipeP.value; App.pipeStep = 0; VIZ.R.pipeline(App.lang); };
  document.getElementById('pipePrev').onclick = () => {
    App.pipeStep = Math.max(0, App.pipeStep - 1); VIZ.R.pipeline(App.lang);
  };
  document.getElementById('pipeNext').onclick = () => {
    App.pipeStep = Math.min(7, App.pipeStep + 1); VIZ.R.pipeline(App.lang);
  };

  /* output sampler */
  const outP = document.getElementById('outPreset');
  fillSelect(outP, [
    {v: 'en', t: 'EN: "' + DATA.nextword.en.ctx + ' ___"'},
    {v: 'bn', t: 'বাংলা: "' + DATA.nextword.bn.ctx + ' ___"'}
  ], App.outPreset);
  outP.onchange = () => { App.outPreset = outP.value; VIZ.R.output(App.lang); };
  const outT = document.getElementById('outTemp');
  outT.addEventListener('input', () => {
    App.outTemp = +outT.value;
    document.getElementById('outTempVal').textContent = App.outTemp.toFixed(2);
    VIZ.R.output(App.lang);
  });
  document.getElementById('outSampleBtn').onclick = () => {
    const nw = DATA.nextword[App.outPreset];
    const probs = Engine.softmaxRaw(nw.logits, App.outTemp);
    let r = Math.random(), pick = nw.cands[0];
    for (let i = 0; i < probs.length; i++){ r -= probs[i]; if (r <= 0){ pick = nw.cands[i]; break; } }
    nw.last = pick;
    DATA._counts = DATA._counts || {en: {}, bn: {}};
    DATA._counts[App.outPreset][pick] = (DATA._counts[App.outPreset][pick] || 0) + 1;
    VIZ.R.output(App.lang);
  };
  document.getElementById('outResetBtn').onclick = () => {
    DATA._counts = {en: {}, bn: {}};
    DATA.nextword.en.last = undefined; DATA.nextword.bn.last = undefined;
    VIZ.R.output(App.lang);
  };

  /* math mode toggle */
  const ms = document.getElementById('mStory'), mm = document.getElementById('mMath');
  ms.onclick = () => {
    ms.classList.add('on'); mm.classList.remove('on');
    document.getElementById('mathStory').style.display = '';
    document.getElementById('mathDerive').style.display = 'none';
  };
  mm.onclick = () => {
    mm.classList.add('on'); ms.classList.remove('on');
    document.getElementById('mathStory').style.display = 'none';
    document.getElementById('mathDerive').style.display = '';
  };

  /* 3d controls */
  document.getElementById('archRotate').onchange = e => VIZ3D.setArchRotate(e.target.checked);
  document.getElementById('surfRotate').onchange = e => VIZ3D.setSurfRotate(e.target.checked);
  document.getElementById('surfHead').onchange = e => VIZ3D.setSurfHead(+e.target.value);

  /* glossary search */
  document.getElementById('glosSearch').addEventListener('input', renderGlossary);

  /* first render */
  App.qIdx = DATA.presets[App.attPreset].focus;
  const surfHeadSel = document.getElementById('surfHead');
  surfHeadSel.innerHTML = DATA.headRules.en.map((h, i) =>
    `<option value="${i}">${App.lang === 'bn' ? h.bn : h.en}</option>`).join('');

  setLang(App.lang);
  VIZ.R.hero();

  /* KaTeX */
  if (window.renderMathInElement){
    renderMathInElement(document.body, {
      delimiters: [{left: '$$', right: '$$', display: true},
                   {left: '\\(', right: '\\)', display: false}],
      throwOnError: false
    });
  }

  /* re-render canvases once webfonts are ready (Bangla metrics) */
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(() => renderAll());
  }

  /* resize */
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => renderAll(), 220);
  });
});
