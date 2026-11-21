/* ================= 学英语神器 · 应用逻辑 ================= */
(function () {
  'use strict';

  /* ---------------- 工具函数 ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function similarity(a, b) {
    a = String(a || '').toLowerCase().replace(/[^a-z]/g, '');
    b = String(b || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.indexOf(b) >= 0) return Math.max(0.82, 1 - (a.length - b.length) / Math.max(a.length, b.length));
    if (b.indexOf(a) >= 0) return Math.max(0.4, 1 - (b.length - a.length) / Math.max(a.length, b.length));
    const m = a.length, n = b.length;
    let prev = new Array(n + 1);
    let cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      const tmp = prev; prev = cur; cur = tmp;
    }
    const dist = prev[n];
    return Math.max(0, 1 - dist / Math.max(m, n));
  }

  /* ---------------- 图标 ---------------- */
  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></svg>',
    starFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14.6a3.6 3.6 0 0 0 3.6-3.6V6a3.6 3.6 0 1 0-7.2 0v5a3.6 3.6 0 0 0 3.6 3.6z"/><path d="M19.2 11a1.2 1.2 0 0 0-2.4 0 4.8 4.8 0 0 1-9.6 0A1.2 1.2 0 0 0 4.8 11a7.2 7.2 0 0 0 6 7.06V21a1.2 1.2 0 0 0 2.4 0v-2.94A7.2 7.2 0 0 0 19.2 11z"/></svg>',
    keyboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="2.4" y="5.4" width="19.2" height="13.2" rx="2.6"/><path d="M6 9h.01M9.3 9h.01M12.6 9h.01M15.9 9h.01M18.2 9h.01M6 12.2h.01M9.3 12.2h.01M12.6 12.2h.01M15.9 12.2h.01M18.2 12.2h.01M8 15.6h8"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9.5 7V5.2h5V7M6.4 7l.8 12.2h9.6L17.6 7"/><path d="M10 10.6v5.2M14 10.6v5.2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.6c0-.8.9-1.3 1.6-.9l9 6.4c.6.4.6 1.4 0 1.8l-9 6.4c-.7.4-1.6-.1-1.6-.9V5.6z"/></svg>'
  };

  /* ---------------- 状态 ---------------- */
  const STORE = 'eng_genius_v1';

  function loadState() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { raw = {}; }
    const st = {
      progress: raw.progress || {},
      stars: raw.stars || 0,
      streak: raw.streak || 0,
      lastStudy: raw.lastStudy || '',
      today: raw.today || { date: todayStr(), count: 0 },
      settings: Object.assign({ accent: 'us', rate: 0.9, autoPlay: false, goal: 10, voiceMode: 'auto' }, raw.settings || {}),
      last: Object.assign({ unit: 0, word: 0 }, raw.last || {}),
      filterGrade: raw.filterGrade || 'g3',
      filterTerm: raw.filterTerm || '上册',
      consolGrade: raw.consolGrade || 'g3',
      hwTemplates: raw.hwTemplates || {}
    };
    if (!st.today || st.today.date !== todayStr()) st.today = { date: todayStr(), count: 0 };
    return st;
  }

  let state = loadState();
  let currentScreen = 'home';
  let currentUnit = Math.min(Math.max(0, state.last.unit || 0), UNITS.length - 1);
  let currentWord = Math.min(Math.max(0, state.last.word || 0), UNITS[currentUnit].words.length - 1);
  let currentStep = 0;
  let reviewTab = 'wrong';

  let readMode = 'stt';
  let readState = 'idle'; // idle | listening | recording | recorded | result
  let readHeard = '';
  let readScore = 0;
  let readSelf = false;
  let webRecog = null;
  let webRecorder = null;
  let webStream = null;
  let webChunks = [];
  let webAudioUrl = null;

  let quiz = null;
  let quizAnswered = false;
  let quizCorrect = false;
  let quizSelected = '';
  let assemblePieces = [];
  let assembleSlots = [];
  let assembleBank = [];
  let assembleSolved = false;
  let assembleKey = '';
  let assembleError = false;
  let assembleTimer = null;
  let learnOrigin = 'home';

  let spellBank = [];
  let spellSlots = [];
  let spellSolved = false;

  let writeCtx = null;
  let writeInk = 0;
  let writeTimers = [];
  let spellTimer = null;
  let toastTimer = null;
  let speakTimers = [];
  let ttsWarned = false;

  const bridge = (typeof window.AndroidBridge !== 'undefined') ? window.AndroidBridge : null;
  const app = $('#app');

  const ALL_WORDS = [];
  UNITS.forEach((unit, ui) => {
    unit.words.forEach((word, wi) => {
      ALL_WORDS.push({ unit, word, ui, wi, key: unit.id + ':' + word.w });
    });
  });

  // Keyed lookup used by the independent knowledge-base drill and its
  // inline speaker buttons.  ALL_WORDS is an array, so build the map once.
  const WORD_INDEX = {};
  ALL_WORDS.forEach(function (it) {
    WORD_INDEX[it.key] = {
      word: it.word,
      unit: it.unit,
      unitIndex: it.ui,
      wordIndex: it.wi
    };
  });

  const GRADE_MAP = {};
  GRADES.forEach(g => { GRADE_MAP[g.id] = g; });
  function gradeOf(unit) {
    return GRADE_MAP[unit && unit.grade] || GRADES[0];
  }
  function unitsOfGrade(gradeId) {
    return gradeId === 'all' ? UNITS.slice() : UNITS.filter(u => u.grade === gradeId);
  }
  function wordsOfGrade(gradeId) {
    const allowed = {};
    unitsOfGrade(gradeId).forEach(u => { allowed[u.id] = 1; });
    return ALL_WORDS.filter(it => allowed[it.unit.id]);
  }
  function audioSlug(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  const AUDIO_INDEX = {};
  UNITS.forEach(function (unit) {
    unit.words.forEach(function (word) {
      const slug = word.audio || audioSlug(word.w);
      const entry = {
        // 整词录音目前只有一套美音资源；英音切换影响 TTS 回退，
        // 不影响本地整词录音。音素库另行使用英式 RP 录音。
        us: 'assets/audio/us/words/' + slug + '.m4a',
        uk: 'assets/audio/us/words/' + slug + '.m4a'
      };
      AUDIO_INDEX[word.w] = entry;
      if (word.audio) AUDIO_INDEX[word.audio] = entry;
      if (!word.audio) AUDIO_INDEX[word.w.toLowerCase()] = entry;
      if (word.sentence) {
        AUDIO_INDEX[word.sentence.toLowerCase()] = {
          us: 'assets/audio/us/sentences/' + slug + '.m4a',
          uk: 'assets/audio/us/sentences/' + slug + '.m4a'
        };
      }
    });
  });

  // Bump this when any WAV in assets/phonics changes; otherwise WebView may
  // keep serving the old cached clip at the same file:// URL after an update.
  const PHONEME_VERSION = '20261111-course';

  // British RP phoneme recordings from abelard.org, cut to one clean sound.
  // The app's word IPA is CMUdict/American, so American r-coloured vowels
  // (ɜːr, ɑːr, ...) are composed from the same speaker's vowel + /r/.
  const PHONEME_FILES = {
    'iː': 'v_i_long', 'ɪ': 'v_i_short', 'e': 'v_e', 'æ': 'v_ae', 'ɑː': 'v_a_long',
    'ɒ': 'v_o_short', 'ɔː': 'v_o_long', 'ʊ': 'v_u_short', 'uː': 'v_u_long',
    'ʌ': 'v_uh', 'ɜː': 'v_er_long', 'ə': 'v_schwa',
    'eɪ': 'd_ei', 'aɪ': 'd_ai', 'ɔɪ': 'd_oi', 'aʊ': 'd_au', 'oʊ': 'd_o_us', 'əʊ': 'd_ou',
    'ɪə': 'd_ie', 'eə': 'd_ea', 'ʊə': 'd_ue',
    'i': 'v_i_happy', 'u': 'v_u_reduced',
    'ɜːr': 'r_er', 'ɑːr': 'r_ah', 'ɔːr': 'r_aw',
    'er': 'r_air_us', 'ɪr': 'r_ir', 'ʊr': 'r_oor', 'ər': 'r_schwa',
    'p': 'c_p', 'b': 'c_b', 't': 'c_t', 'd': 'c_d', 'k': 'c_k', 'g': 'c_g',
    'f': 'c_f', 'v': 'c_v', 's': 'c_s', 'z': 'c_z', 'θ': 'c_th', 'ð': 'c_dh',
    'ʃ': 'c_sh', 'ʒ': 'c_zh', 'tʃ': 'c_ch', 'dʒ': 'c_j',
    'tr': 'c_tr', 'dr': 'c_dr', 'ts': 'c_ts', 'dz': 'c_dz',
    'm': 'c_m', 'n': 'c_n',
    'ŋ': 'c_ng', 'l': 'c_l', 'r': 'c_r', 'w': 'c_w', 'j': 'c_y', 'h': 'c_h'
  };
  // Consonant clusters that the 48-symbol course treats as one phoneme.
  const CLUSTER_JOIN = {
    't+r': 'tr', 'd+r': 'dr',
    't+s': 'ts', 'd+z': 'dz'
  };

  // Same-speaker allophones for the two places where English changes the
  // sound most noticeably: clear/dark /l/ and released/unreleased /t/.
  // The rest are natural word-final nasals.
  const PHONEME_VARIANTS = {
    l_dark: 'l_dark', l_clear: 'l_clear',
    t_final: 't_final', t_initial: 't_initial',
    m_final: 'm_final', n_final: 'n_final', ng_final: 'ng_final',
    r_initial: 'r_initial'
  };

  function termOrder(term) {
    return term === '上册' ? 0 : term === '下册' ? 1 : 2;
  }

  function availableTerms(gradeId) {
    const set = {};
    UNITS.forEach(function (u) {
      if (gradeId === 'all' || u.grade === gradeId) set[u.term || '全册'] = 1;
    });
    const order = ['上册', '下册', '全册'];
    return order.filter(function (t) { return set[t]; });
  }

  function termChipsHTML(active) {
    const terms = availableTerms(state.filterGrade);
    const list = ['全部'].concat(terms);
    return list.map(function (t) {
      return '<button class="term-chip' + (t === active ? ' active' : '') + '" data-term="' + t + '">' + t + '</button>';
    }).join('');
  }

  function gradeChipsHTML(active) {
    const list = [{ id: 'all', name: '全部年级', stage: '' }].concat(GRADES);
    return list.map(g =>
      '<button class="grade-chip' + (g.id === active ? ' active' : '') + '" data-grade="' + g.id + '">' +
      esc(g.name) + (g.stage ? '<span class="stage-dot">' + (g.stage === '小学' ? '小' : '初') + '</span>' : '') +
      '</button>'
    ).join('');
  }

  function wordKey(word, ui, wi) {
    const u = (typeof ui === 'number') ? UNITS[ui] : UNITS[currentUnit];
    const w = (typeof wi === 'number') ? u.words[wi] : word;
    return u.id + ':' + w.w;
  }
  function currentWordObj() { return UNITS[currentUnit].words[currentWord]; }
  function currentKey() { return wordKey(currentWordObj()); }

  function getRec(key) {
    const k = key || currentKey();
    if (!state.progress[k]) {
      state.progress[k] = { steps: [false, false, false, false], done: false, fav: false, wrong: 0, correct: 0, doneDate: '' };
    }
    const r = state.progress[k];
    if (!Array.isArray(r.steps)) r.steps = [false, false, false, false];
    // 旧版六步（学读练拆拼写）迁移为四步（学练拆拼写）
    if (r.steps.length === 6) {
      r.steps = [!!r.steps[0], !!r.steps[2], !!(r.steps[3] || r.steps[4]), !!r.steps[5]];
    }
    while (r.steps.length < 4) r.steps.push(false);
    if (r.steps.length > 4) r.steps = r.steps.slice(0, 4);
    return r;
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function addStars(n) {
    if (!n) return;
    state.stars = Math.max(0, (state.stars || 0) + n);
    const el = $('#statStars');
    if (el) el.textContent = state.stars;
    save();
    if (n > 0) flyStar(n);
  }

  function learnedCount() {
    let n = 0;
    Object.keys(state.progress).forEach(k => { if (state.progress[k] && state.progress[k].done) n++; });
    return n;
  }
  function unitDoneCount(unit) {
    let n = 0;
    unit.words.forEach(w => {
      const r = state.progress[unit.id + ':' + w.w];
      if (r && r.done) n++;
    });
    return n;
  }

  /* ---------------- Toast / 特效 ---------------- */
  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2000);
  }

  function celebrate(count) {
    const fx = $('#fx');
    const emojis = ['⭐', '🎉', '👍', '✨', '🎊', '🏆', '💫', '👏'];
    const n = count || 16;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.textContent = pick(emojis);
      s.style.left = (8 + Math.random() * 84) + '%';
      s.style.top = (38 + Math.random() * 28) + '%';
      s.style.fontSize = (15 + Math.random() * 14) + 'px';
      s.style.setProperty('--dx', (Math.random() * 200 - 100).toFixed(0) + 'px');
      s.style.setProperty('--dy', (-90 - Math.random() * 190).toFixed(0) + 'px');
      s.style.setProperty('--rot', (Math.random() * 260 - 130).toFixed(0) + 'deg');
      s.style.animationDelay = (Math.random() * 0.18).toFixed(2) + 's';
      fx.appendChild(s);
      setTimeout(() => s.remove(), 1800);
    }
  }

  function flyStar(n) {
    const fx = $('#fx');
    const el = document.createElement('div');
    el.className = 'star-fly';
    el.textContent = '+' + n + ' ★';
    el.style.right = (18 + Math.random() * 20) + 'px';
    el.style.top = (86 + Math.random() * 24) + 'px';
    fx.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  /* ---------------- 音效 ---------------- */
  let actx = null;
  function beep(kind) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = actx || new AC();
      if (actx.state === 'suspended') actx.resume();
      const now = actx.currentTime;
      let notes;
      if (kind === 'good') notes = [[880, 0, 0.12], [1174.66, 0.09, 0.18]];
      else if (kind === 'bad') notes = [[220, 0, 0.18]];
      else notes = [[660, 0, 0.06]];
      notes.forEach(function (nt) {
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.type = kind === 'bad' ? 'sawtooth' : 'sine';
        o.frequency.value = nt[0];
        g.gain.setValueAtTime(0.0001, now + nt[1]);
        g.gain.exponentialRampToValueAtTime(kind === 'bad' ? 0.06 : 0.12, now + nt[1] + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + nt[1] + nt[2]);
        o.connect(g); g.connect(actx.destination);
        o.start(now + nt[1]); o.stop(now + nt[1] + nt[2] + 0.03);
      });
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 音素合成（点字母/音块单独发音） ---------------- */
  let noiseBuffer = null;

  function audioCtx() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = actx || new AC();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) { return null; }
  }

  function getNoiseBuffer(ctx) {
    if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
    const len = Math.floor(ctx.sampleRate * 0.5);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBuffer = buf;
    return buf;
  }

  function envGain(ctx, out, start, attack, hold, release, peak) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + attack);
    g.gain.setValueAtTime(peak, start + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, start + attack + hold + release);
    g.connect(out);
    return { node: g, end: start + attack + hold + release };
  }

  function synthVowel(ctx, out, start, dur, f1, f2, f3, f1b, f2b, f3b, peak) {
    const env = envGain(ctx, out, start, 0.035, dur * 0.55, dur * 0.4, peak || 0.32);
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 110 + Math.random() * 16;
    const pre = ctx.createBiquadFilter();
    pre.type = 'lowpass';
    pre.frequency.value = 4200;
    pre.Q.value = 0.4;
    osc.connect(pre);
    const forms = [[f1, f1b, 1.0, 8], [f2, f2b, 0.55, 11], [f3, f3b, 0.24, 13]];
    forms.forEach(function (fm) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = fm[3];
      bp.frequency.setValueAtTime(Math.max(80, fm[0]), start);
      if (fm[1]) bp.frequency.linearRampToValueAtTime(Math.max(80, fm[1]), start + dur);
      const g = ctx.createGain();
      g.gain.value = fm[2];
      pre.connect(bp);
      bp.connect(g);
      g.connect(env.node);
    });
    // 轻微气声，让音素更自然
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    noise.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 1800;
    nf.Q.value = 1.2;
    const ng = ctx.createGain();
    ng.gain.value = 0.018;
    noise.connect(nf); nf.connect(ng); ng.connect(env.node);
    osc.start(start); osc.stop(env.end + 0.03);
    noise.start(start); noise.stop(env.end + 0.03);
    return env.end;
  }

  function synthNoise(ctx, out, start, dur, type, freq, q, peak, voiced) {
    const env = envGain(ctx, out, start, 0.012, dur * 0.7, dur * 0.25, peak || 0.2);
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q || 0.7;
    src.connect(f);
    f.connect(env.node);
    src.start(start + Math.random() * 0.02);
    src.stop(env.end + 0.03);
    if (voiced) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 105;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      const g = ctx.createGain();
      g.gain.value = 0.08;
      osc.connect(lp); lp.connect(g); g.connect(env.node);
      osc.start(start); osc.stop(env.end + 0.03);
    }
    return env.end;
  }

  function synthBurst(ctx, out, start, freq, voiced) {
    const env = envGain(ctx, out, start, 0.004, 0.008, 0.035, 0.34);
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 0.8;
    src.connect(f);
    f.connect(env.node);
    src.start(start);
    src.stop(env.end + 0.02);
    if (voiced) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 100;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 320;
      const g = ctx.createGain();
      g.gain.value = 0.12;
      osc.connect(lp); lp.connect(g); g.connect(env.node);
      osc.start(start); osc.stop(env.end + 0.02);
    }
    return env.end;
  }

  const PHONEME_DEFS = {
    'iː': { t: 'v', f: [270, 2290, 3010], d: 0.26 },
    'ɪ': { t: 'v', f: [390, 1990, 2550], d: 0.2 },
    'e': { t: 'v', f: [530, 1840, 2480], d: 0.2 },
    'æ': { t: 'v', f: [660, 1720, 2410], d: 0.24 },
    'ɑː': { t: 'v', f: [730, 1090, 2440], d: 0.3 },
    'ɑ': { t: 'v', f: [730, 1090, 2440], d: 0.26 },
    'ɒ': { t: 'v', f: [570, 840, 2410], d: 0.24 },
    'ɔː': { t: 'v', f: [500, 760, 2400], d: 0.3 },
    'ɔ': { t: 'v', f: [500, 760, 2400], d: 0.26 },
    'ʊ': { t: 'v', f: [440, 1020, 2240], d: 0.2 },
    'uː': { t: 'v', f: [300, 870, 2240], d: 0.28 },
    'u': { t: 'v', f: [300, 870, 2240], d: 0.24 },
    'ʌ': { t: 'v', f: [640, 1190, 2390], d: 0.22 },
    'ɜː': { t: 'v', f: [490, 1350, 1690], d: 0.28 },
    'ə': { t: 'v', f: [500, 1500, 2500], d: 0.18 },
    'eɪ': { t: 'd', a: [530, 1840, 2480], b: [390, 1990, 2550], d: 0.34 },
    'aɪ': { t: 'd', a: [730, 1090, 2440], b: [390, 1990, 2550], d: 0.36 },
    'ɔɪ': { t: 'd', a: [570, 840, 2410], b: [390, 1990, 2550], d: 0.36 },
    'aʊ': { t: 'd', a: [730, 1090, 2440], b: [440, 1020, 2240], d: 0.36 },
    'əʊ': { t: 'd', a: [500, 1500, 2500], b: [440, 1020, 2240], d: 0.34 },
    'ɪə': { t: 'd', a: [390, 1990, 2550], b: [500, 1500, 2500], d: 0.34 },
    'eə': { t: 'd', a: [530, 1840, 2480], b: [500, 1500, 2500], d: 0.34 },
    'ʊə': { t: 'd', a: [440, 1020, 2240], b: [500, 1500, 2500], d: 0.34 },
    'j': { t: 'd', a: [270, 2290, 3010], b: [500, 1500, 2500], d: 0.16, peak: 0.2 },
    'w': { t: 'd', a: [300, 870, 2240], b: [500, 1500, 2500], d: 0.16, peak: 0.2 },
    'l': { t: 'v', f: [350, 1100, 2700], d: 0.18, peak: 0.24 },
    'r': { t: 'v', f: [400, 1200, 1600], d: 0.18, peak: 0.22 },
    'm': { t: 'v', f: [250, 1100, 2300], d: 0.2, peak: 0.2 },
    'n': { t: 'v', f: [250, 1500, 2500], d: 0.2, peak: 0.2 },
    'ŋ': { t: 'v', f: [250, 2000, 2600], d: 0.2, peak: 0.18 },
    'p': { t: 'p', f: 1200, v: 0 },
    'b': { t: 'p', f: 900, v: 1 },
    't': { t: 'p', f: 3000, v: 0 },
    'd': { t: 'p', f: 2400, v: 1 },
    'k': { t: 'p', f: 2000, v: 0 },
    'g': { t: 'p', f: 1600, v: 1 },
    'f': { t: 'n', type: 'highpass', f: 1500, q: 0.6, d: 0.16, v: 0 },
    'v': { t: 'n', type: 'highpass', f: 1400, q: 0.6, d: 0.16, v: 1 },
    's': { t: 'n', type: 'highpass', f: 4800, q: 0.7, d: 0.2, v: 0 },
    'z': { t: 'n', type: 'highpass', f: 4200, q: 0.7, d: 0.18, v: 1 },
    'θ': { t: 'n', type: 'highpass', f: 3600, q: 0.6, d: 0.16, v: 0 },
    'ð': { t: 'n', type: 'highpass', f: 3200, q: 0.6, d: 0.16, v: 1 },
    'ʃ': { t: 'n', type: 'bandpass', f: 2600, q: 1.4, d: 0.2, v: 0 },
    'ʒ': { t: 'n', type: 'bandpass', f: 2400, q: 1.3, d: 0.18, v: 1 },
    'h': { t: 'n', type: 'bandpass', f: 900, q: 0.7, d: 0.13, v: 0 },
    'tʃ': { t: 'a', f: 2600, v: 0, d: 0.22 },
    'dʒ': { t: 'a', f: 2400, v: 1, d: 0.22 }
  };

  const IPA_TOKENS = ['tʃ', 'dʒ', 'tr', 'dr', 'ts', 'dz', 'aɪ', 'eɪ', 'ɔɪ', 'aʊ', 'oʊ', 'əʊ', 'ɪə', 'eə', 'ʊə', 'ɜːr', 'ɑːr', 'ɔːr', 'er', 'ɪr', 'ʊr', 'ər', 'ɑː', 'ɔː', 'ɜː', 'iː', 'uː', 'ŋ', 'θ', 'ð', 'ʃ', 'ʒ', 'p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'm', 'n', 'l', 'r', 'w', 'j', 'h', 'ɪ', 'e', 'æ', 'ɒ', 'ʊ', 'ʌ', 'ɜ', 'ɐ', 'ə', 'ɑ', 'ɔ', 'u', 'i', 'a'];
  const IPA_VOWELS = 'iɪeæaɑɒɔʊuʌɜə';
  const R_COLOURED_TOKENS = {
    'er': 1, 'ɪr': 1, 'ʊr': 1, 'ər': 1,
    'ɑːr': 1, 'ɔːr': 1, 'ɜːr': 1
  };
  // Used when a chunk's IPA says /er/ but the next chunk starts with a vowel:
  // "very" is /ve-r-i/, not "vair-ee", so the r belongs to the next onset.
  const R_SPLIT = {
    'er': 'e', 'ɪr': 'ɪ', 'ʊr': 'ʊ', 'ər': 'ə',
    'ɑːr': 'ɑː', 'ɔːr': 'ɔː', 'ɜːr': 'ɜː'
  };

  function startsVowel(ch) {
    return !!ch && IPA_VOWELS.indexOf(ch) !== -1;
  }

  // Longest-match tokenizer.  A plain e+r in a word such as "very"
  // (/ˈveri/) is not the r-coloured /er/ of "air", so r-coloured tokens
  // are skipped when the r is followed by another vowel.
  function tokenizeIPA(ipa) {
    let s = String(ipa || '').replace(/[\/\[\]ˈˌ\s\-]/g, '');
    const out = [];
    let i = 0;
    outer:
    while (i < s.length) {
      for (let k = 0; k < IPA_TOKENS.length; k++) {
        const tok = IPA_TOKENS[k];
        if (!s.startsWith(tok, i)) continue;
        if (R_COLOURED_TOKENS[tok] && startsVowel(s[i + tok.length])) continue;
        out.push(tok);
        i += tok.length;
        continue outer;
      }
      i++;
    }
    return out;
  }

  function chunkStartLetter(word, index) {
    let pos = 0;
    for (let i = 0; i < index && i < word.chunks.length; i++) pos += word.chunks[i][0].length;
    return pos;
  }

  function chunkBoundaryToken(word, index, side) {
    // Skip chunks with no sound (silent letters) so a chunk's allophone is
    // chosen from the next/previous *pronounced* phoneme, not a blank chunk.
    if (side === 'first') {
      for (let i = Math.max(0, index); i < word.chunks.length; i++) {
        const toks = tokenizeIPA(word.chunks[i][1]);
        if (toks.length) return toks[0];
      }
    } else {
      for (let i = Math.min(index, word.chunks.length - 1); i >= 0; i--) {
        const toks = tokenizeIPA(word.chunks[i][1]);
        if (toks.length) return toks[toks.length - 1];
      }
    }
    return null;
  }

  function chunkContext(word, index) {
    const c = word.chunks[index];
    const start = chunkStartLetter(word, index);
    const end = start + (c ? c[0].length : 0);
    return {
      word: word.w,
      chunk: c ? c[0] : '',
      chunkIndex: index,
      chunkStart: start,
      chunkEnd: end,
      atStart: start === 0,
      atEnd: end === word.w.length,
      position: start === 0 ? 'initial' : (end === word.w.length ? 'final' : 'medial'),
      prevChunkTok: chunkBoundaryToken(word, index - 1, 'last'),
      nextChunkTok: chunkBoundaryToken(word, index + 1, 'first')
    };
  }

  function tokenPlanForChunk(word, index) {
    const c = word.chunks[index];
    if (!c || !c[1]) return [];
    const toks = tokenizeIPA(c[1]);
    const base = chunkContext(word, index);
    // A chunk's IPA can be written /er/ or /ər/ even when the r is the onset
    // of the next syllable (very, different, library).  Split it back into
    // vowel + /r/ so the r is actually pronounced.
    if (toks.length && startsVowel((base.nextChunkTok || '').charAt(0))) {
      const last = toks[toks.length - 1];
      if (R_SPLIT[last]) {
        toks.pop();
        toks.push(R_SPLIT[last], 'r');
      }
    }
    return toks.map(function (tok, i) {
      return {
        tok: tok,
        ctx: Object.assign({}, base, {
          stage: 'chunk',
          tokenIndex: i,
          tokenCount: toks.length,
          isFirstToken: i === 0,
          isLastToken: i === toks.length - 1,
          prevTok: i ? toks[i - 1] : base.prevChunkTok,
          nextTok: i + 1 < toks.length ? toks[i + 1] : base.nextChunkTok
        })
      };
    });
  }

  function wordPhonemePlan(word) {
    let plan = [];
    (word.chunks || []).forEach(function (c, i) {
      plan = plan.concat(tokenPlanForChunk(word, i));
    });
    if (!plan.length) {
      const toks = tokenizeIPA(word.ipa);
      plan = toks.map(function (tok, i) {
        return {
          tok: tok,
          ctx: {
            stage: 'word', position: 'medial', tokenIndex: i, tokenCount: toks.length,
            isFirstToken: i === 0, isLastToken: i === toks.length - 1,
            prevTok: i ? toks[i - 1] : null,
            nextTok: i + 1 < toks.length ? toks[i + 1] : null
          }
        };
      });
    }
    // If a word is split as /ʊ/ + /r/ across two chunks (tour), rejoin it
    // into the single r-coloured phoneme the whole-word IPA shows.
    const merged = [];
    for (let i = 0; i < plan.length; i++) {
      const cur = plan[i];
      const nxt = plan[i + 1];
      const joined = cur.tok + (nxt ? nxt.tok : '');
      const afterR = plan[i + 2];
      const rIsCoda = !afterR || !startsVowel(afterR.tok.charAt(0));
      let joinTok = null;
      if (nxt && cur.ctx && nxt.ctx &&
          nxt.ctx.chunkIndex === cur.ctx.chunkIndex + 1) {
        if (nxt.tok === 'r' && rIsCoda && PHONEME_FILES[joined]) {
          joinTok = joined;
        } else {
          const cluster = CLUSTER_JOIN[cur.tok + '+' + nxt.tok];
          if (cluster && PHONEME_FILES[cluster]) joinTok = cluster;
        }
      }
      if (joinTok) {
        merged.push({
          tok: joinTok,
          ctx: Object.assign({}, cur.ctx, { nextTok: nxt.ctx.nextTok || null })
        });
        i++;
      } else {
        merged.push(cur);
      }
    }
    // annotate neighbouring tokens so /l/ can choose clear vs dark
    merged.forEach(function (item, i) {
      if (!item.ctx.prevTok && i > 0) item.ctx.prevTok = merged[i - 1].tok;
      if (!item.ctx.nextTok && i + 1 < merged.length) item.ctx.nextTok = merged[i + 1].tok;
    });
    return merged;
  }

  function phonemeFileFor(tok, ctx) {
    const c = ctx || {};
    const vowelBefore = startsVowel((c.prevTok || '').charAt(0));
    const vowelAfter = startsVowel((c.nextTok || '').charAt(0));
    if (tok === 'l') {
      if (c.atEnd && c.isLastToken) return 'l_dark';
      if (vowelBefore && !vowelAfter) return 'l_dark';
      if (c.atStart && c.isFirstToken) return 'l_clear';
    }
    if (tok === 't') {
      if (c.atEnd && c.isLastToken) return 't_final';
      if (c.atStart && c.isFirstToken) return 't_initial';
    }
    if (tok === 'm' && c.atEnd && c.isLastToken) return 'm_final';
    if (tok === 'n' && c.atEnd && c.isLastToken) return 'n_final';
    if (tok === 'ŋ' && c.atEnd && c.isLastToken) return 'ng_final';
    if (tok === 'r' && c.atStart && c.isFirstToken) return 'r_initial';
    return PHONEME_FILES[tok];
  }

  function playPhonemeSequence(tokens) {
    const ctx = audioCtx();
    if (!ctx) return false;
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    let t = ctx.currentTime + 0.035;
    tokens.forEach(function (tok) {
      const def = PHONEME_DEFS[tok];
      if (!def) return;
      if (def.t === 'v') {
        t = synthVowel(ctx, master, t, def.d || 0.22, def.f[0], def.f[1], def.f[2], 0, 0, 0, def.peak) + 0.03;
      } else if (def.t === 'd') {
        t = synthVowel(ctx, master, t, def.d || 0.32, def.a[0], def.a[1], def.a[2], def.b[0], def.b[1], def.b[2], def.peak) + 0.03;
      } else if (def.t === 'n') {
        t = synthNoise(ctx, master, t, def.d || 0.18, def.type, def.f, def.q, 0.2, def.v) + 0.03;
      } else if (def.t === 'p') {
        t = synthBurst(ctx, master, t, def.f, def.v) + 0.035;
      } else if (def.t === 'a') {
        t = synthBurst(ctx, master, t, def.f, def.v) + 0.01;
        t = synthNoise(ctx, master, t, def.d || 0.18, 'bandpass', 2500, 1.3, 0.18, def.v) + 0.03;
      }
    });
    return true;
  }

  let phonicsChain = [];
  let phonicsTimer = null;

  function stopPhonics() {
    phonicsChain.forEach(function (a) {
      try { a.pause(); } catch (e) {}
    });
    phonicsChain = [];
    if (phonicsTimer) { clearTimeout(phonicsTimer); phonicsTimer = null; }
  }

  function phonemeVariantName(file) {
    if (file === 'l_dark') return '词尾暗 l';
    if (file === 'l_clear') return '词首清 l';
    if (file === 't_final') return '词尾 t';
    if (file === 't_initial') return '词首 t';
    if (file === 'm_final') return '词尾 m';
    if (file === 'n_final') return '词尾 n';
    if (file === 'ng_final') return '词尾 ŋ';
    if (file === 'r_initial') return '词首 r';
    return '';
  }

  // Accepts either bare IPA tokens or {tok, ctx} plan items.  The context is
  // what makes pronunciation scenario-aware: the same /l/ is clear at the
  // start of "like" and dark at the end of "ball".
  function playPhonemeClips(items, opts) {
    stopPhonics();
    const o = opts || {};
    const list = [];
    (items || []).forEach(function (it) {
      const tok = typeof it === 'string' ? it : it.tok;
      const ctx = typeof it === 'string' ? null : it.ctx;
      if (!tok) return;
      const file = phonemeFileFor(tok, ctx) || PHONEME_FILES[tok];
      if (file) list.push({ tok: tok, file: file, ctx: ctx });
    });
    if (!list.length) return false;
    const tip = $('#phonicsTip');
    let i = 0;
    function show() {
      if (!tip) return;
      const label = o.label || '音素';
      tip.innerHTML = label + '：' + list.map(function (it, k) {
        const hint = phonemeVariantName(it.file);
        return (k === i ? '<b>' + esc(it.tok) + '</b>' : esc(it.tok)) + (hint ? '<small>（' + hint + '）</small>' : '');
      }).join(' · ');
    }
    function next() {
      if (i >= list.length) {
        if (tip) tip.textContent = (o.label || '音素') + '播放完毕';
        return;
      }
      show();
      const a = new Audio('assets/phonics/' + list[i].file + '.wav?v=' + PHONEME_VERSION);
      a.playbackRate = Math.max(0.8, Math.min(1.2, state.settings.rate || 0.9));
      phonicsChain.push(a);
      let advanced = false;
      const advance = function () {
        if (advanced) return;
        advanced = true;
        i++;
        phonicsTimer = setTimeout(next, o.gap == null ? 60 : o.gap);
      };
      a.onended = advance;
      a.onerror = advance;
      const p = a.play();
      if (p && p.catch) p.catch(advance);
    }
    next();
    return true;
  }

  function chunkIpaKey(ipa) {
    return String(ipa || '').replace(/[\/\[\]ˈˌ\s\-]/g, '');
  }

  function speakChunkPhoneme(ipa, ctx) {
    const chunkFile = window.CHUNK_AUDIO && window.CHUNK_AUDIO[chunkIpaKey(ipa)];
    if (chunkFile) {
      stopPhonics();
      const a = new Audio(chunkFile);
      a.playbackRate = Math.max(0.8, Math.min(1.2, state.settings.rate || 0.9));
      phonicsChain.push(a);
      const tip = $('#phonicsTip');
      if (tip) tip.innerHTML = '🔊 音块：<b>' + esc(ipa) + '</b>';
      let done = false;
      const finish = function () {
        if (done) return;
        done = true;
        if (tip) tip.textContent = '音块播放完毕';
      };
      a.onended = finish;
      a.onerror = finish;
      const p = a.play();
      if (p && p.catch) p.catch(finish);
      return true;
    }
    const tokens = tokenizeIPA(ipa);
    if (!tokens.length) return false;
    const plan = tokens.map(function (tok, i) {
      return {
        tok: tok,
        ctx: Object.assign({}, ctx || {}, {
          stage: (ctx && ctx.stage) || 'chunk',
          tokenIndex: i,
          tokenCount: tokens.length,
          isFirstToken: i === 0,
          isLastToken: i === tokens.length - 1,
          prevTok: i ? tokens[i - 1] : (ctx && ctx.prevChunkTok) || null,
          nextTok: i + 1 < tokens.length ? tokens[i + 1] : (ctx && ctx.nextChunkTok) || null
        })
      };
    });
    return playPhonemeClips(plan, {
      label: ctx && ctx.stage === 'letter' ? '字母在单词中的发音' : '拼读音块',
      gap: 45
    });
  }


  let currentAudio = null;

  function speakTTS(text, opts) {
    if (!text) return;
    const o = opts || {};
    const rate = Number(o.rate || state.settings.rate || 0.9);
    if (bridge) {
      try { bridge.speak(String(text), state.settings.accent, rate); return; } catch (e) { /* fall through */ }
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = state.settings.accent === 'uk' ? 'en-GB' : 'en-US';
        u.rate = Math.max(0.5, Math.min(1.6, rate));
        window.speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    }
  }

  function playAudioFile(path, rate, fallbackText) {
    try {
      if (currentAudio) {
        try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
        currentAudio = null;
      }
      const a = new Audio(path);
      a.preload = 'auto';
      a.playbackRate = Math.max(0.6, Math.min(1.4, Number(rate) || 1));
      try { a.preservesPitch = true; } catch (e) {}
      currentAudio = a;
      let fellBack = false;
      const fallback = function () {
        if (fellBack) return;
        fellBack = true;
        if (currentAudio === a) currentAudio = null;
        if (fallbackText) speakTTS(fallbackText, { rate: rate });
      };
      a.onerror = fallback;
      const p = a.play();
      if (p && p.catch) p.catch(fallback);
      return true;
    } catch (e) { return false; }
  }

  function speak(text, opts) {
    if (!text) return;
    const o = opts || {};
    const rate = Number(o.rate || state.settings.rate || 0.9);
    const t = String(text).trim();
    const entry = AUDIO_INDEX[t] || AUDIO_INDEX[t.toLowerCase()];
    if (entry) {
      const path = entry[state.settings.accent] || entry.us;
      if (path && playAudioFile(path, rate, text)) return;
    }
    speakTTS(text, o);
  }

  function stopSpeaking() {
    if (currentAudio) {
      try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
      currentAudio = null;
    }
    stopPhonics();
    if (bridge) { try { bridge.stopSpeak(); } catch (e) {} }
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  }

  function clearSpeakFx() {
    speakTimers.forEach(clearTimeout);
    speakTimers = [];
    $$('.tile.speaking, .chunk.speaking, .part-card.hit').forEach(el => el.classList.remove('speaking', 'hit'));
  }

  function focusChunk(index) {
    const word = currentWordObj();
    const c = word.chunks[index];
    if (!c) return;
    clearSpeakFx();
    if (!c[1]) {
      toast('这个字母在这里不发音哦');
      return;
    }
    stopSpeaking();
    const ok = speakChunkPhoneme(c[1], chunkContext(word, index));
    const targets = $$('.tile[data-chunk="' + index + '"], .chunk[data-chunk="' + index + '"]', $('#stage'));
    targets.forEach(function (el) {
      el.classList.add('speaking');
      speakTimers.push(setTimeout(function () { el.classList.remove('speaking'); }, 750));
    });
    const tip = $('#phonicsTip');
    if (tip) {
      tip.innerHTML = '🔊 单个发音：<b>' + esc(c[0]) + '</b> 发 ' + esc(c[1]) + (c[0].length > 1 ? '（字母组合）' : '') + (ok ? '' : ' · 当前设备无法播放');
    }
    if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
  }

  function pronounceWord(word, slow) {
    if (!word) word = currentWordObj();
    clearSpeakFx();
    const rate = slow ? Math.max(0.55, state.settings.rate - 0.22) : state.settings.rate;
    speak(word.audio || word.w, { rate: rate });
    const tiles = $$('#stage .tile[data-chunk]');
    tiles.forEach(function (t, i) {
      speakTimers.push(setTimeout(function () {
        t.classList.add('speaking');
        speakTimers.push(setTimeout(function () { t.classList.remove('speaking'); }, 300));
      }, 60 + i * 250));
    });
  }

  function defaultReadMode() {
    const stt = speechRecogAvailable();
    const rec = recorderAvailable();
    const pref = state.settings.voiceMode || 'auto';
    if (pref === 'record' && rec) return 'record';
    if (pref === 'stt' && stt) return 'stt';
    // 首次使用时优先录音，避免未授权麦克风时语音识别无响应
    if (rec && bridge && typeof bridge.hasRecordPermission === 'function' && !bridge.hasRecordPermission()) return 'record';
    if (stt) return 'stt';
    return rec ? 'record' : 'none';
  }

  function speechRecogAvailable() {
    if (bridge) {
      try { return !!bridge.isSpeechAvailable(); } catch (e) { return false; }
    }
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  function recorderAvailable() {
    if (bridge) return true;
    return !!(navigator.mediaDevices && window.MediaRecorder);
  }

  window.EG = {
    onTtsError: function (code) {
      if (ttsWarned) return;
      ttsWarned = true;
      toast(code === 'missing'
        ? '系统缺少英文语音包，请在手机「设置 → 语音合成」中安装'
        : '语音引擎初始化失败，请检查系统 TTS 设置', 3200);
    },
    handleBack: function () {
      const mask = $('#modalMask');
      if (mask && mask.classList.contains('show')) { hideModal(); return; }
      const active = document.activeElement;
      if (active && active.id === 'writeInput') { active.blur(); return; }
      if (currentScreen === 'drill') { showScreen('consolidate'); return; }
      if (currentScreen === 'consolidate') { showScreen('home'); return; }
      if (currentScreen === 'learn') { showScreen(learnOrigin || 'home'); return; }
      if (currentScreen !== 'home') { showScreen('home'); return; }
      if (bridge && typeof bridge.finishApp === 'function') {
        try { bridge.finishApp(); return; } catch (e) {}
      }
      try { history.back(); } catch (e) {}
    }
  };

  function finishSpeech(text) {
    if (currentScreen !== 'learn' || currentStep !== 1) return;
    const word = currentWordObj();
    const score = similarity(text, word.w);
    readState = 'result';
    readScore = score;
    readSelf = false;
    if (score >= 0.6) {
      const newly = markStepDone(1, 1);
      if (score >= 0.85) celebrate(12);
      if (newly) beep('good');
    } else {
      const r = getRec();
      r.wrong = (r.wrong || 0) + 1;
      save();
      beep('bad');
    }
    renderStage();
    updateStepper();
  }

  function handleSpeechError(code) {
    if (readState === 'listening') {
      readState = 'idle';
      readScore = 0;
      readHeard = '';
    }
    if (code !== 'no_match' && code !== 'permission' && recorderAvailable()) {
      readMode = 'record';
      readState = 'idle';
      readScore = 0;
      readHeard = '';
      renderStage();
      const reason = code === 'timeout' ? '语音识别没有响应'
        : code === 'network' ? '网络不稳定'
          : code === 'unavailable' ? '语音识别不可用'
            : '语音识别没有准备好';
      toast(reason + '，已切换为录音跟读', 2600);
      return;
    }
    renderStage();
    const msg = {
      permission: '正在请求麦克风权限，请点击允许',
      no_match: '没有听清，再大声读一遍吧',
      timeout: '没有听到声音，再试一次～',
      network: '网络不给力，先听一听示范发音吧',
      unavailable: '当前设备暂不支持语音识别'
    }[code] || '语音没有准备好，再试一次吧';
    toast(msg);
  }

  function startListening() {
    stopSpeaking();
    readHeard = '';
    readScore = 0;
    readSelf = false;
    readState = 'listening';
    renderStage();
    if (bridge) {
      try { bridge.startListening(); } catch (e) { handleSpeechError('unavailable'); }
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { handleSpeechError('unavailable'); return; }
    try {
      if (webRecog) { try { webRecog.abort(); } catch (e) {} }
      webRecog = new SR();
      webRecog.lang = state.settings.accent === 'uk' ? 'en-GB' : 'en-US';
      webRecog.interimResults = true;
      webRecog.maxAlternatives = 3;
      webRecog.onresult = function (ev) {
        let text = '';
        let final = false;
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          text += ev.results[i][0].transcript;
          if (ev.results[i].isFinal) final = true;
        }
        window.EG.onSpeechResult(text.trim(), final);
      };
      webRecog.onerror = function (ev) {
        window.EG.onSpeechError(ev.error || 'error');
      };
      webRecog.onend = function () {
        if (readState === 'listening') {
          readState = 'idle';
          renderStage();
        }
      };
      webRecog.start();
    } catch (e) { handleSpeechError('unavailable'); }
  }

  function stopListening() {
    if (bridge) { try { bridge.stopListening(); } catch (e) {} }
    if (webRecog) { try { webRecog.stop(); } catch (e) {} }
    readState = 'idle';
    renderStage();
  }

  function startRecordingAudio() {
    stopSpeaking();
    readHeard = '';
    readScore = 0;
    readSelf = false;
    if (bridge) {
      let ok = false;
      try { ok = bridge.startRecording(); } catch (e) { ok = false; }
      if (!ok) { toast('正在请求麦克风权限…'); return; }
      readState = 'recording';
      renderStage();
      return;
    }
    if (!(navigator.mediaDevices && window.MediaRecorder)) { toast('当前设备不支持录音'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      webStream = stream;
      webChunks = [];
      const mr = new MediaRecorder(stream);
      webRecorder = mr;
      mr.ondataavailable = function (e) { if (e.data && e.data.size) webChunks.push(e.data); };
      mr.onstop = function () {
        try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
        if (webAudioUrl) { try { URL.revokeObjectURL(webAudioUrl); } catch (e) {} }
        webAudioUrl = URL.createObjectURL(new Blob(webChunks, { type: mr.mimeType || 'audio/webm' }));
        readState = 'recorded';
        renderStage();
      };
      mr.start();
      readState = 'recording';
      renderStage();
    }).catch(function () {
      toast('无法使用麦克风，请检查权限');
    });
  }

  function stopRecordingAudio() {
    if (bridge) {
      try { bridge.stopRecording(); } catch (e) {}
      return;
    }
    if (webRecorder && webRecorder.state === 'recording') {
      try { webRecorder.stop(); } catch (e) {}
    }
  }

  function playRecordingAudio() {
    if (bridge) {
      try { bridge.playRecording(); } catch (e) { toast('还没有录音哦'); }
      return;
    }
    if (webAudioUrl) {
      try { new Audio(webAudioUrl).play(); } catch (e) {}
    } else {
      toast('还没有录音哦');
    }
  }

  /* ---------------- 进度 ---------------- */
  function markStepDone(step, bonus) {
    const r = getRec();
    if (r.steps[step]) {
      save();
      updateStepper();
      return false;
    }
    r.steps[step] = true;
    addStars(1 + (bonus || 0));
    save();
    beep('ding');
    updateStepper();
    return true;
  }

  function bumpToday() {
    const t = todayStr();
    if (!state.today || state.today.date !== t) state.today = { date: t, count: 0 };
    state.today.count = (state.today.count || 0) + 1;
    if (state.lastStudy !== t) {
      state.streak = (state.lastStudy === yesterdayStr()) ? (state.streak || 0) + 1 : 1;
      state.lastStudy = t;
    }
    if (state.today.count === state.settings.goal) {
      addStars(5);
      setTimeout(function () { toast('🎯 今日目标达成！额外 +5 星星'); }, 500);
    }
  }

  function completeWord() {
    const r = getRec();
    const newly = !r.done;
    if (newly) {
      r.done = true;
      r.doneDate = todayStr();
      addStars(8);
      bumpToday();
      save();
      celebrate(26);
      beep('good');
    }
    return newly;
  }

  function updateStepper() {
    const r = getRec();
    $$('.step').forEach(function (el, i) {
      el.classList.toggle('done', !!r.steps[i]);
      el.classList.toggle('current', i === currentStep);
    });
    const fill = $('#stepProgress');
    const stepEls = $$('.step');
    const lastStep = Math.max(1, stepEls.length - 1);
    if (fill) fill.style.width = (Math.min(currentStep, lastStep) / lastStep * 100) + '%';
  }

  /* ---------------- 导航 ---------------- */
  function showScreen(name) {
    if (currentScreen === 'learn' && name !== 'learn') {
      if (readState === 'recording') stopRecordingAudio();
      if (readState === 'listening') {
        readState = 'idle';
        if (bridge) { try { bridge.stopListening(); } catch (e) {} }
        if (webRecog) { try { webRecog.abort(); } catch (e) {} }
      }
    }
    currentScreen = name;
    $$('.screen').forEach(function (el) {
      el.classList.toggle('active', el.id === 'screen-' + name);
    });
    $$('.tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.screen === name);
    });
    app.classList.toggle('learn-open', name === 'learn' || name === 'drill');
    if (name === 'home') { renderHome(); window.scrollTo(0, 0); }
    if (name === 'review') { renderReview(); window.scrollTo(0, 0); }
    if (name === 'me') { renderMe(); window.scrollTo(0, 0); }
    if (name === 'consolidate') { renderConsolidate(); window.scrollTo(0, 0); }
    if (name === 'learn') { renderLearn(); }
    if (name === 'drill') { renderDrill(); }
  }

  function navigate(name) {
    if (currentScreen === name) return;
    showScreen(name);
  }

  function goBack(fallback) {
    if (currentScreen === 'learn') { showScreen(learnOrigin || fallback || 'home'); return; }
    showScreen(fallback || 'home');
  }

  function openLearn(ui, wi, step) {
    const unit = UNITS[ui] || UNITS[0];
    if (currentScreen !== 'learn') learnOrigin = currentScreen || 'home';
    currentUnit = Math.min(Math.max(0, ui || 0), UNITS.length - 1);
    currentWord = Math.min(Math.max(0, wi || 0), unit.words.length - 1);
    state.last = { unit: currentUnit, word: currentWord };
    save();
    quiz = null;
    quizAnswered = false;
    quizSelected = '';
    readState = 'idle';
    readMode = defaultReadMode();
    currentStep = (typeof step === 'number') ? step : 0;
    showScreen('learn');
    setStep(currentStep, true);
  }

  function firstUnfinished(unit) {
    for (let i = 0; i < unit.words.length; i++) {
      const r = state.progress[unit.id + ':' + unit.words[i].w];
      if (!r || !r.done) return i;
    }
    return 0;
  }

  function selectWord(wi) {
    const unit = UNITS[currentUnit];
    if (wi < 0) wi = unit.words.length - 1;
    if (wi >= unit.words.length) wi = 0;
    if (readState === 'recording') stopRecordingAudio();
    if (readState === 'listening') {
      readState = 'idle';
      if (bridge) { try { bridge.stopListening(); } catch (e) {} }
      if (webRecog) { try { webRecog.abort(); } catch (e) {} }
    }
    currentWord = wi;
    currentStep = 0;
    quiz = null;
    quizAnswered = false;
    quizSelected = '';
    spellBank = [];
    spellSlots = [];
    spellSolved = false;
    readState = 'idle';
    readMode = defaultReadMode();
    state.last = { unit: currentUnit, word: currentWord };
    save();
    renderLearn();
    const sc = $('#learnScroll');
    if (sc) sc.scrollTop = 0;
  }

  function moveWord(delta) {
    const unit = UNITS[currentUnit];
    let wi = currentWord + delta;
    if (wi < 0) { toast('已经是第一个单词啦'); wi = unit.words.length - 1; }
    else if (wi >= unit.words.length) { toast('本单元学完啦，再来一遍吧'); wi = 0; }
    selectWord(wi);
  }

  /* ---------------- 首页 ---------------- */
  function renderHome() {
    const d = new Date();
    if (!state.today || state.today.date !== todayStr()) {
      state.today = { date: todayStr(), count: 0 };
      save();
    }
    const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    $('#heroDate').textContent = (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · ' + weeks[d.getDay()];

    $('#statStars').textContent = state.stars || 0;
    $('#statStreak').textContent = state.streak || 0;
    $('#statLearned').textContent = learnedCount();

    const goal = state.settings.goal || 10;
    const done = Math.min(state.today.count || 0, goal);
    const pct = goallessPct(goal, done);
    $('#goalRing').style.setProperty('--p', pct);
    $('#goalDone').textContent = done;
    $('#goalTotal').textContent = goal;
    $('#goalText').textContent = done >= goal
      ? '目标达成！再学几个巩固一下吧 🎉'
      : '再学 ' + (goal - done) + ' 个单词就达标啦';

    $('#gradeChips').innerHTML = gradeChipsHTML(state.filterGrade);
    $('#gradeChips').onclick = function (e) {
      const chip = e.target.closest('[data-grade]');
      if (!chip) return;
      state.filterGrade = chip.dataset.grade;
      const terms = availableTerms(state.filterGrade);
      if (state.filterTerm !== '全部' && terms.length && terms.indexOf(state.filterTerm) < 0) {
        state.filterTerm = terms[0];
      }
      save();
      renderHome();
    };

    const terms = availableTerms(state.filterGrade);
    if (state.filterTerm !== '全部' && terms.length && terms.indexOf(state.filterTerm) < 0) {
      state.filterTerm = terms[0];
      save();
    }
    $('#termChips').innerHTML = termChipsHTML(state.filterTerm);
    $('#termChips').onclick = function (e) {
      const chip = e.target.closest('[data-term]');
      if (!chip) return;
      state.filterTerm = chip.dataset.term;
      save();
      renderHome();
    };

    const filtered = UNITS.map(function (unit, ui) { return { unit: unit, ui: ui }; })
      .filter(function (x) {
        return (state.filterGrade === 'all' || x.unit.grade === state.filterGrade) &&
          (state.filterTerm === '全部' || (x.unit.term || '全册') === state.filterTerm);
      });
    const gradeOrder = {};
    GRADES.forEach(function (g, i) { gradeOrder[g.id] = i; });
    filtered.sort(function (a, b) {
      const ga = gradeOrder[a.unit.grade] == null ? 99 : gradeOrder[a.unit.grade];
      const gb = gradeOrder[b.unit.grade] == null ? 99 : gradeOrder[b.unit.grade];
      const ta = termOrder(a.unit.term || '全册');
      const tb = termOrder(b.unit.term || '全册');
      const na = parseInt(String(a.unit.title).replace(/[^0-9]/g, ''), 10) || 0;
      const nb = parseInt(String(b.unit.title).replace(/[^0-9]/g, ''), 10) || 0;
      return ga - gb || ta - tb || na - nb || a.ui - b.ui;
    });

    const list = $('#unitList');
    list.innerHTML = filtered.map(function (x) {
      const unit = x.unit;
      const g = gradeOf(unit);
      const dc = unitDoneCount(unit);
      const total = unit.words.length;
      const p = Math.round(dc / total * 100);
      return '<button class="unit-card" data-unit="' + x.ui + '">' +
        '<span class="unit-emoji" style="background:' + esc(unit.tint) + '">' + unit.emoji + '</span>' +
        '<span class="unit-info">' +
        '<span class="unit-line"><span class="unit-name">' + esc(unit.title) + '</span><span class="unit-theme">' + esc(unit.theme) + '</span><span class="unit-grade" style="background:' + esc(g.tint) + ';color:' + esc(g.color) + '">' + esc(g.name) + '</span></span>' +
        '<span class="unit-meta"><span class="unit-bar"><i style="width:' + p + '%;background:linear-gradient(90deg,' + esc(unit.color) + 'AA,' + esc(unit.color) + ')"></i></span><em>' + dc + '/' + total + '</em></span>' +
        '</span>' +
        '<span class="unit-arrow">' + (dc === total ? '<span class="unit-done-badge">🏆</span>' : '›') + '</span>' +
        '</button>';
    }).join('');

    const shownWords = filtered.reduce(function (n, x) { return n + x.unit.words.length; }, 0);
    const gradeText = state.filterGrade === 'all' ? '全部年级' : (GRADE_MAP[state.filterGrade] || {}).name;
    $('#unitSummary').textContent = gradeText + ' · ' + state.filterTerm + ' · ' + filtered.length + ' 个单元 · ' + shownWords + ' 个单词';

    let wrongN = 0;
    let favN = 0;
    ALL_WORDS.forEach(function (it) {
      const r = state.progress[it.key];
      if (!r) return;
      if (r.wrong > 0) wrongN++;
      if (r.fav) favN++;
    });
    $('#quickWrong').textContent = wrongN + ' 个待复习';
    $('#quickFav').textContent = favN + ' 个单词';
  }

  function goallessPct(goal, done) {
    if (!goal) return 0;
    return Math.min(100, Math.round(done / goal * 100));
  }

  /* ---------------- 复习 ---------------- */
  function renderReview() {
    $$('#reviewTabs .seg').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === reviewTab);
    });
    const listEl = $('#reviewList');
    const hintEl = $('#reviewHint');
    let items = [];
    if (reviewTab === 'wrong') {
      items = ALL_WORDS.filter(function (it) {
        const r = state.progress[it.key];
        return r && r.wrong > 0;
      }).sort(function (a, b) {
        return (state.progress[b.key].wrong || 0) - (state.progress[a.key].wrong || 0);
      });
      hintEl.textContent = items.length ? '这些单词曾经答错过，再练一练就记住啦。' : '';
    } else if (reviewTab === 'fav') {
      items = ALL_WORDS.filter(function (it) {
        const r = state.progress[it.key];
        return r && r.fav;
      });
      hintEl.textContent = items.length ? '你收藏的单词都在这里，点一下就能复习。' : '';
    } else {
      items = ALL_WORDS.filter(function (it) {
        const r = state.progress[it.key];
        return r && r.done;
      });
      hintEl.textContent = items.length ? '已经掌握的单词，共 ' + items.length + ' 个。' : '';
    }

    if (!items.length) {
      const empty = reviewTab === 'wrong'
        ? { e: '🌱', t: '还没有错词', p: '做练习时答错的单词会自动收集到这里。', btn: '去学单词' }
        : reviewTab === 'fav'
          ? { e: '⭐', t: '还没有收藏', p: '在学单词页面点击星标，就能收藏喜欢的单词。', btn: '去收藏单词' }
          : { e: '🏆', t: '还没有掌握的单词', p: '完成「写一写」这一步，单词就会进入已掌握。', btn: '开始学习' };
      listEl.innerHTML = '<div class="empty-state"><div class="e-emoji">' + empty.e + '</div><h3>' + empty.t + '</h3><p>' + empty.p + '</p><button class="btn-primary" id="emptyGo">' + empty.btn + '</button></div>';
      const btn = $('#emptyGo');
      if (btn) btn.addEventListener('click', function () {
        openLearn(state.last.unit || 0, state.last.word || 0, 0);
      });
      return;
    }

    listEl.innerHTML = items.map(function (it) {
      const r = state.progress[it.key];
      let tag = '';
      let step = 0;
      if (reviewTab === 'wrong') { tag = '<span class="review-tag wrong">错 ' + (r.wrong || 0) + '</span>'; step = 1; }
      else if (reviewTab === 'fav') { tag = '<span class="review-tag fav">收藏</span>'; step = 0; }
      else { tag = '<span class="review-tag done">已掌握</span>'; step = 0; }
      return '<div class="review-item" data-open="' + it.ui + '-' + it.wi + '" data-step="' + step + '">' +
        '<span class="review-emoji" style="background:' + esc(it.unit.tint) + '">' + it.word.emoji + '</span>' +
        '<span class="review-info"><h3>' + esc(it.word.w) + '</h3><p>' + esc(gradeOf(it.unit).name) + ' · ' + esc(it.unit.title) + ' · ' + esc(it.word.cn) + '</p></span>' +
        tag +
        '<button class="review-spk" data-play="' + it.ui + '-' + it.wi + '" aria-label="播放发音">' + I.speaker + '</button>' +
        '</div>';
    }).join('');
  }

  /* ---------------- 我的 ---------------- */
  function renderMe() {
    $('#meLearned').textContent = learnedCount();
    $('#meStars').textContent = state.stars || 0;
    $('#meStreak').textContent = state.streak || 0;
    updateSettingsUI();
    $('#engineInfo').textContent = bridge
      ? '发音引擎：本地单词音频 + 系统 TTS'
      : '发音引擎：浏览器语音（预览模式）';
    const si = $('#screenInfo');
    if (si) {
      if (window.EGDetectScreen) { try { window.EGDetectScreen(); } catch (e) {} }
      const sc = window.EG_SCREEN;
      if (sc) {
        si.textContent = '屏幕：' + sc.physical + ' · ' + Number(sc.density).toFixed(2) + 'x · ' +
          sc.cssWidth + '×' + sc.cssHeight + 'dp · ' +
          (sc.orientation === 'landscape' ? '横屏' : '竖屏') + ' · ' + sc.layoutName;
      } else {
        si.textContent = '屏幕：检测中…';
      }
    }
  }

  function updateSettingsUI() {
    $$('#accentSeg .seg').forEach(function (b) {
      b.classList.toggle('active', b.dataset.accent === state.settings.accent);
    });
    const range = $('#rateRange');
    if (range) {
      range.value = state.settings.rate;
      const pct = (state.settings.rate - 0.6) / 0.6 * 100;
      range.style.background = 'linear-gradient(90deg, var(--orange) ' + pct + '%, #F1E4D7 ' + pct + '%)';
    }
    const rl = $('#rateLabel');
    if (rl) rl.textContent = Number(state.settings.rate).toFixed(1) + 'x';
    const sw = $('#autoPlaySwitch');
    if (sw) sw.classList.toggle('on', !!state.settings.autoPlay);
    $$('#goalPicks button').forEach(function (b) {
      b.classList.toggle('active', Number(b.dataset.goal) === Number(state.settings.goal));
    });
  }

  /* ---------------- 巩固知识库 ---------------- */
  let consolSelected = {};
  let drill = null;

  let splitPieces = [];
  let splitPlaced = [];
  let splitStarted = false;
  let splitSolved = false;
  let splitKey = '';

  function renderConsolidate() {
    $('#consolTotal').textContent = ALL_WORDS.length;
    $('#consolKnown').textContent = learnedCount();
    let weak = 0;
    ALL_WORDS.forEach(function (it) {
      const r = state.progress[it.key];
      if (r && r.wrong > 0) weak++;
    });
    $('#consolWeak').textContent = weak;

    const chips = $('#consolGrades');
    chips.innerHTML = gradeChipsHTML(state.consolGrade);
    chips.onclick = function (e) {
      const chip = e.target.closest('[data-grade]');
      if (!chip) return;
      state.consolGrade = chip.dataset.grade;
      save();
      renderConsolidate();
    };

    renderConsolGrid();
    updateSelCount();
  }

  function renderConsolGrid() {
    const items = wordsOfGrade(state.consolGrade);
    const grid = $('#consolGrid');
    grid.innerHTML = items.map(function (it) {
      const sel = !!consolSelected[it.key];
      const g = gradeOf(it.unit);
      return '<div class="kb-word' + (sel ? ' selected' : '') + '" data-key="' + esc(it.key) + '">' +
        '<span class="kb-check">✓</span>' +
        '<span class="kb-main"><b>' + esc(it.word.w) + '</b><span>' + esc(g.name) + ' · ' + esc(it.word.cn) + '</span></span>' +
        '<button class="kb-play" data-kbplay="' + esc(it.key) + '" aria-label="播放发音">' + I.speaker + '</button>' +
        '</div>';
    }).join('');
  }

  function updateSelCount() {
    const n = Object.keys(consolSelected).length;
    const el = $('#selCount');
    if (el) el.textContent = '已选 ' + n + ' 词';
    const sc = $('#startCount');
    if (sc) sc.textContent = n;
    const btn = $('#startDrill');
    if (btn) btn.classList.toggle('disabled', n === 0);
  }

  function toggleConsol(key) {
    if (consolSelected[key]) delete consolSelected[key];
    else consolSelected[key] = 1;
    const card = $('.kb-word[data-key="' + key.replace(/"/g, '\\"') + '"]');
    if (card) card.classList.toggle('selected', !!consolSelected[key]);
    updateSelCount();
    beep('ding');
  }

  function setConsolSelection(keys) {
    consolSelected = {};
    keys.forEach(function (k) { consolSelected[k] = 1; });
    renderConsolGrid();
    updateSelCount();
  }

  /* ---------------- 巩固训练 ---------------- */
  function startDrill(keys) {
    const items = [];
    const seen = {};
    (keys || []).forEach(function (k) {
      const x = WORD_INDEX[k];
      if (!x || seen[k]) return;
      seen[k] = 1;
      items.push({ key: k, word: x.word, unit: x.unit, ui: x.unitIndex, wi: x.wordIndex });
    });
    if (!items.length) { toast('先选几个单词吧'); return; }
    drill = {
      keys: items.map(function (it) { return it.key; }),
      queue: shuffle(items),
      index: 0,
      known: 0,
      again: 0,
      weak: {},
      knownKeys: {},
      revealed: false
    };
    showScreen('drill');
  }

  function renderDrill() {
    if (!drill) { showScreen('consolidate'); return; }
    const total = drill.queue.length;
    if (drill.index >= total) { renderDrillSummary(); return; }

    const item = drill.queue[drill.index];
    const word = item.word;
    const g = gradeOf(item.unit);
    $('#drillSub').textContent = '第 ' + (drill.index + 1) + ' / ' + total + ' 个';
    $('#drillBar').style.width = (total ? Math.round(drill.index / total * 100) : 0) + '%';

    const tiles = '<div class="word-tiles" data-drill-say="1">' + word.chunks.map(function (c) {
      return '<span class="tile">' + lettersHTML(c) + '</span>';
    }).join('') + '</div>';

    const revealHTML = drill.revealed
      ? '<div class="drill-answer">' +
      '<div class="meaning">' + esc(word.cn) + '</div>' +
      (word.sentence ? '<div class="sentence-card">' +
        '<div class="sentence-body"><div class="sentence-en">' + esc(word.sentence) + '</div><div class="sentence-cn">' + esc(word.sentenceCn) + '</div></div>' +
        '<button class="mini-spk" data-speak-sentence="1" aria-label="朗读例句">' + I.speaker + '</button>' +
        '</div>' : '') +
      '<div class="drill-chunks">' + chunkMapHTML(word) + '</div>' +
      '<div class="drill-hint">自然拼读：' + word.parts.map(function (p) { return esc(p); }).join(' · ') + '</div>' +
      '</div>' +
      '<div class="drill-actions">' +
      '<button class="btn-ghost" id="drillAgainBtn">😵 还不熟</button>' +
      '<button class="btn-primary" id="drillKnownBtn">😎 记住了</button>' +
      '</div>'
      : '<div class="drill-q">你还记得它的意思吗？<small>先在心里想一想，再点击显示释义</small></div>' +
      '<button class="btn-ghost drill-reveal" id="drillReveal">👀 显示释义</button>' +
      '<div class="drill-hint">点单词或喇叭可以再听一遍发音</div>';

    $('#drillCard').innerHTML =
      '<div class="drill-meta"><span class="grade-pill" style="background:' + esc(g.tint) + ';color:' + esc(g.color) + '">' + esc(g.name) + '</span>' +
      '<span>' + esc(item.unit.title) + ' · ' + esc(item.unit.theme) + '</span></div>' +
      tiles +
      '<div style="margin-top:12px">' + ipaHTML(word) + '</div>' +
      (word.img ? '<div class="drill-illu has-img"><img src="' + esc(word.img) + '" alt="' + esc(word.w) + '"></div>' : '<div class="drill-illu">' + word.emoji + '</div>') +
      revealHTML;

    const reveal = $('#drillReveal');
    if (reveal) reveal.addEventListener('click', function () {
      drill.revealed = true;
      renderDrill();
    });
    const known = $('#drillKnownBtn');
    if (known) known.addEventListener('click', function () { drillMark(true); });
    const again = $('#drillAgainBtn');
    if (again) again.addEventListener('click', function () { drillMark(false); });
    const sc = $('#drillScroll');
    if (sc) sc.scrollTop = 0;
  }

  function drillMark(known) {
    if (!drill || drill.index >= drill.queue.length) return;
    const item = drill.queue[drill.index];
    const r = getRec(item.key);
    if (known) {
      r.correct = (r.correct || 0) + 1;
      r.reviewed = (r.reviewed || 0) + 1;
      drill.known++;
      drill.knownKeys[item.key] = 1;
      addStars(1);
      beep('good');
    } else {
      r.wrong = (r.wrong || 0) + 1;
      r.reviewed = (r.reviewed || 0) + 1;
      drill.again++;
      drill.weak[item.key] = 1;
      if (!item._retry) {
        drill.queue.push(Object.assign({}, item, { _retry: true }));
      }
      beep('bad');
    }
    save();
    drill.index++;
    drill.revealed = false;
    renderDrill();
  }

  function renderDrillSummary() {
    const total = drill.known + drill.again;
    const acc = total ? Math.round(drill.known / total * 100) : 0;
    const starN = acc >= 90 ? 5 : acc >= 75 ? 4 : acc >= 55 ? 3 : acc >= 30 ? 2 : 1;
    const knownUnique = Object.keys(drill.knownKeys).length;
    const weakUnique = Object.keys(drill.weak).length;
    $('#drillSub').textContent = '巩固完成';
    $('#drillBar').style.width = '100%';
    const stars = [1, 2, 3, 4, 5].map(function (i) {
      return '<span class="' + (i <= starN ? '' : 'off') + '">' + I.starFill + '</span>';
    }).join('');
    $('#drillCard').innerHTML = '<div class="drill-summary">' +
      '<div class="e-emoji">' + (weakUnique === 0 ? '🏆' : '🎉') + '</div>' +
      '<h2>' + (weakUnique === 0 ? '全部记住啦！' : '巩固完成！') + '</h2>' +
      '<p class="sum-sub">本轮练习 ' + total + ' 次，正确率 ' + acc + '%' + (weakUnique ? '<br>还有 ' + weakUnique + ' 个单词需要再练一练' : '<br>你的知识库又变强了！') + '</p>' +
      '<div class="score-stars">' + stars + '</div>' +
      '<div class="stat-row">' +
      '<div class="stat-card"><b>' + knownUnique + '</b><span>记住单词</span></div>' +
      '<div class="stat-card"><b>' + weakUnique + '</b><span>待再巩固</span></div>' +
      '<div class="stat-card"><b>+' + drill.known + '</b><span>获得星星</span></div>' +
      '</div>' +
      '<div class="sum-actions">' +
      '<button class="btn-primary" id="drillRestart">🔁 ' + (weakUnique ? '再练不熟的词' : '再来一轮') + '</button>' +
      '<button class="btn-ghost" id="drillReturn">返回知识库</button>' +
      '</div>' +
      '</div>';
    const restart = $('#drillRestart');
    if (restart) restart.addEventListener('click', function () {
      const weakKeys = Object.keys(drill.weak);
      startDrill(weakKeys.length ? weakKeys : drill.keys);
    });
    const ret = $('#drillReturn');
    if (ret) ret.addEventListener('click', function () { showScreen('consolidate'); });
    if (weakUnique === 0) celebrate(24);
    const sc = $('#drillScroll');
    if (sc) sc.scrollTop = 0;
  }


  function renderLearn() {
    const unit = UNITS[currentUnit];
    const word = unit.words[currentWord];
    const grade = gradeOf(unit);
    $('#learnUnitTitle').textContent = unit.title;
    $('#learnUnitTheme').textContent = grade.name + ' · ' + (unit.term || '') + (unit.theme ? ' · ' + unit.theme : '');

    const fav = !!getRec().fav;
    const favBtn = $('#learnFav');
    favBtn.innerHTML = fav ? I.starFill : I.star;
    favBtn.style.color = fav ? '#FFE08A' : '#fff';

    const strip = $('#wordStrip');
    strip.innerHTML = unit.words.map(function (w, wi) {
      const r = state.progress[unit.id + ':' + w.w];
      const done = r && r.done;
      return '<button class="word-chip' + (wi === currentWord ? ' active' : '') + (done ? ' done' : '') + '" data-wi="' + wi + '">' + esc(w.w) + '</button>';
    }).join('');
    requestAnimationFrame(function () {
      const active = $('.word-chip.active', strip);
      if (active) {
        const left = active.offsetLeft - strip.clientWidth / 2 + active.offsetWidth / 2;
        strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    });

    currentStep = Math.min(Math.max(0, currentStep), 3);
    updateStepper();
    renderStage();
    if (currentStep === 0 && state.settings.autoPlay) {
      setTimeout(function () { if (currentScreen === 'learn' && currentStep === 0) pronounceWord(word); }, 400);
    }
  }

  function setStep(i, silent) {
    currentStep = Math.min(Math.max(0, i), 3);
    if (currentStep === 1 && (!quiz || quiz.key !== currentKey())) {
      quiz = buildQuiz(currentWordObj());
      quizAnswered = false;
      quizCorrect = false;
    }
    if (currentStep === 2 && assembleKey !== currentKey()) initAssemble();
    if (currentStep === 3) { /* 写 */ }
    updateStepper();
    renderStage();
    const sc = $('#learnScroll');
    if (sc) sc.scrollTo({ top: 0, behavior: silent ? 'auto' : 'smooth' });
    if (currentStep === 0) markStepDone(0);
    if (currentStep === 0 && state.settings.autoPlay && !silent) {
      setTimeout(function () { if (currentScreen === 'learn' && currentStep === 0) pronounceWord(currentWordObj()); }, 250);
    }
  }

  function tilesHTML(word) {
    return '<div class="word-tiles">' + word.chunks.map(function (c, i) {
      return '<button class="tile" data-chunk="' + i + '">' + lettersHTML(c) + '</button>';
    }).join('') + '</div>';
  }

  function lettersHTML(c) {
    const text = String(c[0] || '');
    const phon = String(c[1] || '');
    const vowelChunk = !!c[2];
    const hasVowelSound = /[aeiouɑɒɔəɛɪʊʌɜæɐ]/.test(phon);
    const wholeVowel = /^(air|ear|eer|igh|our|ure|oa|oo|ee|ea|ai|ay|ow|ou|ue|ui|ey|oi|oy|aw|au|ew|ie)$/i.test(text);
    return '<span class="tl">' + text.split('').map(function (ch) {
      let v = /[aeiou]/i.test(ch) || (ch.toLowerCase() === 'y' && vowelChunk);
      if (!hasVowelSound) v = false;
      if (wholeVowel && hasVowelSound) v = true;
      return '<i class="' + (v ? 'v' : '') + '">' + esc(ch) + '</i>';
    }).join('') + '</span>';
  }

  function simpleLetters(text) {
    return '<span class="tl">' + String(text == null ? '' : text).split('').map(function (ch) {
      return '<i class="' + (/[aeiouy]/i.test(ch) ? 'v' : '') + '">' + esc(ch) + '</i>';
    }).join('') + '</span>';
  }

  function chunkMapHTML(word) {
    return '<div class="chunk-map">' + word.chunks.map(function (c, i) {
      return '<button class="chunk' + (c[2] ? ' vowel' : '') + '" data-chunk="' + i + '" aria-label="播放音块"><b>' + lettersHTML(c) + '</b><span>' + (c[1] ? esc(c[1]) : '·') + '</span></button>';
    }).join('') + '</div>';
  }

  function ipaHTML(word) {
    return '<div class="ipa-pill"><span>' + esc(word.ipa) + '</span><button class="ipa-phonemes" data-speak-phonemes="1" aria-label="逐个播放音素">音素</button><button class="spk" data-speak-word="1" aria-label="播放单词发音">' + I.speaker + '</button></div>';
  }

  function renderStage() {
    clearSpeakFx();
    const wrap = $('.word-strip-wrap');
    if (wrap) wrap.style.display = (currentStep === 2 || currentStep === 3) ? 'none' : '';
    const stage = $('#stage');
    const word = currentWordObj();
    if (currentStep === 0) stage.innerHTML = stageLearn(word);
    else if (currentStep === 1) stage.innerHTML = stageQuiz(word);
    else if (currentStep === 2) stage.innerHTML = stageAssemble(word);
    else stage.innerHTML = stageWrite(word);
    bindStage(word);
    if (currentStep === 3) initWriteCanvas();
    if (currentStep === 1 && quiz && quiz.type === 'en' && !quizAnswered) {
      setTimeout(function () {
        if (currentScreen === 'learn' && currentStep === 1) speak(word.audio || word.w);
      }, 350);
    }
  }

  /* ---------- 学 ---------- */
  function illustrationHTML(word) {
    if (word.img) {
      return '<div class="illustration has-img"><img class="word-img" src="' + esc(word.img) + '" alt="' + esc(word.w) + '"><span class="word-caption">' + esc(word.w) + '</span></div>';
    }
    return '<div class="illustration"><span class="big-emoji">' + word.emoji + '</span><span class="word-caption">' + esc(word.w) + '</span></div>';
  }

  function stageLearn(word) {
    const r = getRec();
    return '<div class="word-head">' +
      tilesHTML(word) +
      '<div class="word-tools">' +
      '<button class="tool" id="toolSplit"><span>🔨</span>拆拼</button>' +
      '<button class="tool" id="toolLink"><span>🔗</span>拼读</button>' +
      '<button class="tool' + (r.fav ? ' on' : '') + '" id="toolFav"><span>' + (r.fav ? '⭐' : '☆') + '</span>收藏</button>' +
      '</div>' +
      ipaHTML(word) +
      '<div class="meaning">' + esc(word.cn) + '</div>' +
      '</div>' +
      chunkMapHTML(word) +
      '<div class="phonics-tip" id="phonicsTip">点音块：听这个字母组合的发音</div>' +
      illustrationHTML(word) +
      (word.sentence ? '<div class="sentence-card">' +
        '<div class="sentence-body"><div class="sentence-en">' + esc(word.sentence) + '</div><div class="sentence-cn">' + esc(word.sentenceCn) + '</div></div>' +
        '<button class="mini-spk" data-speak-sentence="1" aria-label="朗读例句">' + I.speaker + '</button>' +
        '</div>' : '') +
      '<button class="stage-jump" id="jumpQuiz">去练一练 ›</button>';
  }

  /* ---------- 读（旧版六步模型遗留，四步流程不调用） ---------- */
  function stageRead(word) {
    const sttOk = speechRecogAvailable();
    const recOk = recorderAvailable();
    if (!sttOk && recOk) readMode = 'record';
    else if (sttOk && !recOk) readMode = 'stt';
    else if (!sttOk && !recOk) readMode = 'none';
    else if (readMode !== 'record' && readMode !== 'stt') readMode = 'stt';

    const perm = (bridge && typeof bridge.hasRecordPermission === 'function') ? !!bridge.hasRecordPermission() : true;
    const listening = readState === 'listening';
    const recording = readState === 'recording';
    const micClass = 'mic-btn' + (listening ? ' listening' : '') + (recording ? ' recording' : '');

    let label = '点击麦克风，读出单词';
    let hint = '说出单词，系统会给你打分';
    if (readMode === 'record') {
      label = '点击麦克风，录下自己的声音';
      hint = '录完可以回放，和示范发音对比';
    }
    if (readMode === 'none') {
      label = '当前设备不支持麦克风';
      hint = '可以先听示范发音，跟着读一读';
    }
    if (listening) { label = '正在聆听…'; hint = '大声、清楚地读出单词'; }
    if (recording) { label = '正在录音…'; hint = '再点一下按钮停止录音'; }

    const modeHTML = readMode === 'none' ? '' :
      '<div class="read-mode">' +
      (sttOk ? '<button class="mode-chip' + (readMode === 'stt' ? ' active' : '') + '" data-readmode="stt">语音评分</button>' : '') +
      (recOk ? '<button class="mode-chip' + (readMode === 'record' ? ' active' : '') + '" data-readmode="record">录音跟读</button>' : '') +
      '</div>';

    let noteHTML = '';
    if (!sttOk && recOk) noteHTML = '<div class="read-engine-note">本机未检测到英文语音识别，已使用录音跟读</div>';
    else if (recOk && !perm) noteHTML = '<div class="read-engine-note">首次使用会请求麦克风权限</div>';

    let resultHTML = '';
    if (readState === 'result') resultHTML = scoreBoxHTML(word);
    if (readState === 'recorded') {
      resultHTML = '<div class="score-box">' +
        '<div class="score-msg">🎧 录音完成，听听自己的发音吧</div>' +
        '<div class="rec-row">' +
        '<button class="btn-ghost" id="playRec">▶ 听我的录音</button>' +
        '<button class="btn-primary" id="selfPass">🌟 我读得不错</button>' +
        '</div>' +
        '<div class="score-recognized">对比示范发音，看看哪里还能更清楚</div>' +
        '</div>';
    }

    let action = '';
    if (readMode === 'none') {
      action = '<button class="btn-primary" id="playModelOnly" style="height:44px;padding:0 24px;font-size:14px;margin-top:16px">🔊 听示范发音</button>';
    } else {
      action = '<div class="mic-wrap">' +
        '<span class="mic-ring' + (listening ? ' live' : '') + '"></span>' +
        '<span class="mic-ring' + (listening ? ' live' : '') + '"></span>' +
        '<button class="' + micClass + '" id="micBtn" aria-label="跟读">' + I.mic + '</button>' +
        '</div>' +
        '<div class="mic-label">' + label + '</div>' +
        '<div class="mic-hint">' + hint + '</div>' +
        '<div class="mic-meter"><i id="micMeter"></i></div>';
    }

    return '<div class="read-stage">' +
      '<div class="word-tiles read-word">' + word.chunks.map(function (c, i) {
        return '<span class="tile" data-chunk="' + i + '">' + lettersHTML(c) + '</span>';
      }).join('') + '</div>' +
      '<div style="margin-top:12px">' + ipaHTML(word) + '</div>' +
      '<div class="meaning">' + esc(word.cn) + '</div>' +
      modeHTML +
      noteHTML +
      action +
      (readState === 'idle' ? '<div class="live-transcript" id="liveTranscript"></div>' : '') +
      (listening ? '<div class="live-transcript" id="liveTranscript">正在聆听…</div>' : '') +
      (recording ? '<div class="live-transcript" id="liveTranscript">🔴 录音中…再点一下停止</div>' : '') +
      resultHTML +
      '<div class="mic-safe-note">🔒 语音仅用于本机跟读练习，不会上传</div>' +
      '</div>';
  }

  function scoreBoxHTML(word) {
    const score = readScore || 0;
    let stars = 1;
    if (score >= 0.9) stars = 5;
    else if (score >= 0.78) stars = 4;
    else if (score >= 0.62) stars = 3;
    else if (score >= 0.4) stars = 2;
    const msgs = score >= 0.9 ? '完美发音，太厉害了！'
      : score >= 0.78 ? '读得很棒，再清晰一点就满分！'
        : score >= 0.62 ? '很不错，继续跟着读一读～'
          : score >= 0.4 ? '有进步，再听一遍示范吧'
            : '别着急，先听示范再慢慢读';
    const starHTML = [1, 2, 3, 4, 5].map(function (i) {
      return '<span class="' + (i <= (readSelf ? 5 : stars) ? '' : 'off') + '">' + I.starFill + '</span>';
    }).join('');
    if (readSelf) {
      return '<div class="score-box">' +
        '<div class="score-num">⭐<small> 完成跟读</small></div>' +
        '<div class="score-stars">' + starHTML + '</div>' +
        '<div class="score-msg">真棒！大声读出来就是最好的练习</div>' +
        '<div class="score-actions"><button class="btn-primary" id="readContinue">继续练一练 →</button></div>' +
        '</div>';
    }
    return '<div class="score-box">' +
      '<div class="score-num">' + Math.round(score * 100) + '<small> 分</small></div>' +
      '<div class="score-stars">' + starHTML + '</div>' +
      '<div class="score-msg">' + msgs + '</div>' +
      (readHeard ? '<div class="score-recognized">听到：' + esc(readHeard) + '</div>' : '') +
      '<div class="score-actions">' +
      (score >= 0.6
        ? '<button class="btn-primary" id="readContinue">继续练一练 →</button>'
        : '<button class="btn-primary" id="readRetry">再读一次</button>') +
      '<button class="btn-ghost" id="readModel">听示范</button>' +
      '</div>' +
      '</div>';
  }

  /* ---------- 练 ---------- */
  function buildQuiz(word) {
    const typeRoll = Math.random();
    const canChunk = word.chunks.length >= 2;
    let type = 'cn';
    if (typeRoll < 0.42) type = 'cn';
    else if (typeRoll < 0.76) type = 'en';
    else type = canChunk ? 'chunk' : 'cn';

    const others = ALL_WORDS.filter(function (it) { return it.word.w !== word.w; });

    if (type === 'cn') {
      const vals = [];
      const used = {};
      used[word.cn] = 1;
      const pool = shuffle(others.map(function (it) { return it.word.cn; }));
      for (let i = 0; i < pool.length && vals.length < 3; i++) {
        if (!used[pool[i]]) { used[pool[i]] = 1; vals.push(pool[i]); }
      }
      const options = shuffle([word.cn].concat(vals)).map(function (v) { return { v: v, sub: '' }; });
      return { key: currentKey(), type: type, answer: word.cn, options: options, chunkIndex: -1 };
    }

    if (type === 'en') {
      const vals = [];
      const used = {};
      used[word.w] = 1;
      const pool = shuffle(others.map(function (it) { return it.word.w; }));
      for (let i = 0; i < pool.length && vals.length < 3; i++) {
        if (!used[pool[i]]) { used[pool[i]] = 1; vals.push(pool[i]); }
      }
      const options = shuffle([word.w].concat(vals)).map(function (v) { return { v: v, sub: '' }; });
      return { key: currentKey(), type: type, answer: word.w, options: options, chunkIndex: -1 };
    }

    // 缺字母组合
    let idx = Math.floor(Math.random() * word.chunks.length);
    const answerChunk = word.chunks[idx];
    const usedText = {};
    usedText[answerChunk[0]] = 1;
    const subMap = {};
    word.chunks.forEach(function (c) { subMap[c[0]] = c[1]; });
    const pool = shuffle(others.reduce(function (acc, it) {
      it.word.chunks.forEach(function (c) { if (c[0]) acc.push(c[0]); });
      return acc;
    }, []));
    const vals = [];
    for (let i = 0; i < pool.length && vals.length < 3; i++) {
      if (!usedText[pool[i]]) { usedText[pool[i]] = 1; vals.push(pool[i]); }
    }
    const all = [answerChunk[0]].concat(vals).map(function (v) {
      return { v: v, sub: subMap[v] || '' };
    });
    return { key: currentKey(), type: type, answer: answerChunk[0], options: shuffle(all), chunkIndex: idx };
  }

  function stageQuiz(word) {
    if (!quiz || quiz.key !== currentKey()) {
      quiz = buildQuiz(word);
      quizAnswered = false;
      quizCorrect = false;
    }
    let prompt = '';
    let title = '';
    if (quiz.type === 'cn') {
      title = '选出正确的中文意思';
      prompt = tilesHTML(word);
    } else if (quiz.type === 'en') {
      title = '听一听，选出正确的单词';
      prompt = '<div style="text-align:center;margin:14px 0 4px">' +
        '<button class="listen-pill" id="quizPlay">' + I.speaker + '<span>点我听单词</span></button>' +
        '</div>';
    } else {
      title = '选出缺少的字母组合';
      prompt = '<div class="word-tiles quiz-word">' + word.chunks.map(function (c, i) {
        if (i === quiz.chunkIndex) return '<span class="quiz-blank">?</span>';
        return '<span class="tile">' + lettersHTML(c) + '</span>';
      }).join('') + '</div>';
    }

    const letters = ['A', 'B', 'C', 'D'];
    const opts = quiz.options.map(function (o, i) {
      let cls = 'option';
      if (quizAnswered) {
        if (o.v === quiz.answer) cls += ' correct';
        else if (o.v === quizSelected) cls += ' wrong';
      }
      return '<button class="' + cls + '" data-opt="' + esc(o.v) + '"' + (quizAnswered ? ' disabled' : '') + '>' +
        '<span class="opt-key">' + letters[i] + '</span>' +
        '<span class="opt-text">' + esc(o.v) + (o.sub ? ' <span class="opt-sub">' + esc(o.sub) + '</span>' : '') + '</span>' +
        (quizAnswered && o.v === quiz.answer ? '<span class="opt-check">✓</span>' : '') +
        '</button>';
    }).join('');

    let feedback = '';
    if (quizAnswered) {
      feedback = quizCorrect
        ? '<div class="feedback good">✅ 太棒了！<b>' + esc(word.w) + '</b> 就是「' + esc(word.cn) + '」</div>'
        : '<div class="feedback bad">❌ 正确答案是 <b>' + esc(quiz.answer) + '</b>' + (quiz.type === 'chunk' ? '（' + esc(word.w) + '）' : '') + '，再试一次吧。</div>';
    }

    let actions = '';
    if (quizAnswered) {
      actions = quizCorrect
        ? '<div class="quiz-actions"><button class="btn-primary" id="quizNext">继续学 →</button><button class="btn-ghost" id="quizAgain">换一题</button></div>'
        : '<div class="quiz-actions"><button class="btn-primary" id="quizRetry">再试一次</button><button class="btn-ghost" id="quizGoSplit">去拆一拆</button></div>';
    }

    return '<div class="quiz-stage">' +
      '<div class="quiz-eyebrow">练一练 · ' + (quiz.type === 'en' ? '听力' : quiz.type === 'chunk' ? '拼读' : '词义') + '</div>' +
      '<div class="quiz-title">' + title + '</div>' +
      prompt +
      '<div class="options">' + opts + '</div>' +
      feedback +
      actions +
      '<button class="stage-jump" id="jumpSplit">去拆一拆 ›</button>' +
      '</div>';
  }

  function answerQuiz(btn) {
    if (!quiz || quizAnswered) return;
    const val = btn.dataset.opt;
    quizAnswered = true;
    quizCorrect = (val === quiz.answer);
    quizSelected = val;
    if (quizCorrect) {
      const newly = markStepDone(1, 1);
      const r = getRec();
      r.correct = (r.correct || 0) + 1;
      save();
      beep('good');
      if (newly) celebrate(10);
    } else {
      const r = getRec();
      r.wrong = (r.wrong || 0) + 1;
      save();
      beep('bad');
      toast('答错了，看看正确答案吧');
    }
    renderStage();
    updateStepper();
  }

  /* ---------- 拆拼 ---------- */
  function initAssemble() {
    const word = currentWordObj();
    const chars = Array.from(word.w);
    assemblePieces = chars.map(function (ch, i) { return { ch: ch, id: i }; });
    assembleBank = assemblePieces.slice();
    if (assembleBank.length > 1) {
      for (let tries = 0; tries < 8; tries++) {
        assembleBank = shuffle(assembleBank);
        if (assembleBank.map(function (p) { return p.ch; }).join('').toLowerCase() !== word.w.toLowerCase()) break;
      }
    }
    assembleSlots = [];
    assembleSolved = false;
    assembleError = false;
    assembleKey = currentKey();
  }

  function chunkIndexForLetter(word, letterIndex) {
    let pos = 0;
    for (let i = 0; i < word.chunks.length; i++) {
      const len = word.chunks[i][0].length;
      if (letterIndex >= pos && letterIndex < pos + len) return i;
      pos += len;
    }
    return -1;
  }

  // Per-letter sound map for multi-letter graphemes.  The chunk IPA is one
  // unit (ence = /əns/), but a letter tap must not replay the whole chunk.
  const CHUNK_LETTER_RULES = {
    ence: [0, 1, 2, null],
    ance: [0, 1, 2, null],
    tion: [0, null, 1, 2],
    sion: [0, null, 1, 2],
    cian: [0, null, 1, 2],
    sci: [0, null, 1],
    ture: [0, null, 1, null],
    sure: [0, null, 1, null],
    air: [0, null, 1],
    are: [0, 1, null],
    ing: [0, 1, null],
    ear: [0, null, 1],
    ness: [0, 1, 2, null],
    less: [0, 1, 2, null],
    igh: [0, null, null],
    ough: [0, null, null, null],
    eigh: [0, null, null, null],
    tch: [0, null, null],
    dge: [0, null, null],
    eye: [0, null, null],
    the: [0, null, null],
    que: [0, null, null],
    gue: [0, null, null]
  };

  // Some graphemes need a different letter split depending on the IPA.  The
  // spelling is the same ("le") but /əl/ (apple) and /l/ (mile) put the sound
  // on different letters, so these rules are keyed by letters + IPA.
  // A value may be a single token index or an array of indices.
  const CHUNK_IPA_RULES = {
    'le|əl': [1, null],          // apple: l = /l/, final e silent
    'al|l': [null, 0],           // special: a silent, l = /l/
    'er|r': [null, 0],           // drawer: e silent, r = /r/
    'or|r': [null, 0],           // laboratory: o silent, r = /r/
    'nes|nz': [0, null, 1],      // Wednesday: n = /n/, e silent, s = /z/
    'xe|ks': [[0, 1], null],     // fixed: x = /ks/, e silent
    // Proper name stored as one word chunk: Rowling r o w l i n g
    'rowling|roʊlɪŋ': [0, 1, null, 2, 3, 4, null]
  };

  function applyLetterRule(rule, toks, put) {
    rule.forEach(function (val, i) {
      if (val === null || val === undefined) return;
      const idxs = Array.isArray(val) ? val : [val];
      const list = idxs.filter(function (idx) { return idx < toks.length; })
        .map(function (idx) { return toks[idx]; });
      if (list.length) put(i, list);
    });
  }

  function letterTokenMap(text, ipa) {
    const raw = String(text || '').toLowerCase().split('');
    const letters = [];
    const positions = [];
    raw.forEach(function (ch, i) {
      if (/[a-z]/.test(ch)) { letters.push(ch); positions.push(i); }
    });
    const out = raw.map(function () { return null; });
    const toks = tokenizeIPA(ipa);
    if (!letters.length || !toks.length) return out;
    const put = function (li, value) {
      if (li >= 0 && li < positions.length) out[positions[li]] = value;
    };
    // A single r-coloured token such as /ɪr/ in "ear" still has an r the
    // child can tap: split it into vowel + /r/ for letter feedback.
    if (toks.length === 1 && R_SPLIT[toks[0]]) {
      const rIndex = letters.lastIndexOf('r');
      if (rIndex > 0) {
        put(0, [R_SPLIT[toks[0]]]);
        put(rIndex, ['r']);
        return out;
      }
    }
    const key = letters.join('');
    const ipaKey = key + '|' + chunkIpaKey(ipa);
    const ipaRule = CHUNK_IPA_RULES[ipaKey];
    if (ipaRule) {
      applyLetterRule(ipaRule, toks, put);
      return out;
    }
    const rule = CHUNK_LETTER_RULES[key];
    if (rule) {
      applyLetterRule(rule, toks, put);
      return out;
    }
    // Final silent e: ence /əns/ -> e n c e, last e is silent.
    // Whole-word / abbreviation chunks (Mr, Dr, km, kg, etc.) have more
    // phonemes than letters.  Put the whole chunk on its first letter and
    // leave the rest silent; never dump leftovers onto later letters.
    if (toks.length > letters.length && letters.length) {
      put(0, toks);
      return out;
    }
    // Doubled letters (ll in ball, pp in apple, ss in glass) share one sound.
    // Tapping either copy should hear it, not just the first one.
    const core = letters.slice();
    if (core.length > 1 && core[core.length - 1] === 'e') core.pop();
    if (toks.length === 1 && core.length > 1 && core.every(function (ch) { return ch === core[0]; })) {
      core.forEach(function (_, i) { put(i, [toks[0]]); });
      return out;
    }
    let active = letters.slice();
    if (active.length > toks.length && active[active.length - 1] === 'e') active.pop();
    for (let i = 0; i < active.length; i++) {
      if (i < toks.length) put(i, [toks[i]]);
    }
    if (toks.length > active.length && active.length) {
      put(0, toks);
    }
    return out;
  }

  function playLetterSound(word, letterIndex) {
    const ci = chunkIndexForLetter(word, letterIndex);
    if (ci < 0) return false;
    const c = word.chunks[ci];
    const letter = word.w.charAt(letterIndex);
    if (!c[1]) {
      toast('字母 ' + letter + ' 在这里不发音哦');
      return false;
    }
    const offset = letterIndex - chunkStartLetter(word, ci);
    const map = letterTokenMap(c[0], c[1]);
    const toks = map[offset] || [];
    if (!toks.length) {
      toast(letter.toLowerCase() === 'e' && letterIndex === word.w.length - 1
        ? '字母 e 在这里不发音哦'
        : '字母 ' + letter + ' 和旁边的字母一起发音哦');
      return false;
    }
    const ctx = Object.assign(chunkContext(word, ci), {
      stage: 'letter',
      letter: letter,
      letterIndex: letterIndex
    });
    const plan = toks.map(function (tok, i) {
      return {
        tok: tok,
        ctx: Object.assign({}, ctx, {
          tokenIndex: i,
          tokenCount: toks.length,
          isFirstToken: i === 0,
          isLastToken: i === toks.length - 1,
          prevTok: i ? toks[i - 1] : null,
          nextTok: i + 1 < toks.length ? toks[i + 1] : null
        })
      };
    });
    const label = c[0].length > 1
      ? '字母 ' + letter + ' 在 ' + c[0] + ' 中的发音'
      : '字母 ' + letter + ' 的发音';
    return playPhonemeClips(plan, { label: label, gap: 45 });
  }

  function stageAssemble(word) {
    if (assembleKey !== currentKey()) initAssemble();
    const total = assemblePieces.length;
    const slots = [];
    for (let i = 0; i < total; i++) {
      const p = assembleSlots[i];
      const vowel = p && /[aeiou]/i.test(p.ch);
      slots.push('<button class="letter-slot' + (p ? ' filled' : '') + (vowel ? ' vowel' : '') + (assembleSolved ? ' correct' : '') + '" data-assemble-slot="' + i + '">' + (p ? esc(p.ch) : '') + '</button>');
    }
    const placed = {};
    assembleSlots.forEach(function (p) { placed[p.id] = 1; });
    const bank = assembleSolved ? '' : '<div class="letter-bank">' +
      assembleBank.filter(function (p) { return !placed[p.id]; }).map(function (p) {
        return '<button class="letter-piece' + (/[aeiou]/i.test(p.ch) ? ' vowel' : '') + '" data-assemble-piece="' + p.id + '">' + esc(p.ch) + '</button>';
      }).join('') + '</div>';

    const success = assembleSolved
      ? '<div class="success-panel">' +
        '<div class="word-again">' + esc(word.w) + '</div>' +
        '<div class="sp-title">🧩 拼好啦！</div>' +
        '<div class="sp-sub">打乱的字母已经按顺序组合成单词<br>下一步写一写，记得更牢</div>' +
        '<button class="btn-primary" id="assembleNext">去写一写 →</button>' +
        '</div>'
      : '';

    return '<div class="assemble-stage">' +
      '<div class="assemble-head">' +
        (word.img ? '<span class="assemble-emoji"><img src="' + esc(word.img) + '" alt=""></span>' : '<span class="assemble-emoji">' + word.emoji + '</span>') +
        '<div><div class="meaning" style="margin:0;text-align:left">' + esc(word.cn) + '</div></div>' +
      '</div>' +
      '<div style="margin-top:10px">' + ipaHTML(word) + '</div>' +
      '<div class="assemble-title">把打乱的字母按顺序拼回来<small>已自动拆成单个字母并随机打乱</small></div>' +
      '<div class="letter-slots' + (assembleError ? ' shake' : '') + '" id="assembleSlots">' + slots.join('') + '</div>' +
      bank +
      success +
      (assembleSolved ? '' : '<div class="assemble-tip">点击字母放入上方空格，会读它在单词里的发音；点已放入的字母可以取回</div>' +
        '<button class="btn-ghost assemble-shuffle" id="assembleShuffle">🔀 重新打乱</button>') +
      '<button class="stage-jump" id="jumpWrite">去写一写 ›</button>' +
      '</div>';
  }

  function tapAssemblePiece(id) {
    if (assembleSolved) return;
    const word = currentWordObj();
    const idx = assembleBank.findIndex(function (p) { return p.id === id; });
    if (idx < 0) return;
    const piece = assembleBank[idx];
    assembleBank.splice(idx, 1);
    assembleSlots.push(piece);
    // Let the letter's phoneme be the feedback.  A 60 ms 660 Hz "ding"
    // played on top of a 40-60 ms /p/ or /t/ burst masks the consonant and
    // made short stops seem silent on a phone speaker.
    playLetterSound(word, piece.id);
    if (assembleSlots.length === assemblePieces.length) {
      const joined = assembleSlots.map(function (p) { return p.ch; }).join('').toLowerCase();
      if (joined === word.w.toLowerCase()) {
        assembleSolved = true;
        assembleError = false;
        markStepDone(2);
        save();
        celebrate(20);
        speak(word.audio || word.w);
        updateStepper();
        renderStage();
        return;
      }
      assembleError = true;
      beep('bad');
      toast('顺序不对，再试一次～');
      renderStage();
      clearTimeout(assembleTimer);
      assembleTimer = setTimeout(function () {
        assembleSlots = [];
        assembleBank = assemblePieces.slice();
        for (let t = 0; t < 8; t++) {
          assembleBank = shuffle(assembleBank);
          if (assembleBank.map(function (p) { return p.ch; }).join('').toLowerCase() !== word.w.toLowerCase()) break;
        }
        assembleError = false;
        renderStage();
      }, 700);
      return;
    }
    renderStage();
  }

  function tapAssembleSlot(i) {
    if (assembleSolved) return;
    if (!assembleSlots[i]) return;
    const piece = assembleSlots.splice(i, 1)[0];
    assembleBank.push(piece);
    // Same as placing a tile: do not put a ding on top of the phoneme.
    playLetterSound(currentWordObj(), piece.id);
    renderStage();
  }

  /* ---------- 拆（旧版六步模型遗留，四步流程用 stageAssemble） ---------- */
  function stageSplit(word) {
    if (splitKey !== currentKey()) initSplit();
    const parts = splitPieces.map(function (p) { return p.t; });

    if (!splitStarted) {
      return '<div class="split-stage">' +
        '<div class="split-intro">' +
        (word.img ? '<div class="split-illus has-img"><img src="' + esc(word.img) + '" alt="' + esc(word.w) + '"></div>' : '<div class="split-illus">' + word.emoji + '</div>') +
        '<div class="meaning">' + esc(word.cn) + '</div>' +
        tilesHTML(word) +
        '<div style="margin-top:12px">' + ipaHTML(word) + '</div>' +
        '<button class="btn-primary split-btn" id="splitBtn">🔨 拆一拆</button>' +
        '<div class="split-note">把单词拆成音块，再按顺序组合回去</div>' +
        '</div>' +
        chunkMapHTML(word) +
        '<div class="phonics-tip">点音块可以单独听这个字母组合的发音</div>' +
        '</div>';
    }

    const slots = [];
    for (let i = 0; i < splitPieces.length; i++) {
      const p = splitPlaced[i];
      slots.push('<button class="split-slot' + (p ? ' filled' : '') + '" data-split-slot="' + i + '">' +
        (p ? simpleLetters(p.t) : '<span class="slot-dot">?</span>') + '</button>');
    }
    const placedIds = {};
    splitPlaced.forEach(function (p) { placedIds[p.id] = 1; });
    const bank = splitSolved ? '' : '<div class="split-bank">' +
      splitPieces.filter(function (p) { return !placedIds[p.id]; }).map(function (p) {
        return '<button class="split-piece" data-split-piece="' + p.id + '">' + simpleLetters(p.t) + '</button>';
      }).join('') + '</div>';

    const success = splitSolved
      ? '<div class="success-panel">' +
      '<div class="word-again">' + esc(word.w) + '</div>' +
      '<div class="sp-title">🧩 拆合成功！</div>' +
      '<div class="sp-sub">' + parts.map(function (p) { return esc(p); }).join(' + ') + ' = ' + esc(word.w) + '<br>下一步：打乱音块，自己拼一拼</div>' +
      '<button class="btn-primary" id="splitNext">去拼一拼 →</button>' +
      '</div>'
      : '';

    return '<div class="split-stage">' +
      '<div class="split-work">' +
      '<div class="split-work-head"><span class="split-emoji">' + word.emoji + '</span><span class="meaning" style="margin:0;text-align:left">' + esc(word.cn) + '</span></div>' +
      '<div class="split-slots" id="splitSlots">' + slots.join('') + '</div>' +
      bank +
      '<div class="split-note" style="margin-top:8px">' +
      (splitSolved ? '音块按顺序组合，就是这个单词啦！' : '按顺序点击音块，把它放回上面对应的位置') +
      '</div>' +
      (splitSolved ? '' : '<button class="btn-ghost split-reset" id="splitReset">↺ 重新拆一次</button>') +
      success +
      '</div>' +
      chunkMapHTML(word) +
      '<div class="phonics-tip">点音块可以单独听这个字母组合的发音</div>' +
      '</div>';
  }

  function initSplit() {
    const word = currentWordObj();
    const parts = word.parts && word.parts.length > 1 ? word.parts : word.chunks.map(function (c) { return c[0]; });
    splitPieces = parts.map(function (t, i) { return { t: t, id: i }; });
    splitPlaced = [];
    splitStarted = false;
    splitSolved = false;
    splitKey = currentKey();
  }

  function partPhonemeIPA(word, partIndex) {
    const parts = word.parts && word.parts.length > 1 ? word.parts : word.chunks.map(function (c) { return c[0]; });
    const startLetter = parts.slice(0, partIndex).join('').length;
    const endLetter = startLetter + (parts[partIndex] || '').length;
    let pos = 0;
    const phonemes = [];
    word.chunks.forEach(function (c) {
      const cs = pos;
      const ce = pos + c[0].length;
      if (ce > startLetter && cs < endLetter) {
        if (c[1]) phonemes.push(c[1]);
      }
      pos = ce;
    });
    return phonemes.join('');
  }

  function tapSplitPiece(id) {
    if (!splitStarted || splitSolved) return;
    const piece = splitPieces.find(function (p) { return p.id === id; });
    const expected = splitPieces[splitPlaced.length];
    if (!piece || !expected) return;
    if (piece.t.toLowerCase() !== expected.t.toLowerCase()) {
      beep('bad');
      toast('先放前面的音块：' + expected.t);
      const el = $('.split-piece[data-split-piece="' + id + '"]');
      if (el) {
        el.classList.add('shake');
        setTimeout(function () { el.classList.remove('shake'); }, 450);
      }
      return;
    }
    const index = splitPieces.indexOf(expected);
    splitPlaced.push(expected);
    const ipa = partPhonemeIPA(currentWordObj(), index);
    if (ipa) speakChunkPhoneme(ipa);
    beep('ding');
    if (splitPlaced.length === splitPieces.length) {
      splitSolved = true;
      // 四步模型中“拆拼”是第 2 步。
      markStepDone(2);
      save();
      celebrate(18);
      speak(currentWordObj().audio || currentWordObj().w);
      updateStepper();
    }
    renderStage();
  }

  /* ---------- 拼（旧版六步模型遗留，四步流程用 stageAssemble） ---------- */
  function initSpell() {
    const word = currentWordObj();
    const pieces = word.parts && word.parts.length > 1 ? word.parts : word.chunks.map(function (c) { return c[0]; });
    spellBank = shuffle(pieces.map(function (t, i) { return { t: t, id: i }; }));
    spellSlots = [];
    spellSolved = false;
  }

  function stageSpell(word) {
    if (!spellBank.length && !spellSolved && !spellSlots.length) initSpell();
    const total = word.parts && word.parts.length > 1 ? word.parts.length : word.chunks.length;
    const usedIds = {};
    spellSlots.forEach(function (p) { usedIds[p.id] = 1; });

    const slots = [];
    for (let i = 0; i < total; i++) {
      const p = spellSlots[i];
      slots.push('<button class="slot' + (p ? ' filled' : '') + (spellSolved ? ' correct' : '') + '" data-slot="' + i + '">' + (p ? simpleLetters(p.t) : '') + '</button>');
    }

    const bank = spellSolved ? '' : '<div class="spell-bank">' + spellBank.filter(function (p) { return !usedIds[p.id]; }).map(function (p) {
      return '<button class="piece" data-piece="' + p.id + '">' + simpleLetters(p.t) + '</button>';
    }).join('') + '</div>';

    const solvedHTML = spellSolved
      ? '<div class="success-panel">' +
      '<div class="word-again">' + esc(word.w) + '</div>' +
      '<div class="sp-title">🎉 拼对啦！</div>' +
      '<div class="sp-sub">' + esc(word.cn) + '<br>下一步写一写，记忆更牢固</div>' +
      '<button class="btn-primary" id="spellNext">去写一写 →</button>' +
      '</div>'
      : '';

    return '<div class="spell-stage">' +
      '<div class="quiz-eyebrow">拼一拼 · 按正确顺序点击音节</div>' +
      '<div class="quiz-title">把单词拼出来</div>' +
      '<div class="meaning" style="margin-top:8px">' + esc(word.cn) + '</div>' +
      (spellSolved ? '' : ipaHTML(word)) +
      '<div class="spell-slots" id="spellSlots">' + slots.join('') + '</div>' +
      bank +
      solvedHTML +
      '<div class="spell-tip">' + (spellSolved ? '点上面的单词可以再听一遍发音' : '点已填的音节，可以把它放回去') + '</div>' +
      '</div>';
  }

  function tapPiece(id) {
    if (spellSolved) return;
    const piece = spellBank.find(function (p) { return p.id === id; });
    if (!piece) return;
    if (spellSlots.some(function (p) { return p.id === id; })) return;
    spellSlots.push(piece);
    beep('ding');
    const word = currentWordObj();
    const total = word.parts && word.parts.length > 1 ? word.parts.length : word.chunks.length;
    if (spellSlots.length === total) {
      const joined = spellSlots.map(function (p) { return p.t; }).join('').toLowerCase();
      if (joined === word.w.toLowerCase()) {
        spellSolved = true;
        // 四步模型只有 0 学 / 1 练 / 2 拆拼 / 3 写；旧的六步“拼”并入 2。
        markStepDone(2, 1);
        save();
        celebrate(18);
        beep('good');
        speak(word.audio || word.w);
        renderStage();
        updateStepper();
        return;
      } else {
        const r = getRec();
        r.wrong = (r.wrong || 0) + 1;
        save();
        beep('bad');
        const slotsEl = $('#spellSlots');
        if (slotsEl) {
          slotsEl.classList.add('shake');
          $$('.slot', slotsEl).forEach(function (s) { s.classList.add('shake'); });
        }
        toast('顺序不太对，再试一次～');
        clearTimeout(spellTimer);
        spellTimer = setTimeout(function () {
          spellSlots = [];
          renderStage();
        }, 620);
        return;
      }
    }
    renderStage();
  }

  function tapSlot(i) {
    if (spellSolved) return;
    if (spellSlots[i]) {
      spellSlots.splice(i, 1);
      beep('ding');
      renderStage();
    }
  }

  /* ---------- 写一写：手动对照答案 ---------- */
  /* 写步骤的结果面板：有内容时给容器加 has-result，横屏下与画板左右并排 */
  function setWriteResult(html) {
    const res = $('#writeResult');
    if (!res) return;
    res.innerHTML = html;
    const stage = res.closest('.write-stage');
    if (stage) stage.classList.toggle('has-result', !!html);
  }

  function showWriteConfirm(word) {
    const res = $('#writeResult');
    if (!res) return;
    setWriteResult('<div class="write-result">' +
      '<div class="check-badge">✍️ 对照标准答案</div>' +
      '<p>你写完啦，和下面的标准拼写对照一下：</p>' +
      '<div class="answer-word">' + esc(word.w) + '</div>' +
      '<p>' + esc(word.ipa) + ' · ' + esc(word.cn) + '</p>' +
      '<div class="row"><button class="btn-primary" id="selfCorrect">✅ 我写对了</button><button class="btn-ghost" id="writeRetry2">🔁 再写一次</button></div>' +
      '</div>');
    const ok = $('#selfCorrect');
    if (ok) ok.addEventListener('click', function () { writeSuccess(word); });
    const retry = $('#writeRetry2');
    if (retry) retry.addEventListener('click', clearWrite);
  }

  function stageWrite(word) {
    return '<div class="write-stage">' +
      '<div class="write-head">' +
      ipaHTML(word) +
      '<div class="meaning">' + esc(word.cn) + '</div>' +
      '</div>' +
      '<div class="write-card" id="writeCard">' +
      '<div class="write-guides"><i></i><i></i><i></i><i></i></div>' +
      '<div class="write-watermark" id="writeMark">在这里写一写 ✍️</div>' +
      '<canvas id="writeCanvas"></canvas>' +
      '<input class="write-input" id="writeInput" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="输入单词">' +
      '</div>' +
      '<div class="write-tools">' +
      '<button class="btn-ghost" id="toggleKeyboard">' + I.keyboard + ' 键盘</button>' +
      '<button class="btn-ghost" id="clearInk">' + I.trash + ' 清空</button>' +
      '<button class="btn-primary" id="submitWrite">提交</button>' +
      '</div>' +
      '<div id="writeResult"></div>' +
      '<div class="spell-tip">写完点「提交」，对照标准答案自己确认；也可以点「键盘」直接输入</div>' +
      '</div>';
  }

  /* 按当前尺寸重建手写画板位图（保留已有笔迹，拉伸映射到新尺寸） */
  function setupWriteCanvasBitmap() {
    const card = $('#writeCard');
    const canvas = $('#writeCanvas');
    if (!card || !canvas || !canvas.parentNode) return false;
    const rect = card.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width === w && canvas.height === h && writeCtx) return true;
    let snapshot = null;
    if (writeInk > 0 && canvas.width > 0 && canvas.height > 0) {
      try {
        snapshot = document.createElement('canvas');
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;
        snapshot.getContext('2d').drawImage(canvas, 0, 0);
      } catch (e) { snapshot = null; }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = '#3C79C6';
    writeCtx = ctx;
    if (snapshot) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(snapshot, 0, 0, w, h);
      ctx.restore();
    }
    return true;
  }

  function initWriteCanvas() {
    const card = $('#writeCard');
    const canvas = $('#writeCanvas');
    if (!card || !canvas) return;
    setupWriteCanvasBitmap();
    writeInk = 0;
    let drawing = false;
    let last = null;
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener('pointerdown', function (e) {
      const input = $('#writeInput');
      if (input && input.classList.contains('show')) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      drawing = true;
      last = pos(e);
      writeCtx.beginPath();
      writeCtx.moveTo(last.x, last.y);
      writeCtx.lineTo(last.x + 0.01, last.y + 0.01);
      writeCtx.stroke();
      const mark = $('#writeMark');
      if (mark) mark.classList.add('hide');
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      e.preventDefault();
      const p = pos(e);
      writeCtx.beginPath();
      writeCtx.moveTo(last.x, last.y);
      writeCtx.lineTo(p.x, p.y);
      writeCtx.stroke();
      last = p;
      writeInk++;
    });
    function endDraw() { drawing = false; last = null; }
    canvas.addEventListener('pointerup', endDraw);
    canvas.addEventListener('pointercancel', endDraw);
    canvas.addEventListener('pointerleave', function () { if (drawing) endDraw(); });
  }

  /* 横竖屏切换 / 分屏后重建手写画板位图，修正笔迹坐标错位 */
  let writeCanvasResizeTimer = null;
  function handleWriteCanvasResize() {
    clearTimeout(writeCanvasResizeTimer);
    writeCanvasResizeTimer = setTimeout(function () {
      if (currentScreen === 'learn' && currentStep === 3 && $('#writeCanvas')) {
        setupWriteCanvasBitmap();
      }
    }, 200);
  }
  window.addEventListener('resize', handleWriteCanvasResize);
  window.addEventListener('orientationchange', function () { setTimeout(handleWriteCanvasResize, 250); });

  function toggleKeyboard() {
    const input = $('#writeInput');
    const mark = $('#writeMark');
    const canvas = $('#writeCanvas');
    if (!input) return;
    const show = !input.classList.contains('show');
    input.classList.toggle('show', show);
    if (canvas) canvas.style.opacity = show ? '0' : '1';
    if (mark) mark.classList.toggle('hide', show || writeInk > 0);
    const btn = $('#toggleKeyboard');
    if (btn) btn.innerHTML = show ? '✍️ 手写' : I.keyboard + ' 键盘';
    if (show) setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);
  }

  function clearWrite() {
    const canvas = $('#writeCanvas');
    if (canvas && writeCtx) writeCtx.clearRect(0, 0, canvas.width, canvas.height);
    writeInk = 0;
    const mark = $('#writeMark');
    if (mark) mark.classList.remove('hide');
    const input = $('#writeInput');
    if (input) input.value = '';
    setWriteResult('');
  }

  function submitWrite() {
    const word = currentWordObj();
    const input = $('#writeInput');
    const keyboardOn = input && input.classList.contains('show');
    if (keyboardOn) {
      const val = (input.value || '').trim();
      if (!val) { toast('先输入单词吧'); return; }
      if (val.toLowerCase() === word.w.toLowerCase()) {
        writeSuccess(word);
      } else {
        beep('bad');
        const r = getRec();
        r.wrong = (r.wrong || 0) + 1;
        save();
        const res = $('#writeResult');
        if (res) {
          setWriteResult('<div class="write-result">' +
            '<p>你写的是 <b>' + esc(val) + '</b>，还差一点点</p>' +
            '<div class="answer-word">' + esc(word.w) + '</div>' +
            '<p>正确拼写对照一下，再试一次吧</p>' +
            '<div class="row"><button class="btn-primary" id="writeRetry">再写一次</button></div>' +
            '</div>');
          const b = $('#writeRetry');
          if (b) b.addEventListener('click', function () { input.value = ''; setWriteResult(''); input.focus(); });
        }
      }
      return;
    }
    showWriteConfirm(word);
  }

  function writeSuccess(word, opts) {
    const newly = completeWord();
    markStepDone(3, 2);
    const r = getRec();
    r.done = true;
    save();
    celebrate(30);
    beep('good');
    updateStepper();
    const res = $('#writeResult');
    if (res) {
      setWriteResult('<div class="success-panel">' +
        '<div class="word-again">' + esc(word.w) + '</div>' +
        '<div class="sp-title">' + '🎉 写对啦！' + '</div>' +
        '<div class="sp-sub">' + esc(word.cn) + ' · 已完成四步学习' + (newly ? '<br>+8 星星，继续加油！' : '') + '</div>' +
        '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
        '<button class="btn-primary" id="successNext">下一个单词 →</button>' +
        '<button class="btn-ghost" id="successAgain" style="height:44px;padding:0 16px;font-size:13.5px">再写一次</button>' +
        '</div>' +
        '</div>');
      const next = $('#successNext');
      if (next) next.addEventListener('click', function () { moveWord(1); });
      const again = $('#successAgain');
      if (again) again.addEventListener('click', clearWrite);
    }
    const input = $('#writeInput');
    if (input) { input.value = ''; input.classList.remove('show'); }
    const canvas = $('#writeCanvas');
    if (canvas) canvas.style.opacity = '1';
    toast(newly ? '🎉 又掌握了一个单词！' : '写对啦，真棒！');
  }

  /* ---------- 事件绑定 ---------- */
  function bindStage(word) {
    if (currentStep === 0) {
      const split = $('#toolSplit');
      if (split) split.addEventListener('click', function () { setStep(2); });
      const jumpQuiz = $('#jumpQuiz');
      if (jumpQuiz) jumpQuiz.addEventListener('click', function () { setStep(1); });
      const link = $('#toolLink');
      if (link) link.addEventListener('click', function () { pronounceWord(word, true); toast('跟着拼读，慢一点更清楚'); });
      const fav = $('#toolFav');
      if (fav) fav.addEventListener('click', function () { toggleFav(); });
    }

    if (currentStep === 1) {
      const qp = $('#quizPlay');
      if (qp) qp.addEventListener('click', function () { speak(word.audio || word.w); });
      const next = $('#quizNext');
      if (next) next.addEventListener('click', function () { setStep(2); });
      const again = $('#quizAgain');
      if (again) again.addEventListener('click', function () {
        quiz = buildQuiz(word);
        quizAnswered = false;
        quizCorrect = false;
        renderStage();
      });
      const retry = $('#quizRetry');
      if (retry) retry.addEventListener('click', function () {
        quiz = buildQuiz(word);
        quizAnswered = false;
        quizCorrect = false;
        renderStage();
      });
      const goSplit = $('#quizGoSplit');
      if (goSplit) goSplit.addEventListener('click', function () { setStep(2); });
      const jumpSplit = $('#jumpSplit');
      if (jumpSplit) jumpSplit.addEventListener('click', function () { setStep(2); });
    }

    if (currentStep === 2) {
      const next = $('#assembleNext');
      if (next) next.addEventListener('click', function () { setStep(3); });
      const jumpWrite = $('#jumpWrite');
      if (jumpWrite) jumpWrite.addEventListener('click', function () { setStep(3); });
      const sh = $('#assembleShuffle');
      if (sh) sh.addEventListener('click', function () {
        assembleSlots = [];
        assembleBank = shuffle(assemblePieces.slice());
        assembleSolved = false;
        assembleError = false;
        renderStage();
      });
    }

    if (currentStep === 3) {
      const kb = $('#toggleKeyboard');
      if (kb) kb.addEventListener('click', toggleKeyboard);
      const clr = $('#clearInk');
      if (clr) clr.addEventListener('click', clearWrite);
      const submit = $('#submitWrite');
      if (submit) submit.addEventListener('click', submitWrite);
      const input = $('#writeInput');
      if (input) {
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitWrite(); });
      }
    }
  }

  function toggleFav() {
    const r = getRec();
    r.fav = !r.fav;
    save();
    const favBtn = $('#learnFav');
    favBtn.innerHTML = r.fav ? I.starFill : I.star;
    favBtn.style.color = r.fav ? '#FFE08A' : '#fff';
    const tool = $('#toolFav');
    if (tool) {
      tool.classList.toggle('on', r.fav);
      tool.innerHTML = '<span>' + (r.fav ? '⭐' : '☆') + '</span>收藏';
    }
    toast(r.fav ? '⭐ 已收藏这个单词' : '已取消收藏');
    beep('ding');
  }

  /* ---------------- 弹窗 ---------------- */
  function showModal(html) {
    const mask = $('#modalMask');
    $('#modalCard').innerHTML = html;
    mask.classList.add('show');
  }
  function hideModal() { $('#modalMask').classList.remove('show'); }

  /* ---------------- 初始化 ---------------- */
  function init() {
    ['#learnBack', '#reviewBack', '#meBack', '#consolBack', '#drillBack'].forEach(function (sel) {
      const btn = $(sel);
      if (btn && !btn.innerHTML.trim()) btn.innerHTML = I.back;
    });
    // 首页
    $('#homeMeBtn').addEventListener('click', function () { navigate('me'); });
    $('#continueBtn').addEventListener('click', function () {
      if (state.filterGrade !== 'all') {
        const units = unitsOfGrade(state.filterGrade).filter(function (u) {
          return state.filterTerm === '全部' || (u.term || '全册') === state.filterTerm;
        });
        if (units.length) {
          const ui = UNITS.indexOf(units[0]);
          openLearn(ui, firstUnfinished(units[0]), 0);
          return;
        }
      }
      const ui = state.last.unit || 0;
      const unit = UNITS[ui];
      openLearn(ui, firstUnfinished(unit), 0);
    });
    $('#unitList').addEventListener('click', function (e) {
      const card = e.target.closest('[data-unit]');
      if (!card) return;
      const ui = Number(card.dataset.unit);
      openLearn(ui, firstUnfinished(UNITS[ui]), 0);
    });
    $('.quick-grid').addEventListener('click', function (e) {
      const tile = e.target.closest('.quick-tile');
      if (!tile) return;
      const go = tile.dataset.go;
      if (go === 'review') {
        reviewTab = tile.dataset.tab || 'wrong';
        navigate('review');
      } else if (go === 'learn') {
        openLearn(state.last.unit || 0, state.last.word || 0, 1);
      } else if (go === 'consolidate') {
        navigate('consolidate');
      } else if (go === 'me') {
        navigate('me');
      }
    });

    // 底部导航
    $('#tabbar').addEventListener('click', function (e) {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      navigate(tab.dataset.screen);
    });

    // 学习页
    $('#learnBack').addEventListener('click', function () { goBack('home'); });
    $('#learnFav').addEventListener('click', toggleFav);
    $('#prevWord').addEventListener('click', function () { moveWord(-1); });
    $('#nextWord').addEventListener('click', function () { moveWord(1); });
    $('#wordStrip').addEventListener('click', function (e) {
      const chip = e.target.closest('.word-chip');
      if (chip) selectWord(Number(chip.dataset.wi));
    });
    $('#stepper').addEventListener('click', function (e) {
      const step = e.target.closest('.step');
      if (step) setStep(Number(step.dataset.step));
    });

    // 学习舞台内的通用点击
    $('#stage').addEventListener('click', function (e) {
      const word = currentWordObj();
      if (e.target.closest('[data-speak-phonemes]')) {
        stopSpeaking();
        playPhonemeClips(wordPhonemePlan(word), { label: '单词音素', gap: 70 });
        return;
      }
      if (e.target.closest('[data-speak-word]')) { pronounceWord(word); return; }
      if (e.target.closest('[data-speak-sentence]')) { speak(word.sentence); return; }
      const tile = e.target.closest('.tile[data-chunk]');
      if (tile) {
        focusChunk(Number(tile.dataset.chunk));
        return;
      }
      const chunk = e.target.closest('.chunk[data-chunk]');
      if (chunk) {
        focusChunk(Number(chunk.dataset.chunk));
        return;
      }
      const opt = e.target.closest('.option[data-opt]');
      if (opt) { answerQuiz(opt); return; }
      const piece = e.target.closest('[data-piece]');
      if (piece) { tapPiece(Number(piece.dataset.piece)); return; }
      const ap = e.target.closest('[data-assemble-piece]');
      if (ap) { tapAssemblePiece(Number(ap.dataset.assemblePiece)); return; }
      const as = e.target.closest('[data-assemble-slot]');
      if (as) { tapAssembleSlot(Number(as.dataset.assembleSlot)); return; }
      const slot = e.target.closest('[data-slot]');
      if (slot) { tapSlot(Number(slot.dataset.slot)); return; }
      const splitPiece = e.target.closest('[data-split-piece]');
      if (splitPiece) { tapSplitPiece(Number(splitPiece.dataset.splitPiece)); return; }
      const part = e.target.closest('[data-part]');
      if (part) {
        speak(word.audio || word.w, { rate: Math.max(0.55, state.settings.rate - 0.18) });
        part.classList.add('hit');
        setTimeout(function () { part.classList.remove('hit'); }, 500);
      }
    });

    // 复习
    $('#reviewBack').addEventListener('click', function () { goBack('home'); });
    $('#reviewTabs').addEventListener('click', function (e) {
      const b = e.target.closest('.seg');
      if (!b) return;
      reviewTab = b.dataset.tab;
      renderReview();
    });
    $('#reviewList').addEventListener('click', function (e) {
      const play = e.target.closest('[data-play]');
      if (play) {
        e.stopPropagation();
        const parts = play.dataset.play.split('-').map(Number);
        var wobj = UNITS[parts[0]].words[parts[1]]; speak(wobj.audio || wobj.w);
        return;
      }
      const item = e.target.closest('[data-open]');
      if (item) {
        const parts = item.dataset.open.split('-').map(Number);
        openLearn(parts[0], parts[1], Number(item.dataset.step) || 0);
      }
    });

    // 巩固知识库
    $('#consolBack').addEventListener('click', function () { showScreen('home'); });
    $('#consolGrid').addEventListener('click', function (e) {
      const play = e.target.closest('[data-kbplay]');
      if (play) {
        e.stopPropagation();
        const x = WORD_INDEX[play.dataset.kbplay];
        if (x) speak(x.word.audio || x.word.w);
        return;
      }
      const card = e.target.closest('[data-key]');
      if (card) toggleConsol(card.dataset.key);
    });
    $('#selectAllBtn').addEventListener('click', function () {
      const items = wordsOfGrade(state.consolGrade);
      const allSel = items.length > 0 && items.every(function (it) { return consolSelected[it.key]; });
      if (allSel) {
        items.forEach(function (it) { delete consolSelected[it.key]; });
        toast('已取消本年级的全选');
      } else {
        items.forEach(function (it) { consolSelected[it.key] = 1; });
        toast('已选中 ' + items.length + ' 个单词');
      }
      renderConsolGrid();
      updateSelCount();
    });
    $('#selectWrongBtn').addEventListener('click', function () {
      const items = wordsOfGrade(state.consolGrade).filter(function (it) {
        const r = state.progress[it.key];
        return r && r.wrong > 0;
      });
      if (!items.length) { toast('这个范围里还没有错词，真棒！'); return; }
      setConsolSelection(items.map(function (it) { return it.key; }));
      toast('已选中 ' + items.length + ' 个错词');
    });
    $('#selectFavBtn').addEventListener('click', function () {
      const items = wordsOfGrade(state.consolGrade).filter(function (it) {
        const r = state.progress[it.key];
        return r && r.fav;
      });
      if (!items.length) { toast('这个范围里还没有收藏的单词'); return; }
      setConsolSelection(items.map(function (it) { return it.key; }));
      toast('已选中 ' + items.length + ' 个收藏单词');
    });
    $('#clearSelBtn').addEventListener('click', function () {
      consolSelected = {};
      renderConsolGrid();
      updateSelCount();
      toast('已清空选择');
    });
    $('#startDrill').addEventListener('click', function () {
      const keys = Object.keys(consolSelected);
      if (!keys.length) { toast('先选几个单词吧～'); return; }
      startDrill(keys);
    });
    $('#randomDrill').addEventListener('click', function () {
      const pool = wordsOfGrade(state.consolGrade).map(function (it) { return it.key; });
      if (!pool.length) return;
      startDrill(shuffle(pool).slice(0, Math.min(10, pool.length)));
      toast('随机抽取 ' + Math.min(10, pool.length) + ' 个单词');
    });

    // 巩固训练
    $('#drillBack').addEventListener('click', function () { showScreen('consolidate'); });
    $('#drillCard').addEventListener('click', function (e) {
      if (!drill) return;
      const item = drill.queue[drill.index];
      if (!item) return;
      if (e.target.closest('[data-speak-phonemes]')) {
        stopSpeaking();
        playPhonemeClips(wordPhonemePlan(item.word), { label: '单词音素', gap: 70 });
        return;
      }
      if (e.target.closest('[data-speak-word]') || e.target.closest('[data-drill-say]')) {
        speak(item.word.audio || item.word.w);
        return;
      }
      if (e.target.closest('[data-speak-sentence]')) {
        speak(item.word.sentence);
        return;
      }
      const chunk = e.target.closest('.chunk[data-chunk]');
      if (chunk) {
        const ci = Number(chunk.dataset.chunk);
        const c = item.word.chunks[ci];
        if (c) {
          speakChunkPhoneme(c[1], chunkContext(item.word, ci));
          chunk.classList.add('speaking');
          setTimeout(function () { chunk.classList.remove('speaking'); }, 650);
        }
      }
    });

    // 我的
    $('#meBack').addEventListener('click', function () { goBack('home'); });
    $('#accentSeg').addEventListener('click', function (e) {
      const b = e.target.closest('.seg');
      if (!b) return;
      state.settings.accent = b.dataset.accent;
      save();
      updateSettingsUI();
      speak('Hello! Let us learn English.');
      toast(state.settings.accent === 'uk' ? '已切换为英音 🇬🇧' : '已切换为美音 🇺🇸');
    });
    $('#rateRange').addEventListener('input', function (e) {
      state.settings.rate = Number(e.target.value);
      save();
      const pct = (state.settings.rate - 0.6) / 0.6 * 100;
      e.target.style.background = 'linear-gradient(90deg, var(--orange) ' + pct + '%, #F1E4D7 ' + pct + '%)';
      $('#rateLabel').textContent = state.settings.rate.toFixed(1) + 'x';
    });
    $('#rateRange').addEventListener('change', function () {
      speak(currentWordObj().audio || currentWordObj().w);
    });
    $('#autoPlaySwitch').addEventListener('click', function () {
      state.settings.autoPlay = !state.settings.autoPlay;
      save();
      updateSettingsUI();
      toast(state.settings.autoPlay ? '已打开自动朗读' : '已关闭自动朗读');
    });
    $('#goalPicks').addEventListener('click', function (e) {
      const b = e.target.closest('button');
      if (!b) return;
      state.settings.goal = Number(b.dataset.goal);
      save();
      updateSettingsUI();
      toast('每日目标设为 ' + state.settings.goal + ' 个单词');
    });
    $('#resetBtn').addEventListener('click', function () {
      showModal('<div class="m-emoji">🧹</div><h3>重置学习进度？</h3><p>星星、收藏、错词和已掌握记录都会清空，设置将保留。</p><div class="m-actions"><button class="btn-ghost" id="mCancel">取消</button><button class="btn-primary" id="mOk">确认重置</button></div>');
      $('#mCancel').addEventListener('click', hideModal);
      $('#mOk').addEventListener('click', function () {
        state.progress = {};
        state.stars = 0;
        state.streak = 0;
        state.lastStudy = '';
        state.today = { date: todayStr(), count: 0 };
        state.last = { unit: 0, word: 0 };
        consolSelected = {};
        drill = null;
        currentUnit = 0;
        currentWord = 0;
        save();
        hideModal();
        renderMe();
        toast('学习进度已重置');
      });
    });
    $('#modalMask').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) hideModal();
    });

    // 每次回到前台刷新首页数据
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (readState === 'listening' || readState === 'recording') {
          readState = 'idle';
          readScore = 0;
          readHeard = '';
          if (currentScreen === 'learn' && currentStep === 1) renderStage();
        }
      } else if (currentScreen === 'home') {
        renderHome();
      }
    });

    // 首屏
    showScreen('home');

    // 调试直达：index.html?screen=learn&unit=0&word=6&step=0
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('screen') === 'learn') {
        openLearn(Number(q.get('unit') || 0), Number(q.get('word') || 0), Number(q.get('step') || 0));
      } else if (q.get('screen') === 'review') {
        navigate('review');
      } else if (q.get('screen') === 'me') {
        navigate('me');
      } else if (q.get('screen') === 'consolidate') {
        navigate('consolidate');
      } else if (q.get('screen') === 'drill') {
        startDrill(shuffle(ALL_WORDS.slice(0, 5).map(function (it) { return it.key; })));
        if (q.get('reveal') === '1' && drill) { drill.revealed = true; renderDrill(); }
      }
    } catch (e) { /* ignore */ }
    if (currentScreen === 'home') renderHome();

    // 预置演示：首次打开给出欢迎提示
    try {
      if (!localStorage.getItem('eng_genius_hello')) {
        localStorage.setItem('eng_genius_hello', '1');
        setTimeout(function () { toast('👋 欢迎！点开 Unit 1 开始学单词吧'); }, 700);
      }
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', init);
})();
