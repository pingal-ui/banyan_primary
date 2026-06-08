/* ── Per-transaction user notes ──────────────────────── */
const txNotes = {};
let _noteTxId = null;

/* ── Global nav helpers ──────────────────────────────── */
let _smOrigin = 'home'; // track which screen Pay should return to
let _currentNavTab = 0;
const _navStack = []; // history stack for back navigation
function _activeScreen() {
  const el = document.querySelector('.screen.on');
  return el ? el.id : 'home';
}
function goBack() {
  const prev = _navStack.pop();
  if (!prev || prev === 'home')     { showHome(); return; }
  if (prev === 'explore')           { showExplore(); return; }
  if (prev === 'accounts')          { showAccounts(); return; }
  if (prev === 'list')              { showList(); return; }
  showHome();
}

function setNavActive(tabIndex) {
  _currentNavTab = tabIndex;
  for (let i = 0; i < 4; i++) {
    const t = document.getElementById('bnav' + i);
    if (t) t.classList.toggle('active', i === tabIndex);
  }
}

function showNav(visible) {
  const nav = document.getElementById('globalNav');
  if (nav) nav.classList.toggle('bnav-hidden', !visible);
}

/* ══════════════════════════════════════════════════════
   HOME AGENT EXPERIENCE
══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   HOME AGENT — GENERATIVE UI SYSTEM
   All money movement requires explicit confirm.
   Data never fabricated — pulled from _AG_DATA.
═══════════════════════════════════════════════════════ */

// ── Data pulled from the Banyan DS (RECENT, SCHEDULED, account data) ──
// Recipients: wire transfers from RECENT + SCHEDULED, deduplicated
const _AG_DATA = {
  // Matches the single account shown across the app
  accounts: [
    { id: 'usd', name: 'USD Checking', num: '••3214', balance: 137978, balanceStr: '137,978.00',
      currency: 'USD', sym: '$', flag: '🇺🇸' },
  ],
  // People from RECENT + SCHEDULED wire transfers
  recipients: [
    { id: 'ms', name: 'Maya Sarini',   bank: 'HDFC Bank · →7654',
      flag: '🇮🇳', currency: 'INR', sym: '₹', initials: 'MS',
      color: 'linear-gradient(145deg,#D85090,#962858)' },
    { id: 'rr', name: 'Rohan Rathod',  bank: 'HDFC Bank · →7654',
      flag: '🇮🇳', currency: 'INR', sym: '₹', initials: 'RR',
      color: 'linear-gradient(145deg,#A050E8,#6828B8)' },
    { id: 'ak', name: 'Aamir Khan',    bank: 'HDFC Bank · →1234',
      flag: '🇮🇳', currency: 'INR', sym: '₹', initials: 'AK',
      color: 'linear-gradient(145deg,#2563eb,#1d4ed8)' },
    { id: 'sm', name: 'Sana Mirza',    bank: 'Axis Bank · →5678',
      flag: '🇮🇳', currency: 'INR', sym: '₹', initials: 'SM',
      color: 'linear-gradient(145deg,#db2777,#be185d)' },
    { id: 'dp', name: 'Dev Patel',     bank: 'ICICI Bank · →9012',
      flag: '🇮🇳', currency: 'INR', sym: '₹', initials: 'DP',
      color: 'linear-gradient(145deg,#0d9488,#0f766e)' },
    { id: 'aa', name: 'Ahmed Al-Farsi',bank: 'Wells Fargo · →5503',
      flag: '🇦🇪', currency: 'USD', sym: '$', initials: 'AA',
      color: 'linear-gradient(145deg,#E09040,#B06010)' },
    { id: 'kw', name: 'Kenji Watanabe',bank: 'Bank of America · →0047',
      flag: '🇯🇵', currency: 'USD', sym: '$', initials: 'KW',
      color: 'linear-gradient(145deg,#30A890,#187060)' },
  ],
  // Scheduled payments from SCHEDULED array
  upcoming: [
    { name: 'Rohan Rathod',  av: 'linear-gradient(145deg,#A050E8,#6828B8)', ini: 'RR',
      date: '27 Jul', amount: '$2,150.00', inr: '₹2,03,654', status: 'scheduled' },
    { name: 'Aamir Khan',    av: 'linear-gradient(145deg,#2563eb,#1d4ed8)', ini: 'AK',
      date: '28 Jul', amount: '$1,200.00', inr: '₹1,13,700', status: 'scheduled' },
    { name: 'Sana Mirza',    av: 'linear-gradient(145deg,#db2777,#be185d)', ini: 'SM',
      date: '30 Jul', amount: '$300.00',   inr: '₹28,425',   status: 'scheduled' },
    { name: 'Dev Patel',     av: 'linear-gradient(145deg,#0d9488,#0f766e)', ini: 'DP',
      date: '1 Aug',  amount: '$750.50',   inr: '₹71,072',   status: 'scheduled' },
    { name: 'Maya Sarini',   av: 'linear-gradient(145deg,#D85090,#962858)', ini: 'MS',
      date: '—',      amount: '$568.36',   inr: '₹53,878',   status: 'skipped' },
  ],
  // Spending from RECENT categories
  spending: [
    { icon: '🛒', label: 'Shopping',    amount: '$512.61', pct: 100, change: null,   dir: null },
    { icon: '✈️', label: 'Travel',      amount: '$914.75', pct: 84,  change: null,   dir: null },
    { icon: '🍕', label: 'Food',        amount: '$145.20', pct: 28,  change: null,   dir: null },
    { icon: '📺', label: 'Entertainment',amount: '$15.49', pct: 3,   change: '-12%', dir: 'down' },
  ],
  rates: {
    USD_INR: { rate: 94.72,  label: 'USD → INR', fromFlag: '🇺🇸', toFlag: '🇮🇳', change: '+0.4%', positive: true  },
    USD_EUR: { rate: 0.9372, label: 'USD → EUR', fromFlag: '🇺🇸', toFlag: '🇪🇺', change: '+0.2%', positive: true  },
    USD_GBP: { rate: 0.7915, label: 'USD → GBP', fromFlag: '🇺🇸', toFlag: '🇬🇧', change: '+0.1%', positive: true  },
    USD_AED: { rate: 3.6725, label: 'USD → AED', fromFlag: '🇺🇸', toFlag: '🇦🇪', change:  '0.0%', positive: true  },
    USD_JPY: { rate: 156.42, label: 'USD → JPY', fromFlag: '🇺🇸', toFlag: '🇯🇵', change: '-0.2%', positive: false },
  },
};

let _agResponseIdx = 0;
let _homeAgentOpen  = false;
let _homeAgentConvo = false;
let _prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Query router ────────────────────────────────────────
function _agRouteQuery(text) {
  var t = text.toLowerCase();
  // Chip phrases — exact or close matches first
  if (/due this week|what.{0,10}due|upcoming|bills?\s+(this|due)|payments? due/.test(t)) return _agScenarioUpcoming();
  if (/recent spending|show.{0,8}spend|spending|last month|dining|categor/.test(t)) return _agScenarioSpendUI();
  if (/beneficiar|recipient|who can i pay|pick.{0,8}receiv/.test(t)) return _agScenarioRecipientSelect();
  if (/bescom|electricity|utility|bill status/.test(t)) return _agScenarioBillStatus();
  // Semantic
  if (/\b(send|transfer|pay |remit|wire)\b/.test(t))    return _agScenarioTransfer(t);
  if (/\b(rate|exchange|convert|fx|corridor)\b/.test(t)) return _agScenarioRate(t);
  if (/\b(balance|how much|available|account|funds)\b/.test(t)) return _agScenarioBalance(t);
  return _agScenarioDefault();
}

function _agScenarioTransfer(t) {
  var amtMatch = t.match(/[£$€]?\s*(\d[\d,]*(?:\.\d{1,2})?)/);
  var amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 500;
  // Always from USD Checking (the only account in the app)
  var fromAccount = _AG_DATA.accounts[0];
  var fromCur = 'USD';
  // Match recipient by name against real recipients
  var recip = _AG_DATA.recipients[0]; // default Maya Sarini
  _AG_DATA.recipients.forEach(function(r) {
    if (t.indexOf(r.name.split(' ')[0].toLowerCase()) !== -1 ||
        t.indexOf(r.name.split(' ')[1].toLowerCase()) !== -1) recip = r;
  });
  var rateKey = 'USD_' + recip.currency;
  var rateInfo = _AG_DATA.rates[rateKey] || _AG_DATA.rates.USD_INR;
  var feeAmt = amount < 200 ? 2.99 : amount < 1000 ? 4.99 : 7.99;
  var convertedAmt = (amount * rateInfo.rate).toFixed(2);
  var totalDebited = (amount + feeAmt).toFixed(2);
  return {
    type: 'transfer',
    steps: [
      { id: 's1', label: 'Looking up your recipients' },
      { id: 's2', label: 'Fetching today\'s ' + fromCur + ' → ' + recip.currency + ' rate' },
      { id: 's3', label: 'Checking your USD Checking balance' },
      { id: 's4', label: 'Calculating fees and total' },
    ],
    data: { amount: amount, fromCur: fromCur, recip: recip, rateInfo: rateInfo,
            feeAmt: feeAmt, convertedAmt: convertedAmt, totalDebited: totalDebited,
            fromAccount: fromAccount },
  };
}

function _agScenarioRate(t) {
  var corridor = /gbp/.test(t) ? 'USD_GBP'
               : /eur/.test(t) ? 'USD_EUR'
               : /aed|dirham/.test(t) ? 'USD_AED'
               : /jpy|yen|japan/.test(t) ? 'USD_JPY'
               : 'USD_INR';
  var ri = _AG_DATA.rates[corridor];
  return {
    type: 'fx_rate',
    steps: [
      { id: 's1', label: 'Connecting to live market feeds' },
      { id: 's2', label: 'Pulling ' + ri.label + ' data' },
      { id: 's3', label: 'Verifying mid-market spread' },
    ],
    data: { corridor: corridor },
  };
}

function _agScenarioBalance(t) {
  return {
    type: 'balance',
    steps: [
      { id: 's1', label: 'Connecting to USD Checking' },
      { id: 's2', label: 'Fetching latest balance' },
      { id: 's3', label: 'Scanning for recent activity' },
    ],
    data: { acct: _AG_DATA.accounts[0] },
  };
}

function _agScenarioUpcoming() {
  return {
    type: 'upcoming',
    steps: [
      { id: 's1', label: 'Checking scheduled payments' },
      { id: 's2', label: 'Pulling upcoming due dates' },
    ],
    data: {},
  };
}

function _agScenarioSpendUI() {
  return {
    type: 'spending',
    steps: [
      { id: 's1', label: 'Reviewing your transactions' },
      { id: 's2', label: 'Categorising recent activity' },
      { id: 's3', label: 'Comparing month-on-month' },
    ],
    data: {},
  };
}

function _agScenarioRecipientSelect() {
  return {
    type: 'recipients',
    steps: [
      { id: 's1', label: 'Loading your saved recipients' },
      { id: 's2', label: 'Checking account details' },
    ],
    data: {},
  };
}

function _agScenarioBillStatus() {
  return {
    type: 'bill',
    steps: [
      { id: 's1', label: 'Connecting to BESCOM portal' },
      { id: 's2', label: 'Fetching your bill details' },
    ],
    data: {},
  };
}

function _agScenarioDefault() {
  var idx = _agResponseIdx % 3;
  if (idx === 0) return _agScenarioBalance('');
  if (idx === 1) return _agScenarioUpcoming();
  return _agScenarioSpendUI();
}

// Transfer also needs fromAccount.flag — derive it from currency
function _agCurrencyFlag(cur) {
  return cur === 'USD' ? '🇺🇸' : cur === 'GBP' ? '🇬🇧' : cur === 'EUR' ? '🇪🇺' : cur === 'INR' ? '🇮🇳' : cur === 'AED' ? '🇦🇪' : cur === 'JPY' ? '🇯🇵' : '';
}

// ── Step state machine ─────────────────────────────────
// steps: [{ id, label }]
// onComplete fires after collapse animation
function _agRunSteps(aiDiv, steps, msgs, onComplete) {
  var wrap = document.createElement('div');
  wrap.className = 'ag-steps-wrap';
  aiDiv.appendChild(wrap);

  var stepEls = steps.map(function(s) {
    var el = document.createElement('div');
    el.className = 'ag-step';
    el.innerHTML =
      '<div class="ag-step-icon" aria-hidden="true">' +
        '<div class="ag-step-icon-pending"></div>' +
        '<div class="ag-step-icon-active"></div>' +
        '<div class="ag-step-icon-done">' +
          '<svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">' +
            '<path d="M1 3l2 2 4-4" stroke="#46882B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</div>' +
      '</div>' +
      '<span class="ag-step-label">' + _agEscape(s.label) + '</span>';
    wrap.appendChild(el);
    return el;
  });

  var DWELL_BASE = 520;
  var DWELL_JITTER = 340;
  var idx = 0;

  function runNext() {
    if (idx >= stepEls.length) {
      _agCollapseSteps(wrap, stepEls, steps.length, msgs, onComplete);
      return;
    }
    var el = stepEls[idx];
    var delay = idx === 0 ? 80 : 40;
    setTimeout(function() {
      el.classList.add('s-in', 's-active');
      msgs.scrollTop = msgs.scrollHeight;
    }, delay);
    var dwell = DWELL_BASE + Math.floor(Math.random() * DWELL_JITTER);
    setTimeout(function() {
      el.classList.remove('s-active');
      el.classList.add('s-done');
      idx++;
      setTimeout(runNext, 60);
    }, delay + dwell);
  }
  runNext();
}

function _agCollapseSteps(wrap, stepEls, count, msgs, onComplete) {
  // Snapshot current height so the CSS transition has a from-value
  wrap.style.maxHeight = wrap.scrollHeight + 'px';
  // Brief pause so the last step's done-tick is visible, then roll up
  setTimeout(function() {
    wrap.classList.add('collapsing');
    // After collapse animation, hide completely and fire onComplete
    setTimeout(function() {
      wrap.style.display = 'none';
      onComplete();
    }, 360);
  }, 220);
}

// ── Count-up helpers ───────────────────────────────────
function _agCountUp(el, from, to, duration, fmt) {
  if (!el) return;
  if (_prefersReduced) { el.textContent = fmt ? to.toLocaleString() : to; return; }
  var start = performance.now();
  function tick(now) {
    var p = Math.min((now - start) / duration, 1);
    var e = 1 - Math.pow(1 - p, 3);
    var v = Math.round(from + (to - from) * e);
    el.textContent = fmt ? v.toLocaleString() : v;
    if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt ? to.toLocaleString() : to;
  }
  requestAnimationFrame(tick);
}
function _agCountUpDec(el, from, to, duration, decimals) {
  if (!el) return;
  decimals = decimals || 4;
  if (_prefersReduced) { el.textContent = to.toFixed(decimals); return; }
  var start = performance.now();
  function tick(now) {
    var p = Math.min((now - start) / duration, 1);
    var e = 1 - Math.pow(1 - p, 3);
    el.textContent = (from + (to - from) * e).toFixed(decimals);
    if (p < 1) requestAnimationFrame(tick); else el.textContent = to.toFixed(decimals);
  }
  requestAnimationFrame(tick);
}

// ── Stagger animate children ───────────────────────────
function _agStagger(parent, selector, baseDelay) {
  var items = parent.querySelectorAll(selector);
  items.forEach(function(el, i) {
    setTimeout(function() { el.classList.add('s-in'); }, (baseDelay || 60) + i * 55);
  });
}

// ── REPLY HELPERS ─────────────────────────────────────
// Part 1: context line (what was found/understood)
function _agAddCtx(aiDiv, text) {
  var el = document.createElement('div');
  el.className = 'ag-reply-ctx';
  el.textContent = text;
  aiDiv.appendChild(el);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { el.classList.add('s-in'); });
  });
  return el;
}
// Part 3: follow-up chips (next actions)
function _agAddFollowups(aiDiv, msgs, chips) {
  var wrap = document.createElement('div');
  wrap.className = 'ag-followup-wrap';
  chips.forEach(function(c) {
    var btn = document.createElement('button');
    btn.className = 'ag-followup-chip';
    btn.textContent = c.label;
    btn.setAttribute('data-text', c.text || c.label);
    btn.addEventListener('click', function() {
      agentSendText(btn.getAttribute('data-text'));
    });
    wrap.appendChild(btn);
  });
  aiDiv.appendChild(wrap);
  setTimeout(function() {
    requestAnimationFrame(function() {
      wrap.classList.add('s-in');
      msgs.scrollTop = msgs.scrollHeight;
    });
  }, 320);
}

// ── TRANSFER SUMMARY CARD ─────────────────────────────
function _agRenderTransfer(aiDiv, msgs, data) {
  var d = data;
  var fromSym = d.fromAccount.sym;
  var intPart = Math.floor(d.amount);
  var decStr  = '.' + d.amount.toFixed(2).split('.')[1];
  var toSym   = d.recip.sym;
  var rateStr = d.rateInfo.rate.toFixed(4);
  var fromFrom = d.fromAccount.flag;

  var card = document.createElement('div');
  card.className = 'ag-ui-card ag-transfer-card';

  var html = '<div class="ag-transfer-header">';
  html +=   '<div class="ag-transfer-flag-row">';
  html +=     '<span class="ag-transfer-flag">' + fromFrom + '</span>';
  html +=     '<span class="ag-transfer-corridor">Sending · ' + d.fromCur + ' to ' + d.recip.currency + '</span>';
  html +=   '</div>';
  html +=   '<div class="ag-transfer-amount-row">';
  html +=     '<span class="ag-transfer-currency-sym">' + fromSym + '</span>';
  html +=     '<span class="ag-transfer-amount-int" id="agTxInt">0</span>';
  html +=     '<span class="ag-transfer-amount-dec">' + decStr + '</span>';
  html +=   '</div>';
  html +=   '<div class="ag-transfer-subline">Recipient gets <strong>' + toSym + d.convertedAmt + '</strong></div>';
  html += '</div>';

  html += '<div class="ag-transfer-recipient ag-stagger-item">';
  html +=   '<div class="ag-transfer-avatar" style="background:' + d.recip.color + '" aria-hidden="true">' + d.recip.initials + '</div>';
  html +=   '<div class="ag-transfer-recip-info">';
  html +=     '<div class="ag-transfer-recip-name">' + _agEscape(d.recip.name) + ' ' + d.recip.flag + '</div>';
  html +=     '<div class="ag-transfer-recip-bank">' + _agEscape(d.recip.bank) + '</div>';
  html +=   '</div>';
  html +=   '<span class="ag-transfer-recip-change">Change</span>';
  html += '</div>';

  html += '<div class="ag-transfer-breakdown">';
  html +=   '<div class="ag-transfer-row ag-stagger-item">';
  html +=     '<span class="ag-transfer-row-label">Exchange rate</span>';
  html +=     '<span class="ag-transfer-row-value rate-badge">1 ' + d.fromCur + ' = ' + rateStr + ' ' + d.recip.currency + '</span>';
  html +=   '</div>';
  html +=   '<div class="ag-transfer-row ag-stagger-item">';
  html +=     '<span class="ag-transfer-row-label">Transfer fee</span>';
  html +=     '<span class="ag-transfer-row-value">' + fromSym + d.feeAmt.toFixed(2) + '</span>';
  html +=   '</div>';
  // Expandable details
  html +=   '<div class="ag-transfer-more-rows" id="agTxMore">';
  html +=     '<div class="ag-transfer-row"><span class="ag-transfer-row-label">Mid-market rate</span><span class="ag-transfer-row-value">1 ' + d.fromCur + ' = ' + (d.rateInfo.rate + 0.0012).toFixed(4) + ' ' + d.recip.currency + '</span></div>';
  html +=     '<div class="ag-transfer-row"><span class="ag-transfer-row-label">Banyan markup</span><span class="ag-transfer-row-value">0.45%</span></div>';
  html +=     '<div class="ag-transfer-row"><span class="ag-transfer-row-label">Estimated arrival</span><span class="ag-transfer-row-value">1 business day</span></div>';
  html +=   '</div>';
  html +=   '<div class="ag-transfer-divider"></div>';
  html +=   '<div class="ag-transfer-row total ag-stagger-item">';
  html +=     '<span class="ag-transfer-row-label">Total debited</span>';
  html +=     '<span class="ag-transfer-row-value">' + fromSym + d.totalDebited + '</span>';
  html +=   '</div>';
  html += '</div>';
  html += '<div class="ag-transfer-freshness">Rate as of just now · refreshes every 60s</div>';
  html += '<button class="ag-transfer-toggle" id="agTxToggle" type="button">Show full breakdown <span class="ag-transfer-toggle-arrow">▾</span></button>';

  card.innerHTML = html;

  // Confirm button
  var confirmWrap = document.createElement('div');
  confirmWrap.className = 'ag-stagger-item';
  confirmWrap.style.margin = '0 0 4px';
  var confirmBtn = document.createElement('button');
  confirmBtn.className = 'ag-confirm-btn';
  confirmBtn.setAttribute('type', 'button');
  confirmBtn.setAttribute('aria-label', 'Confirm and send ' + fromSym + d.amount.toFixed(2) + ' to ' + d.recip.name);
  confirmBtn.innerHTML = '<span style="font-size:17px;line-height:1" aria-hidden="true">→</span>' +
    '<span class="ag-confirm-label">Confirm · Send ' + fromSym + d.amount.toFixed(2) + '</span>' +
    '<div class="ag-confirm-spinner" aria-hidden="true"></div>';
  // Capture transfer data in closure
  (function(btn, transferData) {
    btn.addEventListener('click', function() { _agConfirmTransfer(btn, transferData, aiDiv, msgs); });
  })(confirmBtn, { amount: d.amount, fromSym: fromSym, fromCur: d.fromCur, recip: d.recip, convertedAmt: d.convertedAmt, totalDebited: d.totalDebited });
  confirmWrap.appendChild(confirmBtn);

  _agAddCtx(aiDiv, 'Ready to send — rate locked for 60 seconds. Review details below.');
  aiDiv.appendChild(card);
  aiDiv.appendChild(confirmWrap);

  // Expand toggle
  var toggleBtn = card.querySelector('#agTxToggle');
  var moreEl = card.querySelector('#agTxMore');
  if (toggleBtn && moreEl) {
    toggleBtn.addEventListener('click', function() {
      var open = moreEl.classList.toggle('open');
      toggleBtn.classList.toggle('open', open);
      var arrow = toggleBtn.querySelector('.ag-transfer-toggle-arrow');
      if (arrow) arrow.textContent = open ? '▴' : '▾';
    });
  }

  // Animate in
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      _agStagger(card, '.ag-stagger-item', 80);
      setTimeout(function() { confirmWrap.classList.add('s-in'); }, 80 + 4 * 55 + 40);
      _agCountUp(card.querySelector('#agTxInt'), 0, intPart, 650);
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
}

// ── FX RATE CARD ──────────────────────────────────────
function _agRenderFXRate(aiDiv, msgs, data) {
  var ri = _AG_DATA.rates[data.corridor];
  var fromCode = ri.label.split(' → ')[0];
  var toCode   = ri.label.split(' → ')[1];
  var changeClass = ri.positive ? 'positive' : 'negative';

  var card = document.createElement('div');
  card.className = 'ag-ui-card ag-fx-card';
  var html = '<div class="ag-fx-body">';
  html +=   '<div class="ag-fx-corridor ag-stagger-item">';
  html +=     '<span class="ag-fx-flag">' + ri.fromFlag + '</span>';
  html +=     '<span class="ag-fx-arrow">→</span>';
  html +=     '<span class="ag-fx-flag">' + ri.toFlag + '</span>';
  html +=     '<span class="ag-fx-corridor-label">' + ri.label + '</span>';
  html +=     '<span class="ag-fx-badge ag-balance-chip ' + changeClass + '">' + ri.change + '</span>';
  html +=   '</div>';
  html +=   '<div class="ag-fx-rate-row ag-stagger-item">';
  html +=     '<span class="ag-fx-rate-num" id="agFxNum">1.0000</span>';
  html +=     '<span class="ag-fx-rate-code">' + toCode + '</span>';
  html +=   '</div>';
  html +=   '<div class="ag-fx-subline ag-stagger-item">Per 1 ' + fromCode + ' · includes 0.45% Banyan markup</div>';
  html +=   '<div class="ag-fx-freshness ag-stagger-item"><div class="ag-fx-fresh-dot"></div>Live rate · updated just now</div>';
  html += '</div>';
  card.innerHTML = html;
  _agAddCtx(aiDiv, 'Live rate pulled from Banyan — includes 0.45% markup over mid-market.');
  aiDiv.appendChild(card);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      _agStagger(card, '.ag-stagger-item', 60);
      _agCountUpDec(card.querySelector('#agFxNum'), 1.0, ri.rate, 700, 4);
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
  _agAddFollowups(aiDiv, msgs, [
    { label: 'Send money', text: 'Send money' },
    { label: 'Check balance', text: 'What is my balance?' },
    { label: 'View upcoming', text: 'Show upcoming transfers' }
  ]);
}

// ── BALANCE CARD ─────────────────────────────────────
function _agRenderBalance(aiDiv, msgs, data) {
  var acct = _AG_DATA.accounts[0]; // USD Checking — the only account in the app
  var card = document.createElement('div');
  card.className = 'ag-ui-card ag-balance-card';
  var html = '<div class="ag-balance-body">';
  html += '<div class="ag-balance-label">' + _agEscape(acct.name) + ' ' + acct.flag + ' · ' + acct.num + '</div>';
  html += '<div class="ag-balance-amount-row">';
  html +=   '<span class="ag-balance-sym">' + acct.sym + '</span>';
  html +=   '<span class="ag-balance-int" id="agBalInt">0</span>';
  html +=   '<span class="ag-balance-dec">.00</span>';
  html += '</div>';
  html += '<div class="ag-balance-sub">Available balance · no pending holds</div>';
  html += '<div class="ag-balance-chips"><span class="ag-balance-chip positive">No unusual activity</span><span class="ag-balance-chip">Just updated</span></div>';
  html += '</div>';
  card.innerHTML = html;
  _agAddCtx(aiDiv, 'Live balance from your USD Checking account — no pending holds.');
  aiDiv.appendChild(card);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      _agCountUp(document.getElementById('agBalInt'), 0, acct.balance, 800, true);
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
  _agAddFollowups(aiDiv, msgs, [
    { label: 'Send money', text: 'Send money' },
    { label: 'Recent spending', text: 'Show recent spending' },
    { label: 'View upcoming', text: 'Show upcoming transfers' }
  ]);
}

// ── UPCOMING BILLS CARD ───────────────────────────────
function _agRenderUpcoming(aiDiv, msgs) {
  var items = _AG_DATA.upcoming;
  var card = document.createElement('div');
  card.className = 'ag-ui-card';
  var statusTotal = items.filter(function(i) { return i.status === 'scheduled'; }).length;
  var html = '<div class="ag-card-header ag-stagger-item">';
  html +=   'Scheduled';
  html +=   '<div class="ag-card-header-line"></div>';
  html +=   '<span class="ag-card-header-meta">' + statusTotal + ' upcoming</span>';
  html += '</div>';
  items.forEach(function(b) {
    var statusCls  = b.status === 'skipped' ? 'skipped' : 'sched';
    var statusText = b.status === 'skipped' ? 'Skipped' : 'Scheduled';
    html += '<div class="ag-upcoming-row ag-stagger-item">';
    html +=   '<div class="ag-upcoming-av" style="background:' + b.av + '">' + b.ini + '</div>';
    html +=   '<div class="ag-upcoming-info">';
    html +=     '<div class="ag-upcoming-name">' + _agEscape(b.name) + '</div>';
    html +=     '<div class="ag-upcoming-date">' + b.date + '</div>';
    html +=   '</div>';
    html +=   '<div class="ag-upcoming-right">';
    html +=     '<div class="ag-upcoming-amount">' + b.amount + '</div>';
    html +=     '<div class="ag-upcoming-status ' + statusCls + '">' + statusText + '</div>';
    html +=   '</div>';
    html += '</div>';
  });
  card.innerHTML = html;
  _agAddCtx(aiDiv, 'Found ' + items.length + ' transfers — ' + statusTotal + ' scheduled, ' + (items.length - statusTotal) + ' skipped.');
  aiDiv.appendChild(card);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      _agStagger(card, '.ag-stagger-item', 60);
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
  _agAddFollowups(aiDiv, msgs, [
    { label: 'Send money', text: 'Send money' },
    { label: 'Check balance', text: 'What is my balance?' },
    { label: 'Recent spending', text: 'Show recent spending' }
  ]);
}

// ── SPENDING BREAKDOWN CARD ───────────────────────────
var _SPEND_CAT_COLORS = {
  'Shopping':     { bg: 'rgba(70,136,43,0.12)',  dot: '#46882B' },
  'Travel':       { bg: 'rgba(56,100,200,0.12)', dot: '#3864C8' },
  'Food':         { bg: 'rgba(190,100,30,0.12)', dot: '#BE641E' },
  'Entertainment':{ bg: 'rgba(130,60,180,0.12)', dot: '#823CB4' },
};
function _agRenderSpending(aiDiv, msgs) {
  var cats = _AG_DATA.spending;
  var card = document.createElement('div');
  card.className = 'ag-ui-card';
  var html = '<div class="ag-card-header ag-stagger-item">';
  html +=   'Spending';
  html +=   '<div class="ag-card-header-line"></div>';
  html +=   '<span class="ag-card-header-meta">Last 30 days</span>';
  html += '</div>';
  html += '<div class="ag-spending-total-row ag-stagger-item">';
  html +=   '<span class="ag-spending-total-sym">$</span>';
  html +=   '<span class="ag-spending-total-num" id="agSpendTotal">0</span>';
  html +=   '<span class="ag-spending-total-label">this month</span>';
  html += '</div>';
  html += '<div class="ag-spending-cats">';
  cats.forEach(function(c, i) {
    var cc = _SPEND_CAT_COLORS[c.label] || { bg: 'rgba(0,0,0,0.07)', dot: 'rgba(0,0,0,0.4)' };
    var initials = c.label.substring(0, 2);
    html += '<div class="ag-spending-cat-row ag-stagger-item">';
    html +=   '<div class="ag-spending-cat-icon" style="background:' + cc.bg + ';border-radius:8px;color:' + cc.dot + ';font-size:10px;font-weight:700;letter-spacing:0">' + initials + '</div>';
    html +=   '<div class="ag-spending-cat-info">';
    html +=     '<div class="ag-spending-cat-label">' + c.label + '</div>';
    html +=     '<div class="ag-spending-cat-bar-wrap"><div class="ag-spending-cat-bar" data-pct="' + c.pct + '" data-color="' + cc.dot + '"></div></div>';
    html +=   '</div>';
    html +=   '<span class="ag-spending-cat-amount">' + c.amount + '</span>';
    if (c.change) {
      html += '<span class="ag-spending-cat-change ' + c.dir + '">' + c.change + '</span>';
    }
    html += '</div>';
  });
  html += '</div>';
  card.innerHTML = html;
  _agAddCtx(aiDiv, 'Here\'s your spending across all categories for the last 30 days.');
  aiDiv.appendChild(card);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      _agStagger(card, '.ag-stagger-item', 55);
      _agCountUp(card.querySelector('#agSpendTotal'), 0, 1588, 700, true);
      // Animate bars after stagger settles
      setTimeout(function() {
        card.querySelectorAll('.ag-spending-cat-bar').forEach(function(bar) {
          bar.style.width = bar.getAttribute('data-pct') + '%';
          var col = bar.getAttribute('data-color');
          if (col) bar.style.background = col;
        });
      }, 260);
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
  _agAddFollowups(aiDiv, msgs, [
    { label: 'Send money', text: 'Send money' },
    { label: 'Check balance', text: 'What is my balance?' },
    { label: 'View upcoming', text: 'Show upcoming transfers' }
  ]);
}

// ── RECIPIENT SELECTOR CARD ───────────────────────────
function _agRenderRecipientSelect(aiDiv, msgs) {
  var card = document.createElement('div');
  card.className = 'ag-ui-card';
  var html = '<div class="ag-card-header ag-stagger-item">';
  html +=   'Recipients';
  html +=   '<div class="ag-card-header-line"></div>';
  html +=   '<span class="ag-card-header-meta">Tap to pay</span>';
  html += '</div>';
  _AG_DATA.recipients.forEach(function(r) {
    html += '<div class="ag-recip-row ag-stagger-item" data-recip-id="' + r.id + '">';
    html +=   '<div class="ag-recip-av" style="background:' + r.color + '">' + r.initials + '</div>';
    html +=   '<div class="ag-recip-info">';
    html +=     '<div class="ag-recip-name">' + _agEscape(r.name) + ' ' + r.flag + '</div>';
    html +=     '<div class="ag-recip-bank">' + _agEscape(r.bank) + '</div>';
    html +=   '</div>';
    html +=   '<div class="ag-recip-arrow">›</div>';
    html += '</div>';
  });
  card.innerHTML = html;
  _agAddCtx(aiDiv, 'Here are your saved recipients — tap a name to start a transfer.');
  aiDiv.appendChild(card);

  // Wire up recipient taps → trigger transfer for that recipient
  card.querySelectorAll('.ag-recip-row').forEach(function(row) {
    row.addEventListener('click', function() {
      var rid = row.getAttribute('data-recip-id');
      var recip = _AG_DATA.recipients.find(function(r) { return r.id === rid; });
      if (!recip) return;
      // Build a transfer scenario for this recipient with default £500
      var scenario = _agScenarioTransfer('send £500 to ' + recip.name.toLowerCase());
      // Animate card out, then render transfer
      card.style.transition = 'opacity 200ms ease, transform 220ms var(--ease-out)';
      card.style.opacity = '0'; card.style.transform = 'translateY(-4px) scale(0.98)';
      setTimeout(function() {
        card.remove();
        _agRenderTransfer(aiDiv, msgs, scenario.data);
      }, 220);
    });
  });

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      _agStagger(card, '.ag-stagger-item', 55);
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
}

