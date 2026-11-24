// Shared speech + screen-off helpers for the demos.
// Speech uses the browser's built-in voice so the demos speak without a screen reader.
(function () {
  const synth = window.speechSynthesis;
  let enabled = true;
  let voice = null;
  let rate = 1.0;

  // Prefer the most natural English voice the browser offers (Premium/Enhanced/Neural first).
  function pickVoice() {
    if (!synth) return;
    const en = synth.getVoices().filter(v => /^en[-_](US|GB|AU|CA)/i.test(v.lang) || /^en$/i.test(v.lang));
    const score = v => {
      const n = v.name;
      if (/premium|neural|natural/i.test(n)) return 0;
      if (/enhanced|siri/i.test(n)) return 1;
      if (/^Google US English/.test(n)) return 2;
      if (/^(Ava|Zoe|Allison|Samantha|Evan|Nathan|Tom)/.test(n)) return 3;
      if (/^Microsoft (Aria|Jenny|Guy)/.test(n)) return 3;
      return 9;
    };
    en.sort((a, b) => score(a) - score(b) || (b.lang === 'en-US') - (a.lang === 'en-US'));
    voice = en[0] || null;
  }
  if (synth) {
    pickVoice();
    synth.onvoiceschanged = pickVoice;
  }

  // Speak one utterance. Returns a promise that resolves when it ends, is cancelled, or stalls.
  // Chrome can drop an utterance queued in the same tick as cancel(), can skip the end event,
  // and stops network voices after about 15 seconds; each case is handled below.
  let epoch = 0, lastCancel = 0;
  function speak(text, opts = {}) {
    return new Promise(resolve => {
      if (!synth || !enabled || !text) { resolve(); return; }
      if (opts.interrupt !== false) { epoch++; synth.cancel(); lastCancel = performance.now(); }
      const mine = epoch;
      const u = new SpeechSynthesisUtterance(String(text));
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'en-US';
      u.rate = opts.rate || rate;
      const words = String(text).split(/\s+/).length;
      const limit = 2000 + words * 700 / u.rate;
      let settled = false, watchdog = null, keep = null;
      const done = () => {
        if (settled) return;
        settled = true; clearTimeout(watchdog); clearInterval(keep);
        document.body.classList.remove('speaking'); resolve();
      };
      speak.current = u;   // keep a reference so the browser does not drop the end event
      u.onstart = () => document.body.classList.add('speaking');
      u.onend = done;
      u.onerror = done;
      const go = () => {
        if (mine !== epoch) { done(); return; }   // stopped or replaced before it started
        synth.speak(u);
        if (synth.paused) synth.resume();
        watchdog = setTimeout(done, limit);
        if (voice && voice.localService === false) keep = setInterval(() => { if (synth.speaking) { synth.pause(); synth.resume(); } }, 10000);
      };
      const wait = 80 - (performance.now() - lastCancel);
      if (wait > 0) setTimeout(go, wait); else go();
    });
  }

  function stop() {
    epoch++;
    if (synth) synth.cancel();
    lastCancel = performance.now();
    document.body.classList.remove('speaking');
  }

  // Screen-off curtain, toggled by a button or the V key.
  function setScreenOff(off) {
    document.body.classList.toggle('screen-off', off);
  }
  function toggleScreen() { setScreenOff(!document.body.classList.contains('screen-off')); }

  // Buttons may be re-rendered (in-page step changes), so listen at the document level.
  function syncButtons() {
    const off = document.body.classList.contains('screen-off');
    document.querySelectorAll('[data-screen-btn]').forEach(b => { b.textContent = off ? 'Screen on' : 'Screen off'; b.setAttribute('aria-pressed', String(off)); });
    document.querySelectorAll('[data-voice-btn]').forEach(b => { b.textContent = enabled ? 'Voice on' : 'Voice off'; b.setAttribute('aria-pressed', String(enabled)); });
  }
  let bound = false;
  function bindControls() {
    syncButtons();
    if (bound) return;
    bound = true;
    document.addEventListener('click', e => {
      const t = e.target.closest && e.target.closest('[data-screen-btn], [data-voice-btn]');
      if (!t) return;
      if (t.hasAttribute('data-screen-btn')) toggleScreen();
      else { enabled = !enabled; if (!enabled) stop(); }
      syncButtons();
    });
    window.addEventListener('keydown', e => {
      if ((e.key === 'v' || e.key === 'V') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
        toggleScreen(); syncButtons();
      }
    });
    window.addEventListener('stepchange', syncButtons);
  }

  window.Voice = {
    speak, stop, toggleScreen, setScreenOff, bindControls,
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; if (!enabled) stop(); },
    set rate(v) { rate = v; },
  };
})();
