// Client for the Google Apps Script endpoint (Google Sheet as the record).
(function () {
  const EP = () => (window.QUIZ_ENDPOINT || '').trim();
  const QUEUE_KEY = 'crq-queue';

  async function getJSON(params) {
    const url = EP() + '?' + new URLSearchParams(params).toString() + '&_=' + Date.now();
    const r = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  // text/plain body keeps the request "simple", so there is no CORS preflight
  async function post(payload) {
    const r = await fetch(EP(), {
      method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function readQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return []; } }
  function writeQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {} }

  // Send now; if the network hiccups, keep it and retry later.
  async function send(payload) {
    try { await post(payload); return true; }
    catch (e) { const q = readQueue(); q.push(payload); writeQueue(q); return false; }
  }
  async function flush() {
    const q = readQueue();
    if (!q.length || !EP()) return;
    const rest = [];
    for (const p of q) { try { await post(p); } catch (e) { rest.push(p); } }
    writeQueue(rest);
  }

  window.Quiz = {
    get live() { return !!EP(); },
    state: () => getJSON({ action: 'state' }),
    results: session => getJSON({ action: 'results', session }),
    setState: (key, stage, session) => post({ type: 'state', key, stage, session }),
    send, flush,
  };
})();
