// Shared header: NYT-style step control (dots + Back/Next) and mode tabs.
// Every demo page is one "mode" of the same NYT step: ?step=1..9
// Pages that animate between steps set window.STEP_INPAGE = true before this script;
// they then receive a "stepchange" event instead of a page load.
(function () {
  const MODES = [
    { id: 'visual', href: 'visual.html', label: 'Visual' },
    { id: 'screen-reader', href: 'screen-reader.html', label: 'Screen reader' },
    { id: 'chart-reader', href: 'chart-reader.html', label: 'Chart Reader' },
    { id: 'pivot', href: 'pivot.html', label: 'Pivot' },
  ];
  const TITLES = [
    'Yield curve 101', 'Where we stand', 'Deep in the valley', 'Last time, a puzzle',
    'Long-term rates are low now, too', 'Long-term rates are low now, too',
    'Yields in Germany are negative', 'Yields in Germany are negative', 'A different shape in Japan',
  ];
  const params = new URLSearchParams(location.search);
  let step = Math.min(9, Math.max(1, parseInt(params.get('step') || '1', 10) || 1));
  window.NYT_STEP = step;
  window.NYT_TITLES = TITLES;

  const mast = document.getElementById('mast');
  if (!mast) return;
  const mode = mast.dataset.page;
  const url = (m, s) => `${MODES.find(x => x.id === m).href}?step=${s}`;
  const tools = [
    mast.dataset.voice === 'yes' ? '<button class="btn" data-voice-btn aria-pressed="true" title="The page speaks with its own voice. Turn it off if you use a screen reader.">Voice on</button>' : '',
    mast.dataset.screen === 'yes' ? '<button class="btn" data-screen-btn aria-pressed="false">Screen off</button>' : '',
  ].join('');

  mast.className = 'mast2';
  const modesNav = () => `<nav class="modes seg" aria-label="Mode">${MODES.map(m =>
    `<a href="${url(m.id, step)}"${m.id === mode ? ' aria-current="page"' : ''}>${m.label}</a>`).join('')}</nav>`;
  function render() {
    // a page without NYT steps keeps everything on one row
    if (mast.dataset.steps === 'no') {
      mast.innerHTML = `<div class="m-row"><a class="name" href="./">Chart Reader <span>CHI 2023 demo</span></a>${modesNav()}<div class="row">${tools}</div></div>`;
      return;
    }
    mast.innerHTML = `
      <div class="m-row">
        <a class="name" href="./">Chart Reader <span>CHI 2023 demo</span></a>
        <div class="row">${tools}</div>
      </div>
      <div class="m-row m-steps">
        <div class="stepper"${mast.dataset.steps === 'no' ? ' hidden' : ''}>
          <nav class="dots" aria-label="NYT steps">${TITLES.map((t, k) =>
            `<a href="${url(mode, k + 1)}" data-step="${k + 1}" title="${t}" aria-label="Step ${k + 1}: ${t}"${k + 1 === step ? ' aria-current="page"' : ''}></a>`).join('')}</nav>
          <div class="seg">
            <a href="${url(mode, Math.max(1, step - 1))}" data-step="${Math.max(1, step - 1)}"${step === 1 ? ' class="is-off" aria-disabled="true"' : ''}>Back</a>
            <a href="${url(mode, Math.min(9, step + 1))}" data-step="${Math.min(9, step + 1)}"${step === 9 ? ' class="is-off" aria-disabled="true"' : ''}>Next</a>
          </div>
          <div class="step-title"><b>${step}</b> ${TITLES[step - 1]}</div>
        </div>
        <nav class="modes seg" aria-label="Mode">${MODES.map(m =>
          `<a href="${url(m.id, step)}"${m.id === mode ? ' aria-current="page"' : ''}>${m.label}</a>`).join('')}</nav>
      </div>`;
    if (window.STEP_INPAGE) {
      mast.querySelectorAll('[data-step]').forEach(a => a.addEventListener('click', e => {
        e.preventDefault();
        const s = +a.dataset.step;
        if (s === step) return;
        step = s; window.NYT_STEP = s;
        history.replaceState(null, '', url(mode, s) + location.hash);
        render();
        window.dispatchEvent(new CustomEvent('stepchange', { detail: s }));
      }));
    }
  }
  render();

  if (mast.dataset.screen === 'yes' && !document.querySelector('.curtain')) {
    const c = document.createElement('div');
    c.className = 'curtain';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="meter"><i></i><i></i><i></i><i></i><i></i></div><div class="back">V</div>';
    document.body.prepend(c);
  }
})();