// ── BILL STATUS CARD — uses pending wire from RECENT ─
function _agRenderBillStatus(aiDiv, msgs) {
  // Ahmed Al-Farsi pending wire from RECENT (t3)
  var card = document.createElement('div');
  card.className = 'ag-ui-card ag-bill-card';
  var html = '<div class="ag-bill-body">';
  html += '<div class="ag-bill-header-row ag-stagger-item">';
  html +=   '<div class="ag-bill-icon" style="background:linear-gradient(145deg,#E09040,#B06010);border-radius:12px">';
  html +=     '<span style="font-size:15px;font-weight:700;color:#fff">AA</span>';
  html +=   '</div>';
  html +=   '<div>';
  html +=     '<div class="ag-bill-title">Ahmed Al-Farsi</div>';
  html +=     '<div class="ag-bill-account">Wells Fargo · →5503 · Jun 6</div>';
  html +=   '</div>';
  html += '</div>';
  html += '<div class="ag-bill-amount-row ag-stagger-item">';
  html +=   '<span class="ag-bill-sym">$</span>';
  html +=   '<span class="ag-bill-amount" id="agBillAmt">0</span>';
  html += '</div>';
  html += '<div class="ag-bill-status-row ag-stagger-item">';
  html +=   '<div class="ag-bill-status-dot due"></div>';
  html +=   '<span class="ag-bill-status-label due">Pending</span>';
  html +=   '<span class="ag-bill-due-date">· Wire transfer · Jun 6, 2026</span>';
  html += '</div>';
  html += '<button class="ag-bill-pay-btn ag-stagger-item" type="button">View transfer details</button>';
  html += '</div>';
  card.innerHTML = html;
  _agAddCtx(aiDiv, 'Found a pending wire transfer from Jun 6 — details pulled from your recent activity.');
  aiDiv.appendChild(card);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      _agStagger(card, '.ag-stagger-item', 60);
      _agCountUp(card.querySelector('#agBillAmt'), 0, 2100, 650);
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
  _agAddFollowups(aiDiv, msgs, [
    { label: 'Check balance', text: 'What is my balance?' },
    { label: 'View upcoming', text: 'Show upcoming transfers' },
    { label: 'Recent spending', text: 'Show recent spending' }
  ]);
}

// ── TEXT (typewriter) ─────────────────────────────────
function _agRenderText(aiDiv, msgs, responseText) {
  var textEl = document.createElement('div');
  textEl.className = 'ag-msg-ai-text';
  textEl.innerHTML = '<span class="ag-cursor"></span>';
  aiDiv.appendChild(textEl);
  var chars = responseText.split('');
  var i = 0;
  var cursor = textEl.querySelector('.ag-cursor');
  function typeChar() {
    if (i < chars.length) {
      cursor.insertAdjacentText('beforebegin', chars[i]);
      i++;
      msgs.scrollTop = msgs.scrollHeight;
      setTimeout(typeChar, 16 + Math.floor(Math.random() * 12));
    } else {
      cursor.style.transition = 'opacity 400ms ease';
      cursor.style.opacity = '0';
      setTimeout(function() { if (cursor.parentNode) cursor.remove(); }, 420);
    }
  }
  setTimeout(typeChar, 60);
}

// ── CONFIRM + STATUS TIMELINE + RECEIPT ───────────────
function _agConfirmTransfer(btn, transferData, aiDiv, msgs) {
  btn.classList.add('loading');
  btn.setAttribute('aria-label', 'Processing…');
  setTimeout(function() {
    var wrap = btn.parentNode;
    if (wrap) wrap.remove();
    _agRenderTimeline(aiDiv, msgs, transferData);
  }, 1600);
}

function _agRenderTimeline(aiDiv, msgs, td) {
  var refNum = 'BNY-' + (Math.floor(Math.random() * 90000) + 10000);
  var steps = [
    { label: 'Transfer submitted', sub: 'Reference ' + refNum, status: 'done' },
    { label: 'Processing', sub: 'Funds deducted from your account', status: 'active' },
    { label: 'In transit', sub: 'Usually within 2 hours', status: 'pending' },
    { label: 'Delivered to ' + td.recip.name, sub: td.recip.currency + ' ' + td.convertedAmt + ' · ' + td.recip.flag, status: 'pending' },
  ];
  var card = document.createElement('div');
  card.className = 'ag-ui-card ag-timeline-card';
  var html = '<div class="ag-timeline-body"><div class="ag-card-header" style="padding-bottom:4px">Transfer status<div class="ag-card-header-line"></div></div>';
  steps.forEach(function(s) {
    var cls = s.status === 'done' ? 'tl-done' : s.status === 'active' ? 'tl-active' : 'tl-pending';
    html += '<div class="ag-timeline-step ' + cls + '">';
    html +=   '<div class="ag-timeline-left"><div class="ag-timeline-dot"></div><div class="ag-timeline-line"></div></div>';
    html +=   '<div class="ag-timeline-content">';
    html +=     '<div class="ag-timeline-step-label">' + _agEscape(s.label) + '</div>';
    html +=     '<div class="ag-timeline-step-sub">' + _agEscape(s.sub) + '</div>';
    html +=   '</div>';
    html += '</div>';
  });
  html += '</div>';
  card.innerHTML = html;
  aiDiv.appendChild(card);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      card.querySelectorAll('.ag-timeline-step').forEach(function(el, i) {
        setTimeout(function() { el.classList.add('tl-in'); }, 80 + i * 80);
      });
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
  setTimeout(function() { _agRenderReceipt(aiDiv, msgs, td, refNum); }, 700);
}

function _agRenderReceipt(aiDiv, msgs, td, refNum) {
  var card = document.createElement('div');
  card.className = 'ag-ui-card ag-receipt-card';
  var html = '<div class="ag-receipt-body">';
  html += '<div class="ag-receipt-check" id="agReceiptCheck">';
  html +=   '<svg width="22" height="17" viewBox="0 0 22 17" fill="none" aria-hidden="true">';
  html +=     '<path d="M2 8.5l6 6L20 2" stroke="#46882B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
  html +=   '</svg>';
  html += '</div>';
  html += '<div class="ag-receipt-label">Sent</div>';
  html += '<div class="ag-receipt-amount">' + td.fromSym + td.amount.toFixed(2) + '</div>';
  html += '<div class="ag-receipt-sub">To ' + _agEscape(td.recip.name) + ' ' + td.recip.flag + '<br>Processing now</div>';
  html += '<div class="ag-receipt-ref-box">';
  html +=   '<span class="ag-receipt-ref-label">Reference</span>';
  html +=   '<span class="ag-receipt-ref-num">' + _agEscape(refNum) + '</span>';
  html += '</div>';
  html += '</div>';
  card.innerHTML = html;
  aiDiv.appendChild(card);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      setTimeout(function() {
        var check = card.querySelector('#agReceiptCheck');
        if (check) check.classList.add('ri-in');
      }, 120);
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
}

// ── Core UI functions ─────────────────────────────────
function openHomeAgent() {
  if (_homeAgentOpen) return;
  _homeAgentOpen = true;
  const screen    = document.getElementById('agent-screen');
  const inputCard = document.getElementById('agentInputCard');
  const homeAiEl  = document.querySelector('#home .home-ai');
  const nav       = document.getElementById('globalNav');

  screen.removeAttribute('aria-hidden');

  // Nav out
  if (nav) {
    nav.style.transition = 'opacity 220ms ease, transform 280ms var(--ease-spring)';
    nav.style.opacity = '0'; nav.style.transform = 'translateY(10px)'; nav.style.pointerEvents = 'none';
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduced && homeAiEl && inputCard) {
    // Compute Y delta: card starts at the home-ai bar's visual position
    const homeRect   = homeAiEl.getBoundingClientRect();
    const screenRect = screen.getBoundingClientRect();
    const cardH      = inputCard.offsetHeight || 116;
    const cardNatTop = screenRect.height - 16 - cardH; // natural top (bottom:16px)
    const startDelta = (homeRect.top - screenRect.top) - cardNatTop;

    // Pre-position card at home-ai bar (before screen becomes visible)
    inputCard.style.transition = 'none';
    inputCard.style.transform  = 'translateY(' + startDelta + 'px)';
    inputCard.style.opacity    = '1';
    void inputCard.offsetHeight;

    // Reveal agent screen INSTANTLY (no fade) — solid bg gradient prevents bleed-through
    screen.style.transition = 'none';
    screen.style.opacity    = '1';
    screen.classList.add('ag-open');
    void screen.offsetHeight;
    screen.style.transition = '';  // restore CSS transition for future use

    // Card springs to its natural resting position
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        inputCard.style.transition = 'transform 540ms var(--ease-spring), opacity 220ms var(--ease-out)';
        inputCard.style.transform  = 'translateY(0)';
        inputCard.style.opacity    = '1';
      });
    });

    // Clear inline overrides once card settles — CSS rule takes over
    setTimeout(function() {
      inputCard.style.transition = '';
      inputCard.style.transform  = '';
      inputCard.style.opacity    = '';
    }, 680);

  } else {
    screen.classList.add('ag-open');
  }

  setTimeout(function() { const f = document.getElementById('agentField'); if (f) f.focus(); }, 500);
}

function closeHomeAgent() {
  if (!_homeAgentOpen) return;
  _homeAgentOpen = false; _homeAgentConvo = false;
  const screen = document.getElementById('agent-screen');
  screen.classList.remove('ag-open', 'ag-convo');
  screen.setAttribute('aria-hidden', 'true');
  const msgs = document.getElementById('agentMsgs');
  if (msgs) msgs.innerHTML = '';
  const f = document.getElementById('agentField');
  const s = document.getElementById('agentSend');
  if (f) { f.value = ''; f.style.height = 'auto'; }
  if (s) { s.classList.remove('active'); s.setAttribute('aria-disabled', 'true'); }
  const nav = document.getElementById('globalNav');
  if (nav) {
    nav.style.transition = 'opacity 300ms var(--ease-out), transform 360ms var(--ease-spring)';
    nav.style.opacity = '1'; nav.style.transform = 'translateY(0)'; nav.style.pointerEvents = '';
  }
  _agResponseIdx = 0;
}

function agentOnInput(input) {
  input.style.height = '60px';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  const sendBtn = document.getElementById('agentSend');
  if (!sendBtn) return;
  const hasText = input.value.trim().length > 0;
  if (hasText) { sendBtn.classList.add('active'); sendBtn.removeAttribute('aria-disabled'); }
  else { sendBtn.classList.remove('active'); sendBtn.setAttribute('aria-disabled', 'true'); }
}

function agentKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); agentSend(); }
}

function agentChip(el) {
  const text = el.getAttribute('data-text');
  if (!text) return;
  const f = document.getElementById('agentField');
  if (!f) return;
  f.value = text; agentOnInput(f);
  el.style.transform = 'scale(0.94)';
  setTimeout(function() { el.style.transform = ''; agentSend(); }, 100);
}
// Send a text programmatically (follow-up chips)
function agentSendText(text) {
  const f = document.getElementById('agentField');
  if (!f) return;
  f.value = text; agentOnInput(f);
  setTimeout(agentSend, 60);
}

