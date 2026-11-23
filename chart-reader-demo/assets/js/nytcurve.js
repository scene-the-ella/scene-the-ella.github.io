// A port of the NYT Upshot yield-curve graphic (Gregor Aisch & Amanda Cox, 2015) to three.js r128,
// following the original build.js: same scales, colors, lines, labels, scene parameters and
// camera animation. The data is read at runtime from the NYT's own asset server.
(function () {
  const BASE = 'https://static01.nyt.com/newsgraphics/2015/01/06/yield-curve/63124205e61a524dcef533905d8e5b459cbc8963/';
  const C = ['X1M', 'X3M', 'X6M', 'X1Y', 'X2Y', 'X3Y', 'X5Y', 'X7Y', 'X10Y', 'X20Y', 'X30Y'];
  const COLORS = ['#eef4f8', '#ddecf4', '#cce5f0', '#bcddec', '#aed5e7', '#a0cde2', '#94c5dc', '#89bcd6', '#7eb4d0', '#74abc9', '#6aa2c2', '#619abb', '#5892b4', '#4f8aad', '#4781a6', '#3f799f', '#3a7195', '#35688c', '#326082', '#2f5877', '#2c506c', '#243d52'];
  const P = 80, DEPTH = 40, M = 30, L = 1.8;        // plane width (time), depth (maturity), height; aspect
  const W_OPAC = { product: 0.5, date: 0.2, front: 1, bottom: 1 };

  // ---- small d3 v3 equivalents ----
  function parseTSV(text) {
    const lines = text.split(/\r\n|\r|\n/).filter(l => l.length);
    const head = lines[0].split('\t');
    return lines.slice(1).map(l => { const v = l.split('\t'); const o = {}; head.forEach((h, i) => { o[h] = v[i]; }); return o; });
  }
  function quantile(xs, p) { const H = (xs.length - 1) * p + 1, h = Math.floor(H), v = +xs[h - 1], e = H - h; return e ? v + e * (xs[h] - v) : v; }
  function bisectRight(a, x) { let lo = 0, hi = a.length; while (lo < hi) { const mid = (lo + hi) >>> 1; if (x < a[mid]) hi = mid; else lo = mid + 1; } return lo; }
  function quantileScale(values, range) {
    const xs = values.filter(v => !isNaN(v)).sort((a, b) => a - b);
    const th = []; for (let k = 1; k < range.length; k++) th.push(quantile(xs, k / range.length));
    return v => range[bisectRight(th, v)];
  }
  function cubicInOut(t) { if (t <= 0) return 0; if (t >= 1) return 1; const t2 = t * t, t3 = t2 * t; return 4 * (t < 0.5 ? t3 : 3 * (t - t2) + t3 - 0.75); }
  const hex = h => new THREE.Color(h);
  const isNA = v => v == 'N/A' || v == '' || v === undefined;

  // Load the three country files from the NYT asset server
  async function load() {
    const get = f => fetch(BASE + f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.text(); }).then(parseTSV);
    const [us, germany, japan] = await Promise.all([get('yield-curve.csv'), get('yield-curve-germany.csv'), get('yield-curve-japan.csv')]);
    return { us, germany, japan };
  }

  // One graphic instance per country (as in the original)
  function instance(rows, container, country, maxima) {
    const H = ['1-month' + (country == 'us' ? ' Treasury' : ''), '3-month', '6-month', '1-year', '2-year', '3-year', '5-year', '7-year', '10-year', '20-year', '30-year'];
    const all = [];
    rows = rows.filter(e => { let r = 0; C.forEach(k => { if (!isNA(e[k])) r++; }); return r >= 7; });
    rows.forEach(e => {
      const t = e.Time.split('/').map(Number);
      e.date = new Date((t[2] > 20 ? 1900 : 2000) + t[2], t[0] - 1, t[1]);
      e.curve = C.map(k => { if (e[k] == '' || e[k] == undefined) e[k] = NaN; all.push(+e[k]); return +e[k]; });
    });
    const d0 = new Date(1990, 0, 1).getTime(), d1 = Math.max(...rows.map(r => r.date.getTime()));
    const S = d => -P / 2 + P * ((d instanceof Date ? d.getTime() : d) - d0) / (d1 - d0);
    const X = i => DEPTH / 2 - DEPTH * (i + 0.25) / (C.length - 0.75 + 0.25);
    const T = v => v * M / 9.5;
    const q = quantileScale(all, COLORS);
    const N = v => v < 0 ? '#f89493' : q(v);

    const el = document.createElement('div');
    el.className = 'g-yield-curve';
    container.appendChild(el);
    let A = container.clientWidth, O = A / L;
    const k = new THREE.Scene(), Mo = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(25, A / O, 0.1, 1e9);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.autoClear = false;
    renderer.setSize(A, O);
    renderer.setClearColor(0xffffff, 1);
    el.appendChild(renderer.domElement);
    const target = new THREE.Vector3(3.800669069058799, 9.632232077965208, -7.7489744200590245);
    camera.position.set(69.25927377370033, 12.025245226901038, 60.47832663225779);
    camera.lookAt(target);

    // Surface
    const plane = (() => {
      const g = new THREE.PlaneGeometry(P, DEPTH, rows.length - 1, C.length - 1);
      const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
      for (let o = 0; o < pos.count; o++) {
        const a = o % rows.length;
        let f = Math.floor(o / rows.length), l = T(rows[a].curve[f]);
        if (isNaN(l)) { if (f === 0) { f = 1; l = T(rows[a].curve[f]); } else while (isNaN(l) && f > 0) { f--; l = T(rows[a].curve[f]); } }
        // Where the original still ended on a missing value (German 1- and 3-month), fold the vertex onto
        // the nearest available maturity instead of leaving NaN; the triangles collapse, as they did there.
        while (isNaN(l) && f < C.length - 1) { f++; l = T(rows[a].curve[f]); }
        const h = hex(N(rows[a].curve[f]));
        pos.setXYZ(o, S(rows[a].date), l, X(f));
        col[o * 3] = h.r; col[o * 3 + 1] = h.g; col[o * 3 + 2] = h.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      pos.needsUpdate = true;
      return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, vertexColors: true }));
    })();

    function lineFrom(pts, black, opacity) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.flat()), 3));
      return new THREE.Line(g, new THREE.LineBasicMaterial({ color: black ? 0x000000 : 0xffffff, transparent: true, opacity }));
    }
    // a maturity over time (mt)
    function productLine(e, black) {
      const mat = black;
      if (black && e > 3) black = false;          // as in the original: color stays black, point rule switches
      const pts = [];
      rows.forEach(r => {
        if (isNaN(r.curve[e])) return;
        if ((black && (e === 0 || (e > 0 && isNaN(r.curve[0])))) || (!black && (e > 1 || !isNaN(r.curve[0])))) pts.push([S(r.date), T(r.curve[e]), X(e)]);
      });
      return lineFrom(pts, mat, mat ? 1 : W_OPAC.product);
    }
    // one date across maturities (gt)
    function dateLine(i, black) {
      const pts = [];
      rows[i].curve.forEach((v, n) => { if (!isNaN(v)) pts.push([S(rows[i].date), T(v), X(n)]); });
      return lineFrom(pts, black, black ? 1 : W_OPAC.date);
    }
    const blackAxis = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true });
    const grayGrid = new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true });
    const seg = (a, b, mat) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); return new THREE.Line(g, mat); };

    const R = { date: [], product: [], front: [], bottom: [] };
    [0, rows.length - 1].concat(maxima[country] || []).forEach(i => { if (rows[i]) { const l = dateLine(i); R.date.push(l); k.add(l); } });
    const Q = { last: dateLine(rows.length - 1, true) };
    Q.last.material.opacity = 0; Mo.add(Q.last);
    const G = { last: false };
    k.add(plane);
    if (country == 'germany') R.front.push(add(productLine(2, true))); else { R.front.push(add(productLine(0, true))); R.front.push(add(productLine(1, true))); }
    R.front.forEach(l => { l.renderOrder = 2; });   // black edge line stays on top of the white contour it overlaps
    C.forEach((c, t) => { if (t > 0) { const l = productLine(t); R.product.push(l); k.add(l); } });
    function add(o) { k.add(o); return o; }

    // axes
    const yMin = 0, xFront = DEPTH / 2, xBack = -DEPTH / 2, sMin = -P / 2, sMax = P / 2;
    k.add(seg([sMin, yMin, xFront], [sMax, yMin, xFront], blackAxis));
    k.add(seg([sMax, yMin, xFront], [sMax, yMin, xBack], blackAxis));
    k.add(seg([sMax, 0, xBack], [sMax, M, xBack], blackAxis));

    // highlightable products (black, overlay scene)
    const Xp = {}, V = {};
    C.slice(3).forEach(c => { const l = productLine(C.indexOf(c), true); l.material.opacity = 0; Mo.add(l); Xp[c] = l; V[c] = false; });

    // labels
    const labels = [], J = { x: [], y: [], z: [] }, raycaster = new THREE.Raycaster();
    function camParams() {
      const r = camera.position.length();
      let t = Math.atan(camera.position.z / camera.position.x);
      if (t < -0.5) t += Math.PI;
      return { r, width: r * 2 * Math.tan(0.5 * camera.fov / 180 * Math.PI), azi: Math.acos(camera.position.y / r), phi: t, fov: camera.fov, lookat_x: target.x, lookat_y: target.y, lookat_z: target.z };
    }
    function label(html, p, ha, va, show, noOcclusion) {
      const d = document.createElement('div');
      d.className = 'label';
      d.innerHTML = html;
      el.appendChild(d);
      const w = d.offsetWidth, h = d.offsetHeight;
      let timer = null;
      function check(c) {
        d.classList.remove('hidden');
        if (!noOcclusion) {
          raycaster.set(camera.position, p.clone().sub(camera.position).normalize());
          const hit = raycaster.intersectObject(plane);
          if (hit.length && p.distanceTo(camera.position) > hit[0].distance) d.classList.add('hidden');
        }
        if (show && !show(c)) d.classList.add('hidden');
      }
      function update() {
        const c = camParams();
        const e = p.clone().project(camera);
        const vx = (e.x + 1) / 2 * A, vy = -(e.y - 1) / 2 * O;
        const a = typeof ha == 'function' ? ha(c) : ha, b = typeof va == 'function' ? va(c) : va;
        d.style.left = (vx - w * (a == 'center' ? 0.5 : a == 'right' ? 1 : 0)) + 'px';
        d.style.top = (vy - h * (b == 'middle' ? 0.5 : b == 'bottom' ? 1 : 0)) + 'px';
        d.style.textAlign = a;
        clearTimeout(timer); timer = setTimeout(() => check(c), 200);
      }
      const o = { update, el: d, remove() { d.remove(); const i = labels.indexOf(o); if (i >= 0) labels.splice(i, 1); } };
      if (show && !show(camParams())) d.classList.add('hidden');
      labels.push(o); update();
      return o;
    }
    // yield ticks (xt)
    [2, 4, 6, 8].forEach(v => {
      R.bottom.push(add(seg([sMin, T(v), xBack], [sMax, T(v), xBack], grayGrid.clone())));
      J.z.push(label(v + '%' + (v == 8 ? ' yield<br>per year' : ''), new THREE.Vector3(sMax + 0.1, T(v), xBack), 'left', 'middle'));
    });
    // time ticks (bt): yearly
    for (let y = 1990; y <= 2015; y++) {
      const n = S(new Date(y, 0, 1));
      if (n > sMax + 1e-6) break;
      R.bottom.push(add(seg([n, yMin, xFront], [n, yMin, xBack], grayGrid.clone())));
      k.add(seg([n, yMin, xFront], [n, yMin - 0.1, xFront], blackAxis));
      J.x.push(label(y >= 2013 ? String(y) : '’' + String(y).substr(2), new THREE.Vector3(n, yMin, xFront),
        c => c.phi > 0.4 ? 'center' : c.phi > 0 ? 'right' : 'left', c => c.phi > 0.4 ? 'top' : 'middle',
        c => y % 2 == 0 || c.width < 40));
    }
    // maturity ticks (Et)
    for (let i = 0; i <= 10; i++) {
      const ay = X(i);
      k.add(seg([sMin, yMin, ay], [sMax, yMin, ay], grayGrid));
      k.add(seg([sMax, yMin, ay], [sMax, yMin - 0.1, ay], blackAxis));
      J.y.push(label(H[i].split(' ').join('<br>'), new THREE.Vector3(sMax + 0.05, yMin, ay), c => c.phi > 0.3 ? 'left' : 'center', c => c.azi < 0.3 ? 'middle' : 'top'));
    }

    // state
    let hiddenInst = false, tt = { date: false, product: false, front: false, bottom: false }, nt = { ...tt };
    let Jh = false, Kh = false, zHide = {}, annotations = [], pending = null, first = true, flat = false;

    function render() {
      if (hiddenInst) return;
      renderer.clear(); renderer.render(k, camera); renderer.clearDepth(); renderer.render(Mo, camera);
      camera.updateMatrixWorld();
      labels.forEach(l => l.update());
      if (typeof placeMarker === 'function') placeMarker();
    }
    // Same as the original: place the camera on a sphere around the origin, then let OrbitControls'
    // update() clamp the polar angle around the target (EPS keeps the top view off the pole).
    const EPS = 0.000001, maxPolar = 0.7 * Math.PI;
    function setCam(e) {
      target.set(e.lookat_x, e.lookat_y, e.lookat_z);
      camera.position.set(e.r * Math.sin(e.azi) * Math.cos(e.phi), e.r * Math.cos(e.azi), e.r * Math.sin(e.azi) * Math.sin(e.phi));
      const off = camera.position.clone().sub(target), rad = off.length();
      let theta = Math.atan2(off.x, off.z), pol = Math.atan2(Math.sqrt(off.x * off.x + off.z * off.z), off.y);
      pol = Math.max(0, Math.min(maxPolar, pol));
      pol = Math.max(EPS, Math.min(Math.PI - EPS, pol));
      camera.position.set(target.x + rad * Math.sin(pol) * Math.sin(theta), target.y + rad * Math.cos(pol), target.z + rad * Math.sin(pol) * Math.cos(theta));
      if (e.fov != camera.fov) { camera.fov = e.fov; camera.updateProjectionMatrix(); }
      camera.lookAt(target);
    }
    const lt = (fov, width) => width / (2 * Math.tan(0.5 * fov / 180 * Math.PI));

    function fadeLabels() {
      Object.keys(J).forEach(g => J[g].forEach(l => {
        l.el.style.transition = zHide[g] ? 'opacity 2s' : 'opacity .4s';
        l.el.style.opacity = zHide[g] ? 0 : 1;
      }));
    }
    function animateTo(to, dur = 2000) {
      const from = camParams(), keys = Object.keys(to);
      const t0 = performance.now();
      fadeLabels();
      function step(now, force) {
        const s = force ? 1 : Math.min(1, (now - t0) / dur), e = cubicInOut(s);
        const c = {}; keys.forEach(kk => { c[kk] = from[kk] + (to[kk] - from[kk]) * e; });
        c.r = lt(c.fov, c.width);
        setCam(c);
        Object.keys(R).forEach(g => {
          if (tt[g] != nt[g]) {
            const a = nt[g] ? 0 : 1, b = tt[g] ? 0 : 1;
            R[g].forEach(l => { l.material.opacity = (a + (b - a) * s) * W_OPAC[g]; });
          }
        });
        C.slice(3).forEach(p => {
          if (!V[p] == (Jh == p)) { const a = V[p] ? 1 : 0, b = V[p] ? 0 : 1; Xp[p].material.opacity = Math.max(0, Math.min(1, a + (b - a) * s)); }
        });
        Object.keys(Q).forEach(p => {
          if (!G[p] == (Kh == p)) { const a = G[p] ? 1 : 0, b = G[p] ? 0 : 1; Q[p].material.opacity = Math.max(0, Math.min(1, a + (b - a) * s)); }
        });
        render();
        if (s >= 1) {
          Object.keys(R).forEach(g => { nt[g] = tt[g]; });
          Object.keys(V).forEach(p => { V[p] = p == Jh; });
          Object.keys(G).forEach(p => { G[p] = p == Kh; });
          flat = to.fov < 1; pending = null;
          return true;
        }
        return false;
      }
      pending = () => step(0, true);
      if (first) { first = false; step(0, true); return; }
      const loop = now => { if (pending && !step(now)) requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    function newScene() {
      if (pending) pending();
      tt = { date: false, product: false, front: false, bottom: false };
      Jh = false; Kh = false;
      Object.keys(zHide).forEach(kk => { zHide[kk] = false; });
      annotations.forEach(a => a.remove()); annotations = [];
    }
    function addAnnotations(list) {
      list.forEach(s => {
        const t = s.split('|'), n = new Date(t[0]), v = +t[2];
        const p = new THREE.Vector3(S(n), T(v), X(C.indexOf(t[1])));
        const l = label(t[6], p, t[3], t[4], null, true);
        if (t[5]) t[5].split(' ').forEach(c => c && l.el.classList.add(c));
        l.el.style.opacity = 0;
        setTimeout(() => { l.el.style.transition = 'opacity 1s'; l.el.style.opacity = 1; }, 1000);
        annotations.push(l);
      });
    }

    // dragging (OrbitControls with the original limits) and click-to-unflatten
    let controls = null;
    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.target = target;
      controls.minPolarAngle = 0; controls.maxPolarAngle = 0.7 * Math.PI;
      controls.enableZoom = false; controls.enablePan = false;
      controls.addEventListener('change', render);
    }
    renderer.domElement.addEventListener('click', () => {
      if (flat) { const e = Object.assign({}, camParams()); e.fov = 10; e.width = Math.max(e.width, 45); delete e.r; animateTo(e, 300); }
    });

    // ---- hooks for the listening modes (not in the original) ----
    let rowLine = null, seriesLine = null;
    const marker = document.createElement('div');
    marker.className = 'g-marker'; marker.style.display = 'none';
    el.appendChild(marker);
    let markerAt = null;
    function placeMarker() {
      if (!markerAt) { marker.style.display = 'none'; return; }
      const [i, e] = markerAt, v = rows[i] && rows[i].curve[e];
      if (v === undefined || isNaN(v)) { marker.style.display = 'none'; return; }
      const q = new THREE.Vector3(S(rows[i].date), T(v), X(e)).project(camera);
      marker.style.display = 'block';
      marker.style.left = ((q.x + 1) / 2 * A) + 'px';
      marker.style.top = (-(q.y - 1) / 2 * O) + 'px';
    }
    function highlightRow(i) {
      if (rowLine) { Mo.remove(rowLine); rowLine = null; }
      if (i !== null && i !== undefined && rows[i]) { rowLine = dateLine(i, true); Mo.add(rowLine); }
      render();
    }
    function highlightSeries(e) {
      if (seriesLine) { Mo.remove(seriesLine); seriesLine = null; }
      if (e !== null && e !== undefined) {
        const pts = []; rows.forEach(r => { if (!isNaN(r.curve[e])) pts.push([S(r.date), T(r.curve[e]), X(e)]); });
        seriesLine = lineFrom(pts, true, 1); Mo.add(seriesLine);
      }
      render();
    }
    function setMarker(i, e) { markerAt = (i === null || i === undefined) ? null : [i, e]; placeMarker(); }
    function rowIndexOf(date) {
      const t = date.getTime(); let lo = 0, hi = rows.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (rows[mid].date.getTime() < t) lo = mid + 1; else hi = mid; }
      return lo;
    }

    function setWidth(w) { A = w; O = A / L; renderer.setSize(A, O); camera.aspect = A / O; camera.updateProjectionMatrix(); render(); }

    return {
      el, animateTo, newScene, addAnnotations, render, setWidth, camParams,
      hide() { el.style.display = 'none'; hiddenInst = true; },
      show() { el.style.display = ''; hiddenInst = false; render(); },
      hideGridLines(g) { tt[g] = true; }, hideLabels(g) { zHide[g] = true; },
      highlightProduct(p) { Jh = p; }, highlightDate(d) { Kh = d; },
      // hooks for the other demo modes
      highlightRow, highlightSeries, setMarker, rowIndexOf, slide: null,
      S, X, T, rows, camera, target, labels: J, plane, project(v3) { const e = v3.clone().project(camera); return { x: (e.x + 1) / 2 * A, y: -(e.y - 1) / 2 * O }; },
    };
  }

  // Controller: scenes, stepper, text (mirrors the original require block)
  async function mount(container, opts = {}) {
    const [{ scenes, maxima }, data] = await Promise.all([
      fetch(opts.scenesUrl || 'assets/data/nyt_scenes.json').then(r => r.json()),
      load(),
    ]);
    const inst = {};
    const camOf = sc => ({ azi: sc.azi, phi: sc.phi, fov: sc.fov, width: sc.width, lookat_x: sc.lookat[0], lookat_y: sc.lookat[1], lookat_z: sc.lookat[2] });
    function get(country, sc) {
      if (!inst[country]) inst[country] = instance(data[country], container, country, maxima);
      return inst[country];
    }
    let current = null, index = -1;
    const listeners = [];
    function go(i) {
      const sc = scenes[i];
      const g = get(sc.country, sc);
      if (current && current !== g) current.hide();
      g.show(); g.setWidth(container.clientWidth);
      current = g;
      g.newScene();
      sc.hideGrid.forEach(g.hideGridLines);
      sc.hideLabels.forEach(g.hideLabels);
      if (sc.highlightProduct) g.highlightProduct(sc.highlightProduct);
      if (sc.highlightDate) g.highlightDate(sc.highlightDate);
      if (sc.annotation.length) g.addAnnotations(sc.annotation);
      g.animateTo(camOf(sc));
      index = i;
      listeners.forEach(f => f(i, sc));
    }
    window.addEventListener('resize', () => { if (current) current.setWidth(container.clientWidth); });
    return {
      scenes, go, get index() { return index; }, get current() { return current; },
      onScene(f) { listeners.push(f); },
      instance: c => get(c),
    };
  }

  window.NYTCurve = { mount, BASE };
})();
