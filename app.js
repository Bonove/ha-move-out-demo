/* HousingAnywhere — move-out to the next trusted move-in (two-phone demo).
 *
 * Real: every tap, the drag-to-align viewfinder, the before/after slider.
 * Scripted (DEMO): anchor detection, AI comparison, payment, relisting.
 * One state object; render() redraws both phones, renderAgent() the agent bar.
 */

const $ = (s, r = document) => r.querySelector(s);
const ALEX = $('#alex'), LUCIA = $('#lucia'), AGENT = $('#agent');

/* ---------------------------------------------------------------- data */

const ROOMS = [
  { name: 'Bedroom', img: 'assets/bedroom-1.jpg', n: 4 },
  { name: 'Living room', img: 'assets/living-1.jpg', n: 3 },
  { name: 'Kitchen', img: 'assets/kitchen-1.jpg', n: 3 },
  { name: 'Bathroom', img: 'assets/bathroom-1.jpg', n: 2 },
];
const TOTAL = 12;

// Anchor points in % of the 3:4 photo; `start` is the misaligned offset in px.
const SHOTS = [
  { room: 'Bedroom', img: 'assets/bedroom-1.jpg', damage: true, start: [-38, 24],
    anchors: [[23.4, 21.4], [82.4, 19.2], [50.4, 10.9], [50.5, 57.4], [51.6, 70.3], [77.9, 79.7]] },
  { room: 'Living room', img: 'assets/living-1.jpg', start: [32, -28],
    anchors: [[62.3, 36.7], [26.6, 54.3], [81.8, 59.4], [30.2, 80], [91.7, 62.9], [21.4, 21.1]] },
];

const NODES = ['Alex', 'Tenant agent', 'Inspection report', 'Landlord agent', 'Lucia', 'Alex'];

const STEPS = [
  { id: 'notify', active: 'alex', node: 0, say: [
    ['tt', 'Move-out on 30 Sep detected. Checkout prepared: 4 rooms, 12 anchor shots from the move-in inspection of 1 Sep 2025.'],
    ['ll', 'Tenant leaves 30 Sep. Turnover planned — nothing needed from Lucia yet.'] ] },
  { id: 'checkout', active: 'alex', node: 0, say: [
    ['tt', 'Guiding Alex room by room. Every shot reuses the anchor points from move-in, so before and after match exactly.'] ] },
  { id: 'capture', active: 'alex', node: 0, busy: 'tt', say: [
    ['tt', 'Matching the live camera view to the move-in anchors…'] ] },
  { id: 'compare', active: null, node: 1, busy: 'tt', say: [
    ['tt', 'Comparing 12 before/after pairs against move-in condition, maintenance history and deposit rules…'],
    ['ll', 'Lucia is not needed on site — the inspection runs on verified evidence.'] ] },
  { id: 'report', active: 'alex', node: 2, say: [
    ['tt', '2 changes found. Scuff on wall panel = normal wear after 12 months, no charge. Stain on rug = damage: fixed cleaning rate €40.'] ] },
  { id: 'approve', active: 'lucia', node: 3, busy: 'll', say: [
    ['tt', 'Alex agrees with the report. Handing over to the landlord agent.'],
    ['ll', 'Proposal ready: €210 back to Alex, €40 cleaning, relist from 1 Oct with verified condition. The rules calculated it — Lucia decides.'] ] },
  { id: 'settle', active: null, node: 3, busy: 'll', say: [
    ['ll', 'Approved by Lucia. Releasing deposit, booking cleaning, updating the listing…'] ] },
  { id: 'live', active: null, node: 5, say: [
    ['ll', 'Listing live with “Condition verified · 30 Sep 2026”. Lucia updated.'],
    ['tt', '€210 released to Alex. Checkout closed — no chasing, no dispute.'] ] },
];
const at = (id) => STEPS.findIndex((s) => s.id === id);

/* ---------------------------------------------------------------- state */

const fresh = () => ({
  step: 0,
  shot: 0,          // current manual shot index
  captured: 0,      // photos taken (0..12)
  autoCap: false,   // manual shots done, offering auto-capture
  autoRunning: false,
  compared: 0,      // pairs compared (0..12)
  settled: 0,       // checklist items done
  disputed: false,  // Alex asked for human support on the report
  extra: [],        // agent messages added by actions within the current step
});
let state = fresh();

let timers = [];
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