// ── Main send ─────────────────────────────────────────
function agentSend() {
  const f = document.getElementById('agentField');
  if (!f) return;
  const text = f.value.trim();
  if (!text) return;

  const screen = document.getElementById('agent-screen');
  const msgs   = document.getElementById('agentMsgs');
  if (!_homeAgentConvo) {
    _homeAgentConvo = true;
    screen.classList.add('ag-convo');
  }

  // Route first — no rendering yet
  const scenario = _agRouteQuery(text);

  // User bubble
  const userDiv = document.createElement('div');
  userDiv.className = 'ag-msg-user';
  userDiv.innerHTML = '<div class="ag-msg-user-bubble">' + _agEscape(text) + '</div>';
  msgs.appendChild(userDiv);
  requestAnimationFrame(function() { requestAnimationFrame(function() { userDiv.classList.add('visible'); }); });

  f.value = ''; f.style.height = 'auto';
  const sendBtn = document.getElementById('agentSend');
  if (sendBtn) { sendBtn.classList.remove('active'); sendBtn.setAttribute('aria-disabled', 'true'); }
  msgs.scrollTop = msgs.scrollHeight;

  // AI message container
  const aiDiv = document.createElement('div');
  aiDiv.className = 'ag-msg-ai';
  aiDiv.innerHTML =
    '<div class="ag-msg-ai-label" aria-hidden="true">' +
      '<div class="ag-msg-ai-dot"></div>' +
      '<span class="ag-msg-ai-name">Banyan</span>' +
    '</div>';
  msgs.appendChild(aiDiv);
  setTimeout(function() {
    requestAnimationFrame(function() { aiDiv.classList.add('visible'); });
    msgs.scrollTop = msgs.scrollHeight;
  }, 50);

  // Thinking steps → answer handoff
  setTimeout(function() {
    _agRunSteps(aiDiv, scenario.steps, msgs, function() {
      if      (scenario.type === 'transfer')   { _agRenderTransfer(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'fx_rate')   { _agRenderFXRate(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'balance')   { _agRenderBalance(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'upcoming')  { _agRenderUpcoming(aiDiv, msgs); }
      else if (scenario.type === 'spending')  { _agRenderSpending(aiDiv, msgs); }
      else if (scenario.type === 'recipients'){ _agRenderRecipientSelect(aiDiv, msgs); }
      else if (scenario.type === 'bill')      { _agRenderBillStatus(aiDiv, msgs); }
      else { _agRenderText(aiDiv, msgs, scenario.responseText); }
      _agResponseIdx++;
    });
  }, 90);

  setTimeout(function() { f.focus(); }, 130);
}

function _agEscape(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ── AI Agent ───────────────────────────────────────── */
let _agentOpen = false;

function openAgent() {
  if (_agentOpen) return;
  _agentOpen = true;
  const overlay = document.getElementById('sm-agent');
  overlay.classList.add('ai-open');
  // Softly hide nav
  const nav = document.getElementById('globalNav');
  if (nav) {
    nav.style.transition = 'opacity 250ms ease, transform 300ms var(--ease-spring)';
    nav.style.opacity = '0';
    nav.style.transform = 'translateY(12px)';
    nav.style.pointerEvents = 'none';
  }
  // Focus input after panel finishes animating in
  setTimeout(function() {
    const f = document.getElementById('aiInputField');
    if (f) f.focus();
  }, 420);
}

function closeAgent() {
  if (!_agentOpen) return;
  _agentOpen = false;
  const overlay = document.getElementById('sm-agent');
  overlay.classList.remove('ai-open');
  // Restore nav
  const nav = document.getElementById('globalNav');
  if (nav) {
    nav.style.transition = 'opacity 300ms var(--ease-out), transform 360ms var(--ease-spring)';
    nav.style.opacity = '1';
    nav.style.transform = 'translateY(0)';
    nav.style.pointerEvents = '';
  }
  // Clear input
  const f = document.getElementById('aiInputField');
  const s = document.getElementById('aiSendBtn');
  if (f) { f.value = ''; f.style.height = 'auto'; }
  if (s) s.classList.add('ai-send-empty');
  // Restore chip row
  const row = document.getElementById('aiContextRow');
  if (row) { row.style.display = ''; row.innerHTML = `
    <div class="ai-chip">
      <div class="ai-chip-avatar"><img src="assets/space-usd-checking.webp" alt="USD Checking"></div>
      <span class="ai-chip-label">USD Checking</span>
      <button class="ai-chip-close" onclick="aiRemoveChip(this)" aria-label="Remove context">
        <span class="ico ol" style="--ico:url('Icons/X.svg');--sz:10px;color:inherit"></span>
      </button>
    </div>`; }
}

function aiOnInput(input) {
  // Auto-grow
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
  // Send button state
  const sendBtn = document.getElementById('aiSendBtn');
  if (!sendBtn) return;
  const hasText = input.value.trim().length > 0;
  sendBtn.classList.toggle('ai-send-empty', !hasText);
}

function aiOnKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    aiSend();
  }
  if (e.key === 'Escape') closeAgent();
}

function aiSend() {
  const f = document.getElementById('aiInputField');
  const s = document.getElementById('aiSendBtn');
  if (!f || !f.value.trim()) return;
  // Pulse send button
  if (s) {
    s.style.transform = 'scale(0.84)';
    setTimeout(function() { s.style.transform = ''; }, 160);
  }
  f.value = ''; f.style.height = 'auto';
  if (s) s.classList.add('ai-send-empty');
}

function aiRemoveChip(btn) {
  var chip = btn.closest('.ai-chip');
  if (!chip) return;
  chip.style.transition = 'opacity 160ms ease, transform 180ms var(--ease-out)';
  chip.style.opacity = '0';
  chip.style.transform = 'scale(0.82)';
  setTimeout(function() {
    chip.remove();
    // If no chips left, hide the row to reclaim space
    var row = document.getElementById('aiContextRow');
    if (row && row.querySelectorAll('.ai-chip').length === 0) {
      row.style.display = 'none';
    }
  }, 180);
}

function aiAttach() { /* placeholder */ }
function aiCamera() { /* placeholder */ }
function aiMic()    { /* placeholder */ }

/* ── AI panel drag-to-expand ─────────────────────────── */
(function() {
  var panel, grabber, phone;
  var dragging = false;
  var startY = 0, startH = 0, curH = 0;
  var expanded = false;
  var SNAP_VELOCITY = 0.4; // fraction of max height to trigger expand

  function init() {
    panel   = document.querySelector('.ai-panel');
    grabber = document.querySelector('.ai-panel-grabber');
    phone   = document.querySelector('.phone');
    if (!grabber) return;
    grabber.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup',   onUp);
  }

  function maxH() {
    // Full panel: phone height minus status bar gap
    return phone.offsetHeight - 44;
  }

  function compactH() {
    // Natural (auto) height — measure it
    panel.style.height = '';
    return panel.offsetHeight;
  }

  function onDown(e) {
    if (!_agentOpen) return;
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    // Freeze current height so we can animate from it
    panel.style.transition = 'none';
    if (expanded) {
      startH = panel.offsetHeight;
    } else {
      startH = panel.offsetHeight;
    }
    curH = startH;
    panel.style.height = startH + 'px';
    grabber.setPointerCapture(e.pointerId);
  }

  function onMove(e) {
    if (!dragging) return;
    var dy = startY - e.clientY; // positive = drag up
    var newH = Math.max(80, Math.min(startH + dy, maxH()));
    curH = newH;
    panel.style.height = newH + 'px';
    // Adjust bottom/left/right and border-radius proportionally
    var progress = Math.max(0, Math.min(1, (newH - startH) / (maxH() - startH)));
    if (!expanded) {
      panel.style.bottom        = (8 - 8 * progress) + 'px';
      panel.style.left          = (8 - 8 * progress) + 'px';
      panel.style.right         = (8 - 8 * progress) + 'px';
      panel.style.borderRadius  = (26 - 10 * progress) + 'px ' + (26 - 10 * progress) + 'px 0 0';
    }
  }

  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = ''; // restore CSS transition

    var mid = (startH + maxH()) / 2;
    if (!expanded && curH > mid) {
      snapExpand();
    } else if (expanded && curH < mid) {
      snapCollapse();
    } else if (!expanded) {
      snapCollapse(); // bounce back
    } else {
      snapExpand();   // bounce back
    }
  }

  function snapExpand() {
    expanded = true;
    panel.style.height = maxH() + 'px';
    panel.style.bottom = '0';
    panel.style.left   = '0';
    panel.style.right  = '0';
    panel.style.borderRadius = '26px 26px 0 0';
    panel.classList.add('ai-panel-expanded');
  }

  function snapCollapse() {
    expanded = false;
    panel.classList.remove('ai-panel-expanded');
    panel.style.height       = '';
    panel.style.bottom       = '';
    panel.style.left         = '';
    panel.style.right        = '';
    panel.style.borderRadius = '';
  }

  // Reset on agent close
  var origClose = window.closeAgent;
  window.closeAgent = function() {
    expanded = false;
    if (panel) {
      panel.classList.remove('ai-panel-expanded');
      panel.style.height = panel.style.bottom = panel.style.left = panel.style.right = panel.style.borderRadius = '';
    }
    origClose();
  };

  // Init once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ── Status config ───────────────────────────────────── */
const S = {
  completed:          { label:'Completed',             badge:'b-green', hdr:'dh-green',   desc:null,                                                                           cta:'Share receipt',   ctaType:'primary', icon:'share' },
  pending:            { label:'Pending',               badge:'b-blue',  hdr:'dh-blue',    desc:'Expected to be transferred in the next 5 mins.',                              cta:'Share receipt',   ctaType:'primary', icon:'share' },
  scheduled:          { label:'Scheduled',             badge:'b-green', hdr:'dh-green',   desc:null,                                                                           cta:'Reschedule',      ctaType:'primary', icon:'calendar' },
  failed:             { label:'Failed',                badge:'b-red',   hdr:'dh-red',     desc:'Insufficient funds in your account when the payment was attempted.',           cta:'Try again',       ctaType:'primary', icon:'retry' },
  cancelled:          { label:'Cancelled',             badge:'b-grey',  hdr:'dh-neutral', desc:null,                                                                           cta:'Share receipt',   ctaType:'primary', icon:'share' },
  on_hold:            { label:'On hold',               badge:'b-amber', hdr:'dh-red',     desc:'Awaiting identity verification. Banyan needs an invoice to release this payment.', cta:'Submit document', ctaType:'primary', icon:'upload' },
  returned:           { label:'Return',                badge:'b-red',   hdr:'dh-red',     desc:'The beneficiary bank rejected this payment. Your money has been returned.',   cta:'Share receipt',   ctaType:'primary', icon:'share' },
  skipped:            { label:'Skipped',               badge:'b-grey',  hdr:'dh-neutral', desc:null,                                                                           cta:'Pay now',         ctaType:'primary', icon:'arrow' },
  rejected:           { label:'Rejected',              badge:'b-red',   hdr:'dh-red',     desc:'Payment was rejected by the receiving bank.',                                  cta:'Contact support', ctaType:'outline', icon:'support' },
  reversal_requested: { label:'Reversal requested',    badge:'b-orange',hdr:'dh-red',     desc:'The receiving bank is being contacted.',                                       cta:'Share receipt',   ctaType:'primary', icon:'share' },
  reversal_rejected:  { label:'Reversal rejected',     badge:'b-red',   hdr:'dh-red',     desc:'The receiving bank declined the reversal.',                                    cta:'Contact support', ctaType:'outline', icon:'support' },
  reversed:           { label:'Reversed',              badge:'b-grey',  hdr:'dh-neutral', desc:null, related:true,                                                             cta:'Share receipt',   ctaType:'primary', icon:'share' },
  refund:             { label:'Refund',                badge:'b-green', hdr:'dh-green',   desc:null, related:true,                                                             cta:'Share receipt',   ctaType:'primary', icon:'share' },
  dispute_submitted:  { label:'Dispute submitted',     badge:'b-amber', hdr:'dh-red',     desc:'The receiving bank is being contacted.',                                       cta:'View appeal',     ctaType:'primary', icon:'arrow' },
  dispute_rejected:   { label:'Dispute rejected',      badge:'b-red',   hdr:'dh-red',     desc:'The merchant provided proof of delivery (CR-P02). You can appeal within 14 days.', cta:'Contact support', ctaType:'outline', icon:'support' },
  dispute_review:     { label:'Dispute under review',  badge:'b-amber', hdr:'dh-red',     desc:'Your dispute is being reviewed. Expect a response by 8 Aug 2026.',              cta:'View appeal',     ctaType:'primary', icon:'arrow' },
  dispute_resolved:   { label:'Dispute resolved',      badge:'b-green', hdr:'dh-green',   desc:'Your dispute has been resolved. The amount has been credited back to your account.', related:true, cta:'Share receipt',   ctaType:'primary', icon:'share' },
};

/* ── Transaction data ────────────────────────────────── */

// date:'Jul 27' → rendered in section 1 (white card, "new")
// date:'Jul 26'+ → rendered in section 2 (gray bg, "older")
// The first 4 rows (new:true) appear in section 1; rest in section 2

const RECENT = [
  // ── NEW (section 1, white card) ───────────────────────
  { id:'t1', date:'Jun 7', new:true,
    name:'Whole Foods',     av:{ds:'shopping'},
    status:'completed',     amt:[89,43],
    method:'card',          to:'Whole Foods Market', card:'Debit card ••4242' },

  { id:'t2', date:'Jun 7', new:true,
    name:'Netflix',         av:{ds:'entertainment'},
    status:'completed',     amt:[15,49],
    method:'card',          to:'Netflix', card:'Debit card ••4242' },

  { id:'t3', date:'Jun 6', new:true,
    name:'Ahmed Al-Farsi',  av:{bg:'linear-gradient(145deg,#E09040,#B06010)',ini:'AA'},
    status:'pending',       amt:[2100,0],
    method:'wire',          to:'Ahmed Al-Farsi · →5503 (Wells Fargo)' },

  // ── OLDER (section 2, gray bg) ────────────────────────
  { id:'t4', date:'Jun 6',
    name:'Payroll',         av:{ds:'income'},
    status:'completed',     amt:[4850,0], isCredit:true,
    rowIcon:'repeat',       method:'wire', to:'USD Checking ~~3214' },

  { id:'t5', date:'Jun 6',
    name:'Amazon',          av:{ds:'shopping'},
    status:'completed',     amt:[234,18],
    method:'card',          to:'Amazon.com', card:'Debit card ••4242' },

  { id:'t6', date:'Jun 5',
    name:'Lyft',            av:{ds:'transport'},
    status:'completed',     amt:[24,75],
    method:'card',          to:'Lyft', card:'Debit card ••4242' },

  { id:'t7', date:'Jun 5',
    name:'Maya Sarini',     av:{bg:'linear-gradient(145deg,#D85090,#962858)',ini:'MS'},
    status:'completed',     amt:[568,36],
    method:'wire',          to:'Maya Sarini · →7654 (HDFC Bank)',
    inr:'− ₹53,878.21' },

  { id:'t8', date:'Jun 5',
    name:'Zara',            av:{ds:'shopping'},
    status:'failed',        amt:[189,0],
    method:'card',          to:'Zara', card:'Debit card ••4242' },

  { id:'t9', date:'Jun 4',
    name:'Carlos Mendez',   av:{bg:'linear-gradient(145deg,#4890D8,#2058A8)',ini:'CM'},
    status:'cancelled',     amt:[500,0],
    method:'wire',          to:'Carlos Mendez · →1188 (Citibank)' },

  { id:'t10', date:'Jun 4',
    name:'Delta Airlines',  av:{ds:'transport'},
    status:'on_hold',       amt:[890,0],
    method:'card',          to:'Delta Airlines', card:'Debit card ••4242' },

  { id:'t11', date:'Jun 3',
    name:'DoorDash',        av:{ds:'food'},
    status:'skipped',       amt:[145,20],
    method:'card',          to:'DoorDash', card:'Debit card ••4242' },

  { id:'t12', date:'Jun 3',
    name:'Kenji Watanabe',  av:{bg:'linear-gradient(145deg,#30A890,#187060)',ini:'KW'},
    status:'completed',     amt:[120,0],
    method:'wire',          to:'Kenji Watanabe · →0047 (Bank of America)' },
];

const SCHEDULED = [
  { id:'s1', date:'Upcoming', name:'Rohan Rathod',  av:{bg:'linear-gradient(145deg,#A050E8,#6828B8)',ini:'RR'}, status:'scheduled', amt:[2150,0],  sub:'27 July 2026',        method:'wire', to:'Rohan Rathod · →7654 (HDFC Bank)',  inr:'− ₹2,03,654.25' },
  { id:'s3', date:'Upcoming', name:'Maya Sarini',   av:{bg:'linear-gradient(145deg,#D85090,#962858)',ini:'MS'}, status:'skipped',   amt:[568,36],  sub:'Insufficient balance', method:'wire', to:'Maya Sarini · →7654 (HDFC Bank)',   inr:'− ₹53,878.21' },
  { id:'s4', date:'Upcoming', name:'Aamir Khan',    av:{bg:'linear-gradient(145deg,#2563eb,#1d4ed8)',ini:'AK'}, status:'scheduled', amt:[1200,0],  sub:'28 July 2026',        method:'wire', to:'Aamir Khan · →1234 (HDFC Bank)',    inr:'− ₹1,13,700.00' },
  { id:'s5', date:'Upcoming', name:'Sana Mirza',    av:{bg:'linear-gradient(145deg,#db2777,#be185d)',ini:'SM'}, status:'scheduled', amt:[300,0],   sub:'30 July 2026',        method:'wire', to:'Sana Mirza · →5678 (Axis Bank)',    inr:'− ₹28,425.00' },
  { id:'s6', date:'Upcoming', name:'Dev Patel',     av:{bg:'linear-gradient(145deg,#0d9488,#0f766e)',ini:'DP'}, status:'scheduled', amt:[750,50],  sub:'1 Aug 2026',          method:'wire', to:'Dev Patel · →9012 (ICICI Bank)',    inr:'− ₹71,072.38' },
];

let activeTab = 'recent';
let searchQuery = '';
let filterState = { status:'all', dateRange:'all', method:'all', space:'all' };

function applyFilters(txs) {
  return txs.filter(tx => {
    if (searchQuery && !tx.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterState.status !== 'all') {
      const main = ['completed','pending','scheduled','failed','cancelled'];
      if (filterState.status === 'others') { if (main.includes(tx.status)) return false; }
      else if (tx.status !== filterState.status) return false;
    }
    if (filterState.method !== 'all') {
      if (filterState.method === 'card'  && tx.method !== 'card') return false;
      if (filterState.method === 'wire'  && tx.method !== 'wire') return false;
      if (filterState.method === 'ach'   && tx.method !== 'ach')  return false;
    }
    if (filterState.dateRange !== 'all') {
      // Dates are Jul 21-27; map ranges against Jul 27 as "today"
      const dayMap = {'Jul 27':0,'Jul 26':1,'Jul 25':2,'Jul 24':3,'Jul 23':4,'Jul 22':5,'Jul 21':6};
      const age = dayMap[tx.date] ?? 99;
      if (filterState.dateRange === '7d'       && age > 6)  return false;
      if (filterState.dateRange === 'month'    && age > 26) return false;
      if (filterState.dateRange === 'lastmonth')             return false; // none in last month
    }
    return true;
  });
}

function isFiltering() {
  return searchQuery || filterState.status !== 'all' || filterState.method !== 'all' || filterState.dateRange !== 'all';
}

function updateFilterDot() {
  document.getElementById('filterBtnWrap').classList.toggle('has-active', !!isFiltering());
}

function updateActiveChips() {
  const dateLabels = { '7d':'Last 7 days', 'month':'This month', 'lastmonth':'Last month' };
  const methodLabels = { 'wire':'Wire', 'card':'Cards', 'ach':'ACH' };
  const chips = [];
  if (filterState.status !== 'all')    chips.push({ label: filterState.status.charAt(0).toUpperCase()+filterState.status.slice(1), key:'status' });
  if (filterState.dateRange !== 'all') chips.push({ label: dateLabels[filterState.dateRange], key:'dateRange' });
  if (filterState.method !== 'all')    chips.push({ label: methodLabels[filterState.method], key:'method' });

  function fillRow(row) {
    row.innerHTML = '';
    chips.forEach(({ label, key }) => {
      const chip = document.createElement('div');
      chip.className = 'af-chip';
      chip.innerHTML = `<span>${label}</span><button onclick="clearFilter('${key}')"><svg viewBox="0 0 10 10"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg></button>`;
      row.appendChild(chip);
    });
    row.classList.toggle('visible', chips.length > 0);
  }

  fillRow(document.getElementById('activeFiltersRow'));
  fillRow(document.getElementById('activeFiltersRowCompact'));
}

function clearFilter(key) {
  filterState[key] = 'all';
  updateFilterDot();
  updateActiveChips();
  renderList(activeTab);
}

/* ── Status config for LIST rows ─────────────────────── */
const SL = {
  completed:  { label:null,          color:null,                 icon:null,       inactive:false },
  pending:    { label:'Pending',     color:'rgba(0,0,0,0.50)',   icon:null,       inactive:false },
  scheduled:  { label:null,          color:null,                 icon:null,       inactive:false },
  failed:     { label:'Failed',      color:'#C82C2C',            icon:null,       inactive:true  },
  cancelled:  { label:'Cancelled',   color:'#C82C2C',            icon:null,       inactive:true  },
  on_hold:    { label:'On Hold',     color:'#C17C14',            icon:null,       inactive:true  },
  skipped:    { label:'Skipped',     color:'rgba(0,0,0,0.50)',   icon:'doubleup', inactive:true  },
};

/* Small SVG icons for status labels */
const STATUS_ICONS = {
  calendar: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  doubleup: `<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.898 5.27293L8.64797 7.52293C8.5423 7.6286 8.39897 7.68797 8.24953 7.68797C8.10009 7.68797 7.95677 7.6286 7.85109 7.52293C7.74542 7.41726 7.68606 7.27393 7.68606 7.12449C7.68606 6.97505 7.74542 6.83173 7.85109 6.72605L9.70312 4.87496L7.85203 3.02246C7.74636 2.91679 7.68699 2.77347 7.68699 2.62402C7.68699 2.47458 7.74636 2.33126 7.85203 2.22558C7.9577 2.11991 8.10103 2.06055 8.25047 2.06055C8.39991 2.06055 8.54323 2.11991 8.64891 2.22558L10.8989 4.47559C10.9514 4.52791 10.993 4.59009 11.0213 4.65854C11.0497 4.72699 11.0642 4.80036 11.0641 4.87445C11.064 4.94854 11.0493 5.02188 11.0208 5.09027C10.9923 5.15865 10.9505 5.22072 10.898 5.27293ZM8.27297 4.47605L6.02297 2.22605C5.97065 2.17373 5.90853 2.13222 5.84016 2.10391C5.7718 2.07559 5.69853 2.06102 5.62453 2.06102C5.55053 2.06102 5.47726 2.07559 5.4089 2.10391C5.34053 2.13222 5.27842 2.17373 5.22609 2.22605C5.17377 2.27838 5.13227 2.34049 5.10395 2.40886C5.07563 2.47722 5.06106 2.55049 5.06106 2.62449C5.06106 2.69849 5.07563 2.77176 5.10395 2.84012C5.13227 2.90849 5.17377 2.97061 5.22609 3.02293L6.51562 4.31246H6C4.6578 4.31395 3.371 4.8478 2.42192 5.79688C1.47284 6.74596 0.938989 8.03276 0.9375 9.37496C0.9375 9.52414 0.996763 9.66722 1.10225 9.77271C1.20774 9.8782 1.35082 9.93746 1.5 9.93746C1.64918 9.93746 1.79226 9.8782 1.89775 9.77271C2.00324 9.66722 2.0625 9.52414 2.0625 9.37496C2.06362 8.33101 2.47882 7.33014 3.217 6.59196C3.95518 5.85378 4.95605 5.43858 6 5.43746H6.51562L5.22563 6.72699C5.11995 6.83266 5.06059 6.97599 5.06059 7.12543C5.06059 7.27487 5.11995 7.41819 5.22563 7.52387C5.3313 7.62954 5.47462 7.6889 5.62406 7.6889C5.77351 7.68891 5.91683 7.62954 6.0225 7.52387L8.2725 5.27387C8.32497 5.22164 8.36662 5.15957 8.39505 5.09121C8.42348 5.02286 8.43813 4.94956 8.43818 4.87553C8.43822 4.80149 8.42365 4.72818 8.3953 4.65979C8.36695 4.5914 8.32538 4.52928 8.27297 4.47699V4.47605Z" fill="currentColor"/></svg>`,
  undo:     `<svg viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>`,
  flag:     `<svg viewBox="36 0 36 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M45.0175 5.86001C44.8542 6.00154 44.7235 6.17668 44.6341 6.37343C44.5448 6.57019 44.4991 6.78392 44.5 7.00001V28C44.5 28.3978 44.658 28.7794 44.9394 29.0607C45.2207 29.342 45.6022 29.5 46 29.5C46.3978 29.5 46.7794 29.342 47.0607 29.0607C47.342 28.7794 47.5 28.3978 47.5 28V22.715C50.355 20.575 52.7625 21.575 56.335 23.34C58.3638 24.34 60.6775 25.49 63.185 25.49C65.025 25.49 66.97 24.8725 68.9825 23.13C69.1445 22.9896 69.2745 22.8161 69.3638 22.6211C69.4531 22.4262 69.4995 22.2144 69.5 22V7.00001C69.5001 6.7124 69.4174 6.43084 69.262 6.18887C69.1065 5.94691 68.8848 5.75473 68.6231 5.63526C68.3615 5.51578 68.0711 5.47403 67.7864 5.51498C67.5017 5.55594 67.2348 5.67787 67.0175 5.86626C63.9288 8.54251 61.4513 7.53 57.665 5.65626C54.1488 3.90876 49.7713 1.74251 45.0175 5.86001ZM66.5 21.2825C63.645 23.4238 61.2375 22.4213 57.665 20.6575C54.77 19.22 51.2913 17.5 47.5 19.2338V7.71125C50.355 5.57125 52.7625 6.57126 56.335 8.33626C58.3638 9.33626 60.6775 10.4863 63.185 10.4863C64.3297 10.488 65.4609 10.2401 66.5 9.76V21.2825Z"/></svg>`,
  repeat:   `<svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>`,
};

/* Method badge icons — inline SVG, fill="currentColor" */
const METHOD_ICONS = {
  card: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28 6H4C3.46957 6 2.96086 6.21071 2.58579 6.58579C2.21071 6.96086 2 7.46957 2 8V24C2 24.5304 2.21071 25.0391 2.58579 25.4142C2.96086 25.7893 3.46957 26 4 26H28C28.5304 26 29.0391 25.7893 29.4142 25.4142C29.7893 25.0391 30 24.5304 30 24V8C30 7.46957 29.7893 6.96086 29.4142 6.58579C29.0391 6.21071 28.5304 6 28 6ZM17 22H15C14.7348 22 14.4804 21.8946 14.2929 21.7071C14.1054 21.5196 14 21.2652 14 21C14 20.7348 14.1054 20.4804 14.2929 20.2929C14.4804 20.1054 14.7348 20 15 20H17C17.2652 20 17.5196 20.1054 17.7071 20.2929C17.8946 20.4804 18 20.7348 18 21C18 21.2652 17.8946 21.5196 17.7071 21.7071C17.5196 21.8946 17.2652 22 17 22ZM25 22H21C20.7348 22 20.4804 21.8946 20.2929 21.7071C20.1054 21.5196 20 21.2652 20 21C20 20.7348 20.1054 20.4804 20.2929 20.2929C20.4804 20.1054 20.7348 20 21 20H25C25.2652 20 25.5196 20.1054 25.7071 20.2929C25.8946 20.4804 26 20.7348 26 21C26 21.2652 25.8946 21.5196 25.7071 21.7071C25.5196 21.8946 25.2652 22 25 22ZM4 11V8H28V11H4Z" fill="currentColor"/></svg>`,
  wire: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31 25.9999C31 26.2651 30.8946 26.5195 30.7071 26.707C30.5196 26.8945 30.2652 26.9999 30 26.9999H2C1.73478 26.9999 1.48043 26.8945 1.29289 26.707C1.10536 26.5195 1 26.2651 1 25.9999C1 25.7347 1.10536 25.4803 1.29289 25.2928C1.48043 25.1053 1.73478 24.9999 2 24.9999H30C30.2652 24.9999 30.5196 25.1053 30.7071 25.2928C30.8946 25.4803 31 25.7347 31 25.9999ZM2.0375 12.2724C1.97802 12.0627 1.9887 11.8393 2.0679 11.6362C2.1471 11.4331 2.2905 11.2615 2.47625 11.1474L15.4762 3.1474C15.6338 3.05054 15.8151 2.99927 16 2.99927C16.1849 2.99927 16.3662 3.05054 16.5238 3.1474L29.5238 11.1474C29.7096 11.2613 29.8531 11.4328 29.9324 11.6359C30.0118 11.8389 30.0226 12.0622 29.9633 12.272C29.904 12.4817 29.7778 12.6663 29.6039 12.7977C29.43 12.9291 29.218 13.0001 29 12.9999H26V20.9999H28C28.2652 20.9999 28.5196 21.1053 28.7071 21.2928C28.8946 21.4803 29 21.7347 29 21.9999C29 22.2651 28.8946 22.5195 28.7071 22.707C28.5196 22.8945 28.2652 22.9999 28 22.9999H4C3.73478 22.9999 3.48043 22.8945 3.29289 22.707C3.10536 22.5195 3 22.2651 3 21.9999C3 21.7347 3.10536 21.4803 3.29289 21.2928C3.48043 21.1053 3.73478 20.9999 4 20.9999H6V12.9999H3C2.78224 13 2.5704 12.929 2.39668 12.7977C2.22295 12.6663 2.09684 12.4819 2.0375 12.2724ZM18 19.9999C18 20.2651 18.1054 20.5195 18.2929 20.707C18.4804 20.8945 18.7348 20.9999 19 20.9999C19.2652 20.9999 19.5196 20.8945 19.7071 20.707C19.8946 20.5195 20 20.2651 20 19.9999V13.9999C20 13.7347 19.8946 13.4803 19.7071 13.2928C19.5196 13.1053 19.2652 12.9999 19 12.9999C18.7348 12.9999 18.4804 13.1053 18.2929 13.2928C18.1054 13.4803 18 13.7347 18 13.9999V19.9999ZM12 19.9999C12 20.2651 12.1054 20.5195 12.2929 20.707C12.4804 20.8945 12.7348 20.9999 13 20.9999C13.2652 20.9999 13.5196 20.8945 13.7071 20.707C13.8946 20.5195 14 20.2651 14 19.9999V13.9999C14 13.7347 13.8946 13.4803 13.7071 13.2928C13.5196 13.1053 13.2652 12.9999 13 12.9999C12.7348 12.9999 12.4804 13.1053 12.2929 13.2928C12.1054 13.4803 12 13.7347 12 13.9999V19.9999Z" fill="currentColor"/></svg>`,
  ach:  `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31 25.9999C31 26.2651 30.8946 26.5195 30.7071 26.707C30.5196 26.8945 30.2652 26.9999 30 26.9999H2C1.73478 26.9999 1.48043 26.8945 1.29289 26.707C1.10536 26.5195 1 26.2651 1 25.9999C1 25.7347 1.10536 25.4803 1.29289 25.2928C1.48043 25.1053 1.73478 24.9999 2 24.9999H30C30.2652 24.9999 30.5196 25.1053 30.7071 25.2928C30.8946 25.4803 31 25.7347 31 25.9999ZM2.0375 12.2724C1.97802 12.0627 1.9887 11.8393 2.0679 11.6362C2.1471 11.4331 2.2905 11.2615 2.47625 11.1474L15.4762 3.1474C15.6338 3.05054 15.8151 2.99927 16 2.99927C16.1849 2.99927 16.3662 3.05054 16.5238 3.1474L29.5238 11.1474C29.7096 11.2613 29.8531 11.4328 29.9324 11.6359C30.0118 11.8389 30.0226 12.0622 29.9633 12.272C29.904 12.4817 29.7778 12.6663 29.6039 12.7977C29.43 12.9291 29.218 13.0001 29 12.9999H26V20.9999H28C28.2652 20.9999 28.5196 21.1053 28.7071 21.2928C28.8946 21.4803 29 21.7347 29 21.9999C29 22.2651 28.8946 22.5195 28.7071 22.707C28.5196 22.8945 28.2652 22.9999 28 22.9999H4C3.73478 22.9999 3.48043 22.8945 3.29289 22.707C3.10536 22.5195 3 22.2651 3 21.9999C3 21.7347 3.10536 21.4803 3.29289 21.2928C3.48043 21.1053 3.73478 20.9999 4 20.9999H6V12.9999H3C2.78224 13 2.5704 12.929 2.39668 12.7977C2.22295 12.6663 2.09684 12.4819 2.0375 12.2724ZM18 19.9999C18 20.2651 18.1054 20.5195 18.2929 20.707C18.4804 20.8945 18.7348 20.9999 19 20.9999C19.2652 20.9999 19.5196 20.8945 19.7071 20.707C19.8946 20.5195 20 20.2651 20 19.9999V13.9999C20 13.7347 19.8946 13.4803 19.7071 13.2928C19.5196 13.1053 19.2652 12.9999 19 12.9999C18.7348 12.9999 18.4804 13.1053 18.2929 13.2928C18.1054 13.4803 18 13.7347 18 13.9999V19.9999ZM12 19.9999C12 20.2651 12.1054 20.5195 12.2929 20.707C12.4804 20.8945 12.7348 20.9999 13 20.9999C13.2652 20.9999 13.5196 20.8945 13.7071 20.707C13.8946 20.5195 14 20.2651 14 19.9999V13.9999C14 13.7347 13.8946 13.4803 13.7071 13.2928C13.5196 13.1053 13.2652 12.9999 13 12.9999C12.7348 12.9999 12.4804 13.1053 12.2929 13.2928C12.1054 13.4803 12 13.7347 12 13.9999V19.9999Z" fill="currentColor"/></svg>`,
};

/* ── Render app-icon avatar ─────────────────────────── */
function makeAvatar(av, method) {
  // Container: holds av-wrap + badge as siblings (badge must not be masked)
  const container = document.createElement('div');
  container.className = 'av-container';

  const wrap = document.createElement('div');
  wrap.className = 'av-wrap';
  const inner = document.createElement('div');
  if (av.ds) {
    inner.className = 'av-inner';
    inner.style.background = 'rgba(255,255,255,0.92)';
    const img = document.createElement('img');
    img.src = DS_ICONS[av.ds];
    img.style.cssText = 'width:calc(100% - 8px);height:calc(100% - 8px);object-fit:contain;pointer-events:none;';
    inner.appendChild(img);
  } else if (av.ini) {
    // Person-to-person: DS person icon in avatar space, white bg
    inner.className = 'av-inner';
    inner.style.background = 'rgba(255,255,255,0.92)';
    const img = document.createElement('img');
    img.src = DS_ICONS.person;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;';
    inner.appendChild(img);
  } else if (av.brand) {
    inner.className = 'av-inner';
    inner.style.background = av.bg || '#F5F5F5';
    inner.style.fontSize = '20px';
    inner.textContent = av.icon;
  } else {
    inner.className = 'av-inner';
    inner.style.background = av.bg;
  }
  wrap.appendChild(inner);
  container.appendChild(wrap);

  // Method badge — sibling of av-wrap so it isn't clipped by the mask
  const badge = document.createElement('div');
  badge.className = 'av-badge';
  badge.innerHTML = METHOD_ICONS[method] || METHOD_ICONS.wire;
  container.appendChild(badge);

  return container;
}

/* ── Build a single transaction row element ─────────── */
function buildRow(tx) {
  const slCfg = SL[tx.status] || SL.completed;
  const row = document.createElement('div');
  row.className = 'tx-row' + (slCfg.inactive ? ' inactive' : '');
  row.onclick = () => openDetail(tx);

  // Avatar
  row.appendChild(makeAvatar(tx.av, tx.method));

  // Middle
  const mid = document.createElement('div');
  mid.className = 'tx-mid';

  // Name row
  const nameRow = document.createElement('div');
  nameRow.className = 'tx-name-row';

  const nameEl = document.createElement('span');
  nameEl.className = 'tx-name';
  nameEl.textContent = tx.name;
  nameRow.appendChild(nameEl);

  // Inline icon AFTER name (calendar or repeat)
  if (tx.rowIcon === 'calendar' || tx.rowIcon === 'repeat') {
    const ico = document.createElementNS('http://www.w3.org/2000/svg','svg');
    ico.setAttribute('viewBox','0 0 24 24');
    ico.setAttribute('class','tx-name-icon');
    ico.style.marginLeft = '4px'; ico.style.flexShrink = '0';
    if (tx.rowIcon === 'calendar') {
      ico.innerHTML = '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>';
    } else {
      ico.innerHTML = '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>';
    }
    nameRow.appendChild(ico);
  }

  mid.appendChild(nameRow);

  // Status label — 2nd line, Caption/S
  if (slCfg.label) {
    const lbl = document.createElement('div');
    lbl.className = 'tx-status-lbl';
    lbl.style.color = slCfg.color;
    if (slCfg.icon && STATUS_ICONS[slCfg.icon]) {
      const iconSpan = document.createElement('span');
      iconSpan.style.cssText = 'display:flex;align-items:center;';
      const svgStr = STATUS_ICONS[slCfg.icon].replace('<svg',
        '<svg style="width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"');
      iconSpan.innerHTML = svgStr;
      if (slCfg.icon === 'doubleup' || slCfg.icon === 'flag') {
        const s = iconSpan.querySelector('svg');
        if (s) { s.style.fill = 'currentColor'; s.style.stroke = 'none'; }
      }
      lbl.appendChild(iconSpan);
    }
    lbl.appendChild(document.createTextNode(slCfg.label));
    mid.appendChild(lbl);
  }
  row.appendChild(mid);

  // Right: amount + optional INR
  const right = document.createElement('div');
  right.className = 'tx-right';
  const amtEl = document.createElement('div');
  const sign = tx.isCredit ? '+' : '−';
  amtEl.className = 'tx-amount' + (tx.isCredit ? ' credit' : '');
  amtEl.textContent = sign + '$' + tx.amt[0].toLocaleString('en-US') + '.' + String(tx.amt[1]).padStart(2,'0');
  right.appendChild(amtEl);
  if (tx.inr) {
    const inrEl = document.createElement('div');
    inrEl.className = 'tx-inr';
    inrEl.textContent = tx.inr;
    right.appendChild(inrEl);
  }
  row.appendChild(right);
  return row;
}

/* ── Row separator ──────────────────────────────────── */
function rowSep(margin='0 16px') {
  const d = document.createElement('div');
  d.style.cssText = `height:0.5px;background:rgba(0,0,0,0.06);margin:${margin};flex-shrink:0;`;
  return d;
}

/* ── Date group header element ──────────────────────── */
function dateHeader(label) {
  const d = document.createElement('div');
  d.className = 'date-header';
  d.innerHTML = `${label}<div class="date-header-line"></div>`;
  return d;
}

/* ── Render list (two-section layout) ───────────────── */
function renderList(tab) {
  const rawData = tab === 'recent' ? RECENT : SCHEDULED;
  const data = tab === 'recent' ? applyFilters(rawData) : rawData;
  const list = document.getElementById('txList');
  list.innerHTML = '';

  // Flat layout when filters/search are active
  if (tab === 'recent' && isFiltering()) {
    if (data.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'tx-empty';
      empty.textContent = 'No transactions match.';
      list.appendChild(empty);
    } else {
      const sec = document.createElement('div');
      sec.className = 'list-sec-old';
      const byDate = groupByDate(data);
      for (const [date, rows] of byDate) {
        sec.appendChild(dateHeader(date));
        rows.forEach((tx, i) => {
          sec.appendChild(buildRow(tx));
          if (i < rows.length - 1) sec.appendChild(rowSep('0 16px'));
        });
      }
      list.appendChild(sec);
    }
    return;
  }

  if (tab === 'recent') {
    // ── SECTION 1: white card (new transactions) ────────
    const sec1 = document.createElement('div');
    sec1.className = 'list-sec-new';

    const sec1Inner = document.createElement('div');
    sec1Inner.className = 'list-sec-new-inner';

    // "N new transactions" bar — plain row INSIDE the white card
    const newCount = data.filter(t => t.new).length;
    const newBar = document.createElement('div');
    newBar.className = 'new-tx-bar';
    newBar.innerHTML = `
      <span class="new-tx-bar-text">${newCount} new transactions</span>
      <span class="ico ol" style="--ico:url('Icons/ArrowDown.svg');--sz:12px;color:var(--brand-primary);flex-shrink:0"></span>
      <div class="new-tx-bar-line"></div>`;
    sec1Inner.appendChild(newBar);

    // Group new transactions by date
    const newTxns = data.filter(t => t.new);
    const newByDate = groupByDate(newTxns);
    for (const [date, rows] of newByDate) {
      sec1Inner.appendChild(dateHeader(date));
      rows.forEach((tx, i) => {
        sec1Inner.appendChild(buildRow(tx));
        if (i < rows.length - 1) sec1Inner.appendChild(rowSep());
      });
    }
    sec1.appendChild(sec1Inner);
    list.appendChild(sec1);

    // ── SECTION BREAK ───────────────────────────────────
    const brk = document.createElement('div');
    brk.className = 'list-sec-break';
    list.appendChild(brk);

    // ── SECTION 2: older transactions ────────────
    const sec2 = document.createElement('div');
    sec2.className = 'list-sec-old';

    const oldTxns = data.filter(t => !t.new);
    const oldByDate = groupByDate(oldTxns);
    for (const [date, rows] of oldByDate) {
      sec2.appendChild(dateHeader(date));
      rows.forEach((tx, i) => {
        sec2.appendChild(buildRow(tx));
        if (i < rows.length - 1) sec2.appendChild(rowSep('0 16px'));
      });
    }
    list.appendChild(sec2);

  } else {
    // SCHEDULED tab — single section, no chip
    const sec = document.createElement('div');
    sec.className = 'list-sec-old';
    const byDate = groupByDate(data);
    for (const [date, rows] of byDate) {
      sec.appendChild(dateHeader(date));
      rows.forEach((tx, i) => {
        sec.appendChild(buildRow(tx));
        if (i < rows.length - 1) sec.appendChild(rowSep());
      });
    }
    list.appendChild(sec);
  }
}

/* ── Group array by tx.date, preserving order ──────── */
function groupByDate(arr) {
  const map = new Map();
  arr.forEach(tx => {
    if (!map.has(tx.date)) map.set(tx.date, []);
    map.get(tx.date).push(tx);
  });
  return map;
}

/* ── Build related-transaction row (reuses buildRow) ─── */
function buildRelatedRow(tx) {
  // Prefer a real linked tx in RECENT (journey provisional credit / refund)
  let relTx = RECENT.find(t => t.id === tx.id + '_pc' || t.id === tx.id + '_ref');

  if (!relTx) {
    // Construct synthetic tx from the static relatedAmt/relatedName/relatedBadge fields
    const amtStr = (tx.relatedAmt || '0').replace(/[^0-9.]/g, '');
    const [intPart = '0', decPart = '00'] = amtStr.split('.');
    const badgeToStatus = {
      'Refund': 'refund', 'Return': 'refund', 'Provisional': 'completed',
      'Settled': 'dispute_resolved', 'Resolved': 'dispute_resolved',
    };
    relTx = {
      id: tx.id + '_rel',
      name: tx.relatedName || tx.name,
      av: tx.av,
      status: badgeToStatus[tx.relatedBadge] || 'refund',
      amt: [parseInt(intPart.replace(/,/g, '')) || 0, parseInt(decPart) || 0],
      isCredit: true,
      method: tx.method,
    };
  }

  return buildRow(relTx);
}

/* badge text colors matching DS tokens */
const BADGE_COLOR = {
  'b-red':'#C82C2C', 'b-blue':'#1A5CC8', 'b-green':'#46882B',
  'b-amber':'#C17C14', 'b-grey':'#888888', 'b-orange':'#B04800'
};

/* ── Open detail ─────────────────────────────────────── */
function openDetail(tx) {
  const cfg = S[tx.status] || S.completed;

  // Sheet gradient via data attribute
  document.getElementById('detailSheet').dataset.hdr = cfg.hdr;

  // Avatar — 80px rounded-2xl container, white/80 inner
  const avEl = document.getElementById('dAv');
  if (tx.av.ds) {
    avEl.className = 'd-av-inner';
    avEl.style.background = 'rgba(255,255,255,0.92)';
    avEl.style.color = '';
    avEl.style.fontWeight = '';
    avEl.innerHTML = `<img src="${DS_ICONS[tx.av.ds]}" style="width:80%;height:80%;object-fit:contain;pointer-events:none;">`;
  } else if (tx.av.ini) {
    // Person-to-person: DS person icon on white bg
    avEl.className = 'd-av-inner';
    avEl.style.background = 'rgba(255,255,255,0.92)';
    avEl.style.color = '';
    avEl.style.fontWeight = '';
    avEl.innerHTML = `<img src="${DS_ICONS.person}" style="width:80%;height:80%;object-fit:contain;pointer-events:none;">`;
  } else if (tx.av.brand) {
    avEl.className = 'd-av-inner';
    avEl.style.background = tx.av.bg || '#F5F5F5';
    avEl.style.color = '';
    avEl.style.fontWeight = '';
    avEl.textContent = tx.av.icon;
  } else {
    avEl.className = 'd-av-inner';
    avEl.style.background = tx.av.bg;
    avEl.style.color = '';
    avEl.style.fontWeight = '';
  }

  // Name — 20px Medium, black/60
  document.getElementById('dName').textContent = tx.name;

  // Amount — $ 24px + 48px + 24px bold
  document.getElementById('dInt').textContent = tx.amt[0].toLocaleString('en-US');
  document.getElementById('dDec').textContent = '.' + String(tx.amt[1]).padStart(2,'0');

  // Badge — plain uppercase colored text (no pill)
  const badge = document.getElementById('dBadge');
  if (cfg.label) {
    badge.textContent = cfg.label.toUpperCase();
    badge.style.color = BADGE_COLOR[cfg.badge] || '#888';
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }

  // Separator + description
  const desc = document.getElementById('dDesc');
  const sep  = document.getElementById('dSep');
  if (cfg.desc) {
    desc.innerHTML = cfg.desc;
    desc.style.display = '';
    sep.style.display = '';
  } else {
    desc.style.display = 'none';
    sep.style.display = 'none';
  }

  // ── Related / Linked transaction card(s) ─────────────
  const relEl = document.getElementById('dRelated');
  relEl.innerHTML = '';

  // Look up any journey-generated child transactions in RECENT
  const pcTx     = RECENT.find(t => t.id === tx.id + '_pc');
  const ccTx     = RECENT.find(t => t.id === tx.id + '_cc');
  const refundTx = RECENT.find(t => t.id === tx.id + '_refund');

  if (tx.status === 'dispute_submitted' && pcTx) {
    // Dispute submitted: show provisional credit as linked transaction
    const card = document.createElement('div');
    card.className = 'detail-card related-card';
    const lbl = document.createElement('p');
    lbl.className = 'related-label';
    lbl.textContent = 'Linked transaction';
    card.appendChild(lbl);
    card.appendChild(buildRow(pcTx));
    relEl.appendChild(card);
  } else if (tx.status === 'dispute_rejected' && (pcTx || ccTx)) {
    // Show both provisional credit + credit clawback as linked transactions
    const card = document.createElement('div');
    card.className = 'detail-card related-card';
    const lbl = document.createElement('p');
    lbl.className = 'related-label';
    lbl.textContent = 'Linked transactions';
    card.appendChild(lbl);
    const items = [pcTx, ccTx].filter(Boolean);
    items.forEach((linkedTx, i) => {
      card.appendChild(buildRow(linkedTx));
      if (i < items.length - 1) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height:1px;background:rgba(0,0,0,0.06);margin:0 16px';
        card.appendChild(sep);
      }
    });
    relEl.appendChild(card);
  } else if (tx.status === 'returned' && refundTx) {
    // Bene bank rejected — money returned to sender
    const card = document.createElement('div');
    card.className = 'detail-card related-card';
    const lbl = document.createElement('p');
    lbl.className = 'related-label';
    lbl.textContent = 'Linked transaction';
    card.appendChild(lbl);
    card.appendChild(buildRow(refundTx));
    relEl.appendChild(card);
  } else if (tx.status === 'dispute_resolved' && (pcTx || refundTx)) {
    // Card: provisional credit becomes permanent. ACH: a new refund is issued.
    const isCardTx = tx.method === 'card';
    const linkedTx = isCardTx ? (pcTx || refundTx) : (refundTx || pcTx);
    const card = document.createElement('div');
    card.className = 'detail-card related-card';
    const lbl = document.createElement('p');
    lbl.className = 'related-label';
    lbl.textContent = 'Linked transaction';
    card.appendChild(lbl);
    card.appendChild(buildRow(linkedTx));
    relEl.appendChild(card);
  } else if (tx.status === 'reversed' && refundTx) {
    // Reversal completed: show the refund credit as linked transaction
    const card = document.createElement('div');
    card.className = 'detail-card related-card';
    const lbl = document.createElement('p');
    lbl.className = 'related-label';
    lbl.textContent = 'Linked transaction';
    card.appendChild(lbl);
    card.appendChild(buildRow(refundTx));
    relEl.appendChild(card);
  } else if (tx.relatedAmt) {
    // Legacy fallback: static related transaction from tx data fields
    const card = document.createElement('div');
    card.className = 'detail-card related-card';
    const lbl = document.createElement('p');
    lbl.className = 'related-label';
    lbl.textContent = 'Linked transaction';
    card.appendChild(lbl);
    card.appendChild(buildRelatedRow(tx));
    relEl.appendChild(card);
  }

  // If this IS a child/refund tx, show its original parent transaction
  if (tx.linkedParent) {
    const parentTx = RECENT.find(t => t.id === tx.linkedParent);
    if (parentTx) {
      const card = document.createElement('div');
      card.className = 'detail-card related-card';
      const lbl = document.createElement('p');
      lbl.className = 'related-label';
      lbl.textContent = 'Original transaction';
      card.appendChild(lbl);
      card.appendChild(buildRow(parentTx));
      relEl.appendChild(card);
    }
  }

  // ── Field cards ──────────────────────────────────────
  // Card 1: To / From / INR / Date / Fee / Method/Payment method
  // Card 2: Transaction ID / Purpose / Note
  const group1 = [], group2 = [];

  // ── Provisional credit: special To/From layout ──
  if (tx.isProvisionalCredit) {
    group1.push({ label:'To',   value: tx.pcTo });
    group1.push({ label:'From', value: tx.pcFrom });
    const dl = 'Completed on';
    group1.push({ label: dl, value:'27 July 2026 • 2:45 pm' });
  } else {

  // Person-to-person = av.ini; businesses have brand/icon avatars
  const isPerson = !!(tx.av && tx.av.ini);

  // For businesses, strip the card detail from "To" — show name only
  if (tx.to) {
    const toName = tx.to.includes(' · ') ? tx.to.split(' · ')[0] : tx.to;
    group1.push({ label:'To', value: toName });
  }

  const cardIconSvg = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>';

  if (tx.method === 'wire' || tx.method === 'ach') {
    group1.push({ label:'From', value:'USD Checking ••3214' });
    if (tx.inr) group1.push({ label: tx.name.split(' ')[0] + ' received', value: tx.inr + '<span class="sub">$1 = ₹95.95</span>' });
    const dl = tx.status === 'completed' ? 'Completed on' : tx.status === 'scheduled' ? 'Scheduled for' : 'Created on';
    group1.push({ label: dl, value:'27 July 2026 • 2:45 pm' });
    if (!['cancelled','failed','skipped'].includes(tx.status)) group1.push({ label:"Banyan's Fee", value:'$2.50' });
    const methodLabel = tx.method === 'ach' ? 'ACH transfer' : 'Outgoing domestic wire';
    group1.push({ label:'Method', value: methodLabel });
  } else {
    // Card — always show which card was used in "From"
    const cardDetail = tx.card || (tx.to && tx.to.includes(' · ') ? tx.to.split(' · ')[1] : 'Debit card ••4242');
    group1.push({ label:'From', value:'<span class="f-icon-val">' + cardIconSvg + ' ' + cardDetail + '</span>' });
    if (tx.inr) group1.push({ label: tx.name.split(' ')[0] + ' received', value: tx.inr + '<span class="sub">$1 = ₹95.95</span>' });
    const dl = tx.status === 'completed' ? 'Completed on' : 'Created on';
    group1.push({ label: dl, value:'27 July 2026 • 2:45 pm' });
    group1.push({ label:'Payment method', value:'<span class="f-icon-val">' + cardIconSvg + ' Debit card</span>' });
  }

  } // end else (non-provisional-credit)

  group2.push({ label:'Transaction ID', value:'#0976543456787', mono:true });
  if (tx.inr) {
    group2.push({ label:'Purpose', value:'Travel' });
  }
  const isCard = tx.method === 'card' && !tx.isProvisionalCredit;
  if (isCard) {
    // Card: Note row is a live "Add note" link, or shows saved text
    group2.push({ label:'Note', noteLink:true, txId:tx.id });
  } else {
    group2.push({ label:'Note', value:'Some random reason that can be multiple lines', wrap:true });
  }

  function makeCard(fields) {
    const card = document.createElement('div');
    card.className = 'detail-card fields-card';
    const rows = document.createElement('div');
    rows.className = 'field-rows';
    fields.forEach(f => {
      const row = document.createElement('div');
      row.className = 'field-row';
      const lbl = document.createElement('p');
      lbl.className = 'f-label';
      lbl.textContent = f.label;
      if (f.noteLink) {
        // Render as an inline "Add note" link (or saved note text)
        const saved = txNotes[f.txId];
        const noteEl = document.createElement(saved ? 'p' : 'button');
        if (saved) {
          noteEl.className = 'f-value';
          noteEl.style.cssText = 'max-width:220px;word-break:break-word;text-align:right;cursor:pointer;color:rgba(0,0,0,0.80)';
          noteEl.textContent = saved;
          noteEl.addEventListener('click', () => openNoteSheet(f.txId));
        } else {
          noteEl.className = 'f-value';
          noteEl.style.cssText = 'background:none;border:none;padding:0;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;color:var(--green);text-align:right';
          noteEl.textContent = 'Add note';
          noteEl.addEventListener('click', () => openNoteSheet(f.txId));
        }
        row.appendChild(lbl);
        row.appendChild(noteEl);
      } else {
        const val = document.createElement('p');
        val.className = 'f-value' + (f.mono ? ' mono' : '');
        val.innerHTML = f.value;
        row.appendChild(lbl);
        row.appendChild(val);
      }
      rows.appendChild(row);
    });
    card.appendChild(rows);
    return card;
  }

  document.getElementById('dFields1').innerHTML = '';
  document.getElementById('dFields2').innerHTML = '';
  document.getElementById('dAddNote').innerHTML = '';
  document.getElementById('dFields1').appendChild(makeCard(group1));
  document.getElementById('dFields2').appendChild(makeCard(group2));

  // Action bar — build per-status icon-button + label items
  const actionsEl = document.getElementById('dActions');
  actionsEl.innerHTML = '';
  closeMoreMenu();
  const allActions = (getJourneyActions(tx) || SA[tx.status] || SA.completed)
    .filter(a => !a.condition || a.condition(tx));
  const MAX_VISIBLE = 4;
  const visible  = allActions.length <= MAX_VISIBLE ? allActions : allActions.slice(0, 3);
  const overflow = allActions.length <= MAX_VISIBLE ? []         : allActions.slice(3);
  visible.forEach(a => renderActionItem(a, actionsEl, tx));
  if (overflow.length) {
    const item = document.createElement('div');
    item.className = 'action-item';
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.innerHTML = ACTION_ICONS.more;
    btn.addEventListener('click', () => openMoreMenu(overflow, tx));
    const lbl = document.createElement('span');
    lbl.className = 'action-label';
    lbl.textContent = 'More';
    item.appendChild(btn); item.appendChild(lbl);
    actionsEl.appendChild(item);
  }

  // Open
  document.getElementById('sheetScroll').scrollTop = 0;
  document.getElementById('detail').classList.add('open');
  const _bb = document.querySelector('.list-bottom-bar');
  if (_bb) { _bb.style.opacity = '0'; _bb.style.pointerEvents = 'none'; }
}

/* ── Per-status action sets ──────────────────────────── */
// Rules: Share is always present and always primary.
//        Dispute/Appeal are always destructive (red).
//        Max 4 visible — extras go into the "More" overflow popup.
//        condition(tx) — if present, action is hidden when it returns false.
const SA = {
  // Wire → Reverse; Card → Dispute; Credit income → Share only
  completed: [
    { icon:'share',   label:'Share',   pri:true,  fnKey:'share' },
    { icon:'reverse', label:'Reverse', pri:false, fnKey:'reverse',  condition: tx => tx.method === 'ach' && !tx.isCredit },
    { icon:'dispute', label:'Dispute', pri:false, fnKey:'dispute',  condition: tx => tx.method === 'card' && !tx.isCredit, destructive:true },
  ],
  // In transit — can cancel before clearing
  pending: [
    { icon:'share',  label:'Share',  pri:true,  fnKey:'share' },
    { icon:'cancel', label:'Cancel', pri:false, fnKey:'cancel' },
  ],
  // Future payment — reschedule date, skip one cycle, or cancel entirely
  scheduled: [
    { icon:'share',      label:'Share',      pri:true,  fnKey:'share' },
    { icon:'reschedule', label:'Reschedule', pri:false, fnKey:'reschedule' },
    { icon:'skip',       label:'Skip',       pri:false, fnKey:'skip' },
    { icon:'cancel',     label:'Cancel',     pri:false, fnKey:'cancel' },
  ],
  // Bounced — retry with same details or escalate
  failed: [
    { icon:'share',   label:'Share',     pri:true,  fnKey:'share' },
    { icon:'retry',   label:'Try again', pri:false, fnKey:'retry' },
    { icon:'support', label:'Support',   pri:false, fnKey:'support' },
  ],
  // Already voided — receipt only
  cancelled: [
    { icon:'share', label:'Share', pri:true, fnKey:'share' },
  ],
  // Compliance hold — provide doc to unblock
  on_hold: [
    { icon:'share',   label:'Share',      pri:true,  fnKey:'share' },
    { icon:'upload',  label:'Submit doc', pri:false, fnKey:'upload' },
    { icon:'support', label:'Support',    pri:false, fnKey:'support' },
  ],
  // Beneficiary bank returned the funds — retry or get help
  returned: [
    { icon:'share',   label:'Share',     pri:true,  fnKey:'share' },
    { icon:'retry',   label:'Retry',     pri:false, fnKey:'retry',   condition: tx => tx.method === 'wire' || tx.method === 'ach' },
    { icon:'support', label:'Support',   pri:false, fnKey:'support' },
  ],
  // Skipped occurrence — pay immediately or contact support
  skipped: [
    { icon:'share',   label:'Share',   pri:true,  fnKey:'share' },
    { icon:'pay',     label:'Pay now', pri:false, fnKey:'pay_now' },
    { icon:'support', label:'Support', pri:false, fnKey:'support' },
  ],
  // Receiving bank declined — support only
  rejected: [
    { icon:'share',   label:'Share',   pri:true,  fnKey:'share' },
    { icon:'support', label:'Support', pri:false, fnKey:'support' },
  ],
  // Reversal in flight — waiting on beneficiary bank
  reversal_requested: [
    { icon:'share',   label:'Share',   pri:true,  fnKey:'share' },
    { icon:'support', label:'Support', pri:false, fnKey:'support' },
  ],
  // Beneficiary bank declined reversal — can escalate via support
  reversal_rejected: [
    { icon:'share',   label:'Share',   pri:true,  fnKey:'share' },
    { icon:'support', label:'Support', pri:false, fnKey:'support' },
  ],
  // Terminal: money returned to sender
  reversed: [
    { icon:'share', label:'Share', pri:true, fnKey:'share' },
  ],
  // Incoming credit — nothing to do
  refund: [
    { icon:'share', label:'Share', pri:true, fnKey:'share' },
  ],
  // Dispute filed — waiting on bank; support if urgent
  dispute_submitted: [
    { icon:'share',   label:'Share',   pri:true,  fnKey:'share' },
    { icon:'support', label:'Support', pri:false, fnKey:'support' },
  ],
  // Dispute denied — appeal or escalate
  dispute_rejected: [
    { icon:'share',   label:'Share',  pri:true,  fnKey:'share' },
    { icon:'dispute', label:'Appeal', pri:false, fnKey:'dispute', destructive:true },
    { icon:'support', label:'Support',pri:false, fnKey:'support' },
  ],
  // Under review — waiting; support if urgent
  dispute_review: [
    { icon:'share',   label:'Share',   pri:true,  fnKey:'share' },
    { icon:'support', label:'Support', pri:false, fnKey:'support' },
  ],
  // Terminal: dispute won, credited back
  dispute_resolved: [
    { icon:'share', label:'Share', pri:true, fnKey:'share' },
  ],
};

/* ── Render a single action item into a container ────── */
function renderActionItem(a, container, tx) {
  const item = document.createElement('div');
  item.className = 'action-item';
  const btn = document.createElement('button');
  btn.className = 'action-btn' + (a.pri ? ' pri' : '') + (a.destructive ? ' destructive' : '');
  btn.innerHTML = ACTION_ICONS[a.icon] || '';
  const handler = a.fn || getActionHandler(a.fnKey, tx);
  if (handler) btn.addEventListener('click', handler);
  const lbl = document.createElement('span');
  lbl.className = 'action-label' + (a.pri ? ' pri' : '') + (a.destructive ? ' destructive' : '');
  lbl.textContent = a.label;
  item.appendChild(btn);
  item.appendChild(lbl);
  container.appendChild(item);
}

/* ── More overflow popup ─────────────────────────────── */
function openMoreMenu(overflowActions, tx) {
  const menu     = document.getElementById('moreMenu');
  const backdrop = document.getElementById('moreMenuBackdrop');
  menu.innerHTML = '';
  overflowActions.forEach(a => {
    const item = document.createElement('div');
    item.className = 'more-menu-item';
    const iconWrap = document.createElement('div');
    iconWrap.className = 'more-menu-icon' + (a.destructive ? ' destructive' : '');
    iconWrap.innerHTML = ACTION_ICONS[a.icon] || '';
    const lbl = document.createElement('span');
    lbl.className = 'more-menu-lbl' + (a.destructive ? ' destructive' : '');
    lbl.textContent = a.label;
    item.appendChild(iconWrap);
    item.appendChild(lbl);
    const mHandler = a.fn || getActionHandler(a.fnKey, tx);
    if (mHandler) item.addEventListener('click', () => { closeMoreMenu(); mHandler(); });
    menu.appendChild(item);
  });
  menu.classList.add('open');
  backdrop.classList.add('open');
}
function closeMoreMenu() {
  const menu     = document.getElementById('moreMenu');
  const backdrop = document.getElementById('moreMenuBackdrop');
  if (menu)     menu.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

/* ── Action handler map ───────────────────────────────── */
function getActionHandler(fnKey, tx) {
  const map = {
    share:      () => handleShare(tx),
    reverse:    () => openReversalForm(tx),
    dispute:    () => openDisputeForm(tx),
    cancel:     () => handleCancel(tx),
    retry:      () => handleRetry(tx),
    pay_now:    () => handlePayNow(tx),
    skip:       () => handleSkip(tx),
    reschedule: () => handleReschedule(tx),
    upload:     () => handleUpload(tx),
    support:    () => handleSupport(tx),
  };
  return map[fnKey] || null;
}

/* ── Toast ────────────────────────────────────────────── */
let _toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toastNotif');
  document.getElementById('toastText').textContent = msg;
  el.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── Generic action confirm overlay ──────────────────── */
let _aoConfirmFn = null;
/* ── Add Note sheet ───────────────────────────────────── */
function _syncNoteOverlay() {
  const phone = document.querySelector('.phone');
  const ov = document.getElementById('noteSheetOverlay');
  if (!ov.classList.contains('open')) return;
  ov.style.top = phone.scrollTop + 'px';
  ov.style.height = phone.clientHeight + 'px';
}
function openNoteSheet(txId) {
  _noteTxId = txId;
  const ta = document.getElementById('noteTextarea');
  ta.value = txNotes[txId] || '';
  const phone = document.querySelector('.phone');
  const ov = document.getElementById('noteSheetOverlay');
  ov.style.top = phone.scrollTop + 'px';
  ov.style.height = phone.clientHeight + 'px';
  ov.classList.add('open');
  // Keep overlay aligned if phone scrolls (e.g. browser scrolls on focus)
  phone.addEventListener('scroll', _syncNoteOverlay);
  requestAnimationFrame(() => ta.focus({ preventScroll: true }));
}
function closeNoteSheet() {
  const phone = document.querySelector('.phone');
  phone.removeEventListener('scroll', _syncNoteOverlay);
  document.getElementById('noteSheetOverlay').classList.remove('open');
  _noteTxId = null;
}
function saveNote() {
  const note = document.getElementById('noteTextarea').value.trim();
  if (_noteTxId !== null) {
    if (note) txNotes[_noteTxId] = note;
    else delete txNotes[_noteTxId];
    // Re-render the detail to refresh the Note field row
    const tx = [...RECENT, ...SCHEDULED].find(t => t.id === _noteTxId);
    closeNoteSheet();
    if (tx) openDetail(tx);
  } else {
    closeNoteSheet();
  }
}

function openActionOverlay(tx, title, subtitle, bodyFn, confirmLabel, confirmFn) {
  _aoConfirmFn = () => confirmFn(tx);
  document.getElementById('aoTitle').textContent = title;
  const sub = document.getElementById('aoSubtitle');
  if (subtitle) { sub.textContent = subtitle; sub.style.display = ''; }
  else { sub.style.display = 'none'; }
  const body = document.getElementById('aoBody');
  body.innerHTML = '';
  if (bodyFn) bodyFn(body, tx);
  document.getElementById('aoConfirmBtn').textContent = confirmLabel || 'Confirm';
  document.getElementById('actionOverlay').classList.add('open');
}
function closeActionOverlay() {
  document.getElementById('actionOverlay').classList.remove('open');
  _aoConfirmFn = null;
}
function submitActionOverlay() {
  if (_aoConfirmFn) _aoConfirmFn();
  closeActionOverlay();
}

/* Helper — renders a non-tappable transaction row inside an overlay */
function overlayTxRow(body, tx) {
  const wrap = document.createElement('div');
  wrap.className = 'dispute-tx-row-wrap';
  const row = buildRow(tx);
  row.style.cursor = 'default';
  wrap.appendChild(row);
  body.appendChild(wrap);
}

/* ── Share Sheet (iOS-style) ─────────────────────────── */
const SHARE_APPS = [
  { label:'AirDrop',  bg:'linear-gradient(145deg,#00C2FF,#0066FF)', icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/></svg>`, cls:'white-icon' },
  { label:'Messages', bg:'#34C759', icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`, cls:'white-icon' },
  { label:'Mail',     bg:'linear-gradient(145deg,#1C8EFF,#005BDB)', icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`, cls:'white-icon' },
  { label:'WhatsApp', bg:'#25D366', icon:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01s-.52.07-.79.37c-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35m-5.42 7.4h-.004a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37A9.86 9.86 0 012 11.89C2 6.44 6.44 2 11.89 2a9.87 9.87 0 016.99 2.9 9.83 9.83 0 012.89 6.99c-.003 5.45-4.44 9.89-9.89 9.89m8.41-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.69 1.45h.005c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 00-3.48-8.41z"/></svg>`, cls:'white-icon' },
  { label:'Telegram', bg:'linear-gradient(145deg,#37BBFE,#007DBB)', icon:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.89 8.24l-2.02 9.52c-.15.66-.54.82-1.09.51l-3-2.21-1.45 1.39c-.16.16-.3.29-.61.29l.22-3.08 5.63-5.08c.24-.22-.06-.34-.38-.12L6.44 14.4l-2.96-.93c-.64-.2-.65-.64.14-.95l11.55-4.45c.54-.19 1.01.13.72.17z"/></svg>`, cls:'white-icon' },
  { label:'Copy',     bg:'#636366', icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`, cls:'white-icon' },
  { label:'More',     bg:'#E5E5EA', icon:`<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/></svg>`, cls:'dark-icon' },
];

function openShareSheet(tx) {
  const preview = document.getElementById('sharePreview');
  const meta = S[tx.status] || S.completed;
  const sign = tx.isCredit ? '+' : '-';
  const amtStr = `${sign}$${tx.amt[0].toLocaleString('en-US')}.${String(tx.amt[1]).padStart(2,'0')}`;
  const iconUrl = (tx.av && tx.av.ds && DS_ICONS[tx.av.ds]) || DS_ICONS.person;
  preview.innerHTML = `
    <div class="share-preview-icon"><img src="${iconUrl}" alt=""></div>
    <div class="share-preview-info">
      <div class="share-preview-name">${tx.name}</div>
      <div class="share-preview-sub">${meta.label} · ${tx.date}</div>
    </div>
    <div class="share-preview-amount">${amtStr}</div>
  `;
  const row = document.getElementById('shareAppsRow');
  row.innerHTML = '';
  SHARE_APPS.forEach(app => {
    const el = document.createElement('div');
    el.className = 'share-app';
    el.innerHTML = `
      <div class="share-app-icon-wrap ${app.cls}" style="background:${app.bg}">${app.icon}</div>
      <span class="share-app-label">${app.label}</span>
    `;
    el.addEventListener('click', () => { closeShareSheet(); showToast(`Shared via ${app.label}`); });
    row.appendChild(el);
  });
  document.getElementById('shareOverlay').classList.add('open');
}

function closeShareSheet() {
  document.getElementById('shareOverlay').classList.remove('open');
}

function shareAction(type) {
  closeShareSheet();
  const msgs = { copy:'Receipt copied to clipboard', pdf:'Saved as PDF', print:'Sent to printer' };
  showToast(msgs[type] || 'Shared');
}

function handleShare(tx) { openShareSheet(tx); }

/* ── Cancel ───────────────────────────────────────────── */
function handleCancel(tx) {
  const subtitle = tx.status === 'pending'
    ? 'This payment is in transit. Cancellation is not guaranteed if already processing.'
    : 'This scheduled payment will be cancelled and will not be retried automatically.';
  openActionOverlay(tx,
    'Cancel payment', subtitle,
    (body, t) => overlayTxRow(body, t),
    'Cancel payment',
    t => {
      t.status = 'cancelled';
      closeDetail(); renderList(activeTab);
      setTimeout(() => openDetail(t), 80);
    }
  );
}

/* ── Skip one occurrence ──────────────────────────────── */
function handleSkip(tx) {
  const dateStr = tx.sub ? ` on ${tx.sub}` : '';
  openActionOverlay(tx,
    'Skip this payment',
    `The payment to ${tx.name}${dateStr} will be skipped. The schedule continues from the next cycle.`,
    (body, t) => overlayTxRow(body, t),
    'Skip payment',
    t => {
      t.status = 'skipped';
      closeDetail(); renderList(activeTab);
      setTimeout(() => openDetail(t), 80);
    }
  );
}

/* ── Retry / Pay now (→ pending → completed) ─────────── */
function handleRetry(tx) { _autoPay(tx); }
function handlePayNow(tx) { _autoPay(tx); }
function _autoPay(tx) {
  tx.status = 'pending';
  closeDetail(); renderList(activeTab);
  setTimeout(() => {
    openDetail(tx);
    setTimeout(() => {
      tx.status = 'completed';
      closeDetail(); renderList(activeTab);
      setTimeout(() => openDetail(tx), 80);
    }, 1600);
  }, 80);
}

/* ── Reschedule ───────────────────────────────────────── */
function handleReschedule(tx) {
  const DATES = ['Aug 3, 2026', 'Aug 10, 2026', 'Aug 17, 2026', 'Sep 1, 2026'];
  let picked = null;
  openActionOverlay(tx,
    'Reschedule payment',
    `Choose a new date for the payment to ${tx.name}.`,
    (body, t) => {
      overlayTxRow(body, t);
      const lbl = document.createElement('div');
      lbl.className = 'bds-field-label';
      lbl.style.cssText = 'margin-top:16px';
      lbl.textContent = 'New payment date';
      body.appendChild(lbl);
      const list = document.createElement('div');
      list.className = 'bds-radio-list';
      DATES.forEach(d => {
        const row = document.createElement('div');
        row.className = 'bds-radio-row';
        row.innerHTML = `<div class="bds-radio-btn"></div><span class="bds-radio-lbl">${d}</span>`;
        row.addEventListener('click', () => {
          picked = d;
          list.querySelectorAll('.bds-radio-row').forEach(r => r.classList.remove('sel'));
          row.classList.add('sel');
        });
        list.appendChild(row);
      });
      body.appendChild(list);
    },
    'Reschedule',
    t => {
      if (picked) t.sub = picked;
      closeDetail(); renderList(activeTab);
      setTimeout(() => openDetail(t), 80);
    }
  );
}

/* ── Submit doc (on_hold → completed) ────────────────── */
function handleUpload(tx) {
  const DOC_TYPES = [
    { id:'invoice',  label:'Invoice' },
    { id:'receipt',  label:'Receipt / Proof of purchase' },
    { id:'contract', label:'Contract or agreement' },
    { id:'id',       label:'Government-issued ID' },
  ];
  openActionOverlay(tx,
    'Submit document',
    'Provide the document Banyan needs to verify and release this payment.',
    (body, t) => {
      overlayTxRow(body, t);
      const lbl = document.createElement('div');
      lbl.className = 'bds-field-label';
      lbl.style.cssText = 'margin-top:16px';
      lbl.textContent = 'Document type';
      body.appendChild(lbl);
      const list = document.createElement('div');
      list.className = 'bds-radio-list';
      DOC_TYPES.forEach(d => {
        const row = document.createElement('div');
        row.className = 'bds-radio-row';
        row.innerHTML = `<div class="bds-radio-btn"></div><span class="bds-radio-lbl">${d.label}</span>`;
        row.addEventListener('click', () => {
          list.querySelectorAll('.bds-radio-row').forEach(r => r.classList.remove('sel'));
          row.classList.add('sel');
        });
        list.appendChild(row);
      });
      body.appendChild(list);
      const ta = document.createElement('div');
      ta.className = 'bds-input-wrap';
      ta.style.cssText = 'margin-top:12px';
      ta.innerHTML = `<textarea class="bds-textarea" placeholder="Additional notes (optional)"></textarea>`;
      body.appendChild(ta);
    },
    'Submit document',
    t => {
      t.status = 'completed';
      t.sub = 'Hold released · Document verified';
      closeDetail(); renderList(activeTab);
      setTimeout(() => openDetail(t), 80);
    }
  );
}

/* ── Support ──────────────────────────────────────────── */
function handleSupport(tx) {
  const REASONS = [
    { id:'question',     label:'I have a question about this transaction' },
    { id:'unrecognised', label:'I don\'t recognise this transaction' },
    { id:'amount',       label:'The amount looks incorrect' },
    { id:'other',        label:'Something else' },
  ];
  openActionOverlay(tx,
    'Contact support',
    'A Banyan agent will reach out within 2 hours.',
    (body) => {
      const wrap = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.className = 'bds-field-label';
      lbl.textContent = 'What do you need help with?';
      wrap.appendChild(lbl);
      const list = document.createElement('div');
      list.className = 'bds-radio-list';
      REASONS.forEach(r => {
        const row = document.createElement('div');
        row.className = 'bds-radio-row';
        row.innerHTML = `<div class="bds-radio-btn"></div><span class="bds-radio-lbl">${r.label}</span>`;
        row.addEventListener('click', () => {
          list.querySelectorAll('.bds-radio-row').forEach(ri => ri.classList.remove('sel'));
          row.classList.add('sel');
        });
        list.appendChild(row);
      });
      wrap.appendChild(list);
      body.appendChild(wrap);
    },
    'Submit',
    () => showToast('Support ticket created — we\'ll be in touch soon')
  );
}

/* ── Action icon SVGs — Phosphor Icons (256×256 fill) ── */
const ACTION_ICONS = {
  share:      `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M237.66,106.35l-80-80A8,8,0,0,0,144,32V72.35c-25.94,2.22-54.59,14.92-78.16,34.91-28.38,24.08-46.05,55.11-49.76,87.37a12,12,0,0,0,20.68,9.58h0c11-11.71,50.14-48.74,107.24-52V192a8,8,0,0,0,13.66,5.65l80-80A8,8,0,0,0,237.66,106.35ZM160,172.69V144a8,8,0,0,0-8-8c-28.08,0-55.43,7.33-81.29,21.8a196.17,196.17,0,0,0-36.57,26.52c5.8-23.84,20.42-46.51,42.05-64.86C99.41,99.77,127.75,88,152,88a8,8,0,0,0,8-8V51.32L220.69,112Z"/></svg>`,
  reverse:    `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L44.59,96H72a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8V56a8,8,0,0,1,16,0V85.8L60.25,60A96,96,0,0,1,224,128Z"/></svg>`,
  dispute:    `<svg viewBox="36 0 36 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M45.0175 5.86001C44.8542 6.00154 44.7235 6.17668 44.6341 6.37343C44.5448 6.57019 44.4991 6.78392 44.5 7.00001V28C44.5 28.3978 44.658 28.7794 44.9394 29.0607C45.2207 29.342 45.6022 29.5 46 29.5C46.3978 29.5 46.7794 29.342 47.0607 29.0607C47.342 28.7794 47.5 28.3978 47.5 28V22.715C50.355 20.575 52.7625 21.575 56.335 23.34C58.3638 24.34 60.6775 25.49 63.185 25.49C65.025 25.49 66.97 24.8725 68.9825 23.13C69.1445 22.9896 69.2745 22.8161 69.3638 22.6211C69.4531 22.4262 69.4995 22.2144 69.5 22V7.00001C69.5001 6.7124 69.4174 6.43084 69.262 6.18887C69.1065 5.94691 68.8848 5.75473 68.6231 5.63526C68.3615 5.51578 68.0711 5.47403 67.7864 5.51498C67.5017 5.55594 67.2348 5.67787 67.0175 5.86626C63.9288 8.54251 61.4513 7.53 57.665 5.65626C54.1488 3.90876 49.7713 1.74251 45.0175 5.86001ZM66.5 21.2825C63.645 23.4238 61.2375 22.4213 57.665 20.6575C54.77 19.22 51.2913 17.5 47.5 19.2338V7.71125C50.355 5.57125 52.7625 6.57126 56.335 8.33626C58.3638 9.33626 60.6775 10.4863 63.185 10.4863C64.3297 10.488 65.4609 10.2401 66.5 9.76V21.2825Z"/></svg>`,
  cancel:     `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>`,
  reschedule: `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z"/></svg>`,
  skip:       `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M141.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L124.69,128,50.34,53.66A8,8,0,0,1,61.66,42.34l80,80A8,8,0,0,1,141.66,133.66Zm80-11.32-80-80a8,8,0,0,0-11.32,11.32L204.69,128l-74.35,74.34a8,8,0,0,0,11.32,11.32l80-80A8,8,0,0,0,221.66,122.34Z"/></svg>`,
  retry:      `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M240,56v48a8,8,0,0,1-8,8H184a8,8,0,0,1,0-16H211.4L184.81,71.64l-.25-.24a80,80,0,1,0-1.67,114.78a8,8,0,0,1,11,11.63A95.44,95.44,0,0,1,128,224h-1.32A96,96,0,1,1,195.75,60L224,85.8V56a8,8,0,1,1,16,0Z"/></svg>`,
  support:    `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M201.89,54.66A103.43,103.43,0,0,0,128.79,24H128A104,104,0,0,0,24,128v56a24,24,0,0,0,24,24H64a24,24,0,0,0,24-24V144a24,24,0,0,0-24-24H40.36A88.12,88.12,0,0,1,190.54,65.93,87.39,87.39,0,0,1,215.65,120H192a24,24,0,0,0-24,24v40a24,24,0,0,0,24,24h24a24,24,0,0,1-24,24H136a8,8,0,0,0,0,16h56a40,40,0,0,0,40-40V128A103.41,103.41,0,0,0,201.89,54.66ZM64,136a8,8,0,0,1,8,8v40a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V136Zm128,56a8,8,0,0,1-8-8V144a8,8,0,0,1,8-8h24v56Z"/></svg>`,
  upload:     `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V144a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z"/></svg>`,
  pay:        `<svg viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>`,
  more:       `<svg viewBox="0 0 256 256" fill="currentColor"><circle cx="60" cy="128" r="20"/><circle cx="128" cy="128" r="20"/><circle cx="196" cy="128" r="20"/></svg>`,
};

/* ── DS Category icons (Figma Banyan DS) ─────────────── */
const DS_ICONS = {
  person:       'assets/f732130e-4516-43e6-acf2-848c52c193ce.webp',
  income:       'assets/c5f68616-3e9c-4bfb-8887-4ad9efbc14d0.webp',
  food:         'assets/4df71d43-e6d9-44b3-bda4-e19ccc073e0b.webp',
  shopping:     'assets/5c61e048-b931-4cea-952f-d51231199971.webp',
  entertainment:'assets/e4ad3c2c-31cf-459b-ab5f-17703428501c.webp',
  bill:         'assets/f877f3fc-daa4-48cd-8517-83d7cbdf2efa.webp',
  travel:       'assets/da312e05-f1da-4b1a-bd1b-52c90904a566.webp',
  education:    'assets/b0762253-008f-4643-b39e-7c10777a8c94.webp',
  medical:      'assets/79857c9b-3e35-42d7-9784-8244270d80f2.webp',
  home:         'assets/b2bc7565-5b73-45b2-924e-e002ea1581ef.webp',
  transport:    'assets/192a23e6-2f77-4b96-8230-a01603a00845.webp',
};

/* ── Journey state machine ───────────────────────────── */
function getJourneyActions(tx) {
  if (!tx.journey) return null;

  const icons = ACTION_ICONS;
  if (tx.journey === 'card_dispute' || tx.journey === 'ach_dispute') {
    if (tx.status === 'completed') return [
      { icon:'share',   label:'Share',         pri:true  },
      { icon:'dispute', label:'Dispute',       pri:false, destructive:true, fn:() => openDisputeForm(tx) },
    ];
    if (tx.status === 'dispute_submitted') return [
      { icon:'share',   label:'Share',         pri:true  },
      { icon:'pay',     label:'Dispute won',   pri:false, fn:() => journeyStep(tx,'won') },
      { icon:'cancel',  label:'Dispute lost',  pri:false, fn:() => journeyStep(tx,'lost') },
    ];
    if (tx.status === 'dispute_resolved') return [
      { icon:'share',   label:'Share',         pri:true  },
    ];
    if (tx.status === 'dispute_rejected') return [
      { icon:'share',   label:'Share',         pri:true  },
      { icon:'support', label:'Support',       pri:false },
    ];
  }

  if (tx.journey === 'dispute_and_reversal') {
    if (tx.status === 'completed') return [
      { icon:'share',   label:'Share',              pri:true  },
      { icon:'dispute', label:'Raise a dispute',    pri:false, destructive:true, fn:() => openDisputeForm(tx) },
      { icon:'reverse', label:'Request reversal',   pri:false, fn:() => openReversalForm(tx) },
    ];
    // Dispute path: submitted → under review → won/lost
    if (tx.status === 'dispute_submitted') return [
      { icon:'share',   label:'Share',              pri:true  },
      { icon:'pay',     label:'Move to review',     pri:false, fn:() => journeyStep(tx,'under_review') },
      { icon:'cancel',  label:'Dispute lost',       pri:false, fn:() => journeyStep(tx,'lost') },
    ];
    if (tx.status === 'dispute_review') return [
      { icon:'share',   label:'Share',              pri:true  },
      { icon:'pay',     label:'Dispute won',        pri:false, fn:() => journeyStep(tx,'won') },
      { icon:'cancel',  label:'Dispute lost',       pri:false, fn:() => journeyStep(tx,'lost') },
    ];
    // Reversal path: requested → reversed/rejected
    if (tx.status === 'reversal_requested') return [
      { icon:'share',   label:'Share',              pri:true  },
      { icon:'pay',     label:'Reversed',           pri:false, fn:() => journeyStep(tx,'reversed') },
      { icon:'cancel',  label:'Rejected',           pri:false, fn:() => journeyStep(tx,'rejected') },
    ];
    if (tx.status === 'dispute_resolved' || tx.status === 'reversed') return [
      { icon:'share',   label:'Share',              pri:true  },
    ];
    if (tx.status === 'dispute_rejected' || tx.status === 'reversal_rejected') return [
      { icon:'share',   label:'Share',              pri:true  },
      { icon:'support', label:'Support',            pri:false },
    ];
  }

  if (tx.journey === 'ach_reversal') {
    if (tx.status === 'completed') return [
      { icon:'share',   label:'Share',         pri:true  },
      { icon:'reverse', label:'Reverse',        pri:false, fn:() => openReversalForm(tx) },
    ];
    if (tx.status === 'reversal_requested') return [
      { icon:'share',   label:'Share',         pri:true  },
      { icon:'pay',     label:'Reversed',      pri:false, fn:() => journeyStep(tx,'reversed') },
      { icon:'cancel',  label:'Rejected',      pri:false, fn:() => journeyStep(tx,'rejected') },
    ];
    if (tx.status === 'reversed') return [
      { icon:'share',   label:'Share',         pri:true  },
    ];
    if (tx.status === 'reversal_rejected') return [
      { icon:'share',   label:'Share',         pri:true  },
      { icon:'support', label:'Support',       pri:false },
    ];
  }
  return null;
}

function journeyStep(tx, action) {
  if (action === 'dispute') {
    tx.status = 'dispute_submitted';
    // Provisional credit only for card disputes — ACH disputes have no provisional credit
    if (tx.method === 'card' && !RECENT.find(t => t.id === tx.id + '_pc')) {
      // Derive the card account the original tx was charged to
      const pcToAcct = tx.card || (tx.to && tx.to.includes(' · ') ? tx.to.split(' · ')[1] : 'Debit card ••4242');
      const credit = { id:tx.id+'_pc', date:tx.date, journey:tx.journey+'_credit',
        name:tx.name+' (Provisional credit)', av:tx.av,
        status:'completed', amt:tx.amt, isCredit:true, linkedTo:tx.id,
        isProvisionalCredit:true, pcTo:pcToAcct, pcFrom:'Banyan Credit',
        useCase:true, linkedParent:tx.id };
      const idx = RECENT.indexOf(tx);
      RECENT.splice(idx + 1, 0, credit);
      tx.relatedAmt = '+$' + tx.amt[0].toLocaleString('en-US') + '.' + String(tx.amt[1]).padStart(2,'0');
      tx.relatedName = (tx.name.split(' ')[0]) + ' (Provisional credit)';
      tx.relatedBadge = 'Provisional';
    }

  } else if (action === 'won') {
    tx.status = 'dispute_resolved';
    delete tx.relatedAmt;
    delete tx.relatedBadge;
    delete tx.relatedName;
    const pcExists = RECENT.find(t => t.id === tx.id + '_pc');
    // If dispute went through provisional credit → that stays as-is (it already credited the account)
    // If no provisional credit existed → create a new Refund transaction now
    if (!pcExists && !RECENT.find(t => t.id === tx.id + '_refund')) {
      const refund = {
        id: tx.id + '_refund',
        date: tx.date,
        name: tx.name,
        av: tx.av,
        status: 'refund',
        amt: tx.amt,
        isCredit: true,
        useCase: true,
        linkedParent: tx.id,
      };
      const idx = RECENT.indexOf(tx);
      RECENT.splice(idx + 1, 0, refund);
    }

  } else if (action === 'lost') {
    tx.status = 'dispute_rejected';
    delete tx.relatedAmt;
    delete tx.relatedBadge;
    delete tx.relatedName;
    // Provisional credit stays as-is — it already hit the account
    // Add a new Credit Clawback transaction (completed debit) to claw it back
    if (!RECENT.find(t => t.id === tx.id + '_cc')) {
      const clawback = {
        id: tx.id + '_cc',
        date: tx.date,
        name: tx.name + ' (Credit clawback)',
        av: tx.av,
        status: 'completed',
        amt: tx.amt,
        isCredit: false,
        useCase: true,
        linkedParent: tx.id,
      };
      const idx = RECENT.indexOf(tx);
      RECENT.splice(idx + 1, 0, clawback);
    }

  } else if (action === 'under_review') {
    tx.status = 'dispute_review';

  } else if (action === 'reverse') {
    tx.status = 'reversal_requested';

  } else if (action === 'reversed') {
    tx.status = 'reversed';
    tx.isCredit = false; // original was a debit — stays as debit, now marked reversed
    delete tx.relatedAmt;
    delete tx.relatedName;
    delete tx.relatedBadge;
    // Create a new Refund transaction — the credit hitting the account after reversal
    if (!RECENT.find(t => t.id === tx.id + '_refund')) {
      const refund = {
        id: tx.id + '_refund',
        date: tx.date,
        name: tx.name,
        av: tx.av,
        status: 'refund',
        amt: tx.amt,
        isCredit: true,
        useCase: true,
        linkedParent: tx.id,
      };
      const idx = RECENT.indexOf(tx);
      RECENT.splice(idx + 1, 0, refund);
    }

  } else if (action === 'rejected') {
    tx.status = 'reversal_rejected';
    delete tx.relatedAmt;
  }

  closeDetail();
  renderList(activeTab);
  setTimeout(() => openDetail(tx), 80);
}

function closeDetail() {
  closeMoreMenu();
  document.getElementById('detail').classList.remove('open');
  const _bb = document.querySelector('.list-bottom-bar');
  if (_bb) { _bb.style.opacity = ''; _bb.style.pointerEvents = ''; }
}

/* ── Screen navigation ───────────────────────────────── */
function setSbLight(on) {
  document.getElementById('globalSb').classList.toggle('lt', on);
}
function showList() {
  _navStack.push(_activeScreen());
  document.getElementById('explore').className = 'screen hl';
  document.getElementById('home').className    = 'screen hl';
  document.getElementById('list').className    = 'screen on';
  setSbLight(false);
  showNav(false);
  if (typeof _TW !== 'undefined') _TW.start();
}
/* ── Render embedded tx section (Home + Account Detail) ─ */
/* ── Per-container segmented tab state ──────────────── */
const _embTab = {};

/* ── Date header element for embedded section ─────── */
function embDateHeader(label) {
  const d = document.createElement('div');
  d.className = 'emb-tx-date-row';
  const lbl = document.createElement('div');
  lbl.className = 'emb-tx-date-lbl';
  lbl.textContent = label;
  const line = document.createElement('div');
  line.className = 'emb-tx-date-line';
  d.appendChild(lbl);
  d.appendChild(line);
  return d;
}

/* ── Avatar for embedded rows ────────────────────── */
function buildEmbAvatar(tx) {
  const slCfg = SL[tx.status] || SL.completed;
  const av = tx.av;
  const container = document.createElement('div');
  container.className = 'emb-tx-av' + (slCfg.inactive ? ' inactive' : '');
  const inner = document.createElement('div');
  inner.className = 'emb-tx-av-inner';
  if (av.ds) {
    const img = document.createElement('img');
    img.src = DS_ICONS[av.ds];
    inner.appendChild(img);
  } else if (av.ini) {
    const img = document.createElement('img');
    img.src = DS_ICONS.person;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
    inner.appendChild(img);
  } else if (av.brand) {
    inner.style.background = av.bg || '#F5F5F5';
    inner.style.fontSize = '18px';
    inner.textContent = av.icon;
  } else if (av.bg) {
    inner.style.background = av.bg;
  }
  container.appendChild(inner);
  const badge = document.createElement('div');
  badge.className = 'emb-tx-av-badge';
  badge.innerHTML = (METHOD_ICONS[tx.method] || METHOD_ICONS.wire)
    .replace('<svg', '<svg style="width:12px;height:12px;fill:var(--text-tertiary)"');
  container.appendChild(badge);
  return container;
}

/* ── Single embedded transaction row ─────────────── */
function buildEmbRow(tx) {
  const slCfg = SL[tx.status] || SL.completed;
  const isDimmed = !!slCfg.inactive;
  const sign = tx.isCredit ? '+' : '−';

  const row = document.createElement('div');
  row.className = 'emb-tx-row';
  row.onclick = () => openDetail(tx);

  row.appendChild(buildEmbAvatar(tx));

  const info = document.createElement('div');
  info.className = 'emb-tx-info';

  // Name row (+ calendar icon for scheduled)
  const nameRow = document.createElement('div');
  nameRow.className = 'emb-tx-name-row';
  const nameEl = document.createElement('div');
  nameEl.className = 'emb-tx-name' + (isDimmed ? ' dimmed' : '');
  nameEl.textContent = tx.name;
  nameRow.appendChild(nameEl);
  if (tx.status === 'scheduled') {
    const cal = document.createElement('div');
    cal.className = 'emb-tx-cal';
    cal.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;color: var(--text-tertiary)"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="15" r="1" fill="currentColor" stroke="none"/></svg>`;
    nameRow.appendChild(cal);
  }
  info.appendChild(nameRow);

  // Status label
  if (slCfg.label) {
    const statusEl = document.createElement('div');
    statusEl.className = 'emb-tx-status';
    statusEl.style.color = slCfg.color || 'rgba(0,0,0,0.6)';
    if (slCfg.icon && STATUS_ICONS[slCfg.icon]) {
      const iconSpan = document.createElement('span');
      iconSpan.style.cssText = 'display:flex;align-items:center;';
      const svgStr = STATUS_ICONS[slCfg.icon].replace('<svg',
        '<svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"');
      iconSpan.innerHTML = svgStr;
      if (slCfg.icon === 'doubleup' || slCfg.icon === 'flag') {
        const s = iconSpan.querySelector('svg');
        if (s) { s.style.fill = 'currentColor'; s.style.stroke = 'none'; }
      }
      statusEl.appendChild(iconSpan);
    }
    statusEl.appendChild(document.createTextNode(slCfg.label));
    info.appendChild(statusEl);
  }
  row.appendChild(info);

  // Right: amount + INR
  const right = document.createElement('div');
  right.className = 'emb-tx-right';
  const amtEl = document.createElement('div');
  amtEl.className = 'emb-tx-amt' + (isDimmed ? ' dimmed' : '') + (tx.isCredit ? ' credit' : '');
  amtEl.textContent = sign + '$' + tx.amt[0].toLocaleString('en-US') + '.' + String(tx.amt[1]).padStart(2,'0');
  right.appendChild(amtEl);
  if (tx.inr) {
    const inrEl = document.createElement('div');
    inrEl.className = 'emb-tx-inr';
    inrEl.textContent = tx.inr;
    right.appendChild(inrEl);
  }
  row.appendChild(right);
  return row;
}

/* ── Render embedded transaction section ─────────── */
function renderEmbeddedTxSection(containerId, spaceTxns) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  container.style.padding = '';

  const tab = _embTab[containerId] || 'recent';
  const rawTxns = tab === 'scheduled' ? SCHEDULED : (spaceTxns || RECENT);
  const limit = spaceTxns ? null : 5;
  const allTxns = limit ? rawTxns.slice(0, limit) : rawTxns;

  // Outer card
  const outer = document.createElement('div');
  outer.className = 'emb-tx-outer';

  // ── Header: title + segmented control ──
  const hdrRow = document.createElement('div');
  hdrRow.className = 'emb-tx-hdr-row';
  const title = document.createElement('div');
  title.className = 'emb-tx-title';
  title.textContent = 'transactions';
  hdrRow.appendChild(title);
  const seg = document.createElement('div');
  seg.className = 'emb-tx-seg';
  ['recent', 'scheduled'].forEach(t => {
    const opt = document.createElement('button');
    opt.className = 'emb-tx-seg-opt' + (tab === t ? ' active' : '');
    opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    opt.onclick = (e) => {
      e.stopPropagation();
      _embTab[containerId] = t;
      renderEmbeddedTxSection(containerId, spaceTxns);
    };
    seg.appendChild(opt);
  });
  hdrRow.appendChild(seg);
  outer.appendChild(hdrRow);

  if (tab === 'scheduled') {
    // ── Scheduled: flat list, no date headers ──
    const sec = document.createElement('div');
    sec.className = 'emb-tx-old-sec';
    allTxns.forEach(tx => sec.appendChild(buildEmbRow(tx)));
    outer.appendChild(sec);
  } else {
    // ── Recent: new (white card) + older ──
    const newTxns = allTxns.filter(t => t.new);

    if (newTxns.length > 0) {
      // p-8 wrapper gives the card an 8px inset from the outer container edges (Figma)
      const newWrap = document.createElement('div');
      newWrap.style.cssText = 'padding: 8px 8px 0;';

      // White card — pill row goes INSIDE first
      const newCard = document.createElement('div');
      newCard.className = 'emb-tx-new-card';

      // "N new" pill row — first child of white card
      const newRow = document.createElement('div');
      newRow.className = 'emb-tx-new-row';
      const pill = document.createElement('div');
      pill.className = 'emb-tx-new-pill';
      pill.innerHTML = newTxns.length + ' new transaction' + (newTxns.length !== 1 ? 's' : '')
        + `<span class="ico ol" style="--ico:url('Icons/ArrowDown.svg');--sz:11px;color:var(--brand-primary)"></span>`;
      newRow.appendChild(pill);
      const dashed = document.createElement('div');
      dashed.className = 'emb-tx-new-dashed';
      newRow.appendChild(dashed);
      newCard.appendChild(newRow);

      // Date groups inside card
      const newByDate = groupByDate(newTxns);
      for (const [date, rows] of newByDate) {
        newCard.appendChild(embDateHeader(date));
        rows.forEach(tx => newCard.appendChild(buildEmbRow(tx)));
      }

      newWrap.appendChild(newCard);
      outer.appendChild(newWrap);
    }

    // Older section — 16px gap below card, compact 8px top on date headers
    const oldTxns = allTxns.filter(t => !t.new);
    if (oldTxns.length > 0) {
      const oldSec = document.createElement('div');
      oldSec.className = 'emb-tx-old-sec';
      oldSec.style.paddingTop = newTxns.length > 0 ? '16px' : '0';
      const oldByDate = groupByDate(oldTxns);
      for (const [date, rows] of oldByDate) {
        const dh = embDateHeader(date);
        dh.style.paddingTop = '8px';
        oldSec.appendChild(dh);
        rows.forEach(tx => oldSec.appendChild(buildEmbRow(tx)));
      }
      outer.appendChild(oldSec);
    }
  }

  // ── Footer: frosted fade + "See all" ──
  const footer = document.createElement('div');
  footer.className = 'emb-tx-footer';
  footer.onclick = () => showList();
  footer.innerHTML = `<span class="emb-tx-footer-lbl">See all transactions</span>`
    + `<span class="ico ol" style="--ico:url('Icons/ArrowRight.svg');--sz:16px;color:var(--brand-primary)"></span>`;
  outer.appendChild(footer);

  container.appendChild(outer);
}

const _HOME_GREETINGS = [
  { hi: 'Good to see you, Satya',         ask: 'What can we take\ncare of today?' },
  { hi: 'Hey Satya, you\'re all set',     ask: 'Everything\'s running\nsmoothly.' },
  { hi: 'Hey Satya',                      ask: 'Ready when you are.' },
  { hi: 'It\'s evening in Mumbai, Satya', ask: 'Everything back home\nis on track.' },
  { hi: 'Hello again, Satya',             ask: 'Anything need\nyour attention?' },
];
let _greetingIdx = parseInt(localStorage.getItem('_greetingIdx') || '0', 10);
let _greetingSet = false;

function showHome() {
  document.getElementById('explore').className  = 'screen hb';
  document.getElementById('accounts').className = 'screen hb';
  document.getElementById('list').className     = 'screen hr';
  document.getElementById('home').className     = 'screen on';
  document.querySelector('#home .home-scroll').scrollTop = 0;
  setSbLight(false);
  showNav(true);
  setNavActive(0);
  _smOrigin = 'home';
  renderEmbeddedTxSection('homeTxList');

  // Rotate greeting once per page load, persist for next session
  if (!_greetingSet) {
    _greetingSet = true;
    const g = _HOME_GREETINGS[_greetingIdx % _HOME_GREETINGS.length];
    _greetingIdx++;
    localStorage.setItem('_greetingIdx', _greetingIdx);
    const hiEl  = document.querySelector('#home .home-greeting-hi');
    const askEl = document.querySelector('#home .home-greeting-ask');
    if (hiEl)  hiEl.textContent = g.hi;
    if (askEl) askEl.innerHTML  = g.ask.replace(/\n/g, '<br>');
  }
}
function showExplore() {
  document.getElementById('list').className     = 'screen hr';
  document.getElementById('home').className     = 'screen hb';
  document.getElementById('accounts').className = 'screen hb';
  document.getElementById('explore').className  = 'screen on';
  setSbLight(false);
  showNav(true);
  setNavActive(3);
  _smOrigin = 'explore';
}

/* ── Send Money flow ─────────────────────────────────── */
const SM_SCREENS = ['sm-landing','sm-amount','sm-review','sm-progress','sm-success'];
const SM_EXRATE  = 91.78;
let smCents = 100000; // pre-filled $1,000.00
let smCurrencyFlipped = false;
let smInrPaise = 0;

let smRecipient = {
  name:'Rohan Rathod', initials:'RR',
  bg:'linear-gradient(135deg,#46882b,#2d5a16)', account:'••7654 · HDFC Bank'
};

function showAccounts() {
  document.getElementById('home').className     = 'screen hb';
  document.getElementById('explore').className  = 'screen hb';
  document.getElementById('list').className     = 'screen hr';
  document.getElementById('accounts').className = 'screen on';
  document.querySelector('#accounts .acct-scroll').scrollTop = 0;
  setSbLight(false);
  showNav(true);
  setNavActive(2);
  _smOrigin = 'accounts';
}

/* ── Cards screen ────────────────────────────────────────── */
let _cardsFilter = 'all';
let _cardsOrigin = 'home';

const SPACES_FILTER = [
  { id: 'all',              label: 'All spaces',       img: 'assets/space-all.webp' },
  { id: 'USD Checking',     label: 'USD Checking',     img: 'assets/space-usd-checking.webp' },
  { id: 'Thailand holiday', label: 'Thailand holiday', img: 'assets/space-thailand.webp' },
  { id: "Mom's expenses",   label: "Mom's expenses",   img: 'assets/space-moms.webp' },
  { id: 'Wedding',          label: 'Wedding',          img: 'assets/space-wedding.webp' },
];

function updateCardsFilter(filterId) {
  const pill = document.getElementById('crFilterPill');
  if (!pill) return;
  const active = SPACES_FILTER.find(s => s.id === filterId) || SPACES_FILTER[0];
  // Show up to 2 other spaces as quick-switch avatars (exclude active)
  const others = SPACES_FILTER.filter(s => s.id !== filterId && s.id !== 'all').slice(0, 2);

  let html = `<div class="cr-filter-active">
    <div class="cr-filter-av"><div class="cr-filter-av-inner"><img src="${active.img}" alt="${active.label}"></div></div>
    <span class="cr-filter-lbl">${active.label}</span>
  </div>`;

  others.forEach(s => {
    html += `<div class="cr-filter-other" onclick="showCards('${s.id.replace(/'/g,"\\'")}')">
      <div class="cr-filter-other-av"><img src="${s.img}" alt="${s.label}"></div>
    </div>`;
  });

  html += `<div class="cr-filter-more">
    <button class="cr-filter-more-btn">
      <span class="ico ol" style="--ico:url('Icons/DotsThree.svg');--sz:12px;color: var(--text-secondary)"></span>
    </button>
  </div>`;

  pill.innerHTML = html;
}

function renderCrTxSection() {
  const container = document.getElementById('crTxSection');
  if (!container) return;

  const tab = _embTab['crTxSection'] || 'recent';
  // Card transactions only
  let allCardTxns = (tab === 'recurring' ? SCHEDULED : RECENT).filter(t => t.method === 'card');
  // Space filter
  if (_cardsFilter !== 'all') {
    const ids = SPACE_TX_IDS[_cardsFilter];
    if (ids) allCardTxns = allCardTxns.filter(t => ids.includes(t.id));
  }

  // Build using emb-tx-* CSS (same as renderEmbeddedTxSection pattern)
  const outer = document.createElement('div');
  outer.className = 'emb-tx-outer';

  // Header row
  const hdrRow = document.createElement('div');
  hdrRow.className = 'emb-tx-hdr-row';
  const title = document.createElement('div');
  title.className = 'emb-tx-title';
  title.textContent = 'transactions';
  hdrRow.appendChild(title);
  const seg = document.createElement('div');
  seg.className = 'emb-tx-seg';
  [['recent','Recent'],['recurring','Recurring']].forEach(([t,lbl]) => {
    const opt = document.createElement('button');
    opt.className = 'emb-tx-seg-opt' + (tab === t ? ' active' : '');
    opt.textContent = lbl;
    opt.onclick = (e) => { e.stopPropagation(); _embTab['crTxSection'] = t; renderCrTxSection(); };
    seg.appendChild(opt);
  });
  hdrRow.appendChild(seg);
  outer.appendChild(hdrRow);

  // New transactions (white card)
  const newTxns = allCardTxns.filter(t => t.new);
  if (newTxns.length > 0) {
    const newWrap = document.createElement('div');
    newWrap.style.cssText = 'padding:8px 8px 0';
    const newCard = document.createElement('div');
    newCard.className = 'emb-tx-new-card';
    const newRow = document.createElement('div');
    newRow.className = 'emb-tx-new-row';
    const pill = document.createElement('div');
    pill.className = 'emb-tx-new-pill';
    pill.innerHTML = newTxns.length + ' new transaction' + (newTxns.length !== 1 ? 's' : '')
      + `<span class="ico ol" style="--ico:url('Icons/ArrowDown.svg');--sz:11px;color:var(--brand-primary)"></span>`;
    newRow.appendChild(pill);
    const dashed = document.createElement('div');
    dashed.className = 'emb-tx-new-dashed';
    newRow.appendChild(dashed);
    newCard.appendChild(newRow);
    const newByDate = groupByDate(newTxns);
    for (const [date, rows] of newByDate) {
      newCard.appendChild(embDateHeader(date));
      rows.forEach(tx => newCard.appendChild(buildEmbRow(tx)));
    }
    newWrap.appendChild(newCard);
    outer.appendChild(newWrap);
  }

  // Older transactions
  const oldTxns = allCardTxns.filter(t => !t.new);
  if (oldTxns.length > 0) {
    const oldSec = document.createElement('div');
    oldSec.className = 'emb-tx-old-sec';
    oldSec.style.paddingTop = newTxns.length > 0 ? '16px' : '0';
    const oldByDate = groupByDate(oldTxns);
    for (const [date, rows] of oldByDate) {
      const dh = embDateHeader(date);
      dh.style.paddingTop = '8px';
      oldSec.appendChild(dh);
      rows.forEach(tx => oldSec.appendChild(buildEmbRow(tx)));
    }
    outer.appendChild(oldSec);
  }

  // Footer
  const footer = document.createElement('div');
  footer.className = 'emb-tx-footer';
  footer.onclick = () => showList();
  footer.innerHTML = `<span class="emb-tx-footer-lbl">See all transactions</span>`
    + `<span class="ico ol" style="--ico:url('Icons/ArrowRight.svg');--sz:16px;color:var(--brand-primary)"></span>`;
  outer.appendChild(footer);

  container.innerHTML = '';
  container.appendChild(outer);
}

function showCards(filter) {
  _cardsFilter = filter || 'all';
  _cardsOrigin = _activeScreen();

  updateCardsFilter(_cardsFilter);
  _embTab['crTxSection'] = 'recent';
  renderCrTxSection();

  // Slide in from right; hide all other screens
  ['home','explore','accounts','account-detail','list'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'screen hr';
  });
  const cardsEl = document.getElementById('cards');
  cardsEl.className = 'screen on';
  cardsEl.querySelector('.cr-scroll').scrollTop = 0;

  setSbLight(false);
  showNav(false);
}

function showCardsBack() {
  closeCrSheets();
  document.getElementById('cards').className = 'screen hr';
  if (_cardsOrigin === 'explore') { showExplore(); return; }
  if (_cardsOrigin === 'account-detail') {
    document.getElementById('account-detail').className = 'screen on';
    showNav(false); setSbLight(false); return;
  }
  showHome();
}

/* ── Card action sheets ────────────────────────── */
let _cardLocked = false;
let _pinStep   = 0;   // 0=current, 1=new, 2=confirm
let _pinEntry  = '';  // digits typed so far
let _pinNew    = '';  // saved new PIN from step 1

function openCrSheet(id) {
  document.getElementById('crOverlay').classList.add('visible');
  document.getElementById(id).classList.add('open');
}
function closeCrSheet(id) {
  document.getElementById(id).classList.remove('open');
  const anyOpen = document.querySelectorAll('#cards .cr-sheet.open').length > 0;
  if (!anyOpen) document.getElementById('crOverlay').classList.remove('visible');
}
function closeCrSheets() {
  document.querySelectorAll('#cards .cr-sheet').forEach(el => el.classList.remove('open'));
  const ov = document.getElementById('crOverlay');
  if (ov) ov.classList.remove('visible');
}
function crToggle(row) {
  row.querySelector('.cr-toggle').classList.toggle('on');
}

/* Lock card */
function openCrLockSheet() {
  const title = document.getElementById('crLockTitle');
  const sub   = document.getElementById('crLockSub');
  const btn   = document.getElementById('crLockConfirmBtn');
  const ico   = document.getElementById('crLockSheetIco');
  const wrap  = document.getElementById('crLockIconWrap');
  if (_cardLocked) {
    title.textContent = 'Unlock this card?';
    sub.textContent   = 'Your card will be active again and transactions will be allowed.';
    btn.textContent   = 'Unlock card';
    btn.className     = 'cr-lock-btn cr-lock-btn-unlock';
    ico.style.setProperty('--ico', "url('Icons/LockOpen.svg')");
    ico.style.color   = '#46882b';
    wrap.style.background = 'rgba(70,136,43,0.08)';
  } else {
    title.textContent = 'Lock this card?';
    sub.textContent   = 'Transactions will be declined until you unlock it. You can unlock at any time.';
    btn.textContent   = 'Lock card';
    btn.className     = 'cr-lock-btn cr-lock-btn-danger';
    ico.style.setProperty('--ico', "url('Icons/Lock.svg')");
    ico.style.color   = 'rgba(0,0,0,0.65)';
    wrap.style.background = 'rgba(0,0,0,0.05)';
  }
  openCrSheet('crLockSheet');
}
function confirmLockCard() {
  _cardLocked = !_cardLocked;
  // Update action button on hero card
  const ico = document.getElementById('crLockActionIco');
  const lbl = document.getElementById('crLockActionLbl');
  if (_cardLocked) {
    ico.style.setProperty('--ico', "url('Icons/LockOpen.svg')");
    ico.style.color = '#c82c2c';
    lbl.textContent = 'Unlock card';
  } else {
    ico.style.setProperty('--ico', "url('Icons/Lock.svg')");
    ico.style.color = 'rgba(0,0,0,0.8)';
    lbl.textContent = 'Lock card';
  }
  closeCrSheet('crLockSheet');
}

/* Change PIN */
const _PIN_TITLES = ['Enter current PIN', 'Enter new PIN', 'Confirm new PIN'];

function openCrPinSheet() {
  _pinStep  = 0;
  _pinEntry = '';
  _pinNew   = '';
  document.getElementById('crPinEntry').style.display  = '';
  document.getElementById('crPinSuccess').style.display = 'none';
  _crUpdatePinUI();
  openCrSheet('crPinSheet');
}
function _crUpdatePinUI() {
  document.getElementById('crPinTitle').textContent = _PIN_TITLES[_pinStep];
  document.querySelectorAll('.cr-pin-dot').forEach((d, i) => {
    d.classList.toggle('filled', i < _pinEntry.length);
    d.classList.remove('error');
  });
}
function crPinDigit(d) {
  if (_pinEntry.length >= 4) return;
  _pinEntry += d;
  _crUpdatePinUI();
  if (_pinEntry.length === 4) setTimeout(_crAdvancePin, 120);
}
function crPinBackspace() {
  if (!_pinEntry.length) return;
  _pinEntry = _pinEntry.slice(0, -1);
  _crUpdatePinUI();
}
function _crAdvancePin() {
  if (_pinStep === 0) {
    // Accept any 4 digits as the "current PIN" for prototype
    _pinStep = 1; _pinEntry = ''; _crUpdatePinUI();
  } else if (_pinStep === 1) {
    _pinNew = _pinEntry;
    _pinStep = 2; _pinEntry = ''; _crUpdatePinUI();
  } else if (_pinStep === 2) {
    if (_pinEntry === _pinNew) {
      document.getElementById('crPinEntry').style.display  = 'none';
      document.getElementById('crPinSuccess').style.display = '';
    } else {
      // Mismatch: shake dots + clear
      const dotsEl = document.getElementById('crPinDots');
      document.querySelectorAll('.cr-pin-dot').forEach(d => d.classList.add('error'));
      dotsEl.classList.add('shake');
      setTimeout(() => {
        dotsEl.classList.remove('shake');
        _pinEntry = ''; _crUpdatePinUI();
      }, 450);
    }
  }
}

/* ── Spending limits ────────────────────────────── */
const _cardLimits = { per_tx: null, daily: null, monthly: null, intl: null, online: null, nfc: null, atm: null };
let _limitKey = null;

const LIMIT_PRESETS = {
  per_tx:  [500, 1000, 2500, 5000],
  daily:   [1000, 2500, 5000, 10000],
  monthly: [5000, 10000, 25000, 50000],
  intl:    [250, 500, 1000, 2500],
  online:  [250, 500, 1000, 2500],
  nfc:     [50, 100, 250, 500],
  atm:     [200, 500, 1000, 2000],
};

// Keys that have a chip in the spending controls section (not a limit row)
const CTRL_CHIP_KEYS = new Set(['intl','online','nfc','atm']);

function _fmtLimit(v) {
  if (!v) return 'No limit';
  return '$' + Number(v).toLocaleString('en-US');
}

function _updateLimitDisplay(key, val) {
  if (CTRL_CHIP_KEYS.has(key)) {
    const chip = document.getElementById('crCtrlChip-' + key);
    const lbl  = document.getElementById('crCtrlLbl-' + key);
    if (!chip || !lbl) return;
    if (val) {
      lbl.textContent = _fmtLimit(val);
      chip.classList.add('set');
    } else {
      lbl.textContent = 'Set limit';
      chip.classList.remove('set');
    }
  } else {
    const el = document.getElementById('crLimitVal-' + key);
    if (!el) return;
    el.textContent = val ? _fmtLimit(val) : 'No limit';
    val ? el.classList.add('set') : el.classList.remove('set');
  }
}

function openLimitSheet(key, label) {
  _limitKey = key;
  document.getElementById('crLimitSheetTitle').textContent = label;
  const inp = document.getElementById('crLimitInput');
  inp.value = _cardLimits[key] ? _cardLimits[key] : '';
  crLimitOnInput();

  const presets = LIMIT_PRESETS[key] || [];
  document.getElementById('crLimitPresets').innerHTML = presets.map(p =>
    `<div class="cr-limit-preset" onclick="crLimitPreset(${p})">$${p.toLocaleString('en-US')}</div>`
  ).join('');

  document.getElementById('crLimitSheet').classList.add('open');
}

function closeLimitSheet() {
  document.getElementById('crLimitSheet').classList.remove('open');
  document.getElementById('crLimitInput').blur();
}

function crLimitOnInput() {
  const v = document.getElementById('crLimitInput').value;
  document.getElementById('crLimitSaveBtn').disabled = !v || Number(v) <= 0;
}

function crLimitPreset(amount) {
  document.getElementById('crLimitInput').value = amount;
  crLimitOnInput();
}

function crLimitClear() {
  _cardLimits[_limitKey] = null;
  _updateLimitDisplay(_limitKey, null);
  closeLimitSheet();
}

function crLimitSave() {
  const v = Number(document.getElementById('crLimitInput').value);
  if (!v || v <= 0) return;
  _cardLimits[_limitKey] = v;
  _updateLimitDisplay(_limitKey, v);
  closeLimitSheet();
}

/* ── Pay nav picker ─────────────────────────────── */
let _bnavPickerSelected = 'USD Checking';

const BNAV_SPACES = [
  { id: 'USD Checking',    label: 'USD Checking',    img: 'assets/space-usd-checking.webp' },
  { id: 'Thailand holiday',label: 'Thailand holiday', img: 'assets/space-th2.webp' },
  { id: "Mom's expenses",  label: "Mom's expenses",  img: 'assets/space-moms2.webp' },
  { id: 'Wedding',         label: 'Wedding',         img: 'assets/space-wedding.webp' },
];

function _bnavUpdateActiveSlot() {
  const sp = BNAV_SPACES.find(s => s.id === _bnavPickerSelected) || BNAV_SPACES[0];
  const img = document.getElementById('bnavPkActiveImg');
  const lbl = document.getElementById('bnavPkActiveLbl');
  if (img) img.src = sp.img;
  if (lbl) lbl.textContent = sp.label;
}

function togglePayPicker() {
  const pill = document.getElementById('bnavPill');
  if (pill.classList.contains('picker-open')) {
    closePayPicker();
  } else {
    _bnavUpdateActiveSlot();
    pill.classList.add('picker-open');
  }
}

function closePayPicker() {
  document.getElementById('bnavPill').classList.remove('picker-open');
}

function bnavPaySelect(spaceId) {
  if (spaceId && spaceId !== 'all') {
    _bnavPickerSelected = spaceId;
    _bnavUpdateActiveSlot();
  }
  closePayPicker();
  // TODO: open Send Money flow with selected space
}

/* ── Account detail ─────────────────────────────── */
// Per-space transaction filters (IDs from RECENT array)
const SPACE_TX_IDS = {
  'USD Checking':   null,                                    // null = all (main account)
  'Thailand holiday': ['t10','a1','a5','t9','t4'],           // intl wires + scheduled
  "Mom's expenses": ['t1','t3','t6','t7','t8','a2','a4'],    // card spends + edge cases
  'Wedding':        ['t5','t6','t8','a3','t9'],              // payroll + saving pattern
};

function buildCasePanels(acct) {
  var warnText   = acct.warnText   || 'for your Scheduled transfer of $25,000 scheduled in 2 days. Add funds before 29 June.';
  var errorTitle = acct.errorTitle || '3 Transactions failed';
  var errorText  = acct.errorText  || 'Due to insufficient balance in your account. The transactions were worth $25,980.';

  // Card 1 (primary, full height): failed transactions
  var errorPanel = '<div class="ad-case-panel ad-case-panel--error">'
    + '<img class="ad-banner-icon" src="assets/case-error-icon.webp" alt="">'
    + '<div class="ad-banner-body">'
    + '<div class="ad-banner-texts">'
    + '<div class="ad-banner-title" style="color:#c82c2c">' + errorTitle + '</div>'
    + '<div class="ad-banner-text">' + errorText + '</div>'
    + '</div>'
    + '<button class="ad-banner-btn-pill">Show transactions'
    + '<span class="ico ol" style="--ico:url(\'Icons/ArrowRight.svg\');--sz:12px;color:rgba(0,0,0,0.80)"></span>'
    + '</button>'
    + '</div></div>';

  // Card 2 (peek, height clipped to 97px): insufficient balance
  var warnPanel = '<div class="ad-case-panel ad-case-panel--warn" id="adCaseWarnPanel">'
    + '<img class="ad-banner-icon" src="assets/case-warn-icon.webp" alt="">'
    + '<div class="ad-banner-body">'
    + '<div class="ad-banner-texts">'
    + '<div class="ad-banner-title" style="color:#c17c14">Insufficient balance</div>'
    + '<div class="ad-banner-text">' + warnText + '</div>'
    + '</div>'
    + '<div class="ad-banner-btns">'
    + '<button class="ad-banner-btn-pill"><span class="ico ol" style="--ico:url(\'Icons/Plus.svg\');--sz:12px;color:rgba(0,0,0,0.80)"></span>Add funds</button>'
    + '<button class="ad-banner-btn-ghost">See transactions<span class="ico ol" style="--ico:url(\'Icons/ArrowRight.svg\');--sz:12px;color: var(--text-secondary)"></span></button>'
    + '</div>'
    + '</div></div>';

  return errorPanel + warnPanel;
}

let _currentAdAcctName = 'all';
function showAccountDetail(acct) {
  _currentAdAcctName = acct.name;
  var mainCard  = document.getElementById('adMainCard');

  // adCasesWrap (old full-card scroll) is never shown — always hide it
  document.getElementById('adCasesWrap').style.display = 'none';
  mainCard.style.display = '';

  // Populate shared fields (same for all modes)
  document.getElementById('adAcctName').textContent = acct.name;
  document.getElementById('adAcctNum').textContent  = acct.num;
  document.getElementById('adBalInt').textContent   = acct.balInt;
  var ACCT_ICON = {
    'USD Checking':   'assets/space-usd-checking.webp',
    'Thailand holiday': 'assets/space-thailand.webp',
    "Mom's expenses": 'assets/space-moms.webp',
    'Wedding':        'assets/space-wedding.webp'
  };
  var flagSrc = ACCT_ICON[acct.name] || 'assets/space-usd-checking.webp';
  document.getElementById('adAcctFlag').innerHTML = '<img src="' + flagSrc + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
  document.getElementById('adBalDec').textContent   = acct.balDec;

  var bannerScroll = document.getElementById('adCasesBannerScroll');

  if (acct.showCases) {
    // ── Cases mode: standard header, banner area is a horizontal scroll ──
    mainCard.classList.remove('ad-state-pending','ad-state-warn','ad-state-error','ad-state-cases');
    mainCard.classList.add('ad-state-cases');
    bannerScroll.style.display = 'flex';
    bannerScroll.innerHTML     = buildCasePanels(acct);
    bannerScroll.scrollLeft    = 0;
    // Anchor warn card content to top once it is scrolled into the snap position
    bannerScroll.onscroll = function() {
      var warnPanel = document.getElementById('adCaseWarnPanel');
      if (!warnPanel) return;
      // Switch to top-anchored layout when warn card is mostly in view
      var expanded = bannerScroll.scrollLeft > 140;
      warnPanel.classList.toggle('ad-case-expanded', expanded);
    };
  } else {
    // ── Single state mode ──
    bannerScroll.style.display = 'none';
    bannerScroll.onscroll = null;

    mainCard.classList.remove('ad-state-pending','ad-state-warn','ad-state-error','ad-state-cases');
    var state = acct.state || '';
    if (state) mainCard.classList.add('ad-state-' + state);

    // Populate state-specific content if provided
    if (acct.pendingAmt)  document.getElementById('adPendingAmt').textContent      = acct.pendingAmt + ' in pending transactions';
    if (acct.warnText)    document.getElementById('adBannerWarnText').textContent   = acct.warnText;
    if (acct.errorTitle)  document.getElementById('adBannerErrorTitle').textContent = acct.errorTitle;
    if (acct.errorText)   document.getElementById('adBannerErrorText').textContent  = acct.errorText;
  }

  // Build filtered transaction list for this space
  var ids = SPACE_TX_IDS[acct.name];
  var spaceTxns = ids ? RECENT.filter(t => ids.includes(t.id)) : null;

  // Render tx section (same component as home page, filtered list)
  renderEmbeddedTxSection('adTxList', spaceTxns);
  // Scroll to top
  document.getElementById('adScroll').scrollTop = 0;
  // Slide in
  _navStack.push(_activeScreen());
  document.getElementById('accounts').className       = 'screen hl';
  document.getElementById('home').className           = 'screen hl';
  document.getElementById('account-detail').className = 'screen on';
  showNav(false);
  setSbLight(false);
}

function closeAccountDetail() {
  document.getElementById('account-detail').className = 'screen hr';
  showNav(true);
  goBack();
}

function openAdSheet() {
  // Sync account number into sheet
  const num = document.getElementById('adAcctNum').textContent;
  document.getElementById('adSheetAcctNum').textContent = num.replace(/\s*\d{4}$/, ''); // show 12-digit form
  document.getElementById('adBottomSheet').classList.add('open');
  document.getElementById('adSheetOverlay').classList.add('visible');
}

function closeAdSheet() {
  document.getElementById('adBottomSheet').classList.remove('open');
  document.getElementById('adSheetOverlay').classList.remove('visible');
}

function openAdOptionsSheet() {
  document.getElementById('adOptsSheet').classList.add('open');
  document.getElementById('adSheetOverlay').classList.add('visible');
}

function closeAdOptionsSheet() {
  document.getElementById('adOptsSheet').classList.remove('open');
  document.getElementById('adSheetOverlay').classList.remove('visible');
}

function closeAllAdSheets() {
  document.getElementById('adBottomSheet').classList.remove('open');
  document.getElementById('adOptsSheet').classList.remove('open');
  document.getElementById('adSheetOverlay').classList.remove('visible');
}

function adCopyNum() {
  const num = document.getElementById('adAcctNum').textContent;
  adCopyField(num.replace(/\s/g, ''));
}

function adCopyField(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
}

function adSegClick(btn, tab) {
  btn.closest('.ad-seg').querySelectorAll('.ad-seg-btn')
     .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

let smOrigin = 'home';
function toggleSendDropdown(e) {
  e.stopPropagation();
  const btn = document.getElementById('sm-sending-now-btn');
  const dd = document.getElementById('sm-send-dropdown');
  const isOpen = dd.classList.contains('open');
  if (isOpen) {
    dd.classList.remove('open');
    btn.classList.remove('dropdown-open');
  } else {
    dd.classList.add('open');
    btn.classList.add('dropdown-open');
  }
}
function selectSendMode(mode) {
  const label = document.getElementById('sm-sending-now-label');
  const checkNow = document.getElementById('sm-check-now');
  const checkLater = document.getElementById('sm-check-later');
  if (mode === 'now') {
    label.textContent = 'Sending now';
    checkNow.style.opacity = '1';
    checkLater.style.opacity = '0';
  } else {
    label.textContent = 'Schedule for later';
    checkNow.style.opacity = '0';
    checkLater.style.opacity = '1';
  }
  document.getElementById('sm-send-dropdown').classList.remove('open');
  document.getElementById('sm-sending-now-btn').classList.remove('dropdown-open');
}
// Close dropdown when clicking outside
document.addEventListener('click', function() {
  const dd = document.getElementById('sm-send-dropdown');
  const btn = document.getElementById('sm-sending-now-btn');
  if (dd) { dd.classList.remove('open'); }
  if (btn) { btn.classList.remove('dropdown-open'); }
});

function openBeneSheet() {
  document.getElementById('bene-sheet-scrim').classList.add('open');
  document.getElementById('bene-sheet').classList.add('open');
}
function closeBeneSheet() {
  document.getElementById('bene-sheet-scrim').classList.remove('open');
  document.getElementById('bene-sheet').classList.remove('open');
}

function smCloseAll() {
  // Dismiss the entire send money journey and return to the originating screen.
  closeBeneSheet();
  // Park all SM screens off-screen
  ['sm-landing','sm-amount','sm-review','sm-progress','sm-success'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transition    = '';
    el.style.opacity       = '';
    el.style.pointerEvents = '';
    el.className = 'screen hb';
  });
  // Return to wherever the user was before Pay
  const origin = document.getElementById(smOrigin);
  if (origin) origin.className = 'screen on';
  setSbLight(smOrigin === 'explore');
  showNav(true);
  setNavActive(smOrigin === 'explore' ? 3 : smOrigin === 'accounts' ? 2 : 0);
}

/* ── Render sm-landing bubbles from BENS ── */
function renderSmLBubbles() {
  var wrap = document.getElementById('smLBubbles');
  if (!wrap || typeof BENS === 'undefined') return;
  wrap.innerHTML = '';

  // 2 large (108px) + 4 small (64px), positions match original layout
  var POSITIONS = [
    { size:108, left:192, top:268 },
    { size:108, left:0,   top:47  },
    { size:64,  left:22,  top:269 },
    { size:64,  left:157, top:0   },
    { size:64,  left:241, top:106 },
    { size:64,  left:115, top:172 },
  ];

  // Use first 6 BENS (non-corporate preferred for large slots)
  var people = BENS.filter(function(b) { return !b.corp; });
  var corps  = BENS.filter(function(b) { return b.corp; });
  var ordered = people.concat(corps).slice(0, POSITIONS.length);

  ordered.forEach(function(b, i) {
    var pos  = POSITIONS[i];
    var size = pos.size;
    var isUS = Object.keys(b.rails).length === 1 && b.rails['US Bank'];
    var rail = b.rails[Object.keys(b.rails)[0]];
    // Build account string: UPI ID → show UPI ID; Bank → show acct no · bank name
    var railName = Object.keys(b.rails)[0];
    var acctStr = '';
    if (rail && rail.rows) {
      var upiRow  = rail.rows.find(function(r){ return r[0]==='UPI ID'; });
      var acctRow = rail.rows.find(function(r){ return r[0].toLowerCase().includes('account no'); });
      var bankRow = rail.rows.find(function(r){ return r[0]==='Bank'; });
      if (upiRow)        acctStr = upiRow[1];
      else if (acctRow)  acctStr = acctRow[1] + (bankRow ? ' · ' + bankRow[1] : '');
    }
    var photo = b.photo || 'assets/blob-purple-v2.png';
    var inset = size >= 80 ? '4px' : '2px';
    var fs = Math.round(size * 0.31);

    var bubble = document.createElement('div');
    bubble.className = 'sm-l-bubble';
    bubble.style.cssText = 'left:' + pos.left + 'px;top:' + pos.top + 'px';

    // onclick: US → smwOpen, India/UPI → smGoToAmount
    bubble.onclick = (function(ben, usOnly, str) {
      return function() {
        if (usOnly) {
          var bankName = (ben.rails['US Bank'].rows.find(function(r){ return r[0]==='Bank'; }) || ['',''])[1];
          var acctNo   = (ben.rails['US Bank'].rows.find(function(r){ return r[0].includes('Account no'); }) || ['',''])[1];
          smwOpen(ben.name, ben.ini, ben.bg, acctNo, bankName, bubble);
        } else {
          smGoToAmount(ben.name, ben.ini, ben.bg, str, bubble);
        }
      };
    })(b, isUS, acctStr);

    // Avatar
    var av = document.createElement('div');
    av.className = 'sm-l-av';
    av.style.cssText = 'width:' + size + 'px;height:' + size + 'px;background:rgba(255,255,255,0.12)';
    var ph = document.createElement('img');
    ph.className = 'sm-l-av-photo'; ph.src = photo; ph.alt = '';
    av.appendChild(ph);
    var glass = document.createElement('div');
    glass.className = 'sm-l-av-glass';
    glass.style.cssText = 'inset:' + inset + ';background:rgba(255,255,255,0.1);border:0.3px solid white;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)';
    av.appendChild(glass);
    var txt = document.createElement('span');
    txt.className = 'sm-l-av-txt';
    txt.style.cssText = 'font-size:' + fs + 'px;letter-spacing:-' + (fs*0.05).toFixed(1) + 'px;font-weight:600;line-height:' + Math.round(fs*1.25) + 'px';
    txt.textContent = b.ini;
    av.appendChild(txt);

    var nm = document.createElement('span');
    nm.className = 'sm-l-name';
    nm.textContent = b.alias;

    bubble.appendChild(av);
    bubble.appendChild(nm);
    wrap.appendChild(bubble);
  });
}

function showSendMoney(from) {
  smOrigin = from || _smOrigin || 'home';
  renderSmLBubbles();
  ['home','accounts','explore'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'screen hb';
  });
  const list = document.getElementById('list');
  if (list) list.className = 'screen hr';
  document.getElementById('sm-landing').className = 'screen on';
  setSbLight(false);
  showNav(false);
}

function smBack(from) {
  // If review was reached from US flow, back goes to smw-amount
  const smwActive = document.getElementById('smw-amount').className === 'screen hl';
  const prev = {
    'sm-amount':'sm-landing',
    'sm-review': smwActive ? 'smw-amount' : 'sm-amount',
    'sm-progress':'sm-review'
  };
  if (from === 'sm-landing') {
    closeBeneSheet();
    document.getElementById('sm-landing').className = 'screen hb';
    ['home','accounts','explore'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = 'screen hb';
    });
    const list = document.getElementById('list');
    if (list) list.className = 'screen hr';
    document.getElementById(smOrigin).className = 'screen on';
    setSbLight(smOrigin === 'explore');
    showNav(true);
    setNavActive(smOrigin === 'explore' ? 3 : smOrigin === 'accounts' ? 2 : 0);
  } else {
    document.getElementById(from).className = 'screen hr';
    var prevId = prev[from];
    var prevEl = document.getElementById(prevId);
    // Clear any inline transition/opacity set during blob-first entry
    prevEl.style.transition    = '';
    prevEl.style.transform     = '';
    prevEl.style.opacity       = '';
    prevEl.style.pointerEvents = '';
    prevEl.className = 'screen on';
  }
}

/* ── Hero blob transition: animate the clicked bubble to the avatar slot ── */
function animateHeroBlob(blobEl, destAvatarId, doTransition, destOpts) {
  var phone = document.querySelector('.phone');
  var avEl  = blobEl.querySelector('.sm-l-av');
  if (!avEl) { doTransition(); return; }

  // 1. Source position via offsetParent traversal — immune to CSS transitions
  var srcLeft = 0, srcTop = 0, el = avEl;
  while (el && el !== phone) {
    srcLeft += el.offsetLeft;
    srcTop  += el.offsetTop;
    el = el.offsetParent;
  }
  var srcSize = avEl.offsetWidth;

  // 2. Destination — fixed from the prototype's 393px layout:
  //    Header (56+44+12=112px) + card margin(8) + card padding(4) + recip padding(16) = 140px top
  //    Avatar 32px wide, horizontally centred in 393px phone → left = (393−32)/2 = 180.5px
  var destLeft = (destOpts && destOpts.left != null) ? destOpts.left : 180.5;
  var destTop  = (destOpts && destOpts.top  != null) ? destOpts.top  : 140;
  var destSize = (destOpts && destOpts.size != null) ? destOpts.size : 32;
  var scaleDest = destSize / srcSize;

  // 3. Clone the source av at its natural size; we'll move it purely via
  //    transform: translate + scale — no left/top changes after placement.
  //    This keeps the animation on the GPU compositor thread (no layout).
  var dx = destLeft - srcLeft;
  var dy = destTop  - srcTop;

  var clone = avEl.cloneNode(true);
  clone.style.cssText = [
    'position:absolute',
    'z-index:200',
    'left:' + srcLeft + 'px',
    'top:'  + srcTop  + 'px',
    'width:' + srcSize + 'px',
    'height:' + srcSize + 'px',
    'pointer-events:none',
    'transform-origin:0 0',
    'transform:translate(0,0) scale(1)',
    'will-change:transform',
    'flex-shrink:0'
  ].join(';');
  phone.appendChild(clone);

  // 4. Run screen transition & hide the real destination avatar until clone arrives
  var destEl = document.getElementById(destAvatarId);
  doTransition();
  destEl.style.opacity = '0';

  // 5. Kick off the blob flight on the next two frames (double-rAF ensures one paint
  //    happens at the initial position before the transition fires).
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      clone.style.transition = 'transform 0.54s cubic-bezier(0.16,1,0.3,1)';
      clone.style.transform  = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scaleDest + ')';
    });
  });

  // 6. Clean up: swap clone for the real avatar
  setTimeout(function() {
    destEl.style.opacity = '';
    clone.remove();
  }, 580);
}

