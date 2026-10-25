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

  function refreshLang(){
    document.getElementById('archHint').textContent = I18N[App.lang].dragHint;
    document.getElementById('surfHint').textContent = I18N[App.lang].hoverHint;
    if (arch){
      const def = DATA.arch.find(a => a.id === 'mha');
      document.getElementById('archInfo').innerHTML =
        `<b>${def.label}</b><br>${def[App.lang === 'bn' ? 'bn' : 'en']}`;
    }
  }

  return {initArch, initSurf, refreshLang,
    setArchRotate: v => arch && arch.setRotate(v),
    setSurfRotate: v => surf && surf.setRotate(v),
    setSurfHead: k => surf && surf.setHead(k)};
})();