function go(i) {
  i = Math.max(0, Math.min(STEPS.length - 1, i));
  clearTimers();
  const keep = { captured: i > at('capture') ? TOTAL : 0, compared: i > at('compare') ? TOTAL : 0 };
  state = { ...fresh(), ...keep, step: i };
  render();
  enter(STEPS[i].id);
}
const next = () => go(state.step + 1);
const say = (lane, text) => { state.extra.push([lane, text]); renderAgent(); };

function enter(id) {
  if (id === 'compare') {
    const tick = () => {
      state.compared++;
      render();
      if (state.compared < TOTAL) return later(330, tick);
      say('tt', '12 pairs compared. 2 changes found in the bedroom — building the inspection report.');
      later(1800, next);
    };
    later(600, tick);
  }
  if (id === 'settle') {
    const tick = () => {
      state.settled++;
      render();
      if (state.settled < SETTLE.length) return later(750, tick);
      later(900, next);
    };
    later(500, tick);
  }
}

/* ---------------------------------------------------------------- bits */

const I = {
  check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  anchor: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  agent: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>',
  euro: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9"/></svg>',
};

const photo = (src, { damage = false, zones = false } = {}) => `
  <div class="photo"><img src="${src}" alt="" draggable="false">
    ${damage ? '<div class="scuff"></div><div class="stain"></div>' : ''}
    ${zones ? '<div class="zone wear z1"><b>1</b></div><div class="zone z2"><b>2</b></div>' : ''}
  </div>`;