function smGoToAmount(name, initials, bg, account, blobEl) {
  smRecipient = { name, initials, bg: bg||'linear-gradient(135deg,#46882b,#2d5a16)', account: account||'••7654 · HDFC Bank' };
  smCents = 100000; // pre-fill $1,000.00
  smCurrencyFlipped = false;
  smInrPaise = 0;
  document.getElementById('sm-amount').querySelector('.sm2-amount-section').classList.remove('flipped');
  const switchBtn = document.getElementById('smSwitchBtn');
  if (switchBtn) switchBtn.classList.remove('flipped');
  // Update recipient UI — background matches landing bubble style (semi-transparent white)
  document.getElementById('smRecipientName').textContent     = name;
  document.getElementById('smRecipientInitials').textContent = initials;
  document.getElementById('smRecipientAvatar').style.background = 'rgba(255,255,255,0.4)';
  document.getElementById('smRecipientSub').textContent      = account;
  // Copy the blob's photo to both amount + review avatars
  var destPhoto = document.querySelector('#smRecipientAvatar .sm2-mini-av-photo');
  var srcPhoto  = blobEl ? blobEl.querySelector('.sm-l-av-photo') : null;
  if (destPhoto) {
    if (srcPhoto) destPhoto.src = srcPhoto.src;
    destPhoto.style.display = '';
  }
  var revPhoto = document.getElementById('smReviewAvPhoto');
  if (revPhoto && srcPhoto) revPhoto.src = srcPhoto.src;
  smUpdateAmount();

  var amountEl  = document.getElementById('sm-amount');
  var landingEl = document.getElementById('sm-landing');

  if (blobEl) {
    // ── Blob-first entry ───────────────────────────────────────
    // Step 1: position sm-amount at rest (no slide) but hide all content
    // so the screen is transparent while the blob is in flight.
    var doSwitch = function() {
      // Suppress the .screen slide transition so sm-amount snaps instantly to
      // position 0 instead of sliding in from the right.
      amountEl.style.transition = 'none';
      amountEl.className = 'screen on sma-entering';
      // Re-enable transitions on the next frame (after the snap has painted)
      requestAnimationFrame(function() { amountEl.style.transition = ''; });

      // Slide sm-landing upward as blob travels — beneBG flies out the top
      landingEl.style.transition    = 'transform 0.54s cubic-bezier(0.16,1,0.3,1), opacity 0.46s ease';
      landingEl.style.transform     = 'translateY(-22%)';
      landingEl.style.opacity       = '0';
      landingEl.style.pointerEvents = 'none';
    };

    animateHeroBlob(blobEl, 'smRecipientAvatar', doSwitch);

    // Step 2: fire sma-ready 10ms BEFORE the animateHeroBlob cleanup (t=580ms).
    // With smaCardReveal having no opacity, the card snaps visible instantly at t=570ms.
    // The avatar (destEl) is therefore already at its natural position when the
    // clone is removed 10ms later — no swap gap.
    setTimeout(function() {
      amountEl.classList.remove('sma-entering');
      amountEl.classList.add('sma-ready');

      // Park sm-landing — clear inline transform/opacity, snap to hl
      landingEl.style.transition    = 'none';
      landingEl.style.transform     = '';
      landingEl.style.opacity       = '';
      landingEl.style.pointerEvents = '';
      landingEl.className           = 'screen hl';
      requestAnimationFrame(function() {
        landingEl.style.transition = '';
      });
    }, 570);

  } else {
    // ── No blob (e.g. came from the beneficiary sheet) ─────────
    landingEl.className = 'screen hl';
    amountEl.className  = 'screen on';
  }
}

