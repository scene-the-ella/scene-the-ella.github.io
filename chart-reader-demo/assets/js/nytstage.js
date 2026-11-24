// Mounts the rebuilt NYT graphic with its own panel (dots, Back/Next, headline, text),
// kept in sync with the page header's step control. Used by every mode page.
(function () {
  function panelHTML() {
    return `<div class="g-slide">
      <div class="g-stepper"><div class="g-steps"></div>
        <div><span class="g-button g-back">Back</span><span class="g-button g-next active">Next</span></div></div>
      <div class="g-hed"></div><div class="g-text"></div></div>
      <div class="g-loading">Loading the NYT data</div>`;
  }
  function fit(box, maxH) {
    const top = box.getBoundingClientRect().top + window.scrollY;
    const room = (maxH || (window.innerHeight - top - 40));
    const w = Math.min(box.parentElement.clientWidth, room * 1.8);
    box.style.width = Math.max(640, Math.floor(w)) + 'px';
    box.classList.toggle('wide', w >= 1200);
  }

  async function mountStage(box, opts = {}) {
    box.classList.add('nyt');
    if (opts.panel === false) box.classList.add('nopanel');
    box.innerHTML = panelHTML();
    const size = () => fit(box, opts.maxHeight && opts.maxHeight());
    size();
    window.addEventListener('resize', size);
    const app = await NYTCurve.mount(box);
    box.querySelector('.g-loading').remove();
    const slide = box.querySelector('.g-slide'), steps = box.querySelector('.g-steps');
    const back = box.querySelector('.g-back'), next = box.querySelector('.g-next');
    steps.innerHTML = app.scenes.map((s, i) => `<div class="step" title="${s.id}" data-i="${i}"></div>`).join('');
    app.slide = slide;
    app.onScene((i, sc) => {
      box.querySelector('.g-hed').innerHTML = sc.hed;
      box.querySelector('.g-text').innerHTML = sc.text;
      steps.querySelectorAll('.step').forEach((d, k) => d.classList.toggle('active', k === i));
      back.classList.toggle('active', i > 0);
      if (window.NYT_STEP !== i + 1) {
        const a = document.querySelector(`#mast .dots a[data-step="${i + 1}"]`);
        window.__fromGraphic = true; if (a) a.click(); window.__fromGraphic = false;
      }
    });
    steps.addEventListener('click', e => { const d = e.target.closest('.step'); if (d) app.go(+d.dataset.i); });
    next.addEventListener('click', () => app.go((app.index + 1) % app.scenes.length));
    back.addEventListener('click', () => { if (app.index > 0) app.go(app.index - 1); });
    window.addEventListener('stepchange', e => { if (!window.__fromGraphic && app.index !== e.detail - 1) app.go(e.detail - 1); });
    app.go((window.NYT_STEP || 1) - 1);
    return app;
  }
  window.NYTStage = { mount: mountStage };
})();
