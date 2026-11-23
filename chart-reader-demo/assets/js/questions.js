// Quiz content, shared by play.html (audience) and host.html (presenter).
(function () {
  // Tiny curve sketches for the "shape" options (points in a 0..100 box, y down)
  const SHAPES = {
    rise: [[6, 84], [30, 70], [55, 50], [80, 32], [94, 22]],
    flat: [[6, 52], [30, 52], [55, 52], [80, 52], [94, 52]],
    fall: [[6, 22], [30, 34], [55, 50], [80, 68], [94, 82]],
    dip: [[6, 26], [30, 54], [55, 66], [80, 50], [94, 32]],
  };
  const shapeOptions = [  // kept for reference; not used in the current quiz
    { id: 'rise', label: 'Rises from short to long', shape: SHAPES.rise },
    { id: 'flat', label: 'Flat', shape: SHAPES.flat },
    { id: 'fall', label: 'Falls all the way', shape: SHAPES.fall },
    { id: 'dip', label: 'Dips, then rises at the long end', shape: SHAPES.dip },
  ];

  // One question, asked after each of the three demos (all on NYT step 4).
  const relation = [
    { id: '3m', label: '3-month (short-term)' },
    { id: '10y', label: '10-year (long-term)' },
    { id: 'same', label: 'About the same' },
    { id: 'cant', label: 'Can’t tell' },
  ];
  const PROMPT = 'Right after step 4, in January 2007, which yield was higher?';
  window.QUESTIONS = [
    { id: 'q1', demo: 'screen-reader.html?step=4', demoName: 'Screen reader', prompt: PROMPT, options: relation, answer: '3m', vivid: true },
    { id: 'q2', demo: 'chart-reader.html?step=4', demoName: 'Chart Reader', prompt: PROMPT, options: relation, answer: '3m', vivid: true },
    { id: 'q3', demo: 'pivot.html?step=4', demoName: 'Pivot', prompt: PROMPT, options: relation, answer: '3m', vivid: true },
  ];

  window.VIVID_LABELS = ['Not at all', 'A little', 'Somewhat', 'Clearly', 'Like I saw it'];

  window.shapeSVG = function (pts, stroke = '#121212') {
    return `<svg viewBox="0 0 100 100" width="64" height="48" aria-hidden="true" preserveAspectRatio="none">
      <line x1="2" y1="96" x2="98" y2="96" stroke="#c9c9c9" stroke-width="2"/>
      <polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    </svg>`;
  };

  // Stages the presenter steps through
  window.STAGES = ['lobby', 'q1', 'q1:results', 'q2', 'q2:results', 'q3', 'q3:results', 'end'];
})();