function smUpdateAmount() {
  let usdInt, usdDec, inrInt, inrDec, hasAmount;

  if (smCurrencyFlipped) {
    // INR is the input currency
    const inrRupees  = smInrPaise / 100;
    const dollars    = inrRupees / SM_EXRATE;
    const inrFrac    = smInrPaise % 100;
    inrInt  = Math.floor(inrRupees).toLocaleString('en-IN');
    inrDec  = '.' + String(inrFrac).padStart(2,'0');
    usdInt  = Math.floor(dollars).toLocaleString('en-US');
    usdDec  = '.' + String(Math.round((dollars % 1) * 100)).padStart(2,'0');
    hasAmount = smInrPaise > 0;
    // Keep smCents in sync for downstream (review screen etc.)
    smCents = Math.round(dollars * 100);
  } else {
    // USD is the input currency
    const dollars  = smCents / 100;
    const inr      = dollars * SM_EXRATE;
    const fracPart = smCents % 100;
    usdInt  = Math.floor(dollars).toLocaleString('en-US');
    usdDec  = '.' + String(fracPart).padStart(2,'0');
    inrInt  = Math.round(inr).toLocaleString('en-IN');
    inrDec  = '.00';
    hasAmount = smCents > 0;
    // Keep smInrPaise in sync
    smInrPaise = Math.round(inr * 100);
  }

  document.getElementById('smAmountInt').textContent    = usdInt;
  document.getElementById('smAmountDec').textContent    = usdDec;
  document.getElementById('smAmountInrInt').textContent = inrInt;
  document.getElementById('smAmountInrDec').textContent = inrDec;

  const btn = document.getElementById('smSendBtn');
  btn.disabled = !hasAmount;
  if (hasAmount) {
    btn.innerHTML = 'Review payment <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  } else {
    btn.textContent = 'Enter an amount';
  }
}

