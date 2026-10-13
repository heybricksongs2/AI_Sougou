// POP LOCK RUSH! - 30 Ultimate Creative Gimmicks
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
  const lockFace = document.getElementById('lock-face');
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

  // Canvas Particles
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let particles = [];
  function createBurst(x, y, count = 30) {
    const colors = ['#ff4757', '#2ed573', '#ffa502', '#1e90ff', '#ffffff', '#9b59b6'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  function updateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(updateParticles);
  }
  updateParticles();

  // Web Audio Synth
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'unlock') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'mistake') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'warning') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {}
  }

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
  });

  // 30 Ultimate Gimmicks: Level 1 to 30
  const LOCK_DEFINITIONS = [
    { level: 1,  type: 'giant_button',     icon: '🐘', stars: '★☆☆☆☆', basePoints: 100 },
    { level: 2,  type: 'switch_slide',     icon: '🎚️', stars: '★☆☆☆☆', basePoints: 120 },
    { level: 3,  type: 'key_drag',         icon: '🔑', stars: '★☆☆☆☆', basePoints: 140 },
    { level: 4,  type: 'slide_twist',      icon: '🗝️', stars: '★★☆☆☆', basePoints: 160 },
    { level: 5,  type: 'double_tap',       icon: '✌️', stars: '★★☆☆☆', basePoints: 180 },
    { level: 6,  type: 'crank_slide',      icon: '🧩', stars: '★★☆☆☆', basePoints: 200 },
    { level: 7,  type: 'slide_right',      icon: '➡️', stars: '★★☆☆☆', basePoints: 220 },
    { level: 8,  type: 'slide_up',         icon: '⬆️', stars: '★★★☆☆', basePoints: 240 },
    { level: 9,  type: 'gesture_mark',     icon: '✍️', stars: '★★★☆☆', basePoints: 260 },
    { level: 10, type: 'match_key',        icon: '🔍', stars: '★★★☆☆', basePoints: 280 },
    { level: 11, type: 'color_mix',        icon: '🎨', stars: '★★★☆☆', basePoints: 310 },
    { level: 12, type: 'pattern_lock',     icon: '🔢', stars: '★★★★☆', basePoints: 340 },
    { level: 13, type: 'rapid_mash',       icon: '⚡', stars: '★★★★☆', basePoints: 370 },
    { level: 14, type: 'hover_thrust',     icon: '🚀', stars: '★★★★☆', basePoints: 400 },
    { level: 15, type: 'star_trace',       icon: '⭐', stars: '★★★★☆', basePoints: 430 },
    { level: 16, type: 'dial_code',        icon: '🔐', stars: '★★★★☆', basePoints: 460 },
    { level: 17, type: 'moving_btn',       icon: '🏃', stars: '★★★★☆', basePoints: 490 },
    { level: 18, type: 'switch_slide_rev', icon: '🎛️', stars: '★★★★☆', basePoints: 520 },
    { level: 19, type: 'morse_code',       icon: '📻', stars: '★★★★★', basePoints: 550 },
    { level: 20, type: 'wheel_turn',       icon: '⚙️', stars: '★★★★★', basePoints: 580 },
    { level: 21, type: 'triple_tap',       icon: '👌', stars: '★★★★★', basePoints: 610 },
    { level: 22, type: 'color_choice_2',   icon: '🎨', stars: '★★★★★', basePoints: 640 },
    { level: 23, type: 'shape_choice_2',   icon: '🔷', stars: '★★★★★', basePoints: 670 },
    { level: 24, type: 'fingerprint',      icon: '🛡️', stars: '★★★★★', basePoints: 700 },
    { level: 25, type: 'dial_turn',        icon: '🧭', stars: '★★★★★', basePoints: 730 },
    { level: 26, type: 'irira_key_maze',   icon: '⚡', stars: '★★★★★', basePoints: 760 },
    { level: 27, type: 'hover_thrust_hard',icon: '🛸', stars: '★★★★★', basePoints: 800 },
    { level: 28, type: 'tiny_moving_btn',  icon: '🐜', stars: '★★★★★', basePoints: 850 },
    { level: 29, type: 'super_mash',       icon: '💥', stars: '★★★★★', basePoints: 900 },
    { level: 30, type: 'star_trace_fast',  icon: '🌟', stars: '★★★★★', basePoints: 1000 }
  ];

  const faces = {
    normal: ['😏', '😎', '🤖', '🦊', '🎩', '😺', '🤠'],
    trying: ['😬', '🤨', '😲', '😅', '🥵'],
    happy: ['🥳', '🎉', '🤩', '😆', '✨'],
    error: ['💥', '😵', '😱', '🥴', '⚡']
  };

  function getRandomFace(category) {
    const list = faces[category] || faces.normal;
    return list[Math.floor(Math.random() * list.length)];
  }

  // Queue System
  let lockQueue = [];
  let roundNumber = 1;

  function buildRoundQueue(round) {
    if (round === 1) {
      return LOCK_DEFINITIONS.map(def => ({
        ...def,
        round,
        points: def.basePoints,
        face: getRandomFace('normal')
      }));
    } else {
      const shuffled = [...LOCK_DEFINITIONS].sort(() => Math.random() - 0.5);
      return shuffled.map(def => ({
        ...def,
        round,
        points: def.basePoints + (round - 1) * 120,
        face: getRandomFace('normal')
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
    gimmickContainer.innerHTML = '';
  }

  // Render 30 Non-Verbal Gimmicks
  function renderGimmick(lock) {
    cleanupCurrentGimmick();
    lockLevelBadge.textContent = `Lv.${lock.level} ${lock.icon}`;
    lockDiff.textContent = lock.stars;
    lockFace.textContent = lock.face;
    currentShackle.classList.remove('open');

    // 1. アホみたいにデカいボタン 🐘
    if (lock.type === 'giant_button') {
      const btn = document.createElement('button');
      btn.className = 'giant-action-btn';
      btn.textContent = '💥';
      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });
      gimmickContainer.appendChild(btn);

    // 2 & 18. スイッチスライド 🎚️ / 🎛️
    } else if (lock.type === 'switch_slide' || lock.type === 'switch_slide_rev') {
      const isRev = (lock.type === 'switch_slide_rev');
      const track = document.createElement('div');
      track.className = `switch-slider-track ${isRev ? 'on' : ''}`;

      const arrows = document.createElement('div');
      arrows.className = 'switch-arrows-hint';
      arrows.textContent = isRev ? '◀◀' : '▶▶';

      const knob = document.createElement('div');
      knob.className = 'switch-draggable-knob';
      if (isRev) {
        knob.style.right = '4px';
        knob.textContent = '🔴';
      } else {
        knob.style.left = '4px';
        knob.textContent = '⚪';
      }

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
        if (!isRev) {
          let diff = curX - rect.left - 24;
          diff = Math.max(4, Math.min(maxDist, diff));
          knob.style.left = diff + 'px';
          if (diff >= maxDist - 6) {
            isDragging = false;
            track.classList.add('on');
            knob.textContent = '🟢';
            setTimeout(() => resolveLockSuccess(), 100);
          }
        } else {
          let diff = rect.right - curX - 24;
          diff = Math.max(4, Math.min(maxDist, diff));
          knob.style.right = diff + 'px';
          if (diff >= maxDist - 6) {
            isDragging = false;
            track.classList.remove('on');
            knob.textContent = '🟢';
            setTimeout(() => resolveLockSuccess(), 100);
          }
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          if (isRev) knob.style.right = '4px';
          else knob.style.left = '4px';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: true });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 3. 鍵ドラッグ差し込み 🔑
    } else if (lock.type === 'key_drag') {
      const container = document.createElement('div');
      container.className = 'key-drag-container';

      const targetHole = document.createElement('div');
      targetHole.className = 'key-drop-target';
      targetHole.textContent = '🕳️';

      const guide = document.createElement('div');
      guide.className = 'key-arrow-guide';
      guide.textContent = '⬆️';

      const keyItem = document.createElement('div');
      keyItem.className = 'drag-key-item';
      keyItem.textContent = '🔑';

      container.appendChild(targetHole);
      container.appendChild(guide);
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
          targetHole.textContent = '🗝️';
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

    // 4. スライドして回転 🗝️
    } else if (lock.type === 'slide_twist') {
      const stage = document.createElement('div');
      stage.className = 'twist-stage';

      const lockBox = document.createElement('div');
      lockBox.className = 'twist-lock-box';

      const keyEl = document.createElement('div');
      keyEl.className = 'twistable-key';
      keyEl.textContent = '🗝️';
      keyEl.style.transform = 'translateX(-35px)';

      const guideArrow = document.createElement('div');
      guideArrow.style.fontSize = '1.3rem';
      guideArrow.style.color = '#1e90ff';
      guideArrow.textContent = '➡️ ↻';

      lockBox.appendChild(keyEl);
      stage.appendChild(guideArrow);
      stage.appendChild(lockBox);
      gimmickContainer.appendChild(stage);

      let step = 0;
      keyEl.addEventListener('click', () => {
        playSound('tap');
        if (step === 0) {
          step = 1;
          keyEl.style.transform = 'translateX(0px)';
          guideArrow.textContent = '↻ 90°';
        } else if (step === 1) {
          keyEl.style.transform = 'translateX(0px) rotate(90deg)';
          setTimeout(() => resolveLockSuccess(), 120);
        }
      });

    // 20. ハンドル回転・バルブ ⚙️ (wheel_turn)
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
      center.className = 'wheel-turn-center';
      center.textContent = '↻';

      stage.appendChild(rim);
      stage.appendChild(center);
      gimmickContainer.appendChild(stage);

      let isDragging = false;
      let lastAngle = null;
      let totalRotated = 0;
      let currentDeg = 0;

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

        // 時計回りでも反時計回りでも、グルッと1回転（約360度）回したら開錠！
        if (Math.abs(totalRotated) >= Math.PI * 1.85) {
          isDragging = false;
          center.textContent = '🟢';
          center.style.background = '#2ed573';
          setTimeout(() => resolveLockSuccess(), 120);
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          totalRotated = 0;
          currentDeg = 0;
          rim.style.transform = 'rotate(0deg)';
          triggerMistake();
        }
      }

      rim.addEventListener('mousedown', onStart);
      rim.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 5 & 21. マルチタップ (ダブル / 3回) ✌️ / 👌
    } else if (lock.type === 'double_tap' || lock.type === 'triple_tap') {
      const targetCount = (lock.type === 'triple_tap') ? 3 : 2;
      let currentTaps = 0;
      let lastTapTime = 0;

      const btn = document.createElement('button');
      btn.className = 'multi-tap-btn';

      const iconSpan = document.createElement('span');
      iconSpan.textContent = (targetCount === 3) ? '👌' : '✌️';

      const dotRow = document.createElement('div');
      dotRow.className = 'multi-dot-row';
      const dots = [];
      for (let i = 0; i < targetCount; i++) {
        const d = document.createElement('div');
        d.className = 'tap-dot';
        dotRow.appendChild(d);
        dots.push(d);
      }

      btn.appendChild(iconSpan);
      btn.appendChild(dotRow);

      btn.addEventListener('click', () => {
        const now = Date.now();
        playSound('tap');
        if (currentTaps === 0 || now - lastTapTime < 500) {
          currentTaps++;
          dots[currentTaps - 1].classList.add('active');
          if (currentTaps >= targetCount) setTimeout(() => resolveLockSuccess(), 80);
        } else {
          currentTaps = 1;
          dots.forEach(d => d.classList.remove('active'));
          dots[0].classList.add('active');
        }
        lastTapTime = now;
      });
      gimmickContainer.appendChild(btn);

    // 6 & 26. カクカクっと2回スライド (L字 / Z字クランク) 🧩 / ⚡
    } else if (lock.type === 'crank_slide' || lock.type === 'crank_slide_z') {
      const area = document.createElement('div');
      area.className = 'crank-slider-area';

      const pathH = document.createElement('div');
      pathH.className = 'crank-slot-path';

      const pathV = document.createElement('div');
      pathV.className = 'crank-slot-path-v';

      const goal = document.createElement('div');
      goal.className = 'crank-goal';
      goal.textContent = '🔓';

      const knob = document.createElement('div');
      knob.className = 'crank-knob';
      knob.textContent = '👉';

      area.appendChild(pathH);
      area.appendChild(pathV);
      area.appendChild(goal);
      area.appendChild(knob);
      gimmickContainer.appendChild(area);

      let step = 0; // 0: moving right, 1: moving down
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
            knob.textContent = '👇';
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
          knob.textContent = '👉';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: true });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 7 & 8. スライド右 ➡️ / スライド上 ⬆️
    } else if (lock.type === 'slide_right') {
      const track = document.createElement('div');
      track.className = 'slider-horizontal';
      const arrows = document.createElement('div');
      arrows.className = 'slider-arrows-bg';
      arrows.textContent = '▶ ▶ ▶';
      const goal = document.createElement('div');
      goal.className = 'slider-goal-h right';
      goal.textContent = '🔓';
      const knob = document.createElement('div');
      knob.className = 'slider-knob-h';
      knob.style.left = '6px';
      knob.textContent = '👉';
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

    } else if (lock.type === 'slide_up') {
      const track = document.createElement('div');
      track.className = 'slider-vertical';
      const arrows = document.createElement('div');
      arrows.className = 'slider-arrows-v-bg';
      arrows.textContent = '▲ ▲';
      const goal = document.createElement('div');
      goal.className = 'slider-goal-v top';
      goal.textContent = '🔓';
      const knob = document.createElement('div');
      knob.className = 'slider-knob-v';
      knob.style.bottom = '6px';
      knob.textContent = '☝️';
      track.appendChild(arrows);
      track.appendChild(goal);
      track.appendChild(knob);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      function onStart() { isDragging = true; playSound('tap'); }
      function onMove(e) {
        if (!isDragging) return;
        const curY = (e.touches ? e.touches[0].clientY : e.clientY);
        const rect = track.getBoundingClientRect();
        const maxDist = rect.height - 60;
        let diff = Math.max(6, Math.min(maxDist, rect.bottom - curY - 26));
        knob.style.bottom = diff + 'px';
        if (diff >= maxDist - 8) {
          isDragging = false;
          resolveLockSuccess();
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          knob.style.bottom = '6px';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: true });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

    // 9. マークを書くやつ (✔ ジェスチャー) ✍️
    } else if (lock.type === 'gesture_mark') {
      const wrap = document.createElement('div');
      wrap.className = 'gesture-pad-wrap';

      const watermark = document.createElement('div');
      watermark.className = 'gesture-target-watermark';
      watermark.textContent = '✔';

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
        // チェックマーク簡易判定: 左上から下へ行き、右上へ跳ね上がる
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

    // 10. いくつかのカギの中から正しい鍵穴の奴を選ぶ奴 🔍
    } else if (lock.type === 'match_key') {
      const stage = document.createElement('div');
      stage.className = 'key-match-stage';

      const symbols = ['⭐', '🔷', '❤️'];
      const targetSym = symbols[Math.floor(Math.random() * symbols.length)];

      const hole = document.createElement('div');
      hole.className = 'key-match-hole';
      hole.textContent = targetSym;
      stage.appendChild(hole);

      const row = document.createElement('div');
      row.className = 'key-choices-row';

      const shuffled = [...symbols].sort(() => Math.random() - 0.5);
      shuffled.forEach(sym => {
        const item = document.createElement('div');
        item.className = 'key-choice-item';
        item.textContent = sym;
        item.addEventListener('click', () => {
          if (sym === targetSym) {
            playSound('tap');
            resolveLockSuccess();
          } else {
            triggerMistake();
          }
        });
        row.appendChild(item);
      });

      stage.appendChild(row);
      gimmickContainer.appendChild(stage);

    // 11. 3原色を混ぜて指示する色にするやつ 🎨
    } else if (lock.type === 'color_mix') {
      const stage = document.createElement('div');
      stage.className = 'color-mix-stage';

      // Targets: 紫(赤+青), 緑(青+黄), オレンジ(赤+黄)
      const recipes = [
        { name: '紫', color: '#9b59b6', ingredients: ['red', 'blue'] },
        { name: '緑', color: '#2ed573', ingredients: ['blue', 'yellow'] },
        { name: '橙', color: '#e67e22', ingredients: ['red', 'yellow'] }
      ];
      const targetRecipe = recipes[Math.floor(Math.random() * recipes.length)];

      const preview = document.createElement('div');
      preview.className = 'color-mix-target-preview';
      preview.style.background = targetRecipe.color;

      const pot = document.createElement('div');
      pot.className = 'color-mix-pot';

      const palette = document.createElement('div');
      palette.className = 'primary-palette';

      const selected = new Set();

      const btnRed = document.createElement('button');
      btnRed.className = 'primary-color-btn';
      btnRed.style.background = '#ff4757';

      const btnBlue = document.createElement('button');
      btnBlue.className = 'primary-color-btn';
      btnBlue.style.background = '#1e90ff';

      const btnYellow = document.createElement('button');
      btnYellow.className = 'primary-color-btn';
      btnYellow.style.background = '#ffa502';

      function toggleColor(name, btn) {
        playSound('tap');
        if (selected.has(name)) {
          selected.delete(name);
          btn.classList.remove('selected');
        } else {
          selected.add(name);
          btn.classList.add('selected');
        }

        // Mix Check
        if (selected.size === 2) {
          const arr = Array.from(selected);
          if (targetRecipe.ingredients.includes(arr[0]) && targetRecipe.ingredients.includes(arr[1])) {
            pot.style.background = targetRecipe.color;
            setTimeout(() => resolveLockSuccess(), 120);
          } else {
            triggerMistake();
            selected.clear();
            [btnRed, btnBlue, btnYellow].forEach(b => b.classList.remove('selected'));
          }
        }
      }

      btnRed.addEventListener('click', () => toggleColor('red', btnRed));
      btnBlue.addEventListener('click', () => toggleColor('blue', btnBlue));
      btnYellow.addEventListener('click', () => toggleColor('yellow', btnYellow));

      palette.appendChild(btnRed);
      palette.appendChild(btnBlue);
      palette.appendChild(btnYellow);

      stage.appendChild(preview);
      stage.appendChild(pot);
      stage.appendChild(palette);
      gimmickContainer.appendChild(stage);

    // 12. 暗証番号を書く/結ぶやつ (パターンロック) 🔢
    } else if (lock.type === 'pattern_lock') {
      const grid = document.createElement('div');
      grid.className = 'pattern-grid';

      // 結ぶパターン: 上段左(0) -> 中央(4) -> 下段右(8)
      const targetPattern = [0, 4, 8];
      let currentStep = 0;

      for (let i = 0; i < 9; i++) {
        const dot = document.createElement('div');
        dot.className = 'pattern-dot';
        if (i === targetPattern[currentStep]) dot.classList.add('guide');

        dot.addEventListener('click', () => {
          if (i === targetPattern[currentStep]) {
            playSound('tap');
            dot.classList.remove('guide');
            dot.classList.add('active');
            currentStep++;
            if (currentStep >= targetPattern.length) {
              resolveLockSuccess();
            } else {
              grid.children[targetPattern[currentStep]].classList.add('guide');
            }
          } else {
            triggerMistake();
            currentStep = 0;
            Array.from(grid.children).forEach((d, idx) => {
              d.classList.remove('active', 'guide');
              if (idx === targetPattern[0]) d.classList.add('guide');
            });
          }
        });
        grid.appendChild(dot);
      }
      gimmickContainer.appendChild(grid);

    // 13 & 29. 激連打 & 超激連打 ⚡ / 💥
    } else if (lock.type === 'rapid_mash' || lock.type === 'super_mash') {
      const targetClicks = (lock.type === 'super_mash') ? 11 : 6;
      let count = 0;
      const wrap = document.createElement('div');
      wrap.className = 'mash-wrap';
      const bar = document.createElement('div');
      bar.className = 'mash-bar';
      const fill = document.createElement('div');
      fill.className = 'mash-fill';
      bar.appendChild(fill);
      const btn = document.createElement('button');
      btn.className = 'icon-action-btn';
      btn.textContent = (lock.type === 'super_mash') ? '💥' : '⚡';
      btn.addEventListener('click', () => {
        count++;
        playSound('tap');
        fill.style.width = Math.min(100, (count / targetClicks) * 100) + '%';
        if (count >= targetClicks) resolveLockSuccess();
      });
      wrap.appendChild(bar);
      wrap.appendChild(btn);
      gimmickContainer.appendChild(wrap);

    // 14 & 27. 長押しを繰り返して丁度いい高さをキープするやつ 🚀 / 🛸
    } else if (lock.type === 'hover_thrust' || lock.type === 'hover_thrust_hard') {
      const isHard = (lock.type === 'hover_thrust_hard');
      const stage = document.createElement('div');
      stage.className = 'hover-stage';

      const zone = document.createElement('div');
      zone.className = 'hover-target-zone';
      if (isHard) zone.style.height = '42px';
      
      const zoneIcon = document.createElement('span');
      zoneIcon.textContent = '🎯';
      const progressTrack = document.createElement('div');
      progressTrack.className = 'hover-progress-track';
      const progressFill = document.createElement('div');
      progressFill.className = 'hover-progress-fill';
      progressTrack.appendChild(progressFill);
      zone.appendChild(zoneIcon);
      zone.appendChild(progressTrack);

      const rocket = document.createElement('div');
      rocket.className = 'hover-rocket';
      rocket.textContent = isHard ? '🛸' : '🚀';

      stage.appendChild(zone);
      stage.appendChild(rocket);

      const thrustBtn = document.createElement('button');
      thrustBtn.className = 'hover-thrust-btn';
      thrustBtn.textContent = 'THRUST 💨';

      gimmickContainer.appendChild(stage);
      gimmickContainer.appendChild(thrustBtn);

      let altitude = 15;
      let velocity = 0;
      let isThrusting = false;
      let insideTime = 0;
      const targetDuration = isHard ? 650 : 500; // 0.5秒キープでクリア！

      function onStart(e) { e.preventDefault(); isThrusting = true; playSound('tap'); }
      function onEnd(e) { e.preventDefault(); isThrusting = false; }

      thrustBtn.addEventListener('mousedown', onStart);
      thrustBtn.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);

      function hoverPhysics() {
        if (!isPlaying || currentLock.type !== lock.type) return;
        if (isThrusting) velocity += 0.55;
        else velocity -= 0.35; // マイルドな重力

        velocity *= 0.95; // 空気抵抗で急な吹っ飛びを抑制
        altitude += velocity;
        if (altitude < 10) { altitude = 10; velocity = 0; }
        if (altitude > 140) { altitude = 140; velocity = 0; }
        rocket.style.bottom = altitude + 'px';

        // ゾーン内外判定 (ゾーン高度: 60〜110付近)
        const targetMin = isHard ? 75 : 60;
        const targetMax = isHard ? 110 : 115;

        if (altitude >= targetMin && altitude <= targetMax) {
          zone.classList.add('active-in');
          insideTime += 16.6;
          const pct = Math.min(100, (insideTime / targetDuration) * 100);
          progressFill.style.width = pct + '%';

          if (insideTime >= targetDuration) { // 0.5秒達成！
            resolveLockSuccess();
            return;
          }
        } else {
          zone.classList.remove('active-in');
          insideTime = Math.max(0, insideTime - 10);
          const pct = Math.min(100, (insideTime / targetDuration) * 100);
          progressFill.style.width = pct + '%';
        }

        activeAnimationId = requestAnimationFrame(hoverPhysics);
      }
      activeAnimationId = requestAnimationFrame(hoverPhysics);

    // 15 & 30. 星形にスライドさせる奴 (★トレース) ⭐ / 🌟
    } else if (lock.type === 'star_trace' || lock.type === 'star_trace_fast') {
      const area = document.createElement('div');
      area.className = 'star-trace-area';

      // 星の5頂点座標 (190x190)
      const starPoints = [
        { x: 95, y: 22 },   // P0 (上)
        { x: 148, y: 165 }, // P1 (右下)
        { x: 12, y: 74 },   // P2 (左上)
        { x: 178, y: 74 },  // P3 (右上)
        { x: 42, y: 165 }   // P4 (左下)
      ];

      // ステップインジケータ (進捗アイコン)
      const stepInd = document.createElement('div');
      stepInd.className = 'star-step-indicator';
      const starIcons = [];
      for (let i = 0; i < 5; i++) {
        const span = document.createElement('span');
        span.textContent = '☆';
        stepInd.appendChild(span);
        starIcons.push(span);
      }
      starIcons[0].textContent = '⭐';
      area.appendChild(stepInd);

      // SVG星の背景線 ＋ 通過済み軌跡
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

      // 通過済みライン
      const trailPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      trailPath.setAttribute('d', `M ${starPoints[0].x} ${starPoints[0].y}`);
      trailPath.setAttribute('fill', 'none');
      trailPath.setAttribute('stroke', '#ffa502');
      trailPath.setAttribute('stroke-width', '8');
      trailPath.setAttribute('stroke-linejoin', 'round');
      trailPath.setAttribute('stroke-linecap', 'round');
      svg.appendChild(trailPath);

      area.appendChild(svg);

      // 5つの頂点マーカー
      const markerEls = starPoints.map((pt, idx) => {
        const marker = document.createElement('div');
        marker.className = 'star-point-marker';
        marker.style.left = pt.x + 'px';
        marker.style.top = pt.y + 'px';
        marker.textContent = (idx === 0) ? '✔' : '';
        if (idx === 0) marker.classList.add('completed');
        area.appendChild(marker);
        return marker;
      });

      let targetPtIdx = 1;
      markerEls[targetPtIdx].classList.add('active-target');

      // スライドノブ
      const knob = document.createElement('div');
      knob.className = 'star-knob';
      knob.textContent = '⭐';
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
        if (Math.hypot(rx - target.x, ry - target.y) < 32) {
          playSound('tap');
          markerEls[targetPtIdx].classList.remove('active-target');
          markerEls[targetPtIdx].classList.add('completed');
          markerEls[targetPtIdx].textContent = '✔';
          if (starIcons[targetPtIdx]) starIcons[targetPtIdx].textContent = '⭐';

          targetPtIdx++;
          updateTrail();

          if (targetPtIdx >= starPoints.length) {
            isDragging = false;
            knob.style.left = target.x + 'px';
            knob.style.top = target.y + 'px';
            setTimeout(() => resolveLockSuccess(), 120);
          } else {
            markerEls[targetPtIdx].classList.add('active-target');
          }
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          // スタート地点にリセット
          targetPtIdx = 1;
          markerEls.forEach((m, i) => {
            m.className = 'star-point-marker';
            m.textContent = (i === 0) ? '✔' : '';
            if (i === 0) m.classList.add('completed');
            if (i === 1) m.classList.add('active-target');
          });
          starIcons.forEach((s, i) => {
            s.textContent = (i === 0) ? '⭐' : '☆';
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

    // 16. ダイヤル式のカギ (数字ドラムを合わせる) 🔐
    } else if (lock.type === 'dial_code') {
      const stage = document.createElement('div');
      stage.className = 'dial-lock-stage';

      const targetDigits = [7, 7, 7];
      const codeLabel = document.createElement('div');
      codeLabel.className = 'dial-lock-target-code';
      codeLabel.textContent = '7 7 7';

      const row = document.createElement('div');
      row.className = 'dial-wheels-row';

      const currentDigits = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ];

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

    // 17. ボタンが激しく動くやつ 🏃
    } else if (lock.type === 'moving_btn') {
      const box = document.createElement('div');
      box.className = 'moving-btn-container';

      const btn = document.createElement('button');
      btn.className = 'moving-action-btn';
      btn.textContent = '🏃';
      box.appendChild(btn);
      gimmickContainer.appendChild(box);

      let x = 60, y = 60;
      let vx = 3.5, vy = 2.8;

      function bounceAnim() {
        if (!isPlaying || currentLock.type !== lock.type) return;
        x += vx; y += vy;
        if (x <= 10 || x >= 240) vx = -vx;
        if (y <= 10 || y >= 120) vy = -vy;
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        activeAnimationId = requestAnimationFrame(bounceAnim);
      }
      activeAnimationId = requestAnimationFrame(bounceAnim);

      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });

    // 19. モールス信号打つ奴 (トン・ツー・トン) 📻
    } else if (lock.type === 'morse_code') {
      const stage = document.createElement('div');
      stage.className = 'morse-stage';

      // Pattern: ・ ━ ・ (短・長・短)
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
      tapBtn.textContent = '📻';
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

    // 22. カラー二択 🎨
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

    // 23. 形状二択 🔷
    } else if (lock.type === 'shape_choice_2') {
      const isSquare = Math.random() > 0.5;
      const wrap = document.createElement('div');
      wrap.className = 'color-match-wrap';
      const target = document.createElement('div');
      target.className = 'shape-target-display';
      target.textContent = isSquare ? '■' : '●';
      target.style.color = '#ffa502';
      wrap.appendChild(target);

      const row = document.createElement('div');
      row.className = 'choice-row';
      const b1 = document.createElement('button'); b1.className = 'shape-choice-btn'; b1.textContent = '■';
      const b2 = document.createElement('button'); b2.className = 'shape-choice-btn'; b2.textContent = '●';
      b1.addEventListener('click', () => { if (isSquare) { playSound('tap'); resolveLockSuccess(); } else triggerMistake(); });
      b2.addEventListener('click', () => { if (!isSquare) { playSound('tap'); resolveLockSuccess(); } else triggerMistake(); });
      row.appendChild(b1); row.appendChild(b2);
      wrap.appendChild(row);
      gimmickContainer.appendChild(wrap);

    // 24. 指紋スキャナー 🛡️
    } else if (lock.type === 'fingerprint') {
      const btn = document.createElement('button');
      btn.className = 'fingerprint-btn';
      btn.innerHTML = `<div class="fingerprint-scanner-bar"></div><span>🛡️</span>`;

      let holdStart = 0;
      let holdTimer = null;
      btn.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });

      function onStart(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        holdStart = Date.now();
        playSound('tap');
        btn.classList.add('scanning');
        holdTimer = setInterval(() => {
          if (Date.now() - holdStart >= 750) {
            clearInterval(holdTimer);
            btn.classList.remove('scanning');
            resolveLockSuccess();
          }
        }, 30);
      }
      function onCancel() {
        if (holdTimer) {
          clearInterval(holdTimer);
          holdTimer = null;
          btn.classList.remove('scanning');
          triggerMistake();
        }
      }
      btn.addEventListener('mousedown', onStart);
      btn.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mouseup', onCancel);
      addTrackedListener(window, 'touchend', onCancel);
      gimmickContainer.appendChild(btn);

    // 25. ダイヤル合わせ 🧭
    } else if (lock.type === 'dial_turn') {
      const wrap = document.createElement('div');
      wrap.className = 'dial-wrap';
      const mark = document.createElement('div');
      mark.className = 'dial-target-mark';
      mark.textContent = '▼';
      let rotation = (Math.floor(Math.random() * 3) + 1) * 90;
      const dial = document.createElement('div');
      dial.className = 'dial-knob-ui';
      dial.style.transform = `rotate(${rotation}deg)`;
      const ind = document.createElement('div');
      ind.className = 'dial-indicator';
      dial.appendChild(ind);
      dial.addEventListener('click', () => {
        playSound('tap');
        rotation = (rotation + 90) % 360;
        dial.style.transform = `rotate(${rotation}deg)`;
        if (rotation === 0) setTimeout(() => resolveLockSuccess(), 120);
      });
      wrap.appendChild(mark);
      wrap.appendChild(dial);
      gimmickContainer.appendChild(wrap);

    // 26. 鍵を鍵穴へ、ただイライラ棒 ⚡🔑🕳️
    } else if (lock.type === 'irira_key_maze') {
      const container = document.createElement('div');
      container.className = 'irira-maze-container';

      // SVG電撃コース
      container.innerHTML = `
        <svg class="irira-maze-svg" viewBox="0 0 250 140">
          <defs>
            <filter id="glow-shock" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>
          <!-- 外壁ネオン電撃 -->
          <path d="M 35 35 L 125 35 L 125 105 L 215 105" 
                fill="none" stroke="#ffa502" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-shock)" />
          <!-- 安全通路径 -->
          <path d="M 35 35 L 125 35 L 125 105 L 215 105" 
                fill="none" stroke="#2f3542" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
          <!-- センターガイド点線 -->
          <path d="M 35 35 L 125 35 L 125 105 L 215 105" 
                fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;

      // ゴール鍵穴
      const goalHole = document.createElement('div');
      goalHole.className = 'irira-goal-hole';
      goalHole.textContent = '🕳️';
      goalHole.style.left = '215px';
      goalHole.style.top = '105px';
      container.appendChild(goalHole);

      // 鍵ドラッガー
      const keyDragger = document.createElement('div');
      keyDragger.className = 'irira-key-dragger';
      keyDragger.textContent = '🔑';
      keyDragger.style.left = '35px';
      keyDragger.style.top = '35px';
      container.appendChild(keyDragger);

      gimmickContainer.appendChild(container);

      // コース定義 (スタート: 35,35 -> 125,35 -> 125,105 -> 215,105 ゴール)
      const points = [
        { x: 35, y: 35 },
        { x: 125, y: 35 },
        { x: 125, y: 105 },
        { x: 215, y: 105 }
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

        // 壁判定 (電撃接触)
        const dist = minDistanceToPath(px, py);
        if (dist > 20) { // 通路幅を超えて壁に接触！
          isDragging = false;
          container.classList.add('shocked');
          triggerMistake();
          setTimeout(() => {
            container.classList.remove('shocked');
          }, 350);
          keyDragger.style.left = '35px';
          keyDragger.style.top = '35px';
          return;
        }

        // ゴール判定
        if (Math.hypot(px - 215, py - 105) <= 18) {
          isDragging = false;
          keyDragger.style.left = '215px';
          keyDragger.style.top = '105px';
          setTimeout(() => resolveLockSuccess(), 100);
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          keyDragger.style.left = '35px';
          keyDragger.style.top = '35px';
          triggerMistake();
        }
      }

      keyDragger.addEventListener('mousedown', onStart);
      keyDragger.addEventListener('touchstart', onStart, { passive: false });
      addTrackedListener(window, 'mousemove', onMove);
      addTrackedListener(window, 'touchmove', onMove, { passive: false });
      addTrackedListener(window, 'mouseup', onEnd);
      addTrackedListener(window, 'touchend', onEnd);


    // 28. 動くボタン滅茶苦茶小さいやつ 🐜
    } else if (lock.type === 'tiny_moving_btn') {
      const box = document.createElement('div');
      box.className = 'moving-btn-container';
      const btn = document.createElement('button');
      btn.className = 'tiny-moving-btn';
      btn.textContent = '🐜';
      box.appendChild(btn);
      gimmickContainer.appendChild(box);

      let x = 80, y = 80;
      let vx = 5.2, vy = 4.5; // 超高速で飛び跳ねる

      function tinyBounce() {
        if (!isPlaying || currentLock.type !== lock.type) return;
        x += vx; y += vy;
        if (x <= 5 || x >= 280) vx = -vx;
        if (y <= 5 || y >= 150) vy = -vy;
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        activeAnimationId = requestAnimationFrame(tinyBounce);
      }
      activeAnimationId = requestAnimationFrame(tinyBounce);

      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });
    }
  }

  // Mistake Trigger
  function triggerMistake() {
    playSound('mistake');
    lockFace.textContent = getRandomFace('error');
    lockFace.classList.add('shake');
    setTimeout(() => {
      lockFace.classList.remove('shake');
    }, 400);
  }

  // Success Trigger (+1.0s & Card Swap)
  function resolveLockSuccess() {
    cleanActiveAnimations();
    cleanActiveListeners();
    playSound('unlock');
    currentShackle.classList.add('open');
    lockFace.textContent = getRandomFace('happy');

    remainingTime += 1.0;
    timeAddedAnim.classList.remove('animate');
    void timeAddedAnim.offsetWidth;
    timeAddedAnim.classList.add('animate');

    score += currentLock.points;
    unlockedCountNum++;
    scoreDisplay.textContent = score;
    unlockedCount.textContent = unlockedCountNum;

    const cardRect = currentCard.getBoundingClientRect();
    createBurst(cardRect.left + cardRect.width / 2, cardRect.top + cardRect.height / 2, 32);

    currentCard.style.transform = 'translateY(-20px) scale(1.08)';
    currentCard.style.opacity = '0';

    setTimeout(() => {
      currentLock = nextLock;
      nextLock = getNextLockFromQueue();

      renderGimmick(currentLock);
      currentCard.style.transform = 'translateY(0) scale(1)';
      currentCard.style.opacity = '1';

      const nextBadge = document.getElementById('next-lock-badge');
      if (nextBadge) nextBadge.textContent = `NEXT: Lv.${nextLock.level} ${nextLock.icon}`;
      nextCard.querySelector('.lock-face').textContent = nextLock.face;
    }, 200);
  }

  // Timer loop
  function startTimer() {
    timerInterval = setInterval(() => {
      remainingTime -= 0.1;
      if (remainingTime <= 0) {
        remainingTime = 0;
        timeDisplay.textContent = '0.0';
        endGame();
        return;
      }

      timeDisplay.textContent = remainingTime.toFixed(1);

      if (remainingTime <= 5.0) {
        timeDisplay.parentElement.classList.add('timer-danger');
        warningBeepTimer++;
        if (warningBeepTimer % 5 === 0) {
          playSound('warning');
        }
      } else {
        timeDisplay.parentElement.classList.remove('timer-danger');
      }
    }, 100);
  }

  function startGame() {
    initAudio();
    cleanupCurrentGimmick();
    isPlaying = true;
    remainingTime = 18.0;
    score = 0;
    unlockedCountNum = 0;
    warningBeepTimer = 0;
    roundNumber = 1;

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
    if (nextBadge) nextBadge.textContent = `NEXT: Lv.${nextLock.level} ${nextLock.icon}`;
    nextCard.querySelector('.lock-face').textContent = nextLock.face;

    startTimer();
  }

  function endGame() {
    isPlaying = false;
    cleanupCurrentGimmick();
    clearInterval(timerInterval);

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pop_lock_high', highScore);
    }

    let rank = 'C';
    let commentIcon = '🥉';
    if (score >= 8000) {
      rank = 'S';
      commentIcon = '👑';
    } else if (score >= 4500) {
      rank = 'A';
      commentIcon = '🥇';
    } else if (score >= 2200) {
      rank = 'B';
      commentIcon = '🥈';
    }

    rankBadgeEl.textContent = `RANK ${rank}`;
    if (rank === 'S') rankBadgeEl.style.background = '#ffd32a';
    else if (rank === 'A') rankBadgeEl.style.background = '#2ed573';
    else if (rank === 'B') rankBadgeEl.style.background = '#1e90ff';
    else rankBadgeEl.style.background = '#a4b0be';

    const resultComment = document.getElementById('result-title-comment');
    if (resultComment) resultComment.textContent = commentIcon;

    finalScoreEl.textContent = score;
    finalLocksEl.textContent = unlockedCountNum;
    highScoreEl.textContent = highScore;

    resultOverlay.classList.add('active');
  }

  // Reliable touch & click handling for action buttons (start & retry)
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

  setupActionButton(startBtn, startGame);
  setupActionButton(retryBtn, startGame);
});