const bar = (title, sub = '') => `<div class="bar"><div class="s"><div class="t">${title}</div>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
const demo = '<span class="demo">DEMO</span>';

function lock(notifs) {
  return `<div class="lock">
    <div class="clock">09:41</div><div class="date">Tuesday 30 September</div>
    ${notifs}
  </div>`;
}
const notif = (title, body, { action = '', quiet = false, pulse = false } = {}) => `
  <button class="notif${quiet ? ' quiet' : ''}${pulse ? ' pulse' : ''}" ${action ? `data-action="${action}"` : 'disabled'}>
    <span class="app-ico">HA</span><div><strong>${title}</strong><span>${body}</span></div>
  </button>`;

/* ---------------------------------------------------------------- Alex */

function alexScreen() {
  const id = STEPS[state.step].id;

  if (id === 'notify') return lock(
    notif('HousingAnywhere', 'Rent for September paid. Thanks, Alex!', { quiet: true }) +
    notif('Your checkout is ready', 'Moving out today? Your agent prepared a 10-minute checkout. Tap to start.', { action: 'next', pulse: true }));

  if (id === 'checkout') return `<div class="screen">
    ${bar('Move-out checkout', 'Kralingen, Rotterdam')}
    <div class="scroll">
      <h2>Let's close your stay, fairly</h2>
      <p>Your agent reuses the anchor points from your move-in photos (1 Sep 2025), so every photo is taken from exactly the same spot.</p>
      ${ROOMS.map((r, i) => `<div class="room${i === 0 ? ' go' : ''}"><img src="${r.img}" alt="">
        <div class="grow"><h3>${r.name}</h3><small>${r.n} anchor shots</small></div>
        ${i === 0 ? '<span class="chip hot">Start here</span>' : ''}</div>`).join('')}
      <div class="card soft row"><span class="ico">${I.shield}</span>
        <div class="grow"><h3>Deposit €250</h3><small>Held safely by HousingAnywhere until the checkout is settled.</small></div></div>
    </div>
    <div class="foot"><button class="btn btn-primary pulse" data-action="next">Start with the bedroom</button></div>
  </div>`;

  if (id === 'capture') return state.autoCap ? autoScreen() : camScreen();

  if (id === 'compare') {
    const imgs = ROOMS.flatMap((r) => Array(r.n).fill(r.img));
    return `<div class="screen">
      ${bar('Checking your photos')}${demo}
      <div class="scroll">
        <h2>${state.compared < TOTAL ? 'Comparing before and after' : '2 changes found'}</h2>
        <p>Every move-out photo is laid over its move-in twin. Your agent looks for what changed — and whether it's normal wear.</p>
        <div class="grid12">${imgs.map((src, i) => `<div class="${i < state.compared ? 'done' : ''}${i === 0 && state.compared > 0 ? ' flag' : ''}" style="background-image:url(${src})"></div>`).join('')}</div>
        <div class="meter"><i style="width:${(state.compared / TOTAL) * 100}%"></i></div>
        <p style="margin-top:8px"><small>${state.compared} of ${TOTAL} pairs compared</small></p>
      </div>
    </div>`;
  }

  if (id === 'report' && state.disputed) return `<div class="screen">
    ${bar('Human support', 'Case HA-48213')}
    <div class="scroll">
      <div class="card row"><span class="ico">${I.agent}</span>
        <div class="grow"><h3>A specialist is on it</h3><small>We'll review both photo sets and get back to you within 24 hours.</small></div></div>
      <div class="card soft row"><span class="ico">${I.shield}</span>
        <div class="grow"><h3>Your €250 stays safe</h3><small>Nothing is deducted until the case is resolved.</small></div></div>
      <p>Your agent already shared the 12 photo pairs, the move-in report and the rules it applied — you don't have to explain it all again.</p>
    </div>
    <div class="foot"><button class="btn btn-outline" data-action="undispute">Back to report</button></div>
  </div>`;

  if (id === 'report') return `<div class="screen">
    ${bar('Inspection report', 'Bedroom · 30 Sep 2026')}${demo}
    <div class="scroll">
      <div class="ba" style="--pos:50%">
        ${photo('assets/bedroom-1.jpg', { damage: true, zones: true })}
        <div class="before">${photo('assets/bedroom-1.jpg', { zones: true })}</div>
        <div class="split"></div>
        <span class="lbl" style="left:8px">Move-in · 1 Sep 2025</span>
        <span class="lbl" style="right:8px">Move-out</span>
        <input type="range" min="0" max="100" value="50" data-slider aria-label="Compare before and after">
      </div>
      <small>Drag to compare. Same anchors, same angle.</small>
      <div class="card" style="margin-top:12px">
        <div class="finding"><span class="num wear">1</span><div class="grow">
          <div class="row"><h3 class="grow">Scuff on wall panel</h3><span class="chip warn">No charge</span></div>
          <small>Normal wear after 12 months.</small><div class="rule">Rule: wear &amp; tear is never deducted.</div></div></div>
        <div class="finding"><span class="num">2</span><div class="grow">
          <div class="row"><h3 class="grow">Stain on rug</h3><span class="chip hot">€40</span></div>
          <small>Not in move-in photos. Professional cleaning needed.</small><div class="rule">Rule: fixed cleaning rate, capped at actual cost.</div></div></div>
      </div>
      <div class="card">
        <div class="kv"><span>Deposit</span><b>€250</b></div>
        <div class="kv"><span>Rug cleaning</span><b>− €40</b></div>
        <div class="kv total"><span>Back to you</span><b>€210</b></div>
      </div>
    </div>
    <div class="foot">
      <button class="btn btn-primary pulse" data-action="next">Looks fair — send to Lucia</button>
      <button class="btn btn-outline" data-action="dispute">Don't agree — involve human support</button>
    </div>
  </div>`;

  if (id === 'approve' || id === 'settle') return `<div class="screen">
    ${bar('Inspection report', 'Bedroom · 30 Sep 2026')}
    <div class="scroll">
      <div class="card row"><span class="${id === 'settle' ? 'ico ok' : 'spin'}">${id === 'settle' ? I.check : ''}</span>
        <div class="grow"><h3>${id === 'settle' ? 'Lucia approved' : 'Waiting for Lucia'}</h3>
        <small>${id === 'settle' ? 'Releasing your deposit…' : 'Her agent already has the report. No need to chase anyone.'}</small></div></div>
      <div class="card">
        <div class="kv"><span>Deposit</span><b>€250</b></div>
        <div class="kv"><span>Rug cleaning</span><b>− €40</b></div>
        <div class="kv total"><span>Back to you</span><b>€210</b></div>
      </div>
      <p><small>You agreed to this report at 09:52.</small></p>
    </div>
  </div>`;

  if (id === 'live') return lock(
    notif('€210 is on its way', 'Deposit settled with Lucia. Thanks for leaving the room in good shape, Alex!', { pulse: true }));

}

function camScreen() {
  const s = SHOTS[state.shot];
  const dots = (cls) => s.anchors.map(([x, y]) => `<span class="anc ${cls}" style="left:${x}%;top:${y}%"></span>`).join('');
  return `<div class="cam">
    ${bar(`${s.room} · shot ${state.shot + 1}`, '<span style="color:#fff9">Match the dots to the move-in photo</span>')}
    <div class="vf" data-vf>
      <div class="live" style="transform:translate(${s.start[0]}px,${s.start[1]}px)">
        ${photo(s.img, { damage: s.damage })}${dots('m')}
      </div>
      <div class="ghost">${photo(s.img)}</div>
      ${dots('t')}
      <div class="hud"><span data-anchors>0/6 anchors</span><span data-align>—</span></div>
      <div class="hint" data-hint>Drag, or tap to auto-align</div>
    </div>
    <div class="camfoot">
      <div class="shots">${Array.from({ length: TOTAL }, (_, i) => `<i class="${i < state.captured ? 'on' : ''}"></i>`).join('')}</div>
      <div class="shutter" data-shutter></div>
      <small style="color:#fff9">Shutter fires automatically when all anchors match</small>
    </div>
  </div>`;
}

function autoScreen() {
  const left = TOTAL - state.captured;
  return `<div class="cam">
    ${bar('Checkout photos')}
    <div class="camfoot">
      <div class="shots">${Array.from({ length: TOTAL }, (_, i) => `<i class="${i < state.captured ? 'on' : ''}"></i>`).join('')}</div>
      <h2 style="color:#fff;text-align:center">${left ? `${state.captured} of ${TOTAL} done` : 'All 12 photos taken'}</h2>
      <p style="color:#fffa;text-align:center">${left ? `Walk through the other rooms — the remaining ${left} shots fire automatically as each view lines up.` : 'Sending them to your agent…'}</p>
      ${left && !state.autoRunning ? `<button class="btn btn-primary pulse" data-action="autocap">Auto-capture remaining ${left}</button>` : ''}
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- Lucia */

