// POP LOCK RUSH! - 24 Ultimate Refined Gimmicks (Cross-Platform Polished)
document.addEventListener('DOMContentLoaded', () => {
  // スマホの長押しコンテキストメニューを完全抑止
  document.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });

  // DOM Elements
  const timeDisplay = document.getElementById('time-display');
  const timeAddedAnim = document.getElementById('time-added-anim');
  const scoreDisplay = document.getElementById('score-display');
  const unlockedCount = document.getElementById('unlocked-count');
  const soundBtn = document.getElementById('sound-btn');
  const currentCard = document.getElementById('current-lock-card');
  const nextCard = document.getElementById('next-lock-card');
  const lockLevelBadge = document.getElementById('lock-level-badge');
  const lockDiff = document.getElementById('lock-difficulty');
  const currentShackle = document.getElementById('current-shackle');
  const gimmickContainer = document.getElementById('gimmick-container');

  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');
  const resultOverlay = document.getElementById('result-overlay');
  const retryBtn = document.getElementById('retry-btn');
  const finalScoreEl = document.getElementById('final-score');
  const finalLocksEl = document.getElementById('final-locks');
  const highScoreEl = document.getElementById('high-score');
  const rankBadgeEl = document.getElementById('result-rank-badge');

  // Enhanced Canvas Particles (Confetti & Sparks)
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let particles = [];
  function createBurst(x, y, count = 38) {
    const colors = ['#ff4757', '#2ed573', '#ffa502', '#1e90ff', '#ffffff', '#ffd32a', '#9b59b6'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 4;
      const isConfetti = Math.random() > 0.45;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        w: Math.random() * 8 + 5,
        h: isConfetti ? (Math.random() * 5 + 4) : (Math.random() * 8 + 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.024 + 0.016,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.22,
        isConfetti
      });
    }
  }

  function updateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.16; // 重力
      p.vx *= 0.98; // 空気抵抗
      p.rot += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.isConfetti) {
        // ヒラヒラ舞う紙吹雪
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        // キラキラ丸スパーク
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    requestAnimationFrame(updateParticles);
  }
  updateParticles();

  // Rank S 達成時の紙吹雪シャワー
  let confettiRainInterval = null;
  function startConfettiRain(durationMs = 4500) {
    if (confettiRainInterval) clearInterval(confettiRainInterval);
    const colors = ['#ff4757', '#2ed573', '#ffa502', '#1e90ff', '#ffd32a', '#9b59b6', '#ff007f', '#00d2d3'];
    const startTime = Date.now();

    confettiRainInterval = setInterval(() => {
      if (Date.now() - startTime > durationMs) {
        clearInterval(confettiRainInterval);
        confettiRainInterval = null;
        return;
      }
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * canvas.width;
        const y = -12;
        const angle = (Math.PI / 2) + (Math.random() - 0.5) * 0.8;
        const speed = Math.random() * 4.5 + 3.2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: Math.random() * 9 + 6,
          h: Math.random() * 6 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.007 + 0.004,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.22,
          isConfetti: true
        });
      }
    }, 65);
  }

  // Web Audio Synth (多層サウンド ＆ コンボピッチ上昇)
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playSound(type, combo = 1) {
    if (!soundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;

      if (type === 'tap') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const freqShift = (Math.random() - 0.5) * 40;
        osc.frequency.setValueAtTime(620 + freqShift, now);
        osc.frequency.exponentialRampToValueAtTime(920 + freqShift, now + 0.05);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);

      } else if (type === 'unlock') {
        // コンボに応じたピッチ上昇 (半音ずつ上がる)
        const pitchMultiplier = Math.pow(1.05946, Math.min(8, combo - 1));

        // 1. メタリック・クリック音 (金属の重み)
        const clickOsc = audioCtx.createOscillator();
        const clickGain = audioCtx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(320 * pitchMultiplier, now);
        clickOsc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
        clickGain.gain.setValueAtTime(0.25, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        clickOsc.connect(clickGain);
        clickGain.connect(audioCtx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.04);

        // 2. 華やかなベル上昇和音
        const notes = [523.25, 659.25, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq * pitchMultiplier, now + idx * 0.04);
          gain.gain.setValueAtTime(0.2, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.04 + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.3);
        });

      } else if (type === 'mistake') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);

      } else if (type === 'warning') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);

      } else if (type === 'whistle_finish') {
        // ピッピー！ホイッスルのダブルトーン (短音 + 長音)
        // 1. ピッ (短音)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(860, now);
        osc1.frequency.linearRampToValueAtTime(940, now + 0.08);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.09);

        // 2. ピー！ (長音)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now + 0.13);
        osc2.frequency.linearRampToValueAtTime(960, now + 0.45);
        gain2.gain.setValueAtTime(0.35, now + 0.13);
        gain2.gain.setValueAtTime(0.32, now + 0.4);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.13);
        osc2.stop(now + 0.55);
      }
    } catch (e) {}
  }

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.innerHTML = soundEnabled ? SOUND_ON_SVG : SOUND_OFF_SVG;
  });

  // ==========================================
  // 環境非依存・高品質ベクター＆DOM生成ヘルパー
  // ==========================================

  const SOUND_ON_SVG = `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  `;
  const SOUND_OFF_SVG = `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  `;
  const CHECKER_FLAG_SVG = `
    <svg viewBox="0 0 24 24" width="28" height="28" style="display:block;">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="#2ed573" stroke="#2f3542" stroke-width="2.2"/>
      <line x1="4" y1="22" x2="4" y2="15" stroke="#2f3542" stroke-width="2.6" stroke-linecap="round"/>
    </svg>
  `;
  const MINI_CHECK_SVG = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2ed573" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align: middle;">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `;
  const CHECK_MARK_SVG = `
    <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="#2ed573" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `;
  const TARGET_ZONE_SVG = `
    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#ff4757" stroke-width="2.2" style="display:block;">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" fill="#ff4757" opacity="0.3"/><circle cx="12" cy="12" r="2.2" fill="#ff4757"/>
    </svg>
  `;
  const STAR_SVG = `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffd32a" stroke="#2f3542" stroke-width="1.8" style="display:block;">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  `;
  const HAND_STOP_SVG = `
    <svg viewBox="0 0 24 24" width="48" height="48" fill="#ff4757" stroke="#2f3542" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
      <path d="M18 11V6a2 2 0 0 0-4 0v4"/><path d="M14 10V4a2 2 0 0 0-4 0v7"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.3L2.3 14c-.4-.4-.3-1 .2-1.3.4-.3 1-.2 1.3.2L6 15"/>
    </svg>
  `;
  const BOLT_SVG = `
    <svg viewBox="0 0 24 24" width="38" height="38" fill="#ffd32a" stroke="#2f3542" stroke-width="1.8" stroke-linejoin="round" style="display:block;">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  `;

  // 1. ゴールドキーSVG (端末による絵文字の傾き・サイズ差を解消)
  const KEY_SVG = `
    <svg viewBox="0 0 36 36" width="32" height="32" style="display:block;">
      <circle cx="12" cy="12" r="7" fill="none" stroke="#2f3542" stroke-width="3" />
      <circle cx="12" cy="12" r="3.5" fill="#2f3542" />
      <path d="M 17 17 L 30 30 M 23 23 L 27 19 M 27 27 L 31 23" stroke="#2f3542" stroke-width="3.5" stroke-linecap="round" />
    </svg>
  `;

  // 2. 垂直ロケットSVG (傾きのブレがなく判定と完全一致)
  const ROCKET_SVG = `
    <svg viewBox="0 0 32 46" width="32" height="46" style="display:block; overflow:visible;">
      <path d="M 16 2 C 10 12 9 26 9 34 L 23 34 C 23 26 22 12 16 2 Z" fill="#ffffff" stroke="#2f3542" stroke-width="2.5" />
      <path d="M 16 2 C 12 8 11 13 11 16 L 21 16 C 21 13 20 8 16 2 Z" fill="#ff4757" />
      <circle cx="16" cy="23" r="3.5" fill="#1e90ff" stroke="#2f3542" stroke-width="1.5" />
      <path d="M 9 27 L 3 36 L 9 34 Z" fill="#ff4757" stroke="#2f3542" stroke-width="2" />
      <path d="M 23 27 L 29 36 L 23 34 Z" fill="#ff4757" stroke="#2f3542" stroke-width="2" />
      <path d="M 11 35 Q 16 46 21 35 Z" fill="#ffa502" />
    </svg>
  `;

  // 3. 星SVG (フォント依存によるベースラインのズレを解消)
  function getStarSvg(isFilled) {
    return `
      <svg viewBox="0 0 24 24" width="22" height="22" style="display:inline-block; vertical-align:middle;">
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" 
                 fill="${isFilled ? '#ffa502' : '#dfe4ea'}" 
                 stroke="#2f3542" stroke-width="1.8" stroke-linejoin="round" />
      </svg>
    `;
  }

  // 4. 本物のサイコロ生成 (Unicode特殊文字豆腐化を完全防止)
  function createDiceFaceElement(num) {
    const grid = document.createElement('div');
    grid.className = 'dice-face-grid';

    // 3x3 の位置マップ (row, col)
    // 0,0: 左上  0,1: 上中  0,2: 右上
    // 1,0: 左中  1,1: 中央  1,2: 右中
    // 2,0: 左下  2,1: 下中  2,2: 右下
    const pipPositions = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]]
    };

    const activePips = pipPositions[num] || [];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell = document.createElement('div');
        cell.className = 'dice-cell';
        const hasPip = activePips.some(([pr, pc]) => pr === r && pc === c);
        if (hasPip) {
          const pip = document.createElement('div');
          pip.className = 'dice-pip' + (num === 1 ? ' center-red' : '');
          cell.appendChild(pip);
        }
        grid.appendChild(cell);
      }
    }
    return grid;
  }

  // 23 精鋭ギミック定義 (Lv.11 sugoroku_dice 削除済)
  const LOCK_DEFINITIONS = [
    { level: 1,  type: 'giant_button',          stars: '★☆☆☆☆', basePoints: 100 },
    { level: 2,  type: 'switch_slide',          stars: '★☆☆☆☆', basePoints: 120 },
    { level: 3,  type: 'key_drag',              stars: '★☆☆☆☆', basePoints: 140 },
    { level: 4,  type: 'double_tap',            stars: '★★☆☆☆', basePoints: 160 },
    { level: 5,  type: 'slide_right',           stars: '★★☆☆☆', basePoints: 180 },
    { level: 6,  type: 'crank_slide',           stars: '★★☆☆☆', basePoints: 200 },
    { level: 7,  type: 'circle_loop_slide',     stars: '★★☆☆☆', basePoints: 220 },
    { level: 8,  type: 'gesture_mark',          stars: '★★★☆☆', basePoints: 240 },
    { level: 9,  type: 'match_key',             stars: '★★★☆☆', basePoints: 260 },
    { level: 10, type: 'color_mix',             stars: '★★★☆☆', basePoints: 280 },
    { level: 11, type: 'rapid_mash',            stars: '★★★★☆', basePoints: 340 },
    { level: 12, type: 'hover_thrust',          stars: '★★★★☆', basePoints: 370 },
    { level: 13, type: 'star_trace',            stars: '★★★★☆', basePoints: 400 },
    { level: 14, type: 'dial_code',             stars: '★★★★☆', basePoints: 440 },
    { level: 15, type: 'moving_btn',            stars: '★★★★☆', basePoints: 480 },
    { level: 16, type: 'morse_code',            stars: '★★★★★', basePoints: 520 },
    { level: 17, type: 'wheel_turn',            stars: '★★★★★', basePoints: 560 },
    { level: 18, type: 'wait_still',            stars: '★★★★★', basePoints: 600 },
    { level: 19, type: 'color_choice_2',        stars: '★★★★★', basePoints: 650 },
    { level: 20, type: 'irira_key_maze',        stars: '★★★★★', basePoints: 720 },
    { level: 21, type: 'hover_thrust_hard',     stars: '★★★★★', basePoints: 800 },
    { level: 22, type: 'tiny_moving_btn',       stars: '★★★★★', basePoints: 880 },
    { level: 23, type: 'super_mash',            stars: '★★★★★', basePoints: 1000 }
  ];

  // Queue System
  let lockQueue = [];
  let roundNumber = 1;

  function buildRoundQueue(round) {
    if (round === 1) {
      return LOCK_DEFINITIONS.map(def => ({
        ...def,
        round,
        points: def.basePoints
      }));
    } else {
      const shuffled = [...LOCK_DEFINITIONS].sort(() => Math.random() - 0.5);
      return shuffled.map(def => ({
        ...def,
        round,
        points: def.basePoints + (round - 1) * 120
      }));
    }
  }

  function getNextLockFromQueue() {
    if (lockQueue.length === 0) {
      roundNumber++;
      lockQueue = buildRoundQueue(roundNumber);
    }
    return lockQueue.shift();
  }

  // Game State
  let isPlaying = false;
  let remainingTime = 18.0;
  let score = 0;
  let unlockedCountNum = 0;
  let highScore = parseInt(localStorage.getItem('pop_lock_high') || '0', 10);
  let timerInterval = null;
  let currentLock = null;
  let nextLock = null;
  let warningBeepTimer = 0;
  let activeAnimationId = null;
  let activeWindowListeners = [];

  function addTrackedListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    activeWindowListeners.push({ target, type, handler, options });
  }

  function cleanActiveListeners() {
    for (const item of activeWindowListeners) {
      try {
        item.target.removeEventListener(item.type, item.handler, item.options);
      } catch (e) {}
    }
    activeWindowListeners = [];
  }

  function cleanActiveAnimations() {
    if (activeAnimationId) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
    }
  }

  function cleanupCurrentGimmick() {
    cleanActiveAnimations();
    cleanActiveListeners();
    currentShackle.style.transform = '';
    gimmickContainer.innerHTML = '';
  }

  // Render 24 Non-Verbal Gimmicks
  function renderGimmick(lock) {
    cleanupCurrentGimmick();
    lockLevelBadge.textContent = `Lv.${lock.level}`;
    lockDiff.textContent = lock.stars;
    currentShackle.classList.remove('open');

    // 1. 特大ボタン (一撃タップ)
    if (lock.type === 'giant_button') {
      const btn = document.createElement('button');
      btn.className = 'giant-action-btn';
      btn.textContent = '';
      btn.style.letterSpacing = '2px';
      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });
      gimmickContainer.appendChild(btn);

    // 2. スイッチスライド
    } else if (lock.type === 'switch_slide') {
      const track = document.createElement('div');
      track.className = 'switch-slider-track';

      const arrows = document.createElement('div');
      arrows.className = 'switch-arrows-hint';
      arrows.textContent = '▶▶';

      const knob = document.createElement('div');
      knob.className = 'switch-draggable-knob';
      knob.style.left = '4px';
      knob.textContent = '●';

      track.appendChild(arrows);
      track.appendChild(knob);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      function onStart() { isDragging = true; playSound('tap'); }
      function onMove(e) {
        if (!isDragging) return;
        const curX = (e.touches ? e.touches[0].clientX : e.clientX);
        const rect = track.getBoundingClientRect();
        const maxDist = rect.width - 56;
        let diff = curX - rect.left - 24;
        diff = Math.max(4, Math.min(maxDist, diff));
        knob.style.left = diff + 'px';
        if (diff >= maxDist - 6) {
          isDragging = false;
          track.classList.add('on');
          knob.style.color = '#2ed573';
          setTimeout(() => resolveLockSuccess(), 100);
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          knob.style.left = '4px';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: true });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 3. 鍵ドラッグ差し込み (安定ベクターキー ＆ リアル鍵穴)
    } else if (lock.type === 'key_drag') {
      const container = document.createElement('div');
      container.className = 'key-drag-container';

      const targetHole = document.createElement('div');
      targetHole.className = 'key-drop-target';
      targetHole.innerHTML = `
        <svg class="real-keyhole-svg" viewBox="0 0 40 50">
          <circle cx="20" cy="16" r="10" fill="#111" />
          <polygon points="14,18 26,18 24,44 16,44" fill="#111" />
        </svg>
      `;

      const keyItem = document.createElement('div');
      keyItem.className = 'drag-key-item';
      keyItem.innerHTML = KEY_SVG;

      container.appendChild(targetHole);
      container.appendChild(keyItem);
      gimmickContainer.appendChild(container);

      let isDragging = false;
      let startMouseY = 0;
      let startMouseX = 0;

      function onStart(e) {
        isDragging = true;
        playSound('tap');
        const point = e.touches ? e.touches[0] : e;
        startMouseX = point.clientX;
        startMouseY = point.clientY;
      }
      function onMove(e) {
        if (!isDragging) return;
        const point = e.touches ? e.touches[0] : e;
        const dy = point.clientY - startMouseY;
        const dx = point.clientX - startMouseX;
        keyItem.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;

        const keyRect = keyItem.getBoundingClientRect();
        const holeRect = targetHole.getBoundingClientRect();
        const dist = Math.hypot(
          (keyRect.left + keyRect.width / 2) - (holeRect.left + holeRect.width / 2),
          (keyRect.top + keyRect.height / 2) - (holeRect.top + holeRect.height / 2)
        );
        if (dist < 55) targetHole.classList.add('hovered');
        else targetHole.classList.remove('hovered');
      }
      function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        if (targetHole.classList.contains('hovered')) {
          keyItem.style.display = 'none';
          targetHole.innerHTML = `
            <svg class="real-keyhole-svg" viewBox="0 0 40 50">
              <circle cx="20" cy="16" r="10" fill="#2ed573" />
              <polygon points="14,18 26,18 24,44 16,44" fill="#2ed573" />
            </svg>
          `;
          resolveLockSuccess();
        } else {
          keyItem.style.transform = 'translate(0, 0)';
          targetHole.classList.remove('hovered');
          triggerMistake();
        }
      }
      keyItem.addEventListener('mousedown', onStart);
      keyItem.addEventListener('touchstart', onStart, { passive: true });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: true });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 4. ダブルタップ (ボタン外側に大きな光る点)
    } else if (lock.type === 'double_tap') {
      let currentTaps = 0;
      let lastTapTime = 0;

      const wrapper = document.createElement('div');
      wrapper.className = 'multi-tap-wrapper';

      const dotRow = document.createElement('div');
      dotRow.className = 'multi-dot-row-outer';
      const dots = [];
      for (let i = 0; i < 2; i++) {
        const d = document.createElement('div');
        d.className = 'tap-dot-large';
        dotRow.appendChild(d);
        dots.push(d);
      }

      const btn = document.createElement('button');
      btn.className = 'multi-tap-btn-clean';
      btn.textContent = '';

      wrapper.appendChild(dotRow);
      wrapper.appendChild(btn);

      btn.addEventListener('click', () => {
        const now = Date.now();
        playSound('tap');
        if (currentTaps === 0 || now - lastTapTime < 550) {
          currentTaps++;
          dots[currentTaps - 1].classList.add('active');
          if (currentTaps >= 2) setTimeout(() => resolveLockSuccess(), 80);
        } else {
          currentTaps = 1;
          dots.forEach(d => d.classList.remove('active'));
          dots[0].classList.add('active');
        }
        lastTapTime = now;
      });
      gimmickContainer.appendChild(wrapper);

    // 5. スライド右
    } else if (lock.type === 'slide_right') {
      const track = document.createElement('div');
      track.className = 'slider-horizontal';
      const arrows = document.createElement('div');
      arrows.className = 'slider-arrows-bg';
      arrows.textContent = '▶ ▶ ▶';
      const goal = document.createElement('div');
      goal.className = 'slider-goal-h right';
      goal.textContent = '';
      goal.style.fontSize = '0.9rem';
      goal.style.fontWeight = '900';
      const knob = document.createElement('div');
      knob.className = 'slider-knob-h';
      knob.style.left = '6px';
      knob.textContent = '▶';
      knob.style.fontSize = '1.3rem';
      track.appendChild(arrows);
      track.appendChild(goal);
      track.appendChild(knob);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      function onStart() { isDragging = true; playSound('tap'); }
      function onMove(e) {
        if (!isDragging) return;
        const curX = (e.touches ? e.touches[0].clientX : e.clientX);
        const rect = track.getBoundingClientRect();
        const maxDist = rect.width - 66;
        let diff = Math.max(6, Math.min(maxDist, curX - rect.left - 27));
        knob.style.left = diff + 'px';
        if (diff >= maxDist - 8) {
          isDragging = false;
          resolveLockSuccess();
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          knob.style.left = '6px';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: true });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 6. カクカクっと2回スライド (L字クランク)
    } else if (lock.type === 'crank_slide') {
      const area = document.createElement('div');
      area.className = 'crank-slider-area';

      const pathH = document.createElement('div');
      pathH.className = 'crank-slot-path';

      const pathV = document.createElement('div');
      pathV.className = 'crank-slot-path-v';

      const goal = document.createElement('div');
      goal.className = 'crank-goal';
      goal.textContent = '★';

      const knob = document.createElement('div');
      knob.className = 'crank-knob';
      knob.textContent = '▶';

      area.appendChild(pathH);
      area.appendChild(pathV);
      area.appendChild(goal);
      area.appendChild(knob);
      gimmickContainer.appendChild(area);

      let step = 0;
      let isDragging = false;

      function onStart() { isDragging = true; playSound('tap'); }
      function onMove(e) {
        if (!isDragging) return;
        const cur = e.touches ? e.touches[0] : e;
        const rect = area.getBoundingClientRect();
        const relX = cur.clientX - rect.left - 20;
        const relY = cur.clientY - rect.top - 20;

        if (step === 0) {
          let x = Math.max(14, Math.min(104, relX));
          knob.style.left = x + 'px';
          if (x >= 98) {
            step = 1;
            knob.textContent = '▼';
            playSound('tap');
          }
        } else if (step === 1) {
          let y = Math.max(14, Math.min(104, relY));
          knob.style.top = y + 'px';
          if (y >= 98) {
            isDragging = false;
            resolveLockSuccess();
          }
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          step = 0;
          knob.style.left = '14px';
          knob.style.top = '14px';
          knob.textContent = '▶';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: true });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 7. 丸くスライドさせて戻すと解除 (Circle Loop Slide)
    } else if (lock.type === 'circle_loop_slide') {
      const stage = document.createElement('div');
      stage.className = 'loop-slide-stage';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'loop-slide-track-svg');
      svg.setAttribute('viewBox', '0 0 190 190');

      const arcTrack = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arcTrack.setAttribute('d', 'M 27 95 A 68 68 0 0 1 163 95');
      arcTrack.setAttribute('fill', 'none');
      arcTrack.setAttribute('stroke', '#dfe4ea');
      arcTrack.setAttribute('stroke-width', '16');
      arcTrack.setAttribute('stroke-linecap', 'round');
      svg.appendChild(arcTrack);

      const guideArrows = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      guideArrows.setAttribute('d', 'M 27 95 A 68 68 0 0 1 163 95');
      guideArrows.setAttribute('fill', 'none');
      guideArrows.setAttribute('stroke', '#1e90ff');
      guideArrows.setAttribute('stroke-width', '3');
      guideArrows.setAttribute('stroke-dasharray', '8 6');
      guideArrows.setAttribute('stroke-linecap', 'round');
      svg.appendChild(guideArrows);

      stage.appendChild(svg);

      const turnIndicator = document.createElement('div');
      turnIndicator.className = 'loop-turn-indicator';
      turnIndicator.textContent = '↷';
      stage.appendChild(turnIndicator);

      const knob = document.createElement('div');
      knob.className = 'loop-knob';
      knob.textContent = '●';
      knob.style.left = '27px';
      knob.style.top = '95px';
      stage.appendChild(knob);

      gimmickContainer.appendChild(stage);

      let phase = 0;
      let isDragging = false;

      function onStart(e) {
        e.preventDefault();
        isDragging = true;
        playSound('tap');
      }

      function onMove(e) {
        if (!isDragging) return;
        const cur = e.touches ? e.touches[0] : e;
        const rect = stage.getBoundingClientRect();
        const cx = rect.left + 95;
        const cy = rect.top + 95;
        let angle = Math.atan2(cur.clientY - cy, cur.clientX - cx);

        if (angle > 0) angle = (angle < Math.PI / 2) ? 0 : -Math.PI;

        const kx = 95 + 68 * Math.cos(angle);
        const ky = 95 + 68 * Math.sin(angle);
        knob.style.left = kx + 'px';
        knob.style.top = ky + 'px';

        if (phase === 0) {
          if (angle > -0.25) {
            phase = 1;
            turnIndicator.textContent = '↩';
            turnIndicator.style.color = '#ffa502';
            knob.style.background = '#ffa502';
            playSound('tap');
          }
        } else if (phase === 1) {
          if (angle < -Math.PI + 0.3) {
            isDragging = false;
            knob.style.background = '#2ed573';
            resolveLockSuccess();
          }
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          phase = 0;
          knob.style.background = 'var(--primary-accent)';
          turnIndicator.textContent = '↷';
          turnIndicator.style.color = 'var(--blue-accent)';
          knob.style.left = '27px';
          knob.style.top = '95px';
          triggerMistake();
        }
      }

      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 8. マークを書くやつ (✔ ジェスチャー)
    } else if (lock.type === 'gesture_mark') {
      const wrap = document.createElement('div');
      wrap.className = 'gesture-pad-wrap';

      const watermark = document.createElement('div');
      watermark.className = 'gesture-target-watermark';
      watermark.innerHTML = CHECK_MARK_SVG;

      const gCanvas = document.createElement('canvas');
      gCanvas.className = 'gesture-canvas';
      gCanvas.width = 180;
      gCanvas.height = 180;

      wrap.appendChild(watermark);
      wrap.appendChild(gCanvas);
      gimmickContainer.appendChild(wrap);

      const gCtx = gCanvas.getContext('2d');
      gCtx.lineWidth = 10;
      gCtx.lineCap = 'round';
      gCtx.strokeStyle = '#2ed573';

      let isDrawing = false;
      let strokePoints = [];

      function startDraw(e) {
        isDrawing = true;
        strokePoints = [];
        const pt = e.touches ? e.touches[0] : e;
        const rect = gCanvas.getBoundingClientRect();
        strokePoints.push({ x: pt.clientX - rect.left, y: pt.clientY - rect.top });
        gCtx.clearRect(0, 0, 180, 180);
      }
      function moveDraw(e) {
        if (!isDrawing) return;
        const pt = e.touches ? e.touches[0] : e;
        const rect = gCanvas.getBoundingClientRect();
        const p = { x: pt.clientX - rect.left, y: pt.clientY - rect.top };
        strokePoints.push(p);

        gCtx.beginPath();
        gCtx.moveTo(strokePoints[strokePoints.length - 2].x, strokePoints[strokePoints.length - 2].y);
        gCtx.lineTo(p.x, p.y);
        gCtx.stroke();
      }
      function endDraw() {
        if (!isDrawing) return;
        isDrawing = false;
        if (strokePoints.length > 5) {
          const first = strokePoints[0];
          const last = strokePoints[strokePoints.length - 1];
          let lowest = strokePoints.reduce((max, p) => p.y > max.y ? p : max, strokePoints[0]);
          if (lowest.y > first.y + 25 && last.x > lowest.x + 20 && last.y < lowest.y - 15) {
            playSound('tap');
            resolveLockSuccess();
            return;
          }
        }
        gCtx.clearRect(0, 0, 180, 180);
        triggerMistake();
      }

      gCanvas.addEventListener('mousedown', startDraw);
      gCanvas.addEventListener('touchstart', startDraw, { passive: true });
      addTrackedListener(window, 'mousemove', moveDraw);
      addTrackedListener(window, 'touchmove', moveDraw, { passive: true });
      addTrackedListener(window, 'mouseup', endDraw);
      addTrackedListener(window, 'touchend', endDraw);

    // 9. 鍵合わせ (6択グリッド・全てゴールド同色鍵・刻印幾何記号で照合)
    } else if (lock.type === 'match_key') {
      const stage = document.createElement('div');
      stage.className = 'key-match-stage';

      const symbols = ['●', '▲', '★', '◆', '■', '✚'];
      const targetSym = symbols[Math.floor(Math.random() * symbols.length)];

      const hole = document.createElement('div');
      hole.className = 'key-match-hole-target';
      hole.textContent = targetSym;
      stage.appendChild(hole);

      const grid = document.createElement('div');
      grid.className = 'key-choices-grid-6';

      const shuffled = [...symbols].sort(() => Math.random() - 0.5);
      shuffled.forEach(sym => {
        const item = document.createElement('button');
        item.className = 'key-choice-gold-btn';
        item.textContent = sym;
        setupActionButton(item, () => {
          if (sym === targetSym) {
            playSound('tap');
            resolveLockSuccess();
          } else {
            triggerMistake();
          }
        });
        grid.appendChild(item);
      });

      stage.appendChild(grid);
      gimmickContainer.appendChild(stage);

    // 10. 3原色混色 (横長プレビュー欄・1色目即時表示・2色目0.5s混色表示後に判定)
    } else if (lock.type === 'color_mix') {
      const stage = document.createElement('div');
      stage.className = 'color-mix-stage';

      const recipes = [
        { name: '紫', color: '#9b59b6', ingredients: ['red', 'blue'] },
        { name: '緑', color: '#2ed573', ingredients: ['blue', 'yellow'] },
        { name: '橙', color: '#e67e22', ingredients: ['red', 'yellow'] }
      ];
      const targetRecipe = recipes[Math.floor(Math.random() * recipes.length)];

      const targetCircle = document.createElement('div');
      targetCircle.className = 'color-mix-target-circle';
      targetCircle.style.background = targetRecipe.color;
      stage.appendChild(targetCircle);

      const barContainer = document.createElement('div');
      barContainer.className = 'color-mix-bar-container';
      const barFill = document.createElement('div');
      barFill.className = 'color-mix-bar-fill';
      barContainer.appendChild(barFill);
      stage.appendChild(barContainer);

      const buttonsRow = document.createElement('div');
      buttonsRow.className = 'color-mix-buttons-row';

      const colorDefs = [
        { key: 'red', hex: '#ff4757' },
        { key: 'blue', hex: '#1e90ff' },
        { key: 'yellow', hex: '#ffa502' }
      ];

      let selectedColors = [];
      let isEvaluating = false;

      function getBlendedColor(c1, c2) {
        if ((c1 === 'red' && c2 === 'blue') || (c1 === 'blue' && c2 === 'red')) return '#9b59b6';
        if ((c1 === 'blue' && c2 === 'yellow') || (c1 === 'yellow' && c2 === 'blue')) return '#2ed573';
        if ((c1 === 'red' && c2 === 'yellow') || (c1 === 'yellow' && c2 === 'red')) return '#e67e22';
        return c1 === 'red' ? '#ff4757' : (c1 === 'blue' ? '#1e90ff' : '#ffa502');
      }

      colorDefs.forEach(def => {
        const btn = document.createElement('button');
        btn.className = 'color-mix-pill-btn';
        btn.style.background = def.hex;
        btn.addEventListener('click', () => {
          if (isEvaluating) return;
          playSound('tap');

          if (selectedColors.length === 0) {
            selectedColors.push(def.key);
            barFill.style.background = def.hex;
          } else if (selectedColors.length === 1) {
            selectedColors.push(def.key);
            const blendedHex = getBlendedColor(selectedColors[0], selectedColors[1]);
            barFill.style.background = blendedHex;
            isEvaluating = true;

            const [c1, c2] = selectedColors;
            const isCorrect = (targetRecipe.ingredients.includes(c1) && targetRecipe.ingredients.includes(c2) && c1 !== c2);

            if (isCorrect) {
              // 正解なら待たずに即時アンロック
              resolveLockSuccess();
            } else {
              // 不正解の場合は0.5秒間混色を表示してからミス判定とリセット
              setTimeout(() => {
                triggerMistake();
                barFill.style.background = 'transparent';
                selectedColors = [];
                isEvaluating = false;
              }, 500);
            }
          }
        });
        buttonsRow.appendChild(btn);
      });

      stage.appendChild(buttonsRow);
      gimmickContainer.appendChild(stage);

    // 11. 特大連打ボタン (rapid_mash)
    } else if (lock.type === 'rapid_mash') {
      const targetClicks = 6;
      let count = 0;

      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = 'center';
      wrap.style.width = '100%';

      const gaugeTrack = document.createElement('div');
      gaugeTrack.className = 'rapid-mash-gauge-track';
      const gaugeFill = document.createElement('div');
      gaugeFill.className = 'rapid-mash-gauge-fill';
      gaugeTrack.appendChild(gaugeFill);

      const btn = document.createElement('button');
      btn.className = 'rapid-mash-big-btn';
      btn.type = 'button';

      function handleMash(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isResolvingLock) return;
        count++;
        playSound('tap');
        gaugeFill.style.width = Math.min(100, (count / targetClicks) * 100) + '%';
        if (count >= targetClicks) resolveLockSuccess();
      }

      btn.addEventListener('pointerdown', handleMash);
      btn.addEventListener('click', (e) => e.preventDefault());

      wrap.appendChild(gaugeTrack);
      wrap.appendChild(btn);
      gimmickContainer.appendChild(wrap);

    // 13. 長押し高度キープ (0.5秒キープ・垂直ロケットSVG)
    } else if (lock.type === 'hover_thrust') {
      const stage = document.createElement('div');
      stage.className = 'hover-stage';

      const zone = document.createElement('div');
      zone.className = 'hover-target-zone';
      
      const zoneIcon = document.createElement('span');
      zoneIcon.innerHTML = TARGET_ZONE_SVG;
      const progressTrack = document.createElement('div');
      progressTrack.className = 'hover-progress-track';
      const progressFill = document.createElement('div');
      progressFill.className = 'hover-progress-fill';
      progressTrack.appendChild(progressFill);
      zone.appendChild(zoneIcon);
      zone.appendChild(progressTrack);

      const rocket = document.createElement('div');
      rocket.className = 'hover-rocket';
      rocket.innerHTML = ROCKET_SVG;

      stage.appendChild(zone);
      stage.appendChild(rocket);

      const thrustBtn = document.createElement('button');
      thrustBtn.className = 'hover-thrust-btn';
      thrustBtn.textContent = '▲';

      gimmickContainer.appendChild(stage);
      gimmickContainer.appendChild(thrustBtn);

      let altitude = 15;
      let velocity = 0;
      let isThrusting = false;
      let insideTime = 0;
      const targetDuration = 500;

      function onStart(e) { e.preventDefault(); isThrusting = true; playSound('tap'); }
      function onEnd(e) { e.preventDefault(); isThrusting = false; }

      thrustBtn.addEventListener('mousedown', onStart);
      thrustBtn.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

      function hoverPhysics() {
        if (!isPlaying || currentLock.type !== lock.type) return;
        if (isThrusting) velocity += 0.55;
        else velocity -= 0.35;

        velocity *= 0.95;
        altitude += velocity;
        if (altitude < 8) { altitude = 8; velocity = 0; }
        if (altitude > 140) { altitude = 140; velocity = 0; }
        rocket.style.bottom = altitude + 'px';

        const r = rocket.getBoundingClientRect();
        const z = zone.getBoundingClientRect();
        const rCenter = r.top + r.height / 2;
        const isInside = (rCenter >= z.top && rCenter <= z.bottom);

        if (isInside) {
          zone.classList.add('active-in');
          insideTime += 16.6;
          const pct = Math.min(100, (insideTime / targetDuration) * 100);
          progressFill.style.width = pct + '%';

          if (insideTime >= targetDuration) {
            resolveLockSuccess();
            return;
          }
        } else {
          zone.classList.remove('active-in');
          insideTime = Math.max(0, insideTime - 12);
          const pct = Math.min(100, (insideTime / targetDuration) * 100);
          progressFill.style.width = pct + '%';
        }

        activeAnimationId = requestAnimationFrame(hoverPhysics);
      }
      activeAnimationId = requestAnimationFrame(hoverPhysics);

    // 14. 星型完全トレース (安定ベクター星アイコン)
    } else if (lock.type === 'star_trace') {
      const area = document.createElement('div');
      area.className = 'star-trace-area';

      const starPoints = [
        { x: 95, y: 22 },
        { x: 148, y: 165 },
        { x: 12, y: 74 },
        { x: 178, y: 74 },
        { x: 42, y: 165 },
        { x: 95, y: 22 }
      ];

      const stepInd = document.createElement('div');
      stepInd.className = 'star-step-indicator';
      const starIconContainers = [];
      for (let i = 0; i < 5; i++) {
        const span = document.createElement('span');
        span.innerHTML = getStarSvg(false);
        stepInd.appendChild(span);
        starIconContainers.push(span);
      }
      area.appendChild(stepInd);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'star-trace-svg');
      svg.setAttribute('viewBox', '0 0 190 190');

      const bgPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      bgPolygon.setAttribute('points', '95,22 148,165 12,74 178,74 42,165');
      bgPolygon.setAttribute('fill', 'rgba(255, 255, 255, 0.05)');
      bgPolygon.setAttribute('stroke', '#ced6e0');
      bgPolygon.setAttribute('stroke-width', '10');
      bgPolygon.setAttribute('stroke-linejoin', 'round');
      bgPolygon.setAttribute('stroke-linecap', 'round');
      svg.appendChild(bgPolygon);

      const trailPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      trailPath.setAttribute('d', `M ${starPoints[0].x} ${starPoints[0].y}`);
      trailPath.setAttribute('fill', 'none');
      trailPath.setAttribute('stroke', '#ffa502');
      trailPath.setAttribute('stroke-width', '8');
      trailPath.setAttribute('stroke-linejoin', 'round');
      trailPath.setAttribute('stroke-linecap', 'round');
      svg.appendChild(trailPath);

      area.appendChild(svg);

      const markerPoints = starPoints.slice(0, 5);
      const markerEls = markerPoints.map((pt, idx) => {
        const marker = document.createElement('div');
        marker.className = 'star-point-marker';
        marker.style.left = pt.x + 'px';
        marker.style.top = pt.y + 'px';
        marker.innerHTML = (idx === 0) ? MINI_CHECK_SVG : '';
        if (idx === 0) marker.classList.add('completed');
        area.appendChild(marker);
        return marker;
      });

      let targetPtIdx = 1;
      markerEls[targetPtIdx].classList.add('active-target');

      const knob = document.createElement('div');
      knob.className = 'star-knob';
      knob.innerHTML = getStarSvg(true);
      knob.style.left = starPoints[0].x + 'px';
      knob.style.top = starPoints[0].y + 'px';
      area.appendChild(knob);

      gimmickContainer.appendChild(area);

      let isDragging = false;

      function updateTrail() {
        let d = `M ${starPoints[0].x} ${starPoints[0].y}`;
        for (let i = 1; i < targetPtIdx; i++) {
          d += ` L ${starPoints[i].x} ${starPoints[i].y}`;
        }
        trailPath.setAttribute('d', d);
      }

      function onStart(e) {
        e.preventDefault();
        isDragging = true;
        playSound('tap');
      }

      function onMove(e) {
        if (!isDragging) return;
        const cur = e.touches ? e.touches[0] : e;
        const rect = area.getBoundingClientRect();
        const rx = cur.clientX - rect.left;
        const ry = cur.clientY - rect.top;

        knob.style.left = rx + 'px';
        knob.style.top = ry + 'px';

        const target = starPoints[targetPtIdx];
        if (Math.hypot(rx - target.x, ry - target.y) < 30) {
          playSound('tap');
          if (targetPtIdx < 5) {
            markerEls[targetPtIdx].classList.remove('active-target');
            markerEls[targetPtIdx].classList.add('completed');
            markerEls[targetPtIdx].innerHTML = MINI_CHECK_SVG;
          }
          if (starIconContainers[targetPtIdx - 1]) {
            starIconContainers[targetPtIdx - 1].innerHTML = getStarSvg(true);
          }

          targetPtIdx++;
          updateTrail();

          if (targetPtIdx >= starPoints.length) {
            isDragging = false;
            knob.style.left = target.x + 'px';
            knob.style.top = target.y + 'px';
            setTimeout(() => resolveLockSuccess(), 120);
          } else {
            const nextMarkerIdx = (targetPtIdx < 5) ? targetPtIdx : 0;
            markerEls[nextMarkerIdx].classList.add('active-target');
          }
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          targetPtIdx = 1;
          markerEls.forEach((m, i) => {
            m.className = 'star-point-marker';
            m.innerHTML = (i === 0) ? MINI_CHECK_SVG : '';
            if (i === 0) m.classList.add('completed');
            if (i === 1) m.classList.add('active-target');
          });
          starIconContainers.forEach((s) => {
            s.innerHTML = getStarSvg(false);
          });
          knob.style.left = starPoints[0].x + 'px';
          knob.style.top = starPoints[0].y + 'px';
          updateTrail();
          triggerMistake();
        }
      }

      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 15. ダイヤル式のカギ (平均6タップで終わるようタップ数を精密調整)
    } else if (lock.type === 'dial_code') {
      const stage = document.createElement('div');
      stage.className = 'dial-lock-stage';

      const targetDigits = [7, 7, 7];
      const codeLabel = document.createElement('div');
      codeLabel.className = 'dial-lock-target-code';
      codeLabel.textContent = '7 7 7';

      const row = document.createElement('div');
      row.className = 'dial-wheels-row';

      const tapDistributions = [
        [2, 2, 2], [1, 2, 3], [3, 1, 2], [2, 3, 1],
        [1, 3, 2], [2, 1, 3], [3, 2, 1], [1, 2, 2],
        [2, 2, 1], [2, 2, 3], [3, 2, 2], [2, 3, 2]
      ];
      const chosenTaps = tapDistributions[Math.floor(Math.random() * tapDistributions.length)];
      const currentDigits = chosenTaps.map(t => (7 - t + 10) % 10);

      currentDigits.forEach((val, idx) => {
        const wheel = document.createElement('div');
        wheel.className = 'dial-wheel';
        wheel.textContent = val;

        wheel.addEventListener('click', () => {
          playSound('tap');
          currentDigits[idx] = (currentDigits[idx] + 1) % 10;
          wheel.textContent = currentDigits[idx];

          if (currentDigits.every((d, i) => d === targetDigits[i])) {
            setTimeout(() => resolveLockSuccess(), 120);
          }
        });
        row.appendChild(wheel);
      });

      stage.appendChild(codeLabel);
      stage.appendChild(row);
      gimmickContainer.appendChild(stage);

    // 16. ボタンが激しく動くやつ
    } else if (lock.type === 'moving_btn') {
      const box = document.createElement('div');
      box.className = 'moving-btn-container';

      const btn = document.createElement('button');
      btn.className = 'moving-action-btn';
      btn.textContent = '⌖';
      btn.style.fontSize = '1.3rem';
      btn.style.fontWeight = '900';
      box.appendChild(btn);
      gimmickContainer.appendChild(box);

      let x = 60, y = 60;
      let vx = 3.5, vy = 2.8;

      function bounceAnim() {
        if (!isPlaying || currentLock.type !== lock.type) return;
        x += vx; y += vy;
        if (x <= 8 || x >= 210) vx = -vx;
        if (y <= 8 || y >= 115) vy = -vy;
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        activeAnimationId = requestAnimationFrame(bounceAnim);
      }
      activeAnimationId = requestAnimationFrame(bounceAnim);

      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });

    // 17. モールス信号打つ奴 (トン・ツー・トン)
    } else if (lock.type === 'morse_code') {
      const stage = document.createElement('div');
      stage.className = 'morse-stage';

      const targetPattern = ['dot', 'dash', 'dot'];
      let currentIdx = 0;

      const display = document.createElement('div');
      display.className = 'morse-target-display';
      const s1 = document.createElement('span'); s1.className = 'morse-symbol'; s1.textContent = '・';
      const s2 = document.createElement('span'); s2.className = 'morse-symbol'; s2.textContent = '━';
      const s3 = document.createElement('span'); s3.className = 'morse-symbol'; s3.textContent = '・';
      display.appendChild(s1);
      display.appendChild(s2);
      display.appendChild(s3);

      const tapBtn = document.createElement('button');
      tapBtn.className = 'morse-tap-btn';
      tapBtn.textContent = '●';
      tapBtn.style.fontSize = '1.6rem';
      tapBtn.style.fontWeight = '900';
      tapBtn.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });

      let pressStart = 0;
      function onPressStart(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        pressStart = Date.now();
        playSound('tap');
      }
      function onPressEnd(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const duration = Date.now() - pressStart;
        const inputType = duration > 280 ? 'dash' : 'dot';

        if (inputType === targetPattern[currentIdx]) {
          display.children[currentIdx].classList.add('matched');
          currentIdx++;
          if (currentIdx >= targetPattern.length) {
            resolveLockSuccess();
          }
        } else {
          triggerMistake();
          currentIdx = 0;
          Array.from(display.children).forEach(c => c.classList.remove('matched'));
        }
      }

      tapBtn.addEventListener('mousedown', onPressStart);
      tapBtn.addEventListener('touchstart', onPressStart, { passive: false });
      addTrackedListener(window, 'mouseup', onPressEnd);
      addTrackedListener(window, 'touchend', onPressEnd);

      stage.appendChild(display);
      stage.appendChild(tapBtn);
      gimmickContainer.appendChild(stage);

    // 18. ハンドル回転・バルブ (回してる間に段々解除される演出＆シャックル連動)
    } else if (lock.type === 'wheel_turn') {
      const stage = document.createElement('div');
      stage.className = 'wheel-turn-stage';

      const rim = document.createElement('div');
      rim.className = 'wheel-turn-rim';

      const spokeH = document.createElement('div'); spokeH.className = 'wheel-turn-spoke';
      const spokeV = document.createElement('div'); spokeV.className = 'wheel-turn-spoke spoke-v';
      const knob = document.createElement('div'); knob.className = 'wheel-turn-knob';

      rim.appendChild(spokeH);
      rim.appendChild(spokeV);
      rim.appendChild(knob);

      const center = document.createElement('div');
      center.className = 'wheel-turn-center unlocking';
      center.textContent = '0%';
      center.style.fontSize = '0.9rem';

      stage.appendChild(rim);
      stage.appendChild(center);
      gimmickContainer.appendChild(stage);

      let isDragging = false;
      let lastAngle = null;
      let totalRotated = 0;
      let currentDeg = 0;
      let lastStepSound = 0;

      function getAngle(e) {
        const pt = e.touches ? e.touches[0] : e;
        const rect = stage.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return Math.atan2(pt.clientY - cy, pt.clientX - cx);
      }

      function onStart(e) {
        e.preventDefault();
        isDragging = true;
        lastAngle = getAngle(e);
        playSound('tap');
      }

      function onMove(e) {
        if (!isDragging) return;
        const angle = getAngle(e);
        let delta = angle - lastAngle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;

        totalRotated += delta;
        currentDeg += (delta * 180 / Math.PI);
        rim.style.transform = `rotate(${currentDeg}deg)`;
        lastAngle = angle;

        const progress = Math.min(1, Math.abs(totalRotated) / (Math.PI * 1.85));
        currentShackle.style.transform = `translateX(-50%) translateY(${-progress * 18}px)`;

        const pct = Math.floor(progress * 100);
        center.textContent = (progress >= 0.98) ? 'OPEN' : `${pct}%`;
        const rVal = Math.round(255 - progress * (255 - 46));
        const gVal = Math.round(165 + progress * (213 - 165));
        const bVal = Math.round(2 + progress * (115 - 2));
        center.style.background = `rgb(${rVal}, ${gVal}, ${bVal})`;

        const step = Math.floor(Math.abs(totalRotated) / (Math.PI / 4));
        if (step > lastStepSound) {
          lastStepSound = step;
          playSound('tap');
        }

        if (progress >= 1) {
          isDragging = false;
          center.textContent = 'OPEN';
          center.style.background = '#2ed573';
          setTimeout(() => resolveLockSuccess(), 120);
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          totalRotated = 0;
          currentDeg = 0;
          lastStepSound = 0;
          rim.style.transform = 'rotate(0deg)';
          currentShackle.style.transform = '';
          center.textContent = '0%';
          center.style.background = '#ffa502';
          triggerMistake();
        }
      }

      rim.addEventListener('mousedown', onStart);
      rim.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 19. タップしないで1.5秒待つとOK (我慢・静止ギミック)
    } else if (lock.type === 'wait_still') {
      const stage = document.createElement('div');
      stage.className = 'wait-still-stage';

      const handIcon = document.createElement('div');
      handIcon.className = 'wait-still-hand';
      handIcon.innerHTML = HAND_STOP_SVG;

      const track = document.createElement('div');
      track.className = 'wait-still-progress-track';
      const fill = document.createElement('div');
      fill.className = 'wait-still-progress-fill';
      track.appendChild(fill);

      stage.appendChild(handIcon);
      stage.appendChild(track);
      gimmickContainer.appendChild(stage);

      let waitTime = 0;
      const targetWait = 1500;

      function onAccidentalTap(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        waitTime = 0;
        fill.style.width = '0%';
        triggerMistake();
      }

      stage.addEventListener('mousedown', onAccidentalTap);
      stage.addEventListener('touchstart', onAccidentalTap, { passive: false });

      function waitLoop() {
        if (!isPlaying || currentLock.type !== lock.type) return;
        waitTime += 16.6;
        const pct = Math.min(100, (waitTime / targetWait) * 100);
        fill.style.width = pct + '%';

        if (waitTime >= targetWait) {
          handIcon.textContent = 'OK';
          handIcon.style.color = '#2ed573';
          resolveLockSuccess();
          return;
        }
        activeAnimationId = requestAnimationFrame(waitLoop);
      }
      activeAnimationId = requestAnimationFrame(waitLoop);

    // 20. カラー二択 (UI位置・間隔・押しやすさを再調整)
    } else if (lock.type === 'color_choice_2') {
      const isBlue = Math.random() > 0.5;
      const wrap = document.createElement('div');
      wrap.className = 'color-match-wrap';

      const target = document.createElement('div');
      target.className = 'color-target-display';
      target.style.background = isBlue ? '#1e90ff' : '#ff4757';
      wrap.appendChild(target);

      const row = document.createElement('div');
      row.className = 'choice-row';
      const b1 = document.createElement('button'); b1.className = 'color-choice-btn'; b1.style.background = '#1e90ff';
      const b2 = document.createElement('button'); b2.className = 'color-choice-btn'; b2.style.background = '#ff4757';
      b1.addEventListener('click', () => { if (isBlue) { playSound('tap'); resolveLockSuccess(); } else triggerMistake(); });
      b2.addEventListener('click', () => { if (!isBlue) { playSound('tap'); resolveLockSuccess(); } else triggerMistake(); });
      row.appendChild(b1); row.appendChild(b2);
      wrap.appendChild(row);
      gimmickContainer.appendChild(wrap);

    // 21. イライラ棒！鍵迷路 (多回数カーブ ＆ ビリビリ放電エフェクト ＆ ベクターキー)
    } else if (lock.type === 'irira_key_maze') {
      const container = document.createElement('div');
      container.className = 'irira-maze-container';

      const pathD = "M 30 25 L 85 25 L 85 65 L 155 65 L 155 30 L 225 30 L 225 120";

      container.innerHTML = `
        <svg class="irira-maze-svg" viewBox="0 0 250 140">
          <defs>
            <filter id="glow-shock" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>
          <path class="electric-zap-path electric-zap-glow" d="${pathD}" 
                fill="none" stroke="#ffa502" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-shock)" />
          <path d="${pathD}" 
                fill="none" stroke="#2f3542" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${pathD}" 
                fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;

      const goalHole = document.createElement('div');
      goalHole.className = 'irira-goal-hole';
      goalHole.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
          <circle cx="12" cy="9" r="6" fill="#2ed573" />
          <polygon points="9,10 15,10 14,20 10,20" fill="#2ed573" />
        </svg>
      `;
      goalHole.style.left = '225px';
      goalHole.style.top = '120px';
      container.appendChild(goalHole);

      const keyDragger = document.createElement('div');
      keyDragger.className = 'irira-key-dragger';
      keyDragger.innerHTML = KEY_SVG;
      keyDragger.style.left = '30px';
      keyDragger.style.top = '25px';
      container.appendChild(keyDragger);

      gimmickContainer.appendChild(container);

      const points = [
        { x: 30, y: 25 },
        { x: 85, y: 25 },
        { x: 85, y: 65 },
        { x: 155, y: 65 },
        { x: 155, y: 30 },
        { x: 225, y: 30 },
        { x: 225, y: 120 }
      ];

      function distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Math.hypot(px - projX, py - projY);
      }

      function minDistanceToPath(px, py) {
        let minD = Infinity;
        for (let i = 0; i < points.length - 1; i++) {
          const d = distToSegment(px, py, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
          if (d < minD) minD = d;
        }
        return minD;
      }

      let isDragging = false;

      function onStart(e) {
        e.preventDefault();
        isDragging = true;
        playSound('tap');
      }

      function onMove(e) {
        if (!isDragging) return;
        const cur = e.touches ? e.touches[0] : e;
        const rect = container.getBoundingClientRect();
        const px = cur.clientX - rect.left;
        const py = cur.clientY - rect.top;

        keyDragger.style.left = px + 'px';
        keyDragger.style.top = py + 'px';

        const dist = minDistanceToPath(px, py);
        if (dist > 19) {
          isDragging = false;
          container.classList.add('shocked');
          triggerMistake();
          setTimeout(() => {
            container.classList.remove('shocked');
          }, 350);
          keyDragger.style.left = '30px';
          keyDragger.style.top = '25px';
          return;
        }

        if (Math.hypot(px - 225, py - 120) <= 18) {
          isDragging = false;
          keyDragger.style.left = '225px';
          keyDragger.style.top = '120px';
          setTimeout(() => resolveLockSuccess(), 100);
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          keyDragger.style.left = '30px';
          keyDragger.style.top = '25px';
          triggerMistake();
        }
      }

      keyDragger.addEventListener('mousedown', onStart);
      keyDragger.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 22. 精密高度キープ (10%狭い36pxゾーン ＆ ロケット垂直中心判定)
    } else if (lock.type === 'hover_thrust_hard') {
      const stage = document.createElement('div');
      stage.className = 'hover-stage';
      stage.style.width = '100px';

      const zone = document.createElement('div');
      zone.className = 'hover-target-zone';
      zone.style.height = '36px';
      
      const zoneIcon = document.createElement('span');
      zoneIcon.innerHTML = TARGET_ZONE_SVG;
      const progressTrack = document.createElement('div');
      progressTrack.className = 'hover-progress-track';
      const progressFill = document.createElement('div');
      progressFill.className = 'hover-progress-fill';
      progressTrack.appendChild(progressFill);
      zone.appendChild(zoneIcon);
      zone.appendChild(progressTrack);

      const rocket = document.createElement('div');
      rocket.className = 'hover-rocket';
      rocket.innerHTML = ROCKET_SVG;

      stage.appendChild(zone);
      stage.appendChild(rocket);

      const thrustBtn = document.createElement('button');
      thrustBtn.className = 'hover-thrust-btn';
      thrustBtn.textContent = '▲';

      gimmickContainer.appendChild(stage);
      gimmickContainer.appendChild(thrustBtn);

      let altitude = 15;
      let velocity = 0;
      let isThrusting = false;
      let insideTime = 0;
      const targetDuration = 550;

      function onStart(e) { e.preventDefault(); isThrusting = true; playSound('tap'); }
      function onEnd(e) { e.preventDefault(); isThrusting = false; }

      thrustBtn.addEventListener('mousedown', onStart);
      thrustBtn.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

      function hoverPhysics() {
        if (!isPlaying || currentLock.type !== lock.type) return;
        if (isThrusting) velocity += 0.55;
        else velocity -= 0.35;

        velocity *= 0.95;
        altitude += velocity;
        if (altitude < 8) { altitude = 8; velocity = 0; }
        if (altitude > 140) { altitude = 140; velocity = 0; }
        rocket.style.bottom = altitude + 'px';

        const r = rocket.getBoundingClientRect();
        const z = zone.getBoundingClientRect();
        const rCenter = r.top + r.height / 2;
        const isInside = (rCenter >= z.top && rCenter <= z.bottom);

        if (isInside) {
          zone.classList.add('active-in');
          insideTime += 16.6;
          const pct = Math.min(100, (insideTime / targetDuration) * 100);
          progressFill.style.width = pct + '%';

          if (insideTime >= targetDuration) {
            resolveLockSuccess();
            return;
          }
        } else {
          zone.classList.remove('active-in');
          insideTime = Math.max(0, insideTime - 12);
          const pct = Math.min(100, (insideTime / targetDuration) * 100);
          progressFill.style.width = pct + '%';
        }

        activeAnimationId = requestAnimationFrame(hoverPhysics);
      }
      activeAnimationId = requestAnimationFrame(hoverPhysics);

    // 23. 極小・激しく動くボタン (クッキリ照準マーク ＆ 時間経過で減速)
    } else if (lock.type === 'tiny_moving_btn') {
      const box = document.createElement('div');
      box.className = 'moving-btn-container';
      const btn = document.createElement('button');
      btn.className = 'tiny-moving-btn';
      btn.textContent = '⌖';
      btn.style.fontSize = '1.2rem';
      btn.style.lineHeight = '1';
      box.appendChild(btn);
      gimmickContainer.appendChild(box);

      let x = 80, y = 80;
      let vx = 5.2, vy = 4.5;

      function tinyBounce() {
        if (!isPlaying || currentLock.type !== lock.type) return;

        // 時間経過で徐々に減速（最低速度は確保）
        vx *= 0.997;
        vy *= 0.997;
        if (Math.abs(vx) < 1.1) vx = Math.sign(vx || 1) * 1.1;
        if (Math.abs(vy) < 0.9) vy = Math.sign(vy || 1) * 0.9;

        x += vx; y += vy;
        if (x <= 6 || x >= 235) vx = -vx;
        if (y <= 6 || y >= 135) vy = -vy;
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        activeAnimationId = requestAnimationFrame(tinyBounce);
      }
      activeAnimationId = requestAnimationFrame(tinyBounce);

      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });

    // 24. 超激連打 (連打しないとゲージがマイナスに減少して左に飛び出す ＆ リアル立体アーケードボタン)
    } else if (lock.type === 'super_mash') {
      let progress = 0;

      const wrap = document.createElement('div');
      wrap.className = 'super-mash-container';

      const trackWrapper = document.createElement('div');
      trackWrapper.className = 'super-mash-track-wrapper';

      const fillBar = document.createElement('div');
      fillBar.className = 'super-mash-fill-bar';
      trackWrapper.appendChild(fillBar);

      const btn = document.createElement('button');
      btn.className = 'super-arcade-btn';
      btn.innerHTML = BOLT_SVG;

      btn.addEventListener('click', () => {
        playSound('tap');
        progress = Math.min(100, progress + 13);
        updateBar();
        if (progress >= 100) {
          resolveLockSuccess();
        }
      });

      function updateBar() {
        if (progress >= 0) {
          fillBar.style.left = '0%';
          fillBar.style.width = progress + '%';
          fillBar.classList.remove('negative');
        } else {
          fillBar.style.left = progress + '%';
          fillBar.style.width = Math.abs(progress) + '%';
          fillBar.classList.add('negative');
        }
      }

      wrap.appendChild(trackWrapper);
      wrap.appendChild(btn);
      gimmickContainer.appendChild(wrap);

      function decayLoop() {
        if (!isPlaying || currentLock.type !== lock.type) return;
        progress = Math.max(-40, progress - 0.35);
        updateBar();
        activeAnimationId = requestAnimationFrame(decayLoop);
      }
      activeAnimationId = requestAnimationFrame(decayLoop);
    }
  }

  // Juice & Combo State
  let comboCount = 0;
  let lastUnlockTime = 0;
  const gameApp = document.getElementById('game-app');
  const screenFlashOverlay = document.getElementById('screen-flash-overlay');
  const dangerVignette = document.getElementById('danger-vignette');

  // ショックウェーブ生成
  function triggerShockwave(x, y) {
    const ring = document.createElement('div');
    ring.className = 'shockwave-ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 500);
  }

  // フローティング・コンボテキスト生成
  function spawnFloatingText(text, x, y) {
    const el = document.createElement('div');
    el.className = 'floating-combo-text';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  // Mistake Trigger
  function triggerMistake() {
    comboCount = 0; // コンボ途切れ
    playSound('mistake');
    if (navigator.vibrate) {
      try { navigator.vibrate([40, 30, 40]); } catch (e) {}
    }

    currentCard.classList.add('shake');
    setTimeout(() => {
      currentCard.classList.remove('shake');
    }, 400);
  }

  let isResolvingLock = false;

  // Success Trigger (+1.0s & Card Swap & Advanced Juice)
  function resolveLockSuccess() {
    if (!isPlaying || isResolvingLock) return;
    isResolvingLock = true;
    if (gimmickContainer) {
      gimmickContainer.style.pointerEvents = 'none';
    }

    cleanActiveAnimations();
    cleanActiveListeners();

    // コンボ判定 (3.0秒以内の連続解錠でコンボ継続)
    const now = Date.now();
    if (now - lastUnlockTime < 3000) {
      comboCount = Math.min(8, comboCount + 1);
    } else {
      comboCount = 1;
    }
    lastUnlockTime = now;

    // 音響 (コンボピッチ上昇)
    playSound('unlock', comboCount);

    // 触覚振動
    if (navigator.vibrate) {
      try { navigator.vibrate(comboCount > 2 ? [25, 20, 25] : [22]); } catch (e) {}
    }

    // シャックルスプリングオープン
    currentShackle.classList.add('open');

    // 時間追加アニメ
    remainingTime += 1.0;
    timeAddedAnim.classList.remove('animate');
    void timeAddedAnim.offsetWidth;
    timeAddedAnim.classList.add('animate');

    // スコア加算 (新ルール: 基本100pt固定 + 10個ごとに300pt + コンボ数×10)
    unlockedCountNum++;
    unlockedCount.textContent = unlockedCountNum;

    const basePts = 100;
    const comboBonus = comboCount * 10;
    const isTenBonus = (unlockedCountNum % 10 === 0);
    const tenBonus = isTenBonus ? 300 : 0;

    score += (basePts + comboBonus + tenBonus);
    scoreDisplay.textContent = score;

    // スコアバウンス
    const scoreBox = document.querySelector('.score-box');
    if (scoreBox) {
      scoreBox.classList.remove('pop');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('pop');
    }

    const cardRect = currentCard.getBoundingClientRect();
    const centerX = cardRect.left + cardRect.width / 2;
    const centerY = cardRect.top + cardRect.height / 2;

    // ショックウェーブ ＆ 画面フラッシュ ＆ 画面シェイク
    triggerShockwave(centerX, centerY);
    if (screenFlashOverlay) {
      screenFlashOverlay.classList.add('flash');
      setTimeout(() => screenFlashOverlay.classList.remove('flash'), 50);
    }
    if (gameApp) {
      gameApp.classList.remove('impact-shake');
      void gameApp.offsetWidth;
      gameApp.classList.add('impact-shake');
      setTimeout(() => gameApp.classList.remove('impact-shake'), 280);
    }

    // フローティングテキスト
    if (isTenBonus) {
      spawnFloatingText(`BONUS +300pt!`, centerX, cardRect.top + 10);
    } else {
      const comboLabel = comboCount > 1 ? `COMBO x${comboCount} (+${comboBonus}pt)` : '+100pt';
      spawnFloatingText(comboLabel, centerX, cardRect.top + 30);
    }

    // 紙吹雪 ＆ スパークパーティクル爆発
    createBurst(centerX, centerY, 36);

    // 背景の大型鍵メカニズム解錠アニメーション連動
    const mechBg = document.getElementById('lock-mechanism-bg');
    if (mechBg) {
      mechBg.classList.add('unlocked');
      setTimeout(() => mechBg.classList.remove('unlocked'), 450);
    }

    currentCard.style.transform = 'translateY(-22px) scale(1.08)';
    currentCard.style.opacity = '0';

    setTimeout(() => {
      currentLock = nextLock;
      nextLock = getNextLockFromQueue();

      renderGimmick(currentLock);
      currentCard.style.transform = 'translateY(0) scale(1)';
      currentCard.style.opacity = '1';

      const nextBadge = document.getElementById('next-lock-badge');
      if (nextBadge) nextBadge.textContent = `NEXT: Lv.${nextLock.level}`;

      // アニメーション完了後に連打ロックを安全に解除
      setTimeout(() => {
        isResolvingLock = false;
        if (gimmickContainer) {
          gimmickContainer.style.pointerEvents = 'auto';
        }
      }, 60);
    }, 200);
  }

  let isTimeFrozen = false;

  // Timer loop
  function startTimer() {
    const urgentOverlay = document.getElementById('urgent-countdown-overlay');
    const urgentNum = document.getElementById('urgent-count-num');

    timerInterval = setInterval(() => {
      if (isTimeFrozen) return;

      remainingTime -= 0.1;
      if (remainingTime <= 0) {
        remainingTime = 0;
        timeDisplay.textContent = '0.0';
        if (urgentOverlay) urgentOverlay.classList.remove('active');
        endGame();
        return;
      }

      timeDisplay.textContent = remainingTime.toFixed(1);

      // 残り時間3, 2, 1秒で画面全体を90%透過オーバーレイにしてカウントダウン緊迫感を演出
      if (remainingTime <= 3.0 && remainingTime > 0) {
        if (urgentOverlay) urgentOverlay.classList.add('active');
        const sec = Math.ceil(remainingTime);
        if (urgentNum && urgentNum.textContent !== String(sec)) {
          urgentNum.textContent = String(sec);
          urgentNum.style.animation = 'none';
          void urgentNum.offsetWidth; // reflow
          urgentNum.style.animation = 'urgent-pulse 0.9s infinite cubic-bezier(0.25, 1, 0.5, 1)';
        }
      } else {
        if (urgentOverlay) urgentOverlay.classList.remove('active');
      }

      if (remainingTime <= 5.0) {
        timeDisplay.parentElement.classList.add('timer-danger');
        if (dangerVignette) dangerVignette.classList.add('active-danger');
        warningBeepTimer++;
        if (warningBeepTimer % 5 === 0) {
          playSound('warning');
        }
      } else {
        timeDisplay.parentElement.classList.remove('timer-danger');
        if (dangerVignette) dangerVignette.classList.remove('active-danger');
      }
    }, 100);
  }

  function startGame() {
    initAudio();
    cleanupCurrentGimmick();
    isPlaying = true;
    isResolvingLock = false;
    const urgentOverlay = document.getElementById('urgent-countdown-overlay');
    if (urgentOverlay) urgentOverlay.classList.remove('active');

    if (gimmickContainer) {
      gimmickContainer.style.pointerEvents = 'auto';
    }
    remainingTime = 18.0;
    score = 0;
    unlockedCountNum = 0;
    warningBeepTimer = 0;
    roundNumber = 1;
    comboCount = 0;
    lastUnlockTime = 0;
    if (dangerVignette) dangerVignette.classList.remove('active-danger');
    if (confettiRainInterval) {
      clearInterval(confettiRainInterval);
      confettiRainInterval = null;
    }

    scoreDisplay.textContent = '0';
    unlockedCount.textContent = '0';
    timeDisplay.textContent = '18.0';
    timeDisplay.parentElement.classList.remove('timer-danger');

    startOverlay.classList.remove('active');
    resultOverlay.classList.remove('active');

    lockQueue = buildRoundQueue(1);
    currentLock = getNextLockFromQueue();
    nextLock = getNextLockFromQueue();

    renderGimmick(currentLock);
    const nextBadge = document.getElementById('next-lock-badge');
    if (nextBadge) nextBadge.textContent = `NEXT: Lv.${nextLock.level}`;

    startTimer();
  }

  function endGame() {
    isPlaying = false;
    cleanupCurrentGimmick();
    clearInterval(timerInterval);
    if (dangerVignette) dangerVignette.classList.remove('active-danger');
    const urgentOverlay = document.getElementById('urgent-countdown-overlay');
    if (urgentOverlay) urgentOverlay.classList.remove('active');

    // 1. 時間切れのピッピー！ホイッスル
    playSound('whistle_finish');

    // 2. 画面中央に FINISH! バナーをドカンと表示
    const finishOverlay = document.getElementById('finish-banner-overlay');
    if (finishOverlay) finishOverlay.classList.add('active');

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pop_lock_high', highScore);
    }

    const nextRankEl = document.getElementById('next-rank-info');
    const resultCardEl = document.getElementById('result-card');
    if (resultCardEl) resultCardEl.classList.remove('rank-s-card');

    let rank = 'C';
    if (score >= 4000) {
      rank = 'S';
      if (nextRankEl) {
        nextRankEl.textContent = '★ MAX RANK 達成! ★';
        nextRankEl.className = 'next-rank-info max-rank';
      }
      if (resultCardEl) resultCardEl.classList.add('rank-s-card');
    } else if (score >= 2500) {
      rank = 'A';
      const diff = 4000 - score;
      if (nextRankEl) {
        nextRankEl.textContent = `次のランク(S)まで あと ${diff.toLocaleString()} pt`;
        nextRankEl.className = 'next-rank-info';
      }
    } else if (score >= 1200) {
      rank = 'B';
      const diff = 2500 - score;
      if (nextRankEl) {
        nextRankEl.textContent = `次のランク(A)まで あと ${diff.toLocaleString()} pt`;
        nextRankEl.className = 'next-rank-info';
      }
    } else {
      rank = 'C';
      const diff = 1200 - score;
      if (nextRankEl) {
        nextRankEl.textContent = `次のランク(B)まで あと ${diff.toLocaleString()} pt`;
        nextRankEl.className = 'next-rank-info';
      }
    }

    rankBadgeEl.textContent = `RANK ${rank}`;
    if (rank === 'S') {
      rankBadgeEl.className = 'rank-badge rank-s-rainbow';
      rankBadgeEl.style.background = '';
    } else {
      rankBadgeEl.className = 'rank-badge';
      if (rank === 'A') rankBadgeEl.style.background = '#2ed573';
      else if (rank === 'B') rankBadgeEl.style.background = '#1e90ff';
      else rankBadgeEl.style.background = '#a4b0be';
    }

    const resultComment = document.getElementById('result-title-comment');
    if (resultComment) resultComment.textContent = ''; // 絵文字削除

    finalScoreEl.textContent = score;
    finalLocksEl.textContent = unlockedCountNum;
    highScoreEl.textContent = highScore;

    // 3. FINISH! バナー表示後 (1.1秒後) にリザルト画面を表示
    setTimeout(() => {
      if (finishOverlay) finishOverlay.classList.remove('active');
      resultOverlay.classList.add('active');
      if (rank === 'S') {
        startConfettiRain(5000); // Rank S 時に画面全体に紙吹雪を降らせる
      }
    }, 1100);
  }

  // Reliable touch & click handling for action buttons
  function setupActionButton(btn, callback) {
    if (!btn) return;
    let isProcessing = false;

    function handleAction(e) {
      if (e) {
        e.stopPropagation();
      }
      if (isProcessing) return;
      isProcessing = true;
      setTimeout(() => { isProcessing = false; }, 350);
      callback();
    }

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleAction(e);
    }, { passive: false });
    btn.addEventListener('click', handleAction);
  }

  // 長押しカウントダウン START ボタン (PointerEvents完全追跡 & 3, 2, 1 ➔ START)
  function setupHoldToStart(btn) {
    if (!btn) return;

    const progressFill = document.getElementById('hold-progress-fill');
    const countdownNum = document.getElementById('hold-countdown-num');

    let isHolding = false;
    let holdStartTime = 0;
    let holdAnimId = null;
    let currentStep = 3;
    const TOTAL_HOLD_MS = 1400; // 合計1.4秒 (各ステップ約460ms)

    function playBeep(step) {
      if (!soundEnabled || !audioCtx) return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        // step 3: 440Hz, step 2: 587Hz, step 1: 784Hz
        const freqs = { 3: 440, 2: 587, 1: 784 };
        osc.frequency.setValueAtTime(freqs[step] || 500, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }

    function cancelHold() {
      if (!isHolding) return;
      isHolding = false;
      if (holdAnimId) {
        cancelAnimationFrame(holdAnimId);
        holdAnimId = null;
      }
      btn.classList.remove('is-holding');
      if (progressFill) progressFill.style.width = '0%';
      currentStep = 3;
    }

    function startHold(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
        if (btn.setPointerCapture && e.pointerId !== undefined) {
          try { btn.setPointerCapture(e.pointerId); } catch (err) {}
        }
      }
      if (isHolding) return;
      initAudio();

      isHolding = true;
      holdStartTime = performance.now();
      currentStep = 3;

      btn.classList.add('is-holding');
      if (countdownNum) {
        countdownNum.textContent = '3';
        countdownNum.style.animation = 'none';
        void countdownNum.offsetWidth;
        countdownNum.style.animation = 'count-pop 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards';
      }

      playBeep(3);
      if (navigator.vibrate) { try { navigator.vibrate(25); } catch (err) {} }

      function loop(now) {
        if (!isHolding) return;
        const elapsed = now - holdStartTime;
        const progress = Math.min(1, elapsed / TOTAL_HOLD_MS);

        if (progressFill) {
          progressFill.style.width = (progress * 100) + '%';
        }

        // カウントダウン遷移
        if (progress >= 0.66 && currentStep > 1) {
          currentStep = 1;
          if (countdownNum) {
            countdownNum.textContent = '1';
            countdownNum.style.animation = 'none';
            void countdownNum.offsetWidth;
            countdownNum.style.animation = 'count-pop 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards';
          }
          playBeep(1);
          if (navigator.vibrate) { try { navigator.vibrate(35); } catch (err) {} }
        } else if (progress >= 0.33 && currentStep > 2) {
          currentStep = 2;
          if (countdownNum) {
            countdownNum.textContent = '2';
            countdownNum.style.animation = 'none';
            void countdownNum.offsetWidth;
            countdownNum.style.animation = 'count-pop 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards';
          }
          playBeep(2);
          if (navigator.vibrate) { try { navigator.vibrate(30); } catch (err) {} }
        }

        if (elapsed >= TOTAL_HOLD_MS) {
          // 長押し完了！ START!
          cancelHold();
          playSound('unlock');
          startGame();
          return;
        }

        holdAnimId = requestAnimationFrame(loop);
      }

      holdAnimId = requestAnimationFrame(loop);
    }

    // Modern PointerEvents API (あらゆるタッチ・クリックを確実に捕捉)
    btn.addEventListener('pointerdown', startHold);
    btn.addEventListener('pointerup', cancelHold);
    btn.addEventListener('pointercancel', cancelHold);

    // フォールバック
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(e); }, { passive: false });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); cancelHold(); });
    btn.addEventListener('mousedown', startHold);
    btn.addEventListener('mouseup', cancelHold);
    btn.addEventListener('mouseleave', cancelHold);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setupHoldToStart(startBtn);
  setupActionButton(retryBtn, () => {
    resultOverlay.classList.remove('active');
    startOverlay.classList.add('active');
    cleanupCurrentGimmick();
  });

  // 🛠️ DEBUG MODE CONTROLS
  const debugBtn = document.getElementById('debug-btn');
  const startDebugBtn = document.getElementById('start-debug-btn');
  const debugPanel = document.getElementById('debug-panel');
  const debugCloseBtn = document.getElementById('debug-close-btn');
  const debugLevelSelect = document.getElementById('debug-level-select');
  const debugJumpBtn = document.getElementById('debug-jump-btn');
  const debugPassBtn = document.getElementById('debug-pass-btn');
  const debugFreezeBtn = document.getElementById('debug-freeze-btn');
  const debugAddTimeBtn = document.getElementById('debug-add-time-btn');
  const debugGameoverBtn = document.getElementById('debug-gameover-btn');

  function populateDebugSelect() {
    if (!debugLevelSelect) return;
    debugLevelSelect.innerHTML = '';
    LOCK_DEFINITIONS.forEach((def) => {
      const opt = document.createElement('option');
      opt.value = def.level;
      opt.textContent = `Lv.${def.level} ${def.type}`;
      debugLevelSelect.appendChild(opt);
    });
  }
  populateDebugSelect();

  function toggleDebug() {
    if (!debugPanel) return;
    debugPanel.classList.toggle('active');
  }

  setupActionButton(debugBtn, toggleDebug);
  setupActionButton(startDebugBtn, toggleDebug);
  setupActionButton(debugCloseBtn, toggleDebug);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      toggleDebug();
    }
  });

  if (new URLSearchParams(window.location.search).has('debug')) {
    toggleDebug();
  }

  setupActionButton(debugJumpBtn, () => {
    initAudio();
    const targetLevel = parseInt(debugLevelSelect.value, 10);
    const targetDef = LOCK_DEFINITIONS.find(d => d.level === targetLevel);
    if (!targetDef) return;

    if (!isPlaying) {
      startGame();
    }

    currentLock = {
      ...targetDef,
      round: 1,
      points: targetDef.basePoints
    };
    renderGimmick(currentLock);
    playSound('tap');
  });

  setupActionButton(debugPassBtn, () => {
    if (!isPlaying) return;
    resolveLockSuccess();
  });

  setupActionButton(debugFreezeBtn, () => {
    isTimeFrozen = !isTimeFrozen;
    if (isTimeFrozen) {
      debugFreezeBtn.textContent = 'FROZEN';
      debugFreezeBtn.classList.add('frozen');
    } else {
      debugFreezeBtn.textContent = 'FREEZE';
      debugFreezeBtn.classList.remove('frozen');
    }
  });

  setupActionButton(debugAddTimeBtn, () => {
    remainingTime += 10.0;
    timeDisplay.textContent = remainingTime.toFixed(1);
    timeAddedAnim.textContent = '+10s';
    timeAddedAnim.classList.remove('animate');
    void timeAddedAnim.offsetWidth;
    timeAddedAnim.classList.add('animate');
    setTimeout(() => { timeAddedAnim.textContent = '+1.0s'; }, 700);
    playSound('unlock');
  });

  setupActionButton(debugGameoverBtn, () => {
    if (!isPlaying) return;
    endGame();
  });
});
