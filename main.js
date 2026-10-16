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
  const currentShackle = document.getElementById('current-shackle');
  const gimmickContainer = document.getElementById('gimmick-container');
  const nextGimmickContainer = document.getElementById('next-gimmick-container');
  const nextLockBadge = document.getElementById('next-lock-badge');

  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');
  const resultOverlay = document.getElementById('result-overlay');
  const retryBtn = document.getElementById('retry-btn');
  const finalScoreEl = document.getElementById('final-score');
  const finalLocksEl = document.getElementById('final-locks');
  const highScoreEl = document.getElementById('high-score');
  const rankBadgeEl = document.getElementById('result-rank-badge');

  // 軽量モード (透過なし・奥の鍵非表示・解錠背景演出とパーティクル無効)
  const liteModeCheckbox = document.getElementById('lite-mode-toggle');
  let isLiteMode = localStorage.getItem('lock_lite_mode') === 'true';

  function updateLiteModeState() {
    if (liteModeCheckbox) {
      liteModeCheckbox.checked = isLiteMode;
    }
    if (isLiteMode) {
      document.body.classList.add('lite-mode');
      const app = document.getElementById('game-app');
      if (app) app.classList.add('lite-mode');
    } else {
      document.body.classList.remove('lite-mode');
      const app = document.getElementById('game-app');
      if (app) app.classList.remove('lite-mode');
    }
  }

  if (liteModeCheckbox) {
    liteModeCheckbox.addEventListener('change', () => {
      isLiteMode = liteModeCheckbox.checked;
      localStorage.setItem('lock_lite_mode', isLiteMode ? 'true' : 'false');
      updateLiteModeState();
      playSound('tap');
    });
  }
  updateLiteModeState();

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
  let particleAnimId = null;

  function ensureParticleLoop() {
    if (!particleAnimId && particles.length > 0) {
      particleAnimId = requestAnimationFrame(updateParticles);
    }
  }

  function createBurst(x, y, count = 38) {
    if (isLiteMode) return;
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
    ensureParticleLoop();
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
        particles[i] = particles[particles.length - 1];
        particles.pop();
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
    if (particles.length > 0) {
      particleAnimId = requestAnimationFrame(updateParticles);
    } else {
      particleAnimId = null;
    }
  }

  // Rank S 達成時の紙吹雪シャワー
  let confettiRainInterval = null;
  function startConfettiRain(durationMs = 4500) {
    if (confettiRainInterval) clearInterval(confettiRainInterval);
    if (isLiteMode) return;
    const colors = ['#ff4757', '#2ed573', '#ffa502', '#1e90ff', '#ffd32a', '#9b59b6', '#ff007f', '#00d2d3'];
    const startTime = Date.now();

    confettiRainInterval = setInterval(() => {
      if (isLiteMode || Date.now() - startTime > durationMs) {
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
      ensureParticleLoop();
    }, 65);
  }

  // 安全な非同期・スロットル付き触覚振動 (Android Binder IPC同期停止・キュー溢れを完全防止)
  let lastVibrateTime = 0;
  function safeVibrate(duration = 16) {
    if (isLiteMode || !navigator.vibrate) return;
    const now = Date.now();
    if (now - lastVibrateTime < 90) return;
    lastVibrateTime = now;
    const ms = Array.isArray(duration) ? duration[0] : duration;
    setTimeout(() => {
      try {
        navigator.vibrate(Math.min(22, ms));
      } catch (e) {}
    }, 0);
  }

  // 強制同期レイアウト (void el.offsetWidth) を起こさずにGPUでアニメーションを高速再起動
  function restartCssAnimation(el, animClassName, keyframes, options) {
    if (!el) return;
    if (typeof el.animate === 'function' && keyframes) {
      try {
        el.animate(keyframes, options);
        return;
      } catch (err) {}
    }
    el.classList.remove(animClassName);
    requestAnimationFrame(() => {
      el.classList.add(animClassName);
    });
  }

  // Web Audio Synth (多層サウンド ＆ コンボピッチ上昇)
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function connectAndAutoClean(osc, gain) {
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }

  function playSound(type, combo = 1) {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const now = audioCtx.currentTime;

      if (type === 'tap') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        connectAndAutoClean(osc, gain);

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
        connectAndAutoClean(clickOsc, clickGain);
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
          connectAndAutoClean(osc, gain);
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
        connectAndAutoClean(osc, gain);
        osc.start(now);
        osc.stop(now + 0.2);

      } else if (type === 'warning') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        connectAndAutoClean(osc, gain);
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
        connectAndAutoClean(osc1, gain1);
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
        connectAndAutoClean(osc2, gain2);
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
  // Lv8: 実寸180x180判定完全一致の黒色チェックマークガイド
  const CHECK_MARK_SVG = `
    <svg viewBox="0 0 180 180" width="180" height="180" fill="none" stroke="#2f3542" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" style="display:block; opacity:0.32;">
      <polyline points="35 85 75 125 145 55"/>
    </svg>
  `;
  // Lv7: 統一デザインの左右カーブ矢印SVG
  const ARROW_CURVE_RIGHT_SVG = `
    <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor" style="display:block;">
      <path d="M19 9l-5-5v3C8.48 7 4 11.48 4 17c0 1.43.3 2.78.84 4 1.34-3.56 4.77-6 8.78-6h.38v3l5-5z"/>
    </svg>
  `;
  const ARROW_CURVE_LEFT_SVG = `
    <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor" style="display:block;">
      <path d="M5 9l5-5v3c5.52 0 10 4.48 10 9.5 0 1.43-.3 2.78-.84 4-1.34-3.56-4.77-6-8.78-6h-.38v3L5 9z"/>
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
    <svg viewBox="0 0 24 24" width="48" height="48" fill="#ffbe76" stroke="#2f3542" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
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

  // 2-B. UFO SVG (Lv21 精密ホバー高難易度用)
  const UFO_SVG = `
    <svg viewBox="0 0 36 36" width="34" height="34" style="display:block; overflow:visible;">
      <path d="M 11 18 A 7 7 0 0 1 25 18 Z" fill="#00d2d3" stroke="#2f3542" stroke-width="2.2" />
      <circle cx="18" cy="15" r="2" fill="#ffffff" />
      <ellipse cx="18" cy="20" rx="15" ry="6" fill="#ffd32a" stroke="#2f3542" stroke-width="2.5" />
      <circle cx="9" cy="20" r="1.5" fill="#ff4757" />
      <circle cx="18" cy="21.5" r="1.5" fill="#2ed573" />
      <circle cx="27" cy="20" r="1.5" fill="#1e90ff" />
      <polygon points="14,24.5 22,24.5 25,32 11,32" fill="rgba(0, 210, 211, 0.55)" stroke="#2f3542" stroke-width="1.2" stroke-dasharray="2 2" />
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

  const IRIRA_MAZE_TRACKS = [
    {
      path: "M 30 25 L 85 25 L 85 65 L 155 65 L 155 30 L 225 30 L 225 115",
      points: [
        { x: 30, y: 25 }, { x: 85, y: 25 }, { x: 85, y: 65 },
        { x: 155, y: 65 }, { x: 155, y: 30 }, { x: 225, y: 30 }, { x: 225, y: 115 }
      ],
      start: { x: 30, y: 25 },
      goal: { x: 225, y: 115 }
    },
    {
      path: "M 30 115 L 30 40 L 100 40 L 100 115 L 175 115 L 175 40 L 225 40",
      points: [
        { x: 30, y: 115 }, { x: 30, y: 40 }, { x: 100, y: 40 },
        { x: 100, y: 115 }, { x: 175, y: 115 }, { x: 175, y: 40 }, { x: 225, y: 40 }
      ],
      start: { x: 30, y: 115 },
      goal: { x: 225, y: 40 }
    },
    {
      path: "M 30 25 L 220 25 L 220 70 L 60 70 L 60 115 L 220 115",
      points: [
        { x: 30, y: 25 }, { x: 220, y: 25 }, { x: 220, y: 70 },
        { x: 60, y: 70 }, { x: 60, y: 115 }, { x: 220, y: 115 }
      ],
      start: { x: 30, y: 25 },
      goal: { x: 220, y: 115 }
    }
  ];

  // ギミックごとのランダム課題内容（混色色、鍵合わせ記号、ダイヤル初期値等）を生成・保持する関数
  function initLockGimmickState(lock) {
    if (!lock) return lock;
    if (lock._stateInitialized) return lock;
    lock._stateInitialized = true;

    if (lock.type === 'match_key') {
      const symbols = ['●', '▲', '★', '◆', '■', '✚'];
      const isSecondLap = (lock.round || roundNumber) >= 2;
      const targetCount = isSecondLap ? (Math.random() < 0.5 ? 2 : 3) : 1;
      const shuffledSyms = [...symbols].sort(() => Math.random() - 0.5);
      lock.matchKeyTargets = shuffledSyms.slice(0, targetCount);
      lock.matchKeyTarget = lock.matchKeyTargets[0];
      lock.matchKeyShuffled = [...symbols].sort(() => Math.random() - 0.5);
    } else if (lock.type === 'color_mix') {
      const recipes = [
        { name: '紫', color: '#9b59b6', ingredients: ['red', 'blue'] },
        { name: '緑', color: '#2ed573', ingredients: ['blue', 'yellow'] },
        { name: '橙', color: '#e67e22', ingredients: ['red', 'yellow'] }
      ];
      lock.colorMixRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    } else if (lock.type === 'dial_code') {
      const targetDigits = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10)
      ];
      lock.dialTargetDigits = targetDigits;

      const validDistributions = [
        [1, 2, 2], [2, 1, 2], [2, 2, 1], [3, 1, 1], [1, 3, 1], [1, 1, 3],
        [2, 2, 2], [1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]
      ];
      const chosenTaps = validDistributions[Math.floor(Math.random() * validDistributions.length)];
      lock.dialCurrentDigits = targetDigits.map((tgt, i) => (tgt - chosenTaps[i] + 10) % 10);
    } else if (lock.type === 'color_choice_2') {
      lock.colorChoiceIndex = Math.floor(Math.random() * 4);
    } else if (lock.type === 'slide_right') {
      const dirs = ['right', 'left', 'down', 'up'];
      lock.slideDir = dirs[Math.floor(Math.random() * dirs.length)];
    } else if (lock.type === 'crank_slide') {
      const variants = ['right_down', 'down_right', 'left_down', 'down_left'];
      lock.crankVariant = variants[Math.floor(Math.random() * variants.length)];
    } else if (lock.type === 'star_trace') {
      lock.starStartIndex = Math.floor(Math.random() * 5);
    } else if (lock.type === 'morse_code') {
      const patterns = [
        ['dot', 'dash', 'dot'],
        ['dot', 'dot', 'dash'],
        ['dash', 'dot', 'dot'],
        ['dash', 'dash', 'dot'],
        ['dash', 'dot', 'dash'],
        ['dot', 'dash', 'dash'],
        ['dot', 'dot', 'dot']
      ];
      lock.morsePattern = patterns[Math.floor(Math.random() * patterns.length)];
    } else if (lock.type === 'wheel_turn') {
      const isSecondLap = (lock.round || roundNumber) >= 2;
      lock.wheelTurnMultiplier = isSecondLap ? (0.5 + Math.random() * 1.0) : 1.0;
    } else if (lock.type === 'irira_key_maze') {
      lock.iriraTrackIndex = Math.floor(Math.random() * 3);
    }
    return lock;
  }

  function getNextLockFromQueue() {
    if (lockQueue.length === 0) {
      roundNumber++;
      lockQueue = buildRoundQueue(roundNumber);
    }
    const lock = lockQueue.shift();
    return initLockGimmickState(lock);
  }

  // Game Modes Definition
  const GAME_MODES = {
    normal: {
      id: 'normal',
      label: '通常モード',
      shortLabel: '通常',
      initialTime: 18.0,
      addTimeOnUnlock: 1.0,
      isCountUp: false,
      oneMistakeGameOver: false,
      targetScore: null,
      tutoRewardText: '+1.0s',
      storageHighKey: 'pop_lock_high',
      boardStorageKey: 'lock_mock_leaderboard'
    },
    fixed_1min: {
      id: 'fixed_1min',
      label: '1分固定時間モード',
      shortLabel: '1分固定',
      initialTime: 60.0,
      addTimeOnUnlock: 0.0,
      isCountUp: false,
      oneMistakeGameOver: false,
      targetScore: null,
      tutoRewardText: '60s固定',
      storageHighKey: 'pop_lock_high_fixed_1min',
      boardStorageKey: 'lock_mock_leaderboard_fixed_1min'
    },
    sudden_death: {
      id: 'sudden_death',
      label: '1ミス即終了モード',
      shortLabel: '1ミス終了',
      initialTime: 18.0,
      addTimeOnUnlock: 1.0,
      isCountUp: false,
      oneMistakeGameOver: true,
      targetScore: null,
      tutoRewardText: '1ミス終了',
      storageHighKey: 'pop_lock_high_sudden_death',
      boardStorageKey: 'lock_mock_leaderboard_sudden_death'
    },
    time_attack_5000: {
      id: 'time_attack_5000',
      label: '5000pt タイムアタック',
      shortLabel: '5000pt TA',
      initialTime: 0.0,
      addTimeOnUnlock: 0.0,
      isCountUp: true,
      oneMistakeGameOver: false,
      targetScore: 5000,
      tutoRewardText: '5000pt到達',
      storageHighKey: 'pop_lock_best_time_5000',
      boardStorageKey: 'lock_mock_leaderboard_time_attack_5000'
    }
  };

  const STORAGE_KEY_SECRET_UNLOCKED = 'pop_lock_secret_unlocked';

  // Game State
  let currentMode = 'normal';
  let hasPlayedOnceInSession = false;
  let hasUnlockedSecret = localStorage.getItem(STORAGE_KEY_SECRET_UNLOCKED) === '1';
  let isPlaying = false;
  let remainingTime = 18.0;
  let elapsedTime = 0.0;
  let score = 0;
  let unlockedCountNum = 0;
  let lastPlayedMode = 'normal';
  let lastPlayedScore = 0;
  let lastPlayedLocks = 0;
  let lastPlayedTimeMs = 0;
  let lastPlayedCleared = false;
  let highScore = parseInt(localStorage.getItem('pop_lock_high') || '0', 10);
  let timerInterval = null;
  let currentLock = null;
  let nextLock = null;
  let warningBeepTimer = 0;
  let activeAnimationId = null;
  let activeWindowListeners = [];
  let activeGimmickTimeouts = [];

  function getModeBestRecord(modeId) {
    const cfg = GAME_MODES[modeId] || GAME_MODES.normal;
    return parseInt(localStorage.getItem(cfg.storageHighKey) || '0', 10);
  }

  function setModeBestRecord(modeId, val) {
    const cfg = GAME_MODES[modeId] || GAME_MODES.normal;
    localStorage.setItem(cfg.storageHighKey, String(val));
    if (modeId === 'normal') {
      highScore = val;
    }
  }

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

  function addTrackedTimeout(fn, delay) {
    const id = setTimeout(() => {
      activeGimmickTimeouts = activeGimmickTimeouts.filter(t => t !== id);
      fn();
    }, delay);
    activeGimmickTimeouts.push(id);
    return id;
  }

  function cleanActiveTimeouts() {
    for (const id of activeGimmickTimeouts) {
      clearTimeout(id);
    }
    activeGimmickTimeouts = [];
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
    cleanActiveTimeouts();
    currentShackle.style.transform = '';
    gimmickContainer.innerHTML = '';
  }

  // Render 24 Non-Verbal Gimmicks
  function renderGimmick(lock) {
    window.__currentLock = lock;
    cleanupCurrentGimmick();
    lockLevelBadge.textContent = `Lv.${lock.level}`;
    currentShackle.classList.remove('open');

    // 1. 特大ボタン (一撃タップ)
    if (lock.type === 'giant_button') {
      const btn = document.createElement('button');
      btn.className = 'giant-action-btn';
      btn.textContent = '';
      btn.style.letterSpacing = '2px';
      btn.addEventListener('click', () => {
        if (isPaused || isResolvingLock) return;
        playSound('tap');
        resolveLockSuccess();
      });
      gimmickContainer.appendChild(btn);

    // 2. レバースイッチ (Lv2)
    } else if (lock.type === 'switch_slide') {
      const frame = document.createElement('div');
      frame.className = 'lever-switch-frame';

      const labels = document.createElement('div');
      labels.className = 'lever-labels-row';
      labels.innerHTML = '<span>OFF</span><span>ON</span>';

      const slot = document.createElement('div');
      slot.className = 'lever-slot-cutout';

      const pivot = document.createElement('div');
      pivot.className = 'lever-pivot-base';

      const arm = document.createElement('div');
      arm.className = 'lever-arm-actor';
      arm.innerHTML = `
        <div class="lever-metal-rod"></div>
        <div class="lever-handle-ball"></div>
      `;

      frame.appendChild(labels);
      frame.appendChild(slot);
      frame.appendChild(pivot);
      frame.appendChild(arm);
      gimmickContainer.appendChild(frame);

      let isFlipped = false;
      let isDragging = false;
      let startX = 0;

      function flipOn() {
        if (isFlipped || isPaused || isResolvingLock) return;
        isFlipped = true;
        isDragging = false;
        frame.classList.add('is-on');
        playSound('unlock');
        addTrackedTimeout(() => resolveLockSuccess(), 120);
      }

      function onPointerDown(e) {
        if (isFlipped || isPaused || isResolvingLock) return;
        isDragging = true;
        const pt = e.touches ? e.touches[0] : e;
        startX = pt.clientX;
      }

      function onPointerMove(e) {
        if (isFlipped || !isDragging || isPaused || isResolvingLock) return;
        const pt = e.touches ? e.touches[0] : e;
        if (pt.clientX - startX >= 35) {
          flipOn();
        }
      }

      function onPointerUp(e) {
        if (isFlipped || !isDragging) return;
        isDragging = false;
        if (isPaused || isResolvingLock) return;
        const pt = e.changedTouches ? e.changedTouches[0] : e;
        if (pt.clientX - startX >= 35) {
          flipOn();
        }
      }

      frame.addEventListener('pointerdown', onPointerDown);
      addTrackedListener(window, 'pointermove', onPointerMove);
      addTrackedListener(window, 'pointerup', onPointerUp);

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

      // 鍵の初期位置をランダム配置（鍵穴から近すぎない位置を保証）
      const cRect = container.getBoundingClientRect();
      const holeRect = targetHole.getBoundingClientRect();
      const cWidth = cRect.width > 0 ? cRect.width : (container.offsetWidth || 280);
      const cHeight = cRect.height > 0 ? cRect.height : (container.offsetHeight || 190);
      const hCenterX = holeRect.width > 0 && cRect.width > 0
        ? (holeRect.left + holeRect.width / 2 - cRect.left)
        : (cWidth / 2);
      const hCenterY = holeRect.height > 0 && cRect.height > 0
        ? (holeRect.top + holeRect.height / 2 - cRect.top)
        : 42;

      let initX = Math.round((cWidth - 64) / 2);
      let initY = Math.round(cHeight - 64 - 12);

      const minX = 12;
      const maxX = Math.max(minX, cWidth - 64 - 12);
      const minY = 12;
      const maxY = Math.max(minY, cHeight - 64 - 12);

      for (let attempt = 0; attempt < 50; attempt++) {
        const testX = Math.floor(minX + Math.random() * (maxX - minX));
        const testY = Math.floor(minY + Math.random() * (maxY - minY));
        const testCenterX = testX + 32;
        const testCenterY = testY + 32;
        const d = Math.hypot(testCenterX - hCenterX, testCenterY - hCenterY);
        if (d >= 90) {
          initX = testX;
          initY = testY;
          break;
        }
      }

      keyItem.style.position = 'absolute';
      keyItem.style.left = `${initX}px`;
      keyItem.style.top = `${initY}px`;
      keyItem.style.bottom = 'auto';

      let isDragging = false;
      let startMouseY = 0;
      let startMouseX = 0;

      function onStart(e) {
        if (isPaused || isResolvingLock) return;
        isDragging = true;
        playSound('tap');
        const point = e.touches ? e.touches[0] : e;
        startMouseX = point.clientX;
        startMouseY = point.clientY;
      }
      function onMove(e) {
        if (!isDragging || isPaused || isResolvingLock) return;
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
        if (isPaused || isResolvingLock) return;
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
      let tapResetTimer = null;

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

      function handleDoubleTap(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isPaused || isResolvingLock) return;
        playSound('tap');

        if (currentTaps === 0) {
          currentTaps = 1;
          dots[0].classList.add('active');
          if (tapResetTimer) clearTimeout(tapResetTimer);
          // 1回押し後、判定が途切れた場合は0点灯に戻す (480ms)
          tapResetTimer = addTrackedTimeout(() => {
            currentTaps = 0;
            dots[0].classList.remove('active');
            dots[1].classList.remove('active');
          }, 480);
        } else if (currentTaps === 1) {
          if (tapResetTimer) clearTimeout(tapResetTimer);
          currentTaps = 2;
          dots[1].classList.add('active');
          addTrackedTimeout(() => resolveLockSuccess(), 80);
        }
      }

      btn.addEventListener('pointerdown', handleDoubleTap);
      btn.addEventListener('click', (e) => e.preventDefault());
      gimmickContainer.appendChild(wrapper);

    // 5. 直線スライド (4方向ランダム: 右, 左, 下, 上)
    } else if (lock.type === 'slide_right') {
      const dir = lock.slideDir || 'right';
      const isVertical = (dir === 'down' || dir === 'up');

      const track = document.createElement('div');
      track.className = isVertical ? 'slider-vertical' : 'slider-horizontal';

      const arrows = document.createElement('div');
      arrows.className = isVertical ? 'slider-arrows-v-bg' : 'slider-arrows-bg';
      if (dir === 'right') arrows.textContent = '▶ ▶ ▶';
      else if (dir === 'left') arrows.textContent = '◀ ◀ ◀';
      else if (dir === 'down') arrows.innerHTML = '<span>▼</span><span>▼</span><span>▼</span>';
      else if (dir === 'up') arrows.innerHTML = '<span>▲</span><span>▲</span><span>▲</span>';

      const goal = document.createElement('div');
      goal.className = isVertical
        ? (dir === 'down' ? 'slider-goal-v bottom' : 'slider-goal-v top')
        : (dir === 'right' ? 'slider-goal-h right' : 'slider-goal-h left');

      const knob = document.createElement('div');
      knob.className = isVertical ? 'slider-knob-v' : 'slider-knob-h';
      knob.style.fontSize = '1.3rem';

      if (dir === 'right') {
        knob.style.left = '6px';
        knob.textContent = '▶';
      } else if (dir === 'left') {
        knob.style.left = '165px';
        knob.textContent = '◀';
      } else if (dir === 'down') {
        knob.style.top = '6px';
        knob.textContent = '▼';
      } else if (dir === 'up') {
        knob.style.top = '100px';
        knob.textContent = '▲';
      }

      track.appendChild(arrows);
      track.appendChild(goal);
      track.appendChild(knob);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      function onStart() {
        if (isPaused || isResolvingLock) return;
        isDragging = true;
        playSound('tap');
      }
      function onMove(e) {
        if (!isDragging || isPaused || isResolvingLock) return;
        const cur = e.touches ? e.touches[0] : e;
        const rect = track.getBoundingClientRect();

        if (!isVertical) {
          const maxDist = rect.width - 66;
          let diff = Math.max(6, Math.min(maxDist, cur.clientX - rect.left - 27));
          knob.style.left = diff + 'px';
          if (dir === 'right' && diff >= maxDist - 8) {
            isDragging = false;
            resolveLockSuccess();
          } else if (dir === 'left' && diff <= 14) {
            isDragging = false;
            resolveLockSuccess();
          }
        } else {
          const maxDistY = rect.height - 64;
          let diffY = Math.max(6, Math.min(maxDistY, cur.clientY - rect.top - 26));
          knob.style.top = diffY + 'px';
          if (dir === 'down' && diffY >= maxDistY - 8) {
            isDragging = false;
            resolveLockSuccess();
          } else if (dir === 'up' && diffY <= 14) {
            isDragging = false;
            resolveLockSuccess();
          }
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          if (isPaused || isResolvingLock) return;
          if (dir === 'right') knob.style.left = '6px';
          else if (dir === 'left') knob.style.left = '165px';
          else if (dir === 'down') knob.style.top = '6px';
          else if (dir === 'up') knob.style.top = '100px';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: true });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 6. カクカクっと2回スライド (4種類のL字バリエーション & 精密ゴール)
    } else if (lock.type === 'crank_slide') {
      const vKey = lock.crankVariant || 'right_down';
      const variantDefs = {
        right_down: {
          path: "M 38 38 L 118 38 L 118 132",
          start: { x: 18, y: 18, text: '▶' },
          turn: { text: '▼' },
          goal: { x: 118, y: 132 },
          isStep0Horiz: true,
          step0Check: (x) => x >= 94,
          step1Check: (y) => y >= 106,
          clamp0: (v) => Math.max(18, Math.min(98, v)),
          clamp1: (v) => Math.max(18, Math.min(112, v)),
        },
        down_right: {
          path: "M 38 38 L 38 132 L 118 132",
          start: { x: 18, y: 18, text: '▼' },
          turn: { text: '▶' },
          goal: { x: 118, y: 132 },
          isStep0Horiz: false,
          step0Check: (y) => y >= 106,
          step1Check: (x) => x >= 94,
          clamp0: (v) => Math.max(18, Math.min(112, v)),
          clamp1: (v) => Math.max(18, Math.min(98, v)),
        },
        left_down: {
          path: "M 118 38 L 38 38 L 38 132",
          start: { x: 98, y: 18, text: '◀' },
          turn: { text: '▼' },
          goal: { x: 38, y: 132 },
          isStep0Horiz: true,
          step0Check: (x) => x <= 22,
          step1Check: (y) => y >= 106,
          clamp0: (v) => Math.max(18, Math.min(98, v)),
          clamp1: (v) => Math.max(18, Math.min(112, v)),
        },
        down_left: {
          path: "M 118 38 L 118 132 L 38 132",
          start: { x: 98, y: 18, text: '▼' },
          turn: { text: '◀' },
          goal: { x: 38, y: 132 },
          isStep0Horiz: false,
          step0Check: (y) => y >= 106,
          step1Check: (x) => x <= 22,
          clamp0: (v) => Math.max(18, Math.min(112, v)),
          clamp1: (v) => Math.max(18, Math.min(98, v)),
        }
      };
      const v = variantDefs[vKey] || variantDefs.right_down;

      const area = document.createElement('div');
      area.className = 'crank-slider-area';

      area.innerHTML = `
        <svg class="crank-slot-svg" viewBox="0 0 170 170">
          <path d="${v.path}" fill="none" stroke="var(--text-dark)" stroke-width="48" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${v.path}" fill="none" stroke="#f1f2f6" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${v.path}" fill="none" stroke="rgba(0, 0, 0, 0.08)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;

      const goal = document.createElement('div');
      goal.className = 'crank-goal';
      goal.textContent = '★';
      goal.style.left = v.goal.x + 'px';
      goal.style.top = v.goal.y + 'px';

      const knob = document.createElement('div');
      knob.className = 'crank-knob';
      knob.textContent = v.start.text;
      knob.style.left = v.start.x + 'px';
      knob.style.top = v.start.y + 'px';

      area.appendChild(goal);
      area.appendChild(knob);
      gimmickContainer.appendChild(area);

      let step = 0;
      let isDragging = false;

      function onStart() {
        if (isPaused || isResolvingLock) return;
        isDragging = true;
        playSound('tap');
      }
      function onMove(e) {
        if (!isDragging || isPaused || isResolvingLock) return;
        const cur = e.touches ? e.touches[0] : e;
        const rect = area.getBoundingClientRect();
        const relX = cur.clientX - rect.left - 20;
        const relY = cur.clientY - rect.top - 20;

        if (step === 0) {
          if (v.isStep0Horiz) {
            let x = v.clamp0(relX);
            knob.style.left = x + 'px';
            if (v.step0Check(x)) {
              step = 1;
              knob.textContent = v.turn.text;
              playSound('tap');
            }
          } else {
            let y = v.clamp0(relY);
            knob.style.top = y + 'px';
            if (v.step0Check(y)) {
              step = 1;
              knob.textContent = v.turn.text;
              playSound('tap');
            }
          }
        } else if (step === 1) {
          if (v.isStep0Horiz) {
            let y = v.clamp1(relY);
            knob.style.top = y + 'px';
            if (v.step1Check(y)) {
              isDragging = false;
              resolveLockSuccess();
            }
          } else {
            let x = v.clamp1(relX);
            knob.style.left = x + 'px';
            if (v.step1Check(x)) {
              isDragging = false;
              resolveLockSuccess();
            }
          }
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          if (isPaused || isResolvingLock) return;
          step = 0;
          knob.style.left = v.start.x + 'px';
          knob.style.top = v.start.y + 'px';
          knob.textContent = v.start.text;
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
      turnIndicator.innerHTML = ARROW_CURVE_RIGHT_SVG;
      turnIndicator.style.color = '#1e90ff';
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
        if (isPaused || isResolvingLock) return;
        isDragging = true;
        playSound('tap');
      }

      function onMove(e) {
        if (!isDragging || isPaused || isResolvingLock) return;
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
            turnIndicator.innerHTML = ARROW_CURVE_LEFT_SVG;
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
          if (isPaused || isResolvingLock) return;
          phase = 0;
          knob.style.background = 'var(--primary-accent)';
          turnIndicator.innerHTML = ARROW_CURVE_RIGHT_SVG;
          turnIndicator.style.color = '#1e90ff';
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
        if (isPaused || isResolvingLock) return;
        isDrawing = true;
        strokePoints = [];
        const pt = e.touches ? e.touches[0] : e;
        const rect = gCanvas.getBoundingClientRect();
        strokePoints.push({ x: pt.clientX - rect.left, y: pt.clientY - rect.top });
        gCtx.clearRect(0, 0, 180, 180);
      }
      function moveDraw(e) {
        if (!isDrawing || isPaused || isResolvingLock) return;
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
        if (isPaused || isResolvingLock) return;
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

      const targets = lock.matchKeyTargets || (lock.matchKeyTarget ? [lock.matchKeyTarget] : ['★']);
      const count = targets.length;

      const targetWrap = document.createElement('div');
      targetWrap.className = `key-match-targets-wrap targets-${count}`;

      const targetEls = [];
      targets.forEach(sym => {
        const hole = document.createElement('div');
        hole.className = `key-match-hole-target target-size-${count}`;
        hole.textContent = sym;
        hole.dataset.sym = sym;
        targetWrap.appendChild(hole);
        targetEls.push({ sym, el: hole, cleared: false });
      });
      stage.appendChild(targetWrap);

      const grid = document.createElement('div');
      grid.className = 'key-choices-grid-6';

      const shuffled = lock.matchKeyShuffled || ['●', '▲', '★', '◆', '■', '✚'];
      shuffled.forEach(sym => {
        const item = document.createElement('button');
        item.className = 'key-choice-gold-btn';
        item.textContent = sym;
        setupActionButton(item, () => {
          if (isPaused || isResolvingLock) return;
          const matchTarget = targetEls.find(t => t.sym === sym && !t.cleared);
          if (matchTarget) {
            matchTarget.cleared = true;
            matchTarget.el.classList.add('cleared');
            matchTarget.el.textContent = '✔';
            playSound('tap');
            item.classList.add('selected-gold');

            if (targetEls.every(t => t.cleared)) {
              resolveLockSuccess();
            }
          } else {
            triggerMistake();
            // 間違えた場合はリセットしてやり直し
            targetEls.forEach(t => {
              t.cleared = false;
              t.el.classList.remove('cleared');
              t.el.textContent = t.sym;
            });
            grid.querySelectorAll('.key-choice-gold-btn').forEach(btn => {
              btn.classList.remove('selected-gold');
            });
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
      const targetRecipe = lock.colorMixRecipe || recipes[Math.floor(Math.random() * recipes.length)];
      lock.colorMixRecipe = targetRecipe;

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
        { key: 'yellow', hex: '#ffd32a' }
      ];

      let selectedColors = [];
      let isEvaluating = false;

      function getBlendedColor(c1, c2) {
        if ((c1 === 'red' && c2 === 'blue') || (c1 === 'blue' && c2 === 'red')) return '#9b59b6';
        if ((c1 === 'blue' && c2 === 'yellow') || (c1 === 'yellow' && c2 === 'blue')) return '#2ed573';
        if ((c1 === 'red' && c2 === 'yellow') || (c1 === 'yellow' && c2 === 'red')) return '#e67e22';
        return c1 === 'red' ? '#ff4757' : (c1 === 'blue' ? '#1e90ff' : '#ffd32a');
      }

      colorDefs.forEach(def => {
        const btn = document.createElement('button');
        btn.className = 'color-mix-pill-btn';
        btn.style.background = def.hex;
        btn.addEventListener('click', () => {
          if (isEvaluating || isPaused || isResolvingLock) return;
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
              addTrackedTimeout(() => {
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

      const isSecondLap = (lock.round || roundNumber) >= 2;
      if (isSecondLap) {
        btn.classList.add('is-moving');
      }

      function handleMash(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isPaused || isResolvingLock) return;
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

      function onStart(e) {
        if (isPaused || isResolvingLock) return;
        e.preventDefault();
        isThrusting = true;
        playSound('tap');
      }
      function onEnd() {
        if (!isThrusting) return;
        isThrusting = false;
      }

      thrustBtn.addEventListener('mousedown', onStart);
      thrustBtn.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

      let lastHoverTime = performance.now();

      function hoverPhysics(nowTimestamp) {
        if (!isPlaying || currentLock !== lock) return;
        const now = nowTimestamp || performance.now();
        if (isPaused) {
          isThrusting = false;
          lastHoverTime = now;
          activeAnimationId = requestAnimationFrame(hoverPhysics);
          return;
        }

        const dt = Math.min(33.3, Math.max(2, now - lastHoverTime));
        lastHoverTime = now;
        const timeScale = dt / 16.667; // 60fps基準正規化

        if (isThrusting) velocity += 0.55 * timeScale;
        else velocity -= 0.35 * timeScale;

        velocity *= Math.pow(0.95, timeScale);
        altitude += velocity * timeScale;
        if (altitude < 8) { altitude = 8; velocity = 0; }
        if (altitude > 140) { altitude = 140; velocity = 0; }
        rocket.style.bottom = altitude + 'px';

        const r = rocket.getBoundingClientRect();
        const z = zone.getBoundingClientRect();
        const rCenter = r.top + r.height / 2;
        const isInside = (rCenter >= z.top && rCenter <= z.bottom);

        if (isInside) {
          zone.classList.add('active-in');
          insideTime += dt;
          const pct = Math.min(100, (insideTime / targetDuration) * 100);
          progressFill.style.width = pct + '%';

          if (insideTime >= targetDuration) {
            resolveLockSuccess();
            return;
          }
        } else {
          zone.classList.remove('active-in');
          insideTime = Math.max(0, insideTime - 12 * timeScale);
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

      const baseStarPoints = [
        { x: 95, y: 22 },   // 0: 上
        { x: 148, y: 165 }, // 1: 右下
        { x: 12, y: 74 },   // 2: 左
        { x: 178, y: 74 },  // 3: 右
        { x: 42, y: 165 }   // 4: 左下
      ];
      const startIdx = (lock.starStartIndex !== undefined) ? lock.starStartIndex : Math.floor(Math.random() * 5);
      lock.starStartIndex = startIdx;

      const starPoints = [];
      for (let i = 0; i <= 5; i++) {
        starPoints.push(baseStarPoints[(startIdx + i) % 5]);
      }

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
        if (isPaused || isResolvingLock) return;
        isDragging = true;
        playSound('tap');
      }

      function onMove(e) {
        if (!isDragging || isPaused || isResolvingLock) return;
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
            addTrackedTimeout(() => resolveLockSuccess(), 120);
          } else {
            const nextMarkerIdx = (targetPtIdx < 5) ? targetPtIdx : 0;
            markerEls[nextMarkerIdx].classList.add('active-target');
          }
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          if (isPaused || isResolvingLock) return;
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

    // 15. ダイヤル式のカギ (5〜6回固定タップ & ランダム目標値)
    } else if (lock.type === 'dial_code') {
      const stage = document.createElement('div');
      stage.className = 'dial-lock-stage';

      const targetDigits = lock.dialTargetDigits || [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10)
      ];
      lock.dialTargetDigits = targetDigits;

      const codeLabel = document.createElement('div');
      codeLabel.className = 'dial-lock-target-code';
      codeLabel.textContent = targetDigits.join(' ');

      const row = document.createElement('div');
      row.className = 'dial-wheels-row';

      let currentDigits;
      if (lock.dialCurrentDigits) {
        currentDigits = [...lock.dialCurrentDigits];
      } else {
        const validDistributions = [
          [1, 2, 2], [2, 1, 2], [2, 2, 1], [3, 1, 1], [1, 3, 1], [1, 1, 3],
          [2, 2, 2], [1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]
        ];
        const chosenTaps = validDistributions[Math.floor(Math.random() * validDistributions.length)];
        currentDigits = targetDigits.map((tgt, i) => (tgt - chosenTaps[i] + 10) % 10);
        lock.dialCurrentDigits = [...currentDigits];
      }

      let isCleared = false;

      currentDigits.forEach((val, idx) => {
        const wheel = document.createElement('div');
        wheel.className = 'dial-wheel';
        wheel.textContent = val;

        wheel.addEventListener('click', () => {
          if (isCleared || isPaused || isResolvingLock) return;
          playSound('tap');
          currentDigits[idx] = (currentDigits[idx] + 1) % 10;
          wheel.textContent = currentDigits[idx];

          if (currentDigits.every((d, i) => d === targetDigits[i])) {
            isCleared = true;
            addTrackedTimeout(() => resolveLockSuccess(), 120);
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
        if (!isPlaying || currentLock !== lock) return;
        if (isPaused) {
          activeAnimationId = requestAnimationFrame(bounceAnim);
          return;
        }
        const maxX = Math.max(40, (box.clientWidth || 268) - 58);
        const maxY = Math.max(40, (box.clientHeight || 175) - 58);
        x += vx;
        y += vy;
        if (x <= 8) {
          x = 8;
          vx = Math.abs(vx);
        } else if (x >= maxX) {
          x = maxX;
          vx = -Math.abs(vx);
        }
        if (y <= 8) {
          y = 8;
          vy = Math.abs(vy);
        } else if (y >= maxY) {
          y = maxY;
          vy = -Math.abs(vy);
        }
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        activeAnimationId = requestAnimationFrame(bounceAnim);
      }
      activeAnimationId = requestAnimationFrame(bounceAnim);

      btn.addEventListener('click', () => {
        if (isPaused || isResolvingLock) return;
        playSound('tap');
        resolveLockSuccess();
      });

    // 17. モールス信号打つ奴 (トン・ツー・トン バリエーション)
    } else if (lock.type === 'morse_code') {
      const stage = document.createElement('div');
      stage.className = 'morse-stage';

      const targetPattern = lock.morsePattern || ['dot', 'dash', 'dot'];
      let currentIdx = 0;

      const display = document.createElement('div');
      display.className = 'morse-target-display';
      targetPattern.forEach(item => {
        const s = document.createElement('span');
        s.className = 'morse-symbol';
        s.textContent = (item === 'dash' ? '━' : '・');
        display.appendChild(s);
      });

      const tapBtn = document.createElement('button');
      tapBtn.className = 'morse-tap-btn';
      tapBtn.textContent = '●';
      tapBtn.style.fontSize = '1.6rem';
      tapBtn.style.fontWeight = '900';
      tapBtn.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });

      let pressStart = 0;
      let isPressing = false;
      let longPressTimer = null;
      let hasHandledLongPress = false;

      function handleMorseInput(inputType) {
        if (isPaused || isResolvingLock) return;
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

      function onPressStart(e) {
        if (isPaused || isResolvingLock) return;
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        isPressing = true;
        hasHandledLongPress = false;
        pressStart = Date.now();
        playSound('tap');

        if (longPressTimer) clearTimeout(longPressTimer);
        // 260ms押し続けた瞬間に、指を離していなくても長押し（dash）として即座に入力！
        longPressTimer = setTimeout(() => {
          if (!isPressing || isPaused || isResolvingLock) return;
          hasHandledLongPress = true;
          safeVibrate(20);
          playSound('unlock');
          handleMorseInput('dash');
        }, 260);
      }

      function onPressEnd(e) {
        if (!isPressing) return;
        isPressing = false;
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        if (isPaused || isResolvingLock) return;
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        // 既に長押しとして確定入力済みなら何もしない
        if (hasHandledLongPress) return;

        // 短押し (dot) として判定
        handleMorseInput('dot');
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

      const baseTarget = Math.PI * 1.85;
      const mult = (lock.wheelTurnMultiplier !== undefined) ? lock.wheelTurnMultiplier : 1.0;
      const targetRotation = baseTarget * mult;

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
        if (isPaused || isResolvingLock) return;
        isDragging = true;
        lastAngle = getAngle(e);
        playSound('tap');
      }

      function onMove(e) {
        if (!isDragging || isPaused || isResolvingLock) return;
        const angle = getAngle(e);
        let delta = angle - lastAngle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;

        totalRotated += delta;
        currentDeg += (delta * 180 / Math.PI);
        rim.style.transform = `rotate(${currentDeg}deg)`;
        lastAngle = angle;

        const progress = Math.min(1, Math.abs(totalRotated) / targetRotation);
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
          addTrackedTimeout(() => resolveLockSuccess(), 120);
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          if (isPaused || isResolvingLock) return;
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
        if (isPaused || isResolvingLock) return;
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
        if (!isPlaying || currentLock !== lock) return;
        if (isPaused) {
          activeAnimationId = requestAnimationFrame(waitLoop);
          return;
        }
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

    // 20. カラー四択 (旧カラー二択: 赤・青・緑・黄)
    } else if (lock.type === 'color_choice_2') {
      const colors = [
        { key: 'red', hex: '#ff4757' },
        { key: 'blue', hex: '#1e90ff' },
        { key: 'green', hex: '#2ed573' },
        { key: 'yellow', hex: '#ffd32a' }
      ];
      const targetIndex = (lock.colorChoiceIndex !== undefined) ? lock.colorChoiceIndex : Math.floor(Math.random() * 4);
      lock.colorChoiceIndex = targetIndex;

      const wrap = document.createElement('div');
      wrap.className = 'color-match-wrap';

      const target = document.createElement('div');
      target.className = 'color-target-display';
      target.style.background = colors[targetIndex].hex;
      wrap.appendChild(target);

      const row = document.createElement('div');
      row.className = 'choice-row choice-row-4';
      colors.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.className = 'color-choice-btn';
        btn.style.background = c.hex;
        btn.addEventListener('click', () => {
          if (isPaused || isResolvingLock) return;
          if (idx === targetIndex) {
            playSound('tap');
            resolveLockSuccess();
          } else {
            triggerMistake();
          }
        });
        row.appendChild(btn);
      });
      wrap.appendChild(row);
      gimmickContainer.appendChild(wrap);

    // 21. イライラ棒！鍵迷路 (多回数カーブ ＆ ビリビリ放電エフェクト ＆ ベクターキー)
    } else if (lock.type === 'irira_key_maze') {
      const container = document.createElement('div');
      container.className = 'irira-maze-container';

      const trackIdx = (lock.iriraTrackIndex !== undefined) ? lock.iriraTrackIndex : Math.floor(Math.random() * 3);
      lock.iriraTrackIndex = trackIdx;
      const track = IRIRA_MAZE_TRACKS[trackIdx] || IRIRA_MAZE_TRACKS[0];

      const filterDef = isLiteMode ? '' : `
          <defs>
            <filter id="glow-shock" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>`;
      const filterAttr = isLiteMode ? '' : 'filter="url(#glow-shock)"';

      container.innerHTML = `
        <svg class="irira-maze-svg" viewBox="0 0 250 140">${filterDef}
          <path class="electric-zap-path electric-zap-glow" d="${track.path}" 
                fill="none" stroke="#ffa502" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" ${filterAttr} />
          <path d="${track.path}" 
                fill="none" stroke="#2f3542" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${track.path}" 
                fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;

      const goalHole = document.createElement('div');
      goalHole.className = 'irira-goal-hole';
      goalHole.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24" style="display:block;">
          <circle cx="12" cy="9" r="5.5" fill="#2ed573" />
          <polygon points="9.5,9.5 14.5,9.5 13.5,17 10.5,17" fill="#2ed573" />
        </svg>
      `;
      goalHole.style.left = (track.goal.x - 3) + 'px';
      goalHole.style.top = (track.goal.y - 3) + 'px';
      container.appendChild(goalHole);

      const keyDragger = document.createElement('div');
      keyDragger.className = 'irira-key-dragger';
      keyDragger.innerHTML = KEY_SVG;
      keyDragger.style.left = track.start.x + 'px';
      keyDragger.style.top = track.start.y + 'px';
      container.appendChild(keyDragger);

      gimmickContainer.appendChild(container);

      const points = track.points;
      lock.iriraPoints = points;

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
        if (isPaused || isResolvingLock) return;
        isDragging = true;
        playSound('tap');
      }

      function onMove(e) {
        if (!isDragging || isPaused || isResolvingLock) return;
        const cur = e.touches ? e.touches[0] : e;
        const rect = container.getBoundingClientRect();
        const px = cur.clientX - rect.left;
        const py = cur.clientY - rect.top;

        keyDragger.style.left = px + 'px';
        keyDragger.style.top = py + 'px';

        const dist = minDistanceToPath(px, py);
        if (dist > 21) {
          isDragging = false;
          container.classList.add('shocked');
          triggerMistake();
          addTrackedTimeout(() => {
            container.classList.remove('shocked');
          }, 350);
          keyDragger.style.left = track.start.x + 'px';
          keyDragger.style.top = track.start.y + 'px';
          return;
        }

        if (Math.hypot(px - track.goal.x, py - track.goal.y) <= 20) {
          isDragging = false;
          keyDragger.style.left = track.goal.x + 'px';
          keyDragger.style.top = track.goal.y + 'px';
          addTrackedTimeout(() => resolveLockSuccess(), 100);
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          if (isPaused || isResolvingLock) return;
          keyDragger.style.left = track.start.x + 'px';
          keyDragger.style.top = track.start.y + 'px';
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
      rocket.innerHTML = UFO_SVG;

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
      let zoneT = 0;
      const targetDuration = 550;

      function onStart(e) {
        if (isPaused || isResolvingLock) return;
        e.preventDefault();
        isThrusting = true;
        playSound('tap');
      }
      function onEnd() {
        if (!isThrusting) return;
        isThrusting = false;
      }

      thrustBtn.addEventListener('mousedown', onStart);
      thrustBtn.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

      let lastHoverTime = performance.now();

      function hoverPhysics(nowTimestamp) {
        if (!isPlaying || currentLock !== lock) return;
        const now = nowTimestamp || performance.now();
        if (isPaused) {
          isThrusting = false;
          lastHoverTime = now;
          activeAnimationId = requestAnimationFrame(hoverPhysics);
          return;
        }

        const dt = Math.min(33.3, Math.max(2, now - lastHoverTime));
        lastHoverTime = now;
        const timeScale = dt / 16.667; // 60fps基準正規化

        // 緑のエリアがゆっくり上下に動く (フレームレートに依存しない角速度)
        zoneT += 0.025 * timeScale;
        const zoneTop = 55 + Math.sin(zoneT) * 28;
        zone.style.top = zoneTop + 'px';

        if (isThrusting) velocity += 0.55 * timeScale;
        else velocity -= 0.35 * timeScale;

        velocity *= Math.pow(0.95, timeScale);
        altitude += velocity * timeScale;
        if (altitude < 8) { altitude = 8; velocity = 0; }
        if (altitude > 140) { altitude = 140; velocity = 0; }
        rocket.style.bottom = altitude + 'px';

        const r = rocket.getBoundingClientRect();
        const z = zone.getBoundingClientRect();
        const rCenter = r.top + r.height / 2;
        const isInside = (rCenter >= z.top && rCenter <= z.bottom);

        if (isInside) {
          zone.classList.add('active-in');
          insideTime += dt;
          const pct = Math.min(100, (insideTime / targetDuration) * 100);
          progressFill.style.width = pct + '%';

          if (insideTime >= targetDuration) {
            resolveLockSuccess();
            return;
          }
        } else {
          zone.classList.remove('active-in');
          insideTime = Math.max(0, insideTime - 12 * timeScale);
          const pct = Math.min(100, (insideTime / targetDuration) * 100);
          progressFill.style.width = pct + '%';
        }

        activeAnimationId = requestAnimationFrame(hoverPhysics);
      }
      activeAnimationId = requestAnimationFrame(hoverPhysics);

    // 23. 極小・激しく動くボタン (クッキリ照準マーク ＆ ランダム開始位置 ＆ 高速タップ即時判定)
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

      // 開始位置を中央固定ではなくランダムに配置
      let x = 25 + Math.random() * 190;
      let y = 20 + Math.random() * 95;
      let vx = (Math.random() > 0.5 ? 1 : -1) * (4.6 + Math.random() * 1.6);
      let vy = (Math.random() > 0.5 ? 1 : -1) * (3.8 + Math.random() * 1.6);

      function tinyBounce() {
        if (!isPlaying || currentLock !== lock) return;
        if (isPaused) {
          activeAnimationId = requestAnimationFrame(tinyBounce);
          return;
        }

        // 時間経過で徐々に減速（最低速度は確保）
        vx *= 0.997;
        vy *= 0.997;
        if (Math.abs(vx) < 1.1) vx = Math.sign(vx || 1) * 1.1;
        if (Math.abs(vy) < 0.9) vy = Math.sign(vy || 1) * 0.9;

        const maxX = Math.max(40, (box.clientWidth || 268) - 38);
        const maxY = Math.max(40, (box.clientHeight || 175) - 38);

        x += vx;
        y += vy;
        if (x <= 6) {
          x = 6;
          vx = Math.abs(vx);
        } else if (x >= maxX) {
          x = maxX;
          vx = -Math.abs(vx);
        }
        if (y <= 6) {
          y = 6;
          vy = Math.abs(vy);
        } else if (y >= maxY) {
          y = maxY;
          vy = -Math.abs(vy);
        }
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        activeAnimationId = requestAnimationFrame(tinyBounce);
      }
      activeAnimationId = requestAnimationFrame(tinyBounce);

      let isHit = false;
      function onBtnHit(e) {
        if (isHit || isPaused || isResolvingLock) return;
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        isHit = true;
        playSound('tap');
        resolveLockSuccess();
      }

      // 高速移動中もタッチ・ポインターを逃さず即座に反応
      btn.addEventListener('pointerdown', onBtnHit);
      btn.addEventListener('touchstart', onBtnHit, { passive: false });
      btn.addEventListener('mousedown', onBtnHit);
      btn.addEventListener('click', onBtnHit);

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

      function handleSuperMash(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (isPaused || isResolvingLock) return;
        playSound('tap');
        progress = Math.min(100, progress + 13);
        updateBar();
        if (progress >= 100) {
          resolveLockSuccess();
        }
      }

      btn.addEventListener('pointerdown', handleSuperMash);
      btn.addEventListener('click', (e) => e.preventDefault());

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
        if (!isPlaying || currentLock !== lock) return;
        if (isPaused) {
          activeAnimationId = requestAnimationFrame(decayLoop);
          return;
        }
        progress = Math.max(-40, progress - 0.525);
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

  // 背後の鍵（次の鍵）のギミック中身を本物と同じパーツで忠実にプレビュー描画する関数
  function renderNextGimmickPreview(lock) {
    if (!nextGimmickContainer || !lock) return;
    nextGimmickContainer.innerHTML = '';
    if (isLiteMode) return; // 軽量モード時は奥の鍵の描画・計算をスキップ
    if (nextLockBadge) nextLockBadge.textContent = `NEXT: Lv.${lock.level}`;

    const t = lock.type;
    // 1. 特大ボタン
    if (t === 'giant_button') {
      const btn = document.createElement('button');
      btn.className = 'giant-action-btn';
      btn.textContent = '';
      nextGimmickContainer.appendChild(btn);

    // 2. レバースイッチ (Lv2)
    } else if (t === 'switch_slide') {
      const frame = document.createElement('div');
      frame.className = 'lever-switch-frame';
      frame.innerHTML = `
        <div class="lever-labels-row"><span>OFF</span><span>ON</span></div>
        <div class="lever-slot-cutout"></div>
        <div class="lever-pivot-base"></div>
        <div class="lever-arm-actor">
          <div class="lever-metal-rod"></div>
          <div class="lever-handle-ball"></div>
        </div>
      `;
      nextGimmickContainer.appendChild(frame);

    // 3. 鍵ドラッグ差し込み (ゴールドキー & リアル鍵穴)
    } else if (t === 'key_drag') {
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
      nextGimmickContainer.appendChild(container);

    // 4. ダブルタップ (光る2つの大ドット & クリーンボタン)
    } else if (t === 'double_tap') {
      const wrapper = document.createElement('div');
      wrapper.className = 'multi-tap-wrapper';
      const dotRow = document.createElement('div');
      dotRow.className = 'multi-dot-row-outer';
      for (let i = 0; i < 2; i++) {
        const d = document.createElement('div');
        d.className = 'tap-dot-large';
        dotRow.appendChild(d);
      }
      const btn = document.createElement('button');
      btn.className = 'multi-tap-btn-clean';
      wrapper.appendChild(dotRow);
      wrapper.appendChild(btn);
      nextGimmickContainer.appendChild(wrapper);

    // 5. 直線スライド (4方向プレビュー)
    } else if (t === 'slide_right') {
      const dir = lock.slideDir || 'right';
      const isVertical = (dir === 'down' || dir === 'up');

      const track = document.createElement('div');
      track.className = isVertical ? 'slider-vertical' : 'slider-horizontal';

      const arrows = document.createElement('div');
      arrows.className = isVertical ? 'slider-arrows-v-bg' : 'slider-arrows-bg';
      if (dir === 'right') arrows.textContent = '▶ ▶ ▶';
      else if (dir === 'left') arrows.textContent = '◀ ◀ ◀';
      else if (dir === 'down') arrows.innerHTML = '<span>▼</span><span>▼</span><span>▼</span>';
      else if (dir === 'up') arrows.innerHTML = '<span>▲</span><span>▲</span><span>▲</span>';

      const goal = document.createElement('div');
      goal.className = isVertical
        ? (dir === 'down' ? 'slider-goal-v bottom' : 'slider-goal-v top')
        : (dir === 'right' ? 'slider-goal-h right' : 'slider-goal-h left');

      const knob = document.createElement('div');
      knob.className = isVertical ? 'slider-knob-v' : 'slider-knob-h';
      knob.style.fontSize = '1.3rem';

      if (dir === 'right') {
        knob.style.left = '6px';
        knob.textContent = '▶';
      } else if (dir === 'left') {
        knob.style.left = '165px';
        knob.textContent = '◀';
      } else if (dir === 'down') {
        knob.style.top = '6px';
        knob.textContent = '▼';
      } else if (dir === 'up') {
        knob.style.top = '100px';
        knob.textContent = '▲';
      }

      track.appendChild(arrows);
      track.appendChild(goal);
      track.appendChild(knob);
      nextGimmickContainer.appendChild(track);

    // 6. クランクスライド (一体型L字レール & 星ゴール)
    } else if (t === 'crank_slide') {
      const vKey = lock.crankVariant || 'right_down';
      const previewPaths = {
        right_down: { path: "M 38 38 L 118 38 L 118 132", sx: '18px', sy: '18px', st: '▶', gx: '118px', gy: '132px' },
        down_right: { path: "M 38 38 L 38 132 L 118 132", sx: '18px', sy: '18px', st: '▼', gx: '118px', gy: '132px' },
        left_down: { path: "M 118 38 L 38 38 L 38 132", sx: '98px', sy: '18px', st: '◀', gx: '38px', gy: '132px' },
        down_left: { path: "M 118 38 L 118 132 L 38 132", sx: '98px', sy: '18px', st: '▼', gx: '38px', gy: '132px' },
      };
      const pv = previewPaths[vKey] || previewPaths.right_down;
      const area = document.createElement('div');
      area.className = 'crank-slider-area';
      area.innerHTML = `
        <svg class="crank-slot-svg" viewBox="0 0 170 170">
          <path d="${pv.path}" fill="none" stroke="var(--text-dark)" stroke-width="48" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${pv.path}" fill="none" stroke="#f1f2f6" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${pv.path}" fill="none" stroke="rgba(0, 0, 0, 0.08)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;
      const goal = document.createElement('div'); goal.className = 'crank-goal'; goal.textContent = '★';
      goal.style.left = pv.gx; goal.style.top = pv.gy;
      const knob = document.createElement('div'); knob.className = 'crank-knob'; knob.textContent = pv.st;
      knob.style.left = pv.sx; knob.style.top = pv.sy;
      area.appendChild(goal); area.appendChild(knob);
      nextGimmickContainer.appendChild(area);

    // 7. サークルループスライド (円弧トラック)
    } else if (t === 'circle_loop_slide') {
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
      turnIndicator.innerHTML = ARROW_CURVE_RIGHT_SVG;
      turnIndicator.style.color = '#1e90ff';
      stage.appendChild(turnIndicator);
      const knob = document.createElement('div');
      knob.className = 'loop-knob';
      knob.textContent = '●';
      knob.style.left = '27px'; knob.style.top = '95px';
      stage.appendChild(knob);
      nextGimmickContainer.appendChild(stage);

    // 8. ジェスチャーチェックマーク (ウォーターマーク & キャンバス)
    } else if (t === 'gesture_mark') {
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
      nextGimmickContainer.appendChild(wrap);

    // 9. 鍵合わせ (6択ゴールド鍵ボタン & ターゲットマーク)
    } else if (t === 'match_key') {
      const stage = document.createElement('div');
      stage.className = 'key-match-stage';
      const targets = lock.matchKeyTargets || (lock.matchKeyTarget ? [lock.matchKeyTarget] : ['★']);
      const count = targets.length;
      const targetWrap = document.createElement('div');
      targetWrap.className = `key-match-targets-wrap targets-${count}`;
      targets.forEach(sym => {
        const hole = document.createElement('div');
        hole.className = `key-match-hole-target target-size-${count}`;
        hole.textContent = sym;
        targetWrap.appendChild(hole);
      });
      stage.appendChild(targetWrap);
      const grid = document.createElement('div');
      grid.className = 'key-choices-grid-6';
      const syms = lock.matchKeyShuffled || ['●', '▲', '★', '◆', '■', '✚'];
      syms.forEach(s => {
        const item = document.createElement('button');
        item.className = 'key-choice-gold-btn';
        item.textContent = s;
        grid.appendChild(item);
      });
      stage.appendChild(grid);
      nextGimmickContainer.appendChild(stage);

    // 10. 混色 (カラーサークル & 配合ボタン)
    } else if (t === 'color_mix') {
      const stage = document.createElement('div');
      stage.className = 'color-mix-stage';
      const targetCircle = document.createElement('div');
      targetCircle.className = 'color-mix-target-circle';
      targetCircle.style.background = lock.colorMixRecipe ? lock.colorMixRecipe.color : '#9b59b6';
      stage.appendChild(targetCircle);
      const barContainer = document.createElement('div');
      barContainer.className = 'color-mix-bar-container';
      const barFill = document.createElement('div');
      barFill.className = 'color-mix-bar-fill';
      barContainer.appendChild(barFill);
      stage.appendChild(barContainer);
      const buttonsRow = document.createElement('div');
      buttonsRow.className = 'color-mix-buttons-row';
      ['#ff4757', '#1e90ff', '#ffd32a'].forEach(hex => {
        const btn = document.createElement('button');
        btn.className = 'color-mix-pill-btn';
        btn.style.background = hex;
        buttonsRow.appendChild(btn);
      });
      stage.appendChild(buttonsRow);
      nextGimmickContainer.appendChild(stage);

    // 11. 連打ボタン (ゲージトラック & ビッグボタン)
    } else if (t === 'rapid_mash') {
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
      wrap.appendChild(gaugeTrack);
      wrap.appendChild(btn);
      nextGimmickContainer.appendChild(wrap);

    // 12. ホバーロケット
    } else if (t === 'hover_thrust') {
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
      rocket.style.bottom = '15px';
      stage.appendChild(zone);
      stage.appendChild(rocket);
      const thrustBtn = document.createElement('button');
      thrustBtn.className = 'hover-thrust-btn';
      thrustBtn.textContent = '▲';
      nextGimmickContainer.appendChild(stage);
      nextGimmickContainer.appendChild(thrustBtn);

    // 13. 星トレース (ガイド星ポリゴン & ノブ)
    } else if (t === 'star_trace') {
      const area = document.createElement('div');
      area.className = 'star-trace-area';
      const stepInd = document.createElement('div');
      stepInd.className = 'star-step-indicator';
      for (let i = 0; i < 5; i++) {
        const span = document.createElement('span');
        span.innerHTML = getStarSvg(false);
        stepInd.appendChild(span);
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
      area.appendChild(svg);
      const basePoints = [
        { x: 95, y: 22 },
        { x: 148, y: 165 },
        { x: 12, y: 74 },
        { x: 178, y: 74 },
        { x: 42, y: 165 }
      ];
      const startPt = basePoints[lock.starStartIndex || 0];
      const knob = document.createElement('div');
      knob.className = 'star-knob';
      knob.innerHTML = getStarSvg(true);
      knob.style.left = startPt.x + 'px';
      knob.style.top = startPt.y + 'px';
      area.appendChild(knob);
      nextGimmickContainer.appendChild(area);

    // 14. ダイヤル錠 (3連ダイヤル)
    } else if (t === 'dial_code') {
      const stage = document.createElement('div');
      stage.className = 'dial-lock-stage';
      const codeLabel = document.createElement('div');
      codeLabel.className = 'dial-lock-target-code';
      const targetDigits = lock.dialTargetDigits || [7, 7, 7];
      codeLabel.textContent = targetDigits.join(' ');
      const row = document.createElement('div');
      row.className = 'dial-wheels-row';
      const initVals = lock.dialCurrentDigits || [5, 4, 6];
      initVals.forEach(val => {
        const wheel = document.createElement('div');
        wheel.className = 'dial-wheel';
        wheel.textContent = val;
        row.appendChild(wheel);
      });
      stage.appendChild(codeLabel);
      stage.appendChild(row);
      nextGimmickContainer.appendChild(stage);

    // 15. 動くボタン (⌖)
    } else if (t === 'moving_btn') {
      const box = document.createElement('div');
      box.className = 'moving-btn-container';
      const btn = document.createElement('button');
      btn.className = 'moving-action-btn';
      btn.textContent = '⌖';
      btn.style.fontSize = '1.3rem';
      btn.style.fontWeight = '900';
      btn.style.left = '100px';
      btn.style.top = '50px';
      box.appendChild(btn);
      nextGimmickContainer.appendChild(box);

    // 16. モールス信号 (バリエーション対応)
    } else if (t === 'morse_code') {
      const stage = document.createElement('div');
      stage.className = 'morse-stage';
      const display = document.createElement('div');
      display.className = 'morse-target-display';
      const pat = lock.morsePattern || ['dot', 'dash', 'dot'];
      pat.forEach(item => {
        const s = document.createElement('span');
        s.className = 'morse-symbol';
        s.textContent = (item === 'dash' ? '━' : '・');
        display.appendChild(s);
      });
      const tapBtn = document.createElement('button');
      tapBtn.className = 'morse-tap-btn';
      tapBtn.textContent = '●';
      tapBtn.style.fontSize = '1.6rem';
      tapBtn.style.fontWeight = '900';
      stage.appendChild(display);
      stage.appendChild(tapBtn);
      nextGimmickContainer.appendChild(stage);

    // 17. ホイール回転 (バルブ & スポーク)
    } else if (t === 'wheel_turn') {
      const stage = document.createElement('div');
      stage.className = 'wheel-turn-stage';
      const rim = document.createElement('div');
      rim.className = 'wheel-turn-rim';
      const spokeH = document.createElement('div'); spokeH.className = 'wheel-turn-spoke';
      const spokeV = document.createElement('div'); spokeV.className = 'wheel-turn-spoke spoke-v';
      const knob = document.createElement('div'); knob.className = 'wheel-turn-knob';
      rim.appendChild(spokeH); rim.appendChild(spokeV); rim.appendChild(knob);
      const center = document.createElement('div');
      center.className = 'wheel-turn-center unlocking';
      center.textContent = '0%';
      center.style.fontSize = '0.9rem';
      stage.appendChild(rim);
      stage.appendChild(center);
      nextGimmickContainer.appendChild(stage);

    // 18. 静止・我慢 (ストップハンド & ゲージ)
    } else if (t === 'wait_still') {
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
      nextGimmickContainer.appendChild(stage);

    // 19. カラー4択 (ターゲット & 4色ボタン)
    } else if (t === 'color_choice_2') {
      const colors = [
        { key: 'red', hex: '#ff4757' },
        { key: 'blue', hex: '#1e90ff' },
        { key: 'green', hex: '#2ed573' },
        { key: 'yellow', hex: '#ffd32a' }
      ];
      const targetIndex = (lock.colorChoiceIndex !== undefined) ? lock.colorChoiceIndex : 0;
      const wrap = document.createElement('div');
      wrap.className = 'color-match-wrap';
      const target = document.createElement('div');
      target.className = 'color-target-display';
      target.style.background = colors[targetIndex].hex;
      wrap.appendChild(target);
      const row = document.createElement('div');
      row.className = 'choice-row choice-row-4';
      colors.forEach(c => {
        const b = document.createElement('button');
        b.className = 'color-choice-btn';
        b.style.background = c.hex;
        row.appendChild(b);
      });
      wrap.appendChild(row);
      nextGimmickContainer.appendChild(wrap);

    // 20. イライラ棒！鍵迷路 (エレクトリックパス & 鍵ドラッガー: プレビューはブラー・アニメーション無しで軽量描画)
    } else if (t === 'irira_key_maze') {
      const container = document.createElement('div');
      container.className = 'irira-maze-container';
      const track = IRIRA_MAZE_TRACKS[lock.iriraTrackIndex || 0];
      container.innerHTML = `
        <svg class="irira-maze-svg" viewBox="0 0 250 140">
          <path class="electric-zap-path" d="${track.path}" 
                fill="none" stroke="#ffa502" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${track.path}" 
                fill="none" stroke="#2f3542" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${track.path}" 
                fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;
      const goalHole = document.createElement('div');
      goalHole.className = 'irira-goal-hole';
      goalHole.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24" style="display:block;">
          <circle cx="12" cy="9" r="5.5" fill="#2ed573" />
          <polygon points="9.5,9.5 14.5,9.5 13.5,17 10.5,17" fill="#2ed573" />
        </svg>
      `;
      goalHole.style.left = (track.goal.x - 3) + 'px';
      goalHole.style.top = (track.goal.y - 3) + 'px';
      container.appendChild(goalHole);
      const keyDragger = document.createElement('div');
      keyDragger.className = 'irira-key-dragger';
      keyDragger.innerHTML = KEY_SVG;
      keyDragger.style.left = track.start.x + 'px';
      keyDragger.style.top = track.start.y + 'px';
      container.appendChild(keyDragger);
      nextGimmickContainer.appendChild(container);

    // 21. 精密ホバー
    } else if (t === 'hover_thrust_hard') {
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
      rocket.innerHTML = UFO_SVG;
      rocket.style.bottom = '15px';
      stage.appendChild(zone);
      stage.appendChild(rocket);
      const thrustBtn = document.createElement('button');
      thrustBtn.className = 'hover-thrust-btn';
      thrustBtn.textContent = '▲';
      nextGimmickContainer.appendChild(stage);
      nextGimmickContainer.appendChild(thrustBtn);

    // 22. 小さく動くボタン
    } else if (t === 'tiny_moving_btn') {
      const box = document.createElement('div');
      box.className = 'moving-btn-container';
      const btn = document.createElement('button');
      btn.className = 'tiny-moving-btn';
      btn.textContent = '⌖';
      btn.style.fontSize = '1.2rem';
      btn.style.lineHeight = '1';
      btn.style.left = '100px';
      btn.style.top = '50px';
      box.appendChild(btn);
      nextGimmickContainer.appendChild(box);

    // 23. 超激連打 (イナズマアーケードボタン & トラック)
    } else if (t === 'super_mash') {
      const wrap = document.createElement('div');
      wrap.className = 'super-mash-container';
      const trackWrapper = document.createElement('div');
      trackWrapper.className = 'super-mash-track-wrapper';
      const fillBar = document.createElement('div');
      fillBar.className = 'super-mash-fill-bar';
      fillBar.style.left = '0%';
      fillBar.style.width = '0%';
      trackWrapper.appendChild(fillBar);
      const btn = document.createElement('button');
      btn.className = 'super-arcade-btn';
      btn.innerHTML = BOLT_SVG;
      wrap.appendChild(trackWrapper);
      wrap.appendChild(btn);
      nextGimmickContainer.appendChild(wrap);
    }
  }

  let cardShakeTimer = null;
  let flashTimer = null;
  let impactShakeTimer = null;
  let mechBgTimer = null;
  let swapTimer1 = null;
  let swapTimer2 = null;

  // Mistake Trigger
  function triggerMistake() {
    if (isPaused || !isPlaying) return;
    comboCount = 0; // コンボ途切れ
    playSound('mistake');
    safeVibrate(30);

    currentCard.classList.add('shake');
    if (cardShakeTimer) clearTimeout(cardShakeTimer);
    cardShakeTimer = setTimeout(() => {
      currentCard.classList.remove('shake');
      cardShakeTimer = null;
    }, 400);

    // 1ミス即終了モード (sudden_death) の場合は即座にゲーム終了
    const modeCfg = GAME_MODES[currentMode] || GAME_MODES.normal;
    if (modeCfg.oneMistakeGameOver) {
      endGame('mistake');
    }
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
    cleanActiveTimeouts();

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

    // 触覚振動 (非同期・スロットル制御)
    safeVibrate(comboCount > 2 ? 22 : 16);

    // シャックルスプリングオープン
    currentShackle.classList.add('open');

    // モードに応じた時間追加アニメ (通常モード・1ミス即終了モードのみ +1.0s)
    const modeCfg = GAME_MODES[currentMode] || GAME_MODES.normal;
    if (modeCfg.addTimeOnUnlock > 0 && !modeCfg.isCountUp) {
      remainingTime += modeCfg.addTimeOnUnlock;
      timeDisplay.textContent = remainingTime.toFixed(1);
      timeAddedAnim.textContent = `+${modeCfg.addTimeOnUnlock.toFixed(1)}s`;
      restartCssAnimation(timeAddedAnim, 'animate', [
        { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateX(-50%) translateY(14px) scale(1.15)' }
      ], { duration: 600, easing: 'ease-out', fill: 'forwards' });
    }

    // スコア加算 (新ルール: 基本100pt固定 + 10個ごとに300pt + コンボ数×10)
    unlockedCountNum++;
    unlockedCount.textContent = unlockedCountNum;

    const basePts = 100;
    const comboBonus = comboCount * 10;
    const isTenBonus = (unlockedCountNum % 10 === 0);
    const tenBonus = isTenBonus ? 300 : 0;

    score += (basePts + comboBonus + tenBonus);
    scoreDisplay.textContent = score;

    // スコア真下に増加点を表示 ("+基礎点+コンボボーナス")
    const scoreAddedAnim = document.getElementById('score-added-anim');
    if (scoreAddedAnim) {
      const addedText = isTenBonus ? `+${basePts}+${comboBonus}+${tenBonus}` : `+${basePts}+${comboBonus}`;
      scoreAddedAnim.textContent = addedText;
      restartCssAnimation(scoreAddedAnim, 'animate', [
        { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateX(-50%) translateY(14px) scale(1.15)' }
      ], { duration: 600, easing: 'ease-out', fill: 'forwards' });
    }

    // スコアバウンス (強制リフローを排しWeb Animations APIで高速実行)
    const scoreBox = document.querySelector('.score-box');
    if (scoreBox) {
      restartCssAnimation(scoreBox, 'pop', [
        { transform: 'scale(1)' },
        { transform: 'scale(1.14)' },
        { transform: 'scale(1)' }
      ], { duration: 180, easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)' });
    }

    // 毎解錠の getBoundingClientRect() を排し、画面基準で高速算出
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.44;
    const cardTop = window.innerHeight * 0.22;

    // 軽量モードでない場合のみ背景演出を実行
    if (!isLiteMode) {
      triggerShockwave(centerX, centerY);
      if (screenFlashOverlay) {
        screenFlashOverlay.classList.add('flash');
        if (flashTimer) clearTimeout(flashTimer);
        flashTimer = setTimeout(() => {
          screenFlashOverlay.classList.remove('flash');
          flashTimer = null;
        }, 50);
      }
      if (gameApp && !isPaused) {
        restartCssAnimation(gameApp, 'impact-shake', [
          { transform: 'translate(0, 0)' },
          { transform: 'translate(-2px, 3px)' },
          { transform: 'translate(3px, -2px)' },
          { transform: 'translate(0, 0)' }
        ], { duration: 220, easing: 'ease-out' });
      }
    }

    // フローティングテキスト
    if (isTenBonus) {
      spawnFloatingText(`BONUS +300pt!`, centerX, cardTop + 10);
    } else {
      const comboLabel = comboCount > 1 ? `COMBO x${comboCount} (+${comboBonus}pt)` : '+100pt';
      spawnFloatingText(comboLabel, centerX, cardTop + 30);
    }

    // 軽量モードでない場合のみクリアパーティクル＆背景メカニズム連動を実行
    if (!isLiteMode) {
      createBurst(centerX, centerY, 36);

      const mechBg = document.getElementById('lock-mechanism-bg');
      if (mechBg) {
        mechBg.classList.add('unlocked');
        if (mechBgTimer) clearTimeout(mechBgTimer);
        mechBgTimer = setTimeout(() => {
          mechBg.classList.remove('unlocked');
          mechBgTimer = null;
        }, 450);
      }
    }

    // 5000ポイントタイムアタック等で目標スコアに到達した場合は即座にクリア終了
    if (modeCfg.targetScore && score >= modeCfg.targetScore) {
      endGame('clear');
      return;
    }

    // 解錠の小気味よい瞬間的なポップ演出（透明化は行わず、手前カードの半透明ベールを常時維持）
    currentCard.style.transform = 'scale(1.04)';

    if (swapTimer1) clearTimeout(swapTimer1);
    if (swapTimer2) clearTimeout(swapTimer2);
    swapTimer1 = setTimeout(() => {
      swapTimer1 = null;
      if (!isPlaying) return;
      currentLock = nextLock;
      nextLock = getNextLockFromQueue();

      renderGimmick(currentLock);
      renderNextGimmickPreview(nextLock);

      currentShackle.classList.remove('open');
      currentCard.style.transform = 'scale(0.98)';

      swapTimer2 = setTimeout(() => {
        swapTimer2 = null;
        currentCard.style.transform = 'scale(1)';
        isResolvingLock = false;
        if (gimmickContainer) {
          gimmickContainer.style.pointerEvents = 'auto';
        }
      }, 50);
    }, 140);
  }

  let isTimeFrozen = false;
  let isPaused = false;

  const pauseBtn = document.getElementById('pause-btn');
  const pauseOverlay = document.getElementById('pause-overlay');
  const pauseResumeBtn = document.getElementById('pause-resume-btn');
  const pauseRetryBtn = document.getElementById('pause-retry-btn');
  const pauseTitleBtn = document.getElementById('pause-title-btn');
  const pauseTimeLabel = document.getElementById('pause-time-label');
  const pauseTimeVal = document.getElementById('pause-time-val');
  const pauseScoreVal = document.getElementById('pause-score-val');
  const pauseLocksVal = document.getElementById('pause-locks-val');
  const pauseModalModeDesc = document.getElementById('pause-modal-mode-desc');

  function updatePauseModalStats() {
    const modeCfg = GAME_MODES[currentMode] || GAME_MODES.normal;
    if (pauseModalModeDesc) {
      pauseModalModeDesc.textContent = `${modeCfg.label} - 一時停止中`;
    }
    if (modeCfg.isCountUp) {
      if (pauseTimeLabel) pauseTimeLabel.textContent = '経過時間:';
      if (pauseTimeVal) pauseTimeVal.textContent = `${Math.max(0, elapsedTime).toFixed(1)}s`;
      if (pauseScoreVal) pauseScoreVal.textContent = `${score.toLocaleString()} / ${modeCfg.targetScore.toLocaleString()}`;
    } else {
      if (pauseTimeLabel) pauseTimeLabel.textContent = '残り時間:';
      if (pauseTimeVal) pauseTimeVal.textContent = `${Math.max(0, remainingTime).toFixed(1)}s`;
      if (pauseScoreVal) pauseScoreVal.textContent = score.toLocaleString();
    }
    if (pauseLocksVal) pauseLocksVal.textContent = String(unlockedCountNum);
  }

  function pauseGame() {
    if (!isPlaying || isPaused) return;
    isPaused = true;
    document.body.classList.add('game-paused');
    if (gameApp) {
      gameApp.classList.remove('impact-shake');
    }
    if (impactShakeTimer) {
      clearTimeout(impactShakeTimer);
      impactShakeTimer = null;
    }
    updatePauseModalStats();
    playSound('tap');
    if (pauseOverlay) pauseOverlay.classList.add('active');
  }

  function resumeGame() {
    if (!isPaused) return;
    isPaused = false;
    document.body.classList.remove('game-paused');
    playSound('tap');
    if (pauseOverlay) pauseOverlay.classList.remove('active');
  }

  // 一度プレイしてホーム（タイトル画面）へ戻った際に裏メニュー鍵マークを出現させる
  function unlockSecretMenuOnReturnHome() {
    if (hasPlayedOnceInSession && !hasUnlockedSecret) {
      hasUnlockedSecret = true;
      localStorage.setItem(STORAGE_KEY_SECRET_UNLOCKED, '1');
    }
    updateSecretKeyVisibility();
    updateTitleModeUI();
  }

  setupActionButton(pauseBtn, pauseGame);
  setupActionButton(pauseResumeBtn, resumeGame);
  setupActionButton(pauseRetryBtn, () => {
    resumeGame();
    startGame();
  });
  setupActionButton(pauseTitleBtn, () => {
    resumeGame();
    isPlaying = false;
    cleanupCurrentGimmick();
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    const urgentOverlay = document.getElementById('urgent-countdown-overlay');
    if (urgentOverlay) urgentOverlay.classList.remove('active');
    if (dangerVignette) dangerVignette.classList.remove('active-danger');
    unlockSecretMenuOnReturnHome();
    startOverlay.classList.add('active');
    resultOverlay.classList.remove('active');
  });

  let endGameTimeoutId = null;

  // Timer loop
  function startTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    const urgentOverlay = document.getElementById('urgent-countdown-overlay');
    const urgentNum = document.getElementById('urgent-count-num');

    timerInterval = setInterval(() => {
      if (isTimeFrozen || isPaused) return;

      const modeCfg = GAME_MODES[currentMode] || GAME_MODES.normal;

      // カウントアップ方式 (5000pt タイムアタック)
      if (modeCfg.isCountUp) {
        elapsedTime = Math.round((elapsedTime + 0.1) * 10) / 10;
        remainingTime = elapsedTime;
        timeDisplay.textContent = elapsedTime.toFixed(1);
        if (urgentOverlay) urgentOverlay.classList.remove('active');
        timeDisplay.parentElement.classList.remove('timer-danger');
        if (dangerVignette) dangerVignette.classList.remove('active-danger');
        return;
      }

      // カウントダウン方式 (通常 / 1分固定 / 1ミス即終了)
      remainingTime = Math.round((remainingTime - 0.1) * 10) / 10;
      if (remainingTime <= 0) {
        remainingTime = 0;
        timeDisplay.textContent = '0.0';
        if (urgentOverlay) urgentOverlay.classList.remove('active');
        endGame('timeout');
        return;
      }

      timeDisplay.textContent = remainingTime.toFixed(1);

      // 残り時間3, 2, 1秒で画面全体を90%透過オーバーレイにしてカウントダウン緊迫感を演出
      if (remainingTime <= 3.0 && remainingTime > 0) {
        if (urgentOverlay) urgentOverlay.classList.add('active');
        const sec = Math.ceil(remainingTime);
        if (urgentNum && urgentNum.textContent !== String(sec)) {
          urgentNum.textContent = String(sec);
          restartCssAnimation(urgentNum, 'urgent-pulse', [
            { transform: 'scale(0.8)', opacity: 0.4 },
            { transform: 'scale(1.15)', opacity: 1 },
            { transform: 'scale(1)', opacity: 0.9 }
          ], { duration: 400, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' });
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
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (endGameTimeoutId) {
      clearTimeout(endGameTimeoutId);
      endGameTimeoutId = null;
    }
    if (swapTimer1) {
      clearTimeout(swapTimer1);
      swapTimer1 = null;
    }
    if (swapTimer2) {
      clearTimeout(swapTimer2);
      swapTimer2 = null;
    }
    const finishOverlay = document.getElementById('finish-banner-overlay');
    if (finishOverlay) finishOverlay.classList.remove('active');
    const secretMenuOverlay = document.getElementById('secret-menu-overlay');
    if (secretMenuOverlay) secretMenuOverlay.classList.remove('active');

    cleanupCurrentGimmick();
    hasPlayedOnceInSession = true;
    isPlaying = true;
    isPaused = false;
    isResolvingLock = false;
    document.body.classList.remove('game-paused');
    currentCard.style.transform = 'scale(1)';
    const urgentOverlay = document.getElementById('urgent-countdown-overlay');
    if (urgentOverlay) urgentOverlay.classList.remove('active');
    if (pauseOverlay) pauseOverlay.classList.remove('active');

    if (gimmickContainer) {
      gimmickContainer.style.pointerEvents = 'auto';
    }

    const modeCfg = GAME_MODES[currentMode] || GAME_MODES.normal;
    remainingTime = modeCfg.initialTime;
    elapsedTime = 0.0;
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

    const hudTimeLabel = document.getElementById('hud-time-label');
    const hudScoreLabel = document.getElementById('hud-score-label');
    if (hudTimeLabel) hudTimeLabel.textContent = modeCfg.isCountUp ? 'TIME (UP)' : 'TIME';
    if (hudScoreLabel) hudScoreLabel.textContent = modeCfg.targetScore ? `SCORE / ${modeCfg.targetScore}` : 'SCORE';

    scoreDisplay.textContent = '0';
    unlockedCount.textContent = '0';
    timeDisplay.textContent = modeCfg.isCountUp ? '0.0' : remainingTime.toFixed(1);
    timeDisplay.parentElement.classList.remove('timer-danger');

    startOverlay.classList.remove('active');
    resultOverlay.classList.remove('active');

    lockQueue = buildRoundQueue(1);
    currentLock = getNextLockFromQueue();
    nextLock = getNextLockFromQueue();

    renderGimmick(currentLock);
    renderNextGimmickPreview(nextLock);

    startTimer();
  }

  function endGame(reason = 'timeout') {
    if (!isPlaying) return;
    isPlaying = false;
    isPaused = false;
    document.body.classList.remove('game-paused');
    if (pauseOverlay) pauseOverlay.classList.remove('active');
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (endGameTimeoutId) {
      clearTimeout(endGameTimeoutId);
      endGameTimeoutId = null;
    }
    if (swapTimer1) {
      clearTimeout(swapTimer1);
      swapTimer1 = null;
    }
    if (swapTimer2) {
      clearTimeout(swapTimer2);
      swapTimer2 = null;
    }
    cleanupCurrentGimmick();
    if (dangerVignette) dangerVignette.classList.remove('active-danger');
    const urgentOverlay = document.getElementById('urgent-countdown-overlay');
    if (urgentOverlay) urgentOverlay.classList.remove('active');

    const modeCfg = GAME_MODES[currentMode] || GAME_MODES.normal;

    // 実際に取った記録を直前プレイ記録として保存
    lastPlayedMode = currentMode;
    lastPlayedScore = score;
    lastPlayedLocks = unlockedCountNum;
    lastPlayedTimeMs = Math.max(100, Math.round(elapsedTime * 1000));
    lastPlayedCleared = (reason === 'clear');

    // 1. 終了ホイッスル音
    playSound('whistle_finish');

    // 2. 画面中央にバナーを表示 (CLEAR! / MISS! / FINISH!)
    const finishOverlay = document.getElementById('finish-banner-overlay');
    const finishBannerText = document.getElementById('finish-banner-text');
    if (finishBannerText) {
      if (reason === 'clear') finishBannerText.textContent = 'CLEAR!';
      else if (reason === 'mistake') finishBannerText.textContent = '1 MISS!';
      else finishBannerText.textContent = 'FINISH!';
    }
    if (finishOverlay) {
      finishOverlay.classList.remove('active');
      requestAnimationFrame(() => {
        finishOverlay.classList.add('active');
      });
    }

    const resultModeBadge = document.getElementById('result-mode-badge');
    if (resultModeBadge) {
      resultModeBadge.textContent = modeCfg.label;
    }

    const resultTitleEl = document.getElementById('result-title');
    if (resultTitleEl) {
      if (reason === 'clear') resultTitleEl.textContent = '5000pt CLEAR!';
      else if (reason === 'mistake') resultTitleEl.textContent = '1 MISS OUT!';
      else resultTitleEl.textContent = "TIME'S UP!";
    }

    const finalScoreLabelEl = document.getElementById('final-score-label');
    const highScoreLabelEl = document.getElementById('high-score-label');
    const nextRankEl = document.getElementById('next-rank-info');
    const resultCardEl = document.getElementById('result-card');
    if (resultCardEl) {
      resultCardEl.classList.remove('rank-s-card');
      resultCardEl.classList.remove('rank-x-card');
    }

    let rank = 'C';

    if (modeCfg.isCountUp) {
      // 5000pt タイムアタックモードのリザルト・ベスト更新
      if (finalScoreLabelEl) finalScoreLabelEl.textContent = 'クリアタイム:';
      if (highScoreLabelEl) highScoreLabelEl.textContent = 'ベストタイム:';

      let bestTimeMs = getModeBestRecord('time_attack_5000');
      if (reason === 'clear') {
        const isNewBestTime = (bestTimeMs === 0 || lastPlayedTimeMs < bestTimeMs);
        if (isNewBestTime) {
          bestTimeMs = lastPlayedTimeMs;
          setModeBestRecord('time_attack_5000', bestTimeMs);
          autoSubmitScoreIfRegistered(bestTimeMs, unlockedCountNum, 'time_attack_5000');
        }
        finalScoreEl.textContent = `${(lastPlayedTimeMs / 1000).toFixed(1)}s`;

        const sec = lastPlayedTimeMs / 1000;
        if (sec <= 35.0) {
          rank = 'X';
          if (nextRankEl) { nextRankEl.textContent = ''; nextRankEl.style.display = 'none'; }
          if (resultCardEl) resultCardEl.classList.add('rank-x-card');
        } else if (sec <= 45.0) {
          rank = 'S';
          if (nextRankEl) {
            nextRankEl.textContent = `次のランク(X)まで あと ${(sec - 35.0).toFixed(1)}s 短縮`;
            nextRankEl.className = 'next-rank-info';
            nextRankEl.style.display = 'block';
          }
          if (resultCardEl) resultCardEl.classList.add('rank-s-card');
        } else if (sec <= 60.0) {
          rank = 'A';
          if (nextRankEl) {
            nextRankEl.textContent = `次のランク(S)まで あと ${(sec - 45.0).toFixed(1)}s 短縮`;
            nextRankEl.className = 'next-rank-info';
            nextRankEl.style.display = 'block';
          }
        } else if (sec <= 80.0) {
          rank = 'B';
          if (nextRankEl) {
            nextRankEl.textContent = `次のランク(A)まで あと ${(sec - 60.0).toFixed(1)}s 短縮`;
            nextRankEl.className = 'next-rank-info';
            nextRankEl.style.display = 'block';
          }
        } else {
          rank = 'C';
          if (nextRankEl) {
            nextRankEl.textContent = `次のランク(B)まで あと ${(sec - 80.0).toFixed(1)}s 短縮`;
            nextRankEl.className = 'next-rank-info';
            nextRankEl.style.display = 'block';
          }
        }
      } else {
        finalScoreEl.textContent = `未達成 (${score}pt)`;
        rank = 'C';
        if (nextRankEl) {
          nextRankEl.textContent = `クリアまで あと ${Math.max(0, 5000 - score).toLocaleString()} pt`;
          nextRankEl.className = 'next-rank-info';
          nextRankEl.style.display = 'block';
        }
      }

      finalLocksEl.textContent = unlockedCountNum;
      highScoreEl.textContent = bestTimeMs > 0 ? `${(bestTimeMs / 1000).toFixed(1)}s` : '--.-s';
    } else {
      // スコアアタック系モード (normal / fixed_1min / sudden_death)
      if (finalScoreLabelEl) finalScoreLabelEl.textContent = 'スコア:';
      if (highScoreLabelEl) highScoreLabelEl.textContent = 'ハイスコア:';

      let modeHigh = getModeBestRecord(currentMode);
      if (score > modeHigh) {
        modeHigh = score;
        setModeBestRecord(currentMode, modeHigh);
        autoSubmitScoreIfRegistered(score, unlockedCountNum, currentMode);
      }

      if (score >= 5500) {
        rank = 'X';
        if (nextRankEl) {
          nextRankEl.textContent = '';
          nextRankEl.style.display = 'none';
        }
        if (resultCardEl) resultCardEl.classList.add('rank-x-card');
      } else if (score >= 4000) {
        rank = 'S';
        const diff = 5500 - score;
        if (nextRankEl) {
          nextRankEl.textContent = `次のランク(X)まで あと ${diff.toLocaleString()} pt`;
          nextRankEl.className = 'next-rank-info';
          nextRankEl.style.display = 'block';
        }
        if (resultCardEl) resultCardEl.classList.add('rank-s-card');
      } else if (score >= 2500) {
        rank = 'A';
        const diff = 4000 - score;
        if (nextRankEl) {
          nextRankEl.textContent = `次のランク(S)まで あと ${diff.toLocaleString()} pt`;
          nextRankEl.className = 'next-rank-info';
          nextRankEl.style.display = 'block';
        }
      } else if (score >= 1200) {
        rank = 'B';
        const diff = 2500 - score;
        if (nextRankEl) {
          nextRankEl.textContent = `次のランク(A)まで あと ${diff.toLocaleString()} pt`;
          nextRankEl.className = 'next-rank-info';
          nextRankEl.style.display = 'block';
        }
      } else {
        rank = 'C';
        const diff = 1200 - score;
        if (nextRankEl) {
          nextRankEl.textContent = `次のランク(B)まで あと ${diff.toLocaleString()} pt`;
          nextRankEl.className = 'next-rank-info';
          nextRankEl.style.display = 'block';
        }
      }

      finalScoreEl.textContent = score;
      finalLocksEl.textContent = unlockedCountNum;
      highScoreEl.textContent = modeHigh;
    }

    rankBadgeEl.textContent = `RANK ${rank}`;
    if (rank === 'X') {
      rankBadgeEl.className = 'rank-badge rank-x';
      rankBadgeEl.style.background = '';
    } else if (rank === 'S') {
      rankBadgeEl.className = 'rank-badge rank-s-rainbow';
      rankBadgeEl.style.background = '';
    } else {
      rankBadgeEl.className = 'rank-badge';
      if (rank === 'A') rankBadgeEl.style.background = '#2ed573';
      else if (rank === 'B') rankBadgeEl.style.background = '#1e90ff';
      else rankBadgeEl.style.background = '#a4b0be';
    }

    const resultComment = document.getElementById('result-title-comment');
    if (resultComment) resultComment.textContent = '';

    // 3. FINISH! バナー表示後 (1.1秒後) にリザルト画面を表示
    endGameTimeoutId = setTimeout(() => {
      endGameTimeoutId = null;
      if (finishOverlay) finishOverlay.classList.remove('active');
      resultOverlay.classList.add('active');
      if (rank === 'S' || rank === 'X') {
        startConfettiRain(5000); // Rank S / X 時に画面全体に紙吹雪を降らせる
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

  // iOS Safari ダブルタップ拡大・ピンチズーム完全抑止
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

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
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        connectAndAutoClean(osc, gain);
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
        restartCssAnimation(countdownNum, 'pop', [
          { transform: 'scale(0.5)', opacity: 0 },
          { transform: 'scale(1.25)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1 }
        ], { duration: 300, easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)', fill: 'forwards' });
      }

      playBeep(3);
      safeVibrate(20);

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
            restartCssAnimation(countdownNum, 'pop', [
              { transform: 'scale(0.5)', opacity: 0 },
              { transform: 'scale(1.25)', opacity: 1 },
              { transform: 'scale(1)', opacity: 1 }
            ], { duration: 300, easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)', fill: 'forwards' });
          }
          playBeep(1);
          safeVibrate(25);
        } else if (progress >= 0.33 && currentStep > 2) {
          currentStep = 2;
          if (countdownNum) {
            countdownNum.textContent = '2';
            restartCssAnimation(countdownNum, 'pop', [
              { transform: 'scale(0.5)', opacity: 0 },
              { transform: 'scale(1.25)', opacity: 1 },
              { transform: 'scale(1)', opacity: 1 }
            ], { duration: 300, easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)', fill: 'forwards' });
          }
          playBeep(2);
          safeVibrate(20);
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
    unlockSecretMenuOnReturnHome();
    resultOverlay.classList.remove('active');
    startOverlay.classList.add('active');
    cleanupCurrentGimmick();
  });

  // =========================================================================
  // SECRET MENU (裏メニュー：ホーム帰還後に出現する鍵マーク ＆ 3つの特別モード)
  // =========================================================================
  const secretMenuBtn = document.getElementById('secret-menu-btn');
  const secretMenuOverlay = document.getElementById('secret-menu-overlay');
  const secretMenuCloseBtn = document.getElementById('secret-menu-close-btn');
  const secretModeNormalBtn = document.getElementById('secret-mode-normal-btn');
  const currentModeBadge = document.getElementById('current-mode-badge');
  const tutoRewardText = document.getElementById('tuto-reward-text');

  function updateSecretKeyVisibility() {
    if (!secretMenuBtn) return;
    if (hasUnlockedSecret) {
      secretMenuBtn.classList.add('unlocked');
    } else {
      secretMenuBtn.classList.remove('unlocked');
    }
  }

  function updateTitleModeUI() {
    const modeCfg = GAME_MODES[currentMode] || GAME_MODES.normal;
    if (currentModeBadge) {
      currentModeBadge.textContent = modeCfg.label;
      currentModeBadge.className = `current-mode-badge mode-${modeCfg.id}`;
    }
    if (tutoRewardText) {
      tutoRewardText.textContent = modeCfg.tutoRewardText;
    }
    if ( !isPlaying ) {
      timeDisplay.textContent = modeCfg.isCountUp ? '0.0' : modeCfg.initialTime.toFixed(1);
      const hudTimeLabel = document.getElementById('hud-time-label');
      const hudScoreLabel = document.getElementById('hud-score-label');
      if (hudTimeLabel) hudTimeLabel.textContent = modeCfg.isCountUp ? 'TIME (UP)' : 'TIME';
      if (hudScoreLabel) hudScoreLabel.textContent = modeCfg.targetScore ? `SCORE / ${modeCfg.targetScore}` : 'SCORE';
    }
  }

  function updateSecretMenuBestRecords() {
    const best1MinEl = document.getElementById('secret-best-fixed_1min');
    const bestSuddenEl = document.getElementById('secret-best-sudden_death');
    const bestTa5000El = document.getElementById('secret-best-time_attack_5000');

    if (best1MinEl) {
      best1MinEl.textContent = `${getModeBestRecord('fixed_1min').toLocaleString()} pt`;
    }
    if (bestSuddenEl) {
      bestSuddenEl.textContent = `${getModeBestRecord('sudden_death').toLocaleString()} pt`;
    }
    if (bestTa5000El) {
      const bestMs = getModeBestRecord('time_attack_5000');
      bestTa5000El.textContent = bestMs > 0 ? `${(bestMs / 1000).toFixed(1)}s` : '--.-s';
    }

    const items = document.querySelectorAll('.secret-mode-item');
    items.forEach((item) => {
      if (item.dataset.mode === currentMode) {
        item.classList.add('is-selected');
      } else {
        item.classList.remove('is-selected');
      }
    });
  }

  function selectGameMode(modeId) {
    if (!GAME_MODES[modeId]) return;
    currentMode = modeId;
    updateTitleModeUI();
    updateSecretMenuBestRecords();
  }

  function openSecretMenu() {
    if (!secretMenuOverlay) return;
    playSound('tap');
    updateSecretMenuBestRecords();
    secretMenuOverlay.classList.add('active');
  }

  function closeSecretMenu() {
    if (!secretMenuOverlay) return;
    playSound('tap');
    secretMenuOverlay.classList.remove('active');
  }

  if (secretMenuBtn) {
    setupActionButton(secretMenuBtn, openSecretMenu);
  }
  if (secretMenuCloseBtn) {
    setupActionButton(secretMenuCloseBtn, closeSecretMenu);
  }
  if (secretModeNormalBtn) {
    setupActionButton(secretModeNormalBtn, () => {
      selectGameMode('normal');
      closeSecretMenu();
    });
  }

  document.querySelectorAll('.secret-mode-select-btn').forEach((btn) => {
    setupActionButton(btn, () => {
      const targetMode = btn.dataset.mode;
      if (targetMode && GAME_MODES[targetMode]) {
        selectGameMode(targetMode);
        closeSecretMenu();
      }
    });
  });

  document.querySelectorAll('.secret-mode-lb-btn').forEach((btn) => {
    setupActionButton(btn, () => {
      const targetMode = btn.dataset.mode;
      if (targetMode && GAME_MODES[targetMode]) {
        if (secretMenuOverlay) secretMenuOverlay.classList.remove('active');
        openLeaderboard(false, targetMode);
      }
    });
  });

  // 初期表示時の鍵マーク＆モードUI同期
  updateSecretKeyVisibility();
  updateTitleModeUI();

  // 🛠️ DEBUG MODE CONTROLS
  const debugBtn = document.getElementById('debug-btn');
  const titleEmblem = document.getElementById('title-emblem-wrap');
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
  setupActionButton(debugCloseBtn, toggleDebug);

  // タイトル文字上の鍵マーク長押しでデバッグモード起動
  function setupTitleLockHold(el) {
    if (!el) return;
    let holdTimer = null;
    const HOLD_TIME_MS = 3000;

    function startHold(e) {
      if (e && e.pointerType === 'mouse' && e.button !== 0) return;
      clearTimeout(holdTimer);
      el.classList.add('is-holding-debug');
      holdTimer = setTimeout(() => {
        el.classList.remove('is-holding-debug');
        toggleDebug();
        initAudio();
        playSound('unlock');
        safeVibrate(30);
      }, HOLD_TIME_MS);
    }

    function cancelHold() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      el.classList.remove('is-holding-debug');
    }

    el.addEventListener('pointerdown', startHold);
    el.addEventListener('pointerup', cancelHold);
    el.addEventListener('pointercancel', cancelHold);
    el.addEventListener('pointerleave', cancelHold);

    el.addEventListener('touchstart', (e) => { startHold(e); }, { passive: true });
    el.addEventListener('touchend', cancelHold);
    el.addEventListener('mousedown', startHold);
    el.addEventListener('mouseup', cancelHold);
    el.addEventListener('mouseleave', cancelHold);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  setupTitleLockHold(titleEmblem);

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

    const debugRound = window.__debugRound || roundNumber || 1;
    currentLock = initLockGimmickState({
      ...targetDef,
      round: debugRound,
      points: targetDef.basePoints
    });
    renderGimmick(currentLock);
    renderNextGimmickPreview(nextLock);
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
    restartCssAnimation(timeAddedAnim, 'animate', [
      { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateX(-50%) translateY(14px) scale(1.15)' }
    ], { duration: 600, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => { timeAddedAnim.textContent = '+1.0s'; }, 700);
    playSound('unlock');
  });

  setupActionButton(debugGameoverBtn, () => {
    if (!isPlaying) return;
    endGame();
  });

  // =========================================================================
  // ONLINE LEADERBOARD (4モード完全分離: 通常 / 1分固定 / 1ミス終了 / 5000pt TA)
  // =========================================================================
  // Google Apps Script (Web App) URL
  const LEADERBOARD_API_URL = 'https://script.google.com/macros/s/AKfycbyr_DQT0yCz7xrz1mARFhZ6015VwRdwG0K9uHi5WAF7BC1uIcNmBiiAP3jS6_dUL-IQMQ/exec';

  const STORAGE_KEY_PLAYER_ID = 'lock_player_id';
  const STORAGE_KEY_PLAYER_NAME = 'lock_player_name';

  let activeLeaderboardMode = 'normal';
  let isLeaderboardOpenedFromResult = false;

  // プレイヤーIDの取得または新規発行
  function getOrCreatePlayerId() {
    let pid = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
    if (!pid) {
      pid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem(STORAGE_KEY_PLAYER_ID, pid);
    }
    return pid;
  }

  function getModeScopedPlayerId(modeId) {
    const baseId = getOrCreatePlayerId();
    return (!modeId || modeId === 'normal') ? baseId : `${baseId}__${modeId}`;
  }

  // プレイヤー名の取得
  function getPlayerName() {
    return localStorage.getItem(STORAGE_KEY_PLAYER_NAME) || '';
  }

  // プレイヤー名の保存
  function setPlayerName(name) {
    const trimmed = (name || '').trim().substring(0, 10);
    localStorage.setItem(STORAGE_KEY_PLAYER_NAME, trimmed);
    return trimmed;
  }

  // モード別初期モックデータ
  const DEFAULT_MOCK_BOARDS_BY_MODE = {
    normal: [
      { id: 'bot_1', name: 'MasterKey', score: 4520, locks: 28 },
      { id: 'bot_2', name: 'SpeedyLock', score: 3860, locks: 24 },
      { id: 'bot_3', name: 'CipherZero', score: 3120, locks: 19 },
      { id: 'bot_4', name: 'LockSmith', score: 2480, locks: 16 },
      { id: 'bot_5', name: 'QuickFinger', score: 1850, locks: 12 },
      { id: 'bot_6', name: 'NoviceThief', score: 1200, locks: 8 }
    ],
    fixed_1min: [
      { id: 'bot_1m_1__fixed_1min', name: 'ChronoKing', score: 6240, locks: 38 },
      { id: 'bot_1m_2__fixed_1min', name: 'MinuteRush', score: 5180, locks: 32 },
      { id: 'bot_1m_3__fixed_1min', name: 'SixtySec', score: 4320, locks: 27 },
      { id: 'bot_1m_4__fixed_1min', name: 'BlitzOpener', score: 3450, locks: 22 },
      { id: 'bot_1m_5__fixed_1min', name: 'SteadyHand', score: 2610, locks: 17 }
    ],
    sudden_death: [
      { id: 'bot_sd_1__sudden_death', name: 'NoMissPro', score: 4120, locks: 26 },
      { id: 'bot_sd_2__sudden_death', name: 'SniperLock', score: 3380, locks: 21 },
      { id: 'bot_sd_3__sudden_death', name: 'ZeroFault', score: 2640, locks: 17 },
      { id: 'bot_sd_4__sudden_death', name: 'CalmTouch', score: 1920, locks: 13 },
      { id: 'bot_sd_5__sudden_death', name: 'CarefulOne', score: 1180, locks: 8 }
    ],
    time_attack_5000: [
      { id: 'bot_ta_1__time_attack_5000', name: 'SonicKey', score: 32400, locks: 31 },
      { id: 'bot_ta_2__time_attack_5000', name: 'FlashUnlocker', score: 38800, locks: 32 },
      { id: 'bot_ta_3__time_attack_5000', name: 'TurboDial', score: 44500, locks: 33 },
      { id: 'bot_ta_4__time_attack_5000', name: 'Sprint5000', score: 52100, locks: 34 },
      { id: 'bot_ta_5__time_attack_5000', name: 'RapidRunner', score: 61800, locks: 35 }
    ]
  };

  function sortRecordsForMode(list, modeId) {
    const cfg = GAME_MODES[modeId] || GAME_MODES.normal;
    const copied = [...list];
    if (cfg.isCountUp) {
      // 5000pt タイムアタックはタイム(ms)が小さい順
      copied.sort((a, b) => Number(a.score) - Number(b.score));
    } else {
      // スコアモードはスコアが大きい順
      copied.sort((a, b) => Number(b.score) - Number(a.score));
    }
    return copied;
  }

  function getLocalMockLeaderboard(modeId = activeLeaderboardMode) {
    const cfg = GAME_MODES[modeId] || GAME_MODES.normal;
    try {
      const saved = localStorage.getItem(cfg.boardStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return sortRecordsForMode(parsed, modeId);
      }
    } catch (e) {}
    const defaults = DEFAULT_MOCK_BOARDS_BY_MODE[modeId] || DEFAULT_MOCK_BOARDS_BY_MODE.normal;
    return sortRecordsForMode(defaults, modeId);
  }

  function saveLocalMockLeaderboard(list, modeId = activeLeaderboardMode) {
    const cfg = GAME_MODES[modeId] || GAME_MODES.normal;
    try {
      localStorage.setItem(cfg.boardStorageKey, JSON.stringify(sortRecordsForMode(list, modeId)));
    } catch (e) {}
  }

  function upsertLocalRecord(modeId, record) {
    const list = getLocalMockLeaderboard(modeId);
    const cfg = GAME_MODES[modeId] || GAME_MODES.normal;
    const existingIdx = list.findIndex(item => item.id === record.id);
    if (existingIdx >= 0) {
      const prevScore = Number(list[existingIdx].score);
      const nextScore = Number(record.score);
      const isBetter = cfg.isCountUp ? (nextScore > 0 && nextScore <= prevScore) : (nextScore >= prevScore);
      if (isBetter) {
        list[existingIdx].score = nextScore;
        list[existingIdx].locks = record.locks;
      }
      list[existingIdx].name = record.name;
    } else {
      list.push({ ...record });
    }
    const sorted = sortRecordsForMode(list, modeId);
    saveLocalMockLeaderboard(sorted, modeId);
    return sorted;
  }

  // DOM要素
  const leaderboardOverlay = document.getElementById('leaderboard-overlay');
  const lbCloseBtn = document.getElementById('lb-close-btn');
  const lbRefreshBtn = document.getElementById('lb-refresh-btn');
  const lbCurrentPlayerName = document.getElementById('lb-current-player-name');
  const lbChangeNameBtn = document.getElementById('lb-change-name-btn');
  const lbSubmitActionRow = document.getElementById('lb-submit-action-row');
  const lbSubmitScoreBtn = document.getElementById('lb-submit-score-btn');
  const lbSubmitBtnLabel = document.getElementById('lb-submit-btn-label');
  const lbSubmitMsg = document.getElementById('lb-submit-msg');
  const lbRankingList = document.getElementById('lb-ranking-list');
  const lbColScoreHeader = document.getElementById('lb-col-score-header');
  const lbModeTabs = document.querySelectorAll('#lb-mode-tabs .lb-mode-tab');

  const nameInputOverlay = document.getElementById('name-input-overlay');
  const playerNameInput = document.getElementById('player-name-input');
  const nameModalCancelBtn = document.getElementById('name-modal-cancel-btn');
  const nameModalSaveBtn = document.getElementById('name-modal-save-btn');

  const resultLbBtn = document.getElementById('leaderboard-btn');
  const startLbBtn = document.getElementById('start-leaderboard-btn');

  // メッセージ表示用タイマー
  let lbMsgTimeout = null;
  function showLeaderboardMessage(text, type = 'success') {
    if (!lbSubmitMsg) return;
    lbSubmitMsg.textContent = text;
    lbSubmitMsg.className = 'lb-submit-msg ' + type;
    if (lbMsgTimeout) clearTimeout(lbMsgTimeout);
    lbMsgTimeout = setTimeout(() => {
      if (lbSubmitMsg) lbSubmitMsg.textContent = '';
    }, 4500);
  }

  // JSONP通信ヘルパー（CORS制限を完全回避）
  function fetchJsonp(url, timeoutMs = 7000) {
    return new Promise((resolve, reject) => {
      const cbName = 'onLbCb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP timeout'));
      }, timeoutMs);

      function cleanup() {
        if (script.parentNode) script.parentNode.removeChild(script);
        window[cbName] = () => {};
        setTimeout(() => { try { delete window[cbName]; } catch (e) {} }, 10000);
        clearTimeout(timer);
      }

      window[cbName] = function(data) {
        cleanup();
        resolve(data);
      };

      const sep = url.includes('?') ? '&' : '?';
      script.src = `${url}${sep}callback=${cbName}&_t=${Date.now()}`;
      script.onerror = function() {
        cleanup();
        reject(new Error('JSONP load error'));
      };
      document.head.appendChild(script);
    });
  }

  // GAS返却データから該当モードのレコードのみを厳密抽出＋ローカル保存分とマージ
  function filterAndMergeModeRecords(remoteRecords, modeId) {
    const localList = getLocalMockLeaderboard(modeId);
    if (!Array.isArray(remoteRecords)) return localList;

    const suffix = `__${modeId}`;
    const filteredRemote = remoteRecords.filter((row) => {
      if (!row) return false;
      const rid = String(row.id || '');
      const rmode = row.mode ? String(row.mode) : '';
      if (rmode) {
        return rmode === modeId;
      }
      if (modeId === 'normal') {
        return !rid.includes('__');
      }
      return rid.endsWith(suffix);
    });

    if (filteredRemote.length === 0) {
      return localList;
    }

    const mergedMap = new Map();
    for (const item of filteredRemote) {
      mergedMap.set(String(item.id), { ...item });
    }
    // ローカルで送信済みの自分の記録なども欠落しないようマージ
    const myScopedId = getModeScopedPlayerId(modeId);
    const localMe = localList.find(item => item.id === myScopedId);
    if (localMe) {
      const existing = mergedMap.get(myScopedId);
      const cfg = GAME_MODES[modeId] || GAME_MODES.normal;
      if (!existing) {
        mergedMap.set(myScopedId, localMe);
      } else {
        const isLocalBetter = cfg.isCountUp
          ? (Number(localMe.score) < Number(existing.score))
          : (Number(localMe.score) > Number(existing.score));
        if (isLocalBetter) {
          mergedMap.set(myScopedId, localMe);
        }
      }
    }

    return sortRecordsForMode(Array.from(mergedMap.values()), modeId);
  }

  // リーダーボードの取得
  async function fetchLeaderboardData(modeId = activeLeaderboardMode) {
    if (!LEADERBOARD_API_URL) {
      return getLocalMockLeaderboard(modeId);
    }

    try {
      const res = await fetch(`${LEADERBOARD_API_URL}?action=get_scores&mode=${encodeURIComponent(modeId)}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Network error: ' + res.status);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (data && Array.isArray(data.records) ? data.records : null);
      if (raw) return filterAndMergeModeRecords(raw, modeId);
    } catch (err) {
      console.warn('Direct fetch failed, falling back to JSONP:', err);
      try {
        const jsonpData = await fetchJsonp(`${LEADERBOARD_API_URL}?action=get_scores&mode=${encodeURIComponent(modeId)}`);
        const raw = (jsonpData && Array.isArray(jsonpData.records)) ? jsonpData.records : (Array.isArray(jsonpData) ? jsonpData : null);
        if (raw) return filterAndMergeModeRecords(raw, modeId);
      } catch (jsonpErr) {
        console.warn('JSONP fetch also failed, using local cache:', jsonpErr);
      }
    }
    return getLocalMockLeaderboard(modeId);
  }

  // スコア・タイムの送信（モード別ID＆ローカル同期で完全分離）
  async function submitLeaderboardScore(scoreToSend, locksToSend, isSilent = false, modeId = lastPlayedMode) {
    const targetMode = GAME_MODES[modeId] ? modeId : 'normal';
    const scopedId = getModeScopedPlayerId(targetMode);
    const myName = getPlayerName();

    if (!myName) {
      if (!isSilent) openNameModal();
      return;
    }

    if (!isSilent) {
      if (lbSubmitScoreBtn) lbSubmitScoreBtn.disabled = true;
      showLeaderboardMessage('送信中...', 'loading');
    }

    // まずモード別ローカルリーダーボードへ確実に反映し、画面へ即時描画
    const updatedLocalList = upsertLocalRecord(targetMode, {
      id: scopedId,
      name: myName,
      score: scoreToSend,
      locks: locksToSend,
      mode: targetMode
    });

    if (!isSilent && activeLeaderboardMode === targetMode) {
      renderLeaderboardTable(updatedLocalList, targetMode);
    }

    if (!LEADERBOARD_API_URL) {
      if (!isSilent) {
        showLeaderboardMessage('送信完了！');
        playSound('unlock');
        await loadAndRenderLeaderboard(activeLeaderboardMode);
        if (lbSubmitScoreBtn) lbSubmitScoreBtn.disabled = false;
      }
      return;
    }

    const postUrl = `${LEADERBOARD_API_URL}?action=submit&mode=${encodeURIComponent(targetMode)}&id=${encodeURIComponent(scopedId)}&name=${encodeURIComponent(myName)}&score=${encodeURIComponent(scoreToSend)}&locks=${encodeURIComponent(locksToSend)}`;

    try {
      await Promise.race([
        fetch(postUrl, { method: 'GET', mode: 'no-cors' }),
        fetchJsonp(postUrl, 3500).catch(() => {})
      ]);

      if (!isSilent) {
        showLeaderboardMessage('送信完了！');
        playSound('unlock');
        setTimeout(async () => {
          await loadAndRenderLeaderboard(activeLeaderboardMode);
          if (lbSubmitScoreBtn) lbSubmitScoreBtn.disabled = false;
        }, 1000);
      }
    } catch (err) {
      console.warn('Submit fallback:', err);
      if (!isSilent) {
        showLeaderboardMessage('送信完了！');
        playSound('unlock');
        setTimeout(async () => {
          await loadAndRenderLeaderboard(activeLeaderboardMode);
          if (lbSubmitScoreBtn) lbSubmitScoreBtn.disabled = false;
        }, 1000);
      }
    }
  }

  // ハイスコア・ベストタイム更新時の自動送信（名前登録済みの場合のみ）
  function autoSubmitScoreIfRegistered(newRecordVal, newLocks, modeId = currentMode) {
    const myName = getPlayerName();
    if (myName && newRecordVal > 0) {
      submitLeaderboardScore(newRecordVal, newLocks, true, modeId);
    }
  }

  // ランキングテーブル描画（1〜3位はSVGメダル、タイムアタック時は秒数表記）
  function renderLeaderboardTable(records, modeId = activeLeaderboardMode) {
    if (!lbRankingList) return;
    const cfg = GAME_MODES[modeId] || GAME_MODES.normal;
    if (lbColScoreHeader) {
      lbColScoreHeader.textContent = cfg.isCountUp ? 'タイム' : 'スコア';
    }

    if (!records || records.length === 0) {
      lbRankingList.innerHTML = '<div class="lb-empty-msg">まだ記録がありません</div>';
      return;
    }

    const myBaseId = getOrCreatePlayerId();
    const myScopedId = getModeScopedPlayerId(modeId);
    let html = '';

    records.forEach((row, idx) => {
      const rank = idx + 1;
      let rankBadgeHtml = `${rank}`;
      let rankClass = `rank-${rank}`;

      if (rank === 1) {
        rankBadgeHtml = `<span class="lb-rank-badge-svg lb-badge-1"><svg viewBox="0 0 24 24" width="16" height="16" fill="#f1c40f"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.76 2.72 3.19 3.32V19H8v2h8v-2h-2.58v-2.74c1.43-.6 2.56-1.82 3.19-3.32C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg> 1</span>`;
      } else if (rank === 2) {
        rankBadgeHtml = `<span class="lb-rank-badge-svg lb-badge-2"><svg viewBox="0 0 24 24" width="16" height="16" fill="#ced6e0"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 2</span>`;
      } else if (rank === 3) {
        rankBadgeHtml = `<span class="lb-rank-badge-svg lb-badge-3"><svg viewBox="0 0 24 24" width="16" height="16" fill="#e67e22"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 3</span>`;
      }

      const isMe = (row.id === myScopedId || row.id === myBaseId);
      const meClass = isMe ? 'is-me' : '';
      const formattedVal = cfg.isCountUp
        ? `${(Number(row.score) / 1000).toFixed(1)}s`
        : Number(row.score).toLocaleString();

      html += `
        <div class="lb-row ${rankClass} ${meClass}">
          <span class="col-rank">${rankBadgeHtml}</span>
          <span class="col-name" title="${escapeHtml(row.name)}">${escapeHtml(row.name)}${isMe ? ' (あなた)' : ''}</span>
          <span class="col-score">${formattedVal}</span>
          <span class="col-locks">${Number(row.locks)}</span>
        </div>
      `;
    });

    lbRankingList.innerHTML = html;
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function updateLeaderboardSubmitRow() {
    if (!lbSubmitActionRow) return;
    if (!isLeaderboardOpenedFromResult || activeLeaderboardMode !== lastPlayedMode) {
      lbSubmitActionRow.style.display = 'none';
      return;
    }

    const cfg = GAME_MODES[lastPlayedMode] || GAME_MODES.normal;
    if (cfg.isCountUp) {
      if (lastPlayedCleared && lastPlayedTimeMs > 0) {
        lbSubmitActionRow.style.display = 'flex';
        if (lbSubmitBtnLabel) {
          lbSubmitBtnLabel.innerHTML = `タイム送信 (<span id="lb-submit-score-val">${(lastPlayedTimeMs / 1000).toFixed(1)}s</span>)`;
        }
      } else {
        lbSubmitActionRow.style.display = 'none';
      }
    } else {
      const currentPlayScore = lastPlayedScore > 0 ? lastPlayedScore : (score > 0 ? score : 0);
      if (currentPlayScore > 0) {
        lbSubmitActionRow.style.display = 'flex';
        if (lbSubmitBtnLabel) {
          lbSubmitBtnLabel.innerHTML = `スコア送信 (<span id="lb-submit-score-val">${currentPlayScore.toLocaleString()}</span> pt)`;
        }
      } else {
        lbSubmitActionRow.style.display = 'none';
      }
    }
  }

  function syncLeaderboardModeTabs() {
    lbModeTabs.forEach((tab) => {
      if (tab.dataset.mode === activeLeaderboardMode) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // リーダーボードの読み込み＆描画
  async function loadAndRenderLeaderboard(modeId = activeLeaderboardMode) {
    if (!lbRankingList) return;
    const requestedMode = GAME_MODES[modeId] ? modeId : 'normal';
    activeLeaderboardMode = requestedMode;
    const cfg = GAME_MODES[requestedMode] || GAME_MODES.normal;
    if (lbColScoreHeader) {
      lbColScoreHeader.textContent = cfg.isCountUp ? 'タイム' : 'スコア';
    }
    syncLeaderboardModeTabs();
    updateLeaderboardSubmitRow();
    lbRankingList.innerHTML = '<div class="lb-loading-spinner">ランキング読込中...</div>';
    const records = await fetchLeaderboardData(requestedMode);
    if (activeLeaderboardMode !== requestedMode) return;
    renderLeaderboardTable(records, requestedMode);
  }

  // リーダーボードモーダルを開く
  // isFromResult: リザルト画面から開かれた場合のみ true
  function openLeaderboard(isFromResult = false, targetMode = null) {
    if (!leaderboardOverlay) return;
    playSound('tap');

    isLeaderboardOpenedFromResult = Boolean(isFromResult);
    activeLeaderboardMode = targetMode || (isFromResult ? lastPlayedMode : currentMode) || 'normal';

    const myName = getPlayerName();
    if (lbCurrentPlayerName) {
      lbCurrentPlayerName.textContent = myName || '未登録';
      if (!myName) {
        lbCurrentPlayerName.classList.add('lb-unregistered');
      } else {
        lbCurrentPlayerName.classList.remove('lb-unregistered');
      }
    }

    if (lbSubmitMsg) lbSubmitMsg.textContent = '';
    leaderboardOverlay.classList.add('active');
    loadAndRenderLeaderboard(activeLeaderboardMode);
  }

  function closeLeaderboard() {
    if (!leaderboardOverlay) return;
    playSound('tap');
    leaderboardOverlay.classList.remove('active');
  }

  // モード切替タブのクリック処理
  lbModeTabs.forEach((tab) => {
    setupActionButton(tab, () => {
      const modeId = tab.dataset.mode;
      if (!modeId || !GAME_MODES[modeId]) return;
      playSound('tap');
      if (lbSubmitMsg) lbSubmitMsg.textContent = '';
      loadAndRenderLeaderboard(modeId);
    });
  });

  // 名前入力モーダル
  function openNameModal() {
    if (!nameInputOverlay) return;
    playSound('tap');
    if (playerNameInput) {
      playerNameInput.value = getPlayerName();
    }
    nameInputOverlay.classList.add('active');
    setTimeout(() => {
      if (playerNameInput) playerNameInput.focus();
    }, 100);
  }

  function closeNameModal() {
    if (!nameInputOverlay) return;
    playSound('tap');
    nameInputOverlay.classList.remove('active');
  }

  function getRecordToSendForLastPlay() {
    const cfg = GAME_MODES[lastPlayedMode] || GAME_MODES.normal;
    const targetLocks = lastPlayedLocks > 0 ? lastPlayedLocks : (unlockedCountNum > 0 ? unlockedCountNum : 0);
    if (cfg.isCountUp) {
      return {
        value: lastPlayedCleared ? lastPlayedTimeMs : 0,
        locks: targetLocks,
        mode: lastPlayedMode
      };
    }
    return {
      value: lastPlayedScore > 0 ? lastPlayedScore : (score > 0 ? score : 0),
      locks: targetLocks,
      mode: lastPlayedMode
    };
  }

  function handleSavePlayerName() {
    if (!playerNameInput) return;
    const inputVal = playerNameInput.value.trim();
    if (!inputVal) {
      alert('プレイヤー名を入力してください（1〜10文字）');
      playerNameInput.focus();
      return;
    }

    const saved = setPlayerName(inputVal);
    if (lbCurrentPlayerName) {
      lbCurrentPlayerName.textContent = saved;
      lbCurrentPlayerName.classList.remove('lb-unregistered');
    }
    closeNameModal();

    // 名前登録直後に直前プレイ記録の送信を実行
    const rec = getRecordToSendForLastPlay();
    if (rec.value > 0) {
      submitLeaderboardScore(rec.value, rec.locks, false, rec.mode);
    }
  }

  // イベントリスナーの結線
  if (resultLbBtn) setupActionButton(resultLbBtn, () => openLeaderboard(true, lastPlayedMode));
  if (startLbBtn) setupActionButton(startLbBtn, () => openLeaderboard(false, currentMode));
  if (lbCloseBtn) setupActionButton(lbCloseBtn, closeLeaderboard);

  // 再読み込みボタン
  if (lbRefreshBtn) {
    setupActionButton(lbRefreshBtn, async () => {
      playSound('tap');
      lbRefreshBtn.classList.add('rotating');
      await loadAndRenderLeaderboard(activeLeaderboardMode);
      setTimeout(() => {
        lbRefreshBtn.classList.remove('rotating');
      }, 500);
    });
  }

  if (lbChangeNameBtn) {
    setupActionButton(lbChangeNameBtn, openNameModal);
  }

  if (lbSubmitScoreBtn) {
    setupActionButton(lbSubmitScoreBtn, () => {
      const myName = getPlayerName();
      if (!myName) {
        openNameModal();
      } else {
        const rec = getRecordToSendForLastPlay();
        if (rec.value > 0) {
          submitLeaderboardScore(rec.value, rec.locks, false, rec.mode);
        }
      }
    });
  }

  if (nameModalCancelBtn) setupActionButton(nameModalCancelBtn, closeNameModal);
  if (nameModalSaveBtn) setupActionButton(nameModalSaveBtn, handleSavePlayerName);

  if (playerNameInput) {
    playerNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSavePlayerName();
      }
    });
  }
});

