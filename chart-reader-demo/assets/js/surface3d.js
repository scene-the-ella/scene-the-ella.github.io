// Yield surface in the style of the NYT graphic: time × maturity × yield,
// with smooth camera moves between the story's views (3-D, front, side, top).
// Requires three.js r128 (global THREE).
(function () {
  const LX = 12, LZ = 4.2, HY = 0.36;          // world size: time, maturity depth, height per percent
  const MONTHS_N = 303;

  // Camera presets. pos/target in world units; fov in degrees; up vector.
  // Flat views (front, side, top) use a far camera with a narrow lens, which reads as a 2-D chart;
  // their lens is computed from 'fit' (world width x height to show) and the container's aspect.
  const VIEWS = {
    '3d':     { pos: [-8.8, 8.4, 13.6], target: [1.6, 2.1, 0], fov: 33, up: [0, 1, 0] },
    front:    { pos: [60, 1.6, -1.6],   target: [0, 1.6, -1.6], fit: [LZ + 4.8, 9 * HY + 0.9], up: [0, 1, 0] },
    side:     { pos: [3.0, 1.55, 60],   target: [3.0, 1.55, 0], fit: [LX + 7.6, 9 * HY + 1.0], up: [0, 1, 0] },
    top:      { pos: [2.6, 60, 0.001],  target: [2.6, 0, 0],    fit: [LX + 7.0, LZ + 1.4], up: [0, 0, -1] },
    valley:   { pos: [10.8, 4.2, 9.0],  target: [4.4, 0.9, 0.2], fov: 31, up: [0, 1, 0] },
    puzzle:   { pos: [3.6, 3.0, 12.5],  target: [3.6, 1.6, -0.4], fov: 31, up: [0, 1, 0] },
  };

  // Which labels each view shows
  const LABELS_FOR = {
    '3d': { years: 1, mats: 1, pct: 1 }, front: { years: 0, mats: 1, pct: 1 }, side: { years: 1, mats: 0, pct: 1 },
    top: { years: 1, mats: 1, pct: 0 }, valley: { years: 1, mats: 1, pct: 0 }, puzzle: { years: 1, mats: 0, pct: 1 },
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Sequential blue, light at 0% to deep navy at 9% (close to the NYT surface)
  const RAMP = [[0, [233, 241, 251]], [0.3, [160, 196, 232]], [0.6, [74, 125, 180]], [1, [28, 52, 86]]];
  function colorFor(v) {
    const t = Math.max(0, Math.min(1, v / 9));
    let j = 0; while (j < RAMP.length - 2 && t > RAMP[j + 1][0]) j++;
    const [t0, c0] = RAMP[j], [t1, c1] = RAMP[j + 1], u = (t - t0) / (t1 - t0);
    return c0.map((c, i) => (c + (c1[i] - c) * u) / 255);
  }

  function create(container, D) {
    const nM = D.months.length, nK = D.maturities.length;
    const X = i => -LX / 2 + LX * i / (nM - 1);
    const Z = k => LZ / 2 - LZ * k / (nK - 1);          // short maturities in front
    const Y = v => v * HY;

    container.classList.add('s3d');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0xffffff, 1);
    container.appendChild(renderer.domElement);
    const overlay = document.createElement('div');
    overlay.className = 's3d-labels';
    container.appendChild(overlay);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);

    // Surface mesh
    const pos = new Float32Array(nM * nK * 3), col = new Float32Array(nM * nK * 3);
    for (let i = 0; i < nM; i++) for (let k = 0; k < nK; k++) {
      const o = (i * nK + k) * 3, v = D.values[i][k];
      pos[o] = X(i); pos[o + 1] = Y(v); pos[o + 2] = Z(k);
      const c = colorFor(v); col[o] = c[0]; col[o + 1] = c[1]; col[o + 2] = c[2];
    }
    const idx = [];
    for (let i = 0; i < nM - 1; i++) for (let k = 0; k < nK - 1; k++) {
      const a = i * nK + k, b = a + 1, c = a + nK, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    const surf = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
    scene.add(surf);

    // Thin white contour lines: one per maturity, and one curve per year (like the NYT ridges)
    const white = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
    for (let k = 0; k < nK; k++) {
      const pts = []; for (let i = 0; i < nM; i++) pts.push(new THREE.Vector3(X(i), Y(D.values[i][k]) + 0.004, Z(k)));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), white));
    }
    for (let i = 0; i < nM; i += 12) {
      const pts = []; for (let k = 0; k < nK; k++) pts.push(new THREE.Vector3(X(i), Y(D.values[i][k]) + 0.004, Z(k)));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), white));
    }

    // Floor grid
    const gridMat = new THREE.LineBasicMaterial({ color: 0xd9d9d9 });
    const floor = [];
    for (let y = 1990; y <= 2015; y += 1) { const i = D.months.indexOf(`${y}-01`); floor.push(new THREE.Vector3(X(i), 0, Z(0)), new THREE.Vector3(X(i), 0, Z(nK - 1))); }
    for (let k = 0; k < nK; k++) floor.push(new THREE.Vector3(X(0), 0, Z(k)), new THREE.Vector3(X(nM - 1), 0, Z(k)));
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(floor), gridMat));
    // Vertical yield axis at the back-right corner
    const axisPts = [new THREE.Vector3(X(nM - 1) + 0.25, 0, Z(nK - 1)), new THREE.Vector3(X(nM - 1) + 0.25, Y(9), Z(nK - 1))];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(axisPts), new THREE.LineBasicMaterial({ color: 0x121212 })));

    // Highlight lines (black): one maturity over time, one month across maturities
    const blackMat = new THREE.LineBasicMaterial({ color: 0x121212 });
    const blueMat = new THREE.LineBasicMaterial({ color: 0x184f95 });
    let seriesLines = [], curveLine = null;
    function seriesLine(k, mat) {
      const pts = []; for (let i = 0; i < nM; i++) pts.push(new THREE.Vector3(X(i), Y(D.values[i][k]) + 0.02, Z(k) + 0.01));
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat); scene.add(l); return l;
    }
    function curveOf(m) {
      const pts = []; for (let k = 0; k < nK; k++) pts.push(new THREE.Vector3(X(m) + 0.01, Y(D.values[m][k]) + 0.02, Z(k)));
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), blackMat); scene.add(l); return l;
    }

    // Labels (HTML, projected every frame)
    const labels = [];
    function addLabel(text, p, cls, group) {
      const el = document.createElement('div');
      el.className = 's3d-label ' + cls;
      el.textContent = text;
      overlay.appendChild(el);
      labels.push({ el, p: new THREE.Vector3(...p), group, text });
      return el;
    }
    for (let y = 1990; y <= 2015; y += 1) {
      const i = D.months.indexOf(`${y}-01`);
      if (i < 0) continue;
      addLabel(y % 5 === 0 ? String(y) : `’${String(y).slice(2)}`, [X(i), 0, Z(0) + 0.35], 'yr' + (y % 5 === 0 ? ' major' : ''), 'years');
    }
    D.maturities.forEach((m, k) => addLabel(m, [X(nM - 1) + 0.55, 0, Z(k)], 'mat', 'mats'));
    [2, 4, 6, 8].forEach(v => addLabel(v === 8 ? '8% yield' : v + '%', [X(nM - 1) + 0.35, Y(v), Z(nK - 1)], 'pct', 'pct'));
    const notes = [];
    function addNote(text, p) { const el = addLabel(text, p, 'note', 'notes'); notes.push(el); return el; }

    // Cursor marker (HTML ring at a projected point)
    const marker = document.createElement('div');
    marker.className = 's3d-marker';
    overlay.appendChild(marker);
    let cursor = null;   // {m,k}

    // Camera animation
    // Resolve a preset's lens for the current aspect ratio
    function resolve(v) {
      const out = JSON.parse(JSON.stringify(v));
      if (v.fit) {
        const d = Math.hypot(v.pos[0] - v.target[0], v.pos[1] - v.target[1], v.pos[2] - v.target[2]);
        const aspect = container.clientWidth / Math.max(1, container.clientHeight);
        const h = Math.max(v.fit[1], v.fit[0] / aspect);
        out.fov = 2 * Math.atan(h / 2 / d) * 180 / Math.PI;
      }
      return out;
    }
    let cur = resolve(VIEWS['3d']), anim = null, viewName = '3d';
    function applyCam(v) {
      camera.position.set(...v.pos); camera.up.set(...v.up).normalize();
      camera.fov = v.fov; camera.updateProjectionMatrix();
      camera.lookAt(new THREE.Vector3(...v.target));
    }
    function setView(name, dur = 1400) {
      const to = resolve(VIEWS[name] || VIEWS['3d']);
      viewName = name;
      const from = JSON.parse(JSON.stringify(cur));
      const t0 = performance.now();
      anim = now => {
        const t = Math.min(1, (now - t0) / dur), e = ease(t);
        const v = {
          pos: from.pos.map((a, i) => lerp(a, to.pos[i], e)),
          target: from.target.map((a, i) => lerp(a, to.target[i], e)),
          up: from.up.map((a, i) => lerp(a, to.up[i], e)),
          // keep the framing steady while moving far away: interpolate fov in log space
          fov: Math.exp(lerp(Math.log(from.fov), Math.log(to.fov), e)),
        };
        cur = v;
        if (t >= 1) { cur = JSON.parse(JSON.stringify(to)); anim = null; }
      };
      const L = LABELS_FOR[name] || LABELS_FOR['3d'];
      overlay.dataset.view = name;
      labels.forEach(l => { if (l.group in L) l.el.classList.toggle('off', !L[l.group]); });
      if (dur === 0) { cur = JSON.parse(JSON.stringify(to)); anim = null; }
    }

    function setHighlight({ series = [], month = null } = {}) {
      seriesLines.forEach(l => scene.remove(l)); seriesLines = [];
      if (curveLine) { scene.remove(curveLine); curveLine = null; }
      series.forEach((k, j) => seriesLines.push(seriesLine(k, j === 0 ? blackMat : blueMat)));
      if (month !== null && month !== undefined) curveLine = curveOf(month);
    }
    function clearNotes() { notes.splice(0).forEach(el => { el.remove(); const i = labels.findIndex(l => l.el === el); if (i >= 0) labels.splice(i, 1); }); }
    function note(text, m, k, dy = 0.5) { return addNote(text, [X(m), Y(D.values[m][k]) + dy, Z(k)]); }
    function setCursor(m, k) { cursor = (m === null || m === undefined) ? null : { m, k }; }
    function flashLabel(text) {
      labels.forEach(l => l.el.classList.toggle('lit', text !== null && l.text === text));
    }

    function resize() {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (!anim && typeof viewName !== 'undefined') cur = resolve(VIEWS[viewName] || VIEWS['3d']);
    }
    window.addEventListener('resize', resize);

    const v3 = new THREE.Vector3();
    function project(p) {
      v3.copy(p).project(camera);
      return { x: (v3.x + 1) / 2 * container.clientWidth, y: (1 - v3.y) / 2 * container.clientHeight, behind: v3.z > 1 };
    }
    function frame(now) {
      if (anim) anim(now);
      applyCam(cur);
      renderer.render(scene, camera);
      labels.forEach(l => {
        const s = project(l.p);
        l.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
        l.el.style.visibility = s.behind ? 'hidden' : '';
      });
      if (cursor) {
        const s = project(new THREE.Vector3(X(cursor.m), Y(D.values[cursor.m][cursor.k]) + 0.02, Z(cursor.k)));
        marker.style.display = 'block';
        marker.style.transform = `translate(${s.x}px, ${s.y}px)`;
      } else marker.style.display = 'none';
      requestAnimationFrame(frame);
    }
    resize();
    requestAnimationFrame(frame);
    applyCam(cur);

    // NYT step presets (U.S. steps 1–6)
    const mi = s => D.months.indexOf(s);
    function step(n, dur) {
      clearNotes(); setCursor(null);
      if (n === 1) { setView('3d', dur); setHighlight({ series: [0] }); }
      else if (n === 2) { setView('front', dur); setHighlight({ month: nM - 1 }); note('March 2015', nM - 1, nK - 1, 0.25); }
      else if (n === 3) { setView('valley', dur); setHighlight({ series: [0] }); }
      else if (n === 4) { setView('puzzle', dur); setHighlight({ series: [0, 7] }); note('Long-term rates failed to rise', mi('2004-09'), 7, 1.1); }
      else if (n === 5) { setView('side', dur); setHighlight({ series: [7] }); note('10-year', mi('2013-06'), 7, 0.45); }
      else if (n === 6) { setView('top', dur); setHighlight({}); }
      else { setView('3d', dur); setHighlight({}); }
    }

    return { step, setView, setHighlight, setCursor, flashLabel, note, clearNotes, get view() { return viewName; }, X, Z, Y, nM, nK, canvas: renderer.domElement };
  }

  window.Surface3D = { create };
})();
