// Quiz content, shared by play.html (audience) and host.html (presenter).
(function () {
  // Tiny curve sketches for the "shape" options (points in a 0..100 box, y down)
  const SHAPES = {
    rise: [[6, 84], [30, 70], [55, 50], [80, 32], [94, 22]],
    flat: [[6, 52], [30, 52], [55, 52], [80, 52], [94, 52]],
    fall: [[6, 22], [30, 34], [55, 50], [80, 68], [94, 82]],
    dip: [[6, 26], [30, 54], [55, 66], [80, 50], [94, 32]],
  };
  const shapeOptions = [
    { id: 'rise', label: 'Rises from short to long', shape: SHAPES.rise },
    { id: 'flat', label: 'Flat', shape: SHAPES.flat },
    { id: 'fall', label: 'Falls all the way', shape: SHAPES.fall },
    { id: 'dip', label: 'Dips in the middle, rises at the long end', shape: SHAPES.dip },
  ];

  window.QUESTIONS = [
    {
      id: 'q1', demo: 'screen-reader.html', demoName: 'Through a screen reader',
      prompt: 'On March 18, 2015, what did the yield curve look like?',
      options: shapeOptions, answer: 'rise', vivid: true,
    },
    {
      id: 'q2', demo: 'chart-reader.html', demoName: 'Chart Reader',
      prompt: 'In January 2007, which yield was higher?',
      options: [
        { id: '3m', label: '3-month' },
        { id: '10y', label: '10-year' },
        { id: 'same', label: 'About the same' },
      ],
      answer: '3m', vivid: true,
    },
    {
      id: 'q3', demo: 'turn.html#2007-01&10-year&curve', demoName: 'Turn the chart',
      prompt: 'In January 2007, what did the yield curve look like?',
      options: shapeOptions, answer: 'dip', vivid: true,
    },
    {
      id: 'q4', demo: null, demoName: 'Your pick',
      prompt: 'Which would you reach for to explore a chart on your own?',
      options: [
        { id: 'sr', label: 'The original, with a screen reader' },
        { id: 'cr', label: 'Chart Reader' },
        { id: 'turn', label: 'Turn the chart' },
      ],
      answer: null, vivid: false, text: 'What would you add or change?',
    },
  ];

  window.VIVID_LABELS = ['Not at all', 'A little', 'Somewhat', 'Clearly', 'Like I saw it'];

  window.shapeSVG = function (pts, stroke = '#121212') {
    return `<svg viewBox="0 0 100 100" width="64" height="48" aria-hidden="true" preserveAspectRatio="none">
      <line x1="2" y1="96" x2="98" y2="96" stroke="#c9c9c9" stroke-width="2"/>
      <polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    </svg>`;
  };

  // Stages the presenter steps through
  window.STAGES = ['lobby', 'q1', 'q1:results', 'q2', 'q2:results', 'q3', 'q3:results', 'q4', 'q4:results', 'end'];
})();
