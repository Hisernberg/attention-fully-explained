/* ============================================================
   viz3d.js — Three.js scenes: transformer explorer + attention surface
   ============================================================ */
const VIZ3D = (() => {
  let arch = null, surf = null;

  /* ---------- helpers ---------- */
  function label(text, color = '#3fe0ff'){
    const c = document.createElement('canvas'); c.width = 320; c.height = 72;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(6,13,28,0.9)';
    x.beginPath(); x.roundRect ? x.roundRect(2, 2, 316, 68, 14) : x.rect(2, 2, 316, 68); x.fill();
    x.strokeStyle = color; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#e3edff'; x.font = '600 28px "Space Grotesk","Hind Siliguri",sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 160, 38);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthTest: false}));
    sp.scale.set(2.1, 0.47, 1);
    return sp;
  }
  function glowBox(w, hgt, d, color, opacity = 0.14){
    const g = new THREE.Group();
    const fill = new THREE.Mesh(
      new THREE.BoxGeometry(w, hgt, d),
      new THREE.MeshStandardMaterial({color, transparent: true, opacity, roughness: 0.45, metalness: 0.2}));
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(w, hgt, d)),
      new THREE.LineBasicMaterial({color}));
    g.add(fill, edge);
    g.userData.fill = fill;
    return g;
  }

  /* =========================================================
     SCENE 1 — transformer architecture explorer
     ========================================================= */
  function initArch(container, infoEl, hintEl){
    if (!window.THREE || arch) return;
    hintEl.textContent = I18N[App.lang].dragHint;
    const W = container.clientWidth, H = container.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040a18, 0.03);
    const cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    cam.position.set(5.2, 3.6, 6.8);
    const ren = new THREE.WebGLRenderer({antialias: true, alpha: true});
    ren.setSize(W, H); ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(ren.domElement);
    const ctrl = new THREE.OrbitControls(cam, ren.domElement);
    ctrl.enableDamping = true; ctrl.autoRotate = true; ctrl.autoRotateSpeed = 1.1;
    ctrl.target.set(0, 2.3, 0);

    scene.add(new THREE.AmbientLight(0x8899ff, 0.85));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(5, 10, 7); scene.add(dl);
    const pl = new THREE.PointLight(0x3fe0ff, 1.1, 40); pl.position.set(-5, 3, -5); scene.add(pl);
    const grid = new THREE.GridHelper(16, 32, 0x1c3a66, 0x0e2244);
    scene.add(grid);

    const stack = [
      {k: 'out', h: 0.7, c: 0xff6ec7}, {k: 'ffn', h: 0.75, c: 0xffcf6e},
      {k: 'an1', h: 0.4, c: 0x8f7bff}, {k: 'mha', h: 0.9, c: 0x3fe0ff},
      {k: 'pos', h: 0.35, c: 0x5ef2b8}, {k: 'emb', h: 0.6, c: 0x4aa3ff}
    ];
    let y = 0.3;
    const infoFor = {};
    for (const s of stack){
      const def = DATA.arch.find(a => a.id === s.k);
      const b = glowBox(2.6, s.h, 1.8, s.c);
      b.position.set(0, y + s.h / 2, 0);
      b.userData.fill.userData.def = def;
      scene.add(b);
      const lb = label(def.label, '#' + s.c.toString(16).padStart(6, '0'));
      lb.position.set(2.15, y + s.h / 2, 0);
      scene.add(lb);
      infoFor[s.k] = def;
      /* inner slabs for multi-head block */
      if (s.k === 'mha'){
        for (let i = -1; i <= 1; i++){
          const inner = glowBox(0.6, s.h * 0.62, 1.2, i === 0 ? 0xffcf6e : (i < 0 ? 0x8f7bff : 0x5ef2b8), 0.3);
          inner.position.set(i * 0.75, y + s.h / 2, 0);
          scene.add(inner);
        }
      }
      y += s.h + 0.24;
    }
    const topY = y;

    /* token spheres rising through the stack */
    const spheres = [];
    for (let i = 0; i < 7; i++){
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 18),
        new THREE.MeshStandardMaterial({color: 0x3fe0ff, emissive: 0x1a7f9e, transparent: true, opacity: 0.9}));
      m.position.set(-1.4 + i * 0.47, 0.05, 1.35);
      m.userData.v = 0.006 + (i % 3) * 0.003;
      scene.add(m); spheres.push(m);
    }
    /* output probability bars */
    const pbars = [];
    for (let i = 0; i < 6; i++){
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1, 0.22),
        new THREE.MeshStandardMaterial({color: i === 0 ? 0xffcf6e : 0x8f7bff,
          transparent: true, opacity: 0.75, emissive: 0x224466}));
      m.position.set(-1.3 + i * 0.52, topY + 0.5, 0);
      m.userData.phase = i * 1.1;
      scene.add(m); pbars.push(m);
    }

    /* picking */
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    ren.domElement.addEventListener('pointerdown', e => {
      const r = ren.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(mouse, cam);
      const hits = ray.intersectObjects(scene.children, true)
        .filter(h => h.object.parent && h.object.parent.userData &&
                     h.object.parent.userData.fill && h.object.parent.userData.fill === h.object ||
                     h.object === h.object.parent && false);
      const hit = ray.intersectObjects(scene.children, true)
        .find(h => h.object.userData.def);
      if (hit){
        const def = hit.object.userData.def;
        infoEl.innerHTML = `<b>${def.label}</b><br>${def[App.lang === 'bn' ? 'bn' : 'en']}`;
      }
    });

    arch = {scene, cam, ren, ctrl, spheres, pbars, topY,
      setRotate(v){ ctrl.autoRotate = v; },
      setLang(){ hintEl.textContent = I18N[App.lang].dragHint; },
      resize(){
        const w = container.clientWidth, h = container.clientHeight;
        cam.aspect = w / h; cam.updateProjectionMatrix(); ren.setSize(w, h);
      }};
    (function loop(){
      requestAnimationFrame(loop);
      ctrl.update();
      for (const s of spheres){
        s.position.y += s.userData.v;
        if (s.position.y > topY - 0.1) s.position.y = 0.05;
      }
      const t = performance.now() / 1000;
      for (const b of pbars){
        const v = 0.5 + 0.45 * Math.abs(Math.sin(t * 0.9 + b.userData.phase));
        b.scale.y = v * 1.4; b.position.y = topY + 0.5 + v * 0.7;
      }
      ren.render(scene, cam);
    })();
    window.addEventListener('resize', arch.resize);
    infoEl.innerHTML = `<b>Multi-Head Attention</b><br>${infoFor.mha[App.lang === 'bn' ? 'bn' : 'en']}`;
  }

  /* =========================================================
     SCENE 2 — attention surface (3-D bars)
     ========================================================= */
  let surfGroup = null;
  function buildSurf(k){
    const s = surf;
    if (surfGroup){ s.scene.remove(surfGroup); surfGroup = null; }
    const p = DATA.presets.en;
    const head = DATA.headRules.en[k];
    const S = Engine.fromRules(p.tokens, head.fn);
    const A = Engine.attentionWithRules(S, 1);
    const n = p.tokens.length;
    surfGroup = new THREE.Group();
    const bars = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
      const v = A[i][j];
      const hgt = 0.08 + v * 3.6;
      const col = new THREE.Color(VIZ.cmap(v));
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.36, hgt, 0.36),
        new THREE.MeshStandardMaterial({color: col, transparent: true, opacity: 0.9,
          emissive: col, emissiveIntensity: 0.22, roughness: 0.35}));
      m.position.set((j - (n - 1) / 2) * 0.46, hgt / 2, (i - (n - 1) / 2) * 0.46);
      m.userData = {i, j, v};
      surfGroup.add(m); bars.push(m);
    }
    s.scene.add(surfGroup);
    s.bars = bars;
    /* legend */
    const lg = document.getElementById('surfLegend');
    lg.innerHTML = p.tokens.map((t, i) =>
      `<span class="lg-item"><span class="lg-dot" style="background:${VIZ.cmap(0.15 + 0.8 * A[p.focus][i])}"></span>${esc2(t)}</span>`).join('');
  }
  const esc2 = s => s.replace(/</g, '&lt;');

  function initSurf(container, tipEl, selectEl){
    if (!window.THREE || surf) return;
    const W = container.clientWidth, H = container.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040a18, 0.045);
    const cam = new THREE.PerspectiveCamera(46, W / H, 0.1, 100);
    cam.position.set(5.4, 4.6, 5.6);
    const ren = new THREE.WebGLRenderer({antialias: true, alpha: true});
    ren.setSize(W, H); ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(ren.domElement);
    const ctrl = new THREE.OrbitControls(cam, ren.domElement);
    ctrl.enableDamping = true; ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.9;
    ctrl.target.set(0, 0.8, 0);
    scene.add(new THREE.AmbientLight(0x8899ff, 0.9));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(4, 9, 6); scene.add(dl);
    scene.add(new THREE.GridHelper(7, 14, 0x1c3a66, 0x0e2244));

    surf = {scene, cam, ren, ctrl, tipEl, bars: [],
      setRotate(v){ ctrl.autoRotate = v; },
      setHead(k){ buildSurf(k); },
      resize(){
        const w = container.clientWidth, h = container.clientHeight;
        cam.aspect = w / h; cam.updateProjectionMatrix(); ren.setSize(w, h);
      }};
    buildSurf(1);

    /* hover tooltip */
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    ren.domElement.addEventListener('pointermove', e => {
      const r = ren.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(mouse, cam);
      const hit = ray.intersectObjects(surf.bars)[0];
      if (hit){
        const {i, j, v} = hit.object.userData;
        const p = DATA.presets.en;
        tipEl.style.display = 'block';
        tipEl.style.left = (e.clientX + 14) + 'px';
        tipEl.style.top = (e.clientY + 10) + 'px';
        tipEl.innerHTML = `Q <b style="color:#3fe0ff">${esc2(p.tokens[i])}</b> → K <b style="color:#5ef2b8">${esc2(p.tokens[j])}</b> · <b class="mono">${v.toFixed(3)}</b>`;
      } else tipEl.style.display = 'none';
    });
    ren.domElement.addEventListener('pointerleave', () => { tipEl.style.display = 'none'; });

    (function loop(){
      requestAnimationFrame(loop);
      ctrl.update();
      ren.render(scene, cam);
    })();
    window.addEventListener('resize', surf.resize);
  }

  /* =========================================================
     shared: render-loop that pauses offscreen
     ========================================================= */
  function autoLoop(container, tick){
    let active = true;
    const io = new IntersectionObserver(es =>
      es.forEach(e => { active = e.isIntersecting; }), {threshold: 0.04});
    io.observe(container);
    (function loop(){
      requestAnimationFrame(loop);
      if (!active) return;
      try { tick(); }
      catch (err){
        if (window.__attnDebug) window.__attnDebug.lastTickError = err;
        throw err;
      }
    })();
    if (window.__attnDebug) window.__attnDebug.loops.push({container, get active(){ return active; }});
  }
  function miniLabel(text, color = '#3fe0ff', size = 26){
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    x.font = `600 ${size}px "Space Grotesk","Hind Siliguri",sans-serif`;
    const w = Math.ceil(x.measureText(text).width) + 28;
    c.width = w; c.height = size + 22;
    x.fillStyle = 'rgba(5,11,22,0.82)';
    x.beginPath();
    if (x.roundRect) x.roundRect(1, 1, w - 2, size + 20, 10); else x.rect(1, 1, w - 2, size + 20);
    x.fill();
    x.strokeStyle = color; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#e3edff'; x.font = `600 ${size}px "Space Grotesk","Hind Siliguri",sans-serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, w / 2, (size + 22) / 2 + 1);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthTest: false}));
    sp.scale.set(w / 110, (size + 22) / 110, 1);
    return sp;
  }
  function baseScene(container, camPos, target){
    const W = container.clientWidth, H = container.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040a18, 0.028);
    const cam = new THREE.PerspectiveCamera(46, W / H, 0.1, 100);
    cam.position.set(...camPos);
    const ren = new THREE.WebGLRenderer({antialias: true, alpha: true});
    ren.setSize(W, H); ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(ren.domElement);
    const ctrl = new THREE.OrbitControls(cam, ren.domElement);
    ctrl.enableDamping = true; ctrl.autoRotateSpeed = 0.9;
    ctrl.target.set(...target);
    scene.add(new THREE.AmbientLight(0x8899ff, 0.95));
    const dl = new THREE.DirectionalLight(0xffffff, 0.85); dl.position.set(4, 9, 6); scene.add(dl);
    return {scene, cam, ren, ctrl,
      resize(){
        const w = container.clientWidth, h = container.clientHeight;
        if (!w || !h) return;
        cam.aspect = w / h; cam.updateProjectionMatrix(); ren.setSize(w, h);
      }};
  }

  /* =========================================================
     SCENE 3 — embedding space in 3-D + king−man+woman
     ========================================================= */
  let emb = null;
  function embPos(p){
    return new THREE.Vector3(p.x * 3, (p.z + 0.45) * 2.6, -p.y * 3);
  }
  function initEmb3d(container, noteEl){
    if (!window.THREE || emb) return;
    const s = baseScene(container, [4.6, 2.6, 5.2], [0, 1.2, 0]);
    s.ctrl.autoRotate = true;
    s.scene.add(new THREE.GridHelper(9, 18, 0x1c3a66, 0x0e2244));
    const pts = [];
    DATA.scatter.forEach(p => {
      const col = new THREE.Color(DATA.clusterColors[p.cluster]);
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20),
        new THREE.MeshStandardMaterial({color: col, emissive: col, emissiveIntensity: 0.55,
          roughness: 0.35, transparent: true, opacity: 0.95}));
      const P = embPos(p); m.position.copy(P);
      m.userData = p;
      s.scene.add(m); pts.push(m);
      const lb = miniLabel(App.lang === 'bn' ? p.bn : p.w, '#' + col.getHexString(), 24);
      lb.position.copy(P.clone().add(new THREE.Vector3(0, 0.34, 0)));
      s.scene.add(lb);
      /* drop line to floor */
      const lg = new THREE.BufferGeometry().setFromPoints(
        [P.clone(), new THREE.Vector3(P.x, 0.01, P.z)]);
      s.scene.add(new THREE.Line(lg,
        new THREE.LineBasicMaterial({color: col, transparent: true, opacity: 0.28})));
    });
    /* cluster legend */
    document.getElementById('emb3dLegend').innerHTML =
      Object.entries(DATA.clusterColors).map(([k, c]) => {
        const nm = {animal: ['Animals', 'প্রাণী'], royal: ['Royalty / people', 'রাজপরিবার / মানুষ'],
          food: ['Fruit', 'ফল'], action: ['Actions', 'কাজ'], colour: ['Colours', 'রং']}[k];
        return `<span class="lg-item"><span class="lg-dot" style="background:${c}"></span>${App.lang === 'bn' ? nm[1] : nm[0]}</span>`;
      }).join('');
    /* analogy animation */
    let anim = null;
    const king = DATA.scatter.find(p => p.w === 'king'),
          man = DATA.scatter.find(p => p.w === 'man'),
          woman = DATA.scatter.find(p => p.w === 'woman'),
          queen = DATA.scatter.find(p => p.w === 'queen');
    const target = embPos(king).clone()
      .sub(embPos(man)).add(embPos(woman));
    const trailGeo = new THREE.BufferGeometry().setFromPoints([embPos(king), embPos(king)]);
    const trail = new THREE.Line(trailGeo,
      new THREE.LineBasicMaterial({color: 0xffcf6e, linewidth: 2}));
    trail.visible = false; s.scene.add(trail);
    const head3d = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16),
      new THREE.MeshStandardMaterial({color: 0xffcf6e, emissive: 0xffcf6e, emissiveIntensity: 0.9}));
    head3d.visible = false; s.scene.add(head3d);
    function playAnalogy(){
      anim = {t: 0};
      trail.visible = true; head3d.visible = true;
      noteEl.textContent = '';
    }
    emb = {...s, pts,
      setRotate(v){ s.ctrl.autoRotate = v; },
      playAnalogy, setLang(){
        document.getElementById('emb3dLegend').innerHTML = '';
        initEmb3d._legendDirty = true;
      },
      resize: s.resize};
    autoLoop(container, () => {
      s.ctrl.update();
      if (anim){
        anim.t += 0.008;
        const t = Math.min(anim.t, 1);
        const P = embPos(king).clone().lerp(target, t);
        head3d.position.copy(P);
        trailGeo.setFromPoints([embPos(king), P]);
        if (t >= 1){
          anim = null;
          const lb = miniLabel('≈ ' + (App.lang === 'bn' ? 'রানী (queen)' : 'queen (রানী)'), '#5ef2b8', 26);
          lb.position.copy(embPos(queen).clone().add(new THREE.Vector3(0, -0.55, 0)));
          s.scene.add(lb);
          noteEl.textContent = I18N[App.lang].analogyDone;
        }
      }
      s.ren.render(s.scene, s.cam);
    });
    window.addEventListener('resize', () => emb && emb.resize());
  }

  /* =========================================================
     SCENE 4 — positional-encoding wave landscape
     ========================================================= */
  let pe3 = null;
  function initPE3d(container){
    if (!window.THREE || pe3) return;
    const s = baseScene(container, [2.6, 2.4, 3.6], [0, 0, 0]);
    s.ctrl.autoRotate = true;
    const N = 48, D = 32;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(N * D * 3);
    const colors = new Float32Array(N * D * 3);
    const idx = [];
    const X = p => (p / (N - 1) - 0.5) * 4.6;
    const Z = d => (d / (D - 1) - 0.5) * 3.0;
    for (let d = 0; d < D; d++) for (let p = 0; p < N; p++){
      const k = d * N + p;
      const v = Engine.PE(p, d, D);
      positions[k * 3] = X(p);
      positions[k * 3 + 1] = v * 1.15;
      positions[k * 3 + 2] = Z(d);
      const c = new THREE.Color(VIZ.cmap((v + 1) / 2));
      colors[k * 3] = c.r; colors[k * 3 + 1] = c.g; colors[k * 3 + 2] = c.b;
      if (p < N - 1 && d < D - 1){
        idx.push(k, k + 1, k + N, k + 1, k + N + 1, k + N);
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(idx);
    s.scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, wireframe: true, transparent: true, opacity: 0.22})));
    s.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.035, vertexColors: true, transparent: true, opacity: 0.9})));
    /* slider highlight slice */
    const slice = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.5, 3.15),
      new THREE.MeshBasicMaterial({color: 0x3fe0ff, transparent: true, opacity: 0.16}));
    slice.position.set(X(0), 0, 0);
    s.scene.add(slice);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.07, 2.5, 3.15)),
      new THREE.LineBasicMaterial({color: 0x3fe0ff, transparent: true, opacity: 0.85}));
    edge.position.copy(slice.position);
    s.scene.add(edge);
    pe3 = {...s, slice, edge, X,
      setRotate(v){ s.ctrl.autoRotate = v; },
      setPos(p){
        const x = X(p);
        slice.position.x = x; edge.position.x = x;
      },
      resize: s.resize};
    autoLoop(container, () => {
      s.ctrl.update();
      const pulse = 0.14 + 0.05 * Math.sin(performance.now() / 400);
      slice.material.opacity = pulse;
      s.ren.render(s.scene, s.cam);
    });
    window.addEventListener('resize', () => pe3 && pe3.resize());
  }

  /* =========================================================
     SCENE 5 — the four heads as a 3-D tower
     ========================================================= */
  let heads3 = null;
  function initHeads3d(container, tipEl){
    if (!window.THREE || heads3) return;
    const s = baseScene(container, [3.4, 4.6, 5.0], [0, 2.6, 0]);
    s.ctrl.autoRotate = true;
    const p = DATA.presets.en;
    const floors = [];
    const n = p.tokens.length;
    for (let k = 0; k < 4; k++){
      const head = DATA.headRules.en[k];
      const S = Engine.fromRules(p.tokens, head.fn);
      const A = Engine.attentionWithRules(S, 1);
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.04, 4.3),
        new THREE.MeshStandardMaterial({color: 0x0e2244, transparent: true, opacity: 0.55}));
      g.add(base);
      const bars = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
        const v = A[i][j];
        const hgt = 0.04 + v * 1.5;
        const col = new THREE.Color(VIZ.cmap(v));
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, hgt, 0.34),
          new THREE.MeshStandardMaterial({color: col, transparent: true, opacity: 0.92,
            emissive: col, emissiveIntensity: 0.2, roughness: 0.4}));
        m.position.set((j - (n - 1) / 2) * 0.42, hgt / 2 + 0.02, (i - (n - 1) / 2) * 0.42);
        m.userData = {i, j, v, k};
        g.add(m); bars.push(m);
      }
      const name = DATA.headRules.en[k];
      const lb = miniLabel(k + 1, '#93a7cc', 22);
      lb.scale.multiplyScalar(0.8);
      lb.position.set(-2.85, 0.25, 0);
      g.add(lb);
      const y = k * 1.95;
      g.position.y = y;
      s.scene.add(g);
      floors.push({group: g, bars, k, base});
    }
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    let hovered = null;
    ren2(s).addEventListener('pointermove', e => {
      const r = ren2(s).getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(mouse, s.cam);
      const all = floors.flatMap(f => f.bars);
      const hit = ray.intersectObjects(all)[0];
      if (hit){
        const {i, j, v, k} = hit.object.userData;
        tipEl.style.display = 'block';
        tipEl.style.left = (e.clientX + 14) + 'px';
        tipEl.style.top = (e.clientY + 10) + 'px';
        tipEl.innerHTML = `${I18N[App.lang].head} ${k + 1} · Q <b style="color:#3fe0ff">${esc2(p.tokens[i])}</b> → K <b style="color:#5ef2b8">${esc2(p.tokens[j])}</b> · <b class="mono">${v.toFixed(3)}</b>`;
      } else tipEl.style.display = 'none';
    });
    ren2(s).addEventListener('pointerleave', () => { tipEl.style.display = 'none'; });
    /* click a tower → select that head everywhere */
    ren2(s).addEventListener('click', e => {
      const r = ren2(s).getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(mouse, s.cam);
      const all = floors.flatMap(f => f.bars);
      const hit = ray.intersectObjects(all)[0];
      if (hit){
        const k = hit.object.userData.k;
        App.headIdx = k;
        populateArcHead();
        R.scores(App.lang); R.arcs(App.lang); R.heads(App.lang);
        VIZ3D.setSurfHead(k);
        heads3.highlight(k);
        const sh = document.getElementById('surfHead');
        if (sh) sh.value = k;
      }
    });
    function ren2(s){ return s.ren.domElement; }
    heads3 = {...s, floors,
      setRotate(v){ s.ctrl.autoRotate = v; },
      highlight(k){
        floors.forEach(f => {
          f.base.material.color.setHex(f.k === k ? 0x8f7bff : 0x0e2244);
          f.base.material.opacity = f.k === k ? 0.8 : 0.55;
        });
      },
      resize: s.resize};
    heads3.highlight(App.headIdx);
    autoLoop(container, () => {
      s.ctrl.update();
      s.ren.render(s.scene, s.cam);
    });
    window.addEventListener('resize', () => heads3 && heads3.resize());
  }

  function refreshLang(){
    document.getElementById('archHint').textContent = I18N[App.lang].dragHint;
    document.getElementById('surfHint').textContent = I18N[App.lang].hoverHint;
    if (arch){
      const def = DATA.arch.find(a => a.id === 'mha');
      document.getElementById('archInfo').innerHTML =
        `<b>${def.label}</b><br>${def[App.lang === 'bn' ? 'bn' : 'en']}`;
    }
  }

  return {initArch, initSurf, initEmb3d, initPE3d, initHeads3d, refreshLang,
    __scenes: () => ({arch, surf, emb, pe3, heads3}),
    setArchRotate: v => arch && arch.setRotate(v),
    setSurfRotate: v => surf && surf.setRotate(v),
    setSurfHead: k => surf && surf.setHead(k),
    setEmbRotate: v => emb && emb.setRotate(v),
    playEmbAnalogy: () => emb && emb.playAnalogy(),
    setPE3dRotate: v => pe3 && pe3.setRotate(v),
    setPEPos: p => pe3 && pe3.setPos(p),
    setHeads3dRotate: v => heads3 && heads3.setRotate(v),
    highlightHeads3d: k => heads3 && heads3.highlight(k)};
})();
