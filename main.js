// POP LOCK RUSH! - 30 Non-Verbal Gimmicks (Progression 1-30 & Round 2 Random)
document.addEventListener('DOMContentLoaded', () => {
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

  // 30 Gimmick Definitions: Level 1 to 30
  const LOCK_DEFINITIONS = [
    // --- 通常版 (Lv.1 〜 Lv.15) ---
    { level: 1,  type: 'single_tap',       icon: '👆', stars: '★☆☆☆☆', basePoints: 100 },
    { level: 2,  type: 'switch_slide',     icon: '🎚️', stars: '★☆☆☆☆', basePoints: 120 },
    { level: 3,  type: 'key_drag',         icon: '🔑', stars: '★☆☆☆☆', basePoints: 140 },
    { level: 4,  type: 'slide_twist',      icon: '🗝️', stars: '★★☆☆☆', basePoints: 160 },
    { level: 5,  type: 'double_tap',       icon: '✌️', stars: '★★☆☆☆', basePoints: 180 },
    { level: 6,  type: 'slide_right',      icon: '➡️', stars: '★★☆☆☆', basePoints: 200 },
    { level: 7,  type: 'slide_left',       icon: '⬅️', stars: '★★★☆☆', basePoints: 220 },
    { level: 8,  type: 'slide_up',         icon: '⬆️', stars: '★★★☆☆', basePoints: 240 },
    { level: 9,  type: 'slide_down',       icon: '⬇️', stars: '★★★☆☆', basePoints: 260 },
    { level: 10, type: 'color_choice_2',   icon: '🎨', stars: '★★★☆☆', basePoints: 280 },
    { level: 11, type: 'shape_choice_2',   icon: '🔷', stars: '★★★★☆', basePoints: 310 },
    { level: 12, type: 'triple_tap',       icon: '👌', stars: '★★★★☆', basePoints: 340 },
    { level: 13, type: 'rapid_mash',       icon: '⚡', stars: '★★★★☆', basePoints: 370 },
    { level: 14, type: 'fingerprint',      icon: '🛡️', stars: '★★★★★', basePoints: 420 },
    { level: 15, type: 'dial_turn',        icon: '🧭', stars: '★★★★★', basePoints: 480 },

    // --- 高難度・Ex版 (Lv.16 〜 Lv.30) ---
    { level: 16, type: 'tiny_tap',         icon: '🔍', stars: '★★☆☆☆', basePoints: 200 }, // Lv.1の極小版
    { level: 17, type: 'switch_slide_rev', icon: '🎛️', stars: '★★☆☆☆', basePoints: 230 }, // Lv.2の逆向きスライド
    { level: 18, type: 'key_drag_precise', icon: '🎯', stars: '★★★☆☆', basePoints: 260 }, // Lv.3の極小鍵穴ドラッグ
    { level: 19, type: 'slide_twist_180',  icon: '🔄', stars: '★★★☆☆', basePoints: 290 }, // Lv.4の180度回転
    { level: 20, type: 'quad_tap',         icon: '✋', stars: '★★★☆☆', basePoints: 320 }, // Lv.5の4連打
    { level: 21, type: 'slide_bounce_r',   icon: '⏩', stars: '★★★★☆', basePoints: 360 }, // Lv.6の往復スライド右
    { level: 22, type: 'slide_bounce_l',   icon: '⏪', stars: '★★★★☆', basePoints: 390 }, // Lv.7の往復スライド左
    { level: 23, type: 'slide_up_long',    icon: '🚀', stars: '★★★★☆', basePoints: 430 }, // Lv.8のロング引き上げ
    { level: 24, type: 'slide_down_long',  icon: '⚓', stars: '★★★★☆', basePoints: 460 }, // Lv.9のロング引き下げ
    { level: 25, type: 'color_choice_3',   icon: '🌈', stars: '★★★★☆', basePoints: 500 }, // Lv.10の3択カラー
    { level: 26, type: 'shape_choice_3',   icon: '💠', stars: '★★★★★', basePoints: 540 }, // Lv.11の3択シェイプ
    { level: 27, type: 'five_tap',         icon: '🖐️', stars: '★★★★★', basePoints: 580 }, // Lv.12の5連タップ
    { level: 28, type: 'super_mash',       icon: '💥', stars: '★★★★★', basePoints: 630 }, // Lv.13の超激連打
    { level: 29, type: 'fingerprint_long', icon: '🧬', stars: '★★★★★', basePoints: 690 }, // Lv.14の長時間精密スキャン
    { level: 30, type: 'dial_turn_precise',icon: '⏰', stars: '★★★★★', basePoints: 750 }  // Lv.15の微細ダイヤル
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
  // Round 1: Level 1 to 30 strictly in order
  // Round 2+: Completely Random (完全ランダム)
  let lockQueue = [];
  let roundNumber = 1;

  function buildRoundQueue(round) {
    if (round === 1) {
      // 1周目は難易度順 (Lv.1 -> Lv.30)
      return LOCK_DEFINITIONS.map(def => ({
        ...def,
        round,
        points: def.basePoints,
        face: getRandomFace('normal')
      }));
    } else {
      // 2周目以降は完全ランダムにシャッフル
      const shuffled = [...LOCK_DEFINITIONS].sort(() => Math.random() - 0.5);
      return shuffled.map(def => ({
        ...def,
        round,
        points: def.basePoints + (round - 1) * 100,
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

  // Render 30 Non-Verbal Gimmicks
  function renderGimmick(lock) {
    gimmickContainer.innerHTML = '';
    lockLevelBadge.textContent = `Lv.${lock.level} ${lock.icon}`;
    lockDiff.textContent = lock.stars;
    lockFace.textContent = lock.face;
    currentShackle.classList.remove('open');

    // 1. ワンタップ (通常)
    if (lock.type === 'single_tap') {
      const btn = document.createElement('button');
      btn.className = 'icon-action-btn';
      btn.textContent = '👆';
      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });
      gimmickContainer.appendChild(btn);

    // 16. 極小ボタンタップ (Ex Lv.1)
    } else if (lock.type === 'tiny_tap') {
      const btn = document.createElement('button');
      btn.className = 'tiny-action-btn';
      btn.textContent = '🎯';
      // ランダムな位置に配置
      const offsetX = (Math.random() - 0.5) * 160;
      const offsetY = (Math.random() - 0.5) * 100;
      btn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });
      gimmickContainer.appendChild(btn);

    // 2. スイッチ（左から右へ小さいスライド操作）
    } else if (lock.type === 'switch_slide') {
      const track = document.createElement('div');
      track.className = 'switch-slider-track';

      const arrows = document.createElement('div');
      arrows.className = 'switch-arrows-hint';
      arrows.textContent = '▶▶';

      const knob = document.createElement('div');
      knob.className = 'switch-draggable-knob';
      knob.textContent = '⚪';

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
          knob.textContent = '🟢';
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
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    // 17. 逆向きスイッチスライド (Ex Lv.2: 右から左へ倒す)
    } else if (lock.type === 'switch_slide_rev') {
      const track = document.createElement('div');
      track.className = 'switch-slider-track on';

      const arrows = document.createElement('div');
      arrows.className = 'switch-arrows-hint';
      arrows.textContent = '◀◀';

      const knob = document.createElement('div');
      knob.className = 'switch-draggable-knob';
      knob.style.left = 'auto';
      knob.style.right = '4px';
      knob.textContent = '🔴';

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
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          knob.style.right = '4px';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    // 3. 鍵ドラッグ差し込み (スライドさせて鍵穴まで持っていく)
    } else if (lock.type === 'key_drag' || lock.type === 'key_drag_precise') {
      const isPrecise = (lock.type === 'key_drag_precise');
      const container = document.createElement('div');
      container.className = 'key-drag-container';

      const targetHole = document.createElement('div');
      targetHole.className = 'key-drop-target';
      if (isPrecise) {
        targetHole.style.width = '52px';
        targetHole.style.height = '52px';
        targetHole.style.fontSize = '1.8rem';
      }
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

        // 鍵穴との衝突判定
        const keyRect = keyItem.getBoundingClientRect();
        const holeRect = targetHole.getBoundingClientRect();
        const dist = Math.hypot(
          (keyRect.left + keyRect.width / 2) - (holeRect.left + holeRect.width / 2),
          (keyRect.top + keyRect.height / 2) - (holeRect.top + holeRect.height / 2)
        );

        const threshold = isPrecise ? 32 : 55;
        if (dist < threshold) {
          targetHole.classList.add('hovered');
        } else {
          targetHole.classList.remove('hovered');
        }
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
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    // 4. スライドして回転 (Slide & Twist) & 19 (180度回転)
    } else if (lock.type === 'slide_twist' || lock.type === 'slide_twist_180') {
      const is180 = (lock.type === 'slide_twist_180');
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

      let step = 0; // 0: slid, 1: twisted
      keyEl.addEventListener('click', () => {
        playSound('tap');
        if (step === 0) {
          // まずスライドイン
          step = 1;
          keyEl.style.transform = 'translateX(0px)';
          guideArrow.textContent = is180 ? '↺ 180°' : '↻ 90°';
        } else if (step === 1) {
          // 次に回転
          const targetDeg = is180 ? -180 : 90;
          keyEl.style.transform = `translateX(0px) rotate(${targetDeg}deg)`;
          setTimeout(() => resolveLockSuccess(), 120);
        }
      });

    // 5, 12, 20, 27: マルチタップ系 (ダブル/3回/4回/5回)
    } else if (['double_tap', 'triple_tap', 'quad_tap', 'five_tap'].includes(lock.type)) {
      const counts = { double_tap: 2, triple_tap: 3, quad_tap: 4, five_tap: 5 };
      const icons = { double_tap: '✌️', triple_tap: '👌', quad_tap: '✋', five_tap: '🖐️' };
      const targetCount = counts[lock.type];

      let currentTaps = 0;
      let lastTapTime = 0;

      const btn = document.createElement('button');
      btn.className = 'multi-tap-btn';

      const iconSpan = document.createElement('span');
      iconSpan.textContent = icons[lock.type];

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
          if (currentTaps >= targetCount) {
            setTimeout(() => resolveLockSuccess(), 80);
          }
        } else {
          currentTaps = 1;
          dots.forEach(d => d.classList.remove('active'));
          dots[0].classList.add('active');
        }
        lastTapTime = now;
      });
      gimmickContainer.appendChild(btn);

    // 6, 7, 21, 22: 横スライド (右/左/往復)
    } else if (['slide_right', 'slide_left', 'slide_bounce_r', 'slide_bounce_l'].includes(lock.type)) {
      const isLeft = (lock.type === 'slide_left' || lock.type === 'slide_bounce_l');
      const isBounce = (lock.type === 'slide_bounce_r' || lock.type === 'slide_bounce_l');

      const track = document.createElement('div');
      track.className = 'slider-horizontal';

      const arrows = document.createElement('div');
      arrows.className = 'slider-arrows-bg';
      arrows.textContent = isBounce ? '⇋ ⇋' : (isLeft ? '◀ ◀ ◀' : '▶ ▶ ▶');

      const goal = document.createElement('div');
      goal.className = `slider-goal-h ${isLeft ? 'left' : 'right'}`;
      goal.textContent = isBounce ? '⚡' : '🔓';

      const knob = document.createElement('div');
      knob.className = 'slider-knob-h';
      if (isLeft) {
        knob.style.right = '6px';
        knob.style.left = 'auto';
        knob.textContent = '👈';
      } else {
        knob.style.left = '6px';
        knob.textContent = '👉';
      }

      track.appendChild(arrows);
      track.appendChild(goal);
      track.appendChild(knob);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      let hitEnd = false;

      function onStart() { isDragging = true; playSound('tap'); }
      function onMove(e) {
        if (!isDragging) return;
        const curX = (e.touches ? e.touches[0].clientX : e.clientX);
        const rect = track.getBoundingClientRect();
        const maxDist = rect.width - 66;

        if (!isLeft) {
          let diff = curX - rect.left - 27;
          diff = Math.max(6, Math.min(maxDist, diff));
          knob.style.left = diff + 'px';
          if (diff >= maxDist - 8) {
            if (isBounce) {
              hitEnd = true;
              goal.className = 'slider-goal-h left';
              goal.textContent = '🔓';
            } else {
              isDragging = false;
              resolveLockSuccess();
            }
          }
          if (isBounce && hitEnd && diff <= 12) {
            isDragging = false;
            resolveLockSuccess();
          }
        } else {
          let diff = rect.right - curX - 27;
          diff = Math.max(6, Math.min(maxDist, diff));
          knob.style.right = diff + 'px';
          if (diff >= maxDist - 8) {
            if (isBounce) {
              hitEnd = true;
              goal.className = 'slider-goal-h right';
              goal.textContent = '🔓';
            } else {
              isDragging = false;
              resolveLockSuccess();
            }
          }
          if (isBounce && hitEnd && diff <= 12) {
            isDragging = false;
            resolveLockSuccess();
          }
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          if (isLeft) knob.style.right = '6px';
          else knob.style.left = '6px';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    // 8, 9, 23, 24: 縦スライド (上/下/ロング)
    } else if (['slide_up', 'slide_down', 'slide_up_long', 'slide_down_long'].includes(lock.type)) {
      const isDown = (lock.type === 'slide_down' || lock.type === 'slide_down_long');
      const isLong = (lock.type.includes('long'));

      const track = document.createElement('div');
      track.className = 'slider-vertical';
      if (isLong) track.style.height = '190px';

      const arrows = document.createElement('div');
      arrows.className = 'slider-arrows-v-bg';
      arrows.textContent = isDown ? '▼ ▼' : '▲ ▲';

      const goal = document.createElement('div');
      goal.className = `slider-goal-v ${isDown ? 'bottom' : 'top'}`;
      goal.textContent = '🔓';

      const knob = document.createElement('div');
      knob.className = 'slider-knob-v';
      if (isDown) {
        knob.style.top = '6px';
        knob.style.bottom = 'auto';
        knob.textContent = '👇';
      } else {
        knob.style.bottom = '6px';
        knob.textContent = '☝️';
      }

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

        if (!isDown) {
          let diff = rect.bottom - curY - 26;
          diff = Math.max(6, Math.min(maxDist, diff));
          knob.style.bottom = diff + 'px';
          if (diff >= maxDist - 8) {
            isDragging = false;
            resolveLockSuccess();
          }
        } else {
          let diff = curY - rect.top - 26;
          diff = Math.max(6, Math.min(maxDist, diff));
          knob.style.top = diff + 'px';
          if (diff >= maxDist - 8) {
            isDragging = false;
            resolveLockSuccess();
          }
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          if (isDown) knob.style.top = '6px';
          else knob.style.bottom = '6px';
          triggerMistake();
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    // 10 & 25: カラー一致 (2択 & 3択)
    } else if (lock.type === 'color_choice_2' || lock.type === 'color_choice_3') {
      const colors = ['#1e90ff', '#ff4757'];
      if (lock.type === 'color_choice_3') colors.push('#ffa502');

      const targetColor = colors[Math.floor(Math.random() * colors.length)];

      const wrap = document.createElement('div');
      wrap.className = 'color-match-wrap';

      const targetCircle = document.createElement('div');
      targetCircle.className = 'color-target-display';
      targetCircle.style.background = targetColor;
      wrap.appendChild(targetCircle);

      const row = document.createElement('div');
      row.className = 'choice-row';

      const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
      shuffledColors.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'color-choice-btn';
        btn.style.background = c;
        btn.addEventListener('click', () => {
          if (c === targetColor) {
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

    // 11 & 26: 形状一致 (2択 & 3択)
    } else if (lock.type === 'shape_choice_2' || lock.type === 'shape_choice_3') {
      const shapes = ['■', '●'];
      if (lock.type === 'shape_choice_3') shapes.push('▲');

      const targetShape = shapes[Math.floor(Math.random() * shapes.length)];

      const wrap = document.createElement('div');
      wrap.className = 'color-match-wrap';

      const targetEl = document.createElement('div');
      targetEl.className = 'shape-target-display';
      targetEl.textContent = targetShape;
      targetEl.style.color = '#ffa502';
      wrap.appendChild(targetEl);

      const row = document.createElement('div');
      row.className = 'choice-row';

      const shuffledShapes = [...shapes].sort(() => Math.random() - 0.5);
      shuffledShapes.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'shape-choice-btn';
        btn.textContent = s;
        btn.addEventListener('click', () => {
          if (s === targetShape) {
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

    // 13 & 28: 激連打 & 超連打
    } else if (lock.type === 'rapid_mash' || lock.type === 'super_mash') {
      const targetClicks = (lock.type === 'super_mash') ? 10 : 5;
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
        lockFace.textContent = getRandomFace('trying');
        if (count >= targetClicks) resolveLockSuccess();
      });

      wrap.appendChild(bar);
      wrap.appendChild(btn);
      gimmickContainer.appendChild(wrap);

    // 14 & 29: 指紋スキャナー & 長時間精密スキャン
    } else if (lock.type === 'fingerprint' || lock.type === 'fingerprint_long') {
      const requiredHoldMs = (lock.type === 'fingerprint_long') ? 1200 : 700;

      const btn = document.createElement('button');
      btn.className = 'fingerprint-btn';
      btn.innerHTML = `
        <div class="fingerprint-scanner-bar"></div>
        <span>🛡️</span>
      `;

      let holdStart = 0;
      let holdTimer = null;

      function onStart(e) {
        e.preventDefault();
        holdStart = Date.now();
        playSound('tap');
        btn.classList.add('scanning');
        holdTimer = setInterval(() => {
          const elapsed = Date.now() - holdStart;
          if (elapsed >= requiredHoldMs) {
            clearInterval(holdTimer);
            btn.classList.remove('scanning');
            btn.style.borderColor = '#2ed573';
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
      window.addEventListener('mouseup', onCancel);
      window.addEventListener('touchend', onCancel);
      gimmickContainer.appendChild(btn);

    // 15 & 30: ダイヤル合わせ & 微細ダイヤル
    } else if (lock.type === 'dial_turn' || lock.type === 'dial_turn_precise') {
      const isPrecise = (lock.type === 'dial_turn_precise');
      const wrap = document.createElement('div');
      wrap.className = 'dial-wrap';

      const targetMark = document.createElement('div');
      targetMark.className = 'dial-target-mark';
      targetMark.textContent = '▼';

      const stepDeg = isPrecise ? 45 : 90;
      let rotation = (Math.floor(Math.random() * (isPrecise ? 7 : 3)) + 1) * stepDeg;

      const dial = document.createElement('div');
      dial.className = 'dial-knob-ui';
      dial.style.transform = `rotate(${rotation}deg)`;

      const ind = document.createElement('div');
      ind.className = 'dial-indicator';
      dial.appendChild(ind);

      dial.addEventListener('click', () => {
        playSound('tap');
        rotation = (rotation + stepDeg) % 360;
        dial.style.transform = `rotate(${rotation}deg)`;
        if (rotation === 0) {
          setTimeout(() => resolveLockSuccess(), 120);
        }
      });

      wrap.appendChild(targetMark);
      wrap.appendChild(dial);
      gimmickContainer.appendChild(wrap);
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

  // Success Trigger (+0.5s & Card Swap)
  function resolveLockSuccess() {
    playSound('unlock');
    currentShackle.classList.add('open');
    lockFace.textContent = getRandomFace('happy');

    // Add +0.5s bonus
    remainingTime += 0.5;
    timeAddedAnim.classList.remove('animate');
    void timeAddedAnim.offsetWidth;
    timeAddedAnim.classList.add('animate');

    score += currentLock.points;
    unlockedCountNum++;
    scoreDisplay.textContent = score;
    unlockedCount.textContent = unlockedCountNum;

    // Burst particles
    const cardRect = currentCard.getBoundingClientRect();
    createBurst(cardRect.left + cardRect.width / 2, cardRect.top + cardRect.height / 2, 32);

    // Card Stack Swap
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

    // Build Round 1 Queue (Level 1 to 30 in strict progression)
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
    clearInterval(timerInterval);

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pop_lock_high', highScore);
    }

    let rank = 'C';
    let commentIcon = '🥉';
    if (score >= 7000) {
      rank = 'S';
      commentIcon = '👑';
    } else if (score >= 4000) {
      rank = 'A';
      commentIcon = '🥇';
    } else if (score >= 2000) {
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

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
});
