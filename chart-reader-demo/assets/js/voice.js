// Shared speech + screen-off helpers for the demos.
// Speech uses the browser's built-in voice so the demos speak without a screen reader.
(function () {
  const synth = window.speechSynthesis;
  let enabled = true;
  let voice = null;
  let rate = 1.05;

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    const prefer = ['Samantha', 'Alex', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Daniel', 'Karen'];
    voice = null;
    for (const name of prefer) {
      voice = voices.find(v => v.name.startsWith(name));
      if (voice) break;
    }
    if (!voice) voice = voices.find(v => /^en[-_]US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
  }
  if (synth) {
    pickVoice();
    synth.onvoiceschanged = pickVoice;
  }

  // Speak one utterance. Returns a promise that resolves when it ends (or is cancelled).
  function speak(text, opts = {}) {
    return new Promise(resolve => {
      if (!synth || !enabled || !text) { resolve(); return; }
      if (opts.interrupt !== false) synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'en-US';
      u.rate = opts.rate || rate;
      const done = () => { document.body.classList.remove('speaking'); resolve(); };
      u.onstart = () => document.body.classList.add('speaking');
      u.onend = done;
      u.onerror = done;
      synth.speak(u);
    });
  }

  function stop() {
    if (synth) synth.cancel();
    document.body.classList.remove('speaking');
  }

  // Screen-off curtain, toggled by a button or the V key.
  function setScreenOff(off) {
    document.body.classList.toggle('screen-off', off);
    document.querySelectorAll('[data-screen-btn]').forEach(b => {
      b.textContent = off ? 'Screen on' : 'Screen off';
      b.setAttribute('aria-pressed', String(off));
    });
  }
  function toggleScreen() { setScreenOff(!document.body.classList.contains('screen-off')); }

  function bindControls() {
    document.querySelectorAll('[data-screen-btn]').forEach(b => b.addEventListener('click', toggleScreen));
    document.querySelectorAll('[data-voice-btn]').forEach(b => {
      const sync = () => {
        b.textContent = enabled ? 'Voice on' : 'Voice off';
        b.setAttribute('aria-pressed', String(enabled));
      };
      sync();
      b.addEventListener('click', () => { enabled = !enabled; if (!enabled) stop(); sync(); });
    });
    window.addEventListener('keydown', e => {
      if ((e.key === 'v' || e.key === 'V') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
        toggleScreen();
      }
    });
  }

  window.Voice = {
    speak, stop, toggleScreen, setScreenOff, bindControls,
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; if (!enabled) stop(); },
    set rate(v) { rate = v; },
  };
})();
