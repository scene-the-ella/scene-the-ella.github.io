// Masthead + demo stepper (dots and Back/Next, as in the NYT piece) + screen-off curtain.
(function () {
  const PAGES = [
    { id: 'screen-reader', href: 'screen-reader.html', title: 'Through a screen reader' },
    { id: 'chart-reader', href: 'chart-reader.html', title: 'Chart Reader' },
    { id: 'turn', href: 'turn.html', title: 'Turn the chart' },
  ];
  const mast = document.getElementById('mast');
  if (!mast) return;
  const here = mast.dataset.page;
  const i = PAGES.findIndex(p => p.id === here);
  const prev = i > 0 ? PAGES[i - 1].href : './';
  const next = i >= 0 && i < PAGES.length - 1 ? PAGES[i + 1].href : 'play.html';
  const voiceBtn = mast.dataset.voice === 'yes' ? '<button class="btn" data-voice-btn aria-pressed="true">Voice on</button>' : '';
  mast.className = 'mast';
  mast.innerHTML = `
    <a class="name" href="./">Seeing without seeing <span>· Chart Reader, CHI 2023</span></a>
    <div class="stepper">
      ${i >= 0 ? `<nav class="dots" aria-label="Demos">${PAGES.map((p, k) =>
        `<a href="${p.href}" title="${p.title}" aria-label="Demo ${k + 1}: ${p.title}"${k === i ? ' aria-current="page"' : ''}></a>`).join('')}</nav>
      <div class="seg"><a href="${prev}">Back</a><a href="${next}">Next</a></div>` : ''}
      ${voiceBtn}
      ${mast.dataset.screen === 'yes' ? '<button class="btn" data-screen-btn aria-pressed="false">Screen off</button>' : ''}
    </div>`;
  if (mast.dataset.screen === 'yes' && !document.querySelector('.curtain')) {
    const c = document.createElement('div');
    c.className = 'curtain';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="meter"><i></i><i></i><i></i><i></i><i></i></div><div class="word">Listening</div><div class="back">Press V to see the screen again</div>';
    document.body.prepend(c);
  }
})();
