// POP LOCK RUSH! - 100% Non-Verbal & Intuitive Gimmicks
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

  // 10 Lock Types: Level 1 to 10
  const LOCK_DEFINITIONS = [
    { level: 1,  type: 'single_tap',    icon: '👆', stars: '★☆☆☆☆', basePoints: 100 },
    { level: 2,  type: 'toggle_switch', icon: '🎚️', stars: '★☆☆☆☆', basePoints: 120 },
    { level: 3,  type: 'key_insert',    icon: '🔑', stars: '★★☆☆☆', basePoints: 150 },
    { level: 4,  type: 'double_tap',    icon: '✌️', stars: '★★☆☆☆', basePoints: 180 },
    { level: 5,  type: 'slide_right',   icon: '➡️', stars: '★★★☆☆', basePoints: 220 },
    { level: 6,  type: 'slide_up',      icon: '⬆️', stars: '★★★☆☆', basePoints: 260 },
    { level: 7,  type: 'color_choice',  icon: '🎨', stars: '★★★★☆', basePoints: 320 },
    { level: 8,  type: 'rapid_mash',    icon: '⚡', stars: '★★★★☆', basePoints: 380 },
    { level: 9,  type: 'hold_charge',   icon: '⏳', stars: '★★★★★', basePoints: 450 },
    { level: 10, type: 'dial_turn',     icon: '🧭', stars: '★★★★★', basePoints: 550 }
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

  // Round-Robin Queue System
  let lockQueue = [];
  let roundNumber = 1;

  function buildRoundQueue(round) {
    return LOCK_DEFINITIONS.map(def => ({
      ...def,
      round,
      points: def.basePoints + (round - 1) * 80,
      face: getRandomFace('normal')
    }));
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

  // Render 10 Non-Verbal Gimmicks
  function renderGimmick(lock) {
    gimmickContainer.innerHTML = '';
    lockLevelBadge.textContent = `Lv.${lock.level} ${lock.icon}`;
    lockDiff.textContent = lock.stars;
    lockFace.textContent = lock.face;
    currentShackle.classList.remove('open');

    // 1. ワンタップ: 巨大な👆アイコンボタン
    if (lock.type === 'single_tap') {
      const btn = document.createElement('button');
      btn.className = 'icon-action-btn';
      btn.textContent = '👆';
      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });
      gimmickContainer.appendChild(btn);

    // 2. 電源スイッチ: 見ればわかるトグル
    } else if (lock.type === 'toggle_switch') {
      const wrap = document.createElement('div');
      wrap.className = 'switch-container';

      const sw = document.createElement('div');
      sw.className = 'toggle-switch-ui';
      const thumb = document.createElement('div');
      thumb.className = 'switch-thumb-ui';
      thumb.textContent = '⚪';
      sw.appendChild(thumb);
      wrap.appendChild(sw);

      sw.addEventListener('click', () => {
        playSound('tap');
        sw.classList.add('on');
        thumb.textContent = '🟢';
        setTimeout(() => resolveLockSuccess(), 120);
      });
      gimmickContainer.appendChild(wrap);

    // 3. 鍵差し込み: 鍵穴 🕳️ と 鍵 🔑 と上向き矢印
    } else if (lock.type === 'key_insert') {
      const zone = document.createElement('div');
      zone.className = 'keyhole-zone';

      const hole = document.createElement('div');
      hole.className = 'keyhole-target';
      hole.textContent = '🕳️';

      const guide = document.createElement('div');
      guide.className = 'key-arrow-guide';
      guide.textContent = '⬆️';

      const keyBtn = document.createElement('button');
      keyBtn.className = 'key-draggable';
      keyBtn.textContent = '🔑';

      keyBtn.addEventListener('click', () => {
        playSound('tap');
        keyBtn.style.transform = 'translateY(-36px) scale(0.85)';
        hole.textContent = '🗝️';
        setTimeout(() => resolveLockSuccess(), 120);
      });

      zone.appendChild(hole);
      zone.appendChild(guide);
      zone.appendChild(keyBtn);
      gimmickContainer.appendChild(zone);

    // 4. ダブルタップ: ✌️ と 2つのインジケータードット
    } else if (lock.type === 'double_tap') {
      let lastTapTime = 0;

      const btn = document.createElement('button');
      btn.className = 'double-tap-btn';

      const iconSpan = document.createElement('span');
      iconSpan.textContent = '✌️';

      const dotRow = document.createElement('div');
      dotRow.className = 'double-dot-row';
      const dot1 = document.createElement('div');
      dot1.className = 'tap-dot';
      const dot2 = document.createElement('div');
      dot2.className = 'tap-dot';
      dotRow.appendChild(dot1);
      dotRow.appendChild(dot2);

      btn.appendChild(iconSpan);
      btn.appendChild(dotRow);

      btn.addEventListener('click', () => {
        const now = Date.now();
        playSound('tap');
        if (now - lastTapTime < 450) {
          dot2.classList.add('active');
          setTimeout(() => resolveLockSuccess(), 80);
        } else {
          dot1.classList.add('active');
        }
        lastTapTime = now;
      });
      gimmickContainer.appendChild(btn);

    // 5. 横スライド: >>> の点滅矢印と右のゴール
    } else if (lock.type === 'slide_right') {
      const track = document.createElement('div');
      track.className = 'slider-horizontal';

      const arrows = document.createElement('div');
      arrows.className = 'slider-arrows-bg';
      arrows.textContent = '▶ ▶ ▶';

      const goal = document.createElement('div');
      goal.className = 'slider-goal-h';
      goal.textContent = '🔓';

      const knob = document.createElement('div');
      knob.className = 'slider-knob-h';
      knob.textContent = '👉';

      track.appendChild(arrows);
      track.appendChild(goal);
      track.appendChild(knob);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      function onStart() {
        isDragging = true;
        playSound('tap');
      }
      function onMove(e) {
        if (!isDragging) return;
        const curX = (e.touches ? e.touches[0].clientX : e.clientX);
        const rect = track.getBoundingClientRect();
        const maxDist = rect.width - 66;
        let diff = curX - rect.left - 27;
        diff = Math.max(6, Math.min(maxDist, diff));
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
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    // 6. 上引きレバー: ^^^ の点滅矢印と上のゴール
    } else if (lock.type === 'slide_up') {
      const track = document.createElement('div');
      track.className = 'slider-vertical';

      const arrows = document.createElement('div');
      arrows.className = 'slider-arrows-v-bg';
      arrows.textContent = '▲ ▲';

      const goal = document.createElement('div');
      goal.className = 'slider-goal-v';
      goal.textContent = '🔓';

      const knob = document.createElement('div');
      knob.className = 'slider-knob-v';
      knob.textContent = '☝️';

      track.appendChild(arrows);
      track.appendChild(goal);
      track.appendChild(knob);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      function onStart() {
        isDragging = true;
        playSound('tap');
      }
      function onMove(e) {
        if (!isDragging) return;
        const curY = (e.touches ? e.touches[0].clientY : e.clientY);
        const rect = track.getBoundingClientRect();
        const maxDist = rect.height - 60;
        let diff = rect.bottom - curY - 26;
        diff = Math.max(6, Math.min(maxDist, diff));
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
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    // 7. カラー一致: 上にターゲット色円、下に2色ボタン
    } else if (lock.type === 'color_choice') {
      const isBlueTarget = Math.random() > 0.5;

      const wrap = document.createElement('div');
      wrap.className = 'color-match-wrap';

      const targetCircle = document.createElement('div');
      targetCircle.className = 'color-target-display';
      targetCircle.style.background = isBlueTarget ? '#1e90ff' : '#ff4757';
      wrap.appendChild(targetCircle);

      const row = document.createElement('div');
      row.className = 'choice-row';

      const btnA = document.createElement('button');
      btnA.className = 'color-choice-btn';
      btnA.style.background = '#1e90ff';

      const btnB = document.createElement('button');
      btnB.className = 'color-choice-btn';
      btnB.style.background = '#ff4757';

      btnA.addEventListener('click', () => {
        if (isBlueTarget) {
          playSound('tap');
          resolveLockSuccess();
        } else {
          triggerMistake();
        }
      });

      btnB.addEventListener('click', () => {
        if (!isBlueTarget) {
          playSound('tap');
          resolveLockSuccess();
        } else {
          triggerMistake();
        }
      });

      if (Math.random() > 0.5) {
        row.appendChild(btnA);
        row.appendChild(btnB);
      } else {
        row.appendChild(btnB);
        row.appendChild(btnA);
      }
      wrap.appendChild(row);
      gimmickContainer.appendChild(wrap);

    // 8. 激連打: ⚡ アイコンとプログレスバー
    } else if (lock.type === 'rapid_mash') {
      const targetClicks = 4 + lock.round * 2;
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
      btn.textContent = '⚡';
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

    // 9. 長押しチャージ: 👇 アイコンと円形プログレス
    } else if (lock.type === 'hold_charge') {
      const requiredHoldMs = 850 + lock.round * 100;

      const wrap = document.createElement('div');
      wrap.className = 'hold-circle-wrap';

      wrap.innerHTML = `
        <svg class="hold-svg-ring" viewBox="0 0 125 125">
          <circle class="hold-ring-bg" cx="62.5" cy="62.5" r="54" />
          <circle id="hold-ring-fill" class="hold-ring-fill" cx="62.5" cy="62.5" r="54" />
        </svg>
      `;

      const btn = document.createElement('button');
      btn.className = 'hold-btn';
      btn.textContent = '👇';
      wrap.appendChild(btn);
      gimmickContainer.appendChild(wrap);

      const fill = wrap.querySelector('#hold-ring-fill');
      let holdStart = 0;
      let holdTimer = null;

      function onStart(e) {
        e.preventDefault();
        holdStart = Date.now();
        playSound('tap');
        holdTimer = setInterval(() => {
          const elapsed = Date.now() - holdStart;
          const pct = Math.min(1, elapsed / requiredHoldMs);
          fill.style.strokeDashoffset = (339 * (1 - pct)) + '';
          if (elapsed >= requiredHoldMs) {
            clearInterval(holdTimer);
            resolveLockSuccess();
          }
        }, 30);
      }

      function onCancel() {
        if (holdTimer) {
          clearInterval(holdTimer);
          holdTimer = null;
          fill.style.strokeDashoffset = '339';
          triggerMistake();
        }
      }

      btn.addEventListener('mousedown', onStart);
      btn.addEventListener('touchstart', onStart, { passive: false });
      window.addEventListener('mouseup', onCancel);
      window.addEventListener('touchend', onCancel);

    // 10. ダイヤル合わせ: 上部の▼マークと回転ノブ
    } else if (lock.type === 'dial_turn') {
      const wrap = document.createElement('div');
      wrap.className = 'dial-wrap';

      const targetMark = document.createElement('div');
      targetMark.className = 'dial-target-mark';
      targetMark.textContent = '▼';

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
    if (score >= 4500) {
      rank = 'S';
      commentIcon = '👑';
    } else if (score >= 2800) {
      rank = 'A';
      commentIcon = '🥇';
    } else if (score >= 1400) {
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
