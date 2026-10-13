// POP LOCK RUSH! - Main Game Logic
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const timeDisplay = document.getElementById('time-display');
  const timeAddedAnim = document.getElementById('time-added-anim');
  const scoreDisplay = document.getElementById('score-display');
  const unlockedCount = document.getElementById('unlocked-count');
  const soundBtn = document.getElementById('sound-btn');
  const currentCard = document.getElementById('current-lock-card');
  const nextCard = document.getElementById('next-lock-card');
  const lockName = document.getElementById('lock-name');
  const lockDiff = document.getElementById('lock-difficulty');
  const lockFace = document.getElementById('lock-face');
  const currentShackle = document.getElementById('current-shackle');
  const gimmickContainer = document.getElementById('gimmick-container');
  const hintText = document.getElementById('hint-text');

  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');
  const resultOverlay = document.getElementById('result-overlay');
  const retryBtn = document.getElementById('retry-btn');
  const finalScoreEl = document.getElementById('final-score');
  const finalLocksEl = document.getElementById('final-locks');
  const finalBonusEl = document.getElementById('final-bonus');
  const highScoreEl = document.getElementById('high-score');
  const rankBadgeEl = document.getElementById('result-rank-badge');
  const resultTitleComment = document.getElementById('result-title-comment');

  // Canvas Particles
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Particle System
  let particles = [];
  function createBurst(x, y, count = 25) {
    const colors = ['#ff4757', '#2ed573', '#ffa502', '#1e90ff', '#ffffff'];
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
      p.vy += 0.15; // gravity
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
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'unlock') {
        // Pop chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'mistake') {
        // Comic buzz
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

  // Comic Lock Expressions
  const faces = {
    normal: ['😏', '😎', '🤖', '🦊', '🎩'],
    trying: ['😬', '🤨', '😲', '😅'],
    happy: ['🥳', '🎉', '🤩', '😆'],
    error: ['💥', '😵', '😱', '🥴']
  };

  function getRandomFace(category) {
    const list = faces[category] || faces.normal;
    return list[Math.floor(Math.random() * list.length)];
  }

  // Lock Generator
  // Difficulty levels: 1 (Easy), 2 (Medium), 3 (Hard), 4 (Master)
  function generateLock(index) {
    const types = ['tap', 'mash', 'slider', 'timing', 'sequence'];
    // Higher probability of complex locks as index advances
    let availableTypes = ['tap'];
    if (index >= 2) availableTypes.push('slider');
    if (index >= 4) availableTypes.push('timing');
    if (index >= 6) availableTypes.push('mash');
    if (index >= 8) availableTypes.push('sequence');

    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    let diff = 1;
    if (index >= 4) diff = 2;
    if (index >= 9) diff = 3;
    if (index >= 15) diff = 4;

    const names = {
      tap: 'クイックタップ',
      mash: '高速連打ロック',
      slider: 'ボルトスライド',
      timing: 'タイミング合わせ',
      sequence: 'コードピン暗号'
    };

    return {
      type,
      difficulty: diff,
      name: names[type],
      face: getRandomFace('normal'),
      index
    };
  }

  // Render Lock Gimmick UI
  function renderGimmick(lock) {
    gimmickContainer.innerHTML = '';
    lockName.textContent = lock.name;
    lockDiff.textContent = '★'.repeat(lock.difficulty) + '☆'.repeat(Math.max(0, 4 - lock.difficulty));
    lockFace.textContent = lock.face;
    currentShackle.classList.remove('open');

    if (lock.type === 'tap') {
      hintText.textContent = '中央のボタンを素早く1回タップ！';
      const btn = document.createElement('button');
      btn.className = 'tap-target-btn';
      btn.textContent = 'UNLOCK!';
      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });
      gimmickContainer.appendChild(btn);

    } else if (lock.type === 'mash') {
      const targetClicks = 3 + lock.difficulty * 2; // 5 to 11 clicks
      let currentClicks = 0;
      hintText.textContent = `ボタンを激しく連打せよ！ (${targetClicks}回)`;

      const bar = document.createElement('div');
      bar.className = 'mash-progress-bar';
      const fill = document.createElement('div');
      fill.className = 'mash-progress-fill';
      bar.appendChild(fill);

      const btn = document.createElement('button');
      btn.className = 'tap-target-btn';
      btn.textContent = 'PUSH!';
      btn.addEventListener('click', () => {
        currentClicks++;
        playSound('tap');
        const pct = Math.min(100, (currentClicks / targetClicks) * 100);
        fill.style.width = pct + '%';
        lockFace.textContent = getRandomFace('trying');
        if (currentClicks >= targetClicks) {
          resolveLockSuccess();
        }
      });

      gimmickContainer.appendChild(bar);
      gimmickContainer.appendChild(btn);

    } else if (lock.type === 'slider') {
      hintText.textContent = 'スライダーを右端のゴールまで引っ張れ！';
      const track = document.createElement('div');
      track.className = 'slider-track';

      const goal = document.createElement('div');
      goal.className = 'slider-goal-zone';
      goal.textContent = 'GOAL!';

      const thumb = document.createElement('div');
      thumb.className = 'slider-thumb';
      thumb.textContent = '👉';

      track.appendChild(goal);
      track.appendChild(thumb);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      let startX = 0;

      function onStart(e) {
        isDragging = true;
        startX = (e.touches ? e.touches[0].clientX : e.clientX);
        playSound('tap');
      }

      function onMove(e) {
        if (!isDragging) return;
        const currentX = (e.touches ? e.touches[0].clientX : e.clientX);
        const rect = track.getBoundingClientRect();
        const maxDist = rect.width - 56;
        let diff = currentX - rect.left - 24;
        diff = Math.max(6, Math.min(maxDist, diff));
        thumb.style.left = diff + 'px';

        // Check if reached goal
        if (diff >= maxDist - 8) {
          isDragging = false;
          resolveLockSuccess();
        }
      }

      function onEnd() {
        if (isDragging) {
          isDragging = false;
          thumb.style.left = '6px'; // reset
          triggerMistake('すっぽ抜けた！端まで引き切ろう');
        }
      }

      thumb.addEventListener('mousedown', onStart);
      thumb.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    } else if (lock.type === 'timing') {
      hintText.textContent = '針が緑ゾーンに入った瞬間にストップ！';
      const wrap = document.createElement('div');
      wrap.className = 'timing-canvas-wrap';

      const tCanvas = document.createElement('canvas');
      tCanvas.className = 'timing-canvas';
      tCanvas.width = 140;
      tCanvas.height = 140;
      wrap.appendChild(tCanvas);

      const hitBtn = document.createElement('button');
      hitBtn.className = 'timing-hit-btn';
      hitBtn.textContent = 'STOP!';
      wrap.appendChild(hitBtn);
      gimmickContainer.appendChild(wrap);

      const tCtx = tCanvas.getContext('2d');
      let angle = 0;
      const speed = 0.05 + lock.difficulty * 0.02; // speed increases with diff
      const targetStart = Math.PI * 0.75;
      const targetWidth = Math.max(0.4, 0.9 - lock.difficulty * 0.12);
      const targetEnd = targetStart + targetWidth;
      let animId = null;

      function drawTiming() {
        tCtx.clearRect(0, 0, 140, 140);
        // Base ring
        tCtx.beginPath();
        tCtx.arc(70, 70, 56, 0, Math.PI * 2);
        tCtx.strokeStyle = '#dfe4ea';
        tCtx.lineWidth = 12;
        tCtx.stroke();

        // Target zone
        tCtx.beginPath();
        tCtx.arc(70, 70, 56, targetStart, targetEnd);
        tCtx.strokeStyle = '#2ed573';
        tCtx.lineWidth = 14;
        tCtx.stroke();

        // Moving needle
        angle = (angle + speed) % (Math.PI * 2);
        tCtx.beginPath();
        tCtx.arc(70, 70, 56, angle, angle + 0.15);
        tCtx.strokeStyle = '#ff4757';
        tCtx.lineWidth = 18;
        tCtx.stroke();

        animId = requestAnimationFrame(drawTiming);
      }
      drawTiming();

      hitBtn.addEventListener('click', () => {
        cancelAnimationFrame(animId);
        // Check if angle is within target zone
        const cur = angle % (Math.PI * 2);
        if (cur >= targetStart - 0.1 && cur <= targetEnd + 0.1) {
          playSound('tap');
          resolveLockSuccess();
        } else {
          triggerMistake('タイミングがズレた！');
          drawTiming(); // resume
        }
      });

    } else if (lock.type === 'sequence') {
      const pinCount = Math.min(5, 2 + lock.difficulty); // 3 to 5 steps
      hintText.textContent = `光る番号を順に押せ！ [1 から ${pinCount}]`;
      const grid = document.createElement('div');
      grid.className = 'sequence-grid';

      let currentExpected = 1;
      const buttons = [];

      for (let i = 1; i <= pinCount; i++) {
        const b = document.createElement('button');
        b.className = 'seq-btn';
        b.textContent = i;
        b.dataset.val = i;
        b.addEventListener('click', () => {
          const val = parseInt(b.dataset.val, 10);
          if (val === currentExpected) {
            playSound('tap');
            b.classList.add('active-flash');
            b.disabled = true;
            currentExpected++;
            if (currentExpected > pinCount) {
              resolveLockSuccess();
            }
          } else {
            triggerMistake('順番が違う！最初から押し直し');
            currentExpected = 1;
            buttons.forEach(btn => {
              btn.classList.remove('active-flash');
              btn.disabled = false;
            });
          }
        });
        buttons.push(b);
        grid.appendChild(b);
      }
      gimmickContainer.appendChild(grid);
    }
  }

  // Mistake Handler (Reset with time loss)
  function triggerMistake(msg) {
    playSound('mistake');
    lockFace.textContent = getRandomFace('error');
    lockFace.classList.add('shake');
    hintText.textContent = msg;
    hintText.style.color = '#ff4757';
    setTimeout(() => {
      lockFace.classList.remove('shake');
      hintText.style.color = '#a4b0be';
    }, 400);
  }

  // Success Handler (Burst particles, +0.5s bonus, swap card stack)
  function resolveLockSuccess() {
    playSound('unlock');
    currentShackle.classList.add('open');
    lockFace.textContent = getRandomFace('happy');

    // Add +0.5s bonus
    remainingTime += 0.5;
    timeAddedAnim.classList.remove('animate');
    void timeAddedAnim.offsetWidth; // retrigger
    timeAddedAnim.classList.add('animate');

    // Calculate score based on difficulty
    const diffPoints = currentLock.difficulty * 150;
    score += diffPoints;
    unlockedCountNum++;
    scoreDisplay.textContent = score;
    unlockedCount.textContent = unlockedCountNum;

    // Particle Burst at center of active card
    const cardRect = currentCard.getBoundingClientRect();
    createBurst(cardRect.left + cardRect.width / 2, cardRect.top + cardRect.height / 2, 35);

    // Swap Cards Animation:
    // Fade out current card with scale up, then replace with nextLock
    currentCard.style.transform = 'translateY(-20px) scale(1.08)';
    currentCard.style.opacity = '0';

    setTimeout(() => {
      currentLock = nextLock;
      nextLock = generateLock(unlockedCountNum + 1);

      // Render updated current lock
      renderGimmick(currentLock);
      currentCard.style.transform = 'translateY(0) scale(1)';
      currentCard.style.opacity = '1';

      // Update next preview card
      nextCard.querySelector('.card-badge').textContent = `NEXT: ${nextLock.name}`;
      nextCard.querySelector('.lock-face').textContent = nextLock.face;
    }, 240);
  }

  // Game Loop Timer (tick every 100ms)
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

      // Danger pulse when under 5 seconds
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

  // Start Game
  function startGame() {
    initAudio();
    isPlaying = true;
    remainingTime = 18.0;
    score = 0;
    unlockedCountNum = 0;
    warningBeepTimer = 0;

    scoreDisplay.textContent = '0';
    unlockedCount.textContent = '0';
    timeDisplay.textContent = '18.0';
    timeDisplay.parentElement.classList.remove('timer-danger');

    startOverlay.classList.remove('active');
    resultOverlay.classList.remove('active');

    // Setup initial lock and next preview
    currentLock = generateLock(0);
    nextLock = generateLock(1);
    renderGimmick(currentLock);

    nextCard.querySelector('.card-badge').textContent = `NEXT: ${nextLock.name}`;
    nextCard.querySelector('.lock-face').textContent = nextLock.face;

    startTimer();
  }

  // End Game (Result calculation & Rank)
  function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);

    // Save High Score
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pop_lock_high', highScore);
    }

    // Determine Rank & Comic Titles
    let rank = 'C';
    let titleComment = '「まだまだ見習いピッカー」';
    if (score >= 3500) {
      rank = 'S';
      titleComment = '「伝説の神速怪盗ルパン！🗝️」';
    } else if (score >= 2200) {
      rank = 'A';
      titleComment = '「超一流の解錠プロフェッショナル！✨」';
    } else if (score >= 1200) {
      rank = 'B';
      titleComment = '「手際のいいベテラン泥棒！🏃」';
    }

    rankBadgeEl.textContent = `RANK ${rank}`;
    if (rank === 'S') rankBadgeEl.style.background = '#ffd32a';
    else if (rank === 'A') rankBadgeEl.style.background = '#2ed573';
    else if (rank === 'B') rankBadgeEl.style.background = '#1e90ff';
    else rankBadgeEl.style.background = '#a4b0be';

    resultTitleComment.textContent = titleComment;
    finalScoreEl.textContent = score;
    finalLocksEl.textContent = `${unlockedCountNum} 個`;
    finalBonusEl.textContent = `+${Math.floor(score * 0.2)} pts`;
    highScoreEl.textContent = highScore;

    resultOverlay.classList.add('active');
  }

  // Event Listeners
  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
});
