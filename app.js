/* ── Haptic helper ───────────────────────────────────── */
function haptic(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern || 8);
}

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
  if (!prev || prev === 'home')    { showHome(); return; }
  if (prev === 'explore')          { showExplore(); return; }
  if (prev === 'accounts')         { showAccounts(); return; }
  // Direct DOM restore for screens that would re-push themselves if called via showX()
  var cur = document.querySelector('.screen.on');
  if (cur) cur.className = 'screen hr';
  if (prev === 'account-detail') {
    document.getElementById('account-detail').className = 'screen on';
    showNav(false); setSbLight(false); return;
  }
  if (prev === 'cards') {
    document.getElementById('cards').className = 'screen on';
    showNav(false); setSbLight(false); return;
  }
  if (prev === 'list') {
    document.getElementById('list').className = 'screen on';
    showNav(false); setSbLight(false); return;
  }
  if (prev === 'beneficiaries') {
    document.getElementById('beneficiaries').className = 'screen on';
    showNav(false); setSbLight(false); return;
  }
  showHome();
}

function setNavActive(tabIndex) {
  var prev = _currentNavTab;
  _currentNavTab = tabIndex;
  for (var i = 0; i < 4; i++) {
    var t = document.getElementById('bnav' + i);
    if (t) t.classList.toggle('active', i === tabIndex);
  }
  _morphIndicator(prev, tabIndex);
}

/* ── Limelight indicator ─────────────────────────────────
   The beam slides to sit centered above the active tab.       */
var _BNAV_BEAM_W = 44;
function _limelightX(tab) {
  return tab.offsetLeft + (tab.offsetWidth - _BNAV_BEAM_W) / 2;
}
function _morphIndicator(fromIndex, toIndex) {
  var indicator = document.getElementById('bnavIndicator');
  var toTab = document.getElementById('bnav' + toIndex);
  if (!indicator || !toTab) return;
  var x = _limelightX(toTab);
  if (typeof Motion !== 'undefined') {
    if (_indAnim && _indAnim.stop) { try { _indAnim.stop(); } catch (e) {} }
    _indAnim = Motion.animate(indicator, { x: x }, { duration: 0.4, easing: [0.4, 0, 0.2, 1] });
  } else {
    indicator.style.transform = 'translateX(' + x + 'px)';
  }
}
var _indAnim = null; // current bnav indicator animation (so slot-sync can supersede it)

function showNav(visible) {
  const nav = document.getElementById('globalNav');
  if (nav) nav.classList.toggle('bnav-hidden', !visible);
}
function showNavAi(visible, instant) {
  var slot = document.getElementById('bnavAiSlot');
  if (!slot) return;
  var changed = slot.classList.contains('visible') !== visible;
  if (instant) {
    // Snap the slot to its final width with no transition, so a following
    // setNavActive() reads the already-shifted tab offsets (no morph race).
    var prev = slot.style.transition;
    slot.style.transition = 'none';
    slot.classList.toggle('visible', visible);
    void slot.offsetWidth; // force reflow → width applies now
    slot.style.transition = prev || '';
    return;
  }
  slot.classList.toggle('visible', visible);
  if (changed) _syncIndicatorForSlot(); // animated (scroll) path → realign after settle
}
/* The AI orb slot (between Pay and Spaces) grows 0→60px on scroll/navigation,
   shifting Spaces/Explore. Re-align the active-tab indicator once the slot's
   width transition actually ends (offsetLeft is only final then). */
function _syncIndicatorForSlot() {
  var slot = document.getElementById('bnavAiSlot');
  if (!slot) return;
  var snap = function() {
    var indicator = document.getElementById('bnavIndicator');
    var tab = document.getElementById('bnav' + _currentNavTab);
    if (!indicator || !tab || typeof Motion === 'undefined') return;
    // Supersede any in-flight slide (it targeted the pre-shift position)
    if (_indAnim && _indAnim.stop) { try { _indAnim.stop(); } catch (e) {} }
    _indAnim = Motion.animate(indicator, { x: _limelightX(tab) },
      { easing: Motion.spring({ stiffness: 480, damping: 24, mass: 0.6 }) });
  };
  var done = false;
  var handler = function(e) {
    if (e.propertyName !== 'width') return;
    done = true; slot.removeEventListener('transitionend', handler); snap();
  };
  slot.addEventListener('transitionend', handler);
  // Fallback if transitionend never fires (e.g. no actual width change)
  setTimeout(function() { if (!done) { slot.removeEventListener('transitionend', handler); snap(); } }, 280);
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
  // Physical/virtual cards — used by the card-controls journey
  cards: [
    { id: 'travel', name: 'Travel card', network: 'Banyan Visa', last4: '4821',
      gradient: 'linear-gradient(135deg,#3a6ea5 0%,#1e3c5a 100%)' },
    { id: 'dining', name: 'Dining card', network: 'Banyan Visa', last4: '7290',
      gradient: 'linear-gradient(135deg,#b5532e 0%,#7a2f17 100%)' },
  ],
  // Proactively flagged activity — the vigilance journey
  flagged: {
    merchant: 'Uber Eats', card: 'dining', amount: '$42.18', gap: '3 minutes apart',
    charges: [
      { merch: 'Uber Eats', time: 'Today · 7:12 PM', amount: '$42.18' },
      { merch: 'Uber Eats', time: 'Today · 7:15 PM', amount: '$42.18' },
    ],
  },
  // Recurring bills & predicted payments — bills journey
  bills: [
    { name: 'Rent',     ic: 'House.svg',      due: 'Due Jul 1 · in 5 days',  amount: '$2,400', kind: 'scheduled', col: '#46882B' },
    { name: 'ConEd',    ic: 'Lightning.svg',  due: 'Due in 3 days',          amount: '~$146',  kind: 'predicted', col: '#C17C14' },
    { name: 'Internet', ic: 'WifiHigh.svg',   due: 'Due in 6 days',          amount: '$78',    kind: 'up19',      col: '#2f5bb0' },
    { name: 'Netflix',  ic: 'MonitorPlay.svg',due: 'Due in 8 days',          amount: '$18',    kind: 'scheduled', col: '#c4477f' },
  ],
  // Family operations — a teen's Banyan card (money + controls, not chores)
  family: {
    child: 'Emma', spentWeek: 42, purchases: 4, allowance: 20, allowanceDue: 'Sunday',
    card: { id: 'emma', name: "Emma's card", network: 'Banyan Visa', last4: '5512',
      gradient: 'linear-gradient(135deg,#7b4bd4 0%,#4a2a8a 100%)' },
    pending: { merchant: 'Steam', amount: 28, category: 'Games', ago: '2h ago', icon: 'GameController.svg' },
    spend: [
      { t: 'Steam',     s: 'Mon · Games',     a: '$28.00', ic: 'GameController.svg' },
      { t: 'Starbucks', s: 'Wed · Food',      a: '$6.40',  ic: 'ShoppingBag.svg' },
      { t: 'Spotify',   s: 'Thu · Music',     a: '$5.99',  ic: 'SpotifyLogo.svg' },
      { t: 'Uber',      s: 'Fri · Transport', a: '$1.61',  ic: 'ShoppingBag.svg' },
    ],
  },
  // Beneficiary / payee verification
  payee: {
    oldName: 'Acme Services LLC', newName: 'Acme Service Group',
    routing: 'ICICI · →9012', lastPaid: '$1,200 · last month', confidence: 'Moderate',
  },
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
// Multi-turn conversation state for stateful journeys (freeze / vigilance).
// null when no flow is active; otherwise { journey, card, step, vigilance? }.
let _agFlow = null;
// When true, renderers skip the typewriter + follow-ups so the card-styles
// gallery can lay every component out instantly.
let _agGalleryMode = false;
let _prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Query router ────────────────────────────────────────
function _agRouteQuery(text) {
  var t = text.toLowerCase();
  // ── Context-aware replies inside an active multi-turn flow ──
  if (_agFlow) {
    var fr = _agFlowReply(t);
    if (fr) return fr;
    _agFlow = null; // unmatched reply ends the flow → treat as a fresh request
  }
  // ── Stateful journey entries ──
  if (/\b(freeze|lock|pause|block|disable|stop)\b/.test(t) && /card/.test(t)) return _agScenarioFreezeStart(t);
  if (/duplicate|flagged?|suspicious|unusual|fraud|double[- ]?charge|review.{0,16}(charge|activity|transaction)|anything.{0,16}(review|attention|watch)|need.{0,10}attention/.test(t)) return _agScenarioVigilance();
  if (/bills?\s*(coming|due|up)?|recurring|what.{0,12}(bills?|due)|upcoming bills?|subscriptions?\b/.test(t)) return _agScenarioBills();
  if (/afford|can i (buy|spend|book)|forecast|cashflow|cash flow|runway|month[- ]?end|will i have enough|drop below|enough (money|funds|to)/.test(t)) return _agScenarioAfford(t);
  if (/sav(e|ing)|goal|\$?\d[\d,]*k?\b.{0,20}(by|for|saved)|vacation fund|set aside|put aside/.test(t)) return _agScenarioGoal(t);
  if (/\b(emma|liam)\b|allowance|family|my (kid|child|teen|son|daughter)|(approve|pending).{0,16}(request|purchase)/.test(t)) return _agScenarioFamily(t);
  if (/payee|beneficiar|same vendor|vendor.{0,16}(last|paid)|verify.{0,12}(payee|vendor|recipient)|account number.{0,12}correct|is this the same/.test(t)) return _agScenarioPayee();
  // Chip phrases — exact or close matches first
  if (/due this week|what.{0,10}due|upcoming|scheduled|schedule.{0,10}payment|payments? due/.test(t)) return _agScenarioUpcoming();
  if (/recent spending|show.{0,8}spend|spending|last month|dining|categor/.test(t)) return _agScenarioSpendUI();
  if (/beneficiar|recipient|who can i pay|pick.{0,8}receiv/.test(t)) return _agScenarioRecipientSelect();
  if (/bescom|electricity|utility|bill status/.test(t)) return _agScenarioBillStatus();
  // Semantic
  if (/\b(send|transfer|pay |remit|wire)\b/.test(t))    return _agScenarioTransfer(t);
  if (/\b(rate|exchange|convert|fx|corridor)\b/.test(t)) return _agScenarioRate(t);
  if (/\b(balance|how much|available|account|funds)\b/.test(t)) return _agScenarioBalance(t);
  // Escalate to a human support case when the Agent can't resolve it
  if (/\b(human|person|representative|talk to (someone|a human|support)|speak to|raise (a )?(ticket|case|complaint)|open (a )?(ticket|case)|support ticket|file a complaint|not resolved|didn'?t (help|work|resolve)|still (not|an issue|broken|happening)|escalate|complain)\b/.test(t)) return _agScenarioSupportEscalate();
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

// ── Stateful flow: interpret a reply given the active journey/step ──
function _agFlowReply(t) {
  var yes = /^\s*(yes|yep|yeah|yup|sure|confirm|correct|do it|go ahead|please do|ok(ay)?|that'?s? (it|right|the one|correct))\b/.test(t);
  var no  = /^\s*(no|nope|nah|different|another|wrong|not that)\b/.test(t);
  if (_agFlow.journey === 'freeze') {
    if (_agFlow.step === 'disambiguate') {
      if (yes) return _agScenarioFreezeConfirm(_agFlow.card, { vigilance: _agFlow.vigilance });
      if (no)  return _agScenarioRecipientSelect(); // graceful exit — not core to the demo
    }
    if (_agFlow.step === 'confirm') {
      if (yes || /freeze|lock|confirm/.test(t)) return _agScenarioFreezeDone(_agFlow.card, { vigilance: _agFlow.vigilance });
    }
  }
  if (_agFlow.journey === 'vigilance') {
    if (/why|explain|reason|how.{0,12}(know|flag|tell)|what.{0,8}made/.test(t)) return _agScenarioFlagReason();
    if (/what.{0,12}(do|should)|next step|options?|advice|help|recommend/.test(t)) return _agScenarioFlagOptions();
    if (/\b(freeze|lock|block|disable)\b/.test(t)) return _agScenarioFreezeConfirm('dining', { vigilance: true });
    if (/dispute|report|fraud|challenge/.test(t)) return _agScenarioDispute();
    if (/wait|hold|leave it|do nothing|24/.test(t)) return _agScenarioWait();
  }
  if (_agFlow.journey === 'bills') {
    if (/unusual|chang|increas|\bup\b|which.{0,10}(bill|increas)/.test(t)) return _agScenarioBillsUnusual();
    if (/enough|cover|can i (cover|pay)|afford/.test(t)) return _agScenarioBillsCover();
    if (/remind/.test(t)) return _agScenarioRemind('Rent', 'if checking is still below your cushion 2 days before');
  }
  if (_agFlow.journey === 'cashflow') {
    if (/driv|why|breakdown|what.{0,10}(driving|behind|that)/.test(t)) return _agScenarioAffordWhy();
    if (/cancel|subscription|cut/.test(t)) return _agScenarioAffordCancel();
    if (/recommend|what.{0,10}(do|should)|advice/.test(t)) return _agScenarioAffordRec();
  }
  if (_agFlow.journey === 'goal') {
    if (/deposit|from (each|incoming|my)|percent|%/.test(t)) return _agScenarioGoalDeposit();
    if (/heav|lean|tight|adaptive|vary|behind/.test(t)) return _agScenarioGoalAdaptive();
    if (yes || /do (that|it)|create|set.{0,6}up|start it/.test(t)) return _agScenarioGoalCreate();
  }
  if (_agFlow.journey === 'family') {
    if (/approv|pending|request|the purchase/.test(t)) return _agScenarioFamilyApprove();
    if (/decline|deny|reject/.test(t)) return _agScenarioFamilyDecline();
    if (/spend|spent|activity|purchase|what.{0,10}buy|show.{0,10}card/.test(t)) return _agScenarioFamilySpend();
    if (/\b(freeze|lock|block|disable|pause)\b/.test(t)) return _agScenarioFreezeConfirm(_AG_DATA.family.card);
    if (/allowance|pay|send.{0,10}(money|allowance)/.test(t)) return _agScenarioFamilyAllowance();
  }
  if (_agFlow.journey === 'payee') {
    if (/confiden|how sure|certain|how.{0,8}sure/.test(t)) return _agScenarioPayeeConfidence();
    if (/verify|should i|check.{0,8}first|safe/.test(t)) return _agScenarioPayeeVerify();
    if (/remind.{0,18}(send|clear|funds|available)|when.{0,14}(clear|available)|once.{0,10}clear/.test(t)) return _agScenarioPayeeRemind();
  }
  return null;
}

// ── Journey 2: Card & spend controls ──
function _agScenarioFreezeStart(t) {
  var card = /din(ing|e)|food|restaurant|7290/.test(t) ? _AG_DATA.cards[1] : _AG_DATA.cards[0];
  _agFlow = { journey: 'freeze', card: card, step: 'disambiguate' };
  return { type: 'freeze_disambig', fast: true, data: { card: card } };
}
function _agScenarioFreezeConfirm(card, opts) {
  if (typeof card === 'string') card = _AG_DATA.cards.find(function(c){ return c.id === card; }) || _AG_DATA.cards[0];
  _agFlow = { journey: 'freeze', card: card, step: 'confirm', vigilance: opts && opts.vigilance };
  return { type: 'freeze_confirm', fast: true, data: { card: card, vigilance: opts && opts.vigilance } };
}
function _agScenarioFreezeDone(card, opts) {
  if (typeof card === 'string') card = _AG_DATA.cards.find(function(c){ return c.id === card; }) || _AG_DATA.cards[0];
  _agFlow = null;
  return { type: 'freeze_done', fast: true, data: { card: card, vigilance: opts && opts.vigilance } };
}

// ── Journey 3: Awareness & vigilance ──
function _agScenarioVigilance() {
  var card = _AG_DATA.cards[1]; // dining card
  _agFlow = { journey: 'vigilance', card: card, step: 'alert' };
  return {
    type: 'vigilance', fast: true,
    steps: [
      { id: 's1', label: 'Scanning recent card activity' },
      { id: 's2', label: 'Comparing against your patterns' },
    ],
    data: { card: card },
  };
}
function _agScenarioFlagReason() {
  if (_agFlow) _agFlow.step = 'reason';
  return { type: 'flag_reason', fast: true, data: {} };
}
function _agScenarioFlagOptions() {
  if (_agFlow) _agFlow.step = 'options';
  return { type: 'flag_options', fast: true, data: {} };
}
function _agScenarioDispute() {
  _agFlow = null;
  return { type: 'flag_dispute', fast: true, data: {} };
}
function _agScenarioWait() {
  if (_agFlow) _agFlow.step = 'options';
  return { type: 'flag_wait', fast: true, data: {} };
}

// ── Journey: Bills & recurring ──
function _agScenarioBills() {
  _agFlow = { journey: 'bills', step: 'list' };
  return { type: 'bills', fast: true, data: {} };
}
function _agScenarioBillsUnusual() { return { type: 'bills_unusual', fast: true, data: {} }; }
function _agScenarioBillsCover()   { return { type: 'bills_cover', fast: true, data: {} }; }
function _agScenarioRemind(name, cond) {
  _agFlow = null;
  return { type: 'remind', fast: true, data: { name: name, cond: cond } };
}

// ── Journey: Cashflow & forecasting ──
function _agScenarioAfford(t) {
  var m = t.match(/[£$€]?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*k?/);
  var amount = m ? parseFloat(m[1].replace(/,/g, '')) : 1200;
  if (/\dk\b/.test(t) && amount < 100) amount *= 1000;
  _agFlow = { journey: 'cashflow', step: 'forecast' };
  return { type: 'afford', fast: true, data: { amount: amount } };
}
function _agScenarioAffordWhy()    { return { type: 'afford_why', fast: true, data: {} }; }
function _agScenarioAffordCancel() { return { type: 'afford_cancel', fast: true, data: {} }; }
function _agScenarioAffordRec()    { _agFlow = null; return { type: 'afford_rec', fast: true, data: {} }; }

// ── Journey: Savings, goals & Spaces ──
function _agScenarioGoal(t) {
  var m = t.match(/\$?\s*(\d[\d,]*)\s*(k)?/);
  var target = m ? parseFloat(m[1].replace(/,/g, '')) * (m[2] ? 1000 : 1) : 3000;
  if (target < 100) target = 3000;
  _agFlow = { journey: 'goal', step: 'plan', target: target };
  return { type: 'goal', fast: true, data: { target: target, weeks: 16, current: 0 } };
}
function _agScenarioGoalDeposit()  { return { type: 'goal_deposit', fast: true, data: {} }; }
function _agScenarioGoalAdaptive() { return { type: 'goal_adaptive', fast: true, data: {} }; }
function _agScenarioGoalCreate() {
  var target = (_agFlow && _agFlow.target) || 3000;
  _agFlow = null;
  return { type: 'goal_create', fast: true, data: { target: target } };
}

// ── Journey: Family operations (teen card — money & controls) ──
function _agScenarioFamily(t) {
  _agFlow = { journey: 'family', step: 'overview' };
  return { type: 'family', fast: true, data: {} };
}
function _agScenarioFamilySpend()   { return { type: 'family_spend', fast: true, data: {} }; }
function _agScenarioFamilyApprove() { if (_agFlow) _agFlow.step = 'approve'; return { type: 'family_approve', fast: true, data: {} }; }
function _agScenarioFamilyDecline() { _agFlow = null; return { type: 'family_decline', fast: true, data: {} }; }
function _agScenarioFamilyAllowance(){ if (_agFlow) _agFlow.step = 'allowance'; return { type: 'family_allowance', fast: true, data: {} }; }

// ── Journey: Beneficiary & payee management ──
function _agScenarioPayee() {
  _agFlow = { journey: 'payee', step: 'verify' };
  return { type: 'payee', fast: true, data: {} };
}
function _agScenarioPayeeConfidence() { return { type: 'payee_confidence', fast: true, data: {} }; }
function _agScenarioPayeeVerify()     { return { type: 'payee_verify', fast: true, data: {} }; }
function _agScenarioPayeeRemind() {
  _agFlow = null;
  return { type: 'remind', fast: true, data: { name: _AG_DATA.payee.newName, cond: 'the moment your balance is available' } };
}

// Transfer also needs fromAccount.flag — derive it from currency
function _agCurrencyFlag(cur) {
  return cur === 'USD' ? '🇺🇸' : cur === 'GBP' ? '🇬🇧' : cur === 'EUR' ? '🇪🇺' : cur === 'INR' ? '🇮🇳' : cur === 'AED' ? '🇦🇪' : cur === 'JPY' ? '🇯🇵' : '';
}

// ── Step state machine ─────────────────────────────────
// ── Thinking block (replaces old step list) ──────────────────────────────────
// Renders: spinner + shimmer "Banyan is thinking" + Xs timer
//          scrolling card with step text auto-advancing
// On complete: rolls up, fires onComplete
// Split text into per-character spans for the shimmer-wave thinking animation
function _agShimmerWave(el, text) {
  if (!el) return;
  el.textContent = '';
  var frag = document.createDocumentFragment();
  for (var i = 0; i < text.length; i++) {
    var s = document.createElement('span');
    s.className = 'ag-sw';
    s.style.setProperty('--i', i);
    s.textContent = text[i];
    frag.appendChild(s);
  }
  el.appendChild(frag);
}

// Progress label: per-char shimmer wave (agent loading animation)
function _smpShimmerLabel(el) {
  if (!el) return;
  _agShimmerWave(el, 'Transfer in progress');
}

// Roll the thinking label to new text: old line rolls up + out, new rolls in from below
function _agRollLabel(labelEl, text) {
  if (!labelEl) return;
  var line = document.createElement('span');
  line.className = 'ag-think-line';
  _agShimmerWave(line, text);
  var prev = labelEl.querySelector('.ag-think-line');
  labelEl.appendChild(line);
  if (!prev) return; // first line — appear in place
  // Old line rolls up and out
  prev.classList.add('ag-think-line--out');
  setTimeout(function() { if (prev.parentNode) prev.remove(); }, 380);
  // New line starts below, then rolls up into place
  line.classList.add('ag-think-line--in');
  void line.offsetWidth; // force reflow so the transition runs
  line.classList.remove('ag-think-line--in');
}

// Generic reasoning steps for turns that don't define their own
var _AG_DEFAULT_STEPS = [
  { id: 'd1', label: 'Understanding your request' },
  { id: 'd2', label: 'Reviewing your accounts' },
  { id: 'd3', label: 'Putting together an answer' },
];
function _agRunSteps(aiDiv, steps, msgs, onComplete, totalMs) {
  if (!steps || !steps.length) steps = _AG_DEFAULT_STEPS;
  // ── Build the block ──────────────────────────────────────────────────────
  var block = document.createElement('div');
  block.className = 'ag-think-block';

  // Header: spinner + shimmer label + timer
  block.innerHTML =
    '<div class="ag-think-header">' +
      '<div class="ag-think-spinner" aria-hidden="true"></div>' +
      '<span class="ag-think-label">Banyan is thinking</span>' +
    '</div>';

  aiDiv.appendChild(block);

  var labelEl  = block.querySelector('.ag-think-label');
  labelEl.textContent = '';
  _agRollLabel(labelEl, 'Banyan is thinking'); // first line appears in place

  // ── Step sequencing ──────────────────────────────────────────────────────
  var TOTAL_TARGET  = totalMs || 10000;
  var COLLAPSE_COST = 600;
  var perStep       = Math.floor((TOTAL_TARGET - COLLAPSE_COST) / steps.length);
  var DWELL_BASE    = Math.floor(perStep * 0.85);
  var DWELL_JITTER  = Math.floor(perStep * 0.30);
  var idx = 0;

  // Swap the shimmer label to the current step text
  function appendStep(label) {
    _agRollLabel(labelEl, label);
  }

  function runNext() {
    if (idx >= steps.length) {
      // All steps done — roll up
      _agCollapseThink(block, onComplete);
      return;
    }
    var label = steps[idx].label;
    var delay = idx === 0 ? 80 : 40;
    setTimeout(function() {
      appendStep(label);
    }, delay);
    var dwell = DWELL_BASE + Math.floor(Math.random() * DWELL_JITTER);
    setTimeout(function() {
      idx++;
      setTimeout(runNext, 60);
    }, delay + dwell);
  }
  runNext();
}

function _agCollapseThink(block, onComplete) {
  var aiDiv   = block.parentElement;
  var label   = block.querySelector('.ag-think-label');
  var spinner = block.querySelector('.ag-think-spinner');

  // 1. Roll the current thinking line up and out (same motion as step changes)
  var curLine = label.querySelector('.ag-think-line') || label;
  curLine.classList.add('ag-think-line--out');

  setTimeout(function() {
    // 2. Detach spinner before collapsing block
    var trail = document.createElement('div');
    trail.className = 'ag-think-trail';
    trail.appendChild(spinner);
    aiDiv.appendChild(trail);

    // 3. Collapse the now-empty block
    block.style.maxHeight = block.scrollHeight + 'px';
    block.classList.add('ag-think-collapsing');

    setTimeout(function() {
      block.style.display = 'none';

      // 4. MutationObserver keeps trail pinned to the bottom of aiDiv
      //    as onComplete() progressively adds content children.
      var obs = new MutationObserver(function() {
        // If trail has been removed externally, stop observing
        if (!trail.parentNode) { obs.disconnect(); return; }
        // Re-append trail to bottom only if it is not already the last child
        if (aiDiv.lastChild !== trail) {
          aiDiv.appendChild(trail);
        }
      });
      obs.observe(aiDiv, { childList: true });

      // 5. Fire content render
      onComplete();

      // 6. After content fully settles, fade spinner out
      //    Allow enough time for longest ctx stream (~2.5s) + card animation
      setTimeout(function() {
        obs.disconnect();
        trail.style.transition = 'opacity 500ms ease';
        trail.style.opacity    = '0';
        setTimeout(function() { trail.remove(); }, 500);
      }, 3200);
    }, 400);
  }, 300);
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
// Part 1: context line — streams text character by character, calls onDone when finished
function _agAddCtx(aiDiv, text, onDone) {
  var el = document.createElement('div');
  el.className = 'ag-reply-ctx';
  el.innerHTML = '<span class="ag-cursor"></span>';
  aiDiv.appendChild(el);
  // Gallery mode: drop the text in instantly and hand off to reveal the card
  if (_agGalleryMode) {
    el.textContent = text;
    el.classList.add('s-in');
    if (onDone) requestAnimationFrame(function() { requestAnimationFrame(onDone); });
    return el;
  }
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { el.classList.add('s-in'); });
  });
  var cursor = el.querySelector('.ag-cursor');
  var chars = text.split('');
  var i = 0;
  function typeChar() {
    if (i < chars.length) {
      cursor.insertAdjacentText('beforebegin', chars[i]);
      i++;
      // Slightly faster than body text (12–18ms per char)
      setTimeout(typeChar, 12 + Math.floor(Math.random() * 10));
    } else {
      cursor.style.transition = 'opacity 300ms ease';
      cursor.style.opacity = '0';
      setTimeout(function() {
        if (cursor.parentNode) cursor.remove();
        if (onDone) onDone();
      }, 320);
    }
  }
  setTimeout(typeChar, 40);
  return el;
}
// Typed intro line, then a staggered bulleted list — for enumerated answers
// that are hard to parse as a paragraph.
function _agAddList(aiDiv, intro, items, onDone) {
  function buildList() {
    var list = document.createElement('ul');
    list.className = 'ag-reply-list';
    items.forEach(function(t) {
      var li = document.createElement('li');
      li.className = 'ag-reply-li';
      li.textContent = t;
      list.appendChild(li);
    });
    aiDiv.appendChild(list);
    if (_agGalleryMode) {
      [].forEach.call(list.children, function(li) { li.classList.add('s-in'); });
      if (onDone) requestAnimationFrame(function() { requestAnimationFrame(onDone); });
      return;
    }
    var kids = [].slice.call(list.children);
    kids.forEach(function(li, k) {
      setTimeout(function() { li.classList.add('s-in'); }, 90 + k * 110);
    });
    setTimeout(function() { if (onDone) onDone(); }, 90 + kids.length * 110 + 260);
  }
  if (intro) { _agAddCtx(aiDiv, intro, buildList); }
  else buildList();
}
// Part 3: follow-up list (next actions)
function _agAddFollowups(aiDiv, msgs, chips) {
  if (_agGalleryMode) return; // gallery shows cards only, no next-step chips
  var wrap = document.createElement('div');
  wrap.className = 'ag-followup-wrap';
  var header = document.createElement('div');
  header.className = 'ag-followup-header';
  header.textContent = "Here's what you can do next";
  wrap.appendChild(header);
  var list = document.createElement('div');
  list.className = 'ag-followup-list';
  chips.forEach(function(c) {
    var btn = document.createElement('button');
    btn.className = 'ag-followup-row';
    btn.setAttribute('data-text', c.text || c.label);
    btn.innerHTML =
      '<span class="ag-followup-arrow" aria-hidden="true">↳</span>' +
      '<span class="ag-followup-label">' + c.label + '</span>';
    btn.addEventListener('click', function() {
      agentSendText(btn.getAttribute('data-text'));
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  aiDiv.appendChild(wrap);
  // Keep the feedback row (which commits as soon as the reply text settles) at
  // the very bottom of the message, below the card and these follow-ups.
  var _fb = aiDiv.querySelector(':scope > .ag-feedback');
  if (_fb) aiDiv.appendChild(_fb);
  setTimeout(function() {
    requestAnimationFrame(function() {
      wrap.classList.add('s-in');
    });
  }, 320);
}

// ── SLIDE-TO-CONFIRM ──────────────────────────────────
// Wires touch + mouse drag on the slide track. Calls onConfirm() at ≥85% travel.
function _agInitSlide(track, onConfirm) {
  var fill  = track.querySelector('.ag-slide-fill');
  var thumb = track.querySelector('.ag-slide-thumb');
  var label = track.querySelector('.ag-slide-label');
  var THUMB_W = 46, PAD = 5;

  var dragging = false, startClientX = 0, curX = 0, maxX = 0;

  function calcMax() { maxX = track.offsetWidth - THUMB_W - PAD * 2; }
  calcMax();

  function setPos(x) {
    x = Math.max(0, Math.min(x, maxX));
    curX = x;
    thumb.style.transform = 'translateX(' + x + 'px)';
    fill.style.width = (x + THUMB_W + PAD) + 'px';
    var pct = maxX > 0 ? x / maxX : 0;
    label.style.opacity = Math.max(0, 1 - pct * 2.2).toString();
    if (pct >= 0.85) { doConfirm(); }
  }

  function doConfirm() {
    if (track.classList.contains('track-confirmed')) return;
    track.classList.add('track-confirmed');
    // Snap thumb to end
    thumb.style.transition = 'transform 280ms var(--ease-spring)';
    thumb.style.transform = 'translateX(' + maxX + 'px)';
    fill.style.transition = 'width 280ms var(--ease-spring)';
    fill.style.width = track.offsetWidth + 'px';
    // Morph arrow → checkmark
    var icon = thumb.querySelector('.ag-slide-thumb-icon');
    if (icon) {
      icon.style.opacity = '0';
      setTimeout(function() {
        icon.innerHTML = '<svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true"><path d="M1.5 5.5l4 4 7-8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        icon.style.opacity = '1';
      }, 140);
    }
    setTimeout(onConfirm, 340);
  }

  function onStart(clientX) {
    calcMax();
    dragging = true;
    startClientX = clientX - curX;
    thumb.style.transition = 'none';
    fill.style.transition = 'none';
    track.classList.add('grabbing');
  }
  function onMove(clientX) {
    if (!dragging) return;
    setPos(clientX - startClientX);
  }
  function onEnd() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('grabbing');
    if (!track.classList.contains('track-confirmed')) {
      // Snap back with spring
      thumb.style.transition = 'transform 380ms var(--ease-spring)';
      fill.style.transition   = 'width 380ms var(--ease-spring)';
      setPos(0);
      label.style.opacity = '1';
      setTimeout(function() { thumb.style.transition = 'none'; fill.style.transition = 'none'; }, 380);
    }
  }

  track.addEventListener('touchstart', function(e) { onStart(e.touches[0].clientX); }, { passive: true });
  track.addEventListener('touchmove',  function(e) { e.preventDefault(); onMove(e.touches[0].clientX); }, { passive: false });
  track.addEventListener('touchend',   onEnd);
  track.addEventListener('mousedown',  function(e) { e.preventDefault(); onStart(e.clientX); });
  document.addEventListener('mousemove', onMove.bind(null, window._agSlideClientX = 0));
  // Use a closure to capture per-instance move/up
  var _onDocMove = function(e) { if (dragging) onMove(e.clientX); };
  var _onDocUp   = function()  { onEnd(); };
  document.addEventListener('mousemove', _onDocMove);
  document.addEventListener('mouseup',   _onDocUp);
  // Cleanup when track is removed
  var obs = new MutationObserver(function(_, o) {
    if (!document.contains(track)) {
      document.removeEventListener('mousemove', _onDocMove);
      document.removeEventListener('mouseup',   _onDocUp);
      o.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

// ── TRANSFER STATUS (spec: TransferStatusBlock) ────────
function _agRenderTransferStatus(aiDiv, msgs, td, refNum) {
  var card = document.createElement('div');
  card.className = 'ag-tx-status-card';
  var stages = [
    { key: 'submitted',  label: 'Transfer submitted',             sub: 'Reference ' + refNum,                            status: 'done'    },
    { key: 'processing', label: 'Processing',                     sub: 'Deducting from your ' + td.fromCur + ' account', status: 'active'  },
    { key: 'in_transit', label: 'In transit',                     sub: 'Usually within 2 hours',                         status: 'pending' },
    { key: 'delivered',  label: 'Delivered to ' + td.recip.name,  sub: td.recip.currency + ' ' + td.convertedAmt + ' · ' + td.recip.flag, status: 'pending' },
  ];
  var html = '<div class="ag-tx-status-header">Transfer status</div><div class="ag-tx-stage-list">';
  stages.forEach(function(s) {
    var cls = s.status === 'done' ? 'st-done' : s.status === 'active' ? 'st-active' : 'st-pending';
    var iconInner = '';
    if (s.status === 'done') {
      iconInner = '<svg width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden="true"><path d="M1 4l3 3 6-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else if (s.status === 'active') {
      iconInner = '<div style="width:6px;height:6px;border-radius:50%;background:#fff"></div>';
    }
    html += '<div class="ag-tx-stage ' + cls + '">';
    html +=   '<div class="ag-tx-stage-icon">' + iconInner + '</div>';
    html +=   '<div class="ag-tx-stage-text">';
    html +=     '<div class="ag-tx-stage-label">' + _agEscape(s.label) + '</div>';
    html +=     '<div class="ag-tx-stage-sub">' + _agEscape(s.sub) + '</div>';
    html +=   '</div>';
    html += '</div>';
  });
  html += '</div>';
  card.innerHTML = html;
  // Stream ctx first, then slide card in
  _agAddCtx(aiDiv, 'Done — your ' + td.fromSym + td.amount.toFixed(2) + ' is on its way to ' + td.recip.name + '. It should reach their ' + td.recip.currency + ' account within 2 hours. You\'ll get a notification the moment it\'s delivered.', function() {
    setTimeout(function() {
      aiDiv.appendChild(card);
      requestAnimationFrame(function() { requestAnimationFrame(function() {
        card.classList.add('ui-in');
        card.querySelectorAll('.ag-tx-stage').forEach(function(el, i) {
          setTimeout(function() { el.classList.add('st-in'); }, 60 + i * 70);
        });
      }); });
    }, 120);
  });
  // Progress "processing → in_transit" after 1.8s, then fire receipt
  setTimeout(function() {
    var stageEls = card.querySelectorAll('.ag-tx-stage');
    var activeEl = stageEls[1], nextEl = stageEls[2];
    if (activeEl) {
      activeEl.classList.remove('st-active');
      activeEl.classList.add('st-done');
      var prev = activeEl.previousElementSibling;
      if (prev) prev.style.setProperty('--line-color', 'var(--brand-primary)');
      // Update connector color inline since it's a ::after pseudo
      activeEl.style.setProperty('--conn', 'var(--brand-primary)');
    }
    if (nextEl) { nextEl.classList.remove('st-pending'); nextEl.classList.add('st-active'); }
    setTimeout(function() { _agRenderReceiptV2(aiDiv, msgs, td, refNum); }, 800);
  }, 1800);
}

// ── RECEIPT (spec: ReceiptBlock) ───────────────────────
function _agRenderReceiptV2(aiDiv, msgs, td, refNum) {
  var card = document.createElement('div');
  card.className = 'ag-receipt-card-v2';
  var html = '<div class="ag-receipt-v2-head">';
  html += '<div class="ag-receipt-v2-circle" id="agRcCircle">';
  html +=   '<svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><polyline points="8,22 18,32 36,14" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  html += '</div>';
  html += '<div class="ag-receipt-v2-sent">Successfully transferred</div>';
  html += '<div class="ag-receipt-v2-amount">' + td.fromSym + td.amount.toFixed(2) + '</div>';
  html += '</div>';
  html += '<div class="ag-receipt-v2-body">';
  html +=   '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">Recipient</span><span class="ag-receipt-v2-row-val">' + _agEscape(td.recip.name) + ' ' + td.recip.flag + '</span></div>';
  html +=   '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">They receive</span><span class="ag-receipt-v2-row-val">' + (td.sym || td.recip.sym) + td.convertedAmt + '</span></div>';
  if (td.fromSpace) html += '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">From</span><span class="ag-receipt-v2-row-val">' + _agEscape(td.fromSpace) + '</span></div>';
  if (td.purpose)   html += '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">Purpose</span><span class="ag-receipt-v2-row-val">' + _agEscape(td.purpose) + '</span></div>';
  html +=   '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">Arrival</span><span class="ag-receipt-v2-row-val">' + (td.scheduled ? _agEscape(td.timing.label) : 'Within 2 hours') + '</span></div>';
  html +=   '<div class="ag-receipt-v2-ref"><span class="ag-receipt-v2-ref-label">Reference</span><span class="ag-receipt-v2-ref-val">' + _agEscape(refNum) + '</span></div>';
  html += '</div>';
  card.innerHTML = html;
  aiDiv.appendChild(card);
  requestAnimationFrame(function() { requestAnimationFrame(function() {
    card.classList.add('ui-in');
    setTimeout(function() {
      var circ = card.querySelector('#agRcCircle');
      if (circ) circ.classList.add('rc-in');
    }, 100);
    
  }); });
  // Post-action next steps: 3 chips, in priority order per spec
  _agAddFollowups(aiDiv, msgs, [
    { label: 'Send another', text: 'Send money' },
    { label: 'View upcoming', text: 'Show upcoming transfers' },
    { label: 'Check balance', text: 'What is my balance?' }
  ]);
}

// ── SCHEDULED TRANSFER CONFIRMATION ───────────────────
function _agRenderScheduled(aiDiv, msgs, td, refNum) {
  var card = document.createElement('div');
  card.className = 'ag-receipt-card-v2';
  var html = '<div class="ag-receipt-v2-head">';
  html += '<div class="ag-receipt-v2-circle ag-rc-scheduled" id="agRcCircle">';
  html +=   '<svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="22" r="13" stroke="#fff" stroke-width="3"/><path d="M22 15v8l5 3" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  html += '</div>';
  html += '<div class="ag-receipt-v2-sent">Transfer scheduled</div>';
  html += '<div class="ag-receipt-v2-amount">' + td.fromSym + td.amount.toFixed(2) + '</div>';
  html += '</div>';
  html += '<div class="ag-receipt-v2-body">';
  html +=   '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">Recipient</span><span class="ag-receipt-v2-row-val">' + _agEscape(td.recip.name) + ' ' + td.recip.flag + '</span></div>';
  html +=   '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">They receive</span><span class="ag-receipt-v2-row-val">' + (td.sym || td.recip.sym) + td.convertedAmt + '</span></div>';
  if (td.fromSpace) html += '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">From</span><span class="ag-receipt-v2-row-val">' + _agEscape(td.fromSpace) + '</span></div>';
  if (td.purpose)   html += '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">Purpose</span><span class="ag-receipt-v2-row-val">' + _agEscape(td.purpose) + '</span></div>';
  html +=   '<div class="ag-receipt-v2-row"><span class="ag-receipt-v2-row-label">Sends</span><span class="ag-receipt-v2-row-val">' + _agEscape(td.timing.label) + '</span></div>';
  html +=   '<div class="ag-receipt-v2-ref"><span class="ag-receipt-v2-ref-label">Reference</span><span class="ag-receipt-v2-ref-val">' + _agEscape(refNum) + '</span></div>';
  html += '</div>';
  card.innerHTML = html;
  _agAddCtx(aiDiv, 'Scheduled — I\'ll send ' + td.fromSym + td.amount.toFixed(2) + ' to ' + td.recip.name + ' ' + td.timing.label.toLowerCase() + ', from your ' + td.fromSpace + '. You can change or cancel it any time before then.', function() {
    setTimeout(function() {
      aiDiv.appendChild(card);
      requestAnimationFrame(function() { requestAnimationFrame(function() {
        card.classList.add('ui-in');
        setTimeout(function() { var c = card.querySelector('#agRcCircle'); if (c) c.classList.add('rc-in'); }, 100);
      }); });
      _agAddFollowups(aiDiv, msgs, [
        { label: 'View upcoming', text: 'Show upcoming transfers' },
        { label: 'Send another', text: 'Send money' }
      ]);
    }, 120);
  });
}

// ── TRANSFER SUMMARY CARD ─────────────────────────────
// "Here is what you can do alternatively" — shared suggestion rows for the
// transfer review card (initial render and the purpose-confirm reply).
function _agBuildTransferAlt() {
  var alt = document.createElement('div');
  alt.className = 'ag-sm2-alt';
  var altItems = ['Change payment purpose', 'Change the space to be paid from', 'Schedule the payment for later'];
  var elbow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 4v4a1 1 0 0 0 1 1h6M9 6l3 3-3 3" stroke="rgba(0,0,0,0.4)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var altHtml = '<div class="ag-sm2-alt-head">Here is what you can do alternatively</div><div class="ag-sm2-alt-list">';
  altItems.forEach(function(t) {
    altHtml += '<button class="ag-sm2-alt-row" type="button" data-text="' + _agEscape(t) + '"><span class="ag-sm2-alt-ic">' + elbow + '</span><span class="ag-sm2-alt-label">' + _agEscape(t) + '</span></button>';
  });
  altHtml += '</div>';
  alt.innerHTML = altHtml;
  alt.querySelectorAll('.ag-sm2-alt-row').forEach(function(row) {
    row.addEventListener('click', function() {
      var t = row.getAttribute('data-text');
      if (/purpose/i.test(t))       agOpenPurposeSheet();
      else if (/space/i.test(t))    agOpenSpaceSheet();
      else if (/schedule/i.test(t)) agOpenScheduleSheet();
      else                          agentSendText(t);
    });
  });
  return alt;
}
function _agRenderTransfer(aiDiv, msgs, data) {
  var d = data;
  var fromSym = d.fromAccount.sym;
  var toSym   = d.recip.sym;
  var rateStr = d.rateInfo.rate.toFixed(2);
  var firstName = d.recip.name.split(' ')[0];
  var amtInt = Math.round(d.amount);
  var amtStr = d.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fromLast4 = (d.fromAccount.num || '').replace(/[^0-9]/g, '');
  var fromName = 'Checking ' + fromLast4;
  var fromBal = fromSym + d.fromAccount.balanceStr;
  var recipAcct = (d.recip.bank || '').match(/\d{3,}/);
  var recipSub = (recipAcct ? recipAcct[0] : '7654') + ' (' + (d.recip.bankShort || (d.recip.bank || '').split(' ·')[0] || 'HDFC Bank') + ')';
  var purpose = 'Family and Personal';

  var googleG = '<svg viewBox="0 0 48 48" width="13" height="13" aria-hidden="true" style="flex-shrink:0">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  var arrowSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="rgba(0,0,0,0.35)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var card = document.createElement('div');
  card.className = 'ag-ui-card ag-sm2-card';
  var html = '';
  // From → To route
  html += '<div class="ag-sm2-route ag-stagger-item">';
  html +=   '<div class="ag-sm2-acct">';
  html +=     '<span class="ag-sm2-acct-av"><img class="ag-sm2-from-av" src="assets/space-usd-checking.webp" alt=""></span>';
  html +=     '<span class="ag-sm2-acct-txt"><span class="ag-sm2-acct-name ag-sm2-from-name">' + _agEscape(fromName) + '</span><span class="ag-sm2-acct-sub ag-sm2-from-sub">' + _agEscape(fromBal) + '</span></span>';
  html +=   '</div>';
  html +=   '<span class="ag-sm2-arrow">' + arrowSvg + '</span>';
  html +=   '<div class="ag-sm2-acct">';
  html +=     '<span class="ag-sm2-recip-av" style="background:' + d.recip.color + '">' + d.recip.initials + '</span>';
  html +=     '<span class="ag-sm2-acct-txt"><span class="ag-sm2-acct-name">' + _agEscape(d.recip.name) + '</span><span class="ag-sm2-acct-sub">' + _agEscape(recipSub) + '</span></span>';
  html +=   '</div>';
  html += '</div>';
  // Amount panel
  html += '<div class="ag-sm2-panel ag-stagger-item">';
  html +=   '<div class="ag-sm2-rows">';
  html +=     '<div class="ag-sm2-row"><span class="ag-sm2-l">You are sending</span><span class="ag-sm2-v">' + fromSym + amtStr + '</span></div>';
  html +=     '<div class="ag-sm2-row"><span class="ag-sm2-l">Banyan’s fees</span><span class="ag-sm2-v"><span class="ag-sm2-free">Free</span> <s>' + fromSym + d.feeAmt.toFixed(2) + '</s></span></div>';
  html +=     '<div class="ag-sm2-row"><span class="ag-sm2-l">Exchange rate</span><span class="ag-sm2-v ag-sm2-rate">' + googleG + fromSym + '1 = ' + toSym + rateStr + '</span></div>';
  html +=   '</div>';
  html +=   '<div class="ag-sm2-div"></div>';
  html +=   '<div class="ag-sm2-rows">';
  html +=     '<div class="ag-sm2-row"><span class="ag-sm2-l">' + _agEscape(firstName) + ' receives</span><span class="ag-sm2-v">' + toSym + d.convertedAmt + '</span></div>';
  html +=     '<div class="ag-sm2-row"><span class="ag-sm2-l ag-sm2-arrival-l">Estimated arrival</span><span class="ag-sm2-v ag-sm2-arrival-v">Today, 9:44 AM PT</span></div>';
  html +=     '<div class="ag-sm2-row"><span class="ag-sm2-l">Purpose</span><span class="ag-sm2-v ag-sm2-purpose-v">' + purpose + '</span></div>';
  html +=   '</div>';
  html +=   '<div class="ag-sm2-btns">';
  html +=     '<button class="ag-sm2-edit" type="button">Edit details</button>';
  html +=     '<button class="ag-sm2-send" type="button">Send ' + fromSym + amtInt + '</button>';
  html +=   '</div>';
  html += '</div>';
  card.innerHTML = html;

  var td = { amount: d.amount, fromSym: fromSym, fromCur: d.fromCur, recip: d.recip,
             convertedAmt: d.convertedAmt, totalDebited: d.totalDebited, sym: d.recip.sym,
             fromSpace: fromName, purpose: purpose, scheduled: false };

  // Expose the live card so the purpose/space/schedule action sheets can edit it in place
  _agActiveTransfer = { card: card, td: td, fromSym: fromSym, amtInt: amtInt };

  card.querySelector('.ag-sm2-edit').addEventListener('click', function() { agOpenEditSheet(); });
  card.querySelector('.ag-sm2-send').addEventListener('click', function() {
    card.querySelectorAll('button').forEach(function(b) { b.disabled = true; });
    card.style.transition = 'opacity 180ms ease-out'; card.style.opacity = '0';
    var alt = aiDiv.querySelector('.ag-sm2-alt'); if (alt) { alt.style.transition = 'opacity 180ms ease-out'; alt.style.opacity = '0'; }
    setTimeout(function() {
      card.remove(); if (alt) alt.remove();
      var refNum = 'BNY-' + (10000 + Math.floor(Math.random() * 90000 % 90000));
      _agRenderTransferStatus(aiDiv, msgs, td, refNum);
    }, 200);
  });

  // "Here is what you can do alternatively" — suggestion rows
  var alt = _agBuildTransferAlt();

  // Stream intro ctx → card → rate line → alternatives
  _agAddCtx(aiDiv, 'Ready to send ' + fromSym + amtStr + ' to ' + d.recip.name + '. They’ll receive ' + toSym + d.convertedAmt + ' at the current rate. The rate will be the same for 5 mins.', function() {
    setTimeout(function() {
      aiDiv.appendChild(card);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          card.classList.add('ui-in');
          _agStagger(card, '.ag-stagger-item', 90);
        });
      });
      setTimeout(function() {
        aiDiv.appendChild(alt);
        requestAnimationFrame(function() { alt.classList.add('s-in'); });
      }, 500);
    }, 120);
  });
}

// ── Transfer edit sheets: purpose · space · schedule ───────────────────
var _agActiveTransfer = null;

var _AG_PURPOSES = [
  { icon: '🏠', label: 'Family and Personal' },
  { icon: '🏥', label: 'Medical' },
  { icon: '💡', label: 'Utility bills and Taxes' },
  { icon: '🎓', label: 'Education' },
  { icon: '🛡️', label: 'Insurance and Travel' },
  { icon: '💼', label: 'Business services' }
];
var _AG_SPACES = [
  { av: 'assets/space-usd-checking.webp', name: 'USD Checking',     last4: '3214', bal: '$137,978.00' },
  { av: 'assets/space-thailand.webp',     name: 'Thailand holiday', last4: '7654', bal: '$37,978.00' },
  { av: 'assets/space-moms.webp',         name: "Mom's expenses",   last4: '8745', bal: '$10,120.00' },
  { av: 'assets/space-wedding.webp',      name: 'Wedding',          last4: '8746', bal: '$50,768.00' }
];
var _AG_SCHEDULE = [
  { icon: '⚡️', label: 'Send now',          sub: 'Arrives today, 9:44 AM PT', arrival: 'Today, 9:44 AM PT', now: true },
  { icon: '🌅', label: 'Tomorrow morning',  sub: 'Jul 5 · around 9:00 AM',    arrival: 'Jul 5, ~9:00 AM' },
  { icon: '📅', label: 'This weekend',      sub: 'Jul 6',                     arrival: 'Jul 6, ~9:00 AM' },
  { icon: '🗓️', label: 'Next Monday',       sub: 'Jul 7',                     arrival: 'Jul 7, ~9:00 AM' }
];
var _agActCheck = '<svg class="ag-act-check" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" stroke="#46882B" stroke-width="1.5"/><polyline points="6,10 9,13 14,7" stroke="#46882B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function _agOpenActionSheet(title, rowsHtml, onPick) {
  var scrim = document.getElementById('agActScrim');
  var sheet = document.getElementById('agActSheet');
  var list  = document.getElementById('agActList');
  var t     = document.getElementById('agActTitle');
  if (!scrim || !sheet || !list) return;
  if (t) t.textContent = title;
  list.innerHTML = rowsHtml;
  list.querySelectorAll('.ag-act-row').forEach(function(row) {
    row.onclick = function() { onPick(+row.getAttribute('data-i')); };
  });
  scrim.classList.add('show');
  requestAnimationFrame(function() { sheet.classList.add('show'); });
  haptic(6);
}
function agCloseActionSheet() {
  var scrim = document.getElementById('agActScrim');
  var sheet = document.getElementById('agActSheet');
  if (sheet) sheet.classList.remove('show');
  if (scrim) scrim.classList.remove('show');
}

var _agActChev = '<svg class="ag-act-chev" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// "Edit details" → choose what to change, then drill into that sheet
function agOpenEditSheet() {
  if (!_agActiveTransfer) return;
  var td = _agActiveTransfer.td;
  var nameEl = _agActiveTransfer.card.querySelector('.ag-sm2-from-name');
  var opts = [
    { icon: '🏷️', label: 'Change payment purpose', sub: td.purpose, fn: agOpenPurposeSheet },
    { icon: '🪙', label: 'Change the space',        sub: nameEl ? nameEl.textContent : 'USD Checking', fn: agOpenSpaceSheet },
    { icon: '🗓️', label: 'Schedule for later',      sub: td.scheduled ? (td.scheduleLabel || 'Scheduled') : 'Send now', fn: agOpenScheduleSheet }
  ];
  var rows = opts.map(function(o, i) {
    return '<button class="ag-act-row" type="button" data-i="' + i + '">' +
      '<span class="ag-act-ic">' + o.icon + '</span>' +
      '<span class="ag-act-info"><span class="ag-act-label">' + _agEscape(o.label) + '</span>' +
        '<span class="ag-act-sub">' + _agEscape(o.sub) + '</span></span>' +
      _agActChev + '</button>';
  }).join('');
  _agOpenActionSheet('Edit details', rows, function(i) {
    agCloseActionSheet();
    setTimeout(opts[i].fn, 260); // let the sheet close before drilling in
  });
}

// Reuse the exact send-money "Purpose of payment" sheet (#purposeSheet) so the
// agent's purpose selection is identical to the send-money experience.
var _agPurposeMode = false;
var _agPendingPurpose = null;
function _agApplyPurpose(label) {
  if (!_agActiveTransfer) return;
  _agActiveTransfer.td.purpose = label;
  var v = _agActiveTransfer.card.querySelector('.ag-sm2-purpose-v');
  if (v) v.textContent = label;
  haptic(8);
}
// Confirming a purpose reads as a real conversational turn: the user's choice
// posts as a message, then the agent re-presents the updated transfer card and
// asks whether to send now.
function _agPurposeConfirmTurn(label) {
  if (!_agActiveTransfer) return;
  _agApplyPurpose(label);
  var msgs = document.getElementById('agentMsgs');
  if (!msgs) return;
  // Detach the old card + alt list from the previous message; the card moves
  // into the new reply below.
  var oldAi = _agActiveTransfer.card.closest('.ag-msg-ai');
  var oldAlt = oldAi ? oldAi.querySelector('.ag-sm2-alt') : null;
  if (oldAlt) oldAlt.remove();
  msgs.querySelectorAll('.ag-msg-ai').forEach(function(el) { el.style.minHeight = ''; });
  var userDiv = _agScriptUser('Set the purpose to ' + label + '.');
  var line = 'Done — the purpose is now ' + label + '. Here’s your updated transfer. Should I send it now?';
  var ai = document.createElement('div');
  ai.className = 'ag-msg-ai';
  ai.innerHTML = '<div class="ag-msg-ai-label">' + _AG_LEAF_SVG + '<span class="ag-msg-ai-name">Banyan AI</span></div>';
  msgs.appendChild(ai);
  requestAnimationFrame(function() { requestAnimationFrame(function() { ai.classList.add('visible'); }); });
  ai.style.minHeight = Math.max(0, msgs.clientHeight - userDiv.offsetHeight - 112) + 'px';
  _agSuppressJump = true;
  var jmp = document.getElementById('agentJump'); if (jmp) jmp.classList.remove('is-visible');
  var target = Math.max(0, userDiv.offsetTop - 20);
  _agSmoothScrollTo(msgs, target, 680, function() {
    _agSuppressJump = false; if (typeof _agUpdateJump === 'function') _agUpdateJump();
  });
  _agRunSteps(ai, _AG_DEFAULT_STEPS, msgs, function() {
    var lbl = ai.querySelector('.ag-msg-ai-label');
    if (lbl) { lbl.classList.add('show'); requestAnimationFrame(function() { requestAnimationFrame(function() { lbl.classList.add('in'); }); }); }
    _agAddCtx(ai, line, function() {
      _agRelocateTransferCard(ai, msgs);
      var alt = _agBuildTransferAlt();
      ai.appendChild(alt);
      requestAnimationFrame(function() { requestAnimationFrame(function() { alt.classList.add('s-in'); }); });
      _agAppendFooter(ai);
    });
  }, 3200);
}
// Move the live transfer card into the given reply and rebind its Send button
// so the send flow renders its status in the new message (not the original).
function _agRelocateTransferCard(ai, msgs) {
  if (!_agActiveTransfer) return;
  var card = _agActiveTransfer.card;
  ai.appendChild(card);
  requestAnimationFrame(function() { requestAnimationFrame(function() { card.classList.add('ui-in'); }); });
  var send = card.querySelector('.ag-sm2-send');
  if (send) {
    var fresh = send.cloneNode(true);            // strip the old aiDiv-bound listener
    send.parentNode.replaceChild(fresh, send);
    fresh.addEventListener('click', function() {
      card.querySelectorAll('button').forEach(function(b) { b.disabled = true; });
      card.style.transition = 'opacity 180ms ease-out'; card.style.opacity = '0';
      setTimeout(function() {
        card.remove();
        var refNum = 'BNY-' + (10000 + Math.floor(Math.random() * 90000 % 90000));
        _agRenderTransferStatus(ai, msgs, _agActiveTransfer.td, refNum);
      }, 200);
    });
  }
}
function agOpenPurposeSheet() {
  if (!_agActiveTransfer) return;
  _agPurposeMode = true;
  _agPendingPurpose = null;
  // Build the professional group on first use, then reflect the current pick.
  var wrap = document.getElementById('purposeProfRows');
  if (wrap && wrap.children.length === 0) smBuildProfRows('');
  var cur = _agActiveTransfer.td.purpose;
  document.querySelectorAll('#purposeSheet .purpose-row').forEach(function(r) {
    var lbl = (r.querySelector('.purpose-row-lbl') || {}).textContent || '';
    r.classList.toggle('sel', lbl === cur);
  });
  document.getElementById('purposeScrim').classList.add('open');
  document.getElementById('purposeSheet').classList.add('open');
}

function agOpenSpaceSheet() {
  if (!_agActiveTransfer) return;
  var nameEl = _agActiveTransfer.card.querySelector('.ag-sm2-from-name');
  var cur = nameEl ? nameEl.textContent : '';
  var rows = _AG_SPACES.map(function(s, i) {
    var sel = (cur === s.name || cur.indexOf(s.last4) > -1) ? ' sel' : '';
    return '<button class="ag-act-row' + sel + '" type="button" data-i="' + i + '">' +
      '<span class="ag-act-ic"><img loading="lazy" decoding="async" src="' + s.av + '" alt=""></span>' +
      '<span class="ag-act-info"><span class="ag-act-label">' + _agEscape(s.name) + '</span>' +
        '<span class="ag-act-sub">•• ' + s.last4 + ' · ' + s.bal + '</span></span>' +
      _agActCheck + '</button>';
  }).join('');
  _agOpenActionSheet('Pay from space', rows, function(i) {
    var s = _AG_SPACES[i];
    var c = _agActiveTransfer.card;
    var n = c.querySelector('.ag-sm2-from-name'); if (n) n.textContent = s.name;
    var sub = c.querySelector('.ag-sm2-from-sub'); if (sub) sub.textContent = s.bal;
    var av = c.querySelector('.ag-sm2-from-av'); if (av) av.src = s.av;
    _agActiveTransfer.td.fromSpace = s.name;
    agCloseActionSheet(); haptic(8);
  });
}

function agOpenScheduleSheet() {
  if (!_agActiveTransfer) return;
  var scheduled = _agActiveTransfer.td.scheduled;
  var rows = _AG_SCHEDULE.map(function(o, i) {
    var sel = (!scheduled && o.now) || (scheduled && _agActiveTransfer.td.scheduleLabel === o.label) ? ' sel' : '';
    return '<button class="ag-act-row' + sel + '" type="button" data-i="' + i + '">' +
      '<span class="ag-act-ic">' + o.icon + '</span>' +
      '<span class="ag-act-info"><span class="ag-act-label">' + _agEscape(o.label) + '</span>' +
        '<span class="ag-act-sub">' + _agEscape(o.sub) + '</span></span>' +
      _agActCheck + '</button>';
  }).join('');
  _agOpenActionSheet('When to send', rows, function(i) {
    var o = _AG_SCHEDULE[i];
    var c = _agActiveTransfer.card;
    var lbl = c.querySelector('.ag-sm2-arrival-l');
    var val = c.querySelector('.ag-sm2-arrival-v');
    var send = c.querySelector('.ag-sm2-send');
    if (lbl) lbl.textContent = o.now ? 'Estimated arrival' : 'Scheduled for';
    if (val) val.textContent = o.arrival;
    if (send) send.textContent = o.now ? ('Send ' + _agActiveTransfer.fromSym + _agActiveTransfer.amtInt)
                                       : 'Schedule ' + _agActiveTransfer.fromSym + _agActiveTransfer.amtInt;
    _agActiveTransfer.td.scheduled = !o.now;
    _agActiveTransfer.td.scheduleLabel = o.label;
    agCloseActionSheet(); haptic(8);
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
  _agAddCtx(aiDiv, 'Here\'s the live ' + fromCode + ' → ' + toCode + ' rate, pulled just now — Banyan\'s 0.45% markup over mid-market is already included.', function() {
    setTimeout(function() {
      aiDiv.appendChild(card);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          card.classList.add('ui-in');
          _agStagger(card, '.ag-stagger-item', 60);
          _agCountUpDec(card.querySelector('#agFxNum'), 1.0, ri.rate, 700, 4);
        });
      });
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: 'Send money', text: 'Send money' },
          { label: 'Check balance', text: 'What is my balance?' },
          { label: 'View upcoming', text: 'Show upcoming transfers' }
        ]);
      }, 400);
    }, 120);
  });
}

// ── BALANCE CARD ─────────────────────────────────────
function _agRenderBalance(aiDiv, msgs, data) {
  var acct = _AG_DATA.accounts[0]; // USD Checking — the only account in the app
  var card = document.createElement('div');
  card.className = 'ag-ui-card ag-balance-card';
  var html = '';
  // Blurred space/mountain backdrop that fades into the card (Figma 3502-2742)
  html += '<div class="ag-balance-bg" aria-hidden="true"><img loading="lazy" decoding="async" src="assets/acct-det-hero-bg.webp?v=2" alt=""></div>';
  html += '<div class="ag-balance-body">';
  html += '<div class="ag-balance-head">';
  html +=   '<span class="ag-balance-av"><img loading="lazy" decoding="async" src="assets/space-usd-checking.webp" alt=""></span>';
  html +=   '<span class="ag-balance-label">' + _agEscape(acct.name) + ' ' + acct.num + '</span>';
  html += '</div>';
  html += '<div class="ag-balance-amount-row">';
  html +=   '<span class="ag-balance-sym">' + acct.sym + '</span>';
  html +=   '<span class="ag-balance-int" id="agBalInt">0</span>';
  html +=   '<span class="ag-balance-dec">.00</span>';
  html += '</div>';
  html += '<div class="ag-balance-divider"></div>';
  html += '<div class="ag-balance-chips"><span class="ag-balance-chip positive">No unusual activity</span><span class="ag-balance-chip">No pending holds</span></div>';
  html += '</div>';
  card.innerHTML = html;
  _agAddCtx(aiDiv, 'Here\'s your USD Checking balance, updated just now — no pending holds or reserved amounts.', function() {
    setTimeout(function() {
      aiDiv.appendChild(card);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          card.classList.add('ui-in');
          _agCountUp(document.getElementById('agBalInt'), 0, acct.balance, 800, true);
        });
      });
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: 'Send money', text: 'Send money' },
          { label: 'View upcoming', text: 'Show upcoming transfers' }
        ]);
      }, 400);
    }, 120);
  });
}

// ── UPCOMING BILLS CARD ───────────────────────────────
function _agRenderUpcoming(aiDiv, msgs) {
  var items = _AG_DATA.upcoming;
  var card = document.createElement('div');
  card.className = 'ag-ui-card';
  var statusTotal = items.filter(function(i) { return i.status === 'scheduled'; }).length;
  var html = '<div class="ag-card-header ag-stagger-item">';
  html +=   'Upcoming';
  html +=   '<div class="ag-card-header-line"></div>';
  html +=   '<span class="ag-card-header-meta">' + statusTotal + ' upcoming</span>';
  html += '</div>';
  items.forEach(function(b) {
    var statusColor = b.status === 'skipped' ? 'color:var(--text-tertiary)' : 'color:var(--brand-primary)';
    var statusText  = b.status === 'skipped' ? 'Skipped' : 'Upcoming';
    // Exact tx-row markup — same structure as the transaction list
    html += '<div class="tx-row ag-stagger-item" style="border-bottom:0.5px solid var(--divider)">';
    html +=   '<div class="av-container">';
    html +=     '<div class="av-wrap" style="-webkit-mask-image:none;mask-image:none">';
    html +=       '<div class="av-inner ini" style="background:' + b.av + '">' + b.ini + '</div>';
    html +=     '</div>';
    html +=   '</div>';
    html +=   '<div class="tx-mid">';
    html +=     '<div class="tx-name">' + _agEscape(b.name) + '</div>';
    html +=     '<div class="tx-sub" style="' + statusColor + '">' + statusText + ' · ' + b.date + '</div>';
    html +=   '</div>';
    html +=   '<div class="tx-right">';
    html +=     '<div class="tx-amount">−' + b.amount + '</div>';
    html +=     '<div class="tx-inr">' + b.inr + '</div>';
    html +=   '</div>';
    html += '</div>';
  });
  // Remove border from last row
  card.innerHTML = html;
  var rows = card.querySelectorAll('.tx-row');
  if (rows.length) rows[rows.length - 1].style.borderBottom = 'none';
  _agAddCtx(aiDiv, 'You have ' + statusTotal + ' payment' + (statusTotal !== 1 ? 's' : '') + ' coming up. Here\'s what\'s scheduled — amounts shown are what will leave your account.', function() {
    // Card slides in after ctx finishes streaming
    setTimeout(function() {
      aiDiv.appendChild(card);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          card.classList.add('ui-in');
          _agStagger(card, '.ag-stagger-item', 60);
        });
      });
      // Follow-ups after card has time to settle
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: 'Send money', text: 'Send money' },
          { label: 'Check balance', text: 'What is my balance?' },
          { label: 'Recent spending', text: 'Show recent spending' }
        ]);
      }, 400);
    }, 120);
  });
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
  _agAddCtx(aiDiv, 'Here\'s how your spending broke down over the last 30 days, across all categories.', function() {
    setTimeout(function() {
      aiDiv.appendChild(card);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          card.classList.add('ui-in');
          _agStagger(card, '.ag-stagger-item', 55);
          _agCountUp(card.querySelector('#agSpendTotal'), 0, 1588, 700, true);
          setTimeout(function() {
            card.querySelectorAll('.ag-spending-cat-bar').forEach(function(bar) {
              bar.style.width = bar.getAttribute('data-pct') + '%';
              var col = bar.getAttribute('data-color');
              if (col) bar.style.background = col;
            });
          }, 260);
        });
      });
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: 'Send money', text: 'Send money' },
          { label: 'Check balance', text: 'What is my balance?' },
          { label: 'View upcoming', text: 'Show upcoming transfers' }
        ]);
      }, 400);
    }, 120);
  });
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
  var _blobMap = {
    'ms': 'assets/blob-purple-v2.webp',
    'rr': 'assets/blob-purple-v2.webp',
    'ak': 'assets/blob-purple-v2.webp',
    'sm': 'assets/blob-orange-v2.webp',
    'dp': 'assets/blob-green-v2.webp',
    'aa': 'assets/blob-orange-v2.webp',
    'kw': 'assets/blob-green-v2.webp',
  };
  _AG_DATA.recipients.forEach(function(r) {
    var blob = _blobMap[r.id] || 'assets/blob-purple-v2.webp';
    html += '<div class="ben-row ag-stagger-item" data-recip-id="' + r.id + '" style="padding:10px 20px;cursor:pointer;">';
    html +=   '<div class="ben-row-left">';
    html +=     '<div class="sm-l-av" style="width:32px;height:32px;background:rgba(255,255,255,0.12);border-radius:999px;flex-shrink:0">';
    html +=       '<img class="sm-l-av-photo" src="' + blob + '">';
    html +=       '<div class="sm-l-av-glass" style="inset:2px;background:rgba(255,255,255,0.1);border:0.3px solid white;backdrop-filter:blur(24px)"></div>';
    html +=       '<span class="sm-l-av-txt" style="font-size:10px;letter-spacing:-0.5px;font-weight:600;line-height:13px">' + r.initials + '</span>';
    html +=     '</div>';
    html +=     '<div class="ben-row-info">';
    html +=       '<span class="ben-row-name">' + _agEscape(r.name) + ' ' + r.flag + '</span>';
    html +=       '<span class="ben-row-sub">' + _agEscape(r.bank) + '</span>';
    html +=     '</div>';
    html +=   '</div>';
    html +=   '<button class="ben-pay-pill">Pay</button>';
    html += '</div>';
  });
  card.innerHTML = html;

  // Wire up recipient taps → trigger transfer for that recipient
  card.querySelectorAll('.ben-row').forEach(function(row) {
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

  _agAddCtx(aiDiv, 'Here are your saved recipients. Tap any name to start a transfer to them.', function() {
    setTimeout(function() {
      aiDiv.appendChild(card);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          card.classList.add('ui-in');
          _agStagger(card, '.ag-stagger-item', 55);
        });
      });
    }, 120);
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
  _agAddCtx(aiDiv, 'I found a pending wire transfer from your recent activity — here are the details.', function() {
    setTimeout(function() {
      aiDiv.appendChild(card);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          card.classList.add('ui-in');
          _agStagger(card, '.ag-stagger-item', 60);
          _agCountUp(card.querySelector('#agBillAmt'), 0, 2100, 650);
        });
      });
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: 'Check balance', text: 'What is my balance?' },
          { label: 'View upcoming', text: 'Show upcoming transfers' },
          { label: 'Recent spending', text: 'Show recent spending' }
        ]);
      }, 400);
    }, 120);
  });
}

// ════════════════════════════════════════════════════════
//  JOURNEY 2 — Card & spend controls
//  JOURNEY 3 — Awareness & vigilance
//  Shared principle: every agent turn surfaces a tappable card.
// ════════════════════════════════════════════════════════

// Shared mini card visual
function _agCardVizHTML(card, frozen) {
  return '<div class="ag-cardviz' + (frozen ? ' frozen' : '') + '" style="background:' + card.gradient + '">' +
    '<div class="ag-cardviz-top">' +
      '<span class="ag-cardviz-net">' + _agEscape(card.network) + '</span>' +
      '<span class="ag-cardviz-chip" aria-hidden="true"></span>' +
    '</div>' +
    '<div class="ag-cardviz-frost"><span class="ico" style="--ico:url(\'Icons/Snowflake.svg\');--sz:18px;color:#eaf6fb"></span></div>' +
    '<div class="ag-cardviz-name">' + _agEscape(card.name) + '</div>' +
    '<div class="ag-cardviz-num">•••• ' + _agEscape(card.last4) + '</div>' +
  '</div>';
}

// Helper: slide a card in after the ctx line finishes streaming
function _agRevealCard(aiDiv, card, afterReveal) {
  setTimeout(function() {
    aiDiv.appendChild(card);
    requestAnimationFrame(function() { requestAnimationFrame(function() {
      card.classList.add('ui-in');
      _agStagger(card, '.ag-stagger-item', 60);
      if (afterReveal) afterReveal();
    }); });
  }, 120);
}

// ── Disambiguation: "do you mean this card?" ──
function _agRenderCardDisambig(aiDiv, msgs, data) {
  var card = data.card;
  var el = document.createElement('div');
  el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-cardctl-body">' +
      '<div class="ag-stagger-item">' + _agCardVizHTML(card, false) + '</div>' +
      '<div class="ag-card-actions ag-stagger-item">' +
        '<button class="ag-action-btn primary" type="button" data-yes>' +
          '<span class="ico" style="--ico:url(\'Icons/Snowflake.svg\');--sz:15px;color:#fff"></span>' +
          '<span class="ag-action-label">Yes, freeze it</span>' +
        '</button>' +
        '<button class="ag-action-btn secondary" type="button" data-no>' +
          '<span class="ag-action-label">No, another card</span>' +
        '</button>' +
      '</div>' +
    '</div>';
  el.querySelector('[data-yes]').addEventListener('click', function() { agentSendText('Yes'); });
  el.querySelector('[data-no]').addEventListener('click', function() { agentSendText('No'); });
  _agAddCtx(aiDiv, 'I can do that. Just to confirm — do you mean your ' + card.network + ' ending in ' + card.last4 + '?', function() {
    _agRevealCard(aiDiv, el);
  });
}

// ── Freeze confirmation ──
function _agRenderFreezeConfirm(aiDiv, msgs, data) {
  var card = data.card;
  var el = document.createElement('div');
  el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-cardctl-body">' +
      '<div class="ag-stagger-item">' + _agCardVizHTML(card, false) + '</div>' +
      '<div class="ag-warn-note ag-stagger-item">' +
        '<span class="ico" style="--ico:url(\'Icons/Warning.svg\');--sz:15px;color:#C17C14"></span>' +
        '<span>New transactions will be blocked until you unfreeze. Existing subscriptions may still be declined.</span>' +
      '</div>' +
      '<div class="ag-card-actions ag-stagger-item">' +
        '<button class="ag-action-btn primary" type="button" data-confirm>' +
          '<span class="ag-action-label">Freeze card</span>' +
          '<span class="ag-action-spinner" style="display:none"></span>' +
        '</button>' +
      '</div>' +
    '</div>';
  var btn = el.querySelector('[data-confirm]');
  btn.addEventListener('click', function() {
    if (btn.classList.contains('loading')) return;
    btn.classList.add('loading');
    btn.querySelector('.ag-action-spinner').style.display = 'block';
    setTimeout(function() {
      // Decision made — retire the action card, render the result in place
      el.style.transition = 'opacity 200ms ease, transform 220ms var(--ease-out)';
      el.style.opacity = '0'; el.style.transform = 'translateY(-4px) scale(0.985)';
      setTimeout(function() {
        el.remove();
        _agRenderFreezeDone(aiDiv, msgs, { card: card, vigilance: data.vigilance });
      }, 220);
    }, 750);
  });
  var line = data.vigilance
    ? 'Freezing your ' + card.name.toLowerCase() + ' will block new charges right away. Freeze it now?'
    : 'Freezing your ' + card.name.toLowerCase() + ' will block new transactions until you unfreeze it. Freeze now?';
  _agAddCtx(aiDiv, line, function() { _agRevealCard(aiDiv, el); });
}

// ── Frozen status + proactive alert offer ──
function _agRenderFreezeDone(aiDiv, msgs, data) {
  _agFlow = null;
  var card = data.card;
  var el = document.createElement('div');
  el.className = 'ag-ui-card';
  var watchOn = data.vigilance ? ' on' : '';
  el.innerHTML =
    '<div class="ag-cardctl-body" style="padding-bottom:4px">' +
      '<div class="ag-stagger-item">' + _agCardVizHTML(card, true) + '</div>' +
      '<div class="ag-stagger-item"><span class="ag-frozen-badge">' +
        '<span class="ico" style="--ico:url(\'Icons/Snowflake.svg\');--sz:13px;color:#2f5bb0"></span>' +
        card.name + ' frozen</span></div>' +
    '</div>' +
    '<div class="ag-toggle-row ag-stagger-item">' +
      '<div class="ag-toggle-row-info">' +
        '<span class="ag-toggle-row-title">Alert me on new attempts</span>' +
        '<span class="ag-toggle-row-sub">Notify instantly if this card is used</span>' +
      '</div>' +
      '<div class="cr-toggle' + watchOn + '" role="switch" tabindex="0" data-alert-toggle></div>' +
    '</div>';
  var tog = el.querySelector('[data-alert-toggle]');
  tog.addEventListener('click', function() { tog.classList.toggle('on'); });
  var line = data.vigilance
    ? 'Done — your ' + card.name.toLowerCase() + ' is now frozen. I\'ll also keep watching for repeat activity from ' + _AG_DATA.flagged.merchant + '.'
    : 'Done — your ' + card.name.toLowerCase() + ' is now frozen. Want me to alert you if any new attempt is made on it?';
  _agAddCtx(aiDiv, line, function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: "Check my balance", text: "What's my balance?" },
          { label: 'Anything I should review?', text: 'Anything I should review?' }
        ]);
      }, 360);
    });
  });
}

// ── Vigilance: proactive duplicate-charge alert ──
function _agRenderFlaggedAlert(aiDiv, msgs, data) {
  var fl = _AG_DATA.flagged;
  var card = data.card;
  var el = document.createElement('div');
  el.className = 'ag-ui-card ag-dup-card';
  var cardType = (card.name || '').replace(/\s*card$/i, ''); // "Dining card" → "Dining"
  var html = '<div class="ag-dup-head ag-stagger-item">' +
    '<div class="ag-dup-head-text">' +
      '<span class="ag-dup-title">Possible duplicate charge</span>' +
      '<span class="ag-dup-sub">Same amount, same merchant · ' + _agEscape(fl.gap) + '</span>' +
    '</div>' +
    '<div class="ag-dup-cardtype"><span class="ico ol" style="--ico:url(\'Icons/CreditCard.svg\');--sz:16px;color:rgba(0,0,0,0.5)" aria-hidden="true"></span><span>' + _agEscape(cardType) + '</span></div>' +
  '</div>';
  html += '<div class="ag-dup-rows">';
  fl.charges.forEach(function(c) {
    html += '<div class="ag-dup-row ag-stagger-item">' +
      '<span class="ag-dup-av">🍔</span>' +
      '<div class="ag-dup-info">' +
        '<span class="ag-dup-merch">' + _agEscape(c.merch) + '</span>' +
        '<span class="ag-dup-time">' + _agEscape(c.time) + '</span>' +
      '</div>' +
      '<span class="ag-dup-amt">−' + _agEscape(c.amount) + '</span>' +
    '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
  _agAddCtx(aiDiv, 'I noticed two charges from ' + fl.merchant + ' for ' + fl.amount + ' within 3 minutes on your ' + card.name.toLowerCase() + '. That may be a duplicate charge.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: 'Why did you flag it?', text: 'Why did you flag it?' },
          { label: 'What should I do?', text: 'What should I do?' }
        ]);
      }, 360);
    });
  });
}

// ── Vigilance: why it was flagged ──
function _agRenderFlagReason(aiDiv, msgs) {
  var el = document.createElement('div');
  el.className = 'ag-ui-card';
  var reasons = [
    'Both charges posted successfully — neither was declined or reversed.',
    'You usually place just one order in this amount range at this time of day.'
  ];
  var html = '<div class="ag-card-header ag-stagger-item">Why I flagged this<span class="ag-card-header-meta">2 signals</span></div>' +
    '<div class="ag-reason-list">';
  reasons.forEach(function(r) {
    html += '<div class="ag-reason-row ag-stagger-item">' +
      '<span class="ag-reason-check"><span class="ico" style="--ico:url(\'Icons/Check.svg\');--sz:11px;color:#46882B"></span></span>' +
      '<span class="ag-reason-text">' + _agEscape(r) + '</span>' +
    '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
  _agAddCtx(aiDiv, 'Here\'s what stood out when I compared it to your usual activity.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: 'What should I do?', text: 'What should I do?' }
        ]);
      }, 360);
    });
  });
}

// ── Vigilance: next-step options ──
function _agRenderFlagOptions(aiDiv, msgs) {
  var el = document.createElement('div');
  el.className = 'ag-ui-card';
  var opts = [
    { ico: 'Clock.svg',        bg: 'rgba(0,0,0,0.06)',        col: 'rgba(0,0,0,0.55)', title: 'Wait 24 hours',  sub: 'A duplicate often reverses on its own', text: 'Wait 24 hours' },
    { ico: 'Snowflake.svg',    bg: 'rgba(56,100,200,0.12)',   col: '#2f5bb0',          title: 'Freeze the card', sub: 'Block new charges right away',         text: 'Freeze my dining card' },
    { ico: 'ShieldWarning.svg',bg: 'rgba(193,124,20,0.12)',   col: '#C17C14',          title: 'Start a dispute', sub: 'Challenge the duplicate with Banyan',   text: 'Start a dispute' },
  ];
  var html = '<div class="ag-card-header ag-stagger-item">Recommended next steps<span class="ag-card-header-meta">Tap one</span></div>';
  opts.forEach(function(o) {
    html += '<button class="ag-option-row ag-stagger-item" type="button" data-text="' + o.text + '">' +
      '<span class="ag-option-icon" style="background:' + o.bg + '"><span class="ico" style="--ico:url(\'Icons/' + o.ico + '\');--sz:17px;color:' + o.col + '"></span></span>' +
      '<span class="ag-option-info"><span class="ag-option-title">' + o.title + '</span><span class="ag-option-sub">' + o.sub + '</span></span>' +
      '<span class="ag-option-arrow" aria-hidden="true">›</span>' +
    '</button>';
  });
  el.innerHTML = html;
  el.querySelectorAll('.ag-option-row').forEach(function(row) {
    row.addEventListener('click', function() { agentSendText(row.getAttribute('data-text')); });
  });
  _agAddCtx(aiDiv, 'Here are your best next steps — pick whichever you\'re comfortable with.', function() {
    _agRevealCard(aiDiv, el);
  });
}

// ── Vigilance: dispute opened ──
function _agRenderDisputeStarted(aiDiv, msgs) {
  var el = document.createElement('div');
  el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-alert-head ag-stagger-item">' +
      '<div class="ag-alert-icon" style="background:rgba(70,136,43,0.12)"><span class="ico" style="--ico:url(\'Icons/ShieldCheck.svg\');--sz:18px;color:#46882B"></span></div>' +
      '<div class="ag-alert-head-text">' +
        '<span class="ag-alert-title">Dispute opened</span>' +
        '<span class="ag-alert-merchant">' + _AG_DATA.flagged.merchant + ' · ' + _AG_DATA.flagged.amount + '</span>' +
      '</div></div>' +
    '<div class="ag-toggle-row ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.06)">' +
      '<div class="ag-toggle-row-info">' +
        '<span class="ag-toggle-row-title">Reference DSP-4471</span>' +
        '<span class="ag-toggle-row-sub">Banyan reviews within 5 business days</span>' +
      '</div>' +
      '<span class="ag-frozen-badge" style="background:rgba(193,124,20,0.10);color:#875610">Under review</span>' +
    '</div>';
  _agAddCtx(aiDiv, 'I\'ve started a dispute for the duplicate ' + _AG_DATA.flagged.amount + ' charge. Banyan will review it and update you within 5 business days.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: 'Freeze the card', text: 'Freeze my dining card' },
          { label: "Check my balance", text: "What's my balance?" }
        ]);
      }, 360);
    });
  });
}

// ── Vigilance: wait & monitor ──
function _agRenderWaitAdvice(aiDiv, msgs) {
  var el = document.createElement('div');
  el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-alert-head ag-stagger-item">' +
      '<div class="ag-alert-icon" style="background:rgba(56,100,200,0.12)"><span class="ico" style="--ico:url(\'Icons/Eye.svg\');--sz:18px;color:#2f5bb0"></span></div>' +
      '<div class="ag-alert-head-text">' +
        '<span class="ag-alert-title">Monitoring active</span>' +
        '<span class="ag-alert-merchant">' + _AG_DATA.flagged.merchant + ' · ' + _AG_DATA.flagged.amount + '</span>' +
      '</div></div>' +
    '<div class="ag-charge-gap ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.06);background:transparent;color:var(--text-secondary)">' +
      '<span class="ico" style="--ico:url(\'Icons/Clock.svg\');--sz:13px;color:var(--text-tertiary)"></span>' +
      'I\'ll alert you if it doesn\'t reverse by tomorrow 7:15 PM</div>';
  _agAddCtx(aiDiv, 'Good call. I\'ll keep an eye on it and let you know if the duplicate doesn\'t drop off within 24 hours.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() {
        _agAddFollowups(aiDiv, msgs, [
          { label: 'Freeze the card', text: 'Freeze my dining card' },
          { label: 'Start a dispute', text: 'Start a dispute' }
        ]);
      }, 360);
    });
  });
}

// ════════════════════════════════════════════════════════
//  JOURNEYS 2–6: bills · cashflow · goals · family · payees
// ════════════════════════════════════════════════════════
function _agTagHTML(kind, label) { return '<span class="ag-tag ' + kind + '">' + _agEscape(label) + '</span>'; }
function _agCardHeaderHTML(title, meta) {
  return '<div class="ag-card-header ag-stagger-item">' + _agEscape(title) +
    (meta ? '<span class="ag-card-header-meta">' + _agEscape(meta) + '</span>' : '') + '</div>';
}
// Generic confirm card: card body + primary button that resolves to a follow-up render
function _agConfirmButton(label) {
  return '<div class="ag-card-actions ag-stagger-item">' +
    '<button class="ag-action-btn primary" type="button" data-confirm>' +
      '<span class="ag-action-label">' + _agEscape(label) + '</span>' +
      '<span class="ag-action-spinner" style="display:none"></span>' +
    '</button></div>';
}
function _agWireConfirm(el, aiDiv, msgs, onDone) {
  var btn = el.querySelector('[data-confirm]');
  if (!btn) return;
  btn.addEventListener('click', function() {
    if (btn.classList.contains('loading')) return;
    btn.classList.add('loading');
    btn.querySelector('.ag-action-spinner').style.display = 'block';
    setTimeout(function() {
      el.style.transition = 'opacity 200ms ease, transform 220ms var(--ease-out)';
      el.style.opacity = '0'; el.style.transform = 'translateY(-4px) scale(0.985)';
      setTimeout(function() { el.remove(); onDone(); }, 220);
    }, 700);
  });
}

// ── BILLS: upcoming list ──
function _agRenderBills(aiDiv, msgs) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  var html = _agCardHeaderHTML('Upcoming bills', 'Next 14 days');
  _AG_DATA.bills.forEach(function(b) {
    var tag = b.kind === 'predicted' ? _agTagHTML('predicted', 'Predicted')
            : b.kind === 'up19'      ? _agTagHTML('up', 'Up 19%')
            : _agTagHTML('neutral', 'Upcoming');
    html += '<div class="ag-lrow ag-stagger-item">' +
      '<span class="ag-lrow-ic" style="background:' + b.col + '1f"><span class="ico" style="--ico:url(\'Icons/' + b.ic + '\');--sz:15px;color:' + b.col + '"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">' + _agEscape(b.name) + '</span><span class="ag-lrow-sub">' + _agEscape(b.due) + '</span></div>' +
      '<div class="ag-lrow-right"><span class="ag-lrow-amt">' + _agEscape(b.amount) + '</span>' + tag + '</div></div>';
  });
  el.innerHTML = html;
  _agAddCtx(aiDiv, 'You have 4 recurring bills in the next 14 days. Rent is the largest, and your checking may be tight a few days before it hits.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Anything unusual?', text: 'Anything unusual?' },
        { label: 'Will I have enough?', text: 'Will I have enough?' }
      ]); }, 360);
    });
  });
}
function _agRenderBillsUnusual(aiDiv, msgs) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML = _agCardHeaderHTML('What changed', '1 flag') +
    '<div class="ag-lrow ag-stagger-item">' +
      '<span class="ag-lrow-ic" style="background:rgba(193,124,20,0.12)"><span class="ico" style="--ico:url(\'Icons/TrendUp.svg\');--sz:15px;color:#C17C14"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">Internet</span><span class="ag-lrow-sub">$66 avg → $78 this month</span></div>' +
      '<div class="ag-lrow-right">' + _agTagHTML('up', 'Up 19%') + '</div></div>';
  _agAddCtx(aiDiv, 'One bill stands out — your internet is up 19% from its prior 3-month average. Everything else is in line with usual.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Will I have enough?', text: 'Will I have enough?' }
      ]); }, 360);
    });
  });
}
function _agRenderBillsCover(aiDiv, msgs) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-metric-verdict ok ag-stagger-item"><span class="ico" style="--ico:url(\'Icons/Check.svg\');--sz:13px;color:#3a7020"></span>Covers all 4 bills</div>' +
    '<div class="ag-lrow ag-stagger-item" style="margin-top:8px">' +
      '<span class="ag-lrow-ic" style="background:rgba(193,124,20,0.12)"><span class="ico" style="--ico:url(\'Icons/Wallet.svg\');--sz:15px;color:#C17C14"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">Lowest projected balance</span><span class="ag-lrow-sub">Jul 2, just after rent</span></div>' +
      '<div class="ag-lrow-right"><span class="ag-lrow-amt">$640</span>' + _agTagHTML('up', 'Below cushion') + '</div></div>';
  _agAddCtx(aiDiv, 'If nothing changes, yes — you can cover all four. But your balance dips to about $640 for a few days after rent, below your usual $1,000 cushion.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Remind me 2 days before rent', text: 'Remind me 2 days before rent if checking is low' }
      ]); }, 360);
    });
  });
}
function _agRenderRemind(aiDiv, msgs, data) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-alert-head ag-stagger-item">' +
      '<div class="ag-alert-icon" style="background:rgba(70,136,43,0.12)"><span class="ico" style="--ico:url(\'Icons/BellSimpleRinging.svg\');--sz:18px;color:#46882B"></span></div>' +
      '<div class="ag-alert-head-text"><span class="ag-alert-title">Reminder set</span><span class="ag-alert-merchant">' + _agEscape(data.name) + '</span></div></div>' +
    '<div class="ag-charge-gap ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.06);background:transparent;color:var(--text-secondary)">' +
      '<span class="ico" style="--ico:url(\'Icons/Clock.svg\');--sz:13px;color:var(--text-tertiary)"></span>I\'ll nudge you ' + _agEscape(data.cond) + '</div>';
  _agAddCtx(aiDiv, 'Done — I\'ll remind you about ' + data.name + ' ' + data.cond + '.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: "Check my balance", text: "What's my balance?" },
        { label: 'Anything I should review?', text: 'Anything I should review?' }
      ]); }, 360);
    });
  });
}

// ── CASHFLOW: affordability forecast ──
function _agRenderAfford(aiDiv, msgs, data) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-metric ag-stagger-item"><div class="ag-metric-label">Projected month-end balance</div>' +
      '<div class="ag-metric-row"><span class="ag-metric-sym">$</span><span class="ag-metric-num" id="agAffordNum">0</span></div></div>' +
    '<div class="ag-metric-verdict warn ag-stagger-item"><span class="ico" style="--ico:url(\'Icons/Warning.svg\');--sz:13px;color:#875610"></span>≈ $480 below your usual cushion</div>' +
    '<div class="ag-charge-gap ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.05);background:transparent;color:var(--text-tertiary);justify-content:flex-start;padding-left:16px">Assumes recent inflows, recurring bills & predicted renewals · savings untouched</div>';
  _agAddCtx(aiDiv, 'Probably yes — booking the $' + data.amount.toLocaleString() + ' flight wouldn\'t touch savings, but it would leave you about $480 under your normal month-end buffer.', function() {
    _agRevealCard(aiDiv, el, function() {
      _agCountUp(document.getElementById('agAffordNum'), 0, 1820, 800, true);
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: "What's driving that?", text: "What's driving that?" },
        { label: 'What if I cancel two subscriptions?', text: 'What if I cancel two subscriptions?' }
      ]); }, 360);
    });
  });
}
function _agRenderAffordWhy(aiDiv, msgs) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  var pts = ['Rent and insurance both clear early in the month', 'Two predicted subscriptions renew before your paycheck', 'Your average grocery spend is included as a predicted outflow'];
  var html = '<div class="ag-driver">' +
    '<div class="ag-driver-hd ag-stagger-item">' + pts.length + ' factors driving the dip</div>' +
    '<div class="ag-driver-sep ag-stagger-item"></div>' +
    '<div class="ag-driver-list">';
  pts.forEach(function(p) {
    html += '<div class="ag-driver-row ag-stagger-item"><span class="ag-driver-dot"></span><span class="ag-driver-txt">' + _agEscape(p) + '</span></div>';
  });
  html += '</div></div>';
  el.innerHTML = html;
  _agAddCtx(aiDiv, "Here's what's pulling your month-end down. I'm treating the renewals and groceries as predictions, not confirmed.", function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'What if I cancel two subscriptions?', text: 'What if I cancel two subscriptions?' }
      ]); }, 360);
    });
  });
}
function _agRenderAffordCancel(aiDiv, msgs) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-metric ag-stagger-item"><div class="ag-metric-label">Month-end improvement</div>' +
      '<div class="ag-metric-row"><span class="ag-metric-sym" style="color:#46882B">+$</span><span class="ag-metric-num" id="agCancelNum" style="color:#46882B">0</span></div></div>' +
    '<div class="ag-charge-gap ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.05);background:transparent;color:var(--text-tertiary);justify-content:flex-start;padding-left:16px">Helps a little, but doesn\'t materially change the answer</div>';
  _agAddCtx(aiDiv, 'Canceling two subscriptions improves your projected month-end by about $63. It helps, but it doesn\'t materially change the answer.', function() {
    _agRevealCard(aiDiv, el, function() {
      _agCountUp(document.getElementById('agCancelNum'), 0, 63, 700, false);
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'So what do you recommend?', text: 'So what do you recommend?' }
      ]); }, 360);
    });
  });
}
function _agRenderAffordRec(aiDiv, msgs) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  var recs = [
    { ic: 'CalendarCheck.svg', col: '#46882B', t: 'Book after payday lands', s: 'Jul 28 — keeps your full cushion' },
    { ic: 'ChartLineDown.svg', col: '#2f5bb0', t: 'Or trim discretionary spend', s: 'About $480 that month covers the gap' },
  ];
  var html = _agCardHeaderHTML('My recommendation', '2 ways');
  recs.forEach(function(r) {
    html += '<div class="ag-lrow ag-stagger-item">' +
      '<span class="ag-lrow-ic" style="background:' + r.col + '1f"><span class="ico" style="--ico:url(\'Icons/' + r.ic + '\');--sz:15px;color:' + r.col + '"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">' + r.t + '</span><span class="ag-lrow-sub">' + r.s + '</span></div></div>';
  });
  el.innerHTML = html;
  _agAddCtx(aiDiv, 'If you want to keep your normal cushion, book after your paycheck lands — or reduce discretionary spend that month. Either keeps you safe.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Remind me on payday', text: 'Remind me to book after payday' },
        { label: "Check my balance", text: "What's my balance?" }
      ]); }, 360);
    });
  });
}

// ── GOALS: savings plan ──
function _agRenderGoal(aiDiv, msgs, data) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-goal-head ag-stagger-item"><span class="ag-goal-cur">$0</span><span class="ag-goal-target">of $' + data.target.toLocaleString() + ' by August</span></div>' +
    '<div class="ag-goal-bar-wrap ag-stagger-item"><div class="ag-goal-bar" id="agGoalBar" data-pct="3"></div></div>' +
    '<div class="ag-goal-pace ag-stagger-item"><span class="ico" style="--ico:url(\'Icons/Target.svg\');--sz:14px;color:#823CB4"></span><span>About <strong>$190 / week</strong> for the next 16 weeks</span></div>';
  _agAddCtx(aiDiv, 'You\'ve got about 4 months. At your current pace, saving roughly $190 a week would get you to $' + data.target.toLocaleString() + ' by August.', function() {
    _agRevealCard(aiDiv, el, function() {
      var bar = document.getElementById('agGoalBar'); if (bar) setTimeout(function(){ bar.style.width = '3%'; }, 200);
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Fund it from deposits instead', text: 'Can I do that from deposits instead?' },
        { label: 'What if I have a heavier month?', text: 'What if I have a heavier month?' }
      ]); }, 360);
    });
  });
}
function _agRenderGoalDeposit(aiDiv, msgs) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-metric ag-stagger-item"><div class="ag-metric-label">Transfer from each deposit</div>' +
      '<div class="ag-metric-row"><span class="ag-metric-num" id="agPctNum">0</span><span class="ag-metric-sym">%</span></div></div>' +
    '<div class="ag-charge-gap ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.05);background:transparent;color:var(--text-tertiary);justify-content:flex-start;padding-left:16px">Based on your recent inflows, this likely reaches $3,000 by August</div>';
  _agAddCtx(aiDiv, 'Yes. A 14% transfer from each incoming deposit would likely hit the target, based on your recent inflows.', function() {
    _agRevealCard(aiDiv, el, function() {
      _agCountUp(document.getElementById('agPctNum'), 0, 14, 700, false);
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'What if I have a heavier month?', text: 'What if I have a heavier month?' },
        { label: 'Set this up', text: 'Do that' }
      ]); }, 360);
    });
  });
}
function _agRenderGoalAdaptive(aiDiv, msgs) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  var pts = ['Save 14% of every deposit automatically', 'Auto-pause the week if money is tight', 'I\'ll nudge you if you slip behind pace'];
  var html = _agCardHeaderHTML('Adaptive savings rule', 'Flexible');
  html += '<div class="ag-reason-list">';
  pts.forEach(function(p) {
    html += '<div class="ag-reason-row ag-stagger-item"><span class="ag-reason-check"><span class="ico" style="--ico:url(\'Icons/Check.svg\');--sz:11px;color:#46882B"></span></span><span class="ag-reason-text">' + _agEscape(p) + '</span></div>';
  });
  html += '</div>';
  el.innerHTML = html;
  _agAddCtx(aiDiv, 'I can make it adaptive: save 14% of deposits, ease off automatically on lean weeks, and tell you if you fall behind pace.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Set this up', text: 'Do that' }
      ]); }, 360);
    });
  });
}
function _agRenderGoalCreate(aiDiv, msgs, data) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-goal-head ag-stagger-item"><span class="ag-goal-cur">Vacation</span><span class="ag-goal-target">$' + data.target.toLocaleString() + ' by August</span></div>' +
    '<div class="ag-goal-bar-wrap ag-stagger-item"><div class="ag-goal-bar" id="agGoalBar2" data-pct="3"></div></div>' +
    '<div class="ag-toggle-row ag-stagger-item">' +
      '<div class="ag-toggle-row-info"><span class="ag-toggle-row-title">Adaptive 14% deposit rule</span><span class="ag-toggle-row-sub">Auto-saves from each deposit</span></div>' +
      '<div class="cr-toggle on" role="switch" tabindex="0" data-alert-toggle></div></div>';
  var tog = el.querySelector('[data-alert-toggle]');
  tog.addEventListener('click', function() { tog.classList.toggle('on'); });
  _agAddCtx(aiDiv, 'Done — I\'ve created your Vacation space with an adaptive 14% deposit rule. I\'ll track your pace and flag you if you slip behind.', function() {
    _agRevealCard(aiDiv, el, function() {
      var bar = document.getElementById('agGoalBar2'); if (bar) setTimeout(function(){ bar.style.width = '3%'; }, 200);
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: "Check my balance", text: "What's my balance?" },
        { label: 'Anything I should review?', text: 'Anything I should review?' }
      ]); }, 360);
    });
  });
}

// ── FAMILY operations (teen card: money, controls, approvals) ──
function _agRenderFamily(aiDiv, msgs) {
  var fam = _AG_DATA.family;
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML = _agCardHeaderHTML(fam.child + "'s card · this week", fam.card.network + ' →' + fam.card.last4) +
    '<div class="ag-lrow ag-stagger-item"><span class="ag-lrow-ic" style="background:rgba(124,75,212,0.12)"><span class="ico" style="--ico:url(\'Icons/CreditCard.svg\');--sz:15px;color:#7b4bd4"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">Spent this week</span><span class="ag-lrow-sub">' + fam.purchases + ' purchases · card active</span></div>' +
      '<div class="ag-lrow-right"><span class="ag-lrow-amt">$' + fam.spentWeek + '.00</span></div></div>' +
    '<div class="ag-lrow ag-stagger-item"><span class="ag-lrow-ic" style="background:rgba(193,124,20,0.12)"><span class="ico" style="--ico:url(\'Icons/Hourglass.svg\');--sz:15px;color:#C17C14"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">Purchase to approve</span><span class="ag-lrow-sub">' + _agEscape(fam.pending.merchant) + ' · ' + fam.pending.ago + '</span></div>' +
      '<div class="ag-lrow-right"><span class="ag-lrow-amt">$' + fam.pending.amount + '.00</span>' + _agTagHTML('up', '1 waiting') + '</div></div>' +
    '<div class="ag-lrow ag-stagger-item"><span class="ag-lrow-ic" style="background:rgba(70,136,43,0.12)"><span class="ico" style="--ico:url(\'Icons/HandCoins.svg\');--sz:15px;color:#46882B"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">Weekly allowance</span><span class="ag-lrow-sub">Due ' + fam.allowanceDue + '</span></div>' +
      '<div class="ag-lrow-right"><span class="ag-lrow-amt">$' + fam.allowance + '.00</span></div></div>';
  _agAddCtx(aiDiv, "Here's " + fam.child + "'s Banyan card this week — $" + fam.spentWeek + " spent across " + fam.purchases + " purchases, one request waiting for your approval, and her $" + fam.allowance + " allowance is due " + fam.allowanceDue + ".", function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Review the request', text: 'Review the pending request' },
        { label: 'Show her spending', text: "Show Emma's spending" },
        { label: 'Freeze her card', text: "Freeze Emma's card" }
      ]); }, 360);
    });
  });
}
function _agRenderFamilySpend(aiDiv, msgs) {
  var fam = _AG_DATA.family;
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  var html = _agCardHeaderHTML(fam.child + ' · spending', 'This week · $' + fam.spentWeek + '.00');
  fam.spend.forEach(function(r) {
    html += '<div class="ag-lrow ag-stagger-item"><span class="ag-lrow-ic"><span class="ico" style="--ico:url(\'Icons/' + r.ic + '\');--sz:14px;color:var(--text-tertiary)"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">' + _agEscape(r.t) + '</span><span class="ag-lrow-sub">' + _agEscape(r.s) + '</span></div>' +
      '<div class="ag-lrow-right"><span class="ag-lrow-amt">' + r.a + '</span></div></div>';
  });
  el.innerHTML = html;
  _agAddCtx(aiDiv, "Here's everything " + fam.child + ' spent this week — $' + fam.spentWeek + '.00 across ' + fam.purchases + ' purchases, all within her limit.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Freeze her card', text: "Freeze Emma's card" },
        { label: 'Pay her allowance', text: "Pay Emma's allowance" }
      ]); }, 360);
    });
  });
}
function _agRenderFamilyApprove(aiDiv, msgs) {
  var fam = _AG_DATA.family, p = fam.pending;
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-alert-head ag-stagger-item"><div class="ag-alert-icon" style="background:rgba(124,75,212,0.12)"><span class="ico" style="--ico:url(\'Icons/' + p.icon + '\');--sz:18px;color:#7b4bd4"></span></div>' +
      '<div class="ag-alert-head-text"><span class="ag-alert-title">Purchase request</span><span class="ag-alert-merchant">' + fam.child + ' · ' + fam.card.network + ' →' + fam.card.last4 + '</span></div></div>' +
    '<div class="ag-lrow ag-stagger-item"><span class="ag-lrow-ic" style="background:rgba(124,75,212,0.12)"><span class="ico" style="--ico:url(\'Icons/' + p.icon + '\');--sz:15px;color:#7b4bd4"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">' + _agEscape(p.merchant) + '</span><span class="ag-lrow-sub">' + _agEscape(p.category) + ' · ' + p.ago + '</span></div>' +
      '<div class="ag-lrow-right"><span class="ag-lrow-amt">$' + p.amount + '.00</span></div></div>' +
    '<div class="ag-card-actions ag-stagger-item">' +
      '<button class="ag-action-btn primary" data-approve type="button"><span class="ag-action-label">Approve $' + p.amount + '</span><span class="ag-action-spinner" style="display:none"></span></button>' +
      '<button class="ag-action-btn secondary" data-decline type="button">Decline</button></div>';
  var ap = el.querySelector('[data-approve]'), dc = el.querySelector('[data-decline]');
  function dismiss(then) {
    el.style.transition = 'opacity 200ms ease, transform 220ms var(--ease-out)';
    el.style.opacity = '0'; el.style.transform = 'translateY(-4px) scale(0.985)';
    setTimeout(function() { el.remove(); then(); }, 220);
  }
  ap.addEventListener('click', function() {
    if (ap.classList.contains('loading')) return;
    ap.classList.add('loading'); ap.querySelector('.ag-action-spinner').style.display = 'block';
    setTimeout(function() { dismiss(function() { _agRenderFamilyApproved(aiDiv, msgs); }); }, 700);
  });
  dc.addEventListener('click', function() { dismiss(function() { _agRenderFamilyDecline(aiDiv, msgs); }); });
  _agAddCtx(aiDiv, fam.child + " is asking you to approve a $" + p.amount + " purchase at " + p.merchant + ", requested " + p.ago + ".", function() {
    _agRevealCard(aiDiv, el);
  });
}
function _agRenderFamilyApproved(aiDiv, msgs) {
  _agFlow = null;
  var fam = _AG_DATA.family, p = fam.pending;
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-alert-head ag-stagger-item"><div class="ag-alert-icon" style="background:rgba(70,136,43,0.12)"><span class="ico" style="--ico:url(\'Icons/Check.svg\');--sz:18px;color:#46882B"></span></div>' +
      '<div class="ag-alert-head-text"><span class="ag-alert-title">$' + p.amount + '.00 approved</span><span class="ag-alert-merchant">' + _agEscape(p.merchant) + ' · ' + fam.child + "'s card</span></div></div>" +
    '<div class="ag-charge-gap ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.06);background:transparent;color:var(--text-secondary)"><span class="ico" style="--ico:url(\'Icons/ChatCircle.svg\');--sz:13px;color:var(--text-tertiary)"></span>' + fam.child + ' has been notified</div>';
  _agAddCtx(aiDiv, 'Approved — $' + p.amount + '.00 is now available on ' + fam.child + "'s card. I've let her know.", function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Show her spending', text: "Show Emma's spending" },
        { label: 'Pay her allowance', text: "Pay Emma's allowance" }
      ]); }, 360);
    });
  });
}
function _agRenderFamilyDecline(aiDiv, msgs) {
  _agFlow = null;
  var fam = _AG_DATA.family, p = fam.pending;
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-alert-head ag-stagger-item"><div class="ag-alert-icon" style="background:rgba(0,0,0,0.06)"><span class="ico" style="--ico:url(\'Icons/X.svg\');--sz:16px;color:var(--text-secondary)"></span></div>' +
      '<div class="ag-alert-head-text"><span class="ag-alert-title">Request declined</span><span class="ag-alert-merchant">' + _agEscape(p.merchant) + ' · $' + p.amount + '.00</span></div></div>' +
    '<div class="ag-charge-gap ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.06);background:transparent;color:var(--text-secondary)"><span class="ico" style="--ico:url(\'Icons/ChatCircle.svg\');--sz:13px;color:var(--text-tertiary)"></span>' + fam.child + ' has been notified</div>';
  _agAddCtx(aiDiv, "Declined — I've let " + fam.child + " know the $" + p.amount + ' ' + p.merchant + " purchase wasn't approved.", function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Show her spending', text: "Show Emma's spending" },
        { label: 'Freeze her card', text: "Freeze Emma's card" }
      ]); }, 360);
    });
  });
}
function _agRenderFamilyAllowance(aiDiv, msgs) {
  var fam = _AG_DATA.family;
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-lrow ag-stagger-item" style="border-top:none">' +
      '<span class="ag-lrow-ic" style="background:rgba(70,136,43,0.12)"><span class="ico" style="--ico:url(\'Icons/HandCoins.svg\');--sz:15px;color:#46882B"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">' + fam.child + "'s allowance</span><span class=\"ag-lrow-sub\">Weekly · to " + fam.card.network + ' →' + fam.card.last4 + '</span></div>' +
      '<div class="ag-lrow-right"><span class="ag-lrow-amt">$' + fam.allowance + '.00</span></div></div>' +
    _agConfirmButton('Send $' + fam.allowance + ' to ' + fam.child);
  _agWireConfirm(el, aiDiv, msgs, function() { _agRenderFamilyAllowanceDone(aiDiv, msgs); });
  _agAddCtx(aiDiv, fam.child + "'s weekly allowance is $" + fam.allowance + ', due ' + fam.allowanceDue + '. Want me to send it now?', function() {
    _agRevealCard(aiDiv, el);
  });
}
function _agRenderFamilyAllowanceDone(aiDiv, msgs) {
  _agFlow = null;
  var fam = _AG_DATA.family;
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-alert-head ag-stagger-item"><div class="ag-alert-icon" style="background:rgba(70,136,43,0.12)"><span class="ico" style="--ico:url(\'Icons/Check.svg\');--sz:18px;color:#46882B"></span></div>' +
      '<div class="ag-alert-head-text"><span class="ag-alert-title">$' + fam.allowance + '.00 sent to ' + fam.child + '</span><span class="ag-alert-merchant">Weekly allowance · ' + fam.card.network + ' →' + fam.card.last4 + '</span></div></div>';
  _agAddCtx(aiDiv, 'Done — $' + fam.allowance + '.00 is on its way to ' + fam.child + "'s card.", function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Show her spending', text: "Show Emma's spending" },
        { label: 'Anything I should review?', text: 'Anything I should review?' }
      ]); }, 360);
    });
  });
}

// ── PAYEE / beneficiary verification ──
function _agRenderPayee(aiDiv, msgs) {
  var p = _AG_DATA.payee;
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-alert-head ag-stagger-item">' +
      '<div class="ag-alert-icon"><span class="ico" style="--ico:url(\'Icons/UserCheck.svg\');--sz:18px;color:#C17C14"></span></div>' +
      '<div class="ag-alert-head-text"><span class="ag-alert-title">Verify before sending</span><span class="ag-alert-merchant">Details don\'t fully match your history</span></div></div>' +
    '<div class="ag-lrow ag-stagger-item"><span class="ag-lrow-ic" style="background:rgba(193,124,20,0.12)"><span class="ico" style="--ico:url(\'Icons/PencilSimple.svg\');--sz:14px;color:#C17C14"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">Name changed</span><span class="ag-lrow-sub">' + _agEscape(p.oldName) + ' → ' + _agEscape(p.newName) + '</span></div></div>' +
    '<div class="ag-lrow ag-stagger-item"><span class="ag-lrow-ic" style="background:rgba(70,136,43,0.12)"><span class="ico" style="--ico:url(\'Icons/Check.svg\');--sz:14px;color:#46882B"></span></span>' +
      '<div class="ag-lrow-info"><span class="ag-lrow-title">Routing matches prior payment</span><span class="ag-lrow-sub">' + _agEscape(p.routing) + ' · ' + _agEscape(p.lastPaid) + '</span></div>' +
      '<div class="ag-lrow-right">' + _agTagHTML('up', p.confidence) + '</div></div>';
  _agAddCtx(aiDiv, 'Before you send, I want to flag this — the payee\'s details don\'t fully match your history. Likely the same vendor, but the display name changed.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'How confident are you?', text: 'How confident are you?' },
        { label: 'Should I verify first?', text: 'Should I verify before sending?' }
      ]); }, 360);
    });
  });
}
function _agRenderPayeeConfidence(aiDiv, msgs) {
  var p = _AG_DATA.payee;
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  var html = _agCardHeaderHTML('Why moderate confidence', '2 signals') + '<div class="ag-reason-list">';
  html += '<div class="ag-reason-row ag-stagger-item"><span class="ag-reason-check" style="background:rgba(193,124,20,0.12)"><span class="ico" style="--ico:url(\'Icons/Warning.svg\');--sz:11px;color:#C17C14"></span></span><span class="ag-reason-text">Display name changed from "' + _agEscape(p.oldName) + '" to "' + _agEscape(p.newName) + '".</span></div>';
  html += '<div class="ag-reason-row ag-stagger-item"><span class="ag-reason-check"><span class="ico" style="--ico:url(\'Icons/Check.svg\');--sz:11px;color:#46882B"></span></span><span class="ag-reason-text">Routing and account details match your prior payment exactly.</span></div>';
  html += '</div>';
  el.innerHTML = html;
  _agAddCtx(aiDiv, 'Moderately confident. The name changed, but the routing details line up with what you paid last month.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Should I verify first?', text: 'Should I verify before sending?' }
      ]); }, 360);
    });
  });
}
function _agRenderPayeeVerify(aiDiv, msgs) {
  var el = document.createElement('div'); el.className = 'ag-ui-card';
  el.innerHTML =
    '<div class="ag-metric-verdict warn ag-stagger-item"><span class="ico" style="--ico:url(\'Icons/ShieldCheck.svg\');--sz:13px;color:#875610"></span>Verify before sending</div>' +
    '<div class="ag-charge-gap ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.05);background:transparent;color:var(--text-tertiary);justify-content:flex-start;padding:10px 16px">A quick confirmation protects you since the display name changed.</div>';
  _agAddCtx(aiDiv, 'Yes — I\'d do a quick verification because the display name changed. Once you\'re comfortable, I can also wait for your funds to clear before sending.', function() {
    _agRevealCard(aiDiv, el, function() {
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'Remind me when funds clear', text: 'Remind me to send once my funds clear' }
      ]); }, 360);
    });
  });
}

// ── TEXT (typewriter) ─────────────────────────────────
// Feedback row shown under a completed AI answer (thumbs up/down · copy · flag)
function _agFeedbackRow(answerText) {
  var row = document.createElement('div');
  row.className = 'ag-feedback';
  var btns = [
    { ic: 'Copy.svg',       label: 'Copy reply',    act: 'copy' },
    { ic: 'ThumbsUp.svg',   label: 'Good response', act: 'up'   },
    { ic: 'ThumbsDown.svg', label: 'Bad response',  act: 'down' },
    { ic: 'Flag.svg',       label: 'Flag message',  act: 'flag' },
  ];
  row.innerHTML = btns.map(function(b) {
    return '<button class="ag-feedback-btn" data-act="' + b.act + '" aria-label="' + b.label + '">' +
      '<span class="ico ol" style="--ico:url(\'Icons/' + b.ic + '\');--sz:16px;color:rgba(0,0,0,0.45)" aria-hidden="true"></span>' +
    '</button>';
  }).join('');
  var copyB = row.querySelector('[data-act="copy"]');
  var upB   = row.querySelector('[data-act="up"]');
  var downB = row.querySelector('[data-act="down"]');
  var flagB = row.querySelector('[data-act="flag"]');

  copyB.addEventListener('click', function() {
    haptic(6);
    if (navigator.clipboard && answerText) { navigator.clipboard.writeText(answerText).catch(function(){}); }
    showToast('Copied to clipboard');
  });
  upB.addEventListener('click', function() {
    haptic(8);
    downB.classList.remove('is-on');
    upB.classList.toggle('is-on');
    if (upB.classList.contains('is-on')) showToast('Thanks for the feedback');
  });
  downB.addEventListener('click', function() {
    haptic(8);
    upB.classList.remove('is-on');
    downB.classList.toggle('is-on');
    if (downB.classList.contains('is-on')) showToast("Thanks — we'll use this to improve");
  });
  flagB.addEventListener('click', function() {
    haptic(10);
    flagB.classList.toggle('is-flagged');
    showToast(flagB.classList.contains('is-flagged') ? 'Message flagged for review' : 'Flag removed');
  });
  return row;
}

// Plain text of a reply (for copy), minus the label, cursor, thinking + footer chrome
function _agReplyText(aiDiv) {
  var clone = aiDiv.cloneNode(true);
  clone.querySelectorAll('.ag-msg-ai-label, .ag-feedback, .ag-cursor, .ag-think-block, .ag-think-trail')
       .forEach(function(n) { n.remove(); });
  return (clone.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Attach the copy / thumbs / flag footer to a reply once its content settles.
// A reply can stream in over time (typewriter, cards, follow-ups), so we wait
// until DOM mutations on the bubble go quiet, then append the bar at the bottom.
function _agAppendFooter(aiDiv) {
  if (_agGalleryMode) return;            // gallery shows cards only
  if (aiDiv._agFooterArmed) return;
  aiDiv._agFooterArmed = true;
  var timer, committed = false;
  function commit() {
    if (committed) return; committed = true;
    obs.disconnect();
    if (aiDiv.querySelector(':scope > .ag-feedback')) return;

    var fb = _agFeedbackRow(_agReplyText(aiDiv));
    aiDiv.appendChild(fb);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { fb.classList.add('visible'); });
    });
    // Keep the footer pinned below trailing content (cards, the "alternatively"
    // list, follow-up rows) as it streams in. Must stay trail-aware: the
    // thinking-spinner trail runs its own bottom-pinning observer, so we keep
    // the footer just *above* the trail (never fight it for last place) —
    // otherwise the two observers ping-pong forever and freeze the page.
    var pin = new MutationObserver(function() {
      var trail = aiDiv.querySelector(':scope > .ag-think-trail');
      if (trail) {
        if (trail.previousElementSibling !== fb) aiDiv.insertBefore(fb, trail);
      } else if (aiDiv.lastElementChild && aiDiv.lastElementChild !== fb) {
        aiDiv.appendChild(fb);
      }
    });
    pin.observe(aiDiv, { childList: true });
  }
  function arm() { clearTimeout(timer); timer = setTimeout(commit, 650); }
  var obs = new MutationObserver(arm);
  obs.observe(aiDiv, { childList: true, subtree: true, characterData: true });
  arm();
  setTimeout(commit, 12000);             // safety cap for long/animated replies
}

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
      setTimeout(typeChar, 16 + Math.floor(Math.random() * 12));
    } else {
      cursor.style.transition = 'opacity 400ms ease';
      cursor.style.opacity = '0';
      setTimeout(function() { if (cursor.parentNode) cursor.remove(); }, 420);
      // footer (copy/thumbs/flag) is attached generically by _agAppendFooter
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
    });
  });
}

// ── Core UI functions ─────────────────────────────────

// First tap: blur rest of home, lift the input box, then open agent screen
function focusHomeAi() {
  var home = document.getElementById('home');
  if (!home || home.classList.contains('home-ai-focused')) return;
  home.classList.add('home-ai-focused');
  // Let the lift + blur animation peak then open the agent screen
  setTimeout(openHomeAgent, 320);
}

// ── Use-case switcher (top dropdown) ──
var _AG_USECASES = {
  send:      { label: 'Send money abroad',     seed: 'Send $500 to Maya Sarini' },
  vigilance: { label: 'Awareness & vigilance', seed: 'Anything I should review?' },
  bills:     { label: 'Bills & recurring',     seed: 'What bills are coming up?' },
  cashflow:  { label: 'Cashflow & forecast',   seed: 'Can I afford a $1,200 flight next month without touching savings?' },
  goals:     { label: 'Savings & goals',       seed: 'I want $3k saved for vacation by August' },
  family:    { label: 'Family operations',     seed: "What's happening with Emma's card?" },
  payee:     { label: 'Beneficiary & payees',  seed: 'Is this the same vendor I paid last month?' },
};
function agToggleUseCaseMenu(e) {
  if (e) e.stopPropagation();
  var menu = document.getElementById('agUseCaseMenu');
  var scrim = document.getElementById('agUseCaseScrim');
  var btn = document.getElementById('agUseCaseBtn');
  if (!menu) return;
  var open = !menu.classList.contains('open');
  menu.classList.toggle('open', open);
  if (scrim) scrim.classList.toggle('open', open);
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function agCloseUseCaseMenu() {
  var menu = document.getElementById('agUseCaseMenu');
  var scrim = document.getElementById('agUseCaseScrim');
  var btn = document.getElementById('agUseCaseBtn');
  if (menu) menu.classList.remove('open');
  if (scrim) scrim.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}
// Jump-to-latest: show a floating button when scrolled up from the bottom
var _agJumpBound = false;
var _agSuppressJump = false; // muted during the programmatic stick-to-top scroll
function _agUpdateJump() {
  var msgs = document.getElementById('agentMsgs');
  var jump = document.getElementById('agentJump');
  if (!msgs || !jump) return;
  if (_agSuppressJump) { jump.classList.remove('is-visible'); return; }
  var fromBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight;
  jump.classList.toggle('is-visible', fromBottom > 120);
}
function _agBindJump() {
  var msgs = document.getElementById('agentMsgs');
  if (!msgs || _agJumpBound) return;
  _agJumpBound = true;
  msgs.addEventListener('scroll', _agUpdateJump, { passive: true });
}
function agentScrollToBottom() {
  var msgs = document.getElementById('agentMsgs');
  if (!msgs) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  msgs.scrollTo({ top: msgs.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
}
// Clear the thread back to a fresh state without closing the agent
function _agResetConvo() {
  var msgs = document.getElementById('agentMsgs');
  if (!msgs) return;
  msgs.innerHTML = '<div class="ag-msgs-spacer" aria-hidden="true"></div>';
  var screen = document.getElementById('agent-screen');
  if (screen) screen.classList.remove('ag-convo');
  _homeAgentConvo = false; _agFlow = null; _agResponseIdx = 0;
  msgs.scrollTop = 0;
  var jump = document.getElementById('agentJump'); if (jump) jump.classList.remove('is-visible');
}
function agPickUseCase(key) {
  agCloseUseCaseMenu();
  var lbl = document.getElementById('agUseCaseLabel');
  document.querySelectorAll('#agUseCaseMenu .ag-usecase-item').forEach(function(it) {
    it.classList.toggle('active', it.getAttribute('onclick') === "agPickUseCase('" + key + "')");
  });
  if (key === 'gallery') {
    if (lbl) lbl.textContent = 'All card styles';
    _agRenderGallery();
    return;
  }
  // "Pay someone safely" runs the real interactive send-money journey
  // (transfer review card → edit details / purpose → send), not a scripted playback.
  if (key === 'pay') {
    if (lbl) lbl.textContent = _AG_SCRIPT_LABELS.pay;
    _agResetConvo();
    setTimeout(function() { agentSendText('Pay Maya $500'); }, 80);
    return;
  }
  if (_AG_SCRIPTS[key]) {
    if (lbl) lbl.textContent = _AG_SCRIPT_LABELS[key] || 'Use cases';
    agPlayScript(key);
    return;
  }
  var uc = _AG_USECASES[key];
  if (!uc) return;
  if (lbl) lbl.textContent = uc.label;
  _agResetConvo();
  setTimeout(function() { agentSendText(uc.seed); }, 80);
}

/* ══════════════════════════════════════════════════════════════════
   Scripted use-case conversations — exact example dialogues, played
   back turn-by-turn using the same message primitives as a live chat.
   A turn is { u: 'user line' } or { a: ['agent line', ...] } (a cluster
   of consecutive agent messages typed one after another).
══════════════════════════════════════════════════════════════════ */
var _AG_SCRIPT_LABELS = {
  forecast:  "What's coming up",
  pay:       'Pay someone safely',
  protect:   'Protect my card & spend',
  explain:   'What is this charge?',
  autopilot: 'Financial autopilot'
};
var _AG_LEAF_SVG = '<span class="ag-msg-ai-leaf"><svg viewBox="0 0 24 24" width="14" height="14" fill="#46882B" aria-hidden="true"><path d="M6.05 8.05c-2.73 2.73-2.73 7.17-.02 9.9 1.47-3.4 4.09-6.24 7.36-7.93-2.77 2.34-4.71 5.61-5.39 9.32 2.6 1.23 5.8.78 7.95-1.37C19.43 14.47 20 4 20 4S9.53 4.57 6.05 8.05z"/></svg></span>';

var _AG_SCRIPTS = {
  forecast: [
    { u: 'Will I have enough money this week?' },
    { a: [
      'I’m checking your balances, scheduled payments, and predicted recurring payments.',
      'You have $4,250 available in checking. I see $3,100 due over the next 7 days: rent, utilities, and Amex.',
      'The main risk is your Amex payment posting one day earlier than usual. If that happens, checking could dip to about $720.'
    ], card: { type: 'forecast', title: 'Checking · next 7 days', low: '$1,150', lowDay: 'Thu',
               points: [4250, 3600, 2450, 1150, 1900, 2050, 2000], days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
               cushion: 1000, risk: 'If Amex posts early: ~$720' } },
    { u: 'What should I do?' },
    { a: [{ intro: 'You have 3 good options:', list: [
        'Move $500 from Savings now',
        'Delay the Amex payment, if allowed',
        'Keep card spend about $300 lower this week'
      ] }] },
    { u: 'Move $500 from Savings.' },
    { a: ['Confirming this transfer — it should keep checking above $1,200 through the week.'],
      card: { type: 'transfer', fromAv: 'space-usd-checking.webp', from: 'Savings ••2204', fromSub: '$8,900.00',
              toAv: 'space-usd-checking.webp', to: 'Checking ••8812', toSub: '$4,250.00',
              rows: [{ l: 'Amount', v: '$500.00' }, { l: 'Arrives', v: 'Today' }] } },
    { u: 'Confirm.' },
    { a: ['Done — $500 moved to Checking. I’ll keep watching this week’s balance and let you know if the forecast changes.'] },
    { sep: 'Proactive alert' },
    { a: ['You have rent, utilities, and Amex due this week. If everything posts on time, your lowest checking balance will be about $1,150 on Thursday. If Amex posts early, you may dip below your usual cushion. Want options?'] }
  ],

  pay: [
    { u: 'Pay my landlord $2,400 on the 1st of every month.' },
    { a: [
      'I found Green Street Properties as your saved landlord. Your last rent payment was $2,400 from Checking ending 8812. Should I use the same recipient and account?'
    ] },
    { u: 'Yes.' },
    { a: [
      'Got it — same-day arrival by bank transfer. Please review before I schedule it.'
    ], card: { type: 'transfer', fromAv: 'space-usd-checking.webp', from: 'Checking ••8812', fromSub: '$146,000.00',
               to: 'Green Street Properties', toInitials: 'GS', toColor: 'linear-gradient(145deg,#46882b,#2d5a16)',
               rows: [{ l: 'Amount', v: '$2,400.00' }, { l: 'Frequency', v: 'Monthly · from Aug 1' }, { l: 'Memo', v: 'Rent' }, { l: 'Arrival', v: 'Same day' }] } },
    { u: 'Confirm.' },
    { a: ['Scheduled. I’ll remind you before the first payment and tell you if your balance may not cover it.'] },
    { sep: 'Repeat a past payment' },
    { u: 'Send the same amount as last month to my cleaner.' },
    { a: ['Last month you sent $180 to Maya Cleaning from Checking. Want to send $180 again today?'],
      card: { type: 'transfer', fromAv: 'space-usd-checking.webp', from: 'Checking ••8812', fromSub: '$146,000.00',
              to: 'Maya Cleaning', toInitials: 'MC', toColor: 'linear-gradient(145deg,#D85090,#962858)',
              rows: [{ l: 'Amount', v: '$180.00' }, { l: 'Arrival', v: 'Today' }] } },
    { u: 'Yes.' },
    { a: ['Confirming $180 to Maya Cleaning from Checking ending 8812. Estimated arrival: today.'] },
    { u: 'Confirm.' },
    { a: ['Sent.'] },
    { sep: 'Pay an invoice' },
    { u: 'Pay this invoice.' },
    { a: [
      'I found an invoice for $742.18 from Brightline Dental, due July 15. I don’t see this recipient saved yet.',
      'Before I can pay it, I need to add Brightline Dental as a recipient using the payment details on the invoice. Please review them.'
    ] },
    { u: 'Looks good.' },
    { a: ['Recipient saved. Do you want to pay now or schedule it for the due date?'] }
  ],

  protect: [
    { u: 'I don’t recognize this $89 charge.' },
    { a: [
      'I found this charge. It’s from a merchant you’ve used before, but the amount is higher than usual.',
      'Do you want to freeze the card while we check?'
    ], card: { type: 'charge', av: '📦', merch: 'Amazon Marketplace', sub: 'Everyday card · Today, 9:42 AM', amount: '$89.14', flag: 'Higher than your usual $12–$45 at this merchant' } },
    { u: 'Yes.' },
    { a: ['Confirming: freeze Everyday card ending 4421. New purchases will be declined until you unfreeze it.'] },
    { u: 'Confirm.' },
    { a: ['Card frozen. Do you want to mark the Amazon charge as unauthorized or wait until it settles?'] },
    { u: 'Mark it unauthorized.' },
    { a: ['I’ll flag it as unauthorized. Since it’s still pending, the final dispute may begin once it posts.'] },
    { sep: 'Control a card’s spend' },
    { u: 'Block Roblox on Emma’s card.' },
    { a: ['I found Emma’s Teen card. Roblox transactions appear under gaming / digital goods. Do you want to block Roblox specifically or block all gaming merchants?'] },
    { u: 'Just Roblox.' },
    { a: ['Confirming: block future Roblox purchases on Emma’s Teen card ending 1098. Existing pending charges won’t be reversed.'] },
    { u: 'Confirm.' },
    { a: ['Done. I’ll let you know if a Roblox charge is attempted.'] }
  ],

  explain: [
    { u: 'What is this $126 charge on my Travel card? I don’t remember booking anything.' },
    { a: [
      'Here’s the charge. It looks like the final posted version of your Delta purchase on July 3, not a duplicate.',
      'No action is needed right now. If another Delta charge for the same amount posts, I’ll flag it as a possible duplicate.'
    ], card: { type: 'charge', av: '✈️', merch: 'Delta Airlines', sub: 'Travel card · Yesterday', amount: '$126.08', status: 'Pending' } },
    { u: 'Track it.' },
    { a: ['Done — I’ll watch for another Delta charge with the same amount over the next 7 days.'] },
    { sep: 'A payment that failed' },
    { u: 'Why did my payment to Maya fail?' },
    { a: [
      'Your $180 payment to Maya Cleaning failed yesterday because the source account did not have enough available balance when the payment was attempted.',
      'At the time, Checking had $92 available. You needed $180.',
      'You can retry from Savings, move money to Checking first, or schedule it for Friday after your deposit.'
    ] },
    { u: 'Retry Friday.' },
    { a: ['Confirming: retry $180 to Maya Cleaning on Friday from Checking ending 8812.'] },
    { sep: 'A missing refund' },
    { u: 'Did I get refunded for the Zara return?' },
    { a: [
      'I found a $94.32 Zara purchase from June 22. I don’t see a matching refund yet.',
      'Most card refunds arrive within 5–10 business days. This purchase was 9 business days ago, so it’s worth tracking.',
      'Do you want me to track an expected $94.32 refund for the next 7 days?'
    ] },
    { u: 'Yes.' },
    { a: ['Tracking it. I’ll notify you when the refund arrives or if it’s still missing after 7 days.'] }
  ],

  autopilot: [
    { u: 'Warn me if checking drops below $1,500.' },
    { a: [
      'I can watch Checking and alert you if the available balance drops below $1,500.',
      'Do you only want an alert, or should I also suggest a transfer when that happens?'
    ] },
    { u: 'Suggest a transfer.' },
    { a: ['Got it. If Checking drops below $1,500, I’ll suggest moving money from Savings, but I won’t move anything without your confirmation.'] },
    { sep: 'When the rule triggers' },
    { a: ['Checking dropped to $1,420 after your Amex payment. Move $300 from Savings to restore your cushion?'],
      card: { type: 'transfer', fromAv: 'space-usd-checking.webp', from: 'Savings ••2204', fromSub: '$8,900.00',
              toAv: 'space-usd-checking.webp', to: 'Checking ••8812', toSub: '$1,420.00',
              rows: [{ l: 'Amount', v: '$300.00' }, { l: 'Arrives', v: 'Today' }] } },
    { u: 'Yes.' },
    { a: ['Confirming: move $300 from Savings ending 2204 to Checking ending 8812 today.'] },
    { u: 'Confirm.' },
    { a: ['Done — Checking is now projected to stay above $1,700 through Friday.'] },
    { sep: 'Automate your paycheck' },
    { u: 'When my paycheck lands, move 20% to Savings.' },
    { a: [
      'I can watch for your paycheck deposit and suggest moving 20% to Savings when it arrives.',
      'Your last paycheck was $4,800, so that would have moved about $960. Should I use Savings ending 2204?'
    ] },
    { u: 'Yes.' },
    { a: ['Should this happen automatically, or should I ask you each time?'] },
    { u: 'Ask me each time.' },
    { a: ['Done. When payroll lands, I’ll ask before moving 20% to Savings.'] },
    { sep: 'Adjust a schedule' },
    { u: 'Pause rent this month.' },
    { a: ['I found your monthly rent payment to Green Street Properties for $2,400, scheduled for Aug 1. Do you want to skip only the Aug 1 payment or pause the whole schedule?'] },
    { u: 'Just this month.' },
    { a: ['Confirming: skip the Aug 1 rent payment only. Future monthly rent payments will continue.'] },
    { u: 'Confirm.' },
    { a: ['Done. I’ll remind you before the next rent payment resumes on Sep 1.'] }
  ]
};

/* ── Center UI cards for scripted messages (styling from Figma 3502-2736) ── */
function _agCardBalanceHTML(c) {
  var chips = (c.chips || []).map(function(x) {
    return '<span class="ag-balance-chip' + (x.pos ? ' positive' : '') + '">' + _agEscape(x.t) + '</span>';
  }).join('');
  return '<div class="ag-balance-bg" aria-hidden="true"><img loading="lazy" decoding="async" src="assets/acct-det-hero-bg.webp?v=2" alt=""></div>' +
    '<div class="ag-balance-body">' +
      '<div class="ag-balance-head ag-stagger-item"><span class="ag-balance-av"><img loading="lazy" decoding="async" src="assets/space-usd-checking.webp" alt=""></span>' +
        '<span class="ag-balance-label">' + _agEscape(c.label) + '</span></div>' +
      '<div class="ag-balance-amount-row ag-stagger-item"><span class="ag-balance-sym">$</span><span class="ag-balance-int">' + _agEscape(c.balance) + '</span><span class="ag-balance-dec">' + _agEscape(c.dec || '.00') + '</span></div>' +
      '<div class="ag-balance-divider"></div>' +
      '<div class="ag-balance-chips ag-stagger-item">' + chips + '</div>' +
    '</div>';
}
function _agCardForecastHTML(c) {
  var pts = c.points || [], n = pts.length, days = c.days || [];
  var W = 296, H = 104, padX = 4, padTop = 16, padBot = 26;
  var vals = pts.concat(c.cushion != null ? [c.cushion] : []);
  var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
  var range = (max - min) || 1;
  var innerW = W - padX * 2, innerH = H - padTop - padBot;
  var X = function(i) { return padX + (n <= 1 ? 0 : (i / (n - 1)) * innerW); };
  var Y = function(v) { return padTop + (1 - (v - min) / range) * innerH; };
  var line = pts.map(function(v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
  var baseY = (padTop + innerH).toFixed(1);
  var area = line + ' L' + X(n - 1).toFixed(1) + ' ' + baseY + ' L' + X(0).toFixed(1) + ' ' + baseY + ' Z';
  var lowIdx = pts.indexOf(Math.min.apply(null, pts));
  var cushY = c.cushion != null ? Y(c.cushion).toFixed(1) : null;
  var lx = X(lowIdx).toFixed(1), ly = Y(pts[lowIdx]).toFixed(1);
  var dayLabels = days.map(function(d, i) {
    return '<span class="ag-fc-day' + (i === lowIdx ? ' is-low' : '') + '">' + _agEscape(d) + '</span>';
  }).join('');
  var cushLine = cushY ? '<line class="ag-fc-cushion" x1="' + padX + '" y1="' + cushY + '" x2="' + (W - padX) + '" y2="' + cushY + '"/>' : '';
  return '<div class="ag-fc-head ag-stagger-item">' +
      '<span class="ag-fc-title">' + _agEscape(c.title || 'Forecast') + '</span>' +
      '<span class="ag-fc-low"><span class="ag-fc-low-label">Projected low</span>' +
        '<span class="ag-fc-low-val">' + _agEscape(c.low) + '</span></span>' +
    '</div>' +
    '<div class="ag-fc-chart ag-stagger-item">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs><linearGradient id="agFcFill" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="var(--brand-primary)" stop-opacity="0.16"/>' +
          '<stop offset="1" stop-color="var(--brand-primary)" stop-opacity="0"/>' +
        '</linearGradient></defs>' +
        '<path d="' + area + '" fill="url(#agFcFill)"/>' +
        cushLine +
        '<path d="' + line + '" fill="none" stroke="var(--brand-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="' + lx + '" cy="' + ly + '" r="3.5" fill="var(--brand-primary)" stroke="#fff" stroke-width="1.5"/>' +
      '</svg>' +
      '<div class="ag-fc-days">' + dayLabels + '</div>' +
    '</div>' +
    (c.risk ? '<div class="ag-fc-risk ag-stagger-item">' + _agEscape(c.risk) + '</div>' : '');
}
function _agCardTransferHTML(d) {
  var arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="rgba(0,0,0,0.35)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function party(av, initials, color, name, sub) {
    var avHtml = av
      ? '<span class="ag-sm2-acct-av"><img loading="lazy" decoding="async" src="assets/' + av + '" alt=""></span>'
      : '<span class="ag-sm2-recip-av" style="background:' + (color || 'linear-gradient(145deg,#8a8a8a,#5a5a5a)') + '">' + _agEscape(initials || '') + '</span>';
    return '<div class="ag-sm2-acct">' + avHtml +
      '<span class="ag-sm2-acct-txt"><span class="ag-sm2-acct-name">' + _agEscape(name) + '</span>' +
      (sub ? '<span class="ag-sm2-acct-sub">' + _agEscape(sub) + '</span>' : '') + '</span></div>';
  }
  var rows = (d.rows || []).map(function(r) {
    return '<div class="ag-sm2-row"><span class="ag-sm2-l">' + _agEscape(r.l) + '</span><span class="ag-sm2-v">' + _agEscape(r.v) + '</span></div>';
  }).join('');
  return '<div class="ag-sm2-route ag-stagger-item">' +
      party(d.fromAv, d.fromInitials, d.fromColor, d.from, d.fromSub) +
      '<span class="ag-sm2-arrow">' + arrow + '</span>' +
      party(d.toAv, d.toInitials, d.toColor, d.to, d.toSub) +
    '</div>' +
    '<div class="ag-sm2-panel ag-stagger-item"><div class="ag-sm2-rows">' + rows + '</div></div>';
}
function _agCardChargeHTML(d) {
  var right = '<span class="ag-sc-charge-amt">' + _agEscape(d.amount) + '</span>' +
    (d.status ? '<span class="ag-sc-charge-status">' + _agEscape(d.status) + '</span>' : '');
  return '<div class="ag-sc-charge-row ag-stagger-item">' +
      '<span class="ag-sc-charge-av">' + (d.av || '💳') + '</span>' +
      '<div class="ag-sc-charge-info"><span class="ag-sc-charge-merch">' + _agEscape(d.merch) + '</span>' +
        '<span class="ag-sc-charge-sub">' + _agEscape(d.sub) + '</span></div>' +
      '<div class="ag-sc-charge-right">' + right + '</div>' +
    '</div>' +
    (d.flag ? '<div class="ag-sc-charge-flag ag-stagger-item">' + _agEscape(d.flag) + '</div>' : '');
}
function _agScriptCard(card) {
  if (!card) return null;
  var el = document.createElement('div');
  el.className = 'ag-ui-card';
  if (card.type === 'balance')      { el.classList.add('ag-balance-card'); el.innerHTML = _agCardBalanceHTML(card); }
  else if (card.type === 'forecast'){ el.classList.add('ag-fc-card');      el.innerHTML = _agCardForecastHTML(card); }
  else if (card.type === 'transfer'){ el.classList.add('ag-sm2-card');     el.innerHTML = _agCardTransferHTML(card); }
  else if (card.type === 'charge')  { el.classList.add('ag-sc-charge');    el.innerHTML = _agCardChargeHTML(card); }
  else return null;
  return el;
}

// Custom eased scroll for the stick-to-top motion. Native `behavior:'smooth'`
// eases inconsistently across engines and can feel abrupt; this uses a long,
// gentle easeInOutCubic so the question glides up and settles.
function _agSmoothScrollTo(el, target, duration, onDone) {
  if (!el) { if (onDone) onDone(); return; }
  var start = el.scrollTop;
  var dist = target - start;
  if (_prefersReduced || Math.abs(dist) < 1) {
    el.scrollTop = target; if (onDone) onDone(); return;
  }
  var dur = duration || 680;
  var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  var ease = function(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function step(now) {
    var p = Math.min(1, (now - t0) / dur);
    el.scrollTop = start + dist * ease(p);
    if (p < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}
function _agScriptScrollBottom() {
  var msgs = document.getElementById('agentMsgs');
  if (!msgs) return;
  msgs.scrollTo({ top: msgs.scrollHeight, behavior: _prefersReduced ? 'auto' : 'smooth' });
}
function _agScriptUser(text) {
  var msgs = document.getElementById('agentMsgs');
  var d = document.createElement('div');
  d.className = 'ag-msg-user';
  d.innerHTML = '<div class="ag-msg-user-bubble">' + _agEscape(text) + '</div>';
  msgs.appendChild(d);
  requestAnimationFrame(function() { requestAnimationFrame(function() { d.classList.add('visible'); }); });
  return d;
}
function _agScriptSep(text) {
  var msgs = document.getElementById('agentMsgs');
  var d = document.createElement('div');
  d.className = 'ag-script-sep';
  d.textContent = text;
  msgs.appendChild(d);
  requestAnimationFrame(function() { requestAnimationFrame(function() { d.classList.add('s-in'); }); });
}
function _agScriptAgent(lines, card, onDone, userDiv) {
  var msgs = document.getElementById('agentMsgs');
  var ai = document.createElement('div');
  ai.className = 'ag-msg-ai';
  ai.innerHTML = '<div class="ag-msg-ai-label"><span class="ag-msg-ai-name">Banyan AI</span></div>'
    .replace('<span class="ag-msg-ai-name">', _AG_LEAF_SVG + '<span class="ag-msg-ai-name">');
  // Release height reserved under earlier answers so they collapse to natural
  // spacing before we anchor the new exchange.
  msgs.querySelectorAll('.ag-msg-ai').forEach(function(el) { el.style.minHeight = ''; });
  msgs.appendChild(ai);
  // When this exchange started with a user question, stick it to the top
  // (same behavior as agentSend): reserve height below the answer so the
  // question can scroll up and anchor near the header, then stream below it.
  if (userDiv) {
    ai.style.minHeight = Math.max(0, msgs.clientHeight - userDiv.offsetHeight - 112) + 'px';
  }
  // Content-flow scroll: anchored exchanges hold position (content fills the
  // reserved space below); unanchored ones (proactive alerts) track the bottom.
  var flow = userDiv ? function() {} : _agScriptScrollBottom;
  // Reveal the message container, but keep the "Banyan AI" header hidden until
  // the thinking animation has played out (header replaces the thinking block).
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { ai.classList.add('visible'); });
  });
  var i = 0;
  function typeLine() {
    if (i >= lines.length) {
      // Center UI card (preferred) rendered once the framing text has landed
      var el = _agScriptCard(card);
      if (el) {
        ai.appendChild(el);
        requestAnimationFrame(function() { requestAnimationFrame(function() {
          el.classList.add('ui-in');
          _agStagger(el, '.ag-stagger-item', 80);
        }); });
        flow();
      }
      // Copy / thumbs / flag bar, same as a live reply. Its observer commits
      // after the followups settle, so it lands at the bottom of the message.
      _agAppendFooter(ai);
      if (onDone) onDone(ai);
      return;
    }
    var line = lines[i];
    var advance = function() { i++; setTimeout(typeLine, 320); };
    if (line && typeof line === 'object' && line.list) {
      _agAddList(ai, line.intro, line.list, advance);
    } else {
      _agAddCtx(ai, line, advance);
    }
    flow();
  }
  // Anchor the exchange before the thinking animation plays.
  if (userDiv) {
    _agSuppressJump = true;
    var jmp = document.getElementById('agentJump'); if (jmp) jmp.classList.remove('is-visible');
    var target = Math.max(0, userDiv.offsetTop - 20); // +12px breathing room from top
    _agSmoothScrollTo(msgs, target, 680, function() {
      _agSuppressJump = false; if (typeof _agUpdateJump === 'function') _agUpdateJump();
    });
  } else {
    _agScriptScrollBottom();
  }
  _agRunSteps(ai, _AG_DEFAULT_STEPS, msgs, function() {
    var lbl = ai.querySelector('.ag-msg-ai-label');
    if (lbl) {
      lbl.classList.add('show');
      requestAnimationFrame(function() { requestAnimationFrame(function() { lbl.classList.add('in'); }); });
    }
    typeLine();
  }, 3200);
  return ai;
}

/* Interactive stepper: play one exchange, then surface the NEXT ideal question
   in "Here's what you can do next". The user taps it to ask it themselves. */
var _agScriptTurns = null;
var _agScriptPos = 0;
var _agScriptKey = null;
// Contextual alternatives so "what you can do next" always offers ≥2 options.
// These route through the normal agent (leaving the guided script).
var _AG_SCRIPT_ALT = {
  forecast:  [{ l: 'Show upcoming payments', t: 'Show upcoming transfers' }, { l: 'Check my balance', t: 'What is my balance?' }],
  pay:       [{ l: 'Show recent spending', t: 'Show recent spending' }, { l: 'Check my balance', t: 'What is my balance?' }],
  protect:   [{ l: 'Check my balance', t: 'What is my balance?' }, { l: 'Show recent spending', t: 'Show recent spending' }],
  explain:   [{ l: 'Anything I should review?', t: 'Anything I should review?' }, { l: 'Show recent spending', t: 'Show recent spending' }],
  autopilot: [{ l: 'Show upcoming payments', t: 'Show upcoming transfers' }, { l: 'Check my balance', t: 'What is my balance?' }]
};
function agPlayScript(key) {
  var turns = _AG_SCRIPTS[key];
  if (!turns) return;
  _agResetConvo();
  var screen = document.getElementById('agent-screen');
  if (screen) screen.classList.add('ag-convo');
  _homeAgentConvo = true;
  _agBindJump();
  _agScriptTurns = turns;
  _agScriptPos = 0;
  _agScriptKey = key;
  setTimeout(_agRunScriptSegment, 140);
}
// Render one segment: [optional sep] + [optional user turn] + its agent cluster
function _agRunScriptSegment() {
  var turns = _agScriptTurns;
  if (!turns) return;
  var p = _agScriptPos;
  if (p >= turns.length) return;
  if (turns[p] && turns[p].sep !== undefined) { _agScriptSep(turns[p].sep); p++; }
  var hasUser = p < turns.length && turns[p].u !== undefined;
  var userDiv = null;
  if (hasUser) { userDiv = _agScriptUser(turns[p].u); p++; }
  var lines = [];
  var card = null;
  while (p < turns.length && turns[p].a !== undefined) {
    lines = lines.concat(turns[p].a);
    if (turns[p].card) card = turns[p].card;
    p++;
  }
  var nextPos = p;
  _agScriptPos = nextPos;
  var delay = hasUser ? 620 : 260;
  setTimeout(function() {
    if (!lines.length) { _agOfferNextSegment(nextPos, null); return; }
    _agScriptAgent(lines, card, function(ai) { _agOfferNextSegment(nextPos, ai); }, userDiv);
  }, delay);
}
// Present a scripted turn as a natural action label: drop a single trailing
// period (keep ellipses / question marks) so it reads like a suggestion.
function _agActionLabel(text) {
  if (!text) return text;
  return text.replace(/([^.])\.$/, '$1');
}
// The tappable label that advances to the segment beginning at `pos`
function _agSegmentTrigger(pos) {
  var turns = _agScriptTurns;
  if (!turns || pos >= turns.length) return null;
  if (turns[pos].sep !== undefined) {
    if (pos + 1 < turns.length && turns[pos + 1].u !== undefined) return turns[pos + 1].u;
    return turns[pos].sep;
  }
  if (turns[pos].u !== undefined) return turns[pos].u;
  return 'Continue';
}
function _agOfferNextSegment(nextPos, ai) {
  var trig = _agSegmentTrigger(nextPos);
  var alts = (_AG_SCRIPT_ALT[_agScriptKey] || []).slice();
  // Build the option set — the scripted next turn (advances the flow, the user
  // taps it themselves — never auto-played) plus contextual alternatives.
  var rows = [];
  if (trig) rows.push({ label: _agActionLabel(trig), advance: true });
  for (var k = 0; k < alts.length && rows.length < 3; k++) {
    if (rows.length && rows[0].label === _agActionLabel(alts[k].l)) continue;
    rows.push({ label: _agActionLabel(alts[k].l), text: alts[k].t });
  }
  if (rows.length < 2) return; // nothing meaningful left to offer

  var host = ai || document.getElementById('agentMsgs');
  var wrap = document.createElement('div');
  wrap.className = 'ag-followup-wrap';
  var header = document.createElement('div');
  header.className = 'ag-followup-header';
  header.textContent = "Here's what you can do next";
  wrap.appendChild(header);
  var list = document.createElement('div');
  list.className = 'ag-followup-list';
  rows.forEach(function(r) {
    var btn = document.createElement('button');
    btn.className = 'ag-followup-row';
    btn.type = 'button';
    btn.innerHTML = '<span class="ag-followup-arrow" aria-hidden="true">↳</span>' +
      '<span class="ag-followup-label">' + _agEscape(r.label) + '</span>';
    btn.addEventListener('click', function() {
      wrap.remove(); // consume the suggestions
      if (r.advance) { _agRunScriptSegment(); }      // continue the guided script
      else { _agScriptTurns = null; agentSendText(r.text); } // hand off to normal agent
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  host.appendChild(wrap);
  requestAnimationFrame(function() { requestAnimationFrame(function() { wrap.classList.add('s-in'); }); });
  _agScriptScrollBottom();
}

// ── Card-styles gallery: every component, laid out at once ──
function _agGalleryCaption(msgs, label) {
  var c = document.createElement('div');
  c.className = 'ag-gallery-cap';
  c.textContent = label;
  msgs.appendChild(c);
  requestAnimationFrame(function() { requestAnimationFrame(function() { c.classList.add('s-in'); }); });
}
function _agRenderGallery() {
  _agResetConvo();
  var msgs = document.getElementById('agentMsgs');
  var screen = document.getElementById('agent-screen');
  if (!msgs) return;
  if (screen) screen.classList.add('ag-convo');
  _homeAgentConvo = true;
  var spacer = msgs.querySelector('.ag-msgs-spacer');
  if (spacer) { spacer.style.flex = 'none'; spacer.style.height = '0'; }
  _agGalleryMode = true;

  var C = _AG_DATA.cards;
  var entries = [
    ['Balance',                    function(d) { _agRenderBalance(d, msgs, {}); }],
    ['Spending breakdown',         function(d) { _agRenderSpending(d, msgs); }],
    ['Upcoming bills',             function(d) { _agRenderBills(d, msgs); }],
    ['Forecast · metric + verdict',function(d) { _agRenderAfford(d, msgs, { amount: 1200 }); }],
    ['Reasoning list',             function(d) { _agRenderAffordWhy(d, msgs); }],
    ['Next-step options',          function(d) { _agFlow = { journey: 'vigilance', step: 'options', card: C[1] }; _agRenderFlagOptions(d, msgs); }],
    ['Vigilance · duplicate alert',function(d) { _agRenderFlaggedAlert(d, msgs, { card: C[1] }); }],
    ['Card · disambiguation',      function(d) { _agRenderCardDisambig(d, msgs, { card: C[0] }); }],
    ['Card · freeze confirm',      function(d) { _agRenderFreezeConfirm(d, msgs, { card: C[0] }); }],
    ['Card · frozen + alert toggle',function(d){ _agRenderFreezeDone(d, msgs, { card: C[0] }); }],
    ['Savings goal',               function(d) { _agRenderGoal(d, msgs, { target: 3000, weeks: 16, current: 0 }); }],
    ['Goal created · rule toggle',  function(d){ _agRenderGoalCreate(d, msgs, { target: 3000 }); }],
    ['Family · card overview',     function(d) { _agRenderFamily(d, msgs); }],
    ['Family · approve request',   function(d) { _agRenderFamilyApprove(d, msgs); }],
    ['Family · allowance confirm', function(d) { _agRenderFamilyAllowance(d, msgs); }],
    ['Payee · verification',       function(d) { _agRenderPayee(d, msgs); }],
    ['Reminder set',               function(d) { _agRenderRemind(d, msgs, { name: 'Rent', cond: "2 days before it's due" }); }],
  ];

  var i = 0;
  function next() {
    if (i >= entries.length) {
      _agGalleryMode = false; _agFlow = null;
      return;
    }
    var e = entries[i++];
    _agGalleryCaption(msgs, e[0]);
    var d = document.createElement('div');
    d.className = 'ag-msg-ai visible';
    msgs.appendChild(d);
    try { e[1](d); } catch (err) { /* keep the gallery going */ }
    setTimeout(next, 420);
  }
  next();
}

// Shared ref so the keyboard listener can cancel the FLIP cleanup timeout
var _flipCleanupTimer = null;

function openHomeAgent() {
  if (_homeAgentOpen) return;
  _homeAgentOpen = true;

  var home     = document.getElementById('home');
  var screen   = document.getElementById('agent-screen');
  var inputCard= document.getElementById('agentInputCard');
  var homeAiEl = document.querySelector('#home .home-ai');
  var nav      = document.getElementById('globalNav');
  var reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  screen.removeAttribute('aria-hidden');

  // ── Step 1: Measure BEFORE any class/style changes ────────────────────────
  // The home-ai is still at its lifted position. getBoundingClientRect() here
  // gives the correct visual origin for the FLIP animation.
  var startDelta = 0;
  var doFlip = !reduced && homeAiEl && inputCard;
  if (doFlip) {
    var homeRect   = homeAiEl.getBoundingClientRect();
    var screenRect = screen.getBoundingClientRect();
    var cardH      = inputCard.offsetHeight || 116;
    var cardNatTop = screenRect.height - 16 - cardH;
    startDelta = (homeRect.top - screenRect.top) - cardNatTop;

    // Pre-position the card at the home-ai's current visual location
    inputCard.style.transition = 'none';
    inputCard.style.transform  = 'translateY(' + startDelta + 'px)';
    inputCard.style.opacity    = '1';
    void inputCard.offsetHeight; // flush so the pre-position commits
  }

  // ── Step 2: Nav out ────────────────────────────────────────────────────────
  if (nav) {
    nav.style.transition = 'opacity 220ms ease, transform 280ms var(--ease-spring)';
    nav.style.opacity = '0'; nav.style.transform = 'translateY(10px)'; nav.style.pointerEvents = 'none';
  }

  // ── Step 3: Reveal agent screen (instant, solid bg — no bleed-through) ─────
  screen.style.transition = 'none';
  screen.style.opacity    = '1';
  screen.classList.add('ag-open');
  void screen.offsetHeight;
  screen.style.transition = '';

  // Bind the jump-to-latest scroll watcher once
  _agBindJump();

  // ── Step 4: NOW safe to remove the focus class (it's hidden under the screen)
  if (home) home.classList.remove('home-ai-focused');

  // ── Step 5: Spring the card to its natural resting position ───────────────
  if (doFlip) {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        inputCard.style.transition = 'transform 540ms var(--ease-spring), opacity 220ms var(--ease-out)';
        inputCard.style.transform  = 'translateY(0)';
        inputCard.style.opacity    = '1';
      });
    });

    // Clear inline overrides once the spring settles so CSS rule takes over.
    // Use a ref so the keyboard listener can cancel this if it fires before 680ms.
    if (_flipCleanupTimer) clearTimeout(_flipCleanupTimer);
    _flipCleanupTimer = setTimeout(function() {
      _flipCleanupTimer = null;
      inputCard.style.transition = '';
      inputCard.style.transform  = '';
      inputCard.style.opacity    = '';
    }, 680);
  }

  setTimeout(function() { var f = document.getElementById('agentField'); if (f) f.focus(); }, 500);
}

function closeHomeAgent() {
  var screen = document.getElementById('agent-screen');
  if (!_homeAgentOpen && (!screen || !screen.classList.contains('ag-open'))) return;
  _homeAgentOpen = false; _homeAgentConvo = false;
  var home = document.getElementById('home');
  if (home) home.classList.remove('home-ai-focused');
  screen.style.transition = 'opacity 220ms var(--ease-out)';
  screen.style.opacity    = '';
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
    setTimeout(function() {
      nav.style.transition = '';
      nav.style.opacity    = '';
      nav.style.transform  = '';
    }, 360);
  }
  _agResponseIdx = 0;
  _agFlow = null;
  agCloseUseCaseMenu();
  var _ucl = document.getElementById('agUseCaseLabel'); if (_ucl) _ucl.textContent = 'Use cases';
  document.querySelectorAll('#agUseCaseMenu .ag-usecase-item.active').forEach(function(it){ it.classList.remove('active'); });
  if (typeof showHome === 'function') showHome();
}

function agentOnInput(input) {
  const card = document.getElementById('agentInputCard');
  // Detect wrapping at the CURRENT width first. Once the text needs a second
  // line, commit to the multiline layout and keep it (sticky) until the field
  // is emptied — otherwise the layout would oscillate: going multiline widens
  // the textarea, the text fits on one line again, and it snaps back.
  input.style.height = '34px';
  if (card) {
    if (input.scrollHeight > 34) card.classList.add('is-multiline');
    else if (!input.value.trim()) card.classList.remove('is-multiline');
  }
  const multiline = !!(card && card.classList.contains('is-multiline'));
  // Re-measure height in the (now possibly full-width) layout so the textarea
  // isn't left taller than its content after the switch.
  input.style.height = '34px';
  const next = Math.min(input.scrollHeight, 132);
  input.style.height = next + 'px';
  agUpdateInputExtra();
  agSyncSend();
}

// Lift the suggestion chips so they clear the growing input.
// extra = textarea growth + (wrapped) button row + (attachments) their row.
function agUpdateInputExtra() {
  var screen = document.getElementById('agent-screen');
  var f = document.getElementById('agentField');
  var card = document.getElementById('agentInputCard');
  if (!screen || !f || !card) return;
  var next = parseInt(f.style.height, 10) || 34;
  var multiline = card.classList.contains('is-multiline');
  var attach = card.classList.contains('has-attach') ? 96 : 0;
  var extra = (next - 34) + (multiline ? 42 : 0) + attach;
  screen.style.setProperty('--ag-input-extra', extra + 'px');
}

// Send button is active when there's text OR at least one attachment.
function agSyncSend() {
  var send = document.getElementById('agentSend');
  var f = document.getElementById('agentField');
  var card = document.getElementById('agentInputCard');
  if (!send) return;
  var active = (f && f.value.trim().length > 0) || (card && card.classList.contains('has-attach'));
  if (active) { send.classList.add('active'); send.removeAttribute('aria-disabled'); }
  else { send.classList.remove('active'); send.setAttribute('aria-disabled', 'true'); }
}

// ── Attachments (uploaded image / file chips above the input) ──
// The "+" opens an iOS-style picker; chosen photos/files become chips.
function agAttachFiles() {
  var scrim = document.getElementById('agPickerScrim');
  var sheet = document.getElementById('agPickerSheet');
  if (!scrim || !sheet) return;
  // reset any prior selection
  sheet.querySelectorAll('.ag-picker-photo.sel, .ag-picker-file.sel').forEach(function(el) { el.classList.remove('sel'); });
  agPickerUpdateAdd();
  // wire selection toggles once
  if (!sheet._wired) {
    sheet._wired = true;
    sheet.querySelectorAll('.ag-picker-photo, .ag-picker-file').forEach(function(btn) {
      btn.addEventListener('click', function() { btn.classList.toggle('sel'); agPickerUpdateAdd(); });
    });
  }
  scrim.classList.add('show');
  requestAnimationFrame(function() { sheet.classList.add('show'); });
}
function agCloseAttachSheet() {
  var scrim = document.getElementById('agPickerScrim');
  var sheet = document.getElementById('agPickerSheet');
  if (sheet) sheet.classList.remove('show');
  if (scrim) scrim.classList.remove('show');
}
function agPickerUpdateAdd() {
  var sheet = document.getElementById('agPickerSheet');
  var addBtn = document.getElementById('agPickerAdd');
  if (!sheet || !addBtn) return;
  var n = sheet.querySelectorAll('.ag-picker-photo.sel, .ag-picker-file.sel').length;
  addBtn.disabled = n === 0;
  addBtn.textContent = n > 0 ? 'Add ' + n : 'Add';
}
function agConfirmAttach() {
  var sheet = document.getElementById('agPickerSheet');
  var card = document.getElementById('agentInputCard');
  var wrap = document.getElementById('agAttach');
  if (!sheet || !card || !wrap) return;
  sheet.querySelectorAll('.ag-picker-photo.sel').forEach(function(p) {
    wrap.appendChild(_agMakeAttachImage(p.getAttribute('data-src')));
  });
  sheet.querySelectorAll('.ag-picker-file.sel').forEach(function(f) {
    wrap.appendChild(_agMakeAttachFile(f.getAttribute('data-name'), 'PDF'));
  });
  if (wrap.children.length) card.classList.add('has-attach');
  agUpdateInputExtra();
  agSyncSend();
  agCloseAttachSheet();
}
function _agAttachRemoveBtn() {
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'ag-attach-x'; b.setAttribute('aria-label', 'Remove attachment');
  b.innerHTML = '<span class="ico ol" style="--ico:url(\'Icons/X.svg\');--sz:12px;color:rgba(0,0,0,0.55)" aria-hidden="true"></span>';
  b.addEventListener('click', function() {
    var item = b.closest('.ag-attach-item');
    var wrap = document.getElementById('agAttach');
    if (item) item.remove();
    if (wrap && wrap.children.length === 0) {
      var card = document.getElementById('agentInputCard');
      if (card) card.classList.remove('has-attach');
    }
    agUpdateInputExtra();
    agSyncSend();
  });
  return b;
}
function _agMakeAttachImage(src) {
  var d = document.createElement('div');
  d.className = 'ag-attach-item ag-attach-img';
  var img = document.createElement('img'); img.src = src; img.alt = 'Uploaded image';
  d.appendChild(img);
  d.appendChild(_agAttachRemoveBtn());
  return d;
}
function _agMakeAttachFile(name, badge) {
  var d = document.createElement('div');
  d.className = 'ag-attach-item ag-attach-file';
  d.innerHTML = '<span class="ag-attach-fname">' + _agEscape(name) + '</span>' +
    '<span class="ag-attach-badge">' + _agEscape(badge) + '</span>';
  d.appendChild(_agAttachRemoveBtn());
  return d;
}

// ── Voice dictation (ChatGPT-style) ──
// Tap the waveform → listen + live transcript; Stop drops it into the input.
var _agRec = null, _agVoiceFinal = '', _agVoiceSim = null;
function _agBuildWave() {
  var w = document.getElementById('agVoiceWave');
  if (!w) return;
  w.innerHTML = '';
  for (var i = 0; i < 34; i++) {
    var b = document.createElement('i');
    b.style.animationDuration = (620 + Math.floor(Math.random() * 620)) + 'ms';
    b.style.animationDelay = '-' + Math.floor(Math.random() * 800) + 'ms';
    w.appendChild(b);
  }
}
function agVoiceStart() {
  var card = document.getElementById('agentInputCard');
  var screen = document.getElementById('agent-screen');
  if (!card) return;
  _agVoiceFinal = '';
  card.classList.add('is-listening');
  if (screen) screen.classList.add('ag-listening'); // reveals the orb + veil
  _agBuildWave();
  haptic(8);
  _agEnterConvo();          // show the conversation so the live bubble is visible
  _agVoiceRender('', '');   // seed the live "Listening…" bubble in the message area

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    try {
      _agRec = new SR();
      _agRec.lang = 'en-US';
      _agRec.interimResults = true;
      _agRec.continuous = true;
      _agRec.onresult = function(e) {
        var interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var t = e.results[i][0].transcript;
          if (e.results[i].isFinal) _agVoiceFinal += t;
          else interim += t;
        }
        _agVoiceRender(_agVoiceFinal, interim);
      };
      _agRec.onerror = function() { _agVoiceSimulate(); };
      _agRec.start();
      return;
    } catch (e) { /* fall through to simulate */ }
  }
  // No speech recognition (or blocked) — simulate a live transcript so the
  // experience is still demonstrable in the prototype.
  _agVoiceSimulate();
}
// Ensure the conversation layout is active so the live bubble is visible
function _agEnterConvo() {
  if (_homeAgentConvo) return;
  var screen = document.getElementById('agent-screen');
  var msgs = document.getElementById('agentMsgs');
  var spacer = msgs && msgs.querySelector('.ag-msgs-spacer');
  if (spacer) {
    var h = spacer.offsetHeight;
    spacer.style.flex = 'none'; spacer.style.height = h + 'px';
    void spacer.offsetHeight;
    spacer.style.transition = 'height 520ms var(--ease-spring)';
    requestAnimationFrame(function() { spacer.style.height = '0'; });
  }
  _homeAgentConvo = true;
  if (screen) screen.classList.add('ag-convo');
}
// The live transcript shows as a forming user bubble in the message area
function _agVoiceLiveBubble() {
  var msgs = document.getElementById('agentMsgs');
  var wrap = document.getElementById('agVoiceLive');
  if (!wrap && msgs) {
    wrap = document.createElement('div');
    wrap.className = 'ag-msg-user visible ag-voice-live';
    wrap.id = 'agVoiceLive';
    wrap.innerHTML = '<div class="ag-msg-user-bubble"></div>';
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }
  return wrap ? wrap.querySelector('.ag-msg-user-bubble') : null;
}
function _agVoiceRender(finalT, interim) {
  var b = _agVoiceLiveBubble();
  if (!b) return;
  if (!finalT && !interim) b.innerHTML = '<span class="ag-voice-interim">Listening…</span>';
  else b.innerHTML = _agEscape(finalT) + (interim ? '<span class="ag-voice-interim">' + _agEscape(interim) + '</span>' : '');
  var msgs = document.getElementById('agentMsgs');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}
function _agVoiceSimulate() {
  var sample = "Can I afford a $1,200 flight next month without dipping into my savings?";
  var el = document.getElementById('agVoiceText');
  if (el) el.classList.remove('placeholder');
  var i = 0;
  clearInterval(_agVoiceSim);
  _agVoiceSim = setInterval(function() {
    if (i <= sample.length) {
      _agVoiceFinal = sample.slice(0, i);
      _agVoiceRender(_agVoiceFinal, '');
      i += 2;
    } else { clearInterval(_agVoiceSim); }
  }, 45);
}
function _agVoiceTeardown() {
  if (_agRec) { try { _agRec.stop(); } catch (e) {} _agRec = null; }
  clearInterval(_agVoiceSim); _agVoiceSim = null;
  var card = document.getElementById('agentInputCard');
  if (card) card.classList.remove('is-listening');
  var screen = document.getElementById('agent-screen');
  if (screen) screen.classList.remove('ag-listening');
  var live = document.getElementById('agVoiceLive');
  if (live) live.remove();
}
// Stop → the dictated text (already shown as the bubble) is sent
function agVoiceStop() {
  var text = (_agVoiceFinal || '').trim();
  _agVoiceTeardown();
  if (text) {
    var f = document.getElementById('agentField');
    if (f) { f.value = text; agentSend(); }
  }
}
function agVoiceCancel() {
  if (_agRec) { try { _agRec.abort(); } catch (e) {} _agRec = null; }
  _agVoiceFinal = '';
  _agVoiceTeardown();
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
  if (text === '__opencases__') { openSupportCases(); return; }
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

  // Capture BEFORE the state flip so we can distinguish first vs subsequent
  var isFirstMsg = !_homeAgentConvo;

  // Mute the jump-to-latest button up front — the view is about to animate to
  // the top and we don't want it to flash mid-transition.
  _agSuppressJump = true;
  var _jmp0 = document.getElementById('agentJump'); if (_jmp0) _jmp0.classList.remove('is-visible');

  // On first send: collapse the spacer so the user bubble sits at the top
  // of the visible area, matching the Claude.ai conversation layout
  if (isFirstMsg) {
    var spacer = msgs.querySelector('.ag-msgs-spacer');
    if (spacer) {
      var spH = spacer.offsetHeight;
      spacer.style.flex = 'none';
      spacer.style.height = spH + 'px';
      void spacer.offsetHeight; // force reflow before transition
      spacer.style.transition = 'height 520ms var(--ease-spring)';
      requestAnimationFrame(function() { spacer.style.height = '0'; });
    }
  }

  if (!_homeAgentConvo) {
    _homeAgentConvo = true;
    screen.classList.add('ag-convo');
  }

  // Route first — no rendering yet
  const scenario = _agRouteQuery(text);

  // Release any height previously reserved under the last answer, so older
  // exchanges collapse to their natural spacing before the new one is added.
  msgs.querySelectorAll('.ag-msg-ai').forEach(function(el) { el.style.minHeight = ''; });

  // User bubble
  const userDiv = document.createElement('div');
  userDiv.className = 'ag-msg-user';
  userDiv.innerHTML = '<div class="ag-msg-user-bubble">' + _agEscape(text) + '</div>';
  msgs.appendChild(userDiv);
  requestAnimationFrame(function() { requestAnimationFrame(function() { userDiv.classList.add('visible'); }); });

  f.value = ''; f.style.height = '34px';
  const inputCard = document.getElementById('agentInputCard');
  if (inputCard) inputCard.classList.remove('is-multiline', 'has-attach', 'is-listening');
  if (typeof _agVoiceTeardown === 'function') _agVoiceTeardown();
  const attachWrap = document.getElementById('agAttach');
  if (attachWrap) attachWrap.innerHTML = '';
  if (screen) screen.style.setProperty('--ag-input-extra', '0px');
  const sendBtn = document.getElementById('agentSend');
  if (sendBtn) { sendBtn.classList.remove('active'); sendBtn.setAttribute('aria-disabled', 'true'); }
  // First message: sit at top (spacer is collapsing). Subsequent: scroll to show new bubble.
  if (isFirstMsg) { msgs.scrollTop = 0; } else { msgs.scrollTop = msgs.scrollHeight; }

  // AI message container
  const aiDiv = document.createElement('div');
  aiDiv.className = 'ag-msg-ai';
  aiDiv.innerHTML =
    '<div class="ag-msg-ai-label">' +
      '<span class="ag-msg-ai-leaf"><svg viewBox="0 0 24 24" width="14" height="14" fill="#46882B" aria-hidden="true"><path d="M6.05 8.05c-2.73 2.73-2.73 7.17-.02 9.9 1.47-3.4 4.09-6.24 7.36-7.93-2.77 2.34-4.71 5.61-5.39 9.32 2.6 1.23 5.8.78 7.95-1.37C19.43 14.47 20 4 20 4S9.53 4.57 6.05 8.05z"/></svg></span>' +
      '<span class="ag-msg-ai-name">Banyan AI</span>' +
    '</div>';
  msgs.appendChild(aiDiv);
  // Reserve enough height under the new answer so the new question can always
  // scroll up and stick to the top (ChatGPT-style), even for short replies.
  if (!isFirstMsg) {
    aiDiv.style.minHeight = Math.max(0, msgs.clientHeight - userDiv.offsetHeight - 112) + 'px';
  }
  setTimeout(function() {
    requestAnimationFrame(function() {
      aiDiv.classList.add('visible');
      // Stick the new exchange to the top: the user's question anchors near the
      // header, the answer streams below it — smooth-scrolled, not a jump.
      var target = isFirstMsg ? 0 : (userDiv.offsetTop - 8);
      // Mute the jump-to-latest button while the view animates to the top
      _agSuppressJump = true;
      var jmp = document.getElementById('agentJump'); if (jmp) jmp.classList.remove('is-visible');
      _agSmoothScrollTo(msgs, target, 680, function() {
        _agSuppressJump = false; _agUpdateJump();
      });
    });
  }, 50);

  // Remember the reasoning steps so they can be reviewed after the answer
  aiDiv._agThinkSteps = (scenario.steps || []).map(function(s) { return s.label; });

  // Thinking steps → answer handoff
  setTimeout(function() {
    var runRender = function() {
      // Bring in the "Banyan AI" header now that loading/thinking is done
      var _lbl = aiDiv.querySelector('.ag-msg-ai-label');
      if (_lbl && !_agGalleryMode) {
        _lbl.classList.add('show');
        requestAnimationFrame(function() { requestAnimationFrame(function() { _lbl.classList.add('in'); }); });
      }
      if      (scenario.type === 'transfer')        { _agRenderTransfer(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'fx_rate')         { _agRenderFXRate(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'balance')         { _agRenderBalance(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'upcoming')        { _agRenderUpcoming(aiDiv, msgs); }
      else if (scenario.type === 'spending')        { _agRenderSpending(aiDiv, msgs); }
      else if (scenario.type === 'recipients')      { _agRenderRecipientSelect(aiDiv, msgs); }
      else if (scenario.type === 'bill')            { _agRenderBillStatus(aiDiv, msgs); }
      else if (scenario.type === 'freeze_disambig') { _agRenderCardDisambig(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'freeze_confirm')  { _agRenderFreezeConfirm(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'freeze_done')     { _agRenderFreezeDone(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'vigilance')       { _agRenderFlaggedAlert(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'flag_reason')     { _agRenderFlagReason(aiDiv, msgs); }
      else if (scenario.type === 'flag_options')    { _agRenderFlagOptions(aiDiv, msgs); }
      else if (scenario.type === 'flag_dispute')    { _agRenderDisputeStarted(aiDiv, msgs); }
      else if (scenario.type === 'flag_wait')       { _agRenderWaitAdvice(aiDiv, msgs); }
      else if (scenario.type === 'bills')           { _agRenderBills(aiDiv, msgs); }
      else if (scenario.type === 'bills_unusual')   { _agRenderBillsUnusual(aiDiv, msgs); }
      else if (scenario.type === 'bills_cover')     { _agRenderBillsCover(aiDiv, msgs); }
      else if (scenario.type === 'remind')          { _agRenderRemind(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'afford')          { _agRenderAfford(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'afford_why')      { _agRenderAffordWhy(aiDiv, msgs); }
      else if (scenario.type === 'afford_cancel')   { _agRenderAffordCancel(aiDiv, msgs); }
      else if (scenario.type === 'afford_rec')      { _agRenderAffordRec(aiDiv, msgs); }
      else if (scenario.type === 'goal')            { _agRenderGoal(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'goal_deposit')    { _agRenderGoalDeposit(aiDiv, msgs); }
      else if (scenario.type === 'goal_adaptive')   { _agRenderGoalAdaptive(aiDiv, msgs); }
      else if (scenario.type === 'goal_create')     { _agRenderGoalCreate(aiDiv, msgs, scenario.data); }
      else if (scenario.type === 'family')          { _agRenderFamily(aiDiv, msgs); }
      else if (scenario.type === 'family_spend')    { _agRenderFamilySpend(aiDiv, msgs); }
      else if (scenario.type === 'family_approve')  { _agRenderFamilyApprove(aiDiv, msgs); }
      else if (scenario.type === 'family_decline')  { _agRenderFamilyDecline(aiDiv, msgs); }
      else if (scenario.type === 'family_allowance'){ _agRenderFamilyAllowance(aiDiv, msgs); }
      else if (scenario.type === 'payee')           { _agRenderPayee(aiDiv, msgs); }
      else if (scenario.type === 'payee_confidence'){ _agRenderPayeeConfidence(aiDiv, msgs); }
      else if (scenario.type === 'payee_verify')    { _agRenderPayeeVerify(aiDiv, msgs); }
      else if (scenario.type === 'support_escalate') { _agRenderSupportEscalate(aiDiv, msgs); }
      else { _agRenderText(aiDiv, msgs, scenario.responseText); }
      _agAppendFooter(aiDiv);   // copy / thumbs / flag bar on every reply
      _agResponseIdx++;
    };
    // Show the thinking animation on every conversation. Quick turns get a
    // shorter think; richer flows keep the full ~10s reasoning.
    var _steps = (scenario.steps && scenario.steps.length) ? scenario.steps : _AG_DEFAULT_STEPS;
    _agRunSteps(aiDiv, _steps, msgs, runRender, scenario.fast ? 2600 : 10000);
  }, 90);

  setTimeout(function() { f.focus(); }, 130);
}

function _agEscape(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ── AI Agent ───────────────────────────────────────── */
let _agentOpen = false;

// ── Contact support screen ──
function openSupport() {
  haptic(8);
  var s = document.getElementById('support-screen');
  if (!s) return;
  s.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(function() { s.classList.add('on'); });
}
function closeSupport() {
  var s = document.getElementById('support-screen');
  if (!s) return;
  s.classList.remove('on');
  s.setAttribute('aria-hidden', 'true');
}
function openSupportChat() {
  closeSupport();
  setTimeout(function() {
    if (typeof openHomeAgent === 'function') openHomeAgent();
    else if (typeof openAgent === 'function') openAgent();
    var f = document.getElementById('agentField');
    if (f) setTimeout(function() { f.focus(); }, 300);
  }, 260);
}

function openAgent() {
  haptic(8);
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
  scheduled:          { label:'Upcoming',              badge:'b-green', hdr:'dh-green',   desc:null,                                                                           cta:'Reschedule',      ctaType:'primary', icon:'calendar' },
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
  const list = document.getElementById('txList');
  list.innerHTML = '';
  if (tab === 'analysis') {
    const empty = document.createElement('div');
    empty.className = 'tx-analysis-empty';
    empty.innerHTML =
      '<div class="tx-an-icon"><span class="ico ol" style="--ico:url(\'Icons/ChartBar.svg\');--sz:28px;color:var(--brand-primary)"></span></div>' +
      '<div class="tx-an-title">Spending insights</div>' +
      '<div class="tx-an-sub">A breakdown of where your money went is on the way.</div>';
    list.appendChild(empty);
    return;
  }
  const rawData = tab === 'recent' ? RECENT : SCHEDULED;
  const data = tab === 'recent' ? applyFilters(rawData) : rawData;

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
      <span class="new-tx-bar-text">${newCount} new transactions since last login</span>
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
var _txLoading = false, _txLoadTimer = null;
function showList() {
  _navStack.push(_activeScreen());
  ['home','explore','accounts','account-detail','cards'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.className = 'screen hl';
  });
  document.getElementById('list').className    = 'screen on';
  setSbLight(false);
  showNav(false);
  if (typeof _TW !== 'undefined') _TW.start();
  startTxLoading();
}

/* Skeleton loading — transactions stream in over 10s, then the real list renders */
function startTxLoading() {
  if (_txLoadTimer) clearTimeout(_txLoadTimer);
  _txLoading = true;
  renderTxSkeleton();
  _txLoadTimer = setTimeout(function() {
    _txLoading = false;
    renderList(activeTab);
    var list = document.getElementById('txList');
    if (list) list.classList.add('tx-revealed');
  }, 10000);
}
function renderTxSkeleton() {
  var list = document.getElementById('txList');
  if (!list) return;
  list.classList.remove('tx-revealed');
  var groups = [{ d: true, rows: 3 }, { d: true, rows: 2 }, { d: true, rows: 3 }];
  var h = '<div class="tx-skel">';
  groups.forEach(function(g) {
    h += '<div class="tx-skel-date"></div>';
    for (var i = 0; i < g.rows; i++) {
      h += '<div class="tx-skel-row">' +
             '<div class="tx-skel-av"></div>' +
             '<div class="tx-skel-lines"><div class="tx-skel-l1"></div><div class="tx-skel-l2"></div></div>' +
             '<div class="tx-skel-amt"></div>' +
           '</div>';
    }
  });
  h += '</div>';
  list.innerHTML = h;
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
    .replace('<svg', '<svg style="width:12px;height:12px;fill:rgba(0,0,0,0.4);color:rgba(0,0,0,0.4)"');
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
    opt.textContent = t === 'scheduled' ? 'Upcoming' : (t.charAt(0).toUpperCase() + t.slice(1));
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
      pill.innerHTML = newTxns.length + ' new transaction' + (newTxns.length !== 1 ? 's' : '') + ' since last login'
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
  { hi: 'Hello, Satya', ask: 'What brings you\nto Banyan today?' },
];
let _greetingIdx = parseInt(localStorage.getItem('_greetingIdx') || '0', 10);
let _greetingSet = false;

function showHome() {
  haptic(8);
  document.getElementById('explore').className  = 'screen hb';
  document.getElementById('accounts').className = 'screen hb';
  document.getElementById('list').className     = 'screen hr';
  document.getElementById('home').className     = 'screen on';
  document.querySelector('#home .home-scroll').scrollTop = 0;
  var _hhw = document.getElementById('homeHeroBgWrap'); if (_hhw) _hhw.style.transform = 'translateY(0) scale(1.35)';
  var _hhx = document.getElementById('homeHeroFixed'); if (_hhx) { _hhx.style.transform = 'translateY(0)'; _hhx.style.height = '583px'; _hhx.style.setProperty('--bp', '0'); }
  var _hbs = document.getElementById('homeHeroBlurScroll'); if (_hbs) _hbs.style.opacity = '0';
  var _hai = document.querySelector('#home .home-ai'); if (_hai) _hai.style.setProperty('--ai-bg-op', '0.60');
  var _hgh = document.getElementById('homeGreetingHalo'); if (_hgh) _hgh.style.opacity = '1';
  var _hnt = document.getElementById('homeNotif');
  if (_hnt) {
    _hnt.classList.remove('expanded');
    var _hntb = document.getElementById('homeNotifToggle');
    if (_hntb) { _hntb.setAttribute('aria-expanded', 'false'); var _l = _hntb.querySelector('.home-notif-toggle-label'); if (_l) _l.textContent = 'Show all 3'; }
    if (typeof layoutHomeNotifDeck === 'function') setTimeout(layoutHomeNotifDeck, 0);
  }
  document.querySelector('#home .home-scroll').classList.remove('home-fade-top');
  setSbLight(true); // white status-bar text over the hero photo
  showNav(true);
  showNavAi(false, true); // orb hidden at home top; scroll reveals it
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
  haptic(8);
  document.getElementById('list').className     = 'screen hr';
  document.getElementById('home').className     = 'screen hb';
  document.getElementById('accounts').className = 'screen hb';
  document.getElementById('explore').className  = 'screen on';
  setSbLight(false);
  showNav(true);
  showNavAi(true, true); // slot at final width first → setNavActive reads correct offsets
  setNavActive(3);
  _smOrigin = 'explore';
}

/* ── Send Money flow ─────────────────────────────────── */
const SM_SCREENS = ['sm-landing','sm-amount','sm-review','sm-progress','sm-success'];
const SM_EXRATE  = 91.78;
let smCents = 0; // starts at $0
let smCurrencyFlipped = false;
let smInrPaise = 0;

// Dollar-first input state
let smDollarInt = 0;   // whole dollars typed
let smCentStr   = '';  // 0-2 cent digit chars
let smInCents   = false; // has user pressed '.'?
let smIntStr    = '';  // USD integer digits as typed (source of truth for caret editing)
let smCaretIdx  = 0;   // caret position within smIntStr (0..len)
let smInrStr    = '';  // INR integer digits as typed (when TO is the active input)
let smInrCaretIdx = 0; // caret position within smInrStr (0..len)
let smInrRupeeInt = 0;
let smInrPaisaStr = '';
let smInrInCents  = false;
// Which digit (if any) was just typed, so only that one plays the pop-in.
// { field: 'usdInt'|'usdDec'|'inrInt'|'inrDec', idx } or null.
let _smAnim = null;

var _smUSMode = false;
let smRecipient = {
  name:'Rohan Rathod', initials:'RR',
  bg:'linear-gradient(135deg,#46882b,#2d5a16)', account:'••7654 · HDFC Bank'
};

function showAccounts() {
  haptic(8);
  document.getElementById('home').className     = 'screen hb';
  document.getElementById('explore').className  = 'screen hb';
  document.getElementById('list').className     = 'screen hr';
  document.getElementById('accounts').className = 'screen on';
  document.querySelector('#accounts .acct-scroll').scrollTop = 0;
  setSbLight(false);
  showNav(true);
  showNavAi(true, true); // slot at final width first → setNavActive reads correct offsets
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
  [['recent','Recent'],['recurring','Upcoming']].forEach(([t,lbl]) => {
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

// Space switcher (Figma 3213-46823): expandable tabs — the tapped space
// expands to show its label, the others collapse to icon-only.
function crSelectSpace(btn) {
  haptic(8);
  var pill = document.getElementById('crSpacesPill');
  if (!pill) return;
  pill.querySelectorAll('.cr-space').forEach(function(b) {
    var on = b === btn;
    b.classList.toggle('cr-space-sel', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function showCards(filter) {
  _cardsFilter = filter || 'all';
  _cardsOrigin = _activeScreen();

  updateCardsFilter(_cardsFilter);
  _embTab['crTxSection'] = 'recent';

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

  _crPlayEntry(cardsEl);
}

/* Entry sequence: the primary card flips in at screen centre, holds a beat,
   glides into its carousel slot, then the rest of the page fades up. */
var _crLoadTimer = null;
var _crRevealTimer = null;

function _crPlayEntry(cardsEl) {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Real content renders immediately — it's just hidden during the intro
  renderCrTxSection();

  // Clean up any in-flight intro from a previous entry
  clearTimeout(_crLoadTimer);
  clearTimeout(_crRevealTimer);
  cardsEl.classList.remove('cr-intro', 'cr-reveal');
  var prev = cardsEl.querySelector('.cr-flip-hero');
  if (prev) prev.classList.remove('cr-flip-hero');

  if (reduce) return;

  var item = cardsEl.querySelector('.cr-carousel-item');
  if (!item) return;

  // Measure how far the card's slot is from the screen centre,
  // so the flip can start there and settle home
  var r = item.getBoundingClientRect();
  var f = cardsEl.getBoundingClientRect();
  var dx = (f.left + f.width / 2) - (r.left + r.width / 2);
  var dy = (f.top + f.height / 2) - (r.top + r.height / 2);
  item.style.setProperty('--cr-dx', dx.toFixed(1) + 'px');
  item.style.setProperty('--cr-dy', dy.toFixed(1) + 'px');

  cardsEl.classList.add('cr-intro');
  void item.offsetWidth;
  item.classList.add('cr-flip-hero');

  _crLoadTimer = setTimeout(function () {
    cardsEl.classList.remove('cr-intro');
    cardsEl.classList.add('cr-reveal');

    // Spend amount rolls up to its value as it appears
    var intEl = document.getElementById('crSpendInt');
    if (intEl) {
      var target = parseFloat(intEl.textContent.replace(/,/g, ''));
      if (target > 0) _crCountUp(intEl, target, 900);
    }

    // Keep .cr-flip-hero on the settled card through the reveal — removing it
    // now would make it match the reveal selector and re-fade (visible flicker)
    _crRevealTimer = setTimeout(function () {
      cardsEl.classList.remove('cr-reveal');
      item.classList.remove('cr-flip-hero');
      item.style.removeProperty('--cr-dx');
      item.style.removeProperty('--cr-dy');
    }, 950);
  }, 3400);
}

function _crCountUp(el, target, dur) {
  var start = null;
  function tick(ts) {
    if (start === null) start = ts;
    var p = Math.min((ts - start) / dur, 1);
    var eased = 1 - Math.pow(1 - p, 4); // ease-out-quart
    el.textContent = Math.round(target * eased).toLocaleString('en-US');
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
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

/* ── Create card journey ────────────────────────── */

var _ctplStep = 1; // 1 = picker, 2 = setup
var _ctplSelected = null;
var _ctplAcctId = 'usd';

var _CTPL_ACCTS = [
  { id: 'usd',      label: 'USD Checking',    sub: '·· 7654',  img: 'assets/space-usd-checking.webp' },
  { id: 'thailand', label: 'Thailand holiday', sub: 'Space',    img: 'assets/space-thailand.webp' },
  { id: 'moms',     label: "Mom's expenses",   sub: 'Space',    img: 'assets/space-moms.webp' },
  { id: 'wedding',  label: 'Wedding',          sub: 'Space',    img: 'assets/space-wedding.webp' },
];

function openCtplAcctPicker() {
  var list = document.getElementById('ctplAcctList');
  list.innerHTML = _CTPL_ACCTS.map(function(a) {
    return '<div class="ctpl-acct-opt' + (a.id === _ctplAcctId ? ' selected' : '') + '" onclick="selectCtplAcct(\'' + a.id + '\')">' +
      '<img src="' + a.img + '" class="ctpl-acct-opt-img" alt="">' +
      '<div class="ctpl-acct-opt-text">' +
        '<div class="ctpl-acct-opt-name">' + a.label + '</div>' +
        '<div class="ctpl-acct-opt-sub">' + a.sub + '</div>' +
      '</div>' +
      '<div class="ctpl-acct-opt-check"><svg viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '</div>';
  }).join('');
  document.getElementById('ctplAcctOverlay').classList.add('open');
  document.getElementById('ctplAcctSheet').classList.add('open');
}

function closeCtplAcctPicker() {
  document.getElementById('ctplAcctOverlay').classList.remove('open');
  document.getElementById('ctplAcctSheet').classList.remove('open');
}

function selectCtplAcct(id) {
  _ctplAcctId = id;
  var acct = _CTPL_ACCTS.find(function(a) { return a.id === id; });
  if (!acct) return;
  document.getElementById('ctplAcctIcon').src = acct.img;
  var sub = acct.sub && acct.sub !== 'Space' ? ' ' + acct.sub : '';
  document.getElementById('ctplAcctLabel').textContent = acct.label + sub;
  closeCtplAcctPicker();
}

var _ctplMerchantId   = null;
var _ctplMerchantName = '';

var _CTPL_MERCHANTS = [
  { id: 'amazon',    name: 'Amazon',      color: '#FF9900', abbr: 'Am' },
  { id: 'netflix',   name: 'Netflix',     color: '#E50914', abbr: 'Nf' },
  { id: 'spotify',   name: 'Spotify',     color: '#1DB954', abbr: 'Sp' },
  { id: 'apple',     name: 'Apple',       color: '#555555', abbr: 'Ap' },
  { id: 'google',    name: 'Google',      color: '#4285F4', abbr: 'Go' },
  { id: 'uber',      name: 'Uber',        color: '#000000', abbr: 'Ub' },
  { id: 'doordash',  name: 'DoorDash',    color: '#FF3008', abbr: 'DD' },
  { id: 'airbnb',    name: 'Airbnb',      color: '#FF5A5F', abbr: 'Ab' },
  { id: 'costco',    name: 'Costco',      color: '#005DAA', abbr: 'Co' },
  { id: 'walmart',   name: 'Walmart',     color: '#0071CE', abbr: 'Wm' },
  { id: 'target',    name: 'Target',      color: '#CC0000', abbr: 'Tg' },
  { id: 'instacart', name: 'Instacart',   color: '#43B02A', abbr: 'Ic' },
  { id: 'microsoft', name: 'Microsoft',   color: '#00A4EF', abbr: 'Ms' },
  { id: 'adobe',     name: 'Adobe',       color: '#FF0000', abbr: 'Ad' },
  { id: 'hulu',      name: 'Hulu',        color: '#1CE783', abbr: 'Hu' },
];

function _ctplMerchantAvatarHtml(m, sizeCls) {
  return '<div class="' + sizeCls + '" style="background:' + m.color + '">' + m.abbr + '</div>';
}

function _renderMerchantList(filter) {
  var q = (filter || '').toLowerCase().trim();
  var items = q ? _CTPL_MERCHANTS.filter(function(m) {
    return m.name.toLowerCase().indexOf(q) !== -1;
  }) : _CTPL_MERCHANTS;

  var list = document.getElementById('ctplMerchantList');
  list.innerHTML = items.map(function(m) {
    var sel = m.id === _ctplMerchantId;
    return '<div class="ctpl-acct-opt' + (sel ? ' selected' : '') + '" onclick="selectCtplMerchant(\'' + m.id + '\')">' +
      _ctplMerchantAvatarHtml(m, 'ctpl-merchant-avatar-lg') +
      '<div class="ctpl-acct-opt-text">' +
        '<div class="ctpl-acct-opt-name">' + m.name + '</div>' +
      '</div>' +
      '<div class="ctpl-acct-opt-check"><svg viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '</div>';
  }).join('');

  // Show custom option when query doesn't exactly match a known merchant
  var exactMatch = q && _CTPL_MERCHANTS.some(function(m) {
    return m.name.toLowerCase() === q;
  });
  var customWrap = document.getElementById('ctplMerchantCustom');
  if (q && !exactMatch) {
    var label = filter.trim();
    var abbr  = label.slice(0, 2).toUpperCase();
    var hue   = label.split('').reduce(function(a, c) { return a + c.charCodeAt(0); }, 0) % 360;
    var color = 'hsl(' + hue + ',55%,42%)';
    document.getElementById('ctplMerchantCustomAvatar').textContent = abbr;
    document.getElementById('ctplMerchantCustomAvatar').style.background = color;
    document.getElementById('ctplMerchantCustomName').textContent = label;
    customWrap.style.display = '';
  } else {
    customWrap.style.display = 'none';
  }
}

function openCtplMerchantPicker() {
  document.getElementById('ctplMerchantSearch').value = '';
  _renderMerchantList('');
  document.getElementById('ctplMerchantOverlay').classList.add('open');
  document.getElementById('ctplMerchantSheet').classList.add('open');
  setTimeout(function() {
    document.getElementById('ctplMerchantSearch').focus();
  }, 280);
}

function closeCtplMerchantPicker() {
  document.getElementById('ctplMerchantOverlay').classList.remove('open');
  document.getElementById('ctplMerchantSheet').classList.remove('open');
}

function filterCtplMerchants(val) {
  _renderMerchantList(val);
}

function _applyMerchantToRow(name, abbr, color) {
  _ctplMerchantName = name;
  var avatarEl = document.getElementById('ctplMerchantAvatar');
  if (avatarEl) {
    avatarEl.textContent = abbr;
    avatarEl.style.background = color;
  }
  var labelEl = document.getElementById('ctplMerchantLabel');
  if (labelEl) labelEl.textContent = name;
}

function selectCtplMerchant(id) {
  var m = _CTPL_MERCHANTS.find(function(x) { return x.id === id; });
  if (!m) return;
  _ctplMerchantId = id;
  _applyMerchantToRow(m.name, m.abbr, m.color);
  closeCtplMerchantPicker();
}

function selectCtplMerchantCustom() {
  var label = document.getElementById('ctplMerchantSearch').value.trim();
  if (!label) return;
  _ctplMerchantId = null;
  var abbr  = label.slice(0, 2).toUpperCase();
  var hue   = label.split('').reduce(function(a, c) { return a + c.charCodeAt(0); }, 0) % 360;
  var color = 'hsl(' + hue + ',55%,42%)';
  _applyMerchantToRow(label, abbr, color);
  closeCtplMerchantPicker();
}

/* ── Limit type picker ── */
var _CTPL_LIMIT_TYPES = ['Monthly', 'All time', 'Per transaction', 'One time'];
var _ctplLimitType = 'Monthly';

function openCtplLimitPicker() {
  var list = document.getElementById('ctplLimitList');
  list.innerHTML = _CTPL_LIMIT_TYPES.map(function(t) {
    var sel = t === _ctplLimitType;
    return '<div class="ctpl-acct-opt' + (sel ? ' selected' : '') + '" onclick="selectCtplLimitType(\'' + t.replace(/'/g, "\\'") + '\')">' +
      '<div class="ctpl-acct-opt-text"><div class="ctpl-acct-opt-name">' + t + '</div></div>' +
      '<div class="ctpl-acct-opt-check"><svg viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '</div>';
  }).join('');
  document.getElementById('ctplLimitOverlay').classList.add('open');
  document.getElementById('ctplLimitSheet').classList.add('open');
}

function closeCtplLimitPicker() {
  document.getElementById('ctplLimitOverlay').classList.remove('open');
  document.getElementById('ctplLimitSheet').classList.remove('open');
}

function selectCtplLimitType(type) {
  _ctplLimitType = type;
  var el = document.getElementById('ctplLimitTypeVal');
  if (el) el.textContent = type;
  closeCtplLimitPicker();
}

/* ── Manual controls toggle ── */
function ctplToggleManual() {
  var body  = document.getElementById('ctplManualBody');
  var caret = document.getElementById('ctplManualCaret');
  if (!body) return;
  body.classList.toggle('open');
  if (caret) caret.classList.toggle('open');
}

/* ── "Set up other controls" — editable advanced rules ── */
var _CTPL_TXNS_OPTS = ['Unlimited', '1', '3', '6', '12'];
var _CTPL_BLOCKED_CATS = ['Gambling', 'Crypto', 'Adult content', 'Cash withdrawals', 'Foreign merchants'];
var _ctplTxns = 'Unlimited';
var _ctplBlocked = [];

function _ctplTxnsLabel(v) {
  if (v == null || v === 'Unlimited') return 'Unlimited';
  return v + (v === '1' ? ' payment' : ' payments');
}
function _ctplBlockedLabel() {
  if (!_ctplBlocked.length) return 'None';
  if (_ctplBlocked.length === 1) return _ctplBlocked[0];
  return _ctplBlocked.length + ' blocked';
}
// Renders the row values + the collapsed subtext preview (rules not shown upfront)
function _ctplRenderOtherControls() {
  var t = document.getElementById('ctplTxns'); if (t) t.textContent = _ctplTxnsLabel(_ctplTxns);
  var b = document.getElementById('ctplBlocked'); if (b) b.textContent = _ctplBlockedLabel();
  var n = _ctplBlocked.length;
  var blockedSummary = n ? (n + ' blocked categor' + (n === 1 ? 'y' : 'ies')) : 'No blocked categories';
  var sub = document.getElementById('ctplAiSub');
  if (sub) sub.textContent = _ctplTxnsLabel(_ctplTxns) + ' • ' + blockedSummary;
}

function closeCtplCtrlPicker() {
  document.getElementById('ctplCtrlOverlay').classList.remove('open');
  document.getElementById('ctplCtrlSheet').classList.remove('open');
}
function _ctplOpenCtrl(title, html) {
  document.getElementById('ctplCtrlTitle').textContent = title;
  document.getElementById('ctplCtrlList').innerHTML = html;
  document.getElementById('ctplCtrlOverlay').classList.add('open');
  document.getElementById('ctplCtrlSheet').classList.add('open');
}
function _ctplOptRow(label, selected, onclick) {
  return '<div class="ctpl-acct-opt' + (selected ? ' selected' : '') + '" onclick="' + onclick + '">' +
    '<div class="ctpl-acct-opt-text"><div class="ctpl-acct-opt-name">' + label + '</div></div>' +
    '<div class="ctpl-acct-opt-check"><svg viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
  '</div>';
}
function openCtplTxnsPicker() {
  _ctplOpenCtrl('Number of payments', _CTPL_TXNS_OPTS.map(function(v) {
    return _ctplOptRow(_ctplTxnsLabel(v), v === _ctplTxns, "selectCtplTxns('" + v + "')");
  }).join(''));
}
function selectCtplTxns(v) { _ctplTxns = v; _ctplRenderOtherControls(); closeCtplCtrlPicker(); }
function openCtplBlockedPicker() {
  _ctplOpenCtrl('Blocked categories', _CTPL_BLOCKED_CATS.map(function(c) {
    return _ctplOptRow(c, _ctplBlocked.indexOf(c) !== -1, "toggleCtplBlocked('" + c.replace(/'/g, "\\'") + "')");
  }).join(''));
}
function toggleCtplBlocked(cat) {
  var i = _ctplBlocked.indexOf(cat);
  if (i === -1) _ctplBlocked.push(cat); else _ctplBlocked.splice(i, 1);
  _ctplRenderOtherControls();
  openCtplBlockedPicker(); // re-render to reflect multi-select state
}

// Per-template prefill — sourced from the virtual-card spec table.
// txns: 'unlimited' | number · expiryDays: 0 = none · online/contactless: per-txn $ cap (0 = off)
var CTPL_CONFIG = {
  subscriptions: {
    name: 'Subscriptions',
    subtext: 'Set a monthly cap and cancel without affecting your other cards.',
    nickname: 'Monthly subscriptions',
    amount: 100, limitType: 'Monthly',
    txns: 'unlimited', expiryDays: 0, intl: true, online: 100, contactless: 0, blocked: null,
    tint: 'rgba(222,185,150,0.35)',
    features: ['Monthly cap', 'Separate card for recurring charges', 'Easy to freeze or close']
  },
  merchant: {
    name: 'Merchant',
    subtext: 'Keep spending with one merchant separate, controlled, and easy to freeze.',
    nickname: '',
    amount: 250, limitType: 'Monthly',
    txns: 'unlimited', expiryDays: 0, intl: false, online: 250, contactless: 250, blocked: null,
    tint: 'rgba(150,222,220,0.35)',
    features: ['Merchant-focused spending', 'Monthly limit', 'Freeze independently']
  },
  trial: {
    name: 'Trial',
    subtext: 'Protect yourself with a low-limit card for signups and unfamiliar checkouts.',
    nickname: 'Trial / One-time',
    amount: 20, limitType: 'All time',
    txns: 1, expiryDays: 30, intl: true, online: 20, contactless: 0, blocked: null,
    tint: 'rgba(150,222,221,0.35)',
    features: ['Low-limit protection', 'Safer online checkout', 'Close anytime']
  },
  event: {
    name: 'Event',
    subtext: 'Give a temporary budget its own card so event costs stay under control.',
    nickname: '',
    amount: 500, limitType: 'All time',
    txns: 'unlimited', expiryDays: 90, intl: true, online: 500, contactless: 500, blocked: null,
    tint: 'rgba(222,221,150,0.35)',
    features: ['Event budget', 'Temporary spending control', 'Close after use']
  },
  household: {
    name: 'Household',
    subtext: 'Make shared spending simpler while keeping limits and visibility in your hands.',
    nickname: 'Household',
    amount: 500, limitType: 'Monthly',
    txns: 'unlimited', expiryDays: 0, intl: true, online: 500, contactless: 500, blocked: null,
    tint: 'rgba(204,150,222,0.35)',
    features: ['Shared spending', 'Monthly limit', 'Owner visibility']
  },
  travel: {
    name: 'Travel',
    subtext: 'Keep trip spending contained without mixing it into everyday expenses.',
    nickname: '',
    amount: 500, limitType: 'All time',
    txns: 'unlimited', expiryDays: 90, intl: true, online: 500, contactless: 500, blocked: null,
    tint: 'rgba(150,190,222,0.35)',
    features: ['Trip budget', 'Separate travel spending', 'Freeze after trip']
  },
  onetimebuy: {
    name: 'One-time buy',
    subtext: 'Put a cap on a single purchase and close the card when you\'re done.',
    nickname: 'Trial / One-time',
    amount: 20, limitType: 'All time',
    txns: 1, expiryDays: 30, intl: true, online: 20, contactless: 0, blocked: null,
    tint: 'rgba(186,222,150,0.35)',
    features: ['All-time cap', 'Safer checkout', 'Close after use']
  },
  childteen: {
    name: 'Child / Teen',
    subtext: 'Give supervised spending access with clear limits and safer boundaries.',
    nickname: '',
    amount: 50, limitType: 'Monthly',
    txns: 'unlimited', expiryDays: 0, intl: false, online: 50, contactless: 50,
    blocked: ['Gambling', 'Alcohol', 'Adult content', 'Crypto'],
    tint: 'rgba(222,150,171,0.35)',
    features: ['Allowance limit', 'Parent controls', 'Spend alerts']
  },
  custom: {
    name: 'Custom',
    subtext: 'Start with a blank card and shape it around your own spending rules.',
    nickname: '',
    amount: null,
    limitType: null,
    tint: 'transparent',
    features: ['Flexible setup', 'Choose your own limit', 'Add controls if needed']
  }
};

function showCreateCard() {
  var el = document.getElementById('create-card');
  if (!el) return;
  _ctplStep = 1;
  _ctplSelected = null;
  // Reset to picker view
  var picker = document.getElementById('ctplPickerPanel');
  var setup  = document.getElementById('ctplSetupPanel');
  if (picker) { picker.classList.remove('ctpl-exit'); picker.classList.remove('ctpl-continuing'); }
  if (setup)  { setup.classList.remove('ctpl-active'); setup.classList.remove('ctpl-flip'); setup.classList.remove('ctpl-did-flip'); }
  _ctplSetMiniShown(false);
  var _setupCard = document.getElementById('ctplSetupCard');
  if (_setupCard) { _setupCard.style.transition = ''; _setupCard.style.transform = ''; _setupCard.style.transformOrigin = ''; }
  document.querySelectorAll('.ctpl-dcard').forEach(function(d){ d.style.transition=''; d.style.transform=''; d.style.opacity=''; });
  var _sheet = document.querySelector('.ctpl-sheet'); if (_sheet) _sheet.classList.remove('ctpl-step2');
  var _aiCard = document.getElementById('ctplAiCard'); if (_aiCard) _aiCard.style.display = '';
  // Reset header
  var lbl = document.querySelector('.ctpl-sheet-lbl');
  var step = document.querySelector('.ctpl-sheet-step');
  if (lbl)  lbl.textContent = 'Or, Select a template to get started';
  if (step) step.textContent = '1/3';
  // Reset tint
  var tint = document.getElementById('ctplCardTint');
  if (tint) tint.style.background = 'transparent';

  ['home','explore','accounts','account-detail','cards'].forEach(function(id) {
    var s = document.getElementById(id);
    if (s) s.className = 'screen hr';
  });
  el.className = 'screen on';
  setSbLight(false);
  showNav(false);
  // Reset & lay out the template carousel
  _ctplDeckIdx = 0;
  _ctplDeckInit();
  _ctplApplyDeck();
}

function goBackCreateCard() {
  if (_ctplStep === 2) {
    // Go back to picker — preserve selection
    _ctplStep = 1;
    var picker = document.getElementById('ctplPickerPanel');
    var setup  = document.getElementById('ctplSetupPanel');
    if (setup)  { setup.classList.remove('ctpl-active'); setup.classList.remove('ctpl-flip'); setup.classList.remove('ctpl-did-flip'); }
    _ctplSetMiniShown(false);
    var _bsc = document.getElementById('ctplSetupCard');
    if (_bsc) { _bsc.style.transition = ''; _bsc.style.transform = ''; _bsc.style.transformOrigin = ''; }
    if (picker) {
      picker.classList.remove('ctpl-continuing');
      picker.style.transition = 'none';
      picker.style.transform  = 'translateX(-28px)';
      picker.style.opacity    = '0';
      picker.classList.remove('ctpl-exit');
      var _restoreCards = document.querySelectorAll('#ctplPickerPanel .ctpl-dcard');
      _restoreCards.forEach(function(d){ d.style.opacity = ''; });
      requestAnimationFrame(function() {
        picker.style.transition = '';
        picker.style.transform  = '';
        picker.style.opacity    = '';
      });
    }
    var lbl = document.querySelector('.ctpl-sheet-lbl');
    var step = document.querySelector('.ctpl-sheet-step');
    if (lbl)  lbl.textContent = 'Or, Select a template to get started';
    if (step) step.textContent = '1/3';
    var tint = document.getElementById('ctplCardTint');
    if (tint) tint.style.background = 'transparent';
    var sheet = document.querySelector('.ctpl-sheet');
    if (sheet) sheet.classList.remove('ctpl-step2');
    var aiCard = document.getElementById('ctplAiCard');
    if (aiCard) aiCard.style.display = '';
  } else {
    closeCreateCard();
  }
}

function closeCreateCard() {
  var el = document.getElementById('create-card');
  if (el) el.className = 'screen hr';
  var cards = document.getElementById('cards');
  if (cards) { cards.className = 'screen on'; showNav(false); }
}

function _ctplExpiryDate(days) {
  var d = new Date(Date.now() + days * 86400000);
  var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
}

// Stacked deck: tapping a card lifts it out of the stack (others recede);
// the Continue CTA then opens the setup step.
// ── Template picker: vertical 3D card-stack carousel ──
// Centered card is prominent; neighbours recede above/below. Scroll, drag,
// or tap any card to bring it to centre and select it.
var CTPL_DECK = [
  { key: 'subscriptions', name: 'Subscriptions' },
  { key: 'merchant',      name: 'Favourite brand' },
  { key: 'event',         name: 'Events' },
  { key: 'travel',        name: 'Travel' },
  { key: 'trial',         name: 'Trial' },
  { key: 'onetimebuy',    name: 'One-time buy' },
  { key: 'household',     name: 'Household' },
  { key: 'childteen',     name: 'Child / Teen' },
];
var _ctplDeckIdx = 0;
var _ctplSel = CTPL_DECK[0];
var _ctplNavAt = 0;
function _ctplDeckCards() { return document.querySelectorAll('#ctplPickerPanel .ctpl-dcard'); }
function _ctplApplyDeck() {
  var cards = _ctplDeckCards();
  var n = cards.length;
  // Centred coverflow: the focal card sits in the middle. Upcoming cards fan UP
  // (name peeks at the top); previous cards fan DOWN (name peeks at the bottom).
  var BASE = 8, UP_GAP = 44, UP_PEEK = 38, DN_GAP = 44, DN_PEEK = 36, UP_MAX = 3, DN_MAX = 3;
  cards.forEach(function(el, i) {
    var diff = i - _ctplDeckIdx;
    if (diff >  n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    var st, isEdge = false;
    if (diff === 0) {
      st = { y: BASE, s: 1, o: 1, z: 100, rx: 0 };
    } else if (diff > 0) {                       // upcoming → above, name at top
      st = {
        y: BASE - UP_GAP - (diff - 1) * UP_PEEK,
        s: Math.max(0.78, 1 - diff * 0.05),
        o: diff <= UP_MAX ? 1 : 0, z: 100 - diff,
        rx: Math.min(8, diff * 2.2)
      };
    } else {                                     // previous → below, name at bottom
      var ad = -diff;
      isEdge = true;
      st = {
        y: BASE + DN_GAP + (ad - 1) * DN_PEEK,
        s: Math.max(0.8, 1 - ad * 0.05),
        o: ad <= DN_MAX ? 1 : 0, z: 100 - ad,
        rx: -Math.min(8, ad * 2.2)
      };
    }
    el.style.transform = 'translate(-50%,-50%) translateY(' + st.y + 'px) scale(' + st.s + ') rotateX(' + st.rx + 'deg)';
    el.style.opacity = st.o;
    el.style.zIndex = st.z;
    el.style.pointerEvents = st.o > 0 ? 'auto' : 'none';
    el.classList.toggle('is-current', diff === 0);
    el.classList.toggle('ctpl-edge', isEdge);
  });
  var cur = CTPL_DECK[_ctplDeckIdx] || CTPL_DECK[0];
  _ctplSel = cur;
  var cn = document.getElementById('ctplContinueName');
  if (cn) cn.textContent = cur.name;
}
function ctplDeckGo(i) {
  var n = _ctplDeckCards().length || CTPL_DECK.length;
  _ctplDeckIdx = ((i % n) + n) % n; // wrap around
  _ctplApplyDeck();
}
function ctplDeckNav(dir) {
  var now = Date.now();
  if (now - _ctplNavAt < 380) return; // cooldown
  _ctplNavAt = now;
  ctplDeckGo(_ctplDeckIdx + dir);
}
// Click a card: centre it; if it's already centred, continue.
function ctplCardClick(i) {
  if (i === _ctplDeckIdx) ctplContinue();
  else ctplDeckGo(i);
}
var _ctplDeckWired = false;
function _ctplDeckInit() {
  if (_ctplDeckWired) return;
  var deck = document.querySelector('#ctplPickerPanel .ctpl-deck');
  if (!deck) return;
  _ctplDeckWired = true;
  var startY = null, dragging = false;
  deck.addEventListener('pointerdown', function(e) { startY = e.clientY; dragging = true; });
  deck.addEventListener('pointermove', function(e) {
    if (!dragging || startY === null) return;
    var dy = e.clientY - startY;
    if (dy < -46) { ctplDeckNav(1); dragging = false; }
    else if (dy > 46) { ctplDeckNav(-1); dragging = false; }
  });
  var end = function() { dragging = false; startY = null; };
  deck.addEventListener('pointerup', end);
  deck.addEventListener('pointercancel', end);
  deck.addEventListener('wheel', function(e) {
    if (Math.abs(e.deltaY) > 18) ctplDeckNav(e.deltaY > 0 ? 1 : -1);
  }, { passive: true });
}
function ctplContinue() {
  if (!_ctplSel || !_ctplSel.key) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var picker = document.getElementById('ctplPickerPanel');
  var setupPanel = document.getElementById('ctplSetupPanel');
  var deckCard = document.querySelector('#ctplPickerPanel .ctpl-dcard.is-current');
  if (reduce || !picker || !deckCard || !setupPanel) { selectCardTemplate(_ctplSel.key); return; }

  // 1. Capture where the selected card currently sits (FLIP "first").
  var first = deckCard.getBoundingClientRect();

  // 2. Fade the other cards + CTA out; suppress the setup card's settle pop.
  picker.classList.add('ctpl-continuing');
  setupPanel.classList.add('ctpl-flip');

  // 3. Build the setup view (sets ctpl-step2 + ctpl-exit + queues ctpl-active).
  selectCardTemplate(_ctplSel.key);

  // 4. After the setup card lands in its final spot, FLIP it back to where the
  //    deck card was, then release — it flies up to the top as one continuous card.
  var setupCard = document.getElementById('ctplSetupCard');
  requestAnimationFrame(function() {
    var last = setupCard.getBoundingClientRect();
    if (!last.width) { setupPanel.classList.remove('ctpl-flip'); return; }
    var dx = first.left - last.left;
    var dy = first.top - last.top;
    var sx = first.width / last.width;
    var sy = first.height / last.height;
    setupCard.style.transformOrigin = 'top left';
    setupCard.style.transition = 'none';
    setupCard.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
    deckCard.style.opacity = '0'; // hide the original so only one card is visible
    requestAnimationFrame(function() {
      setupCard.style.transition = 'transform 0.52s var(--ease-out)';
      setupCard.style.transform = 'translate(0,0) scale(1)';
    });
    var done = function() {
      setupCard.style.transition = '';
      setupCard.style.transform = '';
      setupCard.style.transformOrigin = '';
      setupPanel.classList.remove('ctpl-flip');
      setupPanel.classList.add('ctpl-did-flip');
      setupCard.removeEventListener('transitionend', done);
    };
    setupCard.addEventListener('transitionend', done);
  });
}

// Template visuals for the setup featured card (gradient · icon · display name · desc)
var CTPL_VIZ = {
  subscriptions: { g: 'linear-gradient(159deg,#00272b 0%,#005b89 170%)', ic: 'Television.svg', n: 'Subscriptions', d: 'Frequency control for recurring charges.', caps: ['Monthly limit', 'Renewal aware'], bleed: '0,91,137' },
  merchant:      { g: 'linear-gradient(159deg,#2b1700 0%,#894200 170%)', ic: 'Package.svg', n: 'Favourite brand', d: 'One brand you spend with often.', caps: ['Merchant lock', 'Monthly limit'], bleed: '137,66,0' },
  event:         { g: 'linear-gradient(159deg,#270038 0%,#8700b0 170%)', ic: 'CalendarStar.svg', n: 'Events', d: 'A temporary budget for one occasion.', caps: ['Date range', 'Total cap'], bleed: '135,0,176' },
  travel:        { g: 'linear-gradient(159deg,#002b2b 0%,#008789 170%)', ic: 'AirplaneTilt.svg', n: 'Travel', d: 'Trip spending, kept separate.', caps: ['Multi-country', 'Trip cap'], bleed: '0,135,137' },
  trial:         { g: 'linear-gradient(159deg,#072b00 0%,#598900 170%)', ic: 'Clock.svg', n: 'Trial', d: 'A low limit for unfamiliar sites.', caps: ['Low limit', 'Single use'], bleed: '89,137,0' },
  onetimebuy:    { g: 'linear-gradient(159deg,#2b2400 0%,#897400 170%)', ic: 'ShoppingBag.svg', n: 'One-time buy', d: 'Cap one purchase, then close.', caps: ['One purchase', 'Auto-close'], bleed: '137,116,0' },
  household:     { g: 'linear-gradient(159deg,#00132b 0%,#005289 170%)', ic: 'UsersThree.svg', n: 'Household', d: 'Shared spending with clear limits.', caps: ['Shared use', 'Monthly limit'], bleed: '0,82,137' },
  childteen:     { g: 'linear-gradient(159deg,#2b000d 0%,#890027 170%)', ic: 'Baby.svg', n: 'Child / Teen', d: 'Supervised spending with guardrails.', caps: ['Category limits', 'Spend alerts'], bleed: '137,0,39' },
  custom:        { g: 'linear-gradient(159deg,#2a2a2a 0%,#555 170%)', ic: 'Cards.svg', n: 'Custom', d: 'Build your own from scratch.', caps: ['Custom', 'Virtual card'], bleed: '85,85,85' },
};
function _ctplExpiryDateDMY(days) {
  var d = new Date(Date.now() + days * 86400000);
  var p = function(n){ return (n < 10 ? '0' : '') + n; };
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
}

// As the featured card scrolls away, hide the nav and reveal the pinned mini pill
// at the top (iOS large-title style). Hysteresis avoids flicker at the threshold.
var _ctplSetupScrollBound = false;
function _ctplSetMiniShown(v) {
  var mini = document.getElementById('ctplMini');
  var nav = document.querySelector('#create-card .ctpl-nav');
  if (mini) mini.classList.toggle('is-visible', v);
  if (nav) nav.classList.toggle('ctpl-nav-hidden', v);
  // Top progressive blur appears together with the mini pill
  var panel = document.getElementById('ctplSetupPanel');
  if (panel) panel.classList.toggle('ctpl-blur-on', v);
}
// Featured-card neighbours: switch templates from the setup screen
var _ctplCurIdx = 0;
function _ctplUpdatePeeks(template) {
  _ctplCurIdx = CTPL_DECK.findIndex(function(d){ return d.key === template; });
  if (_ctplCurIdx < 0) _ctplCurIdx = 0;
  var prev = CTPL_DECK[_ctplCurIdx - 1], next = CTPL_DECK[_ctplCurIdx + 1];
  var pv = document.getElementById('ctplPeekPrev'), nx = document.getElementById('ctplPeekNext');
  if (pv) { if (prev) { pv.style.display = ''; pv.style.background = (CTPL_VIZ[prev.key] || CTPL_VIZ.custom).g; } else { pv.style.display = 'none'; } }
  if (nx) { if (next) { nx.style.display = ''; nx.style.background = (CTPL_VIZ[next.key] || CTPL_VIZ.custom).g; } else { nx.style.display = 'none'; } }
  // arrows are disabled at the ends
  var ap = document.getElementById('ctplArrowPrev'), an = document.getElementById('ctplArrowNext');
  if (ap) ap.classList.toggle('is-disabled', !prev);
  if (an) an.classList.toggle('is-disabled', !next);
}
function ctplSwitchTemplate(dir) {
  var ni = _ctplCurIdx + dir;
  if (ni < 0 || ni >= CTPL_DECK.length) return;
  selectCardTemplate(CTPL_DECK[ni].key);
  // directional nudge — the row slides toward the chosen side, then settles (no auto-advance)
  var row = document.getElementById('ctplCardRow');
  if (row) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      row.style.transition = 'none';
      row.style.transform = 'translateX(' + (dir > 0 ? -26 : 26) + 'px)';
      requestAnimationFrame(function() {
        row.style.transition = '';
        row.style.transform = '';
      });
    }
  }
}
// Drag/swipe to switch templates (same feel as the cards-home carousel; manual, no auto-advance)
var _ctplCardDragBound = false;
function _ctplBindCardDrag() {
  var row = document.getElementById('ctplCardRow');
  if (!row || _ctplCardDragBound) return;
  _ctplCardDragBound = true;
  var x0 = null, dx = 0, moved = false;
  row.addEventListener('pointerdown', function(e) { x0 = e.clientX; dx = 0; moved = false; });
  row.addEventListener('pointermove', function(e) {
    if (x0 === null) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 8) {
      moved = true;
      row.style.transition = 'none';
      row.style.transform = 'translateX(' + (dx * 0.4) + 'px)';
    }
  });
  var end = function() {
    if (x0 === null) return;
    var d = dx; x0 = null;
    if (moved && Math.abs(d) > 44) {
      ctplSwitchTemplate(d < 0 ? 1 : -1);  // ctplSwitchTemplate handles the settle nudge
    } else {
      row.style.transition = 'transform 0.3s var(--ease-out)';
      row.style.transform = '';
    }
  };
  row.addEventListener('pointerup', end);
  row.addEventListener('pointercancel', function() { x0 = null; row.style.transition = 'transform 0.3s var(--ease-out)'; row.style.transform = ''; });
}

function _ctplSetupScrollHandler() {
  var scroll = document.querySelector('.ctpl-setup-scroll');
  var card = document.getElementById('ctplSetupCard');
  var row = document.getElementById('ctplCardRow') || card;
  var mini = document.getElementById('ctplMini');
  if (!scroll || !card || !mini) return;
  var y = scroll.scrollTop;
  var h = card.offsetHeight || 144;
  // Scroll-linked: fade the featured card (+ peeking neighbours) out as it scrolls
  // up so it's gone before the pill appears (no doubled state).
  var p = Math.min(1, Math.max(0, (y - h * 0.28) / (h * 0.5)));
  row.style.opacity = String(1 - p);
  if (mini.classList.contains('is-visible')) {
    if (p < 0.5) _ctplSetMiniShown(false);
  } else if (p >= 1) {
    _ctplSetMiniShown(true);
  }
}

function selectCardTemplate(template) {
  var cfg = CTPL_CONFIG[template];
  if (!cfg) return;
  _ctplSelected = template;
  _ctplStep = 2;

  var VIZ = CTPL_VIZ[template] || CTPL_VIZ.custom;
  var dispName = VIZ.n || cfg.name;
  var dispDesc = VIZ.d || cfg.subtext;

  // Header (centered title)
  document.getElementById('ctplSetupName').textContent = dispName;
  document.getElementById('ctplSetupSub').textContent  = dispDesc;

  // Featured card preview
  var sc = document.getElementById('ctplSetupCard'); if (sc) sc.style.background = VIZ.g;
  // Soft bleed: tint the form bg with the card's colour, fading out down the panel
  var bleedPanel = document.getElementById('ctplSetupPanel');
  if (bleedPanel && VIZ.bleed) {
    bleedPanel.style.background = 'linear-gradient(180deg, rgba(' + VIZ.bleed + ',0.20) 0%, rgba(' + VIZ.bleed + ',0.13) 45%, rgba(' + VIZ.bleed + ',0.09) 100%), rgba(255,255,255,0.965)';
  }
  var wm = document.getElementById('ctplSetupCardWm'); if (wm) wm.style.setProperty('--ico', "url('Icons/" + VIZ.ic + "')");
  var scn = document.getElementById('ctplSetupCardName'); if (scn) scn.textContent = dispName;
  // Mini pinned pill mirrors the card's colour, name and icon
  var mn = document.getElementById('ctplMiniName'); if (mn) mn.textContent = dispName;
  var mini = document.getElementById('ctplMini'); if (mini) mini.style.background = VIZ.g;
  var mw = document.getElementById('ctplMiniWm'); if (mw) mw.style.setProperty('--ico', "url('Icons/" + VIZ.ic + "')");
  var scd = document.getElementById('ctplSetupCardDesc'); if (scd) scd.textContent = dispDesc;
  var scc = document.getElementById('ctplSetupCardCaps');
  if (scc && VIZ.caps) { scc.innerHTML = VIZ.caps.map(function(c){ return '<span>' + c + '</span>'; }).join(''); }
  _ctplUpdatePeeks(template);
  // carousel temporarily disabled — single card only (no swipe binding)

  // Nickname
  var nick = document.getElementById('ctplNickname');
  if (nick) { nick.value = cfg.nickname || ''; nick.placeholder = cfg.nickname || ('e.g. ' + dispName + ' card'); }

  // Amount
  var amt = document.getElementById('ctplAmount');
  if (amt) { amt.value = cfg.amount !== null && cfg.amount !== undefined ? cfg.amount : ''; }

  // Limit type dropdown
  _ctplLimitType = cfg.limitType || 'Monthly';
  var ltv = document.getElementById('ctplLimitTypeVal');
  if (ltv) ltv.textContent = _ctplLimitType === 'All time' ? 'Total amount' : _ctplLimitType;

  // Per-transaction limit (free-type)
  var perTxn = document.getElementById('ctplPerTxn');
  if (perTxn) perTxn.value = (cfg.online == null) ? '' : Number(cfg.online).toFixed(2);

  // Expiry date (free-type DD/MM/YYYY; default 3 months)
  var expVal = document.getElementById('ctplExpiryVal');
  if (expVal) expVal.value = _ctplExpiryDateDMY(cfg.expiryDays || 90);

  // Toggles
  var intlEl = document.getElementById('ctplIntl');
  if (intlEl) intlEl.classList.toggle('ctpl-toggle--on', !!cfg.intl);
  var ctlTgl = document.getElementById('ctplContactlessTgl');
  if (ctlTgl) ctlTgl.classList.toggle('ctpl-toggle--on', !!(cfg.contactless && cfg.contactless > 0));

  // Advanced controls — seed from the template, then render rows + collapsed summary
  _ctplTxns = (cfg.txns == null || cfg.txns === 'unlimited') ? 'Unlimited' : String(cfg.txns);
  _ctplBlocked = Array.isArray(cfg.blocked) ? cfg.blocked.slice() : [];
  _ctplRenderOtherControls();

  // Reset manual section
  var manualBody  = document.getElementById('ctplManualBody');
  var manualCaret = document.getElementById('ctplManualCaret');
  if (manualBody)  manualBody.classList.remove('open');
  if (manualCaret) manualCaret.classList.remove('open');

  // Card tint
  var tint = document.getElementById('ctplCardTint');
  if (tint) tint.style.background = cfg.tint;

  // Hide top sheet-row strip on step 2 + hide the AI card
  var sheet = document.querySelector('.ctpl-sheet');
  if (sheet) sheet.classList.add('ctpl-step2');
  var aiCard = document.getElementById('ctplAiCard');
  if (aiCard) aiCard.style.display = 'none';

  // Merchant row (merchant template only)
  var merchantRow = document.getElementById('ctplMerchantRow');
  var merchantSep = document.getElementById('ctplMerchantSep');
  var isMerchant = template === 'merchant';
  if (merchantRow) merchantRow.style.display = isMerchant ? '' : 'none';
  if (merchantSep) merchantSep.style.display = isMerchant ? '' : 'none';
  if (isMerchant) {
    _ctplMerchantId = null; _ctplMerchantName = '';
    var av = document.getElementById('ctplMerchantAvatar');
    if (av) { av.textContent = ''; av.style.background = 'rgba(0,0,0,0.12)'; }
    var lb = document.getElementById('ctplMerchantLabel');
    if (lb) lb.textContent = 'Select merchant';
  }

  // Scroll setup to top + reset the sticky card to its full (expanded) state
  var scroll = document.querySelector('.ctpl-setup-scroll');
  if (scroll) scroll.scrollTop = 0;
  _ctplSetMiniShown(false);
  var _stk = document.getElementById('ctplSetupCard');
  if (_stk) _stk.style.opacity = '';
  var _row = document.getElementById('ctplCardRow'); if (_row) _row.style.opacity = '';
  if (scroll && !_ctplSetupScrollBound) {
    _ctplSetupScrollBound = true;
    scroll.addEventListener('scroll', _ctplSetupScrollHandler, { passive: true });
  }

  // Animate: picker slides left out, setup slides in from right
  var picker = document.getElementById('ctplPickerPanel');
  var setupPanel = document.getElementById('ctplSetupPanel');
  if (picker) picker.classList.add('ctpl-exit');
  if (setupPanel) {
    requestAnimationFrame(function() {
      setupPanel.classList.add('ctpl-active');
    });
  }
}

function ctplSelectLimit(btn) {
  var opts = document.querySelectorAll('.ctpl-seg-opt');
  opts.forEach(function(o) { o.classList.remove('active'); });
  btn.classList.add('active');
}

function ctplToggleCustomize() {
  var body  = document.getElementById('ctplCustomizeBody');
  var caret = document.getElementById('ctplCustomizeCaret');
  if (!body) return;
  var open = body.classList.toggle('open');
  if (caret) caret.classList.toggle('open', open);
}

function ctplToggleSwitch(el) {
  el.classList.toggle('ctpl-toggle--on');
}

function createCardFromTemplate() {
  // Placeholder: collect values and proceed to step 3
  var nickname  = document.getElementById('ctplNickname')  ? document.getElementById('ctplNickname').value  : '';
  var amount    = document.getElementById('ctplAmount')     ? document.getElementById('ctplAmount').value     : '';
  var limitType = (document.querySelector('.ctpl-seg-opt.active') || {}).dataset || {};
  console.log('Create card:', _ctplSelected, nickname, amount, limitType.val);
}

/* ── Card action sheets ────────────────────────── */
let _cardLocked = false;
let _pinStep   = 0;   // 0=current, 1=new, 2=confirm
let _pinEntry  = '';  // digits typed so far
let _pinNew    = '';  // saved new PIN from step 1

function openCrSheet(id) {
  document.getElementById('crOverlay').classList.add('visible');
  document.getElementById(id).classList.add('open');
  // Frozen sheet: play the natural rising-frost animation, then drop the
  // transient mask so the rest state is the full, clean frost artwork.
  if (id === 'crFrozenSheet') {
    var card = document.querySelector('#crFrozenSheet .cr-frozen-card');
    if (card) {
      card.classList.remove('cr-frz-icing');
      void card.offsetWidth;            // restart the animation on each open
      card.classList.add('cr-frz-icing');
      setTimeout(function() { card.classList.remove('cr-frz-icing'); }, 1750);
    }
  }
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
/* ── Card Controls Sheet ── */
var _ccsDirty = false;

function ccsMark() {
  if (!_ccsDirty) {
    _ccsDirty = true;
    var bar = document.getElementById('ccsSaveBar');
    if (bar) bar.classList.add('visible');
  }
}
function ccsDiscard() {
  _ccsDirty = false;
  document.getElementById('ccsSaveBar').classList.remove('visible');
  showToast('Changes discarded');
}
function ccsSave() {
  _ccsDirty = false;
  document.getElementById('ccsSaveBar').classList.remove('visible');
  showToast('Controls saved');
}

/* ── Card controls (redesign) — physical vs virtual variant by active card ── */
function openCardControls() {
  // Active carousel card: index 0 = physical, 1 = virtual
  var active = document.querySelector('#crCarousel .cr-carousel-item.cr-active');
  var items = Array.prototype.slice.call(document.querySelectorAll('#crCarousel .cr-carousel-item'));
  var idx = items.indexOf(active);
  var isVirtual = idx === 1; // Card 2 is the virtual card
  var phys = document.getElementById('ccxPhysical');
  var virt = document.getElementById('ccxVirtual');
  if (phys) phys.style.display = isVirtual ? 'none' : '';
  if (virt) virt.style.display = isVirtual ? '' : 'none';
  openCrSheet('crControlsSheet');
}
function ccxSeg(btn, i) {
  var btns = btn.parentElement.querySelectorAll('.ccx-seg-btn');
  btns.forEach(function(b) { b.classList.remove('ccx-seg-on'); });
  btn.classList.add('ccx-seg-on');
}
function ccxToggleChan(row) {
  // Don't toggle when interacting with the amount input
  if (window.event && window.event.target && window.event.target.classList.contains('ccx-amt-inp')) return;
  row.classList.toggle('ccx-on');
}
function ccxSave() {
  closeCrSheet('crControlsSheet');
  showToast('Controls saved');
}

function ccsToggleLimit(type, toggleEl) {
  toggleEl.classList.toggle('on');
  var isOn = toggleEl.classList.contains('on');
  var wrapMap = { perTx: 'ccsPerTxAmtWrap', monthly: 'ccsMonthlyAmtWrap', budget: 'ccsBudgetAmtWrap' };
  var progMap = { monthly: 'ccsMonthlyProgress' };
  var wrap = document.getElementById(wrapMap[type]);
  if (wrap) wrap.style.display = isOn ? '' : 'none';
  if (progMap[type]) {
    var prog = document.getElementById(progMap[type]);
    if (prog) prog.style.display = isOn ? '' : 'none';
  }
  ccsMark();
}

function ccsUpdateBar(type) {
  if (type === 'monthly') {
    var input = document.getElementById('ccsMonthlyInput');
    var bar = document.getElementById('ccsMonthlyBar');
    var desc = document.getElementById('ccsMonthlyDesc');
    var limit = parseFloat(input.value) || 0;
    var spent = 620;
    if (limit > 0) {
      var pct = Math.min(100, Math.round(spent / limit * 100));
      bar.style.width = pct + '%';
      bar.className = 'ccs-progress-fill' + (pct >= 95 ? ' danger' : pct >= 80 ? ' warn' : '');
      desc.textContent = '$' + spent.toLocaleString() + ' used · resets Jun 30';
    }
  }
}

function ccsSetMode(mode, btn) {
  btn.closest('.ccs-mode-seg').querySelectorAll('.ccs-mode-seg-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  ccsMark();
}

function ccsCatChipToggle(chip) {
  chip.classList.toggle('active');
  ccsMark();
}

function ccsToggleSection(type, toggleEl) {
  toggleEl.classList.toggle('on');
  var isOn = toggleEl.classList.contains('on');
  var map = { country: 'ccsCountryField', velocity: 'ccsVelocityField', lock: 'ccsLockField' };
  var field = document.getElementById(map[type]);
  if (field) field.style.display = isOn ? '' : 'none';
}

function ccsToggleChip(chip) { chip.classList.toggle('ccs-chip--active'); }

function ccsPeriod(btn, _p) {
  btn.closest('.ccs-period-seg').querySelectorAll('.ccs-period-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  ccsMark();
}

function ccsMerchantUpdate() {
  /* note updates handled by agent response area when used via agent */
}

function ccsLockPreview() {
  var d = document.getElementById('ccsLockDate').value;
  var t = document.getElementById('ccsLockTime').value;
  var prev = document.getElementById('ccsLockPreview');
  if (!prev) return;
  if (d) {
    var dt = new Date(d + 'T' + (t || '23:59'));
    var fmt = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    var tfmt = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    prev.style.display = '';
    prev.textContent = 'Card will freeze on ' + fmt + ' at ' + tfmt + '. You can cancel this anytime.';
  } else {
    prev.style.display = 'none';
  }
}

function ccsToggleAdvanced() {
  var body = document.getElementById('ccsAdvBody');
  var caret = document.getElementById('ccsAdvCaret');
  var open = body.style.display !== 'none';
  body.style.display = open ? 'none' : '';
  caret.classList.toggle('open', !open);
}

function ccsAddCountry() { showToast('Country picker coming soon'); }

function ccsFreezeCard() {
  var badge = document.getElementById('ccsStatusBadge');
  badge.className = 'ccs-status-badge frozen';
  document.getElementById('ccsStatusLabel').textContent = 'Frozen';
  document.getElementById('ccsFreezeBtn').style.display = 'none';
  document.getElementById('ccsUnfreezeBtn').style.display = '';
  document.getElementById('ccsBannerFrozen').style.display = 'flex';
  showToast('Card frozen');
}

function ccsUnfreezeCard() {
  var badge = document.getElementById('ccsStatusBadge');
  badge.className = 'ccs-status-badge';
  document.getElementById('ccsStatusLabel').textContent = 'Active';
  document.getElementById('ccsFreezeBtn').style.display = '';
  document.getElementById('ccsUnfreezeBtn').style.display = 'none';
  document.getElementById('ccsBannerFrozen').style.display = 'none';
  showToast('Card unfrozen');
}

function ccsCloseCardConfirm() {
  var overlay = document.getElementById('ccsCloseConfirm');
  overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
}

function ccsCloseCardExecute() {
  document.getElementById('ccsCloseConfirm').style.display = 'none';
  var badge = document.getElementById('ccsStatusBadge');
  badge.className = 'ccs-status-badge closed';
  document.getElementById('ccsStatusLabel').textContent = 'Closed';
  document.getElementById('ccsFreezeBtn').style.display = 'none';
  document.getElementById('ccsUnfreezeBtn').style.display = 'none';
  document.getElementById('ccsCloseCardBtn').style.display = 'none';
  document.getElementById('ccsBannerClosed').style.display = 'flex';
  document.getElementById('ccsScroll').style.pointerEvents = 'none';
  document.getElementById('ccsScroll').style.opacity = '0.5';
  showToast('Card closed');
}

/* Agent input */
function ccsAgentTyping() {
  var val = (document.getElementById('ccsAgentInput').value || '').trim();
  var send = document.getElementById('ccsAgentSend');
  if (send) send.style.display = val ? '' : 'none';
}

function ccsAgentSubmit() {
  var input = document.getElementById('ccsAgentInput');
  var text = (input.value || '').trim().toLowerCase();
  if (!text) return;
  var resp = document.getElementById('ccsAgentResp');
  var msg = ccsParseIntent(text);
  input.value = '';
  document.getElementById('ccsAgentSend').style.display = 'none';
  resp.style.display = '';
  resp.textContent = msg;
  setTimeout(function() {
    resp.style.display = 'none';
  }, 5000);
}

var _CCS_CATS = {
  groceries: '[data-cat="groceries"]', dining: '[data-cat="dining"]',
  restaurants: '[data-cat="dining"]', food: '[data-cat="dining"]',
  shopping: '[data-cat="shopping"]', retail: '[data-cat="shopping"]',
  subscriptions: '[data-cat="subscriptions"]', streaming: '[data-cat="subscriptions"]',
  travel: '[data-cat="travel"]', transport: '[data-cat="travel"]',
  fuel: '[data-cat="fuel"]', gas: '[data-cat="fuel"]',
  home: '[data-cat="home"]', utilities: '[data-cat="home"]',
  health: '[data-cat="health"]', pharmacy: '[data-cat="health"]',
  education: '[data-cat="education"]', kids: '[data-cat="education"]',
  entertainment: '[data-cat="entertainment"]',
  'personal care': '[data-cat="personalcare"]', wellness: '[data-cat="personalcare"]',
  cash: '[data-cat="cash"]', restricted: '[data-cat="restricted"]',
};

function ccsParseIntent(text) {
  /* Monthly limit: "limit to $200", "$500/month", "monthly limit 300" */
  var monthMatch = text.match(/(?:limit(?:ed)?(?: to)?|monthly(?: limit)?|set(?: monthly)?(?:(?: limit)? to)?)\s*\$?\s*(\d[\d,]*)/);
  if (monthMatch) {
    var amt = parseInt(monthMatch[1].replace(/,/g, ''));
    var input = document.getElementById('ccsMonthlyInput');
    if (input) { input.value = amt; ccsUpdateBar('monthly'); }
    var toggle = document.getElementById('ccsMonthlyToggle');
    if (toggle && !toggle.classList.contains('on')) toggle.classList.add('on');
    ccsMark();
    return 'Done — monthly limit set to $' + amt.toLocaleString() + '.';
  }
  /* Per-transaction: "$50 per transaction", "max $100 per charge" */
  var txMatch = text.match(/\$?\s*(\d[\d,]*)\s*(?:per(?: ?transaction| ?charge)|max)/);
  if (txMatch) {
    var amt2 = parseInt(txMatch[1].replace(/,/g, ''));
    var input2 = document.getElementById('ccsPerTxInput');
    if (input2) input2.value = amt2;
    var toggle2 = document.getElementById('ccsPerTxToggle');
    if (toggle2 && !toggle2.classList.contains('on')) toggle2.classList.add('on');
    ccsMark();
    return 'Done — per-transaction limit set to $' + amt2.toLocaleString() + '.';
  }
  /* Block / unblock category */
  var blockMatch = text.match(/block\s+(.+)/);
  if (blockMatch) {
    var cat = blockMatch[1].trim();
    for (var key in _CCS_CATS) {
      if (cat.includes(key)) {
        var chip = document.querySelector(_CCS_CATS[key]);
        if (chip && chip.classList.contains('active')) { chip.classList.remove('active'); ccsMark(); }
        return 'Done — ' + key + ' is now blocked on this card.';
      }
    }
    return "I couldn’t find that category. Try tapping the chips directly.";
  }
  /* Allow only a category */
  var allowMatch = text.match(/allow\s+(?:only\s+)?(.+)/);
  if (allowMatch) {
    var cat2 = allowMatch[1].trim();
    for (var key2 in _CCS_CATS) {
      if (cat2.includes(key2)) {
        /* switch mode to allow-only and turn only that chip on */
        var modeBtn = document.getElementById('ccsModeAllow');
        if (modeBtn) ccsSetMode('allow', modeBtn);
        document.querySelectorAll('.ccs-cat-chip').forEach(function(c) { c.classList.remove('active'); });
        var target = document.querySelector(_CCS_CATS[key2]);
        if (target) target.classList.add('active');
        ccsMark();
        return 'Done — switched to allow-only mode with ' + key2 + ' enabled.';
      }
    }
  }
  /* Freeze */
  if (text.includes('freeze') || text.includes('pause') || text.includes('lock')) {
    ccsFreezeCard(); return 'Card frozen. New charges are paused.';
  }
  /* Unfreeze */
  if (text.includes('unfreeze') || text.includes('unlock') || text.includes('unpause')) {
    ccsUnfreezeCard(); return 'Card unfrozen.';
  }
  /* Merchant */
  var merchMatch = text.match(/(?:only|restrict(?: to)?|just)\s+([a-z0-9 &]+?)(?:\s+merchant|\s+store|$)/);
  if (merchMatch) {
    var name = merchMatch[1].trim();
    var minput = document.getElementById('ccsMerchantInput');
    if (minput) { minput.value = name.charAt(0).toUpperCase() + name.slice(1); ccsMark(); }
    return 'Done — this card is now restricted to ' + name + '.';
  }
  /* No limit */
  if (text.includes('no limit') || text.includes('remove limit') || text.includes('unlimited')) {
    var mt = document.getElementById('ccsMonthlyToggle');
    var pt = document.getElementById('ccsPerTxToggle');
    if (mt && mt.classList.contains('on')) { mt.classList.remove('on'); ccsToggleLimit('monthly', mt); }
    if (pt && pt.classList.contains('on')) { pt.classList.remove('on'); ccsToggleLimit('perTx', pt); }
    ccsMark();
    return 'Done — spend limits removed. This card can spend up to the Space balance.';
  }
  return "I’m not sure what to change. Try: “limit to $500/month”, “block dining”, or “freeze card”.";
}

/* ── Create Card sheet ── */
/* ── Create Card sheet ── */
function openCcSheet() {
  openCardAgent();
}
function closeCcSheet() {
  document.getElementById('ccOverlay').classList.remove('open');
  showNav(true); showNavAi(true);
}
function ccSetSeg(btn, _type) {
  btn.closest('.cc-seg').querySelectorAll('.cc-seg-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
function ccSelectRadio(label) {
  label.closest('.cc-section').querySelectorAll('.cc-radio-ctrl').forEach(c => c.classList.remove('selected'));
  label.querySelector('.cc-radio-ctrl').classList.add('selected');
}

function crToggle(row) {
  row.querySelector('.cr-toggle').classList.toggle('on');
}

/* Lock card */
// Freeze action: if already frozen, reopen the frozen sheet; else ask to confirm
function openCrLockSheet() {
  openCrSheet(_cardLocked ? 'crFrozenSheet' : 'crLockSheet');
}
function _crSyncLockUI(frozen) {
  // Freeze action label (icon stays a snowflake in both states, per Figma)
  var lbl = document.getElementById('crLockActionLbl');
  if (lbl) lbl.textContent = frozen ? 'Unfreeze' : 'Freeze';
  // Whole-screen frozen state: FROZEN badge, description, Controls hidden,
  // actions re-centred (driven by CSS off #cards.cr-frozen-state)
  var cards = document.getElementById('cards');
  if (cards) cards.classList.toggle('cr-frozen-state', !!frozen);
  // Hero backdrop: frosted-teal when frozen, else the active card's own tinge
  var hero = document.querySelector('#cards .cr-hero');
  if (hero) {
    var carousel = document.getElementById('crCarousel');
    var active = carousel && carousel.querySelector('.cr-carousel-item.cr-active');
    var items = carousel ? Array.prototype.slice.call(carousel.querySelectorAll('.cr-carousel-item')) : [];
    var green = active ? items.indexOf(active) === 0 : true;
    var tinge = frozen ? 'rgba(150,200,202,0.92)' : (green ? 'rgba(8,110,1,0.2)' : 'rgba(80,80,80,0.18)');
    var fade  = frozen ? 'rgba(150,200,202,0)'    : (green ? 'rgba(8,110,1,0)'   : 'rgba(80,80,80,0)');
    hero.style.setProperty('--cr-tinge', tinge);
    hero.style.setProperty('--cr-tinge-fade', fade);
  }
}
function _crApplyFrozen(frozen) {
  _cardLocked = frozen;
  var carousel = document.getElementById('crCarousel');
  // Ice over (or thaw) the currently-centred card — frost spreads in over it
  var card = carousel && carousel.querySelector('.cr-flipcard.cr-active');
  if (card) {
    card.classList.remove('cr-freezing', 'cr-thawing');
    if (frozen) {
      card.classList.add('cr-iced', 'cr-freezing');
      haptic([20, 50, 30]);
      setTimeout(function() { card.classList.remove('cr-freezing'); }, 1750);
    } else {
      // keep cr-iced through the melt animation, then drop it
      card.classList.add('cr-thawing');
      setTimeout(function() { card.classList.remove('cr-thawing', 'cr-iced'); }, 840);
    }
  }
  _crSyncLockUI(frozen);
}
function confirmFreezeCard() {
  _crApplyFrozen(true);
  closeCrSheet('crLockSheet');
  openCrSheet('crFrozenSheet');
}
function unfreezeCard() {
  _crApplyFrozen(false);
  closeCrSheet('crFrozenSheet');
}
function confirmLockCard() {
  _cardLocked = !_cardLocked;
  // Update action button on hero card
  const ico = document.getElementById('crLockActionIco');
  const lbl = document.getElementById('crLockActionLbl');
  if (_cardLocked) {
    ico.style.setProperty('--ico', "url('Icons/LockOpen.svg')");
    ico.style.color = '#c82c2c';
    lbl.textContent = 'Unfreeze';
  } else {
    ico.style.setProperty('--ico', "url('Icons/Snowflake.svg')");
    ico.style.color = 'rgba(0,0,0,0.8)';
    lbl.textContent = 'Freeze';
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
const CR_CURRENT_PIN = '0000'; // prototype: the existing card PIN
function _crPinError() {
  // Shake dots + clear, with error-state haptic
  const dotsEl = document.getElementById('crPinDots');
  document.querySelectorAll('.cr-pin-dot').forEach(d => d.classList.add('error'));
  dotsEl.classList.add('shake');
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  setTimeout(() => {
    dotsEl.classList.remove('shake');
    _pinEntry = ''; _crUpdatePinUI();
    document.querySelectorAll('.cr-pin-dot').forEach(d => d.classList.remove('error'));
  }, 450);
}
function _crAdvancePin() {
  if (_pinStep === 0) {
    // Verify the current PIN — must be 0000
    if (_pinEntry === CR_CURRENT_PIN) {
      _pinStep = 1; _pinEntry = ''; _crUpdatePinUI();
    } else {
      _crPinError();
    }
  } else if (_pinStep === 1) {
    _pinNew = _pinEntry;
    _pinStep = 2; _pinEntry = ''; _crUpdatePinUI();
  } else if (_pinStep === 2) {
    if (_pinEntry === _pinNew) {
      document.getElementById('crPinEntry').style.display  = 'none';
      document.getElementById('crPinSuccess').style.display = '';
    } else {
      _crPinError();
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
  haptic(8);
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
  // Archived spaces render colourless, with no balance/Add-funds and an ARCHIVED badge
  document.getElementById('account-detail').classList.toggle('ad-archived', !!acct.archived);

  // adCasesWrap (old full-card scroll) is never shown — always hide it
  document.getElementById('adCasesWrap').style.display = 'none';
  mainCard.style.display = '';

  // Populate shared fields (same for all modes)
  document.getElementById('adAcctName').textContent = acct.name;
  document.getElementById('adNavTitle').textContent = acct.name;
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
  // Scroll to top + reset pinned-nav title, hero fade, content mask
  document.getElementById('adScroll').scrollTop = 0;
  document.getElementById('adHeaderNav').classList.remove('show-title');
  document.getElementById('adScroll').classList.remove('ad-fade-top');
  document.getElementById('adMainCard').style.opacity = '';
  var _hw = document.getElementById('adHeroBgWrap'); if (_hw) _hw.style.transform = 'scale(1.25)';
  var _hc = document.querySelector('#adMainCard .ad-header-center-inner'); if (_hc) _hc.style.transform = '';
  var _hb = document.getElementById('adHeroBlurTop'); if (_hb) _hb.style.opacity = '0';
  document.getElementById('adScroll').style.setProperty('--ad-sheet-op', '0.4');
  // Slide in
  _navStack.push(_activeScreen());
  document.getElementById('accounts').className       = 'screen hl';
  document.getElementById('home').className           = 'screen hl';
  document.getElementById('account-detail').className = 'screen on';
  if (acct.archived) document.getElementById('account-detail').classList.add('ad-archived');
  showNav(false);
  setSbLight(false);
}

function closeAccountDetail() {
  document.getElementById('account-detail').className = 'screen hr';
  document.getElementById('account-detail').classList.remove('ad-archived');
  showNav(true); showNavAi(true);
  goBack();
}

function toggleArchivedSpaces(btn) {
  var wrap = document.getElementById('acctArchivedList');
  if (!wrap) return;
  var open = wrap.classList.toggle('open');
  if (btn) {
    btn.querySelector('span:first-child').textContent = open ? 'Hide archived spaces' : 'Show archived spaces';
    var caret = btn.querySelector('.ico'); if (caret) caret.style.transform = open ? 'rotate(180deg)' : '';
  }
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
// Whether the current transfer has been scheduled (recurring / future-dated)
var _smScheduled = false;
/* "Schedule payment" on the schedule sheet → scheduled review screen */
function smConfirmSchedule() {
  _smScheduled = true;
  closeScheduleSheet();
  var lbl = document.getElementById('sm-sending-now-label'); if (lbl) lbl.textContent = 'Schedule for later';
  smGoToReview();
}
/* "Confirm and schedule" on the review → success flow with a 3s loader */
function smConfirmScheduled() {
  smGoToProgress(3);
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

/* Add-beneficiary journey is a bottom sheet stack over the current screen */
function _beneSheetShow(id) {
  document.getElementById('beneScrim').classList.add('open');
  ['addBene','beneManual','beneSuccess'].forEach(function(s) {
    var el = document.getElementById(s);
    if (el) el.className = 'screen bsheet ' + (s === id ? 'on' : 'hr');
  });
  setSbLight(false);
}
function _beneSheetHideAll() {
  ['addBene','beneManual','beneSuccess'].forEach(function(s) {
    var el = document.getElementById(s); if (el) el.className = 'screen bsheet hr';
  });
  document.getElementById('beneScrim').classList.remove('open');
}
function openAddBene() {
  closeBeneSheet();
  _beneSheetShow('addBene');
}
function closeAddBene() {
  _beneSheetHideAll();
}

/* ── Add beneficiary — manual flow (India) ── */
var _bmStep = 0, _bmVerified = false, _bmVerifyTimer = null;
function openBeneManual() {
  document.getElementById('addBene').className = 'screen hl';
  _bmStep = 0; _bmVerified = false;
  // reset verify states + extra fields
  ['bmVerifyLoading','bmVerifyOk','bmVerifyFail'].forEach(function(id){ document.getElementById(id).classList.remove('show'); });
  document.getElementById('bmManualNameField').classList.remove('show');
  document.getElementById('bmIfscErr').classList.remove('show');
  document.getElementById('bmIfscField').classList.remove('has-error');
  document.getElementById('bmPhoneField').style.display = 'none';
  document.getElementById('bmEmailField').style.display = 'none';
  document.getElementById('bmAddLinks').style.display = '';
  // clear entered details so the user fills them; Savings preselected
  document.getElementById('bmAcctNum').value = '';
  document.getElementById('bmIfsc').value = '';
  document.getElementById('bmAcctType').value = 'Savings';
  document.getElementById('bmNickname').value = '';
  // country not yet chosen → lock account/about
  document.querySelectorAll('.bm-country').forEach(function(c){ c.classList.remove('sel'); });
  _bmSetStep(0, /*countryChosen*/ false);
  document.getElementById('bmScroll').scrollTop = 0;
  _beneSheetShow('beneManual');
  showNav(false);
}
function bmBack() {
  // step back to the first "Add a beneficiary" sheet
  if (_bmVerifyTimer) clearTimeout(_bmVerifyTimer);
  _beneSheetShow('addBene');
}
function closeBeneManual() {
  if (_bmVerifyTimer) clearTimeout(_bmVerifyTimer);
  _beneSheetHideAll();
}
function _bmSetStep(n, countryChosen) {
  _bmStep = n;
  var secs = ['bmSecCountry','bmSecAccount','bmSecAbout'];
  secs.forEach(function(id, i) {
    var el = document.getElementById(id);
    el.classList.remove('is-done','is-locked');
    if (i < n) el.classList.add('is-done');
    else if (i > n) {
      // account unlocks once country chosen; about once verified handled by step advance
      if (!(i === 1 && countryChosen)) el.classList.add('is-locked');
      else el.classList.add('is-locked');
    }
  });
  var btn = document.getElementById('bmNextBtn');
  // On the account step, the user must enter details first — gate Next until verified
  btn.classList.toggle('is-disabled', n === 1 && !_bmVerified);
}
/* Verify only once the IFSC is entered */
function bmTryVerify() {
  if (_bmVerified) return;
  var ifsc = (document.getElementById('bmIfsc').value || '').trim();
  if (!ifsc) return;
  _bmStartVerify();
}
function bmGoStep(n) {
  var el = document.getElementById(['bmSecCountry','bmSecAccount','bmSecAbout'][n]);
  if (el.classList.contains('is-locked')) return;
  _bmSetStep(n, true);
}
function bmSelectCountry(name, flag) {
  document.querySelectorAll('.bm-country').forEach(function(c){ c.classList.remove('sel'); });
  if (window.event && window.event.currentTarget) window.event.currentTarget.classList.add('sel');
  var done = document.querySelector('#bmSecCountry .bm-sec-bar-done');
  done.innerHTML = '<span class="bm-sec-flag">' + flag + '</span> Sending money to <b>' + name + '</b>';
  haptic(8);
  setTimeout(function(){ _bmSetStep(1, true); document.getElementById('bmScroll').scrollTop = 0; }, 180);
}
function bmToggleMethod(which) {
  var card = document.getElementById(which === 'bank' ? 'bmBankCard' : 'bmUpiCard');
  card.classList.toggle('is-open');
  var caret = card.querySelector('.bm-method-caret');
  caret.style.setProperty('--ico', card.classList.contains('is-open') ? "url('Icons/CaretUp.svg')" : "url('Icons/CaretDown.svg')");
}
function _bmStartVerify() {
  if (_bmVerifyTimer) clearTimeout(_bmVerifyTimer);
  document.getElementById('bmVerifyOk').classList.remove('show');
  document.getElementById('bmVerifyFail').classList.remove('show');
  document.getElementById('bmManualNameField').classList.remove('show');
  document.getElementById('bmVerifyLoading').classList.add('show');
  document.getElementById('bmNextBtn').classList.add('is-disabled');
  _bmVerifyTimer = setTimeout(function() {
    document.getElementById('bmVerifyLoading').classList.remove('show');
    document.getElementById('bmVerifyOk').classList.add('show');
    document.getElementById('bmNextBtn').classList.remove('is-disabled');
    _bmVerified = true;
    var nm = document.getElementById('bmNickname'); if (nm) nm.value = 'Byomkesh Bakshi';
  }, 1500);
}
function bmAddContact(type) {
  document.getElementById(type === 'phone' ? 'bmPhoneField' : 'bmEmailField').style.display = 'flex';
  // hide that add-link
  var links = document.querySelectorAll('#bmAddLinks .bm-add-link');
  links[type === 'phone' ? 0 : 1].style.display = 'none';
  if (![].slice.call(links).some(function(l){ return l.style.display !== 'none'; }))
    document.getElementById('bmAddLinks').style.display = 'none';
}
function bmSaveNext() {
  if (document.getElementById('bmNextBtn').classList.contains('is-disabled')) return;
  haptic(8);
  if (_bmStep === 0) { _bmSetStep(1, true); }
  else if (_bmStep === 1) { _bmSetStep(2, true); document.getElementById('bmScroll').scrollTop = 9999; }
  else { openBeneSuccess(); }
}
function openBeneSuccess() {
  _beneSheetShow('beneSuccess');
}
function closeBeneSuccess() {
  _beneSheetHideAll();
}
function bmSendMoney() {
  _beneSheetHideAll();
  if (typeof smGoToAmount === 'function')
    smGoToAmount('Byomkesh Bakshi','BB','linear-gradient(135deg,#f08a24,#e2231a)','••7654 · ICICI');
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
  showNav(true); showNavAi(true);
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
    var photo = b.photo || 'assets/blob-purple-v2.webp';
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

// Redesigned bene selection (Figma 6498-58790): recommended slide-to-pay cards
// + a full beneficiary list, sourced from BENS.
function _smBeneAcctLine(b) {
  var rk = b.rails ? Object.keys(b.rails)[0] : null;
  if (rk) {
    var rows = b.rails[rk].rows || [], bank = '', last4 = '';
    rows.forEach(function(r) {
      if (/bank/i.test(r[0]) && !bank) bank = r[1];
      if (/account no/i.test(r[0])) { var m = r[1].match(/(\d{3,4})\s*$/); if (m) last4 = m[1]; }
    });
    return (bank || 'Bank') + (last4 ? ' ' + last4 : '');
  }
  return b.loc || '';
}
function _smBeneSub(b) {
  var c = b.contact || [], email = '', phone = '';
  c.forEach(function(r) { if (/email/i.test(r[0])) email = r[1]; if (/phone/i.test(r[0])) phone = r[1]; });
  return email || phone || '';
}
/* Edit a recommended card's amount → open amount entry with it prefilled */
function smEditCardAmount(id) {
  if (typeof BENS === 'undefined') return;
  var b = BENS.filter(function(x){ return x.id === id; })[0];
  var card = document.querySelector('#smL2Rec .sm-l2-card[data-id="' + id + '"]');
  var usd = card ? (parseFloat(card.dataset.usd) || 0) : 0;
  if (b) smGoToAmount(b.name, b.ini, b.bg, _smBeneAcctLine(b));
  // Prefill the entered amount (smGoToAmount resets it to 0)
  smCurrencyFlipped = false;
  smIntStr = usd > 0 ? String(Math.round(usd)) : '';
  smCaretIdx = smIntStr.length;
  smCents = Math.round(usd * 100);
  smInrPaise = Math.round(usd * SM_EXRATE * 100);
  if (typeof smUpdateAmount === 'function') smUpdateAmount();
}

/* Beneficiary destination country → flag blob avatar (India saffron/green, US red/blue) */
function _benIsIndia(b) {
  var rails = (b && b.rails) ? Object.keys(b.rails) : [];
  return rails.some(function(r){ return r === 'India Bank' || r === 'UPI'; });
}
function _benBlob(b) {
  return _benIsIndia(b) ? 'assets/blob-india.webp' : 'assets/blob-us.webp';
}

function renderSmLanding2() {
  if (typeof BENS === 'undefined') return;
  // Reset scroll-driven header to its expanded state
  var _land = document.getElementById('sm-landing'); if (_land) _land.classList.remove('compact');
  var _lscr = document.querySelector('#sm-landing .sm-l2-scroll'); if (_lscr) _lscr.scrollTop = 0;
  var rec = document.getElementById('smL2Rec'), list = document.getElementById('smL2List');
  if (!rec || !list) return;
  var esc = (typeof _agEscape === 'function') ? _agEscape : function(s){ return String(s); };
  var editSvg = '<svg viewBox="0 0 256 256" fill="rgba(0,0,0,0.6)"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/></svg>';
  var caretSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  var arrowSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>';
  var recs = BENS.filter(function(b){ return b.fav; }).slice(0, 4);
  var payAmts = ['$1,500.00', '$900.00', '$2,000.00', '$650.00'];
  // Compose "$100,000.00" as small symbol · large integer · small decimals
  function amtHtml(s) {
    var m = /^(\D*)([\d,]+)(\.\d+)?$/.exec(s) || [];
    return '<span class="sm-l2-card-cur">' + (m[1] || '$') + '</span>' +
      '<span class="sm-l2-card-int">' + (m[2] || s) + '</span>' +
      '<span class="sm-l2-card-dec">' + (m[3] || '') + '</span>';
  }
  var recCtx = ['Usually paid in the first week', '11 payments in 3 months', 'Paid every month', 'Recently paid'];
  rec.innerHTML = recs.map(function(b, i) {
    var usdNum = parseFloat(payAmts[i % payAmts.length].replace(/[^0-9.]/g, '')) || 0;
    return '<div class="sm-l2-card" data-id="' + b.id + '" data-usd="' + usdNum + '" onclick="smEditCardAmount(\'' + b.id + '\')">' +
      '<div class="sm-l2-card-pat" aria-hidden="true"></div>' +
      '<div class="sm-l2-card-head">' +
        '<div class="sm-l2-card-ctx">' + esc(recCtx[i % recCtx.length]) + '</div>' +
        '<div class="sm-l2-card-name">' + esc(b.name) + '</div></div>' +
      '<div class="sm-l2-card-body">' +
        '<div class="sm-l2-card-payblock">' +
          '<div class="sm-l2-card-paylbl">You generally pay</div>' +
          '<div class="sm-l2-card-payrow"><span class="sm-l2-card-amt">' + amtHtml(payAmts[i % payAmts.length]) + '</span>' +
            '<button class="sm-l2-card-edit" onclick="event.stopPropagation();smEditCardAmount(\'' + b.id + '\')" aria-label="Edit amount">' + editSvg + '</button></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  // Reset the beneficiary filter to "All" and render the list
  _smBeneFilter = 'all';
  document.querySelectorAll('#smL2Filters .sm-l2-filter').forEach(function(c){ c.classList.toggle('sel', c.dataset.f === 'all'); });
  _smRenderBeneList('all');
}

/* ── All-beneficiaries list: filterable by country (All / India / USA) ── */
var _smBeneFilter = 'all';
function smGoToAmountById(id) {
  var b = BENS.filter(function(x){ return x.id === id; })[0];
  if (b) smGoToAmount(b.name, b.ini, b.bg, _smBeneAcctLine(b));
}
function _smRenderBeneList(filter) {
  var list = document.getElementById('smL2List');
  if (!list || typeof BENS === 'undefined') return;
  var esc = (typeof _agEscape === 'function') ? _agEscape : function(s){ return String(s); };
  var arrowSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>';
  var items = BENS.filter(function(b) {
    if (filter === 'india') return _benIsIndia(b);
    if (filter === 'us') return !_benIsIndia(b);
    return true;
  });
  if (filter === 'all') {
    // India-first ordering with the US beneficiary in 3rd
    var usIdx = -1;
    for (var i = 0; i < items.length; i++) { if (!_benIsIndia(items[i])) { usIdx = i; break; } }
    if (usIdx > -1 && usIdx !== 2) { var u = items.splice(usIdx, 1)[0]; items.splice(2, 0, u); }
  }
  if (!items.length) { list.innerHTML = '<p class="sm-l2-empty">No beneficiaries here yet.</p>'; return; }
  list.innerHTML = items.map(function(b) {
    var sub = (typeof _smBeneSub === 'function') ? _smBeneSub(b) : '';
    var blob = (typeof _benBlob === 'function') ? _benBlob(b) : '';
    return '<button class="sm-l2-row" type="button" data-id="' + b.id + '" onclick="smGoToAmountById(\'' + b.id + '\')">' +
      '<span class="sm-l2-av"><img class="sm-l2-av-blob" src="' + blob + '" alt="" loading="lazy" decoding="async"><span class="sm-l2-av-glass"></span><span class="sm-l2-av-txt">' + esc(b.ini) + '</span></span>' +
      '<span class="sm-l2-rowtxt"><span class="sm-l2-rowname">' + esc(b.name) + '</span>' +
        (sub ? '<span class="sm-l2-rowsub">' + esc(sub) + '</span>' : '') + '</span>' +
      '<span class="sm-l2-rowgo">' + arrowSvg + '</span></button>';
  }).join('');
}
function smFilterBenes(f, el) {
  _smBeneFilter = f;
  document.querySelectorAll('#smL2Filters .sm-l2-filter').forEach(function(c){ c.classList.remove('sel'); });
  if (el) el.classList.add('sel');
  _smRenderBeneList(f);
}

/* ── Send-money search screen (Figma 6494-57858) ── */
function openSmSearch() {
  var inp = document.getElementById('smSearchInput'); if (inp) inp.value = '';
  smSearchInputChange();
  document.getElementById('sm-search').className = 'screen on';
  document.getElementById('sm-landing').className = 'screen hl';
  // Focus synchronously inside the tap gesture so mobile raises the keyboard
  // immediately (a deferred focus() is ignored by iOS and needs a second tap).
  if (inp) inp.focus({ preventScroll: true });
}
function closeSmSearch() {
  var inp = document.getElementById('smSearchInput'); if (inp) inp.blur();
  document.getElementById('sm-search').className = 'screen hr';
  document.getElementById('sm-landing').className = 'screen on';
}
function smSearchInputChange() {
  if (typeof BENS === 'undefined') return;
  var inp = document.getElementById('smSearchInput');
  var empty = document.getElementById('smSearchEmpty');
  var out = document.getElementById('smSearchResults');
  if (!out) return;
  var esc = (typeof _agEscape === 'function') ? _agEscape : function(s){ return String(s); };
  var arrowSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>';
  var q = (inp && inp.value || '').toLowerCase().trim();
  if (!q) {
    if (empty) empty.hidden = false;
    out.innerHTML = '';
    return;
  }
  if (empty) empty.hidden = true;
  var matches = BENS.filter(function(b) {
    var hay = [b.name, b.alias, (typeof _smBeneSub === 'function' ? _smBeneSub(b) : ''),
      (typeof _smBeneAcctLine === 'function' ? _smBeneAcctLine(b) : '')].join(' ').toLowerCase();
    return hay.indexOf(q) !== -1;
  });
  if (!matches.length) {
    out.innerHTML = '<p class="sm-s-noresult">No matches for “' + esc(inp.value.trim()) + '”</p>';
    return;
  }
  out.innerHTML = matches.map(function(b) {
    var sub = (typeof _smBeneSub === 'function') ? _smBeneSub(b) : '';
    var blob = (typeof _benBlob === 'function') ? _benBlob(b) : '';
    return '<button class="sm-l2-row" type="button" data-id="' + b.id + '">' +
      '<span class="sm-l2-av"><img class="sm-l2-av-blob" src="' + blob + '" alt="" loading="lazy" decoding="async"><span class="sm-l2-av-glass"></span><span class="sm-l2-av-txt">' + esc(b.ini) + '</span></span>' +
      '<span class="sm-l2-rowtxt"><span class="sm-l2-rowname">' + esc(b.name) + '</span>' +
        (sub ? '<span class="sm-l2-rowsub">' + esc(sub) + '</span>' : '') + '</span>' +
      '<span class="sm-l2-rowgo">' + arrowSvg + '</span></button>';
  }).join('');
  out.querySelectorAll('.sm-l2-row').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var b = BENS.filter(function(x){ return x.id === btn.dataset.id; })[0];
      if (!b) return;
      if (inp) inp.blur();
      document.getElementById('sm-search').className = 'screen hl';
      smGoToAmount(b.name, b.ini, b.bg, _smBeneAcctLine(b));
    });
  });
}

/* Drag-to-confirm "Slide to pay" control */
function _bindSlideToPay(track, onConfirm) {
  var knob = track.querySelector('.sm-l2-slide-knob');
  var txt  = track.querySelector('.sm-l2-slide-txt');
  if (!knob) return;
  var dragging = false, moved = false, startX = 0, x = 0, pid = null;
  function cardId() { var c = track.closest('.sm-l2-card'); return c ? c.dataset.id : null; }
  function maxTravel() { return Math.max(0, track.clientWidth - knob.offsetWidth - 12); /* 6px pad each side */ }
  function setX(v) {
    var mt = maxTravel();
    x = Math.max(0, Math.min(mt, v));
    knob.style.transform = 'translate(' + x + 'px, -50%)';
    if (txt) txt.style.opacity = String(Math.max(0, 1 - x / (mt * 0.6)));
  }
  // Pointer Events + pointer capture: moves route to the knob even over the
  // horizontally-scrolling carousel, so the drag never gets hijacked.
  knob.addEventListener('pointerdown', function(e) {
    dragging = true; moved = false; pid = e.pointerId;
    startX = e.clientX - x;
    track.classList.remove('snap-back'); knob.classList.add('dragging');
    try { knob.setPointerCapture(pid); } catch (_) {}
    e.preventDefault();
  });
  knob.addEventListener('pointermove', function(e) {
    if (!dragging) return;
    var nx = e.clientX - startX;
    if (Math.abs(nx - x) > 2) moved = true;
    setX(nx);
  });
  function end() {
    if (!dragging) return;
    dragging = false; knob.classList.remove('dragging');
    try { if (pid != null) knob.releasePointerCapture(pid); } catch (_) {}
    var mt = maxTravel();
    var completed = mt > 0 && x >= mt * 0.9;
    track.classList.add('snap-back'); setX(0);
    // Only a fully-completed slide confirms here; partial drags just snap back.
    if (completed) onConfirm(cardId());
  }
  knob.addEventListener('pointerup', end);
  knob.addEventListener('pointercancel', end);
  // Pure tap (no drag occurred) also confirms, for accessibility / click users.
  track.addEventListener('click', function() {
    if (!moved && !dragging) onConfirm(cardId());
    moved = false;
  });
}

function showSendMoney(from) {
  haptic(8);
  smOrigin = from || _smOrigin || 'home';
  renderSmLanding2();
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
    showNav(true); showNavAi(true);
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
  showNav(false); // amount entry is a full-screen flow — no bottom tab bar (matches Figma)
  smRecipient = { name, initials, bg: bg||'linear-gradient(135deg,#46882b,#2d5a16)', account: account||'••7654 · HDFC Bank' };
  _smScheduled = false; // fresh transfer starts unscheduled
  _smPayMethod = 'Wire Transfer'; // default US method (collects an address)
  var _pmv = document.getElementById('smrPayMethodVal'); if (_pmv) _pmv.textContent = 'Wire Transfer';
  var _pmi = document.getElementById('smrPayMethodIco'); if (_pmi) _pmi.src = 'assets/pm-wire.webp';
  document.querySelectorAll('#pmList .pm-row').forEach(function(r){ r.classList.toggle('sel', r.dataset.m === 'Wire Transfer'); });
  smCents = 0;
  smCurrencyFlipped = false;
  smInrPaise = 0;
  smDollarInt = 0; smCentStr = ''; smInCents = false;
  smIntStr = ''; smCaretIdx = 0;
  smInrStr = ''; smInrCaretIdx = 0;
  smInrRupeeInt = 0; smInrPaisaStr = ''; smInrInCents = false;
  var _amtSec = document.querySelector('#sm-amount .sm2-amount-section');
  if (_amtSec) _amtSec.classList.remove('flipped');
  const switchBtn = document.getElementById('smSwitchBtn');
  if (switchBtn) switchBtn.classList.remove('flipped');
  // Update recipient UI — background matches landing bubble style (semi-transparent white)
  document.getElementById('smRecipientName').textContent     = name;
  document.getElementById('smRecipientInitials').textContent = initials;
  var _toHint = document.getElementById('smToHint');
  if (_toHint) _toHint.textContent = (name || '').split(' ')[0] + ' receives';
  document.getElementById('smRecipientAvatar').style.background = 'rgba(255,255,255,0.4)';
  // US flow (USD → USD, no INR conversion): single-card layout
  var _b = (typeof BENS !== 'undefined') ? BENS.filter(function(x){ return x.name === name; })[0] : null;
  _smUSMode = _b ? !_benIsIndia(_b) : false;
  var _amtScr = document.getElementById('sm-amount');
  if (_amtScr) _amtScr.classList.toggle('us-mode', _smUSMode);
  var _uf = document.getElementById('smausFromName'); if (_uf) _uf.textContent = (document.getElementById('smaFromName') || {}).textContent || 'USD Checking';
  var _ut = document.getElementById('smausToName'); if (_ut) _ut.textContent = name;
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
      if (_smUSMode) amountEl.classList.add('us-mode');
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
    if (_smUSMode) amountEl.classList.add('us-mode');
  }
}

function smUpdateAmount() {
  let usdInt, usdDec, inrInt, inrDec, hasAmount;

  if (smCurrencyFlipped) {
    // INR is the input currency → derive USD from it, keep both in sync
    smCents = Math.round((smInrPaise / 100) / SM_EXRATE * 100);
    hasAmount = smInrPaise > 0;
  } else {
    // USD is the input currency → derive INR from it, keep both in sync
    smInrPaise = Math.round((smCents / 100) * SM_EXRATE * 100);
    hasAmount = smCents > 0;
  }
  // Format both from the synced integer minor-unit amounts (no dropped paise)
  usdInt = Math.floor(smCents / 100).toLocaleString('en-US');
  usdDec = '.' + String(((smCents % 100) + 100) % 100).padStart(2, '0');
  inrInt = Math.floor(smInrPaise / 100).toLocaleString('en-IN');
  inrDec = '.' + String(((smInrPaise % 100) + 100) % 100).padStart(2, '0');

  // Decimal display rules:
  //  · Active input — the point is hidden while typing whole amounts and only
  //    appears once the user presses '.', with the caret sitting after it.
  //  · Computed side — show its decimals only when they carry value (non-zero
  //    minor units), so an idle field reads "$0" / "₹0" rather than "$0.00".
  var usdCompDec   = (smCents % 100 !== 0) ? usdDec : '';
  var inrCompDec   = (smInrPaise % 100 !== 0) ? inrDec : '';

  var usdIntEl = document.getElementById('smAmountInt');
  var inrIntEl = document.getElementById('smAmountInrInt');
  var usdDecEl = document.getElementById('smAmountDec');
  var inrDecEl = document.getElementById('smAmountInrDec');

  // Only the currency actually being edited replays a pop-in for its new digit.
  var animAt = function(field) { return (_smAnim && _smAnim.field === field) ? _smAnim.idx : -1; };
  var usdActiveDecH = smInCents    ? _smaRenderDec(smCentStr, animAt('usdDec'))    : '';
  var inrActiveDecH = smInrInCents ? _smaRenderDec(smInrPaisaStr, animAt('inrDec')) : '';

  // The active input currency shows the editable digits + caret; the other is computed.
  if (smCurrencyFlipped) {
    usdIntEl.textContent = usdInt;
    usdDecEl.textContent = usdCompDec;
    // INR is the active input — caret lives in the int, or in the dec once in cents.
    inrIntEl.innerHTML = _smaRenderInt(smInrStr, smInrCaretIdx, 'en-IN', smInrInCents, animAt('inrInt'));
    if (inrActiveDecH) inrDecEl.innerHTML = inrActiveDecH; else inrDecEl.textContent = '';
  } else {
    inrIntEl.textContent = inrInt;
    inrDecEl.textContent = inrCompDec;
    // USD is the active input — caret lives in the int, or in the dec once in cents.
    usdIntEl.innerHTML = _smaRenderInt(smIntStr, smCaretIdx, 'en-US', smInCents, animAt('usdInt'));
    if (usdActiveDecH) usdDecEl.innerHTML = usdActiveDecH; else usdDecEl.textContent = '';
  }

  // US single-card mirror of the USD field (always the active USD input)
  var usInt = document.getElementById('smAmountUsInt');
  if (usInt) {
    usInt.innerHTML = _smaRenderInt(smIntStr, smCaretIdx, 'en-US', smInCents, animAt('usdInt'));
    var usDec = document.getElementById('smAmountUsDec');
    if (usDec) { if (usdActiveDecH) usDec.innerHTML = usdActiveDecH; else usDec.textContent = ''; }
  }

  // Consume the pop-in so a later re-render (tap, conversion, switch) won't replay it.
  _smAnim = null;

  // Auto-shrink each amount so long values never wrap/overflow the card
  _smaFitAmount(document.getElementById('smAmountInt'), smCurrencyFlipped ? 40 : 64);
  _smaFitAmount(document.getElementById('smAmountInrInt'), smCurrencyFlipped ? 64 : 40);
  _smaFitAmount(usInt, 64);
  // The active-input card grows tall (120px) to hold the big amount; the computed one is compact (75px).
  var _fromCard = document.querySelector('#sm-amount .sma2-card--from');
  var _toCard   = document.querySelector('#sm-amount .sma2-card--to');
  if (_fromCard) _fromCard.classList.toggle('is-active', !smCurrencyFlipped);
  if (_toCard)   _toCard.classList.toggle('is-active', smCurrencyFlipped);

  const btn = document.getElementById('smSendBtn');
  // Always tappable — validation on tap surfaces the inline error (empty / over-limit)
  btn.disabled = false;
  // Label stays constant — only the disabled state changes
  if (btn.dataset.labelSet !== '1') {
    btn.innerHTML = 'Review payment <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    btn.dataset.labelSet = '1';
  }
  // Live validation: over-limit shows immediately; the empty message is gated to tap
  smRenderAmountError(false);

  // Zero fees on every transfer (domestic and international)
  var _feeTxt = document.getElementById('smInfoFeeTxt');
  if (_feeTxt) _feeTxt.innerHTML = '<b>Free transfer.</b> No fee charged.';
}

/* Scale an amount's font down by digit count so it never wraps or overflows */
function _smaFitAmount(intEl, base) {
  if (!intEl) return;
  var amt = intEl.closest('.sma2-amt'); if (!amt) return;
  base = base || 64;
  var n = (intEl.textContent || '').replace(/[^0-9]/g, '').length;
  var scale = n <= 5 ? 1 : n <= 6 ? 0.8 : n <= 7 ? 0.68 : n <= 8 ? 0.6 : n <= 10 ? 0.5 : 0.42;
  amt.style.setProperty('--amt-size', Math.round(base * scale) + 'px');
}

/* Render the USD integer as individual digit spans with commas, placing the
   blinking caret at caretIdx. Empty → a "0" placeholder with the caret after it. */
function _smaRenderInt(str, caretIdx, locale, noCaret, newIdx) {
  var caret = noCaret ? '' : '<span class="sma2-caret" aria-hidden="true"></span>';
  if (!str) return '<span class="sma2-amt-d" data-i="0">0</span>' + caret;
  var n = str.length, out = '';
  for (var i = 0; i < n; i++) {
    if (!noCaret && i === caretIdx) out += caret;
    var r = n - i; // digits to the right
    var comma = i > 0 && (locale === 'en-IN' ? (r >= 3 && (r - 3) % 2 === 0) : (r % 3 === 0));
    if (comma) out += '<span class="sma2-amt-comma">,</span>';
    var cls = 'sma2-amt-d' + (i === newIdx ? ' sma2-amt-d--in' : '');
    out += '<span class="' + cls + '" data-i="' + i + '">' + str[i] + '</span>';
  }
  if (!noCaret && caretIdx >= n) out += caret;
  return out;
}
/* Decimal fragment for the ACTIVE input while in cents mode: the point, the
   cent digits typed so far, then the caret sitting right after them. Each cent
   digit is its own span so the just-entered one (newIdx) can pop in. */
function _smaRenderDec(centStr, newIdx) {
  centStr = centStr || '';
  var out = '.';
  for (var i = 0; i < centStr.length; i++) {
    var cls = 'sma2-amt-dec-d' + (i === newIdx ? ' sma2-amt-d--in' : '');
    out += '<span class="' + cls + '">' + centStr[i] + '</span>';
  }
  return out + '<span class="sma2-caret" aria-hidden="true"></span>';
}
/* Place the caret where the user taps — activating that currency as the input.
   Tapping the other currency seeds it from the current converted value. */
function smaAmountClick(e, cur) {
  e.stopPropagation();
  cur = cur || 'usd';
  // US single-card field behaves like the USD field but hit-tests its own digits
  if (cur === 'us') {
    if (smIntStr === '') { return; }
    var uds = document.querySelectorAll('#smAmountUsInt .sma2-amt-d');
    var ux = e.clientX, ui = uds.length;
    for (var k = 0; k < uds.length; k++) {
      var ur = uds[k].getBoundingClientRect();
      if (ux < ur.left + ur.width / 2) { ui = k; break; }
    }
    smCaretIdx = ui; smUpdateAmount(); return;
  }
  var flip = (cur === 'inr');
  if (smCurrencyFlipped !== flip) {
    if (flip) {
      var rup = Math.floor(smInrPaise / 100);
      smInrStr = rup > 0 ? String(rup) : '';
      smInrCaretIdx = smInrStr.length; smInrPaisaStr = ''; smInrInCents = false;
    } else {
      var dol = Math.floor(smCents / 100);
      smIntStr = dol > 0 ? String(dol) : '';
      smCaretIdx = smIntStr.length; smCentStr = ''; smInCents = false;
    }
    smCurrencyFlipped = flip;
    smUpdateAmount();
  }
  var str = flip ? smInrStr : smIntStr;
  if (str === '') { return; }
  var digits = document.querySelectorAll((flip ? '#smAmountInrInt' : '#smAmountInt') + ' .sma2-amt-d');
  var x = e.clientX, idx = digits.length;
  for (var i = 0; i < digits.length; i++) {
    var dr = digits[i].getBoundingClientRect();
    if (x < dr.left + dr.width / 2) { idx = i; break; }
  }
  if (flip) smInrCaretIdx = idx; else smCaretIdx = idx;
  smUpdateAmount();
}

/* Crisp keypad tap: a short vibration + a soft click tone (fallback for iOS,
   which doesn't support the Vibration API) so typing feels tactile. */
function _smKeyFeedback(k) {
  haptic(k === 'del' ? [16, 12, 16] : 18);
  var ctx = (typeof _getAudioCtx === 'function') ? _getAudioCtx() : null;
  if (!ctx) return;
  try {
    var t = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(k === 'del' ? 200 : (k === '.' ? 260 : 340), t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.06);
  } catch (_) {}
}
function smKey(k) {
  _smKeyFeedback(k);
  // Snapshot lengths so we can tell whether a digit was actually added (and thus
  // should pop in) — vs. a no-op at the max-length cap, or a '.'/del press.
  var _typed = (k !== 'del' && k !== '.');
  var _pIntLen  = smCurrencyFlipped ? smInrStr.length : smIntStr.length;
  var _pCentLen = smCurrencyFlipped ? smInrPaisaStr.length : smCentStr.length;
  _smAnim = null;
  if (smCurrencyFlipped) {
    if (k === 'del') {
      if (smInrInCents && smInrPaisaStr.length > 0) {
        smInrPaisaStr = smInrPaisaStr.slice(0, -1);
      } else if (smInrInCents) {
        smInrInCents = false;
      } else if (smInrCaretIdx > 0) {
        smInrStr = smInrStr.slice(0, smInrCaretIdx - 1) + smInrStr.slice(smInrCaretIdx);
        smInrCaretIdx--;
      }
    } else if (k === '.') {
      if (!smInrInCents) smInrInCents = true;
    } else {
      if (smInrInCents) {
        if (smInrPaisaStr.length < 2) smInrPaisaStr += k;
      } else if (smInrStr.length < 8) {
        smInrStr = smInrStr.slice(0, smInrCaretIdx) + k + smInrStr.slice(smInrCaretIdx);
        smInrCaretIdx++;
      }
    }
    var _bi = smInrStr.length;
    smInrStr = smInrStr.replace(/^0+(?=\d)/, '');
    smInrCaretIdx = Math.max(0, smInrCaretIdx - (_bi - smInrStr.length));
    if (smInrCaretIdx > smInrStr.length) smInrCaretIdx = smInrStr.length;
    smInrRupeeInt = parseInt(smInrStr || '0', 10);
    const paisa = parseInt((smInrPaisaStr + '00').slice(0, 2));
    smInrPaise = smInrRupeeInt * 100 + paisa;
    smCents = Math.round((smInrPaise / 100) / SM_EXRATE * 100);
  } else {
    if (k === 'del') {
      if (smInCents && smCentStr.length > 0) {
        smCentStr = smCentStr.slice(0, -1);
      } else if (smInCents) {
        smInCents = false;
      } else if (smCaretIdx > 0) {
        smIntStr = smIntStr.slice(0, smCaretIdx - 1) + smIntStr.slice(smCaretIdx);
        smCaretIdx--;
      }
    } else if (k === '.') {
      if (!smInCents) smInCents = true;
    } else {
      if (smInCents) {
        if (smCentStr.length < 2) smCentStr += k;
      } else if (smIntStr.length < 6) {
        smIntStr = smIntStr.slice(0, smCaretIdx) + k + smIntStr.slice(smCaretIdx);
        smCaretIdx++;
      }
    }
    // strip leading zeros (keep caret aligned)
    var _b = smIntStr.length;
    smIntStr = smIntStr.replace(/^0+(?=\d)/, '');
    smCaretIdx = Math.max(0, smCaretIdx - (_b - smIntStr.length));
    if (smCaretIdx > smIntStr.length) smCaretIdx = smIntStr.length;
    smDollarInt = parseInt(smIntStr || '0', 10);
    const cents = parseInt((smCentStr + '00').slice(0, 2));
    smCents = smDollarInt * 100 + cents;
    smInrPaise = Math.round((smCents / 100) * SM_EXRATE * 100);
  }
  // Flag the freshly typed digit so only it plays the pop-in on this render.
  if (_typed) {
    if (smCurrencyFlipped) {
      if (smInrInCents && smInrPaisaStr.length > _pCentLen) _smAnim = { field: 'inrDec', idx: smInrPaisaStr.length - 1 };
      else if (!smInrInCents && smInrStr.length > _pIntLen) _smAnim = { field: 'inrInt', idx: smInrCaretIdx - 1 };
    } else {
      if (smInCents && smCentStr.length > _pCentLen) _smAnim = { field: 'usdDec', idx: smCentStr.length - 1 };
      else if (!smInCents && smIntStr.length > _pIntLen) _smAnim = { field: 'usdInt', idx: smCaretIdx - 1 };
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

  // Sync amounts and reset input state for the new primary currency
  if (smCurrencyFlipped) {
    smInrPaise = Math.round((smCents / 100) * SM_EXRATE * 100);
    smInrRupeeInt = Math.floor(smInrPaise / 100);
    smInrPaisaStr = String(smInrPaise % 100).padStart(2, '0').replace(/0+$/, '');
    smInrInCents = smInrPaisaStr.length > 0;
  } else {
    smCents = Math.round((smInrPaise / 100) / SM_EXRATE * 100);
    smDollarInt = Math.floor(smCents / 100);
    smCentStr = String(smCents % 100).padStart(2, '0').replace(/0+$/, '');
    smInCents = smCentStr.length > 0;
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

// Max transfer limit, defined on the INR (recipient) side — ₹15,00,000.
var SM_MAX_INR = 1500000;
function _smAmtErrEl() {
  // Error belongs to the field currently being edited (the active card).
  if (_smUSMode) return document.getElementById('smAmountUsErr');
  return document.getElementById(smCurrencyFlipped ? 'smAmountInrErr' : 'smAmountErr');
}
// 'empty' | 'over' | 'ok'
function smAmountStatus() {
  if (smCents === 0) return 'empty';
  if (!_smUSMode && (smInrPaise / 100) > SM_MAX_INR) return 'over';
  return 'ok';
}
/* Render the inline amount error. `showEmpty` gates the "enter an amount"
   message so it only appears after a Review attempt, not while at $0. */
function smRenderAmountError(showEmpty) {
  var a = document.getElementById('smAmountErr'); if (a) { a.hidden = true; }
  var b = document.getElementById('smAmountUsErr'); if (b) { b.hidden = true; }
  var c = document.getElementById('smAmountInrErr'); if (c) { c.hidden = true; }
  var err = _smAmtErrEl(); if (!err) return;
  var st = smAmountStatus();
  if (st === 'over') {
    // Show the limit in the currency of the field being edited.
    if (smCurrencyFlipped) {
      err.textContent = 'Amount exceeds the maximum of ₹' + SM_MAX_INR.toLocaleString('en-IN') + '.';
    } else {
      var maxUsd = Math.floor(SM_MAX_INR / SM_EXRATE);
      err.textContent = 'Amount exceeds the maximum of $' + maxUsd.toLocaleString('en-US') + '.';
    }
    err.hidden = false;
  } else if (st === 'empty' && showEmpty) {
    err.textContent = 'Enter an amount to proceed';
    err.hidden = false;
  }
}
function smGoToReview() {
  var _st = smAmountStatus();
  if (_st !== 'ok') { smRenderAmountError(true); return; }
  const fmtD   = (smCents / 100).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const fmtINR = (smInrPaise / 100).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });

  const firstName = smRecipient.name.split(' ')[0];
  document.getElementById('smReviewSending').textContent       = '$' + fmtD;
  document.getElementById('smReviewRecipientName').textContent = smRecipient.name;
  document.getElementById('smReviewRecipName2').textContent    = firstName;
  // Recipient account (single line — strip any leading dot/separator noise)
  var acct = (smRecipient.account || '').replace(/^[•·\s]+/, '').trim();
  document.getElementById('smReviewRecipAcct').textContent = acct;

  // US (USD→USD, wire) vs India (USD→INR) review variant
  var reviewEl = document.getElementById('sm-review');
  reviewEl.classList.toggle('us-mode', _smUSMode);
  var _arr = document.getElementById('smReviewArrival');
  if (_smUSMode) {
    // Zero fees — recipient gets the full amount
    document.getElementById('smReviewReceives').textContent = '$' + fmtD;
    if (_arr) _arr.textContent = 'Today, 9:44 AM PST';
  } else {
    document.getElementById('smReviewReceives').textContent = '₹' + fmtINR;
    if (_arr) _arr.textContent = 'Today, 9:44 AM IST';
  }

  // Scheduled variant: recurrence rows + "Confirm and schedule" action
  reviewEl.classList.toggle('sched-mode', _smScheduled);
  var _cbtn = document.getElementById('smrConfirmBtn');
  var _clbl = _cbtn && _cbtn.querySelector('.smr-confirm-lbl');
  if (_smScheduled) {
    var _freq = ((document.getElementById('schedFreqVal') || {}).textContent || 'Does not repeat').trim();
    var _date = ((document.getElementById('schedDateVal') || {}).textContent || '').trim();
    var _l1 = document.getElementById('smSchedForLine1');
    var _l2 = document.getElementById('smSchedForLine2');
    if (_freq === 'Does not repeat') {
      if (_l1) _l1.textContent = 'One-time';
      if (_l2) _l2.textContent = _date ? 'on ' + _date : '';
    } else {
      if (_l1) _l1.textContent = _freq;
      if (_l2) _l2.textContent = _date ? 'from ' + _date : '';
    }
    var _ends = ((document.getElementById('schedEndsVal') || {}).textContent || 'Does not end').trim();
    var _endsRow = document.getElementById('smSchedEndsRow');
    if (_ends === 'Does not end' || !_ends) {
      if (_endsRow) _endsRow.style.display = 'none';
    } else {
      if (_endsRow) _endsRow.style.display = '';
      var _eo = document.getElementById('smSchedEndsOn'); if (_eo) _eo.textContent = _ends.replace(/^Ends on\s*/, '');
    }
    if (_clbl) _clbl.textContent = 'Confirm and schedule';
    if (_cbtn) _cbtn.onclick = smConfirmScheduled;
  } else {
    if (_clbl) _clbl.textContent = 'Confirm and pay';
    if (_cbtn) _cbtn.onclick = smConfirmReview;
  }

  // From account mirrors the selected funding account on the amount screen
  var fromName = document.getElementById(_smUSMode ? 'smausFromName' : 'smaFromName');
  if (fromName) document.getElementById('smReviewFrom').textContent = fromName.textContent;
  // Reset any note from a previous review
  var _nr = document.getElementById('smrNoteRow'); if (_nr) _nr.style.display = 'none';
  var _nv = document.getElementById('smrNoteVal'); if (_nv) _nv.textContent = '';

  var amountEl = document.getElementById('sm-amount');
  var reviewEl = document.getElementById('sm-review');
  var card     = reviewEl.querySelector('.smr-card-wrap');
  var purpose  = reviewEl.querySelector('.smr-purpose-wrap');
  var bottom   = reviewEl.querySelector('.smr-bottom');
  var spring   = 'cubic-bezier(0.16,1,0.3,1)';

  // Show review on top of the amount screen (preserve the us-mode variant flag)
  reviewEl.style.cssText = 'transition:none;opacity:1;z-index:3';
  reviewEl.className = 'screen on' + (_smUSMode ? ' us-mode' : '') + (_smScheduled ? ' sched-mode' : '');

  // Stage content offset, then slide up in sequence
  [card, purpose].forEach(function(el, i) {
    if (el) el.style.cssText = 'transition:none;opacity:0;transform:translateY(40px)';
  });
  if (bottom) bottom.style.cssText = 'transition:none;opacity:0;transform:translateY(60px)';

  requestAnimationFrame(function() { requestAnimationFrame(function() {
    [card, purpose].forEach(function(el, i) {
      if (!el) return;
      var d = (0.04 + i * 0.06).toFixed(2) + 's';
      el.style.cssText = 'transition:opacity 0.32s ease ' + d + ',transform 0.42s ' + spring + ' ' + d + ';opacity:1;transform:translateY(0)';
    });
    if (bottom) bottom.style.cssText = 'transition:opacity 0.32s ease 0.16s,transform 0.44s ' + spring + ' 0.16s;opacity:1;transform:translateY(0)';
  }); });

  setTimeout(function() {
    reviewEl.style.cssText = '';
    amountEl.className      = 'screen hl';
    [card, purpose, bottom].forEach(function(el) { if (el) el.style.cssText = ''; });
  }, 640);
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
  // Receipt-unfurl entrance (shared with #sm-success)
  successEl.classList.remove('sms-unfurl');
  void successEl.offsetWidth; // force reflow so the animation replays
  if(sucBottom) sucBottom.style.cssText='transition:none;opacity:0;transform:translateY(40px)';
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    successEl.classList.add('sms-unfurl');
    if(sucBottom) sucBottom.style.cssText='transition:opacity 0.3s ease 0.85s,transform 0.42s '+spring+' 0.85s;opacity:1;transform:translateY(0)';
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
  // Scale the coin away — no rotation, so the running flip can't fight it
  coin.style.animation = 'none';
  coin.style.transition = 'transform 0.26s var(--ease-out), opacity 0.20s ease';
  coin.style.transform = 'scale(0.7)';
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
  }, 700);

  // State 2→3: step 3 done, step 4 final (funds arrived)
  setTimeout(function() {
    var s2 = document.querySelector('#sm-progress .smp-stepper-s2');
    var s3 = document.querySelector('#sm-progress .smp-stepper-s3');
    if (!s2 || !s3) return;
    s2.style.opacity = '0'; s2.style.transform = 'translateY(-6px)'; s2.style.pointerEvents = 'none';
    s3.style.opacity = '1'; s3.style.transform = 'translateY(0)'; s3.style.pointerEvents = 'all';
    s3.classList.add('smp-state-active');
  }, 1500);

  // Coin → check, once all steps have landed
  setTimeout(function() { smpShowResult('success'); }, 2150);

  // Hero wipes green just as the check settles, label crossfades after
  setTimeout(function() {
    var hero = document.getElementById('smpHero');
    if (hero) hero.classList.add('success-anim');
    var lbl = document.querySelector('#sm-progress .smp-hero-lbl');
    if (lbl) {
      setTimeout(function() {
        lbl.style.transition = 'opacity 0.18s ease';
        lbl.style.opacity = '0';
        setTimeout(function() {
          lbl.style.color = 'var(--brand-primary)';
          lbl.textContent = 'Successfully transferred';
          lbl.style.transition = 'opacity 0.28s ease';
          lbl.style.opacity = '1';
        }, 200);
      }, 350);
    }
    var doneBtn = document.querySelector('#smpBottom .smp-done-btn');
    if (doneBtn) doneBtn.onclick = function() { smDone(); };
    document.querySelectorAll('.smp-sim-btn').forEach(function(b) { b.style.display = 'none'; });
  }, 2650);
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

/* Progress-driven blur reveal for the transfer-screen image (ported from the
   ai-chat-image-generation component). A backdrop-blur overlay sweeps top→bottom
   with a soft masked edge as the image "loads", then fades out when complete. */
function smpLoadReveal(id, duration, onComplete) {
  var el = document.getElementById(id);
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.style.opacity = '0';
    if (onComplete) setTimeout(onComplete, 300);
    return;
  }
  duration = duration || 2200;
  el.style.transition = 'none';
  el.style.opacity = '1';
  var start = null;
  function frame(ts) {
    if (start === null) start = ts;
    var p = Math.min(100, (ts - start) / duration * 100);
    var q = 100 - p; // clearing line rises from the bottom → blur retreats upward
    el.style.clipPath = 'polygon(0 0, 100% 0, 100% ' + q + '%, 0 ' + q + '%)';
    var mask = p === 0
      ? 'linear-gradient(to bottom, black 0%, black 105%)'
      : 'linear-gradient(to bottom, black ' + (q - 5) + '%, black ' + q + '%, transparent ' + (q + 5) + '%)';
    el.style.webkitMaskImage = mask;
    el.style.maskImage = mask;
    if (p < 100) { requestAnimationFrame(frame); }
    else { el.style.transition = 'opacity 400ms ease'; el.style.opacity = '0'; if (onComplete) onComplete(); }
  }
  requestAnimationFrame(frame);
}

/* Remove the tile-construction overlay and restore the base building image */
function _smpClearTiles(scr) {
  scr = scr || document.getElementById('sm-progress');
  if (!scr) return;
  if (scr._smpTileRAF) { cancelAnimationFrame(scr._smpTileRAF); scr._smpTileRAF = null; }
  var host = scr.querySelector('.smp2-tiles');
  if (host) host.remove();
  var base = scr.querySelector('.smp2-building-img');
  if (base) base.style.opacity = '';
}

/* Duration (seconds) of the tile-construction reveal — fixed at 15s */
var smpTileDuration = 15;

/* Tile-construction reveal: the Victoria Memorial is rebuilt tile-by-tile from the
   bottom up, with a soft per-tile pixel flicker. Nothing shows at the start. */
function smpTileReveal(durationSec, onComplete) {
  var scr = document.getElementById('sm-progress');
  var bld = scr && scr.querySelector('.smp2-building');
  var base = bld && bld.querySelector('.smp2-building-img');
  if (!bld || !base) { if (onComplete) onComplete(); return; }
  _smpClearTiles(scr);

  // Reduced motion: skip the animation, just show the image
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    base.style.opacity = '';
    if (onComplete) setTimeout(onComplete, 300);
    return;
  }

  var W = bld.clientWidth, H = bld.clientHeight;
  var cols = 16, rows = 11;
  var url = getComputedStyle(base).backgroundImage; // url("…loading.webp")
  base.style.opacity = '0'; // hide the memorial completely at the start

  var host = document.createElement('div');
  host.className = 'smp2-tiles';
  var tiles = [];
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var t = document.createElement('div');
      t.className = 'smp2-tile';
      t.style.left = (c / cols * 100) + '%';
      t.style.top = (r / rows * 100) + '%';
      t.style.width = (100 / cols) + '%';
      t.style.height = (100 / rows) + '%';
      t.style.backgroundImage = url;
      t.style.backgroundSize = W + 'px ' + H + 'px';
      t.style.backgroundPosition = (-c * W / cols) + 'px ' + (-r * H / rows) + 'px';
      t.style.opacity = '0';
      host.appendChild(t);
      tiles.push({ el: t, r: r, c: c });
    }
  }
  bld.appendChild(host);

  var dur = (durationSec || 5) * 1000;
  var start = null;
  function frame(ts) {
    if (start === null) start = ts;
    var elapsed = ts - start;
    var p = Math.min(1, elapsed / dur);      // overall progress 0→1
    var secs = elapsed / 1000;
    for (var i = 0; i < tiles.length; i++) {
      var o = tiles[i];
      var rowFromBottom = (rows - 1 - o.r) / (rows - 1);  // 0 bottom → 1 top
      var localStart = rowFromBottom * 0.8;               // bottom rows begin first
      var localDur = 0.16 + ((o.c * 7 + o.r * 3) % 5) * 0.02;
      var tp = (p - localStart) / localDur;
      var op = tp <= 0 ? 0 : (tp >= 1 ? 1 : tp);
      if (op > 0 && op < 1) {
        // pixel flicker while the tile is materialising
        op *= 0.7 + 0.3 * Math.abs(Math.sin(secs * 9 + (o.r * 1.7 + o.c * 0.9)));
      }
      o.el.style.opacity = String(op);
    }
    if (p < 1) { scr._smpTileRAF = requestAnimationFrame(frame); }
    else {
      for (var j = 0; j < tiles.length; j++) tiles[j].el.style.opacity = '1';
      scr._smpTileRAF = null;
      if (onComplete) onComplete();
    }
  }
  scr._smpTileRAF = requestAnimationFrame(frame);
}

/* Morph the in-progress screen into the success state in place — no page swap.
   The image switches instantly, the label + colour change, the check fades in
   from the top, and the button row becomes Done + Share. */
/* Build the expanded transaction-details card for the success screen (Figma 6555-40802) */
function smpBuildDetailsHTML() {
  var esc = (typeof _agEscape === 'function') ? _agEscape : function(s){ return String(s); };
  var name = (smRecipient && smRecipient.name) || 'Rohan Rathod';
  var first = name.split(' ')[0];
  var acct = ((smRecipient && smRecipient.account) || 'HDFC 8978').replace(/^[•·\s]+/, '').trim();
  var fromName = (document.getElementById('smaFromName') || {}).textContent || 'USD Checking';
  var usd = '$' + (smCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var inr = '₹' + (smInrPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Note carried from the review "Add a note" flow
  var noteRow = document.getElementById('smrNoteRow');
  var noteTxt = (noteRow && noteRow.style.display !== 'none') ? (document.getElementById('smrNoteVal') || {}).textContent : '';
  var noteHtml = noteTxt
    ? '<div class="smpd-row"><span class="smpd-lbl">Notes</span><span class="smpd-val smpd-note">' + esc(noteTxt) + '</span></div>'
    : '';
  var chev = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6l3-3 3 3M5 10l3 3 3-3"/></svg>';
  var chk = '<svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg>';
  return '' +
  '<div class="smpd-wrap">' +
    '<div class="smpd-card">' +
      '<div class="smpd-row"><span class="smpd-lbl">From</span><span class="smpd-val">' + esc(fromName) + '</span></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">To</span><div class="smpd-valstack"><span class="smpd-val">' + esc(name) + '</span><span class="smpd-sub">' + esc(acct) + '</span></div></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">Sending</span><span class="smpd-val">' + usd + '</span></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">Banyan’s fees</span><span class="smpd-fee"><span class="smpd-free">Free</span><span class="smpd-strike">$2.00</span></span></div>' +
      noteHtml +
      '<div class="smpd-divider"></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">Exchange rate</span><span class="smpd-inline"><img class="smpd-g" src="assets/f7ac8e68-bab0-4a2e-acc1-a376656b83aa.svg" alt=""><span class="smpd-val">$1 = ₹91.78</span></span></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">Payment method</span><span class="smpd-inline"><span class="ico" style="--ico:url(\'Icons/GlobeHemisphereWest.svg\');--sz:16px;color:#322d0f"></span><span class="smpd-val">International</span></span></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">' + esc(first) + ' receives</span><span class="smpd-val">' + inr + '</span></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">Category</span><span class="smpd-cat">Family' + chev + '</span></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">Payment purpose</span><span class="smpd-val">Family</span></div>' +
      '<div class="smpd-divider"></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">Created on</span><span class="smpd-val">Today, 9:44 AM IST</span></div>' +
      '<div class="smpd-row"><span class="smpd-lbl">Transaction ID</span><span class="smpd-val">#0976543456787</span></div>' +
    '</div>' +
    '<div class="smpd-status">' +
      '<button class="smpd-status-toggle" type="button" onclick="this.parentElement.classList.toggle(\'open\')">' +
        '<span class="smpd-status-swap">' + chev + '</span>' +
        '<span class="smpd-status-lbl">Show 3 done statuses</span>' +
        '<span class="smpd-status-time">2 MINS AGO</span>' +
      '</button>' +
      '<div class="smpd-status-extra">' +
        '<div class="smpd-status-item"><span class="smpd-status-dot done">' + chk + '</span><span class="smpd-status-name">Payment initiated</span><span class="smpd-status-time">2 MINS AGO</span></div>' +
        '<div class="smpd-status-item"><span class="smpd-status-dot done">' + chk + '</span><span class="smpd-status-name">Transfer processed</span><span class="smpd-status-time">1 MIN AGO</span></div>' +
        '<div class="smpd-status-item"><span class="smpd-status-dot done">' + chk + '</span><span class="smpd-status-name">Sent to ' + esc(first) + '’s bank</span><span class="smpd-status-time">1 MIN AGO</span></div>' +
      '</div>' +
      '<div class="smpd-status-item smpd-status-last"><span class="smpd-status-dot done">' + chk + '</span><span class="smpd-status-name">Funds in ' + esc(first) + '’s account</span><span class="smpd-status-time">IN 1 MIN</span></div>' +
    '</div>' +
  '</div>';
}

function smpMorphToSuccess() {
  var scr = document.getElementById('sm-progress');
  if (!scr || scr._smpSucceeded) return;
  scr._smpSucceeded = true;
  setSbLight(false); // keep the dark status bar over the light success background

  // Clear the tile-construction overlay and restore the base image (now success)
  _smpClearTiles(scr);
  scr.classList.add('smp-done-state'); // hide the dev speed control
  // Background stays put (image + bg swap instantly, no motion)
  var img = scr.querySelector('.smp2-building-img');
  if (img) { img.classList.remove('smp2-building-img--loading'); img.classList.add('smp2-building-img--success'); }
  var bg = scr.querySelector('.smp2-bg');
  if (bg) { bg.classList.remove('smp2-bg-gold'); bg.classList.add('smp2-bg-green'); }

  // Swap the "more details" body to the expanded transaction card (Figma 6555-40802)
  var moreP = document.getElementById('smpMoreP');
  if (moreP) moreP.innerHTML = smpBuildDetailsHTML();

  // Content (label / amount / eta / check) — mutate the in-progress copy to success
  var inner = scr.querySelector('.smp2-scroll-inner');
  function applyContent() {
    var lbl = scr.querySelector('.smp2-lbl');
    if (lbl) { lbl.textContent = 'Successfully transferred'; lbl.classList.remove('smp2-lbl-gold'); lbl.classList.add('smp2-lbl-green'); }
    var eta = scr.querySelector('.smp2-eta');
    if (eta) {
      var ico = eta.querySelector('.ico'); if (ico) ico.style.display = 'none';
      var t = eta.querySelector('.smp2-eta-txt'); if (t) t.textContent = 'Completed in 3 minutes';
    }
    var hero = scr.querySelector('.smp2-hero');
    if (hero && !hero.querySelector('.smp2-morph-check')) {
      hero.style.position = 'relative';
      var chk = document.createElement('div');
      chk.className = 'sms2-check smp2-morph-check in'; // settled in-place; carried by the content fade
      chk.innerHTML = '<img decoding="async" src="assets/smp-check.webp" alt="">';
      hero.insertBefore(chk, hero.firstChild);
    }
  }

  if (!inner || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyContent();
  } else {
    // Old content drops down and fades out…
    inner.style.transition = 'transform 0.26s cubic-bezier(0.4,0,1,1), opacity 0.22s ease';
    inner.style.transform = 'translateY(28px)';
    inner.style.opacity = '0';
    setTimeout(function() {
      applyContent();
      // …then the new content fades in from below
      inner.style.transition = 'none';
      inner.style.transform = 'translateY(28px)';
      inner.style.opacity = '0';
      requestAnimationFrame(function() { requestAnimationFrame(function() {
        inner.style.transition = 'transform 0.46s cubic-bezier(0.16,1,0.3,1), opacity 0.36s ease';
        inner.style.transform = 'translateY(0)';
        inner.style.opacity = '1';
        setTimeout(function() { inner.style.transition = ''; inner.style.transform = ''; inner.style.opacity = ''; }, 500);
      }); });
    }, 280);
  }

  // Button row → Done + Share, animated: slide the old button down and out,
  // swap contents, then slide the new pair back up from the bottom.
  var bottom = document.getElementById('smpBottom');
  if (bottom) {
    var newHTML =
      '<button class="smp2-btn smp2-btn-secondary" onclick="smDone()">Done</button>' +
      '<button class="smp2-btn smp2-btn-primary smp2-btn-share">' +
      '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="15" cy="4" r="2"/><circle cx="5" cy="10" r="2"/><circle cx="15" cy="16" r="2"/><line x1="7" y1="11" x2="13" y2="15"/><line x1="7" y1="9" x2="13" y2="5"/></svg>Share</button>';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bottom.classList.add('smp2-bottom-2'); bottom.innerHTML = newHTML;
    } else {
      bottom.style.transition = 'transform 0.26s cubic-bezier(0.4,0,1,1), opacity 0.2s ease';
      bottom.style.transform = 'translateY(160%)';
      bottom.style.opacity = '0';
      setTimeout(function() {
        bottom.classList.add('smp2-bottom-2');
        bottom.innerHTML = newHTML;
        bottom.style.transition = 'none';
        bottom.style.transform = 'translateY(160%)';
        bottom.style.opacity = '1';
        requestAnimationFrame(function() { requestAnimationFrame(function() {
          bottom.style.transition = 'transform 0.44s cubic-bezier(0.16,1,0.3,1)';
          bottom.style.transform = 'translateY(0)';
          setTimeout(function() { bottom.style.transition = ''; bottom.style.transform = ''; }, 480);
        }); });
      }, 280);
    }
  }
}

/* Restore the in-progress screen to its loading state (before each new transfer) */
function smpResetProgressVisual() {
  var scr = document.getElementById('sm-progress');
  if (!scr) return;
  _smpClearTiles(scr);
  scr.classList.remove('smp-done-state');
  scr._smpSucceeded = false;
  var _inner = scr.querySelector('.smp2-scroll-inner');
  if (_inner) { _inner.style.transition = ''; _inner.style.transform = ''; _inner.style.opacity = ''; }
  var img = scr.querySelector('.smp2-building-img');
  if (img) { img.classList.remove('smp2-building-img--success'); img.classList.add('smp2-building-img--loading'); }
  var bg = scr.querySelector('.smp2-bg');
  if (bg) { bg.classList.remove('smp2-bg-green'); bg.classList.add('smp2-bg-gold'); }
  var lbl = scr.querySelector('.smp2-lbl');
  if (lbl) { lbl.classList.remove('smp2-lbl-green'); lbl.classList.add('smp2-lbl-gold'); _smpShimmerLabel(lbl); }
  var eta = scr.querySelector('.smp2-eta');
  if (eta) {
    var ico = eta.querySelector('.ico'); if (ico) ico.style.display = '';
    var t = eta.querySelector('.smp2-eta-txt'); if (t) t.textContent = 'Estimated arrival: 9:44 AM IST';
  }
  var chk = scr.querySelector('.smp2-morph-check'); if (chk) chk.remove();
  var bottom = document.getElementById('smpBottom');
  if (bottom) { bottom.classList.remove('smp2-bottom-2'); bottom.innerHTML = '<button class="smp2-btn smp2-btn-primary" onclick="smpMorphToSuccess()">Done</button>'; }
}

/* FROM account picker (amount screen) — bottom sheet to change the source space */
function smaOpenFromSheet() {
  var list = document.getElementById('smaFromList');
  if (!list) return;
  var curName = (document.getElementById('smaFromName') || {}).textContent;
  var spaces = (typeof _AG_SPACES !== 'undefined') ? _AG_SPACES : [];
  list.innerHTML = spaces.map(function(s, i) {
    var sel = s.name === curName ? ' is-sel' : '';
    return '<button class="sma-from-row' + sel + '" type="button" onclick="smaPickFrom(' + i + ')">' +
      '<span class="sma-from-av"><img loading="lazy" decoding="async" src="' + s.av + '" alt=""></span>' +
      '<span class="sma-from-info"><span class="sma-from-name">' + _agEscape(s.name) + '</span>' +
      '<span class="sma-from-sub">•• ' + s.last4 + '</span></span>' +
      '<span class="sma-from-bal">' + s.bal + '</span>' +
      '</button>';
  }).join('');
  var scr = document.getElementById('sm-amount');
  if (scr) scr.classList.add('sma-fromsheet-open');
}
function smaCloseFromSheet() {
  var scr = document.getElementById('sm-amount');
  if (scr) scr.classList.remove('sma-fromsheet-open');
}
function smaPickFrom(i) {
  var spaces = (typeof _AG_SPACES !== 'undefined') ? _AG_SPACES : [];
  var s = spaces[i];
  if (!s) return;
  var n = document.getElementById('smaFromName'); if (n) n.textContent = s.name;
  haptic(6);
  smaCloseFromSheet();
}

/* Home transactions Recent/Upcoming segmented toggle */
function homeTxTab(btn, tab) {
  var seg = btn.parentElement;
  seg.querySelectorAll('.home-txc-seg-btn').forEach(function(b) { b.classList.toggle('on', b === btn); });
}

/* Show/hide the "more details" block on the redesigned progress/success screens */
function smpToggleMore(btn) {
  var body = btn.nextElementSibling;
  if (!body) return;
  var open = body.classList.toggle('open');
  btn.classList.toggle('open', open);
  var lbl = btn.querySelector('span');
  if (lbl) lbl.textContent = open ? 'Hide details' : 'Show more details';
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

function smGoToProgress(durationSec) {
  var _revealDur = (typeof durationSec === 'number' && durationSec > 0) ? durationSec : smpTileDuration;
  setSbLight(false); // dark iOS status bar over the light progress background
  // US transfers use the "rush" background art on both progress and success
  var _pEl = document.getElementById('sm-progress'); if (_pEl) _pEl.classList.toggle('us-mode', _smUSMode);
  var _sEl = document.getElementById('sm-success');  if (_sEl) _sEl.classList.toggle('us-mode', _smUSMode);
  const dollars = smCents / 100;
  const intPart = Math.floor(dollars).toLocaleString('en-US');
  const decPart = '.' + String(Math.round((dollars % 1) * 100)).padStart(2,'0');
  const fmtD    = dollars.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const firstName = smRecipient.name.split(' ')[0];

  var _set = function(id, t){ var e = document.getElementById(id); if (e) e.textContent = t; };
  _set('smProgressInt', intPart);
  _set('smProgressDec', decPart);
  _set('smProgressAccAmt', '$' + fmtD);
  _set('smProgressRecip', smRecipient.name);
  _set('smProgressAcct', smRecipient.account || '••7654 · HDFC Bank');
  _set('smProgressRecipStep', 'Funds in ' + firstName + "'s account");
  // Personalize every stepper label — the template HTML hardcodes Rohan/HDFC.
  // Tokenize each label once (data-tpl), then fill from the live recipient.
  var bankName = ((smRecipient.account || '').split('·')[1] || 'HDFC Bank').trim();
  document.querySelectorAll('#sm-progress .smp-step-name, #sm-progress .smp-step-sub').forEach(function(el) {
    if (!el.dataset.tpl) {
      el.dataset.tpl = el.textContent.replace(/Rohan/g, '{N}').replace(/HDFC Bank/g, '{B}');
    }
    if (el.dataset.tpl.indexOf('{') !== -1) {
      el.textContent = el.dataset.tpl.replace(/\{N\}/g, firstName).replace(/\{B\}/g, bankName);
    }
  });
  // Reset progress screen: step-1 state, collapse txn details, restore coin
  var _accTxn = document.getElementById('smAccTxn'); if (_accTxn) _accTxn.classList.remove('smp-acc-open');
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
  document.querySelector('.smp-sim-btn:not(.fail)') && (document.querySelector('.smp-sim-btn:not(.fail)').innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,12 9,17 20,7"/></svg>');
  document.querySelector('.smp-sim-btn.fail') && (document.querySelector('.smp-sim-btn.fail').innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>');
  var coin = document.getElementById('smpCoin');
  var icon = document.getElementById('smpResultIcon');
  if (coin) { coin.style.cssText = ''; }
  if (icon) { icon.className = 'smp-result-icon'; icon.innerHTML = ''; }
  // Reset hero background and label
  var hero = document.getElementById('smpHero');
  if (hero) { hero.style.transition = 'none'; hero.classList.remove('success-anim'); }
  var lbl = document.querySelector('#sm-progress .smp-hero-lbl');
  if (lbl) { lbl.style.cssText = ''; lbl.textContent = 'Transfer in progress'; }
  var doneBtn = document.querySelector('#smpBottom .smp-done-btn');
  if (doneBtn) doneBtn.onclick = function() { smGoToSuccess(); };

  var reviewEl   = document.getElementById('sm-review');
  var progressEl = document.getElementById('sm-progress');
  var revCard    = document.querySelector('#sm-review .smr-card');
  var prgCard    = document.querySelector('#sm-progress .smp-card');
  var spring     = 'cubic-bezier(0.16,1,0.3,1)';

  // FLIP: measure the review card's position before any visual change
  var revRect = revCard.getBoundingClientRect();

  // Snap progress on top; the shared botanical bg keeps the scene continuous
  progressEl.style.cssText = 'transition:none;opacity:1;z-index:3';
  progressEl.className = 'screen on' + (_smUSMode ? ' us-mode' : '');
  smpResetProgressVisual();
  var _lb = document.getElementById('smpLoadBlurP'); if (_lb) _lb.style.display = 'none';
  setTimeout(function() {
    // Slow tile-by-tile construction of the memorial from the bottom up
    smpTileReveal(_revealDur, function() {
      // Loader finished → morph this screen into success in place (no page swap)
      if (document.getElementById('sm-progress').classList.contains('on')) smpMorphToSuccess();
    });
  }, 80);
  // The progress screen owns its own entrance (tile reveal); just park the
  // review screen underneath so back-navigation stays consistent.
  setTimeout(function() {
    progressEl.style.cssText = '';
    reviewEl.style.transition = 'none';
    reviewEl.className = 'screen hl';
    requestAnimationFrame(function() { reviewEl.style.transition = ''; });
  }, 120);
}

// Shared AudioContext, unlocked on the first user gesture (autoplay policy)
let _audioCtx = null;
function _getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { return null; }
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
// Prime/resume the context on the first tap so later playback isn't blocked
document.addEventListener('pointerdown', function primeAudio() {
  _getAudioCtx();
  document.removeEventListener('pointerdown', primeAudio);
}, { once: true });

function _playSuccessTones(ctx) {
  try {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    const base = ctx.currentTime + 0.02;
    notes.forEach(function(freq, i) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = base + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.start(t); osc.stop(t + 0.35);
    });
  } catch(e) {}
}
function playSuccessSound() {
  const ctx = _getAudioCtx();
  if (!ctx) return;
  // resume() is async on iOS — wait for the context to actually be running
  // before scheduling notes, otherwise they're dropped silently.
  if (ctx.state === 'suspended' && ctx.resume) {
    ctx.resume().then(function() { _playSuccessTones(ctx); })
                .catch(function() { _playSuccessTones(ctx); });
  } else {
    _playSuccessTones(ctx);
  }
}

function smGoToSuccess() {
  playSuccessSound();
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
  var sucScreen = document.getElementById('sm-success');
  sucScreen.className  = 'screen on' + (_smUSMode ? ' us-mode' : '');

  // Receipt-unfurl entrance: reset, then re-trigger on next frame
  sucScreen.classList.remove('sms-unfurl');
  var sucScroll = sucScreen.querySelector('.sms-scroll');
  if (sucScroll) sucScroll.scrollTop = 0;
  void sucScreen.offsetWidth; // force reflow so the animation replays
  requestAnimationFrame(function() { sucScreen.classList.add('sms-unfurl'); });
  // Image loads again on the success screen — now in a green shade
  setTimeout(function() { smpLoadReveal('smpLoadBlurS', 1600); }, 120);
}

// TEMP: replay the unfurl on whichever success screen is currently on (remove before commit)
function smDone() {
  document.querySelector('.phone').scrollTop = 0;
  SM_SCREENS.forEach(id => document.getElementById(id).className = 'screen hr');
  smCents = 100000;
  // Return to the screen the send-money flow was started from
  var origin = (typeof smOrigin !== 'undefined' && smOrigin) || _smOrigin || 'home';
  var dest = document.getElementById(origin) || document.getElementById('home');
  dest.className = 'screen on';
  if (origin === 'home' || dest.id === 'home') { setSbLight(false); showNav(true); }
  else { showNav(true); }
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
    btn.className = 'purpose-row purpose-row--code' + (_purposeCode === item.code ? ' sel' : '');
    btn.dataset.code = item.code;
    // Professional services: no icon/subtext — show the bank purpose code instead
    btn.innerHTML = '<div class="purpose-row-info"><span class="purpose-row-lbl">' + item.label + '</span></div>' +
      '<span class="purpose-row-code">' + item.code + '</span>' + checkSvg;
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

/* ── Rate comparison sheet ── */
var RATE_BANYAN = 91.78, RATE_BANK = 91.25, RATE_BANK_FEE = 15, RATE_MAX = 3000, RATE_MIN = 100;
var _rateUsd = 1000, _rateInit = false;
// Scrolling magnifying ruler (horizontal port of the ChapterScrubber wave)
var V_MIN = 100, V_MAX = 3000, V_STEP = 50, V_SCALE = 0.20;   // px per $ (tick every ~10px)
var RATE_REST = 8, RATE_PEAK = 40, RATE_RADIUS = 3;  // radius in $50 steps
var RATE_LABELS = [100, 500, 2000, 3000];
var _rateDispVal = _rateUsd, _rateTargetVal = _rateUsd, _rateVel = 0, _rateLastT = 0;
var _rateRAF = null, _rateTickEls = [], _rateLabelEls = [];
// Near-critically-damped spring (framer-motion POINTER_SPRING): the wave feels attached, never overshoots.
var RATE_K = 700, RATE_C = 52, RATE_M = 1;
var _rateReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function _rateFmtINR(n) { return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function _rateFmtUSD(n) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
// Raised-cosine bump: 1 at the crest, 0 beyond the radius, zero slope at both ends (seamless falloff)
function _rateBump(d, r) { return d >= r ? 0 : 0.5 * (1 + Math.cos(Math.PI * (d / r))); }
function _rateX(v) { return (v - V_MIN) * V_SCALE; }   // x of a value within the strip

/* Apply a USD amount → readout + totals + footer. updateScroll re-eases the strip to it. */
function _rateApply(usd, updateScroll) {
  _rateUsd = Math.min(V_MAX, Math.max(V_MIN, usd));
  var fld = document.getElementById('rateInputField');
  if (fld) fld.textContent = _rateFmtUSD(_rateUsd);
  if (updateScroll) { _rateTargetVal = _rateUsd; _rateStartRAF(); }
  var banyan = _rateUsd * RATE_BANYAN;
  var bank   = Math.max(0, _rateUsd - RATE_BANK_FEE) * RATE_BANK;
  var totals = document.querySelectorAll('.rate-cmp-total');
  if (totals[0]) totals[0].textContent = _rateFmtINR(banyan);
  if (totals[1]) totals[1].textContent = _rateFmtINR(bank);
  var foot = document.querySelector('.rate-cmp-foot');
  if (foot) foot.textContent = 'Send ₹' + Math.round(Math.max(0, banyan - bank)).toLocaleString('en-IN') + ' more with Banyan';
}
/* Build the strip once: a tick every $50, major every $500, plus the scale labels */
function _rateBuildRuler() {
  var strip = document.getElementById('rateRulerStrip');
  if (!strip || _rateTickEls.length) return;
  var frag = document.createDocumentFragment();
  var n = Math.round((V_MAX - V_MIN) / V_STEP);
  for (var i = 0; i <= n; i++) {
    var v = V_MIN + i * V_STEP;
    var t = document.createElement('span'); t.className = 'rate-tick';
    t.style.left = _rateX(v) + 'px'; t._v = v; t._major = (v % 500 === 0);
    frag.appendChild(t); _rateTickEls.push(t);
  }
  RATE_LABELS.forEach(function(v) {
    var l = document.createElement('span'); l.className = 'rate-ruler-lbl';
    l.textContent = '$' + v; l.style.left = _rateX(v) + 'px'; l._v = v;
    frag.appendChild(l); _rateLabelEls.push(l);
  });
  strip.appendChild(frag);
  strip.style.width = (_rateX(V_MAX) + 2) + 'px';
}
/* Scroll the strip so the displayed value sits under the centre; swell the ticks nearest it */
function _rateRenderRuler() {
  if (!_rateTickEls.length) return;
  var ruler = document.getElementById('rateRuler'); if (!ruler) return;
  var centerX = ruler.getBoundingClientRect().width / 2;
  var strip = document.getElementById('rateRulerStrip');
  if (strip) strip.style.transform = 'translateX(' + (centerX - _rateX(_rateDispVal)).toFixed(1) + 'px)';
  for (var i = 0; i < _rateTickEls.length; i++) {
    var el = _rateTickEls[i];
    var rise = _rateBump(Math.abs(el._v - _rateDispVal) / V_STEP, RATE_RADIUS);
    // Uniform small ticks; each grows (and darkens) only as it nears the centre.
    el.style.height = (RATE_REST + rise * (RATE_PEAK - RATE_REST)).toFixed(1) + 'px';
    el.style.opacity = (0.26 + rise * 0.74).toFixed(3);
    // Quiet secondary cue: a slight thickening at the crest, like the reference wave.
    el.style.transform = 'translateX(-50%) scaleX(' + (1 + rise * 0.4).toFixed(3) + ')';
  }
  // Fade a scale label out as it reaches the centre — the big readout already shows that value.
  for (var j = 0; j < _rateLabelEls.length; j++) {
    var lbl = _rateLabelEls[j];
    var dd = Math.abs(lbl._v - _rateDispVal);
    lbl.style.opacity = Math.max(0, Math.min(1, (dd - 130) / 250)).toFixed(3);
  }
}
/* Spring the displayed value toward the target (damped-spring integration) so the
   wave accelerates and settles organically instead of ramping mechanically. */
function _rateStartRAF() {
  if (_rateReduced) { _rateDispVal = _rateTargetVal; _rateVel = 0; _rateRenderRuler(); return; }
  if (_rateRAF) return;
  _rateLastT = performance.now();
  var step = function(now) {
    var frameDt = Math.min(0.064, (now - _rateLastT) / 1000);
    _rateLastT = now;
    // Integrate in small fixed sub-steps so the stiff spring stays numerically stable.
    var remaining = frameDt, h = 1 / 240;
    while (remaining > 0) {
      var sdt = remaining > h ? h : remaining; remaining -= sdt;
      var accel = (-RATE_K * (_rateDispVal - _rateTargetVal) - RATE_C * _rateVel) / RATE_M;
      _rateVel += accel * sdt;
      _rateDispVal += _rateVel * sdt;
    }
    _rateRenderRuler();
    if (Math.abs(_rateDispVal - _rateTargetVal) < 0.4 && Math.abs(_rateVel) < 0.6) {
      _rateDispVal = _rateTargetVal; _rateVel = 0; _rateRenderRuler(); _rateRAF = null; return;
    }
    _rateRAF = requestAnimationFrame(step);
  };
  _rateRAF = requestAnimationFrame(step);
}
/* Drag to scrub: the strip tracks the finger 1:1; the amount snaps to $50 */
function _rateBindSlider() {
  _rateBuildRuler();
  if (_rateInit) { _rateRenderRuler(); return; } _rateInit = true;
  var ruler = document.getElementById('rateRuler');
  if (!ruler) return;
  var dragging = false, startX = 0, startVal = 0;
  function cx(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
  function down(e) { dragging = true; startX = cx(e); startVal = _rateUsd; e.preventDefault(); }
  function move(e) {
    if (!dragging) return;
    var raw = Math.min(V_MAX, Math.max(V_MIN, startVal - (cx(e) - startX) / V_SCALE));
    _rateTargetVal = raw;                                 // the wave springs toward the finger
    _rateApply(Math.round(raw / V_STEP) * V_STEP, false); // readout snaps to $50
    _rateStartRAF();
    e.preventDefault();
  }
  function up() { if (!dragging) return; dragging = false; _rateUsd = Math.round(_rateUsd / V_STEP) * V_STEP; _rateTargetVal = _rateUsd; _rateStartRAF(); }
  ruler.addEventListener('mousedown', down);
  ruler.addEventListener('touchstart', down, { passive: false });
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('mouseup', up);
  window.addEventListener('touchend', up);
}
function rateInputChange() {}
function rateInputBlur() {}
/* Close/abandon the whole send-money flow → back to where it started */
function smCloseSend() {
  document.querySelector('.phone').scrollTop = 0;
  closeScheduleSheet(); closeSchedDetail && closeSchedDetail();
  if (typeof SM_SCREENS !== 'undefined') SM_SCREENS.forEach(function(id){ var e=document.getElementById(id); if (e) e.className='screen hr'; });
  var origin = (typeof smOrigin !== 'undefined' && smOrigin) || _smOrigin || 'home';
  var dest = document.getElementById(origin) || document.getElementById('home');
  dest.className = 'screen on';
  setSbLight(false); showNav(true);
}

/* ── Schedule sheet ── */
function openScheduleSheet(ev) {
  if (ev) ev.stopPropagation();
  if (typeof setSbLight === 'function') setSbLight(false);
  document.getElementById('schedSheet').classList.add('open');
}
function closeScheduleSheet() {
  document.getElementById('schedSheet').classList.remove('open');
}

/* Schedule detail sheets: date / frequency / ends */
var _schdBuilt = false;
function _buildSchdCal() {
  if (_schdBuilt) return; _schdBuilt = true;
  var grid = document.getElementById('schdCalGrid'); if (!grid) return;
  var html = '';
  for (var d = 2; d <= 30; d++) {
    var col = (d - 2) % 7;            // 0 = Sunday column
    var cls = 'schd-cal-cell' + (col === 0 ? ' sun' : '') + (d === 10 ? ' sel' : '');
    html += '<button class="' + cls + '" type="button" onclick="smPickSchdDay(this,' + d + ')">' + d + '</button>';
  }
  grid.innerHTML = html;
}
function openSchedDetail(which) {
  _buildSchdCal();
  if (which === 'date') _schdCalTarget = 'date';
  var map = { date: 'schdDate', freq: 'schdFreq', ends: 'schdEnds' };
  var el = document.getElementById(map[which]); if (!el) return;
  document.getElementById('schdScrim').classList.add('open');
  el.classList.add('open');
}
function closeSchedDetail() {
  var cal = document.getElementById('schdDate');
  // If the calendar is layered over the Ends sheet, back just returns to Ends
  if (cal && cal.classList.contains('schd-ontop')) {
    cal.classList.remove('open'); cal.classList.remove('schd-ontop');
    _schdCalTarget = 'date';
    return;
  }
  document.getElementById('schdScrim').classList.remove('open');
  ['schdDate', 'schdFreq', 'schdEnds'].forEach(function(id) {
    var e = document.getElementById(id); if (e) { e.classList.remove('open'); e.classList.remove('schd-ontop'); }
  });
}
// Which field the calendar is currently editing: 'date' (transfer date) or 'ends'
var _schdCalTarget = 'date';
/* Open the calendar on top of the "Ends after" sheet to pick the end date */
function openEndsCalendar(ev) {
  if (ev) ev.stopPropagation();
  _schdCalTarget = 'ends';
  _buildSchdCal();
  document.getElementById('schdScrim').classList.add('open');
  var cal = document.getElementById('schdDate');
  cal.classList.add('schd-ontop'); // sit above the Ends-after sheet
  cal.classList.add('open');
}
function smPickSchdDay(el, day) {
  el.parentElement.querySelectorAll('.schd-cal-cell').forEach(function(c){ c.classList.remove('sel'); });
  el.classList.add('sel');
  if (_schdCalTarget === 'ends') {
    var dd = String(day).padStart(2, '0') + '/06/2027';
    var de = document.querySelector('#schdEnds .schd-ends-date');
    if (de) de.innerHTML = '<span class="ico" style="--ico:url(\'Icons/Calendar.svg\');--sz:16px;color:rgba(0,0,0,0.6)"></span>' + dd;
    // Select the "Ends on" radio and reflect it in the schedule summary
    var main = document.querySelector('#schdEnds .schd-radio-main');
    if (main) { main.dataset.v = 'Ends on ' + dd; smPickEnds(main); }
    _schdCalTarget = 'date';
    var cal = document.getElementById('schdDate');
    cal.classList.remove('open'); cal.classList.remove('schd-ontop'); // back to Ends sheet
    return;
  }
  var v = document.getElementById('schedDateVal'); if (v) v.textContent = 'June ' + day + ', 2026';
}
function smPickFreq(el) {
  el.parentElement.querySelectorAll('.schd-radio').forEach(function(r){ r.classList.remove('sel'); });
  el.classList.add('sel');
  var v = document.getElementById('schedFreqVal'); if (v) v.textContent = el.dataset.v;
  // Ends-after is only meaningful for a recurring schedule
  var ends = document.getElementById('schedEndsRow');
  if (ends) ends.classList.toggle('sched-row--disabled', el.dataset.v === 'Does not repeat');
}
function smPickEnds(el) {
  document.querySelectorAll('#schdEnds .schd-radio, #schdEnds .schd-radio-main').forEach(function(r){ r.classList.remove('sel'); });
  el.classList.add('sel');
  var v = document.getElementById('schedEndsVal'); if (v) v.textContent = el.dataset.v;
}

/* ── Review "Add a note" sheet ── */
function openReviewNote(ev) {
  if (ev) ev.stopPropagation();
  var inp = document.getElementById('rnoteInput');
  var cur = document.getElementById('smrNoteVal');
  if (inp) inp.value = (cur && document.getElementById('smrNoteRow').style.display !== 'none') ? cur.textContent : '';
  document.getElementById('rnoteScrim').classList.add('open');
  document.getElementById('rnoteSheet').classList.add('open');
  setTimeout(function() { if (inp) inp.focus(); }, 320);
}
function closeReviewNote() {
  document.getElementById('rnoteScrim').classList.remove('open');
  document.getElementById('rnoteSheet').classList.remove('open');
}

/* ── Payment method bottom sheet (US / wire) ── */
// Currently selected US payment method (Wire transfers collect an address)
var _smPayMethod = 'Wire Transfer';
function openPayMethodSheet() {
  document.getElementById('pmScrim').classList.add('open');
  document.getElementById('pmSheet').classList.add('open');
}
function closePayMethodSheet() {
  document.getElementById('pmScrim').classList.remove('open');
  document.getElementById('pmSheet').classList.remove('open');
}
function pmSelect(row) {
  document.querySelectorAll('#pmList .pm-row').forEach(function(r){ r.classList.remove('sel'); });
  row.classList.add('sel');
}
function pmContinue() {
  var sel = document.querySelector('#pmList .pm-row.sel');
  if (sel) {
    _smPayMethod = sel.dataset.m;
    var val = document.getElementById('smrPayMethodVal'); if (val) val.textContent = sel.dataset.m;
    var ico = document.getElementById('smrPayMethodIco'); if (ico) ico.src = sel.dataset.ico;
    // The address-on-next-step helper only applies to Wire transfers
    var help = document.querySelector('.smr-us-only .smr-purpose-help');
    if (help) help.style.display = (sel.dataset.m === 'Wire Transfer') ? '' : 'none';
  }
  closePayMethodSheet();
}

/* Review "Confirm and pay": Wire transfers collect a beneficiary address first;
   every other method (and India) proceeds straight to payment. */
function smConfirmReview() {
  if (_smUSMode && _smPayMethod === 'Wire Transfer') { openAddressSheet(); return; }
  smShowFaceScan();
}
// Demo Zip → City/State so the address fields auto-fill like a real form
var _ADDR_ZIP_MAP = {
  '10001': { city: 'New York',      state: 'NY' },
  '94103': { city: 'San Francisco', state: 'CA' },
  '60601': { city: 'Chicago',       state: 'IL' },
  '73301': { city: 'Austin',        state: 'TX' },
  '98101': { city: 'Seattle',       state: 'WA' },
  '02108': { city: 'Boston',        state: 'MA' },
  '33101': { city: 'Miami',         state: 'FL' }
};
function addrZipLookup() {
  var z = (document.getElementById('addrZip').value || '').trim();
  var m = _ADDR_ZIP_MAP[z];
  var c = document.getElementById('addrCity'), s = document.getElementById('addrState');
  if (m) {
    // Zip recognised → prefill City/State and lock them (derived from zip)
    if (c) { c.value = m.city; c.disabled = true; }
    if (s) { s.value = m.state; s.disabled = true; }
  } else {
    // No match → let the user choose manually
    if (c) c.disabled = false;
    if (s) s.disabled = false;
  }
}
// City → State so picking a city fills the state
var _ADDR_CITY_STATE = {
  'New York':'NY','Los Angeles':'CA','Chicago':'IL','Houston':'TX','Phoenix':'AZ',
  'Philadelphia':'PA','San Antonio':'TX','San Diego':'CA','Dallas':'TX','Austin':'TX',
  'San Jose':'CA','San Francisco':'CA','Seattle':'WA','Denver':'CO','Boston':'MA',
  'Miami':'FL','Atlanta':'GA','Washington':'DC','Portland':'OR','Las Vegas':'NV',
  'Detroit':'MI','Minneapolis':'MN','Nashville':'TN','Charlotte':'NC','Columbus':'OH',
  'Indianapolis':'IN','Kansas City':'MO','New Orleans':'LA','Salt Lake City':'UT','Pittsburgh':'PA'
};
function addrCityLookup() {
  var city = (document.getElementById('addrCity').value || '').trim();
  var st = _ADDR_CITY_STATE[city];
  var s = document.getElementById('addrState');
  if (st && s) s.value = st;
}
function openAddressSheet() {
  // Clear text fields and reset the City/State dropdowns for a fresh entry
  document.querySelectorAll('#addrSheet .addr-input').forEach(function(i){ i.value = ''; });
  ['addrCity','addrState'].forEach(function(id){ var e = document.getElementById(id); if (e) { e.value = ''; e.disabled = false; } });
  document.getElementById('addrScrim').classList.add('open');
  document.getElementById('addrSheet').classList.add('open');
}
function closeAddressSheet() {
  document.getElementById('addrScrim').classList.remove('open');
  document.getElementById('addrSheet').classList.remove('open');
}
function saveAddressAndPay() {
  closeAddressSheet();
  smShowFaceScan();
}
function saveReviewNote() {
  var inp = document.getElementById('rnoteInput');
  var txt = (inp ? inp.value : '').trim();
  var row = document.getElementById('smrNoteRow');
  var val = document.getElementById('smrNoteVal');
  if (txt) { if (val) val.textContent = txt; if (row) row.style.display = ''; }
  else { if (row) row.style.display = 'none'; }
  closeReviewNote();
}

function openRateSheet(ev) {
  if (ev) ev.stopPropagation();
  _rateBindSlider();
  _rateApply(_rateUsd, true);
  _rateRenderRuler();
  document.getElementById('rateScrim').classList.add('open');
  document.getElementById('rateSheet').classList.add('open');
}
function closeRateSheet() {
  document.getElementById('rateScrim').classList.remove('open');
  document.getElementById('rateSheet').classList.remove('open');
}

/* ── Redesigned purpose sheet (Figma 6726-156347 / 6779-28005) ── */
var PURPOSES2 = [
  { key:'family',    code:'P1301', ico:'🏠',  title:'Family and health',      desc:'Send money to family, your account, or for treatment.', kw:['family','health','treatment','medical','hospital','personal','parent','home','account','wife','husband','son','daughter'] },
  { key:'utility',   code:'P1109', ico:'🧾',  title:'Utility bills and taxes', desc:'Utility bills and tax payments in India.',              kw:['utility','bill','tax','electric','water','gas','recurring','rent'] },
  { key:'education', code:'P1107', ico:'📚',  title:'Education',               desc:'Tuitions, fees or payments to schools or colleges',     kw:['school','college','tuition','education','fees','university','course','student','exam'] },
  { key:'insurance', code:'P0601', ico:'🛡️', title:'Insurance and travel',    desc:'Insurance premiums, hotel stays or travel bookings',    kw:['insurance','travel','flight','flights','hotel','trip','premium','booking','visa','vacation','holiday'] },
  { key:'others',    code:'P9999', ico:'🗂️', title:'Others',                  desc:'Legal, accounting, software, or other services.',       kw:['legal','accounting','software','consulting','business','service','audit'] }
];
var _p2Sel = 'family', _p2Matched = false, _p2Manual = false;
var _P2_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
var _P2_PENCIL = '<svg viewBox="0 0 256 256" fill="rgba(0,0,0,0.6)"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/></svg>';
function _p2Get(key) { return PURPOSES2.filter(function(p){ return p.key === key; })[0] || PURPOSES2[0]; }
function renderPurpose2() {
  var list = document.getElementById('purpose2List');
  var matchWrap = document.getElementById('purpose2Match');
  var divlbl = document.getElementById('purpose2DivLbl');
  var contTxt = document.getElementById('purpose2ContinueTxt');
  if (!list) return;
  if (_p2Matched) {
    var m = _p2Get(_p2Sel);
    matchWrap.style.display = '';
    matchWrap.innerHTML = '<span class="p2-ico">' + m.ico + '</span>' +
      '<div class="p2-info"><span class="p2-tag">Best match</span>' +
      '<span class="p2-title">' + m.title + '</span><span class="p2-desc">' + m.desc + '</span></div>';
    divlbl.textContent = 'OR CUSTOM PICK ONE';
  } else {
    matchWrap.style.display = 'none';
    divlbl.textContent = 'OR PICK ONE';
  }
  list.innerHTML = PURPOSES2.filter(function(p){ return !(_p2Matched && p.key === _p2Sel); }).map(function(p) {
    var sel = (!_p2Matched && p.key === _p2Sel);
    var tag = (sel && !_p2Manual) ? ' <span class="p2-tag">Preselected</span>' : '';
    return '<button class="p2-row' + (sel ? ' sel' : '') + '" type="button" onclick="smPurposePick2(\'' + p.key + '\')">' +
      '<span class="p2-ico">' + p.ico + '</span>' +
      '<div class="p2-info"><span class="p2-title">' + p.title + tag + '</span><span class="p2-desc">' + p.desc + '</span></div>' +
      '</button>';
  }).join('');
  if (contTxt) contTxt.textContent = 'Continue with ' + _p2Get(_p2Sel).title;
}
function smPurposeTextInput() { /* placeholder for future validation */ }
function smPurposeMatch() {
  var t = (document.getElementById('purpose2Text').value || '').toLowerCase().trim();
  if (!t) return;
  var best = 'others', score = 0;
  PURPOSES2.forEach(function(p) {
    var s = 0; p.kw.forEach(function(k){ if (t.indexOf(k) > -1) s++; });
    if (s > score) { score = s; best = p.key; }
  });
  _p2Sel = best; _p2Matched = true;
  var inp = document.getElementById('purpose2Input'); if (inp) inp.classList.add('matched');
  var go = document.getElementById('purpose2Go'); if (go) { go.setAttribute('onclick', 'smPurposeEditText()'); go.innerHTML = _P2_PENCIL; }
  renderPurpose2();
}
function smPurposeEditText() {
  _p2Matched = false;
  var inp = document.getElementById('purpose2Input'); if (inp) inp.classList.remove('matched');
  var go = document.getElementById('purpose2Go'); if (go) { go.setAttribute('onclick', 'smPurposeMatch()'); go.innerHTML = _P2_ARROW; }
  renderPurpose2();
  var ta = document.getElementById('purpose2Text'); if (ta) ta.focus();
}
function smPurposePick2(key) {
  _p2Sel = key; _p2Matched = false; _p2Manual = true;
  var inp = document.getElementById('purpose2Input'); if (inp) inp.classList.remove('matched');
  var go = document.getElementById('purpose2Go'); if (go) { go.setAttribute('onclick', 'smPurposeMatch()'); go.innerHTML = _P2_ARROW; }
  renderPurpose2();
}
function smPurposeContinue() {
  var p = _p2Get(_p2Sel);
  if (typeof _agPurposeMode !== 'undefined' && _agPurposeMode) {
    if (typeof _agPurposeConfirmTurn === 'function') _agPurposeConfirmTurn(p.title);
    smClosePurposeSheet();
    return;
  }
  _purposeCode = p.code; _purposeLabel = p.title;
  if (typeof smSyncPurposeDisplay === 'function') smSyncPurposeDisplay(p.title, p.code);
  var ico = document.getElementById('smPurposeIco'); if (ico) ico.textContent = p.ico;
  var val = document.getElementById('smPurposeDisplayVal'); if (val) val.textContent = p.title;
  smClosePurposeSheet();
}

function smOpenPurposeSheet(ev) {
  if (ev) ev.stopPropagation();
  var cur = PURPOSES2.filter(function(p){ return p.code === _purposeCode; })[0];
  _p2Sel = cur ? cur.key : 'family';
  _p2Matched = false;
  _p2Manual = false; // first open shows the auto "Preselected" tag
  var ta = document.getElementById('purpose2Text'); if (ta) ta.value = '';
  var inp = document.getElementById('purpose2Input'); if (inp) inp.classList.remove('matched');
  var go = document.getElementById('purpose2Go'); if (go) { go.setAttribute('onclick', 'smPurposeMatch()'); go.innerHTML = _P2_ARROW; }
  renderPurpose2();
  document.getElementById('purposeScrim').classList.add('open');
  document.getElementById('purposeSheet').classList.add('open');
  // Focus the input by default once the sheet has slid in
  setTimeout(function() { if (ta) { ta.focus(); } }, 320);
}
function smClosePurposeSheet() {
  document.getElementById('purposeScrim').classList.remove('open');
  document.getElementById('purposeSheet').classList.remove('open');
  var pi = document.getElementById('purposeSheetInvoice'); if (pi) pi.classList.remove('open');
  _agPurposeMode = false;
  _agPendingPurpose = null;
}

/* Pick a common purpose row (no invoice needed) */
function smPickPurpose(el, label, code) {
  // Agent flow reuses this sheet — apply to the agent card without touching
  // send-money state.
  if (_agPurposeMode) {
    document.querySelectorAll('#purposeSheet .purpose-row').forEach(function(r) { r.classList.remove('sel'); });
    el.classList.add('sel');
    _agPurposeConfirmTurn((el.querySelector('.purpose-row-lbl') || {}).textContent || label);
    setTimeout(smClosePurposeSheet, 200);
    return;
  }
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
  if (_agPurposeMode) {
    document.querySelectorAll('#purposeSheet .purpose-row').forEach(function(r) { r.classList.remove('sel'); });
    document.querySelectorAll('#purposeProfRows .purpose-row').forEach(function(r) { if (r.dataset.code === code) r.classList.add('sel'); });
    _agPendingPurpose = label;
    smOpenPurposeInvoice(label);
    return;
  }
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
  if (_agPurposeMode && _agPendingPurpose) _agPurposeConfirmTurn(_agPendingPurpose);
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
  { id:'FRAUD_CARD_PRESENT',     label:'Card present fraud' },
  { id:'FRAUD_CARD_NOT_PRESENT', label:'Card not present fraud' },
  { id:'FRAUD_OTHER',            label:'Other fraud' },
  { id:'GOODS_SERVICES_NOT_RECEIVED', label:'Item not received' },
  { id:'GOODS_SERVICES_NOT_AS_DESCRIBED', label:'Not as described' },
  { id:'INCORRECT_AMOUNT',       label:'Wrong amount charged' },
  { id:'DUPLICATE_PROCESSING',   label:'Duplicate charge' },
  { id:'OTHER',                  label:'Other' },
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

  // ── Amount field — pre-filled from tx, editable ──────────────
  const amtWrap = document.createElement('div');
  amtWrap.className = 'bds-input-wrap';
  // tx.amt is [dollars, cents] display array; tx.amount is raw cents if present
  const txDollars = tx.amt ? `${tx.amt[0]}.${String(tx.amt[1]).padStart(2,'0')}` :
                    tx.amount ? (Math.abs(tx.amount) / 100).toFixed(2) : '0.00';
  amtWrap.innerHTML = `
    <div class="bds-field-label">Dispute amount</div>
    <div class="dispute-amount-row">
      <span class="dispute-amount-currency">${tx.currency ?? 'USD'}</span>
      <input class="bds-input dispute-amount-input" id="disputeAmount"
        type="number" inputmode="decimal" min="0.01" step="0.01"
        value="${txDollars}">
    </div>
  `;
  body.appendChild(amtWrap);

  // ── Banyan DS RadioGroup — "Reason" ──────────────────────────
  const rgWrap = document.createElement('div');
  const rgLabel = document.createElement('div');
  rgLabel.className = 'bds-field-label';
  rgLabel.textContent = 'Reason';
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

  // ── Banyan DS Textarea — customer note ───────────────────────
  const taWrap = document.createElement('div');
  taWrap.className = 'bds-input-wrap';
  taWrap.innerHTML = `
    <div class="bds-field-label">Additional details</div>
    <textarea class="bds-textarea" id="disputeNotes"
      placeholder="Describe what happened (optional)"></textarea>
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

/* ── Reversal / refund-tracking form ────────────────── */
let _reversalTx = null;

function openReversalForm(tx) {
  _reversalTx = tx;

  const body = document.getElementById('reversalBody');
  body.innerHTML = '';

  // Transaction summary row
  const rowWrap = document.createElement('div');
  rowWrap.className = 'dispute-tx-row-wrap';
  const row = buildRow(tx);
  row.style.cursor = 'default';
  rowWrap.appendChild(row);
  body.appendChild(rowWrap);

  // Expected refund amount
  const txDollars = tx.amt
    ? `${tx.amt[0]}.${String(tx.amt[1]).padStart(2,'0')}`
    : tx.amount ? (Math.abs(tx.amount)/100).toFixed(2) : '0.00';
  const amtWrap = document.createElement('div');
  amtWrap.className = 'bds-input-wrap';
  amtWrap.innerHTML = `
    <div class="bds-field-label">Expected refund amount</div>
    <div class="dispute-amount-row">
      <span class="dispute-amount-currency">${tx.currency ?? 'USD'}</span>
      <input class="bds-input dispute-amount-input" id="reversalAmount"
        type="number" inputmode="decimal" min="0.01" step="0.01"
        value="${txDollars}">
    </div>
  `;
  body.appendChild(amtWrap);

  // Expected by date
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  const dateStr = defaultDate.toISOString().split('T')[0];
  const dateWrap = document.createElement('div');
  dateWrap.className = 'bds-input-wrap';
  dateWrap.innerHTML = `
    <div class="bds-field-label">Expected by</div>
    <div class="reversal-date-row">
      <svg class="reversal-date-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="4" width="16" height="14" rx="3"/>
        <path d="M6 2v4M14 2v4M2 9h16"/>
      </svg>
      <input class="reversal-date-input" id="reversalDate" type="date" value="${dateStr}">
    </div>
  `;
  body.appendChild(dateWrap);

  // Helper text
  const hint = document.createElement('p');
  hint.className = 'reversal-hint';
  hint.textContent = "We'll watch for a matching refund that hasn't arrived by this date.";
  body.appendChild(hint);

  document.getElementById('reversalOverlay').classList.add('open');
}



function closeReversalForm() {
  document.getElementById('reversalOverlay').classList.remove('open');
  _reversalTx = null;
}

function submitReversal() {
  if (!_reversalTx) return;
  const tx = _reversalTx;
  closeReversalForm();
  journeyStep(tx, 'reverse');
}

function switchTab(tab, el) {
  activeTab = tab;
  document.querySelectorAll('.ltab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (_txLoading) return;   // keep the skeleton until loading completes
  renderList(tab);
}

function toggleListSearch() {
  const wrap = document.getElementById('listSearchWrap');
  if (!wrap) return;
  const open = wrap.classList.toggle('open');
  const input = document.getElementById('txSearch');
  if (open && input) { setTimeout(function() { input.focus(); }, 60); }
  else if (input) { input.value = ''; input.dispatchEvent(new Event('input')); input.blur(); }
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
/* ── Home: status-bar blur + hero zoom-out & progressive blur on scroll ── */
(function() {
  var scroll = document.querySelector('.home-scroll');
  if (!scroll) return;
  var heroWrap = document.getElementById('homeHeroBgWrap');
  var heroFixed = document.getElementById('homeHeroFixed');
  var heroBlurScroll = document.getElementById('homeHeroBlurScroll');
  var homeAi = document.querySelector('#home .home-ai');
  var homeHero = document.querySelector('#home .home-hero');
  var homeGreetingHalo = document.getElementById('homeGreetingHalo');
  var bnavAiSlot = document.getElementById('bnavAiSlot');
  var ticking = false;
  scroll.addEventListener('scroll', function() {
    var st = scroll.scrollTop;
    var scrolled = st > 8;
    // Hard-cut the scroll area into a rounded box 16px below the header buttons
    scroll.classList.toggle('home-fade-top', scrolled);
    // White text over the hero photo at the top; dark once content scrolls under
    if (document.getElementById('home').classList.contains('on')) setSbLight(!scrolled);
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      var s = Math.max(scroll.scrollTop, 0);
      var p = Math.min(s / 320, 1); // 0 at top → 1 by 320px
      // Photo fills the hero at rest, then shrinks to fit the device width (scale 1.0) on scroll
      if (heroWrap) heroWrap.style.transform = 'translateY(' + (-40 * p).toFixed(1) + 'px) scale(' + (1.35 - p * 0.35).toFixed(4) + ')';
      // Move the whole header space up by 40px and shrink its height to 212px as scrolling happens
      if (heroFixed) {
        heroFixed.style.transform = 'translateY(' + (-40 * p).toFixed(1) + 'px)';
        heroFixed.style.height = (583 - 371 * p).toFixed(0) + 'px';
        heroFixed.style.setProperty('--bp', p.toFixed(3));
      }
      // Deepen the image blur as you scroll up
      if (heroBlurScroll) heroBlurScroll.style.opacity = (p * 0.35).toFixed(3);
      // Jump input field opacity to 0.80 the moment scrolling starts
      if (homeAi) homeAi.style.setProperty('--ai-bg-op', s > 0 ? '0.80' : '0.60');
      // Fade greeting halo — starts at 60px scroll, gone by 240px
      if (homeGreetingHalo) homeGreetingHalo.style.opacity = Math.max(0, 1 - Math.max(0, s - 60) / 180).toFixed(3);
      // Show AI orb in nav once greeting/AI input area has scrolled away
      if (bnavAiSlot) {
        var _slotNow = s >= 220;
        if (bnavAiSlot.classList.contains('visible') !== _slotNow) {
          bnavAiSlot.classList.toggle('visible', _slotNow);
          _syncIndicatorForSlot(); // keep active-tab indicator aligned
        }
      }
      ticking = false;
    });
  }, { passive: true });
})();

/* ── Attention cards: stacked deck that expands into a list via Show all ── */
var PEEK = 14; // px of each tucked card visible below the front card (collapsed)
function layoutHomeNotifDeck() {
  var notif = document.getElementById('homeNotif');
  var deck = document.getElementById('homeNotifDeck');
  if (!notif || !deck) return;
  var cards = deck.querySelectorAll('.home-ncard2');
  if (!cards.length) return;
  var expanded = notif.classList.contains('expanded');
  var gap = 8;
  var y = 0;
  cards.forEach(function(el, i) {
    var h = el.offsetHeight || 100;
    if (expanded) {
      el.style.transform = 'translateY(' + y + 'px) scale(1)';
      el.style.opacity = '1';
      el.style.zIndex = String(i + 1);
      y += h + gap;
    } else {
      el.style.transform = 'translateY(' + (i * PEEK) + 'px) scale(' + (1 - i * 0.045) + ')';
      el.style.opacity = '1';
      el.style.zIndex = String(cards.length - i); // front card on top
    }
  });
  if (expanded) {
    deck.style.height = (y - gap) + 'px';
  } else {
    var frontH = cards[0].offsetHeight || 100;
    deck.style.height = (frontH + (cards.length - 1) * PEEK) + 'px';
  }
}
function toggleHomeNotif() {
  var notif = document.getElementById('homeNotif');
  var btn = document.getElementById('homeNotifToggle');
  if (!notif) return;
  var willExpand = !notif.classList.contains('expanded');
  notif.classList.toggle('expanded', willExpand);
  if (btn) {
    btn.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
    var lbl = btn.querySelector('.home-notif-toggle-label');
    if (lbl) lbl.textContent = willExpand ? 'Show less' : 'Show all 3';
  }
  layoutHomeNotifDeck();
}
window.addEventListener('resize', layoutHomeNotifDeck);
window.addEventListener('load', layoutHomeNotifDeck);
setTimeout(layoutHomeNotifDeck, 0);

/* ── Account-detail: status-bar blur + nav title reveal on scroll ─────── */
(function() {
  var adScroll = document.getElementById('adScroll');
  var navBar = document.getElementById('adHeaderNav');

  var mainCard = document.getElementById('adMainCard');
  var heroWrap = document.getElementById('adHeroBgWrap');
  var heroBlurTop = document.getElementById('adHeroBlurTop');
  var heroCenter = mainCard ? mainCard.querySelector('.ad-header-center-inner') : null;
  var ticking = false;
  function onAdScroll() {
    var st = adScroll.scrollTop;
    // Reveal the pinned nav title once the hero name reaches the bar
    if (navBar) navBar.classList.toggle('show-title', st > 90);
    // Fade the hero (name, balance, Add funds) out as it rises into the nav
    if (mainCard) mainCard.style.opacity = String(1 - Math.min(Math.max((st - 20) / 80, 0), 1));
    // Dissolve scrolling content ~16px below the nav buttons (mask only once scrolled)
    adScroll.classList.toggle('ad-fade-top', st > 8);
    // Grow the transactions + cards sheets more opaque (0.4 → 0.8) as you scroll up
    adScroll.style.setProperty('--ad-sheet-op', (0.4 + Math.min(st / 160, 1) * 0.4).toFixed(3));
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      var s = Math.max(adScroll.scrollTop, 0);
      var p = Math.min(s / 240, 1); // 0 at top → 1 by 240px
      // Scroll-expansion feel: hero media scales down + parallax-drifts up as you
      // scroll down, and expands back on scroll up. (1.25 rest → 1.0 device width)
      if (heroWrap) heroWrap.style.transform =
        'translateY(' + (p * -18).toFixed(1) + 'px) scale(' + (1.25 - p * 0.25).toFixed(4) + ')';
      // Header block recedes with depth (scale + lift), not just opacity
      if (heroCenter) {
        var pc = Math.min(s / 120, 1); // faster collapse for the centred content
        heroCenter.style.transform = 'translateY(' + (pc * -20).toFixed(1) + 'px) scale(' + (1 - pc * 0.06).toFixed(4) + ')';
      }
      // Final state: top region blurs up to 40px
      if (heroBlurTop) heroBlurTop.style.opacity = p.toFixed(3);
      ticking = false;
    });
  }
  adScroll.addEventListener('scroll', onAdScroll, { passive: true });
})();

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
      { int: '0',      dec: '.00' },  // Travel card (frozen)
      null                             // Create a new card
    ];
    var CARD_NAMES = ['Banyan card', 'Household', 'Travel card', ''];

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
    // Track which card's spend figure is showing so we roll the number up
    // only when a *new* card becomes active (init 0 so the entry animation owns card 0).
    var _lastSpendIdx = 0;
    var CARD_W = 286, GAP = -12, SIDE_PAD = 39;

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
        item.style.transform = 'scale(' + (0.80 + 0.20 * norm).toFixed(3) + ')';
        if (dist < closestDist) { closestDist = dist; closestIdx = i; }
      });
      // Only the centred card gets the live 3D wander sway
      items.forEach(function(item, i) {
        item.classList.toggle('cr-active', i === closestIdx);
        if (i !== closestIdx) item.classList.remove('cr-flipped');
      });
      // Reflect the active card's frozen state in the Freeze action + lock state.
      // The "add new card" tile is not a flipcard, so it's never frozen — clear it.
      var activeCard = items[closestIdx];
      var frozenNow = !!(activeCard && activeCard.classList.contains('cr-flipcard')
                        && activeCard.classList.contains('cr-iced'));
      if (frozenNow !== _cardLocked) { _cardLocked = frozenNow; }
      if (typeof _crSyncLockUI === 'function') _crSyncLockUI(frozenNow);
      var isAdd = items[closestIdx] && items[closestIdx].classList.contains('cr-carousel-add');
      if (spendHdr) spendHdr.style.display = isAdd ? 'none'  : '';
      if (tip)      tip.style.display      = isAdd ? 'flex'  : 'none';
      if (actions)  actions.style.display  = isAdd ? 'none'  : '';
      if (txSec)    txSec.style.display    = isAdd ? 'none'  : '';
      var spentCard = document.getElementById('crSpentCard');
      if (spentCard) spentCard.style.display = isAdd ? 'none' : '';
      var nameEl = document.getElementById('crCardName');
      if (nameEl && !isAdd && CARD_NAMES[closestIdx]) nameEl.textContent = CARD_NAMES[closestIdx];
      dragEl.style.marginBottom = isAdd ? '40px' : '';
      var spend = CARD_SPENDS[closestIdx];
      if (!isAdd && spend && spendInt && spendDec) {
        // Roll the number up only when a new card lands in the centre
        if (closestIdx !== _lastSpendIdx) {
          _lastSpendIdx = closestIdx;
          // Update hero tinge: frosted-teal if frozen, else green (card 0) / grey
          var _crHero = document.querySelector('#cards .cr-hero');
          if (_crHero) {
            var _froz = items[closestIdx] && items[closestIdx].classList.contains('cr-iced');
            var _tinge = _froz ? 'rgba(150,200,202,0.92)' : (closestIdx === 0 ? 'rgba(8,110,1,0.2)' : 'rgba(80,80,80,0.18)');
            var _tingeFade = _froz ? 'rgba(150,200,202,0)' : (closestIdx === 0 ? 'rgba(8,110,1,0)' : 'rgba(80,80,80,0)');
            _crHero.style.setProperty('--cr-tinge', _tinge);
            _crHero.style.setProperty('--cr-tinge-fade', _tingeFade);
          }
          spendDec.textContent = spend.dec;
          var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          var target = parseFloat(spend.int.replace(/,/g, ''));
          if (reduce) spendInt.textContent = spend.int;
          else _crCountUp(spendInt, target, 700);
        }
      } else if (isAdd) {
        _lastSpendIdx = -1; // returning to a card will re-roll its number
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
    var _dragStart = null, _offsetStart = 0, _dragMoved = false;
    dragEl.addEventListener('pointerdown', function(e) {
      _dragStart = e.clientX; _offsetStart = _offset; _dragMoved = false;
      dragEl.style.cursor = 'grabbing';
      carousel.style.transition = 'none';
      dragEl.setPointerCapture(e.pointerId);
      _crResetTilt();
    });
    dragEl.addEventListener('pointermove', function(e) {
      if (_dragStart === null) return;
      var dx = e.clientX - _dragStart;
      if (Math.abs(dx) > 6) _dragMoved = true;
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
      // Tap (no drag) on the active flip card → flip to reveal the CVV.
      // Handled here because pointer capture makes the synthesized click target
      // the drag container, so a click listener on the card never fires.
      if (!_dragMoved) {
        var _tapCard = carousel.querySelector('.cr-flipcard.cr-active');
        if (_tapCard) { _tapCard.classList.toggle('cr-flipped'); _crResetTilt(); return; }
      }
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

    // ── Tap-to-flip (reveals CVV) on the physical card ──
    // Pointer-tilt hover removed in favour of a continuous idle bob (see styles.css).
    // _crResetTilt clears any stray rotation vars before/after drag and flip.
    function _crResetTilt() {
      carousel.querySelectorAll('.cr-flipcard .cr-tilt').forEach(function(t) {
        t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg');
      });
    }
    _crResetTilt();

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

/* ── Send-money landing: scroll-driven header (mirrors Transactions) ── */
(function() {
  const smScr = document.querySelector('#sm-landing .sm-l2-scroll');
  const smLand = document.getElementById('sm-landing');
  if (!smScr || !smLand) return;
  let lastTop = 0, ticking = false;
  const THRESH = 48;
  smScr.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      const top = smScr.scrollTop;
      const scrollingDown = top > lastTop;
      if (scrollingDown && top > THRESH) {
        smLand.classList.add('compact');
      } else if (!scrollingDown) {
        smLand.classList.remove('compact');
      }
      lastTop = top;
      ticking = false;
    });
  }, { passive: true });
})();


/* ── Beneficiaries ───────────────────────────────── */
const BENS = [
  { id:'ar', photo:'assets/blob-purple-v2.webp', blob:'photo', ini:'AR', name:'Ananya Rao',    alias:'Ananya', rel:'Sister',  loc:'Bengaluru',  bg:'linear-gradient(135deg,#c2185b,#e91e8c)', fav:true,  corp:false,
    rails:{ 'US Bank':{ badge:'United States · ACH · USD', rows:[['Account holder','Ananya Rao'],['Bank','JPMorgan Chase'],['Routing (ABA)','021000021'],['Account no.','•••• 4421'],['Type','Checking']] } },
    contact:[['Full name','Ananya Rao'],['Saved as','Ananya'],['Phone','+91 98455 20193'],['Email','ananya.rao@gmail.com']] },

  { id:'jc', photo:'assets/blob-orange-v2.webp', blob:'photo', ini:'JC', name:'James Carter',  alias:'James',  rel:'Friend',  loc:'New York',   bg:'linear-gradient(135deg,#1565c0,#1e88e5)', fav:true,  corp:false,
    rails:{ 'India Bank':{ badge:'India · NEFT · INR', rows:[['Account holder','James Carter'],['Bank','ICICI Bank'],['IFSC','ICIC0001234'],['Account no.','•••• 7731'],['Type','NRO Savings']] },
            'UPI':{ badge:'India · UPI · INR', rows:[['UPI ID','james.carter@icici'],['Registered to','James Carter']] } },
    contact:[['Full name','James Carter'],['Saved as','James'],['Phone','+1 212 555 0182'],['Email','james.carter@email.com']] },

  { id:'ps', photo:'assets/blob-orange-v2.webp', blob:'photo', ini:'PS', name:'Priya Sharma',  alias:'Priya',  rel:'Cousin',  loc:'Mumbai',     bg:'linear-gradient(135deg,#00695c,#00897b)', fav:true,  corp:false,
    rails:{ 'India Bank':{ badge:'India · IMPS · INR', rows:[['Account holder','Priya Sharma'],['Bank','ICICI Bank'],['IFSC','ICIC0000123'],['Account no.','•••• 3120'],['Type','Savings']] },
            'UPI':{ badge:'India · UPI · INR', rows:[['UPI ID','priya.s@icici'],['Registered to','Priya Sharma']] } },
    contact:[['Full name','Priya Sharma'],['Saved as','Priya'],['Phone','+91 97654 32109'],['Email','priya.sharma@email.com']] },

  { id:'th', blob:'business', logo:'assets/dd58076a-011d-4a6e-a83e-bdb7f108eea8.webp', ini:'T',  name:'Tau Holdings Ltd', alias:'Tau Holdings', rel:'Business', loc:'Singapore', bg:'linear-gradient(135deg,#212121,#424242)', fav:false, corp:true,
    rails:{ 'US Bank':{ badge:'United States · Wire · USD', rows:[['Beneficiary','Tau Holdings Ltd'],['Bank','DBS Bank'],['SWIFT','DBSSSGSG'],['Account no.','•••• 0042'],['Type','Corporate']] } },
    contact:[['Company','Tau Holdings Ltd'],['Contact','ops@tauholdings.sg'],['Phone','+65 6321 8800']] },

  { id:'rm', photo:'assets/blob-purple-v2.webp', blob:'photo', ini:'RM', name:'Rahul Mehta',   alias:'Rahul',  rel:'Colleague',loc:'Delhi',      bg:'linear-gradient(135deg,#6a1b9a,#8e24aa)', fav:false, corp:false,
    rails:{ 'US Bank':{ badge:'United States · ACH · USD', rows:[['Account holder','Rahul Mehta'],['Bank','Chase'],['Routing (ABA)','021000021'],['Account no.','•••• 3398'],['Type','Checking']] } },
    contact:[['Full name','Rahul Mehta'],['Saved as','Rahul'],['Phone','+91 99876 33410'],['Email','rahul.m@work.com']] },

  { id:'pm', photo:'assets/blob-purple-v2.webp', blob:'photo', ini:'PM', name:'Patrick Mokoena',alias:'Patrick',rel:'Friend', loc:'Nairobi',    bg:'linear-gradient(135deg,#bf360c,#e64a19)', fav:false, corp:false,
    rails:{ 'US Bank':{ badge:'United States · Wire · USD', rows:[['Account holder','Patrick Mokoena'],['Bank','Equity Bank'],['SWIFT','EQBLKENX'],['Account no.','•••• 5510'],['Type','Current']] } },
    contact:[['Full name','Patrick Mokoena'],['Saved as','Patrick'],['Phone','+254 722 123456'],['Email','p.mokoena@email.com']] },

  { id:'ns', photo:'assets/blob-orange-v2.webp', blob:'photo', ini:'NS', name:'Neha Singh',    alias:'Neha',   rel:'Friend',  loc:'Hyderabad',  bg:'linear-gradient(135deg,#00838f,#0097a7)', fav:false, corp:false,
    rails:{ 'UPI':{ badge:'India · UPI · INR', rows:[['UPI ID','neha.singh@paytm'],['Registered to','Neha Singh']] } },
    contact:[['Full name','Neha Singh'],['Saved as','Neha'],['Phone','+91 98112 45678']] },

  { id:'ak', photo:'assets/blob-orange-v2.webp', blob:'photo', ini:'AK', name:'Akira Kobayashi',alias:'Akira', rel:'Friend',  loc:'Tokyo',      bg:'linear-gradient(135deg,#283593,#3949ab)', fav:false, corp:false,
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
    ph.src = 'assets/blob-green-v2.webp';
    ph.alt = '';
    d.appendChild(ph);
    const glass = document.createElement('div');
    glass.className = 'sm-l-av-glass';
    glass.style.cssText = 'inset:' + inset + ';background:var(--surface-overlay);border:0.3px solid transparent;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:inherit';
    d.appendChild(glass);
    // Centered logo icon
    const logo = document.createElement('img');
    logo.src = b.logo || 'assets/blob-amzpay.webp';
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
  ph.src = b.photo || 'assets/blob-purple-v2.webp';
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

function benOpenAdd() {
  // Open the "Add a beneficiary" bottom sheet over the beneficiaries screen
  openAddBene();
}

/* ── Keyboard-aware agent input ────────────────────────────────────────────
   Strategy: track the visual viewport in real-time with NO transition
   while the keyboard is moving, so the input card appears glued to the
   top of the keyboard. Only animate when the keyboard fully dismisses
   (smooth ease-out back to bottom:16px). This prevents the double-jump
   caused by the entrance animation + a spring transition fighting each other.
──────────────────────────────────────────────────────────────────────────── */
(function _initKeyboardAwareHero() {
  if (!window.visualViewport) return;

  var _lastKbOffset  = 0;
  var _kbSettleTimer = null;

  function _applyKbLayout() {
    var vv = window.visualViewport;
    var kbOffset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    var agScreen = document.getElementById('agent-screen');
    if (!agScreen) return;
    var isActive = agScreen.classList.contains('ag-open') ||
                   agScreen.classList.contains('ag-convo');
    if (!isActive) { _lastKbOffset = 0; return; }

    var inputCard = document.getElementById('agentInputCard');
    var heroEl    = agScreen.querySelector('.ag-hero');
    var chipsEl   = agScreen.querySelector('.ag-chips');
    var msgsEl    = document.getElementById('agentMsgs');

    var wasOpen = _lastKbOffset > 80;
    var isOpen  = kbOffset > 80;
    _lastKbOffset = kbOffset;

    // Cancel any pending settle timer — keyboard is still moving
    if (_kbSettleTimer) { clearTimeout(_kbSettleTimer); _kbSettleTimer = null; }

    if (isOpen) {
      // Keyboard present: track position with NO transition (glued to keyboard top)
      if (_flipCleanupTimer) { clearTimeout(_flipCleanupTimer); _flipCleanupTimer = null; }

      if (inputCard) {
        inputCard.style.transition = 'none';
        inputCard.style.bottom     = (kbOffset + 16) + 'px';
      }
      if (heroEl && !agScreen.classList.contains('ag-convo')) {
        heroEl.style.transition = 'none';
        heroEl.style.transform  = 'translate(-50%, -52%) translateY(-' + Math.round(kbOffset * 0.38) + 'px)';
      }
      if (chipsEl && !agScreen.classList.contains('ag-convo')) {
        chipsEl.style.transition = 'none';
        chipsEl.style.transform  = 'translateY(-' + Math.round(kbOffset * 0.85) + 'px)';
      }
      if (msgsEl) msgsEl.style.paddingBottom = (kbOffset + 80) + 'px';

    } else {
      // Keyboard gone: restore with a short ease-out so the snap-back feels intentional
      _kbSettleTimer = setTimeout(function() {
        if (inputCard) {
          inputCard.style.transition = 'bottom 280ms var(--ease-out)';
          inputCard.style.bottom     = '16px';
        }
        if (heroEl) {
          heroEl.style.transition = 'opacity 320ms var(--ease-out) 80ms, transform 320ms var(--ease-out) 80ms';
          heroEl.style.transform  = '';
        }
        if (chipsEl) {
          chipsEl.style.transition = 'opacity 280ms var(--ease-out) 160ms, transform 280ms var(--ease-out) 160ms';
          chipsEl.style.transform  = '';
        }
        if (msgsEl) msgsEl.style.paddingBottom = '';
      }, 30); // small debounce so final resize event has settled
    }
  }

  window.visualViewport.addEventListener('resize', _applyKbLayout);
  window.visualViewport.addEventListener('scroll', _applyKbLayout);
}());


/* ── Home AI placeholder rollback ───────────────────────────────────────────
   "Ask Banyan " stays fixed. The suffix types in, holds, deletes, then the
   next phrase types in. Pauses when the input card is tapped.
──────────────────────────────────────────────────────────────────────────── */
(function _initAiPhRoller() {
  var SUFFIXES = [
    'to send money',
    'to watch for unusual charges',
    'to set aside money automatically',
    'to manage my cards',
    'to track family spending',
    'to organize my bills',
    'to explain where my money went',
    'to protect my account',
  ];
  var TYPE_MS  = 42;   // ms per character typed
  var DELETE_MS = 28;  // ms per character deleted
  var HOLD_MS  = 2600; // ms to hold before deleting
  var PAUSE_MS = 320;  // ms pause between delete and next type

  var suffix = document.querySelector('.home-ai-ph-suffix');
  if (!suffix) return;

  var idx     = 0;
  var paused  = false;
  var running = false;

  function typeIn(text, done) {
    var i = 0;
    function step() {
      if (paused) { setTimeout(step, 100); return; }
      suffix.textContent += text[i];
      i++;
      if (i < text.length) setTimeout(step, TYPE_MS);
      else done();
    }
    setTimeout(step, TYPE_MS);
  }

  function deleteAll(done) {
    function step() {
      if (paused) { setTimeout(step, 100); return; }
      var t = suffix.textContent;
      if (t.length === 0) { done(); return; }
      suffix.textContent = t.slice(0, -1);
      setTimeout(step, DELETE_MS);
    }
    setTimeout(step, DELETE_MS);
  }

  function cycle() {
    if (paused) { setTimeout(cycle, 200); return; }
    var text = SUFFIXES[idx % SUFFIXES.length];
    idx++;
    typeIn(text, function() {
      setTimeout(function() {
        deleteAll(function() {
          setTimeout(cycle, PAUSE_MS);
        });
      }, HOLD_MS);
    });
  }

  // Pause while the input card is focused/expanded
  var homeAi = document.querySelector('.home-ai');
  if (homeAi) {
    homeAi.addEventListener('click', function() { paused = true; });
    document.addEventListener('ag-closed', function() {
      paused = false;
      suffix.textContent = '';
      if (!running) { running = true; cycle(); }
    });
  }

  // Start after first hold so the user sees the static state briefly
  running = true;
  setTimeout(cycle, 1200);
}());

/* ── Liquid glass nav interactions ───────────────────── */
(function() {
  function init() {
    var pill  = document.getElementById('bnavPill');
    var aiBtn = document.querySelector('.bnav-ai');
    if (!pill || typeof Motion === 'undefined') return;

    // Snap indicator to active tab on load (no animation)
    var activeTab = document.querySelector('.bnav-tab.active');
    var indicator = document.getElementById('bnavIndicator');
    if (indicator && activeTab) {
      indicator.style.transform = 'translateX(' + _limelightX(activeTab) + 'px)';
    }

    // Apple liquid glass spring: high stiffness, underdamped for a single clean overshoot
    var LG_SPRING = { easing: Motion.spring({ stiffness: 800, damping: 24, mass: 0.55 }) };
    var LG_DOWN   = { duration: 0.065, easing: [0.3, 0, 0.5, 1] };

    /* ── Glass dent overlay ─────────────────────────────
       The signature Apple look: when glass is pressed, the surface
       visually indents — dark center, bright refraction ring at edge.
       This sits on the pressed element at the touch-local position.   */
    function addDent(el, e) {
      var r   = el.getBoundingClientRect();
      var cx  = e ? Math.round((e.clientX - r.left) / r.width  * 100) : 50;
      var cy  = e ? Math.round((e.clientY - r.top)  / r.height * 100) : 50;
      var d   = document.createElement('div');
      d.style.cssText =
        'position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:10;opacity:0;' +
        'background:radial-gradient(circle at ' + cx + '% ' + cy + '%,' +
          'rgba(0,0,0,0.12) 0%,rgba(0,0,0,0.06) 30%,transparent 55%,' +
          'rgba(255,255,255,0.32) 68%,rgba(255,255,255,0.08) 80%,transparent 92%);';
      el.style.position = 'relative';
      el.appendChild(d);
      Motion.animate(d, { opacity: [0, 1] }, { duration: 0.055 });
      return d;
    }

    function removeDent(d) {
      if (!d) return;
      Motion.animate(d, { opacity: [null, 0] }, { duration: 0.22, easing: 'ease-out' })
        .finished.then(function() { if (d.parentNode) d.parentNode.removeChild(d); });
    }

    /* ── Tab press ── */
    var _pressedTab = null, _tabDent = null;

    pill.addEventListener('pointerdown', function(e) {
      var tab = e.target.closest('.bnav-tab');
      if (!tab) return;
      _pressedTab = tab;
      Motion.animate(tab,  { scale: [1, 0.93] }, LG_DOWN);
      Motion.animate(pill, { scale: [1, 0.976] }, LG_DOWN);
      _tabDent = addDent(tab, e);
    });

    function pillRelease() {
      removeDent(_tabDent); _tabDent = null;
      if (_pressedTab) { Motion.animate(_pressedTab, { scale: 1 }, LG_SPRING); _pressedTab = null; }
      Motion.animate(pill, { scale: 1 }, LG_SPRING);
    }
    pill.addEventListener('pointerup',     pillRelease);
    pill.addEventListener('pointercancel', pillRelease);

    /* ── AI button press ── */
    if (aiBtn) {
      var inner = aiBtn.querySelector('.bnav-ai-inner');
      var _aiDent = null;
      aiBtn.addEventListener('pointerdown', function(e) {
        Motion.animate(aiBtn, { scale: [1, 0.91] }, LG_DOWN);
        _aiDent = addDent(inner || aiBtn, e);
      });
      function aiRelease() {
        removeDent(_aiDent); _aiDent = null;
        Motion.animate(aiBtn, { scale: 1 }, LG_SPRING);
      }
      aiBtn.addEventListener('pointerup',     aiRelease);
      aiBtn.addEventListener('pointercancel', aiRelease);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());

/* ══════════════════════════════════════════════════════
   CARD AGENT — Conversational card creation
══════════════════════════════════════════════════════ */

var _cardAgentOpen  = false;
var _cardAgentConvo = false;
var _caState        = null; // { step, cardType, flow, flowIdx, data }

var _CA_SPACES = [
  { id: 'usd',      label: 'USD Checking',     sub: '·· 7654' },
  { id: 'thailand', label: 'Thailand holiday',  sub: 'Space' },
  { id: 'moms',     label: "Mom's expenses",    sub: 'Space' },
  { id: 'wedding',  label: 'Wedding',           sub: 'Space' },
];

var _CA_TYPE_LABELS = {
  subscription: 'Subscription',
  merchant:     'Merchant',
  event:        'Event',
  budget:       'Budget',
  safety:       'Safety / Trial',
  added_user:   'Added user',
};

function openCardAgent() {
  if (_cardAgentOpen) return;
  _cardAgentOpen = true;
  _caState = { step: 'idle', cardType: null, flow: [], flowIdx: 0, data: {} };

  // The .phone div uses scrollTop to navigate between screens.
  // Anchor card-agent-screen to the current scroll position so it fills
  // exactly the visible portion of the phone.
  var phone = document.querySelector('.phone');
  var scrollTop = phone ? phone.scrollTop : 0;
  var clientH  = phone ? phone.clientHeight : 852;

  var screen = document.getElementById('card-agent-screen');
  screen.style.top    = scrollTop + 'px';
  screen.style.height = clientH + 'px';
  screen.removeAttribute('aria-hidden');
  screen.style.transition = 'none';
  screen.style.opacity    = '1';
  screen.style.transform  = 'translateY(0)';
  screen.classList.add('ca-open');
  void screen.offsetHeight;
  screen.style.transition = '';

  showNav(false);
  setTimeout(function() {
    var f = document.getElementById('caField');
    if (f) f.focus();
  }, 420);
}

// Auto-open card agent when arriving from index.html with ?newcard=1
(function() {
  if (new URLSearchParams(window.location.search).get('newcard') !== '1') return;
  window.addEventListener('load', function() {
    setTimeout(function() {
      _cardAgentOpen = false;
      showCards('all');
      setTimeout(openCardAgent, 200);
    }, 600);
  });
}());

function closeCardAgent() {
  if (!_cardAgentOpen) return;
  _cardAgentOpen = false; _cardAgentConvo = false; _caState = null;

  var screen = document.getElementById('card-agent-screen');
  screen.style.transition = 'opacity 220ms var(--ease-out), transform 280ms var(--ease-spring)';
  screen.style.opacity    = '0';
  screen.style.transform  = 'translateY(24px)';
  screen.classList.remove('ca-open', 'ca-convo');
  screen.setAttribute('aria-hidden', 'true');

  setTimeout(function() {
    var msgs = document.getElementById('caMsgs');
    if (msgs) msgs.innerHTML = '<div class="ca-msgs-spacer"></div>';
    var f = document.getElementById('caField');
    var s = document.getElementById('caSend');
    if (f) { f.value = ''; f.style.height = 'auto'; }
    if (s) { s.classList.remove('active'); s.setAttribute('aria-disabled', 'true'); }
    // Reset preview
    var prev = document.getElementById('caPreview');
    if (prev) prev.classList.remove('visible');
    var nameEl = document.getElementById('caPreviewName');
    if (nameEl) nameEl.textContent = 'New card';
    var limEl = document.getElementById('caPreviewLimit');
    if (limEl) { limEl.style.display = 'none'; limEl.textContent = ''; }
    // Reset chips visibility (they come back via CSS on next open)
    var chips = document.getElementById('caChips');
    if (chips) chips.style.cssText = '';
    screen.style.transition = '';
    screen.style.opacity    = '';
    screen.style.transform  = '';
    screen.style.top        = '';
    screen.style.height     = '';
  }, 300);

  showNav(true); showNavAi(true);
}

function caOnInput(input) {
  input.style.height = '28px';
  input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  var s = document.getElementById('caSend');
  if (!s) return;
  var has = input.value.trim().length > 0;
  if (has) { s.classList.add('active'); s.removeAttribute('aria-disabled'); }
  else     { s.classList.remove('active'); s.setAttribute('aria-disabled', 'true'); }
}

function caKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); caSend(); }
}

function caChip(el, type) {
  el.style.transform = 'scale(0.94)';
  setTimeout(function() { el.style.transform = ''; _caStartConvo(type); }, 100);
}

function _caHideChips() {
  var chips = document.getElementById('caChips');
  if (!chips || chips.style.display === 'none') return;
  chips.style.transition = 'opacity 200ms ease, transform 220ms var(--ease-out)';
  chips.style.opacity    = '0';
  chips.style.transform  = 'translateY(6px)';
  setTimeout(function() {
    chips.style.display     = 'none';
    chips.style.transition  = '';
    chips.style.opacity     = '';
    chips.style.transform   = '';
  }, 220);
}

function _caStartConvo(type) {
  _caHideChips();
  if (!_cardAgentConvo) {
    _cardAgentConvo = true;
    document.getElementById('card-agent-screen').classList.add('ca-convo');
  }
  _caState.cardType = type;

  var flows = {
    subscription: ['name',     'limit_monthly', 'space'],
    merchant:     ['name',     'limit_monthly', 'space'],
    event:        ['name',     'limit_total',   'space'],
    budget:       ['category', 'limit_monthly', 'space'],
    safety:       ['name',     'limit_pertx',   'space'],
    added_user:   ['who',      'name',          'limit_monthly', 'space'],
  };
  _caState.flow    = flows[type] || ['name', 'space'];
  _caState.flowIdx = 0;
  _caState.data    = {};
  _caAdvanceFlow();
}

var _CA_PROMPTS = {
  name: {
    subscription: { q: "What service is this card for?",            chips: ['Netflix','Spotify','ChatGPT','Amazon Prime'] },
    merchant:     { q: "Which merchant is this card for?",          chips: ['Amazon','Uber','Whole Foods','Target'] },
    event:        { q: "What's the occasion?",                      chips: ['Trip','Wedding','Party','Medical'] },
    safety:       { q: "Give this card a nickname.",                 chips: ['Trials','Online shopping','Free trials'] },
    added_user:   { q: "What should this card be called?",          chips: ['Household','School lunch','Travel','Kids'] },
  },
  category: {
    budget: { q: "Which spending category?", chips: ['Groceries','Dining','Travel','Fuel','Shopping','Kids'] },
  },
  who: {
    added_user: { q: "Who is this card for?", chips: ['Spouse','Child','Delegate'] },
  },
  limit_monthly: {
    subscription: { q: "What's the monthly limit?",          chips: ['$10','$15','$20','$50'] },
    merchant:     { q: "Monthly cap?",                       chips: ['$100','$200','$300','No limit'] },
    budget:       { q: "Monthly cap?",                       chips: ['$200','$500','$800','$1,000'] },
    added_user:   { q: "Monthly limit for this card?",       chips: ['$100','$200','$500','No limit'] },
  },
  limit_total: {
    event: { q: "Total budget for this event?", chips: ['$500','$1,000','$2,500'] },
  },
  limit_pertx: {
    safety: { q: "Per-transaction limit?", chips: ['$10','$25','$50','$100'] },
  },
  space: {
    subscription: { q: "Which Space should this card draw from?" },
    merchant:     { q: "Which Space?" },
    event:        { q: "Which Space?" },
    budget:       { q: "Which Space?" },
    safety:       { q: "Which Space?" },
    added_user:   { q: "Which Space should this card be linked to?" },
  },
};

function _caAdvanceFlow() {
  var step = _caState.flow[_caState.flowIdx];
  if (!step) { _caRenderSummary(); return; }
  _caState.step = step;

  var p = (_CA_PROMPTS[step] || {})[_caState.cardType] || { q: "Tell me more." };
  var chips = p.chips || null;

  if (step === 'space') {
    chips = _CA_SPACES.map(function(s) { return s.label; });
  }

  _caAppendAiMsg(p.q, chips);
}

// ── Message rendering ─────────────────────────────────

function _caAppendAiMsg(text, chips) {
  var msgs = document.getElementById('caMsgs');

  var aiDiv = document.createElement('div');
  aiDiv.className = 'ca-msg-ai';
  aiDiv.innerHTML =
    '<div class="ca-msg-ai-label" aria-hidden="true">' +
      '<div class="ca-msg-ai-dot-wrap"><div class="ca-msg-ai-dot"></div></div>' +
      '<span class="ca-msg-ai-name">Banyan</span>' +
    '</div>';
  msgs.appendChild(aiDiv);

  setTimeout(function() {
    requestAnimationFrame(function() {
      aiDiv.classList.add('visible');
      msgs.scrollTop = msgs.scrollHeight;
    });
  }, 50);

  var textEl = document.createElement('div');
  textEl.className = 'ca-msg-ai-text';
  var cursor = document.createElement('span');
  cursor.className = 'ag-cursor';
  textEl.appendChild(cursor);
  aiDiv.appendChild(textEl);

  var chars = text.split('');
  var i = 0;
  function typeChar() {
    if (i < chars.length) {
      cursor.insertAdjacentText('beforebegin', chars[i++]);
      setTimeout(typeChar, 16 + Math.floor(Math.random() * 12));
    } else {
      cursor.style.transition = 'opacity 400ms ease';
      cursor.style.opacity    = '0';
      setTimeout(function() { cursor.remove(); }, 440);

      if (chips && chips.length) {
        var chipsEl = document.createElement('div');
        chipsEl.className = 'ca-reply-chips';
        chips.forEach(function(label) {
          var btn = document.createElement('button');
          btn.className    = 'ca-reply-chip';
          btn.textContent  = label;
          btn.onclick      = function() { _caReplyChip(label); };
          chipsEl.appendChild(btn);
        });
        aiDiv.appendChild(chipsEl);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            chipsEl.classList.add('visible');
            msgs.scrollTop = msgs.scrollHeight;
          });
        });
      }
    }
  }
  setTimeout(typeChar, 60);
}

function _caAppendUserMsg(text) {
  var msgs = document.getElementById('caMsgs');
  var d = document.createElement('div');
  d.className = 'ca-msg-user';
  d.innerHTML = '<div class="ca-msg-user-bubble">' + _agEscape(text) + '</div>';
  msgs.appendChild(d);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      d.classList.add('visible');
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
}

function _caDisableReplyChips() {
  document.querySelectorAll('#caMsgs .ca-reply-chip').forEach(function(b) { b.disabled = true; });
}

function _caReplyChip(text) {
  _caDisableReplyChips();
  _caAppendUserMsg(text);
  _caProcessInput(text);
}

// ── Send ──────────────────────────────────────────────

function caSend() {
  var f = document.getElementById('caField');
  if (!f) return;
  var text = f.value.trim();
  if (!text) return;

  f.value = ''; f.style.height = 'auto';
  var s = document.getElementById('caSend');
  if (s) { s.classList.remove('active'); s.setAttribute('aria-disabled', 'true'); }
  _caDisableReplyChips();

  if (!_cardAgentConvo) {
    _cardAgentConvo = true;
    document.getElementById('card-agent-screen').classList.add('ca-convo');
    _caHideChips();

    var detected = _caDetectType(text);
    _caAppendUserMsg(text);
    if (detected) {
      _caStartConvo(detected);
    } else {
      _caState.step = 'choose_type';
      _caAppendAiMsg("What kind of card is this for?",
        ['Subscription','Merchant','Event','Budget','Safety / Trial','Added user']);
    }
    return;
  }

  _caAppendUserMsg(text);
  _caProcessInput(text);
}

function _caDetectType(t) {
  t = t.toLowerCase();
  if (/subscri|netflix|spotify|chatgpt|hulu|disney|streaming|saas/.test(t))       return 'subscription';
  if (/merchant|amazon|uber|target|store|retailer|whole foods/.test(t))            return 'merchant';
  if (/event|trip|wedding|party|vacation|holiday|diwali|birthday/.test(t))         return 'event';
  if (/budget|grocery|groceries|dining|fuel|gas|envelope|categories/.test(t))      return 'budget';
  if (/trial|safety|burner|temp|unknown site|one.?time|free trial/.test(t))        return 'safety';
  if (/spouse|wife|husband|child|kid|daughter|son|delegate|family member/.test(t)) return 'added_user';
  return null;
}

// ── Input processing state machine ───────────────────

function _caProcessInput(rawText) {
  if (!_caState) return;
  var step = _caState.step;
  var t    = rawText.toLowerCase().trim();

  // Choose-type step (free-text initiated convo, didn't match a type)
  if (step === 'choose_type') {
    var typeMap = {
      subscription: 'subscription', merchant: 'merchant', event: 'event',
      budget: 'budget', safety: 'safety', 'safety / trial': 'safety',
      'added user': 'added_user', added_user: 'added_user',
    };
    var chosen = null;
    for (var key in typeMap) {
      if (t.includes(key)) { chosen = typeMap[key]; break; }
    }
    if (!chosen) chosen = _caDetectType(t);
    if (chosen) { _caStartConvo(chosen); }
    else { _caAppendAiMsg("Pick a card type to get started:", ['Subscription','Merchant','Event','Budget','Safety / Trial','Added user']); }
    return;
  }

  if (step === 'who') {
    _caState.data.who = rawText;
    _caState.flowIdx++;
    _caAdvanceFlow();
    return;
  }

  if (step === 'name' || step === 'category') {
    _caState.data.name = rawText;
    _caUpdatePreview();
    _caState.flowIdx++;
    _caAdvanceFlow();
    return;
  }

  if (step === 'limit_monthly' || step === 'limit_total' || step === 'limit_pertx') {
    var noLimit = /no limit|unlimited|none/.test(t);
    var numMatch = t.match(/(\d[\d,]*)/);
    if (noLimit) {
      _caState.data.limit      = null;
      _caState.data.limitLabel = 'No limit';
    } else if (numMatch) {
      var n = parseInt(numMatch[1].replace(/,/g, ''));
      _caState.data.limit      = n;
      _caState.data.limitLabel = '$' + n.toLocaleString() +
        (step === 'limit_monthly' ? '/mo' : step === 'limit_pertx' ? '/tx' : ' total');
    } else {
      _caAppendAiMsg("Enter an amount, like $200 or $50.", null);
      return;
    }
    _caUpdatePreview();
    _caState.flowIdx++;
    _caAdvanceFlow();
    return;
  }

  if (step === 'space') {
    var matched = null;
    _CA_SPACES.forEach(function(sp) {
      if (t.includes(sp.label.toLowerCase()) || t.includes(sp.id)) matched = sp;
    });
    if (!matched) {
      _CA_SPACES.forEach(function(sp) {
        sp.label.toLowerCase().split(' ').forEach(function(w) {
          if (w.length > 2 && t.includes(w)) matched = sp;
        });
      });
    }
    if (!matched) matched = _CA_SPACES[0];
    _caState.data.space = matched;
    _caState.flowIdx++;
    _caRenderSummary();
    return;
  }
}

function _caUpdatePreview() {
  var prev   = document.getElementById('caPreview');
  var nameEl = document.getElementById('caPreviewName');
  var limEl  = document.getElementById('caPreviewLimit');
  if (!prev) return;
  if (_caState.data.name) {
    if (nameEl) nameEl.textContent = _caState.data.name;
    prev.classList.add('visible');
  }
  if (_caState.data.limitLabel && limEl) {
    limEl.textContent    = _caState.data.limitLabel;
    limEl.style.display  = '';
  }
}

// ── Summary card ──────────────────────────────────────

function _caRenderSummary() {
  var d         = _caState.data;
  var typeLabel = _CA_TYPE_LABELS[_caState.cardType] || 'Virtual card';
  var cardName  = d.name || d.category || d.who || 'New card';
  var spaceName = d.space ? d.space.label : 'USD Checking';
  var limitText = d.limitLabel || 'No limit set';

  var msgs  = document.getElementById('caMsgs');
  var aiDiv = document.createElement('div');
  aiDiv.className = 'ca-msg-ai';
  aiDiv.innerHTML =
    '<div class="ca-msg-ai-label" aria-hidden="true">' +
      '<div class="ca-msg-ai-dot-wrap"><div class="ca-msg-ai-dot"></div></div>' +
      '<span class="ca-msg-ai-name">Banyan</span>' +
    '</div>';
  msgs.appendChild(aiDiv);
  setTimeout(function() {
    requestAnimationFrame(function() { aiDiv.classList.add('visible'); msgs.scrollTop = msgs.scrollHeight; });
  }, 50);

  var intro = "Here's your card. Tap Create to add it to your wallet.";
  var textEl = document.createElement('div');
  textEl.className = 'ca-msg-ai-text';
  var cursor = document.createElement('span');
  cursor.className = 'ag-cursor';
  textEl.appendChild(cursor);
  aiDiv.appendChild(textEl);

  var chars = intro.split(''), i = 0;
  function typeIntro() {
    if (i < chars.length) {
      cursor.insertAdjacentText('beforebegin', chars[i++]);
      setTimeout(typeIntro, 16 + Math.floor(Math.random() * 10));
    } else {
      cursor.remove();
      setTimeout(function() {
        _caAppendSummaryCard(aiDiv, msgs, cardName, typeLabel, spaceName, limitText, d);
      }, 100);
    }
  }
  setTimeout(typeIntro, 60);
}

function _caAppendSummaryCard(aiDiv, msgs, cardName, typeLabel, spaceName, limitText, d) {
  var card = document.createElement('div');
  card.className = 'ca-summary-card ag-ui-card';

  var limitRow = d.limitLabel
    ? '<div class="ca-sum-row"><span class="ca-sum-key">Limit</span><span class="ca-sum-val">' + _agEscape(limitText) + '</span></div>'
    : '';

  card.innerHTML =
    '<div class="ca-sum-card-preview">' +
      '<img src="assets/card-create-preview.webp" alt="" class="ca-sum-img">' +
      '<div class="ca-sum-card-name">' + _agEscape(cardName) + '</div>' +
    '</div>' +
    '<div class="ca-sum-rows">' +
      '<div class="ca-sum-row"><span class="ca-sum-key">Type</span><span class="ca-sum-val ca-sum-badge">' + _agEscape(typeLabel) + '</span></div>' +
      limitRow +
      '<div class="ca-sum-row"><span class="ca-sum-key">Space</span><span class="ca-sum-val">' + _agEscape(spaceName) + '</span></div>' +
    '</div>' +
    '<button class="ca-sum-cta" onclick="caConfirmCreate()">' +
      'Create card' +
      '<span class="ico ol" style="--ico:url(\'Icons/ArrowRight.svg\');--sz:18px;color:#fff;margin-left:4px" aria-hidden="true"></span>' +
    '</button>';

  aiDiv.appendChild(card);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      card.classList.add('ui-in');
      msgs.scrollTop = msgs.scrollHeight;
    });
  });
}

function caConfirmCreate() {
  closeCardAgent();
  setTimeout(function() { showToast('Card created'); }, 340);
}

/* ── Face ID sheet (Apple light-mode) ───────────────────── */
var _fscTimers = [];
function _fscClearTimers() { _fscTimers.forEach(clearTimeout); _fscTimers = []; }

function smShowFaceScan() {
  const overlay  = document.getElementById('faceScanOverlay');
  const subLabel = document.getElementById('fscTitle');

  _fscClearTimers();

  // Reset
  overlay.classList.remove('fsc-scanning', 'fsc-done');
  subLabel.textContent = 'Face ID';

  overlay.classList.add('open');

  // Sheet slides up, then glyph appears — soft tick as scanning starts
  _fscTimers.push(setTimeout(function() {
    overlay.classList.add('fsc-scanning');
    haptic(10);
  }, 80));

  // ~1.3s: authenticated — crisp double-tap success pattern
  _fscTimers.push(setTimeout(function() {
    overlay.classList.remove('fsc-scanning');
    overlay.classList.add('fsc-done');
    subLabel.textContent = 'Confirmed';
    haptic([35, 55, 90]);
  }, 1350));

  // ~1.9s: dismiss + proceed
  _fscTimers.push(setTimeout(function() {
    overlay.classList.remove('open');
    _fscTimers.push(setTimeout(function() {
      overlay.classList.remove('fsc-done');
    }, 400));
    smGoToProgress();
  }, 1900));
}

function fscCancel() {
  _fscClearTimers();
  const overlay = document.getElementById('faceScanOverlay');
  overlay.classList.remove('open');
  setTimeout(function() {
    overlay.classList.remove('fsc-scanning', 'fsc-done');
  }, 400);
}

/* ── Home notifications digest (switchable categories) ───────── */
var HOME_DIGEST = [
  { cat: 'Needs your action',
    desc: 'The most important — you can actually do something here.',
    items: [
      { h: 'Payment needs approval', t: 'Your ₹50,000 transfer to Rohan is ready to send. Review and approve.' },
      { h: 'Scheduled payment coming up', t: 'Your rent payment to Priya is scheduled for tomorrow.' },
      { h: 'Add funds before payment', t: 'Your India electricity bill is due in 2 days. Add $120 to your Banyan account to pay it on time.' },
      { h: 'Beneficiary needs verification', t: "Rohan's bank details need one more check before you can send money." },
      { h: 'Physical card activation pending', t: 'Your physical card has arrived. Activate it to start using it in stores and ATMs.' },
      { h: 'Set card PIN', t: 'Set a PIN so your card is ready for contactless payments and ATM use.' },
      { h: 'KYC / document pending', t: 'We need one document to keep your account active.' },
      { h: 'Failed payment retry', t: "Your payment to HDFC Bank didn't go through. You can try again now." },
      { h: 'Refund confirmation', t: "Your expected refund from Amazon hasn't arrived yet. Keep tracking or mark it resolved." }
    ] },
  { cat: 'Money movement updates',
    desc: 'Status items — not always something you need to act on.',
    items: [
      { h: 'India transfer update', t: 'Your ₹25,000 payment to Mom is being sent to her bank.' },
      { h: 'Payment completed', t: 'Your transfer to Rohan was deposited today.' },
      { h: 'Payment delayed', t: "Your payment to ICICI Bank is taking longer than usual. We're watching it." },
      { h: 'Payment returned', t: 'Your payment was returned and the amount has been credited back.' },
      { h: 'Exchange rate movement', t: 'The USD-INR rate is better than yesterday. Sending $1,000 now gives ₹830 more.' },
      { h: 'Saved recipient activity', t: 'You sent money to Mom around this time last month.' }
    ] },
  { cat: 'Account health',
    desc: 'Stay aware of your money without having to dig for it.',
    items: [
      { h: 'Low balance', t: 'Your Banyan balance is lower than usual.' },
      { h: 'Large debit', t: '$1,200 was spent from your primary account yesterday.' },
      { h: 'Incoming money', t: 'Your salary deposit arrived today.' },
      { h: 'Interest earned', t: 'You earned $12.40 in interest this month.' },
      { h: 'Space balance warning', t: 'Your Bills space may not have enough for upcoming payments.' },
      { h: 'Account statement ready', t: 'Your May statement is ready.' }
    ] },
  { cat: 'Card controls & spend',
    desc: 'Especially handy with virtual and purpose-based cards.',
    items: [
      { h: 'Virtual card created', t: 'Your Travel card is ready to use digitally.' },
      { h: 'Spend limit nearing', t: 'Your Groceries card has used 80% of its monthly limit.' },
      { h: 'Card frozen', t: "Your Shopping card is frozen. New transactions won't go through." },
      { h: 'Suspicious transaction', t: 'We noticed an unusual card payment at 2:14 AM. Review it.' },
      { h: 'Merchant restriction blocked a payment', t: 'Your Single Store card blocked a payment outside the allowed merchant.' },
      { h: 'Subscription detected', t: 'Netflix charged your Entertainment card today.' },
      { h: 'Trial ending', t: 'Your free trial may renew in 2 days.' }
    ] }
];
var _digestActive = 0;

function _digestEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderDigest() {
  var cat = HOME_DIGEST[_digestActive];
  if (!cat) return;
  var lbl = document.getElementById('digestCatLabel');
  var desc = document.getElementById('digestDesc');
  var list = document.getElementById('digestList');
  var menu = document.getElementById('digestMenu');
  if (!lbl || !list) return;
  lbl.textContent = cat.cat;
  if (desc) desc.textContent = cat.desc;
  // build menu once
  if (menu && !menu.childElementCount) {
    HOME_DIGEST.forEach(function(c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = c.cat;
      b.setAttribute('role', 'option');
      b.onclick = function(e) { e.stopPropagation(); selectDigest(i); };
      menu.appendChild(b);
    });
  }
  if (menu) {
    Array.prototype.forEach.call(menu.children, function(b, i) {
      b.classList.toggle('sel', i === _digestActive);
    });
  }
  // build the item list
  var html = '';
  cat.items.forEach(function(it) {
    html += '<button type="button" class="home-digest-item" onclick="openHomeAgent()">' +
            '<p class="home-digest-item-h">' + _digestEscape(it.h) + '</p>' +
            '<p class="home-digest-item-t">' + _digestEscape(it.t) + '</p>' +
            '</button>';
  });
  list.innerHTML = html;
}
function toggleDigestMenu(e) {
  if (e) e.stopPropagation();
  var head = document.querySelector('.home-digest-head');
  var drop = document.getElementById('digestDrop');
  if (!head) return;
  var open = head.classList.toggle('open');
  if (drop) drop.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function selectDigest(i) {
  _digestActive = i;
  renderDigest();
  var head = document.querySelector('.home-digest-head');
  var drop = document.getElementById('digestDrop');
  if (head) head.classList.remove('open');
  if (drop) drop.setAttribute('aria-expanded', 'false');
}
// close the menu when tapping elsewhere
document.addEventListener('click', function(e) {
  var head = document.querySelector('.home-digest-head.open');
  if (head && !head.contains(e.target)) head.classList.remove('open');
});
// initial render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderDigest);
} else {
  renderDigest();
}

/* ═══════════════════════════════════════════════════════════════════
   SUPPORT CASE EXPERIENCE (prototype, mock-backed)
   AI-first: tickets appear only when the Agent escalates / human
   follow-up is needed. Customer-safe copy; no internal risk labels.
   ═══════════════════════════════════════════════════════════════════ */

// Customer-facing statuses (maps onto the product's customer ticket statuses)
var _SUP_STATUS = {
  open:                { label: 'Open',          cls: 'sup-st-open' },
  waiting_on_customer: { label: 'Action needed', cls: 'sup-st-wait' },
  in_review:           { label: 'In review',     cls: 'sup-st-review' },
  resolved:            { label: 'Resolved',      cls: 'sup-st-resolved' },
  closed:              { label: 'Closed',        cls: 'sup-st-closed' },
  cancelled:           { label: 'Cancelled',     cls: 'sup-st-closed' },
};
// Intake channels — structured so email/voice extend cleanly later
var _SUP_CHANNEL = {
  chat:     { label: 'Started in Agent chat', icon: 'ChatCircle.svg' },
  email:    { label: 'Started by email',      icon: 'EnvelopeOpen.svg' },
  voice:    { label: 'Started by phone',      icon: 'Phone.svg' },
  internal: { label: 'Opened by Banyan',      icon: 'ShieldCheck.svg' },
};

// Seeded mock cases — one per channel, covering key statuses + a regulated case
var _supportCases = [
  {
    id: 'BNY-48213', title: 'Two Uber Eats charges you didn’t recognize',
    status: 'in_review', channel: 'chat', regulated: true,
    receivedAt: 'Today, 7:20 PM', lastUpdate: '2h ago', waitingOnCustomer: false,
    summary: 'You reported two Uber Eats charges of $42.18 posted 3 minutes apart on your dining card that you didn’t recognize.',
    context: [
      { type: 'card', label: 'Banyan Visa •• 4821' },
      { type: 'transaction', label: 'Uber Eats · $42.18 · 7:12 PM' },
      { type: 'transaction', label: 'Uber Eats · $42.18 · 7:15 PM' },
    ],
    timeline: [
      { kind: 'intake', channel: 'chat', ts: 'Today, 7:20 PM', text: 'Reported through the Banyan Agent after it flagged a possible duplicate charge.' },
      { kind: 'system', ts: 'Today, 7:20 PM', text: 'We recorded when we received your report and opened a case to review it.' },
      { kind: 'human', author: 'Priya · Banyan Support', ts: 'Today, 8:05 PM', text: 'Thanks for flagging this. We’ve started reviewing both charges and will update you within 1 business day. Your card is safe to keep using.' },
    ],
  },
  {
    id: 'BNY-47981', title: 'Transfer to Rohan hasn’t arrived',
    status: 'waiting_on_customer', channel: 'email', regulated: false,
    receivedAt: 'Yesterday, 10:02 AM', lastUpdate: '1d ago', waitingOnCustomer: true,
    summary: 'Your $1,000 transfer to Rohan Rathod shows as sent but hasn’t landed in their HDFC account.',
    context: [
      { type: 'payment', label: 'Transfer · $1,000.00 → ₹91,780' },
      { type: 'recipient', label: 'Rohan Rathod · HDFC •• 7654' },
    ],
    requested: 'Could you confirm the last 4 digits of Rohan’s account and the date they expected it? That helps us trace it with the receiving bank.',
    timeline: [
      { kind: 'intake', channel: 'email', ts: 'Yesterday, 10:02 AM', text: 'Received by email at support@banyan.fi.', excerpt: 'Hi, I sent $1,000 to Rohan two days ago and he still hasn’t received it. The app says it was sent. Can you help?' },
      { kind: 'system', ts: 'Yesterday, 10:03 AM', text: 'We opened a case and attached your transfer details.' },
      { kind: 'human', author: 'Marcus · Banyan Support', ts: 'Yesterday, 3:40 PM', text: 'We’re tracing this with our banking partner. To move faster, we need a couple of details from you.' },
      { kind: 'requested', ts: 'Yesterday, 3:40 PM', text: 'Could you confirm the last 4 digits of Rohan’s account and the date they expected it?' },
    ],
  },
  {
    id: 'BNY-47420', title: 'Couldn’t change your travel card PIN',
    status: 'resolved', channel: 'voice', regulated: false,
    receivedAt: 'Jun 24, 2:15 PM', lastUpdate: '4d ago', waitingOnCustomer: false,
    summary: 'You called because the app wouldn’t let you set a new PIN on your travel card.',
    context: [ { type: 'card', label: 'Banyan Visa •• 4821' } ],
    callSummary: '3 min call. You couldn’t save a new PIN — the confirm step kept erroring. Agent reset the PIN flow and confirmed a new PIN was set successfully before the call ended.',
    timeline: [
      { kind: 'intake', channel: 'voice', ts: 'Jun 24, 2:15 PM', text: 'Received by phone. Call summary and recording reference attached.' },
      { kind: 'human', author: 'Dana · Banyan Support', ts: 'Jun 24, 2:22 PM', text: 'Cleared the stuck PIN-change and confirmed your new PIN saved. Anything else, just reply here — no need to call back.' },
      { kind: 'resolved', ts: 'Jun 24, 2:23 PM', text: 'Marked resolved. You can reopen this if it happens again.' },
    ],
  },
];

function _supEl(id) { return document.getElementById(id); }
function _supIco(name, sz, color) {
  return '<span class="ico ol" style="--ico:url(\'Icons/' + name + '\');--sz:' + (sz || 16) + 'px;color:' + (color || 'rgba(0,0,0,0.55)') + '" aria-hidden="true"></span>';
}
function _supOpenScreen(id) {
  var s = _supEl(id); if (!s) return;
  s.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(function() { s.classList.add('on'); });
}
function _supCloseScreen(id) {
  var s = _supEl(id); if (!s) return;
  s.classList.remove('on'); s.setAttribute('aria-hidden', 'true');
}

/* ── Case list ─────────────────────────────────────────── */
function openSupportCases() { haptic(6); renderSupportList(); _supOpenScreen('support-cases'); }
function closeSupportCases() { _supCloseScreen('support-cases'); }

function renderSupportList() {
  var body = _supEl('supportCasesBody'); if (!body) return;
  if (!_supportCases.length) {
    body.innerHTML =
      '<div class="sup-empty">' +
        '<div class="sup-empty-ic">' + _supIco('ChatCircle.svg', 26, 'var(--brand-primary)') + '</div>' +
        '<div class="sup-empty-title">No support cases yet</div>' +
        '<div class="sup-empty-sub">If the Banyan Agent can’t resolve something, your support case will appear here with the full conversation and next steps.</div>' +
        '<button class="sup-empty-btn" type="button" onclick="closeSupportCases()">Ask the Banyan Agent</button>' +
      '</div>';
    return;
  }
  var open = _supportCases.filter(function(c) { return ['open','waiting_on_customer','in_review'].indexOf(c.status) > -1; });
  var past = _supportCases.filter(function(c) { return ['resolved','closed','cancelled'].indexOf(c.status) > -1; });
  var html = '<h1 class="sup-h1">Support</h1><p class="sup-lede">Banyan’s Agent handles most issues instantly. Anything that needs a person shows up here.</p>';
  if (open.length) html += '<div class="sup-group-label">Active</div>' + open.map(_supRowHtml).join('');
  if (past.length) html += '<div class="sup-group-label">Past cases</div>' + past.map(_supRowHtml).join('');
  body.innerHTML = html;
}
function _supRowHtml(c) {
  var st = _SUP_STATUS[c.status] || _SUP_STATUS.open;
  var ch = _SUP_CHANNEL[c.channel] || _SUP_CHANNEL.chat;
  var wait = c.waitingOnCustomer;
  return '<button class="sup-row' + (wait ? ' sup-row-wait' : '') + '" type="button" onclick="openSupportCase(\'' + c.id + '\')">' +
    '<div class="sup-row-top"><span class="sup-row-title">' + _agEscape(c.title) + '</span>' +
      '<span class="sup-pill ' + st.cls + '">' + st.label + '</span></div>' +
    '<div class="sup-row-meta">' + _supIco(ch.icon, 13, 'rgba(0,0,0,0.4)') +
      '<span>' + c.id + '</span><span class="sup-dot">·</span><span>Updated ' + _agEscape(c.lastUpdate) + '</span></div>' +
    (wait ? '<div class="sup-row-flag">' + _supIco('Clock.svg', 12, '#875610') + 'Banyan needs a bit more info</div>' : '') +
  '</button>';
}

/* ── Case detail ───────────────────────────────────────── */
function openSupportCase(id) {
  haptic(6);
  var c = _supportCases.find(function(x) { return x.id === id; });
  if (!c) return;
  renderSupportCase(c);
  _supOpenScreen('support-case');
}
function closeSupportCase() {
  var bar = _supEl('supComposerBar'); if (bar) bar.hidden = true;
  _supCloseScreen('support-case');
}

function renderSupportCase(c) {
  var nav = _supEl('supCaseNavTitle'); if (nav) nav.textContent = c.id;
  var st = _SUP_STATUS[c.status] || _SUP_STATUS.open;
  var ch = _SUP_CHANNEL[c.channel] || _SUP_CHANNEL.chat;
  var isOpen = ['open','waiting_on_customer','in_review'].indexOf(c.status) > -1;

  var html = '';
  // Thread subject header (stays document-like; the body below is a chat)
  html += '<div class="sup-c-head">';
  html += '<div class="sup-d-top"><span class="sup-d-id">' + c.id + '</span><span class="sup-pill ' + st.cls + '">' + st.label + '</span></div>';
  html += '<h1 class="sup-c-title">' + _agEscape(c.title) + '</h1>';
  html += '<div class="sup-c-start">' + _supIco(ch.icon, 12, 'rgba(0,0,0,0.4)') + '<span>' + ch.label + ' · ' + _agEscape(c.receivedAt) + '</span></div>';
  html += '</div>';

  // ── Chat thread: Banyan/support on the left, the customer on the right ──
  var chat = '';

  // Opening — Banyan's summary of what it understands
  chat += _supMsgIn(_agEscape(c.summary), { author: 'Banyan', av: 'leaf' });

  // Attached context, as an attachment bubble from Banyan
  if (c.context && c.context.length) {
    chat += _supMsgIn(
      '<div class="sup-msg-attach-label">Attached to this case</div><div class="sup-chips">' +
        c.context.map(function(x) { return '<span class="sup-chip">' + _agEscape(x.label) + '</span>'; }).join('') +
      '</div>', { av: 'leaf' });
  }

  // Voice call summary, as a Banyan bubble
  if (c.channel === 'voice' && c.callSummary) {
    chat += _supMsgIn(
      '<div class="sup-msg-attach-label">Call summary</div>' + _agEscape(c.callSummary) +
      '<div class="sup-ref">' + _supIco('Phone.svg', 12, 'rgba(0,0,0,0.4)') + 'Recording reference available to support</div>',
      { av: 'leaf' });
  }

  // Regulated / priority protection note (customer-safe wording)
  if (c.regulated) {
    chat += _supMsgIn(
      '<div class="sup-protect-t">We’ve opened a case for this issue</div>' +
      '<div class="sup-protect-s">Banyan recorded when we received your report and is reviewing the details. You’ll see updates here, and we’ll let you know if we need anything.</div>',
      { av: 'shield', bubbleCls: 'sup-msg-bubble--note' });
  }

  // Timeline → chat messages
  chat += c.timeline.map(function(ev) { return _supChatMsg(ev, ch); }).join('');

  html += '<div class="sup-chat">' + chat + '</div>';

  // Closed/resolved note lives in the scroll; the reply composer is a fixed bar
  if (!isOpen) {
    html += '<div class="sup-closed-note">' + _supIco('CheckCircle.svg', 15, 'var(--brand-primary)') +
      '<span>This case is ' + st.label.toLowerCase() + '. ' + (c.status === 'resolved' ? 'Something still off? ' : '') + '</span>' +
      (c.status === 'resolved' ? '<button class="sup-reopen" type="button" onclick="supportReopen(\'' + c.id + '\')">Reopen case</button>' : '') +
    '</div>';
  }

  var body = _supEl('supportCaseBody');
  if (body) {
    body.classList.toggle('has-composer', isOpen); // bottom padding to clear the bar
    body.innerHTML = html; body.scrollTop = 0;
  }

  // Sticky composer — starts single-line, grows with content, only when open
  _supCurrentCaseId = c.id;
  var bar = _supEl('supComposerBar');
  if (bar) {
    bar.hidden = !isOpen;
    var f = _supEl('supReplyField');
    if (f) { f.value = ''; f.style.height = 'auto'; }
  }
}
// Banyan / support avatar for left-side (incoming) chat bubbles
function _supAv(kind) {
  if (kind === 'shield') return '<span class="sup-msg-ic">' + _supIco('ShieldCheck.svg', 14, 'var(--brand-primary)') + '</span>';
  // leaf (Banyan)
  return '<span class="sup-msg-ic"><svg viewBox="0 0 24 24" width="14" height="14" fill="#46882B" aria-hidden="true">' +
    '<path d="M6.05 8.05c-2.73 2.73-2.73 7.17-.02 9.9 1.47-3.4 4.09-6.24 7.36-7.93-2.77 2.34-4.71 5.61-5.39 9.32 2.6 1.23 5.8.78 7.95-1.37C19.43 14.47 20 4 20 4S9.53 4.57 6.05 8.05z"/></svg></span>';
}
// Left-side (Banyan / support) chat bubble
function _supMsgIn(bodyHtml, opts) {
  opts = opts || {};
  var author = opts.author ? '<div class="sup-msg-author">' + _agEscape(opts.author) + '</div>' : '';
  var time = opts.ts ? '<div class="sup-msg-time">' + _agEscape(opts.ts) + '</div>' : '';
  var bubbleCls = 'sup-msg-bubble' + (opts.bubbleCls ? ' ' + opts.bubbleCls : '');
  return '<div class="sup-msg sup-msg--in">' +
    '<div class="sup-msg-av">' + _supAv(opts.av) + '</div>' +
    '<div class="sup-msg-col">' + author +
      '<div class="' + bubbleCls + '">' + bodyHtml + '</div>' + time +
    '</div></div>';
}
// Right-side (customer) chat bubble
function _supMsgOut(text, ts) {
  return '<div class="sup-msg sup-msg--out"><div class="sup-msg-col">' +
    '<div class="sup-msg-bubble sup-msg-bubble--out">' + _agEscape(text) + '</div>' +
    (ts ? '<div class="sup-msg-time">' + _agEscape(ts) + '</div>' : '') +
    '</div></div>';
}
// Centered system line (neutral events, dividers)
function _supSysLine(text, ts, ico) {
  return '<div class="sup-sysline">' + (ico || '') + '<span>' + _agEscape(text) +
    (ts ? '<span class="sup-sysline-ts"> · ' + _agEscape(ts) + '</span>' : '') + '</span></div>';
}
// One timeline event → chat message(s)
function _supChatMsg(ev, ch) {
  if (ev.kind === 'intake') {
    var chIco = _SUP_CHANNEL[ev.channel] ? _SUP_CHANNEL[ev.channel].icon : (ch && ch.icon) || 'ChatCircle.svg';
    var out = _supSysLine(ev.text, ev.ts, _supIco(chIco, 12, 'rgba(0,0,0,0.4)'));
    // the customer's own words (e.g. an email) land on the right
    if (ev.excerpt) out += _supMsgOut(ev.excerpt, ev.ts);
    return out;
  }
  if (ev.kind === 'human') {
    return _supMsgIn(_agEscape(ev.text), { av: 'shield', author: ev.author || 'Banyan Support', ts: ev.ts });
  }
  if (ev.kind === 'customer') {
    return _supMsgOut(ev.text, ev.ts);
  }
  if (ev.kind === 'requested') {
    return _supMsgIn(
      '<div class="sup-req-inline">' + _supIco('Clock.svg', 13, '#875610') + 'Banyan needs a bit more info</div>' + _agEscape(ev.text),
      { av: 'shield', bubbleCls: 'sup-msg-bubble--req', ts: ev.ts });
  }
  if (ev.kind === 'resolved') {
    return _supSysLine(ev.text, ev.ts, _supIco('CheckCircle.svg', 13, 'var(--brand-primary)'));
  }
  // system / other → centered system line
  return _supSysLine(ev.text, ev.ts);
}

// Auto-grow the reply field (single line → multi-line as content is typed)
function supReplyGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}
function supReplyKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); supportReply(); }
}
function supportReply(id) {
  id = id || _supCurrentCaseId;
  var c = _supportCases.find(function(x) { return x.id === id; });
  var f = _supEl('supReplyField');
  if (!c || !f) return;
  var val = f.value.trim();
  if (!val) { f.focus(); return; }
  f.value = ''; f.style.height = 'auto';
  c.timeline.push({ kind: 'customer', ts: 'Just now', text: val });
  c.timeline.push({ kind: 'system', ts: 'Just now', text: 'Banyan received your response. Support will follow up here.' });
  c.waitingOnCustomer = false;
  if (c.status === 'waiting_on_customer') c.status = 'in_review';
  c.lastUpdate = 'just now';
  haptic(8);
  renderSupportCase(c);
  showToast('Reply sent');
}
function supportReopen(id) {
  var c = _supportCases.find(function(x) { return x.id === id; });
  if (!c) return;
  c.status = 'in_review'; c.lastUpdate = 'just now';
  c.timeline.push({ kind: 'system', ts: 'Just now', text: 'You reopened this case. Support will take another look.' });
  renderSupportCase(c);
  showToast('Case reopened');
}

/* ── Ticket creation from an unresolved Agent conversation ── */
var _supPendingTicket = null;
var _supCurrentCaseId = null;
function agOpenTicketCreate(opts) {
  opts = opts || {};
  _supPendingTicket = {
    title: opts.title || 'Support request',
    summary: opts.summary || 'You asked the Banyan Agent for help and it couldn’t fully resolve the issue.',
    context: opts.context || [],
    regulated: !!opts.regulated,
  };
  var sheet = _supEl('supCreate');
  if (!sheet) return;
  sheet.innerHTML = _supCreateFormHtml(_supPendingTicket);
  _supEl('supCreateScrim').classList.add('show');
  requestAnimationFrame(function() { sheet.classList.add('show'); });
}
function _supCreateFormHtml(t) {
  var ctx = t.context.length
    ? '<div class="sup-chips">' + t.context.map(function(x) { return '<span class="sup-chip">' + _agEscape(x.label) + '</span>'; }).join('') + '</div>'
    : '<div class="sup-create-empty">No specific transaction attached.</div>';
  return '<div class="sup-create-grab"></div>' +
    '<div class="sup-create-title">Create a support ticket</div>' +
    '<div class="sup-create-sub">A person will review this. Banyan attaches the context below so you don’t have to repeat yourself.</div>' +
    '<div class="sup-create-label">Issue summary</div>' +
    '<div class="sup-create-summary">' + _agEscape(t.summary) + '</div>' +
    '<div class="sup-create-label">Banyan will attach</div>' + ctx +
    '<div class="sup-create-label">Anything else to add?</div>' +
    '<textarea id="supCreateNote" class="sup-create-note" rows="3" placeholder="Optional — add any detail that might help"></textarea>' +
    '<div class="sup-create-actions">' +
      '<button class="sup-create-cancel" type="button" onclick="closeTicketCreate()">Cancel</button>' +
      '<button class="sup-create-submit" type="button" onclick="supportCreateTicket()">Create ticket</button>' +
    '</div>';
}
function closeTicketCreate() {
  var sheet = _supEl('supCreate');
  if (sheet) sheet.classList.remove('show');
  var scrim = _supEl('supCreateScrim');
  if (scrim) scrim.classList.remove('show');
}
function supportCreateTicket() {
  var t = _supPendingTicket; if (!t) return;
  var noteEl = _supEl('supCreateNote');
  var note = noteEl ? noteEl.value.trim() : '';
  var id = 'BNY-' + (48000 + Math.floor(Math.random() * 1900));
  var tl = [
    { kind: 'intake', channel: 'chat', ts: 'Just now', text: 'Created from your Banyan Agent conversation. The full chat context is attached for support.' },
    { kind: 'system', ts: 'Just now', text: t.regulated
        ? 'We recorded when we received your report and opened a case for review.'
        : 'We opened a case and attached your conversation. A person will follow up here.' },
  ];
  if (note) tl.splice(1, 0, { kind: 'customer', ts: 'Just now', text: note });
  var c = {
    id: id, title: t.title, summary: t.summary,
    status: t.regulated ? 'in_review' : 'open', channel: 'chat', regulated: t.regulated,
    receivedAt: 'Just now', lastUpdate: 'just now', waitingOnCustomer: false,
    context: t.context, timeline: tl,
  };
  _supportCases.unshift(c);
  _supPendingTicket = null;
  // Success state in the same sheet, then hand off to the case
  var sheet = _supEl('supCreate');
  if (sheet) {
    sheet.innerHTML = '<div class="sup-create-grab"></div>' +
      '<div class="sup-create-success">' +
        '<div class="sup-success-ic">' + _supIco('CheckCircle.svg', 30, 'var(--brand-primary)') + '</div>' +
        '<div class="sup-create-title">' + (c.regulated ? 'We’ve opened a case for this issue' : 'Support case created') + '</div>' +
        '<div class="sup-create-sub">' + (c.regulated
          ? 'Banyan recorded when we received your report and will review the details. You’ll see updates here.'
          : 'Ticket ' + id + '. A person will follow up here — no need to repeat yourself.') + '</div>' +
        '<div class="sup-success-id">' + id + '</div>' +
        '<button class="sup-create-submit sup-success-btn" type="button" onclick="closeTicketCreate();openSupportCase(\'' + id + '\')">View case</button>' +
      '</div>';
  }
  showToast('Support case ' + id + ' created');
}

/* Agent render: offer to create a ticket when a conversation is unresolved */
function _agScenarioSupportEscalate() {
  return { type: 'support_escalate', fast: true, data: {} };
}
function _agRenderSupportEscalate(aiDiv, msgs) {
  var card = document.createElement('div');
  card.className = 'ag-ui-card';
  card.innerHTML =
    '<div class="ag-alert-head ag-stagger-item"><div class="ag-alert-icon" style="background:rgba(70,136,43,0.12)">' + _supIco('ShieldCheck.svg', 18, 'var(--brand-primary)') + '</div>' +
      '<div class="ag-alert-head-text"><span class="ag-alert-title">Bring in a person</span><span class="ag-alert-merchant">A support case keeps your full chat context</span></div></div>' +
    '<div class="ag-charge-gap ag-stagger-item" style="border-top:0.5px solid rgba(0,0,0,0.06);background:transparent;color:var(--text-secondary)">You won’t have to repeat anything you told me.</div>' +
    '<button class="ag-tr2-confirm-btn ag-stagger-item" style="margin-top:12px" type="button" id="agEscalateBtn">Create a support ticket</button>';
  _agAddCtx(aiDiv, 'No problem — I can hand this to our support team. They’ll pick up right here with everything from our chat, and reply in your Support cases.', function() {
    _agRevealCard(aiDiv, card, function() {
      var btn = card.querySelector('#agEscalateBtn');
      if (btn) btn.addEventListener('click', function() {
        agOpenTicketCreate({
          title: 'Help with an unresolved issue',
          summary: 'You asked the Banyan Agent for help and wanted a person to follow up. The full conversation is attached.',
          context: [{ type: 'account', label: 'USD Checking •• 3214' }],
        });
      });
      setTimeout(function() { _agAddFollowups(aiDiv, msgs, [
        { label: 'View your support cases', text: '__opencases__' },
      ]); }, 300);
    });
  });
}

/* ═══════════════ Onboarding: entry chooser + welcome carousel ═══════════════ */
var OB_SLIDES = [
  { bg: 'assets/onb-couple.webp', title: 'Best rates.<br>Zero fees.',                    sub: 'Send money to India in minutes.' },
  { bg: 'assets/onb-woman.webp',  title: 'Open a USD checking<br>account in minutes.',   sub: 'Earn 2.0% APY on every dollar.' },
  { bg: 'assets/onb-man.webp',    title: 'Spend directly from<br>your USD account',      sub: 'Pay via UPI or your Banyan Debit Card — with no FX fees.' }
];
var OB_DUR = 4200, _obIdx = 0, _obTimer = null, _obLayer = 1, _obSplashT = null;
var _obReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* New onboarding → plaster splash (leaf drops in, wordmark rises), then the lockup
   lifts away and the first photo animates in. */
function obStartNew() {
  document.getElementById('obChooser').hidden = true;
  var sp = document.getElementById('obSplash');
  sp.hidden = false; sp.classList.remove('is-out');
  var logo = document.getElementById('obSplashLogo');
  logo.classList.remove('is-exit');
  // replay the leaf/wordmark entrance animations from the stylesheet
  ['obSplashLeaf', 'obSplashWord'].forEach(function (id) {
    var el = document.getElementById(id);
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  });
  setSbLight(false); // dark status-bar icons on the light plaster ground
  clearTimeout(_obSplashT);
  _obSplashT = setTimeout(obSplashGo, 1900);
}
function obSplashGo() {
  var sp = document.getElementById('obSplash');
  if (sp.hidden) return;
  clearTimeout(_obSplashT);
  if (_obReduced) { obEnterCarousel(); sp.hidden = true; return; }
  // 1) the lockup lifts up and fades out
  document.getElementById('obSplashLogo').classList.add('is-exit');
  // 2) once it has cleared, mount the carousel (first photo animates in) and cross-fade the plaster away
  setTimeout(function () {
    obEnterCarousel();
    sp.classList.add('is-out');
    setTimeout(function () { sp.hidden = true; }, 540);
  }, 380);
}
function obBuildLayers() {
  var bg = document.getElementById('obBg'); if (!bg) return;
  bg.innerHTML = '';
  OB_SLIDES.forEach(function (s, i) {
    var d = document.createElement('div');
    d.className = 'ob-bg-layer';
    d.setAttribute('data-i', i);
    d.style.backgroundImage = "url('" + s.bg + "')";
    bg.appendChild(d);
  });
}
function obLayers() { return document.querySelectorAll('#obBg .ob-bg-layer'); }
/* Card-stack status relative to the active slide (ported from the feature-carousel:
   active centre, prev/next peeking either side, everything else hidden). */
function obLayerStatus(i) {
  var len = OB_SLIDES.length, diff = i - _obIdx;
  if (diff > len / 2) diff -= len;
  if (diff < -len / 2) diff += len;
  if (diff === 0) return 'active';
  if (diff === -1) return 'prev';
  if (diff === 1) return 'next';
  return 'hidden';
}
/* smooth settle, no overshoot — keeps the stack feel but reads clean */
var OB_SPRING = 'transform 640ms cubic-bezier(0.22,1,0.36,1), opacity 500ms ease, filter 500ms ease';
function obPlaceLayer(el, status, instant) {
  var t, o, f, z;
  if (status === 'active') { t = 'translateX(0) scale(1)'; o = '1'; f = 'grayscale(0) blur(0) brightness(1)'; z = '20'; }
  // neighbours are fully invisible — just a clean slide-and-settle of the active photo
  else if (status === 'prev') { t = 'translateX(-150px) scale(0.94)'; o = '0'; f = 'none'; z = '10'; }
  else if (status === 'next') { t = 'translateX(150px) scale(0.94)'; o = '0'; f = 'none'; z = '10'; }
  else { t = 'translateX(0) scale(0.85)'; o = '0'; f = 'none'; z = '0'; }
  el.style.transition = (instant || _obReduced) ? 'none' : OB_SPRING;
  el.style.transform = t; el.style.opacity = o; el.style.filter = f; el.style.zIndex = z;
}
function obEnterCarousel() {
  document.getElementById('obFlow').hidden = false;
  _obCur = 'obFlow';
  setSbLight(false); // dark icons over the light plaster ground
  _obIdx = 0;
  obBuildLayers();
  obRender(1, true); // lays out the card-stack + copy + progress, no motion
  if (_obReduced) return;
  [['obTitle', 220], ['obSub', 320]].forEach(function (p) {
    var el = document.getElementById(p[0]);
    el.style.animation = 'none'; void el.offsetWidth;
    el.style.animation = 'obCopyIn 620ms cubic-bezier(0.16,1,0.3,1) ' + p[1] + 'ms both';
  });
}
function obAlreadyOnboarded() {
  document.getElementById('obChooser').hidden = true;
  setSbLight(false); // reveal the app (home is already the active screen)
}
function obNext() { obGoto(_obIdx + 1, 1); }
function obPrev() { obGoto(_obIdx - 1, -1); }
function obGoto(i, dir) {
  var n = OB_SLIDES.length;
  // The carousel loops forever; only a button press (obFinish) enters the app.
  if (i > n - 1) i = 0;
  if (i < 0) i = n - 1;
  _obIdx = i;
  obRender(dir || 1);
}
/* Spring card-stack (ported from the feature-carousel): the active subject sits centre
   over the constant plaster ground; prev/next peek at the sides, scaled, tilted and
   desaturated. Advancing springs the whole stack across. dir kept for call compatibility. */
function obRender(dir, instant) {
  var s = OB_SLIDES[_obIdx];
  var layers = obLayers();
  if (!layers.length) { obBuildLayers(); layers = obLayers(); instant = true; }
  layers.forEach(function (el) { obPlaceLayer(el, obLayerStatus(+el.getAttribute('data-i')), instant); });
  var titleEl = document.getElementById('obTitle'), subEl = document.getElementById('obSub');
  titleEl.innerHTML = s.title;
  subEl.textContent = s.sub;
  // Animate the copy in with the image swap (skip on the first, instant render / reduced motion).
  if (!instant && !_obReduced) {
    [[titleEl, 80], [subEl, 170]].forEach(function (p) {
      p[0].style.animation = 'none'; void p[0].offsetWidth;
      p[0].style.animation = 'obCopyIn 560ms cubic-bezier(0.16,1,0.3,1) ' + p[1] + 'ms both';
    });
  }
  // Story-style progress: past = full, current animates, future = empty.
  var fills = document.querySelectorAll('#obProgress b');
  clearTimeout(_obTimer);
  for (var j = 0; j < fills.length; j++) {
    fills[j].style.transition = 'none';
    fills[j].style.width = j < _obIdx ? '100%' : '0%';
  }
  var cur = fills[_obIdx];
  void document.getElementById('obProgress').offsetWidth; // reflow so the fill animates from 0
  if (cur) {
    if (_obReduced) { cur.style.width = '100%'; }
    else { cur.style.transition = 'width ' + OB_DUR + 'ms linear'; cur.style.width = '100%'; }
  }
  _obTimer = setTimeout(obNext, OB_DUR);
}
function obFinish() {
  clearTimeout(_obTimer);
  obShowLogin(1); // "Already have an account? Login" → sign-in screen (carousel slides out)
}
/* ═══════════════ Signup journey: email → OTP → password (Figma 7497-110695) ═══════════════ */
/* Keyboard-aware cards: visualViewport shrinks when the keyboard opens; --obkb (on :root)
   lifts every bottom-anchored auth card to sit 8px above it.
   Moving between steps refocuses a different input, which briefly dismisses+reopens the
   keyboard. We apply "open" immediately but DEBOUNCE "closed" so that transient dip
   doesn't drop-then-raise the card (no bouncing between steps). */
var _obKbHideT = null, _obKbFocused = false;
var _obTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0); // only estimate a keyboard on touch devices
function obKbApply(px) { document.documentElement.style.setProperty('--obkb', px + 'px'); }
function obIsAuthInput(el) {
  return !!(el && el.matches && el.matches('#obEmailField, #obOtpInput, #obPassInput, #obLoginEmail, #obLoginPass, #obResetEmail, #obRotpInput'));
}
function obKbSync() {
  var vv = window.visualViewport;
  var kb = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
  clearTimeout(_obKbHideT);
  if (kb > 40) { obKbApply(kb + 30); }                         // viewport reported the keyboard → follow it, with clearance
  else if (_obKbFocused && _obTouch) { obKbApply(Math.round(window.innerHeight * 0.40)); } // viewport didn't report → estimate on touch devices while focused
  else { _obKbHideT = setTimeout(function () { obKbApply(0); }, 380); }        // closing → wait; cancelled if it reopens (step change)
}
function obKbFocusIn(e) { if (obIsAuthInput(e.target)) { _obKbFocused = true; obKbSync(); } }
function obKbFocusOut() { setTimeout(function () { _obKbFocused = obIsAuthInput(document.activeElement); obKbSync(); }, 0); }
function obKbBind() {
  document.addEventListener('focusin', obKbFocusIn);
  document.addEventListener('focusout', obKbFocusOut);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', obKbSync);
    window.visualViewport.addEventListener('scroll', obKbSync);
  }
  obKbSync();
}
function obKbUnbind() {
  document.removeEventListener('focusin', obKbFocusIn);
  document.removeEventListener('focusout', obKbFocusOut);
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', obKbSync);
    window.visualViewport.removeEventListener('scroll', obKbSync);
  }
  clearTimeout(_obKbHideT); _obKbFocused = false;
  document.documentElement.style.setProperty('--obkb', '0px');
}
function obFocus(sel) {
  var f = document.querySelector(sel);
  if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
}
function obValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim()); }
var _obEmail = '';

/* ── Screen-to-screen motion ──
   The background is one continuous surface: when two screens share the same ground
   (all the dark-olive auth/verify screens), the background stays perfectly still and
   only the CARD slides — new card pushes in from the right, old card recedes left + dims.
   When the ground actually changes (→ green success, brown reject, cream login) the whole
   screen crossfades instead. dir: 1 = forward, -1 = back. */
var OB_ANIM = ['obFlow', 'obEmail', 'obOtp', 'obPass', 'obNext', 'obReview', 'obSuccess', 'obReject', 'obUnderReview', 'obSlow', 'obLogin', 'obReset', 'obResetOtp'];
var OB_BG = { obFlow: 'photo', obEmail: 'olive', obOtp: 'olive', obPass: 'olive', obNext: 'olive', obReview: 'olive', obUnderReview: 'olive', obSlow: 'olive', obSuccess: 'green', obReject: 'brown', obLogin: 'cream', obReset: 'cream', obResetOtp: 'cream' };
var OB_TX = ['ob-tx-bgoff', 'ob-tx-cin-f', 'ob-tx-cout-f', 'ob-tx-cin-b', 'ob-tx-cout-b', 'ob-tx-sin-f', 'ob-tx-sout-f', 'ob-tx-sin-b', 'ob-tx-sout-b', 'ob-tx-pin-f', 'ob-tx-pout-f', 'ob-tx-pin-b', 'ob-tx-pout-b', 'ob-tx-cnt-f', 'ob-tx-cnt-b', 'ob-tx-shin', 'ob-tx-shout'];
var OB_ARRIVAL = { obSuccess: 1, obReject: 1 }; // these dissolve in; everything else cross-ground pushes
var OB_CARD = { obEmail: 1, obOtp: 1, obPass: 1 };  // one fixed olive card; steps transition their content only
var _obTxT = null, _obCur = null; // _obCur = id of the screen currently showing
function obClearTx(el) { if (el) el.classList.remove.apply(el.classList, OB_TX); }
function obReveal(id, dir) {
  dir = dir || 1;
  var to = document.getElementById(id); if (!to) return;
  var from = (_obCur && _obCur !== id) ? document.getElementById(_obCur) : null;
  // hide any stray visible journey screens that aren't the from/to pair
  OB_ANIM.forEach(function (x) {
    if (x === id || (from && x === from.id)) return;
    var e = document.getElementById(x); if (e && !e.hidden) { obClearTx(e); e.hidden = true; }
  });
  obClearTx(to);
  _obCur = id;
  if (_obReduced || !from || from.hidden) { to.hidden = false; if (from) { obClearTx(from); from.hidden = true; } return; }
  obClearTx(from);
  to.hidden = false; void to.offsetWidth;
  var enterSignup = OB_CARD[to.id] && !OB_CARD[from.id];   // Open account / Create account → raise the sheet
  var leaveSignup = OB_CARD[from.id] && !OB_CARD[to.id] && dir < 0; // back out of the flow → drop the sheet
  if (enterSignup) {                                // olive signup screen rises like a sheet over what's behind
    to.classList.add('ob-tx-shin');
  } else if (leaveSignup) {                          // dismiss: the signup screen slides back down
    from.classList.add('ob-tx-shout');
  } else if (OB_CARD[from.id] && OB_CARD[to.id]) {  // within the flow → fixed card, content transitions
    to.classList.add(dir < 0 ? 'ob-tx-cnt-b' : 'ob-tx-cnt-f');
  } else if (OB_BG[from.id] === OB_BG[to.id]) {      // same ground → move only the card
    to.classList.add('ob-tx-bgoff', dir < 0 ? 'ob-tx-cin-b' : 'ob-tx-cin-f');
    from.classList.add(dir < 0 ? 'ob-tx-cout-b' : 'ob-tx-cout-f');
  } else if (OB_ARRIVAL[to.id]) {                   // arrival (success/reject) → gentle dissolve
    to.classList.add(dir < 0 ? 'ob-tx-sin-b' : 'ob-tx-sin-f');
    from.classList.add(dir < 0 ? 'ob-tx-sout-b' : 'ob-tx-sout-f');
  } else {                                          // cross-ground navigation → forward push
    to.classList.add(dir < 0 ? 'ob-tx-pin-b' : 'ob-tx-pin-f');
    from.classList.add(dir < 0 ? 'ob-tx-pout-b' : 'ob-tx-pout-f');
  }
  clearTimeout(_obTxT);
  var f = from;
  _obTxT = setTimeout(function () { obClearTx(to); obClearTx(f); f.hidden = true; }, 580);
}
/* Whole-screen in/out — used when entering/leaving the journey (carousel, app, logout). */
function obAnimIn(el, dir) {
  if (!el) return; el.hidden = false;
  if (_obReduced) { obClearTx(el); return; }
  obClearTx(el); void el.offsetWidth;
  var cls = dir < 0 ? 'ob-tx-sin-b' : 'ob-tx-sin-f';
  el.classList.add(cls);
  var done = function () { obClearTx(el); el.removeEventListener('animationend', done); };
  el.addEventListener('animationend', done);
}
function obAnimOut(el, dir) {
  if (!el || el.hidden) return;
  if (_obReduced) { el.hidden = true; return; }
  obClearTx(el); void el.offsetWidth;
  var cls = dir < 0 ? 'ob-tx-sout-b' : 'ob-tx-sout-f';
  el.classList.add(cls);
  var done = function () { obClearTx(el); el.hidden = true; el.removeEventListener('animationend', done); };
  el.addEventListener('animationend', done);
}

/* ── Email ── */
function obOpenAccount() {
  clearTimeout(_obTimer);
  obReveal('obEmail', 1);
  setSbLight(true); // light status-bar icons over the dark olive ground
  var f = document.getElementById('obEmailField'), hint = document.getElementById('obEmailHint');
  f.classList.remove('err'); hint.classList.remove('err'); hint.textContent = 'No marketing email. Ever.';
  document.getElementById('obEmailBtn').disabled = !obValidEmail(f.value);
  obKbBind();
  obFocus('#obEmailField'); // within the click gesture so mobile opens the keyboard
}
function obEmailInputH() {
  var f = document.getElementById('obEmailField'), hint = document.getElementById('obEmailHint');
  document.getElementById('obEmailBtn').disabled = !obValidEmail(f.value);
  if (f.classList.contains('err')) { f.classList.remove('err'); hint.classList.remove('err'); hint.textContent = 'No marketing email. Ever.'; }
}
function obEmailContinue() {
  var f = document.getElementById('obEmailField'), hint = document.getElementById('obEmailHint');
  if (!obValidEmail(f.value)) {
    f.classList.add('err'); hint.classList.add('err'); hint.textContent = 'Enter a valid email address.';
    obFocus('#obEmailField'); return;
  }
  _obEmail = f.value.trim();
  obShowOtp();
}
function obEmailBack() {
  document.getElementById('obEmailField').blur();
  obKbUnbind();
  obReveal('obFlow', -1); // email crossfades out, carousel back in (different ground)
  obEnterCarousel();      // (re)render the carousel content
}

/* ── OTP ── auto-verifies on the 6th digit; resend has progressive cooldowns. */
var _obResendCount = 0, _obResendTimer = null, _obResendLeft = 0, _obOtpBusy = false;
function obShowOtp() {
  obReveal('obOtp', 1);
  setSbLight(true);
  document.getElementById('obOtpSub').textContent = 'We sent a 6-digit code to ' + _obEmail + '.';
  var inp = document.getElementById('obOtpInput'); inp.value = ''; inp.disabled = false;
  _obOtpBusy = false;
  document.getElementById('obOtpBox').classList.remove('err');
  var msg = document.getElementById('obOtpMsg'); msg.textContent = ''; msg.className = 'oba-otp-msg';
  obOtpRender();
  _obResendCount = 0;
  obResendCooldown(30); // first code sent automatically on entry
  obKbBind();
  obFocus('#obOtpInput');
}
function obOtpFocus() { if (!_obOtpBusy) obFocus('#obOtpInput'); }
function obOtpRender() {
  var v = document.getElementById('obOtpInput').value;
  var cells = document.querySelectorAll('#obOtpCells span');
  for (var i = 0; i < cells.length; i++) {
    var d = v[i] || '';
    cells[i].textContent = d;
    cells[i].classList.toggle('filled', !!d);
    cells[i].classList.toggle('empty', !d);
    cells[i].classList.toggle('active', i === v.length && !_obOtpBusy);
  }
}
function obOtpInputH() {
  var inp = document.getElementById('obOtpInput');
  inp.value = inp.value.replace(/\D/g, '').slice(0, 6);
  document.getElementById('obOtpBox').classList.remove('err');
  var msg = document.getElementById('obOtpMsg'); if (!_obOtpBusy) { msg.textContent = ''; msg.className = 'oba-otp-msg'; }
  obOtpRender();
  if (inp.value.length === 6) obOtpVerify();
}
function obOtpVerify() {
  _obOtpBusy = true;
  var box = document.getElementById('obOtpBox');
  var inp = document.getElementById('obOtpInput'); inp.disabled = true;
  var msg = document.getElementById('obOtpMsg'); msg.className = 'oba-otp-msg'; msg.textContent = '';
  box.classList.add('verifying'); // the slots become the loader — no text
  obOtpRender();
  setTimeout(function () {
    box.classList.remove('verifying');
    if (inp.value === '000000') { // demo failure path
      box.classList.add('err', 'shake');
      setTimeout(function () { box.classList.remove('shake'); }, 520);
      msg.className = 'oba-otp-msg err'; msg.textContent = 'That code isn’t correct. Try again.';
      inp.value = ''; inp.disabled = false; _obOtpBusy = false; obOtpRender(); obFocus('#obOtpInput');
    } else {
      box.classList.add('verified'); // slots ripple green, then advance
      setTimeout(function () {
        box.classList.remove('verified');
        _obOtpBusy = false;
        _obResetMode = false; // signup path → password → identity verification
        obShowPass();
      }, 560);
    }
  }, 900);
}
function obResendCooldown(sec) {
  var btn = document.getElementById('obOtpResend');
  _obResendLeft = sec; btn.disabled = true;
  clearInterval(_obResendTimer);
  function tick() {
    if (_obResendLeft <= 0) {
      clearInterval(_obResendTimer);
      if (_obResendCount >= 3) { btn.textContent = 'Resend code'; btn.disabled = true; }
      else { btn.textContent = 'Resend code'; btn.disabled = false; }
      return;
    }
    var m = Math.floor(_obResendLeft / 60), s = _obResendLeft % 60;
    btn.textContent = 'Resend code in ' + m + ':' + (s < 10 ? '0' : '') + s;
    _obResendLeft--;
  }
  tick(); _obResendTimer = setInterval(tick, 1000);
}
function obOtpResend() {
  var btn = document.getElementById('obOtpResend');
  if (btn.disabled || _obResendCount >= 3) return;
  btn.disabled = true; btn.textContent = 'Sending…';
  var msg = document.getElementById('obOtpMsg');
  setTimeout(function () {
    _obResendCount++;
    msg.className = 'oba-otp-msg';
    if (_obResendCount >= 3) { msg.textContent = 'Too many code requests. Try again later.'; btn.textContent = 'Resend code'; btn.disabled = true; return; }
    msg.textContent = _obResendCount >= 2 ? 'Still waiting? Check your spam folder.' : 'Code sent.';
    obResendCooldown(_obResendCount === 1 ? 60 : 120);
  }, 600);
}
function obOtpBack() {
  document.getElementById('obOtpInput').blur();
  clearInterval(_obResendTimer);
  obReveal('obEmail', -1);
  obFocus('#obEmailField');
}

/* ── Password ── single field, 12-char minimum (PRD), show/hide, no confirmation. */
function obShowPass() {
  var s = document.getElementById('obPass');
  obReveal('obPass', 1);
  setSbLight(true);
  var t = s.querySelector('.oba-title'); if (t) t.textContent = _obResetMode ? 'Set a new password' : 'Create a password';
  var inp = document.getElementById('obPassInput'); inp.value = ''; inp.type = 'password';
  document.getElementById('obPassBtn').disabled = true;
  var req = document.getElementById('obPassReq'); req.textContent = '12-character minimum'; req.classList.remove('met');
  obKbBind();
  obFocus('#obPassInput');
}
function obPassInputH() {
  var v = document.getElementById('obPassInput').value;
  var ok = v.length >= 12;
  document.getElementById('obPassBtn').disabled = !ok;
  var req = document.getElementById('obPassReq');
  req.textContent = ok ? '✓ Minimum met' : '12-character minimum';
  req.classList.toggle('met', ok);
}
function obPassToggle() {
  var inp = document.getElementById('obPassInput'), eye = document.getElementById('obPassEye');
  var show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  obFocus('#obPassInput');
}
function obPassContinue() {
  if (document.getElementById('obPassInput').value.length < 12) return;
  document.getElementById('obPassInput').blur();
  obKbUnbind();
  if (_obResetMode) { obAnimOut(document.getElementById('obPass'), 1); obEnterApp(); }  // reset complete → signed in
  else obShowNext();                                                                    // new signup → identity verification
}
function obPassBack() {
  document.getElementById('obPassInput').blur();
  obReveal(_obResetMode ? 'obResetOtp' : 'obOtp', -1);
  obFocus(_obResetMode ? '#obRotpInput' : '#obOtpInput');
}

/* ═══════════ Identity verification + KYC result (Figma 7461-*) ═══════════ */
var OB_VERIFY_IDS = ['obNext', 'obReview', 'obSuccess', 'obReject', 'obUnderReview', 'obSlow'];
function obHideVerify() { OB_VERIFY_IDS.forEach(function (id) { var e = document.getElementById(id); if (e && !e.hidden) obAnimOut(e, 1); }); }
function obShowNext() { obReveal('obNext', 1); setSbLight(true); }
function obNextBack() {
  obReveal('obPass', -1);
  var t = document.querySelector('#obPass .oba-title'); if (t) t.textContent = _obResetMode ? 'Set a new password' : 'Create a password';
  obKbBind(); obFocus('#obPassInput');
}
/* "Get started" → Persona (simulated) → reviewing → outcome routed by email keyword (demo). */
function obStartVerify() {
  obReveal('obReview', 1);
  setSbLight(true);
  var e = (_obEmail || '').toLowerCase();
  var outcome = e.indexOf('reject') >= 0 ? obShowReject
    : e.indexOf('slow') >= 0 ? obShowSlow
      : e.indexOf('review') >= 0 ? obShowUnderReview
        : obShowSuccess;
  setTimeout(outcome, 2600);
}
function obShowUnderReview() { obReveal('obUnderReview', 1); setSbLight(true); }
function obShowSlow() { obReveal('obSlow', 1); setSbLight(true); }
function obShowReject() { obReveal('obReject', 1); setSbLight(true); }
function obShowSuccess() {
  obReveal('obSuccess', 1);
  var s = document.getElementById('obSuccess'); setSbLight(true);
  // Hold ~2s, then fade into the app Home (no CTA per PRD).
  setTimeout(function () {
    if (_obReduced) { s.hidden = true; obEnterApp(); return; }
    s.classList.add('is-out');
    setTimeout(function () { s.hidden = true; s.classList.remove('is-out'); obEnterApp(); }, 420);
  }, 2000);
}
function obEnterApp() { _obCur = null; setSbLight(false); if (typeof showHome === 'function') showHome(); }
function obRejectDone() { obResetToChooser(); }      // Log out → back to start
function obRejectSupport() { if (typeof openSupport === 'function') openSupport(); }
function obReviewSupport() { if (typeof openSupport === 'function') openSupport(); }
function obResetToChooser() {
  _obCur = null;
  ['obEmail', 'obOtp', 'obPass', 'obNext', 'obReview', 'obSuccess', 'obReject', 'obUnderReview', 'obSlow', 'obFlow', 'obSplash', 'obLogin', 'obReset', 'obResetOtp'].forEach(function (id) { var e = document.getElementById(id); if (e) { obClearTx(e); e.hidden = true; } });
  var c = document.getElementById('obChooser'); if (c) c.hidden = false;
  setSbLight(true);
}
var _obResetMode = false, _obLoginEmail = '';

/* ═══════════ Login & password reset (Figma 7462/7464-*) ═══════════ */
function obShowLogin(dir) {
  obReveal('obLogin', dir || 1);
  setSbLight(false); // dark icons on the cream ground
  document.getElementById('obLoginErr').textContent = '';
  obKbBind();
}
function obLoginInputH() { document.getElementById('obLoginErr').textContent = ''; }
function obLoginContinue() {
  var email = document.getElementById('obLoginEmail').value.trim();
  var pass = document.getElementById('obLoginPass').value;
  var err = document.getElementById('obLoginErr');
  if (!obValidEmail(email)) { err.textContent = 'Enter a valid email address.'; obFocus('#obLoginEmail'); return; }
  if (!pass || pass === 'wrong') { err.textContent = 'That email or password is incorrect.'; obFocus('#obLoginPass'); return; }
  document.getElementById('obLoginEmail').blur(); document.getElementById('obLoginPass').blur();
  obKbUnbind();
  obAnimOut(document.getElementById('obLogin'), 1);
  obEnterApp();
}
function obLoginToSignup() {
  obKbUnbind();
  obOpenAccount(); // Create account → start signup at email
}

/* Forgot password → request code */
function obShowReset() {
  _obLoginEmail = document.getElementById('obLoginEmail').value.trim();
  obReveal('obReset', 1);
  setSbLight(false);
  var f = document.getElementById('obResetEmail'); f.value = _obLoginEmail;
  document.getElementById('obResetBtn').disabled = !obValidEmail(f.value);
  obKbBind(); obFocus('#obResetEmail');
}
function obResetInputH() { document.getElementById('obResetBtn').disabled = !obValidEmail(document.getElementById('obResetEmail').value); }
function obResetSend() {
  var email = document.getElementById('obResetEmail').value.trim();
  if (!obValidEmail(email)) return;
  _obLoginEmail = email;
  document.getElementById('obResetEmail').blur();
  obShowResetOtp();
}
function obResetBack() { document.getElementById('obResetEmail').blur(); obShowLogin(-1); }
function obResetToLogin() { obResetBack(); }

/* Reset OTP — 6 slots, auto-verify (no Continue per PRD), generic messaging */
var _obRResendCount = 0, _obRResendTimer = null, _obRResendLeft = 0, _obRotpBusy = false;
function obShowResetOtp() {
  obReveal('obResetOtp', 1);
  setSbLight(false);
  document.getElementById('obResetOtpSub').textContent = 'If a Banyan account exists for ' + _obLoginEmail + ', we sent a 6-digit code.';
  var inp = document.getElementById('obRotpInput'); inp.value = ''; inp.disabled = false; _obRotpBusy = false;
  document.getElementById('obRotpBox').classList.remove('err');
  var msg = document.getElementById('obRotpMsg'); msg.textContent = ''; msg.className = 'oba-otp-msg';
  obRotpRender();
  _obRResendCount = 0; obRResendCooldown(30);
  obKbBind(); obFocus('#obRotpInput');
}
function obRotpFocus() { if (!_obRotpBusy) obFocus('#obRotpInput'); }
function obRotpRender() {
  var v = document.getElementById('obRotpInput').value;
  var cells = document.querySelectorAll('#obRotpCells span');
  for (var i = 0; i < cells.length; i++) {
    var d = v[i] || '';
    cells[i].textContent = d;
    cells[i].classList.toggle('filled', !!d);
    cells[i].classList.toggle('empty', !d);
    cells[i].classList.toggle('active', i === v.length && !_obRotpBusy);
  }
}
function obRotpInputH() {
  var inp = document.getElementById('obRotpInput');
  inp.value = inp.value.replace(/\D/g, '').slice(0, 6);
  document.getElementById('obRotpBox').classList.remove('err');
  var msg = document.getElementById('obRotpMsg'); if (!_obRotpBusy) { msg.textContent = ''; msg.className = 'oba-otp-msg'; }
  obRotpRender();
  if (inp.value.length === 6) obRotpVerify();
}
function obRotpVerify() {
  _obRotpBusy = true;
  var box = document.getElementById('obRotpBox');
  var inp = document.getElementById('obRotpInput'); inp.disabled = true;
  var msg = document.getElementById('obRotpMsg'); msg.className = 'oba-otp-msg'; msg.textContent = '';
  box.classList.add('verifying');
  obRotpRender();
  setTimeout(function () {
    box.classList.remove('verifying');
    if (inp.value === '000000') { // generic failure per PRD
      box.classList.add('err', 'shake');
      setTimeout(function () { box.classList.remove('shake'); }, 520);
      msg.className = 'oba-otp-msg err'; msg.textContent = 'That code is incorrect or has expired. Request a new code.';
      inp.value = ''; inp.disabled = false; _obRotpBusy = false; obRotpRender(); obFocus('#obRotpInput');
    } else {
      box.classList.add('verified'); // slots ripple green, then advance
      setTimeout(function () {
        box.classList.remove('verified');
        _obRotpBusy = false;
        _obResetMode = true; // → set a new password → signed in
        obShowPass();
      }, 560);
    }
  }, 900);
}
function obRResendCooldown(sec) {
  var btn = document.getElementById('obRotpResend');
  _obRResendLeft = sec; btn.disabled = true;
  clearInterval(_obRResendTimer);
  function tick() {
    if (_obRResendLeft <= 0) { clearInterval(_obRResendTimer); btn.textContent = 'Resend code'; btn.disabled = _obRResendCount >= 3; return; }
    var m = Math.floor(_obRResendLeft / 60), s = _obRResendLeft % 60;
    btn.textContent = 'Resend code in ' + m + ':' + (s < 10 ? '0' : '') + s;
    _obRResendLeft--;
  }
  tick(); _obRResendTimer = setInterval(tick, 1000);
}
function obRotpResend() {
  var btn = document.getElementById('obRotpResend');
  if (btn.disabled || _obRResendCount >= 3) return;
  btn.disabled = true; btn.textContent = 'Sending…';
  var msg = document.getElementById('obRotpMsg');
  setTimeout(function () {
    _obRResendCount++;
    msg.className = 'oba-otp-msg';
    if (_obRResendCount >= 2) msg.textContent = 'Still not seeing the code? Check the email address or open a Banyan account.';
    else msg.textContent = 'Code sent.';
    obRResendCooldown(_obRResendCount === 1 ? 60 : 120);
  }, 600);
}
function obResetOtpBack() { document.getElementById('obRotpInput').blur(); clearInterval(_obRResendTimer); obReveal('obReset', -1); obFocus('#obResetEmail'); }
// Light status bar for the dark chooser on first paint
document.addEventListener('DOMContentLoaded', function () {
  var c = document.getElementById('obChooser');
  if (c && !c.hidden && typeof setSbLight === 'function') setSbLight(true);
});