const SETTLE = [
  '€210 released to Alex',
  '€40 reserved for rug cleaning',
  'Cleaner booked · 1 Oct, 09:00',
  'Listing updated with 12 verified photos',
  'Listing live from 1 Oct',
];

function luciaScreen() {
  const id = STEPS[state.step].id;
  const listing = (badge) => `<div class="card" style="padding:0;overflow:hidden">
      <div class="hero">${photo('assets/bedroom-1.jpg')}
        ${badge ? `<span class="tag">${I.check} Condition verified · 30 Sep 2026</span><span class="chip ok live">● Live</span>` : ''}</div>
      <div style="padding:12px 14px"><h3>Bright room · Kralingen</h3>
      <small>${badge ? '€850 / month · available from 1 Oct' : 'Occupied by Alex · until 30 Sep'}</small></div></div>`;

  if (['notify', 'checkout', 'capture', 'compare', 'report'].includes(id)) {
    const status = {
      notify: ['ico ll', I.agent, 'Alex moves out today', 'Your agent handles checkout, inspection and relisting. Nothing needed from you.'],
      checkout: ['ico ll', I.agent, 'Checkout started', 'Alex is photographing the rooms from the move-in anchors.'],
      capture: ['ico ll', I.anchor, `Checkout · ${state.captured}/${TOTAL} photos`, 'Every photo is matched to its move-in twin.'],
      compare: ['spin', '', 'Inspection running', 'You don’t need to be there. The comparison runs on verified evidence.'],
      report: state.disputed
        ? ['ico ll', I.agent, 'Human review requested', 'Alex asked HousingAnywhere support to check the report. Deposit on hold — no action needed from you.']
        : ['ico ll', I.check, 'Report ready', 'Alex is reviewing it. You’ll get a proposal next.'],
    }[id];
    return `<div class="screen">
      ${bar('My listings', 'Lucia · 1 property')}
      <div class="scroll">
        ${listing(false)}
        <div class="card soft row"><span class="${status[0]}">${status[1]}</span>
          <div class="grow"><h3>${status[2]}</h3><small>${status[3]}</small></div></div>
      </div>
    </div>`;
  }

  if (id === 'approve') return `<div class="screen">
    ${bar('Move-out · Kralingen', 'Proposal from your agent')}${demo}
    <div class="scroll">
      <h2>Inspection done</h2>
      <p>12 photos matched to move-in. Alex has agreed to the report.</p>
      <div class="card">
        <div class="finding"><span class="num wear">1</span><div class="grow"><div class="row"><h3 class="grow">Scuff on wall panel</h3><span class="chip warn">Normal wear</span></div></div></div>
        <div class="finding"><span class="num">2</span><div class="grow"><div class="row"><h3 class="grow">Stain on rug</h3><span class="chip hot">€40 cleaning</span></div></div></div>
      </div>
      <div class="card">
        <div class="kv"><span>Deposit held</span><b>€250</b></div>
        <div class="kv"><span>Cleaning (to you)</span><b>€40</b></div>
        <div class="kv total"><span>Back to Alex</span><b>€210</b></div>
      </div>
      <div class="card soft row"><span class="ico ll">${I.agent}</span>
        <div class="grow"><h3>Relist from 1 Oct · €850</h3><small>With “Condition verified” and the 12 photos attached. Cleaner booked 1 Oct.</small></div></div>
      <p><small>Your agent proposed this. The deposit rules calculated it. You decide.</small></p>
    </div>
    <div class="foot"><button class="btn btn-primary pulse" data-action="next">Approve &amp; relist</button></div>
  </div>`;

  if (id === 'settle') return `<div class="screen">
    ${bar('Move-out · Kralingen', 'Approved by you · 09:58')}${demo}
    <div class="scroll">
      <h2>Your agent is on it</h2>
      <ul class="checks">${SETTLE.map((t, i) => `<li class="${i < state.settled ? 'done' : ''}"><i>${i < state.settled ? '✓' : ''}</i>${t}</li>`).join('')}</ul>
    </div>
  </div>`;

  // live
  return `<div class="screen">
    ${bar('My listings', 'Lucia · 1 property')}
    <div class="scroll">
      ${listing(true)}
      <div class="card soft row"><span class="ico ok">${I.shield}</span>
        <div class="grow"><h3>Condition report attached</h3><small>12 verified photos · inspected 30 Sep 2026. Next tenants see exactly what they get.</small></div></div>
      <div class="card soft row"><span class="ico ll">${I.euro}</span>
        <div class="grow"><h3>Deposit settled</h3><small>€40 for cleaning received. Zero days vacant.</small></div></div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- agent bar */

const typed = new Set();  // messages already typed out, keyed by text

function renderAgent() {
  const s = STEPS[state.step];
  const log = STEPS.slice(0, state.step + 1).flatMap((x) => x.say).concat(state.extra);
  const lane = (key, name, label) => {
    const msgs = log.filter(([l]) => l === key).map(([, t]) => t).slice(-2);
    return `<div class="lane ${key}"><h4><b>${label}</b>${name}${s.busy === key ? '<span class="busy">working…</span>' : ''}</h4>
      ${msgs.map((t, i) => `<div class="msg${i === msgs.length - 1 ? ' last' : ''}" data-t="${encodeURIComponent(t)}">${typed.has(t) ? t : ''}</div>`).join('')}</div>`;
  };
  AGENT.innerHTML = `
    <div class="rail">${NODES.map((n, i) => `${i ? `<span class="link${i <= s.node ? ' done' : ''}"></span>` : ''}
      <span class="node${i < s.node ? ' done' : i === s.node ? ' now' : ''}"><i>${i === 1 ? 'TT' : i === 3 ? 'LL' : i === 2 ? '✦' : n[0]}</i><span>${n}</span></span>`).join('')}</div>
    <div class="lanes">${lane('tt', 'HousingAnywhere agent · tenant', 'TT')}${lane('ll', 'HousingAnywhere agent · landlord', 'LL')}</div>`;
  AGENT.querySelectorAll('.msg').forEach((el) => {
    const t = decodeURIComponent(el.dataset.t);
    if (typed.has(t)) return;
    typed.add(t);
    type(el, t);
  });
}

function type(el, text) {
  let i = 0;
  el.classList.add('caret');
  const tick = () => {
    if (!el.isConnected) return;
    i = Math.min(text.length, i + 2);
    el.textContent = text.slice(0, i);
    if (i < text.length) setTimeout(tick, 16); else el.classList.remove('caret');
  };
  tick();
}

/* ---------------------------------------------------------------- render */

function paint(el, html, key) {
  el.classList.toggle('still', el.dataset.key === key);
  el.dataset.key = key;
  el.innerHTML = html;
}

function render() {
  const { active } = STEPS[state.step];
  const id = STEPS[state.step].id;
  paint(ALEX, alexScreen(), `${id}:${state.shot}:${state.autoCap}:${state.disputed}`);
  paint(LUCIA, luciaScreen(), `${id}:${state.disputed}`);
  for (const side of document.querySelectorAll('.side')) {
    side.classList.toggle('on', side.dataset.side === active);
    side.classList.toggle('dim', !!active && side.dataset.side !== active && !state.disputed);
  }
  renderAgent();
  const vf = $('[data-vf]', ALEX);
  if (vf) bindViewfinder(vf);
}

/* ---------------------------------------------------------------- viewfinder */

function bindViewfinder(vf) {
  const shot = SHOTS[state.shot];
  const live = $('.live', vf);
  const marks = [...live.querySelectorAll('.anc.m')];
  let [dx, dy] = shot.start;
  let drag = null, done = false;

  const scale = () => vf.getBoundingClientRect().width / vf.offsetWidth || 1;
  const update = () => {
    const dist = Math.hypot(dx, dy);
    const hits = dist < 10 ? marks.length : Math.max(0, Math.min(marks.length - 1, Math.floor((60 - dist) / 10)));
    marks.forEach((m, i) => m.classList.toggle('hit', i < hits));
    $('[data-anchors]', vf).textContent = `${hits}/${marks.length} anchors`;
    const al = $('[data-align]', vf);
    al.textContent = `${Math.max(0, Math.round(100 - dist * 1.1))}% aligned`;
    al.classList.toggle('ok', dist < 10);
    $('[data-shutter]', ALEX).classList.toggle('ready', dist < 10);
    const arrow = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '←' : '→') : (dy > 0 ? '↑' : '↓');
    $('[data-hint]', vf).textContent = dist < 10 ? 'Hold still…' : `Drag ${arrow} to line up — or just tap`;
    live.style.transform = `translate(${dx}px,${dy}px)`;
    return dist;
  };

  const shoot = () => {
    if (done) return;
    done = true;
    vf.insertAdjacentHTML('beforeend', '<div class="flash"></div>');
    state.captured++;
    say('tt', `${shot.room}: 6/6 anchors matched · 99% aligned. Captured.`);
    later(750, () => {
      if (state.shot < SHOTS.length - 1) state.shot++; else state.autoCap = true;
      render();
    });
  };
  const glide = () => {
    if (done || live.classList.contains('glide')) return;
    live.classList.add('glide');
    dx = 0; dy = 0; update();
    later(750, shoot);
  };

  vf.addEventListener('pointerdown', (e) => {
    if (done || live.classList.contains('glide')) return;
    drag = { x: e.clientX, y: e.clientY, dx, dy };
    vf.setPointerCapture(e.pointerId);
  });
  vf.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const k = scale();
    const mx = (e.clientX - drag.x) / k, my = (e.clientY - drag.y) / k;
    dx = drag.dx + mx; dy = drag.dy + my;
    update();
  });
  // Any release locks on: stage-proof, a half drag still ends aligned.
  const up = () => {
    if (!drag) return;
    drag = null;
    glide();
  };
  vf.addEventListener('pointerup', up);
  vf.addEventListener('pointercancel', up);
  update();
}

/* ---------------------------------------------------------------- events */

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'reset') { typed.clear(); go(0); }
  if (a === 'next') { el.disabled = true; next(); }  // disabled: no double-advance on double click
  if (a === 'dispute') {
    state.disputed = true;
    state.extra = [
      ['tt', 'Alex doesn’t agree. Handing the case to a human specialist with all evidence: 12 photo pairs, move-in report, rules applied.'],
      ['ll', 'Settlement paused, deposit stays on hold. Lucia informed — no action needed.'],
    ];
    render();
  }
  if (a === 'undispute') { state.disputed = false; state.extra = []; render(); }
  if (a === 'autocap') {
    const tick = () => {
      state.captured++;
      render();
      if (state.captured < TOTAL) return later(160, tick);
      say('tt', 'All 12 photos captured and verified against move-in anchors.');
      later(1100, next);
    };
    if (state.autoRunning) return;
    state.autoRunning = true;
    tick();
  }
});

document.addEventListener('input', (e) => {
  if (e.target.matches('[data-slider]')) e.target.closest('.ba').style.setProperty('--pos', `${e.target.value}%`);
});

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input')) return;
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') go(state.step - 1);
  if (e.key === 'r' || e.key === 'R') { typed.clear(); go(0); }
});

/* ---------------------------------------------------------------- fit */

// ponytail: phone scale derived from viewport height; tuned for 16:9 beamers.
function fit() {
  const stacked = innerWidth < 900;
  const free = innerHeight - $('.top').offsetHeight - AGENT.offsetHeight - 14 - 16 - 46;
  const s = stacked ? Math.min(1, (innerWidth - 32) / 414) : Math.max(0.5, Math.min(1, free / 868, (innerWidth / 2 - 60) / 414));
  for (const f of document.querySelectorAll('.fit')) {
    f.style.width = `${414 * s}px`;
    f.style.height = `${868 * s}px`;
    f.firstElementChild.style.setProperty('--s', s);
  }
}
addEventListener('resize', fit);

go(0);
fit();