function smKey(k) {
  if (smCurrencyFlipped) {
    if (k === 'del') {
      smInrPaise = Math.floor(smInrPaise / 10);
    } else if (k !== '.') {
      if (smInrPaise < 1000000000) { // cap at ₹1 crore
        smInrPaise = smInrPaise * 10 + parseInt(k);
      }
    }
  } else {
    if (k === 'del') {
      smCents = Math.floor(smCents / 10);
    } else if (k !== '.') {
      if (smCents < 10000000) { // cap at $100,000
        smCents = smCents * 10 + parseInt(k);
      }
    }
  }
  smUpdateAmount();
}

var smSwitching = false;
function smSwitchCurrency() {
  if (smSwitching) return;
  smSwitching = true;

  const section = document.getElementById('sm-amount').querySelector('.sm2-amount-section');
  const usdRow  = section.querySelector('.sm2-usd');
  const inrRow  = section.querySelector('.sm2-inr');

  // Before toggling: current top exits up, current bottom enters from below
  const exitEl  = smCurrencyFlipped ? inrRow : usdRow;
  const enterEl = smCurrencyFlipped ? usdRow : inrRow;

  smCurrencyFlipped = !smCurrencyFlipped;

  // Sync the non-input variable so amounts stay consistent
  if (smCurrencyFlipped) {
    smInrPaise = Math.round((smCents / 100) * SM_EXRATE * 100);
  } else {
    smCents = Math.round((smInrPaise / 100) / SM_EXRATE * 100);
  }

  // Rotate the switch arrow immediately (animates during the exit phase)
  document.getElementById('smSwitchBtn').classList.toggle('flipped', smCurrencyFlipped);

  // Phase 1 — both rows exit in opposite directions simultaneously:
  //   primary (top) fades upward, secondary (bottom) fades downward
  exitEl.style.transition  = 'opacity 0.15s ease, transform 0.15s ease';
  exitEl.style.opacity     = '0';
  exitEl.style.transform   = 'translateY(-12px)';

  enterEl.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
  enterEl.style.opacity    = '0';
  enterEl.style.transform  = 'translateY(12px)';

  // Phase 2 — flip layout, then both rows enter from their new directions:
  //   new primary (was bottom) slides in from below, new secondary (was top) drops in from above
  setTimeout(function() {
    section.classList.toggle('flipped', smCurrencyFlipped);
    smUpdateAmount();

    // Snap both to their entry start positions (still invisible)
    exitEl.style.transition  = 'none';
    exitEl.style.opacity     = '0';
    exitEl.style.transform   = 'translateY(-12px)'; // new secondary enters from above

    enterEl.style.transition = 'none';
    enterEl.style.opacity    = '0';
    enterEl.style.transform  = 'translateY(12px)';  // new primary enters from below

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        const ease = 'opacity 0.26s ease, transform 0.30s cubic-bezier(0.16,1,0.3,1)';
        exitEl.style.transition  = ease;
        exitEl.style.opacity     = '1';
        exitEl.style.transform   = '';

        enterEl.style.transition = ease;
        enterEl.style.opacity    = '1';
        enterEl.style.transform  = '';

        setTimeout(function() {
          exitEl.style.transition  = '';  exitEl.style.opacity  = '';  exitEl.style.transform  = '';
          enterEl.style.transition = ''; enterEl.style.opacity = ''; enterEl.style.transform = '';
          smSwitching = false;
        }, 320);
      });
    });
  }, 160);
}

function smGoToReview() {
  if (smCents === 0) return;
  const dollars = smCents / 100;
  const inr     = Math.round(dollars * SM_EXRATE);
  const fmtD    = dollars.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const fmtINR  = inr.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });

  const firstName = smRecipient.name.split(' ')[0];
  document.getElementById('smReviewSending').textContent       = '$' + fmtD;
  document.getElementById('smReviewReceives').textContent      = '₹' + fmtINR;
  document.getElementById('smReviewRecipientName').textContent = smRecipient.name;
  document.getElementById('smReviewRecipName2').textContent    = firstName;
  document.getElementById('smReviewRecipInitials').textContent = smRecipient.initials || firstName.slice(0,2).toUpperCase();
  const acctParts = (smRecipient.account || '').split('·');
  document.getElementById('smReviewRecipAcct').textContent  = (acctParts[0] || '').trim();
  document.getElementById('smReviewRecipBank').textContent  = (acctParts[1] || '').trim();
  // Hide dot when there is no bank detail to show
  var dot = document.querySelector('.smr-recip-dot');
  if (dot) dot.style.display = (acctParts[1] || '').trim() ? '' : 'none';
  document.getElementById('smReviewAvatar').style.background = 'rgba(255,255,255,0.4)';

  var amountEl = document.getElementById('sm-amount');
  var reviewEl = document.getElementById('sm-review');
  var amtCard  = document.querySelector('.sm2-card');
  var revCard  = document.querySelector('.smr-card');

  // Amount screen elements to animate OUT
  var keypad     = amountEl.querySelector('.sm2-keypad');
  var sendBtn    = amountEl.querySelector('.sm2-send-btn');
  var accountRow = amountEl.querySelector('.sm2-account-row');
  var amtSection = amountEl.querySelector('.sm2-amount-section');
  var tagArea    = amountEl.querySelector('.smw-tag-area');

  // Review screen elements to animate IN
  var revCard    = reviewEl.querySelector('.smr-card');
  var revAmounts = reviewEl.querySelector('.smr-amounts');
  var revPurpose = reviewEl.querySelector('.smr-purpose');
  var revBottom  = reviewEl.querySelector('.smr-bottom');

  var spring = 'cubic-bezier(0.16,1,0.3,1)';

  // ── Initial state: snap review on top, hide its content ──
  reviewEl.style.cssText = 'transition:none;opacity:1;z-index:3';
  reviewEl.className = 'screen on';

  // Instantly hide amount card (no transition) so only smr-card frame is visible — no double-stack flash
  amtCard.style.cssText = 'transition:none;opacity:0';
  // Review card frame: immediately visible, same appearance as sm2-card
  revCard.style.cssText = 'transition:none;opacity:1';
  // Review amounts wrapper: visible immediately so bg gradient stays constant
  // Only the children start hidden/offset
  if (revAmounts) {
    revAmounts.style.cssText = 'transition:none;opacity:1';
    Array.from(revAmounts.children).forEach(function(c) {
      c.style.cssText = 'transition:none;opacity:0;transform:translateY(50px)';
    });
  }
  if (revPurpose) revPurpose.style.cssText = 'transition:none;opacity:0;transform:translateY(50px)';
  if (revBottom)  revBottom.style.cssText  = 'transition:none;opacity:0;transform:translateY(70px)';

  // OUT exits fire IMMEDIATELY on tap — no RAF delay so keypad is already gone
  keypad.style.cssText     = 'transition:opacity 0.10s ease,transform 0.13s cubic-bezier(0.4,0,1,1);opacity:0;transform:translateY(260px)';
  sendBtn.style.cssText    = 'transition:opacity 0.08s ease,transform 0.10s cubic-bezier(0.4,0,1,1);opacity:0;transform:translateY(60px)';
  accountRow.style.cssText = 'transition:opacity 0.08s ease;opacity:0';
  Array.from(amtSection.children).forEach(function(c) {
    c.style.cssText = 'transition:opacity 0.08s ease;opacity:0';
  });
  tagArea.style.cssText    = 'transition:opacity 0.08s ease;opacity:0';

  // ── Animate IN (deferred one RAF for layout settle) ──────
  requestAnimationFrame(function() { requestAnimationFrame(function() {

    // IN: amounts children slide up — delayed past keypad exit (0.16s)
    if (revAmounts) {
      Array.from(revAmounts.children).forEach(function(c, i) {
        var d = (0.16 + i * 0.04).toFixed(2) + 's';
        c.style.cssText = 'transition:opacity 0.3s ease ' + d + ',transform 0.4s ' + spring + ' ' + d + ';opacity:1;transform:translateY(0)';
      });
    }
    // IN: purpose slides up slightly after
    if (revPurpose) revPurpose.style.cssText = 'transition:opacity 0.3s ease 0.24s,transform 0.4s '  + spring + ' 0.24s;opacity:1;transform:translateY(0)';
    // IN: bottom buttons slide up from below screen
    if (revBottom)  revBottom.style.cssText  = 'transition:opacity 0.3s ease 0.26s,transform 0.42s ' + spring + ' 0.26s;opacity:1;transform:translateY(0)';

  }); });

  // ── Cleanup after animation completes ────────────────────
  setTimeout(function() {
    reviewEl.style.cssText    = '';
    reviewEl.style.zIndex     = '';
    amountEl.style.transition = 'none';
    amountEl.className        = 'screen hl';
    [keypad, sendBtn, accountRow, tagArea, amtCard,
     revCard, revAmounts, revPurpose, revBottom].forEach(function(el) {
      if (el) el.style.cssText = '';
    });
    // Clean up child-level styles
    if (amtSection) Array.from(amtSection.children).forEach(function(c) { c.style.cssText = ''; });
    if (revAmounts) Array.from(revAmounts.children).forEach(function(c) { c.style.cssText = ''; });
    requestAnimationFrame(function() { amountEl.style.transition = ''; });
  }, 650);
}

/* ── Within US send money ─────────────────────────────── */
let smwCents = 100000; // $1,000.00

function smwOpen(name, initials, bg, acct, bank, blobEl) {
  smRecipient = { name, initials, bg, account: acct + ' · ' + bank };
  smwCents = 100000;

  document.getElementById('smwInitials').textContent    = initials;
  document.getElementById('smwName').textContent        = name;
  document.getElementById('smwAcct').textContent        = acct;
  document.getElementById('smwBank').textContent        = bank;
  document.getElementById('smwAvatar').style.background = 'rgba(255,255,255,0.4)';

  // Mirror the photo from whichever bubble was tapped
  if (blobEl) {
    const srcPhoto  = blobEl.querySelector('.sm-l-av-photo');
    const destPhoto = document.querySelector('#smwAvatar .smw-av-photo');
    if (srcPhoto && destPhoto) destPhoto.src = srcPhoto.src;
  }

  smwUpdateDisplay();

  var smwEl     = document.getElementById('smw-amount');
  var landingEl = document.getElementById('sm-landing');

  if (blobEl) {
    var doSwitch = function() {
      smwEl.style.transition = 'none';
      smwEl.className = 'screen on smwa-entering';
      requestAnimationFrame(function() { smwEl.style.transition = ''; });

      landingEl.style.transition    = 'transform 0.54s cubic-bezier(0.16,1,0.3,1), opacity 0.46s ease';
      landingEl.style.transform     = 'translateY(-22%)';
      landingEl.style.opacity       = '0';
      landingEl.style.pointerEvents = 'none';
    };

    // smwAvatar is 8px higher than smRecipientAvatar (no card margin-top)
    animateHeroBlob(blobEl, 'smwAvatar', doSwitch, { top: 132 });

    setTimeout(function() {
      smwEl.classList.remove('smwa-entering');
      smwEl.classList.add('smwa-ready');

      landingEl.style.transition    = 'none';
      landingEl.style.transform     = '';
      landingEl.style.opacity       = '';
      landingEl.style.pointerEvents = '';
      landingEl.className           = 'screen hb';
      requestAnimationFrame(function() { landingEl.style.transition = ''; });
    }, 570);

  } else {
    ['home','accounts','explore','list','sm-landing','sm-amount'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = 'screen hl';
    });
    smwEl.className = 'screen on';
    setSbLight(false);
  }
}

function smwUpdateDisplay() {
  const intPart = Math.floor(smwCents / 100).toLocaleString('en-US');
  const decPart = '.' + String(smwCents % 100).padStart(2, '0');
  document.getElementById('smwAmtInt').textContent = intPart;
  document.getElementById('smwAmtDec').textContent = decPart;
  const smwBtn = document.getElementById('smwSendBtn');
  smwBtn.disabled = smwCents === 0;
  if (smwCents > 0) {
    smwBtn.innerHTML = 'Review payment <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  } else {
    smwBtn.textContent = 'Enter an amount';
  }
}

function smwKey(k) {
  if (k === 'del') {
    smwCents = Math.floor(smwCents / 10);
  } else if (k !== '.') {
    if (smwCents < 10000000) smwCents = smwCents * 10 + parseInt(k);
  }
  smwUpdateDisplay();
}

function smwBack() {
  document.getElementById('smw-amount').className = 'screen hr';
  document.getElementById('sm-landing').className = 'screen on';
  setSbLight(false);
}

function smwClose() {
  ['smw-amount','sm-landing','sm-amount','sm-review','sm-progress','sm-success','smw-us-progress','smw-us-success'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'screen hr';
  });
  if (smOrigin === 'home')         showHome();
  else if (smOrigin === 'explore') showExplore();
  else showList();
}

function smwGoToReview() {
  // US flow skips the review screen — goes straight to in-progress
  if (smwCents === 0) return;
  const dollars = smwCents / 100;
  const fmtD    = dollars.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const intPart = Math.floor(dollars).toLocaleString('en-US');
  const decPart = '.' + String(Math.round((dollars % 1) * 100)).padStart(2, '0');
  const firstName = smRecipient.name.split(' ')[0];
  const acctParts = (smRecipient.account || '').split('·');
  const acct = (acctParts[0] || '').trim();
  const bank = (acctParts[1] || '').trim();

  // Populate progress screen
  document.getElementById('smwpInt').textContent       = intPart;
  document.getElementById('smwpDec').textContent       = decPart;
  document.getElementById('smwpRecipStep').textContent = 'Funds in ' + firstName + "'s account";
  document.getElementById('smwpRecip').textContent     = smRecipient.name;
  document.getElementById('smwpPaidTo').innerHTML      = acct + '<br>(' + bank + ')';
  document.getElementById('smwpAmt').textContent       = '$' + fmtD;

  // Populate success screen
  document.getElementById('smwsInt').textContent      = intPart;
  document.getElementById('smwsDec').textContent      = decPart;
  // Rohan receives = amount - $10 fee
  const receives = Math.max(0, dollars - 10).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  document.getElementById('smwsReceives').textContent = '$' + receives;
  document.getElementById('smwsPaidTo').innerHTML     = smRecipient.name + '<br>' + acct + ' (' + bank + ')';

  // smCents sync
  smCents = smwCents;

  document.getElementById('smw-amount').className      = 'screen hl';
  document.getElementById('smw-us-progress').className = 'screen on';
}

function smwGoToSuccess() {
  var dollars = smwCents / 100;
  var intPart = Math.floor(dollars).toLocaleString('en-US');
  var decPart = '.' + String(Math.round((dollars%1)*100)).padStart(2,'0');
  var fmtD = dollars.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  var firstName = smRecipient.name.split(' ')[0];
  document.getElementById('smwsInt').textContent = intPart;
  document.getElementById('smwsDec').textContent = decPart;
  document.getElementById('smwsAmt').textContent = '$'+fmtD;
  document.getElementById('smwsReceives').textContent = '$'+fmtD;
  document.getElementById('smwsRecipStep').textContent = 'Funds in '+firstName+"'s account";
  var paidTo = document.getElementById('smwsPaidTo');
  if (paidTo) paidTo.textContent = smRecipient.name;
  var subEl = document.getElementById('smwsRecipSub');
  if (subEl) subEl.textContent = firstName + ' has received the money in their account.';

  var reviewEl  = document.getElementById('smw-us-progress');
  var successEl = document.getElementById('smw-us-success');
  var prgCard   = reviewEl.querySelector('.smp-card');
  var sucCard   = successEl.querySelector('.smp-card');
  var spring    = 'cubic-bezier(0.16,1,0.3,1)';
  successEl.style.cssText='transition:none;opacity:1;z-index:3';
  successEl.className='screen on';
  if(prgCard) prgCard.style.cssText='transition:none;opacity:0';
  var sucSections = sucCard ? sucCard.querySelectorAll('.smp-sec-status,.smp-sec-txn') : [];
  var sucBottom = successEl.querySelector('.sms-bottom');
  sucSections.forEach(function(el){el.style.cssText='transition:none;opacity:0;transform:translateY(20px)';});
  if(sucBottom) sucBottom.style.cssText='transition:none;opacity:0;transform:translateY(40px)';
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    sucSections.forEach(function(el,i){el.style.cssText='transition:opacity 0.28s ease '+(0.10+i*0.06)+'s,transform 0.36s '+spring+' '+(0.10+i*0.06)+'s;opacity:1;transform:translateY(0)';});
    if(sucBottom) sucBottom.style.cssText='transition:opacity 0.28s ease 0.22s,transform 0.38s '+spring+' 0.22s;opacity:1;transform:translateY(0)';
  });});
  setTimeout(function(){
    successEl.style.cssText=''; reviewEl.className='screen hl';
    if(prgCard) prgCard.style.cssText='';
    sucSections.forEach(function(el){el.style.cssText='';});
    if(sucBottom) sucBottom.style.cssText='';
    // Reset progress screen coin
    var coin=document.getElementById('smwpCoin'); if(coin) coin.style.cssText='';
    var icon=document.getElementById('smwpResultIcon'); if(icon){icon.className='smp-result-icon';icon.innerHTML='';}
    var hero=document.getElementById('smwpHero'); if(hero) hero.classList.remove('success-anim');
    document.querySelectorAll('#smwpBottom .smp-sim-btn').forEach(function(b){b.disabled=false;b.style.display='';});
    var doneBtn=document.querySelector('#smwpBottom .smp-done-btn'); if(doneBtn) doneBtn.onclick=function(){smwGoToSuccess();};
  }, 550);
}

function smwSimulateSuccess() {
  var btns = document.querySelectorAll('#smwpBottom .smp-sim-btn');
  btns.forEach(function(b){b.disabled=true;});
  var coin=document.getElementById('smwpCoin');
  var icon=document.getElementById('smwpResultIcon');
  var hero=document.getElementById('smwpHero');
  if(coin){coin.style.transition='transform 0.28s var(--ease-spring),opacity 0.22s ease';coin.style.transform='rotateY(90deg) scale(0.6)';coin.style.opacity='0';}
  if(hero) hero.classList.add('success-anim');
  setTimeout(function(){
    if(icon){icon.className='smp-result-icon success';icon.innerHTML='<img src="assets/check-success.webp" alt="Success">';requestAnimationFrame(function(){requestAnimationFrame(function(){icon.classList.add('visible');});});}
    var lbl=document.getElementById('smwpHeroLbl'); if(lbl){lbl.style.color='var(--brand-primary)';lbl.textContent='Successfully transferred';}
    document.querySelectorAll('#smwpBottom .smp-sim-btn').forEach(function(b){b.style.display='none';});
    var doneBtn=document.querySelector('#smwpBottom .smp-done-btn'); if(doneBtn) doneBtn.onclick=function(){smwGoToSuccess();};
  }, 600);
  setTimeout(smwGoToSuccess, 2000);
}

function smwSimulateFailure() {
  document.querySelectorAll('#smwpBottom .smp-sim-btn').forEach(function(b){b.disabled=true;});
  var coin=document.getElementById('smwpCoin');
  var icon=document.getElementById('smwpResultIcon');
  if(coin){coin.style.transition='transform 0.28s var(--ease-spring),opacity 0.22s ease';coin.style.transform='rotateY(90deg) scale(0.6)';coin.style.opacity='0';}
  setTimeout(function(){
    if(icon){icon.className='smp-result-icon failure';icon.innerHTML='<svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>';requestAnimationFrame(function(){requestAnimationFrame(function(){icon.classList.add('visible');});});}
  }, 180);
  setTimeout(smwClose, 1800);
}

function smwShareSuccess() {
  // Build a fake tx object for the share sheet
  const dollars = smwCents / 100;
  const intDollars = Math.floor(dollars);
  const cents = Math.round((dollars % 1) * 100);
  const fakeTx = {
    isCredit: false,
    status: 'completed',
    amt: [intDollars, cents],
    av: { ds: 'person', initials: smRecipient.initials, bg: smRecipient.bg || 'linear-gradient(135deg,#7c3aed,#5b21b6)' },
    merchant: smRecipient.name,
  };
  openShareSheet(fakeTx);
}

/* ── Animate hero coin to result icon ── */
function smpShowResult(type) {
  var coin = document.getElementById('smpCoin');
  var icon = document.getElementById('smpResultIcon');
  if (!coin || !icon) return;
  // Spin out the coin
  coin.style.animation = 'none';
  coin.style.transition = 'transform 0.28s var(--ease-spring), opacity 0.22s ease';
  coin.style.transform = 'rotateY(90deg) scale(0.6)';
  coin.style.opacity = '0';
  // Show result icon
  setTimeout(function() {
    icon.className = 'smp-result-icon ' + type;
    icon.innerHTML = type === 'success'
      ? '<img src="assets/check-success.webp" alt="Success">'
      : '<svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { icon.classList.add('visible'); });
    });
  }, 180);
}

/* ── Simulate success: step through stepper states then go to success screen ── */
function smpSimulateSuccess() {
  var btn = document.querySelector('.smp-sim-btn:not(.fail)');
  if (btn) { btn.disabled = true; btn.textContent = 'Running…'; }
  document.querySelector('.smp-sim-btn.fail') && (document.querySelector('.smp-sim-btn.fail').disabled = true);

  // State 1→2: step 2 done, step 3 active
  setTimeout(function() {
    var s1 = document.querySelector('#sm-progress .smp-stepper-s1');
    var s2 = document.querySelector('#sm-progress .smp-stepper-s2');
    if (!s1 || !s2) return;
    s1.style.opacity = '0'; s1.style.transform = 'translateY(-6px)'; s1.style.pointerEvents = 'none';
    s2.style.opacity = '1'; s2.style.transform = 'translateY(0)'; s2.style.pointerEvents = 'all';
    s2.classList.add('smp-state-active');
  }, 800);

  // State 2→3: step 3 done, step 4 final (funds arrived)
  setTimeout(function() {
    var s2 = document.querySelector('#sm-progress .smp-stepper-s2');
    var s3 = document.querySelector('#sm-progress .smp-stepper-s3');
    if (!s2 || !s3) return;
    s2.style.opacity = '0'; s2.style.transform = 'translateY(-6px)'; s2.style.pointerEvents = 'none';
    s3.style.opacity = '1'; s3.style.transform = 'translateY(0)'; s3.style.pointerEvents = 'all';
    s3.classList.add('smp-state-active');
  }, 1600);

  // Coin → check (only after all steps complete)
  setTimeout(function() { smpShowResult('success'); }, 2400);

  // Animate hero: blue slides UP, green slides DOWN — after coin shows
  setTimeout(function() {
    var hero = document.getElementById('smpHero');
    if (hero) hero.classList.add('success-anim');
    // Update text after bg transition
    setTimeout(function() {
      var lbl = document.querySelector('#sm-progress .smp-hero-lbl');
      if (lbl) { lbl.style.color = 'var(--brand-primary)'; lbl.textContent = 'Successfully transferred'; }
      var eta = document.querySelector('#sm-progress .smp-hero-eta');
      if (eta) {
        eta.style.opacity = '0';
        setTimeout(function() {
          eta.innerHTML = '<span class="ico" style="--ico:url(\'Icons/Check.svg\');--sz:12px;color:var(--brand-primary)"></span><span class="smp-hero-eta-txt" style="color:var(--brand-primary)">Completed</span>';
          eta.style.transition = 'opacity 0.3s ease';
          eta.style.opacity = '1';
        }, 200);
      }
    }, 600);
    var doneBtn = document.querySelector('#smpBottom .smp-done-btn');
    if (doneBtn) doneBtn.onclick = function() { smDone(); };
    document.querySelectorAll('.smp-sim-btn').forEach(function(b) { b.style.display = 'none'; });
  }, 3200);
}

/* ── Simulate failure ── */
function smpSimulateFailure() {
  var btn = document.querySelector('.smp-sim-btn.fail');
  if (btn) { btn.disabled = true; btn.textContent = 'Failed…'; }
  document.querySelector('.smp-sim-btn:not(.fail)') && (document.querySelector('.smp-sim-btn:not(.fail)').disabled = true);

  // Coin → cross
  setTimeout(function() { smpShowResult('failure'); }, 600);

  // Back to home after showing the cross
  setTimeout(function() { showHome(); }, 1800);
}

/* Toggle accordion section, closing the other */
function smpToggle(openId, closeId) {
  var openEl  = document.getElementById(openId);
  var closeEl = document.getElementById(closeId);
  if (!openEl) return;
  var isOpen = openEl.classList.contains('smp-acc-open');
  openEl.classList.toggle('smp-acc-open', !isOpen);
  if (!isOpen && closeEl) closeEl.classList.remove('smp-acc-open');
}

function smGoToProgress() {
  const dollars = smCents / 100;
  const intPart = Math.floor(dollars).toLocaleString('en-US');
  const decPart = '.' + String(Math.round((dollars % 1) * 100)).padStart(2,'0');
  const fmtD    = dollars.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const firstName = smRecipient.name.split(' ')[0];

  document.getElementById('smProgressInt').textContent       = intPart;
  document.getElementById('smProgressDec').textContent       = decPart;
  document.getElementById('smProgressAccAmt').textContent    = '$' + fmtD;
  document.getElementById('smProgressRecip').textContent     = smRecipient.name;
  document.getElementById('smProgressAcct').textContent      = smRecipient.account || '••7654 · HDFC Bank';
  document.getElementById('smProgressRecipStep').textContent = 'Funds in ' + firstName + "'s account";
  // Reset progress screen: step-1 state, collapse txn details, restore coin
  document.getElementById('smAccTxn').classList.remove('smp-acc-open');
  var s1 = document.querySelector('#sm-progress .smp-stepper-s1');
  var s2 = document.querySelector('#sm-progress .smp-stepper-s2');
  var s3 = document.querySelector('#sm-progress .smp-stepper-s3');
  // Reset stepper to s1 state (no transition on reset — instantaneous is correct here)
  if (s1) { s1.style.transition = 'none'; s1.style.opacity = '1'; s1.style.transform = ''; s1.style.pointerEvents = ''; }
  if (s2) { s2.style.transition = 'none'; s2.style.opacity = '0'; s2.style.transform = 'translateY(10px)'; s2.style.pointerEvents = 'none'; s2.classList.remove('smp-state-active'); }
  if (s3) { s3.style.transition = 'none'; s3.style.opacity = '0'; s3.style.transform = 'translateY(10px)'; s3.style.pointerEvents = 'none'; s3.classList.remove('smp-state-active'); }
  // Re-enable transitions after reset frame
  requestAnimationFrame(function() {
    if (s1) s1.style.transition = '';
    if (s2) s2.style.transition = '';
    if (s3) s3.style.transition = '';
  });
  // Re-enable sim buttons, restore coin, reset hero
  document.querySelectorAll('.smp-sim-btn').forEach(function(b) { b.disabled = false; b.style.display = ''; });
  document.querySelector('.smp-sim-btn:not(.fail)') && (document.querySelector('.smp-sim-btn:not(.fail)').textContent = 'Simulate success');
  document.querySelector('.smp-sim-btn.fail') && (document.querySelector('.smp-sim-btn.fail').textContent = 'Simulate failure');
  var coin = document.getElementById('smpCoin');
  var icon = document.getElementById('smpResultIcon');
  if (coin) { coin.style.cssText = ''; }
  if (icon) { icon.className = 'smp-result-icon'; icon.innerHTML = ''; }
  // Reset hero background and label
  var hero = document.getElementById('smpHero');
  if (hero) { hero.style.transition = 'none'; hero.classList.remove('success-anim'); }
  var lbl = document.querySelector('#sm-progress .smp-hero-lbl');
  if (lbl) { lbl.style.color = ''; lbl.textContent = 'Transfer in progress'; }
  var eta = document.querySelector('#sm-progress .smp-hero-eta');
  if (eta) { eta.style.opacity = ''; eta.style.transition = ''; }
  var doneBtn = document.querySelector('#smpBottom .smp-done-btn');
  if (doneBtn) doneBtn.onclick = function() { smGoToSuccess(); };

  var reviewEl   = document.getElementById('sm-review');
  var progressEl = document.getElementById('sm-progress');
  var revCard    = document.querySelector('#sm-review .smr-card');
  var prgCard    = document.querySelector('#sm-progress .smp-card');
  var spring     = 'cubic-bezier(0.16,1,0.3,1)';

  // Snap progress on top; card frame instantly visible (same glass appearance)
  progressEl.style.cssText = 'transition:none;opacity:1;z-index:3';
  progressEl.className = 'screen on';
  revCard.style.cssText = 'transition:none;opacity:0';

  // Hide progress card content — reveal after review content fades
  var prgInner = prgCard; // smp-card children are direct
  if (prgInner) {
    Array.from(prgInner.children).forEach(function(c) {
      c.style.cssText = 'transition:none;opacity:0;transform:translateY(20px)';
    });
  }
  var prgBottom = progressEl.querySelector('.smp-bottom');
  if (prgBottom) prgBottom.style.cssText = 'transition:none;opacity:0;transform:translateY(40px)';

  requestAnimationFrame(function() { requestAnimationFrame(function() {
    // Fade review card contents out
    var revInner = revCard ? revCard.querySelector('.smr-card-inner') : revCard;
    if (revInner) Array.from(revInner.children).forEach(function(c) {
      c.style.cssText = 'transition:opacity 0.16s ease;opacity:0';
    });

    // Slide in progress card contents
    if (prgInner) {
      Array.from(prgInner.children).forEach(function(c, i) {
        var d = (0.10 + i * 0.06).toFixed(2) + 's';
        c.style.cssText = 'transition:opacity 0.28s ease '+d+',transform 0.36s '+spring+' '+d+';opacity:1;transform:translateY(0)';
      });
    }
    if (prgBottom) prgBottom.style.cssText = 'transition:opacity 0.28s ease 0.22s,transform 0.38s '+spring+' 0.22s;opacity:1;transform:translateY(0)';
  }); });

  // Clean up: park review off-screen
  setTimeout(function() {
    progressEl.style.cssText = '';
    progressEl.style.zIndex  = '';
    reviewEl.style.transition = 'none';
    reviewEl.className = 'screen hl';
    if (revCard) revCard.style.cssText = '';
    if (prgInner) Array.from(prgInner.children).forEach(function(c) { c.style.cssText = ''; });
    if (prgBottom) prgBottom.style.cssText = '';
    requestAnimationFrame(function() { reviewEl.style.transition = ''; });
  }, 600);
}

function smGoToSuccess() {
  const dollars = smCents / 100;
  const inr     = Math.round(dollars * SM_EXRATE);
  const intPart = Math.floor(dollars).toLocaleString('en-US');
  const decPart = '.' + String(Math.round((dollars % 1) * 100)).padStart(2,'0');
  const fmtD    = dollars.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const firstName = smRecipient.name.split(' ')[0];

  document.getElementById('smSuccessInt').textContent        = intPart;
  document.getElementById('smSuccessDec').textContent        = decPart;
  document.getElementById('smSuccessAmt').textContent        = '$' + fmtD;
  document.getElementById('smSuccessInr').textContent        = '₹' + inr.toLocaleString('en-IN');
  document.getElementById('smSuccessRecip').textContent      = smRecipient.name;
  document.getElementById('smSuccessAcct').textContent       = smRecipient.account || '••7654 · HDFC Bank';
  document.getElementById('smSuccessRecipStep').textContent  = 'Funds in ' + firstName + "'s account";
  var subEl = document.getElementById('smSuccessRecipSub');
  if (subEl) subEl.textContent = firstName + ' has received the money in their ' + (smRecipient.bankShort || 'HDFC Bank') + ' account.';

  document.getElementById('sm-progress').className = 'screen hl';
  document.getElementById('sm-success').className  = 'screen on';
}

function smDone() {
  document.querySelector('.phone').scrollTop = 0;
  SM_SCREENS.forEach(id => document.getElementById(id).className = 'screen hr');
  smCents = 100000;
  document.getElementById('explore').className = 'screen on';
}

/* ── Purpose of payment ─────────────────────────────── */
var _purposeCode = 'P1301';
var _purposeLabel = 'Family & Personal';

const PURPOSE_PROF = [
  { code:'P1006', label:'Business consulting',       sub:'Strategic, management or operational advice' },
  { code:'P1004', label:'Legal services',             sub:'Solicitors, legal counsel or representation' },
  { code:'P1005', label:'Accounting & audit',         sub:'Bookkeeping, audit or tax consulting' },
  { code:'P1007', label:'Advertising & trade fairs',  sub:'Marketing, PR, events or exhibitions' },
  { code:'P1008', label:'R&D services',               sub:'Research, development or innovation work' },
  { code:'P1009', label:'Architecture & engineering', sub:'Design, surveying or technical services' },
  { code:'P0802', label:'Software consulting',        sub:'IT strategy, system design or implementation' },
  { code:'P0803', label:'Data processing',            sub:'Data entry, processing or analytics' },
  { code:'P0804', label:'IT maintenance',             sub:'Support, maintenance or hosting' },
  { code:'P0805', label:'News agency',                sub:'Subscription to news or media services' },
  { code:'P0806', label:'Subscriptions & media',      sub:'Digital subscriptions or publications' },
  { code:'P0801', label:'Hardware consulting',        sub:'Hardware advisory or technical support' },
  { code:'P0807', label:'Software exports',           sub:'Sale or export of software products' },
  { code:'P0102', label:'Export bill realisation',    sub:'Proceeds from goods exported' },
  { code:'P0103', label:'Export advance',             sub:'Advance payment for future exports' },
  { code:'P0104', label:'Transit trade',              sub:'Goods in transit through third countries' },
  { code:'P0109', label:'Nepal/Bhutan exports',       sub:'Trade with Nepal or Bhutan' },
];

function smBuildProfRows(filter) {
  var wrap = document.getElementById('purposeProfRows');
  if (!wrap) return;
  var q = (filter || '').toLowerCase().trim();
  var items = q ? PURPOSE_PROF.filter(function(i) {
    return i.label.toLowerCase().includes(q) || i.code.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q);
  }) : PURPOSE_PROF;

  wrap.innerHTML = '';
  var checkSvg = '<svg class="purpose-row-check" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="var(--brand-primary)" stroke-width="1.5"/><polyline points="6,10 9,13 14,7" stroke="var(--brand-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  items.forEach(function(item) {
    var btn = document.createElement('button');
    btn.className = 'purpose-row' + (_purposeCode === item.code ? ' sel' : '');
    btn.dataset.code = item.code;
    btn.innerHTML = '<span class="purpose-row-icon">💼</span>' +
      '<div class="purpose-row-info"><span class="purpose-row-lbl">' + item.label + '</span><span class="purpose-row-sub">' + item.sub + '</span></div>' + checkSvg;
    btn.onclick = function() { smPickProf(item.label, item.code); };
    wrap.appendChild(btn);
  });

  // Show/hide professional group if no results
  var grp = document.getElementById('purposeProfGrp');
  if (grp) grp.style.display = items.length ? '' : 'none';
}

function smFilterPurpose(q) {
  // Filter common rows
  var commonRows = document.querySelectorAll('#purposeCommonGrp .purpose-row');
  var hasCommon = false;
  commonRows.forEach(function(row) {
    var lbl = (row.querySelector('.purpose-row-lbl') || {}).textContent || '';
    var sub = (row.querySelector('.purpose-row-sub') || {}).textContent || '';
    var show = !q || lbl.toLowerCase().includes(q.toLowerCase()) || sub.toLowerCase().includes(q.toLowerCase());
    row.style.display = show ? '' : 'none';
    if (show) hasCommon = true;
  });
  var commonGrp = document.getElementById('purposeCommonGrp');
  if (commonGrp) commonGrp.style.display = hasCommon ? '' : 'none';
  // Filter professional rows
  smBuildProfRows(q);
}

function smOpenPurposeSheet(ev) {
  if (ev) ev.stopPropagation();
  // Build professional rows on first open
  var wrap = document.getElementById('purposeProfRows');
  if (wrap && wrap.children.length === 0) smBuildProfRows('');
  // Sync sel state to current code
  document.querySelectorAll('#purposeSheet .purpose-row').forEach(function(r) {
    r.classList.toggle('sel', r.dataset.code === _purposeCode);
  });
  document.getElementById('purposeScrim').classList.add('open');
  document.getElementById('purposeSheet').classList.add('open');
}
function smClosePurposeSheet() {
  document.getElementById('purposeScrim').classList.remove('open');
  document.getElementById('purposeSheet').classList.remove('open');
  document.getElementById('purposeSheetInvoice').classList.remove('open');
  var si = document.getElementById('purposeSearch'); if (si) si.value = '';
  smFilterPurpose('');
}

/* Pick a common purpose row (no invoice needed) */
function smPickPurpose(el, label, code) {
  _purposeCode = code;
  _purposeLabel = label;
  // Update sheet rows
  document.querySelectorAll('#purposeSheet .purpose-row').forEach(function(r) { r.classList.remove('sel'); });
  el.classList.add('sel');
  // Sync purpose display row
  smSyncPurposeDisplay(label, code);
  setTimeout(smClosePurposeSheet, 200);
}

/* Pick a professional/business service (invoice required) */
function smPickProf(label, code) {
  _purposeCode = code;
  _purposeLabel = label;
  document.querySelectorAll('#purposeSheet .purpose-row').forEach(function(r) { r.classList.remove('sel'); });
  var profRows = document.querySelectorAll('#purposeProfRows .purpose-row');
  profRows.forEach(function(r) { if (r.dataset.code === code) r.classList.add('sel'); });
  smSyncPurposeDisplay(label, code);
  smOpenPurposeInvoice(label);
}

/* Sync the floating-label purpose row on the review card */
var PURPOSE_ICONS = { P1301:'🏠', P1108:'🏥', P1109:'💡', P1107:'🎓', P0601:'🛡️' };
function smSyncPurposeDisplay(label, code) {
  var ico = document.getElementById('smPurposeIco');
  var val = document.getElementById('smPurposeDisplayVal');
  if (ico) ico.textContent = PURPOSE_ICONS[code] || '📋';
  if (val) val.textContent = label;
}

/* ── Supporting document sheet ─────────────────────── */
function smOpenPurposeInvoice(label) {
  // Reset fields
  var ref = document.getElementById('purposeInvRef');
  var notes = document.getElementById('purposeInvNotes');
  if (ref) ref.value = '';
  if (notes) notes.value = '';
  purposeRemoveFile();
  document.getElementById('purposeSheetInvoice').classList.add('open');
}
function smClosePurposeInvoice() {
  document.getElementById('purposeSheetInvoice').classList.remove('open');
}
function smConfirmPurposeInvoice() {
  smClosePurposeSheet();
}
function purposeSimulateUpload() {
  var area = document.getElementById('purposeUploadArea');
  var uploaded = document.getElementById('purposeUploaded');
  var fname = document.getElementById('purposeUploadFilename');
  if (area) area.style.display = 'none';
  if (uploaded) uploaded.style.display = 'flex';
  if (fname) fname.textContent = 'invoice_2026.pdf';
}
function purposeRemoveFile() {
  var area = document.getElementById('purposeUploadArea');
  var uploaded = document.getElementById('purposeUploaded');
  if (area) area.style.display = '';
  if (uploaded) uploaded.style.display = 'none';
}

function smToggleAccordion(id) {
  document.getElementById(id).classList.toggle('open');
}

/* ── Dispute form ────────────────────────────────────── */
let _disputeTx     = null;
let _disputeReason = null;

const DISPUTE_REASONS = [
  { id:'unauthorized', label:'I didn\'t authorise this' },
  { id:'not_received', label:'Item not received' },
  { id:'wrong_amount', label:'Wrong amount charged' },
  { id:'duplicate',    label:'Duplicate charge' },
  { id:'not_as_desc',  label:'Not as described' },
  { id:'other',        label:'Other',  full:true },
];

function openDisputeForm(tx) {
  _disputeTx     = tx;
  _disputeReason = null;

  const body = document.getElementById('disputeBody');
  body.innerHTML = '';

  // ── Transaction summary — reuse the actual list row component ──
  const rowWrap = document.createElement('div');
  rowWrap.className = 'dispute-tx-row-wrap';
  const row = buildRow(tx);
  row.style.cursor = 'default';          // summary only, not tappable
  rowWrap.appendChild(row);
  body.appendChild(rowWrap);

  // ── Banyan DS RadioGroup — "What happened?" ──────────────────
  const rgWrap = document.createElement('div');
  const rgLabel = document.createElement('div');
  rgLabel.className = 'bds-field-label';
  rgLabel.textContent = 'What happened?';
  rgWrap.appendChild(rgLabel);

  const radioList = document.createElement('div');
  radioList.className = 'bds-radio-list';
  radioList.id = 'disputeRadioList';

  DISPUTE_REASONS.forEach(r => {
    const rowEl = document.createElement('div');
    rowEl.className = 'bds-radio-row';
    rowEl.dataset.id = r.id;
    rowEl.innerHTML = `<div class="bds-radio-btn"></div><span class="bds-radio-lbl">${r.label}</span>`;
    rowEl.addEventListener('click', () => selectDisputeReason(r.id));
    radioList.appendChild(rowEl);
  });

  rgWrap.appendChild(radioList);
  body.appendChild(rgWrap);

  // ── Banyan DS Textarea (Large) — "Anything else?" ───────────────
  const taWrap = document.createElement('div');
  taWrap.className = 'bds-input-wrap';
  taWrap.innerHTML = `
    <textarea class="bds-textarea" id="disputeNotes"
      placeholder="Anything else? (optional)"></textarea>
  `;
  body.appendChild(taWrap);

  // Reset submit button
  document.getElementById('disputeSubmit').classList.remove('ready');

  document.getElementById('disputeOverlay').classList.add('open');
}

function selectDisputeReason(id) {
  _disputeReason = id;
  document.querySelectorAll('#disputeRadioList .bds-radio-row').forEach(p => {
    p.classList.toggle('sel', p.dataset.id === id);
  });
  document.getElementById('disputeSubmit').classList.add('ready');
}

function closeDisputeForm() {
  document.getElementById('disputeOverlay').classList.remove('open');
  _disputeTx     = null;
  _disputeReason = null;
}

function submitDispute() {
  if (!_disputeTx || !_disputeReason) return;
  const tx = _disputeTx;
  closeDisputeForm();
  // journeyStep handles provisional credit, status update, and re-render for all tx types
  journeyStep(tx, 'dispute');
}

/* ── Reversal reason form ────────────────────────────── */
let _reversalTx     = null;
let _reversalReason = null;

const REVERSAL_REASONS = [
  { id:'wrong_recipient', label:'Sent to wrong recipient' },
  { id:'wrong_amount',    label:'Incorrect amount sent' },
  { id:'duplicate',       label:'Duplicate payment' },
  { id:'not_needed',      label:'Payment no longer needed' },
  { id:'other',           label:'Other' },
];

function openReversalForm(tx) {
  _reversalTx     = tx;
  _reversalReason = null;

  const body = document.getElementById('reversalBody');
  body.innerHTML = '';

  // Transaction summary row
  const rowWrap = document.createElement('div');
  rowWrap.className = 'dispute-tx-row-wrap';
  const row = buildRow(tx);
  row.style.cursor = 'default';
  rowWrap.appendChild(row);
  body.appendChild(rowWrap);

  // RadioGroup — reason
  const rgWrap = document.createElement('div');
  const rgLabel = document.createElement('div');
  rgLabel.className = 'bds-field-label';
  rgLabel.textContent = 'Reason for reversal';
  rgWrap.appendChild(rgLabel);

  const radioList = document.createElement('div');
  radioList.className = 'bds-radio-list';
  radioList.id = 'reversalRadioList';

  REVERSAL_REASONS.forEach(r => {
    const rowEl = document.createElement('div');
    rowEl.className = 'bds-radio-row';
    rowEl.dataset.id = r.id;
    rowEl.innerHTML = `<div class="bds-radio-btn"></div><span class="bds-radio-lbl">${r.label}</span>`;
    rowEl.addEventListener('click', () => selectReversalReason(r.id));
    radioList.appendChild(rowEl);
  });

  rgWrap.appendChild(radioList);
  body.appendChild(rgWrap);

  // Notes textarea
  const taWrap = document.createElement('div');
  taWrap.className = 'bds-input-wrap';
  taWrap.innerHTML = `
    <textarea class="bds-textarea" id="reversalNotes"
      placeholder="Additional details (optional)"></textarea>
  `;
  body.appendChild(taWrap);

  document.getElementById('reversalSubmit').classList.remove('ready');
  document.getElementById('reversalOverlay').classList.add('open');
}

function selectReversalReason(id) {
  _reversalReason = id;
  document.querySelectorAll('#reversalRadioList .bds-radio-row').forEach(p => {
    p.classList.toggle('sel', p.dataset.id === id);
  });
  document.getElementById('reversalSubmit').classList.add('ready');
}

function closeReversalForm() {
  document.getElementById('reversalOverlay').classList.remove('open');
  _reversalTx     = null;
  _reversalReason = null;
}

function submitReversal() {
  if (!_reversalTx || !_reversalReason) return;
  const tx = _reversalTx;
  closeReversalForm();
  journeyStep(tx, 'reverse');
}

function switchTab(tab, el) {
  activeTab = tab;
  document.querySelectorAll('.ltab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderList(tab);
}

/* ── Filter sheet ─────────────────────────────────────── */
function buildFilterSheet() {
  const pill = (group, val, label, extra='') =>
    `<div class="fpill${filterState[group]===val?' sel':''}" onclick="setFilter('${group}','${val}')">${label}${extra}</div>`;

  document.getElementById('filterSheet').innerHTML = `
    <div class="filter-handle"></div>
    <div class="filter-header">
      <span class="filter-title">Filters</span>
      <button class="filter-close" onclick="closeFilterSheet()">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="filter-hdiv"></div>
    <div class="filter-body">

      <div class="filter-quick">
        <div class="filter-sec-lbl">Frequently used by you</div>
        <div class="fpills">
          <div class="fq-pill" onclick="applyQuickFilter('status','failed')"><span class="fqk">Status:</span><span class="fqv">Failed</span></div>
          <div class="fq-pill" onclick="applyQuickFilter('status','pending')"><span class="fqk">Status:</span><span class="fqv">Pending</span></div>
          <div class="fq-pill" onclick="applyQuickFilter('method','ach')"><span class="fqk">Method:</span><span class="fqv">ACH</span></div>
          <div class="fq-pill" onclick="applyQuickFilter('method','card')"><span class="fqk">Method:</span><span class="fqv">Cards</span></div>
          <div class="fq-pill"><span class="fqk">Currency:</span><span class="fqv">₹ (INR)</span><img src="assets/c91eee93-e7e4-4db0-bbf1-6d6ac2bbaaea.svg" style="width:16px;height:16px;border-radius:50%;object-fit:cover;flex-shrink:0" alt="IN"></div>
        </div>
      </div>

      <div class="filter-sec">
        <div class="filter-sec-lbl">Spaces</div>
        <div class="fpills">
          ${pill('space','all','All')}
          ${pill('space','usd','USD Checking')}
          ${pill('space','thailand','Thailand holiday')}
          ${pill('space','mom','Mom\'s expenses')}
          ${pill('space','wedding','Wedding')}
        </div>
      </div>

      <div class="filter-sec">
        <div class="filter-sec-lbl">Status</div>
        <div class="fpills">
          ${pill('status','all','All')}
          ${pill('status','completed','Completed')}
          ${pill('status','scheduled','Scheduled')}
          ${pill('status','pending','Pending')}
          ${pill('status','failed','Failed')}
          ${pill('status','cancelled','Cancelled')}
          ${pill('status','others','Others')}
        </div>
      </div>

      <div class="filter-sec">
        <div class="filter-sec-lbl">Date Range</div>
        <div class="fpills">
          ${pill('dateRange','all','All time')}
          ${pill('dateRange','7d','Last 7 days')}
          ${pill('dateRange','month','This month')}
          ${pill('dateRange','lastmonth','Last month')}
        </div>
      </div>

      <div class="filter-sec">
        <div class="filter-sec-lbl">Method</div>
        <div class="fpills">
          ${pill('method','all','All')}
          ${pill('method','wire','Wire')}
          ${pill('method','ach','ACH')}
          ${pill('method','card','Cards')}
        </div>
      </div>

      <div class="filter-sec">
        <div class="filter-sec-lbl">Currencies</div>
        <div class="fpills">
          <div class="fpill sel">All</div>
          <div class="fpill">$ (USD) 🇺🇸</div>
          <div class="fpill">₹ (INR) 🇮🇳</div>
        </div>
      </div>

    </div>`;
}

function setFilter(group, val) {
  filterState[group] = val;
  buildFilterSheet();
  renderList(activeTab);
  updateFilterDot();
  updateActiveChips();
}

function applyQuickFilter(group, val) {
  filterState[group] = val;
  closeFilterSheet();
  renderList(activeTab);
  updateFilterDot();
  updateActiveChips();
}

function openFilterSheet() {
  buildFilterSheet();
  document.getElementById('filterOverlay').classList.add('open');
  const bar = document.querySelector('.list-bottom-bar');
  if (bar) { bar.style.opacity = '0'; bar.style.pointerEvents = 'none'; }
}

function closeFilterSheet() {
  document.getElementById('filterOverlay').classList.remove('open');
  const bar = document.querySelector('.list-bottom-bar');
  if (bar) { bar.style.opacity = ''; bar.style.pointerEvents = ''; }
}

/* ── Init ─────────────────────────────────────────────── */
renderList('recent');
renderEmbeddedTxSection('homeTxList');

// ── Hero background organic drift ──────────────────────────────
// Two overlapping sine waves per axis at irrational frequency ratios →
// path never repeats, velocity is always continuous, zero keyframe stops
(function heroBgDrift() {
  const img = document.querySelector('.home-hero-bg');
  if (!img) return;
  const t0 = performance.now();
  function tick(now) {
    const t = (now - t0) / 1000;
    const x = Math.sin(t * 0.29) * 11 + Math.sin(t * 0.13) * 7;
    const y = Math.cos(t * 0.21) * 9  + Math.cos(t * 0.09) * 6;
    const s = 1.18 + Math.sin(t * 0.17) * 0.01;
    img.style.transform = `scale(${s}) translate(${x}px, ${y}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ── Home status-bar blur on scroll ──────────────────── */
document.querySelector('.home-scroll').addEventListener('scroll', function() {
  const blur = document.querySelector('.home-statusbar-blur');
  blur.classList.toggle('active', this.scrollTop > 8);
});

/* ── Account-detail status-bar blur on scroll ─────── */
document.getElementById('adScroll').addEventListener('scroll', function() {
  document.getElementById('adStatusBlur').classList.toggle('active', this.scrollTop > 8);
});

/* ── Accounts status-bar blur on scroll ─────────── */
document.getElementById('acctScroll').addEventListener('scroll', function() {
  document.getElementById('acctStatusBlur').classList.toggle('active', this.scrollTop > 8);
});

/* ── Explore status-bar blur on scroll ──────────── */
document.getElementById('expScroll').addEventListener('scroll', function() {
  document.getElementById('expStatusBlur').classList.toggle('active', this.scrollTop > 8);
});

/* ── Card carousel scale-on-scroll ──────────────── */
(function() {
  function initCarousel() {
    var carousel = document.getElementById('crCarousel');
    if (!carousel) return;
    var tip      = document.getElementById('crTip');
    var spendHdr = document.getElementById('crSpendHdr');
    var spendInt = document.getElementById('crSpendInt');
    var spendDec = document.getElementById('crSpendDec');
    var actions  = document.getElementById('crActions');
    var txSec    = document.getElementById('crTxSection');

    // Spend data per card index (null = add card)
    var CARD_SPENDS = [
      { int: '14,098', dec: '.43' },  // Banyan Physical
      { int: '2,340',  dec: '.17' },  // Card 2 Virtual
      null                             // Create a new card
    ];

    function update() {
      var items = carousel.querySelectorAll('.cr-carousel-item');
      var cw = carousel.offsetWidth;
      var cx = carousel.scrollLeft + cw / 2;
      var closestIdx = 0, closestDist = Infinity;
      items.forEach(function(item, i) {
        var ic = item.offsetLeft + item.offsetWidth / 2;
        var dist = Math.abs(cx - ic);
        var norm = Math.max(0, 1 - dist / (item.offsetWidth * 0.65));
        var scale = (0.82 + 0.18 * norm).toFixed(3);
        item.style.transform = 'scale(' + scale + ')';
        if (dist < closestDist) { closestDist = dist; closestIdx = i; }
      });
      // Toggle tip vs spend header + actions + transactions based on active card
      var isAdd = items[closestIdx] && items[closestIdx].classList.contains('cr-carousel-add');
      if (spendHdr) spendHdr.style.display = isAdd ? 'none'  : '';
      if (tip)      tip.style.display      = isAdd ? 'flex'  : 'none';
      if (actions)  actions.style.display  = isAdd ? 'none'  : '';
      if (txSec)    txSec.style.display    = isAdd ? 'none'  : '';
      // Update spend amount for active card
      var spend = CARD_SPENDS[closestIdx];
      if (!isAdd && spend && spendInt && spendDec) {
        spendInt.textContent = spend.int;
        spendDec.textContent = spend.dec;
      }
    }
    // Drag-based carousel (overflow:visible — no scroll container clipping)
    var _offset = 0;      // current translateX offset (negative = swiped left)
    var _activeIdx = 0;
    var CARD_W = 286, GAP = 4, SIDE_PAD = 45;

    function snapToIndex(idx, animated) {
      var items = carousel.querySelectorAll('.cr-carousel-item');
      idx = Math.max(0, Math.min(idx, items.length - 1));
      _activeIdx = idx;
      // center the target card: offset = -(card position - centering offset)
      var cardLeft = SIDE_PAD + idx * (CARD_W + GAP);
      var containerW = carousel.parentElement.parentElement.offsetWidth || 375;
      _offset = -(cardLeft - (containerW - CARD_W) / 2);
      carousel.style.transition = animated ? 'transform 0.32s var(--ease-drawer)' : 'none';
      carousel.style.transform = 'translateX(' + _offset + 'px)';
      update();
    }

    function update() {
      var items = carousel.querySelectorAll('.cr-carousel-item');
      var containerW = carousel.parentElement.parentElement.offsetWidth || 375;
      var centerX = -_offset + containerW / 2;
      var closestIdx = 0, closestDist = Infinity;
      items.forEach(function(item, i) {
        var ic = SIDE_PAD + i * (CARD_W + GAP) + CARD_W / 2;
        var dist = Math.abs(centerX - ic);
        var norm = Math.max(0, 1 - dist / (CARD_W * 0.65));
        item.style.transform = 'scale(' + (0.82 + 0.18 * norm).toFixed(3) + ')';
        if (dist < closestDist) { closestDist = dist; closestIdx = i; }
      });
      var isAdd = items[closestIdx] && items[closestIdx].classList.contains('cr-carousel-add');
      if (spendHdr) spendHdr.style.display = isAdd ? 'none'  : '';
      if (tip)      tip.style.display      = isAdd ? 'flex'  : 'none';
      if (actions)  actions.style.display  = isAdd ? 'none'  : '';
      if (txSec)    txSec.style.display    = isAdd ? 'none'  : '';
      dragEl.style.marginBottom = isAdd ? '40px' : '';
      var spend = CARD_SPENDS[closestIdx];
      if (!isAdd && spend && spendInt && spendDec) {
        spendInt.textContent = spend.int;
        spendDec.textContent = spend.dec;
      }
    }

    // Block image drag so it doesn't interfere
    carousel.querySelectorAll('img').forEach(function(img) {
      img.setAttribute('draggable', 'false');
      img.style.pointerEvents = 'none';
    });

    // Drag on the outer container so the full area is the hit target
    var dragEl = carousel.parentElement; // cr-carousel-outer
    dragEl.style.cursor = 'grab';
    var _dragStart = null, _offsetStart = 0;
    dragEl.addEventListener('pointerdown', function(e) {
      _dragStart = e.clientX; _offsetStart = _offset;
      dragEl.style.cursor = 'grabbing';
      carousel.style.transition = 'none';
      dragEl.setPointerCapture(e.pointerId);
    });
    dragEl.addEventListener('pointermove', function(e) {
      if (_dragStart === null) return;
      var dx = e.clientX - _dragStart;
      _offset = _offsetStart + dx;
      carousel.style.transform = 'translateX(' + _offset + 'px)';
      update();
    });
    dragEl.addEventListener('pointerup', function(e) {
      if (_dragStart === null) return;
      dragEl.style.cursor = 'grab';
      var dx = e.clientX - _dragStart;
      carousel.classList.remove('dragging');
      _dragStart = null;
      // Find closest card and snap
      var containerW = carousel.parentElement.parentElement.offsetWidth || 375;
      var centerX = -_offset + containerW / 2;
      var items = carousel.querySelectorAll('.cr-carousel-item');
      var bestIdx = 0, bestDist = Infinity;
      items.forEach(function(item, i) {
        var ic = SIDE_PAD + i * (CARD_W + GAP) + CARD_W / 2;
        var d = Math.abs(centerX - ic);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      });
      // Velocity-based: fast flick skips a card
      if (Math.abs(dx) > 60) bestIdx = _activeIdx + (dx < 0 ? 1 : -1);
      snapToIndex(bestIdx, true);
    });
    dragEl.addEventListener('pointercancel', function() {
      dragEl.style.cursor = 'grab';
      _dragStart = null;
      snapToIndex(_activeIdx, true);
    });

    // Init: snap to first card
    snapToIndex(0, false);
    update();
  }
  // Init when cards screen becomes visible
  var _crInited = false;
  var _origShowCards = window.showCards;
  window.showCards = function() {
    _origShowCards && _origShowCards.apply(this, arguments);
    if (!_crInited) { _crInited = true; setTimeout(initCarousel, 50); }
  };
})();

/* ── List status-bar blur on scroll ──────────────── */
document.getElementById('list').addEventListener('scroll', function() {
  document.getElementById('listStatusBlur').classList.toggle('active', this.scrollTop > 8);
});

/* ── Search + filter wiring ───────────────────────────── */
document.getElementById('txSearch').addEventListener('input', function() {
  searchQuery = this.value.trim();
  renderList(activeTab);
  updateFilterDot();
});

document.getElementById('filterBtnWrap').addEventListener('click', openFilterSheet);
const _filterBtnCompact = document.getElementById('filterBtnCompact');
if (_filterBtnCompact) _filterBtnCompact.addEventListener('click', openFilterSheet);

document.getElementById('filterOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeFilterSheet();
});

/* ── Search placeholder typewriter ───────────────────────── */
const _TW = (function() {
  const PROMPTS = [
    'My Uber transactions',
    'Any refunds this week?',
    'Last payment to Dexter?',
    'Biggest spend this month?',
    'Everything over $100',
  ];
  const TYPE_SPEED  = 50;
  const ERASE_SPEED = 24;
  const PAUSE_FULL  = 1500;
  const PAUSE_EMPTY = 300;
  const CURSOR      = '|';

  const input = document.getElementById('txSearch');
  let promptIdx, charIdx, erasing, timer, aborted;

  function reset() {
    clearTimeout(timer);
    timer     = null;
    promptIdx = 0;
    charIdx   = 0;
    erasing   = false;
    aborted   = false;
  }

  function abort() {
    reset();
    aborted = true;
    input.placeholder = 'Search...';
  }

  function tick() {
    if (aborted) return;
    const prompt = PROMPTS[promptIdx];

    if (!erasing) {
      charIdx++;
      input.placeholder = prompt.slice(0, charIdx) + CURSOR;
      if (charIdx < prompt.length) {
        timer = setTimeout(tick, TYPE_SPEED);
      } else {
        timer = setTimeout(() => { erasing = true; tick(); }, PAUSE_FULL);
      }
    } else {
      charIdx--;
      input.placeholder = charIdx > 0 ? prompt.slice(0, charIdx) + CURSOR : CURSOR;
      if (charIdx > 0) {
        timer = setTimeout(tick, ERASE_SPEED);
      } else {
        promptIdx++;
        erasing = false;
        if (promptIdx >= PROMPTS.length) {
          input.placeholder = 'Search...';
          timer = null;
        } else {
          timer = setTimeout(tick, PAUSE_EMPTY);
        }
      }
    }
  }

  input.addEventListener('focus', abort);

  return {
    start() {
      if (input.value.trim()) return; // user has typed something, skip
      reset();
      // Brief delay so screen slide-in completes first
      timer = setTimeout(tick, 500);
    }
  };
})();

/* ── Scroll-collapse nav ─────────────────────────────── */
(function() {
  const listEl   = document.getElementById('list');  /* screen is the scroller now */
  const listScr  = document.getElementById('list');
  let lastTop    = 0;
  let ticking    = false;
  const THRESH   = 48; // px before collapse kicks in

  listEl.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      const top = listEl.scrollTop;
      const scrollingUp = top > lastTop; // content moving up → user scrolled "up"

      if (scrollingUp && top > THRESH) {
        listScr.classList.add('compact');
      } else if (!scrollingUp) {
        listScr.classList.remove('compact');
      }

      lastTop  = top;
      ticking  = false;
    });
  });
})();


/* ── Beneficiaries ───────────────────────────────── */
const BENS = [
  { id:'ar', photo:'assets/blob-purple-v2.png', blob:'photo', ini:'AR', name:'Ananya Rao',    alias:'Ananya', rel:'Sister',  loc:'Bengaluru',  bg:'linear-gradient(135deg,#c2185b,#e91e8c)', fav:true,  corp:false,
    rails:{ 'US Bank':{ badge:'United States · ACH · USD', rows:[['Account holder','Ananya Rao'],['Bank','JPMorgan Chase'],['Routing (ABA)','021000021'],['Account no.','•••• 4421'],['Type','Checking']] } },
    contact:[['Full name','Ananya Rao'],['Saved as','Ananya'],['Phone','+91 98455 20193'],['Email','ananya.rao@gmail.com']] },

  { id:'jc', photo:'assets/blob-orange-v2.png', blob:'photo', ini:'JC', name:'James Carter',  alias:'James',  rel:'Friend',  loc:'New York',   bg:'linear-gradient(135deg,#1565c0,#1e88e5)', fav:true,  corp:false,
    rails:{ 'India Bank':{ badge:'India · NEFT · INR', rows:[['Account holder','James Carter'],['Bank','ICICI Bank'],['IFSC','ICIC0001234'],['Account no.','•••• 7731'],['Type','NRO Savings']] },
            'UPI':{ badge:'India · UPI · INR', rows:[['UPI ID','james.carter@icici'],['Registered to','James Carter']] } },
    contact:[['Full name','James Carter'],['Saved as','James'],['Phone','+1 212 555 0182'],['Email','james.carter@email.com']] },

  { id:'ps', photo:'assets/blob-orange-v2.png', blob:'photo', ini:'PS', name:'Priya Sharma',  alias:'Priya',  rel:'Cousin',  loc:'Mumbai',     bg:'linear-gradient(135deg,#00695c,#00897b)', fav:true,  corp:false,
    rails:{ 'India Bank':{ badge:'India · IMPS · INR', rows:[['Account holder','Priya Sharma'],['Bank','ICICI Bank'],['IFSC','ICIC0000123'],['Account no.','•••• 3120'],['Type','Savings']] },
            'UPI':{ badge:'India · UPI · INR', rows:[['UPI ID','priya.s@icici'],['Registered to','Priya Sharma']] } },
    contact:[['Full name','Priya Sharma'],['Saved as','Priya'],['Phone','+91 97654 32109'],['Email','priya.sharma@email.com']] },

  { id:'th', blob:'business', logo:'assets/dd58076a-011d-4a6e-a83e-bdb7f108eea8.webp', ini:'T',  name:'Tau Holdings Ltd', alias:'Tau Holdings', rel:'Business', loc:'Singapore', bg:'linear-gradient(135deg,#212121,#424242)', fav:false, corp:true,
    rails:{ 'US Bank':{ badge:'United States · Wire · USD', rows:[['Beneficiary','Tau Holdings Ltd'],['Bank','DBS Bank'],['SWIFT','DBSSSGSG'],['Account no.','•••• 0042'],['Type','Corporate']] } },
    contact:[['Company','Tau Holdings Ltd'],['Contact','ops@tauholdings.sg'],['Phone','+65 6321 8800']] },

  { id:'rm', photo:'assets/blob-purple-v2.png', blob:'photo', ini:'RM', name:'Rahul Mehta',   alias:'Rahul',  rel:'Colleague',loc:'Delhi',      bg:'linear-gradient(135deg,#6a1b9a,#8e24aa)', fav:false, corp:false,
    rails:{ 'US Bank':{ badge:'United States · ACH · USD', rows:[['Account holder','Rahul Mehta'],['Bank','Chase'],['Routing (ABA)','021000021'],['Account no.','•••• 3398'],['Type','Checking']] } },
    contact:[['Full name','Rahul Mehta'],['Saved as','Rahul'],['Phone','+91 99876 33410'],['Email','rahul.m@work.com']] },

  { id:'pm', photo:'assets/blob-purple-v2.png', blob:'photo', ini:'PM', name:'Patrick Mokoena',alias:'Patrick',rel:'Friend', loc:'Nairobi',    bg:'linear-gradient(135deg,#bf360c,#e64a19)', fav:false, corp:false,
    rails:{ 'US Bank':{ badge:'United States · Wire · USD', rows:[['Account holder','Patrick Mokoena'],['Bank','Equity Bank'],['SWIFT','EQBLKENX'],['Account no.','•••• 5510'],['Type','Current']] } },
    contact:[['Full name','Patrick Mokoena'],['Saved as','Patrick'],['Phone','+254 722 123456'],['Email','p.mokoena@email.com']] },

  { id:'ns', photo:'assets/blob-orange-v2.png', blob:'photo', ini:'NS', name:'Neha Singh',    alias:'Neha',   rel:'Friend',  loc:'Hyderabad',  bg:'linear-gradient(135deg,#00838f,#0097a7)', fav:false, corp:false,
    rails:{ 'UPI':{ badge:'India · UPI · INR', rows:[['UPI ID','neha.singh@paytm'],['Registered to','Neha Singh']] } },
    contact:[['Full name','Neha Singh'],['Saved as','Neha'],['Phone','+91 98112 45678']] },

  { id:'ak', photo:'assets/blob-orange-v2.png', blob:'photo', ini:'AK', name:'Akira Kobayashi',alias:'Akira', rel:'Friend',  loc:'Tokyo',      bg:'linear-gradient(135deg,#283593,#3949ab)', fav:false, corp:false,
    rails:{ 'India Bank':{ badge:'India · NEFT · INR', rows:[['Account holder','Akira Kobayashi'],['Bank','HDFC Bank'],['IFSC','HDFC0009087'],['Account no.','•••• 9087'],['Type','NRO Savings']] },
            'UPI':{ badge:'India · UPI · INR', rows:[['UPI ID','akira.k@hdfc'],['Registered to','Akira Kobayashi']] } },
    contact:[['Full name','Akira Kobayashi'],['Saved as','Akira'],['Phone','+81 90-1234-5678'],['Email','akira.k@email.jp']] },
];

let _benCurrent = null, _benCurrentRail = null;

function showBeneficiaries() {
  document.getElementById('benDetailOverlay')?.classList.remove('open');
  ['home','explore','accounts','list'].forEach(id => { const el = document.getElementById(id); if(el) el.className = 'screen hb'; });
  const el = document.getElementById('beneficiaries');
  if (el) el.className = 'screen on';
  showNav(false);
  _benRender(BENS);
}

function closeBeneficiaries() {
  document.getElementById('beneficiaries').className = 'screen hr';
  showExplore();
}

function _benAv(b, size) {
  const style = b.blob || 'photo';
  const inset = size >= 80 ? '4px' : '2px';
  const fs = Math.round(size * 0.31);
  const txtCss = 'font-size:' + fs + 'px;letter-spacing:-' + (fs*0.05).toFixed(1) + 'px;font-weight:600;line-height:' + Math.round(fs*1.25) + 'px';
  const radius = b.corp ? Math.round(size*0.28) + 'px' : '999px';

  if (style === 'business') {
    // Amazon Pay pattern: dark moody bg + glass + centered logo icon
    const d = document.createElement('div');
    d.className = 'sm-l-av';
    d.style.cssText = 'width:' + size + 'px;height:' + size + 'px;background:rgba(0,0,0,0.10);border-radius:999px;';
    const ph = document.createElement('img');
    ph.className = 'sm-l-av-photo';
    ph.src = 'assets/blob-green-v2.png';
    ph.alt = '';
    d.appendChild(ph);
    const glass = document.createElement('div');
    glass.className = 'sm-l-av-glass';
    glass.style.cssText = 'inset:' + inset + ';background:var(--surface-overlay);border:0.3px solid transparent;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:inherit';
    d.appendChild(glass);
    // Centered logo icon
    const logo = document.createElement('img');
    logo.src = b.logo || 'assets/blob-amzpay.png';
    logo.alt = '';
    const logoSz = Math.round(size * 0.55);
    logo.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:' + logoSz + 'px;height:' + logoSz + 'px;object-fit:contain;border-radius:' + Math.round(size*0.15) + 'px;z-index:3';
    d.appendChild(logo);
    return d;
  }

  if (style === 'gradient') {
    // Vivid gradient: solid gradient bg + glass + initials (no photo)
    const d = document.createElement('div');
    d.className = 'sm-l-av';
    d.style.cssText = 'width:' + size + 'px;height:' + size + 'px;background:' + b.bg + ';border-radius:' + radius + ';';
    const glass = document.createElement('div');
    glass.className = 'sm-l-av-glass';
    glass.style.cssText = 'inset:' + inset + ';background:rgba(255,255,255,0.1);border:0.3px solid white;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)';
    d.appendChild(glass);
    const txt = document.createElement('span');
    txt.className = 'sm-l-av-txt';
    txt.style.cssText = txtCss;
    txt.textContent = b.ini;
    d.appendChild(txt);
    return d;
  }

  // 'photo' style: white frosted base + skin photo blurring through + glass + initials
  const d = document.createElement('div');
  d.className = 'sm-l-av';
  d.style.cssText = 'width:' + size + 'px;height:' + size + 'px;background:rgba(255,255,255,0.12);border-radius:' + radius + ';';
  const ph = document.createElement('img');
  ph.className = 'sm-l-av-photo';
  ph.src = b.photo || 'assets/blob-purple-v2.png';
  ph.alt = '';
  d.appendChild(ph);
  const glass = document.createElement('div');
  glass.className = 'sm-l-av-glass';
  glass.style.cssText = 'inset:' + inset + ';background:rgba(255,255,255,0.1);border:0.3px solid white;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)';
  d.appendChild(glass);
  const txt = document.createElement('span');
  txt.className = 'sm-l-av-txt';
  txt.style.cssText = txtCss;
  txt.textContent = b.ini;
  d.appendChild(txt);
  return d;
}

function _benRender(list) {
  // ── Favourites (50px blobs) ──
  var favsEl = document.getElementById('benFavs');
  favsEl.innerHTML = '';
  var favs = list.filter(function(b) { return b.fav; });
  favs.forEach(function(b) {
    var wrap = document.createElement('div');
    wrap.className = 'ben-fav';
    wrap.onclick = function() { benOpenDetail(b); };
    var av = _benAv(b, 50);
    var nm = document.createElement('span');
    nm.className = 'ben-fav-name';
    nm.textContent = b.alias;
    wrap.appendChild(av); wrap.appendChild(nm);
    favsEl.appendChild(wrap);
  });
  // Add button
  var addWrap = document.createElement('div');
  addWrap.className = 'ben-fav';
  var addCircle = document.createElement('div');
  addCircle.className = 'ben-fav-add';
  addCircle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  var addNm = document.createElement('span');
  addNm.className = 'ben-fav-name';
  addNm.textContent = 'Add';
  addWrap.appendChild(addCircle); addWrap.appendChild(addNm);
  favsEl.appendChild(addWrap);

  // ── All beneficiaries list (32px blobs, glass card) ──
  var listEl = document.getElementById('benList');
  listEl.innerHTML = '';
  list.forEach(function(b, i) {
    var row = document.createElement('div');
    row.className = 'ben-row animate';
    row.style.animationDelay = (i * 35) + 'ms';
    row.onclick = function() { benOpenDetail(b); };

    var left = document.createElement('div');
    left.className = 'ben-row-left';
    var av = _benAv(b, 32);
    var info = document.createElement('div');
    info.className = 'ben-row-info';
    var nm = document.createElement('span');
    nm.className = 'ben-row-name';
    nm.textContent = b.name;
    var sub = document.createElement('span');
    sub.className = 'ben-row-sub';
    // Show phone from contact if available, else rail info
    var phone = b.contact && b.contact.find(function(c) { return c[0]==='Phone'; });
    sub.textContent = phone ? phone[1] : Object.keys(b.rails)[0];
    info.appendChild(nm); info.appendChild(sub);
    left.appendChild(av); left.appendChild(info);

    var payBtn = document.createElement('button');
    payBtn.className = 'ben-pay-pill';
    payBtn.textContent = 'Pay';
    payBtn.onclick = function(e) { e.stopPropagation(); benOpenDetail(b); };

    row.appendChild(left); row.appendChild(payBtn);
    listEl.appendChild(row);
  });
}

function benFilter(q) {
  const lq = q.toLowerCase();
  const filtered = lq ? BENS.filter(b =>
    b.name.toLowerCase().includes(lq) ||
    b.alias.toLowerCase().includes(lq) ||
    Object.values(b.rails).some(r => r.badge.toLowerCase().includes(lq) ||
      r.rows.some(row => row[1].toLowerCase().includes(lq)))
  ) : BENS;
  _benRender(filtered);
}

function benOpenDetail(b) {
  _benCurrent = b;
  var railKeys = Object.keys(b.rails);
  _benCurrentRail = railKeys[0];
  var isUSOnly = railKeys.length === 1 && railKeys[0] === 'US Bank';

  // Avatar
  var detAv = document.getElementById('benDetailAv');
  detAv.innerHTML = '';
  var blob = _benAv(b, 80);
  detAv.appendChild(blob);
  detAv.style.cssText = '';

  // Name
  document.getElementById('benDetailName').textContent = b.name;

  // Sub: phone | email
  var subEl = document.getElementById('benDetailSub');
  subEl.innerHTML = '';
  var phone = b.contact && b.contact.find(function(c){ return c[0]==='Phone'; });
  var email = b.contact && b.contact.find(function(c){ return c[0]==='Email'; });
  if (phone) { var p = document.createElement('span'); p.textContent = phone[1]; subEl.appendChild(p); }
  if (phone && email) { var d = document.createElement('div'); d.className='ben-profile-divider'; subEl.appendChild(d); }
  if (email) { var e = document.createElement('span'); e.textContent = email[1]; subEl.appendChild(e); }

  _benRenderDetail(isUSOnly);

  document.getElementById('benDetailOverlay').classList.add('open');
}

function _benRenderDetail(isUSOnly) {
  var b = _benCurrent;
  var railKeys = Object.keys(b.rails);
  var body = document.getElementById('benDetailBody');
  body.innerHTML = '';
  var spring = 'var(--ease-spring)';

  // ── Account details card ──
  var acctCard = document.createElement('div');
  acctCard.className = 'ben-acct-card';

  if (!isUSOnly) {
    // Segmented control for multi-rail accounts
    var seg = document.createElement('div');
    seg.className = 'ben-seg';
    railKeys.forEach(function(k) {
      var opt = document.createElement('button');
      opt.className = 'ben-seg-opt' + (k === _benCurrentRail ? ' active' : '');
      opt.textContent = k === 'US Bank' ? 'Bank account' : k === 'India Bank' ? 'Bank account' : k;
      opt.onclick = function() {
        _benCurrentRail = k;
        document.querySelectorAll('.ben-seg-opt').forEach(function(o) { o.classList.remove('active'); });
        opt.classList.add('active');
        _benRenderDetail(false);
      };
      seg.appendChild(opt);
    });
    acctCard.appendChild(seg);
  }

  // Key-value rows
  var r = b.rails[_benCurrentRail];
  var kvWrap = document.createElement('div');
  kvWrap.className = 'ben-kv-rows';
  r.rows.forEach(function(row) {
    var kv = document.createElement('div');
    kv.className = 'ben-kv-row';
    var k = document.createElement('span'); k.className = 'ben-kv-key'; k.textContent = row[0];
    var v = document.createElement('span'); v.className = 'ben-kv-val'; v.textContent = row[1];
    kv.appendChild(k); kv.appendChild(v);
    kvWrap.appendChild(kv);
  });
  acctCard.appendChild(kvWrap);
  body.appendChild(acctCard);

}

function benSwitchRail(rail) {
  _benCurrentRail = rail;
  _benRenderDetail(Object.keys(_benCurrent.rails).length === 1);
}

function benCloseDetail(e) {
  if (e && e.target !== document.getElementById('benDetailOverlay')) return;
  document.getElementById('benDetailOverlay').classList.remove('open');
  _benCurrent = null;
}

function benPay() {
  benCloseDetail();
}

function benOpenAdd() {}

